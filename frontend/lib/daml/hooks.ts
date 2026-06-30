// React hooks for Daml contract interactions
"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import * as employeeRegistry from "./employeeRegistry";
import * as payrollManager from "./payrollManager";

// Hook to query employees by employer
export function useEmployeesByEmployer(employer: string) {
  return useQuery({
    queryKey: ["employees", employer],
    queryFn: () => employeeRegistry.getEmployeesByEmployer(employer),
    enabled: !!employer,
  });
}

// Hook to query active employees
export function useActiveEmployees(employer: string) {
  return useQuery({
    queryKey: ["activeEmployees", employer],
    queryFn: () => employeeRegistry.getActiveEmployees(employer),
    enabled: !!employer,
  });
}

// Hook to query employer contracts
export function useEmployerContracts(employer: string) {
  return useQuery({
    queryKey: ["employerContracts", employer],
    queryFn: () => employeeRegistry.getEmployerContracts(employer),
    enabled: !!employer,
  });
}

// Hook to register an employee
export function useRegisterEmployee() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: {
      contractId: string;
      employee: string;
      name: string;
      salary: number;
      role: string;
      startDate: string;
    }) =>
      employeeRegistry.registerEmployee(
        data.contractId,
        data.employee,
        data.name,
        data.salary,
        data.role,
        data.startDate,
      ),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["employees"] });
      queryClient.invalidateQueries({ queryKey: ["activeEmployees"] });
    },
  });
}

// Hook to update an employee
export function useUpdateEmployee() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: {
      contractId: string;
      newName: string;
      newSalary: number;
      newRole: string;
    }) =>
      employeeRegistry.updateEmployee(
        data.contractId,
        data.newName,
        data.newSalary,
        data.newRole,
      ),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["employees"] });
    },
  });
}

// Hook to deactivate an employee
export function useDeactivateEmployee() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (contractId: string) =>
      employeeRegistry.deactivateEmployee(contractId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["employees"] });
      queryClient.invalidateQueries({ queryKey: ["activeEmployees"] });
    },
  });
}

// Hook to activate an employee
export function useActivateEmployee() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (contractId: string) =>
      employeeRegistry.activateEmployee(contractId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["employees"] });
      queryClient.invalidateQueries({ queryKey: ["activeEmployees"] });
    },
  });
}

// Hook to query payrolls by employer
export function usePayrollsByEmployer(employer: string) {
  return useQuery({
    queryKey: ["payrolls", employer],
    queryFn: () => payrollManager.getPayrollsByEmployer(employer),
    enabled: !!employer,
  });
}

// Hook to query payroll manager contracts
export function usePayrollManagerContracts(admin: string) {
  return useQuery({
    queryKey: ["payrollManagers", admin],
    queryFn: () => payrollManager.getPayrollManagerContracts(admin),
    enabled: !!admin,
  });
}

export function useEmployerBalances(employer: string) {
  return useQuery({
    queryKey: ["employerBalances", employer],
    queryFn: () => payrollManager.getEmployerBalances(employer),
    enabled: !!employer,
  });
}

// Hook to create a payroll run
export function useCreatePayrollRun() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: {
      contractId: string;
      employer: string;
      employeeProfiles: unknown[];
      timestamp: string;
    }) =>
      payrollManager.createPayrollRun(
        data.contractId,
        data.employer,
        data.employeeProfiles,
        data.timestamp,
      ),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["payrolls"] });
      queryClient.invalidateQueries({ queryKey: ["payments"] });
      queryClient.invalidateQueries({ queryKey: ["employeeWallets"] });
      queryClient.invalidateQueries({ queryKey: ["employerBalances"] });
    },
  });
}

// Hook to grant payroll auditor access
export function useGrantPayrollAuditorAccess() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: { contractId: string; auditor: string }) =>
      payrollManager.grantAuditorAccessPayroll(data.contractId, data.auditor),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["payrolls"] });
    },
  });
}

// Hook to revoke payroll auditor access
export function useRevokePayrollAuditorAccess() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: { contractId: string; auditor: string }) =>
      payrollManager.revokeAuditorAccessPayroll(data.contractId, data.auditor),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["payrolls"] });
    },
  });
}

// Hook to claim payment
export function useClaimPayment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (contractId: string) => payrollManager.claimPayment(contractId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["payments"] });
    },
  });
}

export function useFundEmployerBalance() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: {
      contractId: string;
      employer: string;
      amount: number;
    }) =>
      payrollManager.withdrawPayroll(
        data.contractId,
        data.employer,
        data.amount,
      ),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["employerBalances"] });
      queryClient.invalidateQueries({ queryKey: ["payrolls"] });
    },
  });
}

// Hook to query all employee payments
export function useEmployeePayments(employee: string) {
  return useQuery({
    queryKey: ["payments", employee],
    queryFn: () => payrollManager.getEmployeePayments(employee),
    enabled: !!employee,
  });
}

// Hook to query unclaimed payments
export function useUnclaimedPayments(employee: string) {
  return useQuery({
    queryKey: ["unclaimedPayments", employee],
    queryFn: () => payrollManager.getUnclaimedPayments(employee),
    enabled: !!employee,
  });
}

export function useEmployeeWallets(employee: string) {
  return useQuery({
    queryKey: ["employeeWallets", employee],
    queryFn: () => employeeRegistry.getEmployeeWallets(employee),
    enabled: !!employee,
  });
}
