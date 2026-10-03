import { Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";

interface Entry {
  value: unknown;
  expiresAt: number;
  bytes: number;
}

/**
 * In-process cache for read-only API responses, kept consistent by a single
 * global version: ANY write request (POST/PUT/PATCH/DELETE) bumps the version,
 * which instantly invalidates every cached read. So a list can never show data
 * older than the latest write this server has seen — the TTL only bounds
 * staleness from changes that bypass the API (scripts, manual SQL).
 *
 * Why in-memory and not Redis: a Redis round trip from the server costs about
 * as much as the query it would save unless the regions match, and this must
 * add zero latency to a hit. It assumes ONE backend instance (the current
 * setup); with several, each would keep its own cache and a write on one
 * would not invalidate the others — set READ_CACHE_ENABLED=false then.
 */
@Injectable()
export class ReadCacheService {
  private readonly logger = new Logger(ReadCacheService.name);
  private readonly entries = new Map<string, Entry>();
  private version = 0;
  private totalBytes = 0;
  readonly enabled: boolean;
  private readonly maxBytes: number;
  private readonly maxEntryBytes: number;

  constructor(config: ConfigService) {
    this.enabled = (config.get<string>("READ_CACHE_ENABLED") ?? "true") !== "false";
    this.maxBytes = Number(config.get<string>("READ_CACHE_MAX_MB") ?? 100) * 1024 * 1024;
    this.maxEntryBytes = Math.min(this.maxBytes, 25 * 1024 * 1024);
  }

  currentVersion(): number {
    return this.version;
  }

  /** Called by every write request, at its start and again once it finishes. */
  bump(): void {
    this.version++;
    this.entries.clear();
    this.totalBytes = 0;
  }

  get(key: string): { value: unknown } | null {
    const e = this.entries.get(key);
    if (!e) return null;
    if (e.expiresAt <= Date.now()) {
      this.remove(key, e);
      return null;
    }
    return { value: e.value };
  }

  /**
   * Stores a response only if no write happened since the read began
   * (`versionAtStart`) — otherwise the read may predate that write.
   */
  set(key: string, value: unknown, ttlSeconds: number, versionAtStart: number): void {
    if (!this.enabled || versionAtStart !== this.version) return;
    let bytes: number;
    try {
      bytes = JSON.stringify(value)?.length ?? 0;
    } catch {
      return;
    }
    if (bytes === 0 || bytes > this.maxEntryBytes) return;
    const existing = this.entries.get(key);
    if (existing) this.remove(key, existing);
    // Evict oldest entries first until the new one fits.
    for (const [k, e] of this.entries) {
      if (this.totalBytes + bytes <= this.maxBytes) break;
      this.remove(k, e);
    }
    this.entries.set(key, { value, expiresAt: Date.now() + ttlSeconds * 1000, bytes });
    this.totalBytes += bytes;
  }

  private remove(key: string, e: Entry): void {
    this.entries.delete(key);
    this.totalBytes -= e.bytes;
  }
}
