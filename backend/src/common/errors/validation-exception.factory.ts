import { BadRequestException, ValidationError as ClassValidatorError } from "@nestjs/common";

/**
 * Turns class-validator's error tree into `fields: { path: string[] }`.
 *
 * The default ValidationPipe flattens everything into a string[], which the
 * frontend used to `.join(", ")` into one blob and drop into a toast — so a
 * 12-field form told the user "name should not be empty, quantity must be a
 * positive number, …" in a corner popup with nothing marked on the form.
 * Preserving `property` is what lets the client call setError(field) and put
 * each message under the input that caused it.
 *
 * Nested DTOs are flattened with dotted paths (`items.0.quantity`) to match
 * react-hook-form's field-name convention exactly.
 */
export function buildValidationFields(
  errors: ClassValidatorError[],
  parentPath = "",
): Record<string, string[]> {
  const fields: Record<string, string[]> = {};

  for (const error of errors) {
    const path = parentPath ? `${parentPath}.${error.property}` : error.property;

    if (error.constraints) {
      fields[path] = Object.values(error.constraints);
    }

    if (error.children?.length) {
      Object.assign(fields, buildValidationFields(error.children, path));
    }
  }

  return fields;
}

export function validationExceptionFactory(errors: ClassValidatorError[]): BadRequestException {
  const fields = buildValidationFields(errors);
  const flat = Object.values(fields).flat();

  return new BadRequestException({
    statusCode: 400,
    code: "VALIDATION_FAILED",
    // Kept as string[] for backward compatibility with any existing consumer.
    message: flat.length ? flat : ["Validation failed"],
    fields,
  });
}
