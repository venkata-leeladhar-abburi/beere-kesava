// Must run before any other import: AuthModule's JwtModule.register() reads
// process.env.JWT_SECRET synchronously at import time, which happens before
// ConfigModule.forRoot() (called later, from within AppModule's own body)
// gets a chance to load .env. Without this, tokens get signed with the
// hardcoded fallback secret while JwtStrategy verifies against the real one
// from .env — a permanent sign/verify mismatch that 401s every request.
import "dotenv/config";
import "reflect-metadata";
import * as express from "express";
import helmet from "helmet";
import { ValidationPipe } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { NestFactory } from "@nestjs/core";
import { AppModule } from "./app.module";
import { AllExceptionsFilter } from "./common/filters/all-exceptions.filter";
import { validationExceptionFactory } from "./common/errors/validation-exception.factory";
import { ResponseInterceptor } from "./common/interceptors/response.interceptor";

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);

  // Standard security headers (HSTS, X-Content-Type-Options, X-Frame-Options,
  // etc.) — cheap, no behavior change for legitimate clients. Cross-Origin-
  // Resource-Policy is relaxed to "cross-origin": helmet's same-origin
  // default blocked the frontend (a different origin/port in dev, a
  // different domain in prod) from loading anything under /uploads
  // (saree/defect photos, signatures — see UploadsModule/StorageService),
  // including the 302 redirect to R2 those endpoints return.
  app.use(helmet({ crossOriginResourcePolicy: { policy: "cross-origin" } }));

  // CORS_ORIGIN: comma-separated allow-list for production (e.g. the deployed
  // frontend's URL). Left unset in a real deploy, this used to fall open to
  // every origin — the same permissive default that's convenient for local
  // dev is a real hole in production. Fail closed instead: in production,
  // an unset CORS_ORIGIN blocks all cross-origin requests rather than
  // allowing them, so a missing env var is a loud outage, not a silent hole.
  const nodeEnv = configService.get<string>("NODE_ENV");
  const isProduction = nodeEnv === "production";
  const corsOrigin = configService.get<string>("CORS_ORIGIN");
  app.enableCors({
    origin: corsOrigin ? corsOrigin.split(",").map((o) => o.trim()) : !isProduction,
  });
  app.use(express.json({ limit: "50mb" }));
  app.use(express.urlencoded({ limit: "50mb", extended: true }));
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      // Preserves each failure's `property` so the client can put the message
      // under the offending input instead of joining everything into a toast.
      exceptionFactory: validationExceptionFactory,
    }),
  );
  app.useGlobalFilters(new AllExceptionsFilter());
  app.useGlobalInterceptors(new ResponseInterceptor());

  const port = configService.get<number>("PORT") ?? 3000;
  await app.listen(port);
}

void bootstrap();
