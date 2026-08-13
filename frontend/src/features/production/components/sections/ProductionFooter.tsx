import React, { useState } from "react";
import { motion } from "motion/react";
import { Facebook, Instagram, Youtube, Linkedin, Phone, Mail } from "lucide-react";
import { imgBKLogo as imgBKBLogo } from "../../../../shared/constants/weaverImages";
import { T, F } from "../theme";
import { Button, Input, IconButton } from "../../../../shared/ui/primitives";

export function ProductionFooter() {
  const [email, setEmail] = useState("");
  const cols = [
    { title: "Quick Links", links: ["Overview", "Materials", "Weavers", "Production", "Payments"] },
    { title: "Support",     links: ["Contact Support", "Training Updates", "Get Help", "FAQs"] },
    { title: "Legal",       links: ["Privacy Policy", "Terms of Use", "Compliance", "Data Policy"] },
  ];
  return (
    <footer style={{ background: T.darkBurgundy, paddingTop: 52, marginTop: 52 }}>
      <div className="px-4 md:px-7 xl:px-10" style={{ maxWidth: 1400, margin: "0 auto", paddingBottom: 40, display: "grid", gridTemplateColumns: "2fr 1fr 1fr 1fr 1.5fr", gap: 40 }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
            <img src={imgBKBLogo} alt="BKB Logo" style={{ width: 36, height: 36, objectFit: "contain", filter: "brightness(0) invert(1)" }} />
            <div>
              <div style={{ fontFamily: F.display, fontSize: 16, color: "#FFFDF9", lineHeight: 1.2 }}>Beere Kesava</div>
              <div style={{ fontFamily: F.display, fontSize: 16, color: "#FFFDF9", lineHeight: 1.2 }}>&amp; Brothers Silks</div>
            </div>
          </div>
          <div style={{ fontFamily: F.ui, fontSize: 12, color: "rgba(255,253,249,0.50)", lineHeight: 1.6, marginBottom: 20, maxWidth: 240 }}>Tracking every saree from loom to delivery. Preserving traditional silk weaving since 1999.</div>
          <div style={{ display: "flex", gap: 12 }}>
            {[["Facebook", Facebook], ["Instagram", Instagram], ["Youtube", Youtube], ["Linkedin", Linkedin]].map(([name, Icon]: any, i) => (
              <IconButton key={i} variant="ghost" size="sm" shape="circle" label={name} icon={Icon} />
            ))}
          </div>
        </div>
        {cols.map(c => (
          <div key={c.title}>
            <div style={{ fontFamily: F.mono, fontSize: 12, color: T.antiqueGold, letterSpacing: "1.5px", textTransform: "uppercase", marginBottom: 16 }}>{c.title}</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {c.links.map(l => (
                <motion.span key={l} whileHover={{ x: 3 }} style={{ fontFamily: F.ui, fontSize: 12, color: "rgba(255,253,249,0.55)", cursor: "pointer", display: "block" }}>{l}</motion.span>
              ))}
            </div>
          </div>
        ))}
        <div>
          <div style={{ fontFamily: F.mono, fontSize: 12, color: T.antiqueGold, letterSpacing: "1.5px", textTransform: "uppercase", marginBottom: 16 }}>Need Help?</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 20 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}><Phone size={13} color={T.antiqueGold} /><span style={{ fontFamily: F.mono, fontSize: 12, color: "rgba(255,253,249,0.70)" }}>+91 70428 78199</span></div>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}><Mail size={13} color={T.antiqueGold} /><span style={{ fontFamily: F.ui, fontSize: 12, color: "rgba(255,253,249,0.70)" }}>Admin@beerekeshava.in</span></div>
          </div>
          <div style={{ fontFamily: F.mono, fontSize: 12, color: "rgba(255,253,249,0.35)", letterSpacing: "1px", textTransform: "uppercase", marginBottom: 8 }}>Newsletter</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            <Input value={email} onChange={e => setEmail(e.target.value)} placeholder="Enter your email address" />
            <Button variant="primary" fullWidth>
              Subscribe
            </Button>
          </div>
        </div>
      </div>
      <div className="px-4 md:px-7 xl:px-10" style={{ borderTop: "1px solid rgba(255,253,249,0.08)", paddingTop: 16, paddingBottom: 16, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div style={{ fontFamily: F.ui, fontSize: 12, color: "rgba(255,253,249,0.35)" }}>© 2026 Beere Kesava &amp; Brothers Silks. All rights reserved.</div>
        <div style={{ fontFamily: F.mono, fontSize: 12, color: "rgba(255,253,249,0.25)", letterSpacing: "2px", textTransform: "uppercase" }}>TRADITION · TIMELESS QUALITY</div>
      </div>
    </footer>
  );
}
