/**
 * Select — design-system/03-PRIMITIVES.md Part H.
 * ═══════════════════════════════════════════════════════════════════════════
 * Rebuilt using Radix DropdownMenu so all selects and filter dropdowns
 * render custom styled popovers with rounded corners, warm cream highlights,
 * and dark luxury text across all browsers and devices.
 */
import * as React from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "../utils";
import { useFieldContext } from "./Field";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "../overlay/DropdownMenu";

const SIZE_CLASS = {
  sm: "h-8.5 text-[13px] px-3 gap-2",
  md: "h-10 text-[13.5px] px-3.5 gap-2.5",
  lg: "h-12 text-[15px] px-4 gap-3",
} as const;

interface SelectContextValue {
  value?: string;
  onSelect: (val: string, label: React.ReactNode) => void;
  registerItem: (val: string, label: React.ReactNode) => void;
}

const SelectContext = React.createContext<SelectContextValue | null>(null);

export interface SelectProps {
  size?: "sm" | "md" | "lg";
  placeholder?: string;
  invalid?: boolean;
  className?: string;
  containerClassName?: string;
  value?: string;
  defaultValue?: string;
  onValueChange?: (value: string) => void;
  onChange?: (e: { target: { value: string; name?: string } }) => void;
  children: React.ReactNode;
  disabled?: boolean;
  id?: string;
  name?: string;
  align?: "start" | "center" | "end";
}

export function Select({
  size = "md",
  placeholder = "Select...",
  invalid: invalidProp,
  className,
  containerClassName,
  children,
  value: valueProp,
  defaultValue,
  onValueChange,
  onChange,
  disabled,
  name,
  align = "end",
}: SelectProps) {
  const field = useFieldContext();
  const invalid = invalidProp ?? field?.invalid ?? false;
  const [internalValue, setInternalValue] = React.useState<string>(defaultValue || "");
  const value = valueProp !== undefined ? valueProp : internalValue;

  const [itemsMap, setItemsMap] = React.useState<Map<string, React.ReactNode>>(() => new Map());
  const [open, setOpen] = React.useState(false);

  const registerItem = React.useCallback((val: string, label: React.ReactNode) => {
    setItemsMap(prev => {
      if (prev.get(val) === label) return prev;
      const next = new Map(prev);
      next.set(val, label);
      return next;
    });
  }, []);

  const handleSelect = React.useCallback((val: string) => {
    if (valueProp === undefined) {
      setInternalValue(val);
    }
    onValueChange?.(val);
    onChange?.({ target: { value: val, name } });
    setOpen(false);
  }, [valueProp, onValueChange, onChange, name]);

  // Synchronously parse React.Children to extract value -> label mapping on render
  const childrenMap = React.useMemo(() => {
    const map = new Map<string, React.ReactNode>();
    const extract = (nodes: React.ReactNode) => {
      React.Children.forEach(nodes, node => {
        if (!node) return;
        if (React.isValidElement(node)) {
          if (node.props && (node.props as any).value !== undefined) {
            map.set(String((node.props as any).value), (node.props as any).children);
          } else if ((node.props as any)?.children) {
            extract((node.props as any).children);
          }
        }
      });
    };
    extract(children);
    return map;
  }, [children]);

  const contextValue = React.useMemo<SelectContextValue>(
    () => ({
      value,
      onSelect: handleSelect,
      registerItem,
    }),
    [value, handleSelect, registerItem]
  );

  const activeLabel = childrenMap.get(value ?? "") ?? itemsMap.get(value ?? "") ?? (value ? String(value) : placeholder);

  return (
    <SelectContext.Provider value={contextValue}>
      <DropdownMenu open={open} onOpenChange={setOpen}>
        <div className={cn("relative inline-flex items-center shrink-0", containerClassName || (className?.includes("w-full") ? "w-full" : "w-auto shrink-0"))}>
          <DropdownMenuTrigger
            disabled={disabled}
            className={cn(
              "appearance-none flex items-center justify-between font-semibold rounded-[10px] border transition-all cursor-pointer truncate outline-none select-none",
              className?.includes("w-full") ? "w-full" : "w-auto shrink-0 min-w-fit",
              "bg-white text-[#3B2314] border-[rgba(110,15,45,0.18)] shadow-xs",
              "hover:border-[rgba(110,15,45,0.35)] hover:bg-[#FDF8F0]/50",
              "focus-visible:border-[var(--bk-gold-500)] focus-visible:ring-2 focus-visible:ring-[rgba(200,155,71,0.25)]",
              invalid && "border-[var(--border-danger)]",
              disabled && "opacity-50 cursor-not-allowed pointer-events-none",
              SIZE_CLASS[size],
              className
            )}
          >
            <span className="truncate flex-1 text-left">{activeLabel}</span>
            <ChevronDown className={cn("size-4 shrink-0 transition-transform duration-200 text-[#3B2314]/70", open && "rotate-180")} />
          </DropdownMenuTrigger>

          <DropdownMenuContent
            align={align}
            sideOffset={6}
            className="min-w-[180px] max-h-[300px] rounded-[10px] p-0 overflow-hidden bg-white border border-[rgba(110,15,45,0.14)] shadow-[0_10px_30px_rgba(74,6,27,0.12)]"
          >
            {children}
          </DropdownMenuContent>
        </div>
      </DropdownMenu>
    </SelectContext.Provider>
  );
}

export interface SelectItemProps {
  value: string;
  children: React.ReactNode;
  disabled?: boolean;
  className?: string;
}

export const SelectItem = React.forwardRef<HTMLDivElement, SelectItemProps>(
  function SelectItem({ className, children, value, disabled }, ref) {
    const ctx = React.useContext(SelectContext);

    React.useEffect(() => {
      ctx?.registerItem(value, children);
    }, [ctx, value, children]);

    const isSelected = ctx?.value === value;

    return (
      <DropdownMenuItem
        ref={ref as any}
        disabled={disabled}
        active={isSelected}
        onClick={() => ctx?.onSelect(value, children)}
        className={cn(
          "h-11 px-4 text-[14px] font-medium cursor-pointer transition-colors border-b border-[rgba(110,15,45,0.04)] last:border-b-0",
          isSelected
            ? "bg-[#F8EFE0] font-semibold text-[#2C0913]"
            : "bg-white text-[#3B2314] hover:bg-[#F9F0E1]/70 hover:text-[#2C0913]",
          className
        )}
      >
        <span className="truncate">{children}</span>
      </DropdownMenuItem>
    );
  }
);

export function SelectGroup({ children, label, className }: { children: React.ReactNode; label?: string; className?: string }) {
  return (
    <div className={cn("py-1", className)}>
      {label && <div className="px-4 py-1.5 text-xs font-bold uppercase tracking-wider text-[var(--text-tertiary)]">{label}</div>}
      {children}
    </div>
  );
}

export function SelectLabel({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={cn("px-4 py-1.5 text-xs font-bold uppercase tracking-wider text-[var(--text-tertiary)]", className)}>
      {children}
    </div>
  );
}

export function SelectSeparator() {
  return <div className="my-0.5 h-px bg-[rgba(110,15,45,0.08)]" />;
}

