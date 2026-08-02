import { materialTypeIcon } from "./MyBatchesPage";

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


export function ConfirmMaterialPage({ onGoToBatches }: { onGoToBatches?: () => void } = {}) {
  const { isMobile, isTablet, cols } = useResponsive();
  const { getRecordsForWeaver, updateSignatureStatus, getMaterialSummaryForWeaver, getMaterialSummaryByBatch } = useMaterialIssue();
  const { batches } = useBatches();
  const { getDesign } = useDesignLibrary();

  const matSummary = getMaterialSummaryForWeaver(CURRENT_WEAVER_ID);
  const matByBatch = getMaterialSummaryByBatch(CURRENT_WEAVER_ID);

  const [sigMethod, setSigMethod] = useState<"none" | "here" | "remote">("none");
  const [hasSig, setHasSig] = useState(false);
  const [confirmed, setConfirmed] = useState(false);
  const [confirmedRecord, setConfirmedRecord] = useState<MaterialIssueRecord | null>(null);
  const [requestSent, setRequestSent] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [historyTab, setHistoryTab] = useState<"materials" | "batches" | "sarees">("materials");
  const [viewDesign, setViewDesign] = useState<DesignEntry | null>(null);

  const weaverRecords = getRecordsForWeaver(CURRENT_WEAVER_ID);
  const pendingRecords = weaverRecords.filter(r => r.status === "pending-signature");
  const signedRecords = weaverRecords.filter(r => r.status === "signed");
  const pending = pendingRecords[0] ?? null;

  const mySarees = useMemo(() => {
    return batches.flatMap(b =>
      b.rows
        .filter(r => r.weaverId === CURRENT_WEAVER_ID)
        .map(r => ({
          batchId: b.batchId,
          sareeId: r.sareeId || "Pending Setup",
          designCode: r.designCode || "—",
          sareeTypeCode: r.sareeTypeCode || "—",
          sareeTypeName: r.sareeTypeName || "—",
          loom: r.weaverLoom || "—",
          qcPassed: r.qcPassed
        }))
    );
  }, [batches]);

  const myWeavingBatches = useMemo(() => {
    return batches
      .map(b => {
        const rows = b.rows.filter(r => r.weaverId === CURRENT_WEAVER_ID);
        return {
          batchId: b.batchId,
          status: b.status,
          dueDate: b.dueDate,
          rowsCount: rows.length,
          passedCount: rows.filter(r => r.qcPassed === true).length
        };
      })
      .filter(b => b.rowsCount > 0);
  }, [batches]);

  const myDesignCodes = Array.from(new Set(
    batches
      .filter(b => b.status === "active")
      .flatMap(b => b.rows)
      .filter(r => r.weaverId === CURRENT_WEAVER_ID)
      .map(r => r.designCode)
      .filter((c): c is string => Boolean(c))
  ));

  const canConfirm = (sigMethod === "here" && hasSig) || (sigMethod === "remote" && requestSent);

  const handleConfirm = () => {
    if (!pending || !canConfirm) return;
    updateSignatureStatus(pending.id, sigMethod === "remote" ? "remote" : "here");
    setConfirmedRecord(pending);
    setConfirmed(true);
  };

  const resetToPending = () => {
    setConfirmed(false); setConfirmedRecord(null);
    setSigMethod("none"); setHasSig(false); setRequestSent(false);
  };

  if (confirmed && confirmedRecord) {
    return (
      <div style={{ padding: "60px 20px", textAlign: "center" as const }}>
        <div style={{ width: 72, height: 72, borderRadius: "50%", background: "rgba(30,102,64,0.12)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 20px" }}>
          <Check size={36} color={C.green} />
        </div>
        <div style={{ fontFamily: F.d, fontWeight: 600, fontSize: 22, color: C.text, marginBottom: 12 }}>Materials Confirmed!</div>
        <div style={{ fontFamily: F.u, fontSize: 14, color: C.muted, lineHeight: 1.6, marginBottom: 16 }}>You have confirmed receipt of all materials in {confirmedRecord.id}. Good luck with your weaving!</div>
        <div style={{ display: "inline-block", background: "rgba(107,26,42,0.08)", color: C.burg, borderRadius: 999, padding: "6px 16px", fontFamily: F.m, fontSize: 14, marginBottom: 28 }}>{confirmedRecord.id}</div>
        <button onClick={resetToPending} style={{ display: "block", width: "100%", height: 52, background: C.burg, border: "none", borderRadius: 999, fontFamily: F.u, fontWeight: 600, fontSize: 16, color: "#FFF", cursor: "pointer", marginBottom: 10 }}>
          View More Pending Receipts
        </button>
        <button onClick={onGoToBatches} style={{ display: "block", width: "100%", height: 48, background: "none", border: `1px solid ${C.bdr}`, borderRadius: 999, fontFamily: F.u, fontWeight: 600, fontSize: 14, color: C.muted, cursor: "pointer" }}>
          ← Go to My Batches
        </button>
      </div>
    );
  }

  return (
    <div style={{ paddingBottom: 32 }}>
      <HeroHeader eyebrow="SINCE 1999 · MATERIAL RECEIPT" title="Confirm Materials" sub="Sign to confirm receipt" />

      {pending ? (
        <>
          {/* Alert card */}
          <div style={{ margin: "16px 20px", background: "rgba(196,146,58,0.15)", border: `2px solid ${C.gold}`, borderRadius: 16, padding: "18px 20px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
              <Bell size={24} color={C.gold} />
              <span style={{ fontFamily: F.u, fontWeight: 600, fontSize: 16, color: C.text }}>Material Handover Pending Confirmation</span>
            </div>
            <div style={{ fontFamily: F.u, fontSize: 14, color: C.muted, lineHeight: 1.6, marginBottom: 12 }}>
              Your materials have been issued. Please review the list below and sign to confirm receipt.
            </div>
            <div style={{ display: "flex", gap: 16 }}>
              <span style={{ fontFamily: F.m, fontSize: 14, color: C.burg }}>{pending.id}</span>
              <span style={{ fontFamily: F.u, fontSize: 13, color: C.muted }}>Issued {new Date(pending.issuedAt).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}</span>
            </div>
          </div>

          {/* Materials List */}
          <SectionTitle title="Materials You Are Receiving" />
          <div style={{ display: "grid", gridTemplateColumns: cols(1, 2, 2), gap: 10, margin: "0 20px 10px" }}>
            {pending.materials.map((m, i) => (
              <div key={i} style={{ background: C.white, border: `1px solid ${C.bdr}`, borderRadius: 12, padding: "16px 18px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8, justifyContent: "center" }}>
                  {materialTypeIcon(m.materialType)}
                  <span style={{ fontFamily: F.u, fontWeight: 600, fontSize: 16, color: C.text }}>
                    {m.materialType}{m.materialType === "Warp" && m.warpSubtype ? ` — ${m.warpSubtype}` : ""}
                  </span>
                </div>
                <div style={{ fontFamily: F.d, fontWeight: 700, fontSize: 22, color: C.gold, textAlign: "center" as const, marginBottom: 4 }}>
                  {m.quantity} {m.unit}{m.materialType === "Jari" ? ` (${m.jariType} · ${m.jariGrade} · ${m.jariColor})` : ""}
                </div>
                {m.description && <div style={{ fontFamily: F.u, fontSize: 13, color: C.muted, textAlign: "center" as const, marginBottom: 4 }}>{m.description}</div>}
                <div style={{ fontFamily: F.m, fontSize: 11, color: C.muted, textAlign: "center" as const }}>From batch: {m.grnBatchId}</div>
              </div>
            ))}
          </div>

          {/* Design Codes */}
          <SectionTitle title="Your Design Instructions" />
          <div style={{ fontFamily: F.u, fontSize: 13, color: C.muted, margin: "-4px 20px 12px" }}>
            Tap a design code to view full weaving instructions.
          </div>
          {myDesignCodes.length === 0 ? (
            <div style={{ margin: "0 20px 16px", background: C.cream, borderRadius: 12, padding: "18px 16px", textAlign: "center" as const }}>
              <div style={{ fontFamily: F.u, fontSize: 13, color: C.muted }}>Design codes will appear here once assigned by Admin.</div>
            </div>
          ) : (
            <div style={{ marginBottom: 16 }}>
              <DesignCodeTileGrid codes={myDesignCodes} onOpen={code => { const d = getDesign(code); if (d) setViewDesign(d); }} />
            </div>
          )}
          <AnimatePresence>
            {viewDesign && <DesignCodeCard design={viewDesign} onClose={() => setViewDesign(null)} />}
          </AnimatePresence>

          {/* Signature Section */}
          <SectionTitle title="Your Signature" />
          <div style={{ fontFamily: F.u, fontSize: 13, color: C.muted, margin: "-4px 20px 14px", lineHeight: 1.5 }}>
            Sign below to confirm you have received all materials listed above. This creates a permanent record.
          </div>

          {/* Option A + Option B: side by side on tablet/desktop, stacked on mobile */}
          <div style={{ display: "flex", flexDirection: isMobile ? "column" as const : "row" as const, gap: 12, margin: "0 20px 10px" }}>
          <div style={{ flex: 1 }}>
            <button onClick={() => setSigMethod(sigMethod === "here" ? "none" : "here")} style={{
              width: "100%", background: C.white, border: `1px solid ${sigMethod === "here" ? C.burg : C.bdr}`, borderRadius: 12, padding: 16,
              cursor: "pointer", textAlign: "left" as const,
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <span style={{ fontSize: 20 }}>📱</span>
                <div>
                  <div style={{ fontFamily: F.u, fontWeight: 600, fontSize: 14, color: C.text }}>Sign here on this phone</div>
                  <div style={{ fontFamily: F.u, fontSize: 12, color: C.muted, marginTop: 2 }}>If the worker is with you, sign directly below</div>
                </div>
              </div>
            </button>
          </div>

          {/* Option B */}
          <div style={{ flex: 1 }}>
            <button onClick={() => setSigMethod(sigMethod === "remote" ? "none" : "remote")} style={{
              width: "100%", background: C.white, border: `1px solid ${sigMethod === "remote" ? C.burg : C.bdr}`, borderRadius: 12, padding: 16,
              cursor: "pointer", textAlign: "left" as const, marginBottom: sigMethod === "remote" ? 10 : 0,
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <span style={{ fontSize: 20 }}>📲</span>
                <div>
                  <div style={{ fontFamily: F.u, fontWeight: 600, fontSize: 14, color: C.text }}>Sign on your own phone</div>
                  <div style={{ fontFamily: F.u, fontSize: 12, color: C.muted, marginTop: 2 }}>Worker will send you a notification to sign on your own device</div>
                </div>
              </div>
            </button>
            <AnimatePresence>
              {sigMethod === "remote" && (
                <motion.div key="remote" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                  {requestSent ? (
                    <div style={{ background: "rgba(30,102,64,0.08)", border: `1px solid ${C.green}`, borderRadius: 10, padding: "12px 16px", display: "flex", alignItems: "center", gap: 8 }}>
                      <Check size={16} color={C.green} />
                      <span style={{ fontFamily: F.u, fontSize: 14, color: C.green }}>Signature request sent to your phone!</span>
                    </div>
                  ) : (
                    <button onClick={() => setRequestSent(true)} style={{ width: "100%", height: 48, border: `1px solid ${C.gold}`, background: "transparent", borderRadius: 999, fontFamily: F.u, fontWeight: 600, fontSize: 15, color: C.gold, cursor: "pointer" }}>
                      Send Signature Request
                    </button>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
          </div>

          {/* Signature Box (Option A) */}
          <AnimatePresence>
            {sigMethod === "here" && (
              <motion.div key="sigbox" initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} style={{ overflow: "hidden" }}>
                <div style={{ padding: "0 0 16px 0", margin: isMobile ? "0" : "0 auto", maxWidth: isMobile ? undefined : isTablet ? "100%" : 560, ...(isMobile ? {} : { paddingLeft: 20, paddingRight: 20 }) }}>
                  <SignatureCanvas onSigned={setHasSig} />
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Confirm Button */}
          <div style={{ margin: "0 20px" }}>
            <div style={{ background: C.cream, borderRadius: 10, padding: "10px 14px", marginBottom: 12 }}>
              <span style={{ fontFamily: F.u, fontSize: 12, color: C.muted }}>By signing and confirming, you agree that you have received all the materials listed above. This record is permanent.</span>
            </div>
            <button
              onClick={handleConfirm}
              style={{
                width: "100%", height: 56, background: canConfirm ? C.green : "#C0C0C0",
                border: "none", borderRadius: 999, fontFamily: F.u, fontWeight: 600, fontSize: 16, color: "#FFF",
                cursor: canConfirm ? "pointer" : "not-allowed",
                display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
              }}>
              <Check size={20} /> Confirm Material Receipt
            </button>
          </div>
        </>
      ) : (
        /* Empty state */
        <div style={{ margin: 20 }}>
          <Card style={{ padding: 32, textAlign: "center" as const }}>
            <div style={{ width: 56, height: 56, borderRadius: "50%", background: "rgba(30,102,64,0.12)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px" }}>
              <Check size={28} color={C.green} />
            </div>
            <div style={{ fontFamily: F.d, fontWeight: 600, fontSize: 20, color: C.text, marginBottom: 10 }}>No pending material receipt</div>
            <div style={{ fontFamily: F.u, fontSize: 14, color: C.muted, lineHeight: 1.6, marginBottom: 20 }}>All material receipts are confirmed. Nothing pending.</div>
            <button onClick={onGoToBatches} style={{ width: "100%", height: 48, background: C.burg, border: "none", borderRadius: 999, fontFamily: F.u, fontWeight: 600, fontSize: 14, color: "#FFF", cursor: "pointer" }}>Go to My Batches</button>
          </Card>
        </div>
      )}

      {/* Outstanding Material with the weaver */}
      {matByBatch.length > 0 && (() => {
        const fmtKg = (g: number) => `${(g / 1000).toFixed(2)} kg`;
        const outColor = matSummary.outstandingGrams > 0 ? C.crim : C.green;
        return (
          <div style={{ marginTop: 28 }}>
            <SectionTitle title="Material Still With You" />
            <div style={{ fontFamily: F.u, fontSize: 13, color: C.muted, margin: "-4px 20px 12px", lineHeight: 1.5 }}>
              Material issued minus the weight of sarees you have submitted. Jari is counted at 1 reel = {JARI_REEL_GRAMS} g.
            </div>

            {/* Totals */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10, margin: "0 20px 14px" }}>
              {[
                { label: "Issued", value: fmtKg(matSummary.issuedGrams), color: C.text },
                { label: "Submitted", value: fmtKg(matSummary.receivedGrams), color: C.green },
                { label: "Outstanding", value: fmtKg(matSummary.outstandingGrams), color: outColor },
              ].map(s => (
                <div key={s.label} style={{ background: C.white, border: `1px solid ${C.bdr}`, borderRadius: 12, padding: "14px 12px", textAlign: "center" as const }}>
                  <div style={{ fontFamily: F.u, fontSize: 11, fontWeight: 700, color: C.muted, textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: 6 }}>{s.label}</div>
                  <div style={{ fontFamily: F.d, fontSize: 20, fontWeight: 700, color: s.color, lineHeight: 1.1 }}>{s.value}</div>
                </div>
              ))}
            </div>

            {/* Batch wise — combined with the handovers that make up each batch */}
            <div style={{ margin: "0 20px", display: "flex", flexDirection: "column" as const, gap: 16 }}>
              {(() => {
                const recordsByBatch = new Map<string, typeof weaverRecords>();
                weaverRecords.forEach(r => {
                  const key = r.batchId || "Unassigned";
                  if (!recordsByBatch.has(key)) recordsByBatch.set(key, []);
                  recordsByBatch.get(key)!.push(r);
                });
                return matByBatch.map(b => {
                  const records = (recordsByBatch.get(b.batchId) ?? []).slice()
                    .sort((a, c) => new Date(c.issuedAt).getTime() - new Date(a.issuedAt).getTime());
                  return (
                    <div key={b.batchId} style={{ background: C.white, border: `1px solid ${C.bdr}`, borderRadius: 12, overflow: "hidden" }}>
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 16px", background: C.cream, borderBottom: `1px solid ${C.bdr}`, flexWrap: "wrap" as const, gap: 6 }}>
                        <span style={{ fontFamily: F.m, fontSize: 13, fontWeight: 700, color: C.burg }}>{b.batchId}</span>
                        <span style={{ fontFamily: F.u, fontSize: 11.5, color: C.muted }}>{b.sareesReceived} saree{b.sareesReceived !== 1 ? "s" : ""} submitted</span>
                      </div>
                      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", borderBottom: `1px solid ${C.bdr}` }}>
                        {[
                          { label: "Issued", value: fmtKg(b.issuedGrams), color: C.text },
                          { label: "Submitted", value: fmtKg(b.receivedGrams), color: C.green },
                          { label: "Outstanding", value: fmtKg(b.outstandingGrams), color: b.outstandingGrams > 0 ? C.crim : C.green },
                        ].map((s, i) => (
                          <div key={s.label} style={{ padding: "10px 14px", borderRight: i < 2 ? `1px solid ${C.bdr}` : "none" }}>
                            <div style={{ fontFamily: F.u, fontSize: 10, fontWeight: 700, color: C.muted, textTransform: "uppercase", letterSpacing: "0.4px", marginBottom: 4 }}>{s.label}</div>
                            <div style={{ fontFamily: F.m, fontSize: 14, fontWeight: 700, color: s.color }}>{s.value}</div>
                          </div>
                        ))}
                      </div>
                      <div style={{ padding: "14px 16px", display: "flex", flexDirection: "column" as const, gap: 12 }}>
                        {records.map(r => (
                          <MaterialHistoryCard key={r.id} r={r} isTablet={isTablet} />
                        ))}
                      </div>
                    </div>
                  );
                });
              })()}
            </div>
          </div>
        );
      })()}

      {/* Complete Reference History */}
      <div style={{ marginTop: 28 }}>
        <button onClick={() => setHistoryOpen(v => !v)} style={{ width: "100%", background: "none", border: "none", cursor: "pointer", padding: "0 20px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <SectionTitle title="Complete Reference History" />
          <ChevronRight size={18} color={C.muted} style={{ transform: historyOpen ? "rotate(90deg)" : "none", transition: "transform 0.2s" }} />
        </button>
        <AnimatePresence>
          {historyOpen && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} style={{ overflow: "hidden" }}>
              
              {/* History Tabs Switcher */}
              <div style={{ display: "flex", gap: 10, padding: "10px 20px 16px 20px", borderBottom: `1px solid ${C.bdr}` }}>
                {[
                  { id: "materials", label: "Material Receipts" },
                  { id: "batches", label: "Weaving Batches" },
                  { id: "sarees", label: "Saree Work Log" }
                ].map(t => (
                  <button key={t.id} onClick={() => setHistoryTab(t.id as any)} style={{
                    padding: "8px 16px", borderRadius: 999, border: `1px solid ${historyTab === t.id ? C.burg : C.bdr}`,
                    background: historyTab === t.id ? C.burg : "transparent",
                    color: historyTab === t.id ? "#FFF" : C.muted,
                    fontFamily: F.u, fontWeight: 600, fontSize: 12.5, cursor: "pointer"
                  }}>{t.label}</button>
                ))}
              </div>

              {/* TAB 1: Material Receipts */}
              {historyTab === "materials" && (
                signedRecords.length === 0 ? (
                  <div style={{ margin: "16px 20px", background: C.cream, borderRadius: 12, padding: "18px 16px", textAlign: "center" as const }}>
                    <div style={{ fontFamily: F.u, fontSize: 13, color: C.muted }}>No confirmed material receipts yet.</div>
                  </div>
                ) : isMobile ? (
                  <div style={{ marginTop: 12 }}>
                    {signedRecords.map(r => (
                      <div key={r.id} style={{ margin: "0 20px 12px", background: C.white, border: `1px solid ${C.bdr}`, borderRadius: 12, padding: "14px 16px" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                          <span style={{ fontFamily: F.m, fontWeight: 700, fontSize: 13, color: C.burg }}>{r.id}</span>
                          <span style={{ fontFamily: F.u, fontSize: 12, color: C.muted }}>{new Date(r.issuedAt).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}</span>
                        </div>
                        <div style={{ fontFamily: F.u, fontSize: 13, color: C.text, marginBottom: 8, lineHeight: 1.5 }}>
                          {r.materials.map(m => `${m.materialType} ${m.quantity}${m.unit}`).join(" · ")}
                        </div>
                        {r.signatureTimestamp && (
                          <div style={{ fontFamily: F.u, fontSize: 12, color: C.green, display: "flex", alignItems: "center", gap: 5 }}>
                            <Check size={12} /> Confirmed by you on {new Date(r.signatureTimestamp).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div style={{ margin: "16px 20px", background: C.white, border: `1px solid ${C.bdr}`, borderRadius: 12, overflowX: isTablet ? "auto" : "hidden" }}>
                    <div style={{ minWidth: isTablet ? 560 : undefined }}>
                      <div style={{ display: "grid", gridTemplateColumns: "1.2fr 2fr 1.2fr 1.2fr", padding: "10px 16px", borderBottom: `1px solid ${C.bdr}`, background: C.cream }}>
                        {["Date", "Materials", "MIR ID", "Status"].map(h => (
                          <div key={h} style={{ fontFamily: F.u, fontSize: 12, fontWeight: 700, color: C.muted }}>{h}</div>
                        ))}
                      </div>
                      {signedRecords.map(r => (
                        <div key={r.id} style={{ display: "grid", gridTemplateColumns: "1.2fr 2fr 1.2fr 1.2fr", padding: "12px 16px", borderBottom: `1px solid rgba(107,26,42,0.06)`, alignItems: "center" }}>
                          <div style={{ fontFamily: F.u, fontSize: 13, color: C.text }}>{new Date(r.issuedAt).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}</div>
                          <div style={{ fontFamily: F.u, fontSize: 13, color: C.text }}>{r.materials.map(m => `${m.materialType} ${m.quantity}${m.unit}`).join(" · ")}</div>
                          <div style={{ fontFamily: F.m, fontSize: 12, color: C.burg }}>{r.id}</div>
                          <div style={{ fontFamily: F.u, fontSize: 12, color: C.green, display: "flex", alignItems: "center", gap: 5 }}>
                            <Check size={12} /> Confirmed
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )
              )}

              {/* TAB 2: Weaving Batches */}
              {historyTab === "batches" && (
                myWeavingBatches.length === 0 ? (
                  <div style={{ margin: "16px 20px", background: C.cream, borderRadius: 12, padding: "18px 16px", textAlign: "center" as const }}>
                    <div style={{ fontFamily: F.u, fontSize: 13, color: C.muted }}>No weaving batches assigned yet.</div>
                  </div>
                ) : isMobile ? (
                  <div style={{ marginTop: 12 }}>
                    {myWeavingBatches.map(b => (
                      <div key={b.batchId} style={{ margin: "0 20px 12px", background: C.white, border: `1px solid ${C.bdr}`, borderRadius: 12, padding: "14px 16px" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                          <span style={{ fontFamily: F.m, fontWeight: 700, fontSize: 13, color: C.burg }}>{b.batchId}</span>
                          <span style={{ fontFamily: F.u, fontSize: 12, color: b.status === "active" ? C.green : C.gold, fontWeight: 600 }}>
                            {b.status === "active" ? "🟢 Active" : "🟡 Draft"}
                          </span>
                        </div>
                        <div style={{ fontFamily: F.u, fontSize: 13, color: C.text, marginBottom: 8 }}>
                          Progress: <strong>{b.passedCount}</strong> of <strong>{b.rowsCount}</strong> sarees passed QC
                        </div>
                        {b.dueDate && (
                          <div style={{ fontFamily: F.u, fontSize: 12, color: C.muted }}>
                            Due Date: {b.dueDate}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div style={{ margin: "16px 20px", background: C.white, border: `1px solid ${C.bdr}`, borderRadius: 12, overflowX: isTablet ? "auto" : "hidden" }}>
                    <div style={{ minWidth: isTablet ? 560 : undefined }}>
                      <div style={{ display: "grid", gridTemplateColumns: "1.2fr 1.5fr 1.5fr 1.2fr", padding: "10px 16px", borderBottom: `1px solid ${C.bdr}`, background: C.cream }}>
                        {["Batch ID", "Status", "Progress", "Due Date"].map(h => (
                          <div key={h} style={{ fontFamily: F.u, fontSize: 12, fontWeight: 700, color: C.muted }}>{h}</div>
                        ))}
                      </div>
                      {myWeavingBatches.map(b => (
                        <div key={b.batchId} style={{ display: "grid", gridTemplateColumns: "1.2fr 1.5fr 1.5fr 1.2fr", padding: "12px 16px", borderBottom: `1px solid rgba(107,26,42,0.06)`, alignItems: "center" }}>
                          <div style={{ fontFamily: F.m, fontSize: 13, fontWeight: 700, color: C.burg }}>{b.batchId}</div>
                          <div style={{ fontFamily: F.u, fontSize: 12, color: b.status === "active" ? C.green : C.gold, fontWeight: 600 }}>
                            {b.status === "active" ? "🟢 Active" : "🟡 Draft"}
                          </div>
                          <div style={{ fontFamily: F.u, fontSize: 13, color: C.text }}>
                            {b.passedCount} / {b.rowsCount} wove & passed
                          </div>
                          <div style={{ fontFamily: F.u, fontSize: 13, color: C.muted }}>{b.dueDate || "—"}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                )
              )}

              {/* TAB 3: Saree Work Log */}
              {historyTab === "sarees" && (
                mySarees.length === 0 ? (
                  <div style={{ margin: "16px 20px", background: C.cream, borderRadius: 12, padding: "18px 16px", textAlign: "center" as const }}>
                    <div style={{ fontFamily: F.u, fontSize: 13, color: C.muted }}>No sarees logged yet.</div>
                  </div>
                ) : isMobile ? (
                  <div style={{ marginTop: 12 }}>
                    {mySarees.map((s, i) => (
                      <div key={i} style={{ margin: "0 20px 12px", background: C.white, border: `1px solid ${C.bdr}`, borderRadius: 12, padding: "14px 16px" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                          <span style={{ fontFamily: F.m, fontWeight: 700, fontSize: 13, color: C.burg }}>{s.sareeId}</span>
                          <span style={{ fontFamily: F.m, fontSize: 11, color: C.muted }}>{s.batchId}</span>
                        </div>
                        <div style={{ fontFamily: F.u, fontSize: 13, color: C.text, marginBottom: 8 }}>
                          Type: {s.sareeTypeCode} · Loom {s.loom}
                        </div>
                        <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
                          <span style={{ fontFamily: F.u, fontSize: 12, fontWeight: 600, color: s.qcPassed === true ? C.green : s.qcPassed === false ? C.crim : C.gold }}>
                            {s.qcPassed === true ? "✓ Passed QC" : s.qcPassed === false ? "❌ Defective (QC Failed)" : "⏳ In Progress"}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div style={{ margin: "16px 20px", background: C.white, border: `1px solid ${C.bdr}`, borderRadius: 12, overflowX: isTablet ? "auto" : "hidden" }}>
                    <div style={{ minWidth: isTablet ? 640 : undefined }}>
                      <div style={{ display: "grid", gridTemplateColumns: "1.2fr 1fr 1.5fr 1fr 1.5fr", padding: "10px 16px", borderBottom: `1px solid ${C.bdr}`, background: C.cream }}>
                        {["Saree ID", "Batch ID", "Saree Type", "Loom", "QC Status"].map(h => (
                          <div key={h} style={{ fontFamily: F.u, fontSize: 12, fontWeight: 700, color: C.muted }}>{h}</div>
                        ))}
                      </div>
                      {mySarees.map((s, i) => (
                        <div key={i} style={{ display: "grid", gridTemplateColumns: "1.2fr 1fr 1.5fr 1fr 1.5fr", padding: "12px 16px", borderBottom: `1px solid rgba(107,26,42,0.06)`, alignItems: "center" }}>
                          <div style={{ fontFamily: F.m, fontSize: 13, fontWeight: 700, color: C.burg }}>{s.sareeId}</div>
                          <div style={{ fontFamily: F.m, fontSize: 12, color: C.muted }}>{s.batchId}</div>
                          <div style={{ fontFamily: F.u, fontSize: 13, color: C.text }}>
                            <strong>{s.sareeTypeCode}</strong> · {s.sareeTypeName}
                          </div>
                          <div style={{ fontFamily: F.u, fontSize: 13, color: C.text }}>Loom {s.loom}</div>
                          <div style={{ fontFamily: F.u, fontSize: 12, fontWeight: 700, color: s.qcPassed === true ? C.green : s.qcPassed === false ? C.crim : C.gold }}>
                            {s.qcPassed === true ? "✓ Passed QC" : s.qcPassed === false ? "❌ Defective" : "⏳ In Progress"}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )
              )}

            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

// ─── PAGE 04 — RAISE WARP REQUEST ─────────────────────────────────────────
