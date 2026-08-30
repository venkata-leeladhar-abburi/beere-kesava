import React, { useContext, useState, useMemo } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "motion/react";
import { Download, Trash2, ArrowLeftRight, ArrowDownLeft, ArrowUpRight } from "lucide-react";
import { DateFilterBar, DateFilterState, DEFAULT_DATE_FILTER } from "../../../../shared/ui/DateFilterBar";
import { MobileFilterBar } from "../../../../shared/ui/filter/MobileFilterBar";
import { ConfirmDialog } from "../../../../shared/ui/ConfirmDialog";
import { ApiError } from "../../../../shared/api/client";
import { T, F, EASE, MobileCtx } from "../theme";
import { SectionCard, FadeUp } from "../common/primitives";
import { rawMaterialsApi } from "../../../../shared/api/rawMaterials";
import { materialIssuesApi } from "../../../../shared/api/material-issues";
import { IconButton, Button } from "../../../../shared/ui/primitives";
import { LoadingState, ErrorState } from "../../../../shared/ui/state";
import { EntityCode } from "@/shared/ui/domain";
import { exportTable, type ColumnDef } from "../../../../shared/ui/data";
import { Pagination, usePagination } from "../../../../shared/ui/DataPagination";

function parseKg(quantity: number | string | null | undefined, unit?: string | null): number {
  const q = Number(quantity || 0);
  if (!unit) return q;
  const u = unit.trim().toLowerCase();
  if (u === "g" || u === "gram" || u === "grams") return q / 1000;
  return q;
}

interface MovementEntry {
  type: "in" | "out";
  desc: string;
  time: string;
  ref: string;
  qty: number;
}

// The movement history renders as a timeline rather than a DataTable, so the
// downloadable report defines its own columns over the same entries.
const MOVEMENT_EXPORT_COLUMNS: ColumnDef<MovementEntry>[] = [
  { id: "time", header: "Date", accessor: e => e.time },
  { id: "direction", header: "Direction", accessor: e => (e.type === "in" ? "Received from vendor" : "Issued out") },
  { id: "ref", header: "Reference", accessor: e => e.ref, type: "code" },
  { id: "desc", header: "Details", accessor: e => e.desc },
  { id: "qty", header: "Quantity (kg)", accessor: e => e.qty },
];

