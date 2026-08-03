const fs = require('fs');
const file = 'src/features/suppliers/contexts/SupplierContext.tsx';
const lines = fs.readFileSync(file, 'utf8').split('\n');
const newLines = [
  lines[0],
  lines[1],
  lines[2],
  'export * from "./supplier-types";',
  'import { Supplier, Purchase, SupplierPayment, PurchaseRequest } from "./supplier-types";',
  'import { SEED_SUPPLIERS, SEED_PURCHASES, SEED_PAYMENTS, SEED_REQUESTS } from "./supplier-seed";',
  ...lines.slice(337)
];
fs.writeFileSync(file, newLines.join('\n'));
