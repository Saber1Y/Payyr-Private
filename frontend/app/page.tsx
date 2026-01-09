"use client";

export const dynamic = "force-dynamic";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { usePrivy } from "@privy-io/react-auth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Wallet,
  Users,
  ShieldCheck,
  TrendingUp,
  Zap,
  Lock,
  ArrowRight,
  CheckCircle,
} from "lucide-react";

export default function Home() {
  const router = useRouter();
  const { ready, authenticated, login } = usePrivy();
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (ready && authenticated) {
      router.push("/dashboard");
    }
  }, [ready, authenticated, router]);

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
      <div className="min-h-screen bg-[#114277] flex items-center justify-center">
        <div className="text-white animate-spin" />
      </div>
    );
  }

  if (authenticated) return null;

  return (
    <div className="min-h-screen bg-[#114277]">
      <div className="container mx-auto px-4 py-8 md:py-16">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12 md:mb-16">
            <h1 className="text-4xl md:text-6xl font-bold text-white mb-4">
              USDC Payroll on Arc Network
            </h1>
            <p className="text-lg md:text-xl text-gray-300 mb-6">
              Secure, automated payroll management for your team
            </p>
            <Button
              size="lg"
              className="bg-white text-[#114277] hover:bg-gray-100 gap-2"
              onClick={handleLogin}
              disabled={isLoading}
            >
              {isLoading ? "Connecting..." : "Get Started"}
              <ArrowRight className="h-4 w-4" />
            </Button>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
            <Card>
              <CardHeader>
                <Wallet className="h-8 w-8 text-blue-600 mb-2" />
                <CardTitle>Multi-Tenant</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">
                  Unlimited companies share the same smart contracts with
                  isolated operations
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <ShieldCheck className="h-8 w-8 text-green-600 mb-2" />
                <CardTitle>Secure</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">
                  Role-based access control with isolated employer balances
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <Zap className="h-8 w-8 text-yellow-600 mb-2" />
                <CardTitle>Fast & Cheap</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">
                  ~$0.08 to register, $0.24 per employee payment
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <Users className="h-8 w-8 text-purple-600 mb-2" />
                <CardTitle>Employee Mgmt</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">
                  Add, edit, and manage employee profiles with wallet addresses
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <TrendingUp className="h-8 w-8 text-indigo-600 mb-2" />
                <CardTitle>Analytics</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">
                  Real-time dashboard with payroll metrics and balances
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <Lock className="h-8 w-8 text-red-600 mb-2" />
                <CardTitle>Audited Code</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">
                  Clean, well-documented Solidity contracts with security best
                  practices
                </p>
              </CardContent>
            </Card>
          </div>

          <div className="grid md:grid-cols-2 gap-8 mb-12">
            <Card>
              <CardHeader>
                <CardTitle>How It Works</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex gap-3">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold">
                    1
                  </div>
                  <div>
                    <h4 className="font-semibold mb-1 text-black">
                      Connect Wallet
                    </h4>
                    <p className="text-sm text-gray-600">
                      Your wallet address is your identity
                    </p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-green-100 flex items-center justify-center text-green-600 font-bold">
                    2
                  </div>
                  <div>
                    <h4 className="font-semibold mb-1 text-black">
                      Register as Employer
                    </h4>
                    <p className="text-sm text-gray-600">
                      Self-service registration
                    </p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center text-purple-600 font-bold">
                    3
                  </div>
                  <div>
                    <h4 className="font-semibold mb-1 text-black">
                      Add Employees
                    </h4>
                    <p className="text-sm text-gray-600">
                      Enter name, wallet address, salary, role
                    </p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-yellow-100 flex items-center justify-center text-yellow-600 font-bold">
                    4
                  </div>
                  <div>
                    <h4 className="font-semibold mb-1 text-black">
                      Deposit USDC
                    </h4>
                    <p className="text-sm text-gray-600">
                      Fund your payroll balance
                    </p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-red-100 flex items-center justify-center text-red-600 font-bold">
                    5
                  </div>
                  <div>
                    <h4 className="font-semibold mb-1 text-black">
                      Execute Payroll
                    </h4>
                    <p className="text-sm text-gray-600">
                      Instant USDC transfers to employee wallets
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Smart Contracts</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h4 className="font-semibold text-sm text-gray-700 mb-1">
                    EmployeeRegistry
                  </h4>
                  <p className="text-xs text-gray-500 mb-1">
                    0x20B3dB45a351E92673112064A3F01951115eD6B7
                  </p>
                  <p className="text-sm text-gray-600">
                    Manages employee records, employer registration, and
                    employer-employee relationships
                  </p>
                </div>
                <div>
                  <h4 className="font-semibold text-sm text-gray-700 mb-1">
                    PayrollManager
                  </h4>
                  <p className="text-xs text-gray-500 mb-1">
                    0x1739715A3452BF1e336305cf8f9542d177cEa03A
                  </p>
                  <p className="text-sm text-gray-600">
                    Manages USDC deposits, executes payroll, tracks employer
                    balances, and payroll history
                  </p>
                </div>
                <div className="pt-4 border-t">
                  <h4 className="font-semibold text-sm text-gray-700 mb-2">
                    Tech Stack
                  </h4>
                  <div className="grid grid-cols-2 gap-2 text-xs text-gray-600">
                    <div className="flex items-center gap-1">
                      <CheckCircle className="h-3 w-3 text-green-600" />
                      Next.js 16
                    </div>
                    <div className="flex items-center gap-1">
                      <CheckCircle className="h-3 w-3 text-green-600" />
                      Solidity
                    </div>
                    <div className="flex items-center gap-1">
                      <CheckCircle className="h-3 w-3 text-green-600" />
                      TailwindCSS
                    </div>
                    <div className="flex items-center gap-1">
                      <CheckCircle className="h-3 w-3 text-green-600" />
                      Foundry
                    </div>
                    <div className="flex items-center gap-1">
                      <CheckCircle className="h-3 w-3 text-green-600" />
                      Privy
                    </div>
                    <div className="flex items-center gap-1">
                      <CheckCircle className="h-3 w-3 text-green-600" />
                      Wagmi & Viem
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card className="bg-gradient-to-r from-blue-50 to-purple-50 border-blue-200">
            <CardContent className="pt-6">
              <div className="text-center">
                <h3 className="text-xl font-bold text-gray-900 mb-2">
                  Ready to streamline your payroll?
                </h3>
                <p className="text-gray-600 mb-4">
                  Join companies using Payyr on Arc Network
                </p>
                <Button
                  size="lg"
                  className="bg-[#114277] hover:bg-[#0d335e] gap-2"
                  onClick={handleLogin}
                  disabled={isLoading}
                >
                  {isLoading ? "Connecting..." : "Connect your wallet now!!"}
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
