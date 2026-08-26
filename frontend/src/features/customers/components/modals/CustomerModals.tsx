import * as Dialog from "@radix-ui/react-dialog";
import { X, Download, Check } from "lucide-react";
import { T, F } from "../theme";
import { WholesaleCustomer, RetailCustomer } from "../types";
import { downloadCustomerCSV } from "../utils";
import { Button, IconButton } from "../../../../shared/ui/primitives";
import { Modal } from "../../../../shared/ui/overlay";
import { rupees, formatMoney } from "@/lib/domain/money";

export interface CustomerModalsProps {
  modalWholesale: WholesaleCustomer | null;
  setModalWholesale: (w: WholesaleCustomer | null) => void;
  downloadConfirmRetail: RetailCustomer | null;
  setDownloadConfirmRetail: (r: RetailCustomer | null) => void;
  viewingCard: string | null;
  setViewingCard: (url: string | null) => void;
  saveSuccess: boolean;
}

// ── MODALS ───────────────────────────────────────────────────────────────────
export function CustomerModals({
  modalWholesale, setModalWholesale, downloadConfirmRetail, setDownloadConfirmRetail,
  viewingCard, setViewingCard, saveSuccess,
}: CustomerModalsProps) {
  return (
    <>
      {saveSuccess && (
        <div style={{ position: "fixed", bottom: 40, right: 40, background: T.greenMid, color: "#FFF", padding: "16px 28px", borderRadius: 12, boxShadow: "0 10px 30px rgba(0,0,0,0.15)", display: "flex", alignItems: "center", gap: 10, zIndex: "var(--z-toast)" }}>
          <Check size={18} />
          <span style={{ fontFamily: F.ui, fontSize: 14, fontWeight: 600 }}>Profile updated successfully!</span>
        </div>
      )}

      <Modal open={!!modalWholesale} onOpenChange={o => !o && setModalWholesale(null)} size="xl">
        {modalWholesale && (
          <>
            <div style={{ background: T.darkBurgundy, padding: "24px 32px", display: "flex", alignItems: "center", gap: 20 }}>
              <div style={{ width: 56, height: 56, borderRadius: "50%", background: T.antiqueGold, color: "#FFF", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: F.display, fontSize: 20, fontWeight: 700, flexShrink: 0, boxShadow: "0 0 0 3px rgba(200,155,71,0.30)" }}>{modalWholesale.code}</div>
              <div>
                <Dialog.Title asChild>
                  <h2 style={{ fontFamily: F.display, fontSize: 20, fontWeight: 700, color: "#FFF", margin: "0 0 6px 0" }}>{modalWholesale.name}</h2>
                </Dialog.Title>
                <Dialog.Description className="sr-only">Wholesale customer profile for {modalWholesale.name}</Dialog.Description>
                <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                  <span style={{ fontFamily: F.ui, fontSize: 12, fontWeight: 600, color: T.antiqueGold, background: "rgba(200,155,71,0.18)", padding: "3px 10px", borderRadius: 999, border: "1px solid rgba(200,155,71,0.30)" }}>Wholesale Customer</span>
                  <span style={{ fontFamily: "var(--font-mono)", fontSize: 12, color: "rgba(255,255,255,0.50)" }}>{modalWholesale.displayCode || modalWholesale.id}</span>
                </div>
              </div>
              <Dialog.Close asChild>
                <IconButton icon={X} label="Close" variant="ghost" className="ml-auto shrink-0 rounded-full bg-white/10 text-white hover:bg-white/20 hover:text-white" />
              </Dialog.Close>
            </div>
            <div style={{ display: "flex", borderBottom: `1px solid ${T.borderDef}`, background: T.silkCream, padding: "0 32px" }}>
              {["Overview", "Order History", "Payment History", "Contact Details", "Edit Profile"].map((t, i) => (
                <div key={t} style={{ padding: "16px 24px", fontFamily: F.ui, fontSize: 14, fontWeight: i===0?600:500, color: i===0?T.royalBurgundy:T.taupe, borderBottom: i===0?`2px solid ${T.royalBurgundy}`:"2px solid transparent", cursor: "pointer" }}>{t}</div>
              ))}
            </div>
            <div style={{ padding: 32, overflowY: "auto", display: "flex", gap: 32 }}>
              <div style={{ flex: "55%" }}>
                <div className="grid grid-cols-1 md:grid-cols-2" style={{ gap: 16, marginBottom: 32 }}>
                  <div style={{ background: T.silkCream, padding: 20, borderRadius: 12 }}><div style={{ fontFamily: F.ui, fontSize: 12, color: T.taupe, marginBottom: 4 }}>Total Orders Ever</div><div style={{ fontFamily: F.display, fontSize: 30, color: T.luxuryBrown, fontWeight: 700 }}>{modalWholesale.orders}</div></div>
                  <div style={{ background: T.silkCream, padding: 20, borderRadius: 12 }}><div style={{ fontFamily: F.ui, fontSize: 12, color: T.taupe, marginBottom: 4 }}>Total Spend</div><div style={{ fontFamily: F.display, fontSize: 30, color: T.antiqueGold, fontWeight: 700 }}>{formatMoney(rupees(Number(modalWholesale.spend) || 0))}</div></div>
                  <div style={{ background: T.silkCream, padding: 20, borderRadius: 12 }}><div style={{ fontFamily: F.ui, fontSize: 12, color: T.taupe, marginBottom: 4 }}>Outstanding Balance</div><div style={{ fontFamily: F.display, fontSize: 30, color: modalWholesale.out==="0"?T.greenMid:T.crimson, fontWeight: 700 }}>{formatMoney(rupees(Number(modalWholesale.out) || 0))}</div></div>
                  <div style={{ background: T.silkCream, padding: 20, borderRadius: 12 }}><div style={{ fontFamily: F.ui, fontSize: 12, color: T.taupe, marginBottom: 4 }}>Payment Terms</div><div style={{ fontFamily: "var(--font-mono)", fontSize: 20, color: T.luxuryBrown, fontWeight: 600 }}>{modalWholesale.terms}</div></div>
                </div>
                {modalWholesale.activeOrder && (
                  <div style={{ background: T.luxuryBrown, padding: 20, borderRadius: 12, color: "#FFF" }}>
                    <div style={{ fontFamily: F.ui, fontSize: 12, color: "rgba(255,255,255,0.6)", marginBottom: 4 }}>Active Order in Production</div>
                    <div style={{ fontFamily: "var(--font-mono)", fontSize: 16, color: T.goldLight, marginBottom: 12 }}>{String(modalWholesale.activeOrder)} · 80 sarees</div>
                    <div style={{ width: "100%", height: 4, background: "rgba(255,255,255,0.2)", borderRadius: 2 }}><div style={{ width: "60%", height: "100%", background: T.antiqueGold, borderRadius: 2 }}/></div>
                  </div>
                )}
              </div>
              <div style={{ flex: "45%", borderLeft: `1px solid ${T.borderDef}`, paddingLeft: 32 }}>
                <h3 style={{ fontFamily: F.ui, fontSize: 16, fontWeight: 600, color: T.luxuryBrown, marginBottom: 20 }}>Contact Details</h3>
                <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                  <div><div style={{ fontFamily: F.ui, fontSize: 12, color: T.taupe }}>Owner</div><div style={{ fontFamily: F.ui, fontSize: 14, fontWeight: 600, color: T.luxuryBrown }}>Ramesh Rao</div></div>
                  <div><div style={{ fontFamily: F.ui, fontSize: 12, color: T.taupe }}>Phone</div><div style={{ fontFamily: F.ui, fontSize: 14, color: T.luxuryBrown }}>+91 98480 12345</div></div>
                  <div><div style={{ fontFamily: F.ui, fontSize: 12, color: T.taupe }}>City & State</div><div style={{ fontFamily: F.ui, fontSize: 14, color: T.luxuryBrown }}>{modalWholesale.city}</div></div>
                  <div>
                    <div style={{ fontFamily: F.ui, fontSize: 12, color: T.taupe, marginBottom: 2 }}>Bank Details</div>
                    <div style={{ fontFamily: F.ui, fontSize: 14, color: T.luxuryBrown }}>HDFC Bank · 4872 1938 8901</div>
                    <div style={{ fontFamily: "var(--font-mono)", fontSize: 12, color: T.taupe, marginTop: 4, display: "flex", alignItems: "center", gap: 4 }}>🔒 Visible to Superadmin only</div>
                  </div>
                  <div>
                    <div style={{ fontFamily: F.ui, fontSize: 12, color: T.taupe, marginBottom: 2 }}>Special Terms / Credit Notes</div>
                    <div style={{ fontFamily: F.ui, fontSize: 13, color: T.luxuryBrown }}>Extended 45-day terms approved · FY2026</div>
                    <div style={{ fontFamily: "var(--font-mono)", fontSize: 12, color: T.taupe, marginTop: 4 }}>🔒 Superadmin only</div>
                  </div>
                </div>
              </div>
            </div>
          </>
        )}
      </Modal>

      {/* EXTERNAL PURCHASE DRAWER REMOVED */}
      {/* Success toast — preserved from the original: this reuses `saveSuccess`
          and fires alongside the "Profile updated" toast above whenever a
          wholesale profile is saved, even though the copy references an
          "external purchase". Kept as-is for parity with the pre-split page. */}
      {saveSuccess && (
        <div style={{ position: "fixed", top: 24, right: 24, zIndex: 600, background: "#1E6640", color: "#FFF", padding: "14px 20px", borderRadius: 12, fontFamily: F.ui, fontSize: 13, fontWeight: 600, boxShadow: "0 8px 24px rgba(30,102,64,0.30)", display: "flex", alignItems: "center", gap: 10 }}>
          ✓ External purchase recorded successfully
        </div>
      )}

      {/* Retail customer — Download confirmation modal */}
      <Modal open={!!downloadConfirmRetail} onOpenChange={o => !o && setDownloadConfirmRetail(null)} size="xs">
        {downloadConfirmRetail && (
          <>
            <Modal.Header title="Download Customer Data?" />
            <Modal.Body>
              <div style={{ width: 48, height: 48, borderRadius: 12, background: "rgba(200,155,71,0.12)", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 16 }}>
                <Download size={22} color={T.antiqueGold} />
              </div>
              <p style={{ fontFamily: F.ui, fontSize: 14, color: T.taupe, margin: "0 0 8px 0", lineHeight: 1.5 }}>
                This will download a CSV file with {downloadConfirmRetail.name}'s profile and purchase summary.
              </p>
            </Modal.Body>
            <Modal.Footer>
              <Button onClick={() => setDownloadConfirmRetail(null)} variant="secondary" fullWidth>
                Cancel
              </Button>
              <Button
                onClick={() => {
                  downloadCustomerCSV(downloadConfirmRetail.name, [
                    ["Customer Name", downloadConfirmRetail.name],
                    ["Phone", downloadConfirmRetail.phone],
                    ["City", downloadConfirmRetail.city],
                    ["Total Purchases", String(downloadConfirmRetail.purchases)],
                    ["Total Spend", downloadConfirmRetail.spend],
                    ["Last Visit", downloadConfirmRetail.lastVisit],
                    ["Regular Buyer", downloadConfirmRetail.regular ? "Yes" : "No"],
                    ["Inactive", downloadConfirmRetail.inactive ? "Yes" : "No"],
                  ]);
                  setDownloadConfirmRetail(null);
                }}
                variant="primary"
                iconLeft={Download}
                fullWidth
              >
                Download
              </Button>
            </Modal.Footer>
          </>
        )}
      </Modal>

      {/* Visiting Card Viewer Modal */}
      <Modal open={!!viewingCard} onOpenChange={o => !o && setViewingCard(null)} size="sm">
        {viewingCard && (
          <>
            <Modal.Header title="Visiting Card" />
            <Modal.Body>
              <img src={viewingCard} alt="Visiting card" style={{ width: "100%", borderRadius: 12, border: `1px solid ${T.borderDef}`, display: "block" }} />
            </Modal.Body>
          </>
        )}
      </Modal>
    </>
  );
}
