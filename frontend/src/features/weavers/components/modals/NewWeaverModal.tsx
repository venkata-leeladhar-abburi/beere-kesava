// ── New weaver registration modal/form ──────────────────────────────────────
// Wired to the real backend: submitting this form calls POST /weavers
// (weaversApi.create) and invalidates the "weavers-directory" query used by
// AllWeaversPage.tsx so the new weaver shows up there. Note: WeaversPage.tsx's
// own card/list/table directory still renders the static mock roster in
// data.ts (see comment there) — that migration is out of scope here — so a
// weaver registered from this modal will appear on AllWeaversPage but not
// yet in the WeaversPage directory views.
import React, { useState } from "react";
import { motion } from "motion/react";
import { Plus, Camera } from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { T, F } from "../theme";
import { FadeUp } from "../common/primitives";
import { weaversApi, CreateWeaverPayload } from "../../../../shared/api/weavers";
import { Button, Field, Input, NumberInput } from "../../../../shared/ui/primitives";

interface FormState {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  village: string;
  looms: string;
  bankName: string;
  accountNo: string;
  ifsc: string;
}

const EMPTY_FORM: FormState = {
  firstName: "", lastName: "", email: "", phone: "", village: "", looms: "",
  bankName: "", accountNo: "", ifsc: "",
};

