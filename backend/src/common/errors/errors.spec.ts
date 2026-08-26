import { ValidationError as ClassValidatorError } from "@nestjs/common";
import { defaultCodeForStatus, isErrorCode } from "./error-codes";
import { buildValidationFields, validationExceptionFactory } from "./validation-exception.factory";

function err(
  property: string,
  constraints?: Record<string, string>,
  children?: ClassValidatorError[],
): ClassValidatorError {
  return { property, constraints, children };
}

describe("error codes", () => {
  it("maps statuses to their default code", () => {
    expect(defaultCodeForStatus(401)).toBe("AUTH_REQUIRED");
    expect(defaultCodeForStatus(403)).toBe("FORBIDDEN_ROLE");
    expect(defaultCodeForStatus(404)).toBe("NOT_FOUND");
    expect(defaultCodeForStatus(409)).toBe("CONFLICT");
    expect(defaultCodeForStatus(500)).toBe("INTERNAL");
  });

  it("rejects unknown codes", () => {
    expect(isErrorCode("NOT_FOUND")).toBe(true);
    expect(isErrorCode("MADE_UP")).toBe(false);
    expect(isErrorCode(undefined)).toBe(false);
  });
});

describe("buildValidationFields", () => {
  it("keys messages by field", () => {
    expect(
      buildValidationFields([err("name", { isNotEmpty: "name should not be empty" })]),
    ).toEqual({ name: ["name should not be empty"] });
  });

  it("flattens nested DTOs to dotted paths react-hook-form understands", () => {
    const nested = [
      err("items", undefined, [err("0", undefined, [err("quantity", { min: "too small" })])]),
    ];
    expect(buildValidationFields(nested)).toEqual({ "items.0.quantity": ["too small"] });
  });

  it("keeps the flat message array for backward compatibility", () => {
    const exception = validationExceptionFactory([
      err("name", { isNotEmpty: "name should not be empty" }),
      err("qty", { min: "too small" }),
    ]);
    const body = exception.getResponse() as {
      code: string;
      message: string[];
      fields: Record<string, string[]>;
    };

    expect(body.code).toBe("VALIDATION_FAILED");
    expect(body.message).toEqual(["name should not be empty", "too small"]);
    expect(body.fields).toEqual({
      name: ["name should not be empty"],
      qty: ["too small"],
    });
  });
});
