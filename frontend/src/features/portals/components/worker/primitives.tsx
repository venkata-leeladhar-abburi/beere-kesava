/**
 * The worker portal's chrome now lives in `shared/ui/portal/PortalChrome.tsx`
 * so the Weaver portal renders the identical elements. Re-exported here so the
 * existing worker call sites keep their import path.
 */
export {
  PageHero,
  StatsStrip,
  SectionCard,
  SectionHeading,
  HERO_SERIF,
  GUTTER_X,
  GUTTER_X_TABLET,
  type WorkerStat,
} from "@/shared/ui/portal/PortalChrome";
