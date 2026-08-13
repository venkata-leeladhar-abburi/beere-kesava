import React, { useState } from "react";
import { Camera, UploadCloud, CheckCircle2, AlertTriangle, Plus, Printer } from "lucide-react";
import { C, F, card } from "../tokens";
import { useRatesPricing } from "../../../../pricing/contexts/RatesContext";
import { FieldLabel } from "./shared";
import { MaterialSplitPanel, type MatSplit } from "./MaterialSplitPanel";
import { WeaverSigBlock } from "./WeaverSigBlock";
import { Button, Input, Select, SelectItem } from "../../../../../shared/ui/primitives";

// ─── Receive Sarees — Own Factory tab ────────────────────────────────────────
// Extracted verbatim from ReceiveSareesPage's `activeSection === "own"` branch;
// this tab's state is entirely self-contained (does not interact with the
// outsourced-weaver flow), so it lives as its own component.
export function OwnFactoryReceiveTab() {
  const { rates } = useRatesPricing();
  const [ownMatEdits, setOwnMatEdits] = useState<Partial<MatSplit>>({});
  const [ownTypeCode, setOwnTypeCode] = useState(rates[0]?.code || "");

  React.useEffect(() => {
    if (!ownTypeCode && rates.length > 0) {
      setOwnTypeCode(rates[0].code);
    }
  }, [rates, ownTypeCode]);
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
        <Input type="number" value={loomNum} onChange={e => setLoomNum(e.target.value)} placeholder="Loom Number" size="lg" className="font-mono" />
      </div>

      <div style={{ ...card, margin: "10px 16px 10px", padding: 14 }}>
        <div style={{ fontFamily: F.u, fontSize: 13, fontWeight: 600, color: C.text, marginBottom: 12 }}>
          Saree #{sareeCount} {loomNum ? `· Loom ${loomNum}` : ""}
        </div>

        <div className="grid-cols-1 md:grid-cols-2" style={{ display: "grid", gap: 10, marginBottom: 10 }}>
          <div>
            <FieldLabel>Weight (grams)</FieldLabel>
            <div style={{ position: "relative" }}>
              <Input type="number" value={ownWeight} onChange={e => setOwnWeight(e.target.value)} placeholder="0" size="lg" className="font-mono text-lg" />
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
              <Button variant={ownPhoto ? "secondary" : "primary"} size="sm" iconLeft={Camera} onClick={() => setOwnPhoto(true)}
                className={ownPhoto ? "h-[38px] rounded-lg border-[rgba(110,15,45,0.12)] text-[#1E6640]" : "h-[38px] rounded-lg bg-[#6E0F2D] hover:bg-[#6E0F2D]"}>
                {ownPhoto ? "Taken ✓" : "Camera"}
              </Button>
              <Button variant="secondary" size="sm" iconLeft={UploadCloud} onClick={() => setOwnPhoto(true)}
                className="h-[38px] rounded-lg border-[#6E0F2D] text-[#6E0F2D]">
                Gallery
              </Button>
            </div>
          </div>
        </div>

        <div style={{ marginBottom: 10 }}>
          <FieldLabel>Saree Type</FieldLabel>
          <Select value={ownTypeCode} onValueChange={v => { setOwnTypeCode(v); setOwnMatEdits({}); }}>
            {rates.map(r => <SelectItem key={r.code} value={r.code}>{r.code} · {r.type}</SelectItem>)}
          </Select>
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
          <Button variant="secondary" fullWidth size="sm" iconLeft={Printer} className="h-[42px] rounded-full border-[#C4923A] text-[#C4923A]">
            Print Tag
          </Button>
          <Button variant="secondary" fullWidth size="sm" iconLeft={Plus} className="h-[42px] rounded-full border-[#6E0F2D] text-[#6E0F2D]">
            Next Saree
          </Button>
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
        <Button
          variant="primary"
          fullWidth
          iconLeft={CheckCircle2}
          disabled={!sigOk}
          className={`h-[50px] rounded-full ${sigOk ? "bg-[#1E6640] hover:bg-[#1E6640]" : ""}`}>
          Mark Batch Complete
        </Button>
      </div>
    </>
  );
}
