import type { ReactNode } from "react";
import type {
  Formatter,
  NameType,
  ValueType,
} from "recharts/types/component/DefaultTooltipContent";

/**
 * Wraps a recharts `<Tooltip formatter>` that reads the hovered row.
 *
 * Recharts types the formatter's third argument as its own loose `Payload`
 * (`payload?: any`), so a formatter written against the chart's real row type
 * — `(v, name, p: { payload: Row }) => …` — is rejected under
 * strictFunctionTypes. This is the one place that narrowing is asserted; the
 * formatter itself stays typed by the row it actually receives.
 */
export function rowFormatter<V extends ValueType, N, Row>(
  format: (value: V, name: N, item: { payload: Row }) => ReactNode | [ReactNode, NameType]
): Formatter<ValueType, NameType> {
  return (value, name, item) => format(value as V, name as N, item as { payload: Row });
}
