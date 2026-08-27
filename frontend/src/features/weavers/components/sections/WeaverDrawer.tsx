// ── Full-page weaver profile drawer (overview / batches / dispatches / payments / materials tabs) ─
import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  ChevronLeft as ChevronLeftIcon, Layers3, MapPin, Phone, Camera, FileText, Save, ClipboardList,
  Smartphone, Landmark, Home, CreditCard, Activity, Edit3, PackageCheck, UserRound, Boxes, Trash2, X,
} from "lucide-react";
import { Send as PaperPlaneTilt } from "lucide-react";
import { T, F } from "../theme";
import { STATUS_CFG } from "../types";
import { WEAVERS } from "../data";
import { Avatar, SectionCard } from "../common/primitives";
import { WeaverSareesSection } from "../WeaverSareesSection";
import { useWeaverPayments } from "../../contexts/WeaverPaymentsContext";
import { useMaterialIssue } from "@/features/materials";
import { rupees, formatMoney } from "@/lib/domain/money";
import { BG_IMAGE } from "@/shared/ui/heroBackgrounds";
import { useBatches } from "@/features/production";
import { DateFilterState, DEFAULT_DATE_FILTER, matchesDateFilter } from "../../../../shared/ui/DateFilterBar";
import { useDesignLibrary, DispatchRecord } from "@/features/design-library";
import { DispatchDetailsModal } from "@/features/production";
import { BatchesTab, DispatchesTab, PaymentsTab, MaterialsTab } from "./weaverDrawer/WeaverDrawerTabs";
import { EntityCode } from "../../../../shared/ui/domain";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { weaversApi, type UpdateWeaverPayload } from "../../../../shared/api/weavers";
import { toast } from "sonner";
import { Button, Field, Input, NumberInput } from "../../../../shared/ui/primitives";
import { Breadcrumbs } from "../../../../shared/ui/nav/Breadcrumbs";
import { recordView, useConfirm } from "../../../../shared/ui/overlay";

// The runtime weaver object (built in WeaversPage.tsx from the real backend
// BackendWeaver) carries a few extra bank/contact fields that WeaverCardEntry
// (the mock-data shape) doesn't declare — extend locally instead of `any`.
type DrawerWeaver = typeof WEAVERS[0] & {
  email?: string;
  bankName?: string;
  accountNo?: string;
  ifsc?: string;
};

