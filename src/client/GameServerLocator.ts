import ServerInfo from './contracts/ServerInfo';
import localization from '../model/resources/localization';
import { rewriteSiUri, useSameOriginSiProxy } from '../utils/siProxy';

const OFFICIAL_DISCOVERY = 'https://vladimirkhil.com/api/si/servers';
const OFFICIAL_DISCOVERY_FALLBACK = 'https://server2.vladimirkhil.com/api/si/servers/';

function localDiscoveryUris(configured?: string): string[] {
	const uris = ['/si/discovery2/', '/si/discovery'];
	if (configured && !configured.includes('vladimirkhil.com')) {
		uris.push(configured);
	}
	return uris;
}

function rewriteToSameOrigin(info: ServerInfo): ServerInfo {
	if (!useSameOriginSiProxy()) {
		return info;
	}

	return {
		...info,
		uri: rewriteSiUri(info.uri),
		proxyUri: info.proxyUri ? rewriteSiUri(info.proxyUri) : info.proxyUri,
	};
}

async function getServerInfoFromUri(serverDiscoveryUri: string): Promise<ServerInfo> {
	const separator = serverDiscoveryUri.includes('?') ? '&' : serverDiscoveryUri.endsWith('/') ? '?' : '?';
	const serverUrisResponse = await fetch(`${serverDiscoveryUri}${separator}r=${Math.random()}`);

	if (!serverUrisResponse.ok) {
		throw new Error(localization.formatString(
			localization.serverDiscoveryBroken,
			serverUrisResponse.status.toString(),
			await serverUrisResponse.text()) as string);
	}

	const serverUris = (await serverUrisResponse.json()) as ServerInfo[];

	if (!serverUris || serverUris.length === 0) {
		throw new Error(localization.serverUrisBroken);
	}

	return rewriteToSameOrigin(serverUris[0]);
}

export default async function getServerInfo(serverDiscoveryUri: string): Promise<ServerInfo> {
	const candidates = useSameOriginSiProxy()
		? localDiscoveryUris(serverDiscoveryUri)
		: [OFFICIAL_DISCOVERY_FALLBACK, serverDiscoveryUri || OFFICIAL_DISCOVERY];

	let lastError: unknown;

	for (const uri of candidates) {
		try {
			return await getServerInfoFromUri(uri);
		} catch (error) {
			lastError = error;
			console.warn(`SIGame discovery failed for ${uri}:`, error);
		}
	}

	const message = lastError instanceof Error ? lastError.message : String(lastError);
	throw new Error(localization.formatString(
		localization.serverDiscoveryDoubleError,
		candidates[0],
		message,
		candidates[1] ?? candidates[0],
		message,
	) as string);
}
