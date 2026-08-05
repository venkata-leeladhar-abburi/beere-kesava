import React from "react";
import { motion } from "motion/react";
import { Layers, Tag, Sparkles, Palette, Printer } from "lucide-react";
import { T, F } from "../theme";
import { W_STATUS } from "../data";
import type { WeaverMat } from "../types";
import { ModalOverlay, ModalHeader } from "../common/primitives";

// ─── WEAVER VIEW DETAILS MODAL ────────────────────────────────────────────────
export function WeaverViewDetailsModal({ weaver, onClose }: { weaver: WeaverMat | null; onClose: () => void }) {
  if (!weaver) return null;
  const pct = Math.round((weaver.done / weaver.expected) * 100);
  const barColor = weaver.status === "overdue" ? T.crimson : weaver.status === "on-time" ? T.green : T.antiqueGold;
  const sc = W_STATUS[weaver.status];

  return (
    <ModalOverlay open={!!weaver} onClose={onClose}>
      <ModalHeader title="Weaver Details" subtitle={`Material issued to ${weaver.name}`} onClose={onClose} />
      <div style={{ padding: "26px 28px 28px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 18, marginBottom: 22, background: T.silkCream, borderRadius: 16, padding: "18px 20px" }}>
          {weaver.img
            ? <img src={weaver.img} alt={weaver.name} style={{ width: 64, height: 64, borderRadius: 16, objectFit: "cover", objectPosition: "top center", border: `2px solid ${T.borderGold}`, flexShrink: 0 }} />
            : <div style={{ width: 64, height: 64, borderRadius: 16, background: weaver.avatarBg, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <span style={{ fontFamily: F.display, fontSize: 20, color: "#FFFDF9", fontWeight: 700 }}>{weaver.initials}</span>
              </div>
          }
          <div style={{ flex: 1 }}>
            <div style={{ fontFamily: F.display, fontWeight: 700, fontSize: 20, color: T.luxuryBrown, marginBottom: 6 }}>{weaver.name}</div>
            <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
              <span style={{ fontFamily: F.mono, fontSize: 12, color: T.royalBurgundy, background: "rgba(110,15,45,0.08)", padding: "3px 10px", borderRadius: 6 }}>{weaver.id}</span>
              <span style={{ fontFamily: F.mono, fontSize: 12, color: T.taupe, background: "#FFFFFF", padding: "3px 10px", borderRadius: 6, border: `1px solid ${T.borderDef}` }}>{weaver.batch}</span>
              <span style={{ fontFamily: F.ui, fontSize: 12, color: T.taupe }}>Issued {weaver.daysAgo} days ago</span>
            </div>
          </div>
        </div>

        <div style={{ marginBottom: 18, background: sc.bannerBg, borderRadius: 12, padding: "13px 16px" }}>
          <span style={{ fontFamily: F.ui, fontWeight: 600, fontSize: 14, color: sc.bannerColor }}>{weaver.statusText}</span>
        </div>

        <div style={{ marginBottom: 18 }}>
          <div style={{ fontFamily: F.mono, fontSize: 12, color: T.taupe, letterSpacing: "1.8px", textTransform: "uppercase", marginBottom: 12 }}>Materials Issued</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {[
              { icon: <Layers size={16} color={T.royalBurgundy} />, label: "Warp", value: weaver.warp, bg: "rgba(110,15,45,0.06)" },
              { icon: <Tag size={16} color="#7A5E1C" />, label: "Resham", value: weaver.resham, bg: "rgba(200,155,71,0.08)" },
              { icon: <Sparkles size={16} color={T.luxuryBrown} />, label: "Jari", value: weaver.jari, bg: "rgba(59,35,20,0.06)" },
            ].map(row => (
              <div key={row.label} style={{ display: "flex", alignItems: "center", gap: 14, background: row.bg, borderRadius: 10, padding: "12px 16px" }}>
                <div style={{ width: 34, height: 34, borderRadius: 9, background: "#FFFFFF", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, boxShadow: "0 1px 4px rgba(0,0,0,0.06)" }}>{row.icon}</div>
                <div>
                  <div style={{ fontFamily: F.ui, fontSize: 12, color: T.taupe, marginBottom: 2 }}>{row.label} Given</div>
                  <div style={{ fontFamily: F.ui, fontWeight: 700, fontSize: 14, color: T.luxuryBrown }}>{row.value}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div style={{ background: T.silkCream, borderRadius: 12, padding: "16px 18px", marginBottom: 18 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
            <div style={{ fontFamily: F.ui, fontWeight: 600, fontSize: 14, color: T.luxuryBrown }}>Sarees Progress</div>
            <span style={{ fontFamily: F.mono, fontWeight: 700, fontSize: 14, color: barColor }}>{weaver.done} / {weaver.expected} done</span>
          </div>
          <div style={{ height: 10, background: "rgba(110,15,45,0.10)", borderRadius: 5, marginBottom: 8 }}>
            <div style={{ width: `${pct}%`, height: "100%", background: barColor, borderRadius: 5 }} />
          </div>
          <div style={{ fontFamily: F.ui, fontSize: 13, color: T.taupe }}>{pct}% complete · {weaver.expected - weaver.done} sarees remaining</div>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 10, background: "rgba(110,15,45,0.05)", borderRadius: 10, padding: "12px 16px", marginBottom: 22 }}>
          <Palette size={16} color={T.royalBurgundy} />
          <div>
            <span style={{ fontFamily: F.ui, fontSize: 13, color: T.taupe }}>Design Code: </span>
            <span style={{ fontFamily: F.ui, fontSize: 14, color: T.royalBurgundy, fontWeight: 700 }}>{weaver.design}</span>
          </div>
        </div>

        <motion.button
          onClick={onClose}
          whileHover={{ scale: 1.02, boxShadow: "0 6px 20px rgba(110,15,45,0.22)" }}
          whileTap={{ scale: 0.97 }}
          style={{ width: "100%", padding: "13px 0", borderRadius: 11, cursor: "pointer", fontFamily: F.ui, fontSize: 14, fontWeight: 700, background: T.royalBurgundy, color: "#FFFDF9", border: "none" }}
        >
          Close
        </motion.button>
      </div>
    </ModalOverlay>
  );
}

// ─── ISSUE SLIP MODAL ─────────────────────────────────────────────────────────
export function IssueSlipModal({ weaver, onClose }: { weaver: WeaverMat | null; onClose: () => void }) {
  if (!weaver) return null;
  const today = new Date().toLocaleDateString("en-IN", { day: "2-digit", month: "long", year: "numeric" });
  const slipNo = `ISS-${weaver.id}-${weaver.batch}-${Date.now().toString().slice(-4)}`;

  return (
    <ModalOverlay open={!!weaver} onClose={onClose}>
      <ModalHeader title="Issue Slip" subtitle="Material issue record for weaver" onClose={onClose} />
      <div style={{ padding: "26px 28px 28px" }}>
        <div style={{ background: "#FFFFFF", border: `1.5px solid rgba(110,15,45,0.15)`, borderRadius: 16, padding: "24px 26px", marginBottom: 22 }}>
          <div style={{ textAlign: "center", borderBottom: `1.5px solid rgba(110,15,45,0.12)`, paddingBottom: 18, marginBottom: 18 }}>
            <div style={{ fontFamily: F.display, fontWeight: 700, fontSize: 18, color: T.luxuryBrown, marginBottom: 2 }}>Beere Kesava & Brothers Silks</div>
            <div style={{ fontFamily: F.mono, fontSize: 12, letterSpacing: "2.5px", textTransform: "uppercase", color: T.taupe, marginBottom: 10 }}>Material Issue Slip</div>
            <div style={{ display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: 6 }}>
              <span style={{ fontFamily: F.mono, fontSize: 12, color: T.royalBurgundy, background: "rgba(110,15,45,0.06)", padding: "3px 10px", borderRadius: 6 }}>{slipNo}</span>
              <span style={{ fontFamily: F.ui, fontSize: 12, color: T.taupe }}>Date: {today}</span>
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 18 }}>
            {[
              { label: "Weaver Name", value: weaver.name },
              { label: "Weaver ID", value: weaver.id },
              { label: "Batch Number", value: weaver.batch },
              { label: "Design Code", value: weaver.design },
            ].map(row => (
              <div key={row.label}>
                <div style={{ fontFamily: F.mono, fontSize: 12, color: T.taupe, letterSpacing: "1.5px", textTransform: "uppercase", marginBottom: 3 }}>{row.label}</div>
                <div style={{ fontFamily: F.ui, fontWeight: 700, fontSize: 14, color: T.luxuryBrown }}>{row.value}</div>
              </div>
            ))}
          </div>

          <div style={{ borderRadius: 10, overflow: "hidden", border: `1px solid rgba(110,15,45,0.10)`, marginBottom: 16 }}>
            <div style={{ background: T.silkCream, padding: "10px 16px", display: "grid", gridTemplateColumns: "1fr 2fr 1fr", gap: 8 }}>
              {["Material", "Specification", "Quantity"].map(h => (
                <span key={h} style={{ fontFamily: F.mono, fontSize: 12, fontWeight: 600, color: T.taupe, letterSpacing: "1.5px", textTransform: "uppercase" }}>{h}</span>
              ))}
            </div>
            {[
              { mat: "Warp", spec: "Cotton / Silk", qty: weaver.warp },
              { mat: "Resham", spec: weaver.resham, qty: "— see spec" },
              { mat: "Jari", spec: weaver.jari, qty: "— see spec" },
            ].map((row, i) => (
              <div key={row.mat} style={{ padding: "11px 16px", display: "grid", gridTemplateColumns: "1fr 2fr 1fr", gap: 8, background: i % 2 === 0 ? "#FFFFFF" : T.warmIvory, borderTop: `1px solid rgba(110,15,45,0.06)` }}>
                <span style={{ fontFamily: F.ui, fontWeight: 700, fontSize: 13, color: T.luxuryBrown }}>{row.mat}</span>
                <span style={{ fontFamily: F.ui, fontSize: 13, color: T.taupe }}>{row.spec}</span>
                <span style={{ fontFamily: F.mono, fontSize: 13, fontWeight: 600, color: T.royalBurgundy }}>{row.qty}</span>
              </div>
            ))}
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
            {["Issued By (Signature)", "Received By (Weaver)"].map(s => (
              <div key={s}>
                <div style={{ height: 36, borderBottom: `1.5px solid rgba(110,15,45,0.18)`, marginBottom: 6 }} />
                <div style={{ fontFamily: F.ui, fontSize: 12, color: T.taupe }}>{s}</div>
              </div>
            ))}
          </div>
        </div>

        <div style={{ display: "flex", gap: 12 }}>
          <motion.button onClick={onClose} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }} style={{ flex: 1, padding: "13px 0", borderRadius: 11, cursor: "pointer", fontFamily: F.ui, fontSize: 14, fontWeight: 600, background: T.warmIvory, color: T.taupe, border: `1.5px solid rgba(110,15,45,0.18)` }}>
            Close
          </motion.button>
          <motion.button
            onClick={() => window.print()}
            whileHover={{ scale: 1.02, boxShadow: "0 8px 28px rgba(110,15,45,0.30)" }}
            whileTap={{ scale: 0.97 }}
            style={{ flex: 2, padding: "13px 0", borderRadius: 11, cursor: "pointer", fontFamily: F.ui, fontSize: 14, fontWeight: 700, background: T.royalBurgundy, color: "#FFFDF9", border: "none", display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}
          >
            <Printer size={16} /> Print Issue Slip
          </motion.button>
        </div>
      </div>
    </ModalOverlay>
  );
}
