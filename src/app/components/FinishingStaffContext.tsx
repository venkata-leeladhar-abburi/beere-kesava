import React, { createContext, useContext, useState, useCallback, useMemo } from "react";

export interface FinishingStaffMember {
  id: string;
  empId: string;
  firstName: string;
  lastName: string;
  mobile: string;
  email: string;
  specialisation: string;
  notes: string;
  dateAdded: string;
  status: "Active" | "Inactive";
}

interface FinishingStaffContextValue {
  members: FinishingStaffMember[];
  addMember: (m: Omit<FinishingStaffMember, "id" | "dateAdded">) => void;
  updateMember: (id: string, updates: Partial<FinishingStaffMember>) => void;
  toggleStatus: (id: string) => void;
  activeMembers: FinishingStaffMember[];
}

const FinishingStaffContext = createContext<FinishingStaffContextValue | null>(null);

const SEED: FinishingStaffMember[] = [
  { id: "fs-seed-001", empId: "EMP-005", firstName: "Anand",  lastName: "Kumar", mobile: "+91 54321 09876", email: "", specialisation: "Silk finishing", notes: "",            dateAdded: "03 Jun 2026", status: "Active"   },
  { id: "fs-seed-002", empId: "EMP-009", firstName: "Renu",   lastName: "Devi",  mobile: "+91 44321 09871", email: "", specialisation: "Zari polishing", notes: "",            dateAdded: "04 Jun 2026", status: "Active"   },
  { id: "fs-seed-003", empId: "EMP-010", firstName: "Suresh", lastName: "Nair",  mobile: "+91 33210 98762", email: "", specialisation: "Border folding",  notes: "Part-time.", dateAdded: "05 Jun 2026", status: "Active"   },
  { id: "fs-seed-004", empId: "EMP-011", firstName: "Meena",  lastName: "Bai",   mobile: "+91 22109 87653", email: "", specialisation: "",                notes: "",            dateAdded: "07 Jun 2026", status: "Inactive" },
];

export function FinishingStaffProvider({ children }: { children: React.ReactNode }) {
  const [members, setMembers] = useState<FinishingStaffMember[]>(SEED);

  const addMember = useCallback((m: Omit<FinishingStaffMember, "id" | "dateAdded">) => {
    const today = new Date().toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }).replace(",", "");
    setMembers(prev => [{ ...m, id: `fs-${Date.now()}`, dateAdded: today }, ...prev]);
  }, []);

  const updateMember = useCallback((id: string, updates: Partial<FinishingStaffMember>) => {
    setMembers(prev => prev.map(m => m.id === id ? { ...m, ...updates } : m));
  }, []);

  const toggleStatus = useCallback((id: string) => {
    setMembers(prev => prev.map(m =>
      m.id === id ? { ...m, status: m.status === "Active" ? "Inactive" : "Active" } : m
    ));
  }, []);

  const activeMembers = useMemo(() => members.filter(m => m.status === "Active"), [members]);

  return (
    <FinishingStaffContext.Provider value={{ members, addMember, updateMember, toggleStatus, activeMembers }}>
      {children}
    </FinishingStaffContext.Provider>
  );
}

export function useFinishingStaff(): FinishingStaffContextValue {
  const ctx = useContext(FinishingStaffContext);
  if (!ctx) throw new Error("useFinishingStaff must be used inside FinishingStaffProvider");
  return ctx;
}
