import React, { useState } from "react";

import { motion, AnimatePresence } from "motion/react";

import { Calendar, AlertTriangle, FileText, Download, Package, Scissors, Boxes, Users, Store, BarChart3, UsersRound, BellRing, Wallet, ChevronDown } from "lucide-react";

import { DownloadGate } from "../../../../shared/ui/DownloadAccess";

import { T, F } from "../theme";
import { Button, Select, SelectItem } from "../../../../shared/ui/primitives";
import type { ReportTabKey, ReportTab } from "../types";

const REPORT_TABS: ReportTab[] = [
  { key: "raw-material",   Icon: Package,       label: "Raw Material",     desc: "Stock & flow",      iconColor: "#FFFDF9",        iconBg: "rgba(224,82,82,0.20)"  },
  { key: "production",     Icon: Scissors,      label: "Saree Production", desc: "Output & batches",  iconColor: "#FFFDF9",        iconBg: "rgba(224,82,82,0.20)" },
  { key: "outstanding",    Icon: Boxes,         label: "Outstanding Stock", desc: "Unsold by source", iconColor: "#FFFDF9",        iconBg: "rgba(224,82,82,0.20)"  },
  { key: "outstanding-payments", Icon: Wallet,  label: "Outstanding Payments", desc: "Unpaid invoices & orders", iconColor: "#FFFDF9", iconBg: "rgba(224,82,82,0.20)" },
  { key: "weaver-payment", Icon: Users,         label: "Weaver Payments",  desc: "Making charges",    iconColor: "#FFFDF9",        iconBg: "rgba(224,82,82,0.20)"   },
  { key: "retail",         Icon: Store,         label: "Retail Sales",     desc: "Walk-in & direct",  iconColor: "#FFFDF9",        iconBg: "rgba(224,82,82,0.20)"  },
  { key: "wholesale",      Icon: Boxes,         label: "Wholesale Sales",  desc: "Bulk & exports",    iconColor: "#FFFDF9",        iconBg: "rgba(224,82,82,0.20)"  },
  { key: "pnl",            Icon: BarChart3,     label: "Profit & Loss",    desc: "Net income",        iconColor: "#FFFDF9",        iconBg: "rgba(224,82,82,0.20)"   },
  { key: "customers",      Icon: UsersRound,    label: "Customers",        desc: "Collections & dues",iconColor: "#FFFDF9",        iconBg: "rgba(224,82,82,0.20)"  },
  { key: "overdue",        Icon: BellRing,      label: "Overdue & Alerts", desc: "Pending actions",   iconColor: "#FFFDF9",        iconBg: "rgba(224,82,82,0.20)"   },
];

const PERIODS = ["Today", "This Week", "This Month", "This Quarter", "This Year", "Custom Dates"];

