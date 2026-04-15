import fs from 'node:fs';
import path from 'node:path';

const distDir = path.resolve(process.cwd(), 'dist');

if (!fs.existsSync(distDir)) {
  console.error('Dossier dist introuvable. Lance d abord npm run build.');
  process.exit(1);
}

function walk(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...walk(full));
    } else {
      const stat = fs.statSync(full);
      files.push({ file: full, size: stat.size });
    }
  }
  return files;
}

const allFiles = walk(distDir)
  .map((f) => ({
    ...f,
    rel: path.relative(distDir, f.file).replaceAll('\\', '/'),
    kb: (f.size / 1024).toFixed(2),
  }))
  .sort((a, b) => b.size - a.size);

const totalBytes = allFiles.reduce((acc, f) => acc + f.size, 0);
const totalKb = (totalBytes / 1024).toFixed(2);

console.log('\nBundle analysis (dist)\n');
console.log(`Total: ${totalKb} KiB`);
console.log('Top 10 fichiers les plus lourds:');
allFiles.slice(0, 10).forEach((f, idx) => {
  console.log(`${idx + 1}. ${f.rel} - ${f.kb} KiB`);
});
console.log('');
