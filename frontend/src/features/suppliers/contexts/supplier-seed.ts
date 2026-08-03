import { Supplier, Purchase, SupplierPayment, PurchaseRequest, SareeTag, buildSareeCode, computeFinalAmount } from "./supplier-types";

// ─────────────────────────────────────────────────────────────────────────────
// Seed data
// ─────────────────────────────────────────────────────────────────────────────

export const SEED_SUPPLIERS: Supplier[] = [
  { id: "SUP-001", name: "Ravi Silks", initials: "RS", contactName: "Ravi Prasad", phone: "+91 94900 11223", whatsapp: "+91 94900 11223", city: "Dharmavaram", state: "Andhra Pradesh", address: "22, Silk Market Road, Dharmavaram, Andhra Pradesh - 515671", gstCode: "37ABCRS1234F1Z5", specialty: "Plain Silk", terms: "30 days", bankName: "SBI", accountNo: "31009988771", notes: "Consistent quality plain silk. Preferred for summer stock.", status: "active", rating: 5 },
  { id: "SUP-002", name: "Mysore Sarees", initials: "MS", contactName: "Girish Rao", phone: "+91 98450 33445", city: "Mysore", state: "Karnataka", address: "8, Sayyaji Rao Road, Mysore, Karnataka - 570001", gstCode: "29MYSRS5678K1Z2", specialty: "Mysore Silk", terms: "45 days", bankName: "Canara Bank", accountNo: "11220033445", notes: "Authentic Mysore silk with silk mark certification.", status: "overdue", rating: 4 },
  { id: "SUP-003", name: "Chennai Silks", initials: "CS", contactName: "Karthik Subramanian", phone: "+91 90030 55667", whatsapp: "+91 90030 55667", city: "Chennai", state: "Tamil Nadu", address: "45, Usman Road, T. Nagar, Chennai, Tamil Nadu - 600017", gstCode: "33CHNSK9012L1Z8", specialty: "Kanjivaram", terms: "30 days", bankName: "HDFC", accountNo: "50100234455", notes: "Wide Kanjivaram range. Negotiable rates on bulk lots.", status: "active", rating: 4 },
  { id: "SUP-004", name: "Kanchipuram House", initials: "KH", contactName: "Murali Krishnan", phone: "+91 99400 77889", city: "Kanchipuram", state: "Tamil Nadu", address: "15, Gandhi Road, Kanchipuram, Tamil Nadu - 631501", gstCode: "33KNCH3456M1Z1", specialty: "Kanjivaram", terms: "60 days", bankName: "ICICI", accountNo: "62200114477", notes: "Premium bridal Kanjivaram. Longer lead times during season.", status: "active", rating: 5 },
  { id: "SUP-005", name: "Venkateshwara Handlooms", initials: "VH", contactName: "Srinivas Reddy", phone: "+91 91000 22334", city: "Ongole", state: "Andhra Pradesh", address: "3, Trunk Road, Ongole, Andhra Pradesh - 523001", gstCode: "37VENK7890N1Z6", specialty: "Plain Silk", terms: "15 days", bankName: "Axis Bank", accountNo: "91800223344", notes: "Small handloom cluster. Good for trial batches.", status: "active", rating: 3 },
  { id: "SUP-006", name: "Pochampally Coop", initials: "PC", contactName: "Anitha Rani", phone: "+91 95500 66778", whatsapp: "+91 95500 66778", city: "Pochampally", state: "Telangana", address: "Handloom Park, Bhoodan Pochampally, Telangana - 508284", gstCode: "36POCH2345P1Z9", specialty: "Patola", terms: "30 days", bankName: "Telangana Grameena Bank", accountNo: "77880011223", notes: "Cooperative society. Ikat and Patola specialists.", status: "active", rating: 4 },
];

const SEED_COLORS = ["Cream", "Maroon", "Red", "Blue", "Indigo", "Gold", "Black", "Pink", "Orange", "Purple"];

function weightFor(i: number) {
  return `${680 + ((i * 37) % 220)}g`;
}

