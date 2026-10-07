import { useRef, useEffect } from "react";
import { motion } from "motion/react";
import { Search, PhoneCall, UserPlus, Pencil, Check, MapPin, ArrowLeft } from "lucide-react";
import { C, F } from "./theme";
import { StepHeader, StepBody, FlowActions, ACCENT_SALE } from "./flow-kit";
import {
  Button,
  Input,
  PhoneInput,
  PHONE_DIGITS,
  Textarea,
} from "../../../../shared/ui/primitives";
import { toInitials } from "@/shared/lib/initials";

/**
 * Phone is optional on a counter sale — a walk-in who won't leave a number
 * still gets a bill, recorded and sent to the admin feed. One that is typed
 * must be a full 10-digit mobile, or the WhatsApp send on the success screen
 * fails later.
 */
export function isPhoneEntryComplete(phone: string): boolean {
  const p = phone.trim();
  return p === "" || p.length === PHONE_DIGITS;
}

export interface Customer {
  id: string;
  name: string;
  /** "" when the customer has no phone on file. */
  phone: string;
  purchases: number;
  total: string;
  lastPurchase: string;
  initials: string;
}

interface CustomerSelectStepProps {
  custSearch: string;
  setCustSearch: (v: string) => void;
  showCustomerList: boolean;
  setShowCustomerList: (v: boolean) => void;
  selectedCustomer: Customer | null;
  setSelectedCustomer: (c: Customer | null) => void;
  filteredCustomers: Customer[];
  customersLoading?: boolean;
  isEditingCustomer: boolean;
  setIsEditingCustomer: (v: boolean) => void;
  isNewCustomer: boolean;
  setIsNewCustomer: (v: boolean) => void;
  custName: string;
  setCustName: (v: string) => void;
  phone: string;
  setPhone: (v: string) => void;
  custAddress: string;
  setCustAddress: (v: string) => void;
  isMobile?: boolean;
  handleSelectCustomer: (c: Customer) => void;
  handleAddNew: () => void;
  canProceedStep1: boolean;
  onNext: () => void;
}

