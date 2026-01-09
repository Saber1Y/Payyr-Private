import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  serverExternalPackages: [
    '@reown/appkit',
    '@reown/appkit-controllers',
    '@reown/appkit-utils',
    '@walletconnect/logger',
    'pino',
    'thread-stream'
  ],
};

export default nextConfig;
