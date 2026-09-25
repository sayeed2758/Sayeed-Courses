import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Admin Control Room — Sayeed Courses',
  robots: { index: false, follow: false, nocache: true },
};

export default function AdminLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return children;
}
