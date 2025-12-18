import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { Toaster } from 'react-hot-toast';
import { LoadingProvider } from '@/context/LoadingContext';
import GlobalLoadingIndicator from '@/components/GlobalLoadingIndicator';
import { Suspense } from 'react';
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Twilight Bus",
  description: "Twilight Bus - Professional Driver Payments System",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={inter.className}
        suppressHydrationWarning
        style={{
          minHeight: '100vh',
          background: 'linear-gradient(135deg, #0f2027 0%, #203a43 70%, #f9d423 100%)', // deep blue to gold
          color: '#fff',
        }}
      >
        <LoadingProvider>
          <Suspense fallback={null}>
            <GlobalLoadingIndicator />
          </Suspense>
          <Toaster position="top-center" reverseOrder={false} />
          {children}
        </LoadingProvider>
      </body>
    </html>
  );
}
