import React, { createContext, useContext, useState, useCallback } from "react";

// ─── Types ─────────────────────────────────────────────────────────────────────

export interface Firm {
  id: string;
  firmName: string;
  gstNumber?: string;
  address?: string;
  accountNumber?: string;
  ifscCode?: string;
  bankName?: string;
  contactPersonName?: string;
  contactPersonPhone?: string;
  purchaseAmount?: number;
  createdAt: string;
}

export type IncomeCategory = "Wholesale Sale" | "Retail Sale" | "Other";
export type ExpenseCategory =
  | "Weaver Payments"
  | "Material Purchase"
  | "Shop Maintenance"
  | "Factory Maintenance"
  | "Salaries"
  | "Other";
export type MiscType = "income" | "expense";

export interface FinancialEntry {
  id: string;
  description: string;
  amount: number;
  date: string;
  category: IncomeCategory | ExpenseCategory;
}

export interface MiscEntry {
  id: string;
  description: string;
  amount: number;
  date: string;
  notes?: string;
  type: MiscType;
}

export interface FirmFinancials {
  firmId: string;
  income: FinancialEntry[];
  expenses: FinancialEntry[];
  misc: MiscEntry[];
}

// ─── Seed data ────────────────────────────────────────────────────────────────

const INITIAL_FIRMS: Firm[] = [
  {
    id: "FIRM-001",
    firmName: "Surat Zari Works",
    gstNumber: "24ABCDE1234F1Z5",
    address: "Plot 42, GIDC Industrial Area, Katargam, Surat, Gujarat – 395004",
    accountNumber: "001234567890",
    ifscCode: "SBIN0001234",
    bankName: "State Bank of India",
    contactPersonName: "Rameshbhai Patel",
    contactPersonPhone: "9876543210",
    purchaseAmount: 1920000,
    createdAt: "2026-01-10",
  },
  {
    id: "FIRM-002",
    firmName: "Kanchipuram Silks",
    gstNumber: "33FGHIJ5678K2L6",
    address: "No. 7, Silk Weavers Street, Kanchipuram, Tamil Nadu – 631501",
    accountNumber: "009876543210",
    ifscCode: "HDFC0002345",
    bankName: "HDFC Bank",
    contactPersonName: "Subramaniam Iyer",
    contactPersonPhone: "9123456789",
    purchaseAmount: 3750000,
    createdAt: "2026-01-15",
  },
  {
    id: "FIRM-003",
    firmName: "Sri Venkateswara Textiles",
    gstNumber: "37KLMNO9012P3Q7",
    address: "D.No. 18-2-45, MG Road, Ongole, Andhra Pradesh – 523001",
    accountNumber: "001122334455",
    ifscCode: "ANDB0003456",
    bankName: "Andhra Bank",
    contactPersonName: "Venkata Rao",
    contactPersonPhone: "9988776655",
    purchaseAmount: 2800000,
    createdAt: "2026-02-01",
  },
  {
    id: "FIRM-004",
    firmName: "Lakshmi Silk Traders",
    gstNumber: "29PQRST3456U4V8",
    address: "Shop 5, Silk Market, Commercial Street, Bengaluru, Karnataka – 560001",
    accountNumber: "005544332211",
    ifscCode: "ICIC0004567",
    bankName: "ICICI Bank",
    contactPersonName: "Lakshmi Devi",
    contactPersonPhone: "9811223344",
    purchaseAmount: 1540000,
    createdAt: "2026-02-14",
  },
  {
    id: "FIRM-005",
    firmName: "AK Traders",
    address: "Hyderabad, Telangana – 500001",
    contactPersonName: "Anwar Khan",
    contactPersonPhone: "9700112233",
    purchaseAmount: 860000,
    createdAt: "2026-03-05",
  },
];

