import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import fs from 'node:fs';
import path from 'node:path';

function readDeployBuildId(): string {
  try {
    const versionPath = path.resolve(process.cwd(), 'public/version.json');
    if (fs.existsSync(versionPath)) {
      const meta = JSON.parse(fs.readFileSync(versionPath, 'utf8')) as { buildId?: string };
      if (meta.buildId) return meta.buildId;
    }
  } catch {
    /* prebuild not run yet */
  }
  return process.env.VERCEL_GIT_COMMIT_SHA?.slice(0, 12) || 'dev';
}

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const deployBuildId = readDeployBuildId();

  // Backend API — defaults to local backend in dev; set VITE_API_URL for staging/production
  const apiTarget = env.VITE_API_URL || 'http://localhost:8000';
  if (!env.VITE_API_URL && mode !== 'production') {
    console.info('[vite] VITE_API_URL not set — proxying to http://localhost:8000');
  }
  const wsTarget  = apiTarget.replace(/^https?/, 'ws');

  return {
    plugins: [react()],
    define: {
      'import.meta.env.VITE_APP_BUILD_ID': JSON.stringify(deployBuildId),
    },

    optimizeDeps: {
      exclude: ['lucide-react'],
    },

    esbuild: {
      // Strip console statements and debugger calls from production bundle
      drop: mode === 'production' ? ['console', 'debugger'] : [],
    },

    build: {
      target: 'esnext',
      minify: 'esbuild',
      rollupOptions: {
        output: {
          manualChunks: {
            vendor:    ['react', 'react-dom'],
            router:    ['react-router-dom'],
            animation: ['framer-motion'],
            icons:     ['lucide-react'],
          },
        },
      },
      chunkSizeWarningLimit: 1000,
      sourcemap: false,
      reportCompressedSize: false,
    },

    // ── Dev server ──────────────────────────────────────────────────────────────
    server: {
      port: 5173,
      hmr: { overlay: false },
      proxy: {
        '/api': {
          target:       apiTarget,
          changeOrigin: true,
          secure:       false,
          // 10 min timeout — large video uploads can take time
          proxyTimeout: 600_000,
          timeout:      600_000,
        },
        '/health': {
          target:       apiTarget,
          changeOrigin: true,
          secure:       false,
        },
        '/ws': {
          target: wsTarget,
          ws:     true,
        },
      },
    },

    // ── Preview server (npm run preview) ────────────────────────────────────────
    preview: {
      port: 4173,
      strictPort: true,
      proxy: {
        '/api': {
          target:       apiTarget,
          changeOrigin: true,
          secure:       false,
          proxyTimeout: 600_000,
          timeout:      600_000,
        },
        '/health': {
          target:       apiTarget,
          changeOrigin: true,
          secure:       false,
        },
        '/ws': {
          target: wsTarget,
          ws:     true,
        },
      },
    },

    base: '/',
  };
});
