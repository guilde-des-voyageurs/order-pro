import { clsx } from 'clsx';
import styles from './Badge.module.scss';

export const Badge = ({
  children,
  variant,
}: {
  children: React.ReactNode;
  variant: 'green' | 'orange';
}) => {
  const colorStyle =
    variant === 'green'
      ? styles.view_variant_green
      : styles.view_variant_orange;

  return <div className={clsx(styles.view, colorStyle)}>{children}</div>;
};
