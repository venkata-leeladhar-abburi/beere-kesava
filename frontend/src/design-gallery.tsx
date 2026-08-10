/**
 * DEV-ONLY component gallery — design-system/08-GOVERNANCE.md Part G.
 * ═══════════════════════════════════════════════════════════════════════════
 * Reached at /design-gallery.html on the dev server (same technique as
 * nav-preview.tsx/doc-preview.tsx: a standalone Vite entry not listed in
 * vite.config.ts's build.rollupOptions.input, so it never ships — confirmed
 * dev-server-only, no env flag needed). The spec calls for this to live at
 * a real in-app route `/_design`, superadmin-gated; that requires wiring
 * into the app's router/auth, which is a separate, larger step once the
 * gallery's content is real. This harness gets the content built and
 * browser-verifiable first, same sequencing this project has used for
 * every other hard-to-reach-through-auth component (doc-preview, nav-preview).
 *
 * Sections (design-system/08-GOVERNANCE.md Part G's table): Foundations and
 * Primitives are built here. Data/Overlays/Domain/Documents are a larger
 * follow-up, not in this pass — each section below is a self-contained
 * component so adding one later is additive, not a rewrite of this shell.
 */
import { createRoot } from "react-dom/client";
import { useState } from "react";
import "./styles/index.css";
import { GalleryFoundations } from "./shared/ui/_gallery/GalleryFoundations";
import { GalleryPrimitives } from "./shared/ui/_gallery/GalleryPrimitives";

const SECTIONS = [
  { key: "foundations", label: "Foundations" },
  { key: "primitives", label: "Primitives" },
] as const;

type SectionKey = (typeof SECTIONS)[number]["key"];

function App() {
  const initial = (new URLSearchParams(location.search).get("section") as SectionKey) ?? "foundations";
  const [section, setSection] = useState<SectionKey>(SECTIONS.some(s => s.key === initial) ? initial : "foundations");

  function go(key: SectionKey) {
    setSection(key);
    const url = new URL(location.href);
    url.searchParams.set("section", key);
    history.replaceState(null, "", url);
  }

  return (
    <div style={{ minHeight: "100dvh", display: "flex", fontFamily: "Inter, sans-serif", background: "var(--surface-base, #F7F3EE)" }}>
      <nav
        aria-label="Design gallery sections"
        style={{
          width: 220, flexShrink: 0, borderRight: "1px solid var(--border-default, #E5DED4)",
          padding: "24px 12px", position: "sticky", top: 0, height: "100dvh", overflowY: "auto",
        }}
      >
        <div style={{ padding: "0 12px 20px", fontWeight: 700, fontSize: 15, color: "var(--text-primary, #1A0A0F)" }}>
          BK Loom — Design Gallery
        </div>
        {SECTIONS.map(s => (
          <button
            key={s.key}
            type="button"
            onClick={() => go(s.key)}
            aria-current={section === s.key ? "page" : undefined}
            style={{
              display: "block", width: "100%", textAlign: "left", padding: "10px 12px", marginBottom: 2,
              borderRadius: 8, border: "none", cursor: "pointer", fontSize: 14,
              background: section === s.key ? "var(--surface-brand-subtle, rgba(110,15,45,0.08))" : "transparent",
              color: section === s.key ? "var(--text-brand, #6E0F2D)" : "var(--text-secondary, #4A3B33)",
              fontWeight: section === s.key ? 600 : 400,
            }}
          >
            {s.label}
          </button>
        ))}
      </nav>
      <main style={{ flex: 1, minWidth: 0, padding: "32px 40px" }}>
        {section === "foundations" && <GalleryFoundations />}
        {section === "primitives" && <GalleryPrimitives />}
      </main>
    </div>
  );
}

const container = document.getElementById("root")! as HTMLElement & { _root?: ReturnType<typeof createRoot> };
container._root ??= createRoot(container);
container._root.render(<App />);
