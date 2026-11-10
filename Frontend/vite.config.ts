import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  optimizeDeps: {
    exclude: ['lucide-react'],
  },
  publicDir: 'Public',
  build: {
    assetsDir: 'assets',
    copyPublicDir: true,
    rollupOptions: {
      output: {
        // Empreinte dans le nom : nginx les sert « immutable » un an, un nom fixe garderait l'ancienne version
        assetFileNames: 'assets/[name]-[hash][extname]',
      },
    },
  },
});
