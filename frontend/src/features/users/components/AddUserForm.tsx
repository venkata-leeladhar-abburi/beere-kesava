import React from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  UserPlus, CheckCircle2, Shield, Phone, Mail,
  ChevronDown, Lock, Hash, ShieldCheck, ShieldHalf, Sparkles, FileText, X
} from "lucide-react";
import {
  T, F, EASE, cardStyle, inputStyle, labelStyle,
  ROLE_TO_PORTAL, ROLES, ACCESS_LEVELS, AccessLevel, ACCESS_LEVEL_META,
  FieldFocus, FieldBlur
} from "./theme";
import { SectionTitle, RoleBadge, AccessBadge } from "./UserBadges";

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
                <button onClick={() => setShowSuccess(false)} style={{ flex: 1, height: 50, background: `linear-gradient(135deg, #6E0F2D 0%, #4A061B 100%)`, border: "none", borderRadius: 999, fontFamily: F.ui, fontWeight: 600, fontSize: 14, color: "#FFF", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
                  <UserPlus size={16} /> Add Another User
                </button>
                <button onClick={() => setShowSuccess(false)} style={{ flex: 1, height: 50, background: "transparent", border: `1px solid ${T.borderMed}`, borderRadius: 999, fontFamily: F.ui, fontWeight: 600, fontSize: 14, color: T.royalBurgundy, cursor: "pointer" }}>
                  Done
                </button>
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
                  <div>
                    <label style={labelStyle}>First Name <span style={{ color: T.crimson }}>*</span></label>
                    <input value={firstName} onChange={e => setFirstName(e.target.value)} placeholder="e.g. Ravi" style={inputStyle} onFocus={FieldFocus} onBlur={FieldBlur} />
                  </div>
                  <div>
                    <label style={labelStyle}>Last Name <span style={{ color: T.crimson }}>*</span></label>
                    <input value={lastName} onChange={e => setLastName(e.target.value)} placeholder="e.g. Kumar" style={inputStyle} onFocus={FieldFocus} onBlur={FieldBlur} />
                  </div>
                  <div>
                    <label style={labelStyle}>Mobile Number <span style={{ color: T.crimson }}>*</span></label>
                    <div style={{ position: "relative" }}>
                      <Phone size={14} color={T.taupe} style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", pointerEvents: "none" }} />
                      <input value={mobile} onChange={e => setMobile(e.target.value)} placeholder="+91 98765 43210" type="tel" style={{ ...inputStyle, paddingLeft: 36 }} onFocus={FieldFocus} onBlur={FieldBlur} />
                    </div>
                    <div style={{ fontFamily: F.ui, fontSize: 12, color: T.taupe, marginTop: 5, display: "flex", alignItems: "center", gap: 5 }}>
                      <Shield size={10} color={T.antiqueGold} /> This number will be used for OTP login via WhatsApp
                    </div>
                  </div>
                  <div>
                    <label style={labelStyle}>Email ID <span style={{ color: T.taupe, fontWeight: 400 }}>— Optional</span></label>
                    <div style={{ position: "relative" }}>
                      <Mail size={14} color={T.taupe} style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", pointerEvents: "none" }} />
                      <input value={email} onChange={e => setEmail(e.target.value)} placeholder="name@bksilks.com" type="email" style={{ ...inputStyle, paddingLeft: 36 }} onFocus={FieldFocus} onBlur={FieldBlur} />
                    </div>
                  </div>
                </div>

                {/* Col 2 */}
                <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
                  {/* Role */}
                  <div>
                    <label style={labelStyle}>Role <span style={{ color: T.crimson }}>*</span></label>
                    <div style={{ position: "relative" }}>
                      <select value={role} onChange={e => setRole(e.target.value)} style={{ ...inputStyle, appearance: "none", cursor: "pointer", paddingRight: 36 }} onFocus={FieldFocus} onBlur={FieldBlur}>
                        <option value="">Select a role…</option>
                        {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
                      </select>
                      <ChevronDown size={14} color={T.taupe} style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", pointerEvents: "none" }} />
                    </div>
                    {role && <div style={{ marginTop: 8 }}><RoleBadge role={role} /></div>}
                  </div>

                  {/* Portal Access — auto-filled */}
                  <div>
                    <label style={labelStyle}>Portal Access <span style={{ color: T.taupe, fontWeight: 400 }}>— Auto-filled</span></label>
                    <div style={{ position: "relative" }}>
                      <Lock size={14} color={T.taupe} style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)" }} />
                      <input readOnly value={portal || "Determined by selected role"} style={{ ...inputStyle, paddingLeft: 36, background: "rgba(245,232,208,0.40)", color: portal ? T.royalBurgundy : T.taupe, cursor: "default", fontWeight: portal ? 500 : 400 }} />
                    </div>
                  </div>

                  {/* Employee ID — auto-generated */}
                  <div>
                    <label style={labelStyle}>Employee ID <span style={{ color: T.taupe, fontWeight: 400 }}>— Auto-generated</span></label>
                    <div style={{ position: "relative" }}>
                      <Hash size={14} color={T.taupe} style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)" }} />
                      <input readOnly value={autoEmpId} style={{ ...inputStyle, paddingLeft: 36, background: "rgba(245,232,208,0.40)", color: T.royalBurgundy, cursor: "default", fontFamily: F.mono, fontWeight: 600 }} />
                    </div>
                    <div style={{ fontFamily: F.ui, fontSize: 12, color: T.taupe, marginTop: 5 }}>Assigned automatically as the next ID in sequence.</div>
                  </div>

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
                        <label style={labelStyle}>Admin Access Level <span style={{ color: T.crimson }}>*</span></label>
                        <div style={{ display: "flex", gap: 8 }}>
                          {ACCESS_LEVELS.map(lvl => {
                            const on = accessLevel === lvl;
                            const m = ACCESS_LEVEL_META[lvl];
                            const Icon = lvl === "Full Access" ? ShieldCheck : ShieldHalf;
                            return (
                              <button key={lvl} type="button" onClick={() => setAccessLevel(lvl)}
                                style={{ flex: 1, display: "flex", alignItems: "center", gap: 7, padding: "9px 12px", borderRadius: 10, cursor: "pointer", background: on ? m.bg : "#FFF8F0", border: `1.5px solid ${on ? m.border : "rgba(110,15,45,0.14)"}`, fontFamily: F.ui, fontSize: 12, fontWeight: 600, color: on ? m.color : T.taupe, transition: "all 0.15s" }}>
                                <Icon size={14} color={on ? m.color : T.taupe} /> {lvl}
                              </button>
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
                        <label style={labelStyle}>
                          Specialisation <span style={{ color: T.taupe, fontWeight: 400 }}>— Optional</span>
                        </label>
                        <div style={{ position: "relative" }}>
                          <Sparkles size={14} color={T.blue} style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", pointerEvents: "none" }} />
                          <input
                            value={specialisation}
                            onChange={e => setSpecialisation(e.target.value)}
                            placeholder="e.g. Silk finishing, Zari polishing"
                            style={{ ...inputStyle, paddingLeft: 36 }}
                            onFocus={FieldFocus} onBlur={FieldBlur}
                          />
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Notes */}
                  <div>
                    <label style={labelStyle}>Notes <span style={{ color: T.taupe, fontWeight: 400 }}>— Optional</span></label>
                    <div style={{ position: "relative" }}>
                      <FileText size={14} color={T.taupe} style={{ position: "absolute", left: 12, top: 12, pointerEvents: "none" }} />
                      <textarea value={notes} onChange={e => setNotes(e.target.value)} placeholder={isFinishing ? "Any additional info about this finishing staff member…" : "Any additional notes for this user…"} rows={3} style={{ ...inputStyle, paddingLeft: 36, resize: "none" as const, lineHeight: 1.55 }} onFocus={FieldFocus} onBlur={FieldBlur} />
                    </div>
                  </div>
                </div>
              </div>

              <div style={{ height: 1, background: T.borderDef, margin: "24px 0" }} />

              <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
                <motion.button whileHover={{ scale: canSubmit ? 1.02 : 1 }} whileTap={{ scale: canSubmit ? 0.97 : 1 }} onClick={handleSubmit} disabled={!canSubmit}
                  style={{ height: 50, padding: "0 32px", background: canSubmit ? `linear-gradient(135deg, #6E0F2D 0%, #4A061B 100%)` : "rgba(139,112,96,0.15)", border: "none", borderRadius: 999, fontFamily: F.ui, fontWeight: 600, fontSize: 14, color: canSubmit ? "#FFF" : T.taupe, cursor: canSubmit ? "pointer" : "not-allowed", display: "flex", alignItems: "center", gap: 8, boxShadow: canSubmit ? "0 4px 20px rgba(110,15,45,0.25)" : "none", transition: "all 0.2s" }}>
                  <UserPlus size={16} /> Create User Account
                </motion.button>
                <button onClick={handleCancel} style={{ height: 50, padding: "0 28px", background: "transparent", border: `1px solid ${T.borderMed}`, borderRadius: 999, fontFamily: F.ui, fontWeight: 500, fontSize: 14, color: T.royalBurgundy, cursor: "pointer", display: "flex", alignItems: "center", gap: 7 }}>
                  <X size={15} /> Cancel
                </button>
                {!canSubmit && <span style={{ fontFamily: F.ui, fontSize: 12, color: T.taupe, marginLeft: 4 }}>Fill in all required fields to continue</span>}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
