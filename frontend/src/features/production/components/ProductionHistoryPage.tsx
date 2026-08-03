import React from "react";
import {
  Search, ChevronDown, Eye, Calendar, Users, Download,
  CheckCircle2, Loader2, TriangleAlert,
} from "lucide-react";
import { ProductionHistoryFooter } from "./ProductionHistoryFooter";

// ── Design Tokens ─────────────────────────────────────────────────────────────
const T = {
  silkCream:     "#F7F2EA",
  warmIvory:     "#FFFDF9",
  royalBurgundy: "#6E0F2D",
  deepWine:      "#4A061B",
  darkBurgundy:  "#3D0E1A",
  antiqueGold:   "#C89B47",
  goldLight:     "#E7C983",
  luxuryBrown:   "#3B2314",
  taupe:         "#8B7060",
  green:         "#1E6640",
  greenBg:       "#DCFCE7",
  amber:         "#92400E",
  amberBg:       "#FEF3C7",
  blue:          "#1E3A8A",
  blueBg:        "#DBEAFE",
  borderDef:     "rgba(110,15,45,0.10)",
};

const F = {
  display: "'Plus Jakarta Sans', sans-serif",
  ui:      "'Inter', sans-serif",
  mono:    "'JetBrains Mono', monospace",
};

// ── Batch data ────────────────────────────────────────────────────────────────
type BatchStatus = "Printing Completed" | "Printing In Process" | "Challenge in Progress";

interface Batch {
  id: string;
  designCode: string;
  sareeType: string;
  batchSize: number;
  weavers: Array<{ initials: string; bg: string }>;
  completion: number;
  allPieces: number;
  okPieces: number | null;
  found: number | null;
  status: BatchStatus;
  makingCharges: string;
  completedOn: string;
  bulkOrder?: string;
}

const BATCHES: Batch[] = [
  { id: "BATCH-448", designCode: "808-048", sareeType: "Self Brocade 336 ORS", batchSize: 4, weavers: [{ initials: "PV", bg: "#7C3AED" }, { initials: "RK", bg: "#C0392B" }], completion: 5, allPieces: 5, okPieces: 0, found: 0, status: "Printing Completed",    makingCharges: "₹1,25,000", completedOn: "30 May 2025", bulkOrder: "BO-12" },
  { id: "BATCH-476", designCode: "808-048", sareeType: "Self Brocade 282 ORS", batchSize: 4, weavers: [{ initials: "SM", bg: "#0F766E" }, { initials: "AK", bg: "#B45309" }], completion: 4, allPieces: 4, okPieces: 0, found: 0, status: "Printing Completed",    makingCharges: "₹1,25,000", completedOn: "30 May 2025" },
  { id: "BATCH-074", designCode: "808-048", sareeType: "Stripe Space 082 ORS", batchSize: 4, weavers: [{ initials: "PV", bg: "#7C3AED" }, { initials: "SM", bg: "#0F766E" }], completion: 4, allPieces: 4, okPieces: 2, found: 1, status: "Printing In Process",   makingCharges: "₹75,000",   completedOn: "02 Apr 2025" },
  { id: "BATCH-081", designCode: "808-088", sareeType: "Heavy Zari 741 ORS",   batchSize: 4, weavers: [{ initials: "RK", bg: "#C0392B" }, { initials: "AK", bg: "#B45309" }], completion: 5, allPieces: 5, okPieces: 0, found: 1, status: "Challenge in Progress", makingCharges: "₹1,50,000", completedOn: "04 May 2025" },
  { id: "BATCH-147", designCode: "808-048", sareeType: "Heavy Zari 741 ORS",   batchSize: 2, weavers: [{ initials: "PV", bg: "#7C3AED" }, { initials: "RK", bg: "#C0392B" }], completion: 2, allPieces: 2, okPieces: 1, found: 1, status: "Challenge in Progress", makingCharges: "₹30,000",   completedOn: "15 May 2025" },
  { id: "BATCH-148", designCode: "808-088", sareeType: "Plane 344 ORS",         batchSize: 4, weavers: [{ initials: "SM", bg: "#0F766E" }, { initials: "AK", bg: "#B45309" }], completion: 3, allPieces: 3, okPieces: 0, found: 1, status: "Challenge in Progress", makingCharges: "₹80,000",   completedOn: "25 Apr 2025" },
  { id: "BATCH-167", designCode: "808-048", sareeType: "Heavy Zari 741 ORS",   batchSize: 4, weavers: [{ initials: "PV", bg: "#7C3AED" }, { initials: "SM", bg: "#0F766E" }], completion: 3, allPieces: 3, okPieces: 1, found: 1, status: "Challenge in Progress", makingCharges: "₹80,000",   completedOn: "11 May 2025" },
  { id: "BATCH-179", designCode: "808-048", sareeType: "Stripe Space 082 ORS", batchSize: 4, weavers: [{ initials: "RK", bg: "#C0392B" }, { initials: "AK", bg: "#B45309" }], completion: 3, allPieces: 3, okPieces: null, found: null, status: "Printing Completed",    makingCharges: "₹80,000",   completedOn: "25 Apr 2025" },
  { id: "BATCH-354", designCode: "808-048", sareeType: "Happy Zari 741 ORS",   batchSize: 2, weavers: [{ initials: "PV", bg: "#7C3AED" }, { initials: "RK", bg: "#C0392B" }], completion: 2, allPieces: 2, okPieces: null, found: null, status: "Challenge in Progress", makingCharges: "₹80,000",   completedOn: "07 Apr 2025" },
  { id: "BATCH-304", designCode: "808-048", sareeType: "Stripe Space 082 ORS", batchSize: 2, weavers: [{ initials: "SM", bg: "#0F766E" }, { initials: "AK", bg: "#B45309" }], completion: 2, allPieces: 2, okPieces: null, found: null, status: "Challenge in Progress", makingCharges: "₹80,000",   completedOn: "07 Apr 2025" },
];

