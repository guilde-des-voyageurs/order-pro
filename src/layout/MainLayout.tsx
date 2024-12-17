import styles from './MainLayout.module.scss';
import Logo from '../assets/runesdechene.png';

export const MainLayout = ({ children }: { children: any }) => {
  return (
    <div className={styles.view}>
      <div className={styles.menu}>
        <img className={styles.menu_logo} src={Logo.src} alt="Runes de Chêne" />
        <ul className={styles.menu_links}>
          <li>
            <a href={'/'}>Commandes</a>
          </li>
        </ul>
      </div>
      <main className={styles.main}>{children}</main>
    </div>
  );
};
