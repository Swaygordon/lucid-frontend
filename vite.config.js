import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { readFile, writeFile } from 'node:fs/promises'
import { resolve } from 'node:path'

// GitHub Pages serves a 404 for browser-history routes that do not map to a
// physical file. Build a small redirect fallback so a deep link can return to
// the app entry point, then restore its original path before React Router starts.
function githubPagesSpaFallback(base) {
  const basePath = base.replace(/\/$/, '')

  return {
    name: 'github-pages-spa-fallback',
    apply: 'build',
    transformIndexHtml(html) {
      const restoreRoute = `<script>
        (() => {
          const route = new URLSearchParams(window.location.search).get('gh_route');
          if (!route) return;
          window.history.replaceState(null, '', ${JSON.stringify(basePath)} + route);
        })();
      </script>`

      return html.replace('</head>', `${restoreRoute}\n</head>`)
    },

    async writeBundle(options) {
      const fallbackRedirect = `<script>
        (() => {
          const basePath = ${JSON.stringify(basePath)};
          const path = window.location.pathname.startsWith(basePath)
            ? window.location.pathname.slice(basePath.length)
            : '';
          const route = '/' + path.replace(/^\\//, '') + window.location.search + window.location.hash;
          window.location.replace(basePath + '/?gh_route=' + encodeURIComponent(route));
        })();
      </script>`

      const outDir = options.dir || resolve('dist')
      const indexPath = resolve(outDir, 'index.html')
      const fallbackPath = resolve(outDir, '404.html')
      const indexHtml = await readFile(indexPath, 'utf8')
      const fallbackHtml = indexHtml.replace('</head>', `${fallbackRedirect}\n</head>`)
      await writeFile(fallbackPath, fallbackHtml)
    },
  }
}

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const base = mode === 'production' ? '/lucid-frontend/' : '/lucid/'

  return {
    plugins: [react(), ...(mode === 'production' ? [githubPagesSpaFallback(base)] : [])],
    base,
    optimizeDeps: {
      include: ['html2pdf.js'],
    },
  }
})
