import * as React from 'react';
import { QRCodeSVG } from 'qrcode.react';
import localization from '../../../model/resources/localization';
import { useAppDispatch, useAppSelector } from '../../../state/hooks';
import { getPin } from '../../../state/room2Slice';
import { buildRoomInviteUrl } from '../../../utils/inviteLink';

import './RoomPinInvite.scss';

interface RoomPinInviteProps {
	compact?: boolean;
	className?: string;
}

/** Room invite QR (official `?_d…` style) + PIN for verbal share. */
export default function RoomPinInvite(props: RoomPinInviteProps): JSX.Element | null {
	const appDispatch = useAppDispatch();
	const pin = useAppSelector(state => state.room2.pin);
	const isHost = useAppSelector(state => state.room2.persons.hostName === state.room2.name);
	const isConnected = useAppSelector(state => state.common.isSIHostConnected);
	const gameId = useAppSelector(state => state.ui.navigation.gameId);
	const hostUri = useAppSelector(state => state.ui.navigation.hostUri);
	const siHosts = useAppSelector(state => state.common.siHosts);

	React.useEffect(() => {
		if (isHost && isConnected && !pin) {
			appDispatch(getPin());
		}
	}, [isHost, isConnected, pin, appDispatch]);

	if (!isHost) {
		return null;
	}

	const joinUrl = gameId != null
		? buildRoomInviteUrl(gameId, hostUri, siHosts)
		: null;

	return (
		<div className={`roomPinInvite ${props.compact ? 'compact' : ''} ${props.className || ''}`}>
			{joinUrl ? (
				<div className="roomPinInvite__qr" title={joinUrl}>
					<QRCodeSVG value={joinUrl} size={props.compact ? 120 : 200} bgColor="#ffffff" fgColor="#0b1c3f" />
				</div>
			) : null}

			<div className="roomPinInvite__meta">
				{joinUrl ? <span className="roomPinInvite__label">{localization.scanToJoin}</span> : null}

				{pin ? (
					<>
						<span className="roomPinInvite__pin" aria-label={localization.pin}>{pin}</span>
						<span className="roomPinInvite__hint">{localization.pin}</span>
					</>
				) : (
					<button
						type="button"
						className="standard roomPinInvite__load"
						disabled={!isConnected}
						onClick={() => appDispatch(getPin())}
					>
						{localization.getPin}
					</button>
				)}
			</div>
		</div>
	);
}
