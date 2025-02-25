'use client';

import Link from 'next/link';
import styles from './error.module.scss';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className={styles.errorContainer}>
      <h1>Une erreur est survenue</h1>
      <p>Désolé, quelque chose s&apos;est mal passé.</p>
      <div className={styles.actions}>
        <button onClick={reset} className={styles.resetButton}>
          Réessayer
        </button>
        <Link href="/" className={styles.homeLink}>
          Retour à l&apos;accueil
        </Link>
      </div>
    </div>
  );
}
