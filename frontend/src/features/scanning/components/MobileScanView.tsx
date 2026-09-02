import React, { useState } from "react";
import { Navigate, useLocation, useSearchParams } from "react-router";
import { useQuery } from "@tanstack/react-query";
import { Copy, Check } from "lucide-react";
import { IconButton } from "../../../shared/ui/primitives";
import { scanApi, ScanLookupResult } from "../../../shared/api/scan";
import { LoadingState, ErrorState, EmptyState } from "../../../shared/ui/state";
import { useAuthGate } from "../../../contexts/AuthContext";
import { formatMoney, rupees } from "@/lib/domain/money";

// ═══════════════════════════════════════════════════════════════════════════════
// DESIGN TOKENS
// ═══════════════════════════════════════════════════════════════════════════════
const T = {
  royalBurgundy: "#6E0F2D",
  antiqueGold:   "#C89B47",
  green:         "#1E6640",
  crimson:       "#C0392B",
  silkCream:     "#F7F2EA",
  warmIvory:     "#FFFDF9",
  luxuryBrown:   "#3B2314",
  taupe:         "#69635E",
  borderDef:     "rgba(110,15,45,0.10)",
};

const F = {
  display: "'Plus Jakarta Sans', sans-serif",
  ui:      "'Inter', sans-serif",
  mono:    "'JetBrains Mono', monospace",
};

// ═══════════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════════
interface SareeData {
  id:               string;
  origin:           "production" | "external";
  batchId:          string;
  weaver:           string;
  fabricType:       string;
  fabricCode:       string;
  colour:           string;
  weight:           string;
  jariType:         string;
  dispatchDate:     string;
  productionStage:  string;
  status:           string;
  /** External-purchase-only, blank for a production saree. */
  supplierShortName: string;
  invoiceNumber:     string;
  serial:            string;
  sellingPrice:      string;
}

/** DDMMYY, e.g. 2026-09-02 -> "020926" — same format the printed tag uses. */
function ddmmyy(dateStr?: string | null): string {
  if (!dateStr) return "—";
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return "—";
  const dd = String(d.getDate()).padStart(2, "0");
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const yy = String(d.getFullYear()).slice(-2);
  return `${dd}${mm}${yy}`;
}

function resultToSareeData(r: ScanLookupResult): SareeData {
  const weaverName = r.weaver
    ? `${r.weaver.name}${r.weaver.loomNumber != null ? ` · Loom ${r.weaver.loomNumber}` : ""}`
    : r.factoryLoom
      ? `Loom ${r.factoryLoom.code ?? r.factoryLoom.loomNumber}`
      : "Unknown";
  return {
    id: r.sareeId,
    origin: r.origin,
    batchId: r.batchId ?? "—",
    weaver: weaverName,
    fabricType: r.sareeType?.type ?? "—",
    fabricCode: r.sareeType?.code ?? "—",
    colour: r.color ?? "—",
    weight: r.weight != null ? `${r.weight}g` : "—",
    jariType: "—",
    dispatchDate: ddmmyy(r.qc?.date ?? r.receivedDate ?? r.batchDate),
    productionStage: r.finishing?.status
      ? `Finishing: ${r.finishing.status}`
      : r.qc?.result
        ? `QC: ${r.qc.result}`
        : "In Production",
    status: r.inventoryStatus ?? "In Production",
    supplierShortName: r.supplier?.shortName || r.supplier?.name || "—",
    invoiceNumber: r.invoiceNumber || "—",
    serial: r.serial || "—",
    // Authenticated internal view — the cost cipher is only for the printed
    // tag; here both prices show in plain rupees.
    sellingPrice: r.sellingPrice != null ? formatMoney(rupees(r.sellingPrice)) : "—",
  };
}

