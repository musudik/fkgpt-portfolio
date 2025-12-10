import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
    plugins: [react()],
    resolve: {
        alias: {
            '@': path.resolve(__dirname, './src'),
        },
        dedupe: ['three', 'react', 'react-dom', '@react-three/fiber', '@react-three/drei']
    },
    optimizeDeps: {
        include: [
            'react',
            'react-dom',
            'three',
            '@react-three/fiber',
            '@react-three/drei',
            'lucide-react'
        ],
        force: true
    },
    build: {
        commonjsOptions: {
            include: [/node_modules/],
            transformMixedEsModules: true
        }
    },
    server: {
        proxy: {
            '/api/n8n': {
                target: 'http://207.180.235.87:5678',
                changeOrigin: true,
                rewrite: (path) => path.replace(/^\/api\/n8n/, '/webhook'),
                timeout: 600000, // 10 minute timeout for long-running AI requests
            }
        }
    }
});
