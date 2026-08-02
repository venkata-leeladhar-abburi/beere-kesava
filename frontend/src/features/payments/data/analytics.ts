

export const CASH_FLOW_DATA = [
  { month: "Jan", income: 18.2, expenses: 9.8  },
  { month: "Feb", income: 21.4, expenses: 11.4 },
  { month: "Mar", income: 24.8, expenses: 12.6 },
  { month: "Apr", income: 29.6, expenses: 13.2 },
  { month: "May", income: 32.6, expenses: 12.8 },
];

export const COMPLIANCE_DATA = [
  { name: "Paid",    value: 2, color: "#1E6640" },
  { name: "Partial", value: 1, color: "#C89B47" },
  { name: "Overdue", value: 3, color: "#C0392B" },
];

export const WEAVER_DIST_DATA = [
  { name: "Anand K.",   amount: 36000, pct: 100, color: "#4A061B" },
  { name: "Kamala B.",  amount: 30000, pct: 83,  color: "#6E0F2D" },
  { name: "Ravi Kumar", amount: 28000, pct: 78,  color: "#8B3050" },
  { name: "Padma Veni", amount: 26000, pct: 72,  color: "#C4923A" },
  { name: "Lakshmi D.", amount: 20000, pct: 56,  color: "#8B7060" },
];

export const TOTAL_TOP5 = WEAVER_DIST_DATA.reduce((s, d) => s + d.amount, 0);
