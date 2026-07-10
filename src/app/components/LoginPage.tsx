import React, { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Phone, Shield, Clock, Check, X, Bell,
  MessageSquare, RefreshCcw, ChevronRight,
} from "lucide-react";
import { imgShowroom } from "../constants/weaverImages";
import logo from "../../imports/logo.png";

// ── Design Tokens ──────────────────────────────────────────────────────────────
const C = {
  pageBg:        "#FFFFFF",
  burgundy:      "#6B1A2A",
  burgundyHover: "#8B1A2E",
  darkBg:        "#3D0E1A",
  gold:          "#C4923A",
  textPrimary:   "#1A0A0F",
  textSecondary: "#3D2030",
  textMuted:     "#8B7060",
  green:         "#1E6640",
  crimson:       "#C0392B",
  inputBg:       "#FFF8E7",
  border:        "rgba(139,26,46,0.15)",
  borderStrong:  "rgba(139,26,46,0.20)",
};

const F = {
  display: "'Plus Jakarta Sans', sans-serif",
  ui:      "'Inter', sans-serif",
  mono:    "'JetBrains Mono', monospace",
};

// ── Portal chips data ─────────────────────────────────────────────────────────
const PORTALS = ["Superadmin", "Admin", "Worker Staff", "Weaver", "Shop Staff"];

// ── OTP Timer hook ────────────────────────────────────────────────────────────
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

