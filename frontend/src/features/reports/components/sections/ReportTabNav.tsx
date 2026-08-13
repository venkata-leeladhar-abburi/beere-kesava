import React from "react";
import { Calendar, AlertTriangle, FileText, Download, Package, Scissors, Boxes, Users, Store, BarChart3, UsersRound, BellRing, Wallet, ChevronDown } from "lucide-react";
import { DownloadGate } from "../../../../shared/ui/DownloadAccess";
import { T, F } from "../theme";
import { Button } from "../../../../shared/ui/primitives";
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from "../../../../shared/ui/overlay";
import type { ReportTabKey, ReportTab } from "../types";

const REPORT_TABS: ReportTab[] = [
  { key: "raw-material",   Icon: Package,       label: "Raw Material",     desc: "Stock & flow",      iconColor: "#8B6018",        iconBg: "rgba(200,155,71,0.22)"  },
  { key: "production",     Icon: Scissors,      label: "Saree Production", desc: "Output & batches",  iconColor: "#FFFDF9",        iconBg: "rgba(245,232,208,0.16)" },
  { key: "outstanding",    Icon: Boxes,         label: "Outstanding Stock", desc: "Unsold by source", iconColor: "#E67E22",        iconBg: "rgba(230,126,34,0.20)"  },
  { key: "outstanding-payments", Icon: Wallet,  label: "Outstanding Payments", desc: "Unpaid invoices & orders", iconColor: "#E05252", iconBg: "rgba(224,82,82,0.20)" },
  { key: "weaver-payment", Icon: Users,         label: "Weaver Payments",  desc: "Making charges",    iconColor: "#2D9158",        iconBg: "rgba(45,145,88,0.20)"   },
  { key: "retail",         Icon: Store,         label: "Retail Sales",     desc: "Walk-in & direct",  iconColor: "#4A7FB5",        iconBg: "rgba(74,127,181,0.20)"  },
  { key: "wholesale",      Icon: Boxes,         label: "Wholesale Sales",  desc: "Bulk & exports",    iconColor: "#9B4DCA",        iconBg: "rgba(155,77,202,0.20)"  },
  { key: "pnl",            Icon: BarChart3,     label: "Profit & Loss",    desc: "Net income",        iconColor: "#2D9158",        iconBg: "rgba(45,145,88,0.20)"   },
  { key: "customers",      Icon: UsersRound,    label: "Customers",        desc: "Collections & dues",iconColor: T.antiqueGold,    iconBg: "rgba(200,155,71,0.22)"  },
  { key: "overdue",        Icon: BellRing,      label: "Overdue & Alerts", desc: "Pending actions",   iconColor: "#E05252",        iconBg: "rgba(224,82,82,0.20)"   },
];

const PERIODS = ["Today", "This Week", "This Month", "This Quarter", "This Year", "Custom Dates"];

