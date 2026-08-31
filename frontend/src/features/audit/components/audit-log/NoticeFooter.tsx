import { F, T } from "./tokens";

export function NoticeFooter() {
  return (
    <>
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
