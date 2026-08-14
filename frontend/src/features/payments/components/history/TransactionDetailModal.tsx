import React from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { X } from "lucide-react";

import { F, T } from "../../theme";
import { PayHistRecord } from "../../types";
import { Button, IconButton } from "../../../../shared/ui/primitives";
import { Modal } from "../../../../shared/ui/overlay";
import { StatusPill, EntityCode, Money } from "@/shared/ui/domain";
import { rupees } from "@/lib/domain/money";
import { HIST_TYPE_CFG, getHistTypeIcon } from "./HistoryCard";
import type { PaymentStatus } from "@/lib/domain/status";

function payHistStatusKey(status: PayHistRecord["status"]): PaymentStatus {
  return status === "Paid" ? "paid" : status === "Partial" ? "partial" : "unpaid";
}

/** Read-only detail view for one Payment History row — the same fields the
 * card/list/table already render, laid out full-size (the "View Details"
 * action across all three view modes previously had no handler at all). */
export function TransactionDetailModal({ record, onClose }: { record: PayHistRecord; onClose: () => void }) {
  const typeCfg = HIST_TYPE_CFG[record.type];
  const { Icon } = getHistTypeIcon(record.type);
  const isReceipt = record.type === "Customer Receipt";

  const rows: [string, React.ReactNode][] = [
    ["Reference", <EntityCode key="ref" type="payment" value={record.refNo} size="sm" />],
    ["Invoice / PO", record.invoicePO ?? "—"],
    ["Payment Mode", record.mode],
    ["Recorded By", record.recordedBy],
    ["Date", record.date],
    ...(record.utr ? [["UTR / Reference ID", <span key="utr" style={{ fontFamily: F.ui, color: T.green, fontWeight: 700 }}>{record.utr}</span>] as [string, React.ReactNode]] : []),
  ];

  return (
    <Modal open onOpenChange={o => { if (!o) onClose(); }} size="sm">
      <div style={{ display: "flex", flexDirection: "column", background: T.warmIvory, borderTopLeftRadius: "var(--radius-xl)", borderTopRightRadius: "var(--radius-xl)" }}>
        <div style={{ background: `linear-gradient(120deg, ${T.royalBurgundy} 0%, ${T.deepWine} 100%)`, padding: "22px 26px", display: "flex", alignItems: "center", justifyContent: "space-between", flexShrink: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{ width: 40, height: 40, borderRadius: 10, background: "rgba(255,255,255,0.12)", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Icon size={18} color="#FFFDF9" />
            </div>
            <div>
              <Dialog.Title style={{ fontFamily: F.display, fontSize: 17, fontWeight: 700, color: "#FFFDF9" }}>{record.party}</Dialog.Title>
              <span style={{ display: "inline-block", marginTop: 3, padding: "2px 8px", borderRadius: 6, fontFamily: F.ui, fontSize: 12, fontWeight: 700, background: typeCfg.bg, color: typeCfg.color }}>{record.type}</span>
            </div>
          </div>
          <Dialog.Close asChild>
            <IconButton icon={X} label="Close" variant="ghost" size="sm" onClick={onClose}
              className="rounded-[8px] bg-[rgba(255,255,255,0.12)] text-[rgba(255,255,255,0.85)] hover:bg-[rgba(255,255,255,0.20)]" />
          </Dialog.Close>
        </div>

        <div style={{ padding: "22px 26px", display: "flex", flexDirection: "column", gap: 18, flex: 1, minHeight: 0, overflowY: "auto" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", background: "#FFFFFF", border: `1px solid ${T.borderDef}`, borderRadius: 12, padding: "16px 18px" }}>
            <div>
              <div style={{ fontFamily: F.ui, fontSize: 12, color: T.taupe, textTransform: "uppercase" as const, letterSpacing: "0.6px", marginBottom: 4 }}>
                {isReceipt ? "Amount Received" : "Amount Paid"}
              </div>
              <div style={{ fontFamily: F.display, fontSize: 26, fontWeight: 800, color: isReceipt ? T.green : T.crimson }}>
                {isReceipt ? "+" : "−"}<Money value={rupees(record.amount)} />
              </div>
            </div>
            <StatusPill taxonomy="payment" status={payHistStatusKey(record.status)} />
          </div>

          <div style={{ background: "#FFFFFF", border: `1px solid ${T.borderDef}`, borderRadius: 12, padding: "6px 18px" }}>
            {rows.map(([label, value], i) => (
              <div key={label} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 0", borderTop: i > 0 ? `1px solid ${T.borderDef}` : "none" }}>
                <span style={{ fontFamily: F.ui, fontSize: 13, color: T.taupe }}>{label}</span>
                <span style={{ fontFamily: F.ui, fontSize: 13, color: T.luxuryBrown, fontWeight: 600, textAlign: "right" as const }}>{value}</span>
              </div>
            ))}
          </div>

          {record.description && (
            <div>
              <div style={{ fontFamily: F.ui, fontSize: 12, color: T.taupe, textTransform: "uppercase" as const, letterSpacing: "0.6px", marginBottom: 6 }}>Description</div>
              <div style={{ background: "#FFFFFF", border: `1px solid ${T.borderDef}`, borderRadius: 10, padding: "12px 14px", fontFamily: F.ui, fontSize: 13, color: T.luxuryBrown, lineHeight: 1.5 }}>
                {record.description}
              </div>
            </div>
          )}
        </div>

        <div style={{ padding: "16px 26px 22px", borderTop: `1px solid ${T.borderDef}`, display: "flex", justifyContent: "flex-end", flexShrink: 0 }}>
          <Button variant="primary" onClick={onClose} className="rounded-full bg-[#6E0F2D]">Close</Button>
        </div>
      </div>
    </Modal>
  );
}