// ── Weaver avatar pip ─────────────────────────────────────────────────────────
function Pip({ initials, bg }: { initials: string; bg: string }) {
  return (
    <div style={{
      width: 26, height: 26, borderRadius: "50%", background: bg,
      display: "flex", alignItems: "center", justifyContent: "center",
      border: "1.5px solid rgba(255,255,255,0.6)", flexShrink: 0,
    }}>
      <span style={{ fontFamily: F.ui, fontSize: 9, fontWeight: 700, color: "#fff", letterSpacing: "-0.2px" }}>{initials}</span>
    </div>
  );
}

// ── Batch size squares ────────────────────────────────────────────────────────
function BatchSquares({ size }: { size: number }) {
  const filled = Math.min(size, 4);
  const colors = ["#7C3AED", "#C0392B", "#0F766E", "#B45309"];
  return (
    <div style={{ display: "flex", gap: 3, flexWrap: "wrap", maxWidth: 56 }}>
      {Array.from({ length: filled }).map((_, i) => (
        <div key={i} style={{ width: 10, height: 10, borderRadius: 2, background: colors[i % colors.length], opacity: 0.85 }} />
      ))}
    </div>
  );
}

// ── Status badge ──────────────────────────────────────────────────────────────
function StatusBadge({ status }: { status: BatchStatus }) {
  const map: Record<BatchStatus, { bg: string; color: string; icon: React.ReactNode }> = {
    "Printing Completed":    { bg: T.greenBg,  color: T.green,  icon: <CheckCircle2 size={11} /> },
    "Printing In Process":   { bg: T.amberBg,  color: T.amber,  icon: <Loader2 size={11} /> },
    "Challenge in Progress": { bg: T.blueBg,   color: T.blue,   icon: <TriangleAlert size={11} /> },
  };
  const cfg = map[status];
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: 4, padding: "3px 9px",
      borderRadius: 20, background: cfg.bg, color: cfg.color,
      fontFamily: F.ui, fontSize: 11, fontWeight: 600, whiteSpace: "nowrap",
    }}>
      {cfg.icon}
      {status}
    </span>
  );
}

