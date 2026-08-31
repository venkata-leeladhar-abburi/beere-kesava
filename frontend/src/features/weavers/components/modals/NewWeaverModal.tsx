// ── New weaver registration modal/form ──────────────────────────────────────
// Wired to the real backend: submitting this form calls POST /weavers
// (weaversApi.create) and invalidates every roster query key used across
// AllWeaversPage.tsx and WeaversPage.tsx's card/list/table directory (both
// read the real API) so the new weaver shows up everywhere immediately.
import { useState } from "react";
import { Plus, X } from "lucide-react";
import * as Dialog from "@radix-ui/react-dialog";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { T, F } from "../theme";
import { FadeUp } from "../common/primitives";
import { weaversApi, CreateWeaverPayload, WEAVERS_LIST_QUERY_KEY, type BackendWeaver } from "../../../../shared/api/weavers";
import { Button, Field, Input, NumberInput, IconButton } from "../../../../shared/ui/primitives";
import { PhotoUploadField } from "../../../../shared/ui/PhotoUploadField";
import { Modal } from "../../../../shared/ui/overlay";
import { invalidateQueriesMentioning, prependToEnvelope } from "../../../../lib/cacheUpdates";

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
  photoUrl: string;
}

const EMPTY_FORM: FormState = {
  firstName: "", lastName: "", email: "", phone: "", village: "", looms: "",
  bankName: "", accountNo: "", ifsc: "", photoUrl: "",
};

export function NewWeaverModal({ expanded, setExpanded }: { expanded: boolean; setExpanded: (v: boolean) => void }) {
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [error, setError] = useState<string | null>(null);
  const queryClient = useQueryClient();

  const set = (key: keyof FormState) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm(prev => ({ ...prev, [key]: e.target.value }));

  const createWeaver = useMutation({
    mutationFn: (payload: CreateWeaverPayload) => weaversApi.create(payload),
    onSuccess: (created) => {
      // WEAVERS_LIST_QUERY_KEY is the shared roster BatchContext,
      // WeaverPaymentsContext and useCurrentWeaver all read through, and it
      // caches the raw paginated response that POST /weavers matches — so the
      // new weaver is resolvable everywhere immediately. The other weaver
      // caches hold per-screen derived shapes and are left to the refetch.
      prependToEnvelope<BackendWeaver>(queryClient, WEAVERS_LIST_QUERY_KEY, [created]);
      invalidateQueriesMentioning(queryClient, "weaver");
      setForm(EMPTY_FORM);
      setError(null);
      setExpanded(false);
      toast.success("Weaver registered");
    },
    onError: (err: unknown) => {
      const message = err instanceof Error ? err.message : "Failed to save weaver. Please try again.";
      setError(message);
      toast.error(message);
    },
  });

  const handleSave = () => {
    if (!form.firstName.trim() || !form.lastName.trim() || !form.phone.trim()) {
      setError("First name, last name and mobile number are required.");
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
      email: form.email.trim() || undefined,
      phone: form.phone.trim(),
      village: form.village.trim() || undefined,
      looms,
      photoUrl: form.photoUrl,
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

  const formBody = (
    <>
      {/* ── Photo Upload ── */}
      <div style={{ marginBottom: 32 }}>
        <PhotoUploadField
          labelText="Photo of Weaver"
          helpText="Upload a clear photo for easy identification. Appears on profile and batch records."
          photoUrl={form.photoUrl || null}
          onChange={url => setForm(prev => ({ ...prev, photoUrl: url }))}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2" style={{ gap: 24, marginBottom: 32 }}>
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
          <Field label={<>Email ID<span style={{ fontFamily: F.ui, fontSize: 13, fontWeight: 400, color: T.taupe, marginLeft: 8 }}>Optional — used for records and notifications.</span></>}>
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
      <div className="grid grid-cols-1 md:grid-cols-2" style={{ gap: 24, marginBottom: 24 }}>
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
    </>
  );

  if (expanded) {
    return (
      <Modal open onOpenChange={o => !o && handleCancel()} size="xl">
        <div style={{ background: `linear-gradient(120deg, ${T.royalBurgundy} 0%, ${T.deepWine} 100%)`, padding: "24px 32px", paddingRight: 64, position: "relative", flexShrink: 0 }}>
          <Dialog.Title asChild>
            <div style={{ fontFamily: F.display, fontSize: 22, fontWeight: 700, color: "#FFFDF9" }}>
              New Weaver Registration
            </div>
          </Dialog.Title>
          <Dialog.Description style={{ fontFamily: F.ui, fontSize: 13, color: "rgba(255,253,249,0.85)", marginTop: 4, margin: 0 }}>
            Fill in all the details below. Fields marked with * are required.
          </Dialog.Description>
          <Dialog.Close asChild>
            <IconButton icon={X} label="Close" variant="ghost" size="sm" onClick={handleCancel}
              className="absolute right-6 top-6 rounded-[8px] bg-[rgba(255,255,255,0.12)] text-[rgba(255,255,255,0.85)] hover:bg-[rgba(255,255,255,0.20)]" />
          </Dialog.Close>
        </div>
        <div style={{ padding: "28px 32px 32px", overflowY: "auto", flex: 1, minHeight: 0 }}>
          {formBody}
        </div>
      </Modal>
    );
  }

  return (
    <div style={{ padding: "40px 48px", paddingBottom: 80 }}>
      <FadeUp>
        <div className="max-w-[900px]" style={{ background: "#FFFFFF", borderRadius: 20, border: `1px solid ${T.borderDef}`, padding: "32px", boxShadow: "0 8px 32px rgba(74,6,27,0.06)", margin: "0 auto" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
            <h2 style={{ fontFamily: F.display, fontSize: 30, color: T.luxuryBrown, margin: 0 }}>Add a New Weaver</h2>
            <Button onClick={() => setExpanded(true)} variant="primary" className="rounded-[10px] bg-[#6E0F2D]">Open Form</Button>
          </div>
          <Button onClick={() => setExpanded(true)} variant="primary" size="lg" fullWidth
            className="h-[60px] rounded-2xl bg-[linear-gradient(135deg,#6E0F2D,#4A061B)]">
            <Plus size={20} /> Register New Weaver
          </Button>
        </div>
      </FadeUp>
    </div>
  );
}
