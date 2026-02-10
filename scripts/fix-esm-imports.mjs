import { readdir, readFile, writeFile, stat } from 'fs/promises';
import { join, dirname, resolve } from 'path';

const ESM_DIR = 'dist/esm';

async function getJsFiles(dir) {
    const entries = await readdir(dir, { withFileTypes: true });
    const files = [];
    for (const entry of entries) {
        const fullPath = join(dir, entry.name);
        if (entry.isDirectory()) {
            files.push(...await getJsFiles(fullPath));
        } else if (entry.name.endsWith('.js')) {
            files.push(fullPath);
        }
    }
    return files;
}

async function exists(path) {
    try { await stat(path); return true; } catch { return false; }
}

// Add .js extension to relative imports/exports that lack one
const RE = /((?:from|import)\s+['"])(\.[^'"]*?)(['"])/g;

async function addJsExtension(content, filePath) {
    const dir = dirname(filePath);
    const replacements = [];

    for (const match of content.matchAll(RE)) {
        const [full, prefix, importPath, suffix] = match;
        if (importPath.endsWith('.js') || importPath.endsWith('.json')) continue;

        const absPath = resolve(dir, importPath);

        // Check if it's a directory with an index.js
        if (await exists(join(absPath, 'index.js'))) {
            replacements.push([full, `${prefix}${importPath}/index.js${suffix}`]);
        } else {
            replacements.push([full, `${prefix}${importPath}.js${suffix}`]);
        }
    }

    let result = content;
    for (const [from, to] of replacements) {
        result = result.replace(from, to);
    }
    return result;
}

const files = await getJsFiles(ESM_DIR);
let fixed = 0;
for (const file of files) {
    const original = await readFile(file, 'utf8');
    const updated = await addJsExtension(original, file);
    if (updated !== original) {
        await writeFile(file, updated);
        fixed++;
    }
}
console.log(`Fixed imports in ${fixed} ESM files.`);
