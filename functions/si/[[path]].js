/**
 * Same-origin SIGame proxy for Cloudflare Pages.
 * Maps /si/* → official SIOnline upstreams (CORS workaround).
 */

const RULES = [
	['discovery2', 'https://server2.vladimirkhil.com/api/si/servers'],
	['discovery', 'https://vladimirkhil.com/api/si/servers'],
	['sistorage', 'https://vladimirkhil.com/sistorage'],
	['sicontent2', 'https://content.vladimirkhil.com/sicontent'],
	['sicontent', 'https://vladimirkhil.com/sicontent'],
	['server', 'https://content.vladimirkhil.com/server'],
	['gamehost0', 'https://vladimirkhil.com/sigameserver-0'],
]

function resolveTarget(pathname) {
	const rest = pathname.replace(/^\/si\/?/, '')

	for (const [prefix, base] of RULES) {
		if (rest === prefix || rest.startsWith(`${prefix}/`)) {
			return base + rest.slice(prefix.length)
		}
	}

	return null
}

export async function onRequest(context) {
	const incoming = new URL(context.request.url)
	const targetPath = resolveTarget(incoming.pathname)

	if (!targetPath) {
		return new Response(`Unknown SI proxy path: ${incoming.pathname}`, { status: 404 })
	}

	const targetUrl = targetPath + incoming.search
	const headers = new Headers(context.request.headers)
	headers.delete('host')
	headers.delete('cf-connecting-ip')
	headers.delete('cf-ray')
	headers.delete('cf-visitor')
	headers.delete('x-forwarded-proto')
	headers.delete('x-real-ip')

	const init = {
		method: context.request.method,
		headers,
		redirect: 'follow',
	}

	if (context.request.method !== 'GET' && context.request.method !== 'HEAD') {
		init.body = context.request.body
		// @ts-expect-error - required for streaming request bodies in Workers
		init.duplex = 'half'
	}

	try {
		return await fetch(targetUrl, init)
	} catch (error) {
		return new Response(
			JSON.stringify({
				error: 'SI proxy failed',
				target: targetUrl,
				message: error instanceof Error ? error.message : String(error),
			}),
			{
				status: 502,
				headers: { 'content-type': 'application/json; charset=utf-8' },
			},
		)
	}
}
