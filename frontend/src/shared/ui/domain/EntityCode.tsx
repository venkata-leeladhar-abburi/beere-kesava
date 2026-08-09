/**
 * <EntityCode> — design-system/06-DOMAIN.md Part C.3.
 * ═══════════════════════════════════════════════════════════════════════════
 * The only place mono still belongs (Part C.4 — everything else that used to
 * be `fontFamily: F.mono` becomes Inter + tabular figures instead).
 *
 *   <EntityCode type="weaver" value="WV-002" />
 *   <EntityCode type="invoice" value="INV-2627-0142" link copyable />
 */
import * as React from "react";
import { Link } from "react-router";
import { toast } from "sonner";
import { Check, Copy } from "lucide-react";
import { cn } from "../utils";
import { Tooltip } from "../primitives/Tooltip";
import { getEntitySpec, type EntityCodeType } from "@/lib/domain/codes";

export interface EntityCodeProps {
  type: EntityCodeType;
  value: string;
  /** Renders as a link to the registry's route, `--text-brand`, underline on hover. */
  link?: boolean;
  /** Click copies the value; a check icon confirms for 1.5s. */
  copyable?: boolean;
  /** Prepends the entity icon at 12px, `--text-tertiary`. */
  icon?: boolean;
  /** Long codes ellipsise from the middle: `INV-2627-…142`, full value in a tooltip. */
  truncate?: boolean;
  size?: "sm" | "md";
  className?: string;
}

const SIZE_VAR = { sm: "var(--text-code-sm)", md: "var(--text-code-md)" } as const;

function truncateMiddle(value: string, tailLength = 4): string {
  if (value.length <= 12) return value;
  return `${value.slice(0, value.length - tailLength - 5)}…${value.slice(-tailLength)}`;
}

export function EntityCode({ type, value, link, copyable, icon, truncate, size = "md", className }: EntityCodeProps) {
  const [copied, setCopied] = React.useState(false);
  const spec = getEntitySpec(type);
  const EntityIcon = spec.icon;
  const accessibleName = `${spec.label} ${value}`;
  const display = truncate ? truncateMiddle(value) : value;

  async function handleCopy(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    await navigator.clipboard.writeText(value);
    setCopied(true);
    toast.success(`Copied ${value}`);
    window.setTimeout(() => setCopied(false), 1500);
  }

  const content = (
    <span
      aria-label={accessibleName}
      className={cn(
        "inline-flex items-center gap-1 whitespace-nowrap rounded-[var(--radius-xs)] px-1.5 py-0.5",
        "bg-[var(--surface-sunken)] text-[var(--text-primary)]",
        link && "hover:underline hover:text-[var(--text-brand)]",
        className
      )}
      style={{
        fontFamily: "var(--font-code)",
        fontSize: SIZE_VAR[size],
        fontWeight: 500,
        fontVariantNumeric: "tabular-nums",
        letterSpacing: 0,
      }}
    >
      {icon && <EntityIcon size={12} className="shrink-0 text-[var(--text-tertiary)]" aria-hidden="true" />}
      {display}
      {copyable && (
        <button
          type="button"
          onClick={handleCopy}
          aria-label={`Copy ${value}`}
          className="shrink-0 rounded-[var(--radius-xs)] p-0.5 text-[var(--text-tertiary)] hover:text-[var(--text-primary)]"
        >
          {copied ? <Check size={11} /> : <Copy size={11} />}
        </button>
      )}
    </span>
  );

  const wrapped = truncate ? (
    <Tooltip content={value}>
      <span>{content}</span>
    </Tooltip>
  ) : (
    content
  );

  if (link && spec.route) {
    const href = spec.route.replace(":code", encodeURIComponent(value));
    return (
      <Link to={href} className="inline-flex">
        {wrapped}
      </Link>
    );
  }

  return wrapped;
}
