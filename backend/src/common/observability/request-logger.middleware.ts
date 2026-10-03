import { randomUUID } from "crypto";
import { Logger } from "@nestjs/common";
import type { NextFunction, Request, Response } from "express";

const logger = new Logger("HTTP");

/**
 * Tags every request with an id (honours an inbound X-Request-Id), echoes it
 * back in the response header, and logs one structured line per request.
 * Only method, path (no query string — it can hold phone numbers), status
 * and duration are logged; never headers or bodies.
 */
export function requestLogger(req: Request, res: Response, next: NextFunction): void {
  const inbound = req.header("x-request-id");
  const id = inbound && /^[\w-]{8,64}$/.test(inbound) ? inbound : randomUUID();
  (req as Request & { requestId?: string }).requestId = id;
  res.setHeader("X-Request-Id", id);
  const start = process.hrtime.bigint();
  res.on("finish", () => {
    const ms = Number(process.hrtime.bigint() - start) / 1e6;
    logger.log(
      JSON.stringify({
        requestId: id,
        method: req.method,
        path: req.originalUrl.split("?")[0],
        status: res.statusCode,
        ms: Math.round(ms),
      }),
    );
  });
  next();
}
