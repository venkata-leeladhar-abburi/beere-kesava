const fs = require('fs');
const glob = require('glob');

const files = glob.sync('../src/app/components/*.tsx').filter(f => !f.includes('BeereDashboard.tsx') && !f.includes('AmmoDashboard.tsx'));

const hookCode = `
function useIsMobile() {
  const [isMobile, setIsMobile] = React.useState(typeof window !== "undefined" ? window.innerWidth < 768 : false);
  React.useEffect(() => {
    const handler = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener("resize", handler);
    return () => window.removeEventListener("resize", handler);
  }, []);
  return isMobile;
}
`;

files.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');

  // Inject useIsMobile hook at the top after imports if not already there
  if (!content.includes('function useIsMobile()')) {
    // Find the last import
    const lastImportIndex = content.lastIndexOf('import ');
    if (lastImportIndex !== -1) {
      const endOfImports = content.indexOf('\n', content.indexOf(';', lastImportIndex));
      content = content.slice(0, endOfImports) + '\n\n' + hookCode + content.slice(endOfImports);
    }
  }

  // Inject `const isMobile = useIsMobile();` into the main export function
  const exportFuncMatch = content.match(/export function (\w+)\(\) \{/);
  if (exportFuncMatch && !content.includes('const isMobile = useIsMobile();')) {
    const funcName = exportFuncMatch[1];
    const funcDecl = `export function ${funcName}() {`;
    content = content.replace(funcDecl, `${funcDecl}\n  const isMobile = useIsMobile();`);
  }

  // Define regex replacements
  const replacements = [
    { from: /padding: "0 56px"/g, to: 'padding: isMobile ? "0 16px" : "0 56px"' },
    { from: /padding: "24px 56px"/g, to: 'padding: isMobile ? "24px 16px" : "24px 56px"' },
    { from: /padding: "48px 56px"/g, to: 'padding: isMobile ? "24px 16px" : "48px 56px"' },
    { from: /padding: "0 56px 64px 56px"/g, to: 'padding: isMobile ? "0 16px 32px 16px" : "0 56px 64px 56px"' },
    { from: /padding: "32px 56px"/g, to: 'padding: isMobile ? "24px 16px" : "32px 56px"' },
    { from: /padding: "16px 56px"/g, to: 'padding: isMobile ? "16px 16px" : "16px 56px"' },
    { from: /padding: "20px 56px"/g, to: 'padding: isMobile ? "20px 16px" : "20px 56px"' },
    { from: /gridTemplateColumns: "1\.2fr 1fr 1fr"/g, to: 'gridTemplateColumns: isMobile ? "1fr" : "1.2fr 1fr 1fr"' },
    { from: /gridTemplateColumns: "1fr 1fr 1fr 1fr"/g, to: 'gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr 1fr 1fr"' },
    { from: /gridTemplateColumns: "1fr 1fr 1fr"/g, to: 'gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr 1fr"' },
    { from: /gridTemplateColumns: "1fr 1fr"/g, to: 'gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr"' },
    { from: /gridTemplateColumns: "repeat\(5, 1fr\)"/g, to: 'gridTemplateColumns: isMobile ? "1fr" : "repeat(5, 1fr)"' },
    { from: /gridTemplateColumns: "repeat\(4, 1fr\)"/g, to: 'gridTemplateColumns: isMobile ? "1fr" : "repeat(4, 1fr)"' },
    { from: /gridTemplateColumns: "repeat\(3, 1fr\)"/g, to: 'gridTemplateColumns: isMobile ? "1fr" : "repeat(3, 1fr)"' },
    { from: /gridTemplateColumns: "260px 1fr"/g, to: 'gridTemplateColumns: isMobile ? "1fr" : "260px 1fr"' },
    { from: /gridTemplateColumns: "1fr 340px"/g, to: 'gridTemplateColumns: isMobile ? "1fr" : "1fr 340px"' },
    { from: /gridTemplateColumns: "1fr 300px"/g, to: 'gridTemplateColumns: isMobile ? "1fr" : "1fr 300px"' },
    { from: /gridTemplateColumns: "300px 1fr"/g, to: 'gridTemplateColumns: isMobile ? "1fr" : "300px 1fr"' },
    { from: /gridTemplateColumns: "3fr 1fr"/g, to: 'gridTemplateColumns: isMobile ? "1fr" : "3fr 1fr"' },
    { from: /gridTemplateColumns: "2fr 1fr"/g, to: 'gridTemplateColumns: isMobile ? "1fr" : "2fr 1fr"' },
    { from: /gridTemplateColumns: "200px 1fr"/g, to: 'gridTemplateColumns: isMobile ? "1fr" : "200px 1fr"' },
    { from: /gridTemplateColumns: "1\.5fr 1fr"/g, to: 'gridTemplateColumns: isMobile ? "1fr" : "1.5fr 1fr"' },
    { from: /flexDirection: "row"/g, to: 'flexDirection: isMobile ? "column" : "row"' },
    { from: /gap: 48/g, to: 'gap: isMobile ? 24 : 48' },
    { from: /gap: 32/g, to: 'gap: isMobile ? 16 : 32' },
    { from: /gap: 64/g, to: 'gap: isMobile ? 24 : 64' },
    { from: /height: 140/g, to: 'height: isMobile ? "auto" : 140' },
    { from: /height: 160/g, to: 'height: isMobile ? "auto" : 160' },
    { from: /width: 320/g, to: 'width: isMobile ? "100%" : 320' },
    { from: /width: 400/g, to: 'width: isMobile ? "100%" : 400' },
    { from: /width: 300/g, to: 'width: isMobile ? "100%" : 300' },
    // Wrap tables in overflowX container if they aren't already
    // Actually simpler: add table responsive wrappers manually if needed, but let's just make sure grid layouts don't break.
  ];

  replacements.forEach(({ from, to }) => {
    content = content.replace(from, to);
  });

  fs.writeFileSync(file, content, 'utf8');
  console.log(`Updated ${file}`);
});
