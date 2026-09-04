import { labelsApi } from "../../../shared/api/labels";
import { EntityCode } from "../../../shared/ui/domain";
import { formatMoney, rupees } from "@/lib/domain/money";
import { encodeCostCipher } from "@/lib/domain/costCipher";

const T = {
  royalBurgundy: "#6E0F2D",
  antiqueGold:   "#C89B47",
  taupe:         "#69635E",
};

const F = {
  display: "'Plus Jakarta Sans', sans-serif",
  ui:      "'Inter', sans-serif",
  mono:    "'JetBrains Mono', monospace",
};

function BarcodeStrip({ code }: { code: string }) {
  return (
    <img
      src={labelsApi.barcodeUrl(code)}
      alt={`Barcode for ${code}`}
      style={{ width: "100%", height: 44, objectFit: "contain" }}
    />
  );
}

export interface SareeProps {
  id: string;
  weaver: string | null;
  design: string;
  sareeType: string;
  sareeTypeCode?: string;
  weight: string;
  qcDate: string;
  source: string;
  loom: number;
  supplier?: string;
  /** External-purchase-only fields — printed on that branch of the tag. */
  supplierShortName?: string | null;
  invoiceNumber?: string | null;
  serial?: string | null;
  /** Retail/selling price, printed in plain rupees. */
  sellingPrice?: number | null;
  /** Buying/cost price — printed cost-ciphered (see costCipher.ts), never in plain rupees. */
  costPrice?: number | null;
}

interface SariTagPhysicalLabelProps {
  saree: SareeProps;
  isExternal: boolean;
  showWeaver: boolean;
  showDate: boolean;
  showBranding: boolean;
}

