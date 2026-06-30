// Daml PayrollManager contract interactions
import { ContractRecord, damlClient } from "./client";
import { getTemplateId } from "./templateIds";

export const PAYROLL_RUN_TEMPLATE =
  getTemplateId("Payyr.Private.PayrollManager", "PayrollRun");
export const EMPLOYEE_PAYMENT_TEMPLATE =
  getTemplateId("Payyr.Private.PayrollManager", "EmployeePayment");
export const PAYROLL_MANAGER_TEMPLATE =
  getTemplateId("Payyr.Private.PayrollManager", "PayrollManager");
export const EMPLOYER_BALANCE_TEMPLATE =
  getTemplateId("Payyr.Private.PayrollManager", "EmployerBalance");

export interface PayrollRun {
  employer: string;
  payrollId: number;
  timestamp: string;
  totalAmount: number;
  paymentCurrency: string;
  employeeCount: number;
  isCompleted: boolean;
  authorizedAuditors: string[];
  isPublic: boolean;
}

export interface EmployeePayment {
  payrollId: number;
  employer: string;
  employee: string;
  amount: number;
  paymentCurrency: string;
  claimed: boolean;
  settled: boolean;
  issuedAt: string;
  claimedAt: string | null;
  settledAt: string | null;
  receiptReference: string;
}

export interface PayrollManager {
  admin: string;
  currentPayrollId: number;
}

export interface EmployerBalance {
  employer: string;
  balance: number;
  currency: string;
}

export async function getPayrollManagerContracts(
  admin: string,
): Promise<ContractRecord<PayrollManager>[]> {
  return damlClient.queryContracts<PayrollManager>(PAYROLL_MANAGER_TEMPLATE, {
    admin,
  });
}

export async function getEmployerBalances(
  employer: string,
): Promise<ContractRecord<EmployerBalance>[]> {
  return damlClient.queryContracts<EmployerBalance>(EMPLOYER_BALANCE_TEMPLATE, {
    employer,
  });
}

export async function ensurePayrollManagerContract(
  admin: string,
): Promise<ContractRecord<PayrollManager>> {
  const contracts = await getPayrollManagerContracts(admin);

  if (contracts.length > 0) {
    return contracts[0];
  }

  return damlClient.createContract<PayrollManager>(PAYROLL_MANAGER_TEMPLATE, {
    admin,
    currentPayrollId: 0,
  });
}

// Create a new payroll run
export async function createPayrollRun(
  contractId: string,
  employer: string,
  employeeProfiles: unknown[],
  timestamp: string,
): Promise<{ contractId: string; payload: PayrollRun }> {
  return damlClient.exerciseChoice(
    PAYROLL_MANAGER_TEMPLATE,
    contractId,
    "CreatePayrollRun",
    {
      employer,
      employeeProfiles,
      timestamp,
    },
  );
}

// Grant auditor access to payroll
export async function grantAuditorAccessPayroll(
  contractId: string,
  auditor: string,
): Promise<{ contractId: string; payload: PayrollRun }> {
  return damlClient.exerciseChoice(
    PAYROLL_RUN_TEMPLATE,
    contractId,
    "GrantAuditorAccess",
    {
      auditor,
    },
  );
}

// Revoke auditor access to payroll
export async function revokeAuditorAccessPayroll(
  contractId: string,
  auditor: string,
): Promise<{ contractId: string; payload: PayrollRun }> {
  return damlClient.exerciseChoice(
    PAYROLL_RUN_TEMPLATE,
    contractId,
    "RevokeAuditorAccess",
    {
      auditor,
    },
  );
}

// Make payroll public
export async function makePayrollPublic(
  contractId: string,
): Promise<{ contractId: string; payload: PayrollRun }> {
  return damlClient.exerciseChoice(
    PAYROLL_RUN_TEMPLATE,
    contractId,
    "MakePayrollPublic",
    {},
  );
}

// Issue employee payment
export async function issueEmployeePayment(
  contractId: string,
  employee: string,
  amount: number,
): Promise<{ contractId: string; payload: EmployeePayment }> {
  return damlClient.exerciseChoice(
    PAYROLL_RUN_TEMPLATE,
    contractId,
    "IssueEmployeePayment",
    {
      employee,
      amount,
    },
  );
}

// Claim payment
export async function claimPayment(
  contractId: string,
): Promise<{ contractId: string; payload: EmployeePayment }> {
  return damlClient.exerciseChoice(
    EMPLOYEE_PAYMENT_TEMPLATE,
    contractId,
    "Claim",
    {},
  );
}

// Withdraw payroll
export async function withdrawPayroll(
  contractId: string,
  employer: string,
  amount: number,
): Promise<ContractRecord<EmployerBalance>> {
  return damlClient.exerciseChoice(
    PAYROLL_MANAGER_TEMPLATE,
    contractId,
    "WithdrawPayroll",
    {
      employer,
      amount,
    },
  );
}

// Query payroll runs for an employer
export async function getPayrollsByEmployer(
  employer: string,
): Promise<ContractRecord<PayrollRun>[]> {
  return damlClient.queryContracts<PayrollRun>(PAYROLL_RUN_TEMPLATE, {
    employer,
  });
}

// Query employee payments
export async function getEmployeePayments(
  employee: string,
): Promise<ContractRecord<EmployeePayment>[]> {
  return damlClient.queryContracts<EmployeePayment>(EMPLOYEE_PAYMENT_TEMPLATE, {
    employee,
  });
}

// Query unclaimed payments
export async function getUnclaimedPayments(
  employee: string,
): Promise<ContractRecord<EmployeePayment>[]> {
  const payments = await getEmployeePayments(employee);
  return payments.filter((payment) => !payment.payload.claimed);
}