export function ReportTabNav({ activeTab, setActiveTab, activePeriod, setActivePeriod, compareOn, setCompareOn }: {
  activeTab: ReportTabKey; setActiveTab: (k: ReportTabKey) => void;
  activePeriod: string; setActivePeriod: (p: string) => void;
  compareOn: boolean; setCompareOn: (v: boolean) => void;
}) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const activeReportTab = REPORT_TABS.find(t => t.key === activeTab) ?? REPORT_TABS[0];

  return (
    <div style={{ position: "relative", zIndex: 10 }}>

      {/* ── Category Tab Strip Container (Aligned with page margins) ── */}
      <div className="px-4 md:px-7 xl:px-14" style={{ marginTop: 24, marginBottom: 16 }}>
        {/* ── Mobile: current-report picker — replaces the tab strip below `xl` ── */}
        <div className="xl:hidden" style={{
          background: "linear-gradient(135deg, #2C0913 0%, #5D1027 60%, #3D0E1A 100%)",
          padding: "12px 16px",
          borderRadius: 16,
          border: "1px solid rgba(200,155,71,0.25)",
          boxShadow: "0 4px 20px rgba(0,0,0,0.18)",
          position: "relative",
          zIndex: 50,
        }}>
          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            style={{
              width: "100%", display: "flex", alignItems: "center", gap: 12,
              background: "rgba(245,232,208,0.07)", border: "1px solid rgba(200,155,71,0.30)",
              borderRadius: 14, padding: "10px 14px", cursor: "pointer",
            }}
          >
            <div style={{
              width: 40, height: 40, borderRadius: 12, flexShrink: 0,
              background: activeReportTab.iconBg,
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              <activeReportTab.Icon size={20} color={activeReportTab.iconColor} />
            </div>
            <div style={{ flex: 1, minWidth: 0, textAlign: "left" as const }}>
              <div style={{ fontFamily: "var(--font-mono)", fontSize: 11, fontWeight: 600, color: "rgba(200,155,71,0.85)", letterSpacing: "0.8px", textTransform: "uppercase" as const, marginBottom: 1 }}>
                Select Report Category
              </div>
              <div style={{ fontFamily: F.ui, fontSize: 15, fontWeight: 700, color: "#FFFDF9" }}>{activeReportTab.label}</div>
            </div>
            <ChevronDown size={18} color="rgba(245,232,208,0.60)" style={{ transform: mobileMenuOpen ? "rotate(180deg)" : "none", transition: "transform 0.2s" }} />
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
                    position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)",
                    zIndex: 9998, backdropFilter: "blur(2px)",
                  }}
                />

                {/* Mobile Dropdown Panel */}
                <motion.div
                  initial={{ opacity: 0, y: -10, scale: 0.98 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -10, scale: 0.98 }}
                  transition={{ duration: 0.18 }}
                  style={{
                    position: "absolute", top: "calc(100% + 6px)", left: 16, right: 16,
                    maxHeight: "75vh", overflowY: "auto",
                    background: "#FFFDF9", border: "1px solid rgba(110,15,45,0.20)",
                    borderRadius: 18, boxShadow: "0 20px 50px rgba(0,0,0,0.35)",
                    zIndex: 9999, padding: 8,
                  }}
                >
                  <div style={{ fontFamily: "var(--font-mono)", fontSize: 11, fontWeight: 700, color: T.taupe, letterSpacing: "1px", textTransform: "uppercase", padding: "8px 12px 6px", borderBottom: `1px solid ${T.borderDef}`, marginBottom: 6 }}>
                    All 10 Report Categories
                  </div>
                  {REPORT_TABS.map(tab => {
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
                          width: "100%", display: "flex", alignItems: "center", gap: 12,
                          padding: "10px 12px", borderRadius: 12, border: "none",
                          background: active ? "rgba(110,15,45,0.09)" : "transparent",
                          cursor: "pointer", textAlign: "left", marginBottom: 2,
                        }}
                      >
                        <div style={{
                          width: 36, height: 36, borderRadius: 10, flexShrink: 0,
                          background: active ? tab.iconBg : "rgba(110,15,45,0.06)",
                          display: "flex", alignItems: "center", justifyContent: "center",
                        }}>
                          <tab.Icon size={18} color="#6E0F2D" />
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontFamily: F.ui, fontSize: 14, fontWeight: active ? 700 : 600, color: active ? "#6E0F2D" : "#3B2314" }}>
                            {tab.label}
                          </div>
                          <div style={{ fontFamily: F.ui, fontSize: 12, color: T.taupe }}>
                            {tab.desc}
                          </div>
                        </div>
                        {active && (
                          <div style={{ width: 8, height: 8, borderRadius: "50%", background: T.royalBurgundy, flexShrink: 0 }} />
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
        <div className="hidden xl:flex overflow-x-auto section-nav-scroll gap-3" style={{
          background: "linear-gradient(135deg, #2C0913 0%, #5D1027 60%, #3D0E1A 100%)",
          borderRadius: 18,
          border: "1px solid rgba(200,155,71,0.25)",
          boxShadow: "0 6px 30px rgba(0,0,0,0.22)",
          padding: "0 16px",
          alignItems: "stretch",
          scrollbarWidth: "thin",
          scrollbarColor: "rgba(200,155,71,0.30) transparent",
        }}>
          {REPORT_TABS.map(tab => {
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
                <div style={{
                  width: 50, height: 50, borderRadius: 14, flexShrink: 0,
                  background: active ? tab.iconBg : "rgba(245,232,208,0.07)",
                  border: `1px solid ${active ? "rgba(200,155,71,0.30)" : "rgba(245,232,208,0.08)"}`,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  transition: "all 0.2s",
                }}>
                  <tab.Icon
                    size={24}
                    color={active ? tab.iconColor : "rgba(245,232,208,0.40)"}
                  />
                </div>
                {/* Label */}
                <div style={{ textAlign: "center" as const, lineHeight: 1.3 }}>
                  <div style={{
                    fontFamily: F.ui,
                    fontSize: 15,
                    fontWeight: active ? 700 : 600,
                    color: active ? "#FFFDF9" : "rgba(245,232,208,0.52)",
                    whiteSpace: "nowrap" as const,
                    letterSpacing: "0.1px",
                    transition: "color 0.2s",
                  }}>
                    {tab.label}
                  </div>
                  <div style={{
                    fontFamily: "var(--font-mono)",
                    fontSize: 11,
                    color: active ? "rgba(200,155,71,0.82)" : "rgba(245,232,208,0.28)",
                    letterSpacing: "0.3px",
                    marginTop: 2,
                    transition: "color 0.2s",
                  }}>
                    {tab.desc}
                  </div>
                </div>
                {/* Active gold underline pill */}
                {active && (
                  <div style={{
                    position: "absolute", bottom: 0, left: "50%",
                    transform: "translateX(-50%)",
                    width: 48, height: 3,
                    background: `linear-gradient(90deg, ${T.antiqueGold}, ${T.goldLight})`,
                    borderRadius: "3px 3px 0 0",
                  }} />
                )}
              </Button>
            );
          })}
        </div>
      </div>

      {/* ── Filter bar — ivory card (Aligned with page margins) ─────────────────── */}
      <div className="px-4 md:px-7 xl:px-14" style={{ marginBottom: 24 }}>
        <div style={{
          background: "#FFFFFF",
          borderRadius: 16,
          border: `1px solid ${T.borderDef}`,
          boxShadow: "0 2px 14px rgba(74,6,27,0.05)",
          padding: "14px 20px",
          display: "flex",
          alignItems: "center",
          gap: 16,
          flexWrap: "wrap" as const,
        }}>

          {/* Period dropdown */}
          <div style={{ display: "flex", alignItems: "center", gap: 10, flexShrink: 0 }}>
            <div style={{ width: 36, height: 36, borderRadius: 9, background: "rgba(200,155,71,0.12)", border: `1px solid ${T.borderGold}`, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Calendar size={18} color={T.antiqueGold} />
            </div>
            <span style={{ fontFamily: F.ui, fontSize: 14, fontWeight: 700, color: T.luxuryBrown, whiteSpace: "nowrap" as const }}>Period:</span>
            <Select
              size="sm"
              value={activePeriod}
              onValueChange={setActivePeriod}
              disabled={activeTab === "overdue"}
              containerClassName="w-auto shrink-0"
              className="w-[145px] font-semibold text-[13px] rounded-[10px] bg-white border-[rgba(110,15,45,0.18)] shadow-xs"
            >
              {PERIODS.map(p => (
                <SelectItem key={p} value={p}>{p}</SelectItem>
              ))}
            </Select>
          </div>

          {activeTab === "overdue" && (
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <AlertTriangle size={15} color={T.antiqueGold} />
              <span style={{ fontFamily: F.ui, fontSize: 14, color: T.antiqueGold, fontStyle: "italic" }}>Live status — no period filter applies.</span>
            </div>
          )}

          {/* Spacer */}
          <div style={{ flex: 1 }} />

          {/* Compare period toggle */}
          <div style={{ display: "flex", alignItems: "center", gap: 12, flexShrink: 0 }}>
            <span style={{ fontFamily: F.ui, fontSize: 14, fontWeight: 500, color: T.taupe, whiteSpace: "nowrap" as const }}>Compare period</span>
            <div
              onClick={() => setCompareOn(!compareOn)} role="button" tabIndex={0} aria-label="Toggle compare period" onKeyDown={e => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); (() => setCompareOn(!compareOn))?.(); } }}
              style={{ width: 50, height: 28, borderRadius: 14, background: compareOn ? T.royalBurgundy : "rgba(110,15,45,0.12)", cursor: "pointer", position: "relative" as const, transition: "background 0.22s", flexShrink: 0 }}
            >
              <div style={{ position: "absolute", top: 4, left: compareOn ? 26 : 4, width: 20, height: 20, borderRadius: "50%", background: "#fff", transition: "left 0.22s", boxShadow: "0 1px 5px rgba(0,0,0,0.25)" }} />
            </div>
            {compareOn && (
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{ fontFamily: "var(--font-mono)", fontSize: 14, background: "rgba(110,15,45,0.08)", color: T.royalBurgundy, padding: "6px 14px", borderRadius: 99, fontWeight: 600 }}>May 2026</span>
                <span style={{ fontFamily: F.ui, fontSize: 14, color: T.taupe }}>vs</span>
                <span style={{ fontFamily: "var(--font-mono)", fontSize: 14, background: "rgba(200,155,71,0.13)", color: "#8B6018", padding: "6px 14px", borderRadius: 99, fontWeight: 600 }}>April 2026</span>
              </div>
            )}
          </div>

          <DownloadGate>
            {/* Divider */}
            <div style={{ width: 1, height: 32, background: T.borderDef, flexShrink: 0 }} />

            {/* Download buttons */}
            <div style={{ display: "flex", gap: 9, flexShrink: 0 }}>
              <Button variant="secondary" iconLeft={FileText}>
                Download PDF
              </Button>
              <Button variant="primary" iconLeft={Download}>
                Download Excel
              </Button>
            </div>
          </DownloadGate>
        </div>
      </div>
    </div>
  );
}
