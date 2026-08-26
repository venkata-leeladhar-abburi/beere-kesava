// Must run before any other import: AuthModule's JwtModule.register() reads
// process.env.JWT_SECRET synchronously at import time, which happens before
// ConfigModule.forRoot() (called later, from within AppModule's own body)
// gets a chance to load .env. Without this, tokens get signed with the
// hardcoded fallback secret while JwtStrategy verifies against the real one
// from .env — a permanent sign/verify mismatch that 401s every request.
import "dotenv/config";
import "reflect-metadata";
import * as express from "express";
import { ValidationPipe } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { NestFactory } from "@nestjs/core";
import { AppModule } from "./app.module";
import { AllExceptionsFilter } from "./common/filters/all-exceptions.filter";
import { validationExceptionFactory } from "./common/errors/validation-exception.factory";
import { ResponseInterceptor } from "./common/interceptors/response.interceptor";
import { StorageService } from "./common/storage/storage.service";
import { UPLOADS_ROOT } from "./common/storage/upload.config";

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);

  // CORS_ORIGIN: comma-separated allow-list for production (e.g. the deployed
  // frontend's URL). Left unset, every origin is allowed — fine for local
  // dev, never for a real deploy that has a real CORS_ORIGIN configured.
  const corsOrigin = configService.get<string>("CORS_ORIGIN");
  app.enableCors({ origin: corsOrigin ? corsOrigin.split(",").map((o) => o.trim()) : true });
  app.use(express.json({ limit: "50mb" }));
  app.use(express.urlencoded({ limit: "50mb", extended: true }));
  // Local-disk driver only: with R2 the same paths are answered by
  // UploadsController's GET handler, which redirects to the bucket.
  if (!app.get(StorageService).isRemote) {
    app.use("/uploads", express.static(UPLOADS_ROOT));
  }
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
