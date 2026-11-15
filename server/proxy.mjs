/**
 * Same-origin SIGame proxy for Layero fullstack (apiPrefix: /si).
 * Path may arrive as /si/... or /... depending on edge stripping.
 */
import http from 'node:http'
import https from 'node:https'
import { URL } from 'node:url'

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
	const rest = pathname.replace(/^\/si\/?/, '').replace(/^\//, '')

	for (const [prefix, base] of RULES) {
		if (rest === prefix || rest.startsWith(`${prefix}/`)) {
			return base + rest.slice(prefix.length)
		}
	}

	return null
}

function copyRequestHeaders(req, targetHost) {
	const headers = { ...req.headers, host: targetHost }
	delete headers['connection']
	delete headers['content-length']
	return headers
}

function proxy(req, res, targetUrl) {
	const target = new URL(targetUrl)
	const transport = target.protocol === 'https:' ? https : http

	const upstream = transport.request(
		target,
		{
			method: req.method,
			headers: copyRequestHeaders(req, target.host),
		},
		(upstreamRes) => {
			res.writeHead(upstreamRes.statusCode || 502, upstreamRes.headers)
			upstreamRes.pipe(res)
		},
	)

	upstream.on('error', (error) => {
		if (!res.headersSent) {
			res.writeHead(502, { 'content-type': 'application/json; charset=utf-8' })
		}
		res.end(JSON.stringify({ error: 'SI proxy failed', message: String(error), target: targetUrl }))
	})

	req.pipe(upstream)
}

const port = Number(process.env.PORT || 3000)

const server = http.createServer((req, res) => {
	const pathname = (req.url || '/').split('?')[0]
	const search = (req.url || '').includes('?') ? req.url.slice(req.url.indexOf('?')) : ''

	if (pathname === '/health' || pathname === '/') {
		res.writeHead(200, { 'content-type': 'application/json; charset=utf-8' })
		res.end(JSON.stringify({ ok: true, service: 'svoyak-si-proxy' }))
		return
	}

	const target = resolveTarget(pathname)
	if (!target) {
		res.writeHead(404, { 'content-type': 'application/json; charset=utf-8' })
		res.end(JSON.stringify({ error: 'Unknown SI proxy path', path: pathname }))
		return
	}

	proxy(req, res, target + search)
})

server.listen(port, '0.0.0.0', () => {
	console.log(`Svoyak SI proxy listening on 0.0.0.0:${port}`)
})
