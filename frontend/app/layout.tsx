import type { Metadata } from "next";
import "./globals.css";
import { Providers } from "@/components/providers";
import { QueryProviders } from "@/config/WagmiProviders";

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
      <body className="antialiased bg-gray-50">
        <QueryProviders>
          <Providers>
            {children}
          </Providers>
        </QueryProviders>
      </body>
    </html>
  );
}
