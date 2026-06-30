export type DamlRole = "employer" | "employee" | "auditor";

const configuredRoleWallets = {
  employer: process.env.NEXT_PUBLIC_DAML_EMPLOYER_WALLET?.toLowerCase() ?? "",
  employee: process.env.NEXT_PUBLIC_DAML_EMPLOYEE_WALLET?.toLowerCase() ?? "",
  auditor: process.env.NEXT_PUBLIC_DAML_AUDITOR_WALLET?.toLowerCase() ?? "",
} as const;

export function resolveDamlRole(walletAddress?: string): DamlRole | null {
  if (!walletAddress) {
    return null;
  }

  const normalizedWallet = walletAddress.toLowerCase();

  if (normalizedWallet === configuredRoleWallets.employer) {
    return "employer";
  }

  if (normalizedWallet === configuredRoleWallets.employee) {
    return "employee";
  }

  if (normalizedWallet === configuredRoleWallets.auditor) {
    return "auditor";
  }

  return null;
}
