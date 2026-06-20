"use client";

import { usePrivy, useWallets } from "@privy-io/react-auth";
import { useCallback } from "react";
import { resolveDamlParty } from "@/lib/daml/partyMapper";

export function useWalletConnection() {
  const {
    ready,
    authenticated,
    user,
    login,
    logout,
    connectWallet,
    createWallet,
  } = usePrivy();

  const { wallets } = useWallets();

  const connectExternalWallet = useCallback(async () => {
    if (!authenticated) {
      await login();
    } else {
      await connectWallet();
    }
  }, [authenticated, login, connectWallet]);

  const createEmbeddedWallet = useCallback(async () => {
    if (!authenticated) {
      await login();
    } else {
      await createWallet();
    }
  }, [authenticated, login, createWallet]);

  const disconnectWallet = useCallback(async () => {
    await logout();
  }, [logout]);

  const primaryWallet =
    wallets.find((wallet) => resolveDamlParty(wallet.address).includes("::")) ??
    wallets.find((wallet) => wallet.walletClientType !== "privy") ??
    wallets[0];
  const walletAddress = primaryWallet?.address;
  const hasMappedWallet = Boolean(walletAddress)
    && resolveDamlParty(walletAddress).includes("::");

  return {
    // State
    isReady: ready,
    isAuthenticated: authenticated,
    user,
    wallets,
    primaryWallet,
    walletAddress,

    login,
    logout,
    connectExternalWallet,
    createEmbeddedWallet,
    disconnectWallet,

    hasWallet: wallets.length > 0,
    hasMappedWallet,
    isEmbeddedWallet: primaryWallet?.walletClientType === "privy",
  };
}
