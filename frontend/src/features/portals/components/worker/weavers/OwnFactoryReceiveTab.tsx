import React, { useState } from "react";
import { Camera, UploadCloud, CheckCircle2, AlertTriangle, Plus, Printer } from "lucide-react";
import { C, F, card, inputStyle, btnPrimary } from "../tokens";
import { INITIAL_RATES } from "../../../../pricing/components/RatesPricingPage";
import { FieldLabel } from "./shared";
import { MaterialSplitPanel, type MatSplit } from "./MaterialSplitPanel";
import { WeaverSigBlock } from "./WeaverSigBlock";

// ─── Receive Sarees — Own Factory tab ────────────────────────────────────────
// Extracted verbatim from ReceiveSareesPage's `activeSection === "own"` branch;
// this tab's state is entirely self-contained (does not interact with the
// outsourced-weaver flow), so it lives as its own component.
export function OwnFactoryReceiveTab() {
  const [ownMatEdits, setOwnMatEdits] = useState<Partial<MatSplit>>({});
  const [ownTypeCode, setOwnTypeCode] = useState(INITIAL_RATES[0].code);
  const [sareeCount] = useState(4);
  const [loomNum, setLoomNum] = useState("");
  const [ownWeight, setOwnWeight] = useState("");
  const [ownPhoto, setOwnPhoto] = useState(false);
  // own factory signature
  const [ownSigMethod, setOwnSigMethod] = useState<"none" | "here" | "remote">("none");
  const [ownSigned, setOwnSigned] = useState(false);
  const [ownRemoteSent, setOwnRemoteSent] = useState(false);
  const [ownRemoteConfirmed, setOwnRemoteConfirmed] = useState(false);

  const ownSareeId = loomNum ? `BKB-L${loomNum}-00${sareeCount}` : "—";

  const sigOk = (ownSigMethod === "here" && ownSigned) || (ownSigMethod === "remote" && ownRemoteConfirmed);

  return (
    <>
      <div style={{ margin: "10px 16px 0" }}>
        <FieldLabel>Which loom?</FieldLabel>
        <input type="number" value={loomNum} onChange={e => setLoomNum(e.target.value)} placeholder="Loom Number"
          style={{ ...inputStyle, fontFamily: F.m, fontSize: 14, height: 46 }} />
      </div>

      <div style={{ ...card, margin: "10px 16px 10px", padding: 14 }}>
        <div style={{ fontFamily: F.u, fontSize: 13, fontWeight: 600, color: C.text, marginBottom: 12 }}>
          Saree #{sareeCount} {loomNum ? `· Loom ${loomNum}` : ""}
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 10 }}>
          <div>
            <FieldLabel>Weight (grams)</FieldLabel>
            <div style={{ position: "relative" }}>
              <input type="number" value={ownWeight} onChange={e => setOwnWeight(e.target.value)} placeholder="0"
                style={{ ...inputStyle, height: 52, fontFamily: F.m, fontSize: 18 }} />
            </div>
            {ownWeight && (
              <div style={{ display: "flex", alignItems: "center", gap: 4, marginTop: 4 }}>
                {parseFloat(ownWeight) >= 600 ? <CheckCircle2 size={11} color={C.green} /> : <AlertTriangle size={11} color={C.crim} />}
                <span style={{ fontFamily: F.u, fontSize: 12, color: parseFloat(ownWeight) >= 600 ? C.green : C.crim }}>
                  {parseFloat(ownWeight) >= 600 ? "OK" : "Too low"}
                </span>
              </div>
            )}
          </div>
          <div>
            <FieldLabel>Photo</FieldLabel>
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              <button onClick={() => setOwnPhoto(true)} style={{ height: 38, background: ownPhoto ? "#F5F5F5" : C.burg, border: ownPhoto ? `1px solid ${C.bdr}` : "none", borderRadius: 8, fontFamily: F.u, fontSize: 12, fontWeight: 600, color: ownPhoto ? C.green : "#FFF", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 4 }}>
                <Camera size={12} color={ownPhoto ? C.green : "#FFF"} /> {ownPhoto ? "Taken ✓" : "Camera"}
              </button>
              <button onClick={() => setOwnPhoto(true)} style={{ height: 38, background: "#FFF", border: `1px solid ${C.burg}`, borderRadius: 8, fontFamily: F.u, fontSize: 12, fontWeight: 600, color: C.burg, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 4 }}>
                <UploadCloud size={12} /> Gallery
              </button>
            </div>
          </div>
        </div>

        <div style={{ marginBottom: 10 }}>
          <FieldLabel>Saree Type</FieldLabel>
          <select value={ownTypeCode} onChange={e => { setOwnTypeCode(e.target.value); setOwnMatEdits({}); }}
            style={{ ...inputStyle, height: 44, appearance: "none", cursor: "pointer" }}>
            {INITIAL_RATES.map(r => <option key={r.code} value={r.code}>{r.code} · {r.type}</option>)}
          </select>
        </div>

        <MaterialSplitPanel
          typeCode={ownTypeCode}
          weight={ownWeight}
          edits={ownMatEdits}
          onEdit={setOwnMatEdits}
        />

        {ownWeight && ownPhoto && loomNum && (
          <div style={{ textAlign: "center", marginBottom: 10 }}>
            <div style={{ fontFamily: F.u, fontSize: 12, color: C.muted, marginBottom: 2 }}>Saree ID</div>
            <div style={{ fontFamily: F.m, fontSize: 16, fontWeight: 600, color: C.burg }}>{ownSareeId}</div>
          </div>
        )}

        <div style={{ display: "flex", gap: 8 }}>
          <button style={{ flex: 1, height: 42, background: "#FFF", border: `1px solid ${C.gold}`, borderRadius: 999, fontFamily: F.u, fontSize: 12, fontWeight: 600, color: C.gold, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 5 }}>
            <Printer size={12} /> Print Tag
          </button>
          <button style={{ flex: 1, height: 42, background: "#FFF", border: `1px solid ${C.burg}`, borderRadius: 999, fontFamily: F.u, fontSize: 12, fontWeight: 600, color: C.burg, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 5 }}>
            <Plus size={12} /> Next Saree
          </button>
        </div>
      </div>

      <WeaverSigBlock
        weaverName="Loom Operator"
        sigMethod={ownSigMethod} setSigMethod={setOwnSigMethod}
        signed={ownSigned} setSigned={setOwnSigned}
        remoteSent={ownRemoteSent} setRemoteSent={setOwnRemoteSent}
        remoteConfirmed={ownRemoteConfirmed} setRemoteConfirmed={setOwnRemoteConfirmed}
      />

      <div style={{ padding: "14px 16px 0" }}>
        {!sigOk && (
          <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 8, padding: "8px 12px", background: "rgba(220,53,69,0.08)", border: "1px solid rgba(220,53,69,0.20)", borderRadius: 8 }}>
            <AlertTriangle size={13} color={C.crim} />
            <span style={{ fontFamily: F.u, fontSize: 12, color: C.crim }}>Operator signature required to complete batch</span>
          </div>
        )}
        <button
          style={{ ...btnPrimary, height: 50, gap: 7, background: sigOk ? C.green : "#E0D5CC", color: sigOk ? "#FFF" : C.muted, cursor: sigOk ? "pointer" : "not-allowed" }}>
          <CheckCircle2 size={16} /> Mark Batch Complete
        </button>
      </div>
    </>
  );
}
