/**
 * SIGame APIs allow CORS only for https://sigame.vladimirkhil.com.
 * From any other origin we rewrite upstream URLs to same-origin Vite/nginx proxies.
 */

export function useSameOriginSiProxy(): boolean {
	if (typeof window === 'undefined') {
		return false
	}

	return window.location.hostname !== 'sigame.vladimirkhil.com'
}

/** Prefer WebSockets on Layero/local; LongPolling-only on Vercel (WS upgrade often hangs). */
export function preferLongPollingOnly(): boolean {
	if (typeof window === 'undefined') {
		return false
	}

	return window.location.hostname.endsWith('.vercel.app')
}

function originBase(): string {
	return window.location.origin
}

/** Map known SI upstream absolute URLs onto /si/* proxies. */
export function rewriteSiUri(uri: string | null | undefined): string {
	if (!uri || !useSameOriginSiProxy()) {
		return uri ?? ''
	}

	try {
		const absolute = new URL(uri, originBase())
		const host = absolute.hostname
		const port = absolute.port
		const path = absolute.pathname + absolute.search + absolute.hash
		const base = originBase()

		if (host === 'vladimirkhil.com' && path.startsWith('/sicontent')) {
			return `${base}/si/sicontent${path.slice('/sicontent'.length)}`
		}

		if (host === 'content.vladimirkhil.com' && path.startsWith('/sicontent')) {
			return `${base}/si/sicontent2${path.slice('/sicontent'.length)}`
		}

		if (host === 'vladimirkhil.com' && path.startsWith('/sistorage')) {
			return `${base}/si/sistorage${path.slice('/sistorage'.length)}`
		}

		if (host === 'content.vladimirkhil.com' && (path === '/server' || path.startsWith('/server/') || path.startsWith('/server'))) {
			const rest = path.replace(/^\/server\/?/, '/')
			const normalized = rest === '/' ? '' : rest
			return `${base}/si/server${normalized}${absolute.search}${absolute.hash}`
		}

		if (host === 'server2.vladimirkhil.com' && (port === '8080' || absolute.href.includes(':8080'))) {
			return `${base}/si/proxy${path}`
		}

		if (host === 'content.vladimirkhil.com' && (port === '8080' || absolute.href.includes(':8080'))) {
			return `${base}/si/content-proxy${path}`
		}

		if (host === 'vladimirkhil.com' && path.startsWith('/sigameserver-0')) {
			return `${base}/si/gamehost0${path.slice('/sigameserver-0'.length)}`
		}

		if (host === 'vladimirkhil.com' && path.startsWith('/api/si/servers')) {
			return `${base}/si/discovery${path.slice('/api/si/servers'.length)}${absolute.search}`
		}

		return uri
	} catch {
		return uri
	}
}

export function rewriteSiUriOrNull(uri: string | null | undefined): string | null {
	if (uri == null) {
		return null
	}

	return rewriteSiUri(uri)
}
