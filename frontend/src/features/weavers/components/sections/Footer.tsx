// ── Page footer ───────────────────────────────────────────────────────────
import { motion } from "motion/react";
import { Facebook, Instagram, Youtube, Linkedin, Phone, Mail } from "lucide-react";
import { T, F } from "../theme";
import { imgBKLogo as imgBKBLogo } from "../../../../shared/constants/weaverImages";
import { Button, Input } from "../../../../shared/ui/primitives";

export function Footer() {
  return (
    <footer className="px-4 md:px-7 xl:px-12" style={{ background: T.luxuryBrown, color: "#FFFDF9", paddingTop: 64, paddingBottom: 48, marginTop: "auto" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 64, flexWrap: "wrap", gap: 40 }}>
        <div style={{ flex: 1, minWidth: 280 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 24 }}>
            <div style={{ width: 56, height: 56, borderRadius: 12, overflow: "hidden", background: "#FFFDF9", padding: 4 }}>
              <img src={imgBKBLogo} alt="BKB" style={{ width: "100%", height: "100%", objectFit: "contain" }} />
            </div>
            <div>
              <div style={{ fontFamily: F.display, fontSize: 20, color: "#FFFDF9", lineHeight: 1.2 }}>Beere Kesava</div>
              <div style={{ fontFamily: F.display, fontSize: 20, color: "#FFFDF9", lineHeight: 1.2 }}>&amp; Brothers Silks</div>
            </div>
          </div>
          <div className="max-w-[300px]" style={{ fontFamily: F.ui, fontSize: 14, color: "rgba(255,253,249,0.50)", lineHeight: 1.6, marginBottom: 24 }}>Managing our weavers and preserving the art of traditional Indian silk weaving since 1999.</div>
          <div style={{ display: "flex", gap: 16 }}>
            {[Facebook, Instagram, Youtube, Linkedin].map((Icon) => (
              <motion.a key={Icon.displayName} href="#" whileHover={{ y: -3, color: T.antiqueGold }} style={{ color: "rgba(255,253,249,0.50)", transition: "color 0.2s" }}>
                <Icon size={20} />
              </motion.a>
            ))}
          </div>
        </div>
        {[
          { title: "Dashboard", links: ["Overview", "Materials", "Weavers", "Production", "History"] },
          { title: "Management", links: ["Payments", "Reports", "Customers", "Settings", "Help"] },
        ].map(c => (
          <div key={c.title} style={{ minWidth: 140 }}>
            <div style={{ fontFamily: "var(--font-mono)", fontSize: 12, color: T.antiqueGold, letterSpacing: "1.5px", textTransform: "uppercase", marginBottom: 20 }}>{c.title}</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              {c.links.map(l => (
                <motion.span key={l} whileHover={{ x: 3 }} style={{ fontFamily: F.ui, fontSize: 14, color: "rgba(255,253,249,0.55)", cursor: "pointer", display: "block" }}>{l}</motion.span>
              ))}
            </div>
          </div>
        ))}
        <div className="min-w-[240px]">
          <div style={{ fontFamily: "var(--font-mono)", fontSize: 12, color: T.antiqueGold, letterSpacing: "1.5px", textTransform: "uppercase", marginBottom: 20 }}>Need Help?</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 16, marginBottom: 24 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}><Phone size={16} color={T.antiqueGold} /><span style={{ fontFamily: "var(--font-mono)", fontSize: 14, color: "rgba(255,253,249,0.70)" }}>+91 70428 78199</span></div>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}><Mail size={16} color={T.antiqueGold} /><span style={{ fontFamily: F.ui, fontSize: 14, color: "rgba(255,253,249,0.70)" }}>Admin@beerekeshava.in</span></div>
          </div>
          <div style={{ fontFamily: "var(--font-mono)", fontSize: 12, color: "rgba(255,253,249,0.35)", letterSpacing: "1px", textTransform: "uppercase", marginBottom: 12 }}>Newsletter</div>
          <div style={{ display: "flex", gap: 8 }}>
            <Input aria-label="Email address" placeholder="Email address" className="bg-white/[0.07] border-white/[0.14] text-[#FFFDF9]" />
            <Button variant="primary" className="shrink-0">
              Subscribe
            </Button>
          </div>
        </div>
      </div>
      <div style={{ borderTop: "1px solid rgba(255,253,249,0.1)", paddingTop: 32, display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 16 }}>
        <div style={{ fontFamily: F.ui, fontSize: 14, color: "rgba(255,253,249,0.35)" }}>© 2026 Beere Kesava &amp; Brothers Silks. All rights reserved.</div>
        <div style={{ fontFamily: "var(--font-mono)", fontSize: 12, color: "rgba(255,253,249,0.25)", letterSpacing: "2px", textTransform: "uppercase" }}>TRADITION · TIMELESS QUALITY</div>
      </div>
    </footer>
  );
}
