import type { Metadata } from 'next';
import './styles.css';
import { AppShell } from './app-shell/AppShell';

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || 'https://orqestra.app'),
  title: 'Orqestra — Intelligent Academic Timetable Generator & Constraint Solver',
  description:
    'Orqestra is a high-performance browser-based academic timetable generator for institutions and colleges. Automatically generate conflict-free schedules, optimize faculty workloads, and export official timetables to PDF and Excel.',
  keywords: [
    'timetable generator',
    'academic scheduling',
    'college timetable software',
    'automated timetable generator',
    'conflict-free timetable',
    'faculty workload scheduler',
  ],
  icons: {
    icon: '/favicon.svg',
  },
  openGraph: {
    title: 'Orqestra — Intelligent Academic Timetable Generator & Constraint Solver',
    description:
      'Build conflict-free institutional timetables with automated constraint-solving intelligence. Fully offline & private in your browser.',
    url: 'https://orqestra.app/',
    siteName: 'Orqestra',
    images: [{ url: '/favicon.svg' }],
    type: 'website',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-[#F7F8F5] text-[#111315] font-sans antialiased selection:bg-[#0047FF] selection:text-white">
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}
