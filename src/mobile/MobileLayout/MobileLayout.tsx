import * as React from 'react'
import { useAppSelector } from '../../state/hooks'
import TvModeToggle from '../../components/tv/TvModeToggle/TvModeToggle'
import styles from './MobileLayout.module.scss'

type TMobileLayoutProps = {
	children: React.ReactNode
}

/** Mobile chrome around SIOnline screens — protocol/state unchanged. */
export const MobileLayout: React.FC<TMobileLayoutProps> = ({ children }) => {
	const tvMode = useAppSelector(state => state.settings.tvMode)

	React.useEffect(() => {
		document.body.classList.toggle('tvMode', tvMode)
		return () => document.body.classList.remove('tvMode')
	}, [tvMode])

	return (
		<div className={`${styles.shell} ${tvMode ? styles.tvMode : ''}`}>
			{!tvMode ? (
				<div className={styles.banner} aria-hidden={false}>
					<span className={styles.badge}>kibni</span>
					<span>мобильный клиент · серверы SIGame</span>
				</div>
			) : null}
			<TvModeToggle />
			<div className={styles.content}>{children}</div>
		</div>
	)
}

export default MobileLayout