function generateSarees(count: number, date: string, sareeType: string, supplier: string, invoiceNumber: string): SareeTag[] {
  return Array.from({ length: count }, (_, i) => {
    const price = 400 + ((i * 53) % 300);
    const sellPercent = 20 + ((i * 7) % 15);
    return {
      id: buildSareeCode(supplier, i + 1, invoiceNumber),
      weight: weightFor(i),
      date,
      sareeType,
      color: SEED_COLORS[i % SEED_COLORS.length] ?? "Cream",
      price,
      sellPercent,
      quantity: 1,
      finalAmount: computeFinalAmount(price, sellPercent, 1),
      notes: "",
    };
  });
}

const SEED_PURCHASE_RAW = [
  { id: "EXT-2026-0001", supplierId: "SUP-001", supplier: "Ravi Silks",              location: "Dharmavaram, AP", date: "01 Jun 2026", seedType: "Plain Silk",  sareeCount: 4,  gstNumber: "37ABCRS1234F1Z5", invoiceNumber: "INV-RS-2026-118", billAmount: "₹34,000",    status: "Paid",    notes: "Fresh stock for summer season", addedBy: "Admin" },
  { id: "EXT-2026-0002", supplierId: "SUP-002", supplier: "Mysore Sarees",           location: "Mysore, KA",      date: "05 Jun 2026", seedType: "Mysore Silk", sareeCount: 12, gstNumber: "29MYSRS5678K1Z2", invoiceNumber: "INV-MS-2026-552", billAmount: "₹74,400",    status: "Pending", notes: "Awaiting full payment", addedBy: "Superadmin" },
  { id: "EXT-2026-0003", supplierId: "SUP-003", supplier: "Chennai Silks",           location: "Chennai, TN",     date: "08 Jun 2026", seedType: "Kanjivaram",  sareeCount: 6,  gstNumber: "33CHNSK9012L1Z8", invoiceNumber: "INV-CS-2026-073", billAmount: "₹66,000",    status: "Partial", notes: "First instalment paid", addedBy: "Admin" },
  { id: "EXT-2026-0004", supplierId: "SUP-004", supplier: "Kanchipuram House",       location: "Kanchipuram, TN", date: "10 Jun 2026", seedType: "Kanjivaram",  sareeCount: 8,  gstNumber: "33KNCH3456M1Z1", invoiceNumber: "INV-KH-2026-209", billAmount: "₹88,000",    status: "Paid",    notes: "", addedBy: "Admin" },
  { id: "EXT-2026-0005", supplierId: "SUP-005", supplier: "Venkateshwara Handlooms", location: "Ongole, AP",      date: "11 Jun 2026", seedType: "Plain Silk",  sareeCount: 3,  gstNumber: "37VENK7890N1Z6", invoiceNumber: "INV-VH-2026-014", billAmount: "₹22,500",    status: "Paid",    notes: "Trial batch", addedBy: "Admin" },
  { id: "EXT-2026-0006", supplierId: "SUP-006", supplier: "Pochampally Coop",        location: "Pochampally, TG", date: "11 Jun 2026", seedType: "Patola",      sareeCount: 15, gstNumber: "36POCH2345P1Z9", invoiceNumber: "INV-PC-2026-301", billAmount: "₹1,20,000", status: "Pending", notes: "Inter-branch transfer", addedBy: "Superadmin" },
  { id: "EXT-2026-0007", supplierId: "SUP-001", supplier: "Ravi Silks",              location: "Dharmavaram, AP", date: "18 Apr 2026", seedType: "Plain Silk",  sareeCount: 7,  gstNumber: "37ABCRS1234F1Z5", invoiceNumber: "INV-RS-2026-092", billAmount: "₹52,500",    status: "Paid",    notes: "Repeat order", addedBy: "Admin" },
  { id: "EXT-2026-0008", supplierId: "SUP-003", supplier: "Chennai Silks",           location: "Chennai, TN",     date: "02 Mar 2026", seedType: "Kanjivaram",  sareeCount: 10, gstNumber: "33CHNSK9012L1Z8", invoiceNumber: "INV-CS-2026-018", billAmount: "₹1,10,000", status: "Paid",    notes: "Festive season stock", addedBy: "Superadmin" },
];

