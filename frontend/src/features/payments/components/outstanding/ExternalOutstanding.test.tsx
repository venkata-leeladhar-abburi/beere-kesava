import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { UnifiedSaree } from "@/features/customers";
import { ExternalOutstanding } from "./ExternalOutstanding";

vi.mock("@/contexts/AuthContext", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/contexts/AuthContext")>();
  return { ...actual, useAuth: () => ({ user: { id: "u1", accessLevel: "FULL" } }) };
});

const { PURCHASES } = vi.hoisted(() => ({
  PURCHASES: [] as import("@/features/customers").PurchaseSummary[],
}));

vi.mock("@/features/customers", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/features/customers")>();
  const base = actual.SEED_PURCHASE_SUMMARIES[0];
  PURCHASES.push(
    ...[
      { ...base, id: "EXT-A", supplier: "Alpha Silks", billAmount: 10_000, paidAmount: 4_000 },
      { ...base, id: "EXT-B", supplier: "Alpha Silks", billAmount: 5_000, paidAmount: 5_000 },
      { ...base, id: "EXT-C", supplier: "Beta Weaves", billAmount: 2_000, paidAmount: 0 },
    ].map((p) => ({ ...p, creditedAmount: 0, paidWithoutRecord: false }))
  );
  return { ...actual, useSales: () => ({ purchases: PURCHASES }) };
});

function ext(sareeId: string, purchaseId: string, o: Partial<UnifiedSaree> = {}): UnifiedSaree {
  return {
    sareeId,
    origin: "external",
    purchaseId,
    batchId: null,
    designCode: "",
    sareeTypeCode: "",
    sareeTypeName: "Silk",
    weight: "",
    qcDate: "",
    costPrice: 400,
    sellPercent: 25,
    finalAmount: 500,
    status: "unsold",
    sale: null,
    ret: null,
    ageDays: 10,
    ...o,
  };
}

const restocked = { returnRef: "R1", date: "x", reason: "x", refundAmount: 0, restocked: true };
const held = { ...restocked, returnRef: "R2", restocked: false };
const SAREES: UnifiedSaree[] = [
  ext("A1", "EXT-A", { status: "retail" }),
  ext("A2", "EXT-A", { status: "wholesale" }),
  ext("A3", "EXT-A"),
  ext("A4", "EXT-A", { status: "returned", ret: restocked }),
  ext("A5", "EXT-A", { status: "returned", ret: held }),
  ext("B1", "EXT-B", { status: "retail" }),
  ext("B2", "EXT-B", { status: "returned", returnedToSupplier: true }),
  ext("C1", "EXT-C"),
];

function rollupTable() {
  return screen.getByRole("table", { name: /supplier roll-up/i });
}

describe("ExternalOutstanding — supplier roll-up", () => {
  let csv: Promise<string> | null;

  beforeEach(() => {
    csv = null;
    URL.createObjectURL = vi.fn((blob: Blob) => {
      csv = blob.text();
      return "blob:test";
    });
    URL.revokeObjectURL = vi.fn();
    vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(() => {});
  });

  it("shows a Sold column between Purchased and Outstanding", () => {
    render(<ExternalOutstanding sarees={SAREES} search="" ageFilter="all" />);
    const headers = within(rollupTable())
      .getAllByRole("columnheader")
      .map((h) => h.textContent?.trim());
    const at = headers.indexOf("Sold");
    expect(headers[at - 1]).toBe("Purchased");
    expect(headers[at + 1]).toBe("Outstanding");
  });

  it("counts each supplier's sold sarees, leaving out customer returns", () => {
    render(<ExternalOutstanding sarees={SAREES} search="" ageFilter="all" />);
    const table = rollupTable();
    const headers = within(table)
      .getAllByRole("columnheader")
      .map((h) => h.textContent?.trim());
    const cells = (supplier: string) =>
      within(within(table).getByText(supplier).closest("tr")!)
        .getAllByRole("cell")
        .map((c) => c.textContent?.trim());
    const col = (name: string) => headers.indexOf(name);

    const alpha = cells("Alpha Silks");
    expect(alpha[col("Purchased")]).toBe("7");
    expect(alpha[col("Sold")]).toBe("3");
    expect(alpha[col("Outstanding")]).toBe("2");
    const beta = cells("Beta Weaves");
    expect(beta[col("Sold")]).toBe("0");
  });

  it("exports the roll-up, Sold included, as CSV", async () => {
    render(<ExternalOutstanding sarees={SAREES} search="" ageFilter="all" />);
    const buttons = screen.getAllByRole("button", { name: /export csv/i });
    await userEvent.click(buttons[buttons.length - 1]);

    const lines = (await csv!).split("\n");
    expect(lines[0]).toBe(
      '"Supplier","Purchases","Sarees Bought","Sold","Unsold","Customer Returns","Returned to Supplier","Unsold Sale Value","Bill Due"'
    );
    expect(lines[1]).toBe('"Alpha Silks","2","7","3","2","2","1","1000","6000"');
    expect(lines[2]).toBe('"Beta Weaves","1","1","0","1","0","0","500","2000"');
  });
});
