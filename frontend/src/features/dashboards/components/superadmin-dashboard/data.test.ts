import { describe, expect, it } from "vitest";
import { NAV_GROUPS, PAGE_ROUTES, pageForTab, pathForPage } from "./data";

const navKeys = NAV_GROUPS.flatMap(group => group.pages.map(page => page.key));

describe("superadmin navigation routes", () => {
  // The regression this file exists for: "Sign-in Location" was added to
  // NAV_GROUPS but not to the route map, and because the lookup falls back
  // instead of failing, every click went to /superadmin/materials with no
  // error anywhere. A missing route is now a failing test, not a silent
  // redirect to an unrelated page.
  it("gives every nav entry a route of its own", () => {
    const missing = navKeys.filter(key => !PAGE_ROUTES[key]);
    expect(missing).toEqual([]);
  });

  it("round-trips every nav entry between its key and its URL", () => {
    for (const key of navKeys) {
      const tab = pathForPage(key).split("/").pop()!;
      expect(pageForTab(tab)).toBe(key);
    }
  });

  it("never points two pages at the same URL", () => {
    const paths = Object.values(PAGE_ROUTES);
    expect(new Set(paths).size).toBe(paths.length);
  });

  it("routes Sign-in Location to its own page", () => {
    expect(pathForPage("GeofenceSettings")).toBe("/superadmin/sign-in-location");
    expect(pageForTab("sign-in-location")).toBe("GeofenceSettings");
  });

  it("keeps the old fallbacks for anything unrecognised", () => {
    expect(pathForPage("NoSuchPage")).toBe("/superadmin/materials");
    expect(pageForTab("no-such-tab")).toBe("Overview");
    expect(pageForTab(undefined)).toBe("Overview");
  });
});
