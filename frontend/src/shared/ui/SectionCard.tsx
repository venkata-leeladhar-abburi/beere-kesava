import React from "react";
import { brand, fonts, semantic } from "@/design-system/tokens";
import type { LucideIcon } from "lucide-react";

/**
 * Burgundy-headed section container — icon, title, optional subtitle and
 * actions, with the section's content below.
 *
 * Lives here rather than under a feature because eight features render it
 * (bulk orders, customers, factory looms, suppliers, vendors, weavers …). It
 * used to be defined in `features/weavers/components/common/primitives`, which
 * made every other feature deep-import the weavers feature to draw a card —
 * exactly the cross-feature reach-in `import/no-restricted-paths` flags.
 *
 * Distinct from `shared/ui/portal/PortalChrome`'s SectionCard, which is the
 * flatter card the Worker/Weaver portals use inside their own chrome.
 */
export function SectionCard({
  icon: Icon,
  title,
  subtitle,
  actions,
  children,
  id,
}: {
  icon: LucideIcon;
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;
  children: React.ReactNode;
  id?: string;
}) {
  return (
    <div id={id} style={{ background: "#FFFFFF", borderRadius: 20, border: `1px solid rgba(110,15,45,0.10)`, boxShadow: "0 6px 32px rgba(74,6,27,0.08)", overflow: "hidden" }}>
      <div className="p-4 sm:p-7" style={{ background: `linear-gradient(100deg, ${brand.burgundy[950]} 0%, ${brand.burgundy[900]} 100%)`, borderTopLeftRadius: 19, borderTopRightRadius: 19 }}>
        <div className="flex items-start gap-3.5 sm:gap-4 w-full">
          <div style={{ width: 44, height: 44, borderRadius: 12, background: "rgba(255,255,255,0.12)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, marginTop: 2 }}>
            <Icon size={24} color="#FFFDF9" />
          </div>
          <div className="flex flex-col items-start gap-3 flex-1 min-w-0">
            <div>
              <div style={{ fontFamily: fonts.display, fontWeight: 700, fontSize: 20, color: "#FFFDF9", letterSpacing: "-0.2px", lineHeight: 1.2 }}>{title}</div>
              {subtitle && <div style={{ fontFamily: fonts.ui, fontSize: 14, color: "rgba(255,253,249,0.70)", marginTop: 4, lineHeight: 1.5 }}>{subtitle}</div>}
            </div>
            {actions && <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-2.5 w-full sm:w-auto pt-1">{actions}</div>}
          </div>
        </div>
      </div>
      <div className="p-2.5 sm:p-5 md:p-6 pb-2.5 sm:pb-4 min-w-0 max-w-full w-full overflow-hidden">
        {children}
      </div>
    </div>
  );
}

/** Small uppercase label that titles a group inside a SectionCard. */
export function SectionPill({ label }: { label: string }) {
  return <div style={{ fontFamily: "var(--font-mono)", fontSize: 13, color: semantic.text.tertiary, letterSpacing: "1.2px", textTransform: "uppercase", marginBottom: 4 }}>{label}</div>;
}
