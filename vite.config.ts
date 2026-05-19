import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vite';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/** Подкаталог на GitHub Pages: задать в CI `GITHUB_PAGES_BASE=/имя-репозитория/` */
function appBase(): string {
  const raw = process.env.GITHUB_PAGES_BASE?.trim();
  if (!raw || raw === '/') return '/';
  return raw.endsWith('/') ? raw : `${raw}/`;
}

// https://vite.dev/config/
export default defineConfig({
  base: appBase(),
  /* sockjs-client (чаты) ссылается на Node-глобал `global` — без этого приложение не монтируется в браузере. */
  define: {
    global: 'globalThis',
  },
  optimizeDeps: {
    esbuildOptions: {
      define: {
        global: 'globalThis',
      },
    },
  },
  plugins: [
    react(),
    tailwindcss(),
    {
      name: 'html-favicon-base',
      transformIndexHtml(html) {
        const base = appBase();
        return html.replaceAll('%BASE_URL%', base);
      },
    },
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  // host: true — слушаем 0.0.0.0 (Wi‑Fi). allowedHosts — чтобы туннель (localtunnel/ngrok) не блокировался по Host.
  server: {
    port: 5173,
    strictPort: true,
    host: true,
    open: true,
    allowedHosts: true,
  },
  preview: {
    port: 4173,
    strictPort: true,
    host: true,
  },
});
