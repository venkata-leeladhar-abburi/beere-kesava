import "reflect-metadata";
import * as express from "express";
import { ValidationPipe } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { NestFactory } from "@nestjs/core";
import { AppModule } from "./app.module";
import { AllExceptionsFilter } from "./common/filters/all-exceptions.filter";
import { ResponseInterceptor } from "./common/interceptors/response.interceptor";
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
  app.use("/uploads", express.static(UPLOADS_ROOT));
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );
  app.useGlobalFilters(new AllExceptionsFilter());
  app.useGlobalInterceptors(new ResponseInterceptor());

  const port = configService.get<number>("PORT") ?? 3000;
  await app.listen(port);
}

void bootstrap();
