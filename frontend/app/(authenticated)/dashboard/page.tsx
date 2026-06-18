"use client";

export const dynamic = "force-dynamic";

import { useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { usePrivy } from "@privy-io/react-auth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Calendar,
  DollarSign,
  Lock,
  ShieldCheck,
  TrendingUp,
  UserPlus,
  Users,
  Wallet,
} from "lucide-react";
import {
  useEmployeesByEmployer,
  useEmployerContracts,
  usePayrollsByEmployer,
} from "@/lib/daml/hooks";
import { damlClient } from "@/lib/daml/client";
import { useDamlParty } from "@/hooks/useDamlParty";

export default function DashboardPage() {
  const router = useRouter();
  const { authenticated } = usePrivy();
  const { damlParty: employerParty } = useDamlParty();

  useEffect(() => {
    damlClient.setParty(employerParty);
  }, [employerParty]);

  const {
    data: employerContracts,
    error: employerError,
    isLoading: isEmployerLoading,
  } = useEmployerContracts(employerParty);
  const {
    data: employees,
    error: employeesError,
    isLoading: isEmployeesLoading,
  } = useEmployeesByEmployer(employerParty);
  const {
    data: payrolls,
    error: payrollsError,
    isLoading: isPayrollsLoading,
  } = usePayrollsByEmployer(employerParty);

  const isEmployer = (employerContracts?.length ?? 0) > 0;
  const employeeRecords = employees ?? [];
  const activeEmployees = employeeRecords.filter(
    (employee) => employee.payload.isActive,
  );
  const monthlyPayrollTotal = activeEmployees.reduce(
    (sum, employee) => sum + Number(employee.payload.salary),
    0,
  );
  const recentPayrolls = useMemo(() => {
    return [...(payrolls ?? [])]
      .sort(
        (left, right) =>
          Number(right.payload.payrollId) - Number(left.payload.payrollId),
      )
      .slice(0, 3);
  }, [payrolls]);
  const latestPayroll = recentPayrolls[0]?.payload;
  const latestPayrollAmount = latestPayroll
    ? Number(latestPayroll.totalAmount)
    : 0;
  const queryError = employerError || employeesError || payrollsError;
  const isLoading =
    isEmployerLoading || isEmployeesLoading || isPayrollsLoading;

  if (!authenticated) {
    return <div>Please log in to view your payroll dashboard.</div>;
  }

  if (isLoading && !isEmployer) {
    return (
      <div className="min-h-screen bg-[#114277] p-4 md:p-8">
        <Card>
          <CardContent className="pt-6 text-gray-600">
            Loading employer workspace...
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#114277] p-4 md:p-8">
      <div className="mb-6 md:mb-8">
        <h1 className="text-2xl font-bold text-white md:text-3xl">Dashboard</h1>
        <p className="mt-2 text-sm text-gray-300 md:text-base">
          Overview of your Daml payroll workspace and recent ledger activity.
        </p>
      </div>

      {!isEmployer ? (
        <Card className="gap-2 border-blue-200 bg-gradient-to-r from-blue-50 to-cyan-50">
          <CardContent className="pt-6">
            <div className="flex flex-col items-center gap-4 md:flex-row">
              <div className="flex h-16 w-16 flex-shrink-0 items-center justify-center rounded-full bg-blue-100">
                <ShieldCheck className="h-8 w-8 text-blue-600" />
              </div>
              <div className="flex-1">
                <h3 className="mb-2 text-lg font-semibold text-gray-900">
                  Set Up Your Employer Workspace
                </h3>
                <p className="mb-4 text-sm text-gray-600">
                  Create your employer contract, add employees, and start
                  running private payroll from the Daml ledger.
                </p>
                <div className="flex flex-wrap gap-2">
                  <Button
                    onClick={() => router.push("/employees")}
                    className="gap-2 bg-blue-600 hover:bg-blue-700"
                  >
                    <ShieldCheck className="h-4 w-4" />
                    Open Employees
                  </Button>
                  <Button
                    onClick={() => router.push("/payroll")}
                    variant="outline"
                    className="gap-2 text-black"
                  >
                    <Wallet className="h-4 w-4" />
                    Open Payroll
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="mb-6 grid grid-cols-2 gap-4 md:mb-8 lg:grid-cols-4 md:gap-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-xs font-medium text-gray-600 md:text-sm">
                  Active Employees
                </CardTitle>
                <Users className="h-4 w-4 text-blue-600" />
              </CardHeader>
              <CardContent>
                <div className="text-xl font-bold text-gray-900 md:text-2xl">
                  {activeEmployees.length}
                </div>
                <p className="mt-1 text-xs text-gray-500">
                  {employeeRecords.length} total employee records
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-xs font-medium text-gray-600 md:text-sm">
                  Monthly Payroll
                </CardTitle>
                <DollarSign className="h-4 w-4 text-green-600" />
              </CardHeader>
              <CardContent>
                <div className="text-xl font-bold text-gray-900 md:text-2xl">
                  ${monthlyPayrollTotal.toLocaleString()}
                </div>
                <p className="mt-1 text-xs text-gray-500">
                  Based on active employee contracts
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-xs font-medium text-gray-600 md:text-sm">
                  Payroll Runs
                </CardTitle>
                <TrendingUp className="h-4 w-4 text-indigo-600" />
              </CardHeader>
              <CardContent>
                <div className="text-xl font-bold text-gray-900 md:text-2xl">
                  {payrolls?.length ?? 0}
                </div>
                <p className="mt-1 text-xs text-gray-500">
                  Completed ledger payroll runs
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-xs font-medium text-gray-600 md:text-sm">
                  Latest Payroll
                </CardTitle>
                <Calendar className="h-4 w-4 text-purple-600" />
              </CardHeader>
              <CardContent>
                <div className="text-xl font-bold text-gray-900 md:text-2xl">
                  ${latestPayrollAmount.toLocaleString()}
                </div>
                <p className="mt-1 text-xs text-gray-500">
                  {latestPayroll
                    ? new Date(latestPayroll.timestamp).toLocaleDateString()
                    : "No payrolls yet"}
                </p>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 md:gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg font-semibold text-black">
                  Recent Payroll Runs
                </CardTitle>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="py-4 text-center text-gray-500">
                    Loading payroll activity...
                  </div>
                ) : recentPayrolls.length === 0 ? (
                  <div className="py-4 text-center text-gray-500">
                    No payroll runs yet.
                  </div>
                ) : (
                  <div className="space-y-4">
                    {recentPayrolls.map((payroll) => (
                      <div
                        key={payroll.contractId}
                        className="flex items-center justify-between border-b py-2 last:border-0"
                      >
                        <div>
                          <p className="font-medium text-gray-900">
                            Payroll #{Number(payroll.payload.payrollId)}
                          </p>
                          <p className="text-sm text-gray-500">
                            {new Date(
                              payroll.payload.timestamp,
                            ).toLocaleDateString("en-US", {
                              month: "short",
                              day: "numeric",
                              year: "numeric",
                            })}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-medium text-red-600">
                            -$
                            {Number(
                              payroll.payload.totalAmount,
                            ).toLocaleString()}
                          </p>
                          <p className="text-xs text-gray-500">
                            {Number(payroll.payload.employeeCount)} employees
                          </p>
                          <p className="text-xs text-green-600">
                            {payroll.payload.isCompleted ? "Completed" : "Open"}
                          </p>
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
                  Ledger Status
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Daml JSON API</span>
                    <span
                      className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${
                        queryError
                          ? "bg-red-100 text-red-800"
                          : "bg-green-100 text-green-800"
                      }`}
                    >
                      {queryError ? "Needs Attention" : "Connected"}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Employer Contract</span>
                    <span className="inline-flex rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-800">
                      Registered
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Current Payroll ID</span>
                    <span className="inline-flex rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-medium text-blue-800">
                      #{latestPayroll ? Number(latestPayroll.payrollId) : 0}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Private Payroll Mode</span>
                    <span className="inline-flex rounded-full bg-purple-100 px-2.5 py-0.5 text-xs font-medium text-purple-800">
                      Enabled
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="mt-6 md:mt-8">
            <Card className="border-purple-200 bg-gradient-to-br from-purple-50 to-blue-50">
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Lock className="h-5 w-5 text-purple-600" />
                  <CardTitle className="text-black">
                    Privacy & Compliance
                  </CardTitle>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                  <div className="rounded-lg border border-purple-200 bg-white p-4">
                    <h3 className="mb-2 font-semibold text-black">
                      Private Salary Records
                    </h3>
                    <p className="mb-3 text-sm text-gray-700">
                      Salary and employee contracts stay scoped to the relevant
                      Daml parties.
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

                  <div className="rounded-lg border border-blue-200 bg-white p-4">
                    <h3 className="mb-2 font-semibold text-black">
                      Employee Privacy
                    </h3>
                    <p className="mb-3 text-sm text-gray-700">
                      Each employee sees only their own payment contracts and
                      claim status.
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

                  <div className="rounded-lg border border-green-200 bg-white p-4">
                    <h3 className="mb-2 font-semibold text-black">
                      Auditor Compliance
                    </h3>
                    <p className="mb-3 text-sm text-gray-700">
                      Authorize auditors on a payroll-run basis without opening
                      data publicly.
                    </p>
                   
                  </div>
                </div>

                <div className="rounded-lg border border-indigo-200 bg-white p-4">
                  <h3 className="mb-2 font-semibold text-indigo-900">
                    Workspace Shortcuts
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    <Button
                      variant="outline"
                      className="gap-2"
                      onClick={() => router.push("/employees")}
                    >
                      <UserPlus className="h-4 w-4" />
                      Manage Employees
                    </Button>
                    <Button
                      variant="outline"
                      className="gap-2"
                      onClick={() => router.push("/payroll")}
                    >
                      <Wallet className="h-4 w-4" />
                      Run Payroll
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </>
      )}
    </div>
  );
}
