/**
 * Smoke-check: official SIGame server discovery (same as SIOnline / sigame.vladimirkhil.com).
 */
const PRIMARY = 'https://vladimirkhil.com/api/si/servers'
const FALLBACK = 'https://server2.vladimirkhil.com/api/si/servers/'

async function fetchServers(uri) {
	const sep = uri.includes('?') ? '&' : uri.endsWith('/') ? '?' : '?'
	const url = `${uri}${sep}r=${Math.random()}`
	const res = await fetch(url)
	if (!res.ok) {
		throw new Error(`${uri} -> HTTP ${res.status}: ${await res.text()}`)
	}
	const data = await res.json()
	if (!Array.isArray(data) || data.length === 0) {
		throw new Error(`${uri} -> empty server list`)
	}
	return data
}

async function main() {
	console.log('Svoyak interop smoke: SIGame server discovery\n')

	let servers
	let source
	try {
		servers = await fetchServers(FALLBACK)
		source = FALLBACK
	} catch (fallbackError) {
		console.warn('Fallback discovery failed:', fallbackError.message)
		servers = await fetchServers(PRIMARY)
		source = PRIMARY
	}

	const server = servers[0]
	console.log('OK discovery via', source)
	console.log(JSON.stringify(server, null, 2))

	if (!server.uri || !server.proxyUri) {
		throw new Error('Server info missing uri/proxyUri')
	}

	const base = server.uri.endsWith('/') ? server.uri : `${server.uri}/`
	const infoUrl = new URL('api/v1/info/host', base)
	const infoRes = await fetch(infoUrl)
	if (!infoRes.ok) {
		console.warn(`WARN info/host ${infoUrl.href} -> ${infoRes.status}`)
	} else {
		const info = await infoRes.json()
		console.log('OK info/host')
		console.log(JSON.stringify(info, null, 2).slice(0, 800))
	}

	console.log('\nManual interop check:')
	console.log('1. Friend creates a room on https://sigame.vladimirkhil.com/')
	console.log('2. Run: npm run dev')
	console.log('3. Join the same room by PIN from Svoyak')
	console.log('\nSmoke passed.')
}

main().catch((err) => {
	console.error('Smoke FAILED:', err)
	process.exit(1)
})
