import type { SareeCodesService } from "./saree-codes.service";

/** For specs: a SareeCodesService with no aliases — every code is current. */
export const passthroughSareeCodes = {
  resolve: (code: string) => Promise.resolve((code ?? "").trim()),
  resolveMany: (codes: string[]) => Promise.resolve(codes.map((c) => (c ?? "").trim())),
  recodePurchases: () => Promise.resolve([]),
} as unknown as SareeCodesService;
