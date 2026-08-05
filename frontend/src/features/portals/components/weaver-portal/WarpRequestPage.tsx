
import React, { useState, useRef, useEffect, useCallback, useMemo } from "react";
import { useLocation, useNavigate } from "react-router";
import { createPortal } from "react-dom";
import { useResponsive } from "../../../../hooks/useResponsive";
import { useBatches, SareeRow } from "../../../production/contexts/BatchContext";
import { useDesignLibrary, DesignEntry } from "../../../design-library/contexts/DesignLibraryContext";
import { DesignCodeCard } from "../../../design-library/components/DesignLibraryPage";
import { useMaterialIssue, MaterialIssueRecord, JARI_REEL_GRAMS } from "../../../materials/contexts/MaterialIssueContext";
import { useWeaverPayments } from "../../../weavers/contexts/WeaverPaymentsContext";
import { useAuth } from "../../../../contexts/AuthContext";
import { motion, AnimatePresence, useInView } from "motion/react";
import {
  Bell, ClipboardList, CheckSquare, Palette, ArrowUpRight,
  Wallet, Shield, Send, ChevronRight, X, ChevronLeft,
  Package, Check, Eye, LogOut, Search, RotateCcw,
  AlertCircle, Clock, Flower2, Layers, Info, Pencil,
  Scissors, LayoutGrid, CreditCard, ClipboardCheck,
  TrendingUp, ArrowRight, Sparkles, UserRound,
  CheckCircle2, History, ListChecks,
  AlertTriangle, Inbox, Zap,
} from "lucide-react";
import { imgBKLogo } from "../../../../shared/constants/weaverImages";

// ─── Design Tokens ─────────────────────────────────────────────────────────
import {
  C, F, SAREE_TYPE_RATES, DesignDetailCard, SareeTypeDetailCard, SectionTitle, Card, ProgressBar, StatusBadge, SignatureCanvas, MaterialHistoryCard, HeroHeader, DesignCodeTileGrid, MobileBatchCard, CompletedBatchCard, BATCH_QUICK_FILTERS, BatchQuickFilterPills, CURRENT_WEAVER_ID, CURRENT_MONTH_LABEL, GROSS_CHARGES, TOTAL_DEDUCTIONS, NET_AMOUNT, PAST_MONTHS, WN_T, WN_G, WN_EASE, WN_NUM, WN_DATA, WN_PRIORITY, WN_CATEGORY, WN_FILTERS, WNFadeUp, BATCH_LIST, BATCH_STATUS_CFG, BatchCard, FadeUpBatch, BG_IMAGE, FABRIC_BG
} from './theme';


