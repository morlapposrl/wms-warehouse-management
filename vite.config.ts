import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';

export default defineConfig({
	plugins: [sveltekit()],
	server: {
		port: 3002,
		host: true,
		allowedHosts: ['connect.microlops.it', 'localhost', '127.0.0.1'],
		hmr: {
			// Riduce refresh automatico
			overlay: false
		}
	}
});