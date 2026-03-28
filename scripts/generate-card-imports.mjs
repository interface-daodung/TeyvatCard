/**
 * Quét src/models/cards, ghi lại src/modules/cardImports.ts
 * Chạy: node scripts/generate-card-imports.mjs
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, '..');
const cardsDir = path.join(projectRoot, 'src', 'models', 'cards');
const outFile = path.join(projectRoot, 'src', 'modules', 'cardImports.ts');

const CATEGORY_ORDER = [
  'coin',
  'character',
  'weapon',
  'enemy',
  'food',
  'trap',
  'treasure',
  'bomb',
];

const WEAPON_SUBORDER = ['catalyst', 'sword'];

function walkTsFiles(dir, baseRel = '') {
  const out = [];
  for (const name of fs.readdirSync(dir)) {
    const full = path.join(dir, name);
    const rel = baseRel ? `${baseRel}/${name}` : name;
    const st = fs.statSync(full);
    if (st.isDirectory()) {
      out.push(...walkTsFiles(full, rel));
    } else if (st.isFile() && name.endsWith('.ts') && !name.endsWith('.d.ts')) {
      out.push(rel.replace(/\\/g, '/'));
    }
  }
  return out;
}

function hasDefaultExport(absPath) {
  const text = fs.readFileSync(absPath, 'utf8');
  return /export\s+default\s+/m.test(text);
}

/**
 * Trả về danh sách đường dẫn (từ cards/) không hợp lệ — thiếu export default.
 */
function findInvalidCardFiles(relPaths) {
  const bad = [];
  for (const rel of relPaths) {
    const abs = path.join(cardsDir, rel);
    if (!hasDefaultExport(abs)) {
      bad.push(rel.replace(/\\/g, '/'));
    }
  }
  return bad;
}

function importNameFromFile(relPath) {
  return path.basename(relPath, '.ts');
}

function sortKey(relPath) {
  const norm = relPath.replace(/\\/g, '/');
  const parts = norm.split('/');
  const fileName = parts[parts.length - 1];

  if (parts.length === 1) {
    return [100, 0, '', fileName];
  }

  const cat = parts[0];
  let catIdx = CATEGORY_ORDER.indexOf(cat);
  if (catIdx === -1) catIdx = 50;

  if (cat === 'weapon' && parts.length >= 3) {
    const sub = parts[1];
    let subIdx = WEAPON_SUBORDER.indexOf(sub);
    if (subIdx === -1) subIdx = 50;
    const rest = parts.slice(2).join('/');
    return [catIdx, subIdx, rest, fileName];
  }

  const rest = parts.slice(1).join('/');
  return [catIdx, 0, rest, fileName];
}

function comparePath(a, b) {
  const ka = sortKey(a);
  const kb = sortKey(b);
  for (let i = 0; i < Math.max(ka.length, kb.length); i++) {
    const va = ka[i] ?? '';
    const vb = kb[i] ?? '';
    if (typeof va === 'number' && typeof vb === 'number') {
      if (va !== vb) return va - vb;
    } else {
      const sa = String(va);
      const sb = String(vb);
      if (sa !== sb) return sa < sb ? -1 : 1;
    }
  }
  return 0;
}

function buildImportLine(relFromCards, name) {
  const posix = relFromCards.replace(/\\/g, '/');
  const withoutTs = posix.replace(/\.ts$/, '');
  return `import ${name} from '../models/cards/${withoutTs}.js';`;
}

function main() {
  if (!fs.existsSync(cardsDir)) {
    console.error('Không thấy thư mục:', cardsDir);
    process.exit(1);
  }

  const allRel = walkTsFiles(cardsDir);
  const invalid = findInvalidCardFiles(allRel);
  if (invalid.length > 0) {
    console.error(
      'Không ghi cardImports.ts — các file sau không có `export default`:\n'
    );
    for (const p of invalid) {
      console.error(`  - ${p}`);
    }
    process.exit(1);
  }

  const relPaths = [...allRel].sort(comparePath);

  const lines = relPaths.map((rel) =>
    buildImportLine(rel, importNameFromFile(rel))
  );

  const exportNames = relPaths.map((rel) => importNameFromFile(rel));

  const header = `/**
 * Tập trung toàn bộ import card classes để CardFactory gọn hơn.
 * Sinh tự động: node scripts/generate-card-imports.mjs
 */

`;

  const importsBlock = lines.join('\n');
  const exportBlock = `export {\n${exportNames.map((n) => `    ${n}`).join(',\n')}\n};\n`;

  fs.writeFileSync(outFile, `${header}${importsBlock}\n\n${exportBlock}`, 'utf8');
  console.log('Đã ghi:', outFile);
  console.log('Số card:', relPaths.length);
}

main();
