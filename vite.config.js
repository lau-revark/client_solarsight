import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  // ─── Multi-Page App Configuration ────────────────────────
  // Every HTML page must be listed here so Vite bundles each
  // one's <script type="module"> references into the build.
  build: {
    rollupOptions: {
      input: {
        main:      resolve(__dirname, 'index.html'),
        dcpq:      resolve(__dirname, 'dcpq.html'),
        services:  resolve(__dirname, 'services.html'),
        about:     resolve(__dirname, 'about.html'),
        contact:   resolve(__dirname, 'contact.html'),
        articles:  resolve(__dirname, 'articles.html'),
        brandbook: resolve(__dirname, 'brand-book.html'),
        privacy:   resolve(__dirname, 'privacy.html'),
        terms:     resolve(__dirname, 'terms.html'),
        disclaimer:resolve(__dirname, 'disclaimer.html'),
      },
    },
  },
});
