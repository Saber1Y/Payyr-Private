"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  DollarSign,
  Users,
  Calendar,
  TrendingUp,
  ArrowUpRight,
} from "lucide-react";
import { useReadContract } from "wagmi";
import { formatUnits } from "viem";
import formatBalance from "@/utils/utils";
import PayrollContractABi from "../../lib/abi/PayrollManager.json";

const PAYROLL_REGISTRY_ADDRESS =
  "0x03A71968491d55603FFe1b11A9e23eF013f75bCF" as const;

export default function DashboardPage() {
  // Get contract balance
  const { data: contractBalance } = useReadContract({
    address: PAYROLL_REGISTRY_ADDRESS,
    abi: PayrollContractABi.abi,
    functionName: "getBalance",
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
    args: [currentPayrollId && typeof currentPayrollId === 'string' ? BigInt(currentPayrollId) - BigInt(1) : BigInt(0)],
    query: {
      enabled: !!currentPayrollId && Number(currentPayrollId) > 1,
    },
  });

  const { data: payroll3 } = useReadContract({
    address: PAYROLL_REGISTRY_ADDRESS,
    abi: PayrollContractABi.abi,
    functionName: "payrollRuns",
    args: [currentPayrollId && typeof currentPayrollId === 'string' ? BigInt(currentPayrollId) - BigInt(2) : BigInt(0)],
    query: {
      enabled: !!currentPayrollId && Number(currentPayrollId) > 2,
    },
  });

  const formattedContractBalance = formatBalance(contractBalance);

  // Helper to format payroll data
  const formatPayroll = (payroll: any) => {
    if (!payroll) return null;
    return {
      amount: Number(formatUnits(payroll.totalAmount, 6)),
      employeeCount: Number(payroll.employeeCount),
      timestamp: Number(payroll.timestamp) * 1000,
      isCompleted: payroll.isCompleted,
    };
  };

  const recentPayrolls = [
    payroll1 ? formatPayroll(payroll1) : null,
    payroll2 ? formatPayroll(payroll2) : null,
    payroll3 ? formatPayroll(payroll3) : null,
  ].filter(Boolean);

  const lastPayroll = recentPayrolls[0];

  return (
    <div className="p-8 bg-[#114277] min-h-screen">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white">Dashboard</h1>
        <p className="text-gray-300 mt-2">
          Overview of your payroll system on Arc Network
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Contract Balance
            </CardTitle>
            <DollarSign className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">
              {formattedContractBalance}
            </div>
            <p className="text-xs text-gray-500 mt-1">Available for payroll</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Total Payroll Runs
            </CardTitle>
            <Users className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">
              {totalPayrollRuns?.toString() ?? "0"}
            </div>
            <p className="text-xs text-gray-500 mt-1">All time executions</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Last Payroll Amount
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-indigo-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">
              $
              {lastPayroll
                ? lastPayroll.amount.toLocaleString("en-US", {
                    minimumFractionDigits: 2,
                  })
                : "0.00"}
            </div>
            <p className="text-xs text-gray-500 mt-1">
              {lastPayroll?.employeeCount ?? 0} employees paid
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Last Payroll Date
            </CardTitle>
            <Calendar className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">
              {lastPayroll
                ? new Date(lastPayroll.timestamp).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                  })
                : "N/A"}
            </div>
            <p className="text-xs text-gray-500 mt-1">
              {lastPayroll
                ? new Date(lastPayroll.timestamp).toLocaleDateString("en-US", {
                    year: "numeric",
                  })
                : "No payrolls yet"}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
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
                          {new Date(payroll.timestamp).toLocaleDateString(
                            "en-US",
                            {
                              month: "short",
                              day: "numeric",
                              year: "numeric",
                            }
                          )}
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
                        {payroll?.employeeCount} employees
                      </p>
                      {payroll?.isCompleted && (
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
                  {contractBalance && contractBalance > 0n
                    ? "Sufficient"
                    : "Low"}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
