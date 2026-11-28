import { defineConfig } from 'vite';
import path from 'path';
import react from '@vitejs/plugin-react-swc';
import tailwindcss from '@tailwindcss/vite';

// One version string per build, appended to every generated asset URL (entry
// JS, dynamic chunks and CSS). Vite already hashes the filenames; the query
// makes cache busting explicit for proxies/CDNs that ignore filename changes.
// Applying it here rather than only in index.html keeps chunk imports in sync
// with the entry script, so React isn't loaded twice.
const cacheVersion = Date.now().toString(36);

// renderBuiltUrl covers index.html tags and dynamic imports, but static
// imports between chunks stay relative; version those too so every module of
// the graph resolves to the exact same URL.
function versionChunkImports() {
  return {
    name: 'version-chunk-imports',
    apply: 'build',
    renderChunk(code) {
      return code.replace(
        /(\bfrom\s*|\bimport\s*\(\s*|\bimport\s*)(["'])\.\/([^"']+\.js)\2/g,
        (_, keyword, quote, file) => `${keyword}${quote}./${file}?v=${cacheVersion}${quote}`,
      );
    },
  };
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss(), versionChunkImports()],
  experimental: {
    renderBuiltUrl(filename) {
      const url = filename.startsWith('/') ? filename : `/${filename}`;
      return `${url}${url.includes('?') ? '&' : '?'}v=${cacheVersion}`;
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(import.meta.dirname, './src'),
    },
  },
  server: {
    allowedHosts: true
  }
})
