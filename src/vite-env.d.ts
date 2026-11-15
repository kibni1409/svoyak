/// <reference types="vite/client" />

import type Config from './Config'

declare global {
	const config: Config
	const firebaseConfig: Record<string, unknown> | undefined
	const IS_STEAM_BUILD: boolean | undefined
	const APP_VERSION: string
	interface Window {
		config?: Config
		firebaseConfig?: Record<string, unknown>
		__TAURI_INTERNALS__?: unknown
		__TAURI__?: unknown
	}
}

declare module '*.svg' {
	const src: string
	export default src
}

declare module '*.png' {
	const src: string
	export default src
}

declare module '*.jpg' {
	const src: string
	export default src
}

declare module '*.mp3' {
	const src: string
	export default src
}

declare module '*.css'
declare module '*.scss'

export {}
