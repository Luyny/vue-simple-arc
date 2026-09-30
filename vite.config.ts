import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import dts from 'vite-plugin-dts';

export default defineConfig({
    plugins: [
        vue(),
        dts({ tsconfigPath: './tsconfig.json', include: ['src'] })
    ],
    build: {
        lib: {
            entry: 'src/index.ts',
            name: 'SimpleArcComponent',
            fileName: 'vue-simple-arc',
            formats: ['es', 'cjs']
        },
        rollupOptions: {
            external: ['vue'],
            output: {
                exports: 'named'
            }
        }
    }
});
