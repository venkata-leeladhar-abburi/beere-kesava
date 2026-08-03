import { AccessLevel } from "./theme";
import type { FinishingStaffMember } from "../../finishing/contexts/FinishingStaffContext";

/** Next sequential EMP-### id, based on the highest numeric suffix seen so far. */
export function nextEmployeeId(existingIds: string[]): string {
  const maxNum = existingIds.reduce((max, id) => {
    const m = id.match(/(\d+)\s*$/);
    return m ? Math.max(max, parseInt(m[1], 10)) : max;
  }, 0);
  return `EMP-${String(maxNum + 1).padStart(3, "0")}`;
}

export function todayFormatted(): string {
  return new Date().toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
}

// One row of the "All Users" table
export type TableRow = {
  empId: string; firstName: string; lastName: string; role: string;
  mobile: string; portal: string; dateAdded: string; status: string;
  accessLevel?: AccessLevel;
  finishingMember?: FinishingStaffMember;
};

// Static seed rows for non-finishing staff
export const STATIC_USERS: TableRow[] = [
  { empId: "EMP-001", firstName: "Ravi",    lastName: "Kumar",    role: "Admin",        mobile: "+91 98765 43210", portal: "Admin Portal",    dateAdded: "01 Jun 2026", status: "Active",   accessLevel: "Full Access" },
  { empId: "EMP-002", firstName: "Meena",   lastName: "Krishnan", role: "Admin",        mobile: "+91 87654 32109", portal: "Admin Portal",    dateAdded: "01 Jun 2026", status: "Active",   accessLevel: "Semi Access" },
  { empId: "EMP-003", firstName: "Suresh",  lastName: "Murti",    role: "Worker Staff", mobile: "+91 76543 21098", portal: "Worker Portal",   dateAdded: "02 Jun 2026", status: "Active"   },
  { empId: "EMP-004", firstName: "Padma",   lastName: "Veni",     role: "Weaver",       mobile: "+91 65432 10987", portal: "Weaver Portal",   dateAdded: "02 Jun 2026", status: "Active"   },
  { empId: "EMP-005", firstName: "Anjali",  lastName: "Rao",      role: "Admin",        mobile: "+91 54321 09876", portal: "Admin Portal",    dateAdded: "03 Jun 2026", status: "Active",   accessLevel: "Semi Access" },
  { empId: "EMP-006", firstName: "Kavitha", lastName: "Devi",     role: "Shop Staff",   mobile: "+91 43210 98765", portal: "Shop Portal",     dateAdded: "03 Jun 2026", status: "Active"   },
  { empId: "EMP-007", firstName: "Ramesh",  lastName: "Babu",     role: "Worker Staff", mobile: "+91 32109 87654", portal: "Worker Portal",   dateAdded: "05 Jun 2026", status: "Active"   },
  { empId: "EMP-008", firstName: "Lakshmi", lastName: "Patel",    role: "Admin",        mobile: "+91 21098 76543", portal: "Admin Portal",    dateAdded: "08 Jun 2026", status: "Inactive", accessLevel: "Full Access" },
  { empId: "EMP-009", firstName: "Deepak",  lastName: "Iyer",     role: "Accountant",   mobile: "+91 90876 54321", portal: "Accountant Portal", dateAdded: "10 Jun 2026", status: "Active" },
];
