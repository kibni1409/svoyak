import * as React from 'react';
import localization from '../../../model/resources/localization';
import { useAppDispatch, useAppSelector } from '../../../state/hooks';
import { setTvMode } from '../../../state/settingsSlice';

import './TvModeToggle.scss';

/** Corner switch between phone UI and TV / living-room UI. */
export default function TvModeToggle(): JSX.Element {
	const appDispatch = useAppDispatch();
	const tvMode = useAppSelector(state => state.settings.tvMode);

	return (
		<button
			type="button"
			className={`tvModeToggle ${tvMode ? 'active' : ''}`}
			title={localization.tvModeHint}
			aria-pressed={tvMode}
			onClick={() => appDispatch(setTvMode(!tvMode))}
		>
			{tvMode ? localization.tvModeOn : localization.tvMode}
		</button>
	);
}