// ═══════════════════════════════════════════════════════════════════════════════
// DETAIL ROWS CONFIG
// ═══════════════════════════════════════════════════════════════════════════════
function detailRows(saree: SareeData) {
  if (saree.origin === "external") {
    return [
      { label: "Supplier",                 value: saree.supplierShortName },
      { label: "Invoice Number",           value: saree.invoiceNumber },
      { label: "Serial Number",            value: saree.serial },
      { label: "Saree Type",               value: saree.fabricType },
      { label: "Colour",                   value: saree.colour },
      { label: "Weight",                   value: saree.weight },
      { label: "Selling Price",            value: saree.sellingPrice },
      { label: "Date",                     value: saree.dispatchDate },
    ];
  }
  return [
    { label: "Batch Number",               value: saree.batchId },
    { label: "Weaver / Loom",              value: saree.weaver },
    { label: "Saree Type",                 value: saree.fabricType },
    { label: "Saree Type Code",            value: saree.fabricCode },
    { label: "Colour",                     value: saree.colour },
    { label: "Weight",                     value: saree.weight },
    { label: "Jari Type",                  value: saree.jariType },
    { label: "Date",                       value: saree.dispatchDate },
    { label: "Production Stage Completed", value: saree.productionStage },
  ];
}

// ═══════════════════════════════════════════════════════════════════════════════
// COMPONENT
// ═══════════════════════════════════════════════════════════════════════════════
// The saree prop lets callers (e.g. tests, or a future in-app scan trigger)
// pass a preloaded result directly. Reached via the bare "/scan" route
// (typically from a QR code), the sareeId comes from the ?id= query param
// and is looked up for real against GET /scan/:sareeId.
export function MobileScanView({ saree }: { saree?: SareeData }) {
  const [copied, setCopied] = useState(false);
  const [searchParams] = useSearchParams();
  const location = useLocation();
  const sareeId = searchParams.get("id") ?? searchParams.get("sareeId");
  // /scan is the QR-code landing route and sits outside every role guard, but
  // GET /scan/:sareeId is not @Public — scanning a tag while signed out used
  // to fire the lookup anyway and 401. Send them to sign in first and come
  // straight back to the same tag.
  const isSignedIn = useAuthGate();
  const needsLogin = !saree && !isSignedIn;

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["scan", sareeId],
    queryFn: () => scanApi.lookup(sareeId!),
    enabled: !saree && !!sareeId && isSignedIn,
  });

  const resolved: SareeData | null = saree ?? (data ? resultToSareeData(data) : null);

  const handleCopy = () => {
    if (!resolved) return;
    navigator.clipboard.writeText(resolved.id).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (needsLogin) {
    const returnTo = `${location.pathname}${location.search}`;
    return <Navigate to={`/login?returnTo=${encodeURIComponent(returnTo)}`} replace />;
  }

  if (!saree && !sareeId) {
    return (
      <div style={{ minHeight: "100dvh", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: F.ui, color: T.taupe, textAlign: "center", padding: 24 }}>
        No saree code provided. Scan a saree's QR code to view its details.
      </div>
    );
  }

  if (!saree && isLoading) {
    return (
      <div style={{ minHeight: "100dvh", display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
        <LoadingState variant="spinner" label={`Looking up ${sareeId}…`} />
      </div>
    );
  }

  if (!saree && isError) {
    return (
      <div style={{ minHeight: "100dvh", display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
        <ErrorState error={undefined} onRetry={() => void refetch()} />
      </div>
    );
  }

  if (!saree && !resolved) {
    return (
      <div style={{ minHeight: "100dvh", display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
        <EmptyState title="Saree not found" description={`Couldn't find a saree with code "${sareeId}".`} />
      </div>
    );
  }

  const currentSaree = resolved!;
  const rows = detailRows(currentSaree);

  return (
    <div
      style={{
        minHeight: "100dvh",
        background: "#FFFFFF",
        fontFamily: "Inter, sans-serif",
      }}
    >
      <div className="max-w-[375px]" style={{ margin: "0 auto" }}>

        {/* ── Top bar ── */}
        <div
          style={{
            height: 56,
            background: T.royalBurgundy,
            display: "flex", alignItems: "center", justifyContent: "center",
          }}
        >
          <span
            style={{
              fontFamily: F.display,
              fontWeight: 700,
              fontSize: 18,
              color: "#FFFFFF",
              letterSpacing: "0.2px",
            }}
          >
            BKB Silks
          </span>
        </div>

        {/* ── Saree photo placeholder ── */}
        <div
          style={{
            width: "100%",
            height: 200,
            borderRadius: 8,
            overflow: "hidden",
            background: "linear-gradient(135deg, #F5E8D0 0%, #E8DDD5 50%, #C89B47 100%)",
            display: "flex", alignItems: "center", justifyContent: "center",
            position: "relative",
          }}
        >
          <span
            style={{
              fontFamily: F.ui,
              fontWeight: 600,
              fontSize: 12,
              color: T.taupe,
              letterSpacing: "0.5px",
            }}
          >
            Authentic Silk Saree
          </span>
        </div>

        {/* ── Unique code + copy ── */}
        <div
          style={{
            display: "flex", alignItems: "center", justifyContent: "center",
            gap: 10, paddingTop: 20, paddingBottom: 10,
          }}
        >
          <span
            style={{
              fontFamily: "var(--font-mono)",
              fontWeight: 700,
              fontSize: 18,
              color: T.royalBurgundy,
              letterSpacing: "1px",
            }}
          >
            {currentSaree.id}
          </span>
          <IconButton
            onClick={handleCopy}
            icon={copied ? Check : Copy}
            label="Copy saree ID"
            variant="secondary"
            size="sm"
          />
        </div>

        {/* ── Status pill ── */}
        <div style={{ display: "flex", justifyContent: "center", paddingBottom: 18 }}>
          <div
            style={{
              background: T.green,
              borderRadius: 999,
              paddingLeft: 16, paddingRight: 16,
              paddingTop: 6, paddingBottom: 6,
            }}
          >
            <span
              style={{
                fontFamily: F.ui, fontWeight: 600,
                fontSize: 12, color: "#FFFFFF",
                letterSpacing: "0.3px",
              }}
            >
              {currentSaree.status}
            </span>
          </div>
        </div>

        {/* ── Divider ── */}
        <div style={{ height: 1, background: "#E8DDD5", marginLeft: 16, marginRight: 16 }} />

        {/* ── Details card ── */}
        <div
          style={{
            background: "#FFFFFF",
            border: "1px solid #E8DDD5",
            borderRadius: 8,
            padding: "0 12px",
            margin: "16px 16px 0",
          }}
        >
          {rows.map((row, idx) => (
            <div
              key={row.label}
              style={{
                paddingTop: 10, paddingBottom: 10,
                borderBottom: idx < rows.length - 1 ? "1px solid #F0EBE5" : "none",
              }}
            >
              <div
                style={{
                  fontFamily: F.ui,
                  fontSize: 12,
                  color: T.antiqueGold,
                  fontWeight: 600,
                  marginBottom: 3,
                  letterSpacing: "0.3px",
                }}
              >
                {row.label}
              </div>
              <div
                style={{
                  fontFamily: F.ui,
                  fontSize: 14,
                  color: "#1A1A1A",
                  fontWeight: 500,
                }}
              >
                {row.value}
              </div>
            </div>
          ))}
        </div>

        {/* ── Bottom branding ── */}
        <div
          style={{
            paddingTop: 28, paddingBottom: 32,
            display: "flex", flexDirection: "column",
            alignItems: "center", gap: 4,
          }}
        >
          <span
            style={{
              fontFamily: F.display,
              fontWeight: 700,
              fontSize: 13,
              color: T.royalBurgundy,
              letterSpacing: "0.3px",
            }}
          >
            BKB Silks
          </span>
          <span
            style={{
              fontFamily: F.ui,
              fontSize: 12,
              color: "#9E9E9E",
              textAlign: "center",
            }}
          >
            Authentic Handcrafted Silk Sarees
          </span>
        </div>

      </div>
    </div>
  );
}
