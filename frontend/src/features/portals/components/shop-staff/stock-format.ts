/**
 * Shared formatting for shop stock, so Inventory and New Sale describe a saree
 * the same way.
 *
 * `ShopStockItem.sareeTypeLabel` arrives from the backend already prefixed with
 * the code (`"BS-004 · Bridal Special"`). Rendering it next to `sareeTypeCode`
 * therefore printed the code twice — these helpers split the two halves apart
 * so the Saree Type column can show the code and the name once each.
 */

/** The saree type's own name, with any `"CODE · "` prefix removed. */
export function sareeTypeName(item: {
  sareeTypeCode: string | null;
  sareeTypeLabel: string | null;
}): string | null {
  const { sareeTypeCode: code, sareeTypeLabel: label } = item;
  if (!label) return null;
  if (code && label.startsWith(`${code} · `)) {
    return label.slice(code.length + 3) || null;
  }
  return label === code ? null : label;
}

/** "BS-004 · Bridal Special" — the single string form, for search and export. */
export function sareeTypeText(item: {
  sareeTypeCode: string | null;
  sareeTypeLabel: string | null;
}): string {
  const name = sareeTypeName(item);
  const code = item.sareeTypeCode;
  if (code && name) return `${code} · ${name}`;
  return code ?? name ?? "—";
}
