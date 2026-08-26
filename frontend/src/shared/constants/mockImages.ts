import { resolveAssetUrl } from "../api/uploads";

/**
 * Placeholder/demo imagery — hero backdrops and the fallbacks shown when a
 * record has no photo of its own yet.
 *
 * These used to be hotlinked straight from images.unsplash.com. They now live
 * in our own Cloudflare R2 bucket under mock/, served through the API's
 * /uploads route, so the UI does not depend on a third-party CDN staying up
 * (or on Unsplash's hotlink rate limits) to render a page.
 *
 * Unlike the imports in imageData.ts / weaverImages.ts, these are NOT bundled
 * by Vite: they are fetched at runtime, which is what keeps demo art out of
 * the JS bundle. Real brand assets should stay as imports.
 */
function mockImage(name: string): string {
  // Non-null: resolveAssetUrl only returns null for an empty input.
  return resolveAssetUrl(`/uploads/mock/${name}`)!;
}

/** Fallback visiting card shown on a customer with no card uploaded. */
export const imgVisitingCardPlaceholder = mockImage("visiting-card.jpg");

/** Firms dashboard hero backdrop. */
export const imgFirmsHero = mockImage("firms-hero.jpg");

/** Shop-staff portal hero backdrop. */
export const imgShopBg = mockImage("shop-bg.jpg");

/** Silk/fabric backdrop, used behind batch and shop-staff panels. */
export const imgSilkBg = mockImage("silk-bg.jpg");

/** Fallback colour-slip photo on a design with none attached. */
export const imgDesignSlipPlaceholder = mockImage("design-slip.jpg");

/** Weaver portal hero backdrop. */
export const imgWeaverPortalBg = mockImage("weaver-portal-bg.jpg");

/** Generic saree photo used on batch tally and batch cards. */
export const imgSareeMock = mockImage("saree.jpg");
