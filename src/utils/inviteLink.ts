import localization from '../model/resources/localization';
import { userInfoChanged } from '../state/commonSlice';
import { copyUriToClipboard } from '../state/globalActions';
import { AppDispatch } from '../state/store';
import { rewriteSiUri } from './siProxy';

export default function inviteLink(appDispatch: AppDispatch) {
	appDispatch(copyUriToClipboard());
	appDispatch(userInfoChanged(localization.inviteLinkCopied));
}

/** Builds the query part of the room link. Rooms on known SIGame hosts get a short link. */
export function getGameLink(gameId: number, hostUri: string | undefined, siHosts: Record<string, string>): string {
	const normalizedHost = hostUri ? rewriteSiUri(hostUri) : '';

	for (const [key, value] of Object.entries(siHosts)) {
		// navigation may keep the upstream host while siHosts are same-origin rewritten
		if (value === hostUri || value === normalizedHost || rewriteSiUri(value) === normalizedHost) {
			return '_' + key + gameId;
		}
	}

	return `gameId=${gameId}&host=${encodeURIComponent(hostUri ?? '')}`;
}

/**
 * Full invite URL like the official client: `https://…/?_d338787`
 * (host key + gameId). PIN is shared verbally, not in the link.
 */
export function buildRoomInviteUrl(
	gameId: number,
	hostUri: string | undefined,
	siHosts: Record<string, string>,
): string {
	return `${window.location.origin}/?${getGameLink(gameId, hostUri, siHosts)}`;
}

/** Deep link to Join-by-PIN screen (`/?pin=`). Optional fallback, not used for room QR. */
export function buildJoinByPinUrl(pin: string | number): string {
	const url = new URL('/', window.location.origin);
	url.searchParams.set('pin', String(pin));
	return url.toString();
}