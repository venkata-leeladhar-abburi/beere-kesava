import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Edit2, Check, X, AlertTriangle, ChevronRight, Package, Layers, Tag } from "lucide-react";
import { T, F, cardStyle, labelStyle } from "./theme";
import { SectionTitle, GoldLink } from "./sharedUI";
import { Button, NumberInput, Textarea } from "../../../../shared/ui/primitives";
import { Money } from "../../../../shared/ui/domain/Money";
import { rupees } from "../../../../lib/domain/money";

export function DeductionRatesSection() {
  const [editDeduction, setEditDeduction] = useState<string | null>("warp");

  return (
    <div style={{ padding: "48px 56px" }}>
      <SectionTitle>Raw Material Deduction Rates</SectionTitle>
      <p style={{ fontFamily: F.ui, fontSize: 13, color: T.taupe, maxWidth: 720, margin: "0 0 24px 0", lineHeight: 1.7 }}>
        When a weaver returns less raw material than the standard issue, a deduction is applied to their payment. These rates define the per-unit deduction value.
      </p>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 20, marginBottom: 16 }}>
        {/* Warp Card */}
        <div>
          <div style={{ ...cardStyle, borderTop: `4px solid ${T.royalBurgundy}`, padding: 24, borderRadius: 16 }}>
            <div style={{
              width: 36, height: 36, borderRadius: "50%", background: T.royalBurgundy,
              display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 14,
            }}>
              <Package size={16} color="#fff" />
            </div>
            <div style={{ fontFamily: F.ui, fontSize: 14, fontWeight: 600, color: T.luxuryBrown, marginBottom: 6 }}>Warp Deduction Rate</div>
            <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 38, fontWeight: 700, color: T.luxuryBrown, lineHeight: 1, marginBottom: 4 }}><Money value={rupees(5.2)} decimals={2} /></div>
            <div style={{ fontFamily: F.ui, fontSize: 13, color: T.taupe, marginBottom: 16 }}>per gram below standard</div>
            <div style={{ borderTop: `1px solid ${T.borderDef}`, margin: "0 0 12px 0" }} />
            <p style={{ fontFamily: F.ui, fontSize: 12, color: T.taupe, margin: "0 0 12px 0", lineHeight: 1.6 }}>
              Applied when returned warp weight is less than the standard issued weight for the saree type.
            </p>
            <div style={{ fontFamily: F.mono, fontSize: 12, color: T.taupe, marginBottom: 14 }}>Last changed: 2 weeks ago</div>
            <Button
              variant="secondary" iconLeft={Edit2}
              className="w-full rounded-[8px] h-auto py-2 text-[12px] text-[#6E0F2D]"
              onClick={() => setEditDeduction(editDeduction === "warp" ? null : "warp")}
            >
              Edit Rate
            </Button>
          </div>

          {/* Warp inline edit */}
          <AnimatePresence>
            {editDeduction === "warp" && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
                style={{ overflow: "hidden" }}
              >
                <div style={{ background: "#fff", border: `1px solid ${T.borderDef}`, borderTop: "none", borderRadius: "0 0 16px 16px", padding: 20 }}>
                  <div style={{ display: "flex", flexDirection: "column", gap: 12, marginBottom: 14 }}>
                    <div>
                      <label style={labelStyle} htmlFor="deduction-rate-per-gram">Deduction Rate (₹ per gram) *</label>
                      <NumberInput id="deduction-rate-per-gram" addonLeft="₹" step={0.01} defaultValue={5.2} className="bg-[#FFF8F0] border-[rgba(110,15,45,0.18)]" />
                    </div>
                    <div>
                      <label style={labelStyle} htmlFor="applies-after-variance-grams">Applies After Variance (grams) *</label>
                      <NumberInput id="applies-after-variance-grams" defaultValue={5} className="bg-[#FFF8F0] border-[rgba(110,15,45,0.18)]" />
                    </div>
                    <div>
                      <label style={labelStyle} htmlFor="reason">Reason</label>
                      <Textarea id="reason" rows={2} className="resize-none bg-[#FFF8F0] border-[rgba(110,15,45,0.18)]" placeholder="e.g. Vendor price increase…" />
                    </div>
                  </div>
                  <div style={{
                    background: "rgba(192,57,43,0.08)", border: `1px solid rgba(192,57,43,0.22)`,
                    borderRadius: 8, padding: "10px 14px", display: "flex", alignItems: "center", gap: 8, marginBottom: 14,
                  }}>
                    <AlertTriangle size={14} color={T.crimson} />
                    <span style={{ fontFamily: F.ui, fontSize: 12, color: T.crimson }}>
                      This rate change will apply to all future warp deduction calculations immediately.
                    </span>
                  </div>
                  <div style={{ display: "flex", gap: 8 }}>
                    <Button variant="primary" iconLeft={Check} className="flex-1 rounded-full bg-[#1E6640] hover:bg-[#1E6640]/90 h-auto py-2 text-[12px] font-semibold">
                      Save
                    </Button>
                    <Button variant="secondary" iconLeft={X} className="flex-1 rounded-full h-auto py-2 text-[12px]" onClick={() => setEditDeduction(null)}>
                      Cancel
                    </Button>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Resham Card */}
        <div style={{ ...cardStyle, borderTop: `4px solid ${T.antiqueGold}`, padding: 24, borderRadius: 16, alignSelf: "start" }}>
          <div style={{
            width: 36, height: 36, borderRadius: "50%",
            background: "rgba(200,155,71,0.15)",
            border: `1px solid rgba(200,155,71,0.30)`,
            display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 14,
          }}>
            <Tag size={16} color={T.antiqueGold} />
          </div>
          <div style={{ fontFamily: F.ui, fontSize: 14, fontWeight: 600, color: T.luxuryBrown, marginBottom: 6 }}>Resham Deduction Rate</div>
          <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 38, fontWeight: 700, color: T.luxuryBrown, lineHeight: 1, marginBottom: 4 }}><Money value={rupees(15)} decimals={2} /></div>
          <div style={{ fontFamily: F.ui, fontSize: 13, color: T.taupe, marginBottom: 16 }}>per gram below standard</div>
          <div style={{ borderTop: `1px solid ${T.borderDef}`, margin: "0 0 12px 0" }} />
          <p style={{ fontFamily: F.ui, fontSize: 12, color: T.taupe, margin: "0 0 12px 0", lineHeight: 1.6 }}>
            Applied when returned resham (silk thread) weight is less than the standard issued quantity for the design.
          </p>
          <div style={{ fontFamily: F.mono, fontSize: 12, color: T.taupe, marginBottom: 14 }}>Last changed: 1 month ago</div>
          <Button
            variant="secondary" iconLeft={Edit2}
            className="w-full rounded-[8px] h-auto py-2 text-[12px] text-[#6E0F2D]"
            onClick={() => setEditDeduction(editDeduction === "resham" ? null : "resham")}
          >
            Edit Rate
          </Button>
          <AnimatePresence>
            {editDeduction === "resham" && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.28 }}
                style={{ overflow: "hidden", marginTop: 16 }}
              >
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  <div>
                    <label style={labelStyle} htmlFor="deduction-rate-per-gram-2">Deduction Rate (₹ per gram) *</label>
                    <NumberInput id="deduction-rate-per-gram-2" addonLeft="₹" step={0.01} defaultValue={15} className="bg-[#FFF8F0] border-[rgba(110,15,45,0.18)]" />
                  </div>
                  <div>
                    <label style={labelStyle} htmlFor="applies-after-variance-grams-2">Applies After Variance (grams) *</label>
                    <NumberInput id="applies-after-variance-grams-2" defaultValue={3} className="bg-[#FFF8F0] border-[rgba(110,15,45,0.18)]" />
                  </div>
                  <div>
                    <label style={labelStyle} htmlFor="reason-2">Reason</label>
                    <Textarea id="reason-2" rows={2} className="resize-none bg-[#FFF8F0] border-[rgba(110,15,45,0.18)]" />
                  </div>
                  <div style={{
                    background: "rgba(192,57,43,0.08)", border: `1px solid rgba(192,57,43,0.22)`,
                    borderRadius: 8, padding: "10px 14px", display: "flex", alignItems: "center", gap: 8,
                  }}>
                    <AlertTriangle size={14} color={T.crimson} />
                    <span style={{ fontFamily: F.ui, fontSize: 12, color: T.crimson }}>Rate applies to all future calculations.</span>
                  </div>
                  <div style={{ display: "flex", gap: 8 }}>
                    <Button variant="primary" iconLeft={Check} className="flex-1 rounded-full bg-[#1E6640] hover:bg-[#1E6640]/90 h-auto py-2 text-[12px] font-semibold">
                      Save
                    </Button>
                    <Button variant="secondary" className="flex-1 rounded-full h-auto py-2 text-[12px]" onClick={() => setEditDeduction(null)}>
                      Cancel
                    </Button>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Jari Card */}
        <div style={{ ...cardStyle, borderTop: `4px solid #2C1810`, padding: 24, borderRadius: 16, alignSelf: "start" }}>
          <div style={{
            width: 36, height: 36, borderRadius: "50%", background: "#2C1810",
            display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 14,
          }}>
            <Layers size={16} color="#fff" />
          </div>
          <div style={{ fontFamily: F.ui, fontSize: 14, fontWeight: 600, color: T.luxuryBrown, marginBottom: 6 }}>Jari Deduction Rate</div>
          <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 38, fontWeight: 700, color: T.luxuryBrown, lineHeight: 1, marginBottom: 4 }}><Money value={rupees(42)} decimals={2} /></div>
          <div style={{ fontFamily: F.ui, fontSize: 13, color: T.taupe, marginBottom: 12 }}>per reel below standard</div>
          <div style={{
            display: "inline-block", background: "rgba(200,155,71,0.12)", border: `1px solid rgba(200,155,71,0.25)`,
            borderRadius: 999, padding: "3px 10px", marginBottom: 14,
          }}>
            <span style={{ fontFamily: F.mono, fontSize: 12, color: T.antiqueGold }}>Jari is measured in Reels · 1 Bun = 4 Reels</span>
          </div>
          <div style={{ borderTop: `1px solid ${T.borderDef}`, margin: "0 0 12px 0" }} />
          <p style={{ fontFamily: F.ui, fontSize: 12, color: T.taupe, margin: "0 0 12px 0", lineHeight: 1.6 }}>
            Applied when returned jari is less than the standard issued quantity. Measured in reels, not grams.
          </p>
          <div style={{ fontFamily: F.mono, fontSize: 12, color: T.taupe, marginBottom: 14 }}>Last changed: 3 weeks ago</div>
          <Button
            variant="secondary" iconLeft={Edit2}
            className="w-full rounded-[8px] h-auto py-2 text-[12px] text-[#6E0F2D]"
            onClick={() => setEditDeduction(editDeduction === "jari" ? null : "jari")}
          >
            Edit Rate
          </Button>
          <AnimatePresence>
            {editDeduction === "jari" && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.28 }}
                style={{ overflow: "hidden", marginTop: 16 }}
              >
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  <div>
                    <label style={labelStyle} htmlFor="deduction-rate-per-reel">Deduction Rate (₹ per reel) *</label>
                    <NumberInput id="deduction-rate-per-reel" addonLeft="₹" step={0.01} defaultValue={42} className="bg-[#FFF8F0] border-[rgba(110,15,45,0.18)]" />
                  </div>
                  <div>
                    <label style={labelStyle} htmlFor="applies-after-variance-reels">Applies After Variance (reels) *</label>
                    <NumberInput id="applies-after-variance-reels" defaultValue={1} className="bg-[#FFF8F0] border-[rgba(110,15,45,0.18)]" />
                  </div>
                  <div>
                    <label style={labelStyle} htmlFor="reason-3">Reason</label>
                    <Textarea id="reason-3" rows={2} className="resize-none bg-[#FFF8F0] border-[rgba(110,15,45,0.18)]" />
                  </div>
                  <div style={{
                    background: "rgba(192,57,43,0.08)", border: `1px solid rgba(192,57,43,0.22)`,
                    borderRadius: 8, padding: "10px 14px", display: "flex", alignItems: "center", gap: 8,
                  }}>
                    <AlertTriangle size={14} color={T.crimson} />
                    <span style={{ fontFamily: F.ui, fontSize: 12, color: T.crimson }}>Rate applies to all future Jari deduction calculations.</span>
                  </div>
                  <div style={{ display: "flex", gap: 8 }}>
                    <Button variant="primary" className="flex-1 rounded-full bg-[#1E6640] hover:bg-[#1E6640]/90 h-auto py-2 text-[12px] font-semibold">
                      Save
                    </Button>
                    <Button variant="secondary" className="flex-1 rounded-full h-auto py-2 text-[12px]" onClick={() => setEditDeduction(null)}>
                      Cancel
                    </Button>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Variance Rule Strip */}
      <div style={{
        background: T.cream, border: `1px solid ${T.borderGold}`, borderRadius: 12,
        padding: "16px 22px", display: "flex", alignItems: "center", justifyContent: "space-between",
      }}>
        <div>
          <div style={{ fontFamily: F.mono, fontSize: 12, letterSpacing: "0.10em", color: T.taupe, textTransform: "uppercase", marginBottom: 5 }}>
            Current Variance Rule
          </div>
          <div style={{ fontFamily: F.ui, fontSize: 13, fontWeight: 500, color: T.luxuryBrown }}>
            Deductions only apply when the returned material is more than <strong>5 grams</strong> (or <strong>1 reel</strong> for Jari) below the standard issued quantity.
          </div>
        </div>
        <GoldLink>
          <Edit2 size={12} /> Edit Variance Rule <ChevronRight size={14} />
        </GoldLink>
      </div>
    </div>
  );
}
