import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import dynamicImport from 'vite-plugin-dynamic-import';

export default defineConfig({
   plugins: [react(), dynamicImport()],
   assetsInclude: ['**/*.mp3', '**/*.wav', '**/*.ogg', '**/*.m4a'],
   resolve: {
      alias: {
         '@': path.join(__dirname, 'src'),
      },
   },
   server: {
      port: 3000,
      host: '0.0.0.0',
      proxy: {
         '/api': {
            target: process.env.NODE_ENV === 'development' && process.env.DOCKER_ENV ? 'http://backend:3001' : 'http://localhost:3001',
            changeOrigin: true,
            secure: false,
         },
      },
   },
   build: {
      outDir: 'build',
   },
   preview: {
      host: '0.0.0.0',
      port: 3000,
      allowedHosts: true,
   },
   publicDir: 'public',
});
