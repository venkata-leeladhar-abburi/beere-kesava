import { Receipt } from "lucide-react";

import { Invoice, PayHistRecord } from "../types";

export const PAY_HISTORY: PayHistRecord[] = [
  { id:"PH-010", date:"30 May 2026", type:"Vendor Payment",   party:"Vijaylakshmi Silks",  refNo:"VP-2026-004", description:"Partial payment — silk fabric batch",  invoicePO:"PO-2026-034", amount:200000, status:"Paid",    mode:"Bank Transfer", utr:"UTR20260530BVS",  recordedBy:"Admin" },
  { id:"PH-009", date:"28 May 2026", type:"Weaver Payment",   party:"Suresh Murti",        refNo:"WV-007",      description:"Making charges — May 2026",            amount:1120,   status:"Paid",    mode:"Bank Transfer", utr:"UTR20260528SM1",  recordedBy:"Admin" },
  { id:"PH-008", date:"28 May 2026", type:"Weaver Payment",   party:"Venkat Rao",          refNo:"WV-024",      description:"Making charges — May 2026",            amount:1040,   status:"Paid",    mode:"Bank Transfer", utr:"UTR20260528VR2",  recordedBy:"Admin" },
  { id:"PH-007", date:"25 May 2026", type:"Customer Receipt", party:"Meenakshi Silks",     refNo:"INV-2026-029",description:"Partial collection — May order",        amount:420000, status:"Partial", mode:"Bank Transfer",                         recordedBy:"Admin" },
  { id:"PH-006", date:"22 May 2026", type:"Customer Receipt", party:"Kalavathi Exports",   refNo:"INV-2026-027",description:"Final balance received",                amount:614400, status:"Paid",    mode:"Bank Transfer", utr:"UTR20260522KE",   recordedBy:"Admin" },
  { id:"PH-005", date:"18 May 2026", type:"Weaver Payment",   party:"Kamala B.",           refNo:"WV-031",      description:"Making charges — May 2026",            amount:4080,   status:"Paid",    mode:"Bank Transfer", utr:"UTR20260518KB3",  recordedBy:"Admin" },
  { id:"PH-004", date:"15 May 2026", type:"Vendor Payment",   party:"Nanak Silk Traders",  refNo:"VP-2026-003", description:"Full payment — silk fabric stock",      invoicePO:"PO-2026-037", amount:240000, status:"Paid", mode:"Bank Transfer", utr:"UTR20260515NST", recordedBy:"Admin" },
  { id:"PH-003", date:"15 May 2026", type:"Customer Receipt", party:"Vijaya Silk House",   refNo:"INV-2026-035",description:"Invoice cleared in full",               amount:280000, status:"Paid",    mode:"Bank Transfer", utr:"UTR20260515VSH",  recordedBy:"Admin" },
  { id:"PH-002", date:"12 May 2026", type:"Vendor Payment",   party:"Banarasi Thread House",refNo:"VP-2026-002",description:"Thread batch payment — May",           invoicePO:"PO-2026-040", amount:180000, status:"Paid", mode:"Bank Transfer", utr:"UTR20260512BTH", recordedBy:"Admin" },
  { id:"PH-001", date:"10 May 2026", type:"Customer Receipt", party:"Lakshmi Silks",       refNo:"INV-2026-041",description:"Full invoice cleared",                  amount:900000, status:"Paid",    mode:"Bank Transfer", utr:"UTR20260510LS",   recordedBy:"Admin" },
];
