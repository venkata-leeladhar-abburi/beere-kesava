/**
 * Binds one react-hook-form field to the existing Field/Input contract, so a
 * form built on useAppForm gets Field's accessibility wiring (aria-invalid,
 * aria-describedby, htmlFor — see primitives/Field.tsx) for free instead of
 * each form re-deriving it.
 *
 * `children` is a render prop receiving the RHF registration so this works
 * with Input, Select, Textarea, NumberInput, etc. uniformly:
 *
 *   <FormField form={form} name="weaverCode" label="Weaver code">
 *     {(field) => <Input {...field} placeholder="WV-001" />}
 *   </FormField>
 */
import type { ReactNode } from "react";
import type { FieldValues, Path, UseFormReturn, UseFormRegisterReturn } from "react-hook-form";
import { Field } from "../ui/primitives/Field";

export interface FormFieldProps<TSchema extends FieldValues> {
  form: UseFormReturn<TSchema>;
  name: Path<TSchema>;
  label: ReactNode;
  required?: boolean;
  hint?: ReactNode;
  children: (registration: UseFormRegisterReturn<string>) => ReactNode;
}

export function FormField<TSchema extends FieldValues>({
  form,
  name,
  label,
  required,
  hint,
  children,
}: FormFieldProps<TSchema>) {
  const error = form.formState.errors[name];
  const message = typeof error?.message === "string" ? error.message : undefined;

  return (
    <Field label={label} required={required} hint={hint} error={message}>
      {children(form.register(name))}
    </Field>
  );
}