// ── Left Brand Panel ──────────────────────────────────────────────────────────
function BrandPanel() {
  return (
    <div style={{
      width: "45%", minHeight: "100vh", background: C.darkBg,
      position: "relative" as const, overflow: "hidden",
      display: "flex", flexDirection: "column" as const,
    }}>
      {/* Showroom photo background */}
      <div style={{ position: "absolute", inset: 0, zIndex: 0 }}>
        <img src={imgShowroom} alt="" style={{ width: "100%", height: "100%", objectFit: "cover", opacity: 0.15, filter: "saturate(0.6)" }} />
        <div style={{ position: "absolute", inset: 0, background: `linear-gradient(160deg, ${C.darkBg} 0%, rgba(61,14,26,0.90) 60%, ${C.darkBg} 100%)` }} />
      </div>

      {/* Diagonal texture overlay */}
      <div style={{ position: "absolute", inset: 0, zIndex: 1, backgroundImage: `repeating-linear-gradient(45deg, rgba(196,146,58,0.025) 0px, rgba(196,146,58,0.025) 1px, transparent 1px, transparent 28px)` }} />

      {/* Decorative rings */}
      <div style={{ position: "absolute", right: -120, bottom: -120, width: 500, height: 500, borderRadius: "50%", border: "1px solid rgba(196,146,58,0.07)", zIndex: 1, pointerEvents: "none" }} />
      <div style={{ position: "absolute", right: -60, bottom: -60, width: 340, height: 340, borderRadius: "50%", border: "1px solid rgba(196,146,58,0.04)", zIndex: 1, pointerEvents: "none" }} />

      {/* Main content */}
      <div style={{ position: "relative", zIndex: 2, padding: "64px", flex: 1, display: "flex", flexDirection: "column" as const, justifyContent: "center" }}>

        {/* Brand identity */}
        <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 52 }}>
          <div style={{ width: 56, height: 56, borderRadius: 14, background: "#FFFFFF", border: "1px solid rgba(196,146,58,0.30)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, overflow: "hidden", boxShadow: "0 2px 10px rgba(0,0,0,0.10)" }}>
            <img src={logo} alt="Beere Kesava Logo" style={{ width: 40, height: 40, objectFit: "contain" }} />
          </div>
          <div>
            <div style={{ fontFamily: F.display, fontWeight: 700, fontSize: 24, color: "#F5EDD0", lineHeight: 1.1 }}>Beere Kesava</div>
            <div style={{ fontFamily: F.display, fontWeight: 400, fontSize: 16, color: "rgba(245,237,208,0.60)", lineHeight: 1.2 }}>& Brothers Silks</div>
            <div style={{ fontFamily: F.mono, fontSize: 10, fontWeight: 600, letterSpacing: "3px", textTransform: "uppercase" as const, color: C.gold, marginTop: 6 }}>Since 1999</div>
          </div>
        </div>

        {/* Hero statement */}
        <div style={{ marginBottom: 24 }}>
          {[
            { text: "Weaving",     italic: false, gold: false },
            { text: "Heritage",    italic: true,  gold: true  },
            { text: "Into Every",  italic: false, gold: false },
            { text: "Thread",      italic: false, gold: false },
          ].map((line, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, x: -24 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.1 + i * 0.1 }}
              style={{
                fontFamily: F.display,
                fontWeight: 700,
                fontSize: 56,
                fontStyle: line.italic ? "italic" : "normal",
                color: line.gold ? C.gold : "#FFFDF9",
                lineHeight: 1.05,
                letterSpacing: "-0.5px",
              }}
            >
              {line.text}
            </motion.div>
          ))}
        </div>

        {/* Description */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          style={{ fontFamily: F.ui, fontWeight: 400, fontSize: 15, color: "rgba(245,237,208,0.55)", lineHeight: 1.75, maxWidth: 340, margin: 0 }}
        >
          Four generations of passion, precision, and pure silk craftsmanship. Welcome back.
        </motion.p>
      </div>

      {/* Portal strip — absolute bottom */}
      <div style={{
        position: "absolute" as const, bottom: 40, left: 64, right: 64, zIndex: 2,
        background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.10)",
        borderRadius: 14, padding: "18px 22px",
      }}>
        <div style={{ fontFamily: F.mono, fontSize: 10, fontWeight: 600, letterSpacing: "2px", textTransform: "uppercase" as const, color: "rgba(245,237,208,0.40)", marginBottom: 12 }}>
          This system is used by:
        </div>
        <div style={{ display: "flex", flexWrap: "wrap" as const, gap: "6px 8px" }}>
          {PORTALS.map(p => (
            <span key={p} style={{
              fontFamily: F.ui, fontSize: 11, fontWeight: 500,
              color: C.gold, background: "rgba(196,146,58,0.14)", border: "1px solid rgba(196,146,58,0.25)",
              borderRadius: 999, padding: "5px 14px",
            }}>{p}</span>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── Step 1 — Phone number entry ───────────────────────────────────────────────
function StepPhone({ onSend }: { onSend: (phone: string) => void }) {
  const [phone, setPhone] = useState("");
  const [focused, setFocused] = useState(false);
  const [hovered, setHovered] = useState(false);

  const handleSubmit = () => {
    const clean = phone.replace(/\D/g, "");
    if (clean.length >= 10) onSend(clean.slice(-10));
  };

  return (
    <motion.div
      key="step-phone"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.4 }}
    >
      {/* Card header */}
      <div style={{ textAlign: "center" as const, marginBottom: 28 }}>
        <div style={{ width: 72, height: 72, borderRadius: "50%", background: "#FFFFFF", border: "1px solid rgba(107,26,42,0.12)", display: "inline-flex", alignItems: "center", justifyContent: "center", marginBottom: 18, boxShadow: "0 4px 16px rgba(107,26,42,0.10)" }}>
          <img src={logo} alt="Beere Kesava Logo" style={{ width: 50, height: 50, objectFit: "contain" }} />
        </div>
        <div style={{ fontFamily: F.display, fontWeight: 700, fontSize: 34, color: C.textPrimary, lineHeight: 1.1, marginBottom: 6 }}>Welcome Back</div>
        <div style={{ fontFamily: F.ui, fontWeight: 400, fontSize: 16, color: C.textMuted }}>& Brothers Silks ERP</div>
      </div>

      <div style={{ height: 1, background: "rgba(139,26,46,0.10)", margin: "0 0 28px" }} />

      {/* Label */}
      <div style={{ fontFamily: F.ui, fontWeight: 600, fontSize: 15, color: C.textPrimary, marginBottom: 8 }}>
        Enter Your Mobile Number
      </div>
      <div style={{ fontFamily: F.ui, fontWeight: 400, fontSize: 14, color: C.textMuted, lineHeight: 1.6, marginBottom: 16 }}>
        We will send a 6-digit code to this number. Use the number registered with the system.
      </div>

      {/* Phone input */}
      <div style={{
        display: "flex", alignItems: "center",
        height: 58, background: C.inputBg,
        border: `${focused ? 2 : 1.5}px solid ${focused ? C.burgundy : C.borderStrong}`,
        borderRadius: 14, overflow: "hidden",
        transition: "border 0.15s, box-shadow 0.15s",
        boxShadow: focused ? `0 0 0 4px rgba(107,26,42,0.08)` : "none",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "0 16px", flexShrink: 0 }}>
          <span style={{ fontSize: 22, lineHeight: 1 }}>🇮🇳</span>
          <span style={{ fontFamily: F.mono, fontSize: 14, fontWeight: 600, color: C.textMuted }}>+91</span>
        </div>
        <div style={{ width: 1, height: 28, background: C.border, flexShrink: 0 }} />
        <input
          type="tel"
          value={phone}
          onChange={e => setPhone(e.target.value)}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          onKeyDown={e => e.key === "Enter" && handleSubmit()}
          maxLength={12}
          placeholder="98765 43210"
          style={{
            flex: 1, height: "100%", border: "none", outline: "none",
            background: "transparent", padding: "0 18px",
            fontFamily: F.mono, fontWeight: 500, fontSize: 18, color: C.textPrimary,
          }}
        />
      </div>
      <div style={{ fontFamily: F.ui, fontWeight: 400, fontSize: 13, color: C.textMuted, fontStyle: "italic", marginTop: 8 }}>
        Example: The number your admin registered for you
      </div>

      {/* Send OTP button */}
      <motion.button
        onClick={handleSubmit}
        onHoverStart={() => setHovered(true)}
        onHoverEnd={() => setHovered(false)}
        whileTap={{ scale: 0.98 }}
        style={{
          width: "100%", height: 56, marginTop: 24,
          background: hovered ? C.burgundyHover : C.burgundy,
          border: "none", borderRadius: 999, cursor: "pointer",
          display: "flex", alignItems: "center", justifyContent: "center", gap: 10,
          fontFamily: F.ui, fontWeight: 700, fontSize: 17, color: "#FFFFFF",
          transition: "background 0.18s",
          boxShadow: "0 4px 24px rgba(107,26,42,0.30)",
        }}
      >
        <Phone size={20} color="#FFF" />
        Send OTP to My Number
      </motion.button>

      {/* Info note */}
      <div style={{ marginTop: 18, background: "rgba(196,146,58,0.08)", border: "1px solid rgba(196,146,58,0.22)", borderRadius: 12, padding: "12px 16px", display: "flex", gap: 12, alignItems: "flex-start" }}>
        <Bell size={16} color={C.gold} style={{ flexShrink: 0, marginTop: 2 }} />
        <div style={{ fontFamily: F.ui, fontWeight: 400, fontSize: 13, color: C.textMuted, lineHeight: 1.65 }}>
          Your OTP will be sent via SMS. If SMS does not arrive within 2 minutes, a WhatsApp message will be sent instead.
        </div>
      </div>
    </motion.div>
  );
}

// ── Step 2 — OTP entry ────────────────────────────────────────────────────────
function StepOTP({ phone, onVerify, onBack }: { phone: string; onVerify: (otp: string) => void; onBack: () => void }) {
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
      {/* Card header */}
      <div style={{ textAlign: "center" as const, marginBottom: 28 }}>
        <div style={{ width: 64, height: 64, borderRadius: "50%", background: "rgba(107,26,42,0.08)", display: "inline-flex", alignItems: "center", justifyContent: "center", marginBottom: 18 }}>
          <Phone size={32} color={C.burgundy} />
        </div>
        <div style={{ fontFamily: F.display, fontWeight: 700, fontSize: 34, color: C.textPrimary, lineHeight: 1.1, marginBottom: 8 }}>Check Your Phone</div>
        <div style={{ fontFamily: F.ui, fontWeight: 400, fontSize: 15, color: C.textMuted, marginBottom: 6 }}>We sent a 6-digit code to</div>
        <div style={{ fontFamily: F.mono, fontWeight: 700, fontSize: 17, color: C.burgundy, marginBottom: 6 }}>{formatted}</div>
        <button onClick={onBack} style={{ fontFamily: F.ui, fontWeight: 500, fontSize: 13, color: C.gold, background: "none", border: "none", cursor: "pointer", textDecoration: "underline" }}>
          Change Number
        </button>
      </div>

      <div style={{ height: 1, background: "rgba(139,26,46,0.10)", margin: "0 0 28px" }} />

      {/* OTP boxes */}
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
              fontFamily: F.mono, fontWeight: 700, fontSize: 26,
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

      {/* Error message */}
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

      {/* Timer + resend */}
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

      {/* Verify button */}
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
          fontFamily: F.ui, fontWeight: 700, fontSize: 17, color: "#FFFFFF",
          transition: "background 0.18s",
          boxShadow: otp.length === 6 ? "0 4px 24px rgba(107,26,42,0.30)" : "none",
        }}
      >
        <Check size={20} color="#FFF" />
        Verify and Login
      </motion.button>

      {/* WhatsApp fallback */}
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

