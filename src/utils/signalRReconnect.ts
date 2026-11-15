import type { RetryContext } from '@microsoft/signalr'

function isQuotaError(error?: Error): boolean {
	const message = error?.message ?? ''
	return message.includes('429') || /quota exceeded/i.test(message)
}

/** Backoff for SignalR reconnect. Quota/429 waits much longer so Layero free limit can recover. */
export function nextSignalRRetryDelay(
	retryContext: RetryContext,
	options?: { maxDelayMs?: number; stop?: boolean },
): number | null {
	if (options?.stop) {
		return null
	}

	const attempt = retryContext.previousRetryCount
	const maxDelay = options?.maxDelayMs ?? 30_000

	if (isQuotaError(retryContext.retryReason)) {
		// 15s, 30s, 60s, 90s… — do not hammer the 20 req/min gate
		return Math.min(15_000 * 2 ** attempt, 120_000)
	}

	return Math.min(1_000 * (attempt + 1), maxDelay)
}
