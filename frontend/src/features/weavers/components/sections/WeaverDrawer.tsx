// ── Full-page weaver profile drawer (overview / batches / dispatches / payments / materials tabs) ─
import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  ChevronLeft as ChevronLeftIcon, Layers3, MapPin, Phone, Camera, FileText, Save, ClipboardList,
  Smartphone, Landmark, Home, CreditCard, Activity, Edit3, PackageCheck,
} from "lucide-react";
import { PaperPlaneTilt } from "@phosphor-icons/react";
import { T, F } from "../theme";
import { STATUS_CFG } from "../types";
import { WEAVERS } from "../data";
import { Avatar, SectionPill } from "../common/primitives";
import { WeaverSareesSection } from "../WeaverSareesSection";
import { useWeaverPayments } from "../../contexts/WeaverPaymentsContext";
import { useMaterialIssue } from "../../../materials/contexts/MaterialIssueContext";
import { useBatches } from "../../../production/contexts/BatchContext";
import { useBulkOrders } from "../../../bulk-orders/contexts/BulkOrderContext";
import { DateFilterState, DEFAULT_DATE_FILTER, matchesDateFilter } from "../../../../shared/ui/DateFilterBar";
import { useDesignLibrary, DispatchRecord } from "../../../design-library/contexts/DesignLibraryContext";
import { DispatchDetailsModal } from "../../../production/components/BatchCreationPage";
import { BatchesTab, DispatchesTab, PaymentsTab, MaterialsTab } from "./weaverDrawer/WeaverDrawerTabs";

