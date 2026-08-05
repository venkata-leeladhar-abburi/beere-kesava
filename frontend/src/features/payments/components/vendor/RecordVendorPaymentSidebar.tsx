import React from "react";
import { motion } from "motion/react";
import { F, T } from "../../theme";
import { VendorPayment } from "../../types";

interface RecordVendorPaymentSidebarProps {
  vendorPayments: VendorPayment[];
  selVendor: string;
  setSelVendor: (v: string) => void;
  payAmount: string;
  setPayAmount: (v: string) => void;
  payDate: string;
  setPayDate: (v: string) => void;
  payMethod: string;
  setPayMethod: (v: string) => void;
  utrNumber: string;
  setUtrNumber: (v: string) => void;
  selVP: VendorPayment;
  selBalance: number;
  afterPay: number;
}

export function RecordVendorPaymentSidebar({
  vendorPayments,
  selVendor,
  setSelVendor,
  payAmount,
  setPayAmount,
  payDate,
  setPayDate,
  payMethod,
  setPayMethod,
  utrNumber,
  setUtrNumber,
  selVP,
  selBalance,
  afterPay,
}: RecordVendorPaymentSidebarProps) {
  const fieldStyle: React.CSSProperties = { width: "100%", height: 38, padding: "0 12px", fontFamily: F.ui, fontSize: 13, color: T.luxuryBrown, background: T.warmIvory, border: `1px solid ${T.borderDef}`, borderRadius: 8, outline: "none", boxSizing: "border-box" as const };
  const labelStyle: React.CSSProperties = { fontFamily: F.ui, fontSize: 13, fontWeight: 600, color: T.luxuryBrown, display: "block", marginBottom: 6 };

  return (
    <div style={{ flex: "0 0 272px", background: "#FFFFFF", borderRadius: 14, border: `1px solid ${T.borderDef}`, overflow: "hidden", boxShadow: "0 2px 14px rgba(74,6,27,0.07)" }}>
      <div style={{ background: T.darkBurgundy, padding: "16px 20px" }}>
        <div style={{ fontFamily: F.display, fontSize: 18, color: "#FFFDF9" }}>Record Vendor Payment</div>
        <div style={{ fontFamily: F.ui, fontSize: 13, color: "rgba(255,253,249,0.55)", marginTop: 3 }}>Mark payment made to a vendor</div>
      </div>
      <div style={{ padding: "18px 20px", display: "flex", flexDirection: "column", gap: 14 }}>
        <div>
          <label style={labelStyle} htmlFor="select-vendor">Select Vendor</label>
          <select id="select-vendor" value={selVendor} onChange={e => { setSelVendor(e.target.value); setPayAmount(""); }} style={{ ...fieldStyle }}>
            {vendorPayments.filter(v => v.status !== "Paid").map(v => (
              <option key={v.id} value={v.id}>{v.vendor}</option>
            ))}
          </select>
        </div>

        <div style={{ background: T.silkCream, border: `1px solid ${T.borderDef}`, borderRadius: 9, padding: "12px 14px", display: "flex", flexDirection: "column", gap: 7 }}>
          {[
            { label: "PO Number",     val: selVP.poNumber,                         color: T.royalBurgundy },
            { label: "Invoice Total",  val: `₹${selVP.invoiceAmt.toLocaleString("en-IN")}`, color: T.luxuryBrown },
            { label: "Previous Paid",  val: `₹${selVP.paidAmt.toLocaleString("en-IN")}`,   color: T.green },
          ].map(row => (
            <div key={row.label} style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ fontFamily: F.mono, fontSize: 12, color: T.taupe, textTransform: "uppercase" as const, letterSpacing: "0.6px" }}>{row.label}</span>
              <span style={{ fontFamily: F.mono, fontSize: 12, color: row.color, fontWeight: 700 }}>{row.val}</span>
            </div>
          ))}
          <div style={{ height: 1, background: T.borderDef, margin: "2px 0" }} />
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontFamily: F.mono, fontSize: 12, color: T.taupe, textTransform: "uppercase" as const, letterSpacing: "0.6px" }}>Balance Due</span>
            <span style={{ fontFamily: F.mono, fontSize: 14, color: T.crimson, fontWeight: 700 }}>₹{selBalance.toLocaleString("en-IN")}</span>
          </div>
        </div>

        <div>
          <label style={labelStyle}>Payment Amount</label>
          <div style={{ position: "relative" }}>
            <span style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", fontFamily: F.mono, fontSize: 14, color: T.taupe }}>₹</span>
            <input type="number" value={payAmount} onChange={e => setPayAmount(e.target.value)} placeholder="Enter amount paid"
              style={{ ...fieldStyle, paddingLeft: 26 }} />
          </div>
        </div>
        <div>
          <label style={labelStyle} htmlFor="payment-date">Payment Date</label>
          <input id="payment-date" type="date" value={payDate} onChange={e => setPayDate(e.target.value)} style={{ ...fieldStyle }} />
        </div>
        <div>
          <label style={labelStyle} htmlFor="payment-method">Payment Method</label>
          <select id="payment-method" value={payMethod} onChange={e => setPayMethod(e.target.value)} style={{ ...fieldStyle }}>
            {["Bank Transfer","Cash","Cheque","NEFT/RTGS","UPI"].map(m => <option key={m}>{m}</option>)}
          </select>
        </div>
        <div>
          <label style={labelStyle} htmlFor="utr-number">UTR Number</label>
          <input id="utr-number" value={utrNumber} onChange={e => setUtrNumber(e.target.value)} placeholder="Bank transaction reference..."
            style={{ ...fieldStyle }} />
        </div>
        {payAmount && (
          <div style={{ background: T.warmCream, border: `1px solid ${T.borderGold}`, borderRadius: 9, padding: "12px 14px" }}>
            <div style={{ fontFamily: F.mono, fontSize: 12, color: T.taupe, textTransform: "uppercase" as const, letterSpacing: "0.8px", marginBottom: 6 }}>Balance After This Payment</div>
            <div style={{ fontFamily: F.display, fontSize: 20, fontWeight: 700, color: afterPay <= 0 ? T.green : T.royalBurgundy }}>
              {afterPay <= 0 ? "Fully Paid ✓" : `₹${afterPay.toLocaleString("en-IN")}`}
            </div>
          </div>
        )}
        <div style={{ display: "flex", gap: 8 }}>
          <button style={{ flex: 1, padding: "9px 0", background: "transparent", border: `1px solid ${T.borderDef}`, borderRadius: 9, fontFamily: F.ui, fontSize: 13, fontWeight: 600, color: T.taupe, cursor: "pointer" }}>Cancel</button>
          <motion.button whileHover={{ scale: 1.02 }} initial={{ backgroundColor: T.royalBurgundy }} animate={{ backgroundColor: T.royalBurgundy }}
            style={{ flex: 2, padding: "9px 0", background: T.royalBurgundy, border: "none", borderRadius: 9, fontFamily: F.ui, fontSize: 13, fontWeight: 700, color: "#FFFDF9", cursor: "pointer" }}>
            Save Payment
          </motion.button>
        </div>
      </div>
    </div>
  );
}
