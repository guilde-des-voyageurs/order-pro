import Link from 'next/link';
import styles from './error.module.scss';

export default function NotFound() {
  return (
    <div className={styles.errorContainer}>
      <h1>404 - Page non trouvée</h1>
      <p>Désolé, la page que vous recherchez n&apos;existe pas.</p>
      <Link href="/" className={styles.homeLink}>
        Retour à l&apos;accueil
      </Link>
    </div>
  );
}
