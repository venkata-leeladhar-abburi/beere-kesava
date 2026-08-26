import React, { useMemo, useState } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { CheckCircle2, Mail, Package, Phone, X } from "lucide-react";
import { useQuery } from "@tanstack/react-query";

import { VENDOR_CONTACTS } from "../../data/vendors";
import { F, T } from "../../theme";
import { VendorPayment } from "../../types";
import { vendorsApi } from "../../../../shared/api/vendors";
import { Button, IconButton } from "../../../../shared/ui/primitives";
import { Modal } from "../../../../shared/ui/overlay";
import { rupees, formatMoney } from "@/lib/domain/money";
import { EntityCode, Money } from "@/shared/ui/domain";

// ── Contact Vendor Modal ──────────────────────────────────────────────────────
export function ContactVendorModal({ vendors, onClose }: { vendors: VendorPayment[]; onClose: () => void }) {
  const [selected, setSelected] = useState(vendors[0]?.id ?? "");
  const [msgType, setMsgType]   = useState<"whatsapp"|"email"|"call">("whatsapp");
  const [handedOff, setHandedOff] = useState(false);

  // Real vendor master data (phone, city, contact person) from GET
  // /vendors. BackendVendor has no email field, so email always falls
  // back to "—" here — see the MOCK comment on VENDOR_CONTACTS.
  const { data: vendorsRes, isError: vendorsError } = useQuery({
    queryKey: ["contact-vendor-modal-vendors"],
    queryFn: () => vendorsApi.list(),
  });
  const liveContactsByName = useMemo(() => {
    const map = new Map<string, { phone: string; email: string; city: string; contactPerson: string }>();
    for (const v of vendorsRes?.items ?? []) {
      map.set(v.name, {
        phone: v.phone || "—",
        email: "—",
        city: v.city || "—",
        contactPerson: v.contactName || "—",
      });
    }
    return map;
  }, [vendorsRes]);

  const vp      = vendors.find(v => v.id === selected) ?? vendors[0];
  const contact = liveContactsByName.get(vp?.vendor ?? "") ?? VENDOR_CONTACTS[vp?.vendor ?? ""] ?? { phone: "—", email: "—", city: "—", contactPerson: "—" };
  const balance = vp ? vp.invoiceAmt - vp.paidAmt : 0;

  // Hands the reminder to the user's own WhatsApp / mail / phone app with the
  // message prefilled — the app itself has no outbound messaging backend, so
  // this used to just run a timer and claim the reminder had been sent.
  const phoneDigits = (contact.phone || "").replace(/\D/g, "");
  // Indian mobile numbers are stored as 10 digits; wa.me needs a country code.
  const waNumber = phoneDigits.length === 10 ? `91${phoneDigits}` : phoneDigits;
  const hasPhone = phoneDigits.length > 0;
  const hasEmail = !!contact.email && contact.email !== "—";
  const canSend  = msgType === "email" ? hasEmail : hasPhone;

  const handleSend = () => {
    if (!canSend) return;
    if (msgType === "whatsapp") {
      window.open(`https://wa.me/${waNumber}?text=${encodeURIComponent(MESSAGE_PREVIEW)}`, "_blank", "noopener,noreferrer");
    } else if (msgType === "email") {
      const subject = `Payment reminder — PO ${vp?.poNumber ?? ""}`;
      window.location.href = `mailto:${contact.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(MESSAGE_PREVIEW)}`;
    } else {
      window.location.href = `tel:${contact.phone}`;
    }
    setHandedOff(true);
    setTimeout(() => setHandedOff(false), 2600);
  };

  const CHANNELS = [
    { key: "whatsapp" as const, label: "WhatsApp",   icon: "💬", desc: "Send WhatsApp message" },
    { key: "email"    as const, label: "Email",      icon: "📧", desc: "Send formal email"     },
    { key: "call"     as const, label: "Call",       icon: "📞", desc: "Call vendor directly"  },
  ];

  const MESSAGE_PREVIEW = `Dear ${contact.contactPerson},

This is a payment reminder from Beere Kesava & Brothers Silks regarding PO ${vp?.poNumber}.

Outstanding Balance: ${formatMoney(rupees(balance))}
Original Due Date: ${vp?.dueDate ?? "—"}${vp?.daysOverdue ? `\nDays Overdue: ${vp.daysOverdue} days` : ""}

Please advise on payment status at your earliest convenience.

Thank you.`;

  return (
    <Modal open onOpenChange={o => { if (!o) onClose(); }} size="md">
      <div style={{ display: "flex", flexDirection: "column", overflowY: "auto", maxHeight: "calc(100dvh - 96px)", background: T.warmIvory, borderTopLeftRadius: "var(--radius-xl)", borderTopRightRadius: "var(--radius-xl)" }}>
        {/* Header */}
        <div style={{ background: `linear-gradient(135deg, ${T.royalBurgundy} 0%, ${T.deepWine} 100%)`, padding: "26px 28px", position: "relative", flexShrink: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 6 }}>
            <div style={{ width: 46, height: 46, borderRadius: 12, background: "rgba(255,255,255,0.14)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              <Phone size={22} color="#FFFDF9" />
            </div>
            <div>
              <Dialog.Title style={{ fontFamily: F.display, fontSize: 20, fontWeight: 700, color: "#FFFDF9", margin: 0 }}>Contact Vendor</Dialog.Title>
              <Dialog.Description asChild><div style={{ fontFamily: F.ui, fontSize: 13, color: "rgba(255,253,249,0.65)", marginTop: 2 }}>{vendors.length} overdue vendor{vendors.length > 1 ? "s" : ""} need attention</div></Dialog.Description>
            </div>
          </div>
          <Dialog.Close asChild>
            <IconButton icon={X} label="Close" variant="ghost" size="sm" onClick={onClose}
              className="absolute right-[18px] top-[18px] rounded-[9px] bg-[rgba(255,255,255,0.14)] text-[rgba(255,255,255,0.85)] hover:bg-[rgba(255,255,255,0.22)]" />
          </Dialog.Close>
        </div>

        <div style={{ padding: "26px 28px 28px", display: "flex", flexDirection: "column", gap: 22 }}>

          {vendorsError && (
            <div style={{ background: "rgba(192,57,43,0.08)", border: "1px solid rgba(192,57,43,0.25)", borderRadius: 10, padding: "10px 14px", fontFamily: F.ui, fontSize: 12, color: "#C0392B", fontWeight: 600 }}>
              Failed to load live vendor contact details — showing fallback data where available.
            </div>
          )}

          {/* Vendor selector */}
          <div>
            <div style={{ fontFamily: F.ui, fontWeight: 700, fontSize: 13, color: T.luxuryBrown, marginBottom: 10 }}>Select Vendor to Contact</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {vendors.map(v => {
                const bal = v.invoiceAmt - v.paidAmt;
                const isSelected = selected === v.id;
                return (
                  <div key={v.id}
                    onClick={() => setSelected(v.id)} role="button" tabIndex={0} onKeyDown={e => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); (() => setSelected(v.id))?.(); } }}
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
                      <div style={{ marginTop: 2 }}><EntityCode type="purchaseOrder" value={v.poNumber} size="sm" /></div>
                    </div>
                    <div style={{ textAlign: "right" as const, flexShrink: 0 }}>
                      <div style={{ fontSize: 14, fontWeight: 700, color: T.crimson }}><Money value={rupees(bal)} /></div>
                      {v.daysOverdue && <div style={{ fontSize: 12, color: T.crimson, background: "rgba(192,57,43,0.10)", padding: "1px 6px", borderRadius: 4, marginTop: 2, fontVariantNumeric: "tabular-nums" }}>{v.daysOverdue}d overdue</div>}
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
              <div className="grid grid-cols-1 md:grid-cols-2" style={{ padding: "16px 18px", gap: "12px 20px" }}>
                {[
                  { label: "Contact Person", val: contact.contactPerson, icon: "👤" },
                  { label: "City / Location", val: contact.city, icon: "📍" },
                  { label: "Phone Number",    val: contact.phone,          icon: "📞" },
                ].map(row => (
                  <div key={row.label}>
                    <div style={{ fontFamily: F.ui, fontSize: 12, color: T.taupe, textTransform: "uppercase" as const, letterSpacing: "0.6px", marginBottom: 3 }}>{row.label}</div>
                    <div style={{ fontFamily: F.ui, fontSize: 13, color: T.luxuryBrown, fontWeight: 600, display: "flex", alignItems: "center", gap: 6 }}>
                      <span>{row.icon}</span>{row.val}
                    </div>
                  </div>
                ))}
              </div>
              {/* Quick action buttons */}
              <div style={{ padding: "12px 18px", borderTop: `1px solid ${T.borderDef}`, display: "flex", gap: 10 }}>
                <a href={`tel:${contact.phone}`}
                  style={{ flex: 1, height: 38, display: "flex", alignItems: "center", justifyContent: "center", gap: 7, textDecoration: "none", border: `1.5px solid rgba(30,102,64,0.22)`, borderRadius: 9, background: "rgba(30,102,64,0.06)", fontFamily: F.ui, fontSize: 12, fontWeight: 700, color: T.green }}>
                  📞 Call Now
                </a>
              </div>
            </div>
          )}



          {/* Channel picker */}
          <div>
            <div style={{ fontFamily: F.ui, fontWeight: 700, fontSize: 13, color: T.luxuryBrown, marginBottom: 8 }}>Send via</div>
            <div style={{ display: "flex", gap: 10 }}>
              {CHANNELS.map(c => {
                const active = msgType === c.key;
                const disabled = c.key === "email" ? !hasEmail : !hasPhone;
                return (
                  <button
                    key={c.key}
                    type="button"
                    disabled={disabled}
                    onClick={() => setMsgType(c.key)}
                    title={disabled ? `No ${c.key === "email" ? "email address" : "phone number"} on file for this vendor` : c.desc}
                    style={{
                      flex: 1, padding: "10px 8px", borderRadius: 10, cursor: disabled ? "not-allowed" : "pointer",
                      border: `2px solid ${active ? T.royalBurgundy : T.borderDef}`,
                      background: active ? "rgba(110,15,45,0.05)" : "#FFFFFF",
                      opacity: disabled ? 0.45 : 1,
                      fontFamily: F.ui, fontSize: 12, fontWeight: 700, color: T.luxuryBrown,
                    }}
                  >
                    <span style={{ marginRight: 6 }}>{c.icon}</span>{c.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Message preview */}
          <div>
            <div style={{ fontFamily: F.ui, fontWeight: 700, fontSize: 13, color: T.luxuryBrown, marginBottom: 8 }}>Message Preview</div>
            <div style={{ background: "#FFFFFF", border: `1px solid ${T.borderDef}`, borderRadius: 12, padding: "14px 16px", fontSize: 12, color: T.taupe, lineHeight: 1.75, whiteSpace: "pre-wrap" as const }}>
              {MESSAGE_PREVIEW}
            </div>
          </div>

          {/* Send button */}
          <Button
            variant="primary"
            fullWidth
            onClick={handleSend}
            disabled={!canSend}
            iconLeft={handedOff ? CheckCircle2 : Mail}
            className={`h-12 rounded-[12px] ${handedOff ? "bg-[#1E6640]" : "bg-gradient-to-br from-[#6E0F2D] to-[#4A0A1D]"}`}
          >
            {handedOff
              ? (msgType === "call" ? "Dialler opened" : `${CHANNELS.find(c => c.key === msgType)?.label} opened — send it there`)
              : canSend
                ? `Open ${CHANNELS.find(c => c.key === msgType)?.label} with this message`
                : `No ${msgType === "email" ? "email address" : "phone number"} on file`}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
