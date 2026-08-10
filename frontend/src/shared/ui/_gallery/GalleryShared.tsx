/**
 * Shared layout primitives for the component gallery itself (dev-only —
 * design-system/08-GOVERNANCE.md Part G). Deliberately plain inline-styled
 * building blocks, not the design system's own components, so the gallery
 * shell never depends on the very primitives it's cataloguing.
 */
import * as React from "react";

export function GallerySection({
  title,
  description,
  children,
}: {
  title: string;
  description?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section
      id={slugify(title)}
      style={{
        marginBottom: 56,
        paddingBottom: 40,
        borderBottom: "1px solid var(--border-subtle, #EFE8DE)",
      }}
    >
      <h2 style={{ fontSize: 22, fontWeight: 700, margin: "0 0 6px", color: "var(--text-primary, #1A0A0F)" }}>
        {title}
      </h2>
      {description && (
        <p style={{ fontSize: 13, color: "var(--text-tertiary, #8A7A6F)", margin: "0 0 20px", maxWidth: 720 }}>
          {description}
        </p>
      )}
      <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>{children}</div>
    </section>
  );
}

export function ExampleBlock({
  label,
  code,
  children,
}: {
  label?: string;
  code: string;
  children: React.ReactNode;
}) {
  return (
    <div
      style={{
        border: "1px solid var(--border-default, #E5DED4)",
        borderRadius: 10,
        overflow: "hidden",
        background: "var(--surface-raised, #FFFFFF)",
      }}
    >
      {label && (
        <div
          style={{
            fontSize: 11,
            fontWeight: 600,
            letterSpacing: "0.04em",
            textTransform: "uppercase",
            color: "var(--text-tertiary, #8A7A6F)",
            padding: "10px 16px 0",
          }}
        >
          {label}
        </div>
      )}
      <div style={{ padding: 16, display: "flex", flexWrap: "wrap", alignItems: "center", gap: 14 }}>{children}</div>
      <CodeBlock code={code} />
    </div>
  );
}

export function CodeBlock({ code }: { code: string }) {
  const [copied, setCopied] = React.useState(false);

  function handleCopy() {
    navigator.clipboard?.writeText(code).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1200);
    });
  }

  return (
    <div style={{ position: "relative", borderTop: "1px solid var(--border-subtle, #EFE8DE)" }}>
      <button
        type="button"
        onClick={handleCopy}
        style={{
          position: "absolute",
          top: 8,
          right: 8,
          fontSize: 11,
          padding: "3px 8px",
          borderRadius: 6,
          border: "1px solid var(--border-default, #E5DED4)",
          background: "var(--surface-raised, #FFFFFF)",
          color: "var(--text-secondary, #4A3B33)",
          cursor: "pointer",
        }}
      >
        {copied ? "Copied" : "Copy"}
      </button>
      <pre
        style={{
          margin: 0,
          padding: "14px 16px",
          fontSize: 12.5,
          lineHeight: 1.6,
          overflowX: "auto",
          background: "var(--surface-sunken, #FAF6F0)",
          color: "var(--text-secondary, #4A3B33)",
        }}
      >
        <code>{code}</code>
      </pre>
    </div>
  );
}

export function KeyboardNote({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        fontSize: 12.5,
        color: "var(--text-secondary, #4A3B33)",
        background: "var(--surface-sunken, #FAF6F0)",
        border: "1px solid var(--border-subtle, #EFE8DE)",
        borderRadius: 8,
        padding: "10px 14px",
        display: "flex",
        gap: 8,
      }}
    >
      <span aria-hidden="true" style={{ fontWeight: 700 }}>
        ⌨
      </span>
      <span>{children}</span>
    </div>
  );
}

export interface PropRow {
  prop: string;
  type: string;
  default?: string;
  description?: string;
}

export function PropsTable({ rows }: { rows: PropRow[] }) {
  return (
    <div style={{ overflowX: "auto" }}>
      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12.5 }}>
        <thead>
          <tr style={{ textAlign: "left", borderBottom: "1px solid var(--border-default, #E5DED4)" }}>
            {["Prop", "Type", "Default", "Notes"].map((h) => (
              <th
                key={h}
                style={{
                  padding: "6px 10px",
                  fontWeight: 600,
                  color: "var(--text-tertiary, #8A7A6F)",
                  whiteSpace: "nowrap",
                }}
              >
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.prop} style={{ borderBottom: "1px solid var(--border-subtle, #EFE8DE)" }}>
              <td style={{ padding: "6px 10px", fontFamily: "monospace", whiteSpace: "nowrap", color: "var(--text-primary, #1A0A0F)" }}>
                {r.prop}
              </td>
              <td style={{ padding: "6px 10px", fontFamily: "monospace", color: "var(--text-brand, #6E0F2D)" }}>{r.type}</td>
              <td style={{ padding: "6px 10px", fontFamily: "monospace", color: "var(--text-tertiary, #8A7A6F)" }}>
                {r.default ?? "—"}
              </td>
              <td style={{ padding: "6px 10px", color: "var(--text-secondary, #4A3B33)" }}>{r.description ?? ""}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function slugify(s: string) {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}
