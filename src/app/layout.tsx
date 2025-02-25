import type { Metadata } from 'next';
import { Inter, Alegreya } from 'next/font/google';
import React from 'react';
import { ColorSchemeScript } from '@mantine/core';
import { createTheme } from '@mantine/core';
import { ClientLayout } from '@/components/ClientLayout';
import { AuthProvider } from '@/context/AuthContext';
import '@mantine/core/styles.css';
import '@mantine/nprogress/styles.css';
import './globals.scss';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
});

const alegreya = Alegreya({
  weight: ['400', '500', '700'],
  subsets: ['latin'],
  variable: '--font-alegreya',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'OrderPro - Runes de Chêne',
  description: 'App de gestion des commandes',
};

const theme = createTheme({
  fontFamily: 'var(--font-inter)',
  headings: {
    fontFamily: 'var(--font-alegreya)',
  },
});

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="fr">
      <head>
        <ColorSchemeScript />
      </head>
      <body className={`${inter.variable} ${alegreya.variable}`}>
        <AuthProvider>
          <ClientLayout theme={theme}>
            {children}
          </ClientLayout>
        </AuthProvider>
      </body>
    </html>
  );
}
