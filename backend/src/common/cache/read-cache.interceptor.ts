import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from "@nestjs/common";
import type { Request, Response } from "express";
import { Observable, of } from "rxjs";
import { tap } from "rxjs/operators";
import { ReadCacheService } from "./read-cache.service";

/**
 * First path segment → TTL (seconds). Only these read-only GET routes are
 * cached. Reference data changes rarely, so it can live longer; stock and
 * sale data is short-lived as an extra bound on top of write invalidation.
 */
const TTL_BY_PREFIX: Record<string, number> = {
  scan: 30,
  inventory: 30,
  sales: 30,
  customers: 60,
  weavers: 300,
  "design-library": 300,
  rates: 300,
  firms: 300,
  suppliers: 300,
  vendors: 300,
  "factory-looms": 300,
};

const WRITE_METHODS = new Set(["POST", "PUT", "PATCH", "DELETE"]);

/**
 * Runs AFTER the auth/role/geofence guards, so a cache hit has already passed
 * every permission check — it only skips the database work. The key includes
 * the user id, so responses that depend on who is asking are never shared.
 */
@Injectable()
export class ReadCacheInterceptor implements NestInterceptor {
  constructor(private readonly cache: ReadCacheService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    if (context.getType() !== "http" || !this.cache.enabled) return next.handle();
    const http = context.switchToHttp();
    const req = http.getRequest<Request & { user?: { id?: string; role?: string; accessLevel?: string; weaverId?: string | null } }>();
    const res = http.getResponse<Response>();

    if (WRITE_METHODS.has(req.method)) {
      // Bump before (so concurrent reads can't store pre-write data) and after
      // (so reads that started mid-write are discarded too).
      this.cache.bump();
      res.once("finish", () => this.cache.bump());
      return next.handle();
    }

    const ttl = req.method === "GET" ? TTL_BY_PREFIX[req.path.split("/")[1] ?? ""] : undefined;
    const userId = req.user?.id;
    if (!ttl || !userId) return next.handle();

    const u = req.user!;
    // Everything the response could depend on about the caller goes in the key.
    const key = `${userId}|${u.role}|${u.accessLevel}|${u.weaverId ?? ""}|${req.originalUrl}`;
    const hit = this.cache.get(key);
    if (hit) return of(hit.value);

    const versionAtStart = this.cache.currentVersion();
    return next.handle().pipe(tap((value) => this.cache.set(key, value, ttl, versionAtStart)));
  }
}
