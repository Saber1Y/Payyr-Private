// Daml EmployeeRegistry contract interactions
import { ContractRecord, damlClient } from "./client";
import { getTemplateId } from "./templateIds";

export const EMPLOYEE_REGISTRY_TEMPLATE =
  getTemplateId("Payyr.Private.EmployeeRegistry", "EmployeeProfile");
export const EMPLOYER_TEMPLATE =
  getTemplateId("Payyr.Private.EmployeeRegistry", "Employer");

export interface EmployeeProfile {
  employer: string;
  employee: string;
  name: string;
  salary: number;
  salaryCurrency: string;
  role: string;
  isActive: boolean;
  startDate: string;
  authorizedAuditors: string[];
}

export interface EmployeeWallet {
  employer: string;
  employee: string;
  balance: number;
  currency: string;
  lastPaidAt: string | null;
}

export interface Employer {
  employer: string;
}

export async function getEmployerContracts(
  employer: string,
  party?: string,
): Promise<ContractRecord<Employer>[]> {
  return damlClient.queryContracts<Employer>(EMPLOYER_TEMPLATE, { employer }, party);
}

export async function ensureEmployerContract(
  employer: string,
  party?: string,
): Promise<ContractRecord<Employer>> {
  const contracts = await getEmployerContracts(employer, party);

  if (contracts.length > 0) {
    return contracts[0];
  }

  return damlClient.createContract<Employer>(EMPLOYER_TEMPLATE, { employer }, party);
}

export async function registerEmployee(
  contractId: string,
  employee: string,
  name: string,
  salary: number,
  role: string,
  startDate: string,
  party?: string,
): Promise<{ contractId: string; payload: EmployeeProfile }> {
  return damlClient.exerciseChoice(
    EMPLOYER_TEMPLATE,
    contractId,
    "RegisterEmployee",
    { employee, name, salary, role, startDate },
    party,
  );
}

export async function updateEmployee(
  contractId: string,
  newName: string,
  newSalary: number,
  newRole: string,
  party?: string,
): Promise<{ contractId: string; payload: EmployeeProfile }> {
  return damlClient.exerciseChoice(
    EMPLOYEE_REGISTRY_TEMPLATE,
    contractId,
    "UpdateEmployee",
    { newName, newSalary, newRole },
    party,
  );
}

export async function deactivateEmployee(
  contractId: string,
  party?: string,
): Promise<{ contractId: string; payload: EmployeeProfile }> {
  return damlClient.exerciseChoice(
    EMPLOYEE_REGISTRY_TEMPLATE,
    contractId,
    "DeactivateEmployee",
    {},
    party,
  );
}

export async function activateEmployee(
  contractId: string,
  party?: string,
): Promise<{ contractId: string; payload: EmployeeProfile }> {
  return damlClient.exerciseChoice(
    EMPLOYEE_REGISTRY_TEMPLATE,
    contractId,
    "ActivateEmployee",
    {},
    party,
  );
}

export async function grantAuditorAccess(
  contractId: string,
  auditor: string,
  party?: string,
): Promise<{ contractId: string; payload: EmployeeProfile }> {
  return damlClient.exerciseChoice(
    EMPLOYEE_REGISTRY_TEMPLATE,
    contractId,
    "GrantAuditorAccess",
    { auditor },
    party,
  );
}

export async function revokeAuditorAccess(
  contractId: string,
  auditor: string,
  party?: string,
): Promise<{ contractId: string; payload: EmployeeProfile }> {
  return damlClient.exerciseChoice(
    EMPLOYEE_REGISTRY_TEMPLATE,
    contractId,
    "RevokeAuditorAccess",
    { auditor },
    party,
  );
}

export async function getEmployeesByEmployer(
  employer: string,
  party?: string,
): Promise<ContractRecord<EmployeeProfile>[]> {
  return damlClient.queryContracts<EmployeeProfile>(
    EMPLOYEE_REGISTRY_TEMPLATE,
    { employer },
    party,
  );
}

export async function getActiveEmployees(
  employer: string,
  party?: string,
): Promise<ContractRecord<EmployeeProfile>[]> {
  const employees = await getEmployeesByEmployer(employer, party);
  return employees.filter((emp) => emp.payload.isActive);
}

export const EMPLOYEE_WALLET_TEMPLATE =
  getTemplateId("Payyr.Private.EmployeeRegistry", "EmployeeWallet");

export async function getEmployeeWallets(
  employee: string,
  party?: string,
): Promise<ContractRecord<EmployeeWallet>[]> {
  return damlClient.queryContracts<EmployeeWallet>(EMPLOYEE_WALLET_TEMPLATE, {
    employee,
  }, party);
}