const INITIAL_FINANCIALS: FirmFinancials[] = [
  {
    firmId: "FIRM-001",
    income: [
      { id: "INC-001-1", description: "Wholesale order — Mysore Crepe batch", amount: 420000, date: "2026-06-10", category: "Wholesale Sale" },
      { id: "INC-001-2", description: "Retail walk-in — Heavy Zari collection", amount: 85000,  date: "2026-06-18", category: "Retail Sale" },
      { id: "INC-001-3", description: "Kanjivaram special order", amount: 310000, date: "2026-06-25", category: "Wholesale Sale" },
    ],
    expenses: [
      { id: "EXP-001-1", description: "Weaver payment — Padma Veni (June)", amount: 95000, date: "2026-06-05", category: "Weaver Payments" },
      { id: "EXP-001-2", description: "Raw silk purchase — Bangalore supplier", amount: 215000, date: "2026-06-12", category: "Material Purchase" },
      { id: "EXP-001-3", description: "Factory electricity & maintenance",      amount: 18000,  date: "2026-06-20", category: "Factory Maintenance" },
    ],
    misc: [
      { id: "MSC-001-1", description: "Festival bonus to staff", amount: 25000, date: "2026-06-15", notes: "Eid bonus — 5 staff members", type: "expense" },
    ],
  },
  {
    firmId: "FIRM-002",
    income: [
      { id: "INC-002-1", description: "Wholesale dispatch — Kanchipuram bundle",  amount: 780000, date: "2026-06-08", category: "Wholesale Sale" },
      { id: "INC-002-2", description: "Retail silk sale — premium segment",       amount: 120000, date: "2026-06-22", category: "Retail Sale" },
    ],
    expenses: [
      { id: "EXP-002-1", description: "Zari thread bulk purchase",  amount: 340000, date: "2026-06-03", category: "Material Purchase" },
      { id: "EXP-002-2", description: "Staff salaries — June",      amount: 180000, date: "2026-06-01", category: "Salaries" },
      { id: "EXP-002-3", description: "Shop air-conditioning repair", amount: 22000, date: "2026-06-14", category: "Shop Maintenance" },
    ],
    misc: [],
  },
  {
    firmId: "FIRM-003",
    income: [
      { id: "INC-003-1", description: "Gadwal Cotton wholesale",  amount: 290000, date: "2026-06-12", category: "Wholesale Sale" },
    ],
    expenses: [
      { id: "EXP-003-1", description: "Weaver payments — June batch", amount: 145000, date: "2026-06-04", category: "Weaver Payments" },
      { id: "EXP-003-2", description: "Cotton yarn purchase",          amount: 98000,  date: "2026-06-09", category: "Material Purchase" },
    ],
    misc: [
      { id: "MSC-003-1", description: "Exhibition participation fee", amount: 15000, date: "2026-06-18", notes: "Handloom expo Hyderabad", type: "expense" },
      { id: "MSC-003-2", description: "Commission from referral",     amount: 8500,  date: "2026-06-20", notes: "Referral fee from Suresh Traders", type: "income" },
    ],
  },
  { firmId: "FIRM-004", income: [], expenses: [], misc: [] },
  { firmId: "FIRM-005", income: [], expenses: [], misc: [] },
];

// ─── Context ──────────────────────────────────────────────────────────────────

interface FirmsContextValue {
  firms: Firm[];
  financials: FirmFinancials[];
  addFirm: (firm: Omit<Firm, "id" | "createdAt">) => void;
  updateFirm: (id: string, updates: Omit<Firm, "id" | "createdAt">) => void;
  deleteFirm: (id: string) => void;
  addIncomeEntry: (firmId: string, entry: Omit<FinancialEntry, "id">) => void;
  addExpenseEntry: (firmId: string, entry: Omit<FinancialEntry, "id">) => void;
  addMiscEntry: (firmId: string, entry: Omit<MiscEntry, "id">) => void;
  bulkAddIncome: (firmId: string, entries: Omit<FinancialEntry, "id">[]) => void;
  bulkAddExpenses: (firmId: string, entries: Omit<FinancialEntry, "id">[]) => void;
  getFirmFinancials: (firmId: string) => FirmFinancials;
}

const FirmsContext = createContext<FirmsContextValue | null>(null);

function mkId(prefix: string) { return `${prefix}-${Date.now()}-${Math.floor(Math.random() * 1000)}`; }

