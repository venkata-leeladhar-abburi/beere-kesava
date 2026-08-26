import React from "react";
import { Package } from "lucide-react";
import { T, F } from "../../theme";

// Shown inside any dispatch flow opened before sarees were picked. The flow
// stays browsable; only the committing actions are held back.
export function NoSareesNotice({ what }: { what: string }) {
  return (
    <div style={{ background: "rgba(200,155,71,0.10)", border: `1px solid rgba(200,155,71,0.35)`, borderRadius: 14, padding: "22px 24px", display: "flex", gap: 14, alignItems: "flex-start" }}>
      <Package size={22} color={T.antiqueGold} style={{ flexShrink: 0, marginTop: 2 }} />
      <div>
        <div style={{ fontFamily: F.ui, fontSize: 14, fontWeight: 700, color: T.luxuryBrown, marginBottom: 5 }}>No sarees selected yet</div>
        <div style={{ fontFamily: F.ui, fontSize: 13, color: T.taupe, lineHeight: 1.6 }}>
          Close this and tick the sarees you want to {what} in the inventory table — or use <strong style={{ color: T.luxuryBrown }}>Scan</strong> to pick one. You can look through the steps here in the meantime.
        </div>
        {/* The single most common reason nothing can be ticked: the operator is
            on the Assigned tab, where nothing has been through QC yet. */}
        <div style={{ fontFamily: F.ui, fontSize: 13, color: T.taupe, lineHeight: 1.6, marginTop: 8, paddingTop: 8, borderTop: `1px solid rgba(200,155,71,0.30)` }}>
          Only <strong style={{ color: T.luxuryBrown }}>QC-passed</strong> sarees can be dispatched — look under the{" "}
          <strong style={{ color: T.luxuryBrown }}>QC Passed</strong> or{" "}
          <strong style={{ color: T.luxuryBrown }}>Finishing Completed</strong> tabs. Rows still in production have their
          tick box disabled, and hovering one says why.
        </div>
      </div>
    </div>
  );
}
