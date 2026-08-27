import { useEffect, useState } from "react";
import { CalendarClock, X } from "lucide-react";
import * as Dialog from "@radix-ui/react-dialog";
import { toast } from "sonner";

import { F, T } from "../../theme";
import { Invoice } from "../../types";
import { Button, IconButton, Select, SelectItem } from "../../../../shared/ui/primitives";
import { Modal } from "../../../../shared/ui/overlay";
import { rupees, formatMoney } from "@/lib/domain/money";

// ── Payment Reminders Modal ───────────────────────────────────────────────────
export function PaymentRemindersModal({ open, onClose, overdueInvoices }: { open: boolean; onClose: () => void; overdueInvoices: Invoice[] }) {
  const [selectedInvoiceId, setSelectedInvoiceId] = useState(overdueInvoices[0]?.id || "");

  useEffect(() => {
    if (overdueInvoices.length > 0 && !selectedInvoiceId) {
      setSelectedInvoiceId(overdueInvoices[0].id);
    }
  }, [overdueInvoices, selectedInvoiceId]);

  const currentInvoice = overdueInvoices.find(i => i.id === selectedInvoiceId) || overdueInvoices[0];

  // Opens WhatsApp for the selected customer with the reminder prefilled. There
  // is no outbound-messaging backend, so this previously ran a timer and
  // reported that reminders had been sent to every overdue customer when
  // nothing had been sent at all.
  const phoneDigits = (currentInvoice?.customerPhone || "").replace(/\D/g, "");
  // Indian mobile numbers are stored as 10 digits; wa.me needs a country code.
  const waNumber = phoneDigits.length === 10 ? `91${phoneDigits}` : phoneDigits;

  const handleSend = () => {
    if (!currentInvoice) return;
    if (!phoneDigits) {
      toast.error(`No phone number on file for ${currentInvoice.customer}.`);
      return;
    }
    window.open(
      `https://wa.me/${waNumber}?text=${encodeURIComponent(getPreviewText(currentInvoice))}`,
      "_blank",
      "noopener,noreferrer",
    );
    toast.success(`WhatsApp opened for ${currentInvoice.customer} — send the message there.`);
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
          <Dialog.Description asChild><div style={{ fontFamily: F.ui, fontSize: 13, color: "rgba(255,253,249,0.70)", marginTop: 4 }}>
            Send a WhatsApp reminder for any of {overdueInvoices.length} overdue invoices
          </div></Dialog.Description>
          <Dialog.Close asChild>
            <IconButton icon={X} label="Close" variant="ghost" size="sm"
              className="absolute right-4 top-4 rounded-[8px] bg-[rgba(255,255,255,0.12)] text-[rgba(255,255,255,0.85)] hover:bg-[rgba(255,255,255,0.20)]" />
          </Dialog.Close>
        </div>

        <div style={{ padding: "24px 28px 28px", display: "flex", flexDirection: "column", gap: 20, overflowY: "auto" }}>
          {/* Overdue Invoices List Selection */}
          <div>
            <span style={{ fontFamily: F.ui, fontWeight: 600, fontSize: 13, color: T.luxuryBrown, marginBottom: 8, display: "block" }}>Select Customer Invoice to Preview</span>
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
              <div style={{ background: "#FFFFFF", borderRadius: 12, border: `1px solid ${T.borderDef}`, padding: "14px 16px", whiteSpace: "pre-wrap" as const, fontFamily: F.ui, fontSize: 13, color: T.luxuryBrown, lineHeight: 1.5, maxHeight: 180, overflowY: "auto" }}>
                {getPreviewText(currentInvoice)}
              </div>
            </div>
          )}

          {/* Reminders are sent one customer at a time through WhatsApp. Scheduled
              / recurring reminders would need an outbound messaging service the
              backend does not have, so they are not offered here rather than
              being shown as options that silently do nothing. */}
          <div style={{ background: "rgba(200,155,71,0.08)", border: `1px solid rgba(200,155,71,0.28)`, borderRadius: 12, padding: "12px 14px", fontFamily: F.ui, fontSize: 12, color: T.luxuryBrown, lineHeight: 1.6 }}>
            Opens WhatsApp with this message ready to send to{" "}
            <strong>{currentInvoice?.customer ?? "the customer"}</strong>
            {phoneDigits ? <> on <strong>{currentInvoice?.customerPhone}</strong></> : <> — no phone number on file</>}.
            Pick another invoice above to remind a different customer.
          </div>
        </div>

        <div style={{ padding: "18px 28px 24px", borderTop: `1px solid ${T.borderDef}`, display: "flex", gap: 10, justifyContent: "flex-end", flexShrink: 0 }}>
          <Button variant="tertiary" onClick={onClose} className="rounded-[14px] text-[var(--text-tertiary)]">Cancel</Button>
          <Button variant="primary" onClick={handleSend} disabled={!currentInvoice || !phoneDigits} className="rounded-[14px] bg-[#6E0F2D]">
            Open WhatsApp
          </Button>
        </div>
    </Modal>
  );
}
