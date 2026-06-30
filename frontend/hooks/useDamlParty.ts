"use client";

import { useWalletConnection } from "@/hooks/useWalletConnection";
import { resolveDamlParty } from "@/lib/daml/partyMapper";
import { resolveDamlRole } from "@/lib/daml/roleMapper";

export function useDamlParty() {
  const { walletAddress } = useWalletConnection();
  const resolvedParty = resolveDamlParty(walletAddress);
  const walletRole = resolveDamlRole(walletAddress);
  const hasMappedParty = Boolean(resolvedParty) && resolvedParty.includes("::");

  return {
    walletAddress,
    damlParty: hasMappedParty ? resolvedParty : "",
    resolvedParty,
    walletRole,
    hasMappedParty,
  };
}
