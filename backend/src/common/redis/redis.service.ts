import { Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";

/**
 * Thin Upstash Redis (REST) client used as a best-effort cache.
 *
 * Fails open by design: with no UPSTASH_* variables, or on any error or
 * timeout, every call behaves as a cache miss / no-op so callers fall back to
 * the database. It must never be the source of truth, and it never makes a
 * request wait more than TIMEOUT_MS.
 */
const TIMEOUT_MS = 400;

@Injectable()
export class RedisService {
  private readonly logger = new Logger(RedisService.name);
  private readonly url: string | null;
  private readonly token: string | null;
  private downUntil = 0;

  constructor(config: ConfigService) {
    this.url = config.get<string>("UPSTASH_REDIS_REST_URL")?.replace(/\/+$/, "") || null;
    this.token = config.get<string>("UPSTASH_REDIS_REST_TOKEN") || null;
  }

  get enabled(): boolean {
    return !!this.url && !!this.token;
  }

  private async command<T>(args: (string | number)[]): Promise<T | null> {
    // After a failure, skip Redis for 30s instead of paying the timeout per request.
    if (!this.enabled || Date.now() < this.downUntil) return null;
    try {
      const res = await fetch(this.url!, {
        method: "POST",
        headers: { Authorization: `Bearer ${this.token}`, "Content-Type": "application/json" },
        body: JSON.stringify(args),
        signal: AbortSignal.timeout(TIMEOUT_MS),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const body = (await res.json()) as { result?: T; error?: string };
      if (body.error) throw new Error(body.error);
      return body.result ?? null;
    } catch (err) {
      this.downUntil = Date.now() + 30_000;
      this.logger.warn(`Redis unavailable, falling back to the database: ${(err as Error).message}`);
      return null;
    }
  }

  get(key: string): Promise<string | null> {
    return this.command<string>(["GET", key]);
  }

  async set(key: string, value: string, ttlSeconds: number): Promise<void> {
    await this.command(["SET", key, value, "EX", ttlSeconds]);
  }

  async del(keys: string[]): Promise<void> {
    if (keys.length > 0) await this.command(["DEL", ...keys]);
  }
}
