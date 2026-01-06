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
  turbopack: {
    root: __dirname,
  },
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
        crypto: false,
        stream: false,
        url: false,
        zlib: false,
        http: false,
        https: false,
        assert: false,
        os: false,
        path: false
      };
    }
    
    config.externals = config.externals || [];
    config.externals.push({
      'pino': 'pino',
      'thread-stream': 'thread-stream'
    });
    
    return config;
  }
};

export default nextConfig;
