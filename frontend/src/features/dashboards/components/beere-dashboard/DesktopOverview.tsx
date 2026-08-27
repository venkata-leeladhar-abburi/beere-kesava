import { Hero, MetricsBar, ThreeCol, ActivityStrip, WeaverSection, RawMaterial, Footer } from './desktop';

/**
 * The admin dashboard's "Overview" tab content, split into its own chunk so
 * it's only fetched by devices that actually render it — BeereDashboard.tsx
 * lazy-imports this (and MobileOverview, its counterpart in mobile.tsx)
 * instead of statically importing both trees, which used to mean every
 * visitor downloaded both the desktop and mobile overview bundles even
 * though only one ever renders per session.
 */
export function DesktopOverview({ onNavigate }: { onNavigate: (tab: string) => void }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", flex: 1 }}>
      <Hero />
      <MetricsBar />
      <ThreeCol onNavigate={onNavigate} />
      <ActivityStrip onNavigate={onNavigate} />
      <WeaverSection onNavigate={onNavigate} />
      <RawMaterial onNavigate={onNavigate} />
      <div style={{ marginTop: "auto" }}>
        <Footer />
      </div>
    </div>
  );
}
