import * as Dialog from "@radix-ui/react-dialog";
import { X, Share2 } from "lucide-react";
import { PurchaseOrder } from "../contexts/POContext";
import { toast } from "sonner";
import { Button, IconButton } from "../../../shared/ui/primitives";
import { Modal } from "../../../shared/ui/overlay";
import { DocumentViewer, PurchaseOrderDocument, DEFAULT_LETTERHEAD_FIRM } from "../../../shared/ui/document";

// ─── Design tokens ────────────────────────────────────────────────────────────
const T = {
  silkCream:     "#F7F2EA",
  warmIvory:     "#FFFDF9",
  royalBurgundy: "#6E0F2D",
  darkBurgundy:  "#3D0E1A",
  antiqueGold:   "#C89B47",
  goldLight:     "#E7C983",
  luxuryBrown:   "#3B2314",
  warmCream:     "#F5E8D0",
  taupe:         "#69635E",
  crimson:       "#C0392B",
  green:         "#1E6640",
  borderDef:     "rgba(110,15,45,0.10)",
  borderGold:    "rgba(200,155,71,0.22)",
};
const F = {
  display: "'Plus Jakarta Sans', sans-serif",
  ui:      "'Inter', sans-serif",
  mono:    "'JetBrains Mono', monospace",
};

function StatusBadge({ status }: { status: PurchaseOrder["status"] }) {
  const cfg = {
    pending:  { text: "Pending Approval", color: T.antiqueGold, bg: "rgba(200,155,71,0.12)" },
    approved: { text: "Approved",         color: T.green,       bg: "rgba(30,102,64,0.10)" },
    rejected: { text: "Rejected",         color: T.crimson,     bg: "rgba(192,57,43,0.10)" },
    received: { text: "Received",         color: T.taupe,       bg: "rgba(139,112,96,0.12)" },
  }[status];
  return (
    <span style={{
      fontFamily: F.mono, fontSize: 12, fontWeight: 600,
      color: cfg.color, background: cfg.bg,
      padding: "3px 10px", borderRadius: 6,
    }}>
      {cfg.text}
    </span>
  );
}

interface PODocumentModalProps {
  open: boolean;
  onClose: () => void;
  po: PurchaseOrder | null;
  isApproved?: boolean;
}

export function PODocumentModal({ open, onClose, po, isApproved }: PODocumentModalProps) {
  if (!po) return null;

  const todayDisplay = new Date().toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
  const approvedDisplay = po.approvedDate
    ? new Date(po.approvedDate).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })
    : todayDisplay;

  const showApproved = isApproved || po.status === "approved" || po.status === "received";

  return (
    <Modal open={open} onOpenChange={o => !o && onClose()} size="xl">
      <div style={{ display: "flex", flexDirection: "column", height: "85vh" }}>
        {/* Header */}
        <div style={{
          background: T.darkBurgundy,
          padding: "16px 20px",
          display: "flex",
          alignItems: "flex-start",
          justifyContent: "space-between",
          flexShrink: 0,
        }}>
          <div>
            <Dialog.Title asChild>
              <div style={{ fontFamily: F.display, fontWeight: 700, fontSize: 16, color: "#FFFDF9", marginBottom: 4 }}>
                Purchase Order Document
              </div>
            </Dialog.Title>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <span style={{ fontFamily: F.mono, fontSize: 12, color: T.antiqueGold }}>{po.poNumber}</span>
              <StatusBadge status={po.status} />
              {po.urgency === "Urgent" && (
                <span style={{ fontFamily: F.mono, fontSize: 12, color: T.crimson, background: "rgba(192,57,43,0.20)", padding: "2px 8px", borderRadius: 5 }}>🔴 URGENT</span>
              )}
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <Button
              onClick={() => toast.success("PO document ready — share with vendor via WhatsApp or email")}
              variant="secondary" size="sm" iconLeft={Share2}
              className="bg-white/10 border-white/20 text-white hover:bg-white/20"
            >
              Share with Vendor
            </Button>
            <Dialog.Close asChild>
              <IconButton
                label="Close"
                icon={X}
                variant="secondary"
                size="md"
                shape="circle"
                className="bg-white/10 border-white/20 text-white"
              />
            </Dialog.Close>
          </div>
        </div>

        {/* Document body — the real Part H.3 PurchaseOrderDocument, rendered
            once and reused for screen preview, Print and Download via
            DocumentViewer/useDocument (Part C.1). Replaces the bespoke
            print-area card and its raw calls to window's print method. */}
        <DocumentViewer>
          <PurchaseOrderDocument
            poNumber={po.poNumber}
            submittedDate={new Date(po.submittedDate).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}
            deliveryDate={po.deliveryDate ? new Date(po.deliveryDate).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }) : undefined}
            firm={DEFAULT_LETTERHEAD_FIRM}
            supplier={{ name: po.vendor, city: po.vendorCity, contact: po.vendorContact }}
            materials={po.materials}
            totalValue={po.totalValue}
            urgency={po.urgency}
            notesVendor={po.notesVendor}
            notesAdmin={po.notesAdmin}
            raisedBy={po.raisedBy}
            approvedBy={showApproved ? "Superadmin" : undefined}
            approvedDate={showApproved ? approvedDisplay : undefined}
            statusLabel={po.status === "rejected" ? "REJECTED" : po.status === "received" ? "RECEIVED" : undefined}
          />
        </DocumentViewer>
      </div>
    </Modal>
  );
}