export function FirmsProvider({ children }: { children: React.ReactNode }) {
  const [firms, setFirms] = useState<Firm[]>(INITIAL_FIRMS);
  const [financials, setFinancials] = useState<FirmFinancials[]>(INITIAL_FINANCIALS);
  const [nextNum, setNextNum] = useState(6);

  const ensureFirmFinancials = useCallback((firmId: string) => {
    setFinancials(prev => {
      if (prev.find(f => f.firmId === firmId)) return prev;
      return [...prev, { firmId, income: [], expenses: [], misc: [] }];
    });
  }, []);

  const addFirm = useCallback((data: Omit<Firm, "id" | "createdAt">) => {
    const id = `FIRM-${String(nextNum).padStart(3, "0")}`;
    setNextNum(n => n + 1);
    setFirms(prev => [{ ...data, id, createdAt: new Date().toISOString().split("T")[0] }, ...prev]);
    setFinancials(prev => [...prev, { firmId: id, income: [], expenses: [], misc: [] }]);
  }, [nextNum]);

  const updateFirm = useCallback((id: string, updates: Omit<Firm, "id" | "createdAt">) => {
    setFirms(prev => prev.map(f => f.id === id ? { ...f, ...updates } : f));
  }, []);

  const deleteFirm = useCallback((id: string) => {
    setFirms(prev => prev.filter(f => f.id !== id));
  }, []);

  const addIncomeEntry = useCallback((firmId: string, entry: Omit<FinancialEntry, "id">) => {
    ensureFirmFinancials(firmId);
    setFinancials(prev => prev.map(f =>
      f.firmId === firmId ? { ...f, income: [{ ...entry, id: mkId("INC") }, ...f.income] } : f
    ));
  }, [ensureFirmFinancials]);

  const addExpenseEntry = useCallback((firmId: string, entry: Omit<FinancialEntry, "id">) => {
    ensureFirmFinancials(firmId);
    setFinancials(prev => prev.map(f =>
      f.firmId === firmId ? { ...f, expenses: [{ ...entry, id: mkId("EXP") }, ...f.expenses] } : f
    ));
  }, [ensureFirmFinancials]);

  const addMiscEntry = useCallback((firmId: string, entry: Omit<MiscEntry, "id">) => {
    ensureFirmFinancials(firmId);
    setFinancials(prev => prev.map(f =>
      f.firmId === firmId ? { ...f, misc: [{ ...entry, id: mkId("MSC") }, ...f.misc] } : f
    ));
  }, [ensureFirmFinancials]);

  const bulkAddIncome = useCallback((firmId: string, entries: Omit<FinancialEntry, "id">[]) => {
    ensureFirmFinancials(firmId);
    setFinancials(prev => prev.map(f =>
      f.firmId === firmId
        ? { ...f, income: [...entries.map(e => ({ ...e, id: mkId("INC") })), ...f.income] }
        : f
    ));
  }, [ensureFirmFinancials]);

  const bulkAddExpenses = useCallback((firmId: string, entries: Omit<FinancialEntry, "id">[]) => {
    ensureFirmFinancials(firmId);
    setFinancials(prev => prev.map(f =>
      f.firmId === firmId
        ? { ...f, expenses: [...entries.map(e => ({ ...e, id: mkId("EXP") })), ...f.expenses] }
        : f
    ));
  }, [ensureFirmFinancials]);

  const getFirmFinancials = useCallback((firmId: string): FirmFinancials => {
    return financials.find(f => f.firmId === firmId) ?? { firmId, income: [], expenses: [], misc: [] };
  }, [financials]);

  return (
    <FirmsContext.Provider value={{
      firms, financials,
      addFirm, updateFirm, deleteFirm,
      addIncomeEntry, addExpenseEntry, addMiscEntry,
      bulkAddIncome, bulkAddExpenses,
      getFirmFinancials,
    }}>
      {children}
    </FirmsContext.Provider>
  );
}

export function useFirms(): FirmsContextValue {
  const ctx = useContext(FirmsContext);
  if (!ctx) throw new Error("useFirms must be used inside FirmsProvider");
  return ctx;
}
