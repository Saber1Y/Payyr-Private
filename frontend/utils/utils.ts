import { formatUnits } from "viem";
import type { PayrollRun } from "@/types/contracts";

export default function formatBalance(balance: bigint | undefined): number {
  if (!balance) return 0;
  return Number(formatUnits(balance, 6));
}

export function formatPayroll(payroll: unknown): {
  id: number;
  date: Date;
  amount: number;
  employees: number;
  completed: boolean;
} | null {
  if (!payroll) return null;

  const payrollTuple = payroll as [
    bigint,
    string,
    bigint,
    bigint,
    bigint,
    string,
    boolean
  ];

  const [id, employer, timestamp, totalAmount, employeeCount, merkleRoot, isCompleted] = payrollTuple;

  return {
    id: Number(id),
    date: new Date(Number(timestamp) * 1000),
    amount: Number(formatUnits(totalAmount, 6)),
    employees: Number(employeeCount),
    completed: isCompleted,
  };
}
