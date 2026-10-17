import { useState } from "react";

import { motion, AnimatePresence } from "motion/react";

import {
  Calendar,
  AlertTriangle,
  Download,
  Package,
  Scissors,
  Boxes,
  Users,
  Store,
  BarChart3,
  UsersRound,
  BellRing,
  Wallet,
  ChevronDown,
  Info,
} from "lucide-react";

import { DownloadGate } from "../../../../shared/ui/DownloadAccess";

import { T, F } from "../theme";
import { Button, Select, SelectItem, Switch } from "../../../../shared/ui/primitives";
import type { ReportTab } from "../types";
import {
  COMPARE_MODES,
  PERIODS,
  toISODate,
  type CompareMode,
  type CustomDates,
  type PeriodKey,
} from "../period";
import { useReportPeriod } from "../PeriodContext";
import { Chip } from "../common/compare";
import { DatePicker } from "../../../../shared/ui/date";

/** "2026-10-17" as a local calendar date — `new Date(iso)` would read it as UTC midnight. */
function parseISODate(iso: string): Date {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y!, (m ?? 1) - 1, d ?? 1);
}

function customRangeHint(c: CustomDates): string | null {
  if (!c.from || !c.to) return "Pick both dates — showing all time until then.";
  if (c.to < c.from) return "The end date is before the start date — showing all time.";
  return null;
}

export const REPORT_TABS: ReportTab[] = [
  {
    key: "raw-material",
    Icon: Package,
    label: "Raw Material",
    desc: "Stock & flow",
    iconColor: "#FFFDF9",
    iconBg: "rgba(224,82,82,0.20)",
  },
  {
    key: "production",
    Icon: Scissors,
    label: "Saree Production",
    desc: "Output & batches",
    iconColor: "#FFFDF9",
    iconBg: "rgba(224,82,82,0.20)",
  },
  {
    key: "outstanding",
    Icon: Boxes,
    label: "Outstanding Stock",
    desc: "Unsold by source",
    iconColor: "#FFFDF9",
    iconBg: "rgba(224,82,82,0.20)",
  },
  {
    key: "outstanding-payments",
    Icon: Wallet,
    label: "Outstanding Payments",
    desc: "Unpaid invoices & orders",
    iconColor: "#FFFDF9",
    iconBg: "rgba(224,82,82,0.20)",
  },
  {
    key: "weaver-payment",
    Icon: Users,
    label: "Weaver Payments",
    desc: "Making charges",
    iconColor: "#FFFDF9",
    iconBg: "rgba(224,82,82,0.20)",
  },
  {
    key: "retail",
    Icon: Store,
    label: "Retail Sales",
    desc: "Walk-in & direct",
    iconColor: "#FFFDF9",
    iconBg: "rgba(224,82,82,0.20)",
  },
  {
    key: "wholesale",
    Icon: Boxes,
    label: "Wholesale Sales",
    desc: "Bulk & exports",
    iconColor: "#FFFDF9",
    iconBg: "rgba(224,82,82,0.20)",
  },
  {
    key: "pnl",
    Icon: BarChart3,
    label: "Profit & Loss",
    desc: "Net income",
    iconColor: "#FFFDF9",
    iconBg: "rgba(224,82,82,0.20)",
  },
  {
    key: "customers",
    Icon: UsersRound,
    label: "Customers",
    desc: "Collections & dues",
    iconColor: "#FFFDF9",
    iconBg: "rgba(224,82,82,0.20)",
  },
  {
    key: "overdue",
    Icon: BellRing,
    label: "Overdue & Alerts",
    desc: "Pending actions",
    iconColor: "#FFFDF9",
    iconBg: "rgba(224,82,82,0.20)",
  },
];

