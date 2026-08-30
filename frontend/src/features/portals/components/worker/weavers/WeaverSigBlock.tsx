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
      <div style={{ display: "flex", alignItems: "center", gap: 12, margin: "24px 16px 4px" }}>
        <div style={{ width: 36, height: 36, borderRadius: 10, background: "rgba(110,15,45,0.08)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
          <PenLine size={18} color={C.burg} />
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontFamily: F.u, fontSize: 15, fontWeight: 600, color: C.wine, letterSpacing: "-0.01em" }}>Weaver Signature</div>
          <div style={{ fontFamily: F.u, fontSize: 13, color: C.muted, marginTop: 2 }}>
            The weaver must sign to confirm handover — choose a method below.
          </div>
        </div>
        <span style={{ fontFamily: F.u, fontSize: 12, fontWeight: 600, color: C.crim, background: "rgba(171,56,50,0.08)", border: "1px solid rgba(171,56,50,0.20)", padding: "4px 10px", borderRadius: 999, flexShrink: 0 }}>Required</span>
      </div>

      <div className="grid-cols-1 md:grid-cols-2" style={{ display: "grid", gap: 14, margin: "14px 16px 0" }}>
        <Button variant="tertiary" onClick={() => reset("here")}
          className={`h-auto flex-col items-center whitespace-normal rounded-[16px] px-4 py-5 text-center relative transition-all ${sigMethod === "here" ? "border-2 border-[#6E0F2D] bg-[rgba(110,15,45,0.05)] shadow-[0_6px_24px_rgba(74,6,27,0.10)]" : "border border-[rgba(110,15,45,0.10)] bg-white shadow-[0_2px_12px_rgba(74,6,27,0.06)]"}`}>
          {sigMethod === "here" && <div style={{ position: "absolute", top: 10, right: 10, width: 18, height: 18, background: C.burg, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center" }}><CheckCircle2 size={12} color="#FFF" /></div>}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", width: 48, height: 48, borderRadius: 14, background: sigMethod === "here" ? "rgba(110,15,45,0.10)" : "rgba(110,15,45,0.05)", margin: "0 auto 12px" }}>
            <PenLine size={22} color={sigMethod === "here" ? C.burg : C.muted} />
          </div>
          <div style={{ fontFamily: F.u, fontSize: 15, fontWeight: 600, color: sigMethod === "here" ? C.wine : C.text, marginBottom: 3 }}>Sign Here</div>
          <div style={{ fontFamily: F.u, fontSize: 13, color: C.muted }}>On this device</div>
        </Button>

        <Button variant="tertiary" onClick={() => reset("remote")}
          className={`h-auto flex-col items-center whitespace-normal rounded-[16px] px-4 py-5 text-center relative transition-all ${sigMethod === "remote" ? "border-2 border-[#6E0F2D] bg-[rgba(110,15,45,0.05)] shadow-[0_6px_24px_rgba(74,6,27,0.10)]" : "border border-[rgba(110,15,45,0.10)] bg-white shadow-[0_2px_12px_rgba(74,6,27,0.06)]"}`}>
          {sigMethod === "remote" && <div style={{ position: "absolute", top: 10, right: 10, width: 18, height: 18, background: C.burg, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center" }}><CheckCircle2 size={12} color="#FFF" /></div>}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", width: 48, height: 48, borderRadius: 14, background: sigMethod === "remote" ? "rgba(110,15,45,0.10)" : "rgba(110,15,45,0.05)", margin: "0 auto 12px" }}>
            <Send size={22} color={sigMethod === "remote" ? C.burg : C.muted} />
          </div>
          <div style={{ fontFamily: F.u, fontSize: 15, fontWeight: 600, color: sigMethod === "remote" ? C.wine : C.text, marginBottom: 3 }}>Send Request</div>
          <div style={{ fontFamily: F.u, fontSize: 13, color: C.muted }}>To weaver&apos;s portal</div>
        </Button>
      </div>

      {sigMethod === "here" && (
        <div style={{ margin: "14px 16px 0" }}>
          <div
            style={{ background: "#FFF", border: `1.5px dashed ${signed ? "rgba(31,119,78,0.40)" : "rgba(110,15,45,0.25)"}`, borderRadius: 16, height: 160, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", position: "relative", cursor: "crosshair" }}
            onClick={() => setSigned(true)} role="button" tabIndex={0} onKeyDown={e => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); (() => setSigned(true))?.(); } }}>
            {!signed ? (
              <>
                <PenLine size={26} color={C.muted} style={{ marginBottom: 8 }} />
                <span style={{ fontFamily: F.u, fontSize: 14, fontWeight: 500, color: C.text }}>Weaver signs here</span>
                <span style={{ fontFamily: F.u, fontSize: 13, color: C.muted, marginTop: 4 }}>Tap inside the box to sign</span>
              </>
            ) : (
              <div style={{ padding: 14, textAlign: "center" }}>
                <div style={{ fontFamily: F.d, fontStyle: "italic", fontSize: 28, color: C.wine, letterSpacing: "-0.01em" }}>{weaverName}</div>
                <div style={{ fontFamily: F.u, fontSize: 13, fontWeight: 500, color: C.green, marginTop: 8, display: "flex", alignItems: "center", gap: 5, justifyContent: "center" }}>
                  <CheckCircle2 size={14} /> Signature captured
                </div>
              </div>
            )}
            {signed && (
              <Button variant="link" onClick={e => { e.stopPropagation(); setSigned(false); }} className="absolute bottom-2 right-3 p-0 text-[13px] text-[#845E04]">
                Clear
              </Button>
            )}
          </div>
        </div>
      )}

      {sigMethod === "remote" && (
        <div style={{ margin: "14px 16px 0", background: "#FFF", border: `1px solid ${C.bdr}`, borderRadius: 16, boxShadow: "0 2px 12px rgba(74,6,27,0.07)", padding: 20 }}>
          {remoteConfirmed ? (
            <div style={{ background: "rgba(31,119,78,0.08)", border: "1px solid rgba(31,119,78,0.25)", borderRadius: 12, padding: 18, textAlign: "center" }}>
              <CheckCircle2 size={22} color={C.green} style={{ margin: "0 auto 8px" }} />
              <div style={{ fontFamily: F.u, fontWeight: 600, fontSize: 15, color: C.green, marginBottom: 4 }}>Signature Received</div>
              <div style={{ fontFamily: F.m, fontSize: 12, color: C.muted }}>Signed by {weaverName} · Just now</div>
            </div>
          ) : remoteSent ? (
            <div style={{ background: "rgba(200,155,71,0.12)", border: "1px solid rgba(200,155,71,0.35)", borderRadius: 12, padding: 18, textAlign: "center" }}>
              <Clock size={22} color="#845E04" style={{ margin: "0 auto 6px" }} />
              <div style={{ fontFamily: F.u, fontWeight: 600, fontSize: 15, color: C.wine, marginBottom: 2 }}>Waiting for Signature…</div>
              <div style={{ fontFamily: F.u, fontSize: 12, color: C.muted, marginBottom: 10 }}>Request sent to {weaverName}'s portal</div>
              <div style={{ display: "flex", gap: 8, justifyContent: "center" }}>
                <Button variant="link" className="p-0 text-[13px] text-[#845E04]">Resend</Button>
                <Button variant="link" onClick={() => setRemoteConfirmed(true)} className="p-0 text-[13px] text-[#69635E] underline">Demo: Signed →</Button>
              </div>
            </div>
          ) : (
            <>
              <div style={{ marginBottom: 12 }}>
                <div style={{ fontFamily: F.u, fontSize: 12, color: C.muted, marginBottom: 3 }}>Sending to</div>
                <div style={{ fontFamily: F.m, fontWeight: 600, fontSize: 13, color: C.text }}>{weaverName}'s portal</div>
              </div>
              <Button variant="primary" fullWidth iconLeft={Send} onClick={() => setRemoteSent(true)} className="h-12 rounded-full bg-[#6E0F2D] hover:bg-[#4A061B] text-[14px]">
                Send Signature Request
              </Button>
            </>
          )}
        </div>
      )}
    </>
  );
}