// ── Success state ─────────────────────────────────────────────────────────────
function StepSuccess() {
  const [progress, setProgress] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setProgress(p => Math.min(p + 1.5, 100)), 40);
    return () => clearInterval(id);
  }, []);

  return (
    <motion.div
      key="step-success"
      initial={{ opacity: 0, scale: 0.96 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.4 }}
      style={{ textAlign: "center" as const, padding: "12px 0" }}
    >
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: "spring", stiffness: 300, damping: 20, delay: 0.1 }}
        style={{ width: 80, height: 80, borderRadius: "50%", background: C.green, display: "inline-flex", alignItems: "center", justifyContent: "center", marginBottom: 24, boxShadow: "0 8px 32px rgba(30,102,64,0.30)" }}
      >
        <Check size={40} color="#FFF" />
      </motion.div>
      <div style={{ fontFamily: F.display, fontWeight: 700, fontSize: 32, color: C.textPrimary, marginBottom: 12 }}>Login Successful!</div>
      <div style={{ fontFamily: F.ui, fontWeight: 400, fontSize: 15, color: C.textMuted, lineHeight: 1.7 }}>
        Welcome back, Admin.<br />Taking you to your dashboard...
      </div>
      <div style={{ marginTop: 32, height: 4, background: "rgba(196,146,58,0.15)", borderRadius: 2, overflow: "hidden" }}>
        <motion.div style={{ height: "100%", background: C.gold, borderRadius: 2, width: `${progress}%`, transition: "width 0.04s linear" }} />
      </div>
    </motion.div>
  );
}

