import React from "react";
import { CheckCircle2, AlertTriangle, TrendingUp } from "lucide-react";
import { C, F, card } from "./tokens";
import { POItem } from "@/features/purchasing";
import { Button, Checkbox, NumberInput, Textarea } from "../../../../shared/ui/primitives";

const MAT_TAG: Record<string, { col: string; bg: string }> = {
  Warp:   { col: "#7A5010", bg: "rgba(196,146,58,0.14)" },
  Resham: { col: "#7A5E1C", bg: "rgba(200,155,71,0.13)" },
  Jari:   { col: C.burg,    bg: "rgba(110,15,45,0.08)" },
};

function MatChip({ type }: { type: string }) {
  const cfg = MAT_TAG[type] ?? { col: C.text, bg: C.inp };
  return (
    <span style={{ fontFamily: F.u, fontSize: 12, fontWeight: 700, color: cfg.col, background: cfg.bg, padding: "2px 8px", borderRadius: 999, whiteSpace: "nowrap" as const }}>
      {type}
    </span>
  );
}

interface GRNItemVerificationCardProps {
  material: POItem;
  index: number;
  comparison: { diff: number; unit: string } | null;
  receivedQty: string;
  setReceivedQty: React.Dispatch<React.SetStateAction<Record<number, string>>>;
  receivedUnit: "kg" | "g" | "Reels" | "Buns";
  setReceivedUnit: React.Dispatch<React.SetStateAction<Record<number, "kg" | "g" | "Reels" | "Buns">>>;
  notifySuperadmin: boolean;
  setNotifySuperadmin: React.Dispatch<React.SetStateAction<Record<number, boolean>>>;
  itemApproval: "approved" | "rejected" | undefined;
  setItemApproval: React.Dispatch<React.SetStateAction<Record<number, "approved" | "rejected">>>;
  itemRejectReason: string;
  setItemRejectReason: React.Dispatch<React.SetStateAction<Record<number, string>>>;
}

