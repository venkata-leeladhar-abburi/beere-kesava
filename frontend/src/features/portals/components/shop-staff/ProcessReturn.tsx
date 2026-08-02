import React, { useState, useEffect, useRef, createContext, useContext } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Menu, X, Search, Bell, LogOut, Package, IndianRupee, RotateCcw, 
  Users, BarChart3, ChevronRight, UserRound, ArrowLeft, Plus, MapPin, 
  Phone, Eye, Download, Printer, Filter, Calendar, Activity,
  ShoppingCart, Store, ArrowRight, Tag, Wallet, CreditCard, ChevronDown, CheckCircle2,
  TrendingUp, ArrowDownRight, ArrowUpRight, TrendingDown,
  Camera, Check, AlertTriangle, QrCode, Palette, ThumbsDown, Scale, FileText, ChevronLeft, Building2, ShoppingBag
} from 'lucide-react';

import { C, F, TEAL, Card, Btn, Chip, useCanSeePrices } from './theme';

type MyReturnType = "retail" | "wholesale" | "damage" | null;
type ReturnStep = "type" | 1 | 2 | 3 | "success";
type ReturnRecord = any;
function ProcessReturn({ onBack }: { onBack: () => void }) {
  const canSeePrices = useCanSeePrices();
  const [returnType, setReturnType] = useState<MyReturnType>(null);
  const [step, setStep] = useState<ReturnStep>("type");
  const [returnLog, setReturnLog] = useState<ReturnRecord[]>([
    { id: "RTN-2026-0039", type: "retail", date: "10 Jun 2026", customer: "Smt. Meenakshi", originalSaleId: "RAVI-L2-007", reason: "Wrong Design", amount: "₹12,000" },
    { id: "RTN-2026-0038", type: "retail", date: "05 Jun 2026", customer: "Smt. Kalpana", originalSaleId: "PADMA-L1-001", reason: "Defective", amount: "₹8,500" },
    { id: "RTN-WS-2026-021", type: "wholesale", date: "02 Jun 2026", vendor: "Ravi Silks", design: "BKB-031", color: "Maroon", weight: "920g", wsReason: "Quality Issue" },
  ]);

  // Retail state
  const [saleFound, setSaleFound] = useState(false);
  const [retailManualId, setRetailManualId] = useState("");
  const [reason, setReason] = useState<string | null>(null);
  const [otherReason, setOtherReason] = useState("");

  // Wholesale state
  const [wsVendor, setWsVendor] = useState("");
  const [wsDesign, setWsDesign] = useState("");
  const [wsColor, setWsColor] = useState("");
  const [wsType, setWsType] = useState("Self Brocade");
  const [wsWeight, setWsWeight] = useState("");
  const [wsPrice, setWsPrice] = useState("");
  const [wsReason, setWsReason] = useState<string | null>(null);
  const [wsNewId, setWsNewId] = useState("");
  const [wsBarcodeGenerated, setWsBarcodeGenerated] = useState(false);

  const returnReasons = [
    { id: "defective", label: "Defective", sub: "Damaged or faulty item", Icon: AlertTriangle, color: "#C0392B", bg: "rgba(192,57,43,0.08)" },
    { id: "wrong", label: "Wrong Design", sub: "Doesn't match selection", Icon: Palette, color: "#7A4F2F", bg: "rgba(122,79,47,0.08)" },
    { id: "mind", label: "Changed Mind", sub: "Customer preference", Icon: ThumbsDown, color: C.burg, bg: "rgba(107,26,42,0.08)" },
    { id: "weight", label: "Size / Weight", sub: "Doesn't meet expectations", Icon: Scale, color: C.green, bg: "rgba(30,102,64,0.08)" },
    { id: "other", label: "Other Reason", sub: "Describe in notes", Icon: FileText, color: C.muted, bg: "rgba(139,112,96,0.08)" },
  ];

  const wsReasonOptions = ["Defective", "Quality Issue", "Overstock", "Wrong Design", "Damaged in Transit", "Other"];

  const resetReturn = () => {
    setReturnType(null); setStep("type");
    setSaleFound(false); setRetailManualId(""); setReason(null); setOtherReason("");
    setWsVendor(""); setWsDesign(""); setWsColor(""); setWsType("Self Brocade");
    setWsWeight(""); setWsPrice(""); setWsReason(null); setWsNewId(""); setWsBarcodeGenerated(false);
  };

  const canProceedWsStep1 = wsVendor.trim() !== "" && wsWeight.trim() !== "" && wsReason !== null;

  // ── Shared Header ──
  const Header = () => (
    <div style={{
      background: `linear-gradient(135deg, ${C.dark} 0%, #8B1A1A 100%)`,
      display: "flex", alignItems: "center", padding: "14px 16px", gap: 12,
    }}>
      <button
        onClick={step === "type" ? onBack : () => {
          if (step === 1) { setStep("type"); setReturnType(null); }
          else if (step === 2) setStep(1);
          else if (step === 3) setStep(2);
        }}
        style={{ background: "rgba(255,255,255,0.12)", border: "1px solid rgba(255,255,255,0.20)", borderRadius: 10, width: 38, height: 38, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}
      >
        <ChevronLeft size={20} color="#FFF" />
      </button>
      <div style={{ flex: 1 }}>
        <div style={{ fontFamily: F.m, fontSize: 9, letterSpacing: 2, color: "rgba(255,255,255,0.50)", textTransform: "uppercase" as const, marginBottom: 2 }}>Since 1999</div>
        <div style={{ fontFamily: F.d, fontWeight: 700, fontSize: 20, color: "#FFF" }}>Process Return</div>
      </div>
      <div style={{ width: 38, height: 38, borderRadius: 10, background: "rgba(255,255,255,0.10)", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <RotateCcw size={18} color="rgba(255,255,255,0.70)" />
      </div>
    </div>
  );

  // ── Return History Section ──
  const ReturnHistory = () => (
    <div style={{ margin: "20px 20px 0" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
        <div style={{ width: 4, height: 20, background: C.crim, borderRadius: 2 }} />
        <span style={{ fontFamily: F.u, fontWeight: 600, fontSize: 16, color: C.text }}>Return History</span>
      </div>
      {returnLog.map((r, i) => (
        <div key={i} style={{ background: C.white, border: `1px solid ${C.bdr}`, borderLeft: `3px solid ${r.type === "retail" ? C.crim : C.gold}`, borderRadius: 12, padding: "12px 14px", marginBottom: 8 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
            <span style={{ background: r.type === "retail" ? "rgba(192,57,43,0.10)" : "rgba(196,146,58,0.15)", color: r.type === "retail" ? C.crim : "#8B6520", borderRadius: 999, padding: "2px 8px", fontFamily: F.m, fontSize: 10, fontWeight: 600 }}>{r.id}</span>
            <span style={{ background: r.type === "retail" ? "rgba(192,57,43,0.07)" : "rgba(196,146,58,0.10)", color: r.type === "retail" ? C.crim : C.gold, borderRadius: 999, padding: "2px 8px", fontFamily: F.u, fontSize: 10, fontWeight: 600 }}>{r.type === "retail" ? "Retail" : "Wholesale"}</span>
            <span style={{ marginLeft: "auto", fontFamily: F.m, fontSize: 10, color: C.muted }}>{r.date}</span>
          </div>
          {r.type === "retail" ? (
            <div style={{ fontFamily: F.u, fontSize: 13, color: C.text }}>{r.customer} · {r.originalSaleId} · {r.reason}{canSeePrices && <> · <span style={{ color: C.gold, fontWeight: 600 }}>{r.amount}</span></>}</div>
          ) : (
            <div style={{ fontFamily: F.u, fontSize: 13, color: C.text }}>{r.vendor} · {r.design} · {r.color} · {r.weight} · {r.wsReason}</div>
          )}
        </div>
      ))}
    </div>
  );

  // ── TYPE SELECTION ──
  if (step === "type") {
    return (
      <div style={{ paddingBottom: 32 }}>
        <Header />
        <div style={{ margin: "20px 20px 8px" }}>
          <div style={{ fontFamily: F.u, fontWeight: 600, fontSize: 15, color: C.text, marginBottom: 4 }}>Select Return Type</div>
          <div style={{ fontFamily: F.u, fontSize: 13, color: C.muted }}>Choose the type of return to process</div>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, margin: "0 20px 8px" }}>
          {/* Retail Return card */}
          <button
            onClick={() => { setReturnType("retail"); setStep(1); }}
            style={{ padding: "20px 16px", borderRadius: 16, border: `1.5px solid ${C.bdr}`, background: C.white, cursor: "pointer", display: "flex", flexDirection: "column" as const, alignItems: "flex-start", gap: 12, boxShadow: "0 2px 12px rgba(44,24,16,0.06)", textAlign: "left" as const }}
          >
            <div style={{ width: 48, height: 48, borderRadius: 12, background: "rgba(192,57,43,0.10)", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <ShoppingBag size={24} color={C.crim} />
            </div>
            <div>
              <div style={{ fontFamily: F.u, fontWeight: 700, fontSize: 14, color: C.text, marginBottom: 6 }}>Retail Return</div>
              <div style={{ fontFamily: F.u, fontSize: 12, color: C.muted, lineHeight: 1.5 }}>Customer returning a saree they purchased from our shop. Has original receipt or saree barcode.</div>
            </div>
          </button>
          {/* Wholesale Return card */}
          <button
            onClick={() => { setReturnType("wholesale"); setStep(1); }}
            style={{ padding: "20px 16px", borderRadius: 16, border: `1.5px solid ${C.bdr}`, background: C.white, cursor: "pointer", display: "flex", flexDirection: "column" as const, alignItems: "flex-start", gap: 12, boxShadow: "0 2px 12px rgba(44,24,16,0.06)", textAlign: "left" as const }}
          >
            <div style={{ width: 48, height: 48, borderRadius: 12, background: "rgba(196,146,58,0.12)", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Building2 size={24} color={C.gold} />
            </div>
            <div>
              <div style={{ fontFamily: F.u, fontWeight: 700, fontSize: 14, color: C.text, marginBottom: 6 }}>Wholesale Return</div>
              <div style={{ fontFamily: F.u, fontSize: 12, color: C.muted, lineHeight: 1.5 }}>Saree returned from wholesale buyer. No barcode — a new one will be generated and saree added to inventory.</div>
            </div>
          </button>
        </div>
        <ReturnHistory />
      </div>
    );
  }

  // ── RETAIL SUCCESS ──
  if (step === "success" && returnType === "retail") {
    return (
      <div style={{ paddingBottom: 32 }}>
        <Header />
        <div style={{ padding: "44px 20px", textAlign: "center" as const }}>
          <motion.div initial={{ scale: 0.5, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ type: "spring", stiffness: 200 }}>
            <div style={{ width: 80, height: 80, borderRadius: "50%", background: "rgba(192,57,43,0.10)", border: `2px solid ${C.crim}`, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 20px" }}>
              <RotateCcw size={36} color={C.crim} />
            </div>
          </motion.div>
          <div style={{ fontFamily: F.d, fontWeight: 700, fontSize: 26, color: C.text, marginBottom: 8 }}>Return Processed</div>
          <div style={{ fontFamily: F.u, fontSize: 14, color: C.muted, lineHeight: 1.65, marginBottom: 20 }}>
            PADMA-L1-004 has been returned successfully.<br />Shop inventory updated. Customer profile updated.
          </div>
          <div style={{ display: "inline-flex", alignItems: "center", gap: 8, background: "rgba(107,26,42,0.08)", color: C.burg, borderRadius: 999, padding: "8px 18px", fontFamily: F.m, fontSize: 12, marginBottom: 14 }}>
            <FileText size={13} color={C.burg} /> RTN-2026-0041
          </div>
          <div style={{ fontFamily: F.u, fontSize: 13, color: C.muted, marginBottom: 8 }}>Customer: Smt. Meenakshi · PADMA-L1-004</div>
          <div style={{ display: "flex", flexDirection: "column" as const, gap: 10, marginTop: 16 }}>
            <Btn label="Process Another Return" icon={<RotateCcw size={16} />} onClick={resetReturn} style={{ width: "100%", background: C.crim }} />
            <Btn label="Back to Home" icon={<ChevronLeft size={16} />} variant="ghost" onClick={onBack} style={{ width: "100%" }} />
          </div>
        </div>
      </div>
    );
  }

  // ── WHOLESALE SUCCESS ──
  if (step === "success" && returnType === "wholesale") {
    return (
      <div style={{ paddingBottom: 32 }}>
        <Header />
        <div style={{ padding: "44px 20px 20px", textAlign: "center" as const }}>
          <motion.div initial={{ scale: 0.5, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ type: "spring", stiffness: 200 }}>
            <div style={{ width: 80, height: 80, borderRadius: "50%", background: "rgba(30,102,64,0.10)", border: `2px solid ${C.green}`, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 20px" }}>
              <Check size={38} color={C.green} />
            </div>
          </motion.div>
          <div style={{ fontFamily: F.d, fontWeight: 700, fontSize: 26, color: C.text, marginBottom: 8 }}>Return Processed — Added to Inventory</div>
          <div style={{ display: "inline-flex", alignItems: "center", gap: 8, background: "rgba(196,146,58,0.12)", color: "#8B6520", borderRadius: 999, padding: "8px 18px", fontFamily: F.m, fontSize: 12, marginBottom: 20 }}>
            <QrCode size={13} color={C.gold} /> {wsNewId}
          </div>
        </div>
        <Card style={{ margin: "0 20px 16px", overflow: "hidden" }}>
          <div style={{ height: 4, background: `linear-gradient(90deg, ${C.gold}, rgba(196,146,58,0.3))` }} />
          <div style={{ padding: 18 }}>
            {/* Barcode visual */}
            <div style={{ background: "#111", borderRadius: 8, padding: "14px 10px", marginBottom: 16, display: "flex", flexDirection: "column" as const, alignItems: "center", gap: 6 }}>
              <div style={{ display: "flex", gap: 2, alignItems: "flex-end", height: 40 }}>
                {[3, 1, 4, 1, 2, 3, 1, 2, 4, 1, 3, 2, 1, 4, 2, 1, 3, 1, 2, 3].map((w, i) => (
                  <div key={i} style={{ width: w * 2, background: "#FFF", height: i % 3 === 0 ? 40 : i % 2 === 0 ? 34 : 38, borderRadius: 1 }} />
                ))}
              </div>
              <div style={{ fontFamily: F.m, fontSize: 10, color: "#AAA", letterSpacing: 2 }}>{wsNewId}</div>
            </div>
            <div style={{ fontFamily: F.u, fontSize: 13, color: C.muted, textAlign: "center" as const, marginBottom: 14 }}>This saree has been added to shop inventory</div>
            {[
              ["Vendor", wsVendor || "—"], ["Design Code", wsDesign || "—"],
              ["Color", wsColor || "—"], ["Weight", wsWeight ? `${wsWeight}g` : "—"],
            ].map(([k, v], i) => (
              <div key={i} style={{ display: "flex", justifyContent: "space-between", marginBottom: 10, paddingBottom: 10, borderBottom: i < 3 ? `1px solid ${C.bdr}` : "none" }}>
                <span style={{ fontFamily: F.u, fontSize: 12, color: C.muted }}>{k}</span>
                <span style={{ fontFamily: F.u, fontWeight: 600, fontSize: 13, color: C.text }}>{v}</span>
              </div>
            ))}
          </div>
        </Card>
        <div style={{ padding: "0 20px", display: "flex", flexDirection: "column" as const, gap: 10 }}>
          <Btn label="Print Barcode Label" icon={<Printer size={16} />} style={{ width: "100%", background: C.burg }} />
          <Btn label="Process Another Return" icon={<RotateCcw size={16} />} onClick={resetReturn} style={{ width: "100%", background: C.green }} />
        </div>
      </div>
    );
  }

  // ── RETAIL STEPS ──
  if (returnType === "retail") {
    return (
      <div style={{ paddingBottom: 32 }}>
        <Header />
        {/* Progress */}
        <div style={{ padding: "16px 20px 8px" }}>
          <div style={{ display: "flex", gap: 4 }}>
            {(["Find Sale", "Return Reason", "Confirm"] as const).map((label, i) => (
              <div key={i} style={{ flex: 1 }}>
                <div style={{ height: 4, borderRadius: 999, background: (i + 1) <= (step as number) ? C.crim : "rgba(192,57,43,0.15)", marginBottom: 5 }} />
                <div style={{ fontFamily: F.m, fontSize: 9, letterSpacing: 0.8, textTransform: "uppercase" as const, color: (i + 1) <= (step as number) ? C.crim : C.muted, textAlign: "center" as const }}>{label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Step 1 — Find Sale */}
        {step === 1 && (
          <div style={{ marginTop: 12 }}>
            {!saleFound ? (
              <>
                <div
                  onClick={() => setSaleFound(true)}
                  style={{
                    margin: "0 20px 18px",
                    background: `linear-gradient(135deg, ${C.dark} 0%, #8B1A1A 100%)`,
                    borderRadius: 20, padding: "32px 24px", cursor: "pointer",
                    display: "flex", flexDirection: "column" as const, alignItems: "center", gap: 14,
                    position: "relative" as const, overflow: "hidden",
                    boxShadow: "0 12px 36px rgba(192,57,43,0.28)",
                  }}
                >
                  <div style={{ position: "absolute" as const, top: -28, right: -28, width: 130, height: 130, borderRadius: "50%", background: "rgba(192,57,43,0.22)" }} />
                  <div style={{ position: "absolute" as const, bottom: -36, left: -20, width: 110, height: 110, borderRadius: "50%", background: "rgba(255,255,255,0.04)" }} />
                  <div style={{ width: 72, height: 72, borderRadius: 18, position: "relative" as const, zIndex: 1, background: "rgba(255,255,255,0.12)", border: "1.5px solid rgba(255,255,255,0.22)", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 4px 16px rgba(0,0,0,0.22)" }}>
                    <Camera size={34} color="#FFF" />
                  </div>
                  <div style={{ textAlign: "center" as const, position: "relative" as const, zIndex: 1 }}>
                    <div style={{ fontFamily: F.d, fontWeight: 700, fontSize: 20, color: "#FFF", marginBottom: 6 }}>Scan Saree Barcode</div>
                    <div style={{ fontFamily: F.u, fontSize: 13, color: "rgba(255,255,255,0.65)", lineHeight: 1.55 }}>Scan the saree tag to locate the original sale record</div>
                  </div>
                  <div style={{ background: "rgba(255,255,255,0.16)", border: "1px solid rgba(255,255,255,0.30)", borderRadius: 999, padding: "9px 24px", position: "relative" as const, zIndex: 1, fontFamily: F.u, fontWeight: 600, fontSize: 13, color: "#FFF" }}>
                    Tap to Open Camera
                  </div>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 12, margin: "0 20px 16px" }}>
                  <div style={{ flex: 1, height: 1, background: C.bdr }} />
                  <span style={{ fontFamily: F.u, fontSize: 12, color: C.muted }}>or enter manually</span>
                  <div style={{ flex: 1, height: 1, background: C.bdr }} />
                </div>
                <div style={{ margin: "0 20px" }}>
                  <label style={{ fontFamily: F.u, fontWeight: 500, fontSize: 13, color: C.muted, display: "block", marginBottom: 8 }}>Saree ID</label>
                  <div style={{ display: "flex", gap: 10 }}>
                    <input value={retailManualId} onChange={e => setRetailManualId(e.target.value)} placeholder="e.g. PADMA-L1-004"
                      style={{ flex: 1, height: 52, background: C.inp, border: `1.5px solid ${C.bdr}`, borderRadius: 12, padding: "0 16px", fontFamily: F.m, fontSize: 14, color: C.text, outline: "none" }}
                    />
                    {retailManualId.length > 3 && (
                      <button onClick={() => setSaleFound(true)} style={{ height: 52, borderRadius: 12, background: C.crim, border: "none", padding: "0 20px", fontFamily: F.u, fontWeight: 600, fontSize: 14, color: "#FFF", cursor: "pointer" }}>Find</button>
                    )}
                  </div>
                </div>
              </>
            ) : (
              <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
                <div style={{ margin: "0 20px 14px", background: "rgba(30,102,64,0.08)", border: `1.5px solid ${C.green}`, borderRadius: 12, padding: "12px 16px", display: "flex", alignItems: "center", gap: 12 }}>
                  <div style={{ width: 34, height: 34, borderRadius: "50%", background: C.green, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    <Check size={17} color="#FFF" />
                  </div>
                  <div>
                    <div style={{ fontFamily: F.u, fontWeight: 600, fontSize: 13, color: C.green }}>Original Sale Found</div>
                    <div style={{ fontFamily: F.m, fontSize: 11, color: C.muted }}>Sale record located in system</div>
                  </div>
                </div>
                <Card style={{ margin: "0 20px 16px", overflow: "hidden" }}>
                  <div style={{ height: 4, background: `linear-gradient(90deg, ${C.crim}, rgba(192,57,43,0.3))` }} />
                  <div style={{ padding: 18 }}>
                    <div style={{ fontFamily: F.u, fontWeight: 600, fontSize: 11, letterSpacing: 1, color: C.muted, marginBottom: 14, textTransform: "uppercase" as const }}>Original Sale Details</div>
                    {[
                      ["Saree ID", "PADMA-L1-004", true],
                      ["Design", "BKB-045 · Cream Zari Border Saree", false],
                      ["Sale Date", "05 Jun 2026", true],
                      ["Customer", "Smt. Meenakshi", false],
                      ...(canSeePrices ? [["Amount Paid", "₹8,500", false]] : []),
                      ["Payment Method", "UPI", true],
                    ].map(([k, v, mono], i) => (
                      <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12, paddingBottom: 12, borderBottom: `1px solid ${C.bdr}` }}>
                        <span style={{ fontFamily: F.u, fontSize: 12, color: C.muted }}>{k as string}</span>
                        <span style={{ fontFamily: mono ? F.m : F.u, fontWeight: 600, fontSize: 13, color: (k as string) === "Amount Paid" ? C.gold : C.text, textAlign: "right" as const }}>{v as string}</span>
                      </div>
                    ))}
                  </div>
                </Card>
                <div style={{ padding: "0 20px", display: "flex", gap: 10 }}>
                  <button onClick={() => setSaleFound(false)} style={{ height: 52, borderRadius: 12, border: `1px solid ${C.bdr}`, background: "transparent", padding: "0 18px", fontFamily: F.u, fontSize: 13, color: C.muted, cursor: "pointer" }}>Rescan</button>
                  <Btn label="Next — Return Reason →" onClick={() => setStep(2)} style={{ flex: 1, background: C.crim }} />
                </div>
              </motion.div>
            )}
          </div>
        )}

        {/* Step 2 — Return Reason */}
        {step === 2 && (
          <div style={{ marginTop: 12 }}>
            <div style={{ margin: "0 20px 16px" }}>
              <div style={{ fontFamily: F.u, fontWeight: 600, fontSize: 15, color: C.text, marginBottom: 4 }}>Return Reason</div>
              <div style={{ fontFamily: F.u, fontSize: 13, color: C.muted }}>Why is the customer returning this saree?</div>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, margin: "0 20px 10px" }}>
              {returnReasons.slice(0, 4).map(r => (
                <button key={r.id} onClick={() => setReason(r.id)} style={{
                  padding: "16px 14px", borderRadius: 14,
                  border: `${reason === r.id ? 2 : 1}px solid ${reason === r.id ? r.color : C.bdr}`,
                  background: reason === r.id ? r.bg : C.white,
                  cursor: "pointer", display: "flex", flexDirection: "column" as const, alignItems: "flex-start", gap: 8,
                  position: "relative" as const,
                }}>
                  <div style={{ width: 40, height: 40, borderRadius: 10, background: reason === r.id ? r.bg : "rgba(107,26,42,0.05)", display: "flex", alignItems: "center", justifyContent: "center", border: reason === r.id ? `1px solid ${r.color}40` : "none" }}>
                    <r.Icon size={20} color={reason === r.id ? r.color : C.muted} />
                  </div>
                  <div style={{ textAlign: "left" as const }}>
                    <div style={{ fontFamily: F.u, fontWeight: 600, fontSize: 13, color: reason === r.id ? r.color : C.text }}>{r.label}</div>
                    <div style={{ fontFamily: F.u, fontSize: 11, color: C.muted, marginTop: 2 }}>{r.sub}</div>
                  </div>
                  {reason === r.id && (
                    <div style={{ position: "absolute" as const, top: 8, right: 8, width: 18, height: 18, borderRadius: "50%", background: r.color, display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <Check size={10} color="#FFF" />
                    </div>
                  )}
                </button>
              ))}
            </div>
            {(() => {
              const r = returnReasons[4];
              return (
                <button onClick={() => setReason(r.id)} style={{
                  margin: "0 20px 16px", width: "calc(100% - 40px)", padding: "14px 18px", borderRadius: 14,
                  border: `${reason === r.id ? 2 : 1}px solid ${reason === r.id ? r.color : C.bdr}`,
                  background: reason === r.id ? r.bg : C.white,
                  cursor: "pointer", display: "flex", alignItems: "center", gap: 12, position: "relative" as const,
                }}>
                  <div style={{ width: 40, height: 40, borderRadius: 10, background: reason === r.id ? r.bg : "rgba(107,26,42,0.05)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <r.Icon size={20} color={reason === r.id ? r.color : C.muted} />
                  </div>
                  <div style={{ textAlign: "left" as const }}>
                    <div style={{ fontFamily: F.u, fontWeight: 600, fontSize: 13, color: reason === r.id ? r.color : C.text }}>{r.label}</div>
                    <div style={{ fontFamily: F.u, fontSize: 11, color: C.muted }}>{r.sub}</div>
                  </div>
                  {reason === r.id && (
                    <div style={{ marginLeft: "auto", width: 18, height: 18, borderRadius: "50%", background: r.color, display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <Check size={10} color="#FFF" />
                    </div>
                  )}
                </button>
              );
            })()}
            {reason === "other" && (
              <div style={{ margin: "0 20px 16px" }}>
                <label style={{ fontFamily: F.u, fontWeight: 500, fontSize: 13, color: C.text, display: "block", marginBottom: 8 }}>Additional Notes</label>
                <textarea value={otherReason} onChange={e => setOtherReason(e.target.value)} placeholder="Describe the return reason in detail..." rows={3}
                  style={{ width: "100%", background: C.inp, border: `1.5px solid ${C.bdr}`, borderRadius: 12, padding: "12px 16px", fontFamily: F.u, fontSize: 14, color: C.text, outline: "none", resize: "none" as const, boxSizing: "border-box" as const }}
                />
              </div>
            )}
            <div style={{ padding: "0 20px", display: "flex", gap: 10 }}>
              <Btn label="← Back" variant="ghost" onClick={() => setStep(1)} style={{ flex: 1 }} />
              <Btn label="Next — Confirm →" onClick={() => reason && setStep(3)} style={{ flex: 2, background: reason ? C.crim : "#C0C0C0", cursor: reason ? "pointer" : "not-allowed" }} />
            </div>
          </div>
        )}

        {/* Step 3 — Confirm Return */}
        {step === 3 && (
          <div style={{ marginTop: 12 }}>
            <div style={{ margin: "0 20px 16px" }}>
              <div style={{ fontFamily: F.u, fontWeight: 600, fontSize: 15, color: C.text, marginBottom: 4 }}>Confirm Return</div>
              <div style={{ fontFamily: F.u, fontSize: 13, color: C.muted }}>Please review before confirming</div>
            </div>
            <Card style={{ margin: "0 20px 14px", overflow: "hidden" }}>
              <div style={{ height: 4, background: `linear-gradient(90deg, ${C.crim}, rgba(192,57,43,0.3))` }} />
              <div style={{ padding: 18 }}>
                {[
                  { label: "Saree", value: "PADMA-L1-004 · BKB-045" },
                  { label: "Customer", value: "Smt. Meenakshi" },
                  { label: "Original Sale", value: "05 Jun 2026" },
                  { label: "Return Reason", value: returnReasons.find(r => r.id === reason)?.label ?? "Other" },
                ].map(({ label, value }, i) => (
                  <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12, paddingBottom: 12, borderBottom: `1px solid ${C.bdr}` }}>
                    <span style={{ fontFamily: F.u, fontSize: 12, color: C.muted }}>{label}</span>
                    <span style={{ fontFamily: F.u, fontWeight: 600, fontSize: 13, color: C.text, textAlign: "right" as const, maxWidth: "60%" }}>{value}</span>
                  </div>
                ))}
                {otherReason && reason === "other" && (
                  <div style={{ background: "rgba(107,26,42,0.05)", borderRadius: 8, padding: "10px 12px", marginBottom: 12 }}>
                    <div style={{ fontFamily: F.u, fontSize: 11, color: C.muted, marginBottom: 4 }}>Notes</div>
                    <div style={{ fontFamily: F.u, fontSize: 13, color: C.text }}>{otherReason}</div>
                  </div>
                )}
              </div>
            </Card>
            <div style={{ margin: "0 20px 16px", background: "rgba(192,57,43,0.06)", border: `1px solid rgba(192,57,43,0.22)`, borderRadius: 12, padding: "12px 16px", display: "flex", alignItems: "flex-start", gap: 10 }}>
              <AlertTriangle size={15} color={C.crim} style={{ flexShrink: 0, marginTop: 1 }} />
              <div style={{ fontFamily: F.u, fontSize: 12, color: "#8B2020", lineHeight: 1.55 }}>
                Confirming will add PADMA-L1-004 back to shop inventory and update the customer's purchase record.
              </div>
            </div>
            <div style={{ padding: "0 20px", display: "flex", flexDirection: "column" as const, gap: 10 }}>
              <Btn label="Confirm Return" icon={<RotateCcw size={16} />} onClick={() => {
                setReturnLog(prev => [{ id: `RTN-2026-${String(Date.now()).slice(-4)}`, type: "retail", date: "13 Jun 2026", customer: "Smt. Meenakshi", originalSaleId: "PADMA-L1-004", reason: returnReasons.find(r => r.id === reason)?.label ?? reason ?? "Other", amount: "₹8,500" }, ...prev]);
                setStep("success");
              }} style={{ width: "100%", background: C.crim, height: 56 }} />
              <Btn label="← Edit Details" variant="ghost" onClick={() => setStep(2)} style={{ width: "100%" }} />
            </div>
          </div>
        )}
      </div>
    );
  }

  // ── WHOLESALE STEPS ──
  return (
    <div style={{ paddingBottom: 32 }}>
      <Header />
      {/* Progress */}
      <div style={{ padding: "16px 20px 8px" }}>
        <div style={{ display: "flex", gap: 4 }}>
          {(["Saree Details", "Generate Barcode"] as const).map((label, i) => (
            <div key={i} style={{ flex: 1 }}>
              <div style={{ height: 4, borderRadius: 999, background: (i + 1) <= (step as number) ? C.gold : "rgba(196,146,58,0.20)", marginBottom: 5 }} />
              <div style={{ fontFamily: F.m, fontSize: 9, letterSpacing: 0.8, textTransform: "uppercase" as const, color: (i + 1) <= (step as number) ? "#8B6520" : C.muted, textAlign: "center" as const }}>{label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Step 1 — Saree Details */}
      {step === 1 && (
        <div style={{ marginTop: 12 }}>
          <Card style={{ margin: "0 20px 16px", overflow: "hidden" }}>
            <div style={{ height: 4, background: `linear-gradient(90deg, ${C.gold}, rgba(196,146,58,0.3))` }} />
            <div style={{ padding: 18 }}>
              <div style={{ fontFamily: F.u, fontWeight: 600, fontSize: 15, color: C.text, marginBottom: 16 }}>Enter Saree Details</div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                {[
                  { label: "Vendor / Source Name", val: wsVendor, setter: setWsVendor, placeholder: "e.g. Ravi Silks", type: "text" },
                  { label: "Design Code", val: wsDesign, setter: setWsDesign, placeholder: "e.g. BKB-045", type: "text" },
                  { label: "Saree Color", val: wsColor, setter: setWsColor, placeholder: "e.g. Maroon", type: "text" },
                ].map((f, i) => (
                  <div key={i} style={{ gridColumn: i === 0 ? "1 / -1" : undefined }}>
                    <label style={{ fontFamily: F.u, fontWeight: 500, fontSize: 12, color: C.muted, display: "block", marginBottom: 6 }}>{f.label}</label>
                    <input value={f.val} onChange={e => f.setter(e.target.value)} placeholder={f.placeholder} type={f.type}
                      style={{ width: "100%", height: 46, background: C.inp, border: `1.5px solid ${C.bdr}`, borderRadius: 10, padding: "0 14px", fontFamily: F.u, fontSize: 14, color: C.text, outline: "none", boxSizing: "border-box" as const }}
                    />
                  </div>
                ))}
                <div>
                  <label style={{ fontFamily: F.u, fontWeight: 500, fontSize: 12, color: C.muted, display: "block", marginBottom: 6 }}>Saree Type</label>
                  <select value={wsType} onChange={e => setWsType(e.target.value)}
                    style={{ width: "100%", height: 46, background: C.inp, border: `1.5px solid ${C.bdr}`, borderRadius: 10, padding: "0 14px", fontFamily: F.u, fontSize: 14, color: C.text, outline: "none" }}>
                    {["Self Brocade", "Heavy Zari", "Plain Silk", "Kanjivaram", "Cotton"].map(t => <option key={t}>{t}</option>)}
                  </select>
                </div>
                <div>
                  <label style={{ fontFamily: F.u, fontWeight: 500, fontSize: 12, color: C.muted, display: "block", marginBottom: 6 }}>Weight (grams)</label>
                  <input value={wsWeight} onChange={e => setWsWeight(e.target.value)} placeholder="e.g. 840" type="number"
                    style={{ width: "100%", height: 46, background: C.inp, border: `1.5px solid ${C.bdr}`, borderRadius: 10, padding: "0 14px", fontFamily: F.m, fontSize: 14, color: C.text, outline: "none", boxSizing: "border-box" as const }}
                  />
                </div>
                {canSeePrices && (
                  <div style={{ gridColumn: "1 / -1" }}>
                    <label style={{ fontFamily: F.u, fontWeight: 500, fontSize: 12, color: C.muted, display: "block", marginBottom: 6 }}>Original Purchase Price ₹</label>
                    <input value={wsPrice} onChange={e => setWsPrice(e.target.value)} placeholder="e.g. 6500" type="number"
                      style={{ width: "100%", height: 46, background: C.inp, border: `1.5px solid ${C.bdr}`, borderRadius: 10, padding: "0 14px", fontFamily: F.m, fontSize: 14, color: C.text, outline: "none", boxSizing: "border-box" as const }}
                    />
                  </div>
                )}
              </div>
            </div>
          </Card>
          <div style={{ margin: "0 20px 16px" }}>
            <div style={{ fontFamily: F.u, fontWeight: 500, fontSize: 13, color: C.muted, marginBottom: 10 }}>Return Reason</div>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" as const }}>
              {wsReasonOptions.map(r => (
                <button key={r} onClick={() => setWsReason(r)} style={{
                  padding: "6px 14px", borderRadius: 999,
                  border: `${wsReason === r ? 2 : 1}px solid ${wsReason === r ? C.gold : C.bdr}`,
                  background: wsReason === r ? "rgba(196,146,58,0.12)" : "transparent",
                  fontFamily: F.u, fontSize: 12, fontWeight: wsReason === r ? 600 : 400,
                  color: wsReason === r ? "#8B6520" : C.muted, cursor: "pointer",
                }}>{r}</button>
              ))}
            </div>
          </div>
          <div style={{ margin: "0 20px 16px", display: "flex", gap: 10 }}>
            <button onClick={() => { }} style={{ flex: 1, height: 46, border: `1.5px dashed ${C.bdr}`, borderRadius: 12, background: "transparent", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 8, fontFamily: F.u, fontSize: 13, color: C.muted }}>
              <Camera size={16} color={C.muted} /> Add Photo
            </button>
            <button onClick={() => { }} style={{ flex: 1, height: 46, border: `1.5px dashed ${C.bdr}`, borderRadius: 12, background: "transparent", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 8, fontFamily: F.u, fontSize: 13, color: C.muted }}>
              <Package size={16} color={C.muted} /> From Gallery
            </button>
          </div>
          <div style={{ padding: "0 20px", display: "flex", gap: 10 }}>
            <Btn label="← Back" variant="ghost" onClick={() => { setStep("type"); setReturnType(null); }} style={{ flex: 1 }} />
            <Btn label="Next — Barcode →" onClick={() => canProceedWsStep1 && setStep(2)} style={{ flex: 2, background: canProceedWsStep1 ? C.gold : "#C0C0C0", color: canProceedWsStep1 ? C.text : "#888", cursor: canProceedWsStep1 ? "pointer" : "not-allowed" }} />
          </div>
        </div>
      )}

      {/* Step 2 — Generate Barcode */}
      {step === 2 && (
        <div style={{ marginTop: 12 }}>
          <Card style={{ margin: "0 20px 16px", overflow: "hidden" }}>
            <div style={{ height: 4, background: `linear-gradient(90deg, ${C.gold}, rgba(196,146,58,0.3))` }} />
            <div style={{ padding: 18 }}>
              <div style={{ fontFamily: F.u, fontWeight: 600, fontSize: 14, color: C.muted, textTransform: "uppercase" as const, letterSpacing: 1, marginBottom: 14 }}>Review — Saree Details</div>
              {[
                ["Vendor", wsVendor || "—"], ["Design Code", wsDesign || "—"],
                ["Color", wsColor || "—"], ["Type", wsType],
                ["Weight", wsWeight ? `${wsWeight} grams` : "—"],
                ...(canSeePrices ? [["Price", wsPrice ? `₹${wsPrice}` : "—"]] : []),
                ["Return Reason", wsReason || "—"],
              ].map(([k, v], i, arr) => (
                <div key={i} style={{ display: "flex", justifyContent: "space-between", marginBottom: 10, paddingBottom: 10, borderBottom: i < arr.length - 1 ? `1px solid ${C.bdr}` : "none" }}>
                  <span style={{ fontFamily: F.u, fontSize: 12, color: C.muted }}>{k}</span>
                  <span style={{ fontFamily: F.u, fontWeight: 600, fontSize: 13, color: C.text }}>{v}</span>
                </div>
              ))}
            </div>
          </Card>

          {!wsBarcodeGenerated ? (
            <div style={{ margin: "0 20px 16px", textAlign: "center" as const }}>
              <button
                onClick={() => {
                  setWsNewId(`RTN-WS-2026-${String(Date.now()).slice(-3)}`);
                  setWsBarcodeGenerated(true);
                }}
                style={{ width: "100%", height: 58, borderRadius: 14, border: `2px solid ${C.gold}`, background: "rgba(196,146,58,0.10)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 12, fontFamily: F.u, fontWeight: 700, fontSize: 15, color: "#8B6520" }}
              >
                <QrCode size={22} color={C.gold} /> Generate New Barcode
              </button>
            </div>
          ) : (
            <div style={{ margin: "0 20px 16px" }}>
              <div style={{ background: "#111", borderRadius: 14, padding: "20px 16px", textAlign: "center" as const, marginBottom: 12 }}>
                <div style={{ display: "flex", gap: 2, alignItems: "flex-end", height: 48, justifyContent: "center", marginBottom: 8 }}>
                  {[3, 1, 4, 1, 2, 3, 1, 2, 4, 1, 3, 2, 1, 4, 2, 1, 3, 1, 2, 3, 2, 1, 4].map((w, i) => (
                    <div key={i} style={{ width: w * 2, background: "#FFF", height: i % 3 === 0 ? 48 : i % 2 === 0 ? 38 : 44, borderRadius: 1 }} />
                  ))}
                </div>
                <div style={{ fontFamily: F.m, fontSize: 12, color: "#AAA", letterSpacing: 2 }}>{wsNewId}</div>
              </div>
              <div style={{ background: "rgba(30,102,64,0.08)", border: `1px solid rgba(30,102,64,0.22)`, borderRadius: 10, padding: "12px 14px", marginBottom: 14, display: "flex", alignItems: "center", gap: 10 }}>
                <Check size={15} color={C.green} />
                <span style={{ fontFamily: F.u, fontSize: 13, color: C.green }}>This saree will be added to shop inventory with ID {wsNewId}</span>
              </div>
            </div>
          )}

          <div style={{ padding: "0 20px", display: "flex", flexDirection: "column" as const, gap: 10 }}>
            {wsBarcodeGenerated && (
              <Btn label="Confirm — Add to Inventory" icon={<Check size={16} />} onClick={() => {
                setReturnLog(prev => [{ id: wsNewId, type: "wholesale", date: "13 Jun 2026", vendor: wsVendor, design: wsDesign, color: wsColor, weight: wsWeight ? `${wsWeight}g` : "—", wsReason: wsReason ?? "—", newSareeId: wsNewId }, ...prev]);
                setStep("success");
              }} style={{ width: "100%", background: C.green, height: 56 }} />
            )}
            <Btn label="← Back" variant="ghost" onClick={() => setStep(1)} style={{ width: "100%" }} />
          </div>
        </div>
      )}
    </div>
  );
}

export { ProcessReturn };
