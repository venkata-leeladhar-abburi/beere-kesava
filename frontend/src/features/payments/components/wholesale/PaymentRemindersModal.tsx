import { useEffect, useState } from "react";
import { CalendarClock, X } from "lucide-react";
import * as Dialog from "@radix-ui/react-dialog";
import { toast } from "sonner";

import { F, T } from "../../theme";
import { Invoice } from "../../types";
import { Button, Checkbox, IconButton, Select, SelectItem } from "../../../../shared/ui/primitives";
import { Modal } from "../../../../shared/ui/overlay";
import { rupees, formatMoney } from "@/lib/domain/money";

// ── Payment Reminders Modal ───────────────────────────────────────────────────
export function PaymentRemindersModal({ open, onClose, overdueInvoices }: { open: boolean; onClose: () => void; overdueInvoices: Invoice[] }) {
  const [sending, setSending] = useState(false);
  const [channels, setChannels] = useState({ whatsapp: true });
  const [selectedInvoiceId, setSelectedInvoiceId] = useState(overdueInvoices[0]?.id || "");
  const [scheduleType, setScheduleType] = useState("immediate");

  useEffect(() => {
    if (overdueInvoices.length > 0 && !selectedInvoiceId) {
      setSelectedInvoiceId(overdueInvoices[0].id);
    }
  }, [overdueInvoices, selectedInvoiceId]);

  const currentInvoice = overdueInvoices.find(i => i.id === selectedInvoiceId) || overdueInvoices[0];

  const handleSend = () => {
    setSending(true);
    setTimeout(() => {
      setSending(false);
      toast.success(`Successfully sent payment reminders to ${overdueInvoices.length} customers!`);
      onClose();
    }, 1200);
  };

  const getPreviewText = (inv: Invoice) => {
    if (!inv) return "";
    const balance = inv.total - inv.paid;
    return `Dear ${inv.customer},\n\nThis is a friendly reminder from Beere Kesava & Brothers Silks. Your invoice ${inv.id} for ${formatMoney(rupees(balance))} was due on ${inv.dueDate} (${inv.daysOverdue || 0} days overdue).\n\nPlease process the payment at your earliest convenience. If already paid, please share the UTR reference.\n\nRegards,\nAccounts Team\nBeere Kesava & Brothers Silks`;
  };

  return (
    <Modal open={open} onOpenChange={o => !o && onClose()} size="md">
        <div style={{ background: `linear-gradient(120deg, ${T.royalBurgundy} 0%, ${T.deepWine} 100%)`, padding: "24px 28px", position: "relative", flexShrink: 0 }}>
          <Dialog.Title asChild>
            <div style={{ fontFamily: F.display, fontSize: 20, fontWeight: 700, color: "#FFFDF9", display: "flex", alignItems: "center", gap: 10 }}>
              <CalendarClock size={22} color={T.antiqueGold} />
              Set Payment Reminders
            </div>
          </Dialog.Title>
          <div style={{ fontFamily: F.ui, fontSize: 13, color: "rgba(255,253,249,0.70)", marginTop: 4 }}>
            Configure and schedule alerts for {overdueInvoices.length} overdue invoices
          </div>
          <Dialog.Close asChild>
            <IconButton icon={X} label="Close" variant="ghost" size="sm"
              className="absolute right-4 top-4 rounded-[8px] bg-[rgba(255,255,255,0.12)] text-[rgba(255,255,255,0.85)] hover:bg-[rgba(255,255,255,0.20)]" />
          </Dialog.Close>
        </div>

        <div style={{ padding: "24px 28px 28px", display: "flex", flexDirection: "column", gap: 20, overflowY: "auto" }}>
          {/* Overdue Invoices List Selection */}
          <div>
            <label style={{ fontFamily: F.ui, fontWeight: 600, fontSize: 13, color: T.luxuryBrown, marginBottom: 8, display: "block" }}>Select Customer Invoice to Preview</label>
            <Select value={selectedInvoiceId} onValueChange={setSelectedInvoiceId} className="w-full">
              {overdueInvoices.map(i => (
                <SelectItem key={i.id} value={i.id}>
                  {i.customer} ({i.id}) — {formatMoney(rupees(i.total - i.paid))} ({i.daysOverdue}d late)
                </SelectItem>
              ))}
            </Select>
          </div>

          {/* Reminder Preview Box */}
          {currentInvoice && (
            <div>
              <div style={{ fontFamily: F.ui, fontWeight: 700, fontSize: 13, color: T.luxuryBrown, marginBottom: 8 }}>Reminder Message Preview</div>
              <div style={{ background: "#FFFFFF", borderRadius: 12, border: `1px solid ${T.borderDef}`, padding: "14px 16px", whiteSpace: "pre-wrap" as const, fontFamily: F.mono, fontSize: 12, color: T.luxuryBrown, lineHeight: 1.5, maxHeight: 180, overflowY: "auto" }}>
                {getPreviewText(currentInvoice)}
              </div>
            </div>
          )}

          {/* Channels Choice */}
          <div>
            <div style={{ fontFamily: F.ui, fontWeight: 700, fontSize: 13, color: T.luxuryBrown, marginBottom: 10 }}>Notification Channels</div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: 14 }}>
              {[
                { key: "whatsapp", label: "WhatsApp Chat", sub: "Auto-send message" }
              ].map(ch => (
                <label key={ch.key} style={{ display: "flex", flexDirection: "column", gap: 4, padding: "12px 14px", background: "#FFFFFF", border: `1.5px solid ${channels[ch.key as keyof typeof channels] ? T.royalBurgundy : T.borderDef}`, borderRadius: 12, cursor: "pointer", position: "relative" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <Checkbox
                      checked={channels[ch.key as keyof typeof channels]}
                      onCheckedChange={() => setChannels(prev => ({ ...prev, [ch.key]: !prev[ch.key as keyof typeof channels] }))}
                    />
                    <span style={{ fontFamily: F.ui, fontSize: 13, fontWeight: 700, color: T.luxuryBrown }}>{ch.label}</span>
                  </div>
                  <span style={{ fontFamily: F.ui, fontSize: 12, color: T.taupe, marginLeft: 22 }}>{ch.sub}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Alert Schedule options */}
          <div>
            <div style={{ fontFamily: F.ui, fontWeight: 700, fontSize: 13, color: T.luxuryBrown, marginBottom: 10 }}>Reminder Schedule</div>
            <div style={{ display: "flex", gap: 10 }}>
              {[
                { key: "immediate", label: "Send Immediately", desc: "One-time broadcast" },
                { key: "daily", label: "Daily (Until Paid)", desc: "Gentle nudge daily" },
                { key: "weekly", label: "Weekly (Every Mon)", desc: "Structured reminder" }
              ].map(s => (
                <Button
                  key={s.key}
                  variant="secondary"
                  onClick={() => setScheduleType(s.key)}
                  className={`h-auto flex-1 flex-col rounded-[10px] py-3 text-center ${scheduleType === s.key ? "border-[1.5px] border-[#6E0F2D] bg-[rgba(110,15,45,0.05)]" : "border-[1.5px] bg-white"}`}
                >
                  <div style={{ fontSize: 13, fontWeight: 700, color: scheduleType === s.key ? T.royalBurgundy : T.luxuryBrown }}>{s.label}</div>
                  <div style={{ fontSize: 12, color: T.taupe, marginTop: 4 }}>{s.desc}</div>
                </Button>
              ))}
            </div>
          </div>
        </div>

        <div style={{ padding: "18px 28px 24px", borderTop: `1px solid ${T.borderDef}`, display: "flex", gap: 10, justifyContent: "flex-end", flexShrink: 0 }}>
          <Button variant="tertiary" onClick={onClose} className="rounded-full text-[var(--text-tertiary)]">Cancel</Button>
          <Button variant="primary" onClick={handleSend} loading={sending} className="rounded-full bg-[#6E0F2D]">
            Confirm & Send
          </Button>
        </div>
    </Modal>
  );
}
