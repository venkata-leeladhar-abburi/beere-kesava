import React, { useState } from "react";
import { CheckCircle2, Mail, Package, Phone, X } from "lucide-react";
import { motion } from "motion/react";

import { VENDOR_CONTACTS } from "../../data/vendors";
import { EASE, F, T } from "../../theme";
import { VendorPayment } from "../../types";

// ── Contact Vendor Modal ──────────────────────────────────────────────────────
export function ContactVendorModal({ vendors, onClose }: { vendors: VendorPayment[]; onClose: () => void }) {
  const [selected, setSelected] = useState(vendors[0]?.id ?? "");
  const [msgType, setMsgType]   = useState<"whatsapp"|"email"|"call">("whatsapp");
  const [sending, setSending]   = useState(false);
  const [sent, setSent]         = useState(false);

  const vp      = vendors.find(v => v.id === selected) ?? vendors[0];
  const contact = VENDOR_CONTACTS[vp?.vendor ?? ""] ?? { phone: "—", email: "—", city: "—", contactPerson: "—" };
  const balance = vp ? vp.invoiceAmt - vp.paidAmt : 0;

  const handleSend = () => {
    setSending(true);
    setTimeout(() => { setSending(false); setSent(true); setTimeout(() => setSent(false), 2200); }, 900);
  };

  const CHANNELS = [
    { key: "whatsapp" as const, label: "WhatsApp",   icon: "💬", desc: "Send WhatsApp message" },
    { key: "email"    as const, label: "Email",      icon: "📧", desc: "Send formal email"     },
    { key: "call"     as const, label: "Call",       icon: "📞", desc: "Call vendor directly"  },
  ];

  const MESSAGE_PREVIEW = `Dear ${contact.contactPerson},

This is a payment reminder from Beers Keshara & Brothers Silks regarding PO ${vp?.poNumber}.

Outstanding Balance: ₹${balance.toLocaleString("en-IN")}
Original Due Date: ${vp?.dueDate ?? "—"}${vp?.daysOverdue ? `\nDays Overdue: ${vp.daysOverdue} days` : ""}

Please advise on payment status at your earliest convenience.

Thank you.`;

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(30,10,20,0.60)", zIndex: 400, display: "flex", alignItems: "center", justifyContent: "center", padding: 24, backdropFilter: "blur(6px)" }} onClick={onClose}>
      <motion.div
        initial={{ opacity: 0, scale: 0.93, y: 24 }} animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.24, ease: EASE }} onClick={e => e.stopPropagation()}
        style={{ background: T.warmIvory, borderRadius: 24, width: 640, maxWidth: "100%", maxHeight: "92vh", overflowY: "auto", boxShadow: "0 32px 90px rgba(44,6,27,0.35)", border: `1px solid ${T.borderDef}` }}
      >
        {/* Header */}
        <div style={{ background: `linear-gradient(135deg, ${T.royalBurgundy} 0%, ${T.deepWine} 100%)`, padding: "26px 28px", position: "relative", borderRadius: "24px 24px 0 0" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 6 }}>
            <div style={{ width: 46, height: 46, borderRadius: 12, background: "rgba(255,255,255,0.14)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              <Phone size={22} color="#FFFDF9" />
            </div>
            <div>
              <div style={{ fontFamily: F.display, fontSize: 21, fontWeight: 700, color: "#FFFDF9" }}>Contact Vendor</div>
              <div style={{ fontFamily: F.ui, fontSize: 13, color: "rgba(255,253,249,0.65)", marginTop: 2 }}>{vendors.length} overdue vendor{vendors.length > 1 ? "s" : ""} need attention</div>
            </div>
          </div>
          <button onClick={onClose} style={{ position: "absolute", top: 18, right: 18, width: 34, height: 34, borderRadius: 9, background: "rgba(255,255,255,0.14)", border: "none", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: "rgba(255,255,255,0.85)" }}>
            <X size={16} />
          </button>
        </div>

        <div style={{ padding: "26px 28px 28px", display: "flex", flexDirection: "column", gap: 22 }}>

          {/* Vendor selector */}
          <div>
            <div style={{ fontFamily: F.ui, fontWeight: 700, fontSize: 13, color: T.luxuryBrown, marginBottom: 10 }}>Select Vendor to Contact</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {vendors.map(v => {
                const bal = v.invoiceAmt - v.paidAmt;
                const isSelected = selected === v.id;
                return (
                  <div key={v.id}
                    onClick={() => setSelected(v.id)}
                    style={{
                      display: "flex", alignItems: "center", gap: 14,
                      padding: "14px 16px", borderRadius: 12, cursor: "pointer",
                      border: `2px solid ${isSelected ? T.royalBurgundy : T.borderDef}`,
                      background: isSelected ? "rgba(110,15,45,0.05)" : "#FFFFFF",
                      transition: "all 0.16s ease",
                    }}
                  >
                    <div style={{ width: 40, height: 40, borderRadius: 10, background: isSelected ? "rgba(110,15,45,0.10)" : "rgba(110,15,45,0.06)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                      <Package size={18} color={T.royalBurgundy} />
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontFamily: F.ui, fontSize: 14, fontWeight: 700, color: T.luxuryBrown }}>{v.vendor}</div>
                      <div style={{ fontFamily: F.mono, fontSize: 11, color: T.royalBurgundy, marginTop: 2 }}>{v.poNumber}</div>
                    </div>
                    <div style={{ textAlign: "right" as const, flexShrink: 0 }}>
                      <div style={{ fontFamily: F.mono, fontSize: 14, fontWeight: 700, color: T.crimson }}>₹{bal.toLocaleString("en-IN")}</div>
                      {v.daysOverdue && <div style={{ fontFamily: F.mono, fontSize: 10, color: T.crimson, background: "rgba(192,57,43,0.10)", padding: "1px 6px", borderRadius: 4, marginTop: 2 }}>{v.daysOverdue}d overdue</div>}
                    </div>
                    {isSelected && <div style={{ width: 20, height: 20, borderRadius: "50%", background: T.royalBurgundy, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}><CheckCircle2 size={12} color="#FFF" /></div>}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Vendor contact card */}
          {vp && (
            <div style={{ background: "#FFFFFF", borderRadius: 14, border: `1px solid ${T.borderDef}`, overflow: "hidden" }}>
              <div style={{ background: `linear-gradient(135deg, rgba(110,15,45,0.06), rgba(200,155,71,0.06))`, padding: "14px 18px", borderBottom: `1px solid ${T.borderDef}` }}>
                <div style={{ fontFamily: F.ui, fontWeight: 700, fontSize: 13, color: T.luxuryBrown }}>Vendor Contact Details</div>
              </div>
              <div style={{ padding: "16px 18px", display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px 20px" }}>
                {[
                  { label: "Contact Person", val: contact.contactPerson, icon: "👤" },
                  { label: "City / Location", val: contact.city, icon: "📍" },
                  { label: "Phone Number",    val: contact.phone,          icon: "📞" },
                ].map(row => (
                  <div key={row.label}>
                    <div style={{ fontFamily: F.ui, fontSize: 10.5, color: T.taupe, textTransform: "uppercase" as const, letterSpacing: "0.6px", marginBottom: 3 }}>{row.label}</div>
                    <div style={{ fontFamily: F.ui, fontSize: 13, color: T.luxuryBrown, fontWeight: 600, display: "flex", alignItems: "center", gap: 6 }}>
                      <span>{row.icon}</span>{row.val}
                    </div>
                  </div>
                ))}
              </div>
              {/* Quick action buttons */}
              <div style={{ padding: "12px 18px", borderTop: `1px solid ${T.borderDef}`, display: "flex", gap: 10 }}>
                <a href={`tel:${contact.phone}`}
                  style={{ flex: 1, height: 38, display: "flex", alignItems: "center", justifyContent: "center", gap: 7, textDecoration: "none", border: `1.5px solid rgba(30,102,64,0.22)`, borderRadius: 9, background: "rgba(30,102,64,0.06)", fontFamily: F.ui, fontSize: 12.5, fontWeight: 700, color: T.green }}>
                  📞 Call Now
                </a>
              </div>
            </div>
          )}



          {/* Message preview */}
          <div>
            <div style={{ fontFamily: F.ui, fontWeight: 700, fontSize: 13, color: T.luxuryBrown, marginBottom: 8 }}>Message Preview</div>
            <div style={{ background: "#FFFFFF", border: `1px solid ${T.borderDef}`, borderRadius: 12, padding: "14px 16px", fontFamily: F.mono, fontSize: 12, color: T.taupe, lineHeight: 1.75, whiteSpace: "pre-wrap" as const }}>
              {MESSAGE_PREVIEW}
            </div>
          </div>

          {/* Send button */}
          <motion.button
            whileHover={{ scale: 1.02 }}
            onClick={handleSend}
            disabled={sending || sent}
            style={{
              width: "100%", height: 48, display: "flex", alignItems: "center", justifyContent: "center", gap: 10,
              border: "none", borderRadius: 12,
              background: sent ? T.green : `linear-gradient(135deg, ${T.royalBurgundy}, ${T.deepWine})`,
              fontFamily: F.ui, fontSize: 15, fontWeight: 700, color: "#FFFDF9",
              cursor: sending || sent ? "default" : "pointer",
              transition: "background 0.3s ease",
              opacity: sending ? 0.8 : 1,
            }}
          >
            {sent ? (<><CheckCircle2 size={18} /> Reminder Sent Successfully!</>) :
             sending ? "Sending…" :
             (<><Mail size={17} /> Send Reminder via {CHANNELS.find(c => c.key === msgType)?.label}</>)}
          </motion.button>
        </div>
      </motion.div>
    </div>
  );
}
