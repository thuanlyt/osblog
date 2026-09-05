import { build } from 'vite'
import { readFile, unlink } from 'node:fs/promises'
await build({ build: { outDir: 'dist/client', manifest: true } })
const manifest = JSON.parse(await readFile('dist/client/.vite/manifest.json', 'utf8')) as Record<string, { file: string; css?: string[]; imports?: string[]; isEntry?: boolean }>
const entries = Object.values(manifest).filter((entry) => entry.isEntry)
const css = new Set<string>()
const collectCss = (entry: typeof entries[number]) => { entry.css?.forEach((file) => css.add('/' + file)); entry.imports?.forEach((key) => collectCss(manifest[key])) }
entries.forEach(collectCss)
await build({ publicDir: false, define: { __OSBLOG_ASSETS__: JSON.stringify({ scripts: entries.map((entry) => '/' + entry.file), styles: [...css] }) }, build: { ssr: 'src/entry-server.tsx', outDir: 'dist/server', rollupOptions: { output: { entryFileNames: 'index.js' } } } })
// Without this, filesystem routing would serve an empty Vite template instead of SSR at /.
await unlink('dist/client/index.html')
console.info('Built hashed client assets and SSR server.')
