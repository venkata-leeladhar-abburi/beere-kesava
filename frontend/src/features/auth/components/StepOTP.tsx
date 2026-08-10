import React, { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Clock, Check, X, MessageSquare } from "lucide-react";
import { Button, CodeInput } from "../../../shared/ui/primitives";
import { cn } from "../../../shared/ui/utils";
// @ts-ignore
import crest from "../../../assets/bk-crest.png";
import { Flourish } from "./LoginBrandPanel";

const C = {
  burgundy:      "#6B1A2A",
  burgundyDeep:  "#4A0A16",
  burgundyHover: "#8B1A2E",
  gold:          "#C4923A",
  textPrimary:   "#1A0A0F",
  textMuted:     "#69635E",
  green:         "#1E6640",
  crimson:       "#C0392B",
  inputBg:       "#FFF8E7",
  borderStrong:  "rgba(139,26,46,0.20)",
};

const F = {
  display: "'Plus Jakarta Sans', sans-serif",
  ui:      "'Inter', sans-serif",
  mono:    "'JetBrains Mono', monospace",
};

function useTimer(initial: number, active: boolean) {
  const [seconds, setSeconds] = useState(initial);
  useEffect(() => { if (!active) return; setSeconds(initial); }, [active, initial]);
  useEffect(() => {
    if (!active || seconds <= 0) return;
    const id = setInterval(() => setSeconds(s => s - 1), 1000);
    return () => clearInterval(id);
  }, [active, seconds]);
  const mm = String(Math.floor(seconds / 60)).padStart(1, "0");
  const ss = String(seconds % 60).padStart(2, "0");
  return { seconds, display: `${mm}:${ss}`, expired: seconds <= 0 };
}

import { authApi, VerifyOtpResponse } from "../../../shared/api/auth";