// ── Main LoginPage ─────────────────────────────────────────────────────────────
export function LoginPage({ onLogin }: { onLogin: () => void }) {
  const [step, setStep] = useState<"phone" | "otp" | "success">("phone");
  const [phone, setPhone] = useState("");

  const handleSend = (p: string) => { setPhone(p); setStep("otp"); };
  const handleVerify = (_otp: string) => {
    setStep("success");
    setTimeout(onLogin, 2800);
  };

  const isMobile = typeof window !== "undefined" && window.innerWidth < 768;

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: C.pageBg, fontFamily: F.ui }}>

      {/* Left brand panel */}
      {!isMobile && <BrandPanel />}

      {/* Right form column */}
      <div style={{
        flex: 1, minHeight: "100vh",
        display: "flex", flexDirection: "column" as const,
        alignItems: "center", justifyContent: "center",
        padding: "40px 24px", position: "relative" as const,
        background: "#FAFAF8",
      }}>

        {/* Mobile-only branding */}
        {isMobile && (
          <div style={{ textAlign: "center" as const, marginBottom: 36 }}>
            <div style={{ width: 60, height: 60, borderRadius: 14, background: "#FFFFFF", border: "1px solid rgba(107,26,42,0.10)", display: "inline-flex", alignItems: "center", justifyContent: "center", marginBottom: 12, boxShadow: "0 2px 12px rgba(107,26,42,0.08)" }}>
              <img src={logo} alt="Beere Kesava Logo" style={{ width: 42, height: 42, objectFit: "contain" }} />
            </div>
            <div style={{ fontFamily: F.display, fontWeight: 700, fontSize: 26, color: C.textPrimary }}>Beere Kesava</div>
            <div style={{ fontFamily: F.display, fontWeight: 400, fontSize: 17, color: C.textMuted }}>& Brothers Silks</div>
          </div>
        )}

        {/* Form card */}
        <div style={{ width: "100%", maxWidth: 440 }}>
          <div style={{
            background: "#FFFFFF",
            borderRadius: 24,
            border: "1px solid rgba(139,26,46,0.10)",
            boxShadow: "0 12px 48px rgba(44,24,16,0.10)",
            padding: "44px 40px",
            overflow: "hidden",
          }}>
            <AnimatePresence mode="wait">
              {step === "phone"   && <StepPhone key="phone" onSend={handleSend} />}
              {step === "otp"     && <StepOTP key="otp" phone={phone} onVerify={handleVerify} onBack={() => setStep("phone")} />}
              {step === "success" && <StepSuccess key="success" />}
            </AnimatePresence>
          </div>

          {/* Security note */}
          <div style={{ textAlign: "center" as const, marginTop: 22, display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
            <Shield size={14} color={C.textMuted} />
            <div style={{ fontFamily: F.ui, fontWeight: 400, fontSize: 13, color: C.textMuted }}>
              This system is secured. Your login is protected and all activity is recorded.
            </div>
          </div>
        </div>

        {/* Footer */}
        <div style={{ position: "absolute" as const, bottom: 28, left: 0, right: 0, textAlign: "center" as const }}>
          <div style={{ fontFamily: F.ui, fontWeight: 400, fontSize: 12, color: C.textMuted, marginBottom: 4 }}>
            © 2026 Beere Kesava & Brothers Silks. All rights reserved.
          </div>
          <div style={{ fontFamily: F.mono, fontWeight: 600, fontSize: 10, color: C.gold, letterSpacing: "2px", textTransform: "uppercase" as const }}>
            Since 1999 · Tradition. Trust. Timeless Quality.
          </div>
        </div>
      </div>
    </div>
  );
}
