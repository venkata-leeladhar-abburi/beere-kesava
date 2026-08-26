import { HttpException, HttpStatus } from "@nestjs/common";
import type { ErrorCode } from "./error-codes";

/**
 * An HttpException that carries an ErrorCode, and optionally per-field
 * validation messages.
 *
 * Services may keep throwing Nest's bare NotFoundException/BadRequestException —
 * AllExceptionsFilter assigns those a default code from their status. Use these
 * when the default would be wrong or too coarse: a 403 that is a *scope* failure
 * (right role, wrong weaver) rather than a *role* failure needs a different
 * message and a different recovery action on the client.
 */
export class AppException extends HttpException {
  constructor(
    statusCode: number,
    public readonly code: ErrorCode,
    message: string,
    public readonly fields?: Record<string, string[]>,
  ) {
    super({ statusCode, code, message, fields }, statusCode);
  }
}

/** The requested entity does not exist (or is not visible to this caller). */
export class NotFoundError extends AppException {
  constructor(entity: string, id?: string | number) {
    super(
      HttpStatus.NOT_FOUND,
      "NOT_FOUND",
      id === undefined ? `${entity} not found` : `${entity} ${id} not found`,
    );
  }
}

/** Authenticated, but this role may not perform the action at all. */
export class ForbiddenRoleError extends AppException {
  constructor(message = "You do not have permission to perform this action") {
    super(HttpStatus.FORBIDDEN, "FORBIDDEN_ROLE", message);
  }
}

/**
 * Correct role, wrong record — e.g. a weaver reaching another weaver's batch.
 * Kept distinct from FORBIDDEN_ROLE so the client can say "this isn't yours"
 * instead of the misleading "you don't have permission", which sends users to
 * ask an admin for a role they already have.
 */
export class ForbiddenScopeError extends AppException {
  constructor(message = "This record belongs to another account") {
    super(HttpStatus.FORBIDDEN, "FORBIDDEN_SCOPE", message);
  }
}

/** The action conflicts with current state (duplicate code, already dispatched, …). */
export class ConflictError extends AppException {
  constructor(message: string) {
    super(HttpStatus.CONFLICT, "CONFLICT", message);
  }
}

/** Domain validation that class-validator cannot express, routed to a field. */
export class ValidationError extends AppException {
  constructor(message: string, fields?: Record<string, string[]>) {
    super(HttpStatus.BAD_REQUEST, "VALIDATION_FAILED", message, fields);
  }
}
