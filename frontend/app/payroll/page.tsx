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
  "0x20B3dB45a351E92673112064A3F01951115eD6B7" as const;
const PAYROLL_REGISTRY_ADDRESS =
  "0x1739715A3452BF1e336305cf8f9542d177cEa03A" as const;

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

  // Check USDC allowance to payroll contract
  const { data: allowance } = useReadContract({
    address: ARC_USDC_ADDR,
    abi: USDCABI,
    functionName: "allowance",
    args: [address as `0x${string}`, PAYROLL_REGISTRY_ADDRESS],
    chainId: 5042002,
    query: { enabled: !!address },
  });

  // Get contract total balance (for admin/deployer)
  const { data: totalContractBalance } = useReadContract({
    address: PAYROLL_REGISTRY_ADDRESS,
    abi: PayrollContractABi.abi,
    functionName: "getTotalBalance",
  });

  // Employer's USDC balance in contract
  const { data: employerBalance } = useReadContract({
    address: PAYROLL_REGISTRY_ADDRESS,
    abi: PayrollContractABi.abi,
    functionName: "getMyBalance",
    query: {
      enabled:
        !!address && address !== "0x11f7eaC93C9DD552DFD657BE52007A25E200f356",
    },
  });

  // Display balance: employer balance for regular users, total balance for admin
  const displayBalance: bigint = (totalContractBalance ??
    employerBalance ??
    0n) as bigint;

  const formattedDisplayBalance = formatBalance(displayBalance);

  // Current payroll ID
  const { data: currentPayrollId } = useReadContract({
    address: PAYROLL_REGISTRY_ADDRESS,
    abi: PayrollContractABi.abi,
    functionName: "currentPayrollId",
  });

  // Employer's total monthly cost
  const { data: monthlyPayrollCost } = useReadContract({
    address: EMPLOYEE_REGISTRY_ADDRESS,
    abi: EmployeeRegistryABI.abi,
    functionName: "getEmployerMonthlyCost",
    args: [address as `0x${string}`],
    query: {
      enabled: !!address,
    },
  });

  // Employer's active employees count
  const { data: employerEmployees } = useReadContract({
    address: EMPLOYEE_REGISTRY_ADDRESS,
    abi: EmployeeRegistryABI.abi,
    functionName: "getEmployerEmployees",
    args: [address as `0x${string}`],
    query: {
      enabled: !!address,
    },
  });

  // Check if user is employer
  const { data: isEmployer } = useReadContract({
    address: EMPLOYEE_REGISTRY_ADDRESS,
    abi: EmployeeRegistryABI.abi,
    functionName: "isEmployer",
    args: [address as `0x${string}`],
    query: {
      enabled: !!address,
    },
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

  const { writeContract, isPending } = useWriteContract();

  /* ==================== FORMAT DATA ==================== */

  const formatPayrollData = (data: unknown) => {
    if (!data) return null;
    const payrollData = data as [
      bigint,
      string,
      bigint,
      bigint,
      bigint,
      string,
      boolean
    ];
    const [
      id,
      employer,
      timestamp,
      totalAmount,
      employeeCount,
      merkleRoot,
      isCompleted,
    ] = payrollData;
    return {
      id: Number(id),
      date: new Date(Number(timestamp) * 1000),
      amount: formatBalance(totalAmount),
      employees: Number(employeeCount),
      completed: isCompleted,
    };
  };

  const formattedMonthlyBalance = formatBalance(
    monthlyPayrollCost as bigint | undefined
  );
  const formattedUserBalance = formatBalance(userBalance as bigint | undefined);
  const formattedEmployerBalance = formatBalance(
    employerBalance as bigint | undefined
  );
  const formattedAllowance = formatBalance(allowance as bigint | undefined);

  console.log("Payroll Debug:", {
    employerBalance,
    formattedEmployerBalance,
    monthlyPayrollCost: monthlyPayrollCost?.toString(),
    formattedMonthlyBalance,
    userBalance,
    formattedUserBalance,
    allowance: allowance?.toString(),
    formattedAllowance,
    totalContractBalance,
    displayBalance,
    isAdmin: address === "0x11f7eaC93C9DD552DFD657BE52007A25E200f356",
    isUsingTotalBalance:
      address === "0x11f7eaC93C9DD552DFD657BE52007A25E200f356",
  });

  const hasSufficientFunds = displayBalance >= formattedMonthlyBalance;

  const history = [
    formatPayrollData(payrollHistory1),
    formatPayrollData(payrollHistory2),
    formatPayrollData(payrollHistory3),
  ].filter((item): item is NonNullable<typeof item> => item !== null);

  if (!authenticated) {
    return <div>Please Login to check balance</div>;
  }

  if (isEmployer === false) {
    return (
      <div className="p-4 md:p-8 bg-[#114277] min-h-screen">
        <div className="max-w-md mx-auto mt-8">
          <Card>
            <CardHeader>
              <CardTitle className="text-black">Register as Employer</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600 mb-4">
                You need to register as an employer to manage payroll.
              </p>
              <Button
                className="w-full gap-2"
                onClick={() => (window.location.href = "/employees")}
              >
                Go to Employees Page
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
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

  console.log(step);

  return (
    <div className="p-4 md:p-8 bg-[#114277] min-h-screen">
      <div className="mb-6 md:mb-8">
        <h1 className="text-2xl md:text-3xl font-bold text-white">Payroll</h1>
        <p className="text-gray-300 mt-2 text-sm md:text-base">
          Manage deposits and payroll payments on Arc Network
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6 mb-6 md:mb-8">
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
              Your Balance
            </CardTitle>
            <Wallet className="h-4 w-4 text-green-600" />
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
              {employerEmployees?.length ?? "0"} employees
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
      <div className="flex flex-col sm:flex-row gap-3 md:gap-4 mb-6 md:mb-8">
        <Dialog
          open={step === "approve" || step === "deposit"}
          onOpenChange={(open) => setStep(open ? "approve" : "closed")}
        >
          <DialogTrigger asChild>
            <Button variant="outline" className="gap-2 w-full sm:w-auto">
              <Wallet className="h-4 w-4 text-black" />
              <span className="text-black">Deposit USDC</span>
            </Button>
          </DialogTrigger>

          {/* Step 1: Approval */}
          {step === "approve" && (
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle className="text-black">
                  Step 1: Approve USDC
                </DialogTitle>
                <DialogDescription>
                  Allow the payroll contract to spend your USDC.
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="amount" className="text-black">
                    Amount (USDC)
                  </Label>
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
                    Approved amount: ${formattedAllowance.toLocaleString()}
                  </div>
                  <div className="text-gray-600">
                    Contract balance: $
                    {formattedEmployerBalance.toLocaleString()}
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
            <DialogContent className="sm:max-w-[425px] ">
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
          className="gap-2 w-full sm:w-auto"
          disabled={!hasSufficientFunds || isPending}
          onClick={handlePayAll}
        >
          {isPending ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              <span className="hidden sm:inline">Processing...</span>
              <span className="sm:hidden">Processing</span>
            </>
          ) : (
            <>
              <Send className="h-4 w-4" />
              <span className="hidden sm:inline">Pay All Employees</span>
              <span className="sm:hidden">Pay All</span>
            </>
          )}
        </Button>
      </div>

      {/* Payroll History - FIXED TO USE BLOCKCHAIN DATA */}
      <Card>
        <CardHeader>
          <CardTitle className="text-black">Payroll History</CardTitle>
        </CardHeader>
        <CardContent>
          {history.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No payroll history yet. Execute your first payroll.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="min-w-[60px]">Run #</TableHead>
                    <TableHead className="min-w-[100px]">Date</TableHead>
                    <TableHead className="min-w-[70px]">Employees</TableHead>
                    <TableHead className="min-w-[100px]">
                      Total Amount
                    </TableHead>
                    <TableHead className="min-w-[80px]">Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {history.map((record) => (
                    <TableRow key={record!.id} className="text-black">
                      <TableCell className="font-medium">
                        #{record!.id}
                      </TableCell>
                      <TableCell className="whitespace-nowrap">
                        {record!.date.toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        })}
                      </TableCell>
                      <TableCell>{record!.employees}</TableCell>
                      <TableCell className="whitespace-nowrap">
                        $
                        {record!.amount.toLocaleString(undefined, {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}
                      </TableCell>
                      <TableCell>
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          {record!.completed ? "Completed" : "Pending"}
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
    </div>
  );
}