export function MovementHistorySection({ onDownloadMovementReport }: { onDownloadMovementReport: (exporter: (format: "xlsx" | "csv") => Promise<void>) => void }) {
  const { isMobile, px } = useContext(MobileCtx);
  const [dateFilter, setDateFilter] = useState<DateFilterState>(DEFAULT_DATE_FILTER);
  const queryClient = useQueryClient();
  const [deletingRef, setDeletingRef] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  function cancelDelete() {
    if (deleting) return;
    setDeletingRef(null);
    setDeleteError(null);
  }

  async function confirmDelete() {
    if (!deletingRef || deleting) return;
    setDeleting(true);
    setDeleteError(null);
    try {
      await materialIssuesApi.remove(deletingRef);
      void queryClient.invalidateQueries({ queryKey: ["material-issues"] });
      void queryClient.invalidateQueries({ queryKey: ["materialIssue", "issueRecords"] });
      void queryClient.invalidateQueries({ queryKey: ["raw-material-stock"] });
      void queryClient.invalidateQueries({ queryKey: ["raw-material-stock-list"] });
      setDeletingRef(null);
    } catch (err) {
      setDeleteError(err instanceof ApiError ? err.message : `Could not delete ${deletingRef}. Please try again.`);
    } finally {
      setDeleting(false);
    }
  }

  const { data: rawGrns, isLoading: grnsLoading, isError: grnsError, refetch: refetchGrns } = useQuery({
    queryKey: ["grn-receipts"],
    queryFn: () => rawMaterialsApi.listGrns(),
  });

  const { data: rawIssues, isLoading: issuesLoading, isError: issuesError, refetch: refetchIssues } = useQuery({
    queryKey: ["material-issues"],
    queryFn: () => materialIssuesApi.list(100),
  });

  const { data: rawStock } = useQuery({
    queryKey: ["raw-material-stock"],
    queryFn: () => rawMaterialsApi.listStock(),
  });

  const movementLoading = grnsLoading || issuesLoading;
  const movementError = grnsError || issuesError;
  const refetchMovement = () => { void refetchGrns(); void refetchIssues(); };

  const stats = useMemo(() => {
    const grns = rawGrns?.items ?? [];
    const issues = rawIssues?.items ?? [];
    const stockItems = rawStock?.items ?? [];

    let receivedKg = 0;
    grns.forEach(g => {
      g.items.forEach(i => {
        receivedKg += parseKg(i.quantity, i.unit || "KG");
      });
    });

    let issuedKg = 0;
    issues.forEach(iss => {
      iss.items.forEach(i => {
        issuedKg += parseKg(i.quantity, i.unit);
      });
    });

    const currentStockKg = stockItems.reduce((sum, s) => sum + parseKg(s.currentStock, s.unit), 0);
    const inFactoryKg = currentStockKg > 0 ? currentStockKg : Math.max(0, receivedKg - issuedKg);

    // Timeline entries
    const grnEntries = grns.map(g => {
      const totalQtyKg = g.items.reduce((s, i) => s + parseKg(i.quantity, i.unit || "KG"), 0);
      return {
        type: "in" as const,
        desc: `${g.supplierName ?? "Vendor"} — ${g.items.map(i => `${i.name} (${i.quantity} ${i.materialType === "JARI" ? (i.unit || "Reels") : (i.unit || "kg")})`).join(", ")}`,
        time: g.receivedDate ? new Date(g.receivedDate).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }) : "Recent",
        ref: g.id,
        date: g.receivedDate ? new Date(g.receivedDate).getTime() : Date.now(),
        qty: Math.round(totalQtyKg * 10) / 10,
        monthLabel: g.receivedDate ? new Date(g.receivedDate).toLocaleDateString("en-GB", { month: "short", year: "2-digit" }) : "Recent",
      };
    });

    const issueEntries = issues.map(iss => {
      const totalQtyKg = iss.items.reduce((s, i) => s + parseKg(i.quantity, i.unit), 0);
      return {
        type: "out" as const,
        desc: `Issued to Weaver/Loom — ${iss.items.map(i => `${i.materialType} ${i.quantity} ${i.unit}`).join(", ")}`,
        time: new Date(iss.issuedAt).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }),
        ref: iss.id,
        date: new Date(iss.issuedAt).getTime(),
        qty: Math.round(totalQtyKg * 10) / 10,
        monthLabel: new Date(iss.issuedAt).toLocaleDateString("en-GB", { month: "short", year: "2-digit" }),
      };
    });

    const entries = [...grnEntries, ...issueEntries].sort((a, b) => b.date - a.date);

    // Dynamic Chart Data aggregated by month
    const chartMap = new Map<string, { label: string; received: number; given: number; timestamp: number }>();

    grnEntries.forEach(g => {
      const existing = chartMap.get(g.monthLabel) ?? { label: g.monthLabel, received: 0, given: 0, timestamp: g.date };
      existing.received += g.qty;
      chartMap.set(g.monthLabel, existing);
    });

    issueEntries.forEach(i => {
      const existing = chartMap.get(i.monthLabel) ?? { label: i.monthLabel, received: 0, given: 0, timestamp: i.date };
      existing.given += i.qty;
      chartMap.set(i.monthLabel, existing);
    });

    const chartData = Array.from(chartMap.values()).sort((a, b) => a.timestamp - b.timestamp);
    const finalChartData = chartData.length > 0 ? chartData : [
      { label: "Current", received: Math.round(receivedKg), given: Math.round(issuedKg), timestamp: Date.now() }
    ];

    return {
      receivedKg: Math.round(receivedKg),
      issuedKg: Math.round(issuedKg),
      inFactoryKg: Math.round(inFactoryKg),
      entries,
      chartData: finalChartData,
    };
  }, [rawGrns, rawIssues, rawStock]);

  const pag = usePagination(stats.entries, 10);

  return (
    <section id="mat-movement" style={{ padding: `44px ${px}px 48px` }}>
    <SectionCard
      icon={ArrowLeftRight}
      title="Full Movement History — Stock Coming In and Going Out"
      subtitle="Every time material came into the factory from a vendor, or was given out to a weaver — it is recorded here."
      actions={
        <Button
          onClick={() => onDownloadMovementReport(format => exportTable({
            columns: MOVEMENT_EXPORT_COLUMNS,
            rows: stats.entries,
            filename: "movement-history",
            format,
          }))}
          variant="secondary"
          size="sm"
          iconLeft={Download}
        >
          Download Report
        </Button>
      }
    >
      {/* Mobile Flipkart-style Filter Bar */}
      <div className="md:hidden mb-4 bg-white p-3.5 rounded-2xl border border-[var(--border-default)] shadow-xs">
        <MobileFilterBar
          search=""
          onSearchChange={() => {}}
          searchPlaceholder="Search movement history..."
          filterGroups={[
            {
              id: "time",
              label: "Time Period",
              value: dateFilter.mode,
              defaultValue: "all",
              options: [
                { value: "all", label: "All Time" },
                { value: "day", label: "Specific Date" },
                { value: "range", label: "Date Range" },
                { value: "month", label: "Monthly" },
                { value: "year", label: "Yearly" },
              ],
              onChange: (m: string) => {
                const mode = m as DateFilterState["mode"];
                if (mode === "day") setDateFilter({ mode, day: new Date().toISOString().slice(0, 10), from: "", to: "", month: "", year: "" });
                else if (mode === "month") setDateFilter({ mode, day: "", from: "", to: "", month: `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, "0")}`, year: "" });
                else if (mode === "year") setDateFilter({ mode, day: "", from: "", to: "", month: "", year: String(new Date().getFullYear()) });
                else setDateFilter({ mode, day: "", from: "", to: "", month: "", year: "" });
              },
            },
          ]}
          onResetAll={() => setDateFilter(DEFAULT_DATE_FILTER)}
        />
      </div>

      {/* Desktop Filter Bar */}
      <div className="hidden md:block mb-6">
        <DateFilterBar filter={dateFilter} onChange={setDateFilter} />
      </div>

      <FadeUp>
        <div style={{ background: "#FFFFFF", borderRadius: 16, border: `1.5px solid ${T.royalBurgundy}`, boxShadow: "0 1px 2px rgba(74,6,27,0.03), 0 6px 18px rgba(74,6,27,0.05)", overflow: "hidden", marginBottom: 28, position: "relative" }}>
          <span aria-hidden style={{
            position: "absolute", top: -70, right: -70, width: 200, height: 200, borderRadius: "50%",
            background: "radial-gradient(circle, rgba(110,15,45,0.05) 0%, rgba(110,15,45,0) 70%)",
            pointerEvents: "none",
          }} />
          <div style={{
            background: `linear-gradient(100deg, ${T.deepWine} 0%, ${T.royalBurgundy} 100%)`,
            padding: "18px 24px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <div style={{
                width: 38, height: 38, borderRadius: 10,
                background: "rgba(255,255,255,0.12)",
                display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
              }}>
                <ArrowLeftRight size={20} color="#FFFDF9" />
              </div>
              <div>
                <div style={{ fontFamily: F.display, fontWeight: 700, fontSize: 17, color: "#FFFDF9", letterSpacing: "-0.1px", lineHeight: 1.25 }}>
                  Stock Coming In vs Going Out
                </div>
                <div style={{ fontFamily: F.ui, fontSize: 12, color: "rgba(255,253,249,0.65)", marginTop: 3 }}>
                  How much material was received from vendors vs given out to weavers each week
                </div>
              </div>
            </div>
          </div>

          <div style={{ padding: "24px 28px 28px", display: "flex", flexDirection: isMobile ? "column" : "row", gap: 32, alignItems: "stretch" }}>
            <div style={{ flex: "0 0 58%", display: "flex", flexDirection: "column" }}>
              {(() => {
                const maxVal = Math.max(1, ...stats.chartData.flatMap(d => [d.received, d.given]));
                return (
                  <div style={{ flex: 1, display: "flex", alignItems: "flex-end", gap: 10, minHeight: 220 }}>
                    {stats.chartData.map(d => (
                      <div key={d.label} style={{ flex: 1, height: "100%", display: "flex", flexDirection: "column", alignItems: "center", gap: 0 }}>
                        <div style={{ flex: 1, display: "flex", alignItems: "flex-end", gap: 8, width: "100%", justifyContent: "center" }}>
                          <div style={{ width: 24, height: "100%", background: "transparent", borderRadius: 100, display: "flex", flexDirection: "column", justifyContent: "flex-end" }}>
                            <motion.div initial={{ scaleY: 0 }} whileInView={{ scaleY: 1 }} viewport={{ once: true }} transition={{ duration: 0.65, ease: EASE }} style={{ width: "100%", height: `${Math.max(4, (d.received / maxVal) * 100)}%`, background: T.royalBurgundy, borderRadius: 100, minHeight: 12, transformOrigin: "bottom" }} />
                          </div>
                          <div style={{ width: 24, height: "100%", background: "transparent", borderRadius: 100, display: "flex", flexDirection: "column", justifyContent: "flex-end" }}>
                            <motion.div initial={{ scaleY: 0 }} whileInView={{ scaleY: 1 }} viewport={{ once: true }} transition={{ duration: 0.65, delay: 0.1, ease: EASE }} style={{ width: "100%", height: `${Math.max(4, (d.given / maxVal) * 100)}%`, background: T.antiqueGold, borderRadius: 100, minHeight: 12, transformOrigin: "bottom" }} />
                          </div>
                        </div>
                        <span style={{ fontFamily: F.ui, fontSize: 12, color: T.taupe, textAlign: "center", lineHeight: 1.35, marginTop: 12, flexShrink: 0, fontWeight: 500 }}>{d.label}</span>
                      </div>
                    ))}
                  </div>
                );
              })()}
              <div style={{ display: "flex", gap: 24, marginTop: 20, flexShrink: 0 }}>
                {[["Received from Vendor", T.royalBurgundy], ["Given to Weavers", T.antiqueGold]].map(([label, color]) => (
                  <div key={label} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <div style={{ width: 13, height: 13, borderRadius: 4, background: color, flexShrink: 0 }} />
                    <span style={{ fontFamily: F.ui, fontSize: 13, color: T.taupe }}>{label}</span>
                  </div>
                ))}
              </div>
            </div>

            <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 14 }}>
              {[
                { label: "Total received from vendors", value: `${stats.receivedKg} kg`, sub: "Across all deliveries in this period",  color: T.royalBurgundy, bg: "rgba(110,15,45,0.05)",  border: "rgba(110,15,45,0.14)"  },
                { label: "Total given to weavers",      value: `${stats.issuedKg} kg`, sub: "Across all issue slips in this period", color: T.antiqueGold,   bg: "rgba(200,155,71,0.06)", border: "rgba(200,155,71,0.20)" },
                { label: "Currently still in factory",  value: `${stats.inFactoryKg} kg`, sub: "Net stock remaining in the store",      color: T.green,         bg: "rgba(30,102,64,0.06)",  border: "rgba(30,102,64,0.20)"  },
              ].map(row => (
                <div key={row.label} style={{ flex: 1, background: row.bg, border: `1px solid ${row.border}`, borderRadius: 14, padding: "22px 22px", display: "flex", flexDirection: "column", justifyContent: "center" }}>
                  <div style={{ fontFamily: F.ui, fontWeight: 500, fontSize: 14, color: T.taupe, marginBottom: 8 }}>{row.label}</div>
                  <div style={{ fontFamily: F.ui, fontWeight: 600, fontSize: 30, letterSpacing: "-0.02em", color: row.color, lineHeight: 1.1, marginBottom: 6, fontVariantNumeric: "tabular-nums" }}>{row.value}</div>
                  <div style={{ fontFamily: F.ui, fontSize: 13, color: T.taupe }}>{row.sub}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </FadeUp>

      <FadeUp delay={0.1}>
        <div style={{ background: "#FFFFFF", borderRadius: 16, border: `1.5px solid ${T.royalBurgundy}`, boxShadow: "0 1px 2px rgba(74,6,27,0.03), 0 6px 18px rgba(74,6,27,0.05)", overflow: "hidden", marginBottom: 28, position: "relative" }}>
          <span aria-hidden style={{
            position: "absolute", top: -70, right: -70, width: 200, height: 200, borderRadius: "50%",
            background: "radial-gradient(circle, rgba(110,15,45,0.05) 0%, rgba(110,15,45,0) 70%)",
            pointerEvents: "none",
          }} />
          <div style={{
            background: `linear-gradient(100deg, ${T.deepWine} 0%, ${T.royalBurgundy} 100%)`,
            padding: "18px 24px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <div style={{
                width: 38, height: 38, borderRadius: 10,
                background: "rgba(255,255,255,0.12)",
                display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
              }}>
                <ArrowLeftRight size={20} color="#FFFDF9" />
              </div>
              <div>
                <div style={{ fontFamily: F.display, fontWeight: 700, fontSize: 17, color: "#FFFDF9", letterSpacing: "-0.1px", lineHeight: 1.25 }}>
                  Every Movement Entry
                </div>
                <div style={{ fontFamily: F.ui, fontSize: 12, color: "rgba(255,253,249,0.65)", marginTop: 3 }}>
                  Each line below is one movement — material arriving or leaving the factory store.
                </div>
              </div>
            </div>
          </div>

          <div style={{ padding: "0 0 12px", display: "flex", flexDirection: "column" }}>
            {movementLoading ? (
              <div style={{ padding: 24 }}><LoadingState variant="skeleton" rows={4} /></div>
            ) : movementError ? (
              <ErrorState error={undefined} onRetry={refetchMovement} />
            ) : stats.entries.length === 0 ? (
              <div style={{ padding: "28px", textAlign: "center", fontFamily: F.ui, fontSize: 14, color: T.taupe }}>
                No material movement entries recorded yet.
              </div>
            ) : (
              <div id="every-movement-table">
                {/* Table Header */}
                <div className="hidden sm:grid grid-cols-12 gap-4 px-6 py-3.5 border-b border-[rgba(110,15,45,0.10)] bg-[#FAF8F5]" style={{ fontFamily: F.ui, fontSize: 11, fontWeight: 700, color: T.taupe, letterSpacing: "0.5px", textTransform: "uppercase" }}>
                  <div className="col-span-3">Movement & Date</div>
                  <div className="col-span-3">Vendor / Recipient</div>
                  <div className="col-span-3">Items & Quantity</div>
                  <div className="col-span-2 text-right">Reference Code</div>
                  <div className="col-span-1 text-center">Action</div>
                </div>

                {/* Table Rows */}
                {pag.pageItems.map((entry, i) => {
                  const parts = entry.desc.split(" — ");
                  const party = parts[0] || entry.desc;
                  const items = parts[1] || "";
                  const isIn = entry.type === "in";

                  return (
                    <motion.div
                      key={entry.ref}
                      initial={{ opacity: 0, y: 4 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true }}
                      transition={{ duration: 0.25, delay: i * 0.02, ease: EASE }}
                      className="grid grid-cols-1 sm:grid-cols-12 gap-3 sm:gap-4 px-6 py-3.5 border-b border-[rgba(110,15,45,0.06)] items-center transition-colors hover:bg-[#FDFBF7]"
                      style={{ background: i % 2 === 0 ? "#FFFFFF" : "rgba(250,248,245,0.4)" }}
                    >
                      {/* Movement & Date */}
                      <div className="sm:col-span-3 flex items-center justify-between sm:justify-start gap-3">
                        <div style={{
                          display: "inline-flex", alignItems: "center", gap: 5,
                          padding: "4px 10px", borderRadius: 20,
                          background: isIn ? "rgba(24,78,52,0.08)" : "rgba(110,15,45,0.08)",
                          border: `1px solid ${isIn ? "rgba(24,78,52,0.20)" : "rgba(110,15,45,0.18)"}`,
                          color: isIn ? T.green : T.royalBurgundy,
                          fontFamily: F.ui, fontSize: 11, fontWeight: 700, letterSpacing: "0.4px",
                          flexShrink: 0,
                        }}>
                          {isIn ? <ArrowDownLeft size={13} color={T.green} /> : <ArrowUpRight size={13} color={T.royalBurgundy} />}
                          <span>{isIn ? "RECEIVED" : "GIVEN"}</span>
                        </div>
                        <span style={{ fontFamily: F.ui, fontSize: 12, color: T.taupe, fontWeight: 500 }}>{entry.time}</span>
                      </div>

                      {/* Party */}
                      <div className="sm:col-span-3">
                        <div style={{ fontFamily: F.ui, fontWeight: 600, fontSize: 14, color: T.luxuryBrown }}>{party}</div>
                      </div>

                      {/* Items */}
                      <div className="sm:col-span-3">
                        <div style={{ fontFamily: F.ui, fontSize: 13, color: T.taupe, lineHeight: 1.4 }}>
                          {items || "—"}
                        </div>
                      </div>

                      {/* Reference Code & Action */}
                      <div className="sm:col-span-3 flex items-center justify-between sm:justify-end gap-3 pt-2 sm:pt-0 border-t sm:border-t-0 border-[rgba(110,15,45,0.06)]">
                        <EntityCode type="goodsReceipt" value={entry.ref} size="sm" />
                        {entry.type === "out" ? (
                          <IconButton
                            onClick={() => setDeletingRef(entry.ref)}
                            icon={Trash2}
                            label="Delete material issue"
                            variant="ghost"
                            size="sm"
                            className="w-8 h-8 shrink-0 text-[#C0392B] hover:bg-[#C0392B]/10 rounded-lg transition-colors"
                          />
                        ) : null}
                      </div>
                    </motion.div>
                  );
                })}
                <Pagination
                  targetId="every-movement-table"
                  page={pag.page}
                  pageCount={pag.pageCount}
                  total={pag.total}
                  pageSize={pag.pageSize}
                  start={pag.start}
                  onPageChange={pag.setPage}
                  onPageSizeChange={pag.setPageSize}
                  itemLabel="entries"
                />
              </div>
            )}
          </div>
        </div>
      </FadeUp>
    </SectionCard>

      <AnimatePresence>
        {deletingRef && (
          <ConfirmDialog
            title={`Delete ${deletingRef}?`}
            message="This permanently deletes the material-issue record and restores the deducted quantity back to stock. This can't be undone."
            confirmLabel="Delete Permanently"
            loading={deleting}
            error={deleteError}
            onConfirm={() => void confirmDelete()}
            onCancel={cancelDelete}
          />
        )}
      </AnimatePresence>
    </section>
  );
}
