"use client";

import { PrivyProvider } from "@privy-io/react-auth";

interface ProvidersProps {
  children: React.ReactNode;
}

export function Providers({ children }: ProvidersProps) {
  const privyAppId = process.env.NEXT_PUBLIC_PRIVY_APP_ID;

  return (
    privyAppId ? (
      <PrivyProvider
        appId={privyAppId}
        config={{
          appearance: {
            theme: "light",
            accentColor: "#0667D2",
          },
          embeddedWallets: {
            ethereum: {
              createOnLogin: "users-without-wallets",
            },
            solana: {
              createOnLogin: "off",
            },
          },
          loginMethods: ["wallet", "email"],
        }}
      >
        {children}
      </PrivyProvider>
    ) : (
      <div className="flex min-h-screen items-center justify-center bg-[#114277] p-6 text-white">
        <div className="max-w-md text-center">
          <h1 className="text-2xl font-semibold">Privy setup required</h1>
          <p className="mt-3 text-sm text-blue-100">
            Set <code>NEXT_PUBLIC_PRIVY_APP_ID</code> to enable authentication
            and load the Daml payroll workspace.
          </p>
        </div>
      </div>
    )
  );
}
