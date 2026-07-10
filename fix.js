import fs from "fs";
const path = "../src/app/components/BeereDashboard.tsx";
let code = fs.readFileSync(path, "utf-8");
code = code.replace(/boxShadow: "0 /g, 'boxShadow: "0px ');
code = code.replace(/boxShadow: `0 /g, 'boxShadow: `0px ');
fs.writeFileSync(path, code);
console.log("Fixed boxShadow values");
