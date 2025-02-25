import type { AppProps } from 'next/app';
import { MantineProvider } from '@mantine/core';
import { Notifications } from '@mantine/notifications';
import { AuthGuard } from '@/components/AuthGuard';

export default function App({ Component, pageProps }: AppProps) {
  return (
    <MantineProvider>
      <Notifications />
      <AuthGuard>
        <Component {...pageProps} />
      </AuthGuard>
    </MantineProvider>
  );
}
