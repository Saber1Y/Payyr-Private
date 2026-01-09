import type { Metadata } from "next";
import { Sora } from "next/font/google";
import "./globals.css";
import { Sidebar } from "@/components/sidebar";
import { Navbar } from "@/components/navbar";
import { Providers } from "@/components/providers";
import { WagmiProviders } from "@/config/WagmiProviders";

const sora = Sora({
  variable: "--font-sora",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "USDC Payroll System - Arc Network",
  description: "Modern payroll management system built on Arc Network",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${sora.variable} antialiased bg-gray-50`}>
        <WagmiProviders>
          <Providers>
            {children}
          </Providers>
        </WagmiProviders>
      </body>
    </html>
  );
}
