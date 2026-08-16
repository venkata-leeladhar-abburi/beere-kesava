import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Phone, Shield, Check, Bell } from "lucide-react";
import crest from "../../../assets/bk-crest.png";
import { imgSareeFooter } from "../../../shared/constants/weaverImages";
import { LoginBrandPanel, Flourish } from "./LoginBrandPanel";
import { StepOTP } from "./StepOTP";
import { Button, Input } from "../../../shared/ui/primitives";

const C = {
  pageBg:        "#F4E6D7",
  pageBgSoft:    "#FBF1E4",
  cardBg:        "#FBF4EA",
  burgundy:      "#6B1A2A",
  burgundyDeep:  "#4A0A16",
  burgundyHover: "#8B1A2E",
  gold:          "#C4923A",
  goldBright:    "#E3B85C",
  textPrimary:   "#1A0A0F",
  textMuted:     "#69635E",
  green:         "#1E6640",
  inputBg:       "#FFFCF6",
  border:        "rgba(139,26,46,0.15)",
  borderStrong:  "rgba(139,26,46,0.20)",
};

const F = {
  display: "'Plus Jakarta Sans', sans-serif",
  ui:      "'Inter', sans-serif",
  mono:    "'JetBrains Mono', monospace",
};

import { authApi } from "../../../shared/api/auth";
import { useAuth, type AuthState } from "../../../contexts/AuthContext";

/** Keep the field readable as it fills: 10 digits, grouped 5 + 5 like the placeholder. */
function formatPhone(raw: string) {
  const d = raw.replace(/\D/g, "").slice(0, 10);
  return d.length > 5 ? `${d.slice(0, 5)} ${d.slice(5)}` : d;
}

