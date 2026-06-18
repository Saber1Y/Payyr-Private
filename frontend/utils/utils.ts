import type { PayrollRun } from "@/types/contracts";

function fromLedgerAmount(value: bigint | number | string | undefined): number {
  if (value === undefined) {
    return 0;
  }

  if (typeof value === "bigint") {
    return Number(value) / 1_000_000;
  }

  return Number(value);
}

export default function formatBalance(balance: bigint | undefined): number {
  if (!balance) return 0;
  return fromLedgerAmount(balance);
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
    amount: fromLedgerAmount(totalAmount),
    employees: Number(employeeCount),
    completed: isCompleted,
  };
}
