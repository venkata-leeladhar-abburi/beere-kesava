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
import { DispatchDetailsModal } from "../../../production/components/DispatchDetailsModal";
import { BatchesTab, DispatchesTab, PaymentsTab, MaterialsTab } from "./weaverDrawer/WeaverDrawerTabs";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { weaversApi } from "../../../../shared/api/weavers";
import { Button, Field, Input, NumberInput } from "../../../../shared/ui/primitives";

export function WeaverDrawer({ weaver, onClose, initialMode = "view", onNavigate }: { weaver: typeof WEAVERS[0] | null; onClose: () => void; initialMode?: "view" | "edit"; onNavigate?: (tab: string) => void }) {
  const [tab, setTab] = useState("overview");
  const [mode, setMode] = useState<"view" | "edit">(initialMode);
  const queryClient = useQueryClient();

  const nameParts = (weaver?.name || "").split(" ");
  const [editForm, setEditForm] = useState({
    firstName: nameParts[0] || "",
    lastName: nameParts.slice(1).join(" ") || "",
    email: (weaver as any)?.email || "",
    phone: weaver?.mobile || "",
    village: weaver?.village || "",
    looms: String(weaver?.looms || 0),
    bankName: (weaver as any)?.bankName || "",
    accountNo: (weaver as any)?.accountNo || "",
    ifsc: (weaver as any)?.ifsc || "",
  });

  const updateWeaver = useMutation({
    mutationFn: (data: any) => weaversApi.update(weaver!.id, data),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["weavers-directory"] });
      void queryClient.invalidateQueries({ queryKey: ["weavers-table-roster"] });
      void queryClient.invalidateQueries({ queryKey: ["weavers-card-roster"] });
      void queryClient.invalidateQueries({ queryKey: ["weavers-page-roster"] });
      void queryClient.invalidateQueries({ queryKey: ["weaver-nav"] });
      setMode("view");
    },
  });

  const handleSaveEdit = () => {
    if (!weaver?.id) return;
    updateWeaver.mutate({
      firstName: editForm.firstName,
      lastName: editForm.lastName,
      email: editForm.email,
      phone: editForm.phone,
      village: editForm.village,
      looms: parseInt(editForm.looms) || 0,
      bankName: editForm.bankName,
      accountNo: editForm.accountNo,
      ifsc: editForm.ifsc,
    });
  };
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
        style={{ width: "100%", background: T.silkCream, minHeight: "100dvh", display: "flex", flexDirection: "column" }}>

        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "20px 48px", borderBottom: `1px solid ${T.borderDef}`, background: "#FFFFFF", position: "sticky", top: 0, zIndex: 10 }}>
          <Button onClick={onClose} variant="ghost" size="sm" className="text-[#6E0F2D] font-bold">
            <ChevronLeftIcon size={20} /> Back to Weavers
          </Button>
          <span style={{ fontFamily: F.mono, fontSize: 12, letterSpacing: "1px", textTransform: "uppercase", color: T.taupe }}>Weaver Profile</span>
        </div>

        <div style={{ padding: "40px 48px", background: "#FFFFFF", borderBottom: `1px solid ${T.borderDef}` }}>
          <div style={{ display: "flex", gap: 28, alignItems: "center", flexWrap: "wrap" as const }}>
            <Avatar photo={weaver.photo} initials={weaver.initials} bg={weaver.bg} size={104} />
            <div style={{ flex: "1 1 320px" }}>
              <span style={{ display: "inline-block", fontFamily: F.ui, fontSize: 13, fontWeight: 600, color: cfg.color, background: cfg.badge, borderRadius: 99, padding: "5px 14px", marginBottom: 12 }}>{cfg.label}</span>
              <div style={{ fontFamily: F.display, fontSize: 30, color: "#1A0A0F", lineHeight: 1.2, fontWeight: 600 }}>{weaver.name}</div>
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
                    <div style={{ fontFamily: F.ui, fontSize: 12, fontWeight: 700, color: T.taupe, textTransform: "uppercase", letterSpacing: "0.5px" }}>{s.label}</div>
                    <div style={{ fontFamily: F.ui, fontSize: 13, fontWeight: 700, color: T.luxuryBrown }}>{s.value}</div>
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
                <span style={{ fontFamily: F.ui, fontSize: 12, color: "rgba(110,15,45,0.45)", marginTop: 5, fontWeight: 600 }}>Upload Photo</span>
              </div>
              <div style={{ fontFamily: F.ui, fontSize: 13, color: T.taupe }}>JPG or PNG · Max 5MB</div>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
              <Field label="First Name">
                <Input value={editForm.firstName} onChange={e => setEditForm(p => ({ ...p, firstName: e.target.value }))} placeholder="First Name" />
              </Field>
              <Field label="Last Name">
                <Input value={editForm.lastName} onChange={e => setEditForm(p => ({ ...p, lastName: e.target.value }))} placeholder="Last Name" />
              </Field>
              <Field label="Email ID">
                <Input value={editForm.email} onChange={e => setEditForm(p => ({ ...p, email: e.target.value }))} placeholder="Email ID" />
              </Field>
              <Field label="Mobile Number">
                <Input value={editForm.phone} onChange={e => setEditForm(p => ({ ...p, phone: e.target.value }))} placeholder="Mobile Number" />
              </Field>
              <Field label="Village / Location">
                <Input value={editForm.village} onChange={e => setEditForm(p => ({ ...p, village: e.target.value }))} placeholder="Village" />
              </Field>
              <Field label="Number of Looms">
                <NumberInput value={editForm.looms === "" ? "" : Number(editForm.looms)} onValueChange={v => setEditForm(p => ({ ...p, looms: v === "" ? "" : String(v) }))} placeholder="Looms" />
              </Field>
              <Field label="Bank Account Number">
                <Input value={editForm.accountNo} onChange={e => setEditForm(p => ({ ...p, accountNo: e.target.value }))} placeholder="Bank Account Number" />
              </Field>
              <Field label="IFSC Code">
                <Input value={editForm.ifsc} onChange={e => setEditForm(p => ({ ...p, ifsc: e.target.value }))} placeholder="IFSC Code" />
              </Field>
              <Field label="Bank Name">
                <Input value={editForm.bankName} onChange={e => setEditForm(p => ({ ...p, bankName: e.target.value }))} placeholder="Bank Name" />
              </Field>
            </div>
            <Button
              disabled={updateWeaver.isPending}
              loading={updateWeaver.isPending}
              onClick={handleSaveEdit}
              variant="primary"
              className="mt-4 bg-[#6E0F2D]"
            >
              <Save size={16} /> {updateWeaver.isPending ? "Saving..." : "Save changes"}
            </Button>
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
            <Button key={key} onClick={() => setTab(key)}
              variant="ghost"
              className={
                tab === key
                  ? "rounded-none py-4 px-0 border-b-[3px] border-[#6E0F2D] text-[#6E0F2D] whitespace-nowrap transition-colors"
                  : "rounded-none py-4 px-0 border-b-[3px] border-transparent text-[var(--text-tertiary)] whitespace-nowrap transition-colors"
              }>
              {icon}
              {label}
            </Button>
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
                      <div style={{ display: "flex", alignItems: "center", gap: 12, color: T.taupe, fontFamily: F.ui, fontSize: 14 }}>
                        {r.icon}
                        <span>{r.label}</span>
                      </div>
                      <div style={{ fontFamily: weaver.id === "b5f9178c-b1b9-4871-a7c3-0d68a462d57a" && r.label === "IFSC Code" ? F.mono : F.ui, fontSize: 14, color: T.luxuryBrown, fontWeight: 600 }}>{r.value}</div>
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
                            <span style={{ fontFamily: F.ui, fontSize: 12, color: T.taupe }}>{new Date(r.issuedAt).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}</span>
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
                          <div style={{ fontFamily: F.ui, fontSize: 12, color: T.taupe, marginTop: 6 }}>By {r.issuedBy}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div style={{ background: T.warmIvory, borderRadius: 16, padding: 20, textAlign: "center", color: T.taupe, fontFamily: F.ui, fontSize: 14, fontStyle: "italic", border: `1px solid ${T.borderDef}` }}>
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
                  <div style={{ background: T.warmIvory, borderRadius: 16, padding: 20, textAlign: "center", color: T.taupe, fontFamily: F.ui, fontSize: 14, fontStyle: "italic", border: `1px solid ${T.borderDef}` }}>
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
          <Button onClick={() => setMode("edit")} variant="primary" size="lg" fullWidth className="rounded-xl bg-[#6E0F2D]">
            <Edit3 size={16} /> Edit Details
          </Button>
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
