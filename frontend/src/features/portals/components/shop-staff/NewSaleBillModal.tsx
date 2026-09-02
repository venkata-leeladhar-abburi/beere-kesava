import { ChevronLeft } from "lucide-react";
import { C, F } from "./theme";
import { IconButton } from "../../../../shared/ui/primitives";
import {
  DocumentViewer,
  RetailBillDocument,
  DEFAULT_LETTERHEAD_FIRM,
} from "../../../../shared/ui/document";
import type { SaleLine } from "./sale-cart";

interface NewSaleBillModalProps {
  lines: SaleLine[];
  custName: string;
  phone: string;
  custAddress?: string;
  payment: "cash" | "upi" | "card" | "other" | null;
  payRef?: string;
  total: number;
  /** The bill's own reference — empty while previewing a sale not yet recorded. */
  billRef?: string;
  /** Every SaleRecord reference on this bill — listed when the basket has more than one. */
  saleRefs?: string[];
  isMobile?: boolean;
  isTablet?: boolean;
  onClose: () => void;
}

/**
 * This is the exact same RetailBillDocument that gets rasterised to PDF and
 * sent on WhatsApp (see NewSaleSuccessView) — the counter preview used to be
 * a bespoke layout that drifted from what the customer actually receives.
 */
export function NewSaleBillModal({
  lines,
  custName,
  phone,
  custAddress,
  payment,
  payRef,
  total,
  billRef,
  saleRefs,
  isMobile,
  onClose,
}: NewSaleBillModalProps) {
  const ref = billRef || "—";
  const billDate = new Date().toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });

  return (
    <div style={{ display: "flex", flexDirection: "column", height: isMobile ? "100vh" : "85vh" }}>
      <div style={{ background: C.burg, padding: "16px 20px", display: "flex", alignItems: "center", gap: 12, flexShrink: 0 }}>
        <IconButton icon={ChevronLeft} label="Back" variant="ghost" onClick={onClose} className="text-white" />
        <span style={{ fontFamily: F.d, fontWeight: 600, fontSize: 18, color: "#FFF" }}>Bill Preview</span>
      </div>
      <DocumentViewer fileName={ref} documentTitle={`Retail Bill ${ref}`} className="flex-1">
        <RetailBillDocument
          billRef={ref}
          billDate={billDate}
          firm={DEFAULT_LETTERHEAD_FIRM}
          customerName={custName}
          customerPhone={phone.trim() || undefined}
          customerAddress={custAddress}
          lines={lines.map(l => ({
            sareeId: l.id,
            name: l.name,
            type: l.type,
            design: l.design,
            soldPrice: l.soldPrice,
            originalPrice: l.originalPrice,
          }))}
          total={total}
          paymentMethod={payment ?? undefined}
          paymentRef={payRef}
          saleRefs={saleRefs}
        />
      </DocumentViewer>
    </div>
  );
}
