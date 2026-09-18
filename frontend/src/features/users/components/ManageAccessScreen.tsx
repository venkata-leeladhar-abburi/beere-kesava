import { useId, useMemo, useState } from "react";
import { motion } from "motion/react";
import { ArrowLeft, KeyRound, Lock, ShieldCheck, ShieldHalf } from "lucide-react";
import { Button, Field, Select, SelectItem } from "../../../shared/ui/primitives";
import { T, F, EASE, ROLE_TO_PORTAL, PORTAL_ACCESS_LEVELS, ACCESS_LEVEL_META, AccessLevel } from "./theme";
import { TableRow } from "./utils";
import { RoleBadge, AccessBadge, StatusBadge, SectionCard } from "./UserBadges";
import { AdditionalPortalsField } from "./AdditionalPortalsField";

export interface ManageAccessChanges {
  additionalRoles: string[];
  /** One level per assigned portal, keyed by frontend role label. */
  accessLevels: Record<string, AccessLevel>;
}

function sameSet(a: string[], b: string[]) {
  return a.length === b.length && a.every(v => b.includes(v));
}

function sameLevels(a: Record<string, AccessLevel>, roles: string[], b: Record<string, AccessLevel>) {
  return roles.every(r => (a[r] ?? "Full Access") === (b[r] ?? "Full Access"));
}

/**
 * Manage Access — the one place a person's portals are granted or taken away
 * after they've been created. Deliberately a screen rather than a modal: the
 * primary role, the extra portals and the access level are one decision, and
 * what they add up to at login is spelled out at the bottom before saving.
 *
 * The primary role is read-only here. Changing it would re-issue the employee
 * ID (it's allocated per role — see users.service.ts) and, for a Weaver, move
 * a linked Weaver record, so it isn't a permissions edit.
 */
