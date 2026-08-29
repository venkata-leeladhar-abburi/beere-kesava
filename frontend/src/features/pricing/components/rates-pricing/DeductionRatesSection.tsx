import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Edit2, Check, X, AlertTriangle, Package, Layers, Tag } from "lucide-react";
import { T, F, labelStyle } from "./theme";
import { SectionCard } from "./sharedUI";
import { Button, NumberInput, Textarea } from "../../../../shared/ui/primitives";
import { Money } from "../../../../shared/ui/domain/Money";
import { rupees } from "../../../../lib/domain/money";

function CardBloom() {
  return (
    <span aria-hidden style={{
      position: "absolute", top: -70, right: -70, width: 200, height: 200, borderRadius: "50%",
      background: "radial-gradient(circle, rgba(110,15,45,0.05) 0%, rgba(110,15,45,0) 70%)",
      pointerEvents: "none",
    }} />
  );
}

const luxuryCardStyle: React.CSSProperties = {
  background: "#FFFFFF",
  borderRadius: 16,
  border: `1.5px solid ${T.royalBurgundy}`,
  padding: 24,
  boxShadow: "0 1px 2px rgba(74,6,27,0.03), 0 6px 18px rgba(74,6,27,0.05)",
  position: "relative",
  overflow: "hidden",
  display: "flex",
  flexDirection: "column",
  alignSelf: "start",
};

