import { fromPaise, toPaise } from "./money.util";

describe("money.util", () => {
  it("adds amounts exactly where floats drift", () => {
    expect(100.1 + 200.2).not.toBe(300.3);
    expect(toPaise(100.1) + toPaise(200.2)).toBe(toPaise(300.3));
    expect(fromPaise(toPaise(100.1) + toPaise(200.2))).toBe(300.3);
  });

  it("accepts Decimal-like strings and nullish values", () => {
    expect(toPaise("1250.75")).toBe(125075);
    expect(toPaise(null)).toBe(0);
    expect(toPaise(undefined)).toBe(0);
  });
});
