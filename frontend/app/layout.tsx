import type { Metadata } from "next";
import { Sora } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/providers";
import { WagmiProviders } from "@/config/WagmiProviders";

const sora = Sora({
  variable: "--font-sora",
  subsets: ["latin"],
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
        <WagmiProviders>
          <Providers>
            {children}
          </Providers>
        </WagmiProviders>
      </body>
    </html>
  );
}
