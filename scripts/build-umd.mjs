import { build } from 'esbuild';

const shared = {
    entryPoints: ['src/index.ts'],
    bundle: true,
    platform: 'browser',
    target: 'es2020',
    globalName: 'OsfApiV2',
    format: 'iife',
    sourcemap: true,
};

await Promise.all([
    build({
        ...shared,
        outfile: 'dist/umd/osf-api-v2.js',
        minify: false,
    }),
    build({
        ...shared,
        outfile: 'dist/umd/osf-api-v2.min.js',
        minify: true,
    }),
]);

console.log('UMD build completed.');
