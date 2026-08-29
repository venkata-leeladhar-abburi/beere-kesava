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
        <div 
          className="p-4 sm:p-7 w-full"
          style={{
            background: "#FFFDF9",
            borderRadius: 12,
            border: `1.5px solid ${T.antiqueGold}`,
            boxShadow: "0 4px 20px rgba(200,155,71,0.15)",
            position: "relative",
            overflow: "hidden",
          }}
        >
          <div className="flex items-start gap-3.5 sm:gap-4 w-full">
            <div style={{ width: 48, height: 48, borderRadius: 14, background: `linear-gradient(135deg, ${T.deepWine} 0%, ${T.royalBurgundy} 100%)`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, marginTop: 2 }}>
              <Swatches size={26} color="#FFFDF9" />
            </div>
            <div className="flex flex-col items-start gap-3 flex-1 min-w-0">
              <div>
                <div style={{ fontFamily: F.display, fontSize: 20, fontWeight: 700, color: T.luxuryBrown, marginBottom: 4 }}>Design Library</div>
                <div style={{ fontFamily: F.ui, fontSize: 14, color: T.taupe, lineHeight: 1.5 }}>
                  View all design codes, color slip photos, design graphs, and weaver notes. Design Library has moved to its own dedicated page.
                </div>
              </div>
              <Button onClick={() => onNavigate?.("Designs")} variant="primary" size="md" className="shrink-0 mt-0.5">
                Open Design Library <ArrowRight size={15} />
              </Button>
            </div>
          </div>
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
          <div className="p-4 sm:p-7" style={{ background: `linear-gradient(100deg, ${T.deepWine} 0%, ${T.royalBurgundy} 100%)` }}>
            <div className="flex items-start gap-3.5 sm:gap-4 w-full">
              <div style={{ width: 44, height: 44, borderRadius: 12, background: "rgba(255,255,255,0.12)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, marginTop: 2 }}>
                <Stack size={26} color="#FFFDF9" />
              </div>
              <div className="flex flex-col items-start gap-1 flex-1 min-w-0">
                <div style={{ fontFamily: F.display, fontWeight: 700, fontSize: 20, color: "#FFFDF9", letterSpacing: "-0.2px" }}>All Sarees Inventory</div>
                <div style={{ fontFamily: F.ui, fontSize: 14, color: "rgba(255,253,249,0.70)", marginTop: 2, lineHeight: 1.4 }}>Track every saree end to end, across all weavers and in-house looms combined</div>
              </div>
            </div>
          </div>
          <div className="p-2.5 sm:p-5 md:p-6 pb-2.5 sm:pb-4">
            <WeaverSareesSection ownerType="all" />
          </div>
        </div>
      </FadeUp>
    </div>
  );
}