export function GRNItemVerificationCard({
  material: m,
  index: i,
  comparison: cmp,
  receivedQty,
  setReceivedQty,
  receivedUnit,
  setReceivedUnit,
  notifySuperadmin,
  setNotifySuperadmin,
  itemApproval,
  setItemApproval,
  itemRejectReason,
  setItemRejectReason
}: GRNItemVerificationCardProps) {
  const isKg = m.unit.toLowerCase() === "kg";
  const matColor = m.materialType === "Warp" ? "#7A5010" : m.materialType === "Resham" ? "#7A5E1C" : C.burg;

  return (
    <div style={{ ...card, padding: 14 }}>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        {/* Ordered — read-only */}
        <div>
          <div style={{ fontFamily: F.u, fontSize: 12, color: C.muted, textTransform: "uppercase" as const, letterSpacing: 0.5, marginBottom: 6 }}>Ordered</div>
          <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 4 }}>
            <MatChip type={m.materialType} />
          </div>
          <div style={{ fontFamily: F.u, fontSize: 12, color: C.text, marginBottom: 4 }}>{m.description || m.subtype}</div>
          <div style={{ fontFamily: F.m, fontSize: 14, fontWeight: 700, color: C.text }}>
            {m.quantity} {m.unit}
            {isKg && <span style={{ fontFamily: F.u, fontSize: 12, color: C.muted, fontWeight: 400 }}> ({(m.quantity * 1000)} g)</span>}
            {m.materialType === "Jari" && m.unit === "Buns" && <span style={{ fontFamily: F.u, fontSize: 12, color: C.muted, fontWeight: 400 }}> ({(m.quantity / 4)} Reels)</span>}
          </div>
        </div>
        {/* Received — editable */}
        <div>
          <div style={{ fontFamily: F.u, fontSize: 12, color: C.muted, textTransform: "uppercase" as const, letterSpacing: 0.5, marginBottom: 6 }}>Received</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {/* Unit Selector Button Group */}
            <div style={{ display: "flex", gap: 4 }}>
              {m.materialType === "Jari" ? (
                (["Reels", "Buns"] as const).map(u => (
                  <Button
                    key={u}
                    type="button"
                    variant={receivedUnit === u ? "primary" : "secondary"}
                    size="sm"
                    fullWidth
                    onClick={() => setReceivedUnit(prev => ({ ...prev, [i]: u }))}
                    className={receivedUnit === u ? "rounded-md bg-[#6E0F2D] hover:bg-[#6E0F2D]" : "rounded-md"}
                  >
                    {u}
                  </Button>
                ))
              ) : (
                (["kg", "g"] as const).map(u => (
                  <Button
                    key={u}
                    type="button"
                    variant={receivedUnit === u ? "primary" : "secondary"}
                    size="sm"
                    fullWidth
                    onClick={() => setReceivedUnit(prev => ({ ...prev, [i]: u }))}
                    className={receivedUnit === u ? "rounded-md bg-[#6E0F2D] hover:bg-[#6E0F2D]" : "rounded-md"}
                  >
                    {u}
                  </Button>
                ))
              )}
            </div>

            {/* Input Field */}
            <div style={{ position: "relative" }}>
              <NumberInput
                value={receivedQty === "" || receivedQty == null ? "" : Number(receivedQty)}
                onValueChange={v => setReceivedQty(prev => ({ ...prev, [i]: v === "" ? "" : String(v) }))}
                step={0.01}
                placeholder="0"
                className="font-mono pr-12"
              />
              <span style={{ position: "absolute", right: 8, top: "50%", transform: "translateY(-50%)", fontFamily: F.u, fontSize: 12, fontWeight: 700, color: matColor }}>
                {receivedUnit || (m.materialType === "Jari" ? "Buns" : "kg")}
              </span>
            </div>

            {/* Auto conversion preview */}
            {receivedQty && (
              <div style={{ fontFamily: F.u, fontSize: 12, color: matColor, fontWeight: 600 }}>
                {m.materialType === "Jari" ? (
                  receivedUnit === "Reels"
                    ? `= ${(Number(receivedQty) / 4).toFixed(2)} Buns`
                    : `= ${(Number(receivedQty) * 4).toFixed(0)} Reels`
                ) : (
                  receivedUnit === "kg"
                    ? `= ${(Number(receivedQty) * 1000).toFixed(0)} g`
                    : `= ${(Number(receivedQty) / 1000).toFixed(3)} kg`
                )}
              </div>
            )}
          </div>
        </div>
      </div>
      {cmp && (
        <div style={{ marginTop: 10, display: "flex", alignItems: "center", gap: 5 }}>
          {cmp.diff === 0 ? (
            <>
              <CheckCircle2 size={13} color={C.green} />
              <span style={{ fontFamily: F.u, fontSize: 12, fontWeight: 600, color: C.green }}>✓ Match</span>
            </>
          ) : cmp.diff < 0 ? (
            <>
              <AlertTriangle size={13} color={C.gold} />
              <span style={{ fontFamily: F.u, fontSize: 12, fontWeight: 600, color: C.gold }}>⚠ Short by {Math.abs(cmp.diff).toFixed(3)} {cmp.unit}</span>
              <span style={{ display: "flex", alignItems: "center", gap: 6, cursor: "pointer", marginLeft: 8 }}>
                <Checkbox checked={notifySuperadmin || false} onCheckedChange={checked => setNotifySuperadmin(prev => ({ ...prev, [i]: checked === true }))} />
                <span style={{ fontFamily: F.u, fontSize: 12, color: C.text }}>Notify Superadmin</span>
              </span>
            </>
          ) : (
            <>
              <TrendingUp size={13} color="#1565C0" />
              <span style={{ fontFamily: F.u, fontSize: 12, fontWeight: 600, color: "#1565C0" }}>▲ Excess by {cmp.diff.toFixed(3)} {cmp.unit}</span>
            </>
          )}
        </div>
      )}

      {/* Per-item approval */}
      <div style={{ marginTop: 12, borderTop: `1px solid ${C.bdr}`, paddingTop: 12 }}>
        <div style={{ fontFamily: F.u, fontSize: 12, color: C.muted, textTransform: "uppercase" as const, letterSpacing: 0.5, marginBottom: 8 }}>Confirm This Item</div>
        <div style={{ display: "flex", gap: 8 }}>
          <Button
            type="button"
            variant="tertiary"
            fullWidth
            iconLeft={CheckCircle2}
            onClick={() => { setItemApproval(prev => ({ ...prev, [i]: "approved" })); setItemRejectReason(prev => ({ ...prev, [i]: "" })); }}
            className={itemApproval === "approved"
              ? "rounded-lg border-[1.5px] border-[#1E6640] bg-[rgba(30,102,64,0.09)] text-[#1E6640]"
              : "rounded-lg border-[1.5px] border-[rgba(110,15,45,0.12)] bg-white"}
          >
            Approved
          </Button>
          <Button
            type="button"
            variant="tertiary"
            fullWidth
            iconLeft={AlertTriangle}
            onClick={() => setItemApproval(prev => ({ ...prev, [i]: "rejected" }))}
            className={itemApproval === "rejected"
              ? "rounded-lg border-[1.5px] border-[#C0392B] bg-[rgba(192,57,43,0.08)] text-[#C0392B]"
              : "rounded-lg border-[1.5px] border-[rgba(110,15,45,0.12)] bg-white"}
          >
            Not Approved
          </Button>
        </div>
        {itemApproval === "rejected" && (
          <div style={{ marginTop: 8 }}>
            <Textarea
              value={itemRejectReason ?? ""}
              onChange={e => setItemRejectReason(prev => ({ ...prev, [i]: e.target.value }))}
              placeholder="Reason this item was not approved (e.g. damaged, wrong shade, torn packaging)…"
              rows={2}
              invalid={!itemRejectReason?.trim()}
              className="resize-y text-xs"
            />
            {!itemRejectReason?.trim() && (
              <div style={{ fontFamily: F.u, fontSize: 12, color: "#C0392B", marginTop: 4 }}>Reason is required for items marked Not Approved.</div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