export function ManageAccessScreen({ row, saving, error, onBack, onSave }: {
  row: TableRow;
  saving?: boolean;
  error?: string | null;
  onBack: () => void;
  onSave: (changes: ManageAccessChanges) => void;
}) {
  const groupId = useId();
  const initialRoles = useMemo(() => row.additionalRoles ?? [], [row.additionalRoles]);
  const initialLevels = useMemo(() => row.accessLevels ?? {}, [row.accessLevels]);
  const [additionalRoles, setAdditionalRoles] = useState<string[]>(initialRoles);
  const [levels, setLevels] = useState<Record<string, AccessLevel>>(initialLevels);

  // A weaver's portal is scoped to their own batches and payments, so it is
  // never combined with a staff portal — the backend refuses it too.
  const isWeaver = row.role === "Weaver";
  const portals = isWeaver ? [row.role] : [row.role, ...additionalRoles];
  // A portal granted in this session has no stored level yet — unrestricted
  // until someone says otherwise, matching what the backend assumes.
  const levelOf = (p: string): AccessLevel => levels[p] ?? "Full Access";
  const setLevel = (p: string, next: AccessLevel) => setLevels(prev => ({ ...prev, [p]: next }));

  const dirty =
    (!isWeaver && !sameSet(additionalRoles, initialRoles)) ||
    !sameLevels(levels, portals, initialLevels);
  const fullName = `${row.firstName} ${row.lastName}`.trim();

  return (
    <div style={{ background: T.silkCream, minHeight: "100dvh", fontFamily: F.ui }}>
      {/* ── HEADER ─────────────────────────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: EASE }}
        style={{ background: "#0D0207" }}
      >
        <div className="px-4 md:px-7 xl:px-14" style={{ paddingTop: 32, paddingBottom: 56 }}>
          <Button
            variant="tertiary"
            onClick={onBack}
            className="!mb-5 !gap-2 !border-[rgba(245,232,208,0.22)] !bg-[rgba(255,255,255,0.06)] !px-3.5 !py-2 !text-[13px] !text-[rgba(255,253,249,0.85)] hover:!bg-[rgba(255,255,255,0.12)]"
          >
            <ArrowLeft size={15} /> Back to All Users
          </Button>
          <div style={{ fontSize: "clamp(11px, 1.4vw, 13px)", color: "rgba(255,253,249,0.50)", letterSpacing: "1.8px", textTransform: "uppercase", marginBottom: 10 }}>
            Portal Access · {row.empId}
          </div>
          <h1 style={{ fontFamily: F.display, fontWeight: 400, fontSize: "clamp(28px, 5vw, 44px)", color: "#FFFDF9", margin: 0, lineHeight: 1.1 }}>
            Manage Access
          </h1>
          <p className="max-w-[640px]" style={{ fontSize: "clamp(13px, 2vw, 15px)", color: "rgba(255,253,249,0.70)", lineHeight: 1.6, margin: "10px 0 0" }}>
            Decide which portals {fullName} can open. Someone holding more than one is asked which to use every time they log in, and can move between them from their profile menu.
          </p>
        </div>
      </motion.div>

      {/* ── BODY ───────────────────────────────────────────────────────────── */}
      <div className="px-4 md:px-7 xl:px-14" style={{ paddingTop: 28, paddingBottom: 80 }}>
        <div className="max-w-[880px]">
          {error && (
            <div style={{ background: T.crimsonBg, border: "1px solid rgba(192,57,43,0.25)", borderRadius: 12, padding: "12px 18px", marginBottom: 16, fontSize: 13, color: T.crimson }}>
              {error}
            </div>
          )}

          <SectionCard
            icon={KeyRound}
            title={fullName}
            subtitle={`${row.empId} · +91 ${row.mobile}${row.email ? ` · ${row.email}` : ""}`}
          >
            <div style={{ display: "flex", flexDirection: "column", gap: 26 }}>
              {/* Primary role — fixed here */}
              <Field label="Primary Role" hint="Set when the account was created. It decides the employee ID, so it isn't changed from this screen.">
                <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap", padding: "11px 14px", borderRadius: 12, border: `1px solid ${T.borderDef}`, background: "rgba(245,232,208,0.40)" }}>
                  <Lock size={14} color={T.taupe} />
                  <RoleBadge role={row.role} />
                  <span style={{ fontSize: 13, color: T.taupe }}>{ROLE_TO_PORTAL[row.role]}</span>
                  <span style={{ marginLeft: "auto" }}><StatusBadge status={row.status} /></span>
                </div>
              </Field>

              {isWeaver ? (
                <Field label="Additional Portals" hint="Not available for weavers.">
                  <div style={{ display: "flex", alignItems: "flex-start", gap: 10, padding: "12px 14px", borderRadius: 12, border: `1px solid ${T.borderDef}`, background: "rgba(245,232,208,0.40)" }}>
                    <Lock size={14} color={T.taupe} style={{ marginTop: 2, flexShrink: 0 }} />
                    <span style={{ fontSize: 13, color: T.taupe, lineHeight: 1.6 }}>
                      The weaver portal only ever shows this person their own batches, materials and payments. Pairing it with a staff portal would put the whole factory's data behind the same login, so it stays a single-portal account.
                    </span>
                  </div>
                </Field>
              ) : (
                <AdditionalPortalsField
                  primaryRole={row.role}
                  value={additionalRoles}
                  onChange={setAdditionalRoles}
                />
              )}

              {/* One level per portal, not one per person: the same employee can
                  be trusted with the ledger as an Accountant and have every
                  rupee hidden from them on the shop floor. */}
              {/* Not a <Field>: one label for a list of controls would hand
                  every picker the same id and the same accessible name, so
                  each row carries its own label instead. */}
              <div className="flex flex-col gap-1.5">
                <div className="bk-label-lg" style={{ color: "var(--text-primary)" }}>Access Level per Portal</div>
                <div style={{ fontSize: 12, color: T.taupe, marginBottom: 4 }}>
                  Applies only inside that portal. It follows them when they switch, so each one is decided on its own.
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  {portals.map(p => {
                    const id = `${groupId}-level-${p.replace(/\s+/g, "-")}`;
                    return (
                      <div
                        key={p}
                        className="flex flex-col gap-2 sm:flex-row sm:items-center"
                        style={{ padding: "11px 13px", borderRadius: 12, border: `1px solid ${T.borderDef}`, background: "#FFF" }}
                      >
                        <label htmlFor={id} style={{ flex: 1, minWidth: 0, cursor: "pointer" }}>
                          <RoleBadge role={p} />
                          <div style={{ fontSize: 11.5, color: T.taupe, marginTop: 4 }}>
                            {p === row.role ? "Primary portal" : ROLE_TO_PORTAL[p]}
                          </div>
                        </label>
                        <div className="w-full sm:w-[210px]">
                          <Select id={id} className="w-full" value={levelOf(p)} onValueChange={v => setLevel(p, v as AccessLevel)}>
                            {PORTAL_ACCESS_LEVELS.map(l => <SelectItem key={l} value={l}>{l}</SelectItem>)}
                          </Select>
                        </div>
                      </div>
                    );
                  })}
                </div>
                <div style={{ fontSize: 12, color: T.taupe, marginTop: 6, lineHeight: 1.6 }}>
                  {[...new Set(portals.map(levelOf))].map(l => (
                    <div key={l}><strong style={{ color: ACCESS_LEVEL_META[l].color }}>{l}</strong> — {ACCESS_LEVEL_META[l].desc}</div>
                  ))}
                </div>
              </div>

              {/* What this adds up to at login */}
              <div style={{ borderRadius: 14, border: `1px solid ${T.borderGold}`, background: T.bgGold, padding: "16px 18px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, fontWeight: 700, fontSize: 13, color: T.luxuryBrown, marginBottom: 8 }}>
                  {portals.every(p => levelOf(p) === "Full Access")
                    ? <ShieldCheck size={15} color={T.green} />
                    : <ShieldHalf size={15} color="#8B6018" />}
                  After saving
                </div>
                <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 8 }}>
                  {portals.map(p => (
                    <span key={p} style={{ display: "inline-flex", alignItems: "center", gap: 5 }}>
                      <RoleBadge role={p} />
                      <AccessBadge level={levelOf(p)} />
                    </span>
                  ))}
                </div>
                <div style={{ fontSize: 13, color: T.taupe, lineHeight: 1.6 }}>
                  {portals.length > 1
                    ? `${fullName} is asked to choose one of these ${portals.length} portals at every login, and can switch between them without logging out.`
                    : `${fullName} goes straight to the ${ROLE_TO_PORTAL[row.role]} at login. No portal picker is shown.`}
                </div>
              </div>

              <div style={{ display: "flex", gap: 12, flexWrap: "wrap", borderTop: `1px solid ${T.borderDef}`, paddingTop: 20 }}>
                <Button
                  variant="primary"
                  disabled={!dirty || saving}
                  onClick={() => onSave({
                    additionalRoles: isWeaver ? [] : additionalRoles,
                    accessLevels: Object.fromEntries(portals.map(p => [p, levelOf(p)])),
                  })}
                >
                  {saving ? "Saving…" : "Save Access"}
                </Button>
                <Button variant="tertiary" onClick={onBack} disabled={saving}>
                  Cancel
                </Button>
                {!dirty && !saving && (
                  <span style={{ alignSelf: "center", fontSize: 12.5, color: T.taupe }}>
                    Nothing changed yet.
                  </span>
                )}
              </div>
            </div>
          </SectionCard>
        </div>
      </div>
    </div>
  );
}