export function DeductionRatesSection() {
  const [editDeduction, setEditDeduction] = useState<string | null>("warp");

  return (
    <div className="px-4 md:px-7 xl:px-14" style={{ paddingTop: 40 }}>
      <SectionCard
        icon={Package}
        title="Raw Material Deduction Rates"
        subtitle="When a weaver returns less raw material than the standard issue, a deduction is applied to their payment. These rates define the per-unit deduction value."
      >
        <div className="grid grid-cols-1 md:grid-cols-3" style={{ gap: 20, marginBottom: 16, alignItems: "start" }}>
          {/* Warp Card */}
          <div style={luxuryCardStyle}>
            <CardBloom />
            <div style={{
              width: 36, height: 36, borderRadius: 10,
              background: "rgba(110,15,45,0.08)", border: `1px solid rgba(110,15,45,0.15)`,
              display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 14, flexShrink: 0,
            }}>
              <Package size={18} color={T.royalBurgundy} />
            </div>
            <div style={{ fontFamily: F.ui, fontSize: 14, fontWeight: 700, color: T.luxuryBrown, marginBottom: 6 }}>Warp Deduction Rate</div>
            <div style={{ fontFamily: F.display, fontSize: 38, fontWeight: 700, color: T.luxuryBrown, lineHeight: 1, marginBottom: 4 }}><Money value={rupees(5.2)} decimals={2} /></div>
            <div style={{ fontFamily: F.ui, fontSize: 13, color: T.taupe, marginBottom: 16 }}>per gram below standard</div>
            <div style={{ borderTop: `1px solid rgba(200,155,71,0.18)`, margin: "0 0 12px 0" }} />
            <p style={{ fontFamily: F.ui, fontSize: 12, color: T.taupe, margin: "0 0 12px 0", lineHeight: 1.6, flexGrow: 1 }}>
              Applied when returned warp weight is less than the standard issued weight for the saree type.
            </p>
            <div style={{ fontFamily: "var(--font-mono)", fontSize: 12, color: T.taupe, marginBottom: 14 }}>Last changed: 2 weeks ago</div>
            <Button
              variant="secondary" iconLeft={Edit2}
              className="w-full rounded-[10px] h-auto py-2.5 text-[12px] font-semibold text-[#6E0F2D] border border-[#6E0F2D] hover:bg-[#6E0F2D] hover:text-white transition-colors"
              onClick={() => setEditDeduction(editDeduction === "warp" ? null : "warp")}
            >
              {editDeduction === "warp" ? "Close Edit" : "Edit Rate"}
            </Button>

            {/* Warp inline edit inside the card */}
            <AnimatePresence>
              {editDeduction === "warp" && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
                  style={{ overflow: "hidden" }}
                >
                  <div style={{ paddingTop: 16, borderTop: `1px solid rgba(200,155,71,0.18)`, marginTop: 14 }}>
                    <div style={{ display: "flex", flexDirection: "column", gap: 12, marginBottom: 14 }}>
                      <div>
                        <label style={labelStyle} htmlFor="deduction-rate-per-gram">Deduction Rate (₹ per gram) *</label>
                        {/* eslint-disable-next-line no-restricted-syntax -- ₹ input adornment on an entry field, not a rendered money value */}
                        <NumberInput id="deduction-rate-per-gram" addonLeft="₹" step={0.01} defaultValue={5.2} className="bg-white border-[rgba(110,15,45,0.18)]" />
                      </div>
                      <div>
                        <label style={labelStyle} htmlFor="applies-after-variance-grams">Applies After Variance (grams) *</label>
                        <NumberInput id="applies-after-variance-grams" defaultValue={5} className="bg-white border-[rgba(110,15,45,0.18)]" />
                      </div>
                      <div>
                        <label style={labelStyle} htmlFor="reason">Reason</label>
                        <Textarea id="reason" rows={2} className="resize-none bg-white border-[rgba(110,15,45,0.18)]" placeholder="e.g. Vendor price increase…" />
                      </div>
                    </div>
                    <div style={{
                      background: "rgba(192,57,43,0.08)", border: `1px solid rgba(192,57,43,0.22)`,
                      borderRadius: 10, padding: "10px 14px", display: "flex", alignItems: "center", gap: 8, marginBottom: 14,
                    }}>
                      <AlertTriangle size={14} color={T.crimson} />
                      <span style={{ fontFamily: F.ui, fontSize: 12, color: T.crimson }}>
                        This rate change will apply to all future warp deduction calculations immediately.
                      </span>
                    </div>
                    <div style={{ display: "flex", gap: 8 }}>
                      <Button variant="primary" iconLeft={Check} className="flex-1 rounded-[10px] bg-[#6E0F2D] hover:bg-[#3D0E1A] h-auto py-2 text-[12px] font-semibold text-white">
                        Save
                      </Button>
                      <Button variant="secondary" iconLeft={X} className="flex-1 rounded-[10px] h-auto py-2 text-[12px]" onClick={() => setEditDeduction(null)}>
                        Cancel
                      </Button>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Resham Card */}
          <div style={luxuryCardStyle}>
            <CardBloom />
            <div style={{
              width: 36, height: 36, borderRadius: 10,
              background: "rgba(110,15,45,0.08)", border: `1px solid rgba(110,15,45,0.15)`,
              display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 14, flexShrink: 0,
            }}>
              <Tag size={18} color={T.royalBurgundy} />
            </div>
            <div style={{ fontFamily: F.ui, fontSize: 14, fontWeight: 700, color: T.luxuryBrown, marginBottom: 6 }}>Resham Deduction Rate</div>
            <div style={{ fontFamily: F.display, fontSize: 38, fontWeight: 700, color: T.luxuryBrown, lineHeight: 1, marginBottom: 4 }}><Money value={rupees(15)} decimals={2} /></div>
            <div style={{ fontFamily: F.ui, fontSize: 13, color: T.taupe, marginBottom: 16 }}>per gram below standard</div>
            <div style={{ borderTop: `1px solid rgba(200,155,71,0.18)`, margin: "0 0 12px 0" }} />
            <p style={{ fontFamily: F.ui, fontSize: 12, color: T.taupe, margin: "0 0 12px 0", lineHeight: 1.6, flexGrow: 1 }}>
              Applied when returned resham (silk thread) weight is less than the standard issued quantity for the design.
            </p>
            <div style={{ fontFamily: "var(--font-mono)", fontSize: 12, color: T.taupe, marginBottom: 14 }}>Last changed: 1 month ago</div>
            <Button
              variant="secondary" iconLeft={Edit2}
              className="w-full rounded-[10px] h-auto py-2.5 text-[12px] font-semibold text-[#6E0F2D] border border-[#6E0F2D] hover:bg-[#6E0F2D] hover:text-white transition-colors"
              onClick={() => setEditDeduction(editDeduction === "resham" ? null : "resham")}
            >
              {editDeduction === "resham" ? "Close Edit" : "Edit Rate"}
            </Button>

            <AnimatePresence>
              {editDeduction === "resham" && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.28 }}
                  style={{ overflow: "hidden" }}
                >
                  <div style={{ paddingTop: 16, borderTop: `1px solid rgba(200,155,71,0.18)`, marginTop: 14 }}>
                    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                      <div>
                        <label style={labelStyle} htmlFor="deduction-rate-per-gram-2">Deduction Rate (₹ per gram) *</label>
                        {/* eslint-disable-next-line no-restricted-syntax -- ₹ input adornment on an entry field, not a rendered money value */}
                        <NumberInput id="deduction-rate-per-gram-2" addonLeft="₹" step={0.01} defaultValue={15} className="bg-white border-[rgba(110,15,45,0.18)]" />
                      </div>
                      <div>
                        <label style={labelStyle} htmlFor="applies-after-variance-grams-2">Applies After Variance (grams) *</label>
                        <NumberInput id="applies-after-variance-grams-2" defaultValue={3} className="bg-white border-[rgba(110,15,45,0.18)]" />
                      </div>
                      <div>
                        <label style={labelStyle} htmlFor="reason-2">Reason</label>
                        <Textarea id="reason-2" rows={2} className="resize-none bg-white border-[rgba(110,15,45,0.18)]" />
                      </div>
                      <div style={{
                        background: "rgba(192,57,43,0.08)", border: `1px solid rgba(192,57,43,0.22)`,
                        borderRadius: 10, padding: "10px 14px", display: "flex", alignItems: "center", gap: 8,
                      }}>
                        <AlertTriangle size={14} color={T.crimson} />
                        <span style={{ fontFamily: F.ui, fontSize: 12, color: T.crimson }}>Rate applies to all future calculations.</span>
                      </div>
                      <div style={{ display: "flex", gap: 8 }}>
                        <Button variant="primary" iconLeft={Check} className="flex-1 rounded-[10px] bg-[#6E0F2D] hover:bg-[#3D0E1A] h-auto py-2 text-[12px] font-semibold text-white">
                          Save
                        </Button>
                        <Button variant="secondary" className="flex-1 rounded-[10px] h-auto py-2 text-[12px]" onClick={() => setEditDeduction(null)}>
                          Cancel
                        </Button>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Jari Card */}
          <div style={luxuryCardStyle}>
            <CardBloom />
            <div style={{
              width: 36, height: 36, borderRadius: 10,
              background: "rgba(110,15,45,0.08)", border: `1px solid rgba(110,15,45,0.15)`,
              display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 14, flexShrink: 0,
            }}>
              <Layers size={18} color={T.royalBurgundy} />
            </div>
            <div style={{ fontFamily: F.ui, fontSize: 14, fontWeight: 700, color: T.luxuryBrown, marginBottom: 6 }}>Jari Deduction Rate</div>
            <div style={{ fontFamily: F.display, fontSize: 38, fontWeight: 700, color: T.luxuryBrown, lineHeight: 1, marginBottom: 4 }}><Money value={rupees(42)} decimals={2} /></div>
            <div style={{ fontFamily: F.ui, fontSize: 13, color: T.taupe, marginBottom: 12 }}>per reel below standard</div>
            <div style={{
              display: "inline-block", background: "rgba(110,15,45,0.05)", border: `1px solid rgba(110,15,45,0.15)`,
              borderRadius: 999, padding: "3px 10px", marginBottom: 14,
            }}>
              <span style={{ fontFamily: "var(--font-mono)", fontSize: 11, fontWeight: 600, color: T.royalBurgundy }}>Jari is measured in Reels · 1 Reel = 4 Buns</span>
            </div>
            <div style={{ borderTop: `1px solid rgba(200,155,71,0.18)`, margin: "0 0 12px 0" }} />
            <p style={{ fontFamily: F.ui, fontSize: 12, color: T.taupe, margin: "0 0 12px 0", lineHeight: 1.6, flexGrow: 1 }}>
              Applied when returned jari is less than the standard issued quantity. Measured in reels, not grams.
            </p>
            <div style={{ fontFamily: "var(--font-mono)", fontSize: 12, color: T.taupe, marginBottom: 14 }}>Last changed: 3 weeks ago</div>
            <Button
              variant="secondary" iconLeft={Edit2}
              className="w-full rounded-[10px] h-auto py-2.5 text-[12px] font-semibold text-[#6E0F2D] border border-[#6E0F2D] hover:bg-[#6E0F2D] hover:text-white transition-colors"
              onClick={() => setEditDeduction(editDeduction === "jari" ? null : "jari")}
            >
              {editDeduction === "jari" ? "Close Edit" : "Edit Rate"}
            </Button>

            <AnimatePresence>
              {editDeduction === "jari" && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.28 }}
                  style={{ overflow: "hidden" }}
                >
                  <div style={{ paddingTop: 16, borderTop: `1px solid rgba(200,155,71,0.18)`, marginTop: 14 }}>
                    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                      <div>
                        <label style={labelStyle} htmlFor="deduction-rate-per-reel">Deduction Rate (₹ per reel) *</label>
                        {/* eslint-disable-next-line no-restricted-syntax -- ₹ input adornment on an entry field, not a rendered money value */}
                        <NumberInput id="deduction-rate-per-reel" addonLeft="₹" step={0.01} defaultValue={42} className="bg-white border-[rgba(110,15,45,0.18)]" />
                      </div>
                      <div>
                        <label style={labelStyle} htmlFor="applies-after-variance-reels">Applies After Variance (reels) *</label>
                        <NumberInput id="applies-after-variance-reels" defaultValue={1} className="bg-white border-[rgba(110,15,45,0.18)]" />
                      </div>
                      <div>
                        <label style={labelStyle} htmlFor="reason-3">Reason</label>
                        <Textarea id="reason-3" rows={2} className="resize-none bg-white border-[rgba(110,15,45,0.18)]" />
                      </div>
                      <div style={{
                        background: "rgba(192,57,43,0.08)", border: `1px solid rgba(192,57,43,0.22)`,
                        borderRadius: 10, padding: "10px 14px", display: "flex", alignItems: "center", gap: 8,
                      }}>
                        <AlertTriangle size={14} color={T.crimson} />
                        <span style={{ fontFamily: F.ui, fontSize: 12, color: T.crimson }}>Rate applies to all future Jari deduction calculations.</span>
                      </div>
                      <div style={{ display: "flex", gap: 8 }}>
                        <Button variant="primary" className="flex-1 rounded-[10px] bg-[#6E0F2D] hover:bg-[#3D0E1A] h-auto py-2 text-[12px] font-semibold text-white">
                          Save
                        </Button>
                        <Button variant="secondary" className="flex-1 rounded-[10px] h-auto py-2 text-[12px]" onClick={() => setEditDeduction(null)}>
                          Cancel
                        </Button>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Variance Rule Strip */}
        <div
          className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
          style={{
            background: "#FFFFFF", border: `1.5px solid ${T.royalBurgundy}`, borderRadius: 16,
            padding: "18px 24px", position: "relative", overflow: "hidden",
            boxShadow: "0 1px 2px rgba(74,6,27,0.03), 0 6px 18px rgba(74,6,27,0.05)",
          }}
        >
          <CardBloom />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontFamily: "var(--font-mono)", fontSize: 11, fontWeight: 700, letterSpacing: "0.10em", color: T.taupe, textTransform: "uppercase", marginBottom: 5 }}>
              Current Variance Rule
            </div>
            <div style={{ fontFamily: F.ui, fontSize: 13, color: T.luxuryBrown, lineHeight: 1.5 }}>
              A variance allowance of <strong style={{ color: T.royalBurgundy }}>5 grams</strong> for Warp, <strong style={{ color: T.royalBurgundy }}>3 grams</strong> for Resham, and <strong style={{ color: T.royalBurgundy }}>1 Reel</strong> for Jari is granted before deductions trigger.
            </div>
          </div>
        </div>
      </SectionCard>
    </div>
  );
}