export function WarpRequestPage() {
  const { isMobile, isTablet } = useResponsive();
  const [selectedBatch, setSelectedBatch] = useState<"086" | "089">("086");
  const [materials, setMaterials] = useState({ warp: false, resham: false, jari: false });
  const [amounts, setAmounts] = useState({ warp: "", resham: "", jari: "" });
  const [reason, setReason] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [showForm, setShowForm] = useState(true);

  // BATCH-086 is 60% (above 50% = unlocked), BATCH-089 is 50% (unlocked)
  const batchProgress = selectedBatch === "086"
    ? { total: 5, done: 3, pct: 60, unlocked: true }
    : { total: 8, done: 4, pct: 50, unlocked: true };

  // Demo: BATCH-086 locked at 37.5% for demonstration; switch logic below
  const isLocked = selectedBatch === "086" ? false : false; // both unlocked per spec

  if (submitted) {
    return (
      <div style={{ padding: "60px 20px", textAlign: "center" as const }}>
        <div style={{ width: 72, height: 72, borderRadius: "50%", background: "rgba(30,102,64,0.12)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 20px" }}>
          <Check size={36} color={C.green} />
        </div>
        <div style={{ fontFamily: F.d, fontWeight: 600, fontSize: 20, color: C.text, marginBottom: 12 }}>Request Sent!</div>
        <div style={{ fontFamily: F.u, fontSize: 14, color: C.muted, lineHeight: 1.6, marginBottom: 28 }}>Your request has been sent to the worker staff, admin, and superadmin. You will be notified when a decision is made.</div>
        <button onClick={() => { setSubmitted(false); setMaterials({ warp: false, resham: false, jari: false }); setAmounts({ warp: "", resham: "", jari: "" }); setReason(""); }} style={{ width: "100%", height: 52, background: C.burg, border: "none", borderRadius: 999, fontFamily: F.u, fontWeight: 600, fontSize: 16, color: "#FFF", cursor: "pointer" }}>
          ← Back to Warp Requests
        </button>
      </div>
    );
  }

  return (
    <div style={{ paddingBottom: 32 }}>
      <HeroHeader eyebrow="SINCE 1999 · WARP REQUEST" title="Raise Warp Request" sub="Request additional material" />

      {/* Batch Selector */}
      <div style={{ padding: "16px 20px 8px" }}>
        <div style={{ fontFamily: F.u, fontSize: 14, color: C.text, marginBottom: 10 }}>Which batch?</div>
        <div style={{ display: "flex", gap: 10 }}>
          {(["086", "089"] as const).map(b => (
            <button key={b} onClick={() => setSelectedBatch(b)} style={{
              padding: "8px 20px", borderRadius: 999, border: `1px solid ${C.burg}`,
              background: selectedBatch === b ? C.burg : "transparent",
              color: selectedBatch === b ? "#FFF" : C.burg,
              fontFamily: F.m, fontSize: 12, cursor: "pointer", fontWeight: 600,
            }}>BATCH-{b}</button>
          ))}
        </div>
      </div>

      {isLocked ? (
        /* STATE A — LOCKED */
        <>
          <div style={{ margin: "16px 20px" }}>
            <Card style={{ padding: 28, textAlign: "center" as const }}>
              <div style={{ width: 72, height: 72, borderRadius: "50%", background: "rgba(139,26,46,0.12)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px" }}>
                <Shield size={32} color={C.burg} />
              </div>
              <div style={{ fontFamily: F.d, fontWeight: 600, fontSize: 20, color: C.text, marginBottom: 12 }}>Warp Request Locked</div>
              <div style={{ fontFamily: F.u, fontSize: 14, color: C.muted, lineHeight: 1.6, maxWidth: 300, margin: "0 auto 20px" }}>
                You can raise a warp request only after submitting 50% of your batch. This ensures enough progress before more material is given.
              </div>
              <div style={{ fontFamily: F.u, fontSize: 14, color: C.muted, marginBottom: 8 }}>Your current progress:</div>
              <div style={{ fontFamily: F.d, fontWeight: 700, fontSize: 24, color: C.text, marginBottom: 12 }}>3 of 8 sarees submitted</div>
              <ProgressBar pct={37.5} height={12} />
              <div style={{ fontFamily: F.m, fontSize: 12, color: C.muted, textAlign: "right" as const, marginTop: 4, marginBottom: 16 }}>37.5% complete</div>
              <div style={{ background: C.cream, borderRadius: 10, padding: "12px 16px", textAlign: "left" as const }}>
                <div style={{ fontFamily: F.u, fontSize: 13, color: C.text, lineHeight: 1.5, marginBottom: 8 }}>You need 1 more saree to unlock the warp request (50% = 4 sarees)</div>
                <ProgressBar pct={(37.5 / 50) * 100} height={6} />
              </div>
            </Card>
          </div>
          <div style={{ margin: "0 20px" }}>
            <button disabled style={{ width: "100%", height: 56, background: "#E0D5CC", border: "none", borderRadius: 999, fontFamily: F.u, fontWeight: 600, fontSize: 14, color: C.muted, cursor: "not-allowed", display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
              <Shield size={18} /> Warp Request — Locked
            </button>
          </div>
        </>
      ) : (
        /* STATE B — UNLOCKED */
        <>
          <div style={{ margin: "16px 20px", background: "rgba(30,102,64,0.10)", border: `1px solid ${C.green}`, borderRadius: 12, padding: "14px 18px", display: "flex", alignItems: "flex-start", gap: 10 }}>
            <Check size={18} color={C.green} style={{ marginTop: 2, flexShrink: 0 }} />
            <div>
              <div style={{ fontFamily: F.u, fontWeight: 600, fontSize: 14, color: C.green, marginBottom: 4 }}>Warp Request Unlocked!</div>
              <div style={{ fontFamily: F.u, fontSize: 13, color: C.muted }}>You have submitted 50% of your batch. You can now request additional raw material.</div>
            </div>
          </div>

          {/* Progress */}
          <div style={{ margin: "0 20px 16px", textAlign: "center" as const }}>
            <div style={{ fontFamily: F.d, fontWeight: 700, fontSize: 24, color: C.text, marginBottom: 10 }}>
              {batchProgress.done} of {batchProgress.total} sarees submitted
            </div>
            <ProgressBar pct={batchProgress.pct} height={12} />
            <div style={{ fontFamily: F.m, fontSize: 12, color: C.muted, textAlign: "right" as const, marginTop: 4 }}>{batchProgress.pct}% complete</div>
          </div>

          {/* Request Form */}
          <SectionTitle title="Request Materials" />
          <div style={{ margin: isMobile ? "0 20px 16px" : "0 auto 16px", maxWidth: isMobile ? undefined : isTablet ? "80%" : 560, padding: isMobile ? undefined : "0 20px" }}>
            <Card style={{ padding: 20 }}>
              {/* Batch Reference */}
              <div style={{ marginBottom: 18 }}>
                <div style={{ fontFamily: F.u, fontWeight: 500, fontSize: 14, color: C.text, marginBottom: 8 }}>Batch Reference</div>
                <div style={{ display: "inline-block", background: "rgba(107,26,42,0.08)", color: C.burg, borderRadius: 999, padding: "6px 16px", fontFamily: F.m, fontSize: 14 }}>BATCH-{selectedBatch}</div>
              </div>

              {/* Material checkboxes */}
              <div style={{ marginBottom: 18 }}>
                <div style={{ fontFamily: F.u, fontWeight: 500, fontSize: 14, color: C.text, marginBottom: 12 }}>What material do you need? *</div>
                {(["warp", "resham", "jari"] as const).map(mat => (
                  <label key={mat} style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 0", cursor: "pointer", borderBottom: mat !== "jari" ? `1px solid ${C.bdr}` : "none" }}>
                    <div
                      onClick={() => setMaterials(m => ({ ...m, [mat]: !m[mat] }))} role="button" tabIndex={0} onKeyDown={e => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); (() => setMaterials(m => ({ ...m, [mat]: !m[mat] })))?.(); } }}
                      style={{
                        width: 24, height: 24, borderRadius: 6, border: `2px solid ${materials[mat] ? C.burg : C.bdr}`,
                        background: materials[mat] ? C.burg : "transparent", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, cursor: "pointer",
                      }}>
                      {materials[mat] && <Check size={14} color="#FFF" />}
                    </div>
                    <span style={{ fontFamily: F.u, fontWeight: 500, fontSize: 14, color: C.text }}>
                      {mat === "warp" ? "More Warp" : mat === "resham" ? "More Resham" : "More Jari"}
                    </span>
                  </label>
                ))}
              </div>

              {/* Amount fields per checked material */}
              {(["warp", "resham", "jari"] as const).filter(m => materials[m]).map(mat => (
                <div key={mat} style={{ marginBottom: 14 }}>
                  <label style={{ display: "block", fontFamily: F.u, fontWeight: 500, fontSize: 14, color: C.text, marginBottom: 6 }}>
                    {mat === "warp" ? "Warp amount (kg):" : mat === "resham" ? "Resham amount (kg) and color:" : "Jari amount (reels):"}
                  </label>
                  <input
                    value={amounts[mat]} onChange={e => setAmounts(a => ({ ...a, [mat]: e.target.value }))}
                    placeholder={mat === "warp" ? "e.g. 3" : mat === "resham" ? "e.g. 500g Red" : "e.g. 4 reels"}
                    style={{ width: "100%", height: 56, background: C.inp, border: `1px solid ${C.bdr}`, borderRadius: 12, padding: "0 16px", fontFamily: F.m, fontSize: 16, color: C.text, outline: "none", boxSizing: "border-box" as const }}
                  />
                </div>
              ))}

              {/* Reason */}
              <div style={{ marginBottom: 4 }}>
                <label style={{ display: "block", fontFamily: F.u, fontWeight: 500, fontSize: 14, color: C.text, marginBottom: 6 }}>Why do you need more material?</label>
                <textarea
                  value={reason} onChange={e => setReason(e.target.value)}
                  placeholder="Example: Extra sarees needed for a big order"
                  rows={3}
                  style={{ width: "100%", minHeight: 100, background: C.inp, border: `1px solid ${C.bdr}`, borderRadius: 14, padding: "12px 16px", fontFamily: F.u, fontSize: 14, color: C.text, outline: "none", resize: "none", boxSizing: "border-box" as const }}
                />
              </div>
            </Card>
          </div>

          <div style={{ margin: isMobile ? "0 20px" : "0 auto", maxWidth: isMobile ? undefined : isTablet ? "80%" : 560, padding: isMobile ? undefined : "0 20px", display: "flex", justifyContent: isMobile ? undefined : "flex-end" }}>
            <button
              onClick={() => (materials.warp || materials.resham || materials.jari) ? setSubmitted(true) : undefined}
              style={{ width: isMobile ? "100%" : 200, height: 56, background: C.burg, border: "none", borderRadius: 999, fontFamily: F.u, fontWeight: 600, fontSize: 14, color: "#FFF", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
              <Send size={18} /> Send Warp Request
            </button>
          </div>
        </>
      )}

      {/* Previous Requests */}
      <SectionTitle title="Your Previous Requests" />
      {(() => {
        const PREV_REQUESTS = [
          { id: "WR-014-01", material: "3 kg Warp", batch: "BATCH-086", date: "10 Jun 2026", status: "✓ Approved", color: C.green, bg: "rgba(30,102,64,0.10)" },
          { id: "WR-014-02", material: "Resham Red 500g", batch: "BATCH-089", date: "05 Jun 2026", status: "✗ Rejected", color: C.crim, bg: "rgba(192,57,43,0.10)" },
          { id: "WR-014-03", material: "2 kg Warp", batch: "BATCH-086", date: "01 Jun 2026", status: "✓ Approved", color: C.green, bg: "rgba(30,102,64,0.10)" },
        ];
        if (isMobile) {
          return PREV_REQUESTS.map((r, i) => (
            <div key={i} style={{ margin: "0 20px 8px", background: C.white, border: `1px solid ${C.bdr}`, borderRadius: 12, padding: "14px 16px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <div>
                <div style={{ fontFamily: F.m, fontSize: 12, color: C.muted }}>{r.date}</div>
                <div style={{ fontFamily: F.u, fontSize: 14, color: C.text, marginTop: 2 }}>{r.material}</div>
              </div>
              <StatusBadge label={r.status} color={r.color} bg={r.bg} />
            </div>
          ));
        }
        return (
          <div style={{ margin: "0 20px 8px", background: C.white, border: `1px solid ${C.bdr}`, borderRadius: 12, overflowX: isTablet ? "auto" : "hidden" }}>
            <div style={{ minWidth: isTablet ? 640 : undefined }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1.4fr 1fr 1fr 1fr", padding: "10px 16px", borderBottom: `1px solid ${C.bdr}`, background: C.cream }}>
                {["Request ID", "Material", "Batch", "Status", "Date"].map(h => (
                  <div key={h} style={{ fontFamily: F.u, fontSize: 12, fontWeight: 700, color: C.muted }}>{h}</div>
                ))}
              </div>
              {PREV_REQUESTS.map((r, i) => (
                <div key={i} style={{ display: "grid", gridTemplateColumns: "1fr 1.4fr 1fr 1fr 1fr", padding: "12px 16px", borderBottom: i < PREV_REQUESTS.length - 1 ? `1px solid rgba(107,26,42,0.06)` : "none", alignItems: "center" }}>
                  <div style={{ fontFamily: F.m, fontSize: 12, color: C.burg }}>{r.id}</div>
                  <div style={{ fontFamily: F.u, fontSize: 13, color: C.text }}>{r.material}</div>
                  <div style={{ fontFamily: F.m, fontSize: 12, color: C.muted }}>{r.batch}</div>
                  <div><StatusBadge label={r.status} color={r.color} bg={r.bg} /></div>
                  <div style={{ fontFamily: F.u, fontSize: 12, color: C.muted }}>{r.date}</div>
                </div>
              ))}
            </div>
          </div>
        );
      })()}
    </div>
  );
}

// ─── PAGE 05 — PAYMENT LEDGER ─────────────────────────────────────────────
