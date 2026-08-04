import React from "react";
import { ChevronDown, Facebook, Instagram, Youtube, Linkedin, Phone } from "lucide-react";
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

const QUICK_LINKS = ["Dashboard", "Weavers", "Saree / Inventory", "Payments", "Design Library"];
const PROD_SHORTCUTS = ["Create New Batch", "Assign Saree Types", "Assign Weavers", "Setup Printing Plans", "Upload New Design", "Design Library"];
const NEED_HELP = ["User Guide", "Support Center", "Quality Process"];
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

function FooterLink({ label }: { label: string }) {
  return (
    <div style={{ fontFamily: F.ui, fontSize: 12, color: "rgba(255,253,249,0.65)", marginBottom: 9, cursor: "pointer", display: "flex", alignItems: "center", gap: 5, transition: "color 0.2s" }}>
      <ChevronDown size={10} style={{ transform: "rotate(-90deg)", color: T.antiqueGold, flexShrink: 0 }} />
      {label}
    </div>
  );
}

export function ProductionHistoryFooter() {
  return (
    <footer style={{ background: T.darkBurgundy, paddingTop: 48, borderTop: `3px solid ${T.antiqueGold}` }}>
      <div style={{ maxWidth: 1280, margin: "0 auto", padding: "0 40px" }}>
        <div style={{ display: "flex", gap: 48, flexWrap: "wrap", paddingBottom: 40, borderBottom: "1px solid rgba(200,155,71,0.15)" }}>
          {/* Brand column */}
          <div style={{ flex: "0 0 240px", maxWidth: 240 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 14 }}>
              <ImageWithFallback
                src={imgBKLogo}
                alt="Beers Keshara & Brothers Silks logo"
                style={{ width: 48, height: 48, borderRadius: 8, objectFit: "cover", border: `2px solid ${T.antiqueGold}` }}
              />
              <div>
                <div style={{ fontFamily: F.display, fontSize: 16, fontWeight: 700, color: "#FFFDF9", lineHeight: 1.2 }}>Beers Keshara</div>
                <div style={{ fontFamily: F.display, fontSize: 14, color: T.antiqueGold, lineHeight: 1.2 }}>&amp; Brothers Silks</div>
              </div>
            </div>
            <div style={{ fontFamily: F.mono, fontSize: 12, color: T.antiqueGold, letterSpacing: "2px", marginBottom: 10 }}>SINCE 1944</div>
            <p style={{ fontFamily: F.ui, fontSize: 12, color: "rgba(255,253,249,0.55)", lineHeight: 1.7, marginBottom: 20 }}>
              Generating self-employment, we are traditional banarasi silk weaving manufacturers.
            </p>
            <div style={{ display: "flex", gap: 10 }}>
              {[Facebook, Instagram, Youtube, Linkedin].map((Icon, i) => (
                <button key={i} style={{ width: 32, height: 32, borderRadius: 6, background: "rgba(200,155,71,0.12)", border: "1px solid rgba(200,155,71,0.22)", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: T.antiqueGold }}>
                  <Icon size={14} />
                </button>
              ))}
            </div>
          </div>

          {/* Quick Links */}
          <FooterCol title="Quick Links">
            {QUICK_LINKS.map((l) => <FooterLink key={l} label={l} />)}
          </FooterCol>

          {/* Production Shortcuts */}
          <FooterCol title="Production Shortcut">
            {PROD_SHORTCUTS.map((l) => <FooterLink key={l} label={l} />)}
          </FooterCol>

          {/* Need Help */}
          <FooterCol title="Need Help">
            {NEED_HELP.map((l) => <FooterLink key={l} label={l} />)}
            <div style={{ marginTop: 12, display: "flex", alignItems: "center", gap: 7 }}>
              <Phone size={13} style={{ color: T.antiqueGold }} />
              <span style={{ fontFamily: F.mono, fontSize: 12, color: T.goldLight, fontWeight: 600 }}>+91 98400 32045</span>
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
            © 2025 Beers Keshara &amp; Brothers Silks. All rights reserved.
          </span>
          <span style={{ fontFamily: F.display, fontSize: 13, fontStyle: "italic", color: T.antiqueGold, opacity: 0.8 }}>
            Tradition Woven From Quality Creates Legacy
          </span>
          <div style={{ display: "flex", gap: 8 }}>
            {[Facebook, Instagram, Youtube, Linkedin].map((Icon, i) => (
              <Icon key={i} size={13} style={{ color: "rgba(255,253,249,0.30)", cursor: "pointer" }} />
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}
