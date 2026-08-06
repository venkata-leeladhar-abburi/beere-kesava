import { useState } from "react";
import { Download, Lock, ChevronLeft, ChevronRight } from "lucide-react";
import { DateFilterBar, DateFilterState, DEFAULT_DATE_FILTER, matchesDateFilter } from "../../../../shared/ui/DateFilterBar";
import { DownloadGate } from "../../../../shared/ui/DownloadAccess";
import { Button } from "../../../../shared/ui/primitives";
import { T, F, cardStyle, thStyle, tdStyle } from "./theme";
import { SectionTitle, GoldLink } from "./sharedUI";
import { HISTORY } from "./staticData";

export function RateHistorySection() {
  const [histPage, setHistPage] = useState(1);
  const [histDateFilter, setHistDateFilter] = useState<DateFilterState>(DEFAULT_DATE_FILTER);

  return (
    <div style={{ padding: "48px 56px" }}>
      <SectionTitle link={
        <DownloadGate><GoldLink><Download size={13} /> Download History →</GoldLink></DownloadGate>
      }>
        Rate Change History
      </SectionTitle>
      <p style={{ fontFamily: F.ui, fontSize: 13, color: T.taupe, maxWidth: 720, margin: "0 0 20px 0", lineHeight: 1.7 }}>
        A permanent, immutable log of all rate changes made in the system. This record cannot be edited or deleted and serves as the official audit trail.
      </p>

      <DateFilterBar filter={histDateFilter} onChange={setHistDateFilter} />

      <div style={cardStyle}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr>
              {["Date & Time", "Changed By", "What Was Changed", "Old Value", "New Value", "Reason"].map(h => (
                <th key={h} style={thStyle}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {HISTORY.filter(row => matchesDateFilter(row.date.split(" · ")[0], histDateFilter)).map((row, i) => (
              <tr key={i} style={{ background: i % 2 === 0 ? "transparent" : "rgba(110,15,45,0.015)" }}>
                <td style={{ ...tdStyle, fontFamily: F.mono, fontSize: 12, color: T.taupe, whiteSpace: "nowrap" }}>{row.date}</td>
                <td style={{ ...tdStyle, fontFamily: F.ui, fontSize: 12, fontWeight: 500 }}>{row.by}</td>
                <td style={{ ...tdStyle, fontFamily: F.ui, fontSize: 13, fontWeight: 500 }}>{row.what}</td>
                <td style={{ ...tdStyle, fontFamily: F.ui, fontSize: 13, fontWeight: 600, color: T.crimson }}>{row.old}</td>
                <td style={{ ...tdStyle, fontFamily: F.ui, fontSize: 13, fontWeight: 600, color: T.green }}>{row.next}</td>
                <td style={{ ...tdStyle, fontFamily: F.ui, fontSize: 12, fontStyle: "italic", color: T.taupe }}>{row.reason}</td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Table footer */}
        <div style={{
          display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: "14px 20px", borderTop: `1px solid ${T.borderDef}`,
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <Lock size={12} color={T.taupe} />
            <span style={{ fontFamily: F.mono, fontSize: 12, color: T.taupe }}>
              This history is permanent and cannot be edited or deleted.
            </span>
          </div>

          {/* Pagination */}
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <Button
              variant="secondary" size="sm" iconLeft={ChevronLeft}
              className="rounded-[8px] text-[var(--text-tertiary)]"
              onClick={() => setHistPage(p => Math.max(1, p - 1))}
            >
              Previous
            </Button>
            {[1, 2, 3].map(p => (
              <Button
                key={p}
                variant={histPage === p ? "primary" : "tertiary"}
                size="sm"
                className="h-[30px] w-[30px] rounded-[8px] p-0"
                onClick={() => setHistPage(p)}
              >
                {p}
              </Button>
            ))}
            <Button
              variant="secondary" size="sm" iconRight={ChevronRight}
              className="rounded-[8px] text-[var(--text-tertiary)]"
              onClick={() => setHistPage(p => Math.min(3, p + 1))}
            >
              Next
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
