import React from "react";
import { CheckCircle2, AlertTriangle, TrendingUp } from "lucide-react";
import { C, F, card, inputStyle } from "./tokens";
import { POItem } from "../../../purchasing/contexts/POContext";

const MAT_TAG: Record<string, { col: string; bg: string }> = {
  Warp:   { col: "#7A5010", bg: "rgba(196,146,58,0.14)" },
  Resham: { col: "#7A5E1C", bg: "rgba(200,155,71,0.13)" },
  Jari:   { col: C.burg,    bg: "rgba(107,26,42,0.08)" },
};

function MatChip({ type }: { type: string }) {
  const cfg = MAT_TAG[type] ?? { col: C.text, bg: C.inp };
  return (
    <span style={{ fontFamily: F.u, fontSize: 10, fontWeight: 700, color: cfg.col, background: cfg.bg, padding: "2px 8px", borderRadius: 999, whiteSpace: "nowrap" as const }}>
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
          <div style={{ fontFamily: F.u, fontSize: 10, color: C.muted, textTransform: "uppercase" as const, letterSpacing: 0.5, marginBottom: 6 }}>Ordered</div>
          <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 4 }}>
            <MatChip type={m.materialType} />
          </div>
          <div style={{ fontFamily: F.u, fontSize: 12, color: C.text, marginBottom: 4 }}>{m.description || m.subtype}</div>
          <div style={{ fontFamily: F.m, fontSize: 14, fontWeight: 700, color: C.text }}>
            {m.quantity} {m.unit}
            {isKg && <span style={{ fontFamily: F.u, fontSize: 11, color: C.muted, fontWeight: 400 }}> ({(m.quantity * 1000)} g)</span>}
            {m.materialType === "Jari" && m.unit === "Buns" && <span style={{ fontFamily: F.u, fontSize: 11, color: C.muted, fontWeight: 400 }}> ({(m.quantity * 4)} Reels)</span>}
          </div>
        </div>
        {/* Received — editable */}
        <div>
          <div style={{ fontFamily: F.u, fontSize: 10, color: C.muted, textTransform: "uppercase" as const, letterSpacing: 0.5, marginBottom: 6 }}>Received</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {/* Unit Selector Button Group */}
            <div style={{ display: "flex", gap: 4 }}>
              {m.materialType === "Jari" ? (
                (["Reels", "Buns"] as const).map(u => (
                  <button
                    key={u}
                    type="button"
                    onClick={() => setReceivedUnit(prev => ({ ...prev, [i]: u }))}
                    style={{
                      flex: 1, padding: "5px 0", borderRadius: 6,
                      border: `1px solid ${receivedUnit === u ? C.burg : C.bdr}`,
                      background: receivedUnit === u ? C.burg : "#FFF",
                      color: receivedUnit === u ? "#FFF" : C.text,
                      fontFamily: F.u, fontSize: 10.5, fontWeight: 600, cursor: "pointer"
                    }}
                  >
                    {u}
                  </button>
                ))
              ) : (
                (["kg", "g"] as const).map(u => (
                  <button
                    key={u}
                    type="button"
                    onClick={() => setReceivedUnit(prev => ({ ...prev, [i]: u }))}
                    style={{
                      flex: 1, padding: "5px 0", borderRadius: 6,
                      border: `1px solid ${receivedUnit === u ? C.burg : C.bdr}`,
                      background: receivedUnit === u ? C.burg : "#FFF",
                      color: receivedUnit === u ? "#FFF" : C.text,
                      fontFamily: F.u, fontSize: 10.5, fontWeight: 600, cursor: "pointer"
                    }}
                  >
                    {u}
                  </button>
                ))
              )}
            </div>

            {/* Input Field */}
            <div style={{ position: "relative" }}>
              <input
                type="number"
                value={receivedQty ?? ""}
                onChange={e => setReceivedQty(prev => ({ ...prev, [i]: e.target.value }))}
                placeholder="0"
                style={{ ...inputStyle, fontFamily: F.m, fontSize: 14, paddingRight: 46, height: 40 }}
              />
              <span style={{ position: "absolute", right: 8, top: "50%", transform: "translateY(-50%)", fontFamily: F.u, fontSize: 10.5, fontWeight: 700, color: matColor }}>
                {receivedUnit || (m.materialType === "Jari" ? "Buns" : "kg")}
              </span>
            </div>

            {/* Auto conversion preview */}
            {receivedQty && (
              <div style={{ fontFamily: F.u, fontSize: 10.5, color: matColor, fontWeight: 600 }}>
                {m.materialType === "Jari" ? (
                  receivedUnit === "Reels"
                    ? `= ${(parseFloat(receivedQty) / 4).toFixed(2)} Buns`
                    : `= ${(parseFloat(receivedQty) * 4).toFixed(0)} Reels`
                ) : (
                  receivedUnit === "kg"
                    ? `= ${(parseFloat(receivedQty) * 1000).toFixed(0)} g`
                    : `= ${(parseFloat(receivedQty) / 1000).toFixed(3)} kg`
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
              <span style={{ fontFamily: F.u, fontSize: 11, fontWeight: 600, color: C.green }}>✓ Match</span>
            </>
          ) : cmp.diff < 0 ? (
            <>
              <AlertTriangle size={13} color={C.gold} />
              <span style={{ fontFamily: F.u, fontSize: 11, fontWeight: 600, color: C.gold }}>⚠ Short by {Math.abs(cmp.diff).toFixed(3)} {cmp.unit}</span>
              <label style={{ display: "flex", alignItems: "center", gap: 6, cursor: "pointer", marginLeft: 8 }}>
                <input type="checkbox" checked={notifySuperadmin || false} onChange={e => setNotifySuperadmin(prev => ({ ...prev, [i]: e.target.checked }))} style={{ accentColor: C.burg, cursor: "pointer" }} />
                <span style={{ fontFamily: F.u, fontSize: 10, color: C.text }}>Notify Superadmin</span>
              </label>
            </>
          ) : (
            <>
              <TrendingUp size={13} color="#1565C0" />
              <span style={{ fontFamily: F.u, fontSize: 11, fontWeight: 600, color: "#1565C0" }}>▲ Excess by {cmp.diff.toFixed(3)} {cmp.unit}</span>
            </>
          )}
        </div>
      )}

      {/* Per-item approval */}
      <div style={{ marginTop: 12, borderTop: `1px solid ${C.bdr}`, paddingTop: 12 }}>
        <div style={{ fontFamily: F.u, fontSize: 10, color: C.muted, textTransform: "uppercase" as const, letterSpacing: 0.5, marginBottom: 8 }}>Confirm This Item</div>
        <div style={{ display: "flex", gap: 8 }}>
          <button
            type="button"
            onClick={() => { setItemApproval(prev => ({ ...prev, [i]: "approved" })); setItemRejectReason(prev => ({ ...prev, [i]: "" })); }}
            style={{
              flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 6, padding: "9px 0", borderRadius: 8,
              border: `1.5px solid ${itemApproval === "approved" ? C.green : C.bdr}`,
              background: itemApproval === "approved" ? "rgba(30,102,64,0.09)" : "#FFF",
              color: itemApproval === "approved" ? C.green : C.text,
              fontFamily: F.u, fontSize: 12, fontWeight: 700, cursor: "pointer"
            }}
          >
            <CheckCircle2 size={14} /> Approved
          </button>
          <button
            type="button"
            onClick={() => setItemApproval(prev => ({ ...prev, [i]: "rejected" }))}
            style={{
              flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 6, padding: "9px 0", borderRadius: 8,
              border: `1.5px solid ${itemApproval === "rejected" ? "#C0392B" : C.bdr}`,
              background: itemApproval === "rejected" ? "rgba(192,57,43,0.08)" : "#FFF",
              color: itemApproval === "rejected" ? "#C0392B" : C.text,
              fontFamily: F.u, fontSize: 12, fontWeight: 700, cursor: "pointer"
            }}
          >
            <AlertTriangle size={14} /> Not Approved
          </button>
        </div>
        {itemApproval === "rejected" && (
          <div style={{ marginTop: 8 }}>
            <textarea
              value={itemRejectReason ?? ""}
              onChange={e => setItemRejectReason(prev => ({ ...prev, [i]: e.target.value }))}
              placeholder="Reason this item was not approved (e.g. damaged, wrong shade, torn packaging)…"
              rows={2}
              style={{ ...inputStyle, height: "auto", padding: "8px 10px", fontFamily: F.u, fontSize: 12.5, resize: "vertical" as const, borderColor: itemRejectReason?.trim() ? C.bdr : "#C0392B" }}
            />
            {!itemRejectReason?.trim() && (
              <div style={{ fontFamily: F.u, fontSize: 10.5, color: "#C0392B", marginTop: 4 }}>Reason is required for items marked Not Approved.</div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
