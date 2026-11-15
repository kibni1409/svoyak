/**
 * Official SIGame server discovery endpoints (interop with sigame.vladimirkhil.com).
 * Runtime values also live in /public/config.js (loaded before the app bundle).
 */
export const SERVER_DISCOVERY_URI = 'https://vladimirkhil.com/api/si/servers'
export const SERVER_DISCOVERY_URI_FALLBACK = 'https://server2.vladimirkhil.com/api/si/servers/'
export const SI_STATISTICS_URI = 'https://vladimirkhil.com/sistatistics'
export const APP_REGISTRY_URI = 'https://vladimirkhil.com/appregistry'

export type TServerInfo = {
	uri: string
	proxyUri: string
	protocolVersion: number
}
