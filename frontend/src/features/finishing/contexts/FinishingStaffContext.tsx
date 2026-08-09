import React, { createContext, useContext, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  BackendActiveStatus,
  BackendFinishingStaff,
  finishingStaffApi,
} from "../../../shared/api/finishing";
import { useAuth } from "../../../contexts/AuthContext";

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
  deleteMember: (id: string) => Promise<void>;
  activeMembers: FinishingStaffMember[];
}

const FinishingStaffContext = createContext<FinishingStaffContextValue | null>(null);

const QUERY_KEY = ["finishingStaff"] as const;

const STATUS_TO_BACKEND: Record<FinishingStaffMember["status"], BackendActiveStatus> = {
  Active: "ACTIVE",
  Inactive: "INACTIVE",
};

function backendToMember(s: BackendFinishingStaff): FinishingStaffMember {
  return {
    id: s.id,
    empId: s.empId,
    firstName: s.firstName,
    lastName: s.lastName,
    mobile: s.mobile,
    email: s.email ?? "",
    specialisation: s.specialisation ?? "",
    notes: s.notes ?? "",
    dateAdded: new Date(s.createdAt).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }),
    status: s.status === "ACTIVE" ? "Active" : "Inactive",
  };
}

export function FinishingStaffProvider({ children }: { children: React.ReactNode }) {
  const queryClient = useQueryClient();
  // Mounted globally (App.tsx) for every role, but /finishing/staff is
  // WORKER-only on the backend (ADMIN/SUPERADMIN bypass every role check).
  const { role } = useAuth();
  const enabled = role === "worker" || role === "admin" || role === "superadmin";

  const { data: members = [] } = useQuery({
    queryKey: QUERY_KEY,
    enabled,
    queryFn: async () => {
      const res = await finishingStaffApi.list();
      return res.items.map(backendToMember);
    },
  });

  const addMemberMutation = useMutation({
    mutationFn: (m: Omit<FinishingStaffMember, "id" | "dateAdded">) =>
      finishingStaffApi.create({
        firstName: m.firstName,
        lastName: m.lastName,
        mobile: m.mobile,
        email: m.email || undefined,
        specialisation: m.specialisation || undefined,
        notes: m.notes || undefined,
      }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: QUERY_KEY });
      toast.success("Finishing staff member added");
    },
    onError: (err: unknown) => {
      toast.error(err instanceof Error ? err.message : "Failed to add staff member");
    },
  });

  const updateMemberMutation = useMutation({
    mutationFn: (args: { id: string; updates: Partial<FinishingStaffMember> }) =>
      finishingStaffApi.update(args.id, {
        firstName: args.updates.firstName,
        lastName: args.updates.lastName,
        mobile: args.updates.mobile,
        email: args.updates.email,
        specialisation: args.updates.specialisation,
        notes: args.updates.notes,
        status: args.updates.status ? STATUS_TO_BACKEND[args.updates.status] : undefined,
      }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: QUERY_KEY });
      toast.success("Staff member updated");
    },
    onError: (err: unknown) => {
      toast.error(err instanceof Error ? err.message : "Failed to update staff member");
    },
  });

  const toggleStatusMutation = useMutation({
    mutationFn: (id: string) => {
      const current = queryClient.getQueryData<FinishingStaffMember[]>(QUERY_KEY)?.find(m => m.id === id);
      const nextStatus: FinishingStaffMember["status"] = current?.status === "Active" ? "Inactive" : "Active";
      return finishingStaffApi.update(id, { status: STATUS_TO_BACKEND[nextStatus] });
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: QUERY_KEY });
      toast.success("Staff status updated");
    },
    onError: (err: unknown) => {
      toast.error(err instanceof Error ? err.message : "Failed to update staff status");
    },
  });

  const deleteMemberMutation = useMutation({
    mutationFn: (id: string) => finishingStaffApi.remove(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: QUERY_KEY });
      toast.success("Staff member removed");
    },
    onError: (err: unknown) => {
      toast.error(err instanceof Error ? err.message : "Failed to remove staff member");
    },
  });

  const addMember = (m: Omit<FinishingStaffMember, "id" | "dateAdded">) => addMemberMutation.mutate(m);
  const updateMember = (id: string, updates: Partial<FinishingStaffMember>) => updateMemberMutation.mutate({ id, updates });
  const toggleStatus = (id: string) => toggleStatusMutation.mutate(id);
  const deleteMember = (id: string) => deleteMemberMutation.mutateAsync(id);

  const activeMembers = useMemo(() => members.filter(m => m.status === "Active"), [members]);

  return (
    <FinishingStaffContext.Provider value={{ members, addMember, updateMember, toggleStatus, deleteMember, activeMembers }}>
      {children}
    </FinishingStaffContext.Provider>
  );
}

export function useFinishingStaff(): FinishingStaffContextValue {
  const ctx = useContext(FinishingStaffContext);
  if (!ctx) throw new Error("useFinishingStaff must be used inside FinishingStaffProvider");
  return ctx;
}
