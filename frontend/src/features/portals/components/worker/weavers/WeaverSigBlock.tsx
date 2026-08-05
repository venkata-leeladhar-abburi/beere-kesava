import React from "react";
import { CheckCircle2, Clock, PenLine, Send } from "lucide-react";
import { C, F } from "../tokens";
import { Button } from "../../../../../shared/ui/primitives";

// ─── Weaver Signature Block ───────────────────────────────────────────────────
interface SigBlockProps {
  weaverName: string;
  sigMethod: "none" | "here" | "remote";
  setSigMethod: (m: "none" | "here" | "remote") => void;
  signed: boolean;
  setSigned: (v: boolean) => void;
  remoteSent: boolean;
  setRemoteSent: (v: boolean) => void;
  remoteConfirmed: boolean;
  setRemoteConfirmed: (v: boolean) => void;
}

export function WeaverSigBlock({ weaverName, sigMethod, setSigMethod, signed, setSigned, remoteSent, setRemoteSent, remoteConfirmed, setRemoteConfirmed }: SigBlockProps) {
  const reset = (method: "none" | "here" | "remote") => {
    setSigMethod(sigMethod === method ? "none" : method);
    setSigned(false);
    setRemoteSent(false);
    setRemoteConfirmed(false);
  };

  return (
    <>
      <div style={{ display: "flex", alignItems: "center", gap: 8, margin: "14px 16px 6px" }}>
        <div style={{ width: 20, height: 20, borderRadius: "50%", background: C.burg, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
          <PenLine size={10} color="#FFF" />
        </div>
        <span style={{ fontFamily: F.u, fontSize: 13, fontWeight: 600, color: C.burg }}>Weaver Signature</span>
        <span style={{ fontFamily: F.u, fontSize: 12, color: "#FFF", background: C.crim, padding: "2px 7px", borderRadius: 999 }}>Required</span>
      </div>

      <div style={{ margin: "0 16px 4px", background: "rgba(107,26,42,0.04)", borderRadius: 8, padding: "8px 12px" }}>
        <p style={{ fontFamily: F.u, fontSize: 12, color: C.muted, lineHeight: 1.5, margin: 0 }}>
          Weaver must sign to confirm saree handover. Choose method:
        </p>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, margin: "0 16px" }}>
        <Button variant="tertiary" onClick={() => reset("here")}
          className={`h-auto flex-col items-center whitespace-normal rounded-xl px-3 py-3.5 text-center relative ${sigMethod === "here" ? "border-2 border-[#6B1A2A] bg-[rgba(107,26,42,0.05)]" : "border border-[rgba(139,26,46,0.12)] bg-white"}`}>
          {sigMethod === "here" && <div style={{ position: "absolute", top: 6, right: 6, width: 14, height: 14, background: C.gold, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center" }}><CheckCircle2 size={9} color="#FFF" /></div>}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", width: 40, height: 40, borderRadius: 10, background: sigMethod === "here" ? "rgba(107,26,42,0.10)" : "rgba(107,26,42,0.05)", margin: "0 auto 8px" }}>
            <PenLine size={20} color={sigMethod === "here" ? C.burg : C.muted} />
          </div>
          <div style={{ fontFamily: F.u, fontSize: 12, fontWeight: 600, color: C.text, marginBottom: 2 }}>Sign Here</div>
          <div style={{ fontFamily: F.u, fontSize: 12, color: C.muted }}>On this device</div>
        </Button>

        <Button variant="tertiary" onClick={() => reset("remote")}
          className={`h-auto flex-col items-center whitespace-normal rounded-xl px-3 py-3.5 text-center relative ${sigMethod === "remote" ? "border-2 border-[#6B1A2A] bg-[rgba(107,26,42,0.05)]" : "border border-[rgba(139,26,46,0.12)] bg-white"}`}>
          {sigMethod === "remote" && <div style={{ position: "absolute", top: 6, right: 6, width: 14, height: 14, background: C.gold, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center" }}><CheckCircle2 size={9} color="#FFF" /></div>}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", width: 40, height: 40, borderRadius: 10, background: sigMethod === "remote" ? "rgba(107,26,42,0.10)" : "rgba(107,26,42,0.05)", margin: "0 auto 8px" }}>
            <Send size={20} color={sigMethod === "remote" ? C.burg : C.muted} />
          </div>
          <div style={{ fontFamily: F.u, fontSize: 12, fontWeight: 600, color: C.text, marginBottom: 2 }}>Send Request</div>
          <div style={{ fontFamily: F.u, fontSize: 12, color: C.muted }}>Weaver's mobile</div>
        </Button>
      </div>

      {sigMethod === "here" && (
        <div style={{ margin: "10px 16px 0" }}>
          <div
            style={{ background: "#FFF", border: `1px solid ${signed ? "rgba(30,102,64,0.30)" : "rgba(139,26,46,0.25)"}`, borderRadius: 12, height: 140, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", position: "relative", cursor: "crosshair" }}
            onClick={() => setSigned(true)} role="button" tabIndex={0} onKeyDown={e => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); (() => setSigned(true))?.(); } }}>
            {!signed ? (
              <>
                <PenLine size={26} color={C.muted} style={{ marginBottom: 8 }} />
                <span style={{ fontFamily: F.u, fontSize: 13, color: C.muted }}>Weaver signs here</span>
                <span style={{ fontFamily: F.u, fontSize: 12, color: C.muted, marginTop: 4 }}>Tap to sign</span>
              </>
            ) : (
              <div style={{ padding: 14, textAlign: "center" }}>
                <div style={{ fontFamily: "'Dancing Script', cursive", fontSize: 24, color: C.dark }}>{weaverName}</div>
                <div style={{ fontFamily: F.u, fontSize: 12, color: C.green, marginTop: 5, display: "flex", alignItems: "center", gap: 4, justifyContent: "center" }}>
                  <CheckCircle2 size={11} /> Signature captured
                </div>
              </div>
            )}
            {signed && (
              <Button variant="link" onClick={e => { e.stopPropagation(); setSigned(false); }} className="absolute bottom-[7px] right-2.5 p-0 text-xs text-[#C4923A]">
                Clear
              </Button>
            )}
          </div>
        </div>
      )}

      {sigMethod === "remote" && (
        <div style={{ margin: "10px 16px 0", background: "#FFF", border: `1px solid rgba(139,26,46,0.15)`, borderRadius: 12, padding: 14 }}>
          {remoteConfirmed ? (
            <div style={{ background: "rgba(30,102,64,0.10)", border: `1px solid ${C.green}`, borderRadius: 10, padding: 14, textAlign: "center" }}>
              <CheckCircle2 size={22} color={C.green} style={{ margin: "0 auto 8px" }} />
              <div style={{ fontFamily: F.u, fontWeight: 600, fontSize: 13, color: C.green, marginBottom: 4 }}>Signature Received!</div>
              <div style={{ fontFamily: F.m, fontSize: 12, color: C.muted }}>Signed by {weaverName} · Just now</div>
            </div>
          ) : remoteSent ? (
            <div style={{ background: "rgba(196,146,58,0.10)", border: `1px solid ${C.gold}`, borderRadius: 10, padding: 14, textAlign: "center" }}>
              <Clock size={22} color={C.gold} style={{ margin: "0 auto 6px" }} />
              <div style={{ fontFamily: F.u, fontWeight: 600, fontSize: 13, color: C.text, marginBottom: 2 }}>Waiting for Signature…</div>
              <div style={{ fontFamily: F.u, fontSize: 12, color: C.muted, marginBottom: 10 }}>Request sent to {weaverName}'s mobile</div>
              <div style={{ display: "flex", gap: 8, justifyContent: "center" }}>
                <Button variant="link" className="p-0 text-xs text-[#C4923A]">Resend</Button>
                <Button variant="link" onClick={() => setRemoteConfirmed(true)} className="p-0 text-xs text-[#69635E] underline">Demo: Signed →</Button>
              </div>
            </div>
          ) : (
            <>
              <div style={{ marginBottom: 12 }}>
                <div style={{ fontFamily: F.u, fontSize: 12, color: C.muted, marginBottom: 3 }}>Sending to: {weaverName}</div>
                <div style={{ fontFamily: F.m, fontWeight: 600, fontSize: 13, color: C.text }}>+91 98765 43210</div>
              </div>
              <Button variant="primary" fullWidth iconLeft={Send} onClick={() => setRemoteSent(true)} className="h-11 rounded-full bg-[#6B1A2A] hover:bg-[#6B1A2A] text-[13px]">
                Send Signature Request
              </Button>
            </>
          )}
        </div>
      )}
    </>
  );
}
