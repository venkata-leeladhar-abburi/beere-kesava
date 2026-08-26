import React from "react";
import { ChevronDown, Phone } from "lucide-react";
import { useNavigate } from "react-router";
import { ImageWithFallback } from "../../../shared/ui/ImageWithFallback";
import { imgBKLogo } from "../../../shared/constants/weaverImages";

const T = {
  darkBurgundy:  "#3D0E1A",
  antiqueGold:   "#C89B47",
  goldLight:     "#E7C983",
};

const F = {
  display: "'Plus Jakarta Sans', sans-serif",
  ui:      "'Inter', sans-serif",
  mono:    "'JetBrains Mono', monospace",
};

// Each entry must resolve to a real /admin/:tab route. Labels that named no
// destination were removed rather than left as decoration: "Assign Saree
// Types", "Assign Weavers" and "Setup Printing Plans" are steps inside batch
// creation, not pages, and the whole "Need Help" column (User Guide, Support
// Centre, Quality Process) had nothing behind it.
const QUICK_LINKS: { label: string; tab: string }[] = [
  { label: "Dashboard",        tab: "overview" },
  { label: "Weavers",          tab: "weavers" },
  { label: "Saree / Inventory", tab: "inventory" },
  { label: "Payments",         tab: "payments" },
  { label: "Design Library",   tab: "designs" },
];
const PROD_SHORTCUTS: { label: string; tab: string }[] = [
  { label: "Create New Batch",   tab: "batches" },
  { label: "Production History", tab: "production-history" },
  { label: "Finishing",          tab: "finishing" },
  { label: "QC History",         tab: "qc-history" },
  { label: "Design Library",     tab: "designs" },
];
const COMMITMENTS = ["200+ Skilled Weavers", "Authentic Banarasi Patterns", "Premium Quality Assurance", "Traditional Silk Heritage"];

function FooterCol({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ flex: 1, minWidth: 150 }}>
      <div style={{ fontFamily: F.ui, fontSize: 12, fontWeight: 800, color: T.antiqueGold, letterSpacing: "1.4px", textTransform: "uppercase", marginBottom: 14, borderBottom: `1px solid rgba(200,155,71,0.20)`, paddingBottom: 8 }}>
        {title}
      </div>
      {children}
    </div>
  );
}

function FooterLink({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{ fontFamily: F.ui, fontSize: 12, color: "rgba(255,253,249,0.65)", marginBottom: 9, cursor: "pointer", display: "flex", alignItems: "center", gap: 5, transition: "color 0.2s", background: "none", border: "none", padding: 0, textAlign: "left", width: "100%" }}
    >
      <ChevronDown size={10} style={{ transform: "rotate(-90deg)", color: T.antiqueGold, flexShrink: 0 }} />
      {label}
    </button>
  );
}

export function ProductionHistoryFooter() {
  const navigate = useNavigate();
  return (
    <footer style={{ background: T.darkBurgundy, paddingTop: 48, borderTop: `3px solid ${T.antiqueGold}` }}>
      {/* eslint-disable-next-line no-restricted-syntax -- block-level div is already 100% wide by default; maxWidth only caps growth on large screens, no overflow risk */}
      <div className="px-4 md:px-7 xl:px-10" style={{ maxWidth: 1280, margin: "0 auto" }}>
        <div style={{ display: "flex", gap: 48, flexWrap: "wrap", paddingBottom: 40, borderBottom: "1px solid rgba(200,155,71,0.15)" }}>
          {/* Brand column */}
          <div style={{ flex: "0 0 240px", maxWidth: 240 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 14 }}>
              <ImageWithFallback
                src={imgBKLogo}
                alt="Beere Kesava & Brothers Silks logo"
                style={{ width: 48, height: 48, borderRadius: 8, objectFit: "cover", border: `2px solid ${T.antiqueGold}` }}
              />
              <div>
                <div style={{ fontFamily: F.display, fontSize: 16, fontWeight: 700, color: "#FFFDF9", lineHeight: 1.2 }}>Beere Kesava</div>
                <div style={{ fontFamily: F.display, fontSize: 14, color: T.antiqueGold, lineHeight: 1.2 }}>&amp; Brothers Silks</div>
              </div>
            </div>
            <div style={{ fontFamily: F.ui, fontVariantNumeric: "tabular-nums", fontSize: 12, color: T.antiqueGold, letterSpacing: "2px", marginBottom: 10 }}>SINCE 1944</div>
            <p style={{ fontFamily: F.ui, fontSize: 12, color: "rgba(255,253,249,0.55)", lineHeight: 1.7, marginBottom: 20 }}>
              Generating self-employment, we are traditional banarasi silk weaving manufacturers.
            </p>
          </div>

          {/* Quick Links */}
          <FooterCol title="Quick Links">
            {QUICK_LINKS.map((l) => <FooterLink key={l.label} label={l.label} onClick={() => navigate(`/admin/${l.tab}`)} />)}
          </FooterCol>

          {/* Production Shortcuts */}
          <FooterCol title="Production Shortcut">
            {PROD_SHORTCUTS.map((l) => <FooterLink key={l.label} label={l.label} onClick={() => navigate(`/admin/${l.tab}`)} />)}
          </FooterCol>

          {/* Need Help */}
          <FooterCol title="Need Help">
            <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
              <Phone size={13} style={{ color: T.antiqueGold }} />
              <span style={{ fontFamily: F.ui, fontVariantNumeric: "tabular-nums", fontSize: 12, color: T.goldLight, fontWeight: 600 }}>+91 98400 32045</span>
            </div>
          </FooterCol>

          {/* Our Commitment */}
          <FooterCol title="Our Commitment">
            {COMMITMENTS.map((c) => (
              <div key={c} style={{ display: "flex", alignItems: "flex-start", gap: 8, marginBottom: 9 }}>
                <div style={{ width: 5, height: 5, borderRadius: "50%", background: T.antiqueGold, flexShrink: 0, marginTop: 5 }} />
                <span style={{ fontFamily: F.ui, fontSize: 12, color: "rgba(255,253,249,0.65)", lineHeight: 1.6 }}>{c}</span>
              </div>
            ))}
          </FooterCol>
        </div>

        {/* Bottom bar */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 0", flexWrap: "wrap", gap: 12 }}>
          <span style={{ fontFamily: F.ui, fontSize: 12, color: "rgba(255,253,249,0.40)" }}>
            © 2025 Beere Kesava &amp; Brothers Silks. All rights reserved.
          </span>
          <span style={{ fontFamily: F.display, fontSize: 13, fontStyle: "italic", color: T.antiqueGold, opacity: 0.8 }}>
            Tradition Woven From Quality Creates Legacy
          </span>
        </div>
      </div>
    </footer>
  );
}
