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
  role: string;
  isActive: boolean;
  startDate: string;
  authorizedAuditors: string[];
}

export interface Employer {
  employer: string;
}

export async function getEmployerContracts(
  employer: string,
): Promise<ContractRecord<Employer>[]> {
  return damlClient.queryContracts<Employer>(EMPLOYER_TEMPLATE, { employer });
}

export async function ensureEmployerContract(
  employer: string,
): Promise<ContractRecord<Employer>> {
  const contracts = await getEmployerContracts(employer);

  if (contracts.length > 0) {
    return contracts[0];
  }

  return damlClient.createContract<Employer>(EMPLOYER_TEMPLATE, { employer });
}

// Register a new employee
export async function registerEmployee(
  contractId: string,
  employee: string,
  name: string,
  salary: number,
  role: string,
  startDate: string,
): Promise<{ contractId: string; payload: EmployeeProfile }> {
  return damlClient.exerciseChoice(EMPLOYER_TEMPLATE, contractId, "RegisterEmployee", {
    employee,
    name,
    salary,
    role,
    startDate,
  });
}

// Update employee details
export async function updateEmployee(
  contractId: string,
  newName: string,
  newSalary: number,
  newRole: string,
): Promise<{ contractId: string; payload: EmployeeProfile }> {
  return damlClient.exerciseChoice(
    EMPLOYEE_REGISTRY_TEMPLATE,
    contractId,
    "UpdateEmployee",
    {
    newName,
    newSalary,
    newRole,
    },
  );
}

// Deactivate employee
export async function deactivateEmployee(
  contractId: string,
): Promise<{ contractId: string; payload: EmployeeProfile }> {
  return damlClient.exerciseChoice(
    EMPLOYEE_REGISTRY_TEMPLATE,
    contractId,
    "DeactivateEmployee",
    {},
  );
}

// Activate employee
export async function activateEmployee(
  contractId: string,
): Promise<{ contractId: string; payload: EmployeeProfile }> {
  return damlClient.exerciseChoice(
    EMPLOYEE_REGISTRY_TEMPLATE,
    contractId,
    "ActivateEmployee",
    {},
  );
}

// Grant auditor access
export async function grantAuditorAccess(
  contractId: string,
  auditor: string,
): Promise<{ contractId: string; payload: EmployeeProfile }> {
  return damlClient.exerciseChoice(
    EMPLOYEE_REGISTRY_TEMPLATE,
    contractId,
    "GrantAuditorAccess",
    {
      auditor,
    },
  );
}

// Revoke auditor access
export async function revokeAuditorAccess(
  contractId: string,
  auditor: string,
): Promise<{ contractId: string; payload: EmployeeProfile }> {
  return damlClient.exerciseChoice(
    EMPLOYEE_REGISTRY_TEMPLATE,
    contractId,
    "RevokeAuditorAccess",
    {
      auditor,
    },
  );
}

// Query all employees for an employer
export async function getEmployeesByEmployer(
  employer: string,
): Promise<ContractRecord<EmployeeProfile>[]> {
  return damlClient.queryContracts<EmployeeProfile>(
    EMPLOYEE_REGISTRY_TEMPLATE,
    { employer },
  );
}

// Query active employees only
export async function getActiveEmployees(
  employer: string,
): Promise<ContractRecord<EmployeeProfile>[]> {
  const employees = await getEmployeesByEmployer(employer);
  return employees.filter((emp) => emp.payload.isActive);
}
