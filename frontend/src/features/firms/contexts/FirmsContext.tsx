import React, { createContext, useContext, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useAuthGate } from "../../../contexts/AuthContext";
import {
  firmsApi,
  type BackendFinancialEntry,
  type BackendFirm,
  type CreateFinancialEntryPayload,
} from "../../../shared/api/firms";

// ─── Types ─────────────────────────────────────────────────────────────────────

export interface Firm {
  id: string;
  firmName: string;
  gstNumber?: string;
  address?: string;
  purchaseAmount?: number;
  accountNumber?: string;
  ifscCode?: string;
  bankName?: string;
  contactPersonName?: string;
  contactPersonPhone?: string;
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

// ─── Backend <-> frontend mapping ──────────────────────────────────────────────
// The backend's FirmFinancialEntry only has kind INCOME/EXPENSE/MISC + a free-text
// category. The frontend additionally splits "misc" entries into income/expense
// sub-type — encoded on the wire as a "Misc Income"/"Misc Expense" category so a
// single backend field round-trips cleanly without a schema change.
const MISC_INCOME_CATEGORY = "Misc Income";
const MISC_EXPENSE_CATEGORY = "Misc Expense";

function toFirm(backend: BackendFirm): Firm {
  return {
    id: backend.id,
    firmName: backend.firmName,
    gstNumber: backend.gstNumber ?? undefined,
    address: backend.address ?? undefined,
    purchaseAmount: backend.purchaseAmount !== null ? Number(backend.purchaseAmount) : undefined,
    accountNumber: backend.accountNumber ?? undefined,
    ifscCode: backend.ifscCode ?? undefined,
    bankName: backend.bankName ?? undefined,
    contactPersonName: backend.contactPersonName ?? undefined,
    contactPersonPhone: backend.contactPersonPhone ?? undefined,
    createdAt: backend.createdAt,
  };
}

function groupEntriesIntoFinancials(firmId: string, entries: BackendFinancialEntry[]): FirmFinancials {
  const income: FinancialEntry[] = [];
  const expenses: FinancialEntry[] = [];
  const misc: MiscEntry[] = [];

  for (const entry of entries) {
    const amount = Number(entry.amount);
    if (entry.kind === "MISC") {
      misc.push({
        id: entry.id,
        description: entry.description ?? entry.category,
        amount,
        date: entry.date,
        notes: entry.notes ?? undefined,
        type: entry.category === MISC_EXPENSE_CATEGORY ? "expense" : "income",
      });
    } else if (entry.kind === "INCOME") {
      income.push({
        id: entry.id,
        description: entry.description ?? entry.category,
        amount,
        date: entry.date,
        category: entry.category as IncomeCategory,
      });
    } else {
      expenses.push({
        id: entry.id,
        description: entry.description ?? entry.category,
        amount,
        date: entry.date,
        category: entry.category as ExpenseCategory,
      });
    }
  }

  return { firmId, income, expenses, misc };
}

// ─── Context ──────────────────────────────────────────────────────────────────

interface FirmsContextValue {
  firms: Firm[];
  isLoading: boolean;
  error: unknown;
  refetch: () => void;
  financials: FirmFinancials[];
  addFirm: (firm: Omit<Firm, "id" | "createdAt">) => void;
  updateFirm: (id: string, updates: Omit<Firm, "id" | "createdAt">) => void;
  /** Rejects with the backend's message when the firm has financial entries
   *  or payments recorded against it — deletion is blocked, not silently ignored. */
  deleteFirm: (id: string) => Promise<void>;
  addIncomeEntry: (firmId: string, entry: Omit<FinancialEntry, "id">) => void;
  addExpenseEntry: (firmId: string, entry: Omit<FinancialEntry, "id">) => void;
  addMiscEntry: (firmId: string, entry: Omit<MiscEntry, "id">) => void;
  bulkAddIncome: (firmId: string, entries: Omit<FinancialEntry, "id">[]) => void;
  bulkAddExpenses: (firmId: string, entries: Omit<FinancialEntry, "id">[]) => void;
  /** Corrects a hand-typed entry in place — manual rows are the only part of
   *  the ledger that can carry a typo, so they're the only editable part. */
  updateEntry: (firmId: string, entryId: string, entry: Omit<FinancialEntry, "id"> | Omit<MiscEntry, "id">) => void;
  deleteEntry: (firmId: string, entryId: string) => Promise<void>;
  getFirmFinancials: (firmId: string) => FirmFinancials;
}

const FirmsContext = createContext<FirmsContextValue | null>(null);

const FIRMS_KEY = ["firms"] as const;
const FINANCIALS_KEY = ["firms", "financials"] as const;

export function FirmsProvider({ children }: { children: React.ReactNode }) {
  const queryClient = useQueryClient();

  const enabled = useAuthGate();

  const { data: backendFirms = [], isLoading, error, refetch } = useQuery({
    queryKey: FIRMS_KEY,
    enabled,
    queryFn: () => firmsApi.list().then((res) => res.items),
  });
  const firms = backendFirms.map(toFirm);

  const { data: financials = [] } = useQuery({
    queryKey: FINANCIALS_KEY,
    queryFn: async () => {
      const results = await Promise.all(
        backendFirms.map(async (firm) => {
          const entries = await firmsApi.listEntries(firm.id).then((res) => res.items);
          return groupEntriesIntoFinancials(firm.id, entries);
        }),
      );
      return results;
    },
    enabled: enabled && backendFirms.length > 0,
  });

  const addFirmMutation = useMutation({
    mutationFn: (data: Omit<Firm, "id" | "createdAt">) => firmsApi.create(data),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: FIRMS_KEY });
      void queryClient.invalidateQueries({ queryKey: FINANCIALS_KEY });
      toast.success("Firm added");
    },
    onError: (err: unknown) => {
      toast.error(err instanceof Error ? err.message : "Failed to add firm");
    },
  });

  const updateFirmMutation = useMutation({
    mutationFn: (args: { id: string; updates: Omit<Firm, "id" | "createdAt"> }) =>
      firmsApi.update(args.id, args.updates),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: FIRMS_KEY });
      toast.success("Firm updated");
    },
    onError: (err: unknown) => {
      toast.error(err instanceof Error ? err.message : "Failed to update firm");
    },
  });

  const deleteFirmMutation = useMutation({
    mutationFn: (id: string) => firmsApi.remove(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: FIRMS_KEY });
      void queryClient.invalidateQueries({ queryKey: FINANCIALS_KEY });
      toast.success("Firm deleted");
    },
    onError: (err: unknown) => {
      toast.error(err instanceof Error ? err.message : "Failed to delete firm");
    },
  });

  const addEntryMutation = useMutation({
    mutationFn: (args: { firmId: string; payload: CreateFinancialEntryPayload }) =>
      firmsApi.addEntry(args.firmId, args.payload),
    onSuccess: (_data, args) => {
      void queryClient.invalidateQueries({ queryKey: FINANCIALS_KEY });
      void queryClient.invalidateQueries({ queryKey: ["firms", "activity", args.firmId] });
      toast.success("Entry added");
    },
    onError: (err: unknown) => {
      toast.error(err instanceof Error ? err.message : "Failed to add entry");
    },
  });

  const bulkAddEntriesMutation = useMutation({
    mutationFn: async (args: { firmId: string; payloads: CreateFinancialEntryPayload[] }) => {
      for (const payload of args.payloads) {
        await firmsApi.addEntry(args.firmId, payload);
      }
    },
    onSuccess: (_data, args) => {
      void queryClient.invalidateQueries({ queryKey: FINANCIALS_KEY });
      void queryClient.invalidateQueries({ queryKey: ["firms", "activity", args.firmId] });
      toast.success("Entries added");
    },
    onError: (err: unknown) => {
      toast.error(err instanceof Error ? err.message : "Failed to add entries");
    },
  });

  // Editing/deleting an entry changes the firm's totals, so the auto-tracked
  // activity query is invalidated alongside the manual one — otherwise the
  // summary strip keeps showing the pre-edit figure until a hard refresh.
  const updateEntryMutation = useMutation({
    mutationFn: (args: { firmId: string; entryId: string; payload: Partial<CreateFinancialEntryPayload> }) =>
      firmsApi.updateEntry(args.firmId, args.entryId, args.payload),
    onSuccess: (_data, args) => {
      void queryClient.invalidateQueries({ queryKey: FINANCIALS_KEY });
      void queryClient.invalidateQueries({ queryKey: ["firms", "activity", args.firmId] });
      toast.success("Entry updated");
    },
    onError: (err: unknown) => {
      toast.error(err instanceof Error ? err.message : "Failed to update entry");
    },
  });

  const deleteEntryMutation = useMutation({
    mutationFn: (args: { firmId: string; entryId: string }) =>
      firmsApi.removeEntry(args.firmId, args.entryId),
    onSuccess: (_data, args) => {
      void queryClient.invalidateQueries({ queryKey: FINANCIALS_KEY });
      void queryClient.invalidateQueries({ queryKey: ["firms", "activity", args.firmId] });
      toast.success("Entry deleted");
    },
    onError: (err: unknown) => {
      toast.error(err instanceof Error ? err.message : "Failed to delete entry");
    },
  });

  const addFirm = (data: Omit<Firm, "id" | "createdAt">) => addFirmMutation.mutate(data);
  const updateFirm = (id: string, updates: Omit<Firm, "id" | "createdAt">) =>
    updateFirmMutation.mutate({ id, updates });
  const deleteFirm = (id: string): Promise<void> => deleteFirmMutation.mutateAsync(id).then(() => undefined);

  const addIncomeEntry = (firmId: string, entry: Omit<FinancialEntry, "id">) =>
    addEntryMutation.mutate({
      firmId,
      payload: { kind: "INCOME", category: entry.category, description: entry.description, amount: entry.amount, date: entry.date },
    });

  const addExpenseEntry = (firmId: string, entry: Omit<FinancialEntry, "id">) =>
    addEntryMutation.mutate({
      firmId,
      payload: { kind: "EXPENSE", category: entry.category, description: entry.description, amount: entry.amount, date: entry.date },
    });

  const addMiscEntry = (firmId: string, entry: Omit<MiscEntry, "id">) =>
    addEntryMutation.mutate({
      firmId,
      payload: {
        kind: "MISC",
        category: entry.type === "expense" ? MISC_EXPENSE_CATEGORY : MISC_INCOME_CATEGORY,
        description: entry.description,
        amount: entry.amount,
        date: entry.date,
        notes: entry.notes,
      },
    });

  const bulkAddIncome = (firmId: string, entries: Omit<FinancialEntry, "id">[]) =>
    bulkAddEntriesMutation.mutate({
      firmId,
      payloads: entries.map((entry) => ({
        kind: "INCOME" as const,
        category: entry.category,
        description: entry.description,
        amount: entry.amount,
        date: entry.date,
      })),
    });

  const bulkAddExpenses = (firmId: string, entries: Omit<FinancialEntry, "id">[]) =>
    bulkAddEntriesMutation.mutate({
      firmId,
      payloads: entries.map((entry) => ({
        kind: "EXPENSE" as const,
        category: entry.category,
        description: entry.description,
        amount: entry.amount,
        date: entry.date,
      })),
    });

  // Mirrors the add* helpers' encoding: a misc entry carries its income/
  // expense sense in the category string, everything else in `kind`.
  const updateEntry = (
    firmId: string,
    entryId: string,
    entry: Omit<FinancialEntry, "id"> | Omit<MiscEntry, "id">,
  ) => {
    const isMisc = "type" in entry;
    updateEntryMutation.mutate({
      firmId,
      entryId,
      payload: isMisc
        ? {
            kind: "MISC",
            category: entry.type === "expense" ? MISC_EXPENSE_CATEGORY : MISC_INCOME_CATEGORY,
            description: entry.description,
            amount: entry.amount,
            date: entry.date,
            notes: entry.notes,
          }
        : {
            category: entry.category,
            description: entry.description,
            amount: entry.amount,
            date: entry.date,
          },
    });
  };

  const deleteEntry = (firmId: string, entryId: string): Promise<void> =>
    deleteEntryMutation.mutateAsync({ firmId, entryId }).then(() => undefined);

  const getFirmFinancials = useCallback(
    (firmId: string): FirmFinancials => {
      return financials.find((f) => f.firmId === firmId) ?? { firmId, income: [], expenses: [], misc: [] };
    },
    [financials],
  );

  return (
    <FirmsContext.Provider
      value={{
        firms,
        isLoading,
        error,
        refetch: () => void refetch(),
        financials,
        addFirm,
        updateFirm,
        deleteFirm,
        addIncomeEntry,
        addExpenseEntry,
        addMiscEntry,
        bulkAddIncome,
        bulkAddExpenses,
        updateEntry,
        deleteEntry,
        getFirmFinancials,
      }}
    >
      {children}
    </FirmsContext.Provider>
  );
}

const FALLBACK_FIRMS: FirmsContextValue = {
  firms: [],
  isLoading: false,
  error: null,
  refetch: () => {},
  financials: [],
  addFirm: () => {},
  updateFirm: () => {},
  deleteFirm: async () => {},
  addIncomeEntry: () => {},
  addExpenseEntry: () => {},
  addMiscEntry: () => {},
  bulkAddIncome: () => {},
  bulkAddExpenses: () => {},
  updateEntry: () => {},
  deleteEntry: async () => {},
  getFirmFinancials: (firmId: string) => ({
    firmId,
    income: [],
    expenses: [],
    misc: [],
  }),
};

export function useFirms(): FirmsContextValue {
  const ctx = useContext(FirmsContext);
  return ctx ?? FALLBACK_FIRMS;
}