export function WeaverDrawer({ weaver, onClose, initialMode = "view", onNavigate }: { weaver: DrawerWeaver | null; onClose: () => void; initialMode?: "view" | "edit"; onNavigate?: (tab: string) => void }) {
  const [tab, setTab] = useState("overview");
  const [mode, setMode] = useState<"view" | "edit">(initialMode);
  const queryClient = useQueryClient();
  const confirm = useConfirm();

  const nameParts = (weaver?.name || "").split(" ");
  const [editForm, setEditForm] = useState({
    firstName: nameParts[0] || "",
    lastName: nameParts.slice(1).join(" ") || "",
    email: weaver?.email || "",
    phone: weaver?.mobile || "",
    village: weaver?.village || "",
    looms: String(weaver?.looms || 0),
    bankName: weaver?.bankName || "",
    accountNo: weaver?.accountNo || "",
    ifsc: weaver?.ifsc || "",
  });

  const updateWeaver = useMutation({
    mutationFn: (data: UpdateWeaverPayload) => weaversApi.update(weaver!.id, data),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["weavers-directory"] });
      void queryClient.invalidateQueries({ queryKey: ["weavers-table-roster"] });
      void queryClient.invalidateQueries({ queryKey: ["weavers-card-roster"] });
      void queryClient.invalidateQueries({ queryKey: ["weavers-page-roster"] });
      void queryClient.invalidateQueries({ queryKey: ["weaver-nav"] });
      setMode("view");
      toast.success("Weaver profile updated");
    },
    onError: (err: unknown) => {
      toast.error(err instanceof Error ? err.message : "Failed to update weaver profile");
    },
  });

  const deleteWeaver = useMutation({
    mutationFn: () => weaversApi.remove(weaver!.id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["weavers-directory"] });
      void queryClient.invalidateQueries({ queryKey: ["weavers-table-roster"] });
      void queryClient.invalidateQueries({ queryKey: ["weavers-card-roster"] });
      void queryClient.invalidateQueries({ queryKey: ["weavers-page-roster"] });
      void queryClient.invalidateQueries({ queryKey: ["weaver-nav"] });
      toast.success("Weaver deleted");
      onClose();
    },
    onError: (err: unknown) => {
      toast.error(err instanceof Error ? err.message : "Failed to delete weaver");
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

  // Escape closes the image zoom overlay — Part C.3's focus contract applies
  // to every scrim-backed overlay, not just the named Modal/Drawer/Popover.
  useEffect(() => {
    if (!zoomImage) return;
    const onKeyDown = (e: KeyboardEvent) => { if (e.key === "Escape") setZoomImage(null); };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [zoomImage]);

  const { getPaymentsForWeaver } = useWeaverPayments();
  const { getRecordsForWeaver, getMaterialSummaryByBatch } = useMaterialIssue();
  const { batches } = useBatches();
  const { dispatches } = useDesignLibrary();
  const [viewDispatches, setViewDispatches] = useState<{ weaverName: string; records: DispatchRecord[] } | null>(null);

  // Command palette RECENT group (design-system/05-OVERLAYS.md Part H) —
  // record this profile as viewed once per mount. Kept above the `!weaver`
  // guard below so this hook always runs (rules of hooks); it no-ops until
  // a weaver is actually loaded.
  useEffect(() => {
    if (!weaver) return;
    recordView({ key: `weaver:${weaver.id}`, label: weaver.name, path: "/admin/weavers", kind: "Weaver" });
  }, [weaver]);

  if (!weaver) return null;
  const weaverPayments = getPaymentsForWeaver(weaver.id);
  const materialRecords = getRecordsForWeaver(weaver.id);
  const materialByBatch = getMaterialSummaryByBatch(weaver.id);
  const cfg = STATUS_CFG[weaver.status];

  const getBatchNum = (id: string) => {
    const match = id.match(/BATCH-(\d+)/);
    return match ? parseInt(match[1], 10) : 0;
  };

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

        {/* Sticky Header Navigation Bar */}
        <div className="px-3 sm:px-7 xl:px-12 py-3 sm:py-4 flex items-center justify-between border-b border-[var(--border-default)] bg-white sticky top-0 z-10 gap-2 flex-wrap">
          <Button
            onClick={onClose}
            variant="secondary"
            className="h-9 sm:h-10 px-3.5 sm:px-5 rounded-full border border-[rgba(110,15,45,0.25)] bg-[#FFFDF9] hover:bg-[#6E0F2D] text-[#6E0F2D] hover:text-white font-bold text-xs sm:text-sm gap-1.5 sm:gap-2 shadow-sm transition-all cursor-pointer"
          >
            <ChevronLeftIcon size={16} /> Back to Weavers
          </Button>

          <div className="flex items-center gap-2 sm:gap-3">
            <div className="hidden xs:flex items-center gap-2 h-9 sm:h-10 px-3.5 sm:px-4 rounded-full bg-[rgba(110,15,45,0.06)] border border-[rgba(110,15,45,0.18)] text-[#6E0F2D] font-bold text-xs uppercase tracking-wider">
              <UserRound size={14} className="text-[#6E0F2D]" />
              <span>Weaver Profile</span>
            </div>

            <Button
              onClick={async () => {
                const ok = await confirm({
                  title: `Delete weaver "${weaver.name}"?`,
                  description: "This can't be undone. Weavers with existing batches, QC entries, or payments can't be deleted — deactivate them instead.",
                  confirmLabel: "Delete Weaver",
                  tone: "danger",
                });
                if (ok) deleteWeaver.mutate();
              }}
              variant="secondary"
              disabled={deleteWeaver.isPending}
              className="h-9 sm:h-10 px-3.5 sm:px-4 rounded-full border border-red-200 bg-red-50 hover:bg-red-600 text-red-700 hover:text-white font-bold text-xs gap-1.5 shadow-sm transition-all cursor-pointer"
            >
              <Trash2 size={14} /> Delete Weaver
            </Button>
          </div>
        </div>

        <div className="hidden sm:block px-3 sm:px-7 xl:px-12 pt-3 pb-1" style={{ background: T.silkCream }}>
          <Breadcrumbs
            items={[
              { key: "people", label: "People", onClick: onClose },
              { key: "weavers", label: "Weavers", onClick: onClose },
              { key: "weaver", label: weaver.name },
            ]}
          />
        </div>

        {/* Luxury Hero Banner Section */}
        <div className="px-3 sm:px-7 xl:px-12 py-3 sm:py-4">
          <div className="relative bg-[#0D0207] rounded-2xl sm:rounded-3xl overflow-hidden shadow-xl border border-[rgba(200,155,71,0.25)]">
            <div style={{
              position: "absolute", inset: 0,
              backgroundImage: `url(${BG_IMAGE})`,
              backgroundSize: "cover", backgroundPosition: "center",
              opacity: 0.24, pointerEvents: "none"
            }} />
            <div style={{ position: "absolute", inset: 0, background: "linear-gradient(135deg, rgba(74,6,27,0.92) 0%, rgba(13,2,7,0.95) 100%)", pointerEvents: "none" }} />

            <div className="relative z-10 p-4 sm:p-8 flex flex-col lg:flex-row gap-5 lg:gap-7 items-start lg:items-center justify-between">
              <div className="flex items-center gap-4 sm:gap-6 flex-wrap sm:flex-nowrap w-full lg:w-auto">
                <div className="relative shrink-0">
                  <Avatar photo={weaver.photo} initials={weaver.initials} bg={weaver.bg} size={76} />
                  <div style={{ position: "absolute", inset: -3, borderRadius: "50%", border: "2px solid rgba(200,155,71,0.45)", pointerEvents: "none" }} />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 mb-2 flex-wrap">
                    <span style={{ fontFamily: F.ui, fontSize: 10, fontWeight: 700, color: T.antiqueGold, letterSpacing: "1.4px", textTransform: "uppercase", background: "rgba(200,155,71,0.14)", border: "1px solid rgba(200,155,71,0.30)", borderRadius: 99, padding: "2px 10px" }}>
                      WEAVER PROFILE
                    </span>
                    <span style={{ fontFamily: F.ui, fontSize: 11, fontWeight: 600, color: cfg.color, background: cfg.badge, borderRadius: 99, padding: "2px 10px" }}>
                      {cfg.label}
                    </span>
                  </div>
                  <h1 className="text-xl sm:text-2xl lg:text-3xl text-[#FFFDF9] font-bold font-serif leading-tight truncate">
                    {weaver.name}
                  </h1>
                  <div className="mt-2 flex items-center gap-2 max-w-full">
                    <EntityCode type="weaver" value={weaver.code ?? weaver.id} size="md" className="break-all !whitespace-normal max-w-full" />
                  </div>
                </div>
              </div>

              {/* Luxury Metrics Stats Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 w-full lg:w-auto">
                {[
                  { icon: <MapPin size={16} color={T.antiqueGold} />, label: "Village", value: weaver.village || "—" },
                  { icon: <Phone size={16} color={T.antiqueGold} />, label: "Mobile", value: weaver.mobile || "—" },
                  { icon: <Activity size={16} color={T.antiqueGold} />, label: "Looms", value: `${weaver.looms} Active` },
                ].map(s => (
                  <div key={s.label} className="flex items-center gap-3 bg-white/5 backdrop-blur-md border border-white/10 rounded-xl p-3 sm:px-4 sm:py-3.5 min-w-[130px]">
                    <div className="w-9 h-9 rounded-lg bg-[rgba(200,155,71,0.16)] flex items-center justify-center shrink-0">
                      {s.icon}
                    </div>
                    <div>
                      <div className="text-[10px] font-bold text-white/50 uppercase tracking-wider">{s.label}</div>
                      <div className="text-xs sm:text-sm font-bold text-[#FFFDF9] mt-0.5 truncate">{s.value}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {mode === "edit" && (
          <div className="px-3 sm:px-7 xl:px-12 py-4 sm:py-6">
            <SectionCard
              icon={Edit3}
              title="Edit Weaver Profile Details"
              subtitle={`Update personal contact, village location, and bank account information for ${weaver.name}`}
              actions={
                <Button
                  onClick={() => setMode("view")}
                  variant="secondary"
                  size="sm"
                  className="h-9 px-4 rounded-full border border-white/30 bg-white/15 hover:bg-white/30 !text-white font-bold text-xs gap-1.5 shadow-sm transition-all cursor-pointer"
                >
                  <X size={14} className="text-white" /> Cancel
                </Button>
              }
            >
              <div className="mb-5 sm:mb-6 flex flex-col sm:flex-row items-center sm:items-start text-center sm:text-left gap-4 sm:gap-5 p-4 sm:p-5 bg-[#FFFDF9] rounded-2xl border border-[#E8DCC4]">
                <div className="w-20 h-20 rounded-full border-2 border-dashed border-[rgba(110,15,45,0.35)] bg-[rgba(110,15,45,0.06)] flex flex-col items-center justify-center cursor-pointer shrink-0">
                  <Camera size={20} color={T.royalBurgundy} strokeWidth={1.5} />
                  <span className="text-[11px] font-bold text-[#6E0F2D] mt-1">Upload Photo</span>
                </div>
                <div>
                  <div className="text-sm font-bold text-[#3B2314]">Profile Photo</div>
                  <div className="text-xs text-[#8C7A6B] mt-1">JPG or PNG format · Maximum size 5MB</div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 sm:gap-4">
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
                <Field label="Bank Name" className="md:col-span-2">
                  <Input value={editForm.bankName} onChange={e => setEditForm(p => ({ ...p, bankName: e.target.value }))} placeholder="Bank Name" />
                </Field>
              </div>

              <div className="mt-6 flex flex-col-reverse sm:flex-row gap-3 justify-end items-stretch sm:items-center">
                <Button
                  onClick={() => setMode("view")}
                  variant="secondary"
                  size="md"
                  className="h-11 px-6 rounded-xl border border-[#D0C4B4] bg-[#FFFDF9] hover:bg-[#F2EAE0] !text-[#3B2314] font-bold text-sm gap-1.5 shadow-sm transition-all cursor-pointer w-full sm:w-auto"
                >
                  <X size={16} className="text-[#3B2314]" /> Cancel
                </Button>
                <Button
                  disabled={updateWeaver.isPending}
                  loading={updateWeaver.isPending}
                  onClick={handleSaveEdit}
                  variant="primary"
                  size="md"
                  className="h-11 px-8 rounded-xl bg-[#6E0F2D] hover:bg-[#520920] text-white font-bold text-sm shadow-sm gap-2 transition-all cursor-pointer w-full sm:w-auto"
                >
                  <Save size={16} /> {updateWeaver.isPending ? "Saving..." : "Save Changes"}
                </Button>
              </div>
            </SectionCard>
          </div>
        )}

        {/* Sub-tab Navigation Strip Card */}
        <div className="px-4 md:px-7 xl:px-14 mt-4 mb-2">
          <div className="bg-white rounded-[10px] border border-[#E8DCC4] px-3 sm:px-5 pt-2 pb-0 shadow-sm overflow-x-auto section-nav-scroll">
            <div className="flex items-center gap-1 sm:gap-2 min-w-max">
              {[
                { key: "overview", label: "Overview", icon: <ClipboardList size={16} /> },
                { key: "batches", label: "Batch History", icon: <Layers3 size={16} /> },
                { key: "dispatches", label: "Design Dispatches", icon: <PaperPlaneTilt size={16} /> },
                { key: "payments", label: "Payments", icon: <FileText size={16} /> },
                { key: "materials", label: "Materials Received", icon: <PackageCheck size={16} /> }
              ].map(({ key, label, icon }) => (
                <Button key={key} onClick={() => setTab(key)}
                  variant="tertiary"
                  className={
                    "rounded-none px-3.5 sm:px-5 py-3 shrink-0 text-xs sm:text-sm cursor-pointer flex items-center gap-2 transition-all " +
                    (tab === key
                      ? "border-b-[3px] border-[#6E0F2D] text-[#6E0F2D] font-bold"
                      : "border-b-[3px] border-transparent text-[#9C8672] hover:text-[#6E0F2D] font-medium")
                  }>
                  {icon}
                  <span>{label}</span>
                </Button>
              ))}
            </div>
          </div>
        </div>

        <div className="px-3 sm:px-7 xl:px-12 py-6 sm:py-8 flex-1">
          {tab === "overview" && (
            <div className="flex flex-col gap-6 sm:gap-8">
              {/* 1. Personal & Financial Details SectionCard */}
              <SectionCard
                icon={UserRound}
                title="Personal & Bank Details"
                subtitle={`Contact information, location, and bank account details for ${weaver.name}`}
              >
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5 sm:gap-4">
                  {[
                    { icon: <Smartphone size={18} color={T.royalBurgundy} />, label: "Mobile Number", value: weaver.mobile || "—" },
                    { icon: <MapPin size={18} color={T.royalBurgundy} />, label: "Village / Location", value: weaver.village || "—" },
                    { icon: <Home size={18} color={T.royalBurgundy} />, label: "Address", value: `14-2, Main Handloom Street, ${weaver.village}` },
                    { icon: <Activity size={18} color={T.royalBurgundy} />, label: "Number of Looms", value: `${weaver.looms} Active Looms` },
                    { icon: <Landmark size={18} color={T.royalBurgundy} />, label: "Bank Account", value: "State Bank of India — ×××× 8990" },
                    { icon: <CreditCard size={18} color={T.royalBurgundy} />, label: "IFSC Code", value: "SBIN0001234" },
                  ].map(r => (
                    <div key={r.label} style={{ background: T.warmIvory, border: `1px solid ${T.borderDef}`, borderRadius: 14, padding: "14px 16px", display: "flex", alignItems: "center", gap: 12 }}>
                      <div style={{ width: 38, height: 38, borderRadius: 10, background: "rgba(110,15,45,0.08)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                        {r.icon}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div style={{ fontFamily: F.ui, fontSize: 11, fontWeight: 700, color: T.taupe, textTransform: "uppercase", letterSpacing: "0.5px" }}>{r.label}</div>
                        <div style={{ fontFamily: F.ui, fontSize: 14, fontWeight: 700, color: T.luxuryBrown, marginTop: 2 }} className="truncate">{r.value}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </SectionCard>

              {/* 2. Materials & Payments History Grid (Above Sarees Inventory) */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 sm:gap-7 items-start">
                {/* Materials History */}
                <SectionCard
                  icon={PackageCheck}
                  title="Materials History"
                  subtitle="Raw material yarn & GRN allocations issued"
                >
                  {materialRecords.length > 0 ? (
                    <div style={{ display: "flex", flexDirection: "column", gap: 10, maxHeight: 280, overflowY: "auto" }}>
                      {materialRecords.map((r, i) => (
                        <div key={r.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", padding: "12px 16px", background: i % 2 === 1 ? T.warmIvory : "#FFFFFF", borderRadius: 12, border: `1px solid ${T.borderDef}` }}>
                          <div>
                            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                              <span style={{ fontFamily: "var(--font-mono)", fontSize: 13, color: T.royalBurgundy, background: "rgba(110,15,45,0.07)", borderRadius: 6, padding: "2px 8px", fontWeight: 700 }}>{r.id}</span>
                              <span style={{ fontFamily: F.ui, fontSize: 12, color: T.taupe }}>{new Date(r.issuedAt).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}</span>
                            </div>
                            <div style={{ display: "flex", flexDirection: "column", gap: 4, marginTop: 8 }}>
                              {r.materials.map(m => (
                                <div key={`${m.materialType}-${m.warpSubtype ?? m.jariType ?? ""}`} style={{ fontFamily: F.ui, fontSize: 13, color: T.luxuryBrown }}>
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
                    <div style={{ background: T.warmIvory, borderRadius: 14, padding: 24, textAlign: "center", color: T.taupe, fontFamily: F.ui, fontSize: 14, fontStyle: "italic", border: `1px solid ${T.borderDef}` }}>
                      No materials issued to this weaver yet.
                    </div>
                  )}
                </SectionCard>

                {/* Payments History */}
                <SectionCard
                  icon={CreditCard}
                  title="Payments History"
                  subtitle="Financial transactions & UTR receipts"
                >
                  {weaverPayments.length > 0 ? (
                    <div style={{ display: "flex", flexDirection: "column", gap: 10, maxHeight: 280, overflowY: "auto" }}>
                      {weaverPayments.map((p, i) => (
                        <div key={p.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 16px", background: i % 2 === 1 ? T.warmIvory : "#FFFFFF", borderRadius: 12, border: `1px solid ${T.borderDef}` }}>
                          <div>
                            <div style={{ fontFamily: F.ui, fontSize: 14, fontWeight: 700, color: T.luxuryBrown }}>{p.firmName}</div>
                            <div style={{ fontFamily: "var(--font-mono)", fontSize: 12, color: T.taupe, marginTop: 3 }}>UTR: {p.utrNumber}</div>
                          </div>
                          <div style={{ textAlign: "right" }}>
                            <div style={{ fontFamily: F.display, fontWeight: 700, fontSize: 16, color: T.green }}>{formatMoney(rupees(p.amountPaid))}</div>
                            <div style={{ fontFamily: F.ui, fontSize: 12, color: T.taupe, marginTop: 4 }}>{p.paymentDate}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div style={{ background: T.warmIvory, borderRadius: 14, padding: 24, textAlign: "center", color: T.taupe, fontFamily: F.ui, fontSize: 14, fontStyle: "italic", border: `1px solid ${T.borderDef}` }}>
                      No payments history found.
                    </div>
                  )}
                </SectionCard>
              </div>

              {/* 3. Sarees Inventory & Production History SectionCard */}
              <SectionCard
                icon={Boxes}
                title="Sarees Inventory & Production History"
                subtitle={`Live saree inventory, loom dispatches, QC status, and sales history for ${weaver.name}`}
              >
                <WeaverSareesSection weaverId={weaver.id} weaverName={weaver.name} />
              </SectionCard>
            </div>
          )}

          {tab === "batches" && (
            <SectionCard icon={Layers3} title="Batch History" subtitle={`Production batches assigned to ${weaver.name}`}>
              <BatchesTab sortedAllWeaverBatches={sortedAllWeaverBatches} dispatches={dispatches} weaver={weaver} batchDateFilter={batchDateFilter} setBatchDateFilter={setBatchDateFilter} setViewDispatches={setViewDispatches} onNavigate={onNavigate} />
            </SectionCard>
          )}

          {tab === "dispatches" && (
            <SectionCard icon={PaperPlaneTilt} title="Design Dispatches" subtitle={`Design cards and pattern dispatches for ${weaver.name}`}>
              <DispatchesTab dispatchGroups={dispatchGroups} dispatchDateFilter={dispatchDateFilter} setDispatchDateFilter={setDispatchDateFilter} setZoomImage={setZoomImage} />
            </SectionCard>
          )}

          {tab === "payments" && (
            <SectionCard icon={FileText} title="Payments Ledger" subtitle={`Financial payout records and transaction statement for ${weaver.name}`}>
              <PaymentsTab weaver={weaver} weaverPayments={weaverPayments} filteredWeaverPayments={filteredWeaverPayments} paymentDateFilter={paymentDateFilter} setPaymentDateFilter={setPaymentDateFilter} />
            </SectionCard>
          )}

          {tab === "materials" && (
            <SectionCard icon={PackageCheck} title="Raw Materials Received" subtitle={`Yarn issue records and GRN allocations for ${weaver.name}`}>
              <MaterialsTab materialRecords={materialRecords} materialByBatch={materialByBatch} />
            </SectionCard>
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
          <motion.div key="zoom" role="dialog" aria-modal="true" aria-label={zoomImage.label}
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={() => setZoomImage(null)}
            style={{ position: "fixed", inset: 0, background: "var(--surface-scrim)", zIndex: "var(--z-modal)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 14, cursor: "zoom-out" }}>
            <img src={zoomImage.url} alt={zoomImage.label} style={{ maxWidth: "80vw", maxHeight: "75vh", borderRadius: 12, boxShadow: "0 20px 60px rgba(0,0,0,0.4)" }} />
            <span style={{ fontFamily: F.ui, fontSize: 13, color: "#fff", fontWeight: 600 }}>{zoomImage.label}</span>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
