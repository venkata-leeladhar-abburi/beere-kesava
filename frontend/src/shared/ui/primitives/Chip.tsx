/**
 * Chip — design-system/03-PRIMITIVES.md Part L.3.
 * The one member of the badge family that's interactive/removable — used
 * for active filters. Remove control gets the 44px hit area treatment and
 * Backspace/Delete removes when the chip has focus.
 */
import * as React from "react";
import { cn } from "../utils";
import { Icon } from "./Icon";

export interface ChipProps extends React.ComponentProps<"span"> {
  label: React.ReactNode;
  onRemove?: () => void;
  removeLabel?: string;
}

export const Chip = React.forwardRef<HTMLSpanElement, ChipProps>(function Chip(
  { label, onRemove, removeLabel, className, ...props },
  ref
) {
  const handleKeyDown = (e: React.KeyboardEvent<HTMLSpanElement>) => {
    if (onRemove && (e.key === "Backspace" || e.key === "Delete")) {
      e.preventDefault();
      onRemove();
    }
  };

  return (
    // The key handler lives on the chip rather than only on the remove button,
    // so Backspace/Delete fires whenever focus is anywhere within the chip —
    // the behaviour this file documents. Keystrokes on the inner button bubble
    // up to here, which keeps that button the single tab stop instead of making
    // the wrapper separately focusable.
    // eslint-disable-next-line jsx-a11y/no-static-element-interactions -- not itself interactive: this only catches keys bubbling from the real <button> below, which stays the focusable, labelled control
    <span
      ref={ref}
      onKeyDown={onRemove ? handleKeyDown : undefined}
      className={cn(
        "inline-flex items-center gap-1 h-6 pl-2 pr-1 rounded-[var(--radius-full)]",
        "bg-[var(--surface-brand-subtle)] text-[var(--text-brand)] text-[12px] font-medium whitespace-nowrap",
        "focus-visible:outline-none focus-visible:shadow-[var(--shadow-focus)]",
        className
      )}
      {...props}
    >
      {label}
      {onRemove && (
        <button
          type="button"
          onClick={onRemove}
          aria-label={removeLabel ?? `Remove ${typeof label === "string" ? label : "filter"}`}
          className="relative inline-flex items-center justify-center size-4 rounded-full hover:bg-[var(--bk-burgundy-200)] shrink-0"
        >
          <span aria-hidden="true" className="absolute pointer-events-none" style={{ inset: -14 }} />
          <Icon name="close" size="xs" />
        </button>
      )}
    </span>
  );
});
