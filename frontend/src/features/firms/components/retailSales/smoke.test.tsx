import { describe, it, expect, vi } from "vitest";
import React from "react";
import { screen } from "@testing-library/react";
import { renderWithQueryClient } from "../../../../test/render";
import { ConnectRetailSalesSection } from "./ConnectRetailSalesSection";
import { FirmRetailSalesTab } from "./FirmRetailSalesTab";
import { ConfirmProvider } from "../../../../shared/ui/overlay";
import { ConnectRetailSalesModal } from "./ConnectRetailSalesModal";

vi.mock("../../../../shared/api/firms", async (orig) => {
  const actual = await orig<any>();
  return {
    ...actual,
    firmsApi: {
      ...actual.firmsApi,
      listRetailSales: vi.fn().mockResolvedValue({ items: [], total: 0, page: 1, pageSize: 500, totalAmount: 0 }),
      listConnectableRetailSales: vi.fn().mockResolvedValue({ items: [], total: 0, page: 1, pageSize: 500 }),
      retailSaleFilterOptions: vi.fn().mockResolvedValue({ paymentMethods: [], soldBy: [] }),
      getRetailSalesFirm: vi.fn().mockResolvedValue(null),
    },
  };
});

const FIRM: any = { id: "FIRM-001", firmName: "Kesava Silks", createdAt: "2026-01-01" };

describe("retail sales UI mounts", () => {
  it("renders ConnectRetailSalesSection", () => {
    renderWithQueryClient(
      <ConfirmProvider>
        <ConnectRetailSalesSection firms={[FIRM]} onGoToRetailSales={() => {}} />
      </ConfirmProvider>,
    );
    expect(screen.getByText(/Retail Sales Firm/i)).toBeTruthy();
  });

  // The section renders its modal closed, so the modal's own render path is
  // only exercised when open — which is exactly where it crashed in the app.
  it("renders ConnectRetailSalesModal when open", () => {
    renderWithQueryClient(
      <ConfirmProvider>
        <ConnectRetailSalesModal open onOpenChange={() => {}} firms={[FIRM]} />
      </ConfirmProvider>,
    );
    expect(screen.getByText(/Connect Retail Sales to a Firm/i)).toBeTruthy();
    expect(screen.getByText(/Step 2 — Select the retail sales/i)).toBeTruthy();
  });

  it("renders FirmRetailSalesTab", () => {
    renderWithQueryClient(
      <ConfirmProvider>
        <FirmRetailSalesTab firm={FIRM} firms={[FIRM]} />
      </ConfirmProvider>,
    );
    expect(screen.getByText(/Counter sales booked to Kesava Silks/i)).toBeTruthy();
    expect(screen.getAllByText(/Connected Sales/i).length).toBeGreaterThan(0);
  });
});
