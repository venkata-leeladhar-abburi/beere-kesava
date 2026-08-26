import React, { createContext, useContext } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { BackendCustomer, CreateCustomerPayload, customersApi, UpdateCustomerPayload } from "../../../shared/api/customers";
import { useAuthGate } from "../../../contexts/AuthContext";

// Thin real-backend directory of Customer{id,name,type,...} records — the
// FK target for BulkOrder.customerId, Quotation.customerId, and
// Dispatch.customerId. The richer analytics dashboard in CustomersPage.tsx
// (spend, order counts, payment-dues messaging) still runs on local mock
// data: that history comes from Sales, a separate system that isn't wired
// yet, so faking it here would just be a differently-shaped mock. This
// context is the real directory other real flows (Bulk Orders, Quotations,
// Dispatch) resolve customer ids against.
export type Customer = BackendCustomer;

interface CustomersContextValue {
  customers: Customer[];
  wholesaleCustomers: Customer[];
  retailCustomers: Customer[];
  isLoading: boolean;
  error: unknown;
  refetch: () => void;
  addCustomer: (payload: CreateCustomerPayload) => Promise<Customer>;
  updateCustomer: (id: string, payload: UpdateCustomerPayload) => void;
  deleteCustomer: (id: string) => Promise<void>;
}

export const CustomersContext = createContext<CustomersContextValue | null>(null);

const QUERY_KEY = ["customers"] as const;

export function CustomersProvider({ children }: { children: React.ReactNode }) {
  const queryClient = useQueryClient();

  const enabled = useAuthGate();

  const { data: customers = [], isLoading, error, refetch } = useQuery({
    queryKey: QUERY_KEY,
    queryFn: async () => (await customersApi.list()).items,
    enabled,
  });

  const addCustomerMutation = useMutation({
    mutationFn: (payload: CreateCustomerPayload) => customersApi.create(payload),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: QUERY_KEY });
      toast.success("Customer added");
    },
    onError: (err: unknown) => {
      toast.error(err instanceof Error ? err.message : "Failed to add customer");
    },
  });

  const updateCustomerMutation = useMutation({
    mutationFn: (args: { id: string; payload: UpdateCustomerPayload }) =>
      customersApi.update(args.id, args.payload),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: QUERY_KEY });
      toast.success("Customer updated");
    },
    onError: (err: unknown) => {
      toast.error(err instanceof Error ? err.message : "Failed to update customer");
    },
  });

  const deleteCustomerMutation = useMutation({
    mutationFn: (id: string) => customersApi.remove(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: QUERY_KEY });
      toast.success("Customer deleted");
    },
    onError: (err: unknown) => {
      toast.error(err instanceof Error ? err.message : "Failed to delete customer");
    },
  });

  const addCustomer = (payload: CreateCustomerPayload) => addCustomerMutation.mutateAsync(payload);
  const updateCustomer = (id: string, payload: UpdateCustomerPayload) =>
    updateCustomerMutation.mutate({ id, payload });
  const deleteCustomer = (id: string) => deleteCustomerMutation.mutateAsync(id).then(() => undefined);

  const wholesaleCustomers = customers.filter(c => c.type === "WHOLESALE");
  const retailCustomers = customers.filter(c => c.type === "RETAIL");

  return (
    <CustomersContext.Provider value={{ customers, wholesaleCustomers, retailCustomers, isLoading, error, refetch: () => void refetch(), addCustomer, updateCustomer, deleteCustomer }}>
      {children}
    </CustomersContext.Provider>
  );
}

const FALLBACK_CUSTOMERS: CustomersContextValue = {
  customers: [],
  wholesaleCustomers: [],
  retailCustomers: [],
  isLoading: false,
  error: null,
  refetch: () => {},
  addCustomer: async () => ({ id: "", name: "", type: "WHOLESALE" } as Customer),
  updateCustomer: () => {},
  deleteCustomer: async () => {},
};

export function useCustomers(): CustomersContextValue {
  const ctx = useContext(CustomersContext);
  return ctx ?? FALLBACK_CUSTOMERS;
}
