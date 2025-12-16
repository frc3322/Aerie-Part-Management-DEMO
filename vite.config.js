import { defineConfig } from "vite";
import tailwindcss from "@tailwindcss/vite";
import path from "node:path";
import handlebars from "vite-plugin-handlebars";
import { visualizer } from "rollup-plugin-visualizer";
import viteCompression from "vite-plugin-compression";

// Get base path from environment variable or default to '/'
// Usage: VITE_BASE_PATH=/part-management-system npm run build
const basePath = process.env.VITE_BASE_PATH || "/";

export default defineConfig({
    base: basePath,
    server: {
        port: 5173,
        open: false,
        proxy: {
            "/api": {
                target: "http://localhost:6060",
                changeOrigin: true,
            },
        },
    },
    plugins: [
        tailwindcss(),
        handlebars({
            partialDirectory: [
                path.resolve(__dirname, "./src/templates/layout"),
                path.resolve(__dirname, "./src/templates/content"),
                path.resolve(__dirname, "./src/templates/modals"),
            ],
        }),
        // Bundle analyzer - generates stats.html after build
        visualizer({
            filename: "dist/stats.html",
            open: false,
            gzipSize: true,
            brotliSize: true,
        }),
        // Compression - generates .gz and .br files for better compression
        viteCompression({
            algorithm: "gzip",
            ext: ".gz",
        }),
        viteCompression({
            algorithm: "brotliCompress",
            ext: ".br",
        }),
    ],
    build: {
        // Enable minification with terser for smaller bundles
        minify: "terser",
        terserOptions: {
            compress: {
                drop_console: true,
                drop_debugger: true,
            },
        },
        // Optimize chunk splitting for better caching
        rollupOptions: {
            output: {
                manualChunks(id) {
                    // Separate Three.js into its own chunk for better caching
                    if (id.includes("node_modules/three")) {
                        return "three";
                    }
                    // Group feature modules by category
                    if (id.includes("src/features/tabs/")) {
                        return "tabs";
                    }
                    if (id.includes("src/features/modals/")) {
                        return "modals";
                    }
                    if (id.includes("src/features/forms/")) {
                        return "forms";
                    }
                    if (id.includes("src/features/parts/")) {
                        return "parts";
                    }
                    if (id.includes("src/features/state/")) {
                        return "state";
                    }
                    if (id.includes("src/features/navigation/")) {
                        return "navigation";
                    }
                    if (id.includes("src/features/auth/")) {
                        return "auth";
                    }
                    if (id.includes("src/core/")) {
                        return "core";
                    }
                    // Vendor chunk for other node_modules
                    if (id.includes("node_modules")) {
                        return "vendor";
                    }
                },
                // Use content hash for better caching
                chunkFileNames: "assets/[name]-[hash].js",
                entryFileNames: "assets/[name]-[hash].js",
                assetFileNames: "assets/[name]-[hash].[ext]",
            },
        },
        // Target modern browsers for smaller bundles
        target: "es2020",
        // Disable source maps in production for smaller bundles
        sourcemap: false,
        // Optimize CSS
        cssMinify: true,
        // Enable CSS code splitting for better caching
        cssCodeSplit: true,
    },
});
