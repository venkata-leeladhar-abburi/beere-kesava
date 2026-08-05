/**
 * Field — design-system/03-PRIMITIVES.md Part K.
 * ═══════════════════════════════════════════════════════════════════════════
 * The composition wrapper that makes accessibility automatic. This is the
 * component that eliminates the ~104 inputs in this codebase currently
 * labelled only by their placeholder (223 placeholders vs 119 htmlFor
 * across features/) — a WCAG 3.3.2 failure, since placeholder text
 * disappears the moment the user starts typing and isn't read as a label
 * by most screen readers.
 *
 * Field generates the ids and wires them via context so feature code never
 * writes aria-describedby / aria-invalid / htmlFor by hand — and therefore
 * can never forget them.
 *
 * Usage:
 *   <Field label="Weaver code" required hint="Format: WV-000" error={errors.code}>
 *     <Input placeholder="WV-001" />
 *   </Field>
 */
import * as React from "react";
import { cn } from "../utils";
import { Icon } from "./Icon";

interface FieldContextValue {
  inputId: string;
  hintId: string;
  errorId: string;
  invalid: boolean;
  required: boolean;
}

const FieldContext = React.createContext<FieldContextValue | null>(null);

/** Consumed by Input/Textarea/Select etc. so they never need their own id logic. */
export function useFieldContext(): FieldContextValue | null {
  return React.useContext(FieldContext);
}

export interface FieldProps extends React.ComponentProps<"div"> {
  label: React.ReactNode;
  /** Marks the field as required and appends an sr-only "required" to the label. */
  required?: boolean;
  hint?: React.ReactNode;
  error?: React.ReactNode;
  /** id override — otherwise generated via React.useId(). */
  id?: string;
}

export function Field({ label, required = false, hint, error, id, className, children, ...props }: FieldProps) {
  const generatedId = React.useId();
  const inputId = id ?? generatedId;
  const hintId = `${inputId}-hint`;
  const errorId = `${inputId}-error`;
  const invalid = !!error;

  return (
    <div className={cn("flex flex-col gap-1.5", className)} {...props}>
      <label
        htmlFor={inputId}
        className="bk-label-lg flex items-baseline gap-1"
        style={{ color: "var(--text-primary)" }}
      >
        {label}
        {required && (
          <>
            <span aria-hidden="true" style={{ color: "var(--text-danger)" }}>
              *
            </span>
            <span className="sr-only">required</span>
          </>
        )}
      </label>

      <FieldContext.Provider value={{ inputId, hintId, errorId, invalid, required }}>
        {children}
      </FieldContext.Provider>

      {/* Row is always reserved (min-height) so validation never shifts layout. */}
      <div className="min-h-[20px]">
        {error ? (
          <p id={errorId} role="alert" className="bk-caption flex items-center gap-1" style={{ color: "var(--text-danger)" }}>
            <Icon name="error" size="xs" />
            {error}
          </p>
        ) : hint ? (
          <p id={hintId} className="bk-caption" style={{ color: "var(--text-tertiary)" }}>
            {hint}
          </p>
        ) : null}
      </div>
    </div>
  );
}

export interface FieldGroupProps extends React.ComponentProps<"div"> {
  columns?: 1 | 2 | 3;
}

/** design-system/03-PRIMITIVES.md Part K.4 — .bk-layout-form recipe, responsive by construction. */
export function FieldGroup({ columns = 2, className, children, ...props }: FieldGroupProps) {
  return (
    <div
      className={cn("bk-layout-form", className)}
      style={columns === 1 ? { gridTemplateColumns: "1fr" } : undefined}
      {...props}
    >
      {children}
    </div>
  );
}
