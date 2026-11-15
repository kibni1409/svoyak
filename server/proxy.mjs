/**
 * Same-origin SIGame proxy for Layero fullstack (apiPrefix: /si).
 * HTTP always works. WebSocket upgrade is optional (Layero edge is HTTP-first).
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
	['content-proxy', 'https://content.vladimirkhil.com:8080'],
	['server', 'https://content.vladimirkhil.com/server'],
	['gamehost0', 'https://vladimirkhil.com/sigameserver-0'],
	['proxy', 'https://server2.vladimirkhil.com:8080'],
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

function copyHttpHeaders(req, targetHost) {
	const headers = { ...req.headers, host: targetHost }
	delete headers.connection
	delete headers['content-length']
	return headers
}

function copyWsClientHeaders(req, targetHost) {
	const headers = { ...req.headers, host: targetHost }
	delete headers.connection
	delete headers.upgrade
	delete headers['sec-websocket-key']
	delete headers['sec-websocket-version']
	delete headers['sec-websocket-extensions']
	delete headers['sec-websocket-accept']
	delete headers['content-length']
	return headers
}

function proxyHttp(req, res, targetUrl) {
	const target = new URL(targetUrl)
	const transport = target.protocol === 'https:' ? https : http

	const upstream = transport.request(
		target,
		{
			method: req.method,
			headers: copyHttpHeaders(req, target.host),
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

function toWsUrl(httpUrl) {
	return httpUrl.replace(/^http:/i, 'ws:').replace(/^https:/i, 'wss:')
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

	proxyHttp(req, res, target + search)
})

async function enableWebSocketProxy() {
	try {
		const { WebSocketServer, WebSocket } = await import('ws')

		const wss = new WebSocketServer({ noServer: true })

		const pipeSockets = (a, b) => {
			const pending = []

			a.on('message', (data, isBinary) => {
				if (b.readyState === WebSocket.OPEN) {
					b.send(data, { binary: isBinary })
				} else if (b.readyState === WebSocket.CONNECTING) {
					pending.push({ data, isBinary })
				}
			})

			b.on('open', () => {
				for (const item of pending) {
					if (b.readyState === WebSocket.OPEN) {
						b.send(item.data, { binary: item.isBinary })
					}
				}
				pending.length = 0
			})

			b.on('message', (data, isBinary) => {
				if (a.readyState === WebSocket.OPEN) {
					a.send(data, { binary: isBinary })
				}
			})

			const closeBoth = (code, reason) => {
				try {
					if (a.readyState === WebSocket.OPEN || a.readyState === WebSocket.CONNECTING) {
						a.close(code, reason)
					}
				} catch {
					a.terminate()
				}
				try {
					if (b.readyState === WebSocket.OPEN || b.readyState === WebSocket.CONNECTING) {
						b.close(code, reason)
					}
				} catch {
					b.terminate()
				}
			}

			a.on('close', (code, reason) => closeBoth(code, reason))
			b.on('close', (code, reason) => closeBoth(code, reason))
			a.on('error', () => closeBoth(1011, 'socket error'))
			b.on('error', () => closeBoth(1011, 'upstream error'))
		}

		server.on('upgrade', (req, socket, head) => {
			const pathname = (req.url || '/').split('?')[0]
			const search = (req.url || '').includes('?') ? req.url.slice(req.url.indexOf('?')) : ''
			const targetHttp = resolveTarget(pathname)

			if (!targetHttp) {
				socket.destroy()
				return
			}

			const upstreamUrl = toWsUrl(targetHttp + search)
			const upstreamHeaders = copyWsClientHeaders(req, new URL(targetHttp).host)

			wss.handleUpgrade(req, socket, head, (clientWs) => {
				const upstream = new WebSocket(upstreamUrl, { headers: upstreamHeaders })
				pipeSockets(clientWs, upstream)
			})
		})

		console.log('WebSocket upgrade proxy enabled')
	} catch (error) {
		console.warn('WebSocket proxy disabled (ws unavailable):', error?.message || error)
	}
}

await enableWebSocketProxy()

server.listen(port, '0.0.0.0', () => {
	console.log(`Svoyak SI proxy listening on 0.0.0.0:${port}`)
})
