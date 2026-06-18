"use client";

export const dynamic = "force-dynamic";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  DollarSign,
  Users,
  Calendar,
  TrendingUp,
  ArrowUpRight,
  ShieldCheck,
  UserPlus,
  Wallet,
  Lock,
} from "lucide-react";
import { useReadContract, useAccount } from "wagmi";
import formatBalance, { formatPayroll } from "@/utils/utils";
import type { PayrollRun } from "@/types/contracts";
import PayrollContractABi from "../../../lib/abi/PayrollManager.json";
import EmployeeRegistryABI from "../../../lib/abi/EmployeeRegistry.json";
import { useRouter } from "next/navigation";

const PAYROLL_REGISTRY_ADDRESS =
  "0x1739715A3452BF1e336305cf8f9542d177cEa03A" as const;
const EMPLOYEE_REGISTRY_ADDRESS =
  "0x20B3dB45a351E92673112064A3F01951115eD6B7" as const;

export default function DashboardPage() {
  const router = useRouter();
  const { address } = useAccount();
  // Get total contract balance (admin view)
  const { data: totalContractBalance } = useReadContract({
    address: PAYROLL_REGISTRY_ADDRESS,
    abi: PayrollContractABi.abi,
    functionName: "getTotalBalance",
  });

  // Get current payroll ID
  const { data: currentPayrollId } = useReadContract({
    address: PAYROLL_REGISTRY_ADDRESS,
    abi: PayrollContractABi.abi,
    functionName: "currentPayrollId",
  });

  // Get total payroll runs
  const { data: totalPayrollRuns } = useReadContract({
    address: PAYROLL_REGISTRY_ADDRESS,
    abi: PayrollContractABi.abi,
    functionName: "totalPayrollRuns",
  });

  // Get the last 3 payroll runs
  const { data: payroll1 } = useReadContract({
    address: PAYROLL_REGISTRY_ADDRESS,
    abi: PayrollContractABi.abi,
    functionName: "payrollRuns",
    args: [currentPayrollId as bigint],
    query: {
      enabled: !!currentPayrollId && Number(currentPayrollId) > 0,
    },
  });

  const { data: payroll2 } = useReadContract({
    address: PAYROLL_REGISTRY_ADDRESS,
    abi: PayrollContractABi.abi,
    functionName: "payrollRuns",
    args: [
      currentPayrollId && typeof currentPayrollId === "string"
        ? BigInt(currentPayrollId) - BigInt(1)
        : BigInt(0),
    ],
    query: {
      enabled: !!currentPayrollId && Number(currentPayrollId) > 1,
    },
  });

  const { data: payroll3 } = useReadContract({
    address: PAYROLL_REGISTRY_ADDRESS,
    abi: PayrollContractABi.abi,
    functionName: "payrollRuns",
    args: [
      currentPayrollId && typeof currentPayrollId === "string"
        ? BigInt(currentPayrollId) - BigInt(2)
        : BigInt(0),
    ],
    query: {
      enabled: !!currentPayrollId && Number(currentPayrollId) > 2,
    },
  });

  // Check if user is registered as employer
  const { data: isEmployer } = useReadContract({
    address: EMPLOYEE_REGISTRY_ADDRESS,
    abi: EmployeeRegistryABI.abi,
    functionName: "isEmployer",
    args: [address as `0x${string}`],
    query: {
      enabled: !!address,
    },
  });

  // Get employer's employee count
  const { data: employerEmployees } = useReadContract({
    address: EMPLOYEE_REGISTRY_ADDRESS,
    abi: EmployeeRegistryABI.abi,
    functionName: "getEmployerEmployees",
    args: [address as `0x${string}`],
    query: {
      enabled: !!address && isEmployer === true,
    },
  });

  // Get employer's balance
  const { data: employerBalance } = useReadContract({
    address: PAYROLL_REGISTRY_ADDRESS,
    abi: PayrollContractABi.abi,
    functionName: "getMyBalance",
    query: {
      enabled: !!address && isEmployer === true,
    },
  });

  const { data: totalContractBalances } = useReadContract({
    address: PAYROLL_REGISTRY_ADDRESS,
    abi: PayrollContractABi.abi,
    functionName: "getTotalBalance",
  });

  const displayBalance: bigint = (totalContractBalances ??
    employerBalance ??
    0n) as bigint;

  const formattedDisplayBalance = formatBalance(displayBalance);

  const recentPayrolls = [
    formatPayroll(payroll1 as PayrollRun | null),
    formatPayroll(payroll2 as PayrollRun | null),
    formatPayroll(payroll3 as PayrollRun | null),
  ].filter(Boolean);

  const lastPayroll = recentPayrolls[0];

  return (
    <div className="p-4 md:p-8 bg-[#114277] min-h-screen">
      <div className="mb-6 md:mb-8">
        <h1 className="text-2xl md:text-3xl font-bold text-white">Dashboard</h1>
        <p className="text-gray-300 mt-2 text-sm md:text-base">
          Overview of your payroll system on Arc Network
        </p>
      </div>

      {/* Getting Started Card - Show if not registered as employer */}
      {address && isEmployer === false && (
        <Card className="bg-gradient-to-r from-blue-50 to-purple-50 border-blue-200 gap-2">
          <CardContent className="pt-6">
            <div className="flex flex-col md:flex-row items-center gap-4">
              <div className="flex-shrink-0">
                <div className="h-16 w-16 rounded-full bg-blue-100 flex items-center justify-center">
                  <ShieldCheck className="h-8 w-8 text-blue-600" />
                </div>
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Get Started as an Employer
                </h3>
                <p className="text-sm text-gray-600 mb-4">
                  Register as an employer to start managing payroll for your
                  team. It only takes one transaction and costs ~$0.08.
                </p>
                <div className="flex flex-wrap gap-2">
                  <Button
                    onClick={() => router.push("/employees")}
                    className="gap-2 bg-blue-600 hover:bg-blue-700"
                  >
                    <ShieldCheck className="h-4 w-4" />
                    Register as Employer
                  </Button>
                  <Button
                    onClick={() => router.push("/employees")}
                    variant="outline"
                    className="gap-2 text-black"
                  >
                    <UserPlus className="h-4 w-4" />
                    Manage Employees
                  </Button>
                  <Button
                    onClick={() => router.push("/payroll")}
                    variant="outline"
                    className="gap-2 text-black"
                  >
                    <Wallet className="h-4 w-4" />
                    Fund Payroll
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Stats Cards - Show employer-specific stats if registered */}
      {isEmployer === true ? (
        <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 mb-6 md:mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">
                Your Balance
              </CardTitle>
              <DollarSign className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-900">
                $
                {formattedDisplayBalance.toLocaleString(undefined, {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </div>
              <p className="text-xs text-gray-500 mt-1">
                {address === "0x11f7eaC93C9DD552DFD657BE52007A25E200f356"
                  ? "Total in contract"
                  : "Available for payroll"}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-xs md:text-sm font-medium text-gray-600">
                Your Employees
              </CardTitle>
              <Users className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-xl md:text-2xl font-bold text-gray-900">
                {Array.isArray(employerEmployees)
                  ? employerEmployees.length
                  : 0}
              </div>
              <p className="text-xs text-gray-500 mt-1">Active team members</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-xs md:text-sm font-medium text-gray-600">
                Total Payroll Runs
              </CardTitle>
              <Users className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-xl md:text-2xl font-bold text-gray-900">
                {totalPayrollRuns?.toString() ?? "0"}
              </div>
              <p className="text-xs text-gray-500 mt-1">All time executions</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-xs md:text-sm font-medium text-gray-600">
                Last Payroll Amount
              </CardTitle>
              <TrendingUp className="h-4 w-4 text-indigo-600" />
            </CardHeader>
            <CardContent>
              <div className="text-xl md:text-2xl font-bold text-gray-900">
                $
                {lastPayroll
                  ? lastPayroll.amount.toLocaleString("en-US", {
                      minimumFractionDigits: 2,
                    })
                  : "0.00"}
              </div>
              <p className="text-xs text-gray-500 mt-1">
                {lastPayroll?.employees ?? 0} employees paid
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-xs md:text-sm font-medium text-gray-600">
                Last Payroll Date
              </CardTitle>
              <Calendar className="h-4 w-4 text-purple-600" />
            </CardHeader>
            <CardContent>
              <div className="text-xl md:text-2xl font-bold text-gray-900">
                {lastPayroll
                  ? lastPayroll.date.toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                    })
                  : "N/A"}
              </div>
              <p className="text-xs text-gray-500 mt-1">
                {lastPayroll
                  ? lastPayroll.date.toLocaleDateString("en-US", {
                      year: "numeric",
                    })
                  : "No payrolls yet"}
              </p>
            </CardContent>
          </Card>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6 mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg text-black font-semibold">
                Recent Payroll Runs
              </CardTitle>
            </CardHeader>
            <CardContent>
              {recentPayrolls.length === 0 ? (
                <div className="text-center py-4 text-gray-500">
                  No payroll runs yet
                </div>
              ) : (
                <div className="space-y-4">
                  {recentPayrolls.map((payroll, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between py-2 border-b last:border-0"
                    >
                      <div className="flex items-center gap-3">
                        <ArrowUpRight className="h-4 w-4 text-red-600" />
                        <div>
                          <p className="font-medium text-gray-900">
                            Monthly Payroll
                          </p>
                          <p className="text-sm text-gray-500">
                            {payroll?.date.toLocaleDateString("en-US", {
                              month: "short",
                              day: "numeric",
                              year: "numeric",
                            })}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="font-medium text-red-600">
                          -$
                          {payroll?.amount.toLocaleString("en-US", {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          })}
                        </span>
                        <p className="text-xs text-gray-500">
                          {payroll?.employees} employees
                        </p>
                        {payroll?.completed && (
                          <p className="text-xs text-green-600">✓ Completed</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg font-semibold text-black">
                System Status
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Arc Network Connection</span>
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                    Connected
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Smart Contract Status</span>
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                    Active
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Current Payroll ID</span>
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                    #{currentPayrollId?.toString() ?? "0"}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Funds Available</span>
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                    {totalContractBalance &&
                    (totalContractBalance as bigint) > 0n
                      ? "Sufficient"
                      : "Low"}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6 mt-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg text-black font-semibold">
              Recent Payroll Runs
            </CardTitle>
          </CardHeader>
          <CardContent>
            {recentPayrolls.length === 0 ? (
              <div className="text-center py-4 text-gray-500">
                No payroll runs yet
              </div>
            ) : (
              <div className="space-y-4">
                {recentPayrolls.map((payroll, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between py-2 border-b last:border-0"
                  >
                    <div className="flex items-center gap-3">
                      <ArrowUpRight className="h-4 w-4 text-red-600" />
                      <div>
                        <p className="font-medium text-gray-900">
                          Monthly Payroll
                        </p>
                        <p className="text-sm text-gray-500">
                          {payroll?.date.toLocaleDateString("en-US", {
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                          })}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="font-medium text-red-600">
                        -$
                        {payroll?.amount.toLocaleString("en-US", {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}
                      </span>
                      <p className="text-xs text-gray-500">
                        {payroll?.employees} employees
                      </p>
                      {payroll?.completed && (
                        <p className="text-xs text-green-600">✓ Completed</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-semibold">
              System Status
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Arc Network Connection</span>
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                  Connected
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Smart Contract Status</span>
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                  Active
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Current Payroll ID</span>
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                  #{currentPayrollId?.toString() ?? "0"}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Funds Available</span>
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                  {totalContractBalance && (totalContractBalance as bigint) > 0n
                    ? "Sufficient"
                    : "Low"}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Privacy Features Section */}
      {isEmployer === true && (
        <div className="mt-6 md:mt-8">
          <Card className="border-purple-200 bg-gradient-to-br from-purple-50 to-blue-50">
            <CardHeader>
              <div className="flex items-center gap-2">
                <Lock className="h-5 w-5 text-purple-600" />
                <CardTitle className="text-black">Privacy & Compliance</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-4 bg-white rounded-lg border border-purple-200">
                  <h3 className="font-semibold text-black mb-2">🔐 Private Salary Records</h3>
                  <p className="text-sm text-gray-700 mb-3">
                    Employee salaries are encrypted and only visible to authorized parties.
                  </p>
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full text-purple-600 border-purple-200"
                    onClick={() => router.push("/auditors")}
                  >
                    Manage Access
                  </Button>
                </div>

                <div className="p-4 bg-white rounded-lg border border-blue-200">
                  <h3 className="font-semibold text-black mb-2">👥 Employee Privacy</h3>
                  <p className="text-sm text-gray-700 mb-3">
                    Each employee only sees their own payments and details.
                  </p>
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full text-blue-600 border-blue-200"
                    onClick={() => router.push("/employee-portal")}
                  >
                    Employee Portal
                  </Button>
                </div>

                <div className="p-4 bg-white rounded-lg border border-green-200">
                  <h3 className="font-semibold text-black mb-2">✅ Auditor Compliance</h3>
                  <p className="text-sm text-gray-700 mb-3">
                    Grant auditors access to verify payroll execution privately.
                  </p>
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full text-green-600 border-green-200"
                    onClick={() => router.push("/privacy-demo")}
                  >
                    See Demo
                  </Button>
                </div>
              </div>

              <div className="p-4 bg-white rounded-lg border border-indigo-200">
                <h3 className="font-semibold text-indigo-900 mb-2">🎯 Privacy Status</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm">
                  <div>
                    <p className="text-gray-600">Payroll Privacy</p>
                    <p className="font-semibold text-green-600">✓ Enabled</p>
                  </div>
                  <div>
                    <p className="text-gray-600">Salary Visibility</p>
                    <p className="font-semibold text-green-600">✓ Private</p>
                  </div>
                  <div>
                    <p className="text-gray-600">Auditor Access</p>
                    <p className="font-semibold text-green-600">✓ Controlled</p>
                  </div>
                  <div>
                    <p className="text-gray-600">Public Exposure</p>
                    <p className="font-semibold text-green-600">✓ None</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
