const fs = require('fs');
const path = require('path');

function walk(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach(file => {
    file = path.join(dir, file);
    const stat = fs.statSync(file);
    if (stat && stat.isDirectory()) { 
      results = results.concat(walk(file));
    } else if (file.endsWith('.service.ts')) { 
      results.push(file);
    }
  });
  return results;
}

const files = walk('./src');
files.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  if (content.includes('const [items, total] = await this.prisma.$transaction([')) {
    content = content.replace(/const \[items, total\] = await this\.prisma\.\$transaction\(\[/g, 'const [items, total] = await Promise.all([');
    fs.writeFileSync(file, content, 'utf8');
    console.log('Updated ' + file);
  }
});
