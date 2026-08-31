import { describe, expect, it } from "vitest";
import { QueryClient } from "@tanstack/react-query";
import {
  patchListItems,
  prependToList,
  removeFromList,
  removeFromListWhere,
  upsertInList,
} from "./cacheUpdates";

interface Row {
  id: string;
  name: string;
  totalSpend: number;
}

const KEY = ["rows"] as const;

function clientWith(rows: Row[] | undefined) {
  const qc = new QueryClient();
  if (rows) qc.setQueryData(KEY, rows);
  return qc;
}

describe("upsertInList", () => {
  it("merges a partial update onto the existing row", () => {
    const qc = clientWith([{ id: "a", name: "Old", totalSpend: 5000 }]);

    upsertInList<Row>(qc, KEY, { id: "a", name: "New" });

    // totalSpend is computed by the list endpoint and absent from the write
    // response — it must survive rather than being blanked to undefined.
    expect(qc.getQueryData(KEY)).toEqual([{ id: "a", name: "New", totalSpend: 5000 }]);
  });

  it("inserts an unseen row at the front, filling computed fields from seed", () => {
    const qc = clientWith([{ id: "a", name: "A", totalSpend: 5000 }]);

    upsertInList<Row>(qc, KEY, { id: "b", name: "B" }, { seed: { totalSpend: 0 } });

    expect(qc.getQueryData(KEY)).toEqual([
      { id: "b", name: "B", totalSpend: 0 },
      { id: "a", name: "A", totalSpend: 5000 },
    ]);
  });

  it("honours position: end for lists ordered oldest-first", () => {
    const qc = clientWith([{ id: "a", name: "A", totalSpend: 0 }]);

    upsertInList<Row>(qc, KEY, { id: "b", name: "B" }, { seed: { totalSpend: 0 }, position: "end" });

    expect((qc.getQueryData(KEY) as Row[]).map((r) => r.id)).toEqual(["a", "b"]);
  });

  it("leaves an unloaded query alone rather than inventing a one-row list", () => {
    const qc = clientWith(undefined);

    upsertInList<Row>(qc, KEY, { id: "a", name: "A" });

    expect(qc.getQueryData(KEY)).toBeUndefined();
  });

  it("does not mutate the previous array in place", () => {
    const before: Row[] = [{ id: "a", name: "Old", totalSpend: 1 }];
    const qc = clientWith(before);

    upsertInList<Row>(qc, KEY, { id: "a", name: "New" });

    // React Query relies on reference identity to decide whether to re-render;
    // mutating in place would leave the screen stale.
    expect(before[0].name).toBe("Old");
    expect(qc.getQueryData(KEY)).not.toBe(before);
  });
});

describe("removeFromList", () => {
  it("drops the matching row", () => {
    const qc = clientWith([
      { id: "a", name: "A", totalSpend: 0 },
      { id: "b", name: "B", totalSpend: 0 },
    ]);

    removeFromList<Row>(qc, KEY, "a");

    expect((qc.getQueryData(KEY) as Row[]).map((r) => r.id)).toEqual(["b"]);
  });

  it("no-ops on an unloaded query", () => {
    const qc = clientWith(undefined);
    removeFromList<Row>(qc, KEY, "a");
    expect(qc.getQueryData(KEY)).toBeUndefined();
  });
});

describe("prependToList", () => {
  it("adds an entry to the front of an append-only log", () => {
    const qc = clientWith([{ id: "a", name: "A", totalSpend: 0 }]);

    prependToList<Row>(qc, KEY, { id: "b", name: "B", totalSpend: 0 });

    expect((qc.getQueryData(KEY) as Row[]).map((r) => r.id)).toEqual(["b", "a"]);
  });

  it("no-ops on an unloaded query", () => {
    const qc = clientWith(undefined);
    prependToList<Row>(qc, KEY, { id: "b", name: "B", totalSpend: 0 });
    expect(qc.getQueryData(KEY)).toBeUndefined();
  });
});

interface Batch {
  batchId: string;
  rows: { serial: number; tallied: boolean }[];
}

const BATCH_KEY = ["batches"] as const;

describe("patchListItems", () => {
  it("patches rows selected by an arbitrary key, not just id", () => {
    const qc = new QueryClient();
    qc.setQueryData(BATCH_KEY, [
      { batchId: "B1", rows: [] },
      { batchId: "B2", rows: [] },
    ] as Batch[]);

    patchListItems<Batch>(qc, BATCH_KEY, (b) => b.batchId === "B2", {
      rows: [{ serial: 1, tallied: true }],
    });

    expect(qc.getQueryData<Batch[]>(BATCH_KEY)).toEqual([
      { batchId: "B1", rows: [] },
      { batchId: "B2", rows: [{ serial: 1, tallied: true }] },
    ]);
  });

  it("accepts a function patch so nested rows can be rewritten from current state", () => {
    const qc = new QueryClient();
    qc.setQueryData(BATCH_KEY, [
      { batchId: "B1", rows: [{ serial: 1, tallied: false }, { serial: 2, tallied: false }] },
    ] as Batch[]);

    patchListItems<Batch>(qc, BATCH_KEY, (b) => b.batchId === "B1", (b) => ({
      ...b,
      rows: b.rows.map((r) => (r.serial === 2 ? { ...r, tallied: true } : r)),
    }));

    expect(qc.getQueryData<Batch[]>(BATCH_KEY)?.[0].rows).toEqual([
      { serial: 1, tallied: false },
      { serial: 2, tallied: true },
    ]);
  });

  it("no-ops on an unloaded query", () => {
    const qc = new QueryClient();
    patchListItems<Batch>(qc, BATCH_KEY, () => true, { rows: [] });
    expect(qc.getQueryData(BATCH_KEY)).toBeUndefined();
  });
});

describe("removeFromListWhere", () => {
  it("drops rows selected by an arbitrary key", () => {
    const qc = new QueryClient();
    qc.setQueryData(BATCH_KEY, [{ batchId: "B1", rows: [] }, { batchId: "B2", rows: [] }] as Batch[]);

    removeFromListWhere<Batch>(qc, BATCH_KEY, (b) => b.batchId === "B1");

    expect(qc.getQueryData<Batch[]>(BATCH_KEY)?.map((b) => b.batchId)).toEqual(["B2"]);
  });

  it("no-ops on an unloaded query", () => {
    const qc = new QueryClient();
    removeFromListWhere<Batch>(qc, BATCH_KEY, () => true);
    expect(qc.getQueryData(BATCH_KEY)).toBeUndefined();
  });
});
