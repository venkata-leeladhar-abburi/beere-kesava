import { returnedPieceSet } from "./returned-pieces";

describe("returnedPieceSet", () => {
  it("treats the first N pieces as returned when none are named (legacy lines)", () => {
    expect([...returnedPieceSet(5, 2)].sort()).toEqual([1, 2]);
  });

  it("uses the named pieces when they cover the count", () => {
    expect([...returnedPieceSet(8, 2, [5, 7])].sort()).toEqual([5, 7]);
  });

  it("fills a legacy remainder from the lowest positions not already named", () => {
    expect([...returnedPieceSet(8, 3, [1, 6])].sort()).toEqual([1, 2, 6]);
  });

  it("never exceeds the line's quantity or the returned count", () => {
    expect(returnedPieceSet(3, 9, [2]).size).toBe(3);
    expect(returnedPieceSet(3, 1, [2, 3]).size).toBe(1);
  });
});
