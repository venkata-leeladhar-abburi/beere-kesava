export const ACTION_ENTRIES = [
  { id: 1,  role: "WORKER STAFF",    user: "Ravi Kumar",      time: "Today · 11:42 AM", action: "Issued 4.5 kg Warp, Resham Red 800g, and Jari PLY-2G-Gold 6 Reels to weaver Padma Veni",  module: "MATERIALS",  record: "BATCH-086",    oldVal: null,          newVal: null },
  { id: 2,  role: "ADMIN",           user: "Admin (BK)",      time: "Today · 11:38 AM", action: "Approved warp request from weaver Suresh Murti — 4 kg Warp for BATCH-081",                module: "WEAVERS",    record: "BATCH-081",    oldVal: null,          newVal: null },
  { id: 3,  role: "SUPERADMIN",      user: "Superadmin",      time: "Today · 11:30 AM", action: "Changed making charge rate for Self Brocade SB-001",                                        module: "RATES",      record: "SB-001",       oldVal: "₹420/saree",  newVal: "₹450/saree" },
  { id: 4,  role: "SHOP STAFF",      user: "Shop Staff (SS)", time: "Today · 11:15 AM", action: "Recorded retail sale — saree PADMA-L1-001 sold to Smt. Annapurna Devi · ₹8,500",          module: "SALES",      record: "SALE-0231",    oldVal: null,          newVal: null },
  { id: 5,  role: "FINISHING STAFF", user: "Finishing (FS)",  time: "Today · 10:58 AM", action: "Completed quality check for BATCH-079 — 6 sarees passed, 0 rejected",                     module: "PRODUCTION", record: "BATCH-079",    oldVal: null,          newVal: null },
  { id: 6,  role: "WORKER STAFF",    user: "Worker (WS)",     time: "Today · 10:45 AM", action: "Received 50 kg Warp from Sri Venkateswara Textiles — GRN created",                         module: "MATERIALS",  record: "SRI-WARP-001", oldVal: null,          newVal: null },
  { id: 7,  role: "ADMIN",           user: "Admin (MK)",      time: "Today · 10:30 AM", action: "Created Purchase Order PO-2026-022 for Sri Venkateswara Textiles · ₹1,40,000",             module: "MATERIALS",  record: "PO-2026-022",  oldVal: null,          newVal: null },
  { id: 8,  role: "SUPERADMIN",      user: "Superadmin",      time: "Today · 10:15 AM", action: "Approved Purchase Order PO-2026-021 for Kanchipuram Silks · ₹3,75,000",                   module: "APPROVALS",  record: "PO-2026-021",  oldVal: null,          newVal: null },
  { id: 9,  role: "WORKER STAFF",    user: "Worker (WS)",     time: "Today · 9:55 AM",  action: "Recorded QC defect on saree RAVI-L2-008 — Thread break defect · Making charge zeroed",    module: "PRODUCTION", record: "RAVI-L2-008",  oldVal: null,          newVal: null },
  { id: 10, role: "ADMIN",           user: "Admin (RK)",      time: "Today · 9:40 AM",  action: "Added new bulk order — Lakshmi Silks · 80 sarees · Design BKB-045 · Due 28 May 2026",    module: "CUSTOMERS",  record: "ORD-2026-041", oldVal: null,          newVal: null },
  { id: 11, role: "SHOP STAFF",      user: "Shop Staff (SS)", time: "Today · 9:20 AM",  action: "Processed return — saree PADMA-L1-002 returned by Smt. Lakshmi Bai",                     module: "SALES",      record: "RET-0021",     oldVal: null,          newVal: null },
  { id: 12, role: "FINISHING STAFF", user: "Finishing (FS)",  time: "Today · 9:05 AM",  action: "Dispatched 6 sarees to Lakshmi Silks — INV-2026-041 · LR uploaded",                     module: "PRODUCTION", record: "INV-2026-041", oldVal: null,          newVal: null },
];

export type LoginEvent = { id: number; status: "login"|"logout"|"failed"; user: string; role: string; time: string; device: string; duration: string | null; failReason?: string };
export const LOGIN_ENTRIES: LoginEvent[] = [
  { id: 1,  status: "login",  user: "Superadmin",        role: "Superadmin",      time: "Today · 9:00 AM",      device: "Web Browser",     duration: null,                  failReason: undefined },
  { id: 2,  status: "login",  user: "Admin (BK)",        role: "Admin",           time: "Today · 9:05 AM",      device: "Web Browser",     duration: null,                  failReason: undefined },
  { id: 3,  status: "login",  user: "Worker Staff (WS)", role: "Worker Staff",    time: "Today · 8:45 AM",      device: "Mobile",          duration: null,                  failReason: undefined },
  { id: 4,  status: "logout", user: "Admin (RK)",        role: "Admin",           time: "Today · 8:40 AM",      device: "Web Browser",     duration: "3 hours 12 minutes",  failReason: undefined },
  { id: 5,  status: "login",  user: "Admin (RK)",        role: "Admin",           time: "Today · 8:38 AM",      device: "Web Browser",     duration: null,                  failReason: undefined },
  { id: 6,  status: "login",  user: "Finishing (FS)",    role: "Finishing Staff", time: "Today · 8:30 AM",      device: "Mobile",          duration: null,                  failReason: undefined },
  { id: 7,  status: "failed", user: "Unknown",           role: "—",               time: "Today · 8:25 AM",      device: "Mobile",          duration: null,                  failReason: "Incorrect OTP entered · Attempt 1 of 3" },
  { id: 8,  status: "login",  user: "Shop Staff (SS)",   role: "Shop Staff",      time: "Today · 8:20 AM",      device: "Mobile / Tablet", duration: null,                  failReason: undefined },
  { id: 9,  status: "logout", user: "Worker (WK2)",      role: "Worker Staff",    time: "Yesterday · 6:45 PM",  device: "Mobile",          duration: "8 hours 20 minutes",  failReason: undefined },
  { id: 10, status: "login",  user: "Admin (MK)",        role: "Admin",           time: "Yesterday · 9:10 AM",  device: "Web Browser",     duration: "9 hours 35 minutes",  failReason: undefined },
];
