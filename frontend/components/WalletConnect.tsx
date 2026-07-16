"use client";

import { useWalletConnection } from "@/hooks/useWalletConnection";
import { useState } from "react";

export function WalletConnect() {
  const {
    isReady,
    isAuthenticated,
    hasWallet,
    connectExternalWallet,
    disconnectWallet,
  } = useWalletConnection();

  const [isConnecting, setIsConnecting] = useState(false);

  if (!isReady) {
    return <div className="animate-pulse">Loading wallet...</div>;
  }

  if (isAuthenticated && hasWallet) {
    return (
      <div className="flex items-center gap-2 md:gap-4">
        {/* <div className="flex flex-col">
          <span className="text-sm text-gray-600">
            Connected {isEmbeddedWallet ? "Embedded" : "External"} Wallet
          </span>
          <span className="font-mono text-sm">
            {walletAddress?.slice(0, 6)}...{walletAddress?.slice(-4)}
          </span>
          {user?.email && (
            <span className="text-xs text-gray-500">{user.email.address}</span>
          )}
        </div> */}
        <button
          onClick={disconnectWallet}
          className="px-4 py-2 text-sm bg-red-500 text-white rounded-md hover:bg-red-600 transition-colors"
        >
          Disconnect
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col md:flex-row gap-2">
      <button
        onClick={async () => {
          setIsConnecting(true);
          try {
            await connectExternalWallet();
          } finally {
            setIsConnecting(false);
          }
        }}
        disabled={isConnecting}
        className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 disabled:opacity-50 transition-colors"
      >
        {isConnecting ? "Connecting..." : "Connect Wallet"}
      </button>
    </div>
  );
}
