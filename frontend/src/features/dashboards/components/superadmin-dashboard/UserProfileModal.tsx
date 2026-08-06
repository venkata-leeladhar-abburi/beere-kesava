import React from "react";
import { motion } from "motion/react";
import { X } from "lucide-react";
import { Button, IconButton } from "../../../../shared/ui/primitives";

export function UserProfileModal({ onClose, role }: { onClose: () => void; role: "admin" | "superadmin" | "shop" | "weaver" }) {
  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(0,0,0,0.6)", backdropFilter: "blur(4px)", padding: 20 }}>
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} style={{ width: "100%", maxWidth: 440, background: "#FFFDF9", borderRadius: 24, overflow: "hidden", border: `1px solid rgba(139,26,46,0.12)`, boxShadow: "0 12px 40px rgba(0,0,0,0.25)" }}>
        {/* Banner */}
        <div style={{ background: "linear-gradient(135deg, #4A061B 0%, #6B1A2A 100%)", padding: "32px 24px 28px", position: "relative", display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center" as const }}>
          <IconButton
            icon={X}
            label="Close"
            onClick={onClose}
            variant="ghost"
            shape="circle"
            className="absolute top-4 right-4 border-none bg-white/12 text-white hover:bg-white/20 hover:text-white"
          />

          <div style={{ width: 85, height: 85, borderRadius: "50%", background: "rgba(255,255,255,0.15)", border: "2px solid rgba(255,255,255,0.3)", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 12 }}>
            <span style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 30, fontWeight: 700, color: "#FFF" }}>
              {role === "admin" ? "AD" : role === "superadmin" ? "SA" : role === "shop" ? "SR" : "RK"}
            </span>
          </div>

          <div style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 20, fontWeight: 700, color: "#FFF", lineHeight: 1.2 }}>
            {role === "admin" ? "Ravi Shankar" : role === "superadmin" ? "Venkata Leeladhar Abburi" : role === "shop" ? "K. S. Rama Rao" : "Ravi Kumar"}
          </div>

          <div style={{ fontFamily: "'Inter', sans-serif", fontSize: 13, color: "rgba(255,255,255,0.65)", marginTop: 4 }}>
            {role === "admin" ? "ADM-001" : role === "superadmin" ? "SADM-001" : role === "shop" ? "SHP-012" : "WV-001 / WVR-014"}
          </div>

          <div style={{ marginTop: 8, display: "inline-block", background: "rgba(196,146,58,0.22)", border: "1px solid rgba(196,146,58,0.40)", borderRadius: 999, padding: "4px 14px" }}>
            <span style={{ fontFamily: "'Inter', sans-serif", fontSize: 12, fontWeight: 600, color: "#845E04" }}>
              {role === "admin" ? "Store Administrator" : role === "superadmin" ? "Super Administrator" : role === "shop" ? "Shop Showroom Manager" : "Master Handloom Weaver"}
            </span>
          </div>
        </div>

        {/* Details List */}
        <div style={{ padding: "24px 24px" }}>
          <div style={{ fontFamily: "'Inter', sans-serif", fontSize: 12, fontWeight: 600, color: "#69635E", letterSpacing: 1.2, textTransform: "uppercase", marginBottom: 12 }}>Contact & Work Details</div>

          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            {[
              { label: "Email Address", value: role === "admin" ? "admin@beerekesava.com" : role === "superadmin" ? "leeladhar@beerekesava.com" : role === "shop" ? "ramarao.k@beerekesava.com" : "ravikumar.wvr@gmail.com" },
              { label: "Phone Number", value: role === "admin" ? "+91 94405 88991" : role === "superadmin" ? "+91 98480 22338" : role === "shop" ? "+91 80081 23456" : "+91 99088 77665" },
              { label: "Factory/Office", value: role === "shop" ? "Bangalore Silk Showroom" : "Dharmavaram Factory Outlet, AP" },
              { label: "Joined Date", value: role === "admin" ? "January 2019" : role === "superadmin" ? "June 2012" : role === "shop" ? "August 2021" : "March 2018" },
              ...(role === "weaver" ? [{ label: "Loom Assignment", value: "Loom 2 & Loom 5 (Active)" }] : [])
            ].map(item => (
              <div key={item.label} style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", borderBottom: "1px solid rgba(139,26,46,0.06)", paddingBottom: 10 }}>
                <span style={{ fontFamily: "'Inter', sans-serif", fontSize: 13, color: "#69635E" }}>{item.label}</span>
                <span style={{ fontFamily: "'Inter', sans-serif", fontSize: 13, fontWeight: 600, color: "#1A0A0F", textAlign: "right" as const }}>{item.value}</span>
              </div>
            ))}
          </div>

          <div style={{ marginTop: 24, textAlign: "center" as const }}>
            <Button
              onClick={onClose}
              variant="primary"
              className="!rounded-full !bg-[#6B1A2A] !px-6 !shadow-[0_4px_14px_rgba(107,26,42,0.2)] hover:!bg-[#5A1523]"
            >
              Close Profile
            </Button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
