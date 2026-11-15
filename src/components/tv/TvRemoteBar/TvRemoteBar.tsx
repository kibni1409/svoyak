import * as React from 'react';
import localization from '../../../model/resources/localization';
import Role from '../../../client/models/Role';
import { useAppDispatch, useAppSelector } from '../../../state/hooks';
import { approveAnswerDefault, rejectAnswerDefault } from '../../../state/room2Slice';
import { moveNext, pauseGame, startGame } from '../../../state/serverActions';

import './TvRemoteBar.scss';

/** Large showman controls optimized for TV remote / D-pad focus. */
export default function TvRemoteBar(): JSX.Element | null {
	const appDispatch = useAppDispatch();
	const role = useAppSelector(state => state.room2.role);
	const isHost = useAppSelector(state => state.room2.persons.hostName === state.room2.name);
	const isConnected = useAppSelector(state => state.common.isSIHostConnected);
	const isGameStarted = useAppSelector(state => state.room2.stage.isGameStarted);
	const isGamePaused = useAppSelector(state => state.room2.stage.isGamePaused);
	const hasValidation = useAppSelector(state => state.room2.validation.queue.length > 0);

	const canControl = role === Role.Showman || isHost;

	if (!canControl) {
		return null;
	}

	const canStart = !isGameStarted && isHost;
	const showNext = role === Role.Showman || isHost;
	const showPause = (role === Role.Showman || isHost) && isGameStarted;

	return (
		<div className="tvRemoteBar" role="toolbar" aria-label={localization.tvRemote}>
			{showNext ? (
				<button
					type="button"
					className="tvRemoteBar__btn primary"
					disabled={!isConnected}
					onClick={() => appDispatch(canStart ? startGame() : moveNext())}
				>
					{canStart ? '▶' : localization.next}
				</button>
			) : null}

			{showPause ? (
				<button
					type="button"
					className={`tvRemoteBar__btn ${isGamePaused ? 'active' : ''}`}
					disabled={!isConnected}
					onClick={() => appDispatch(pauseGame())}
				>
					{isGamePaused ? localization.resume : localization.pause}
				</button>
			) : null}

			{role === Role.Showman ? (
				<>
					<button
						type="button"
						className="tvRemoteBar__btn yes"
						disabled={!isConnected || !hasValidation}
						onClick={() => appDispatch(approveAnswerDefault())}
						title={localization.yes}
					>
						{localization.yes}
					</button>
					<button
						type="button"
						className="tvRemoteBar__btn no"
						disabled={!isConnected || !hasValidation}
						onClick={() => appDispatch(rejectAnswerDefault())}
						title={localization.no}
					>
						{localization.no}
					</button>
				</>
			) : null}
		</div>
	);
}
