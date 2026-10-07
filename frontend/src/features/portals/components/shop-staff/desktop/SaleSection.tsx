import { C, ShopDesktopHero, SILK_BG } from "../theme";
import { NewSaleFlow } from "../NewSaleFlow";

export function SaleSection({ bp, isTablet }: { bp: "tablet" | "desktop"; isTablet: boolean }) {
  return (
    <>
      <ShopDesktopHero
        bp={bp}
        breadcrumb="SINCE 1999 · SHOP STAFF PORTAL · NEW SALE"
        titleMain="New Retail Sale"
        titleSub="& Record at Counter"
        description="Scan the saree barcode, record the payment method, enter customer details, and generate a bill — all in one flow."
        pills={[
          { text: "4-Step Process" },
          { text: "Auto Bill Generation" },
          { text: "Customer Auto-Fill" },
        ]}
        bgUrl={SILK_BG}
      />
      <div style={{ padding: isTablet ? "24px 28px 40px" : "40px 48px 56px" }}>
        <div
          style={{
            minWidth: 0,
            background: "#FFF",
            borderRadius: 20,
            border: `1px solid ${C.bdr}`,
            boxShadow: "0 4px 28px rgba(44,24,16,0.10)",
          }}
        >
          <NewSaleFlow />
        </div>
      </div>
    </>
  );
}