export function WeaverDrawer({ weaver, onClose, initialMode = "view", onNavigate }: { weaver: typeof WEAVERS[0] | null; onClose: () => void; initialMode?: "view" | "edit"; onNavigate?: (tab: string) => void }) {
  const [tab, setTab] = useState("overview");
  const [mode, setMode] = useState<"view" | "edit">(initialMode);
  const [batchDateFilter, setBatchDateFilter] = useState<DateFilterState>(DEFAULT_DATE_FILTER);
  const [paymentDateFilter, setPaymentDateFilter] = useState<DateFilterState>(DEFAULT_DATE_FILTER);
  const [dispatchDateFilter, setDispatchDateFilter] = useState<DateFilterState>(DEFAULT_DATE_FILTER);
  const [zoomImage, setZoomImage] = useState<{ url: string; label: string } | null>(null);
  const { getPaymentsForWeaver } = useWeaverPayments();
  const { getRecordsForWeaver, getMaterialSummaryByBatch } = useMaterialIssue();
  const { batches } = useBatches();
  const { bulkOrders } = useBulkOrders();
  const { dispatches } = useDesignLibrary();
  const [viewDispatches, setViewDispatches] = useState<{ weaverName: string; records: DispatchRecord[] } | null>(null);
  if (!weaver) return null;
  const weaverPayments = getPaymentsForWeaver(weaver.id);
  const materialRecords = getRecordsForWeaver(weaver.id);
  const materialByBatch = getMaterialSummaryByBatch(weaver.id);
  const cfg = STATUS_CFG[weaver.status];

  // Active batches the weaver is working on
  const workingBatches = batches.filter(b => 
    b.status === "active" && 
    b.rows.some(r => r.weaverId === weaver.id)
  );

  // 3. Draft batches the weaver is assigned to
  const draftBatches = batches.filter(b => 
    b.status === "draft" && 
    b.rows.some(r => r.weaverId === weaver.id)
  );

  // 4. Completed batches (previous batches) the weaver worked on
  const completedBatches = batches.filter(b => 
    b.status === "completed" && 
    b.rows.some(r => r.weaverId === weaver.id)
  );

  // Sort completed batches by Batch ID number descending to get the latest one
  const getBatchNum = (id: string) => {
    const match = id.match(/BATCH-(\d+)/);
    return match ? parseInt(match[1], 10) : 0;
  };
  const sortedCompletedBatches = [...completedBatches].sort((a, b) => getBatchNum(b.batchId) - getBatchNum(a.batchId));
  const previousBatch = sortedCompletedBatches[0] || null;

  // All batches (active, draft, completed) assigned to this weaver
  const allWeaverBatches = batches.filter(b => 
    b.rows.some(r => r.weaverId === weaver.id)
  );
  const sortedAllWeaverBatches = [...allWeaverBatches].sort((a, b) => {
    if (a.status === "active" && b.status !== "active") return -1;
    if (a.status !== "active" && b.status === "active") return 1;
    return getBatchNum(b.batchId) - getBatchNum(a.batchId);
  }).filter(b => matchesDateFilter(b.createdAt, batchDateFilter));
  const filteredWeaverPayments = weaverPayments.filter(p => matchesDateFilter(p.paymentDate, paymentDateFilter));

  // Design dispatches sent to this weaver, grouped by batch
  const weaverDispatches = dispatches.filter(d => d.recipientType === "weaver" && d.recipientId === weaver.id && matchesDateFilter(d.sentAt, dispatchDateFilter));
  const dispatchGroups: { batchId: string; records: DispatchRecord[] }[] = [];
  weaverDispatches.forEach(d => {
    const batchIds = d.batches.length > 0 ? d.batches : ["No batch linked"];
    batchIds.forEach(bId => {
      let group = dispatchGroups.find(g => g.batchId === bId);
      if (!group) { group = { batchId: bId, records: [] }; dispatchGroups.push(group); }
      group.records.push(d);
    });
  });
  dispatchGroups.sort((a, b) => getBatchNum(b.batchId) - getBatchNum(a.batchId));
  return (
    <>
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 16 }} transition={{ duration: 0.25 }}
        style={{ width: "100%", background: T.silkCream, minHeight: "100vh", display: "flex", flexDirection: "column" }}>

        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "20px 48px", borderBottom: `1px solid ${T.borderDef}`, background: "#FFFFFF", position: "sticky", top: 0, zIndex: 10 }}>
          <button onClick={onClose} style={{ display: "flex", alignItems: "center", gap: 8, background: "transparent", border: "none", cursor: "pointer", color: T.royalBurgundy, fontFamily: F.ui, fontWeight: 700, fontSize: 15, padding: "8px 4px" }}>
            <ChevronLeftIcon size={20} /> Back to Weavers
          </button>
          <span style={{ fontFamily: F.mono, fontSize: 12, letterSpacing: "1px", textTransform: "uppercase", color: T.taupe }}>Weaver Profile</span>
        </div>

        <div style={{ padding: "40px 48px", background: "#FFFFFF", borderBottom: `1px solid ${T.borderDef}` }}>
          <div style={{ display: "flex", gap: 28, alignItems: "center", flexWrap: "wrap" as const }}>
            <Avatar photo={weaver.photo} initials={weaver.initials} bg={weaver.bg} size={104} />
            <div style={{ flex: "1 1 320px" }}>
              <span style={{ display: "inline-block", fontFamily: F.ui, fontSize: 13, fontWeight: 600, color: cfg.color, background: cfg.badge, borderRadius: 99, padding: "5px 14px", marginBottom: 12 }}>{cfg.label}</span>
              <div style={{ fontFamily: F.display, fontSize: 32, color: "#1A0A0F", lineHeight: 1.2, fontWeight: 600 }}>{weaver.name}</div>
              <div style={{ fontFamily: F.mono, fontSize: 14, color: T.royalBurgundy, marginTop: 6 }}>{weaver.id}</div>
            </div>
            <div style={{ display: "flex", gap: 12, flexWrap: "wrap" as const }}>
              {[
                { icon: <MapPin size={15} color={T.royalBurgundy} />, label: "Village", value: weaver.village },
                { icon: <Phone size={15} color={T.royalBurgundy} />, label: "Mobile", value: weaver.mobile },
                { icon: <Activity size={15} color={T.royalBurgundy} />, label: "Looms", value: `${weaver.looms} Looms` },
              ].map(s => (
                <div key={s.label} style={{ display: "flex", alignItems: "center", gap: 10, background: T.warmIvory, border: `1px solid ${T.borderDef}`, borderRadius: 12, padding: "10px 16px", minWidth: 140 }}>
                  {s.icon}
                  <div>
                    <div style={{ fontFamily: F.ui, fontSize: 10.5, fontWeight: 700, color: T.taupe, textTransform: "uppercase", letterSpacing: "0.5px" }}>{s.label}</div>
                    <div style={{ fontFamily: F.ui, fontSize: 13.5, fontWeight: 700, color: T.luxuryBrown }}>{s.value}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {mode === "edit" && (
          <div style={{ padding: "24px 48px", background: "#FFFFFF", borderBottom: `1px solid ${T.borderDef}` }}>
            <SectionPill label="Edit Weaver Details" />
            <div style={{ marginBottom: 18, display: "flex", alignItems: "center", gap: 20 }}>
              <div style={{ width: 88, height: 88, borderRadius: "50%", border: "2px dashed rgba(110,15,45,0.25)", background: "rgba(110,15,45,0.04)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", cursor: "pointer", flexShrink: 0 }}>
                <Camera size={22} color="rgba(110,15,45,0.35)" strokeWidth={1.5} />
                <span style={{ fontFamily: F.ui, fontSize: 10.5, color: "rgba(110,15,45,0.45)", marginTop: 5, fontWeight: 600 }}>Upload Photo</span>
              </div>
              <div style={{ fontFamily: F.ui, fontSize: 13, color: T.taupe }}>JPG or PNG · Max 5MB</div>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
              {[
                { label: "First Name", value: weaver.name.split(" ")[0] || "" },
                { label: "Last Name", value: weaver.name.split(" ").slice(1).join(" ") || "" },
                { label: "Email ID", value: "" },
                { label: "Mobile Number", value: weaver.mobile },
                { label: "Village / Location", value: weaver.village },
                { label: "Number of Looms", value: String(weaver.looms) },
                { label: "Bank Account Number", value: "" },
                { label: "IFSC Code", value: "SBIN0001234" },
                { label: "Bank Name", value: "State Bank of India" },
              ].map(f => (
                <div key={f.label}>
                  <label style={{ fontFamily: F.ui, fontSize: 12, color: T.taupe, fontWeight: 600, marginBottom: 4, display: "block" }}>{f.label}</label>
                  <input defaultValue={f.value} placeholder={f.label} style={{ width: "100%", height: 46, border: `1.5px solid ${T.borderDef}`, borderRadius: 12, padding: "0 14px", fontFamily: F.ui, boxSizing: "border-box" }} />
                </div>
              ))}
            </div>
            <button onClick={() => setMode("view")} style={{ marginTop: 16, display: "inline-flex", alignItems: "center", gap: 8, background: T.royalBurgundy, color: "#fff", border: "none", borderRadius: 12, padding: "12px 18px", fontFamily: F.ui, fontWeight: 700, cursor: "pointer" }}><Save size={16} /> Save changes</button>
          </div>
        )}

        <div style={{ padding: "0 48px", borderBottom: `1px solid ${T.borderDef}`, display: "flex", gap: 24, background: "#FFFFFF", overflowX: "auto" }}>
          {[
            { key: "overview", label: "Overview", icon: <ClipboardList size={16} /> },
            { key: "batches", label: "Batch History", icon: <Layers3 size={16} /> },
            { key: "dispatches", label: "Design Dispatches", icon: <PaperPlaneTilt size={16} /> },
            { key: "payments", label: "Payments", icon: <FileText size={16} /> },
            { key: "materials", label: "Materials Received", icon: <PackageCheck size={16} /> }
          ].map(({ key, label, icon }) => (
            <button key={key} onClick={() => setTab(key)}
              style={{ padding: "16px 0", display: "flex", alignItems: "center", gap: 8, fontFamily: F.ui, fontSize: 15, fontWeight: 600, color: tab === key ? T.royalBurgundy : T.taupe, background: "transparent", border: "none", borderBottom: `3px solid ${tab === key ? T.royalBurgundy : "transparent"}`, cursor: "pointer", transition: "all 0.2s", whiteSpace: "nowrap" }}>
              {icon}
              {label}
            </button>
          ))}
        </div>

        <div style={{ padding: "40px 48px", flex: 1 }}>
          {tab === "overview" && (
            <div style={{ display: "flex", flexDirection: "column", gap: 36 }}>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(420px, 1fr))", gap: 32, alignItems: "start" }}>
              <div>
                <SectionPill label="Personal Details" />
                <div style={{ background: "#FFFFFF", borderRadius: 16, border: `1px solid ${T.borderDef}`, overflow: "hidden" }}>
                  {[
                    { icon: <Smartphone size={16} color={T.royalBurgundy} style={{ flexShrink: 0 }} />, label: "Mobile Number", value: weaver.mobile },
                    { icon: <Landmark size={16} color={T.royalBurgundy} style={{ flexShrink: 0 }} />, label: "Bank Account", value: "State Bank of India — ×××× 8990" },
                    { icon: <CreditCard size={16} color={T.royalBurgundy} style={{ flexShrink: 0 }} />, label: "IFSC Code", value: "SBIN0001234" },
                    { icon: <Home size={16} color={T.royalBurgundy} style={{ flexShrink: 0 }} />, label: "Address", value: `14-2, Main Handloom Street, ${weaver.village}` },
                  ].map((r, i) => (
                    <div key={r.label} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "16px 20px", borderBottom: i < 3 ? `1px solid ${T.borderDef}` : "none", background: i % 2 === 1 ? T.warmIvory : "#FFFFFF" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 12, color: T.taupe, fontFamily: F.ui, fontSize: 14.5 }}>
                        {r.icon}
                        <span>{r.label}</span>
                      </div>
                      <div style={{ fontFamily: weaver.id === "WV-001" && r.label === "IFSC Code" ? F.mono : F.ui, fontSize: 14.5, color: T.luxuryBrown, fontWeight: 600 }}>{r.value}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Materials History */}
              <div>
                <SectionPill label="Materials History" />
                {materialRecords.length > 0 ? (
                  <div style={{ display: "flex", flexDirection: "column", gap: 10, maxHeight: 220, overflowY: "auto", background: "#FFFFFF", borderRadius: 16, border: `1px solid ${T.borderDef}`, padding: "16px 20px" }}>
                    {materialRecords.map((r, i) => (
                      <div key={r.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", paddingBottom: i < materialRecords.length - 1 ? 12 : 0, borderBottom: i < materialRecords.length - 1 ? `1px solid rgba(110,15,45,0.06)` : "none" }}>
                        <div>
                          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                            <span style={{ fontFamily: F.mono, fontSize: 13, color: T.royalBurgundy, background: "rgba(110,15,45,0.07)", borderRadius: 6, padding: "2px 8px", fontWeight: 700 }}>{r.id}</span>
                            <span style={{ fontFamily: F.ui, fontSize: 12.5, color: T.taupe }}>{new Date(r.issuedAt).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}</span>
                          </div>
                          <div style={{ display: "flex", flexDirection: "column", gap: 4, marginTop: 8 }}>
                            {r.materials.map((m: any, idx: number) => (
                              <div key={idx} style={{ fontFamily: F.ui, fontSize: 13, color: T.luxuryBrown }}>
                                • {m.materialType}: <b>{m.quantity} {m.unit}</b> {m.warpSubtype || m.jariType || ""}
                              </div>
                            ))}
                          </div>
                        </div>
                        <div style={{ textAlign: "right" }}>
                          <span style={{ fontFamily: F.ui, fontSize: 12, color: r.signatureCaptured ? T.green : "#8B6018", background: r.signatureCaptured ? "rgba(30,102,64,0.08)" : "rgba(200,155,71,0.08)", borderRadius: 6, padding: "3px 8px", fontWeight: 700 }}>
                            {r.signatureCaptured ? "✓ Signed" : "Pending"}
                          </span>
                          <div style={{ fontFamily: F.ui, fontSize: 11.5, color: T.taupe, marginTop: 6 }}>By {r.issuedBy}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div style={{ background: T.warmIvory, borderRadius: 16, padding: 20, textAlign: "center", color: T.taupe, fontFamily: F.ui, fontSize: 14.5, fontStyle: "italic", border: `1px solid ${T.borderDef}` }}>
                    No materials issued to this weaver yet.
                  </div>
                )}
              </div>

              {/* Payments History */}
              <div>
                <SectionPill label="Payments History" />
                {weaverPayments.length > 0 ? (
                  <div style={{ display: "flex", flexDirection: "column", gap: 10, maxHeight: 220, overflowY: "auto", background: "#FFFFFF", borderRadius: 16, border: `1px solid ${T.borderDef}`, padding: "16px 20px" }}>
                    {weaverPayments.map((p, i) => (
                      <div key={p.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingBottom: i < weaverPayments.length - 1 ? 12 : 0, borderBottom: i < weaverPayments.length - 1 ? `1px solid rgba(110,15,45,0.06)` : "none" }}>
                        <div>
                          <div style={{ fontFamily: F.ui, fontSize: 14, fontWeight: 700, color: T.luxuryBrown }}>{p.firmName}</div>
                          <div style={{ fontFamily: F.mono, fontSize: 12, color: T.taupe, marginTop: 3 }}>UTR: {p.utrNumber}</div>
                        </div>
                        <div style={{ textAlign: "right" }}>
                          <div style={{ fontFamily: F.display, fontWeight: 700, fontSize: 16, color: T.green }}>₹{p.amountPaid.toLocaleString("en-IN")}</div>
                          <div style={{ fontFamily: F.ui, fontSize: 12, color: T.taupe, marginTop: 4 }}>{p.paymentDate}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div style={{ background: T.warmIvory, borderRadius: 16, padding: 20, textAlign: "center", color: T.taupe, fontFamily: F.ui, fontSize: 14.5, fontStyle: "italic", border: `1px solid ${T.borderDef}` }}>
                    No payments history found.
                  </div>
                )}
              </div>
              </div>

              {/* Sarees — Assigned / Produced / QC / Finishing / Sold / Outstanding */}
              <div>
                <SectionPill label="Sarees" />
                <WeaverSareesSection weaverId={weaver.id} weaverName={weaver.name} />
              </div>
            </div>
          )}

          {tab === "batches" && (
            <BatchesTab sortedAllWeaverBatches={sortedAllWeaverBatches} dispatches={dispatches} weaver={weaver} batchDateFilter={batchDateFilter} setBatchDateFilter={setBatchDateFilter} setViewDispatches={setViewDispatches} onNavigate={onNavigate} />
          )}

          {tab === "dispatches" && (
            <DispatchesTab dispatchGroups={dispatchGroups} dispatchDateFilter={dispatchDateFilter} setDispatchDateFilter={setDispatchDateFilter} setZoomImage={setZoomImage} />
          )}

          {tab === "payments" && (
            <PaymentsTab weaver={weaver} weaverPayments={weaverPayments} filteredWeaverPayments={filteredWeaverPayments} paymentDateFilter={paymentDateFilter} setPaymentDateFilter={setPaymentDateFilter} />
          )}

          {tab === "materials" && (
            <MaterialsTab materialRecords={materialRecords} materialByBatch={materialByBatch} />
          )}
        </div>

        <div style={{ padding: "24px 32px", borderTop: `1px solid ${T.borderDef}`, background: "#FFFFFF", position: "sticky", bottom: 0, display: "flex", gap: 16 }}>
          <motion.button onClick={() => setMode("edit")} whileHover={{ scale: 1.02 }} style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 8, background: T.royalBurgundy, color: "#FFFDF9", border: "none", borderRadius: 12, padding: "14px 0", fontFamily: F.ui, fontSize: 16, fontWeight: 600, cursor: "pointer" }}>
            <Edit3 size={16} /> Edit Details
          </motion.button>
        </div>
      </motion.div>
      <AnimatePresence>
        {viewDispatches && <DispatchDetailsModal key="dd" weaverName={viewDispatches.weaverName} records={viewDispatches.records} onClose={() => setViewDispatches(null)} />}
        {zoomImage && (
          <motion.div key="zoom" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={() => setZoomImage(null)}
            style={{ position: "fixed", inset: 0, background: "rgba(20,4,10,0.85)", zIndex: 200, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 14, cursor: "zoom-out" }}>
            <img src={zoomImage.url} alt={zoomImage.label} style={{ maxWidth: "80vw", maxHeight: "75vh", borderRadius: 12, boxShadow: "0 20px 60px rgba(0,0,0,0.4)" }} />
            <span style={{ fontFamily: F.ui, fontSize: 13, color: "#fff", fontWeight: 600 }}>{zoomImage.label}</span>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
