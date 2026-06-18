"use client";

import { useWalletConnection } from "@/hooks/useWalletConnection";
import { resolveDamlParty } from "@/lib/daml/partyMapper";

export function useDamlParty() {
  const { walletAddress } = useWalletConnection();
  const resolvedParty = resolveDamlParty(walletAddress);
  const hasMappedParty = Boolean(resolvedParty) && resolvedParty.includes("::");

  return {
    walletAddress,
    damlParty: hasMappedParty ? resolvedParty : "",
    resolvedParty,
    hasMappedParty,
  };
}
