import React from "react";
import { ArrowRight, Palette as Swatches, Layers as Stack } from "lucide-react";
import { WeaverSareesSection } from "@/features/weavers";
import { T, F } from "../theme";
import { FadeUp } from "../common/primitives";
import { Button } from "../../../../shared/ui/primitives";

export function DesignLibraryLinkCard({ onNavigate }: { onNavigate?: (tab: string) => void }) {
  return (
    <div className="px-4 md:px-7 xl:px-12" style={{ paddingTop: 32 }}>
      <FadeUp>
        <div style={{ background: "#FFFFFF", borderRadius: 18, border: `1.5px solid ${T.borderDef}`, padding: "28px 32px", display: "flex", alignItems: "center", justifyContent: "space-between", boxShadow: "0 4px 18px rgba(74,6,27,0.06)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
            <div style={{ width: 52, height: 52, borderRadius: 14, background: `linear-gradient(135deg, ${T.deepWine} 0%, ${T.royalBurgundy} 100%)`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              <Swatches size={28} color="#FFFDF9" />
            </div>
            <div>
              <div style={{ fontFamily: F.display, fontSize: 20, fontWeight: 700, color: T.luxuryBrown, marginBottom: 4 }}>Design Library</div>
              <div style={{ fontFamily: F.ui, fontSize: 14, color: T.taupe, lineHeight: 1.5 }}>
                View all design codes, color slip photos, design graphs, and weaver notes. Design Library has moved to its own dedicated page.
              </div>
            </div>
          </div>
          <Button onClick={() => onNavigate?.("Designs")} variant="primary" size="lg" className="shrink-0">
            Open Design Library <ArrowRight size={15} />
          </Button>
        </div>
      </FadeUp>
    </div>
  );
}

export function AllSareesSection() {
  return (
    <div id="prod-all-sarees" className="px-4 md:px-7 xl:px-12" style={{ paddingTop: 36 }}>
      <FadeUp>
        <div style={{ background: "#FFFFFF", borderRadius: 20, border: `1px solid ${T.borderDef}`, boxShadow: "0 6px 32px rgba(74,6,27,0.08)", overflow: "hidden" }}>
          <div style={{ background: `linear-gradient(100deg, ${T.deepWine} 0%, ${T.royalBurgundy} 100%)`, padding: "22px 32px", display: "flex", alignItems: "center", gap: 16 }}>
            <div style={{ width: 44, height: 44, borderRadius: 12, background: "rgba(255,255,255,0.12)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              <Stack size={26} color="#FFFDF9" />
            </div>
            <div>
              <div style={{ fontFamily: F.display, fontWeight: 700, fontSize: 20, color: "#FFFDF9", letterSpacing: "-0.2px" }}>All Sarees Inventory</div>
              <div style={{ fontFamily: F.ui, fontSize: 14, color: "rgba(255,253,249,0.65)", marginTop: 3 }}>Track every saree end to end, across all weavers and in-house looms combined</div>
            </div>
          </div>
          <div style={{ padding: "24px 28px 28px" }}>
            <WeaverSareesSection ownerType="all" />
          </div>
        </div>
      </FadeUp>
    </div>
  );
}
