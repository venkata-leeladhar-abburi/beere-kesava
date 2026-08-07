import { AccessLevel } from "./theme";
import type { FinishingStaffMember } from "../../finishing/contexts/FinishingStaffContext";

export function todayFormatted(): string {
  return new Date().toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
}

export function formatBackendDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
}

// One row of the "All Users" table
export type TableRow = {
  empId: string; firstName: string; lastName: string; role: string;
  mobile: string; portal: string; dateAdded: string; status: string;
  accessLevel?: AccessLevel;
  finishingMember?: FinishingStaffMember;
  // Present only for rows sourced from the backend (not Finishing Staff) —
  // needed to target PATCH /users/:id for status toggles etc.
  backendId?: string;
  // Present only for rows sourced from GET /weavers that have no matching
  // User row (a weaver registered directly via the Weavers module, not
  // through Add User) — needed to target PATCH /weavers/:id instead.
  weaverOnlyId?: string;
};
