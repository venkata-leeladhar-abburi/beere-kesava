import React from "react";
import { Lock, Download } from "lucide-react";
import { F, T } from "./tokens";
import { Button } from "../../../../shared/ui/primitives";

export function NoticeFooter() {
  return (
    <>
      {/* ── 8. IMMUTABILITY NOTICE ── */}
      <div className="px-3 sm:px-4 md:px-7 xl:px-14 py-8 md:py-12">
        <div className="p-4 sm:p-6 bg-[rgba(44,24,16,0.04)] border border-[rgba(44,24,16,0.10)] rounded-xl flex flex-col sm:flex-row sm:items-start justify-between gap-4">
          <div className="flex items-start gap-3 sm:gap-4 flex-1 min-w-0">
            <Lock size={20} color={T.royalBurgundy} className="shrink-0 mt-0.5" />
            <div className="flex-1 min-w-0">
              <div style={{ fontFamily: F.ui, fontWeight: 600, fontSize: "clamp(13px, 2vw, 15px)", color: T.luxuryBrown, marginBottom: 6 }}>
                🔒 This audit log is permanent and immutable.
              </div>
              <p className="max-w-[650px]" style={{
                fontFamily: F.ui,
                fontWeight: 400,
                fontSize: "clamp(12px, 1.8vw, 13px)",
                color: T.taupe,
                lineHeight: 1.65,
                margin: 0,
              }}>
                No one — including the Superadmin — can edit, delete, or modify any entry in this log. Every action recorded here is final and permanent. This log is your legal and operational record.
              </p>

              {/* Mobile button placed below description aligned with text margin */}
              <div className="flex flex-col items-start gap-1.5 mt-4 sm:hidden">
                <Button variant="secondary" size="md" iconLeft={Download}>
                  Export Full Log
                </Button>
                <span style={{ fontFamily: "var(--font-mono)", fontSize: 12, color: T.taupe }}>
                  PDF · Excel
                </span>
              </div>
            </div>
          </div>

          {/* Desktop button placed on right */}
          <div className="hidden sm:flex flex-col items-end gap-1.5 shrink-0 ml-4">
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
