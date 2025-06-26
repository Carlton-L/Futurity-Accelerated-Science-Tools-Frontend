import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      // Proxy for fast.futurity.science API
      '/api/fast': {
        target: 'https://fast.futurity.science',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/fast/, ''),
        secure: true,
        configure: (proxy) => {
          proxy.on('error', (err) => {
            console.log('Fast API proxy error:', err);
          });
          proxy.on('proxyReq', (_, req) => {
            console.log('Sending Request to Fast API:', req.method, req.url);
          });
          proxy.on('proxyRes', (proxyRes, req) => {
            console.log(
              'Received Response from Fast API:',
              proxyRes.statusCode,
              req.url
            );
          });
        },
      },
      // Proxy for tools.futurity.science API
      '/api/tools': {
        target: 'https://tools.futurity.science',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/tools/, ''),
        secure: true,
        configure: (proxy) => {
          proxy.on('error', (err) => {
            console.log('Tools API proxy error:', err);
          });
          proxy.on('proxyReq', (_, req) => {
            console.log('Sending Request to Tools API:', req.method, req.url);
          });
          proxy.on('proxyRes', (proxyRes, req) => {
            console.log(
              'Received Response from Tools API:',
              proxyRes.statusCode,
              req.url
            );
          });
        },
      },
    },
  },
});
