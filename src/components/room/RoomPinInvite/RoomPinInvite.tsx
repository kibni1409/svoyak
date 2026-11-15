import * as React from 'react';
import { QRCodeSVG } from 'qrcode.react';
import localization from '../../../model/resources/localization';
import Path from '../../../model/enums/Path';
import { useAppDispatch, useAppSelector } from '../../../state/hooks';
import { getPin } from '../../../state/room2Slice';

import './RoomPinInvite.scss';

interface RoomPinInviteProps {
	compact?: boolean;
	className?: string;
}

function buildJoinByPinUrl(pin: string): string {
	const url = new URL(Path.JoinByPin, window.location.origin);
	url.searchParams.set('pin', pin);
	return url.toString();
}

/** PIN + QR so friends can join from phones. */
export default function RoomPinInvite(props: RoomPinInviteProps): JSX.Element | null {
	const appDispatch = useAppDispatch();
	const pin = useAppSelector(state => state.room2.pin);
	const isHost = useAppSelector(state => state.room2.persons.hostName === state.room2.name);
	const isConnected = useAppSelector(state => state.common.isSIHostConnected);

	React.useEffect(() => {
		if (isHost && isConnected && !pin) {
			appDispatch(getPin());
		}
	}, [isHost, isConnected, pin, appDispatch]);

	if (!isHost) {
		return null;
	}

	if (!pin) {
		return (
			<div className={`roomPinInvite ${props.compact ? 'compact' : ''} ${props.className || ''}`}>
				<button
					type="button"
					className="standard roomPinInvite__load"
					disabled={!isConnected}
					onClick={() => appDispatch(getPin())}
				>
					{localization.getPin}
				</button>
			</div>
		);
	}

	const joinUrl = buildJoinByPinUrl(pin);

	return (
		<div className={`roomPinInvite ${props.compact ? 'compact' : ''} ${props.className || ''}`}>
			<div className="roomPinInvite__qr" title={joinUrl}>
				<QRCodeSVG value={joinUrl} size={props.compact ? 120 : 200} bgColor="#ffffff" fgColor="#0b1c3f" />
			</div>
			<div className="roomPinInvite__meta">
				<span className="roomPinInvite__label">{localization.scanToJoin}</span>
				<span className="roomPinInvite__pin" aria-label={localization.pin}>{pin}</span>
				<span className="roomPinInvite__hint">{localization.pin}</span>
			</div>
		</div>
	);
}
