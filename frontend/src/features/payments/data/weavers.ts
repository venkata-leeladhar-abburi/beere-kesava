import { T } from "../theme";
import { WeaverRecord } from "../types";

export const WEAVERS: WeaverRecord[] = [
  { id: "WV-001", name: "Ravi Kumar",   initials: "RK", bg: T.royalBurgundy, village: "Varanasi",      sb: 8, hz: 0, ps: 0, bs: 0, st: 0, advance: 2000,  status: "Pending" },
  { id: "WV-002", name: "Padma Veni",   initials: "PV", bg: "#C4923A",       village: "Rajatalab",     sb: 0, hz: 5, ps: 0, bs: 0, st: 0, advance: 3400,  status: "Pending" },
  { id: "WV-007", name: "Suresh Murti", initials: "SM", bg: T.taupe,         village: "Bhelupura",     sb: 0, hz: 0, ps: 4, bs: 0, st: 0, advance: 0,     status: "Paid"    },
  { id: "WV-005", name: "Anand K.",     initials: "AK", bg: T.deepWine,      village: "Sigra",         sb: 0, hz: 0, ps: 0, bs: 5, st: 0, advance: 5000,  status: "Pending" },
  { id: "WV-012", name: "Meena R.",     initials: "MR", bg: "#A05080",       village: "Orderly Bazar", sb: 4, hz: 0, ps: 0, bs: 0, st: 0, advance: 1800,  status: "Pending" },
  { id: "WV-031", name: "Kamala B.",    initials: "KB", bg: T.darkBurgundy,  village: "Varanasi",      sb: 0, hz: 6, ps: 0, bs: 0, st: 0, advance: 4000,  status: "Pending" },
  { id: "WV-024", name: "Venkat Rao",   initials: "VR", bg: T.green,         village: "Lanka",         sb: 0, hz: 0, ps: 8, bs: 0, st: 0, advance: 1200,  status: "Paid"    },
  { id: "WV-018", name: "Lakshmi D.",   initials: "LD", bg: "#C4923A",       village: "Lahurabir",     sb: 5, hz: 0, ps: 0, bs: 0, st: 0, advance: 1000,  status: "Pending" },
];

export const RATE_ROWS = [
  { code: "SB-001", name: "Self Brocade",   rate: 450  },
  { code: "HZ-003", name: "Heavy Zari",     rate: 680  },
  { code: "PS-002", name: "Plain Silk",     rate: 280  },
  { code: "BS-004", name: "Bridal Special", rate: 1200 },
  { code: "ST-005", name: "Stripe Brocade", rate: 380  },
];