export const SEED_PURCHASES: Purchase[] = SEED_PURCHASE_RAW.map(({ seedType, sareeCount, ...p }) => ({
  ...p,
  sareeCount,
  sarees: generateSarees(sareeCount, p.date, seedType, p.supplier, p.invoiceNumber),
}));

export const SEED_PAYMENTS: SupplierPayment[] = [
  { id: "SPY-001", supplierId: "SUP-001", date: "03 Jun 2026", amount: 34000,  mode: "Bank Transfer", reference: "UTR-882910", purchaseId: "EXT-2026-0001", notes: "Full settlement" },
  { id: "SPY-002", supplierId: "SUP-001", date: "22 Apr 2026", amount: 52500,  mode: "Bank Transfer", reference: "UTR-771204", purchaseId: "EXT-2026-0007", notes: "Full settlement" },
  { id: "SPY-003", supplierId: "SUP-003", date: "12 Jun 2026", amount: 30000,  mode: "UPI",           reference: "UPI-5512309", purchaseId: "EXT-2026-0003", notes: "First instalment" },
  { id: "SPY-004", supplierId: "SUP-003", date: "06 Mar 2026", amount: 110000, mode: "Cheque",        reference: "CHQ-004411", purchaseId: "EXT-2026-0008", notes: "Full settlement" },
  { id: "SPY-005", supplierId: "SUP-004", date: "14 Jun 2026", amount: 88000,  mode: "Bank Transfer", reference: "UTR-990233", purchaseId: "EXT-2026-0004", notes: "Full settlement" },
  { id: "SPY-006", supplierId: "SUP-005", date: "13 Jun 2026", amount: 22500,  mode: "Cash",          reference: "CASH-0091",  purchaseId: "EXT-2026-0005", notes: "Paid on delivery" },
];

/** Saree lines for a seeded request, priced like a real submission. */
function requestSarees(supplier: string, invoice: string, date: string, sareeType: string, lines: { qty: number; price: number; sell: number; color: string; weight: string }[]): SareeTag[] {
  return lines.map((l, i) => ({
    id: buildSareeCode(supplier, i + 1, invoice),
    weight: l.weight,
    date,
    sareeType,
    color: l.color,
    price: l.price,
    sellPercent: l.sell,
    quantity: l.qty,
    finalAmount: computeFinalAmount(l.price, l.sell, l.qty),
    notes: "",
  }));
}

export const SEED_REQUESTS: PurchaseRequest[] = [
  {
    id: "EPR-001", supplierId: "SUP-004", supplierName: "Kanchipuram House", requestedBy: "Admin",
    requestedDate: "20 Jul 2026", sareeType: "Kanjivaram", quantity: 20, estimatedAmount: 240000,
    urgency: "Urgent", reason: "Bridal season stock running low.", status: "pending",
    location: "Kanchipuram, TN", gstNumber: "33KNCH3456M1Z1", invoiceNumber: "INV-KH-2026-244",
    purchaseDate: "20 Jul 2026", billAmount: "₹2,40,000",
    notes: "Bridal collection for the festive window. Confirm delivery before 10 Aug.",
    sarees: requestSarees("Kanchipuram House", "INV-KH-2026-244", "20 Jul 2026", "Kanjivaram", [
      { qty: 8, price: 9000,  sell: 28, color: "Maroon", weight: "890g" },
      { qty: 7, price: 10500, sell: 25, color: "Gold",   weight: "915g" },
      { qty: 5, price: 12000, sell: 30, color: "Red",    weight: "940g" },
    ]),
  },
  { id: "EPR-002", supplierId: "SUP-006", supplierName: "Pochampally Coop",  requestedBy: "Admin", requestedDate: "12 Jul 2026", sareeType: "Patola",     quantity: 12, estimatedAmount: 96000,  urgency: "Normal", reason: "Replenish Ikat range for the shop floor.", status: "approved", decidedBy: "Superadmin", decidedDate: "14 Jul 2026" },
];
