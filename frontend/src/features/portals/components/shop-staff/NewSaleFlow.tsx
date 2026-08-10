import React, { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { customersApi } from '../../../../shared/api/customers';
import { 
  IndianRupee, Plus, Wallet, CreditCard, Check,
} from 'lucide-react';
import { useRatesPricing } from "../../../pricing/contexts/RatesContext";
import { useResponsive } from "../../../../hooks/useResponsive";
import { C, F, Card, Btn, Chip, useCanSeePrices, HeroHeader } from './theme';
import { NewSaleBillModal } from './NewSaleBillModal';
import { NewSaleSuccessView } from './NewSaleSuccessView';
import { CustomerSelectStep, Customer } from './CustomerSelectStep';
import { ScanSareeStep } from './ScanSareeStep';
import { ApiError } from "../../../../shared/api/client";
import { scanApi } from "../../../../shared/api/scan";
import { salesApi } from "../../../../shared/api/sales";
import { Button, Input } from '../../../../shared/ui/primitives';
import { rupees, formatMoney } from "@/lib/domain/money";

export function NewSaleFlow() {
  const canSeePrices = useCanSeePrices();
  const { isMobile, isTablet } = useResponsive();
  const { getSareeTypeByCode } = useRatesPricing();
  const [step, setStep] = useState<1 | 2 | 3 | 4 | "success">(1);
  const [sareeFound, setSareeFound] = useState(false);
  const [manualId, setManualId] = useState("");
  const [payment, setPayment] = useState<"cash" | "upi" | "card" | "other" | null>(null);
  const [payRef, setPayRef] = useState("");
  const [phone, setPhone] = useState("");
  const [custName, setCustName] = useState("");
  const [custAddress, setCustAddress] = useState("");
  const [showBill, setShowBill] = useState(false);
  const [custSearch, setCustSearch] = useState("");
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [isEditingCustomer, setIsEditingCustomer] = useState(false);
  const [showCustomerList, setShowCustomerList] = useState(false);
  const [isNewCustomer, setIsNewCustomer] = useState(false);

  const [saree, setSaree] = useState({ id: "", design: "", name: "", type: "", typeCode: "", weight: "—", weaver: "" });
  const [scanError, setScanError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const originalPrice = Number(getSareeTypeByCode(saree.typeCode)?.retail ?? 0);
  const [soldPrice, setSoldPrice] = useState(originalPrice);
  const priceDiscount = originalPrice - soldPrice;
  const fmtPrice = (n: number) => formatMoney(rupees(n));

  const { data: customersRes } = useQuery({
    queryKey: ["customers-list-newsale"],
    queryFn: () => customersApi.list(100),
  });

  const prevCustomers: Customer[] = useMemo(() => {
    return (customersRes?.items ?? []).map(c => {
      const parts = c.name.split(" ").filter(Boolean);
      const initials = parts.length >= 2 ? `${parts[0][0]}${parts[1][0]}`.toUpperCase() : c.name.slice(0, 2).toUpperCase();
      return {
        id: c.id,
        name: c.name,
        phone: c.phone ?? "—",
        purchases: 1,
        total: "₹12,500",
        lastPurchase: new Date(c.createdAt).toLocaleDateString("en-IN", { month: "short", day: "numeric" }),
        initials,
      };
    });
  }, [customersRes]);

  const filteredCustomers = custSearch.length >= 2
    ? prevCustomers.filter(c =>
      c.phone.replace(/\s/g, "").includes(custSearch.replace(/\s/g, "")) ||
      c.name.toLowerCase().includes(custSearch.toLowerCase())
    )
    : prevCustomers;

  const handleScan = async () => {
    const id = manualId.trim();
    if (!id) {
      setScanError("Enter a saree ID to look it up (no live camera decoding yet).");
      return;
    }
    setScanError(null);
    try {
      const result = await scanApi.lookup(id);
      const typeCode = result.sareeType?.code ?? "";
      const nextSaree = {
        id: result.sareeId,
        design: result.design?.code ?? "—",
        name: result.design?.name ?? result.sareeType?.type ?? "—",
        type: result.sareeType ? `${result.sareeType.type} · ${result.sareeType.code}` : "—",
        typeCode,
        weight: "—",
        weaver: result.weaver?.name ?? (result.factoryLoom ? `Factory Loom ${result.factoryLoom.loomNumber}` : "—"),
      };
      setSaree(nextSaree);
      setSoldPrice(Number(getSareeTypeByCode(typeCode)?.retail ?? 0));
      setSareeFound(true);
    } catch (err) {
      setScanError(err instanceof ApiError ? err.message : "Could not find this saree.");
    }
  };

  const handleSelectCustomer = (cust: Customer) => {
    setSelectedCustomer(cust);
    setCustName(cust.name);
    setPhone(cust.phone);
    setCustSearch(cust.name);
    setShowCustomerList(false);
    setIsEditingCustomer(false);
    setIsNewCustomer(false);
  };

  const handleAddNew = () => {
    setSelectedCustomer(null);
    setIsEditingCustomer(false);
    setIsNewCustomer(true);
    setShowCustomerList(false);
    setCustName(""); setPhone(""); setCustAddress(""); setCustSearch("");
  };

  const resetSale = () => {
    setStep(1); setSareeFound(false); setManualId(""); setPayment(null); setPayRef("");
    setPhone(""); setCustName(""); setCustAddress("");
    setCustSearch(""); setSelectedCustomer(null); setIsEditingCustomer(false);
    setIsNewCustomer(false); setShowCustomerList(false); setSoldPrice(originalPrice);
  };

  const canProceedStep1 = selectedCustomer !== null || (isNewCustomer && custName.trim() !== "");

  if (showBill) {
    return (
      <NewSaleBillModal
        saree={saree}
        custName={custName}
        phone={phone}
        payment={payment}
        soldPrice={soldPrice}
        canSeePrices={canSeePrices}
        isMobile={isMobile}
        isTablet={isTablet}
        fmtPrice={fmtPrice}
        onClose={() => setShowBill(false)}
      />
    );
  }

  if (step === "success") {
    return (
      <NewSaleSuccessView
        saree={saree}
        custName={custName}
        payment={payment}
        soldPrice={soldPrice}
        canSeePrices={canSeePrices}
        fmtPrice={fmtPrice}
        onShowBill={() => setShowBill(true)}
        onResetSale={resetSale}
      />
    );
  }

  return (
    <div style={{ paddingBottom: 32 }}>
      <HeroHeader eyebrow="SINCE 1999 · NEW SALE" title="New Retail" sub="Sale" desc="Record a sale at the shop counter" />

      {/* Step progress with labels */}
      <div style={{ padding: "16px 20px 8px" }}>
        <div style={{ display: "flex", gap: 4 }}>
          {(["Customer", "Scan Saree", "Payment", "Confirm"] as const).map((label, i) => (
            <div key={i} style={{ flex: 1 }}>
              <div style={{ height: 4, borderRadius: 999, background: (i + 1) <= (step as number) ? C.burg : "rgba(139,26,46,0.15)", marginBottom: 5 }} />
              <div style={{ fontFamily: F.m, fontSize: 12, letterSpacing: 0.8, textTransform: "uppercase" as const, color: (i + 1) <= (step as number) ? C.burg : C.muted, textAlign: "center" as const }}>{label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Step 1 — Customer Details ── */}
      {step === 1 && (
        <CustomerSelectStep
          custSearch={custSearch}
          setCustSearch={setCustSearch}
          showCustomerList={showCustomerList}
          setShowCustomerList={setShowCustomerList}
          selectedCustomer={selectedCustomer}
          setSelectedCustomer={setSelectedCustomer}
          filteredCustomers={filteredCustomers}
          isEditingCustomer={isEditingCustomer}
          setIsEditingCustomer={setIsEditingCustomer}
          isNewCustomer={isNewCustomer}
          setIsNewCustomer={setIsNewCustomer}
          custName={custName}
          setCustName={setCustName}
          phone={phone}
          setPhone={setPhone}
          custAddress={custAddress}
          setCustAddress={setCustAddress}
          isMobile={isMobile}
          handleSelectCustomer={handleSelectCustomer}
          handleAddNew={handleAddNew}
          canProceedStep1={canProceedStep1}
          onNext={() => setStep(2)}
        />
      )}

      {/* ── Step 2 — Scan Saree ── */}
      {step === 2 && (
        <ScanSareeStep
          sareeFound={sareeFound}
          setSareeFound={setSareeFound}
          manualId={manualId}
          setManualId={setManualId}
          saree={saree}
          soldPrice={soldPrice}
          setSoldPrice={setSoldPrice}
          originalPrice={originalPrice}
          canSeePrices={canSeePrices}
          isMobile={isMobile}
          fmtPrice={fmtPrice}
          handleScan={handleScan}
          scanError={scanError}
          onBack={() => setStep(1)}
          onNext={() => setStep(3)}
        />
      )}

      {/* ── Step 3 — Payment Method ── */}
      {step === 3 && (
        <div style={{ marginTop: 12 }}>
          <div style={{ margin: "0 20px 16px" }}>
            <div style={{ fontFamily: F.u, fontWeight: 600, fontSize: 14, color: C.text, marginBottom: 4 }}>Payment Method</div>
            <div style={{ fontFamily: F.u, fontSize: 13, color: C.muted }}>How is the customer paying?</div>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, margin: "0 20px 16px" }}>
            {[
              { id: "cash" as const, label: "Cash", sub: "Physical currency", icon: <IndianRupee size={22} /> },
              { id: "upi" as const, label: "UPI", sub: "GPay, PhonePe, etc.", icon: <Wallet size={22} /> },
              { id: "card" as const, label: "Card", sub: "Debit or Credit", icon: <CreditCard size={22} /> },
              { id: "other" as const, label: "Other", sub: "Cheque / Transfer", icon: <Plus size={22} /> },
            ].map(p => (
              <Button key={p.id} variant="tertiary" onClick={() => setPayment(p.id)}
                className={`h-auto flex-col items-start gap-2 whitespace-normal rounded-[14px] px-3.5 py-4 relative ${payment === p.id ? "border-2 border-[#6B1A2A] bg-[rgba(107,26,42,0.06)]" : "border border-[rgba(139,26,46,0.12)] bg-white"}`}>
                <div style={{ width: 40, height: 40, borderRadius: 10, background: payment === p.id ? "rgba(107,26,42,0.10)" : "rgba(107,26,42,0.05)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  {React.cloneElement(p.icon, { color: payment === p.id ? C.burg : C.muted })}
                </div>
                <div>
                  <div style={{ fontFamily: F.u, fontWeight: 600, fontSize: 14, color: payment === p.id ? C.burg : C.text }}>{p.label}</div>
                  <div style={{ fontFamily: F.u, fontSize: 12, color: C.muted, marginTop: 2 }}>{p.sub}</div>
                </div>
                {payment === p.id && <div style={{ position: "absolute" as const, top: 8, right: 8, width: 18, height: 18, borderRadius: "50%", background: C.gold, display: "flex", alignItems: "center", justifyContent: "center" }}><Check size={10} color={C.text} /></div>}
              </Button>
            ))}
          </div>
          {payment === "upi" && (
            <div style={{ margin: "0 20px 16px" }}>
              <label style={{ fontFamily: F.u, fontWeight: 500, fontSize: 13, color: C.muted, display: "block", marginBottom: 8 }}>UPI Reference (Optional)</label>
              <Input value={payRef} onChange={e => setPayRef(e.target.value)} placeholder="Transaction ID" size="lg" className="w-full font-mono" />
            </div>
          )}
          {payment === "card" && (
            <div style={{ margin: "0 20px 16px" }}>
              <label style={{ fontFamily: F.u, fontWeight: 500, fontSize: 13, color: C.muted, display: "block", marginBottom: 8 }}>Last 4 Digits (Optional)</label>
              <Input value={payRef} onChange={e => setPayRef(e.target.value)} maxLength={4} placeholder="e.g. 4872" size="lg" className="w-full font-mono text-lg" />
            </div>
          )}
          <div style={{ padding: "0 20px", display: "flex", gap: 10 }}>
            <Btn label="← Back" variant="ghost" onClick={() => setStep(2)} style={{ flex: 1 }} />
            <Btn label="Next — Confirm →" onClick={() => payment && setStep(4)} style={{ flex: 2, background: payment ? C.burg : "#C0C0C0", cursor: payment ? "pointer" : "not-allowed" }} />
          </div>
        </div>
      )}

      {/* ── Step 4 — Confirm Sale ── */}
      {step === 4 && (
        <div style={{ marginTop: 12 }}>
          <div style={{ margin: "0 20px 16px" }}>
            <div style={{ fontFamily: F.u, fontWeight: 600, fontSize: 14, color: C.text, marginBottom: 4 }}>Review & Confirm Sale</div>
            <div style={{ fontFamily: F.u, fontSize: 13, color: C.muted }}>Please verify all details before confirming</div>
          </div>
          <Card style={{ margin: "0 20px 16px", overflow: "hidden" }}>
            <div style={{ height: 4, background: `linear-gradient(90deg, ${C.burg}, ${C.gold})` }} />
            <div style={{ padding: 18 }}>
              {[
                { label: "Saree ID", value: saree.id, mono: true },
                { label: "Design", value: saree.name, mono: false },
                { label: "Customer", value: custName || "Smt. Annapurna Devi", mono: false },
                { label: "Phone", value: `+91 ${phone || "98765 43210"}`, mono: true },
                { label: "Payment", value: payment?.toUpperCase() ?? "UPI", mono: true },
              ].map(({ label, value, mono }, i) => (
                <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12, paddingBottom: 12, borderBottom: `1px solid ${C.bdr}` }}>
                  <span style={{ fontFamily: F.u, fontSize: 12, color: C.muted, flexShrink: 0 }}>{label}</span>
                  <span style={{ fontFamily: mono ? F.m : F.u, fontWeight: 600, fontSize: 13, color: C.text, textAlign: "right" as const, maxWidth: "60%" }}>{value}</span>
                </div>
              ))}
              {canSeePrices && (
                <>
                  {soldPrice !== originalPrice && (
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 4 }}>
                      <span style={{ fontFamily: F.u, fontSize: 12, color: C.muted }}>Original Price</span>
                      <span style={{ fontFamily: F.m, fontSize: 13, color: C.muted, textDecoration: "line-through" }}>{fmtPrice(originalPrice)}</span>
                    </div>
                  )}
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", paddingTop: 4 }}>
                    <span style={{ fontFamily: F.u, fontWeight: 600, fontSize: 14, color: C.text }}>Sold For</span>
                    <span style={{ fontFamily: F.d, fontWeight: 700, fontSize: 30, color: C.burg }}>{fmtPrice(soldPrice)}</span>
                  </div>
                  {priceDiscount > 0 && (
                    <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 8 }}>
                      <Chip label={`Discount: ${fmtPrice(priceDiscount)}`} color="#8B6018" bg="rgba(196,146,58,0.15)" />
                    </div>
                  )}
                </>
              )}
            </div>
          </Card>
          <div style={{ padding: "0 20px", display: "flex", flexDirection: "column" as const, gap: 10 }}>
            {submitError && (
              <div style={{ fontFamily: F.u, fontSize: 12, color: "#C0392B", textAlign: "center" as const, marginBottom: 8 }}>
                {submitError}
              </div>
            )}
            <Btn
              label={isSubmitting ? "Recording Sale…" : "Confirm Sale — Generate Bill"}
              onClick={async () => {
                if (isSubmitting) return;
                setIsSubmitting(true);
                setSubmitError(null);
                try {
                  await salesApi.create({
                    sareeId: saree.id,
                    channel: "RETAIL",
                    amount: soldPrice,
                  });
                  setStep("success");
                } catch (err) {
                  setSubmitError(err instanceof ApiError ? err.message : "Failed to record sale — please try again.");
                } finally {
                  setIsSubmitting(false);
                }
              }}
              style={{ width: "100%", background: isSubmitting ? "#999" : C.green, height: 56, cursor: isSubmitting ? "not-allowed" : "pointer" }}
            />
            <Btn label="← Edit Details" variant="ghost" onClick={() => setStep(3)} style={{ width: "100%" }} />
          </div>
        </div>
      )}
    </div>
  );
}
