import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { Providers } from '@/components/Providers';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });

export const metadata: Metadata = {
  title: 'Mitsubishi Electric – AI Automotive Parts Return Inspection System',
  description: 'Official Quality Inspection & Automotive Components Division internal digital platform for parts inspection and analysis.',
  keywords: ['Mitsubishi Electric', 'automotive inspection', 'AI quality assurance', 'defect detection'],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={inter.variable}>
      <body>
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}
