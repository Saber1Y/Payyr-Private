// Type definitions for contract data structures

export interface PayrollRun {
  id: number;
  totalAmount: bigint;
  employeeCount: number;
  timestamp: number;
  isCompleted: boolean;
  employees?: string[];
}

export interface EmployeeData {
  address: string;
  name: string;
  salary: string;
  isActive: boolean;
  role: string;
  department?: string;
}

export interface FormattedPayrollData {
  id: number;
  date: Date;
  amount: number;
  employees: number;
  completed: boolean;
  timestamp?: number;
}

export interface ContractReadResult<T = unknown> {
  data?: T;
  error?: Error;
  isLoading: boolean;
  isSuccess: boolean;
  isError: boolean;
}

export type PayrollContractData = {
  currentPayrollId?: bigint;
  totalPayrollRuns?: bigint;
  contractBalance?: bigint;
  payrollRuns?: PayrollRun[];
};

export type EmployeeContractData = {
  employees?: EmployeeData[];
  employeeCount?: bigint;
  isActive?: boolean;
};