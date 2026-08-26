/**
 * Button — design-system/03-PRIMITIVES.md Part D.
 * ═══════════════════════════════════════════════════════════════════════════
 * Replaces the pattern found across the app: 752 raw <button> + 248
 * <motion.button>, each hand-styled with its own height/radius/weight, all
 * collapsing to the same ~2 semantic intents (primary/secondary action).
 *
 *   variant="primary"    the ONE main action per view — surface-brand fill
 *   variant="secondary"  supporting actions — outlined, brand text     ★ DEFAULT
 *   variant="tertiary"    low-emphasis, toolbars
 *   variant="ghost"       icon-only, table row actions
 *   variant="danger"      destructive confirm — max 1 per dialog
 *   variant="danger-subtle" destructive in a list row
 *   variant="link"         inline navigation
 *
 * Default is "secondary", not "primary" — with 1,000 call sites to migrate,
 * a primary default would produce a page of competing calls-to-action.
 *
 * CSS transitions only, no Motion: buttons never scale on hover/tap (moves
 * the target while the user is aiming at it — a Fitts's-Law violation — and
 * was also why `button { background-color: rgba(0,0,0,0) }` had to be
 * injected globally to stop Motion crashing on oklch backgrounds; that
 * escape hatch is gone as of Phase 2 Step 2.5).
 *
 * Sizes: sm/md both carry a 44px hit area via an invisible ::before
 * pseudo-element even though the visible control is smaller (Fitts's Law /
 * WCAG 2.5.8), implemented here with a plain absolutely-positioned span
 * rather than a pseudo-element so it works without a Tailwind plugin.
 */
import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "../utils";
import { Icon } from "./Icon";
import { Icons, type IconName, type LucideIcon } from "./icons";

const buttonVariants = cva(
  [
    "relative inline-flex items-center justify-center gap-2",
    "whitespace-nowrap select-none rounded-[10px]",
    "font-semibold",
    "transition-[background-color,border-color,color,box-shadow]",
    "duration-[var(--duration-fast)] ease-[var(--ease-standard)]",
    "focus-visible:outline-none focus-visible:shadow-[var(--shadow-focus)]",
    "disabled:pointer-events-none disabled:cursor-not-allowed",
    "disabled:bg-[var(--surface-disabled)] disabled:text-[var(--text-disabled)] disabled:shadow-none disabled:border-transparent",
    "aria-busy:pointer-events-none",
    "[&_svg]:shrink-0 [&_svg]:pointer-events-none",
  ].join(" "),
  {
    variants: {
      variant: {
        primary: [
          "bg-[var(--surface-brand)] text-[var(--text-on-brand)] shadow-[var(--shadow-brand)]",
          "hover:bg-[var(--surface-brand-hover)] hover:shadow-[var(--shadow-md)]",
          "active:bg-[var(--surface-brand-active)] active:shadow-[var(--shadow-xs)]",
        ].join(" "),
        secondary: [
          "bg-[var(--surface-raised)] text-[var(--text-brand)]",
          "border border-[var(--border-default)]",
          "hover:bg-[var(--surface-brand-subtle)] hover:border-[var(--border-brand)]",
          "active:bg-[var(--bk-burgundy-100)]",
        ].join(" "),
        tertiary: [
          "bg-transparent text-[var(--text-secondary)]",
          "hover:bg-[var(--bk-neutral-50)] hover:text-[var(--text-primary)]",
          "active:bg-[var(--bk-neutral-100)]",
        ].join(" "),
        ghost: [
          "bg-transparent text-[var(--text-tertiary)]",
          "hover:bg-[var(--bk-neutral-50)] hover:text-[var(--text-primary)]",
          "active:bg-[var(--bk-neutral-100)]",
        ].join(" "),
        danger: [
          "bg-[var(--bk-red-700)] text-white",
          "hover:bg-[var(--bk-red-800)] active:bg-[var(--bk-red-900)]",
          "focus-visible:shadow-[0_0_0_3px_rgba(203,75,67,0.40)]",
        ].join(" "),
        "danger-subtle": [
          "bg-[var(--surface-danger-subtle)] text-[var(--text-danger)]",
          "border border-[var(--bk-red-200)]",
          "hover:bg-[var(--bk-red-100)] active:bg-[var(--bk-red-200)]",
        ].join(" "),
        link: [
          "bg-transparent text-[var(--text-brand)] underline-offset-4 h-auto p-0 shadow-none",
          "hover:underline active:text-[var(--bk-burgundy-950)]",
        ].join(" "),
      },
      size: {
        sm: "h-8 px-3 text-[13px] [&_svg]:size-3.5",
        md: "h-10 px-4 text-[14px] [&_svg]:size-4",
        lg: "h-12 px-6 text-[16px] rounded-[10px] [&_svg]:size-5",
      },
      fullWidth: { true: "w-full" },
    },
    defaultVariants: { variant: "secondary", size: "md" },
  }
);

/** 44px hit area for sm/md even though the visible control is smaller. */
const HIT_AREA_INSET: Record<string, string> = {
  sm: "-6px 0",
  md: "-2px 0",
  lg: "0",
};

export interface ButtonProps
  extends Omit<React.ComponentProps<"button">, "style">,
    VariantProps<typeof buttonVariants> {
  iconLeft?: IconName | LucideIcon;
  iconRight?: IconName | LucideIcon;
  loading?: boolean;
  /** Announced to screen readers while loading; the visible label is unchanged. */
  loadingLabel?: string;
  fullWidth?: boolean;
  /** Radix Slot — render as the child element (e.g. a router <Link>) instead of <button>. */
  asChild?: boolean;
}

function resolveIcon(icon: IconName | LucideIcon | undefined) {
  if (!icon) return null;
  return typeof icon === "string" ? <Icon name={icon} size="sm" /> : <Icon icon={icon} size="sm" />;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  {
    className,
    variant,
    size = "md",
    fullWidth,
    iconLeft,
    iconRight,
    loading = false,
    loadingLabel = "Loading",
    disabled,
    asChild = false,
    children,
    ...props
  },
  ref
) {
  const Comp = asChild ? Slot : "button";
  const showHitArea = size === "sm" || size === "md";

  return (
    <Comp
      ref={ref as never}
      data-slot="button"
      aria-busy={loading || undefined}
      disabled={disabled || loading}
      className={cn(buttonVariants({ variant, size, fullWidth, className }))}
      {...props}
    >
      {showHitArea && (
        <span aria-hidden="true" className="absolute inset-x-0 pointer-events-none" style={{ inset: `${HIT_AREA_INSET[size]}` }} />
      )}
      {loading ? <Icon icon={Icons.spinner} size="sm" className="animate-spin" decorative /> : resolveIcon(iconLeft)}
      {loading && <span className="sr-only">{loadingLabel}</span>}
      {children}
      {!loading && resolveIcon(iconRight)}
    </Comp>
  );
});
