import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'CourseHub — Premium Course Library',
  description: 'A premium, searchable course catalogue and learning hub.',
  applicationName: 'CourseHub',
  manifest: '/manifest.webmanifest',
  themeColor: '#080b0e',
  viewport: 'width=device-width, initial-scale=1, viewport-fit=cover',
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
