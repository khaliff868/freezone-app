import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { Providers } from '@/components/providers';
import { Navbar } from '@/components/shared/navbar';
import QuickPostFAB from '@/components/shared/quick-post-fab';
import { Toaster } from 'sonner';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Freezone Swap or Sell',
  description: 'Trinidad & Tobago Marketplace for Swapping and Selling',
  metadataBase: new URL('https://freezone-app-alpha.vercel.app'),
  openGraph: {
    title: 'Freezone Swap or Sell',
    description: 'Trinidad & Tobago Marketplace for Swapping and Selling',
    url: 'https://freezone-app-alpha.vercel.app',
    siteName: 'Freezone Swap or Sell',
    images: [{ url: '/og-image.png', width: 1200, height: 630, alt: 'Freezone Swap or Sell - Trinidad & Tobago Marketplace' }],
    locale: 'en_TT',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Freezone Swap or Sell',
    description: 'Trinidad & Tobago Marketplace for Swapping and Selling',
    images: ['/og-image.png'],
  },
  icons: {
    icon: '/favicon.ico',
    apple: '/apple-touch-icon.png',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" style={{ colorScheme: 'light' }} suppressHydrationWarning>
      <head>
        {/* Runs synchronously before paint — prevents dark flash on mobile */}
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var t=localStorage.getItem('theme');if(t==='dark'){document.documentElement.classList.add('dark');document.documentElement.style.colorScheme='dark';}else{document.documentElement.classList.remove('dark');document.documentElement.style.colorScheme='light';document.documentElement.style.backgroundColor='#ffffff';}}catch(e){}})();`,
          }}
        />
      </head>
      <body
        className={`${inter.className} bg-white text-slate-900 dark:bg-slate-900 dark:text-white`}
        style={{ backgroundColor: '#ffffff' }}
      >
        <Providers>
          <Navbar />
          {children}
          <QuickPostFAB />
        </Providers>

        <Toaster richColors position="top-right" />
      </body>
    </html>
  );
}