export function ReportTabNav({ activeTab, setActiveTab, activePeriod, setActivePeriod, compareOn, setCompareOn }: {
  activeTab: ReportTabKey; setActiveTab: (k: ReportTabKey) => void;
  activePeriod: string; setActivePeriod: (p: string) => void;
  compareOn: boolean; setCompareOn: (v: boolean) => void;
}) {
  const activeReportTab = REPORT_TABS.find(t => t.key === activeTab) ?? REPORT_TABS[0];

  return (
    <div style={{ position: "sticky", top: 0, zIndex: 40, boxShadow: "0 6px 28px rgba(0,0,0,0.22)" }}>

      {/* ── Mobile: current-report picker — replaces the tab strip below `md` ── */}
      <div className="md:hidden" style={{
        background: "linear-gradient(135deg, #2C0913 0%, #5D1027 60%, #3D0E1A 100%)",
        padding: "12px 16px",
        borderBottom: "1px solid rgba(200,155,71,0.16)",
      }}>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
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
                <div style={{ fontFamily: F.ui, fontSize: 15, fontWeight: 700, color: "#FFFDF9" }}>{activeReportTab.label}</div>
                <div style={{ fontFamily: F.mono, fontSize: 12, color: "rgba(200,155,71,0.82)" }}>{activeReportTab.desc}</div>
              </div>
              <ChevronDown size={18} color="rgba(245,232,208,0.60)" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-[min(88vw,360px)]">
            {REPORT_TABS.map(tab => (
              <DropdownMenuItem key={tab.key} onSelect={() => setActiveTab(tab.key)} className="h-auto py-2.5">
                <div style={{
                  width: 32, height: 32, borderRadius: 9, flexShrink: 0,
                  background: tab.key === activeTab ? tab.iconBg : "var(--surface-sunken)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                }}>
                  <tab.Icon size={16} color={tab.key === activeTab ? tab.iconColor : "var(--text-tertiary)"} />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontFamily: F.ui, fontSize: 13, fontWeight: tab.key === activeTab ? 700 : 500 }}>{tab.label}</div>
                  <div style={{ fontFamily: F.ui, fontSize: 12, color: "var(--text-tertiary)" }}>{tab.desc}</div>
                </div>
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* ── Desktop/tablet: Tab strip — dark gradient ─────────────────────── */}
      <div className="hidden md:flex md:px-7 xl:px-12" style={{
        background: "linear-gradient(135deg, #2C0913 0%, #5D1027 60%, #3D0E1A 100%)",
        alignItems: "stretch",
        borderBottom: "1px solid rgba(200,155,71,0.16)",
      }}>
        {REPORT_TABS.map(tab => {
          const active = activeTab === tab.key;
          return (
            <Button
              key={tab.key}
              variant={active ? "tertiary" : "ghost"}
              onClick={() => setActiveTab(tab.key)}
              className={`flex-1 h-[126px] flex-col justify-center gap-[11px] rounded-none px-2 border-0 border-b-[3px] ${active ? "border-[var(--bk-gold-500)] bg-[rgba(200,155,71,0.10)]" : "border-transparent bg-transparent"} hover:bg-[rgba(200,155,71,0.10)]`}
            >
              {/* Icon box */}
              <div style={{
                width: 56, height: 56, borderRadius: 16, flexShrink: 0,
                background: active ? tab.iconBg : "rgba(245,232,208,0.07)",
                border: `1px solid ${active ? "rgba(200,155,71,0.30)" : "rgba(245,232,208,0.08)"}`,
                display: "flex", alignItems: "center", justifyContent: "center",
                transition: "all 0.2s",
              }}>
                <tab.Icon
                  size={26}
                  color={active ? tab.iconColor : "rgba(245,232,208,0.40)"}
                />
              </div>
              {/* Label */}
              <div style={{ textAlign: "center" as const, lineHeight: 1.3 }}>
                <div style={{
                  fontFamily: F.ui,
                  fontSize: 16,
                  fontWeight: active ? 700 : 600,
                  color: active ? "#FFFDF9" : "rgba(245,232,208,0.52)",
                  whiteSpace: "nowrap" as const,
                  letterSpacing: "0.1px",
                  transition: "color 0.2s",
                }}>
                  {tab.label}
                </div>
                <div style={{
                  fontFamily: F.mono,
                  fontSize: 12,
                  color: active ? "rgba(200,155,71,0.82)" : "rgba(245,232,208,0.28)",
                  letterSpacing: "0.3px",
                  marginTop: 3,
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

      {/* ── Filter bar — ivory ─────────────────────────────────── */}
      <div className="px-4 md:px-7 xl:px-12" style={{
        background: T.warmIvory,
        borderBottom: `1px solid ${T.borderDef}`,
        paddingTop: 16,
        paddingBottom: 16,
        display: "flex",
        alignItems: "center",
        gap: 16,
        flexWrap: "wrap" as const,
      }}>

        {/* Period label */}
        <div style={{ display: "flex", alignItems: "center", gap: 10, flexShrink: 0 }}>
          <div style={{ width: 36, height: 36, borderRadius: 9, background: "rgba(200,155,71,0.12)", border: `1px solid ${T.borderGold}`, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Calendar size={18} color={T.antiqueGold} />
          </div>
          <span style={{ fontFamily: F.ui, fontSize: 16, fontWeight: 700, color: T.luxuryBrown, whiteSpace: "nowrap" as const }}>Period:</span>
        </div>

        {/* Period pills */}
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" as const }}>
          {PERIODS.map(p => {
            const active = activePeriod === p;
            const disabled = activeTab === "overdue";
            return (
              <Button key={p} variant={active ? "primary" : "secondary"} size="md"
                disabled={disabled}
                onClick={() => !disabled && setActivePeriod(p)}
                className="rounded-full whitespace-nowrap">
                {p}
              </Button>
            );
          })}
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
            onClick={() => setCompareOn(!compareOn)} role="button" tabIndex={0} onKeyDown={e => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); (() => setCompareOn(!compareOn))?.(); } }}
            style={{ width: 50, height: 28, borderRadius: 14, background: compareOn ? T.royalBurgundy : "rgba(110,15,45,0.12)", cursor: "pointer", position: "relative" as const, transition: "background 0.22s", flexShrink: 0 }}
          >
            <div style={{ position: "absolute", top: 4, left: compareOn ? 26 : 4, width: 20, height: 20, borderRadius: "50%", background: "#fff", transition: "left 0.22s", boxShadow: "0 1px 5px rgba(0,0,0,0.25)" }} />
          </div>
          {compareOn && (
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ fontFamily: F.mono, fontSize: 14, background: "rgba(110,15,45,0.08)", color: T.royalBurgundy, padding: "6px 14px", borderRadius: 99, fontWeight: 600 }}>May 2026</span>
              <span style={{ fontFamily: F.ui, fontSize: 14, color: T.taupe }}>vs</span>
              <span style={{ fontFamily: F.mono, fontSize: 14, background: "rgba(200,155,71,0.13)", color: "#8B6018", padding: "6px 14px", borderRadius: 99, fontWeight: 600 }}>April 2026</span>
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
  );
}
