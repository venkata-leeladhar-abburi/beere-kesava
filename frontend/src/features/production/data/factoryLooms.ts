// Extracted out of FactoryLoomPage.tsx so BatchCreationPage.tsx could depend on
// this data without importing FactoryLoomPage.tsx, which imports BatchCreationPage.tsx —
// that mutual import was a circular dependency.
export interface FactoryLoom {
  id: string; loomNumber: string;
  location: string; operatorName: string; operatorPhone: string;
  status: "active" | "idle" | "maintenance";
  installedYear: string; notes: string;
}

const INITIAL_LOOMS: FactoryLoom[] = [
  { id: "FL-001", loomNumber: "Loom F-01", location: "Factory Floor A", operatorName: "Srinivas Kumar", operatorPhone: "98765 11001", status: "active", installedYear: "2018", notes: "Main production loom for premium sarees" },
  { id: "FL-002", loomNumber: "Loom F-02", location: "Factory Floor A", operatorName: "Mahesh Reddy", operatorPhone: "87654 22002", status: "active", installedYear: "2020", notes: "Dobby specialised for border patterns" },
  { id: "FL-003", loomNumber: "Loom F-03", location: "Factory Floor B", operatorName: "Ramesh Naidu", operatorPhone: "76543 33003", status: "idle", installedYear: "2019", notes: "Currently awaiting new batch assignment" },
  { id: "FL-004", loomNumber: "Loom F-04", location: "Factory Floor B", operatorName: "Suresh Babu", operatorPhone: "65432 44004", status: "maintenance", installedYear: "2015", notes: "Scheduled maintenance — resume in 3 days" },
  { id: "FL-005", loomNumber: "Loom F-05", location: "Factory Floor C", operatorName: "Venkateswara Rao", operatorPhone: "54321 55005", status: "active", installedYear: "2022", notes: "New high-speed loom" },
];

export const FACTORY_LOOMS_LIST: FactoryLoom[] = INITIAL_LOOMS;
