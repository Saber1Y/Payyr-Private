// React hooks for Daml contract interactions
"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import * as employeeRegistry from "./employeeRegistry";
import * as payrollManager from "./payrollManager";

export function useEmployeesByEmployer(employer: string) {
  return useQuery({
    queryKey: ["employees", employer],
    queryFn: () => employeeRegistry.getEmployeesByEmployer(employer, employer),
    enabled: !!employer,
  });
}

export function useActiveEmployees(employer: string) {
  return useQuery({
    queryKey: ["activeEmployees", employer],
    queryFn: () => employeeRegistry.getActiveEmployees(employer, employer),
    enabled: !!employer,
  });
}

export function useEmployerContracts(employer: string) {
  return useQuery({
    queryKey: ["employerContracts", employer],
    queryFn: () => employeeRegistry.getEmployerContracts(employer, employer),
    enabled: !!employer,
  });
}

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
      party: string;
    }) =>
      employeeRegistry.registerEmployee(
        data.contractId,
        data.employee,
        data.name,
        data.salary,
        data.role,
        data.startDate,
        data.party,
      ),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["employees"] });
      queryClient.invalidateQueries({ queryKey: ["activeEmployees"] });
    },
  });
}

export function useUpdateEmployee() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: {
      contractId: string;
      newName: string;
      newSalary: number;
      newRole: string;
      party: string;
    }) =>
      employeeRegistry.updateEmployee(
        data.contractId,
        data.newName,
        data.newSalary,
        data.newRole,
        data.party,
      ),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["employees"] });
    },
  });
}

export function useDeactivateEmployee() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: { contractId: string; party: string }) =>
      employeeRegistry.deactivateEmployee(data.contractId, data.party),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["employees"] });
      queryClient.invalidateQueries({ queryKey: ["activeEmployees"] });
    },
  });
}

export function useActivateEmployee() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: { contractId: string; party: string }) =>
      employeeRegistry.activateEmployee(data.contractId, data.party),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["employees"] });
      queryClient.invalidateQueries({ queryKey: ["activeEmployees"] });
    },
  });
}

export function usePayrollsByEmployer(employer: string) {
  return useQuery({
    queryKey: ["payrolls", employer],
    queryFn: () => payrollManager.getPayrollsByEmployer(employer, employer),
    enabled: !!employer,
  });
}

export function useVisiblePayrolls(enabled = true) {
  return useQuery({
    queryKey: ["visiblePayrolls"],
    queryFn: () => payrollManager.getVisiblePayrolls(),
    enabled,
  });
}

export function usePayrollManagerContracts(admin: string) {
  return useQuery({
    queryKey: ["payrollManagers", admin],
    queryFn: () => payrollManager.getPayrollManagerContracts(admin, admin),
    enabled: !!admin,
  });
}

export function useEmployerBalances(employer: string) {
  return useQuery({
    queryKey: ["employerBalances", employer],
    queryFn: () => payrollManager.getEmployerBalances(employer, employer),
    enabled: !!employer,
  });
}

export function useCreatePayrollRun() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: {
      contractId: string;
      employer: string;
      employeeProfiles: unknown[];
      timestamp: string;
      party: string;
    }) =>
      payrollManager.createPayrollRun(
        data.contractId,
        data.employer,
        data.employeeProfiles,
        data.timestamp,
        data.party,
      ),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["payrolls"] });
      queryClient.invalidateQueries({ queryKey: ["payments"] });
      queryClient.invalidateQueries({ queryKey: ["employeeWallets"] });
      queryClient.invalidateQueries({ queryKey: ["employerBalances"] });
    },
  });
}

export function useGrantPayrollAuditorAccess() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: { contractId: string; auditor: string; party: string }) =>
      payrollManager.grantAuditorAccessPayroll(data.contractId, data.auditor, data.party),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["payrolls"] });
    },
  });
}

export function useRevokePayrollAuditorAccess() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: { contractId: string; auditor: string; party: string }) =>
      payrollManager.revokeAuditorAccessPayroll(data.contractId, data.auditor, data.party),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["payrolls"] });
    },
  });
}

export function useClaimPayment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: { contractId: string; party: string }) =>
      payrollManager.claimPayment(data.contractId, data.party),
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
      party: string;
    }) =>
      payrollManager.withdrawPayroll(
        data.contractId,
        data.employer,
        data.amount,
        data.party,
      ),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["employerBalances"] });
      queryClient.invalidateQueries({ queryKey: ["payrolls"] });
    },
  });
}

export function useEmployeePayments(employee: string) {
  return useQuery({
    queryKey: ["payments", employee],
    queryFn: () => payrollManager.getEmployeePayments(employee, employee),
    enabled: !!employee,
  });
}

export function useUnclaimedPayments(employee: string) {
  return useQuery({
    queryKey: ["unclaimedPayments", employee],
    queryFn: () => payrollManager.getUnclaimedPayments(employee, employee),
    enabled: !!employee,
  });
}

export function useEmployeeWallets(employee: string) {
  return useQuery({
    queryKey: ["employeeWallets", employee],
    queryFn: () => employeeRegistry.getEmployeeWallets(employee, employee),
    enabled: !!employee,
  });
}
