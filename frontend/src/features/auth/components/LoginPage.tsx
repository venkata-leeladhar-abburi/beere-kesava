import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Phone, Shield, Check, Bell } from "lucide-react";
// @ts-ignore
import logo from "../../../assets/logo.webp";
import { LoginBrandPanel } from "./LoginBrandPanel";
import { StepOTP } from "./StepOTP";

const C = {
  pageBg:        "#FFFFFF",
  burgundy:      "#6B1A2A",
  burgundyHover: "#8B1A2E",
  gold:          "#C4923A",
  textPrimary:   "#1A0A0F",
  textMuted:     "#69635E",
  green:         "#1E6640",
  inputBg:       "#FFF8E7",
  border:        "rgba(139,26,46,0.15)",
  borderStrong:  "rgba(139,26,46,0.20)",
};

const F = {
  display: "'Plus Jakarta Sans', sans-serif",
  ui:      "'Inter', sans-serif",
  mono:    "'JetBrains Mono', monospace",
};

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
      <div style={{ textAlign: "center" as const, marginBottom: 28 }}>
        <div style={{ width: 72, height: 72, borderRadius: "50%", background: "#FFFFFF", border: "1px solid rgba(107,26,42,0.12)", display: "inline-flex", alignItems: "center", justifyContent: "center", marginBottom: 18, boxShadow: "0 4px 16px rgba(107,26,42,0.10)" }}>
          <img src={logo} alt="Beere Kesava Logo" style={{ width: 50, height: 50, objectFit: "contain" }} />
        </div>
        <div style={{ fontFamily: F.display, fontWeight: 700, fontSize: 38, color: C.textPrimary, lineHeight: 1.1, marginBottom: 6 }}>Welcome Back</div>
        <div style={{ fontFamily: F.ui, fontWeight: 400, fontSize: 16, color: C.textMuted }}>& Brothers Silks ERP</div>
      </div>

      <div style={{ height: 1, background: "rgba(139,26,46,0.10)", margin: "0 0 28px" }} />

      <div style={{ fontFamily: F.ui, fontWeight: 600, fontSize: 14, color: C.textPrimary, marginBottom: 8 }}>
        Enter Your Mobile Number
      </div>
      <div style={{ fontFamily: F.ui, fontWeight: 400, fontSize: 14, color: C.textMuted, lineHeight: 1.6, marginBottom: 16 }}>
        We will send a 6-digit code to this number. Use the number registered with the system.
      </div>

      <div style={{
        display: "flex", alignItems: "center",
        height: 58, background: C.inputBg,
        border: `${focused ? 2 : 1.5}px solid ${focused ? C.burgundy : C.borderStrong}`,
        borderRadius: 14, overflow: "hidden",
        transition: "border 0.15s, box-shadow 0.15s",
        boxShadow: focused ? `0 0 0 4px rgba(107,26,42,0.08)` : "none",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "0 16px", flexShrink: 0 }}>
          <span style={{ fontSize: 20, lineHeight: 1 }}>🇮🇳</span>
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
          fontFamily: F.ui, fontWeight: 700, fontSize: 16, color: "#FFFFFF",
          transition: "background 0.18s",
          boxShadow: "0 4px 24px rgba(107,26,42,0.30)",
        }}
      >
        <Phone size={20} color="#FFF" />
        Send OTP to My Number
      </motion.button>

      <div style={{ marginTop: 18, background: "rgba(196,146,58,0.08)", border: "1px solid rgba(196,146,58,0.22)", borderRadius: 12, padding: "12px 16px", display: "flex", gap: 12, alignItems: "flex-start" }}>
        <Bell size={16} color={C.gold} style={{ flexShrink: 0, marginTop: 2 }} />
        <div style={{ fontFamily: F.ui, fontWeight: 400, fontSize: 13, color: C.textMuted, lineHeight: 1.65 }}>
          Your OTP will be sent via SMS. If SMS does not arrive within 2 minutes, a WhatsApp message will be sent instead.
        </div>
      </div>
    </motion.div>
  );
}

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
      <div style={{ fontFamily: F.display, fontWeight: 700, fontSize: 30, color: C.textPrimary, marginBottom: 12 }}>Login Successful!</div>
      <div style={{ fontFamily: F.ui, fontWeight: 400, fontSize: 14, color: C.textMuted, lineHeight: 1.7 }}>
        Welcome back, Admin.<br />Taking you to your dashboard...
      </div>
      <div style={{ marginTop: 32, height: 4, background: "rgba(196,146,58,0.15)", borderRadius: 2, overflow: "hidden" }}>
        <motion.div style={{ height: "100%", background: C.gold, borderRadius: 2, width: `${progress}%`, transition: "width 0.04s linear" }} />
      </div>
    </motion.div>
  );
}

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
    <div style={{ display: "flex", minHeight: "100dvh", background: C.pageBg, fontFamily: F.ui }}>
      {!isMobile && <LoginBrandPanel />}

      <div style={{
        flex: 1, minWidth: 0, minHeight: "100dvh",
        display: "flex", flexDirection: "column" as const,
        alignItems: "center", justifyContent: "center",
        padding: "40px 24px", position: "relative" as const,
        background: "#FAFAF8",
      }}>

        {isMobile && (
          <div style={{ textAlign: "center" as const, marginBottom: 36 }}>
            <div style={{ width: 60, height: 60, borderRadius: 14, background: "#FFFFFF", border: "1px solid rgba(107,26,42,0.10)", display: "inline-flex", alignItems: "center", justifyContent: "center", marginBottom: 12, boxShadow: "0 2px 12px rgba(107,26,42,0.08)" }}>
              <img src={logo} alt="Beere Kesava Logo" style={{ width: 42, height: 42, objectFit: "contain" }} />
            </div>
            <div style={{ fontFamily: F.display, fontWeight: 700, fontSize: 24, color: C.textPrimary }}>Beere Kesava</div>
            <div style={{ fontFamily: F.display, fontWeight: 400, fontSize: 16, color: C.textMuted }}>& Brothers Silks</div>
          </div>
        )}

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

          <div style={{ textAlign: "center" as const, marginTop: 22, display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
            <Shield size={14} color={C.textMuted} />
            <div style={{ fontFamily: F.ui, fontWeight: 400, fontSize: 13, color: C.textMuted }}>
              This system is secured. Your login is protected and all activity is recorded.
            </div>
          </div>
        </div>

        <div style={{ position: "absolute" as const, bottom: 28, left: 0, right: 0, textAlign: "center" as const }}>
          <div style={{ fontFamily: F.ui, fontWeight: 400, fontSize: 12, color: C.textMuted, marginBottom: 4 }}>
            © 2026 Beere Kesava & Brothers Silks. All rights reserved.
          </div>
          <div style={{ fontFamily: F.mono, fontWeight: 600, fontSize: 12, color: C.gold, letterSpacing: "2px", textTransform: "uppercase" as const }}>
            Since 1999 · Tradition. Trust. Timeless Quality.
          </div>
        </div>
      </div>
    </div>
  );
}
