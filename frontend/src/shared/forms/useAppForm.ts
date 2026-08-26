/**
 * Thin wrapper over react-hook-form + zodResolver that maps a rejected
 * mutation's server-side field errors onto the form, so validation the
 * backend caught (uniqueness, cross-field business rules — anything a zod
 * schema can't know) still lands under the right input instead of a toast.
 *
 * Before this, every form validated by hand with useState and either threw
 * every error into one toast.error(...) or a single top-of-form string —
 * neither points at which field is wrong. See shared/api/errors.ts (the
 * ErrorCode contract) and design-system/10-UI-STATES.md.
 */
import { useForm, type FieldValues, type UseFormProps, type UseFormReturn } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import type { ZodType } from "zod";
import { isApiError, isValidationError } from "../api/client";

export interface UseAppFormOptions<TSchema extends FieldValues>
  extends Omit<UseFormProps<TSchema>, "resolver"> {
  schema: ZodType<TSchema>;
}

export interface AppFormReturn<TSchema extends FieldValues> extends UseFormReturn<TSchema> {
  /**
   * Pass a caught mutation error here (in the mutation's onError, or a
   * catch block) to route ApiError.fields onto the matching inputs. Falls
   * back to a form-level `root` error when the failure has no field to
   * attach to (e.g. a plain conflict/500).
   */
  applyServerError: (error: unknown) => void;
}

export function useAppForm<TSchema extends FieldValues>({
  schema,
  ...formOptions
}: UseAppFormOptions<TSchema>): AppFormReturn<TSchema> {
  const form = useForm<TSchema>({
    ...formOptions,
    resolver: zodResolver(schema),
  });

  const applyServerError = (error: unknown) => {
    if (isApiError(error) && isValidationError(error) && error.fields) {
      const entries = Object.entries(error.fields);
      if (entries.length > 0) {
        entries.forEach(([field, messages]) => {
          form.setError(field as never, { type: "server", message: messages[0] });
        });
        return;
      }
    }

    form.setError("root" as never, {
      type: "server",
      message: isApiError(error) ? error.message : "Something went wrong. Please try again.",
    });
  };

  return { ...form, applyServerError };
}
