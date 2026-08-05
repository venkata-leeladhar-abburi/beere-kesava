/**
 * Slider — design-system/03-PRIMITIVES.md Part J.
 * ═══════════════════════════════════════════════════════════════════════════
 * Used for ranges (price filters, quality thresholds). Radix Slider.
 *
 * The thumb hover-scale is the ONE place scale is allowed on this system
 * (Part R) — a slider thumb is a handle already under the cursor, not a
 * target the user aims at, so scaling it doesn't violate Fitts's Law the
 * way scaling a button does.
 *
 * Always pair with a NumberInput for exact entry — sliders alone are
 * imprecise for financial values (Part J).
 */
import * as React from "react";
import * as SliderPrimitive from "@radix-ui/react-slider";
import { cn } from "../utils";

export interface SliderProps extends React.ComponentProps<typeof SliderPrimitive.Root> {
  /** Shows the current value(s) in a floating label above the thumb while dragging. */
  showValueLabel?: boolean;
  formatValue?: (value: number) => string;
}

export const Slider = React.forwardRef<React.ElementRef<typeof SliderPrimitive.Root>, SliderProps>(
  function Slider({ className, showValueLabel, formatValue, defaultValue, value, ...props }, ref) {
    const [dragging, setDragging] = React.useState(false);
    const values = value ?? defaultValue ?? [0];

    return (
      <SliderPrimitive.Root
        ref={ref}
        value={value}
        defaultValue={defaultValue}
        onPointerDown={() => setDragging(true)}
        onPointerUp={() => setDragging(false)}
        className={cn("relative flex w-full touch-none select-none items-center py-3", className)}
        {...props}
      >
        <SliderPrimitive.Track className="relative h-1 w-full grow rounded-[var(--radius-full)] bg-[var(--bk-neutral-200)]">
          <SliderPrimitive.Range className="absolute h-full rounded-[var(--radius-full)] bg-[var(--surface-brand)]" />
        </SliderPrimitive.Track>
        {values.map((v, i) => (
          <SliderPrimitive.Thumb
            // eslint-disable-next-line react/no-array-index-key -- thumb count/order is static per slider instance
            key={i}
            className={cn(
              "relative block size-5 rounded-full bg-[var(--surface-raised)] border-2 border-[var(--border-brand)]",
              "shadow-[var(--shadow-sm)] transition-transform duration-[var(--duration-fast)] ease-[var(--ease-standard)]",
              "hover:scale-110 focus-visible:outline-none focus-visible:shadow-[var(--shadow-focus)]",
              "disabled:opacity-50 disabled:pointer-events-none"
            )}
          >
            <span aria-hidden="true" className="absolute pointer-events-none" style={{ inset: -12 }} />
            {showValueLabel && dragging && (
              <span
                className="absolute -top-8 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-[var(--radius-sm)] px-2 py-1 text-[12px]"
                style={{ background: "var(--surface-inverse)", color: "var(--text-on-inverse)" }}
              >
                {formatValue ? formatValue(v) : v}
              </span>
            )}
          </SliderPrimitive.Thumb>
        ))}
      </SliderPrimitive.Root>
    );
  }
);
