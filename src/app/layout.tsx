import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { ErrorProvider } from "@/contexts/ErrorContext";
import { ToastProvider } from "@/components/ToastNotification";
import { ErrorBoundary } from "@/components/ErrorBoundary";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "NovaTask - Professional Todo Management",
  description: "A futuristic, professional todo list application built with Next.js and TypeScript",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ErrorProvider>
      <ToastProvider>
        <ErrorBoundary
          logErrors={true}
          enableRetry={true}
          maxRetries={3}
          showErrorDetails={process.env.NODE_ENV === 'development'}
        >
          <html lang="en">
            <body
              className={`${geistSans.variable} ${geistMono.variable} antialiased`}
            >
              <div className="min-h-screen">
                {children}
              </div>
            </body>
          </html>
        </ErrorBoundary>
      </ToastProvider>
    </ErrorProvider>
  );
}