export function CustomerSelectStep({
  custSearch,
  setCustSearch,
  showCustomerList,
  setShowCustomerList,
  selectedCustomer,
  setSelectedCustomer,
  filteredCustomers,
  customersLoading,
  isEditingCustomer,
  setIsEditingCustomer,
  isNewCustomer,
  setIsNewCustomer,
  custName,
  setCustName,
  phone,
  setPhone,
  custAddress,
  setCustAddress,
  isMobile,
  handleSelectCustomer,
  handleAddNew,
  canProceedStep1,
  onNext,
}: CustomerSelectStepProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const phoneIncomplete = !isPhoneEntryComplete(phone);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setShowCustomerList(false);
      }
    };
    if (showCustomerList) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showCustomerList, setShowCustomerList]);

  return (
    <>
      <StepBody>
        <StepHeader
          title="Who is buying?"
          subtitle="Search an existing customer by name or phone — their details fill in automatically. Otherwise add a new one."
        />

        {/* Customer Search Input */}
        {!isNewCustomer && (
          <div
            ref={containerRef}
            style={{ marginBottom: 20, position: "relative" as const, zIndex: 50 }}
          >
            <div style={{ position: "relative" as const }}>
              <Input
                value={custSearch}
                onChange={(e) => {
                  setCustSearch(e.target.value);
                  setShowCustomerList(true);
                  if (selectedCustomer) setSelectedCustomer(null);
                }}
                onFocus={() => setShowCustomerList(true)}
                placeholder="Search by name or phone number..."
                size="lg"
                iconLeft={Search}
                iconRight={PhoneCall}
              />
            </div>

            {/* Customer dropdown */}
            {showCustomerList && !selectedCustomer && (
              <div
                style={{
                  position: "absolute",
                  top: "calc(100% + 8px)",
                  left: 0,
                  right: 0,
                  background: C.white,
                  border: `1px solid ${C.bdr}`,
                  borderRadius: 16,
                  boxShadow: "0 12px 40px rgba(74,6,27,0.12)",
                  overflow: "hidden",
                }}
              >
                <div
                  style={{
                    padding: "16px 20px",
                    background: "#FDFBF7",
                    borderBottom: `1px solid rgba(0,0,0,0.04)`,
                  }}
                >
                  <span
                    style={{
                      fontFamily: F.m,
                      fontSize: 12,
                      letterSpacing: 1.5,
                      color: C.muted,
                      textTransform: "uppercase" as const,
                    }}
                  >
                    {customersLoading
                      ? "Loading…"
                      : custSearch.length >= 2
                        ? `${filteredCustomers.length} result${filteredCustomers.length !== 1 ? "s" : ""} for "${custSearch}"`
                        : "Recent Customers"}
                  </span>
                </div>
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    padding: 12,
                    gap: 8,
                    maxHeight: 320,
                    overflowY: "auto",
                  }}
                >
                  {customersLoading ? (
                    <div
                      style={{
                        padding: "24px",
                        fontFamily: F.u,
                        fontSize: 14,
                        color: C.muted,
                        textAlign: "center" as const,
                      }}
                    >
                      Loading customers…
                    </div>
                  ) : filteredCustomers.length > 0 ? (
                    filteredCustomers.map((c) => (
                      <Button
                        key={c.id}
                        variant="tertiary"
                        fullWidth
                        onClick={() => handleSelectCustomer(c)}
                        className="justify-start gap-4 rounded-xl border-0 px-4 py-3.5 hover:bg-[rgba(110,15,45,0.04)] transition-colors"
                      >
                        <div
                          style={{
                            width: 44,
                            height: 44,
                            borderRadius: "50%",
                            background: `linear-gradient(135deg, ${C.burg}, ${C.dark})`,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            flexShrink: 0,
                          }}
                        >
                          <span
                            style={{
                              fontFamily: F.u,
                              fontWeight: 700,
                              fontSize: 14,
                              color: "#FFF",
                            }}
                          >
                            {toInitials(c.initials)}
                          </span>
                        </div>
                        <div style={{ flex: 1, textAlign: "left" as const }}>
                          <div
                            style={{
                              fontFamily: F.u,
                              fontWeight: 700,
                              fontSize: 14,
                              color: C.text,
                            }}
                          >
                            {c.name}
                          </div>
                          <div
                            style={{ fontFamily: F.m, fontSize: 13, color: C.muted, marginTop: 2 }}
                          >
                            {c.phone ? `+91 ${c.phone}` : "No phone"}
                          </div>
                        </div>
                        <div style={{ textAlign: "right" as const, flexShrink: 0 }}>
                          <div
                            style={{
                              fontFamily: F.u,
                              fontSize: 13,
                              fontWeight: 500,
                              color: C.text,
                            }}
                          >
                            {c.purchases} purchases
                          </div>
                          <div
                            style={{
                              fontFamily: F.u,
                              fontSize: 12,
                              fontWeight: 600,
                              color: C.gold,
                              marginTop: 2,
                            }}
                          >
                            {c.lastPurchase}
                          </div>
                        </div>
                      </Button>
                    ))
                  ) : (
                    <div style={{ padding: "24px", textAlign: "center" as const }}>
                      <div style={{ fontFamily: F.u, fontSize: 14, color: C.muted }}>
                        No customer found for "{custSearch}"
                      </div>
                    </div>
                  )}
                </div>
                {/* Add new customer option */}
                <div style={{ padding: "0 12px 12px 12px" }}>
                  <Button
                    variant="tertiary"
                    fullWidth
                    onClick={handleAddNew}
                    className="justify-start gap-3.5 rounded-xl border-0 bg-[rgba(110,15,45,0.04)] px-4 py-3.5 hover:bg-[rgba(110,15,45,0.08)] transition-colors"
                  >
                    <div
                      style={{
                        width: 36,
                        height: 36,
                        borderRadius: "50%",
                        background: "rgba(110,15,45,0.08)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <UserPlus size={16} color={C.burg} />
                    </div>
                    <span style={{ fontFamily: F.u, fontWeight: 700, fontSize: 14, color: C.burg }}>
                      Add New Customer
                    </span>
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Selected customer card */}
        {selectedCustomer && !isEditingCustomer && (
          <motion.div
            key="selected-cust"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <div
              style={{
                background: "#FFFFFF",
                borderRadius: 12,
                border: `1px solid ${C.bdr}`,
                padding: "20px",
                marginBottom: 16,
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "flex-start",
                  justifyContent: "space-between",
                  marginBottom: 16,
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <div
                    style={{
                      width: 48,
                      height: 48,
                      borderRadius: "50%",
                      background: `linear-gradient(135deg, ${C.burg}, ${C.dark})`,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flexShrink: 0,
                    }}
                  >
                    <span style={{ fontFamily: F.u, fontWeight: 700, fontSize: 15, color: "#FFF" }}>
                      {toInitials(selectedCustomer.initials)}
                    </span>
                  </div>
                  <div>
                    <div style={{ fontFamily: F.u, fontWeight: 700, fontSize: 15, color: C.text }}>
                      {selectedCustomer.name}
                    </div>
                    <div style={{ fontFamily: F.m, fontSize: 13, color: C.muted, marginTop: 2 }}>
                      {selectedCustomer.phone ? `+91 ${selectedCustomer.phone}` : "No phone"}
                    </div>
                  </div>
                </div>
                <Button
                  variant="secondary"
                  size="sm"
                  iconLeft={Pencil}
                  onClick={() => setIsEditingCustomer(true)}
                >
                  Edit
                </Button>
              </div>

              <div
                className="grid-cols-1 md:grid-cols-3"
                style={{ display: "grid", gap: 12, marginBottom: 16 }}
              >
                {[
                  { val: String(selectedCustomer.purchases), label: "Purchases", color: C.text },
                  { val: selectedCustomer.total, label: "Lifetime", color: C.text },
                  { val: selectedCustomer.lastPurchase, label: "Last Visit", color: C.text },
                ].map((s) => (
                  <div
                    key={s.label}
                    style={{
                      background: "#FDFBF7",
                      border: `1px solid ${C.bdr}`,
                      borderRadius: 10,
                      padding: "12px 14px",
                      textAlign: "center" as const,
                    }}
                  >
                    <div
                      style={{
                        fontFamily: F.d,
                        fontWeight: 700,
                        fontSize: 15,
                        color: s.color,
                        lineHeight: 1.3,
                      }}
                    >
                      {s.val}
                    </div>
                    <div
                      style={{
                        fontFamily: F.u,
                        fontSize: 12,
                        fontWeight: 600,
                        color: C.muted,
                        marginTop: 4,
                        textTransform: "uppercase" as const,
                      }}
                    >
                      {s.label}
                    </div>
                  </div>
                ))}
              </div>

              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  background: "#FDFBF7",
                  border: `1px solid ${C.bdr}`,
                  borderRadius: 8,
                  padding: "10px 14px",
                }}
              >
                <Check size={14} color={C.green} />
                <span style={{ fontFamily: F.u, fontSize: 13, fontWeight: 600, color: C.muted }}>
                  Existing customer — details filled automatically
                </span>
              </div>
            </div>
          </motion.div>
        )}

        {/* Edit existing or new customer form */}
        {(isEditingCustomer || isNewCustomer) && (
          <motion.div key="cust-form" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
            <div>
              {isNewCustomer && (
                <div
                  style={{
                    background: "rgba(200,155,71,0.10)",
                    border: `1px solid ${C.gold}`,
                    borderRadius: 10,
                    padding: "10px 14px",
                    marginBottom: 14,
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                  }}
                >
                  <UserPlus size={14} color={C.gold} />
                  <span style={{ fontFamily: F.u, fontSize: 12, color: "#8B6520" }}>
                    New Customer — A profile will be created after this sale
                  </span>
                </div>
              )}
              {isEditingCustomer && (
                <div
                  style={{
                    background: "rgba(110,15,45,0.06)",
                    border: `1px solid ${C.bdr}`,
                    borderRadius: 10,
                    padding: "10px 14px",
                    marginBottom: 14,
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                  }}
                >
                  <Pencil size={14} color={C.burg} />
                  <span style={{ fontFamily: F.u, fontSize: 12, color: C.burg }}>
                    Editing {selectedCustomer?.name}'s details
                  </span>
                </div>
              )}
              <div
                style={{
                  display: isMobile ? "block" : "grid",
                  gridTemplateColumns: isMobile ? undefined : "1fr 1fr",
                  gap: isMobile ? 0 : 16,
                }}
              >
                <div style={{ marginBottom: 14 }}>
                  <label
                    htmlFor="cust-name"
                    style={{
                      fontFamily: F.u,
                      fontWeight: 500,
                      fontSize: 13,
                      color: C.text,
                      display: "block",
                      marginBottom: 8,
                    }}
                  >
                    Full Name
                  </label>
                  <Input
                    id="cust-name"
                    value={custName}
                    onChange={(e) => setCustName(e.target.value)}
                    placeholder="e.g. Smt. Annapurna Devi"
                    size="lg"
                    className="w-full"
                  />
                </div>
                <div style={{ marginBottom: 14 }}>
                  <label
                    htmlFor="cust-phone"
                    style={{
                      fontFamily: F.u,
                      fontWeight: 500,
                      fontSize: 13,
                      color: C.text,
                      display: "block",
                      marginBottom: 8,
                    }}
                  >
                    Phone Number <span style={{ color: C.muted, fontWeight: 400 }}>(Optional)</span>
                  </label>
                  <PhoneInput
                    id="cust-phone"
                    value={phone}
                    onValueChange={setPhone}
                    placeholder="10-digit mobile number"
                    size="lg"
                    className="w-full font-mono"
                    invalid={phoneIncomplete}
                    aria-describedby={phoneIncomplete ? "cust-phone-error" : undefined}
                  />
                  {phoneIncomplete && (
                    <div
                      id="cust-phone-error"
                      style={{ fontFamily: F.u, fontSize: 12, color: C.crim, marginTop: 6 }}
                    >
                      Enter all 10 digits, or leave it empty
                    </div>
                  )}
                </div>
              </div>
              <div style={{ marginBottom: 14 }}>
                <label
                  htmlFor="customer-address"
                  style={{
                    fontFamily: F.u,
                    fontWeight: 500,
                    fontSize: 13,
                    color: C.text,
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                    marginBottom: 8,
                  }}
                >
                  <MapPin size={14} color={C.muted} /> Address{" "}
                  <span style={{ color: C.muted, fontWeight: 400 }}>(Optional)</span>
                </label>
                <Textarea
                  id="customer-address"
                  value={custAddress}
                  onChange={(e) => setCustAddress(e.target.value)}
                  placeholder="Door number, street, city..."
                  rows={2}
                  className="w-full resize-none"
                />
              </div>
              {isEditingCustomer && (
                <Button
                  variant="secondary"
                  onClick={() => setIsEditingCustomer(false)}
                  iconLeft={ArrowLeft}
                  className="mb-4"
                >
                  Cancel — keep original details
                </Button>
              )}
              {isNewCustomer && (
                <Button
                  variant="secondary"
                  onClick={() => {
                    setIsNewCustomer(false);
                    setCustSearch("");
                  }}
                  iconLeft={ArrowLeft}
                  className="mb-4"
                >
                  Search existing customers instead
                </Button>
              )}
            </div>
          </motion.div>
        )}

        {/* Shortcut if no customer selected */}
        {!selectedCustomer && !isNewCustomer && !showCustomerList && (
          <div style={{ marginTop: 4 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 12 }}>
              <div style={{ flex: 1, height: 1, background: C.bdr }} />
              <span style={{ fontFamily: F.u, fontSize: 12, color: C.muted }}>or</span>
              <div style={{ flex: 1, height: 1, background: C.bdr }} />
            </div>
            <Button
              variant="secondary"
              fullWidth
              iconLeft={UserPlus}
              onClick={handleAddNew}
              className="h-[50px] rounded-xl border-[1.5px] border-dashed border-[rgba(110,15,45,0.30)] bg-transparent text-[#6E0F2D]"
            >
              Add New Customer
            </Button>
          </div>
        )}
      </StepBody>

      <FlowActions
        accent={ACCENT_SALE}
        primaryLabel="Next — Scan Saree"
        onPrimary={onNext}
        primaryDisabled={!canProceedStep1}
        hint={
          phoneIncomplete
            ? "Finish the phone number, or clear it"
            : "Pick a customer, or add a new one — only a name is needed"
        }
      />
    </>
  );
}
