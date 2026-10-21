import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), 'VITE_');
  const portalUrl = env.VITE_PORTAL_URL;

  return {
    plugins: [react()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
      },
    },
    server: {
      proxy: {
        '/_api': {
          target: portalUrl,
          changeOrigin: true,
          secure: true,
        },
        '/_layout': {
          target: portalUrl,
          changeOrigin: true,
          secure: true,
        },
      },
    },
    build: {
      rolldownOptions: {
        output: {
          // Use fixed filenames (no content hash) to avoid portal cache mismatch
          // when Power Pages serves a cached copy.html referencing old filenames
          entryFileNames: 'assets/index.js',
          chunkFileNames: 'assets/[name].js',
          assetFileNames: 'assets/[name].[ext]',
          codeSplitting: {
            groups: [
              {
                name: 'vendor-react',
                test: /node_modules[\\/](?:react(?:-dom|-router(?:-dom)?)?|scheduler|@remix-run[\\/]router)[\\/]/,
              },
              {
                name: 'vendor-fluent-components',
                test: /node_modules[\\/](?:@fluentui[\\/](?!react-icons[\\/])|@griffel[\\/])/,
              },
              {
                name: 'vendor-fluent-icons',
                test: /node_modules[\\/]@fluentui[\\/]react-icons[\\/]/,
              },
            ],
          },
        },
      },
    },
  };
})