function StepPhone({ onSend }: { onSend: (phone: string) => void }) {
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const handleSubmit = async () => {
    const clean = phone.replace(/\D/g, "");
    if (clean.length < 10) return;
    const targetPhone = clean.slice(-10);
    setLoading(true);
    setErrorMsg("");
    try {
      await authApi.requestOtp(targetPhone);
      onSend(targetPhone);
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : "Could not send OTP. Please check your connection and try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div
      key="step-phone"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.4 }}
    >
      <div style={{ textAlign: "center" as const, marginBottom: "clamp(14px, 2.4vh, 26px)" }}>
        <div style={{ fontFamily: F.display, fontWeight: 700, fontSize: "clamp(30px, 4.4vh, 40px)", color: C.burgundyDeep, lineHeight: 1.1, marginBottom: 8 }}>Welcome Back</div>
        <div style={{ fontFamily: F.ui, fontWeight: 400, fontSize: 16, color: C.textMuted }}>&amp; Brothers Silks ERP</div>
        <div style={{ display: "flex", justifyContent: "center", marginTop: "clamp(10px,2vh,18px)" }}>
          <Flourish width={220} />
        </div>
      </div>

      <div style={{ fontFamily: F.ui, fontWeight: 600, fontSize: 15, color: C.burgundyDeep, marginBottom: 8 }}>
        Enter Your Mobile Number
      </div>
      <div style={{ fontFamily: F.ui, fontWeight: 400, fontSize: 14, color: C.textMuted, lineHeight: 1.6, marginBottom: "clamp(10px, 1.8vh, 16px)" }}>
        We will send a 6-digit code to your WhatsApp.
      </div>

      <Input
        type="tel"
        inputMode="numeric"
        autoComplete="tel-national"
        size="lg"
        value={phone}
        onChange={e => setPhone(formatPhone(e.target.value))}
        onKeyDown={e => e.key === "Enter" && handleSubmit()}
        maxLength={11}
        placeholder="98765 43210"
        className="font-mono text-[18px] tracking-[1px] caret-[#6B1A2A]"
        containerClassName="!h-[58px] !rounded-[14px] !bg-[#FFFCF6] !border-[rgba(196,146,58,0.45)]"
        addonLeft={
          <span style={{ display: "flex", alignItems: "center", gap: 10, paddingRight: 12, borderRight: "1px solid rgba(196,146,58,0.30)" }}>
            <span style={{ fontSize: 20, lineHeight: 1 }}>🇮🇳</span>
            <span style={{ fontFamily: "var(--font-mono)", fontSize: 15, fontWeight: 700, color: C.burgundyDeep }}>+91</span>
          </span>
        }
      />

      <Button
        variant="primary"
        size="lg"
        fullWidth
        onClick={handleSubmit}
        disabled={loading || phone.replace(/\D/g, "").length !== 10}
        iconLeft={Phone}
        className="mt-[clamp(14px,2.6vh,24px)] !h-[58px] !rounded-[14px] !text-[16px] !font-semibold shadow-[0_8px_22px_rgba(74,10,22,0.28)] ring-1 ring-[rgba(196,146,58,0.65)]"
      >
        {loading ? "Sending OTP..." : "Send OTP via WhatsApp"}
      </Button>

      {errorMsg && (
        <div style={{ fontFamily: F.ui, fontSize: 13, color: "#C0392B", marginTop: 10 }}>{errorMsg}</div>
      )}

      <div style={{ marginTop: "clamp(10px, 1.8vh, 18px)", background: "rgba(196,146,58,0.10)", border: "1px solid rgba(196,146,58,0.28)", borderRadius: 14, padding: "clamp(10px,1.8vh,14px) 16px", display: "flex", gap: 12, alignItems: "flex-start" }}>
        <Bell size={16} color={C.gold} style={{ flexShrink: 0, marginTop: 2 }} />
        <div style={{ fontFamily: F.ui, fontWeight: 400, fontSize: 13, color: C.textMuted, lineHeight: 1.65 }}>
          Your OTP will be sent via WhatsApp to this number.
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
      <div style={{ fontFamily: F.display, fontWeight: 700, fontSize: 30, color: C.burgundyDeep, marginBottom: 12 }}>Login Successful!</div>
      <div style={{ fontFamily: F.ui, fontWeight: 400, fontSize: 14, color: C.textMuted, lineHeight: 1.7 }}>
        Welcome back, Admin.<br />Taking you to your dashboard...
      </div>
      <div style={{ marginTop: 32, height: 4, background: "rgba(196,146,58,0.18)", borderRadius: 2, overflow: "hidden" }}>
        <motion.div style={{ height: "100%", background: C.gold, borderRadius: 2, width: `${progress}%`, transition: "width 0.04s linear" }} />
      </div>
    </motion.div>
  );
}

