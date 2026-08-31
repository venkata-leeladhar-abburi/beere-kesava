import { T, F } from '../theme';
import { SectionHeader } from '../ui';
import { useDashboardWeavers } from '../hooks/useDashboardWeavers';
import { WeaverCardMockupStyle } from "@/features/weavers";

export function WeaverSection({ onNavigate }: { onNavigate: (tab: string, ctx?: unknown) => void }) {
  const { data: weavers = [], isLoading } = useDashboardWeavers();

  if (isLoading) {
    return (
      <section className="px-4 md:px-7 xl:px-12" style={{ paddingBottom: 64, background: T.silkCream }}>
        <SectionHeader title="Active Weavers" actionText="View All Weavers →" onAction={() => onNavigate("AllWeavers")} />
        <div style={{ display: "flex", gap: 18 }}>
          {["w-sk-1", "w-sk-2", "w-sk-3", "w-sk-4"].map((skKey) => (
            <div
              key={skKey}
              style={{
                flex: 1, height: 490, borderRadius: 24, background: "rgba(110,15,45,0.05)",
                border: `1px solid rgba(110,15,45,0.10)`, animation: "pulse 1.5s ease-in-out infinite",
              }}
            />
          ))}
        </div>
      </section>
    );
  }

  if (weavers.length === 0) {
    return (
      <section className="px-4 md:px-7 xl:px-12" style={{ paddingBottom: 64, background: T.silkCream }}>
        <SectionHeader title="Active Weavers" actionText="View All Weavers →" onAction={() => onNavigate("AllWeavers")} />
        <div style={{ background: "#FFFFFF", borderRadius: 24, border: `1px solid ${T.borderDef}`, padding: "40px", textAlign: "center", fontFamily: F.ui, fontSize: 14, color: T.taupe }}>
          No weavers in database yet. Click "View All Weavers" to register a weaver.
        </div>
      </section>
    );
  }

  return (
    <section className="px-4 md:px-7 xl:px-12" style={{ paddingBottom: 64, background: T.silkCream }}>
      <SectionHeader title="Active Weavers" actionText="View All Weavers →" onAction={() => onNavigate("AllWeavers")} />
      
      {/* Decorative horizontal gold accent line with center diamond flourish (❖) below header */}
      <div className="relative flex items-center justify-center w-full my-5">
        <div className="w-full h-[1px] bg-[#E5D5C5]" />
        <div className="absolute bg-[#F9F6F0] px-3 text-[#C89B47] text-[11px] font-bold select-none">
          ❖
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 md:gap-5 xl:gap-6" style={{ position: "relative" }}>
        {weavers.map((w, i) => (
          <div
            key={w.id}
            role="button"
            tabIndex={0}
            onClick={() => onNavigate("Weavers", { weaverId: w.id, mode: "view" })}
            onKeyDown={e => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onNavigate("Weavers", { weaverId: w.id, mode: "view" }); } }}
          >
            <WeaverCardMockupStyle
              weaver={{
                id: w.id,
                name: w.name,
                initials: w.initials,
                village: w.village || undefined,
                mobile: w.mobile,
                looms: w.looms,
                status: w.status,
                img: w.img,
              }}
              index={i}
              onNavigateDetails={() => onNavigate("Weavers", { weaverId: w.id, mode: "view" })}
              onNavigateEdit={() => onNavigate("Weavers", { weaverId: w.id, mode: "edit" })}
              onNavigateBatches={() => onNavigate("Weavers", { weaverId: w.id, mode: "view" })}
            />
          </div>
        ))}
      </div>
    </section>
  );
}
