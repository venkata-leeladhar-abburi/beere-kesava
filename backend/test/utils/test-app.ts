/**
 * Boots the real AppModule with the same global pipes/filters/interceptors
 * main.ts applies (kept in sync manually — there is no single shared
 * bootstrap function today), against the disposable database in
 * backend/.env.test.
 *
 * The dotenv.config() call below must run before AppModule is imported:
 * AuthModule's JwtModule.register() reads process.env.JWT_SECRET
 * synchronously at import time (see the comment atop src/main.ts making the
 * same point), so anything that imports AppModule after this file has
 * already loaded gets the test env's secret consistently between signing
 * and verifying tokens.
 */
import * as dotenv from "dotenv";
import * as path from "path";

dotenv.config({ path: path.join(__dirname, "..", "..", ".env.test"), override: true });

if (process.env.DATABASE_URL?.includes("supabase.com")) {
  throw new Error(
    "Refusing to boot the integration test app against a Supabase URL — " +
      "backend/.env.test must point at the disposable local Postgres, not the shared one.",
  );
}

import { ValidationPipe, type INestApplication } from "@nestjs/common";
import { NestFactory } from "@nestjs/core";
import * as express from "express";
import type { Server } from "http";
import request from "supertest";
import type TestAgent from "supertest/lib/agent";
import { AppModule } from "../../src/app.module";
import { AllExceptionsFilter } from "../../src/common/filters/all-exceptions.filter";
import { ResponseInterceptor } from "../../src/common/interceptors/response.interceptor";
import { PrismaService } from "../../src/prisma/prisma.service";

export interface TestApp {
  app: INestApplication;
  prisma: PrismaService;
  /** Bare supertest agent — prefer the request helpers below for authenticated calls. */
  http: TestAgent;
  close: () => Promise<void>;
}

export async function createTestApp(): Promise<TestApp> {
  const app = await NestFactory.create(AppModule, { logger: false });

  app.use(express.json({ limit: "50mb" }));
  app.use(express.urlencoded({ limit: "50mb", extended: true }));
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }));
  app.useGlobalFilters(new AllExceptionsFilter());
  app.useGlobalInterceptors(new ResponseInterceptor());

  await app.init();

  const prisma = app.get(PrismaService);
  // getHttpServer() is typed `any`; supertest wants the concrete Server.
  const http = request(app.getHttpServer() as Server);

  return {
    app,
    prisma,
    http,
    close: async () => {
      await app.close();
    },
  };
}

/**
 * The response envelope every route wraps its payload in — see
 * ResponseInterceptor. Integration specs unwrap it here once rather than
 * repeating `.body.data` everywhere.
 */
export interface Envelope<T> {
  success: boolean;
  statusCode: number;
  data: T;
}

let counter = 0;
/**
 * A short, monotonically increasing, per-process-unique suffix. Integration
 * specs use this to build phone numbers / codes / names that cannot collide
 * with another test in the same run, so specs don't need a full DB reset
 * between them (only once, in globalSetup) and can safely run against a
 * database that already has other tests' rows in it.
 */
export function unique(): string {
  counter += 1;
  return `${Date.now().toString().slice(-6)}${String(counter).padStart(3, "0")}`;
}

/** A syntactically valid 10-digit Indian mobile number, unique per call. */
export function uniquePhone(): string {
  // Leading "7" keeps it clearly in mobile range; the rest is the unique tail.
  return `7${unique()}`.padEnd(10, "0").slice(0, 10);
}

/**
 * Logs a real user in through the real OTP endpoints — the same two calls
 * frontend/e2e/fixtures/auth.ts makes for Playwright, but over supertest
 * instead of a browser. Requires E2E_TEST_MODE=true (set in .env.test) so
 * GET /auth/testing/otp exists to read the code back from.
 */
const tokenCache = new Map<string, string>();

/**
 * Clears the OTP throttle state for a phone number.
 *
 * AuthService enforces a real 60s resend cooldown and a 5-per-hour cap,
 * counted from rows in the OtpCode table. Both are correct production
 * behaviour and are tested directly in auth.integration.spec.ts — but for
 * every *other* spec, which just needs a session to exercise some unrelated
 * endpoint, that rate limiting is incidental state, and the seeded
 * SUPERADMIN/ADMIN accounts are shared across all spec files. Clearing the
 * rows is the test-setup equivalent of waiting out the clock.
 */
export async function clearOtpThrottle(prisma: PrismaService, phone: string): Promise<void> {
  await prisma.otpCode.deleteMany({ where: { phoneNumber: phone } });
}

export async function loginAs(http: TestApp["http"], phone: string, prisma?: PrismaService): Promise<string> {
  // Tokens are fetched once per phone per process and reused: re-logging-in
  // would race the app's own rate limiting rather than test anything. Pass
  // `prisma` to also clear any pre-existing throttle rows first.
  const cached = tokenCache.get(phone);
  if (cached) return cached;
  if (prisma) await clearOtpThrottle(prisma, phone);
  const token = await performLogin(http, phone);
  tokenCache.set(phone, token);
  return token;
}

async function performLogin(http: TestApp["http"], phone: string): Promise<string> {
  const otpRes = await http.post("/auth/request-otp").send({ phone });
  if (otpRes.status !== 201) {
    throw new Error(`POST /auth/request-otp for ${phone} returned ${otpRes.status}: ${JSON.stringify(otpRes.body)}`);
  }

  const codeRes = await http.get("/auth/testing/otp").query({ phone });
  if (codeRes.status !== 200) {
    throw new Error(
      `GET /auth/testing/otp returned ${codeRes.status} — is E2E_TEST_MODE=true in .env.test?`,
    );
  }
  const code = (codeRes.body as Envelope<{ code: string }>).data.code;

  const verifyRes = await http.post("/auth/verify-otp").send({ phone, code });
  if (verifyRes.status !== 201) {
    throw new Error(`POST /auth/verify-otp for ${phone} returned ${verifyRes.status}: ${JSON.stringify(verifyRes.body)}`);
  }
  return (verifyRes.body as Envelope<{ token: string }>).data.token;
}

export const SEEDED = {
  superadmin: { phone: "9999999999", role: "SUPERADMIN" },
  admin: { phone: "8888888888", role: "ADMIN" },
} as const;
