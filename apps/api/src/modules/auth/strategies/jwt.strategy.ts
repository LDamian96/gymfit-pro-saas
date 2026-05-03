import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { Request } from 'express';

export interface JwtPayload {
  sub: string;
  email: string;
  role: string;
  tenantId: string;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private configService: ConfigService) {
    super({
      // Extraer token de la cookie HTTPOnly
      jwtFromRequest: ExtractJwt.fromExtractors([
        (request: Request) => {
          return request?.cookies?.access_token || null;
        },
      ]),
      ignoreExpiration: false,
      secretOrKey: (() => {
        const secret = configService.get<string>('JWT_SECRET');
        if (!secret) throw new Error('JWT_SECRET no está configurado en las variables de entorno');
        return secret;
      })(),
    });
  }

  validate(payload: JwtPayload) {
    if (!payload.sub || !payload.tenantId) {
      throw new UnauthorizedException('Token inválido');
    }

    return {
      userId: payload.sub,
      email: payload.email,
      role: payload.role,
      tenantId: payload.tenantId,
    };
  }
}
