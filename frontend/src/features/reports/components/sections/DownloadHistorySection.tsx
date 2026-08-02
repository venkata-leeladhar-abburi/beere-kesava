import React from "react";
import { Users, Scissors, BarChart3, UsersRound, BellRing, Boxes, Store, Tag, FileText, Download } from "lucide-react";
import { useDownloadsAllowed } from "../../../../shared/ui/DownloadAccess";
import { T, F } from "../theme";
import { FadeUp, SectionHeader } from "../common/primitives";

const DL_HISTORY = [
  { name: "Weaver Payment Report",   period: "May 2026",   generated: "22 May 2026", by: "Admin (RA)", format: "PDF + Excel" },
  { name: "Production Report",       period: "May 2026",   generated: "21 May 2026", by: "Admin (BK)", format: "PDF"        },
  { name: "Profit & Loss Report",    period: "April 2026", generated: "01 May 2026", by: "Admin (RA)", format: "PDF"        },
  { name: "Customer Dues Report",    period: "May 2026",   generated: "20 May 2026", by: "Admin (MK)", format: "Excel"      },
  { name: "Overdue Alerts",          period: "Today",      generated: "22 May 2026", by: "System Auto",format: "PDF"        },
  { name: "Raw Material Report",     period: "May 2026",   generated: "18 May 2026", by: "Admin (BK)", format: "PDF + Excel" },
  { name: "Wholesale Sales Report",  period: "Q1 2026",    generated: "01 Apr 2026", by: "Admin (RA)", format: "PDF"        },
  { name: "Weaver Payment Report",   period: "April 2026", generated: "01 May 2026", by: "System Auto",format: "PDF + Excel" },
  { name: "Production Report",       period: "April 2026", generated: "30 Apr 2026", by: "Admin (MK)", format: "PDF"        },
  { name: "Retail Sales Report",     period: "April 2026", generated: "30 Apr 2026", by: "Admin (BK)", format: "Excel"      },
];

export function DownloadHistorySection() {
  // The whole section is a download archive — nothing to show where exporting
  // isn't permitted.
  if (!useDownloadsAllowed()) return null;
  const dlIconMap: Record<string, React.ReactNode> = {
    "Weaver Payment Report":  <Users size={24} color={T.antiqueGold} />,
    "Production Report":      <Scissors size={24} color={T.antiqueGold} />,
    "Profit & Loss Report":   <BarChart3 size={24} color={T.antiqueGold} />,
    "Customer Dues Report":   <UsersRound size={24} color={T.antiqueGold} />,
    "Overdue Alerts":         <BellRing size={24} color={T.antiqueGold} />,
    "Raw Material Report":    <Boxes size={24} color={T.antiqueGold} />,
    "Wholesale Sales Report": <Store size={24} color={T.antiqueGold} />,
    "Retail Sales Report":    <Tag size={24} color={T.antiqueGold} />,
  };

  return (
    <div style={{ padding: "36px 40px 40px" }}>
      <FadeUp>
        <SectionHeader
          title="Previously Downloaded Reports"
          action={
            <button style={{ background: "none", border: "none", fontFamily: F.ui, fontSize: 13, fontWeight: 600, color: T.taupe, cursor: "pointer", textDecoration: "underline" }}>
              Clear History →
            </button>
          }
        />
        <p style={{ fontFamily: F.ui, fontSize: 14, color: T.taupe, margin: "4px 0 22px 13px" }}>
          All reports that were generated and downloaded. Click Download Again to get any previous report without regenerating it.
        </p>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 16, alignItems: "stretch" }}>
          {DL_HISTORY.map((r, i) => (
            <div key={i} style={{ background: "#FFFFFF", borderRadius: 14, border: `1px solid ${T.borderDef}`, boxShadow: "0 2px 10px rgba(74,6,27,0.06)", padding: "20px 22px", display: "flex", flexDirection: "column", gap: 14 }}>
              {/* Header: icon + report name */}
              <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                <div style={{ width: 50, height: 50, minWidth: 50, borderRadius: 13, background: "rgba(200,155,71,0.10)", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 2px 8px rgba(200,155,71,0.10)" }}>
                  {dlIconMap[r.name] ?? <FileText size={24} color={T.antiqueGold} />}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontFamily: F.ui, fontSize: 16, fontWeight: 700, color: T.luxuryBrown, lineHeight: 1.3 }}>{r.name}</div>
                  <span style={{ display: "inline-block", marginTop: 4, fontFamily: F.mono, fontSize: 13, fontWeight: 700, color: T.royalBurgundy }}>{r.period}</span>
                </div>
              </div>

              {/* Details */}
              <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 8 }}>
                <div style={{ display: "flex", gap: 32 }}>
                  <div>
                    <div style={{ fontFamily: F.ui, fontSize: 12, fontWeight: 600, color: T.taupe, marginBottom: 2 }}>Generated On</div>
                    <div style={{ fontFamily: F.mono, fontSize: 13, color: T.luxuryBrown }}>{r.generated}</div>
                  </div>
                  <div>
                    <div style={{ fontFamily: F.ui, fontSize: 12, fontWeight: 600, color: T.taupe, marginBottom: 2 }}>Generated By</div>
                    <div style={{ fontFamily: F.ui, fontSize: 13, color: T.luxuryBrown }}>{r.by}</div>
                  </div>
                </div>
                <div style={{ display: "flex", gap: 6, flexWrap: "wrap" as const }}>
                  {r.format.split(" + ").map(f => (
                    <span key={f} style={{ padding: "3px 11px", borderRadius: 6, background: "rgba(110,15,45,0.07)", color: T.royalBurgundy, fontFamily: F.mono, fontSize: 12, fontWeight: 700 }}>{f}</span>
                  ))}
                </div>
              </div>

              {/* Download button */}
              <button style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 7, height: 42, background: T.royalBurgundy, border: "none", borderRadius: 9, fontFamily: F.ui, fontSize: 14, fontWeight: 700, color: "#FFFDF9", cursor: "pointer", width: "100%" }}>
                <Download size={15} />Download Again
              </button>
            </div>
          ))}
        </div>
      </FadeUp>
    </div>
  );
}

