"use client";

import { useState } from "react";
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Wallet, Send, AlertCircle, CheckCircle, Loader2 } from "lucide-react";
import { useReadContract, useWriteContract } from "wagmi";
import formatBalance from "@/utils/utils";
import USDCABI from "../../lib/abi/USDC.json";
import PayrollContractABi from "../../lib/abi/PayrollManager.json";
import EmployeeRegistryABI from "../../lib/abi/EmployeeRegistry.json";

import { usePrivy } from "@privy-io/react-auth";

const EMPLOYEE_REGISTRY_ADDRESS =
  "0x4c7A677a9106249eb5eD7211965aBb6f5e4FBd99" as const;
const PAYROLL_REGISTRY_ADDRESS =
  "0x464EBe9DF3494074667ea2fAcE94413e8d9c7d3E" as const;

const ARC_USDC_ADDR = "0x3600000000000000000000000000000000000000" as const;

export default function PayrollPage() {
  const [depositAmount, setDepositAmount] = useState("");
  const [step, setStep] = useState<"closed" | "approve" | "deposit">("closed");

  const { user, ready, authenticated } = usePrivy();

  const address = user?.wallet?.address;

  /* ==================== READ CONTRACTS ==================== */

  // User's USDC balance
  const { data: userBalance } = useReadContract({
    address: ARC_USDC_ADDR,
    abi: USDCABI,
    functionName: "balanceOf",
    args: [address as `0x${string}`],
    chainId: 5042002,
    query: { enabled: !!address },
  });

  // Contract's USDC balance
  const { data: contractBalance } = useReadContract({
    address: PAYROLL_REGISTRY_ADDRESS,
    abi: PayrollContractABi.abi,
    functionName: "getBalance",
  });

  // Current payroll ID
  const { data: currentPayrollId } = useReadContract({
    address: PAYROLL_REGISTRY_ADDRESS,
    abi: PayrollContractABi.abi,
    functionName: "currentPayrollId",
  });

  // Total monthly cost - FIXED FUNCTION NAME
  const { data: monthlyPayrollCost } = useReadContract({
    address: EMPLOYEE_REGISTRY_ADDRESS,
    abi: EmployeeRegistryABI.abi,
    functionName: "getTotalMonthlyCost",
  });

  // Active employees count
  const { data: activeEmployees } = useReadContract({
    address: EMPLOYEE_REGISTRY_ADDRESS,
    abi: EmployeeRegistryABI.abi,
    functionName: "activeEmployees",
  });

  // Fetch last 3 payroll runs
  const { data: payrollHistory1 } = useReadContract({
    address: PAYROLL_REGISTRY_ADDRESS,
    abi: PayrollContractABi.abi,
    functionName: "payrollRuns",
    args: [currentPayrollId as bigint],
    query: {
      enabled: !!currentPayrollId && Number(currentPayrollId) > 0,
    },
  });

  const { data: payrollHistory2 } = useReadContract({
    address: PAYROLL_REGISTRY_ADDRESS,
    abi: PayrollContractABi.abi,
    functionName: "payrollRuns",
    args: [currentPayrollId ? (currentPayrollId as bigint) - 1n : 0n],
    query: {
      enabled: !!currentPayrollId && Number(currentPayrollId) > 1,
    },
  });

  const { data: payrollHistory3 } = useReadContract({
    address: PAYROLL_REGISTRY_ADDRESS,
    abi: PayrollContractABi.abi,
    functionName: "payrollRuns",
    args: [currentPayrollId ? (currentPayrollId as bigint) - 2n : 0n],
    query: {
      enabled: !!currentPayrollId && Number(currentPayrollId) > 2,
    },
  });

  /* ==================== WRITE CONTRACT ==================== */

  const { mutate: writeContract, isPending } = useWriteContract();

  /* ==================== FORMAT DATA ==================== */

  const formatPayrollData = (data: unknown) => {
    if (!data) return null;
    const payrollData = data as {
      id: bigint;
      timestamp: bigint;
      totalAmount: bigint;
      employeeCount: bigint;
      isCompleted: boolean;
    };
    return {
      id: Number(payrollData.id),
      date: new Date(Number(payrollData.timestamp) * 1000),
      amount: formatBalance(payrollData.totalAmount),
      employees: Number(payrollData.employeeCount),
      completed: payrollData.isCompleted,
    };
  };

  const formattedMonthlyBalance = formatBalance(monthlyPayrollCost as bigint | undefined);
  const formattedUserBalance = formatBalance(userBalance as bigint | undefined);
  const formattedContractBalance = formatBalance(contractBalance as bigint | undefined);

  const hasSufficientFunds =
    formattedContractBalance >= formattedMonthlyBalance;

  const history = [
    formatPayrollData(payrollHistory1),
    formatPayrollData(payrollHistory2),
    formatPayrollData(payrollHistory3),
  ].filter((item): item is NonNullable<typeof item> => item !== null);


  if (!authenticated) {
    return <div>Please Login to check balance</div>;
  }

  /* ==================== HANDLERS ==================== */

  const handleApproval = () => {
    if (!depositAmount || Number(depositAmount) <= 0) {
      return alert("Please input amount");
    }

    const parsedAmount = parseInt(depositAmount, 10);

    writeContract({
      address: ARC_USDC_ADDR,
      abi: USDCABI,
      functionName: "approve",
      args: [PAYROLL_REGISTRY_ADDRESS, BigInt(parsedAmount * 1_000_000)],
    });

    setStep("deposit");
  };

  const handleDeposit = () => {
    if (!depositAmount || Number(depositAmount) <= 0) {
      return alert("Please input amount");
    }

    const parsedAmount = parseInt(depositAmount, 10);

    writeContract({
      address: PAYROLL_REGISTRY_ADDRESS,
      abi: PayrollContractABi.abi,
      functionName: "depositPayroll",
      args: [BigInt(parsedAmount * 1_000_000)], // ← FIXED: Convert to smallest units
    });

    setStep("closed");
    setDepositAmount("");
  };

  // Execute payroll
  const handlePayAll = () => {
    writeContract({
      address: PAYROLL_REGISTRY_ADDRESS,
      abi: PayrollContractABi.abi,
      functionName: "executePayroll",
    });
  };

  return (
    <div className="p-8 bg-[#114277] min-h-screen">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white">Payroll</h1>
        <p className="text-gray-300 mt-2">
          Manage deposits and payroll payments on Arc Network
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Your USDC
            </CardTitle>
            <Wallet className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">
              $
              {ready
                ? formattedUserBalance.toLocaleString(undefined, {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })
                : "0.00"}
            </div>
            <p className="text-xs text-gray-500 mt-1">In your wallet</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Contract Balance
            </CardTitle>
            <Wallet className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">
              ${}
              {formattedContractBalance.toLocaleString(undefined, {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}
            </div>
            <p className="text-xs text-gray-500 mt-1">Available</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Monthly Cost
            </CardTitle>
            <Send className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">
              $
              {formattedMonthlyBalance.toLocaleString(undefined, {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}
            </div>
            <p className="text-xs text-gray-500 mt-1">
              {activeEmployees?.toString() ?? "0"} employees
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Status
            </CardTitle>
            {hasSufficientFunds ? (
              <CheckCircle className="h-4 w-4 text-green-600" />
            ) : (
              <AlertCircle className="h-4 w-4 text-red-600" />
            )}
          </CardHeader>
          <CardContent>
            <div
              className={`text-2xl font-bold ${
                hasSufficientFunds ? "text-green-600" : "text-red-600"
              }`}
            >
              {hasSufficientFunds ? "Ready" : "Low Funds"}
            </div>
            <p className="text-xs text-gray-500 mt-1">
              {hasSufficientFunds ? "Can pay all" : "Need more USDC"}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Action Buttons with Two-Step Dialog */}
      <div className="flex gap-4 mb-8">
        <Dialog open={step !== "closed"} onOpenChange={() => setStep("closed")}>
          <DialogTrigger asChild>
            <Button
              variant="outline"
              className="gap-2"
              onClick={() => setStep("approve")}
            >
              <Wallet className="h-4 w-4 text-black" />
              <span className="text-black">Deposit USDC</span>
            </Button>
          </DialogTrigger>

          {/* Step 1: Approval */}
          {step === "approve" && (
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>Step 1: Approve USDC</DialogTitle>
                <DialogDescription>
                  Allow the payroll contract to spend your USDC.
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="amount">Amount (USDC)</Label>
                  <Input
                    id="amount"
                    type="number"
                    value={depositAmount}
                    onChange={(e) => setDepositAmount(e.target.value)}
                    placeholder="10000"
                  />
                </div>
                <div className="text-sm space-y-1">
                  <div className="text-gray-600">
                    Your balance: ${formattedUserBalance.toLocaleString()}
                  </div>
                  <div className="text-gray-600">
                    Contract balance: $
                    {formattedContractBalance.toLocaleString()}
                  </div>
                </div>
                <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                  <p className="text-sm text-blue-800">
                    💡 ERC20 tokens require approval before transfer for
                    security.
                  </p>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setStep("closed")}>
                  Cancel
                </Button>
                <Button onClick={handleApproval} disabled={isPending}>
                  {isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Approving...
                    </>
                  ) : (
                    "Approve USDC"
                  )}
                </Button>
              </DialogFooter>
            </DialogContent>
          )}

          {/* Step 2: Deposit */}
          {step === "deposit" && (
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>Step 2: Deposit</DialogTitle>
                <DialogDescription>
                  Complete the deposit to the payroll contract.
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="p-3 bg-green-50 rounded-lg border border-green-200">
                  <p className="text-sm text-green-800">
                    ✓ USDC approved! Click below to deposit.
                  </p>
                </div>
                <div className="text-sm">
                  Depositing:{" "}
                  <span className="font-bold text-lg">
                    ${Number(depositAmount).toLocaleString()} USDC
                  </span>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setStep("closed")}>
                  Cancel
                </Button>
                <Button onClick={handleDeposit} disabled={isPending}>
                  {isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Depositing...
                    </>
                  ) : (
                    "Confirm Deposit"
                  )}
                </Button>
              </DialogFooter>
            </DialogContent>
          )}
        </Dialog>

        <Button
          className="gap-2"
          disabled={!hasSufficientFunds || isPending}
          onClick={handlePayAll}
        >
          {isPending ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Processing...
            </>
          ) : (
            <>
              <Send className="h-4 w-4" />
              Pay All Employees
            </>
          )}
        </Button>
      </div>

      {/* Payroll History - FIXED TO USE BLOCKCHAIN DATA */}
      <Card>
        <CardHeader>
          <CardTitle>Payroll History</CardTitle>
        </CardHeader>
        <CardContent>
          {history.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No payroll history yet. Execute your first payroll.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Run #</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Employees</TableHead>
                  <TableHead>Total Amount</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {history.map((record) => (
                  <TableRow key={record!.id}>
                    <TableCell className="font-medium">#{record!.id}</TableCell>
                    <TableCell>
                      {record!.date.toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </TableCell>
                    <TableCell>{record!.employees}</TableCell>
                    <TableCell>
                      $
                      {record!.amount.toLocaleString(undefined, {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                    </TableCell>
                    <TableCell>
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        {record!.completed ? "Completed" : "Pending"}
                      </span>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
