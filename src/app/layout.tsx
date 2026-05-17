import type { Metadata, Viewport } from 'next';
import './globals.css';
import { ScoutProvider } from '@/context/ScoutContext';
import AppShell from '@/components/AppShell';

export const metadata: Metadata = {
  title: 'Mi Scout — Softball Pitch Tracker',
  description: 'Aplicación de scouting y tracking de lanzamientos para softball. Análisis por bateador con heat map y reportes.',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'Mi Scout',
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: '#0D0F14',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      </head>
      <body>
        <ScoutProvider>
          <AppShell>{children}</AppShell>
        </ScoutProvider>
      </body>
    </html>
  );
}
