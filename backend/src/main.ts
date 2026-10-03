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
import compression from "compression";
import { ValidationPipe } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { NestFactory } from "@nestjs/core";
import { AppModule } from "./app.module";
import { AllExceptionsFilter } from "./common/filters/all-exceptions.filter";
import { validationExceptionFactory } from "./common/errors/validation-exception.factory";
import { initSentry } from "./common/observability/sentry";
import { requestLogger } from "./common/observability/request-logger.middleware";
import { ResponseInterceptor } from "./common/interceptors/response.interceptor";

async function bootstrap() {
  initSentry();
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);

  // Standard security headers (HSTS, X-Content-Type-Options, X-Frame-Options,
  // etc.) — cheap, no behavior change for legitimate clients. Cross-Origin-
  // Resource-Policy is relaxed to "cross-origin": helmet's same-origin
  // default blocked the frontend (a different origin/port in dev, a
  // different domain in prod) from loading anything under /uploads
  // (saree/defect photos, signatures — see UploadsModule/StorageService),
  // including the 302 redirect to R2 those endpoints return.
  app.use(requestLogger);
  // gzip/br JSON responses: a 50k-row stock list is ~10x smaller on the wire,
  // which is most of the wait on a mobile or shop-Wi-Fi connection.
  app.use(compression({ threshold: 1024 }));
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
  // Photos/imports travel as multipart (multer), not JSON, so JSON bodies are
  // small. Raise JSON_BODY_LIMIT (e.g. "20mb") if a screen ever needs more.
  const bodyLimit = configService.get<string>("JSON_BODY_LIMIT") ?? "5mb";
  app.use(express.json({ limit: bodyLimit }));
  app.use(express.urlencoded({ limit: bodyLimit, extended: true }));
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
