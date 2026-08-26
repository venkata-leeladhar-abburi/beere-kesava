const fs = require('fs');

const replacements = [
  {
    file: 'src/features/payments/components/PaymentsHeader.tsx',
    oldText: 'import { F, T, imgSareeFooter } from "../theme";',
    newText: 'import { F, T } from "../theme";\nimport { imgSareeFooter } from "@/shared/constants/weaverImages";'
  },
  {
    file: 'src/features/payments/components/wholesale/CustomerCard.tsx',
    oldText: 'import { F, T, BulkOrder } from "../../theme";',
    newText: 'import { F, T } from "../../theme";\nimport { BulkOrder } from "@/features/production";'
  },
  {
    file: 'src/features/payments/components/wholesale/ViewInvoiceModal.tsx',
    oldText: 'import { F, T, BulkOrder } from "../../theme";',
    newText: 'import { F, T } from "../../theme";\nimport { BulkOrder } from "@/features/production";'
  }
];

for (const rep of replacements) {
  if (fs.existsSync(rep.file)) {
    let content = fs.readFileSync(rep.file, 'utf8');
    content = content.replace(rep.oldText, rep.newText);
    fs.writeFileSync(rep.file, content, 'utf8');
    console.log(`Updated ${rep.file}`);
  }
}
