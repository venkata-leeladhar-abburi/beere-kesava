import React from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  UserPlus, CheckCircle2, Shield, Phone, Mail,
  Lock, Hash, ShieldCheck, ShieldHalf, Sparkles, X
} from "lucide-react";
import {
  T, F, EASE, cardStyle,
  ROLE_TO_PORTAL, ROLES, ACCESS_LEVELS, AccessLevel, ACCESS_LEVEL_META,
} from "./theme";
import { SectionTitle, RoleBadge, AccessBadge } from "./UserBadges";
import { Button, Field, Input, Textarea, Select, SelectItem } from "../../../shared/ui/primitives";

interface AddUserFormProps {
  showSuccess: boolean;
  setShowSuccess: (s: boolean) => void;
  createdUser: { name: string; role: string; mobile: string; empId: string; accessLevel?: AccessLevel } | null;
  isFinishing: boolean;
  isAdmin: boolean;
  firstName: string;
  setFirstName: (v: string) => void;
  lastName: string;
  setLastName: (v: string) => void;
  mobile: string;
  setMobile: (v: string) => void;
  email: string;
  setEmail: (v: string) => void;
  role: string;
  setRole: (v: string) => void;
  portal: string;
  autoEmpId: string;
  accessLevel: AccessLevel;
  setAccessLevel: (v: AccessLevel) => void;
  specialisation: string;
  setSpecialisation: (v: string) => void;
  notes: string;
  setNotes: (v: string) => void;
  canSubmit: boolean;
  handleSubmit: () => void;
  handleCancel: () => void;
}

