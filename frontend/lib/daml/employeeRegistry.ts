// Daml EmployeeRegistry contract interactions
import { damlClient } from "./client";

export const EMPLOYEE_REGISTRY_TEMPLATE =
  "Payyr.Private.EmployeeRegistry:EmployeeProfile";
export const EMPLOYER_TEMPLATE = "Payyr.Private.EmployeeRegistry:Employer";

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

// Register a new employee
export async function registerEmployee(
  contractId: string,
  employee: string,
  name: string,
  salary: number,
  role: string,
  startDate: string,
): Promise<{ contractId: string; payload: EmployeeProfile }> {
  return damlClient.exerciseChoice(contractId, "RegisterEmployee", {
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
  return damlClient.exerciseChoice(contractId, "UpdateEmployee", {
    newName,
    newSalary,
    newRole,
  });
}

// Deactivate employee
export async function deactivateEmployee(
  contractId: string,
): Promise<{ contractId: string; payload: EmployeeProfile }> {
  return damlClient.exerciseChoice(contractId, "DeactivateEmployee", {});
}

// Activate employee
export async function activateEmployee(
  contractId: string,
): Promise<{ contractId: string; payload: EmployeeProfile }> {
  return damlClient.exerciseChoice(contractId, "ActivateEmployee", {});
}

// Grant auditor access
export async function grantAuditorAccess(
  contractId: string,
  auditor: string,
): Promise<{ contractId: string; payload: EmployeeProfile }> {
  return damlClient.exerciseChoice(contractId, "GrantAuditorAccess", {
    auditor,
  });
}

// Revoke auditor access
export async function revokeAuditorAccess(
  contractId: string,
  auditor: string,
): Promise<{ contractId: string; payload: EmployeeProfile }> {
  return damlClient.exerciseChoice(contractId, "RevokeAuditorAccess", {
    auditor,
  });
}

// Query all employees for an employer
export async function getEmployeesByEmployer(
  employer: string,
): Promise<Array<{ contractId: string; payload: EmployeeProfile }>> {
  return damlClient.queryContracts<EmployeeProfile>(
    EMPLOYEE_REGISTRY_TEMPLATE,
    { employer },
  );
}

// Query active employees only
export async function getActiveEmployees(
  employer: string,
): Promise<Array<{ contractId: string; payload: EmployeeProfile }>> {
  const employees = await getEmployeesByEmployer(employer);
  return employees.filter((emp) => emp.payload.isActive);
}
