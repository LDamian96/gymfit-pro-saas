import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { ValidationPipe } from '@nestjs/common';
import cookieParser from 'cookie-parser';
import helmet from 'helmet';
import compression from 'compression';
import { AppModule } from './app.module';
import { ResponseInterceptor } from './common/interceptors/response.interceptor';
import { GlobalExceptionFilter } from './common/filters/http-exception.filter';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    // Logger menos verboso en producción → menos overhead
    logger: process.env.NODE_ENV === 'production' ? ['error', 'warn'] : ['log', 'error', 'warn'],
  });

  // Compresión gzip — reduce JSON de listados ~70-80% (clave para listas grandes)
  // Threshold 1KB → no comprime payloads chicos
  app.use(compression({ threshold: 1024 }));

  // Seguridad
  app.use(
    helmet({
      // Si estás detrás de Cloudflare con HTTPS, deja CSP off para no romper assets
      contentSecurityPolicy: false,
      crossOriginEmbedderPolicy: false,
    }),
  );
  app.use(cookieParser());

  // Confía en proxy (Cloudflare/Nginx) para IP real y https
  app.set('trust proxy', 1);
  app.disable('x-powered-by');

  // CORS con cookies
  app.enableCors({
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true,
  });

  // Validación global
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  );

  app.useGlobalInterceptors(new ResponseInterceptor());
  app.useGlobalFilters(new GlobalExceptionFilter());

  const port = process.env.API_PORT || 3001;
  await app.listen(port);
  console.log(`API corriendo en http://localhost:${port}`);
}
bootstrap();
