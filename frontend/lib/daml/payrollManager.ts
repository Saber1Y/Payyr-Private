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
  party?: string,
): Promise<ContractRecord<PayrollManager>[]> {
  return damlClient.queryContracts<PayrollManager>(PAYROLL_MANAGER_TEMPLATE, {
    admin,
  }, party);
}

export async function getEmployerBalances(
  employer: string,
  party?: string,
): Promise<ContractRecord<EmployerBalance>[]> {
  return damlClient.queryContracts<EmployerBalance>(EMPLOYER_BALANCE_TEMPLATE, {
    employer,
  }, party);
}

export async function ensurePayrollManagerContract(
  admin: string,
  party?: string,
): Promise<ContractRecord<PayrollManager>> {
  const contracts = await getPayrollManagerContracts(admin, party);

  if (contracts.length > 0) {
    return contracts[0];
  }

  return damlClient.createContract<PayrollManager>(PAYROLL_MANAGER_TEMPLATE, {
    admin,
    currentPayrollId: 0,
  }, party);
}

export async function createPayrollRun(
  contractId: string,
  employer: string,
  employeeProfiles: unknown[],
  timestamp: string,
  party?: string,
): Promise<{ contractId: string; payload: PayrollRun }> {
  return damlClient.exerciseChoice(
    PAYROLL_MANAGER_TEMPLATE,
    contractId,
    "CreatePayrollRun",
    { employer, employeeProfiles, timestamp },
    party,
  );
}

export async function grantAuditorAccessPayroll(
  contractId: string,
  auditor: string,
  party?: string,
): Promise<{ contractId: string; payload: PayrollRun }> {
  return damlClient.exerciseChoice(
    PAYROLL_RUN_TEMPLATE,
    contractId,
    "GrantAuditorAccess",
    { auditor },
    party,
  );
}

export async function revokeAuditorAccessPayroll(
  contractId: string,
  auditor: string,
  party?: string,
): Promise<{ contractId: string; payload: PayrollRun }> {
  return damlClient.exerciseChoice(
    PAYROLL_RUN_TEMPLATE,
    contractId,
    "RevokeAuditorAccess",
    { auditor },
    party,
  );
}

export async function makePayrollPublic(
  contractId: string,
  party?: string,
): Promise<{ contractId: string; payload: PayrollRun }> {
  return damlClient.exerciseChoice(
    PAYROLL_RUN_TEMPLATE,
    contractId,
    "MakePayrollPublic",
    {},
    party,
  );
}

export async function issueEmployeePayment(
  contractId: string,
  employee: string,
  amount: number,
  party?: string,
): Promise<{ contractId: string; payload: EmployeePayment }> {
  return damlClient.exerciseChoice(
    PAYROLL_RUN_TEMPLATE,
    contractId,
    "IssueEmployeePayment",
    { employee, amount },
    party,
  );
}

export async function claimPayment(
  contractId: string,
  party?: string,
): Promise<{ contractId: string; payload: EmployeePayment }> {
  return damlClient.exerciseChoice(
    EMPLOYEE_PAYMENT_TEMPLATE,
    contractId,
    "Claim",
    {},
    party,
  );
}

export async function withdrawPayroll(
  contractId: string,
  employer: string,
  amount: number,
  party?: string,
): Promise<ContractRecord<EmployerBalance>> {
  return damlClient.exerciseChoice(
    PAYROLL_MANAGER_TEMPLATE,
    contractId,
    "WithdrawPayroll",
    { employer, amount },
    party,
  );
}

export async function getPayrollsByEmployer(
  employer: string,
  party?: string,
): Promise<ContractRecord<PayrollRun>[]> {
  return damlClient.queryContracts<PayrollRun>(PAYROLL_RUN_TEMPLATE, {
    employer,
  }, party);
}

export async function getVisiblePayrolls(
  party?: string,
): Promise<ContractRecord<PayrollRun>[]> {
  return damlClient.queryContracts<PayrollRun>(PAYROLL_RUN_TEMPLATE, {}, party);
}

export async function getEmployeePayments(
  employee: string,
  party?: string,
): Promise<ContractRecord<EmployeePayment>[]> {
  return damlClient.queryContracts<EmployeePayment>(EMPLOYEE_PAYMENT_TEMPLATE, {
    employee,
  }, party);
}

export async function getUnclaimedPayments(
  employee: string,
  party?: string,
): Promise<ContractRecord<EmployeePayment>[]> {
  const payments = await getEmployeePayments(employee, party);
  return payments.filter((payment) => !payment.payload.claimed);
}
