import { defineConfig } from 'vitest/config';
import tsconfigPaths from 'vite-tsconfig-paths';
// import path from 'path';

export default defineConfig({
    plugins: [tsconfigPaths()],

    test: {
        environment: 'node',
        globals: true,
        root: '.',
        watch: false,
        // Cho phép mock module trong NestJS
        mockReset: true,
        restoreMocks: true,
        clearMocks: true,
        setupFiles: ['tests/setup.ts'],
        // Only unit tests, exclude e2e tests
        include: ['tests/**/*.test.ts', 'tests/**/*.spec.ts'],
        exclude: ['tests/**/*.e2e-spec.ts', 'node_modules/**', 'dist/**'],

        alias: {
            // '@hydra-sdk/bridge': path.resolve(__dirname, 'packages/hydra-bridge/src/index.ts')
        },

        coverage: {
            provider: 'v8',
            include: ['packages/**/src/**/*.ts'],
            exclude: [
                '**/node_modules/**',
                '**/dist/**',
                'packages/cardano-wasm/**', // exclude cardano-wasm due to wasm files
                'apps/**', // exclude apps
                '**/types/**',
                '**/__tests__/**',
                '**/mocks/**',
                '**/constants/**',
                '**/index.ts',
                '**/*.d.ts',
            ],
            reportsDirectory: 'coverage',
            reporter: ['text', 'lcov', 'html', 'json-summary'],
        },
    },

    optimizeDeps: {
        esbuildOptions: {
            supported: {
                wasm: true,
            },
        },
    },
});