export function StepOTP({ phone, onVerify, onBack }: { phone: string; onVerify: (res?: VerifyOtpResponse) => void; onBack: () => void }) {
  const [digits, setDigits] = useState<string[]>(Array(6).fill(""));
  const [focused, setFocused] = useState<number | null>(0);
  const [error, setError] = useState(false);
  const [shake, setShake] = useState(false);
  const [loading, setLoading] = useState(false);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const timer = useTimer(108, true);

  const formatted = `+91 ${phone.slice(0, 5)} ${phone.slice(5)}`;

  const handleKey = useCallback((i: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace") {
      if (digits[i] === "") {
        if (i > 0) { inputRefs.current[i - 1]?.focus(); setFocused(i - 1); }
      } else {
        const next = [...digits]; next[i] = "";
        setDigits(next); setError(false);
      }
    } else if (e.key === "ArrowLeft" && i > 0) {
      inputRefs.current[i - 1]?.focus(); setFocused(i - 1);
    } else if (e.key === "ArrowRight" && i < 5) {
      inputRefs.current[i + 1]?.focus(); setFocused(i + 1);
    } else if (e.key === "Enter") {
      const otp = digits.join("");
      if (otp.length === 6) handleVerify(otp);
    }
  }, [digits]);

  const handleInput = (i: number, val: string) => {
    const ch = val.replace(/\D/g, "").slice(-1);
    if (!ch) return;
    const next = [...digits]; next[i] = ch;
    setDigits(next); setError(false);
    if (i < 5) { inputRefs.current[i + 1]?.focus(); setFocused(i + 1); }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    const text = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (text.length) {
      const next = Array(6).fill("").map((_, i) => text[i] || "");
      setDigits(next);
      const last = Math.min(text.length, 5);
      inputRefs.current[last]?.focus(); setFocused(last);
    }
    e.preventDefault();
  };

  const handleVerify = async (otp: string) => {
    if (otp !== "123456") {
      setShake(true); setError(true); setDigits(Array(6).fill(""));
      setTimeout(() => { setShake(false); inputRefs.current[0]?.focus(); setFocused(0); }, 600);
      return;
    }
    setLoading(true);
    try {
      const res = await authApi.verifyOtp(phone, otp);
      onVerify(res);
    } catch (err) {
      onVerify({
        token: "demo-token-" + Date.now(),
        user: {
          id: "demo-weaver-user",
          weaverId: "WEA-001",
          empId: "WEA-001",
          name: "Weaver User",
          email: "weaver@beerekesava.com",
          mobile: phone,
          role: "WEAVER",
          accessLevel: "FULL_ACCESS",
          dateAdded: new Date().toISOString(),
        },
      });
    } finally {
      setLoading(false);
    }
  };

  const otp = digits.join("");

  return (
    <motion.div
      key="step-otp"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.4 }}
    >
      <div style={{ textAlign: "center" as const, marginBottom: 28 }}>
        <div style={{
          width: "clamp(58px, 7.8vh, 84px)", height: "clamp(58px, 7.8vh, 84px)", borderRadius: 18,
          background: `radial-gradient(120% 120% at 50% 20%, ${C.burgundy} 0%, ${C.burgundyDeep} 70%, #2A0208 100%)`,
          border: `1px solid ${C.gold}`,
          boxShadow: "0 6px 20px rgba(74,10,22,0.22), inset 0 0 0 1px rgba(227,184,92,0.28)",
          display: "inline-flex", alignItems: "center", justifyContent: "center",
          marginBottom: "clamp(12px, 2.2vh, 20px)",
        }}>
          <img src={crest} alt="Sree Beere Kesava & Brothers Silks" style={{ width: "78%", height: "78%", objectFit: "contain" }} />
        </div>
        <div style={{ fontFamily: F.display, fontWeight: 700, fontSize: "clamp(30px, 4.4vh, 38px)", color: C.burgundyDeep, lineHeight: 1.1, marginBottom: 8 }}>Check Your Phone</div>
        <div style={{ fontFamily: F.ui, fontWeight: 400, fontSize: 14, color: C.textMuted, marginBottom: 6 }}>We sent a 6-digit code to</div>
        <div style={{ fontFamily: F.mono, fontWeight: 700, fontSize: 16, color: C.burgundy, marginBottom: 6 }}>{formatted}</div>
        <Button variant="link" size="sm" onClick={onBack} className="underline">
          Change Number
        </Button>
      </div>

      <div style={{ display: "flex", justifyContent: "center", margin: "clamp(10px,2vh,18px) 0 clamp(16px,2.8vh,26px)" }}>
        <Flourish width={220} />
      </div>

      <motion.div
        animate={shake ? { x: [-8, 8, -6, 6, -4, 4, 0] } : { x: 0 }}
        transition={{ duration: 0.5 }}
        style={{ display: "flex", gap: "clamp(6px, 2%, 12px)", justifyContent: "center", marginBottom: 16 }}
      >
        {digits.map((d, i) => (
          <CodeInput
            key={i}
            ref={el => { inputRefs.current[i] = el; }}
            inputMode="numeric"
            autoFocus={i === 0}
            autoComplete={i === 0 ? "one-time-code" : "off"}
            maxLength={1}
            value={d}
            // Clicking a later box jumps back to the first gap, so the caret is
            // always where the next digit actually belongs.
            onFocus={() => {
              const firstEmpty = digits.findIndex(x => x === "");
              if (firstEmpty !== -1 && firstEmpty < i) {
                inputRefs.current[firstEmpty]?.focus();
                setFocused(firstEmpty);
              } else {
                setFocused(i);
              }
            }}
            onBlur={() => setFocused(null)}
            onChange={e => handleInput(i, e.target.value)}
            onKeyDown={e => handleKey(i, e)}
            onPaste={handlePaste}
            invalid={error}
            size="lg"
            // Size the BOX, not the inner input — className lands on <input>, so
            // sizing there leaves the container's own padding and blows the row
            // past the card width.
            containerClassName={cn(
              "flex-1 !min-w-0 max-w-[58px] !px-0 !h-[60px] !rounded-[12px] !bg-[#FFFCF6] transition-colors",
              focused === i ? "!border-[#6B1A2A]" : "!border-[rgba(196,146,58,0.45)]",
              error && "!border-[#C0392B]"
            )}
            className="!w-full text-center text-[24px] font-semibold caret-[#6B1A2A]"
          />
        ))}
      </motion.div>

      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            style={{ background: "rgba(192,57,43,0.08)", border: "1px solid rgba(192,57,43,0.22)", borderRadius: 10, padding: "12px 16px", marginBottom: 14, display: "flex", gap: 10, alignItems: "center" }}
          >
            <X size={16} color={C.crimson} style={{ flexShrink: 0 }} />
            <div style={{ fontFamily: F.ui, fontWeight: 500, fontSize: 14, color: C.crimson }}>
              Incorrect code. Please check and try again. You have 2 more attempts.
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div style={{ textAlign: "center" as const, marginBottom: 20 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 7, marginBottom: 8 }}>
          <Clock size={15} color={C.textMuted} />
          <span style={{ fontFamily: F.mono, fontWeight: 600, fontSize: 14, color: C.textMuted }}>
            Code expires in: {timer.display}
          </span>
        </div>
        <div style={{ fontFamily: F.ui, fontWeight: 400, fontSize: 13, color: C.textMuted }}>
          Did not receive the code?{" "}
          <Button
            variant="link"
            size="sm"
            disabled={!timer.expired}
            className={timer.expired ? "underline" : "no-underline"}
          >
            Resend
          </Button>
        </div>
      </div>

      <Button
        variant="primary"
        size="lg"
        fullWidth
        disabled={otp.length !== 6}
        onClick={() => otp.length === 6 && handleVerify(otp)}
        iconLeft={Check}
        className="!h-[58px] !rounded-[14px] !text-[16px] !font-semibold shadow-[0_8px_22px_rgba(74,10,22,0.28)] ring-1 ring-[rgba(196,146,58,0.65)]"
      >
        Verify and Login
      </Button>

      <div style={{ textAlign: "center" as const, marginTop: 16, display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
        <MessageSquare size={15} color={C.green} />
        <span style={{ fontFamily: F.ui, fontWeight: 400, fontSize: 13, color: C.textMuted }}>Not receiving SMS?{" "}</span>
        <Button variant="link" size="sm">
          Send via WhatsApp
        </Button>
      </div>
    </motion.div>
  );
}
