/** True when the body looks like an HTML document (SPA / gateway page). */
export function looksLikeHtml(text: string): boolean {
	const trimmed = text.trimStart().slice(0, 32).toLowerCase()
	return trimmed.startsWith('<!doctype') || trimmed.startsWith('<html')
}

async function sleep(ms: number): Promise<void> {
	await new Promise((resolve) => {
		setTimeout(resolve, ms)
	})
}

export class HttpJsonError extends Error {
	constructor(
		message: string,
		public status: number,
		public body: string,
	) {
		super(message)
		this.name = 'HttpJsonError'
	}
}

/**
 * fetch + JSON parse with retries when Layero cold-start / SPA fallback returns HTML
 * instead of the API payload.
 */
export async function fetchJson<T>(
	input: RequestInfo | URL,
	init?: RequestInit,
	options?: { retries?: number; retryDelayMs?: number },
): Promise<T> {
	const retries = options?.retries ?? 3
	const retryDelayMs = options?.retryDelayMs ?? 1500
	let lastError: unknown

	for (let attempt = 0; attempt <= retries; attempt++) {
		try {
			const response = await fetch(input, init)
			const contentType = response.headers.get('content-type')?.toLowerCase() ?? ''
			const text = await response.text()

			if (looksLikeHtml(text) || (contentType.includes('text/html') && !contentType.includes('json'))) {
				lastError = new Error(
					`API returned HTML instead of JSON (status ${response.status}). Backend may be waking up.`,
				)
				if (attempt < retries) {
					await sleep(retryDelayMs * (attempt + 1))
					continue
				}
				throw lastError
			}

			if (!response.ok) {
				throw new HttpJsonError(text.trim() || `HTTP ${response.status}`, response.status, text)
			}

			if (!text.trim()) {
				return undefined as T
			}

			try {
				return JSON.parse(text) as T
			} catch (parseError) {
				lastError = parseError
				if (attempt < retries && looksLikeHtml(text)) {
					await sleep(retryDelayMs * (attempt + 1))
					continue
				}
				throw parseError
			}
		} catch (error) {
			lastError = error
			if (error instanceof HttpJsonError) {
				throw error
			}
			const message = error instanceof Error ? error.message : String(error)
			const maybeTransient = /HTML instead of JSON|Failed to fetch|NetworkError|quota|429/i.test(message)
			if (attempt < retries && maybeTransient) {
				await sleep(retryDelayMs * (attempt + 1))
				continue
			}
			throw error
		}
	}

	throw lastError instanceof Error ? lastError : new Error(String(lastError))
}
