import React from "react";
import { motion } from "motion/react";
import { RotateCcw, ChevronLeft, Check, Printer, PackageCheck } from "lucide-react";
import { C, F, Card, Btn } from "./theme";
import { Money } from "@/shared/ui/domain/Money";
import { rupees } from "@/lib/domain/money";

/**
 * Both views deliberately report what was actually written — the return refs
 * the server generated, the real saree ids, the real customer. An earlier
 * version printed a hardcoded saree id and return ref on every single return,
 * which meant the confirmation screen was fiction.
 */

/** One saree that actually came back, with the ref the server generated. */
export interface RetailReturnResult {
  sareeId: string;
  returnRef: string;
  refundAmount: number;
}

interface RetailSuccessProps {
  /** Every piece recorded on this return — one customer, one or many sarees. */
  results: RetailReturnResult[];
  customerName: string;
  reason: string;
  canSeePrices: boolean;
  resetReturn: () => void;
  onBack: () => void;
}

export function RetailReturnSuccessView({
  results, customerName, reason, canSeePrices, resetReturn, onBack,
}: RetailSuccessProps) {
  const many = results.length > 1;
  const refundTotal = results.reduce((sum, r) => sum + r.refundAmount, 0);
  return (
    <div style={{ padding: "44px 20px", textAlign: "center" as const }}>
      <motion.div initial={{ scale: 0.5, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ type: "spring", stiffness: 200 }}>
        <div style={{ width: 80, height: 80, borderRadius: "50%", background: "rgba(192,57,43,0.10)", border: `2px solid ${C.crim}`, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 20px" }}>
          <RotateCcw size={36} color={C.crim} />
        </div>
      </motion.div>
      <div style={{ fontFamily: F.d, fontWeight: 700, fontSize: 24, color: C.text, marginBottom: 8 }}>
        {many ? `${results.length} Returns Recorded` : "Return Recorded"}
      </div>
      <div style={{ fontFamily: F.u, fontSize: 14, color: C.muted, lineHeight: 1.65, marginBottom: 20, maxWidth: "min(460px, 100%)", marginLeft: "auto", marginRight: "auto" }}>
        {many
          ? <><strong style={{ color: C.text }}>{results.length} sarees</strong> have been taken back from {customerName}.</>
          : <><strong style={{ color: C.text }}>{results[0]?.sareeId ?? "—"}</strong> has been taken back from {customerName}.</>}
        {" "}They are held under <strong style={{ color: C.text }}>Retail returns</strong> in Shop Inventory — send them to
        inventory from there once they have been checked, and they become available to sell again.
      </div>

      {/* Every ref the server generated, so the operator can write them on the
          pieces before they go on the shelf. */}
      <Card style={{ maxWidth: "min(520px, 100%)", margin: "0 auto 18px", overflow: "hidden", textAlign: "left" as const }}>
        <div style={{ padding: "10px 16px", borderBottom: `1px solid ${C.bdr}`, background: "rgba(171,56,50,0.03)" }}>
          <span style={{ fontFamily: F.m, fontSize: 12, letterSpacing: 1.5, color: C.muted, textTransform: "uppercase" as const }}>
            Return references
          </span>
        </div>
        {results.map((r, i) => (
          <div
            key={r.returnRef}
            style={{
              display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 12,
              padding: "11px 16px",
              borderBottom: i < results.length - 1 ? `1px solid ${C.bdr}` : "none",
            }}
          >
            <span style={{ minWidth: 0 }}>
              <span style={{ fontFamily: F.m, fontSize: 13, fontWeight: 700, color: C.crim }}>{r.sareeId}</span>
              <span style={{ display: "block", fontFamily: F.m, fontSize: 11.5, color: C.muted, marginTop: 2 }}>{r.returnRef}</span>
            </span>
            {canSeePrices && (
              <span style={{ fontFamily: F.u, fontSize: 13, color: C.text, fontVariantNumeric: "tabular-nums", flexShrink: 0 }}>
                <Money value={rupees(r.refundAmount)} />
              </span>
            )}
          </div>
        ))}
        {canSeePrices && (
          <div style={{ padding: "12px 16px", borderTop: `1px solid ${C.bdr}`, background: "rgba(171,56,50,0.03)", display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
            <span style={{ fontFamily: F.u, fontWeight: 600, fontSize: 14, color: C.text }}>Total refund</span>
            <span style={{ fontFamily: F.d, fontWeight: 700, fontSize: 22, color: C.crim }}><Money value={rupees(refundTotal)} /></span>
          </div>
        )}
      </Card>

      <div style={{ fontFamily: F.u, fontSize: 13, color: C.muted, marginBottom: 8 }}>
        Reason: {reason}
      </div>
      <div style={{ display: "flex", flexDirection: "column" as const, gap: 10, marginTop: 16 }}>
        <Btn label="Process Another Return" icon={<RotateCcw size={16} />} onClick={resetReturn} style={{ width: "100%", background: C.crim }} />
        <Btn label="Back to Home" icon={<ChevronLeft size={16} />} variant="ghost" onClick={onBack} style={{ width: "100%" }} />
      </div>
    </div>
  );
}

export interface WholesaleReturnResult {
  sareeId: string;
  returnRef: string;
  sareeTypeLabel: string | null;
  color: string | null;
  weight: string;
}

interface WholesaleSuccessProps {
  vendorName: string;
  results: WholesaleReturnResult[];
  onPrintTags: () => void;
  resetReturn: () => void;
  onBack: () => void;
}

export function WholesaleReturnSuccessView({
  vendorName, results, onPrintTags, resetReturn, onBack,
}: WholesaleSuccessProps) {
  const many = results.length !== 1;
  return (
    <div>
      <div style={{ padding: "44px 20px 20px", textAlign: "center" as const }}>
        <motion.div initial={{ scale: 0.5, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ type: "spring", stiffness: 200 }}>
          <div style={{ width: 80, height: 80, borderRadius: "50%", background: "rgba(30,102,64,0.10)", border: `2px solid ${C.green}`, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 20px" }}>
            <Check size={38} color={C.green} />
          </div>
        </motion.div>
        <div style={{ fontFamily: F.d, fontWeight: 700, fontSize: 24, color: C.text, marginBottom: 8 }}>
          {results.length} saree{many ? "s" : ""} recorded
        </div>
        <div style={{ fontFamily: F.u, fontSize: 14, color: C.muted, lineHeight: 1.65, maxWidth: "min(460px, 100%)", margin: "0 auto 18px" }}>
          Returned by <strong style={{ color: C.text }}>{vendorName}</strong>. {many ? "They are" : "It is"} held
          under <strong style={{ color: C.text }}>Wholesale returns</strong> in Shop Inventory. Print and attach the
          tags, then send {many ? "them" : "it"} to inventory to make {many ? "them" : "it"} sellable.
        </div>
      </div>

      <Card style={{ margin: "0 20px 16px", overflow: "hidden" }}>
        <div style={{ height: 4, background: `linear-gradient(90deg, ${C.gold}, rgba(200,155,71,0.3))` }} />
        <div style={{ padding: 4 }}>
          {results.map((r, i) => (
            <div key={r.sareeId} style={{
              display: "flex", alignItems: "center", gap: 12, padding: "14px 16px",
              borderBottom: i < results.length - 1 ? `1px solid ${C.bdr}` : "none",
            }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontFamily: F.m, fontWeight: 700, fontSize: 13, color: "#845E04" }}>{r.sareeId}</div>
                <div style={{ fontFamily: F.u, fontSize: 12.5, color: C.muted, marginTop: 3 }}>
                  {[r.sareeTypeLabel, r.color, r.weight ? `${r.weight} g` : null].filter(Boolean).join(" · ") || "—"}
                </div>
              </div>
              <span style={{ fontFamily: F.m, fontSize: 11.5, color: C.muted, flexShrink: 0 }}>{r.returnRef}</span>
            </div>
          ))}
        </div>
      </Card>

      <div style={{ padding: "0 20px", display: "flex", flexDirection: "column" as const, gap: 10 }}>
        <Btn label={`Print ${results.length} Barcode Tag${many ? "s" : ""}`} icon={<Printer size={16} />} onClick={onPrintTags} style={{ width: "100%", background: C.burg }} />
        <Btn label="Process Another Return" icon={<PackageCheck size={16} />} onClick={resetReturn} style={{ width: "100%", background: C.green }} />
        <Btn label="Back to Home" icon={<ChevronLeft size={16} />} variant="ghost" onClick={onBack} style={{ width: "100%" }} />
      </div>
    </div>
  );
}