export function ReportTabNav() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const {
    activeTab,
    setActiveTab,
    isLiveTab,
    period: activePeriod,
    setPeriod: setActivePeriod,
    custom,
    setCustom,
    compareOn,
    setCompareOn,
    compareMode,
    setCompareMode,
    compareActive,
    compareBlockedReason,
    compareLabel,
    priorLabel,
    label: periodLabel,
    partial,
    exportExcel,
    canExport,
    exportHint,
  } = useReportPeriod();
  const activeReportTab = REPORT_TABS.find((t) => t.key === activeTab) ?? REPORT_TABS[0]!;

  return (
    <div style={{ position: "relative", zIndex: 10 }}>
      {/* ── Category Tab Strip Container (Aligned with page margins) ── */}
      <div className="px-4 md:px-7 xl:px-14" style={{ marginTop: 24, marginBottom: 16 }}>
        {/* ── Mobile: current-report picker — replaces the tab strip below `xl` ── */}
        <div
          className="xl:hidden"
          style={{
            background: "linear-gradient(135deg, #2C0913 0%, #5D1027 60%, #3D0E1A 100%)",
            padding: "12px 16px",
            borderRadius: 16,
            border: "1px solid rgba(200,155,71,0.25)",
            boxShadow: "0 4px 20px rgba(0,0,0,0.18)",
            position: "relative",
            zIndex: 50,
          }}
        >
          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            style={{
              width: "100%",
              display: "flex",
              alignItems: "center",
              gap: 12,
              background: "rgba(245,232,208,0.07)",
              border: "1px solid rgba(200,155,71,0.30)",
              borderRadius: 14,
              padding: "10px 14px",
              cursor: "pointer",
            }}
          >
            <div
              style={{
                width: 40,
                height: 40,
                borderRadius: 12,
                flexShrink: 0,
                background: activeReportTab.iconBg,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <activeReportTab.Icon size={20} color={activeReportTab.iconColor} />
            </div>
            <div style={{ flex: 1, minWidth: 0, textAlign: "left" as const }}>
              <div
                style={{
                  fontFamily: "var(--font-mono)",
                  fontSize: 11,
                  fontWeight: 600,
                  color: "rgba(200,155,71,0.85)",
                  letterSpacing: "0.8px",
                  textTransform: "uppercase" as const,
                  marginBottom: 1,
                }}
              >
                Select Report Category
              </div>
              <div style={{ fontFamily: F.ui, fontSize: 15, fontWeight: 700, color: "#FFFDF9" }}>
                {activeReportTab.label}
              </div>
            </div>
            <ChevronDown
              size={18}
              color="rgba(245,232,208,0.60)"
              style={{
                transform: mobileMenuOpen ? "rotate(180deg)" : "none",
                transition: "transform 0.2s",
              }}
            />
          </button>

          <AnimatePresence>
            {mobileMenuOpen && (
              <>
                {/* Backdrop */}
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  onClick={() => setMobileMenuOpen(false)}
                  style={{
                    position: "fixed",
                    inset: 0,
                    background: "rgba(0,0,0,0.5)",
                    zIndex: 9998,
                    backdropFilter: "blur(2px)",
                  }}
                />

                {/* Mobile Dropdown Panel */}
                <motion.div
                  initial={{ opacity: 0, y: -10, scale: 0.98 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -10, scale: 0.98 }}
                  transition={{ duration: 0.18 }}
                  style={{
                    position: "absolute",
                    top: "calc(100% + 6px)",
                    left: 16,
                    right: 16,
                    maxHeight: "75vh",
                    overflowY: "auto",
                    background: "#FFFDF9",
                    border: "1px solid rgba(110,15,45,0.20)",
                    borderRadius: 18,
                    boxShadow: "0 20px 50px rgba(0,0,0,0.35)",
                    zIndex: 9999,
                    padding: 8,
                  }}
                >
                  <div
                    style={{
                      fontFamily: "var(--font-mono)",
                      fontSize: 11,
                      fontWeight: 700,
                      color: T.taupe,
                      letterSpacing: "1px",
                      textTransform: "uppercase",
                      padding: "8px 12px 6px",
                      borderBottom: `1px solid ${T.borderDef}`,
                      marginBottom: 6,
                    }}
                  >
                    All 10 Report Categories
                  </div>
                  {REPORT_TABS.map((tab) => {
                    const active = tab.key === activeTab;
                    return (
                      <button
                        key={tab.key}
                        type="button"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          setActiveTab(tab.key);
                          setMobileMenuOpen(false);
                        }}
                        style={{
                          width: "100%",
                          display: "flex",
                          alignItems: "center",
                          gap: 12,
                          padding: "10px 12px",
                          borderRadius: 12,
                          border: "none",
                          background: active ? "rgba(110,15,45,0.09)" : "transparent",
                          cursor: "pointer",
                          textAlign: "left",
                          marginBottom: 2,
                        }}
                      >
                        <div
                          style={{
                            width: 36,
                            height: 36,
                            borderRadius: 10,
                            flexShrink: 0,
                            background: active ? tab.iconBg : "rgba(110,15,45,0.06)",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                          }}
                        >
                          <tab.Icon size={18} color="#6E0F2D" />
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div
                            style={{
                              fontFamily: F.ui,
                              fontSize: 14,
                              fontWeight: active ? 700 : 600,
                              color: active ? "#6E0F2D" : "#3B2314",
                            }}
                          >
                            {tab.label}
                          </div>
                          <div style={{ fontFamily: F.ui, fontSize: 12, color: T.taupe }}>
                            {tab.desc}
                          </div>
                        </div>
                        {active && (
                          <div
                            style={{
                              width: 8,
                              height: 8,
                              borderRadius: "50%",
                              background: T.royalBurgundy,
                              flexShrink: 0,
                            }}
                          />
                        )}
                      </button>
                    );
                  })}
                </motion.div>
              </>
            )}
          </AnimatePresence>
        </div>

        {/* ── Desktop/tablet: Tab strip — dark gradient card ─────────────────────── */}
        <div
          className="hidden xl:flex overflow-x-auto section-nav-scroll gap-3"
          style={{
            background: "linear-gradient(135deg, #2C0913 0%, #5D1027 60%, #3D0E1A 100%)",
            borderRadius: 18,
            border: "1px solid rgba(200,155,71,0.25)",
            boxShadow: "0 6px 30px rgba(0,0,0,0.22)",
            padding: "0 16px",
            alignItems: "stretch",
            scrollbarWidth: "thin",
            scrollbarColor: "rgba(200,155,71,0.30) transparent",
          }}
        >
          {REPORT_TABS.map((tab) => {
            const active = activeTab === tab.key;
            return (
              <Button
                key={tab.key}
                variant={active ? "tertiary" : "ghost"}
                onClick={() => setActiveTab(tab.key)}
                className={`min-w-[175px] shrink-0 h-[120px] flex-col justify-center gap-[11px] rounded-none px-4 border-0 border-b-[3px] ${
                  active
                    ? "border-[var(--bk-gold-500)] bg-[rgba(200,155,71,0.12)] hover:bg-[rgba(200,155,71,0.18)] active:bg-[rgba(200,155,71,0.25)]"
                    : "border-transparent bg-transparent hover:bg-[rgba(200,155,71,0.10)] active:bg-[rgba(200,155,71,0.20)]"
                }`}
              >
                {/* Icon box */}
                <div
                  style={{
                    width: 50,
                    height: 50,
                    borderRadius: 14,
                    flexShrink: 0,
                    background: active ? tab.iconBg : "rgba(245,232,208,0.07)",
                    border: `1px solid ${active ? "rgba(200,155,71,0.30)" : "rgba(245,232,208,0.08)"}`,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    transition: "all 0.2s",
                  }}
                >
                  <tab.Icon size={24} color={active ? tab.iconColor : "rgba(245,232,208,0.40)"} />
                </div>
                {/* Label */}
                <div style={{ textAlign: "center" as const, lineHeight: 1.3 }}>
                  <div
                    style={{
                      fontFamily: F.ui,
                      fontSize: 15,
                      fontWeight: active ? 700 : 600,
                      color: active ? "#FFFDF9" : "rgba(245,232,208,0.52)",
                      whiteSpace: "nowrap" as const,
                      letterSpacing: "0.1px",
                      transition: "color 0.2s",
                    }}
                  >
                    {tab.label}
                  </div>
                  <div
                    style={{
                      fontFamily: "var(--font-mono)",
                      fontSize: 11,
                      color: active ? "rgba(200,155,71,0.82)" : "rgba(245,232,208,0.28)",
                      letterSpacing: "0.3px",
                      marginTop: 2,
                      transition: "color 0.2s",
                    }}
                  >
                    {tab.desc}
                  </div>
                </div>
                {/* Active gold underline pill */}
                {active && (
                  <div
                    style={{
                      position: "absolute",
                      bottom: 0,
                      left: "50%",
                      transform: "translateX(-50%)",
                      width: 48,
                      height: 3,
                      background: `linear-gradient(90deg, ${T.antiqueGold}, ${T.goldLight})`,
                      borderRadius: "3px 3px 0 0",
                    }}
                  />
                )}
              </Button>
            );
          })}
        </div>
      </div>

      {/* ── Filter bar — ivory card (Aligned with page margins) ─────────────────── */}
      <div className="px-4 md:px-7 xl:px-14" style={{ marginBottom: 24 }}>
        <div
          id="report-filter-bar"
          className="flex flex-col lg:flex-row lg:items-center gap-4"
          style={{
            background: "#FFFFFF",
            borderRadius: 16,
            border: `1px solid ${T.borderDef}`,
            boxShadow: "0 2px 14px rgba(74,6,27,0.05)",
            padding: "14px 20px",
            scrollMarginTop: 140,
          }}
        >
          {/* Period dropdown + custom dates */}
          <div className="flex flex-wrap items-center gap-2.5 min-w-0">
            <div
              style={{
                width: 36,
                height: 36,
                borderRadius: 9,
                background: "rgba(200,155,71,0.12)",
                border: `1px solid ${T.borderGold}`,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
              }}
            >
              <Calendar size={18} color={T.antiqueGold} />
            </div>
            <span
              id="report-period-label"
              style={{
                fontFamily: F.ui,
                fontSize: 14,
                fontWeight: 700,
                color: T.luxuryBrown,
                whiteSpace: "nowrap" as const,
              }}
            >
              Period:
            </span>
            <Select
              size="sm"
              value={activePeriod}
              onValueChange={(v) => setActivePeriod(v as PeriodKey)}
              disabled={isLiveTab}
              aria-labelledby="report-period-label"
              containerClassName="w-auto shrink-0"
              className="w-[150px] font-semibold text-[13px] rounded-[10px] bg-white border-[rgba(110,15,45,0.18)] shadow-xs"
            >
              {PERIODS.map((p) => (
                <SelectItem key={p} value={p}>
                  {p}
                </SelectItem>
              ))}
            </Select>

            {activePeriod === "Custom Dates" && !isLiveTab && (
              <div className="flex flex-wrap items-center gap-2">
                <DatePicker
                  placeholder="Start date"
                  value={custom.from ? parseISODate(custom.from) : null}
                  onChange={(d) => setCustom({ ...custom, from: d ? toISODate(d) : undefined })}
                />
                <span style={{ fontFamily: F.ui, fontSize: 13, color: T.taupe }}>to</span>
                <DatePicker
                  placeholder="End date"
                  value={custom.to ? parseISODate(custom.to) : null}
                  onChange={(d) => setCustom({ ...custom, to: d ? toISODate(d) : undefined })}
                />
                {customRangeHint(custom) && (
                  <span
                    style={{
                      fontFamily: F.ui,
                      fontSize: 12,
                      fontStyle: "italic",
                      color: T.antiqueGold,
                    }}
                  >
                    {customRangeHint(custom)}
                  </span>
                )}
              </div>
            )}

            {!isLiveTab && activePeriod !== "Custom Dates" && activePeriod !== "All Time" && (
              <span style={{ fontFamily: F.ui, fontSize: 13, color: T.taupe }}>{periodLabel}</span>
            )}

            {isLiveTab && (
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <AlertTriangle size={15} color={T.antiqueGold} />
                <span
                  style={{
                    fontFamily: F.ui,
                    fontSize: 13,
                    color: "#8B6018",
                    fontStyle: "italic",
                  }}
                >
                  Live status — the period and comparison don&apos;t apply to this report.
                </span>
              </div>
            )}
          </div>

          {/* Spacer */}
          <div className="hidden lg:block" style={{ flex: 1 }} />

          {/* Compare period */}
          <div
            className="flex flex-wrap items-center gap-2.5 pt-3 lg:pt-0 border-t lg:border-t-0"
            style={{ borderColor: T.borderDef }}
          >
            <Switch
              id="report-compare-switch"
              checked={compareOn && !isLiveTab}
              onCheckedChange={setCompareOn}
              disabled={isLiveTab}
              aria-describedby="report-compare-status"
            />
            <label
              htmlFor="report-compare-switch"
              style={{
                fontFamily: F.ui,
                fontSize: 14,
                fontWeight: 600,
                color: isLiveTab ? T.taupe : T.luxuryBrown,
                whiteSpace: "nowrap" as const,
                cursor: isLiveTab ? "not-allowed" : "pointer",
              }}
            >
              Compare
            </label>
            {compareOn && !isLiveTab && (
              <Select
                size="sm"
                value={compareMode}
                onValueChange={(v) => setCompareMode(v as CompareMode)}
                aria-label="Compare with"
                containerClassName="w-auto shrink-0"
                className="w-[190px] font-semibold text-[13px] rounded-[10px] bg-white border-[rgba(110,15,45,0.18)] shadow-xs"
              >
                {COMPARE_MODES.map((m) => (
                  <SelectItem key={m.key} value={m.key}>
                    vs {m.label.toLowerCase()}
                  </SelectItem>
                ))}
              </Select>
            )}
            <span id="report-compare-status" className="flex flex-wrap items-center gap-1.5">
              {compareActive ? (
                <>
                  <Chip tone="current">{compareLabel ?? periodLabel}</Chip>
                  <span style={{ fontFamily: F.ui, fontSize: 13, color: T.taupe }}>vs</span>
                  <Chip tone="prior">{priorLabel}</Chip>
                  {partial && (
                    <span
                      title="The current period isn't over yet, so both sides cover the same number of days."
                      style={{ display: "inline-flex", color: T.taupe, cursor: "help" }}
                    >
                      <Info
                        size={14}
                        aria-label="Like-for-like: same number of days on both sides"
                      />
                    </span>
                  )}
                </>
              ) : compareBlockedReason ? (
                <span
                  style={{ fontFamily: F.ui, fontSize: 12, fontStyle: "italic", color: "#8B6018" }}
                >
                  {compareBlockedReason}
                </span>
              ) : !isLiveTab ? (
                <span style={{ fontFamily: F.ui, fontSize: 12, color: T.taupe }}>
                  See every figure against the previous period
                </span>
              ) : null}
            </span>
          </div>

          <DownloadGate>
            {/* Divider */}
            <div
              className="hidden lg:block"
              style={{ width: 1, height: 32, background: T.borderDef, flexShrink: 0 }}
            />

            {/* Download button */}
            <div className="flex shrink-0" title={exportHint}>
              <Button
                variant="primary"
                iconLeft={Download}
                onClick={exportExcel}
                disabled={!canExport}
                aria-label={exportHint}
                className="w-full lg:w-auto"
              >
                Download Excel
              </Button>
            </div>
          </DownloadGate>
        </div>
      </div>
    </div>
  );
}