export function AddUserForm({
  showSuccess, setShowSuccess, createdUser, isFinishing, isAdmin,
  firstName, setFirstName, lastName, setLastName, mobile, setMobile,
  email, setEmail, role, setRole, portal, autoEmpId, accessLevel,
  setAccessLevel, specialisation, setSpecialisation, notes, setNotes,
  canSubmit, handleSubmit, handleCancel
}: AddUserFormProps) {
  return (
    <div style={{ ...cardStyle, borderRadius: 20 }}>
      <div style={{ padding: "22px 28px 0" }}>
        <SectionTitle>Add New User</SectionTitle>
      </div>

      <div style={{ padding: "0 28px 28px" }}>
        <AnimatePresence mode="wait">
          {showSuccess ? (
            <motion.div key="success" initial={{ opacity: 0, scale: 0.97, y: 10 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.3, ease: EASE }} style={{ paddingTop: 12 }}>
              <div style={{ background: T.greenBg, border: "1px solid rgba(30,102,64,0.20)", borderRadius: 16, padding: "32px 28px", textAlign: "center" as const, marginBottom: 20 }}>
                <div style={{ width: 64, height: 64, borderRadius: "50%", background: "rgba(30,102,64,0.12)", border: `2px solid ${T.green}`, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 18px" }}>
                  <CheckCircle2 size={32} color={T.green} />
                </div>
                <div style={{ fontFamily: F.display, fontWeight: 700, fontSize: 24, color: T.luxuryBrown, marginBottom: 6 }}>User Account Created</div>
                <div style={{ fontFamily: F.mono, fontSize: 16, fontWeight: 600, color: T.royalBurgundy, marginBottom: 4 }}>{createdUser?.name}</div>
                <div style={{ fontFamily: F.mono, fontSize: 12, color: T.taupe, marginBottom: 16 }}>{createdUser?.empId}</div>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 10, marginBottom: 12, flexWrap: "wrap" as const }}>
                  {createdUser && <RoleBadge role={createdUser.role} />}
                  {createdUser?.accessLevel && <AccessBadge level={createdUser.accessLevel} />}
                  <span style={{ fontFamily: F.mono, fontSize: 12, color: T.taupe }}>Portal: {createdUser && ROLE_TO_PORTAL[createdUser.role]}</span>
                </div>
                <p style={{ fontFamily: F.ui, fontSize: 13, color: T.taupe, margin: 0, lineHeight: 1.65 }}>
                  Login credentials have been sent to <strong style={{ color: T.luxuryBrown }}>{createdUser?.mobile}</strong> via WhatsApp.<br />
                  The user can now log in using their mobile number and OTP.
                </p>
              </div>
              <div style={{ display: "flex", gap: 12 }}>
                <Button size="lg" variant="primary" fullWidth iconLeft={UserPlus} onClick={() => setShowSuccess(false)}>
                  Add Another User
                </Button>
                <Button size="lg" variant="secondary" fullWidth onClick={() => setShowSuccess(false)}>
                  Done
                </Button>
              </div>
            </motion.div>
          ) : (
            <motion.div key="form" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }}>
              <div style={{ height: 1, background: T.borderDef, margin: "0 0 24px" }} />

              {/* Finishing Staff extra-fields callout banner */}
              <AnimatePresence>
                {isFinishing && (
                  <motion.div
                    initial={{ opacity: 0, height: 0, marginBottom: 0 }}
                    animate={{ opacity: 1, height: "auto", marginBottom: 20 }}
                    exit={{ opacity: 0, height: 0, marginBottom: 0 }}
                    transition={{ duration: 0.25, ease: EASE }}
                    style={{ overflow: "hidden" }}
                  >
                    <div style={{ background: "rgba(44,74,139,0.07)", border: "1px solid rgba(44,74,139,0.18)", borderRadius: 12, padding: "12px 16px", display: "flex", alignItems: "center", gap: 10 }}>
                      <Sparkles size={15} color={T.blue} style={{ flexShrink: 0 }} />
                      <span style={{ fontFamily: F.ui, fontSize: 13, color: T.blue }}>
                        Finishing Staff — extra fields (Specialisation) appear below. These are saved to the shared staff directory and visible in the Worker Staff portal for assignment.
                      </span>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px 32px" }}>
                {/* Col 1 */}
                <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
                  <Field label="First Name" required>
                    <Input value={firstName} onChange={e => setFirstName(e.target.value)} placeholder="e.g. Ravi" />
                  </Field>
                  <Field label="Last Name" required>
                    <Input value={lastName} onChange={e => setLastName(e.target.value)} placeholder="e.g. Kumar" />
                  </Field>
                  <Field label="Mobile Number" required hint={
                    <span style={{ display: "flex", alignItems: "center", gap: 5 }}>
                      <Shield size={10} color={T.antiqueGold} /> This number will be used for OTP login via WhatsApp
                    </span>
                  }>
                    <Input value={mobile} onChange={e => setMobile(e.target.value)} placeholder="+91 98765 43210" type="tel" iconLeft={Phone} />
                  </Field>
                  <Field label="Email ID" hint="Optional">
                    <Input value={email} onChange={e => setEmail(e.target.value)} placeholder="name@bksilks.com" type="email" iconLeft={Mail} />
                  </Field>
                </div>

                {/* Col 2 */}
                <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
                  {/* Role */}
                  <Field label="Role" required>
                    <Select value={role} onValueChange={setRole} placeholder="Select a role…">
                      {ROLES.map(r => <SelectItem key={r} value={r}>{r}</SelectItem>)}
                    </Select>
                    {role && <div style={{ marginTop: 8 }}><RoleBadge role={role} /></div>}
                  </Field>

                  {/* Portal Access — auto-filled */}
                  <Field label="Portal Access" hint="Auto-filled">
                    <Input readOnly value={portal || "Determined by selected role"} iconLeft={Lock}
                      className="bg-[rgba(245,232,208,0.40)] cursor-default" />
                  </Field>

                  {/* Employee ID — auto-generated */}
                  <Field label="Employee ID" hint="Assigned automatically as the next ID in sequence.">
                    <Input readOnly value={autoEmpId} iconLeft={Hash}
                      className="bg-[rgba(245,232,208,0.40)] cursor-default font-code font-semibold" />
                  </Field>

                  {/* Access Level — Admin only */}
                  <AnimatePresence>
                    {isAdmin && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.22, ease: EASE }}
                        style={{ overflow: "hidden" }}
                      >
                        <div className="bk-label-lg flex items-baseline gap-1">Admin Access Level <span style={{ color: T.crimson }}>*</span></div>
                        <div style={{ display: "flex", gap: 8, marginTop: 6 }}>
                          {ACCESS_LEVELS.map(lvl => {
                            const on = accessLevel === lvl;
                            const IconCmp = lvl === "Full Access" ? ShieldCheck : ShieldHalf;
                            return (
                              <Button key={lvl} type="button" size="sm" fullWidth
                                variant={on ? "secondary" : "tertiary"}
                                iconLeft={IconCmp}
                                onClick={() => setAccessLevel(lvl)}
                              >{lvl}</Button>
                            );
                          })}
                        </div>
                        <div style={{ fontFamily: F.ui, fontSize: 12, color: T.taupe, marginTop: 6, lineHeight: 1.5 }}>{ACCESS_LEVEL_META[accessLevel].desc}</div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Specialisation — Finishing Staff only */}
                  <AnimatePresence>
                    {isFinishing && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.22, ease: EASE }}
                        style={{ overflow: "hidden" }}
                      >
                        <Field label="Specialisation" hint="Optional">
                          <Input
                            value={specialisation}
                            onChange={e => setSpecialisation(e.target.value)}
                            placeholder="e.g. Silk finishing, Zari polishing"
                            iconLeft={Sparkles}
                          />
                        </Field>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Notes */}
                  <Field label="Notes" hint="Optional">
                    <Textarea value={notes} onChange={e => setNotes(e.target.value)} placeholder={isFinishing ? "Any additional info about this finishing staff member…" : "Any additional notes for this user…"} rows={3} />
                  </Field>
                </div>
              </div>

              <div style={{ height: 1, background: T.borderDef, margin: "24px 0" }} />

              <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
                <Button size="lg" variant="primary" iconLeft={UserPlus} onClick={handleSubmit} disabled={!canSubmit}>
                  Create User Account
                </Button>
                <Button size="lg" variant="secondary" iconLeft={X} onClick={handleCancel}>
                  Cancel
                </Button>
                {!canSubmit && <span style={{ fontFamily: F.ui, fontSize: 12, color: T.taupe, marginLeft: 4 }}>Fill in all required fields to continue</span>}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
