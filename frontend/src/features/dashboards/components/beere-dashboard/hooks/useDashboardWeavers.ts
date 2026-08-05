import { useQuery } from "@tanstack/react-query";
import { weaversApi, BackendWeaver } from "../../../../../shared/api/weavers";

/** Background colours for initials avatars (cycles through 5 options). */
const BG_COLORS = ["#9B6B8A", "#5A3E6B", "#2D6B6B", "#4A6B4A", "#6B4A3E"];

export interface DashboardWeaver {
  id: string;
  name: string;
  initials: string;
  img: string | null;
  village: string | null;
  mobile: string;
  looms: number;
  status: "active" | "inactive";
  bg: string;
}

function backendToDashboardWeaver(w: BackendWeaver, idx: number): DashboardWeaver {
  return {
    id: w.id,
    name: w.name,
    initials: w.initials,
    img: w.photoUrl || null,
    village: w.village,
    mobile: w.phone ? `×××× ${w.phone.slice(-4)}` : "—",
    looms: w.looms,
    status: w.status === "ACTIVE" ? "active" : "inactive",
    bg: BG_COLORS[idx % BG_COLORS.length] ?? "#9B6B8A",
  };
}

/**
 * Fetches the first 4 active weavers to display on the dashboard.
 * The full list lives in the Weavers module — this is a preview only.
 */
export function useDashboardWeavers() {
  return useQuery({
    queryKey: ["weavers", "dashboard-preview"],
    queryFn: async () => {
      const res = await weaversApi.list(100);
      return res.items
        .filter((w) => w.status === "ACTIVE")
        .slice(0, 4)
        .map((w, i) => backendToDashboardWeaver(w, i));
    },
    staleTime: 120_000,
  });
}
