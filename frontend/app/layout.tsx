import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";
import { Providers } from "@/components/providers";
import { QueryProviders } from "@/config/QueryProviders";
import { ErrorBoundary } from "@/components/error-boundary";

const sora = localFont({
  src: [
    {
      path: "../node_modules/@fontsource/sora/files/sora-latin-300-normal.woff2",
      weight: "300",
      style: "normal",
    },
    {
      path: "../node_modules/@fontsource/sora/files/sora-latin-400-normal.woff2",
      weight: "400",
      style: "normal",
    },
    {
      path: "../node_modules/@fontsource/sora/files/sora-latin-500-normal.woff2",
      weight: "500",
      style: "normal",
    },
    {
      path: "../node_modules/@fontsource/sora/files/sora-latin-600-normal.woff2",
      weight: "600",
      style: "normal",
    },
    {
      path: "../node_modules/@fontsource/sora/files/sora-latin-700-normal.woff2",
      weight: "700",
      style: "normal",
    },
    {
      path: "../node_modules/@fontsource/sora/files/sora-latin-800-normal.woff2",
      weight: "800",
      style: "normal",
    },
  ],
  variable: "--font-sora",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Payyr Private",
  description: "Private payroll management built on Daml and Canton",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${sora.variable} antialiased bg-gray-50`}>
        <ErrorBoundary>
          <QueryProviders>
            <Providers>
              {children}
            </Providers>
          </QueryProviders>
        </ErrorBoundary>
      </body>
    </html>
  );
}