export function NewWeaverModal({ expanded, setExpanded }: { expanded: boolean; setExpanded: (v: boolean) => void }) {
  const labelStyle: React.CSSProperties = { fontFamily: F.ui, fontSize: 14, fontWeight: 600, color: T.luxuryBrown, display: "block", marginBottom: 8 };

  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [error, setError] = useState<string | null>(null);
  const queryClient = useQueryClient();

  const set = (key: keyof FormState) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm(prev => ({ ...prev, [key]: e.target.value }));

  const createWeaver = useMutation({
    mutationFn: (payload: CreateWeaverPayload) => weaversApi.create(payload),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["weavers-directory"] });
      void queryClient.invalidateQueries({ queryKey: ["weavers-table-roster"] });
      void queryClient.invalidateQueries({ queryKey: ["weavers-card-roster"] });
      void queryClient.invalidateQueries({ queryKey: ["weavers-page-roster"] });
      setForm(EMPTY_FORM);
      setError(null);
      setExpanded(false);
    },
    onError: (err: unknown) => {
      setError(err instanceof Error ? err.message : "Failed to save weaver. Please try again.");
    },
  });

  const handleSave = () => {
    if (!form.firstName.trim() || !form.lastName.trim() || !form.email.trim() || !form.phone.trim()) {
      setError("First name, last name, email and mobile number are required.");
      return;
    }
    const looms = form.looms.trim() ? Number(form.looms) : undefined;
    if (form.looms.trim() && (Number.isNaN(looms) || (looms ?? 0) < 0)) {
      setError("Number of looms must be a valid non-negative number.");
      return;
    }
    createWeaver.mutate({
      firstName: form.firstName.trim(),
      lastName: form.lastName.trim(),
      email: form.email.trim(),
      phone: form.phone.trim(),
      village: form.village.trim() || undefined,
      looms,
      photoUrl: "",
      bankName: form.bankName.trim() || undefined,
      accountNo: form.accountNo.trim() || undefined,
      ifsc: form.ifsc.trim() || undefined,
    });
  };

  const handleCancel = () => {
    setForm(EMPTY_FORM);
    setError(null);
    setExpanded(false);
  };

  return (
    <div style={expanded ? { position: "fixed", inset: 0, zIndex: 1250, background: "rgba(26,10,15,0.42)", backdropFilter: "blur(4px)", padding: "32px 48px", overflowY: "auto" } : { padding: "40px 48px", paddingBottom: 80 }}>
      <FadeUp>
        <div style={{ background: "#FFFFFF", borderRadius: 20, border: `1px solid ${T.borderDef}`, padding: "32px", boxShadow: expanded ? "0 30px 90px rgba(0,0,0,0.25)" : "0 8px 32px rgba(74,6,27,0.06)", maxWidth: 900, margin: expanded ? "24px auto" : "0 auto" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
            <h2 style={{ fontFamily: F.display, fontSize: 30, color: T.luxuryBrown, margin: 0 }}>Add a New Weaver</h2>
            {!expanded && <Button onClick={() => setExpanded(true)} variant="primary" className="rounded-[10px] bg-[#6E0F2D]">Open Form</Button>}
            {expanded && <Button onClick={handleCancel} variant="ghost" className="text-[var(--text-tertiary)]">Cancel ×</Button>}
          </div>

          {!expanded ? (
            <Button onClick={() => setExpanded(true)} variant="primary" size="lg" fullWidth
              className="h-[60px] rounded-2xl bg-[linear-gradient(135deg,#6E0F2D,#4A061B)]">
              <Plus size={20} /> Register New Weaver
            </Button>
          ) : (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} style={{ overflow: "hidden" }}>
              <div style={{ fontFamily: F.display, fontSize: 30, color: T.luxuryBrown, marginBottom: 8 }}>New Weaver Registration</div>
              <div style={{ fontFamily: F.ui, fontSize: 16, color: T.taupe, marginBottom: 32 }}>Fill in all the details below. Fields marked with * are required.</div>

              {/* ── Photo Upload ── */}
              <div style={{ marginBottom: 32 }}>
                <label style={labelStyle}>Photo of Weaver</label>
                <div style={{ fontFamily: F.ui, fontSize: 13, color: T.taupe, marginBottom: 14, marginTop: -4 }}>
                  Upload a clear photo for easy identification. Appears on profile and batch records.
                  {" "}(Photo upload isn't wired yet — the weaver will be saved without a photo.)
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 24 }}>
                  <div style={{
                    width: 120, height: 120, borderRadius: "50%",
                    border: "2px dashed rgba(110,15,45,0.25)",
                    background: "rgba(110,15,45,0.04)",
                    display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
                    cursor: "not-allowed", flexShrink: 0,
                  }}>
                    <Camera size={28} color="rgba(110,15,45,0.35)" strokeWidth={1.5} />
                    <span style={{ fontFamily: F.ui, fontSize: 12, color: "rgba(110,15,45,0.45)", marginTop: 8, fontWeight: 600 }}>Upload Photo</span>
                  </div>
                  <div style={{ fontFamily: F.ui, fontSize: 13, color: T.taupe, lineHeight: 1.6 }}>
                    JPG or PNG · Max 5MB
                  </div>
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24, marginBottom: 32 }}>
                {/* First / Last name split */}
                <Field label="First Name *">
                  <Input placeholder="First name" value={form.firstName} onChange={set("firstName")} />
                </Field>
                <Field label="Last Name *">
                  <Input placeholder="Last name" value={form.lastName} onChange={set("lastName")} />
                </Field>
                <div style={{ gridColumn: "1 / -1" }}>
                  <div style={{ fontFamily: F.ui, fontSize: 13, color: T.taupe, marginTop: -16, marginBottom: 20 }}>
                    The weaver will be identified by their first name in all batch IDs and saree records.
                  </div>
                </div>
                {/* Email */}
                <div style={{ gridColumn: "1 / -1" }}>
                  <Field label={<>Email ID *<span style={{ fontFamily: F.ui, fontSize: 13, fontWeight: 400, color: T.taupe, marginLeft: 8 }}>Used for records and notifications.</span></>}>
                    <Input type="email" placeholder="weaver@example.com" value={form.email} onChange={set("email")} />
                  </Field>
                </div>
                <Field label="Mobile Number *"><Input placeholder="10-digit mobile number" value={form.phone} onChange={set("phone")} /></Field>
                <Field label="Village / Area"><Input placeholder="E.g., Dharmavaram, AP" value={form.village} onChange={set("village")} /></Field>
                <Field label="Number of Looms">
                  <NumberInput min={0} placeholder="Total active looms" value={form.looms === "" ? "" : Number(form.looms)} onValueChange={v => setForm(prev => ({ ...prev, looms: v === "" ? "" : String(v) }))} />
                </Field>
              </div>

              <div style={{ fontFamily: F.ui, fontWeight: 600, fontSize: 18, color: T.luxuryBrown, marginBottom: 20, paddingTop: 8, borderTop: `1px solid ${T.borderDef}` }}>
                Bank Account Details
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24, marginBottom: 24 }}>
                <Field label="Bank Name"><Input placeholder="E.g., State Bank of India" value={form.bankName} onChange={set("bankName")} /></Field>
                <Field label="Account Number"><Input placeholder="Account number" value={form.accountNo} onChange={set("accountNo")} /></Field>
                <Field label="IFSC Code"><Input placeholder="11-character IFSC code" value={form.ifsc} onChange={set("ifsc")} /></Field>
              </div>

              {error && (
                <div style={{ fontFamily: F.ui, fontSize: 14, color: "#C0392B", background: "rgba(192,57,43,0.08)", border: "1px solid rgba(192,57,43,0.2)", borderRadius: 10, padding: "10px 14px", marginBottom: 20 }}>
                  {error}
                </div>
              )}

              <div style={{ display: "flex", gap: 16, justifyContent: "flex-end", borderTop: `1px solid ${T.borderDef}`, paddingTop: 32 }}>
                <Button onClick={handleCancel} variant="secondary" size="lg" className="w-[140px] h-14 rounded-xl">
                  Cancel
                </Button>
                <Button onClick={handleSave} disabled={createWeaver.isPending} loading={createWeaver.isPending} variant="primary" size="lg"
                  className="w-[240px] h-14 rounded-xl bg-[#6E0F2D]">
                  {createWeaver.isPending ? "Saving…" : "Save Weaver"}
                </Button>
              </div>
            </motion.div>
          )}
        </div>
      </FadeUp>
    </div>
  );
}
