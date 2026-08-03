import { describe, it, expect } from "vitest";
import { generateSareeId } from "./BatchContext";

describe("generateSareeId", () => {
  it("builds FIRSTNAME-L{loom}-{3-digit-seq}", () => {
    expect(generateSareeId("Ravi Kumar", 2, 1)).toBe("RAVI-L2-001");
    expect(generateSareeId("Padma Veni", 1, 42)).toBe("PADMA-L1-042");
  });

  it("pads the sequence to 3 digits and doesn't truncate beyond 999", () => {
    expect(generateSareeId("Suresh Murti", 2, 5)).toBe("SURESH-L2-005");
    expect(generateSareeId("Suresh Murti", 2, 1234)).toBe("SURESH-L2-1234");
  });

  it("takes only the first word of a multi-word or dotted name", () => {
    expect(generateSareeId("Anand K.", 3, 1)).toBe("ANAND-L3-001");
    expect(generateSareeId("Loom 3", 3, 1)).toBe("LOOM-L3-001");
  });

  it("falls back to the whole name when it has no splittable separator", () => {
    expect(generateSareeId("Ravi", 2, 1)).toBe("RAVI-L2-001");
  });
});
