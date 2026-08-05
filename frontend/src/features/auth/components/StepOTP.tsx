import React, { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Phone, Clock, Check, X, MessageSquare } from "lucide-react";

const C = {
  burgundy:      "#6B1A2A",
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

export function StepOTP({ phone, onVerify, onBack }: { phone: string; onVerify: (otp: string) => void; onBack: () => void }) {
  const [digits, setDigits] = useState<string[]>(Array(6).fill(""));
  const [focused, setFocused] = useState<number | null>(0);
  const [error, setError] = useState(false);
  const [shake, setShake] = useState(false);
  const [hovered, setHovered] = useState(false);
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

  const handleVerify = (otp: string) => {
    if (otp !== "123456") {
      setShake(true); setError(true); setDigits(Array(6).fill(""));
      setTimeout(() => { setShake(false); inputRefs.current[0]?.focus(); setFocused(0); }, 600);
    } else {
      onVerify(otp);
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
        <div style={{ width: 64, height: 64, borderRadius: "50%", background: "rgba(107,26,42,0.08)", display: "inline-flex", alignItems: "center", justifyContent: "center", marginBottom: 18 }}>
          <Phone size={32} color={C.burgundy} />
        </div>
        <div style={{ fontFamily: F.display, fontWeight: 700, fontSize: 38, color: C.textPrimary, lineHeight: 1.1, marginBottom: 8 }}>Check Your Phone</div>
        <div style={{ fontFamily: F.ui, fontWeight: 400, fontSize: 14, color: C.textMuted, marginBottom: 6 }}>We sent a 6-digit code to</div>
        <div style={{ fontFamily: F.mono, fontWeight: 700, fontSize: 16, color: C.burgundy, marginBottom: 6 }}>{formatted}</div>
        <button onClick={onBack} style={{ fontFamily: F.ui, fontWeight: 500, fontSize: 13, color: C.gold, background: "none", border: "none", cursor: "pointer", textDecoration: "underline" }}>
          Change Number
        </button>
      </div>

      <div style={{ height: 1, background: "rgba(139,26,46,0.10)", margin: "0 0 28px" }} />

      <motion.div
        animate={shake ? { x: [-8, 8, -6, 6, -4, 4, 0] } : { x: 0 }}
        transition={{ duration: 0.5 }}
        style={{ display: "flex", gap: 10, justifyContent: "center", marginBottom: 16 }}
      >
        {digits.map((d, i) => (
          <input
            key={i}
            ref={el => { inputRefs.current[i] = el; }}
            type="text"
            inputMode="numeric"
            maxLength={1}
            value={d}
            onFocus={() => setFocused(i)}
            onBlur={() => setFocused(null)}
            onChange={e => handleInput(i, e.target.value)}
            onKeyDown={e => handleKey(i, e)}
            onPaste={handlePaste}
            style={{
              width: 54, height: 64, textAlign: "center" as const,
              fontFamily: F.mono, fontWeight: 700, fontSize: 24,
              color: error ? C.crimson : C.textPrimary,
              background: C.inputBg,
              border: `${d || focused === i ? 2 : 1.5}px solid ${error ? C.crimson : d || focused === i ? C.burgundy : C.borderStrong}`,
              borderRadius: 12, outline: "none", cursor: "text",
              boxShadow: focused === i ? `0 0 0 4px rgba(107,26,42,0.08)` : "none",
              transition: "border 0.15s, box-shadow 0.15s",
            }}
            placeholder={focused === i ? "" : "·"}
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
          <button
            disabled={!timer.expired}
            style={{ fontFamily: F.ui, fontWeight: 600, fontSize: 13, color: timer.expired ? C.gold : C.textMuted, background: "none", border: "none", cursor: timer.expired ? "pointer" : "default", padding: 0, textDecoration: timer.expired ? "underline" : "none" }}
          >
            Resend
          </button>
        </div>
      </div>

      <motion.button
        onClick={() => otp.length === 6 && handleVerify(otp)}
        onHoverStart={() => setHovered(true)}
        onHoverEnd={() => setHovered(false)}
        whileTap={{ scale: 0.98 }}
        style={{
          width: "100%", height: 56,
          background: otp.length === 6 ? (hovered ? C.burgundyHover : C.burgundy) : "rgba(107,26,42,0.22)",
          border: "none", borderRadius: 999, cursor: otp.length === 6 ? "pointer" : "default",
          display: "flex", alignItems: "center", justifyContent: "center", gap: 10,
          fontFamily: F.ui, fontWeight: 700, fontSize: 16, color: "#FFFFFF",
          transition: "background 0.18s",
          boxShadow: otp.length === 6 ? "0 4px 24px rgba(107,26,42,0.30)" : "none",
        }}
      >
        <Check size={20} color="#FFF" />
        Verify and Login
      </motion.button>

      <div style={{ textAlign: "center" as const, marginTop: 16, display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
        <MessageSquare size={15} color={C.green} />
        <span style={{ fontFamily: F.ui, fontWeight: 400, fontSize: 13, color: C.textMuted }}>Not receiving SMS?{" "}</span>
        <button style={{ fontFamily: F.ui, fontWeight: 600, fontSize: 13, color: C.green, background: "none", border: "none", cursor: "pointer", padding: 0 }}>
          Send via WhatsApp
        </button>
      </div>
    </motion.div>
  );
}