export function LoginPage({ onLogin }: { onLogin: () => void }) {
  const [step, setStep] = useState<"phone" | "otp" | "success">("phone");
  const [phone, setPhone] = useState("");
  const { login } = useAuth();

  const handleSend = (p: string) => { setPhone(p); setStep("otp"); };
  const handleVerify = (verifyRes?: { token: string; user: AuthState["user"] }) => {
    if (verifyRes?.token && verifyRes?.user) {
      login(phone, verifyRes.token, verifyRes.user);
    } else {
      login(phone);
    }
    setStep("success");
    setTimeout(onLogin, 1500);
  };

  // Track the breakpoint live — a one-shot read leaves the layout stale on resize/rotate.
  const [isMobile, setIsMobile] = useState(
    () => typeof window !== "undefined" && window.innerWidth < 1024
  );
  useEffect(() => {
    const mq = window.matchMedia("(max-width: 1023px)");
    const onChange = (e: MediaQueryListEvent) => setIsMobile(e.matches);
    setIsMobile(mq.matches);
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);

  return (
    <div style={{ display: "flex", minHeight: "100dvh", background: C.pageBg, fontFamily: F.ui }}>
      {!isMobile && <LoginBrandPanel />}

      <div style={{
        flex: 1, minWidth: 0, minHeight: "100dvh",
        display: "flex", flexDirection: "column" as const,
        alignItems: "center", justifyContent: "center",
        padding: isMobile ? "40px 20px 32px" : "clamp(18px, 3.4vh, 48px) 32px",
        position: "relative" as const,
        background: `radial-gradient(120% 100% at 50% 0%, ${C.pageBgSoft} 0%, ${C.pageBg} 100%)`,
        overflow: "hidden",
      }}>
        {/* Faint damask watermark, matching the weave on the brand panel */}
        <img
          src={imgSareeFooter}
          alt=""
          aria-hidden="true"
          style={{
            position: "absolute", inset: 0, width: "100%", height: "100%",
            objectFit: "cover", opacity: 0.06, mixBlendMode: "multiply" as const,
            pointerEvents: "none", zIndex: 0,
          }}
        />

        {isMobile && (
          <div style={{ textAlign: "center" as const, marginBottom: 28, position: "relative", zIndex: 1 }}>
            <div
              style={{
                width: 132, height: 132, margin: "0 auto", borderRadius: 24,
                background: `radial-gradient(120% 90% at 50% 18%, ${C.burgundyDeep} 0%, #36030B 62%, #2A0208 100%)`,
                border: "1px solid rgba(196,146,58,0.40)",
                boxShadow: "0 10px 30px rgba(74,10,22,0.30)",
                display: "flex", flexDirection: "column" as const, alignItems: "center", justifyContent: "center",
              }}
            >
              <img src={crest} alt="Sree Beere Kesava & Brothers Silks" style={{ width: 62, height: "auto", marginBottom: 8 }} />
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <Flourish width={22} />
                <span style={{ fontFamily: F.display, fontWeight: 600, fontSize: 12, letterSpacing: "5px", color: C.goldBright, paddingLeft: 5 }}>SREE</span>
                <Flourish width={22} />
              </div>
            </div>
          </div>
        )}

        <div className="w-full max-w-[460px]" style={{ position: "relative", zIndex: 1 }}>
          <div style={{
            background: C.cardBg,
            borderRadius: 22,
            border: "1px solid rgba(196,146,58,0.38)",
            boxShadow: "0 18px 60px rgba(74,10,22,0.14), 0 2px 6px rgba(74,10,22,0.06)",
            padding: isMobile ? "34px 26px" : "clamp(18px, 2.8vh, 44px) 40px",
            overflow: "hidden",
          }}>
            <AnimatePresence mode="wait">
              {step === "phone"   && <StepPhone key="phone" onSend={handleSend} />}
              {step === "otp"     && <StepOTP key="otp" phone={phone} onVerify={handleVerify} onBack={() => setStep("phone")} />}
              {step === "success" && <StepSuccess key="success" />}
            </AnimatePresence>
          </div>

          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 12, marginTop: "clamp(12px, 2.2vh, 24px)" }}>
            {!isMobile && <Flourish width={70} />}
            <div className="max-w-[330px]" style={{ display: "flex", alignItems: "flex-start", gap: 8 }}>
              <Shield size={15} color={C.gold} style={{ flexShrink: 0, marginTop: 2 }} />
              <div style={{ fontFamily: F.ui, fontWeight: 400, fontSize: 13, color: C.textMuted, lineHeight: 1.6 }}>
                This system is secured. Your login is protected and all activity is recorded.
              </div>
            </div>
            {!isMobile && <Flourish width={70} />}
          </div>

          <div style={{ textAlign: "center" as const, marginTop: "clamp(11px, 2vh, 22px)" }}>
            <div style={{ fontFamily: F.ui, fontWeight: 400, fontSize: 12, color: C.textMuted, marginBottom: 6 }}>
              © 2026 Sree Beere Kesava &amp; Brothers Silks. All rights reserved.
            </div>
            <div style={{ fontFamily: "var(--font-mono)", fontWeight: 600, fontSize: 12, color: C.gold, letterSpacing: "2px", textTransform: "uppercase" as const, paddingLeft: 2 }}>
              Since 1999 · Tradition · Trust · Timeless Quality
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
