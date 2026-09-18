/**
 * The Selling Price field is two-way: typing into it rewrites the line's
 * markup (the only figure the line stores), and typing a markup rewrites the
 * selling price. These tests pin that both directions agree, and that paise
 * survive the trip — the failure mode this field was added to fix.
 */
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState } from "react";
import { describe, expect, it, vi } from "vitest";
import { SareeRowCard } from "./SareeRowCard";
import type { SareeRow } from "../../types";

vi.mock("@/shared/hooks/useImageUpload", () => ({
  useImageUpload: () => ({ upload: vi.fn(), uploading: false, error: null }),
}));

function Harness({ initial }: { initial: Partial<SareeRow> }) {
  const [row, setRow] = useState<SareeRow>({
    _uid: "u1", weight: "", date: "2026-01-01", sareeType: "Kanjivaram", color: "Maroon",
    price: 13600, sellPercent: 98, quantity: 6, finalAmount: 0, notes: "",
    ...initial,
  } as SareeRow);
  return (
    <>
      <SareeRowCard
        s={row}
        idx={0}
        supplier="JJ SILKS"
        invoiceNumber="NOINV-001"
        updateSareeRow={(_uid, patch) => setRow((r) => ({ ...r, ...patch }))}
        removeSareeRow={vi.fn()}
      />
      <output data-testid="pct">{row.sellPercent}</output>
    </>
  );
}

const selling = () => screen.getByLabelText(/Selling Price/i) as HTMLInputElement;
const markup = () => screen.getByLabelText(/Sell %/i) as HTMLInputElement;

describe("SareeRowCard selling price", () => {
  it("shows the selling price the markup implies", () => {
    render(<Harness initial={{}} />);
    expect(selling().value).toBe("26,928");
  });

  it("a typed selling price rewrites the markup", async () => {
    render(<Harness initial={{}} />);
    await userEvent.clear(selling());
    await userEvent.type(selling(), "27000");
    expect(screen.getByTestId("pct").textContent).toBe("98.5294");
  });

  it("keeps paise in a typed selling price", async () => {
    render(<Harness initial={{}} />);
    await userEvent.clear(selling());
    await userEvent.type(selling(), "26928.55");
    expect(selling().value).toBe("26,928.55");
    // Round-trip: the stored markup reproduces the typed price to the paise.
    const pct = Number(screen.getByTestId("pct").textContent);
    expect(Math.round(13600 * (1 + pct / 100) * 100) / 100).toBe(26928.55);
  });

  it("a typed markup still drives the selling price", async () => {
    render(<Harness initial={{ sellPercent: 0 }} />);
    await userEvent.clear(markup());
    await userEvent.type(markup(), "25");
    expect(selling().value).toBe("17,000");
  });

  it("leaves the markup at zero when there is no buying price yet", async () => {
    render(<Harness initial={{ price: 0, sellPercent: 0 }} />);
    await userEvent.type(selling(), "900");
    expect(screen.getByTestId("pct").textContent).toBe("0");
  });
});
