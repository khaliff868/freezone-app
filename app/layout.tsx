import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { Providers } from '@/components/providers';
import { Toaster } from 'sonner';
import { Navbar } from '@/components/shared/navbar';
import QuickPostFAB from '@/components/shared/quick-post-fab';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Freezone Swap or Sell - Trinidad & Tobago Marketplace',
  description: 'Buy, sell, and swap items in Trinidad & Tobago. The premier marketplace for locals.',
  icons: {
    icon: '/favicon.svg',
    shortcut: '/favicon.svg',
  },
  openGraph: {
    title: 'Freezone Swap or Sell',
    description: 'Trinidad & Tobago Marketplace for Swapping and Selling',
    images: ['/og-image.png'],
  },
};

export const dynamic = 'force-dynamic';

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <head>
        <script src="https://apps.abacus.ai/chatllm/appllm-lib.js"></script>
      </head>
      <body className={inter.className} suppressHydrationWarning>
        <Providers>
          <div className="min-h-screen w-full">
            <Navbar />
            <main className="min-w-0">{children}</main>
          </div>
          <QuickPostFAB />
          <Toaster position="top-right" richColors />
        </Providers>
      </body>
    </html>
  );
}