// ── Dropdown select button ─────────────────────────────────────────────────────
function DropBtn({ label, icon }: { label: string; icon?: React.ReactNode }) {
  return (
    <button style={{
      display: "flex", alignItems: "center", gap: 6, padding: "7px 13px",
      border: `1px solid ${T.borderDef}`, borderRadius: 7, background: "#fff",
      fontFamily: F.ui, fontSize: 13, fontWeight: 500, color: T.luxuryBrown,
      cursor: "pointer", whiteSpace: "nowrap",
    }}>
      {icon}
      {label}
      <ChevronDown size={14} style={{ color: T.taupe }} />
    </button>
  );
}

// ── Section 1: Page header ────────────────────────────────────────────────────
function PageHeader() {
  return (
    <header style={{ background: T.darkBurgundy, padding: "18px 40px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
        <svg width="36" height="36" viewBox="0 0 36 36" fill="none">
          <rect width="36" height="36" rx="8" fill="rgba(200,155,71,0.18)" />
          <rect x="8" y="10" width="20" height="3" rx="1.5" fill={T.antiqueGold} />
          <rect x="8" y="23" width="20" height="3" rx="1.5" fill={T.antiqueGold} />
          <rect x="12" y="13" width="1.5" height="10" rx="0.75" fill={T.goldLight} />
          <rect x="15.5" y="13" width="1.5" height="10" rx="0.75" fill={T.goldLight} />
          <rect x="19" y="13" width="1.5" height="10" rx="0.75" fill={T.goldLight} />
          <rect x="22.5" y="13" width="1.5" height="10" rx="0.75" fill={T.goldLight} />
        </svg>
        <div>
          <div style={{ fontFamily: F.mono, fontSize: 10, color: "rgba(255,253,249,0.45)", letterSpacing: "2px", textTransform: "uppercase", marginBottom: 2 }}>
            SINCE 1999 · BATCH RECORDS
          </div>
          <h1 style={{ fontFamily: F.display, fontSize: 26, fontWeight: 700, color: "#FFFDF9", margin: 0, lineHeight: 1.1, letterSpacing: "-0.3px" }}>
            Production History
          </h1>
        </div>
      </div>

      <button style={{
        display: "flex", alignItems: "center", gap: 8, padding: "10px 20px",
        background: "linear-gradient(135deg, #C89B47 0%, #E7C983 100%)",
        border: "none", borderRadius: 8, cursor: "pointer",
        fontFamily: F.ui, fontSize: 13, fontWeight: 700, color: T.deepWine,
        boxShadow: "0 2px 12px rgba(200,155,71,0.30)",
      }}>
        <Download size={15} />
        Generate Production Report
      </button>
    </header>
  );
}

// ── Section 2: Filter bar ─────────────────────────────────────────────────────
function FilterBar() {
  return (
    <div style={{
      background: "#fff", padding: "14px 40px",
      borderBottom: `1px solid ${T.borderDef}`,
      display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap",
    }}>
      <DropBtn label="30 Apr 2026 – 30 Apr 2026" icon={<Calendar size={14} style={{ color: T.royalBurgundy }} />} />
      <DropBtn label="All Saree Types" />
      <DropBtn label="All Weavers" icon={<Users size={14} style={{ color: T.royalBurgundy }} />} />
      <DropBtn label="All Orders" />

      <div style={{ flex: 1, minWidth: 180, position: "relative" }}>
        <Search size={14} style={{ position: "absolute", left: 11, top: "50%", transform: "translateY(-50%)", color: T.taupe }} />
        <input
          placeholder="Search batches..."
          style={{
            width: "100%", padding: "7px 12px 7px 32px",
            border: `1px solid ${T.borderDef}`, borderRadius: 7,
            fontFamily: F.ui, fontSize: 13, color: T.luxuryBrown,
            background: "#FAFAFA", outline: "none",
          }}
        />
      </div>
    </div>
  );
}

// ── Section 3: Stats bar ──────────────────────────────────────────────────────
function StatsBar() {
  return (
    <div style={{
      background: T.silkCream, padding: "11px 40px",
      borderBottom: `1px solid ${T.borderDef}`,
      display: "flex", alignItems: "center", justifyContent: "space-between",
    }}>
      <span style={{ fontFamily: F.ui, fontSize: 13, color: T.taupe, fontWeight: 500 }}>
        Showing <strong style={{ color: T.luxuryBrown }}>1 to 10</strong> of <strong style={{ color: T.luxuryBrown }}>25</strong> completed batches
      </span>
      <div style={{ display: "flex", gap: 32 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ fontFamily: F.ui, fontSize: 12, color: T.taupe, fontWeight: 500 }}>Total Completed:</span>
          <span style={{ fontFamily: F.mono, fontSize: 14, fontWeight: 700, color: T.royalBurgundy }}>25</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ fontFamily: F.ui, fontSize: 12, color: T.taupe, fontWeight: 500 }}>Total Making Charges:</span>
          <span style={{ fontFamily: F.mono, fontSize: 14, fontWeight: 700, color: T.green }}>₹9,24,930</span>
        </div>
      </div>
    </div>
  );
}

