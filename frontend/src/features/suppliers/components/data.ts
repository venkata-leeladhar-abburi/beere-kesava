// Static / cross-section data for the Suppliers feature.

import { T } from "./theme";

export const STATES = ["Andhra Pradesh", "Telangana", "Tamil Nadu", "Karnataka", "Gujarat", "Uttar Pradesh", "Maharashtra", "Kerala"];
export const PAYMENT_TERMS = ["30 days", "15 days", "45 days", "60 days", "90 days", "Advance"];
export const SPECIALTIES = ["Plain Silk", "Kanjivaram", "Mysore Silk", "Patola", "Banarasi", "Gadwal", "Pochampally Ikat", "Mixed"];

export const MONTH_ABBR = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
export const TYPE_FILLS = [T.royalBurgundy, T.antiqueGold, T.green, "#5A3E6B", "#2D6B6B", "#8A2440"];
export const MODE_FILLS: Record<string, string> = {
  "Bank Transfer": T.royalBurgundy, "UPI": T.antiqueGold, "Cash": T.green, "Cheque": "#5A3E6B",
};
