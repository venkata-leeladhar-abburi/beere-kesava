/**
 * AmountInWords — design-system/07-DOCUMENTS.md Part G.1 ⑦ / Part I.4.
 */

export function AmountInWords({ words }: { words: string }) {
  return (
    <div className="bk-doc__words">
      <div className="bk-doc__eyebrow" style={{ marginBottom: "1mm" }}>Amount in words</div>
      <div style={{ fontSize: "var(--doc-amount-words)", fontWeight: 600, color: "var(--doc-ink)", lineHeight: 1.45 }}>
        {words}
      </div>
    </div>
  );
}
