/**
 * Hero background photograph shared by every page that renders a burgundy hero
 * banner — dashboards, bulk orders, customers, materials, factory looms,
 * suppliers, vendors, weavers and the weaver portal.
 *
 * It lived in `features/portals/components/weaver-portal/WeaverBatchNotifData`,
 * which meant ten unrelated features deep-imported the portals feature just to
 * read a URL — the cross-feature reach-in `import/no-restricted-paths` flags.
 * It is a shared asset reference, not weaver-portal domain data.
 */
export const BG_IMAGE =
  "https://images.unsplash.com/photo-1707978932202-751b08324daf?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1400";
