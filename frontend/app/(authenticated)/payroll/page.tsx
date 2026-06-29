"use client";

export const dynamic = "force-dynamic";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { usePrivy } from "@privy-io/react-auth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  AlertCircle,
  CheckCircle,
  Loader2,
  Send,
  ShieldCheck,
  Users,
  Wallet,
} from "lucide-react";
import {
  useActiveEmployees,
  useCreatePayrollRun,
  useEmployerContracts,
  usePayrollsByEmployer,
} from "@/lib/daml/hooks";
import { ContractRecord, damlClient } from "@/lib/daml/client";
import {
  ensurePayrollManagerContract,
  type PayrollManager,
} from "@/lib/daml/payrollManager";
import { useDamlParty } from "@/hooks/useDamlParty";
import { DEFAULT_PAYROLL_CURRENCY, formatPayrollAmount } from "@/lib/payrollCurrency";

export default function PayrollPage() {
  const router = useRouter();
  const { authenticated } = usePrivy();
  const { damlParty: employerParty } = useDamlParty();

  const [isRunDialogOpen, setIsRunDialogOpen] = useState(false);

  useEffect(() => {
    damlClient.setParty(employerParty);
  }, [employerParty]);

  const { data: employerContracts, isLoading: isEmployerLoading } =
    useEmployerContracts(employerParty);
  const { data: activeEmployees, isLoading: isEmployeesLoading } =
    useActiveEmployees(employerParty);
  const {
    data: payrolls,
    isLoading: isPayrollsLoading,
    error: payrollsError,
  } = usePayrollsByEmployer(employerParty);
  const { mutate: createPayrollRun, isPending } = useCreatePayrollRun();

  const isEmployer = (employerContracts?.length ?? 0) > 0;
  const activeEmployeeRecords = activeEmployees ?? [];
  const sortedPayrolls = useMemo(() => {
    return [...(payrolls ?? [])].sort(
      (left, right) =>
        Number(right.payload.payrollId) - Number(left.payload.payrollId),
    );
  }, [payrolls]);
  const payrollHistory = sortedPayrolls.slice(0, 10);
  const latestPayroll = payrollHistory[0]?.payload;
  const monthlyPayrollTotal = activeEmployeeRecords.reduce(
    (sum, employee) => sum + Number(employee.payload.salary),
    0,
  );
  const totalPayrollRuns = sortedPayrolls.length;
  const canRunPayroll = activeEmployeeRecords.length > 0 && !isPending;

  const handleRunPayroll = async () => {
    if (!employerParty) {
      alert("Please authenticate first.");
      return;
    }

    if (activeEmployeeRecords.length === 0) {
      alert("Add at least one active employee before running payroll.");
      return;
    }

    let payrollManagerContract: ContractRecord<PayrollManager>;

    try {
      payrollManagerContract =
        await ensurePayrollManagerContract(employerParty);
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Unable to load payroll manager contract";
      alert(`Error: ${message}`);
      return;
    }

    createPayrollRun(
      {
        contractId: payrollManagerContract.contractId,
        employer: employerParty,
        employeeProfiles: activeEmployeeRecords.map(
          (employee) => employee.payload,
        ),
        timestamp: new Date().toISOString(),
      },
      {
        onSuccess: () => {
          setIsRunDialogOpen(false);
        },
        onError: (error) => {
          alert(`Failed to run payroll: ${error.message}`);
        },
      },
    );
  };

  if (!authenticated) {
    return <div>Please log in to manage payroll.</div>;
  }

  if (isEmployerLoading) {
    return (
      <div className="min-h-screen bg-[#114277] p-4 md:p-8">
        <Card className="text-black">
          <CardContent className="pt-6 text-gray-600">
            Loading payroll workspace...
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!isEmployer) {
    return (
      <div className="min-h-screen bg-[#114277] p-4 md:p-8">
        <div className="mx-auto mt-8 max-w-md">
          <Card className="text-black">
            <CardHeader>
              <CardTitle className="text-black">Register as Employer</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="mb-4 text-sm text-gray-600">
                Create your employer contract before running payroll workflows.
              </p>
              <Button
                className="w-full gap-2"
                onClick={() => router.push("/employees")}
              >
                Go to Employees
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#114277] p-4 md:p-8">
      <div className="mb-6 md:mb-8">
        <h1 className="text-2xl font-bold text-white md:text-3xl">Payroll</h1>
        <p className="mt-2 text-sm text-gray-300 md:text-base">
          Run private payroll in {DEFAULT_PAYROLL_CURRENCY} from your Daml
          ledger workspace.
        </p>
      </div>

      <div className="mb-6 grid grid-cols-2 gap-4 md:mb-8 md:grid-cols-4 md:gap-6">
        <Card className="text-black">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Active Employees
            </CardTitle>
            <Users className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">
              {activeEmployeeRecords.length}
            </div>
            <p className="mt-1 text-xs text-gray-500">
              Eligible for next payroll
            </p>
          </CardContent>
        </Card>

        <Card className="text-black">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Monthly Total
            </CardTitle>
            <Wallet className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">
              {formatPayrollAmount(monthlyPayrollTotal)}
            </div>
            <p className="mt-1 text-xs text-gray-500">
              Sum of active employee salaries in {DEFAULT_PAYROLL_CURRENCY}
            </p>
          </CardContent>
        </Card>

        <Card className="text-black">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Payroll Runs
            </CardTitle>
            <Send className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">
              {totalPayrollRuns}
            </div>
            <p className="mt-1 text-xs text-gray-500">Recorded on the ledger</p>
          </CardContent>
        </Card>

        <Card className="text-black">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Status
            </CardTitle>
            {canRunPayroll ? (
              <CheckCircle className="h-4 w-4 text-green-600" />
            ) : (
              <AlertCircle className="h-4 w-4 text-red-600" />
            )}
          </CardHeader>
          <CardContent>
            <div
              className={`text-2xl font-bold ${
                canRunPayroll ? "text-green-600" : "text-red-600"
              }`}
            >
              {canRunPayroll ? "Ready" : "Blocked"}
            </div>
            <p className="mt-1 text-xs text-gray-500">
              {canRunPayroll
                ? "You can issue the next payroll run"
                : "Add active employees to continue"}
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="mb-6 flex flex-col gap-3 md:mb-8 sm:flex-row">
        <Dialog open={isRunDialogOpen} onOpenChange={setIsRunDialogOpen}>
          <DialogTrigger asChild>
            <Button
              className="w-full gap-2 sm:w-auto"
              disabled={!canRunPayroll}
            >
              <Send className="h-4 w-4" />
              Run Payroll
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle className="text-black py-2">
                Confirm Payroll Run
              </DialogTitle>
              <DialogDescription className="max-w-sm whitespace-normal">
                This creates a payroll run plus payment contracts for each
                active employee on the Daml ledger.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4 text-sm text-gray-700">
              <div className="rounded-lg border border-blue-200 bg-blue-50 p-4">
                <p className="wrap-break-word leading-relaxed max-w-sm whitespace-normal">
                  <span className="font-medium text-gray-900">
                    Employer party:
                  </span>{" "}
                  {employerParty}
                </p>
              </div>

              <div className="space-y-3 rounded-lg border border-gray-200 bg-white p-4">
                <div className="flex items-center justify-between gap-4">
                  <span className="text-gray-600">Active employees</span>
                  <span className="font-semibold text-gray-900">
                    {activeEmployeeRecords.length}
                  </span>
                </div>

                <div className="flex items-center justify-between gap-4">
                  <span className="text-gray-600">Total payroll amount</span>
                  <span className="font-semibold text-gray-900">
                    {formatPayrollAmount(monthlyPayrollTotal)}
                  </span>
                </div>
              </div>

              <div className="rounded-lg border border-green-200 bg-green-50 p-4">
                <p className="leading-relaxed text-green-900">
                  Daml creates the payroll and employee payment contracts in one
                  ledger workflow using mock {DEFAULT_PAYROLL_CURRENCY}, so no
                  external token approval step is needed for this MVP.
                </p>
              </div>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setIsRunDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button onClick={handleRunPayroll} disabled={isPending}>
                {isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Running...
                  </>
                ) : (
                  "Confirm Payroll"
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <Button
          variant="outline"
          className="w-full gap-2 sm:w-auto"
          onClick={() => router.push("/employees")}
        >
          <Users className="h-4 w-4" />
          Manage Employees
        </Button>
      </div>

      <Card className="text-black">
        <CardHeader>
          <CardTitle className="text-black">Payroll History</CardTitle>
        </CardHeader>
        <CardContent>
          {isEmployeesLoading || isPayrollsLoading ? (
            <div className="py-8 text-center text-gray-500">
              Loading payroll history...
            </div>
          ) : payrollsError ? (
            <div className="py-8 text-center text-red-500">
              Failed to load payroll history.
            </div>
          ) : payrollHistory.length === 0 ? (
            <div className="py-8 text-center text-gray-500">
              No payroll history yet. Run your first payroll to create payment
              contracts.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table className="text-black">
                <TableHeader>
                  <TableRow>
                    <TableHead className="min-w-[60px] text-black">
                      Run #
                    </TableHead>
                    <TableHead className="min-w-[110px] text-black">
                      Date
                    </TableHead>
                    <TableHead className="min-w-[80px] text-black">
                      Employees
                    </TableHead>
                    <TableHead className="min-w-[120px] text-black">
                      Total Amount
                    </TableHead>
                    <TableHead className="min-w-[90px] text-black">
                      Currency
                    </TableHead>
                    <TableHead className="min-w-[80px] text-black">
                      Privacy
                    </TableHead>
                    <TableHead className="min-w-[80px] text-black">
                      Status
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {payrollHistory.map((payroll) => (
                    <TableRow key={payroll.contractId} className="text-black">
                      <TableCell className="font-medium">
                        #{Number(payroll.payload.payrollId)}
                      </TableCell>
                      <TableCell className="whitespace-nowrap">
                        {new Date(payroll.payload.timestamp).toLocaleDateString(
                          "en-US",
                          {
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                          },
                        )}
                      </TableCell>
                      <TableCell>
                        {Number(payroll.payload.employeeCount)}
                      </TableCell>
                      <TableCell className="whitespace-nowrap">
                        {formatPayrollAmount(
                          Number(payroll.payload.totalAmount),
                          payroll.payload.paymentCurrency,
                        )}
                      </TableCell>
                      <TableCell className="whitespace-nowrap">
                        {payroll.payload.paymentCurrency}
                      </TableCell>
                      <TableCell>
                        {payroll.payload.isPublic ? "Public" : "Private"}
                      </TableCell>
                      <TableCell>
                        <span className="inline-flex rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-800">
                          {payroll.payload.isCompleted ? "Completed" : "Open"}
                        </span>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="mt-6 border-purple-200 bg-gradient-to-br from-purple-50 to-blue-50 text-black">
        <CardHeader>
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-purple-600" />
            <CardTitle className="text-black">
              Privacy & Auditor Controls
            </CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="rounded-lg border border-purple-200 bg-white p-4">
              <h3 className="mb-2 font-semibold text-black">
                Private Payroll Runs
              </h3>
              <p className="mb-3 text-sm text-gray-700">
                Payroll runs stay private by default and can be shared with
                auditors only when you choose.
              </p>
              <Button
                variant="outline"
                className="w-full text-purple-600 border-purple-200 hover:bg-purple-50"
                onClick={() => router.push("/auditors")}
              >
                Manage Auditor Access
              </Button>
            </div>

            <div className="rounded-lg border border-blue-200 bg-white p-4">
              <h3 className="mb-2 font-semibold text-black">
                Employee Payment View
              </h3>
              <p className="mb-3 text-sm text-gray-700">
                Employees only see their own payment contracts and claim status
                inside their portal.
              </p>
              <Button
                variant="outline"
                className="w-full text-blue-600 border-blue-200 hover:bg-blue-50"
                onClick={() => router.push("/employee-portal")}
              >
                Open Employee Portal
              </Button>
            </div>
          </div>

          <div className="rounded-lg border border-green-200 bg-white p-4">
            <h3 className="mb-2 font-semibold text-black">How This Changed</h3>
            <ul className="space-y-1 text-sm text-gray-700">
              <li>No ERC20 approval step is required in the Daml workflow.</li>
              <li>
                Running payroll creates private {DEFAULT_PAYROLL_CURRENCY} payment contracts for each employee.
              </li>
              <li>
                Auditor visibility is granted per payroll run, not globally.
              </li>
            </ul>
          </div>

          {latestPayroll && (
            <div className="rounded-lg border border-indigo-200 bg-white p-4 text-sm text-gray-700">
              Latest run #{Number(latestPayroll.payrollId)} paid{" "}
              {Number(latestPayroll.employeeCount)} employees for{" "}
              {formatPayrollAmount(
                Number(latestPayroll.totalAmount),
                latestPayroll.paymentCurrency,
              )}
              .
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
