import {
  LayoutDashboard, Scissors, Factory, Package, CreditCard,
  BarChart2, UserRound, CheckCircle2,
} from "lucide-react";
import { useNavigate } from "react-router";
import { imgBKLogo } from "../../../../shared/constants/weaverImages";
import { T, F } from "../theme";

const FOOTER_QL = [
  { icon: <LayoutDashboard size={13} />, label: "Dashboard",  path: "/admin" },
  { icon: <Scissors size={13} />,       label: "Weavers",    path: "/admin/weavers" },
  { icon: <Factory size={13} />,        label: "Production", path: "/admin/production" },
  { icon: <Package size={13} />,        label: "Materials",  path: "/admin/materials" },
  { icon: <CreditCard size={13} />,     label: "Payments",   path: "/admin/payments" },
  { icon: <BarChart2 size={13} />,      label: "Reports",    path: "/admin/reports" },
  { icon: <UserRound size={13} />,      label: "Customers",  path: "/admin/customers" },
];
const FOOTER_COMM = ["Timely Settlements","100% Transparency","Heritage Since 1999","Traditional Excellence"];

export function ReportsFooter() {
  const navigate = useNavigate();
  return (
    <footer style={{ background: T.darkBurgundy, borderTop: "1px solid rgba(200,155,71,0.18)" }}>
      <div className="grid grid-cols-1 md:grid-cols-[1.6fr_1fr_1fr] px-4 md:px-7 xl:px-10" style={{ paddingTop: 44, paddingBottom: 36, gap: 40 }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 14 }}>
            <div style={{ width: 44, height: 44, borderRadius: 10, overflow: "hidden", border: "2px solid rgba(200,155,71,0.35)", flexShrink: 0 }}>
              <img src={imgBKLogo} alt="BK Silks" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
            </div>
            <div>
              <div style={{ fontFamily: F.display, fontSize: 16, fontWeight: 700, color: "#FFFDF9", lineHeight: 1.2 }}>Beere Kesava</div>
              <div style={{ fontFamily: F.display, fontSize: 14, fontStyle: "italic", color: T.antiqueGold, lineHeight: 1.2 }}>&amp; Brothers Silks</div>
            </div>
          </div>
          <div style={{ fontFamily: "var(--font-mono)", fontSize: 12, color: T.antiqueGold, letterSpacing: "2.5px", textTransform: "uppercase", marginBottom: 12 }}>SINCE 1999</div>
          <p style={{ fontFamily: F.ui, fontSize: 12, color: "rgba(255,253,249,0.52)", lineHeight: 1.7, marginBottom: 20, maxWidth: 280 }}>
            Preserving the art of pure silk weaving. Banarasi heritage crafted with trust, transparency, and timeless quality.
          </p>
        </div>

        <div>
          <div style={{ fontFamily: "var(--font-mono)", fontSize: 12, color: T.antiqueGold, letterSpacing: "2px", textTransform: "uppercase", marginBottom: 16 }}>QUICK LINKS</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {FOOTER_QL.map(l => (
              <button key={l.label} type="button" onClick={() => navigate(l.path)} style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer", background: "none", border: "none", padding: 0, textAlign: "left" }}>
                <span style={{ color: "rgba(200,155,71,0.55)" }}>{l.icon}</span>
                <span className="hover:text-[#FFFDF9] transition-colors" style={{ fontFamily: F.ui, fontSize: 12, color: "rgba(255,253,249,0.60)" }}>{l.label}</span>
              </button>
            ))}
          </div>
        </div>

        <div>
          <div style={{ fontFamily: "var(--font-mono)", fontSize: 12, color: T.antiqueGold, letterSpacing: "2px", textTransform: "uppercase", marginBottom: 16 }}>OUR COMMITMENT</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {FOOTER_COMM.map(c => (
              <div key={c} style={{ display: "flex", alignItems: "center", gap: 9 }}>
                <div style={{ width: 18, height: 18, borderRadius: "50%", background: "rgba(200,155,71,0.18)", border: "1px solid rgba(200,155,71,0.35)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  <CheckCircle2 size={10} color={T.antiqueGold} />
                </div>
                <span style={{ fontFamily: F.ui, fontSize: 12, color: "rgba(255,253,249,0.65)" }}>{c}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="px-4 md:px-7 xl:px-10" style={{ borderTop: "1px solid rgba(200,155,71,0.12)", paddingTop: 14, paddingBottom: 14, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16 }}>
        <span style={{ fontFamily: F.ui, fontSize: 12, color: "rgba(255,253,249,0.35)" }}>© 2026 Beere Kesava &amp; Brothers Silks. All rights reserved.</span>
        <span style={{ fontFamily: F.display, fontSize: 13, fontStyle: "italic", color: "rgba(200,155,71,0.55)" }}>Tradition · Promise · Trust · Quality Creates Legacy</span>
        <span style={{ fontFamily: F.ui, fontSize: 12, color: "rgba(255,253,249,0.35)" }}>Made with <span style={{ color: T.antiqueGold }}>♥</span> in India</span>
      </div>
    </footer>
  );
}
