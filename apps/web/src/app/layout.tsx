import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { Toaster } from 'sonner';
import { QueryProvider } from '@/providers/QueryProvider';
import { ThemeProvider } from '@/providers/ThemeProvider';
import { TooltipProvider } from '@/components/ui/tooltip';
import './globals.css';

const inter = Inter({ subsets: ['latin'], variable: '--font-sans' });

export const metadata: Metadata = {
  title: {
    template: '%s | TodoApp',
    default: 'TodoApp',
  },
  description: 'A production-grade todo application',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="h-full" suppressHydrationWarning>
      <body className={`${inter.variable} font-sans h-full antialiased`}>
        <ThemeProvider>
          <QueryProvider>
            <TooltipProvider delayDuration={300}>
              {children}
            </TooltipProvider>
            <Toaster position="top-right" richColors closeButton expand />
          </QueryProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
