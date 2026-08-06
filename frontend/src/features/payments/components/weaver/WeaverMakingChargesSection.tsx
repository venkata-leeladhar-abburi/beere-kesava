import React, { useMemo, useState } from "react";
import { AlertTriangle, BadgeCheck, Download, Eye, LayoutGrid, LayoutList, MinusCircle, Search, UserCheck, Wallet } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { toast } from "sonner";
import { useQuery } from "@tanstack/react-query";

import { useBatches } from "../../../production/contexts/BatchContext";
import { DownloadGate } from "../../../../shared/ui/DownloadAccess";
import { useMaterialIssue } from "../../../materials/contexts/MaterialIssueContext";
import { weaversApi, BackendWeaver } from "../../../../shared/api/weavers";
import { weaverPaymentsApi, BackendWeaverPayment } from "../../../../shared/api/payments";
import { EASE, F, T } from "../../theme";
import { WeaverRecord } from "../../types";
import { RATES, calcCharges, calcNet } from "../../utils/charges";
import { FadeUp } from "../common/motion";
import { ActionModal, DropBtn, Pip, StatusBadge } from "../common/primitives";
import { Button, Checkbox, SearchInput } from "../../../../shared/ui/primitives";
import { BankUploadPanel } from "./BankUploadPanel";
import { WeaverCard } from "./WeaverCard";
import { WeaverPaymentDetailModal } from "./WeaverPaymentDetailModal";

const AVATAR_PALETTE = ["#5A3E6B", "#6E0F2D", "#2D6B6B", "#4A6B4A", "#9B6B8A", "#2D7D6B", "#4A5E7A", "#7A2040"];

/**
 * Maps a real Weaver + that weaver's most recent WeaverPayment (from
 * GET /payments/weavers) into the local WeaverRecord shape this section's
 * card/list views expect. The backend does not track saree design-type
 * breakdown (sb/hz/ps/bs/st design counts) per weaver — those are always 0
 * here; the sarees-completed figure instead comes from the payment's
 * noOfSarees field (shown via the uploadedNoOfSarees override, same as the
 * Excel-upload flow already did).
 */
function toWeaverRecord(w: BackendWeaver, index: number, latestPayment: BackendWeaverPayment | undefined): WeaverRecord {
  return {
    id: w.id,
    name: w.name,
    initials: w.initials,
    bg: AVATAR_PALETTE[index % AVATAR_PALETTE.length],
    village: w.village || "—",
    sb: 0, hz: 0, ps: 0, bs: 0, st: 0,
    advance: latestPayment?.deduction ? Number(latestPayment.deduction) : 0,
    status: latestPayment ? "Paid" : "Pending",
    uploadedAmount: latestPayment ? Number(latestPayment.amountPaid) : undefined,
    uploadedDeduction: latestPayment?.deduction !== undefined && latestPayment?.deduction !== null ? Number(latestPayment.deduction) : undefined,
    uploadedNoOfSarees: latestPayment?.noOfSarees ?? undefined,
    uploadedBatchNo: latestPayment?.batchNo ?? undefined,
    uploadedLoomNumber: latestPayment?.loomNumber ?? undefined,
  };
}

