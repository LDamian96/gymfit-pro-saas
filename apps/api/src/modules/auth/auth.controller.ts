import {
  Controller,
  Post,
  Get,
  Body,
  Res,
  Req,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import type { Response, Request, CookieOptions } from 'express';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

// Secure cookies solo si HTTPS está habilitado (FRONTEND_URL empieza con https)
const useSecureCookies = (process.env.FRONTEND_URL || '').startsWith('https');

// Domain compartido entre frontend y API. Crítico cuando el SSR del web
// necesita leer la cookie set por el API en otro subdominio
// (ej: gym.ldmapp.com debe ver la cookie de gym-api.ldmapp.com → COOKIE_DOMAIN=.ldmapp.com).
// En dev/localhost se omite para que el browser scope automático funcione.
const cookieDomain = process.env.COOKIE_DOMAIN || undefined;

// Cross-site: frontend y API están en subdominios distintos (gym.ldmapp.com ↔ gym-api.ldmapp.com)
// Necesita SameSite=none + Secure=true para que las cookies se envíen en peticiones cross-origin
const accessCookieOptions: CookieOptions = {
  httpOnly: true,
  secure: useSecureCookies,
  sameSite: useSecureCookies ? 'none' : 'lax',
  ...(cookieDomain ? { domain: cookieDomain } : {}),
  path: '/',
  maxAge: 15 * 60 * 1000,
};

const refreshCookieOptions: CookieOptions = {
  httpOnly: true,
  secure: useSecureCookies,
  sameSite: useSecureCookies ? 'none' : 'lax',
  ...(cookieDomain ? { domain: cookieDomain } : {}),
  path: '/',
  maxAge: 7 * 24 * 60 * 60 * 1000,
};

@Controller('api/v1/auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  async register(@Body() dto: RegisterDto) {
    return this.authService.register(dto);
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(
    @Body() dto: LoginDto,
    @Res({ passthrough: true }) response: Response,
  ) {
    const result = await this.authService.login(dto);

    response.cookie('access_token', result.accessToken, accessCookieOptions);
    response.cookie('refresh_token', result.refreshToken, refreshCookieOptions);

    return { user: result.user };
  }

  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  async refresh(
    @Req() request: Request,
    @Res({ passthrough: true }) response: Response,
  ) {
    const refreshToken = request.cookies?.refresh_token;
    if (!refreshToken) {
      response.status(401).json({ success: false, message: 'No hay refresh token' });
      return;
    }

    const tokens = await this.authService.refreshTokens(refreshToken);

    response.cookie('access_token', tokens.accessToken, accessCookieOptions);
    response.cookie('refresh_token', tokens.refreshToken, refreshCookieOptions);

    return { message: 'Tokens renovados' };
  }

  @Post('logout')
  @HttpCode(HttpStatus.OK)
  async logout(@Res({ passthrough: true }) response: Response) {
    const clearOpts = { path: '/', ...(cookieDomain ? { domain: cookieDomain } : {}) };
    response.clearCookie('access_token', clearOpts);
    response.clearCookie('refresh_token', clearOpts);
    return { message: 'Sesión cerrada' };
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  async getProfile(@CurrentUser('userId') userId: string) {
    return this.authService.getProfile(userId);
  }
}
