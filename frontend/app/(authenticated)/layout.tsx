"use client";

export const dynamic = "force-dynamic";

import { Sidebar } from "@/components/sidebar";
import { Navbar } from "@/components/navbar";
import { usePrivy } from "@privy-io/react-auth";
import { useWalletConnection } from "@/hooks/useWalletConnection";

export default function AuthenticatedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { ready, authenticated, login } = usePrivy();
  const { hasWallet, connectExternalWallet } = useWalletConnection();

  if (!ready) {
    return (
      <div className="min-h-screen bg-[#114277] flex items-center justify-center">
        <div className="text-white">Loading...</div>
      </div>
    );
  }

  if (!authenticated) {
    return (
      <div className="min-h-screen bg-[#114277] flex items-center justify-center">
        <div className="text-white text-center">
          <h1 className="text-2xl font-bold mb-4">Authentication Required</h1>
          <p className="mb-6">Please connect your wallet to access this page</p>
          <button
            onClick={login}
            className="bg-white text-[#114277] px-6 py-3 rounded-lg font-semibold hover:bg-gray-100 transition-colors"
          >
            Connect Wallet
          </button>
        </div>
      </div>
    );
  }

  if (!hasWallet) {
    return (
      <div className="min-h-screen bg-[#114277] flex items-center justify-center">
        <div className="text-white text-center max-w-md px-6">
          <h1 className="text-2xl font-bold mb-4">Wallet Required</h1>
          <p className="mb-6">
            You are signed in, but no wallet is connected yet. Connect the
            employer, employee, or auditor wallet you want to use on the Daml
            ledger.
          </p>
          <button
            onClick={connectExternalWallet}
            className="bg-white text-[#114277] px-6 py-3 rounded-lg font-semibold hover:bg-gray-100 transition-colors"
          >
            Connect Wallet
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen">
      <Sidebar />
      <div className="flex flex-1 flex-col overflow-hidden">
        <Navbar />
        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-[#114277]">
          {children}
        </main>
      </div>
    </div>
  );
}
