import { defineConfig, type Plugin } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const rootDir = path.dirname(fileURLToPath(import.meta.url))
const shim = (...parts: string[]) => path.resolve(rootDir, 'src', 'shims', ...parts)

/** SI *-client packages ship .d.ts-only deep imports; map them to runtime shims. */
const siClientDeepImports: Record<string, string> = {
	'sicontent-client/dist/models/WellKnownSIContentServiceErrorCode': shim(
		'sicontent',
		'WellKnownSIContentServiceErrorCode.ts',
	),
	'sistatistics-client/dist/models/GamePlatforms': shim('sistatistics', 'GamePlatforms.ts'),
	'appregistry-client/dist/requests/Architecture': shim('appregistry', 'Architecture.ts'),
	'sistorage-client/dist/models/CompareMode': shim('sistorage', 'CompareMode.ts'),
	'sistorage-client/dist/models/PackageSortMode': shim('sistorage', 'PackageSortMode.ts'),
	'sistorage-client/dist/models/PackageSortDirection': shim('sistorage', 'PackageSortDirection.ts'),
	'sistorage-client/dist/models/WellKnownSIStorageServiceErrorCode': shim(
		'sistorage',
		'WellKnownSIStorageServiceErrorCode.ts',
	),
	'sistorage-client/dist/models/SIStorageServiceError': shim('sistorage', 'SIStorageServiceError.ts'),
}

function siClientShims(): Plugin {
	return {
		name: 'si-client-shims',
		enforce: 'pre',
		resolveId(id) {
			if (siClientDeepImports[id]) {
				return siClientDeepImports[id]
			}
			if (/^(sicontent|sistatistics|sistorage|appregistry|accountservice)-client\/dist\//.test(id)) {
				return shim('empty.ts')
			}
			return null
		},
	}
}

export default defineConfig({
	define: {
		APP_VERSION: JSON.stringify(process.env.npm_package_version ?? '0.1.0'),
		IS_STEAM_BUILD: JSON.stringify(false),
	},
	plugins: [
		siClientShims(),
		react(),
		// PWA temporarily disabled: SW/manifest caused blank pages and 500s on Vercel/TV
	],
	resolve: {
		alias: {
			'@': path.resolve(rootDir, 'src'),
		},
	},
	server: {
		port: 5173,
		host: true,
		proxy: {
			// Same-origin proxy: SIGame CORS allows only https://sigame.vladimirkhil.com
			'/si/server': {
				target: 'https://content.vladimirkhil.com',
				changeOrigin: true,
				secure: true,
				ws: true,
				rewrite: (p) => p.replace(/^\/si\/server/, '/server'),
			},
			'/si/proxy': {
				target: 'https://server2.vladimirkhil.com:8080',
				changeOrigin: true,
				secure: true,
				ws: true,
				rewrite: (p) => p.replace(/^\/si\/proxy/, ''),
			},
			'/si/discovery': {
				target: 'https://vladimirkhil.com',
				changeOrigin: true,
				secure: true,
				rewrite: (p) => p.replace(/^\/si\/discovery/, '/api/si/servers'),
			},
			'/si/discovery2': {
				target: 'https://server2.vladimirkhil.com',
				changeOrigin: true,
				secure: true,
				rewrite: (p) => p.replace(/^\/si\/discovery2/, '/api/si/servers'),
			},
			'/si/sistorage': {
				target: 'https://vladimirkhil.com',
				changeOrigin: true,
				secure: true,
				rewrite: (p) => p.replace(/^\/si\/sistorage/, '/sistorage'),
			},
			'/si/sicontent': {
				target: 'https://vladimirkhil.com',
				changeOrigin: true,
				secure: true,
				rewrite: (p) => p.replace(/^\/si\/sicontent/, '/sicontent'),
			},
			'/si/sicontent2': {
				target: 'https://content.vladimirkhil.com',
				changeOrigin: true,
				secure: true,
				rewrite: (p) => p.replace(/^\/si\/sicontent2/, '/sicontent'),
			},
			'/si/gamehost0': {
				target: 'https://vladimirkhil.com',
				changeOrigin: true,
				secure: true,
				ws: true,
				rewrite: (p) => p.replace(/^\/si\/gamehost0/, '/sigameserver-0'),
			},
			'/si/content-proxy': {
				target: 'https://content.vladimirkhil.com:8080',
				changeOrigin: true,
				secure: true,
				ws: true,
				rewrite: (p) => p.replace(/^\/si\/content-proxy/, ''),
			},
		},
	},
	build: {
		outDir: 'dist',
		sourcemap: false,
	},
	css: {
		preprocessorOptions: {
			scss: {
				api: 'modern-compiler',
			},
		},
	},
})
