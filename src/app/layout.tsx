import type { Metadata } from 'next';
import './styles.css';
import { AppShell } from './app-shell/AppShell';

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || 'https://orqestraofficial.vercel.app'),
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
    url: 'https://orqestraofficial.vercel.app/',
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
    <html lang="en" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var t=localStorage.getItem('theme');var isDark=t==='dark'||(!t)||((t==='system')&&window.matchMedia('(prefers-color-scheme: dark)').matches);if(isDark){document.documentElement.classList.add('dark');document.documentElement.style.colorScheme='dark';}else{document.documentElement.classList.remove('dark');document.documentElement.style.colorScheme='light';}}catch(e){}})();`,
          }}
        />
      </head>
      <body className="min-h-screen antialiased selection:bg-[#3b6fe0] selection:text-white dark:selection:bg-[#7aa2f7] dark:selection:text-[#111112]">
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}
