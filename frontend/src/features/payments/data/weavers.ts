import { T } from "../theme";
import { WeaverRecord } from "../types";

export const WEAVERS: WeaverRecord[] = [
  { id: "b5f9178c-b1b9-4871-a7c3-0d68a462d57a", name: "Ravi Kumar",   initials: "RK", bg: T.royalBurgundy, village: "Varanasi",      sb: 8, hz: 0, ps: 0, bs: 0, st: 0, advance: 2000,  status: "Pending" },
  { id: "8937070a-ea63-43f3-9cb4-dcbcfd362ff7", name: "Padma Veni",   initials: "PV", bg: "#C4923A",       village: "Rajatalab",     sb: 0, hz: 5, ps: 0, bs: 0, st: 0, advance: 3400,  status: "Pending" },
  { id: "11278a51-a26d-4eaa-adbf-bedbfa7fdf46", name: "Suresh Murti", initials: "SM", bg: T.taupe,         village: "Bhelupura",     sb: 0, hz: 0, ps: 4, bs: 0, st: 0, advance: 0,     status: "Paid"    },
  { id: "71413724-378d-4336-93dd-1db33cba3510", name: "Anand K.",     initials: "AK", bg: T.deepWine,      village: "Sigra",         sb: 0, hz: 0, ps: 0, bs: 5, st: 0, advance: 5000,  status: "Pending" },
  { id: "95cc89ea-6cf3-418c-bf9b-299e59f47389", name: "Meena R.",     initials: "MR", bg: "#A05080",       village: "Orderly Bazar", sb: 4, hz: 0, ps: 0, bs: 0, st: 0, advance: 1800,  status: "Pending" },
  { id: "51490482-11cf-425b-8d54-7bd918f6db18", name: "Kamala B.",    initials: "KB", bg: T.darkBurgundy,  village: "Varanasi",      sb: 0, hz: 6, ps: 0, bs: 0, st: 0, advance: 4000,  status: "Pending" },
  { id: "c7d8e833-dcd7-4a52-a867-f77d8ca2e1cf", name: "Venkat Rao",   initials: "VR", bg: T.green,         village: "Lanka",         sb: 0, hz: 0, ps: 8, bs: 0, st: 0, advance: 1200,  status: "Paid"    },
  { id: "d3fd5a81-7d3a-478d-9a0f-d65a5db6779a", name: "Lakshmi D.",   initials: "LD", bg: "#C4923A",       village: "Lahurabir",     sb: 5, hz: 0, ps: 0, bs: 0, st: 0, advance: 1000,  status: "Pending" },
];

export const RATE_ROWS = [
  { code: "SB-001", name: "Self Brocade",   rate: 450  },
  { code: "HZ-003", name: "Heavy Zari",     rate: 680  },
  { code: "PS-002", name: "Plain Silk",     rate: 280  },
  { code: "BS-004", name: "Bridal Special", rate: 1200 },
  { code: "ST-005", name: "Stripe Brocade", rate: 380  },
];
