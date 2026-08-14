import React from "react";
import { Lock, Download } from "lucide-react";
import { F, T } from "./tokens";
import { Button } from "../../../../shared/ui/primitives";

export function NoticeFooter() {
  return (
    <>
      {/* ── 8. IMMUTABILITY NOTICE ── */}
      <div className="px-4 md:px-7 xl:px-14" style={{ paddingTop: 48, paddingBottom: 48 }}>
        <div style={{
          background: "rgba(44,24,16,0.04)",
          border: "1px solid rgba(44,24,16,0.10)",
          borderRadius: 12,
          padding: "18px 24px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
        }}>
          <div style={{ display: "flex", gap: 14, alignItems: "flex-start" }}>
            <Lock size={20} color={T.royalBurgundy} style={{ flexShrink: 0, marginTop: 2 }} />
            <div>
              <div style={{ fontFamily: F.ui, fontWeight: 600, fontSize: 13, color: T.luxuryBrown, marginBottom: 6 }}>
                🔒 This audit log is permanent and immutable.
              </div>
              <p className="max-w-[600px]" style={{
                fontFamily: F.ui,
                fontWeight: 400,
                fontSize: 12,
                color: T.taupe,
                lineHeight: 1.65,
                margin: 0,
              }}>
                No one — including the Superadmin — can edit, delete, or modify any entry in this log. Every action recorded here is final and permanent. This log is your legal and operational record.
              </p>
            </div>
          </div>

          <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 6, flexShrink: 0, marginLeft: 24 }}>
            <Button variant="secondary" size="md" iconLeft={Download}>
              Export Full Log
            </Button>
            <span style={{ fontFamily: "var(--font-mono)", fontSize: 12, color: T.taupe }}>
              PDF · Excel
            </span>
          </div>
        </div>
      </div>

      {/* ── 9. FOOTER ── */}
      <div className="px-4 md:px-7 xl:px-14" style={{
        paddingTop: 32,
        paddingBottom: 32,
        background: T.luxuryBrown,
        textAlign: "center",
      }}>
        <div style={{
          fontFamily: F.display,
          fontWeight: 400,
          fontSize: 14,
          color: T.warmCream,
          marginBottom: 4,
        }}>
          Beere Kesava &amp; Brothers Silks · Est. 1999
        </div>
        <div style={{
          fontFamily: F.ui,
          fontSize: 12,
          color: T.taupe,
        }}>
          Superadmin Portal · Audit Log
        </div>
      </div>
    </>
  );
}
