import { useEffect, useState } from "react";
import { usePrivy } from "@privy-io/react-auth";

export interface VisibilityPermissions {
  canViewSalary: boolean;
  canViewPayroll: boolean;
  canViewAudit: boolean;
  role: "employer" | "employee" | "auditor" | "admin" | "public";
}

export function usePrivacyVisibility(
  employeeAddress?: string,
  payrollId?: number,
) {
  const { user } = usePrivy();
  const currentUser = user?.wallet?.address;
  const [permissions, setPermissions] = useState<VisibilityPermissions>({
    canViewSalary: false,
    canViewPayroll: false,
    canViewAudit: false,
    role: "public",
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!currentUser) {
      setLoading(false);
      return;
    }

    // Determine role and permissions based on current user
    // This would be enhanced with actual contract calls
    const determinePermissions = async () => {
      try {
        if (
          employeeAddress &&
          currentUser.toLowerCase() === employeeAddress.toLowerCase()
        ) {
          // User is viewing their own salary
          setPermissions({
            canViewSalary: true,
            canViewPayroll: true,
            canViewAudit: false,
            role: "employee",
          });
        } else {
          // Check if user is employer or auditor via contract calls
          setPermissions({
            canViewSalary: false,
            canViewPayroll: false,
            canViewAudit: false,
            role: "public",
          });
        }
      } catch (error) {
        console.error("Error determining permissions:", error);
      } finally {
        setLoading(false);
      }
    };

    determinePermissions();
  }, [currentUser, employeeAddress, payrollId]);

  return { permissions, loading };
}

/**
 * Format salary display based on visibility permissions
 */
export function formatSalaryDisplay(
  salary: number | undefined,
  canViewSalary: boolean,
): string {
  if (!canViewSalary || salary === undefined) {
    return "••••• (hidden)";
  }
  return `$${salary.toLocaleString()}`;
}

/**
 * Determine visibility message for UI
 */
export function getVisibilityMessage(
  role: string,
  resourceType: "salary" | "payroll" | "batch",
): string {
  const messages: Record<string, Record<string, string>> = {
    salary: {
      employer: "You can see all employee salaries",
      employee: "You can only see your own salary",
      auditor: "You can see salaries for audited records",
      public: "Salary information is private",
    },
    payroll: {
      employer: "You can see your full payroll batch",
      employee: "You can only see your own payment",
      auditor: "You can see payroll batches with access",
      public: "You do not have permission to view this payroll batch",
    },
    batch: {
      employer: "You can manage your payroll batches",
      employee: "You can view your payment records",
      auditor: "You can audit approved payroll batches",
      public: "This resource is not publicly visible",
    },
  };

  return messages[resourceType]?.[role] || "Access restricted";
}
