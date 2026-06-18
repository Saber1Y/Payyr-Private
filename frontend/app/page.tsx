"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { usePrivy } from "@privy-io/react-auth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  ArrowRight,
  CheckCircle,
  Lock,
  ShieldCheck,
  TrendingUp,
  Users,
  Wallet,
  Zap,
} from "lucide-react";

export default function Home() {
  const router = useRouter();
  const pathname = usePathname();
  const { ready, authenticated, login } = usePrivy();
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (ready && authenticated && pathname === "/") {
      router.push("/dashboard");
    }
  }, [ready, authenticated, pathname, router]);

  const handleLogin = async () => {
    setIsLoading(true);
    try {
      await login();
    } catch (error) {
      console.error("Login failed:", error);
    } finally {
      setIsLoading(false);
    }
  };

  if (!ready) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#114277]">
        <div className="animate-spin text-white" />
      </div>
    );
  }

  if (authenticated) {
    return null;
  }

  return (
    <div className="min-h-screen bg-[#114277]">
      <div className="container mx-auto px-4 py-8 md:py-16">
        <div className="mx-auto max-w-6xl">
          <div className="mb-12 text-center md:mb-16">
            <h1 className="mb-4 text-4xl font-bold text-white md:text-6xl">
              Private Payroll on Daml
            </h1>
            <p className="mb-6 text-lg text-gray-300 md:text-xl">
              Run confidential payroll workflows with party-based privacy,
              employee payment contracts, and audit-ready controls.
            </p>
            <Button
              size="lg"
              className="gap-2 bg-white text-[#114277] hover:bg-gray-100"
              onClick={handleLogin}
              disabled={isLoading}
            >
              {isLoading ? "Connecting..." : "Get Started"}
              <ArrowRight className="h-4 w-4" />
            </Button>
          </div>

          <div className="mb-12 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            <Card>
              <CardHeader>
                <Wallet className="mb-2 h-8 w-8 text-blue-600" />
                <CardTitle>Multi-Party Design</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">
                  Employers, employees, and auditors each see only the ledger
                  contracts relevant to them.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <ShieldCheck className="mb-2 h-8 w-8 text-green-600" />
                <CardTitle>Private by Default</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">
                  Salary records and payment details remain scoped to authorized
                  Daml parties instead of a public chain.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <Zap className="mb-2 h-8 w-8 text-yellow-600" />
                <CardTitle>Single Workflow Runs</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">
                  One payroll action creates the payroll run and the employee
                  payment contracts together.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <Users className="mb-2 h-8 w-8 text-purple-600" />
                <CardTitle>Employee Management</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">
                  Add, edit, activate, and deactivate employee contracts from a
                  single employer workspace.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <TrendingUp className="mb-2 h-8 w-8 text-indigo-600" />
                <CardTitle>Ledger Visibility</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">
                  Track payroll runs, totals, and payment history directly from
                  the Daml JSON API.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <Lock className="mb-2 h-8 w-8 text-red-600" />
                <CardTitle>Audit Controls</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">
                  Grant auditor access per payroll run without exposing employee
                  compensation broadly.
                </p>
              </CardContent>
            </Card>
          </div>

          <div className="mb-12 grid gap-8 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>How It Works</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex gap-3">
                  <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-blue-100 font-bold text-blue-600">
                    1
                  </div>
                  <div>
                    <h4 className="mb-1 font-semibold text-black">
                      Connect and Identify
                    </h4>
                    <p className="text-sm text-gray-600">
                      Sign in and map your workspace identity to a Daml party.
                    </p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-green-100 font-bold text-green-600">
                    2
                  </div>
                  <div>
                    <h4 className="mb-1 font-semibold text-black">
                      Create Employer Workspace
                    </h4>
                    <p className="text-sm text-gray-600">
                      Initialize the employer contract used to manage employees.
                    </p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-purple-100 font-bold text-purple-600">
                    3
                  </div>
                  <div>
                    <h4 className="mb-1 font-semibold text-black">
                      Add Employee Contracts
                    </h4>
                    <p className="text-sm text-gray-600">
                      Record employee party, role, salary, and start date.
                    </p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-yellow-100 font-bold text-yellow-600">
                    4
                  </div>
                  <div>
                    <h4 className="mb-1 font-semibold text-black">
                      Run Payroll
                    </h4>
                    <p className="text-sm text-gray-600">
                      Create a payroll run and payment contracts for all active
                      employees.
                    </p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-red-100 font-bold text-red-600">
                    5
                  </div>
                  <div>
                    <h4 className="mb-1 font-semibold text-black">
                      Claim and Audit
                    </h4>
                    <p className="text-sm text-gray-600">
                      Employees claim payments while auditors get scoped access
                      only when needed.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Platform Overview</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h4 className="mb-1 text-sm font-semibold text-gray-700">
                    Employer Workspace
                  </h4>
                  <p className="text-sm text-gray-600">
                    Maintains employee contracts, payroll runs, and access
                    controls for a single employer party.
                  </p>
                </div>
                <div>
                  <h4 className="mb-1 text-sm font-semibold text-gray-700">
                    Payroll Flow
                  </h4>
                  <p className="text-sm text-gray-600">
                    Uses the Daml `PayrollManager` template to create payroll
                    runs and employee payment records in one ledger flow.
                  </p>
                </div>
                <div className="border-t pt-4">
                  <h4 className="mb-2 text-sm font-semibold text-gray-700">
                    Tech Stack
                  </h4>
                  <div className="grid grid-cols-2 gap-2 text-xs text-gray-600">
                    <div className="flex items-center gap-1">
                      <CheckCircle className="h-3 w-3 text-green-600" />
                      Next.js 16
                    </div>
                    <div className="flex items-center gap-1">
                      <CheckCircle className="h-3 w-3 text-green-600" />
                      Daml
                    </div>
                    <div className="flex items-center gap-1">
                      <CheckCircle className="h-3 w-3 text-green-600" />
                      Tailwind CSS
                    </div>
                    <div className="flex items-center gap-1">
                      <CheckCircle className="h-3 w-3 text-green-600" />
                      Canton
                    </div>
                    <div className="flex items-center gap-1">
                      <CheckCircle className="h-3 w-3 text-green-600" />
                      Privy
                    </div>
                    <div className="flex items-center gap-1">
                      <CheckCircle className="h-3 w-3 text-green-600" />
                      React Query
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card className="border-blue-200 bg-gradient-to-r from-blue-50 to-purple-50">
            <CardContent className="pt-6">
              <div className="text-center">
                <h3 className="mb-2 text-xl font-bold text-gray-900">
                  Ready to launch a private payroll workspace?
                </h3>
                <p className="mb-4 text-gray-600">
                  Set up your employer party, onboard employees, and start
                  running confidential payroll flows.
                </p>
                <Button
                  size="lg"
                  className="gap-2 bg-[#114277] hover:bg-[#0d335e]"
                  onClick={handleLogin}
                  disabled={isLoading}
                >
                  {isLoading ? "Connecting..." : "Open Payyr Private"}
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
