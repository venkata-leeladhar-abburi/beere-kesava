/**
 * SearchInput — design-system/03-PRIMITIVES.md Part G.4.
 * type="search", search icon left, debounced onSearch, clear button right.
 */
import * as React from "react";
import { Input, type InputProps } from "./Input";

export interface SearchInputProps extends Omit<InputProps, "type" | "iconLeft" | "clearable" | "onClear" | "onChange" | "aria-label"> {
  /** Fires `debounceMs` after the user stops typing (default 300ms). */
  onSearch?: (value: string) => void;
  debounceMs?: number;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  /**
   * REQUIRED. A search box is almost never wrapped in <Field>, and its
   * placeholder ("Search…", or an example value) is deliberately not a real
   * label (design-system/03-PRIMITIVES.md Part G) — so with no `aria-label`
   * there was no accessible name at all. Same enforcement as IconButton's
   * `label`: this turns the gap into a compile error instead of a silent
   * WCAG 4.1.2 failure. Omit only when this input is genuinely inside a
   * <Field> that already supplies the name.
   */
  "aria-label": string;
}

export const SearchInput = React.forwardRef<HTMLInputElement, SearchInputProps>(function SearchInput(
  { onSearch, debounceMs = 300, onChange, defaultValue, value, ...props },
  ref
) {
  const [internalValue, setInternalValue] = React.useState(value ?? defaultValue ?? "");
  const timerRef = React.useRef<ReturnType<typeof setTimeout>>();

  React.useEffect(() => {
    if (value !== undefined) setInternalValue(value);
  }, [value]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInternalValue(e.target.value);
    onChange?.(e);
    if (onSearch) {
      clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => onSearch(e.target.value), debounceMs);
    }
  };

  const handleClear = () => {
    setInternalValue("");
    onChange?.({ target: { value: "" } } as React.ChangeEvent<HTMLInputElement>);
    clearTimeout(timerRef.current);
    onSearch?.("");
  };

  return (
    <Input
      ref={ref}
      type="search"
      role="searchbox"
      iconLeft="search"
      clearable
      onClear={handleClear}
      value={internalValue}
      onChange={handleChange}
      placeholder="Search…"
      {...props}
    />
  );
});
