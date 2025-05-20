
import type { Metadata } from 'next';
import { Open_Sans } from 'next/font/google'; // Changed from Geist to Open Sans
import './globals.css';
import { AuthProvider } from '@/contexts/AuthContext';
import { Toaster } from '@/components/ui/toaster';

const openSans = Open_Sans({ // Changed font
  subsets: ['latin'],
  variable: '--font-open-sans', // Changed variable name
});

export const metadata: Metadata = {
  title: 'Admin simcon', // Updated app name
  description: 'Gérez vos données facilement avec Admin simcon.', // Updated description
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr">
      <body className={`${openSans.variable} font-sans antialiased`}>
        <AuthProvider>
          {children}
          <Toaster />
        </AuthProvider>
      </body>
    </html>
  );
}

    