import { defineConfig } from 'vite';
import { sveltekit } from '@sveltejs/kit/vite';
import { resolve } from 'path';

// https://vitejs.dev/config/
export default defineConfig({
	plugins: [
		sveltekit(),
	],
	build: {
		// Target modern browsers for better performance
		target: 'es2015',

		// Enable minification using Terser for smaller bundle sizes
		minify: 'terser',
		terserOptions: {
			compress: {
				drop_console: true, // Remove console logs in production
				drop_debugger: true, // Remove debugger statements
			},
			format: {
				comments: false, // Remove comments
			},
		},

		// Disable source maps for production
		sourcemap: false,

		// Optimize dependencies to prevent Phaser from being excessively bundled
		commonjsOptions: {
			include: [/node_modules/],
		},

		// Specify out directory
		outDir: 'build',
	},
	optimizeDeps: {
		include: ['phaser'],
	},
	resolve: {
		alias: {
			phaser: resolve(__dirname, 'node_modules/phaser/dist/phaser.min.js'),
		},
	},
	server: {
		port: 8080
	}
})
