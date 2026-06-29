/**
 * Contract Visibility Helper Functions
 * Provides utility functions for checking data visibility in Payyr Private
 * These functions help determine what data a user can access based on their role
 */

export type UserRole = 'employer' | 'employee' | 'auditor' | 'admin' | 'public';

/**
 * Represents the visibility result for a piece of data
 */
export interface VisibilityResult {
  isVisible: boolean;
  reason: string;
  role: UserRole;
}

/**
 * Represents user context for visibility checks
 */
export interface UserContext {
  address: string;
  isAdmin: boolean;
  isEmployer: boolean;
  isEmployee: boolean;
  role: UserRole;
}

/**
 * Represents payroll context for visibility checks
 */
export interface PayrollContext {
  payrollId: number;
  employerAddress: string;
  employees: string[];
  auditorAddresses: string[];
  isPrivate: boolean;
}

/**
 * Check if a user can view a payroll batch
 */
export function canViewPayrollBatch(
  user: UserContext,
  payroll: PayrollContext
): VisibilityResult {
  // Employer can always see their own payroll
  if (user.address.toLowerCase() === payroll.employerAddress.toLowerCase()) {
    return {
      isVisible: true,
      reason: 'You are the payroll employer',
      role: 'employer',
    };
  }

  // Admin can see all payroll
  if (user.isAdmin) {
    return {
      isVisible: true,
      reason: 'You have admin access',
      role: 'admin',
    };
  }

  // Auditor can see if they have access
  if (
    payroll.auditorAddresses.some(
      (addr) => addr.toLowerCase() === user.address.toLowerCase()
    )
  ) {
    return {
      isVisible: true,
      reason: 'You have been granted auditor access',
      role: 'auditor',
    };
  }

  // Public cannot see private payroll
  if (payroll.isPrivate) {
    return {
      isVisible: false,
      reason: 'This payroll batch is private',
      role: 'public',
    };
  }

  return {
    isVisible: false,
    reason: 'You do not have permission to view this payroll batch',
    role: 'public',
  };
}

/**
 * Check if a user can view an employee's salary
 */
export function canViewSalary(
  viewer: UserContext,
  targetEmployee: string,
  employerAddress: string
): VisibilityResult {
  // Employee can see their own salary
  if (viewer.address.toLowerCase() === targetEmployee.toLowerCase()) {
    return {
      isVisible: true,
      reason: 'This is your salary information',
      role: 'employee',
    };
  }

  // Employer can see all employee salaries
  if (viewer.address.toLowerCase() === employerAddress.toLowerCase()) {
    return {
      isVisible: true,
      reason: 'You can see all employee salaries',
      role: 'employer',
    };
  }

  // Admin can see all salaries
  if (viewer.isAdmin) {
    return {
      isVisible: true,
      reason: 'You have admin access',
      role: 'admin',
    };
  }

  // Other employees cannot see each other's salaries
  return {
    isVisible: false,
    reason: 'You cannot view other employees\' salary information',
    role: 'employee',
  };
}

/**
 * Check if a user can view a specific employee's payment in a payroll batch
 */
export function canViewEmployeePayment(
  viewer: UserContext,
  employee: string,
  payroll: PayrollContext
): VisibilityResult {
  // Employee can see their own payment
  if (viewer.address.toLowerCase() === employee.toLowerCase()) {
    return {
      isVisible: true,
      reason: 'This is your payment',
      role: 'employee',
    };
  }

  // Employer can see all employee payments
  if (viewer.address.toLowerCase() === payroll.employerAddress.toLowerCase()) {
    return {
      isVisible: true,
      reason: 'You can see all employee payments',
      role: 'employer',
    };
  }

  // Admin can see all payments
  if (viewer.isAdmin) {
    return {
      isVisible: true,
      reason: 'You have admin access',
      role: 'admin',
    };
  }

  // Auditors with access can see employee payments
  if (
    payroll.auditorAddresses.some(
      (addr) => addr.toLowerCase() === viewer.address.toLowerCase()
    )
  ) {
    return {
      isVisible: true,
      reason: 'You have auditor access to this payroll batch',
      role: 'auditor',
    };
  }

  return {
    isVisible: false,
    reason: 'You cannot view this payment',
    role: 'public',
  };
}

/**
 * Check if a user can manage auditor access for a payroll batch
 */
export function canManageAuditors(
  user: UserContext,
  payroll: PayrollContext
): VisibilityResult {
  // Only the employer can manage auditors for their payroll
  if (user.address.toLowerCase() === payroll.employerAddress.toLowerCase()) {
    return {
      isVisible: true,
      reason: 'You can manage auditor access for your payroll',
      role: 'employer',
    };
  }

  // Admin can manage all auditor access
  if (user.isAdmin) {
    return {
      isVisible: true,
      reason: 'You have admin access',
      role: 'admin',
    };
  }

  return {
    isVisible: false,
    reason: 'Only the payroll employer can manage auditor access',
    role: 'public',
  };
}

/**
 * Get visibility message for UI display
 */
export function getVisibilityMessage(role: UserRole, resourceType: string): string {
  const messages: Record<UserRole, Record<string, string>> = {
    employer: {
      payroll: 'You can see all payroll details',
      salary: 'You can see all employee salaries',
      payment: 'You can see all employee payments',
      auditor: 'You can manage auditor access',
    },
    employee: {
      payroll: 'You can only see your own payroll data',
      salary: 'You can only see your own salary',
      payment: 'You can only see your own payments',
      auditor: 'You cannot manage auditor access',
    },
    auditor: {
      payroll: 'You can see authorized payroll batches',
      salary: 'You cannot see salary information',
      payment: 'You can see payments you have access to',
      auditor: 'You cannot manage auditor access',
    },
    admin: {
      payroll: 'You can see all payroll batches',
      salary: 'You can see all salaries',
      payment: 'You can see all payments',
      auditor: 'You can manage all auditor access',
    },
    public: {
      payroll: 'You do not have permission to view this payroll batch',
      salary: 'Salary information is private',
      payment: 'You do not have permission to view this payment',
      auditor: 'You do not have permission to manage auditor access',
    },
  };

  return messages[role]?.[resourceType] || 'Access restricted';
}

/**
 * Format data for display based on visibility
 */
export function formatForDisplay(
  value: string | number | undefined,
  isVisible: boolean,
  placeholder: string = '••••• (hidden)'
): string {
  if (!isVisible || value === undefined) {
    return placeholder;
  }

  if (typeof value === 'number') {
    return formatPayrollAmount(
      Number(value.toFixed(2)),
    );
  }

  return value;
}

/**
 * Get privacy status summary for UI
 */
export interface PrivacyStatus {
  payrollPrivacy: 'private' | 'public';
  salaryVisibility: 'hidden' | 'visible';
  auditorAccessLevel: 'controlled' | 'public' | 'none';
  publicExposure: 'none' | 'minimal' | 'full';
}

export function getPrivacyStatus(user: UserContext, payroll: PayrollContext): PrivacyStatus {
  return {
    payrollPrivacy: payroll.isPrivate ? 'private' : 'public',
    salaryVisibility:
      user.role === 'employer' || user.role === 'admin' ? 'visible' : 'hidden',
    auditorAccessLevel:
      payroll.auditorAddresses.length > 0 ? 'controlled' : 'none',
    publicExposure:
      user.role === 'public' || payroll.isPrivate ? 'none' : 'minimal',
  };
}
import { formatPayrollAmount } from "./payrollCurrency";
