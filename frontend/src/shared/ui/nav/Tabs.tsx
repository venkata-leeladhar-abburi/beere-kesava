/**
 * Tabs — design-system/05-OVERLAYS.md Part O.5.
 * ═══════════════════════════════════════════════════════════════════════════
 * Radix Tabs. `underline` (page-level, default) and `pill` (in-card)
 * variants. h 40, label-lg, 2px active indicator (underline variant),
 * roving focus + aria-controls/aria-labelledby come for free from Radix.
 * Panels lazy-mount (Radix's default: `forceMount` is not set).
 *
 * Tab state lives in the URL (`?tab=x`) via `useTabsUrlState`, so a tab is
 * linkable/shareable and survives a refresh. Use `<Tabs>` uncontrolled (or
 * controlled via `value`/`onValueChange`) for cases that shouldn't touch
 * the URL, e.g. an in-card `pill` tab set.
 */
import * as React from "react";
import * as RadixTabs from "@radix-ui/react-tabs";
import { useSearchParams } from "react-router";
import { cn } from "../utils";

export type TabsVariant = "underline" | "pill";

export const Tabs = RadixTabs.Root;
export const TabsContent = RadixTabs.Content;

export interface TabsListProps extends React.ComponentProps<typeof RadixTabs.List> {
  variant?: TabsVariant;
}

export function TabsList({ variant = "underline", className, ...props }: TabsListProps) {
  return (
    <RadixTabs.List
      className={cn(
        "bk-tabs-list",
        variant === "underline" ? "border-b border-[var(--border-default)]" : "",
        "flex items-center gap-1",
        className
      )}
      style={{ height: variant === "underline" ? 40 : undefined }}
      data-variant={variant}
      {...props}
    />
  );
}

export interface TabsTriggerProps extends React.ComponentProps<typeof RadixTabs.Trigger> {
  variant?: TabsVariant;
}

export function TabsTrigger({ variant = "underline", className, style, ...props }: TabsTriggerProps) {
  const isPill = variant === "pill";
  return (
    <RadixTabs.Trigger
      className={cn(
        "bk-tabs-trigger bk-label-lg",
        isPill
          ? "rounded-[var(--radius-full)] px-3 py-1.5 data-[state=active]:bg-[var(--surface-brand-subtle)] data-[state=active]:text-[var(--text-brand)]"
          : "relative h-10 px-3 border-b-2 border-transparent data-[state=active]:border-[var(--surface-brand)] data-[state=active]:text-[var(--text-brand)]",
        "text-[var(--text-secondary)] outline-none cursor-pointer bg-transparent",
        "focus-visible:shadow-[var(--shadow-focus)]",
        className
      )}
      style={style}
      {...props}
    />
  );
}

/**
 * Reads/writes the `tab` search param. Returns `[value, setValue]` shaped
 * like useState so it drops directly into `<Tabs value={...} onValueChange={...}>`.
 */
export function useTabsUrlState(defaultValue: string, param = "tab"): [string, (value: string) => void] {
  const [searchParams, setSearchParams] = useSearchParams();
  const value = searchParams.get(param) ?? defaultValue;

  const setValue = React.useCallback(
    (next: string) => {
      const params = new URLSearchParams(searchParams);
      params.set(param, next);
      setSearchParams(params, { replace: true });
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [param, setSearchParams]
  );

  return [value, setValue];
}
