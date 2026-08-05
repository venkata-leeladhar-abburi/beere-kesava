/**
 * CodeInput — design-system/03-PRIMITIVES.md Part G.4.
 * Entity codes only (WV-002, BATCH-086, invoice/PO numbers) — the one place
 * mono renders in the primitive layer. Uppercase, no spellcheck, tabular.
 *
 * NOTE: mask enforcement against the entity-code registry
 * (design-system/06-DOMAIN.md Part C — nextCode/parseCode/isValidCode) is
 * Phase 6 scope and not wired up yet; this component provides the visual
 * and input-mode contract (mono font, uppercase, tabular figures) that
 * Phase 6 will layer validation onto via the optional `entityType` prop.
 */
import * as React from "react";
import { cn } from "../utils";
import { Input, type InputProps } from "./Input";

export interface CodeInputProps extends Omit<InputProps, "className"> {
  /** Reserved for Phase 6 — will drive format masking once the entity-code registry exists. */
  entityType?: string;
  className?: string;
}

export const CodeInput = React.forwardRef<HTMLInputElement, CodeInputProps>(function CodeInput(
  { className, onChange, ...props },
  ref
) {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.target.value = e.target.value.toUpperCase();
    onChange?.(e);
  };

  return (
    <Input
      ref={ref}
      autoCapitalize="characters"
      spellCheck={false}
      autoComplete="off"
      onChange={handleChange}
      className={cn("font-code text-[length:var(--text-code-md)] tabular-nums tracking-normal", className)}
      {...props}
    />
  );
});