export function SariTagPhysicalLabel({
  saree,
  isExternal,
  showWeaver,
  showDate,
  showBranding,
}: SariTagPhysicalLabelProps) {
  return (
    <div
      style={{
        flex: "0 0 60%", padding: 32, background: "#F7F4F0",
        display: "flex", flexDirection: "column",
        alignItems: "center", justifyContent: "center", gap: 24,
      }}
    >
      <div style={{ fontFamily: F.ui, fontSize: 12, color: T.taupe, marginBottom: 4 }}>
        LABEL PREVIEW — 100mm × 50mm
      </div>

      <div
        style={{
          width: "min(360px, 100%)", aspectRatio: "2 / 1",
          background: "#FFFFFF",
          border: `1.5px solid ${T.royalBurgundy}`,
          borderRadius: 4,
          padding: "12px 14px",
          display: "flex", flexDirection: "column",
          boxShadow: "0 4px 20px rgba(0,0,0,0.12)",
          position: "relative",
        }}
      >
        {isExternal ? (
          <>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 6 }}>
              {showBranding && (
                <div style={{ fontFamily: F.display, fontWeight: 700, fontSize: 12, color: T.royalBurgundy, letterSpacing: "0.5px" }}>
                  BKB Silks
                </div>
              )}
            </div>

            <div style={{ textAlign: "center", marginBottom: 4 }}>
              <div style={{ fontSize: 14 }}>
                <EntityCode type="saree" value={saree.id} />
              </div>
            </div>

            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", marginBottom: 6 }}>
              <div style={{ width: "100%", maxWidth: 280 }}>
                <BarcodeStrip code={saree.id} />
              </div>
            </div>

            <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 2, fontFamily: F.ui, fontSize: 12, color: "#1A1A1A" }}>
              <div><strong>{saree.sareeTypeCode || saree.sareeType}</strong></div>
              <div style={{ color: T.taupe }}>{saree.supplierShortName || saree.supplier || "—"}</div>
              {showDate && <div style={{ color: T.taupe }}>{saree.qcDate}</div>}
            </div>

            <div style={{ display: "flex", justifyContent: "space-between", marginTop: 6, gap: 8 }}>
              <div>
                <div style={{ fontFamily: F.ui, fontSize: 10, color: T.antiqueGold, fontWeight: 600 }}>INVOICE</div>
                <div style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "#1A1A1A", fontWeight: 600, marginTop: 1 }}>
                  {saree.invoiceNumber || "—"}
                </div>
              </div>
              <div>
                <div style={{ fontFamily: F.ui, fontSize: 10, color: T.antiqueGold, fontWeight: 600 }}>SERIAL</div>
                <div style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "#1A1A1A", fontWeight: 600, marginTop: 1 }}>
                  {saree.serial || "—"}
                </div>
              </div>
              <div style={{ textAlign: "right" }}>
                {/* Cost price is never printed as a plain number — encoded via
                    the LORD GANESH letter cipher (see costCipher.ts) so it
                    isn't readable by a customer glancing at the tag, while
                    staff who know the phrase can decode it back. */}
                <div style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: T.taupe, fontWeight: 600, marginTop: 1, letterSpacing: "0.5px" }}>
                  {saree.costPrice != null ? encodeCostCipher(saree.costPrice) : "—"}
                </div>
              </div>
              <div style={{ textAlign: "right" }}>
                <div style={{ fontFamily: F.ui, fontSize: 10, color: T.antiqueGold, fontWeight: 600 }}>PRICE</div>
                <div style={{ fontFamily: "var(--font-mono)", fontSize: 12, color: T.royalBurgundy, fontWeight: 700, marginTop: 1 }}>
                  {saree.sellingPrice != null ? formatMoney(rupees(saree.sellingPrice)) : "—"}
                </div>
              </div>
            </div>

            {showBranding && (
              <div
                style={{
                  position: "absolute", bottom: 6, right: 10,
                  fontFamily: F.display, fontSize: 7, color: T.royalBurgundy, opacity: 0.6,
                }}
              >
                Beere Kesava &amp; Brothers Silks · Est. 1999
              </div>
            )}
          </>
        ) : (
          <>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10 }}>
              {showBranding && (
                <div style={{ fontFamily: F.display, fontWeight: 700, fontSize: 12, color: T.royalBurgundy, letterSpacing: "0.5px" }}>
                  BKB Silks
                </div>
              )}
              <div style={{ fontFamily: F.ui, fontVariantNumeric: "tabular-nums", fontSize: 12, color: T.taupe, marginLeft: "auto" }}>
                {saree.sareeType}
              </div>
            </div>

            <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
              <div style={{ width: "100%", maxWidth: 280 }}>
                <BarcodeStrip code={saree.id} />
              </div>
              <div style={{ marginTop: 4 }}>
                <EntityCode type="saree" value={saree.id} />
              </div>
            </div>

            <div style={{ display: "flex", justifyContent: "space-between", marginTop: 8, gap: 8 }}>
              {showWeaver && (
                <div>
                  <div style={{ fontFamily: F.ui, fontSize: 12, color: T.antiqueGold, fontWeight: 600 }}>WEAVER</div>
                  <div style={{ fontFamily: F.ui, fontSize: 12, color: "#1A1A1A", fontWeight: 500, marginTop: 1 }}>
                    {saree.weaver || "Own Factory"}
                  </div>
                </div>
              )}
              {showDate && (
                <div>
                  <div style={{ fontFamily: F.ui, fontSize: 12, color: T.antiqueGold, fontWeight: 600 }}>QC DATE</div>
                  <div style={{ fontFamily: F.ui, fontSize: 12, color: "#1A1A1A", fontWeight: 500, marginTop: 1 }}>
                    {saree.qcDate}
                  </div>
                </div>
              )}
              <div>
                <div style={{ fontFamily: F.ui, fontSize: 12, color: T.antiqueGold, fontWeight: 600 }}>WEIGHT</div>
                <div style={{ fontFamily: F.ui, fontSize: 12, color: "#1A1A1A", fontWeight: 500, marginTop: 1 }}>
                  {saree.weight}
                </div>
              </div>
            </div>

            {showBranding && (
              <div
                style={{
                  position: "absolute", bottom: 6, right: 10,
                  fontFamily: F.display, fontSize: 7, color: T.royalBurgundy, opacity: 0.6,
                }}
              >
                Beere Kesava &amp; Brothers Silks · Est. 1999
              </div>
            )}
          </>
        )}
      </div>

      <div style={{ textAlign: "center" }}>
        {isExternal ? (
          <div style={{ fontFamily: F.ui, fontSize: 12, color: T.taupe, marginTop: 2 }}>
            External Purchase · {saree.supplierShortName || saree.supplier || "—"}
          </div>
        ) : (
          <>
            <div style={{ fontFamily: F.ui, fontVariantNumeric: "tabular-nums", fontSize: 12, color: T.taupe }}>
              {saree.design} · {saree.sareeType}
            </div>
            <div style={{ fontFamily: F.ui, fontSize: 12, color: T.taupe, marginTop: 2 }}>
              {saree.source === "factory"
                ? `Own Factory · Loom ${saree.loom}`
                : `Outsourced · ${saree.weaver}`}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
