import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from "@nestjs/common";
import { Request, Response } from "express";
import { defaultCodeForStatus, isErrorCode, type ErrorCode } from "../errors/error-codes";

interface ErrorResponseBody {
  success: false;
  statusCode: number;
  /**
   * Machine-readable state selector. The frontend picks its UI state from
   * this, never from `message` — see design-system/10-UI-STATES.md.
   */
  code: ErrorCode;
  path: string;
  timestamp: string;
  message: string | string[];
  /** Per-field validation messages, keyed by dotted field path. */
  fields?: Record<string, string[]>;
}

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const { statusCode, code, message, fields } = this.resolveException(exception);

    const body: ErrorResponseBody = {
      success: false,
      statusCode,
      code,
      path: request.url,
      timestamp: new Date().toISOString(),
      message,
      ...(fields ? { fields } : {}),
    };

    const isServerError = statusCode >= 500;
    if (isServerError) {
      this.logger.error(
        `${request.method} ${request.url} -> ${statusCode} [${code}]`,
        exception instanceof Error ? exception.stack : undefined,
      );
    }

    response.status(statusCode).json(body);
  }

  private resolveException(exception: unknown): {
    statusCode: number;
    code: ErrorCode;
    message: string | string[];
    fields?: Record<string, string[]>;
  } {
    if (exception instanceof HttpException) {
      const statusCode = exception.getStatus();
      const response = exception.getResponse();

      if (typeof response === "string") {
        return { statusCode, code: defaultCodeForStatus(statusCode), message: response };
      }

      const responseObj = response as {
        message?: string | string[];
        code?: unknown;
        fields?: Record<string, string[]>;
      };

      return {
        statusCode,
        // An explicit code (AppException, the validation factory, or the JWT
        // guard) always wins; anything else falls back to the status default
        // so the ~247 bare Nest exceptions in the services keep working.
        code: isErrorCode(responseObj.code)
          ? responseObj.code
          : defaultCodeForStatus(statusCode),
        message: responseObj.message ?? exception.message,
        fields: responseObj.fields,
      };
    }

    return {
      statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
      code: "INTERNAL",
      message: "Internal server error",
    };
  }
}
