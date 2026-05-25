import {
  Injectable,
  UnauthorizedException,
  ConflictException,
  InternalServerErrorException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../../prisma/prisma.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { JwtPayload } from './strategies/jwt.strategy';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private configService: ConfigService,
  ) {}

  // Obtener secret con validación
  private getJwtSecret(): string {
    const secret = this.configService.get<string>('JWT_SECRET');
    if (!secret) {
      throw new InternalServerErrorException('JWT_SECRET no configurado');
    }
    return secret;
  }

  private getRefreshSecret(): string {
    const secret = this.configService.get<string>('JWT_REFRESH_SECRET');
    if (!secret) {
      throw new InternalServerErrorException('JWT_REFRESH_SECRET no configurado');
    }
    return secret;
  }

  async register(dto: RegisterDto) {
    // Generar slug desde el nombre del gym
    const slug = dto.gymName
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');

    // Verificar si el slug ya existe
    const existingTenant = await this.prisma.tenant.findUnique({
      where: { slug },
    });
    if (existingTenant) {
      throw new ConflictException('Ya existe un gimnasio con ese nombre');
    }

    // Hash de la contraseña
    const passwordHash = await bcrypt.hash(dto.password, 12);

    // Crear tenant + usuario admin en una transacción
    const result = await this.prisma.$transaction(async (tx) => {
      const tenant = await tx.tenant.create({
        data: {
          name: dto.gymName,
          slug,
        },
      });

      const user = await tx.user.create({
        data: {
          email: dto.email,
          passwordHash,
          firstName: dto.firstName,
          lastName: dto.lastName,
          role: 'ADMIN',
          tenantId: tenant.id,
        },
      });

      return { tenant, user };
    });

    return {
      user: {
        id: result.user.id,
        email: result.user.email,
        firstName: result.user.firstName,
        lastName: result.user.lastName,
        role: result.user.role,
      },
      tenant: {
        id: result.tenant.id,
        name: result.tenant.name,
        slug: result.tenant.slug,
      },
    };
  }

  async login(dto: LoginDto) {
    // Buscar usuario por email
    const user = await this.prisma.user.findFirst({
      where: {
        email: dto.email,
        deletedAt: null,
        isActive: true,
      },
      include: { tenant: true, branch: true },
    });

    if (!user) {
      throw new UnauthorizedException('Credenciales incorrectas');
    }

    const isPasswordValid = await bcrypt.compare(dto.password, user.passwordHash);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Credenciales incorrectas');
    }

    // Actualizar último login
    await this.prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });

    // Generar tokens
    const payload: JwtPayload = {
      sub: user.id,
      email: user.email,
      role: user.role,
      tenantId: user.tenantId,
    };

    const accessToken = this.jwtService.sign(payload, {
      secret: this.getJwtSecret(),
      expiresIn: this.configService.get('JWT_EXPIRATION') || '15m',
    });

    const refreshToken = this.jwtService.sign(payload, {
      secret: this.getRefreshSecret(),
      expiresIn: this.configService.get('JWT_REFRESH_EXPIRATION') || '7d',
    });

    // Si es CLIENT, buscar su memberId + la sede del member (su sede "home").
    let memberId: string | null = null;
    let clientBranch: { id: string; name: string } | null = null;
    if (user.role === 'CLIENT') {
      const member = await this.prisma.member.findFirst({
        where: { userId: user.id },
        select: { id: true, branch: { select: { id: true, name: true } } },
      });
      memberId = member?.id || null;
      clientBranch = member?.branch ?? null;
    }

    return {
      accessToken,
      refreshToken,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        avatar: user.avatar,
        memberId,
        tenant: {
          id: user.tenant.id,
          name: user.tenant.name,
          slug: user.tenant.slug,
        },
        // CLIENT: sede del member; staff/admin: sede del user.
        branch: user.branch
          ? { id: user.branch.id, name: user.branch.name }
          : clientBranch,
      },
    };
  }

  async refreshTokens(refreshToken: string) {
    try {
      const payload = this.jwtService.verify<JwtPayload>(refreshToken, {
        secret: this.getRefreshSecret(),
      });

      const user = await this.prisma.user.findUnique({
        where: { id: payload.sub },
      });

      if (!user || !user.isActive || user.deletedAt) {
        throw new UnauthorizedException('Token inválido');
      }

      const newPayload: JwtPayload = {
        sub: user.id,
        email: user.email,
        role: user.role,
        tenantId: user.tenantId,
      };

      const newAccessToken = this.jwtService.sign(newPayload, {
        secret: this.getJwtSecret(),
        expiresIn: this.configService.get('JWT_EXPIRATION') || '15m',
      });

      const newRefreshToken = this.jwtService.sign(newPayload, {
        secret: this.getRefreshSecret(),
        expiresIn: this.configService.get('JWT_REFRESH_EXPIRATION') || '7d',
      });

      return { accessToken: newAccessToken, refreshToken: newRefreshToken };
    } catch {
      throw new UnauthorizedException('Token expirado o inválido');
    }
  }

  async getProfile(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { tenant: true, branch: true },
    });

    if (!user) {
      throw new UnauthorizedException('Usuario no encontrado');
    }

    let memberId: string | null = null;
    let clientBranch: { id: string; name: string } | null = null;
    if (user.role === 'CLIENT') {
      const member = await this.prisma.member.findFirst({
        where: { userId: user.id },
        select: { id: true, branch: { select: { id: true, name: true } } },
      });
      memberId = member?.id || null;
      clientBranch = member?.branch ?? null;
    }

    return {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      phone: user.phone,
      avatar: user.avatar,
      role: user.role,
      memberId,
      tenant: {
        id: user.tenant.id,
        name: user.tenant.name,
        slug: user.tenant.slug,
        logo: user.tenant.logo,
      },
      branch: user.branch
        ? { id: user.branch.id, name: user.branch.name }
        : clientBranch,
    };
  }
}
