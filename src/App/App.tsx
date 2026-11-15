import { useState, type FC } from 'react'
import styles from './App.module.scss'

export const App: FC = () => {
  const [count, setCount] = useState(0)

  return (
    <main className={styles.page}>
      <section className={styles.card}>
        <h1 className={styles.title}>Svoyak</h1>
        <p className={styles.subtitle}>
          React + TypeScript + Vite. Стили через SCSS Modules —
          правьте <code>src/App/App.module.scss</code>.
        </p>
        <button
          type="button"
          className={styles.button}
          onClick={() => setCount((value) => value + 1)}
        >
          Count is {count}
        </button>
      </section>
    </main>
  )
}
