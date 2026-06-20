const configuredPartyMap = process.env.NEXT_PUBLIC_DAML_PARTY_MAP;

function parsePartyMap(): Record<string, string> {
  if (!configuredPartyMap) {
    return {};
  }

  try {
    const firstPass = JSON.parse(configuredPartyMap) as
      | Record<string, string>
      | string;
    const parsed =
      typeof firstPass === "string"
        ? (JSON.parse(firstPass) as Record<string, string>)
        : firstPass;

    return Object.fromEntries(
      Object.entries(parsed).map(([walletAddress, partyId]) => [
        walletAddress.toLowerCase(),
        partyId,
      ]),
    );
  } catch (error) {
    console.warn("Failed to parse NEXT_PUBLIC_DAML_PARTY_MAP", error);
    return {};
  }
}

const partyMap = parsePartyMap();

export function resolveDamlParty(value?: string): string {
  if (!value) {
    return "";
  }

  return partyMap[value.toLowerCase()] || value;
}
