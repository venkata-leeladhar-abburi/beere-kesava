import React from "react";
import { CheckCircle2, Clock, PenLine, Send } from "lucide-react";
import { F, T } from "./theme";

// ── Signature capture block (mirrors WorkerWeavers WeaverSigBlock, T/F tokens) ─
export function SignatureBlock({ weaverName, weaverPhone, sigMethod, setSigMethod, signed, setSigned, remoteSent, setRemoteSent, remoteConfirmed, setRemoteConfirmed }: {
  weaverName: string; weaverPhone: string;
  sigMethod: "none" | "here" | "remote"; setSigMethod: (m: "none" | "here" | "remote") => void;
  signed: boolean; setSigned: (v: boolean) => void;
  remoteSent: boolean; setRemoteSent: (v: boolean) => void;
  remoteConfirmed: boolean; setRemoteConfirmed: (v: boolean) => void;
}) {
  return (
    <div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 4 }}>
        <button onClick={() => setSigMethod("here")} style={{
          padding: "18px 16px", borderRadius: 14, cursor: "pointer", textAlign: "center" as const, position: "relative" as const,
          background: sigMethod === "here" ? "rgba(110,15,45,0.05)" : "#FFF",
          border: `${sigMethod === "here" ? 2 : 1}px solid ${sigMethod === "here" ? T.royalBurgundy : T.borderDef}`,
        }}>
          {sigMethod === "here" && <div style={{ position: "absolute" as const, top: 8, right: 8, width: 16, height: 16, background: T.antiqueGold, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center" }}><CheckCircle2 size={10} color="#FFF" /></div>}
          <div style={{ width: 44, height: 44, borderRadius: 12, background: sigMethod === "here" ? "rgba(110,15,45,0.10)" : "rgba(110,15,45,0.05)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 10px" }}>
            <PenLine size={20} color={sigMethod === "here" ? T.royalBurgundy : T.taupe} />
          </div>
          <div style={{ fontFamily: F.ui, fontWeight: 700, fontSize: 14, color: T.luxuryBrown }}>Sign Here on This Screen</div>
          <div style={{ fontFamily: F.ui, fontSize: 12, color: T.taupe, marginTop: 3 }}>Weaver signs on this device</div>
        </button>
        <button onClick={() => setSigMethod("remote")} style={{
          padding: "18px 16px", borderRadius: 14, cursor: "pointer", textAlign: "center" as const, position: "relative" as const,
          background: sigMethod === "remote" ? "rgba(110,15,45,0.05)" : "#FFF",
          border: `${sigMethod === "remote" ? 2 : 1}px solid ${sigMethod === "remote" ? T.royalBurgundy : T.borderDef}`,
        }}>
          {sigMethod === "remote" && <div style={{ position: "absolute" as const, top: 8, right: 8, width: 16, height: 16, background: T.antiqueGold, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center" }}><CheckCircle2 size={10} color="#FFF" /></div>}
          <div style={{ width: 44, height: 44, borderRadius: 12, background: sigMethod === "remote" ? "rgba(110,15,45,0.10)" : "rgba(110,15,45,0.05)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 10px" }}>
            <Send size={20} color={sigMethod === "remote" ? T.royalBurgundy : T.taupe} />
          </div>
          <div style={{ fontFamily: F.ui, fontWeight: 700, fontSize: 14, color: T.luxuryBrown }}>Send to Weaver's Phone</div>
          <div style={{ fontFamily: F.ui, fontSize: 12, color: T.taupe, marginTop: 3 }}>Weaver signs remotely</div>
        </button>
      </div>

      {sigMethod === "here" && (
        <div style={{ marginTop: 14 }}>
          <div onClick={() => setSigned(true)} role="button" tabIndex={0} onKeyDown={e => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); (() => setSigned(true))?.(); } }} style={{
            background: "#FFF", border: `1.5px solid ${signed ? "rgba(30,102,64,0.35)" : T.borderDef}`, borderRadius: 14,
            height: 150, display: "flex", flexDirection: "column" as const, alignItems: "center", justifyContent: "center",
            cursor: "crosshair", position: "relative" as const,
          }}>
            {!signed ? (
              <>
                <PenLine size={30} color={T.taupe} style={{ marginBottom: 10, opacity: 0.6 }} />
                <span style={{ fontFamily: F.ui, fontSize: 14, color: T.taupe }}>Tap to sign as {weaverName}</span>
              </>
            ) : (
              <div style={{ textAlign: "center" as const }}>
                <div style={{ fontFamily: "'Dancing Script', cursive", fontSize: 30, color: T.darkBurgundy }}>{weaverName}</div>
                <div style={{ fontFamily: F.ui, fontSize: 12, color: T.green, marginTop: 6, display: "flex", alignItems: "center", gap: 5, justifyContent: "center" }}>
                  <CheckCircle2 size={13} /> Signature captured
                </div>
              </div>
            )}
            {signed && (
              <button onClick={e => { e.stopPropagation(); setSigned(false); }} style={{ position: "absolute" as const, bottom: 10, right: 14, background: "none", border: "none", fontFamily: F.ui, fontSize: 12, color: T.antiqueGold, cursor: "pointer" }}>Clear</button>
            )}
          </div>
        </div>
      )}

      {sigMethod === "remote" && (
        <div style={{ marginTop: 14, background: "#FFF", border: `1px solid ${T.borderDef}`, borderRadius: 14, padding: 18 }}>
          {remoteConfirmed ? (
            <div style={{ background: "rgba(30,102,64,0.10)", border: `1px solid ${T.green}`, borderRadius: 12, padding: 18, textAlign: "center" as const }}>
              <CheckCircle2 size={26} color={T.green} style={{ margin: "0 auto 8px" }} />
              <div style={{ fontFamily: F.ui, fontWeight: 700, fontSize: 14, color: T.green, marginBottom: 4 }}>Signature Received!</div>
              <div style={{ fontFamily: F.mono, fontSize: 12, color: T.taupe }}>Signed by {weaverName} · Just now</div>
            </div>
          ) : remoteSent ? (
            <div style={{ background: "rgba(196,146,58,0.12)", border: `1px solid ${T.antiqueGold}`, borderRadius: 12, padding: 18, textAlign: "center" as const }}>
              <Clock size={24} color={T.antiqueGold} style={{ margin: "0 auto 8px" }} />
              <div style={{ fontFamily: F.ui, fontWeight: 700, fontSize: 14, color: T.luxuryBrown, marginBottom: 3 }}>Waiting for signature…</div>
              <div style={{ fontFamily: F.ui, fontSize: 12, color: T.taupe, marginBottom: 12 }}>Request sent to {weaverName}'s mobile (+91 {weaverPhone})</div>
              <button onClick={() => setRemoteConfirmed(true)} style={{ background: "none", border: "none", fontFamily: F.ui, fontSize: 12, color: T.taupe, cursor: "pointer", textDecoration: "underline" }}>Demo: Signed →</button>
            </div>
          ) : (
            <>
              <div style={{ marginBottom: 14 }}>
                <div style={{ fontFamily: F.ui, fontSize: 12, color: T.taupe, marginBottom: 3 }}>Sending to</div>
                <div style={{ fontFamily: F.mono, fontWeight: 700, fontSize: 14, color: T.luxuryBrown }}>+91 {weaverPhone}</div>
              </div>
              <button onClick={() => setRemoteSent(true)} style={{ width: "100%", height: 48, borderRadius: 12, background: T.royalBurgundy, border: "none", color: "#FFF", fontFamily: F.ui, fontWeight: 700, fontSize: 14, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
                <Send size={15} /> Send Signature Request
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
}