// ── Section 4: Table ──────────────────────────────────────────────────────────
const TH: React.CSSProperties = {
  fontFamily: F.ui,
  fontSize: 11,
  fontWeight: 700,
  color: T.taupe,
  textTransform: "uppercase",
  letterSpacing: "0.6px",
  padding: "10px 14px",
  textAlign: "left",
  background: "#F3EEE8",
  borderBottom: `2px solid ${T.borderDef}`,
  whiteSpace: "nowrap",
};

const TD: React.CSSProperties = {
  fontFamily: F.ui,
  fontSize: 12.5,
  color: T.luxuryBrown,
  padding: "11px 14px",
  verticalAlign: "middle",
  whiteSpace: "nowrap",
};

function TableSection() {
  return (
    <div style={{ padding: "0 40px", background: T.warmIvory }}>
      <div style={{ overflowX: "auto", borderRadius: 10, border: `1px solid ${T.borderDef}`, boxShadow: "0 1px 6px rgba(0,0,0,0.05)", marginTop: 20 }}>
        <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 1050 }}>
          <thead>
            <tr>
              <th style={TH}>Batch Number</th>
              <th style={TH}>Design Code</th>
              <th style={TH}>Saree Type</th>
              <th style={{ ...TH, textAlign: "center" }}>Batch Size</th>
              <th style={TH}>Weavers</th>
              <th style={{ ...TH, textAlign: "center" }}>Completion</th>
              <th style={{ ...TH, textAlign: "center" }}>All Pieces</th>
              <th style={{ ...TH, textAlign: "center" }}>OK / Found</th>
              <th style={TH}>Printing / Embossing</th>
              <th style={{ ...TH, textAlign: "right" }}>Making Charges</th>
              <th style={TH}>Completed On</th>
              <th style={{ ...TH, textAlign: "center" }}>Bulk Order</th>
              <th style={{ ...TH, textAlign: "center" }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {BATCHES.map((b, i) => (
              <tr key={b.id} style={{ background: i % 2 === 0 ? "#FFFDF9" : "#F8F4EF" }}>
                <td style={TD}>
                  <span style={{ fontFamily: F.mono, fontSize: 12, fontWeight: 600, color: T.royalBurgundy, background: "rgba(110,15,45,0.07)", padding: "2px 7px", borderRadius: 5 }}>
                    {b.id}
                  </span>
                </td>
                <td style={TD}>
                  <span style={{ fontFamily: F.mono, fontSize: 11.5, color: T.taupe }}>{b.designCode}</span>
                </td>
                <td style={TD}>
                  <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
                    <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                      <rect x="1" y="3" width="12" height="8" rx="1.5" stroke={T.antiqueGold} strokeWidth="1.2" fill="none" />
                      <line x1="1" y1="5.5" x2="13" y2="5.5" stroke={T.antiqueGold} strokeWidth="0.8" />
                      <line x1="1" y1="8.5" x2="13" y2="8.5" stroke={T.antiqueGold} strokeWidth="0.8" />
                    </svg>
                    <span style={{ fontSize: 12.5, fontWeight: 500 }}>{b.sareeType}</span>
                  </div>
                </td>
                <td style={{ ...TD, textAlign: "center" }}>
                  <div style={{ display: "flex", justifyContent: "center" }}>
                    <BatchSquares size={b.batchSize} />
                  </div>
                </td>
                <td style={TD}>
                  <div style={{ display: "flex", gap: -4 }}>
                    {b.weavers.map((w, wi) => (
                      <div key={wi} style={{ marginLeft: wi > 0 ? -8 : 0 }}>
                        <Pip initials={w.initials} bg={w.bg} />
                      </div>
                    ))}
                  </div>
                </td>
                <td style={{ ...TD, textAlign: "center" }}>
                  <span style={{ fontFamily: F.mono, fontWeight: 700, fontSize: 14, color: T.luxuryBrown }}>{b.completion}</span>
                </td>
                <td style={{ ...TD, textAlign: "center" }}>
                  <span style={{ fontFamily: F.mono, fontSize: 13, color: T.taupe }}>{b.allPieces}</span>
                </td>
                <td style={{ ...TD, textAlign: "center" }}>
                  {b.okPieces !== null ? (
                    <span style={{ fontFamily: F.mono, fontSize: 12.5 }}>
                      <span style={{ color: T.green, fontWeight: 600 }}>{b.okPieces}</span>
                      <span style={{ color: T.taupe }}> / </span>
                      <span style={{ color: T.amber, fontWeight: 600 }}>{b.found}</span>
                    </span>
                  ) : (
                    <span style={{ color: T.taupe, fontSize: 12 }}>—</span>
                  )}
                </td>
                <td style={TD}>
                  <StatusBadge status={b.status} />
                </td>
                <td style={{ ...TD, textAlign: "right" }}>
                  <span style={{ fontFamily: F.mono, fontWeight: 700, fontSize: 13, color: T.luxuryBrown }}>{b.makingCharges}</span>
                </td>
                <td style={TD}>
                  <span style={{ fontFamily: F.mono, fontSize: 12, color: T.taupe }}>{b.completedOn}</span>
                </td>
                <td style={{ ...TD, textAlign: "center" }}>
                  {b.bulkOrder ? (
                    <span style={{ fontFamily: F.mono, fontSize: 11, background: "rgba(110,15,45,0.08)", color: T.royalBurgundy, padding: "2px 7px", borderRadius: 5, fontWeight: 600 }}>{b.bulkOrder}</span>
                  ) : (
                    <span style={{ color: "#D1C5BC", fontSize: 12 }}>—</span>
                  )}
                </td>
                <td style={{ ...TD, textAlign: "center" }}>
                  <button style={{
                    width: 30, height: 30, borderRadius: 6,
                    border: `1px solid ${T.borderDef}`, background: "#fff",
                    display: "inline-flex", alignItems: "center", justifyContent: "center",
                    cursor: "pointer", color: T.royalBurgundy,
                  }}>
                    <Eye size={14} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 0 24px" }}>
        <span style={{ fontFamily: F.ui, fontSize: 12.5, color: T.taupe }}>
          Showing 1 to 10 of 25 entries
        </span>
        <div style={{ display: "flex", gap: 4 }}>
          {["Prev", "1", "2", "3", "Next"].map((p) => (
            <button key={p} style={{
              padding: "6px 13px", borderRadius: 6,
              border: `1px solid ${p === "1" ? T.royalBurgundy : T.borderDef}`,
              background: p === "1" ? T.royalBurgundy : "#fff",
              color: p === "1" ? "#FFFDF9" : T.luxuryBrown,
              fontFamily: F.ui, fontSize: 12.5, fontWeight: 600, cursor: "pointer",
            }}>
              {p}
            </button>
          ))}
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ fontFamily: F.ui, fontSize: 12.5, color: T.taupe }}>Rows per page</span>
          <DropBtn label="10" />
        </div>
      </div>
    </div>
  );
}

export function ProductionHistoryPage() {
  return (
    <div style={{ minHeight: "100vh", background: T.silkCream, fontFamily: F.ui }}>
      <PageHeader />
      <FilterBar />
      <StatsBar />
      <TableSection />
      <ProductionHistoryFooter />
    </div>
  );
}
