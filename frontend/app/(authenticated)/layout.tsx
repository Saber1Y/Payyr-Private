"use client";

export const dynamic = "force-dynamic";

import { Sidebar } from "@/components/sidebar";
import { Navbar } from "@/components/navbar";
import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";
import { usePrivy } from "@privy-io/react-auth";

export default function AuthenticatedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const { ready, authenticated } = usePrivy();

  useEffect(() => {
    if (ready && !authenticated && pathname !== "/") {
      router.push("/");
    }
  }, [ready, authenticated, pathname, router]);

  if (!ready) {
    return (
      <div className="min-h-screen bg-[#114277] flex items-center justify-center">
        <div className="text-white">Loading...</div>
      </div>
    );
  }

  if (!authenticated) {
    return null;
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
