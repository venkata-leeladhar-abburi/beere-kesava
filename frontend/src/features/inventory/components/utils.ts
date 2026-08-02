// ── Shared record helpers ──────────────────────────────────────────────────
export const getLoomForRecord = (id: string, weaverName: string): string => {
  const match = id.match(/-L(\d+)-/);
  if (match) return `L${match[1]}`;

  // Fallbacks based on weaverName
  const name = weaverName?.toLowerCase() || "";
  if (name.includes("padma") || name.includes("kamala")) return "L1";
  if (name.includes("ravi") || name.includes("suresh")) return "L2";
  if (name.includes("lakshmi") || name.includes("anand") || name.includes("venkat") || name.includes("loom 3")) return "L3";
  if (name.includes("meena") || name.includes("loom 4")) return "L4";
  if (name.includes("loom 1")) return "L1";
  if (name.includes("loom 2")) return "L2";

  return "Unknown";
};

export const getSareeColor = (id: string): string => {
  const colors = ["Crimson Red", "Golden Yellow", "Deep Pink", "Midnight Blue", "Kora Cream", "Teal Green", "Magenta Orange", "Emerald Gold", "Royal Violet"];
  let hash = 0;
  for (let i = 0; i < id.length; i++) {
    hash = id.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash) % colors.length;
  return colors[index];
};
