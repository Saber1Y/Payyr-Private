import { formatUnits } from "viem";
import type { PayrollRun } from "@/types/contracts";

export default function formatBalance(balance: bigint | undefined): number {
  if (!balance) return 0;
  return Number(formatUnits(balance, 6));
}

export function formatPayroll(payroll: PayrollRun | null | undefined): {
  id: number;
  date: Date;
  amount: number;
  employees: number;
  completed: boolean;
} | null {
  if (!payroll) return null;

  return {
    id: payroll.id,
    date: new Date(payroll.timestamp),
    amount: Number(formatUnits(payroll.totalAmount, 6)),
    employees: payroll.employeeCount,
    completed: payroll.isCompleted,
  };
}
