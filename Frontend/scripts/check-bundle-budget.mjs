import fs from 'node:fs';
import path from 'node:path';

const distDir = path.resolve(process.cwd(), 'dist');
const assetsDir = path.join(distDir, 'assets');

const MAX_TOTAL_KIB = Number(process.env.BUNDLE_MAX_TOTAL_KIB ?? 1200);
const MAX_JS_KIB = Number(process.env.BUNDLE_MAX_JS_KIB ?? 350);
const MAX_CSS_KIB = Number(process.env.BUNDLE_MAX_CSS_KIB ?? 180);

if (!fs.existsSync(distDir) || !fs.existsSync(assetsDir)) {
  console.error('dist/assets introuvable. Lance npm run build avant ce check.');
  process.exit(1);
}

const files = fs.readdirSync(assetsDir).map((name) => {
  const full = path.join(assetsDir, name);
  const size = fs.statSync(full).size;
  return {
    name,
    size,
    kib: size / 1024,
  };
});

const totalKib = files.reduce((a, b) => a + b.kib, 0);
const jsMax = Math.max(0, ...files.filter((f) => f.name.endsWith('.js')).map((f) => f.kib));
const cssMax = Math.max(0, ...files.filter((f) => f.name.endsWith('.css')).map((f) => f.kib));

const failures = [];
if (totalKib > MAX_TOTAL_KIB) failures.push(`Total assets ${totalKib.toFixed(2)} KiB > ${MAX_TOTAL_KIB} KiB`);
if (jsMax > MAX_JS_KIB) failures.push(`Max JS chunk ${jsMax.toFixed(2)} KiB > ${MAX_JS_KIB} KiB`);
if (cssMax > MAX_CSS_KIB) failures.push(`Max CSS chunk ${cssMax.toFixed(2)} KiB > ${MAX_CSS_KIB} KiB`);

console.log('\nBundle budget');
console.log(`- Total assets: ${totalKib.toFixed(2)} KiB (max ${MAX_TOTAL_KIB})`);
console.log(`- Max JS chunk: ${jsMax.toFixed(2)} KiB (max ${MAX_JS_KIB})`);
console.log(`- Max CSS chunk: ${cssMax.toFixed(2)} KiB (max ${MAX_CSS_KIB})`);

if (failures.length > 0) {
  console.error('\nBudget depasse:');
  failures.forEach((f) => console.error(`- ${f}`));
  process.exit(1);
}

console.log('\nBudget OK\n');
