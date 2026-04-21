
'use client';

import React, { useEffect } from 'react';
import './globals.css';
import { FirebaseClientProvider } from '@/firebase';
import { PWAInstallPrompt } from '@/components/PWAInstallPrompt';

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  
  useEffect(() => {
    if ('serviceWorker' in navigator && window.location.hostname !== 'localhost') {
      window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js').then(
          (registration) => {
            console.log('SW registrado com sucesso:', registration.scope);
          },
          (err) => {
            console.log('Falha ao registrar SW:', err);
          }
        );
      });
    }
  }, []);

  return (
    <html lang="pt-BR">
      <head>
        <link rel="icon" href="/Logo.png" />
        <link rel="apple-touch-icon" href="/Logo.png" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter&display=swap" rel="stylesheet" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="Orçamento" />
        <meta name="theme-color" content="#1e293b" />
      </head>
      <body className="font-body antialiased">
        <FirebaseClientProvider>
          {children}
          <PWAInstallPrompt />
        </FirebaseClientProvider>
      </body>
    </html>
  );
}