export function WeaverMakingChargesSection() {
  const { data: weaversRes, isLoading: weaversLoading, isError: weaversError } = useQuery({
    queryKey: ["payments-weavers-roster"],
    queryFn: () => weaversApi.list(),
  });
  const { data: paymentsRes, isLoading: paymentsLoading, isError: paymentsError, refetch: refetchPayments } = useQuery({
    queryKey: ["payments-weaver-payments"],
    queryFn: () => weaverPaymentsApi.list(),
  });

  const roster = weaversRes?.items ?? [];
  const payments = paymentsRes?.items ?? [];

  const weaversList: WeaverRecord[] = useMemo(() => {
    const latestByWeaver = new Map<string, BackendWeaverPayment>();
    for (const p of payments) {
      const existing = latestByWeaver.get(p.weaverId);
      if (!existing || new Date(p.paymentDate) > new Date(existing.paymentDate)) {
        latestByWeaver.set(p.weaverId, p);
      }
    }
    return roster.map((w, i) => toWeaverRecord(w, i, latestByWeaver.get(w.id)));
  }, [roster, payments]);

  const isLoading = weaversLoading || paymentsLoading;
  const isError = weaversError || paymentsError;

  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [view, setView] = useState<"card" | "list">("card");
  const [search, setSearch] = useState("");
  const [downloadModal, setDownloadModal] = useState(false);
  const [selWeaver, setSelWeaver] = useState<WeaverRecord | null>(null);

  const [filterVillage, setFilterVillage] = useState("All Villages");
  const [filterStatus, setFilterStatus] = useState("All Payment Status");
  const { batches } = useBatches();
  const { getRecordsForWeaver } = useMaterialIssue();

  const viewOptions = [
    { key: "card", Icon: LayoutGrid, label: "Card View" },
    { key: "list", Icon: LayoutList, label: "List View" },
  ] as const;

  const villageOptions = useMemo(
    () => Array.from(new Set(weaversList.map(w => w.village).filter(v => v && v !== "—"))).sort(),
    [weaversList],
  );

  const filtered = weaversList.filter(w => {
    const matchSearch = !search || w.name.toLowerCase().includes(search.toLowerCase()) || w.id.toLowerCase().includes(search.toLowerCase()) || w.village.toLowerCase().includes(search.toLowerCase());
    const matchVillage = filterVillage === "All Villages" || w.village === filterVillage;
    const matchStatus = filterStatus === "All Payment Status" || w.status === filterStatus;
    return matchSearch && matchVillage && matchStatus;
  });

  const toggleSelection = (id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const downloadExcelTemplate = async () => {
    const weaversToExport = selectedIds.size > 0 
      ? weaversList.filter(w => selectedIds.has(w.id))
      : filtered;

    if (weaversToExport.length === 0) {
      toast.error("No weavers match the current selection/filters.");
      return;
    }

    const dataRows = weaversToExport.map(w => {
      const weaverBatches = batches.filter(b => b.rows.some(r => r.weaverId === w.id));
      const activeBatches = weaverBatches.filter(b => b.status === "active");
      const activeRow = activeBatches[0]?.rows.find(r => r.weaverId === w.id);
      
      const loomNumber = activeRow?.weaverLoom?.toString() || "1";
      const noOfSarees = w.uploadedNoOfSarees !== undefined ? w.uploadedNoOfSarees : (w.sb + w.hz + w.ps + w.bs + w.st || 1);
      const grossAmount = w.uploadedAmount !== undefined ? w.uploadedAmount : calcCharges(w);
      const deduction = w.uploadedDeduction !== undefined ? w.uploadedDeduction : w.advance;
      const netAmount = grossAmount - deduction;

      // Dynamic Batches Info
      const activeBatchesString = activeBatches.map(b => b.batchId).join(", ") || "None";
      const allBatchesString = weaverBatches.map(b => b.batchId).join(", ") || "None";

      // Dynamic Material Issue Info
      const weaverMaterials = getRecordsForWeaver(w.id);
      const materialSummary = weaverMaterials.flatMap(r => r.materials).reduce((acc, m) => {
        const qty = m.quantity;
        const unit = m.unit;
        const key = `${m.materialType} (${unit})`;
        acc[key] = (acc[key] || 0) + qty;
        return acc;
      }, {} as Record<string, number>);
      const materialSummaryString = Object.entries(materialSummary).map(([k, v]) => `${k}: ${v}`).join(", ") || "No materials issued";

      return {
        "Weaver ID": w.id,
        "Name": w.name,
        "Village": w.village,
        "Loom Number": loomNumber,
        "Active Batch ID": activeBatchesString,
        "All Batches History": allBatchesString,
        "Self Brocade (Qty)": w.sb,
        "Self Brocade Rate": RATES.sb,
        "Self Brocade Total": w.sb * RATES.sb,
        "Heavy Zari (Qty)": w.hz,
        "Heavy Zari Rate": RATES.hz,
        "Heavy Zari Total": w.hz * RATES.hz,
        "Plain Silk (Qty)": w.ps,
        "Plain Silk Rate": RATES.ps,
        "Plain Silk Total": w.ps * RATES.ps,
        "Bridal Special (Qty)": w.bs,
        "Bridal Special Rate": RATES.bs,
        "Bridal Special Total": w.bs * RATES.bs,
        "Stripe Brocade (Qty)": w.st,
        "Stripe Brocade Rate": RATES.st,
        "Stripe Brocade Total": w.st * RATES.st,
        "Total Sarees": noOfSarees,
        "Gross Making Charges": grossAmount,
        "Materials Issued History": materialSummaryString,
        "Deduction (Advance)": deduction,
        "Net Payable": netAmount,
        "Payment Status": w.status,
      };
    });

    const XLSX = await import("xlsx");
    const worksheet = XLSX.utils.json_to_sheet(dataRows);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "PaymentLedger");
    XLSX.writeFile(workbook, "Weaver_Payment_Ledger.xlsx");
    toast.success(`Successfully exported ledger for ${weaversToExport.length} weavers!`);
  };

  const totalWeavers = weaversList.length;
  const totalGross = weaversList.reduce((acc, w) => acc + calcCharges(w), 0);
  const totalDeductions = weaversList.reduce((acc, w) => acc + (w.uploadedDeduction !== undefined ? w.uploadedDeduction : w.advance), 0);
  const totalNet = weaversList.reduce((acc, w) => acc + calcNet(w), 0);
  const formatINR = (n: number) => `₹${n.toLocaleString("en-IN")}`;

  return (
    <div id="pay-making-charges" style={{ padding: "36px 40px 0" }}>
      <FadeUp>
        {/* ── Section header ──────────────────────────────────── */}
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 4 }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 6 }}>
              <div style={{ width: 4, height: 28, background: T.antiqueGold, borderRadius: 99 }} />
              <h2 style={{ fontFamily: F.display, fontSize: 24, color: T.luxuryBrown, margin: 0 }}>
                Weaver Making Charges — May 2026
              </h2>
            </div>
            <p style={{ fontFamily: F.ui, fontSize: 14, color: T.taupe, margin: "0 0 0 16px", maxWidth: 640, lineHeight: 1.6 }}>
              Making charges are paid once a month at the end of the month. This system calculates each weaver's earnings based on completed and approved sarees.
            </p>
          </div>
          <div style={{ display: "flex", gap: 10, flexShrink: 0 }}>
            {selectedIds.size > 0 && (
              <Button variant="secondary" size="md" onClick={() => setSelectedIds(new Set())}>
                Clear Selection ({selectedIds.size})
              </Button>
            )}
            <DownloadGate>
              <Button variant="secondary" size="md" iconLeft={Download} onClick={downloadExcelTemplate}>
                Export Ledger Template
              </Button>
              <Button variant="primary" size="md" iconLeft={Download} onClick={() => setDownloadModal(true)}>
                Download Weaver Payment Report
              </Button>
            </DownloadGate>
          </div>
        </div>

        {/* ── 4 stat cards ────────────────────────────────────── */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16, marginTop: 24, marginBottom: 22, alignItems: "stretch" }}>
          {[
            {
              icon: <UserCheck size={22} color={T.royalBurgundy} />,
              iconBg: "rgba(110,15,45,0.08)",
              label: "Total Weavers",
              value: String(totalWeavers),
              sub: "All active weavers this month",
              hi: false,
            },
            {
              icon: <Wallet size={22} color={T.royalBurgundy} />,
              iconBg: "rgba(110,15,45,0.08)",
              label: "Total Making Charges",
              value: formatINR(totalGross),
              sub: "Gross charges for May 2026",
              hi: false,
            },
            {
              icon: <MinusCircle size={22} color={T.crimson} />,
              iconBg: "rgba(192,57,43,0.08)",
              label: "Total Deductions Applied",
              value: formatINR(totalDeductions),
              sub: "Advance amount deducted",
              hi: false,
            },
            {
              icon: <BadgeCheck size={22} color={T.antiqueGold} />,
              iconBg: "rgba(200,155,71,0.16)",
              label: "Net Amount to Pay",
              value: formatINR(totalNet),
              sub: "After all deductions",
              hi: true,
            },
          ].map((s, i) => (
            <div key={i} style={{ background: s.hi ? "linear-gradient(135deg,rgba(200,155,71,0.14),rgba(200,155,71,0.04))" : "#FFFFFF", borderRadius: 14, border: `1px solid ${s.hi ? T.borderGold : T.borderDef}`, padding: "20px 20px 18px", boxShadow: "0 2px 14px rgba(74,6,27,0.07)", position: "relative", overflow: "hidden", display: "flex", flexDirection: "column", gap: 10 }}>
              {s.hi && <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 3, background: `linear-gradient(90deg,${T.antiqueGold},${T.goldLight})` }} />}
              {/* Icon + label row */}
              <div style={{ display: "flex", alignItems: "flex-start", gap: 12 }}>
                <div style={{ width: 44, height: 44, borderRadius: 12, background: s.iconBg, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  {s.icon}
                </div>
                <div style={{ fontFamily: F.ui, fontSize: 13, fontWeight: 600, color: s.hi ? T.antiqueGold : T.taupe, lineHeight: 1.35, paddingTop: 2 }}>{s.label}</div>
              </div>
              {/* Value */}
              <div style={{ fontFamily: F.display, fontSize: 30, fontWeight: 700, color: s.hi ? T.antiqueGold : T.luxuryBrown, lineHeight: 1 }}>{s.value}</div>
              {/* Sub */}
              <div style={{ fontFamily: F.ui, fontSize: 13, color: T.taupe }}>{s.sub}</div>
            </div>
          ))}
        </div>

        {/* ── Upload Bank Payment File panel ──────────────────── */}
        {/* Saves directly to the real backend (real Weaver UUIDs). The
            "Paid"/"Pending" status and gross/net figures above are now
            derived live from GET /weavers + GET /payments/weavers, so a
            successful import is reflected here once the query refetches. */}
        <BankUploadPanel
          onReset={() => {
            void refetchPayments();
          }}
        />

        {/* ── Filter + View toggle bar ─────────────────────────── */}
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 18, flexWrap: "wrap" as const }}>
          {/* View toggle */}
          <div style={{ display: "flex", border: `1px solid ${T.borderDef}`, borderRadius: 9, overflow: "hidden", background: "#fff" }}>
            {viewOptions.map(({ key, Icon, label }) => (
              <Button key={key} variant={view === key ? "primary" : "tertiary"} size="sm" iconLeft={Icon}
                onClick={() => setView(key as any)}
                className="!rounded-none">
                {label}
              </Button>
            ))}
          </div>
          <label style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "8px 12px", border: `1px solid ${T.borderDef}`, borderRadius: 9, background: "#fff", fontFamily: F.ui, fontSize: 13, fontWeight: 500, color: T.luxuryBrown, cursor: "pointer" }}>
            <input
              type="checkbox"
              checked={filtered.length > 0 && filtered.every(w => selectedIds.has(w.id))}
              onChange={() => {
                const allSelected = filtered.every(w => selectedIds.has(w.id));
                setSelectedIds(prev => {
                  const next = new Set(prev);
                  filtered.forEach(w => {
                    if (allSelected) next.delete(w.id);
                    else next.add(w.id);
                  });
                  return next;
                });
              }}
              style={{ accentColor: T.royalBurgundy }}
            />
            Select All Filtered
          </label>
          <DropBtn value="All Weavers" options={["All Weavers", "Master Weavers", "Junior Weavers"]} />
          <DropBtn value={filterVillage} options={["All Villages", ...villageOptions]} onChange={setFilterVillage} />
          <DropBtn value={filterStatus} options={["All Payment Status", "Pending", "Paid"]} onChange={setFilterStatus} />
          <DropBtn value="All Making Charge Rate" options={["All Making Charge Rate", "Self Brocade (₹450)", "Heavy Zari (₹680)", "Plain Silk (₹280)"]} />
          <div style={{ flex: 1, minWidth: 200, position: "relative" }}>
            <Search size={13} style={{ position: "absolute", left: 11, top: "50%", transform: "translateY(-50%)", color: T.taupe }} />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search weaver name, ID, or village..."
              style={{ width: "100%", padding: "7px 12px 7px 32px", border: `1px solid ${T.borderDef}`, borderRadius: 7, fontFamily: F.ui, fontSize: 12, color: T.luxuryBrown, background: "#fff", outline: "none", boxSizing: "border-box" as const }} />
          </div>
        </div>

        {/* ── Loading / error / empty states ──────────────────── */}
        {isLoading ? (
          <div style={{ textAlign: "center", padding: "60px 20px", fontFamily: F.ui, fontSize: 14, color: T.taupe }}>
            Loading weaver making charges…
          </div>
        ) : isError ? (
          <div style={{ textAlign: "center", padding: "60px 20px" }}>
            <AlertTriangle size={26} color={T.crimson} style={{ marginBottom: 10 }} />
            <div style={{ fontFamily: F.ui, fontSize: 14, color: T.crimson, fontWeight: 600 }}>Couldn't load weaver payment data.</div>
            <div style={{ fontFamily: F.ui, fontSize: 13, color: T.taupe, marginTop: 4 }}>Please try refreshing the page.</div>
          </div>
        ) : filtered.length === 0 ? (
          <div style={{ textAlign: "center", padding: "60px 20px" }}>
            <div style={{ fontFamily: F.ui, fontSize: 14, color: T.taupe }}>
              {weaversList.length === 0 ? "No weavers registered yet." : "No weavers match the current search/filters."}
            </div>
          </div>
        ) : (
        <>
        {/* ── Card view grid ───────────────────────────────────── */}
        {view === "card" && (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16, marginBottom: 28 }}>
            {filtered.map((w, i) => (
              <motion.div key={w.id} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: i * 0.05, ease: EASE }}>
                <WeaverCard
                  w={w}
                  onViewDetails={() => setSelWeaver(w)}
                  selected={selectedIds.has(w.id)}
                  onToggleSelect={() => toggleSelection(w.id)}
                />
              </motion.div>
            ))}
          </div>
        )}

        {/* ── List view ────────────────────────────────────────── */}
        {view === "list" && (
          <div style={{ background: "#FFFFFF", borderRadius: 16, border: `1px solid ${T.borderDef}`, overflow: "hidden", marginBottom: 28, boxShadow: "0 4px 20px rgba(74,6,27,0.05)" }}>
            {filtered.map((w, i) => {
              const charges = calcCharges(w); const net = calcNet(w);
              const completedSarees = w.uploadedNoOfSarees !== undefined ? w.uploadedNoOfSarees : (w.sb + w.hz + w.ps + w.bs + w.st);
              const deduction = w.uploadedDeduction !== undefined ? w.uploadedDeduction : w.advance;
              return (
                <div
                  key={w.id}
                  style={{
                    display: "flex", alignItems: "center", gap: 16, padding: "14px 20px",
                    background: i % 2 === 0 ? "#FFFDF9" : T.silkCream,
                    borderBottom: i < filtered.length - 1 ? `1px solid ${T.borderDef}` : "none",
                    borderLeft: `4px solid ${w.status === "Paid" ? T.green : T.antiqueGold}`,
                    transition: "background-color 0.15s ease",
                  }}
                >
                  {/* Checkbox */}
                  <input
                    type="checkbox"
                    checked={selectedIds.has(w.id)}
                    onChange={() => toggleSelection(w.id)}
                    style={{
                      width: 17,
                      height: 17,
                      cursor: "pointer",
                      accentColor: T.royalBurgundy,
                      marginRight: 4,
                    }}
                  />
                  <Pip initials={w.initials} bg={w.bg} size={38} />
                  <div style={{ flex: "0 0 180px" }}>
                    <div style={{ fontFamily: F.ui, fontSize: 13, fontWeight: 700, color: T.luxuryBrown }}>{w.name}</div>
                    <div style={{ display: "flex", gap: 6, alignItems: "center", marginTop: 2 }}>
                      <span style={{ fontFamily: F.mono, fontSize: 12, color: T.royalBurgundy, background: "rgba(110,15,45,0.06)", padding: "1px 5px", borderRadius: 4 }}>{w.id}</span>
                      <span style={{ fontFamily: F.ui, fontSize: 12, color: T.taupe }}>📍 {w.village}</span>
                    </div>
                  </div>
                  <div style={{ flex: 1, fontFamily: F.ui, fontSize: 12, color: T.taupe }}>
                    <strong style={{ color: T.luxuryBrown, fontFamily: F.mono }}>{completedSarees}</strong> sarees completed
                    {w.uploadedBatchNo && (
                      <span style={{ color: T.royalBurgundy, display: "block", marginTop: 2, fontSize: 12, fontFamily: F.mono, fontWeight: 600 }}>
                        Batch: {w.uploadedBatchNo} · Loom: {w.uploadedLoomNumber}
                      </span>
                    )}
                  </div>
                  <div style={{ flex: "0 0 120px" }}>
                    <div style={{ fontFamily: F.ui, fontSize: 12, color: T.taupe, textTransform: "uppercase", letterSpacing: "0.5px" }}>Gross Charges</div>
                    <div style={{ fontFamily: F.mono, fontSize: 13, color: T.luxuryBrown, fontWeight: 600 }}>₹{charges.toLocaleString("en-IN")}</div>
                  </div>
                  <div style={{ flex: "0 0 120px" }}>
                    <div style={{ fontFamily: F.ui, fontSize: 12, color: T.taupe, textTransform: "uppercase", letterSpacing: "0.5px" }}>Deductions</div>
                    <div style={{ fontFamily: F.mono, fontSize: 13, color: T.crimson, fontWeight: 600 }}>−₹{deduction.toLocaleString("en-IN")}</div>
                  </div>
                  <div style={{ flex: "0 0 130px" }}>
                    <div style={{ fontFamily: F.ui, fontSize: 12, color: T.taupe, textTransform: "uppercase", letterSpacing: "0.5px" }}>Net Payable</div>
                    <div style={{ fontFamily: F.display, fontSize: 16, fontWeight: 800, color: w.status === "Paid" ? T.green : T.royalBurgundy }}>₹{net.toLocaleString("en-IN")}</div>
                  </div>
                  <div style={{ flex: "0 0 110px" }}>
                    <StatusBadge status={w.status} />
                  </div>
                  <button
                    onClick={() => setSelWeaver(w)}
                    style={{
                      padding: "7px 14px", border: `1.5px solid rgba(110,15,45,0.12)`, borderRadius: 8,
                      background: "#fff", fontFamily: F.ui, fontSize: 12, fontWeight: 700,
                      color: T.royalBurgundy, cursor: "pointer", display: "flex", alignItems: "center", gap: 5,
                      transition: "all 0.15s ease",
                    }}
                    onMouseEnter={e => { e.currentTarget.style.background = "rgba(110,15,45,0.04)"; e.currentTarget.style.borderColor = T.royalBurgundy; }}
                    onMouseLeave={e => { e.currentTarget.style.background = "#fff"; e.currentTarget.style.borderColor = "rgba(110,15,45,0.12)"; }}
                  >
                    <Eye size={12} /> Details
                  </button>
                </div>
              );
            })}
          </div>
        )}
        </>
        )}

        <ActionModal open={downloadModal} onClose={() => setDownloadModal(false)} title="Download Weaver Report" desc="Generate and download the weaver making charges payment report." actionLabel="Download" icon={Download} />
        <AnimatePresence>
          {selWeaver && <WeaverPaymentDetailModal weaver={selWeaver} onClose={() => setSelWeaver(null)} />}
        </AnimatePresence>
      </FadeUp>
    </div>
  );
}
