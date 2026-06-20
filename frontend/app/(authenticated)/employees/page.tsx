"use client";

export const dynamic = "force-dynamic";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Plus,
  Edit,
  UserX,
  UserCheck,
  Loader2,
  AlertCircle,
} from "lucide-react";
import { usePrivy } from "@privy-io/react-auth";
import {
  useEmployeesByEmployer,
  useRegisterEmployee,
  useUpdateEmployee,
  useDeactivateEmployee,
  useActivateEmployee,
} from "@/lib/daml/hooks";
import { ContractRecord, damlClient } from "@/lib/daml/client";
import { ensureEmployerContract } from "@/lib/daml/employeeRegistry";
import type { Employer } from "@/lib/daml/employeeRegistry";
import { resolveDamlParty } from "@/lib/daml/partyMapper";
import { useDamlParty } from "@/hooks/useDamlParty";

interface FormData {
  name: string;
  employee: string;
  salary: string;
  role: string;
  startDate: string;
}

export default function EmployeesPage() {
  const { ready, authenticated } = usePrivy();
  const { walletAddress, damlParty: employerParty, hasMappedParty } =
    useDamlParty();

  useEffect(() => {
    damlClient.setParty(employerParty);
  }, [employerParty]);

  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingContractId, setEditingContractId] = useState<string | null>(
    null,
  );
  const [formData, setFormData] = useState<FormData>({
    name: "",
    employee: "",
    salary: "",
    role: "",
    startDate: new Date().toISOString().split("T")[0],
  });

  // Fetch employees for this employer
  const {
    data: employees,
    isLoading,
    error,
  } = useEmployeesByEmployer(employerParty);

  // Mutations
  const { mutate: registerEmployee, isPending: isRegisterPending } =
    useRegisterEmployee();
  const { mutate: updateEmployee, isPending: isUpdatePending } =
    useUpdateEmployee();
  const { mutate: deactivateEmployee, isPending: isDeactivatePending } =
    useDeactivateEmployee();
  const { mutate: activateEmployee, isPending: isActivatePending } =
    useActivateEmployee();

  const resetForm = () => {
    setFormData({
      name: "",
      employee: "",
      salary: "",
      role: "",
      startDate: new Date().toISOString().split("T")[0],
    });
    setEditingContractId(null);
  };

  const handleAddEmployee = async () => {
    if (
      !formData.name ||
      !formData.employee ||
      !formData.salary ||
      !formData.role
    ) {
      alert("Please fill in all fields");
      return;
    }

    if (!walletAddress) {
      alert("Please connect your wallet first");
      return;
    }

    if (!hasMappedParty) {
      alert(
        `Connected wallet ${walletAddress} is not mapped to a Daml party. Sign in with one of the seeded local test wallets or rerun the local Daml reset script.`,
      );
      return;
    }

    if (!employerParty) {
      alert("Your Daml employer party is still loading. Please try again.");
      return;
    }

    let employerContract: ContractRecord<Employer>;

    try {
      employerContract = await ensureEmployerContract(employerParty);
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Unable to load employer contract";
      alert(`Error: ${message}`);
      return;
    }

    registerEmployee(
      {
        contractId: employerContract.contractId,
        employee: resolveDamlParty(formData.employee),
        name: formData.name,
        salary: parseFloat(formData.salary),
        role: formData.role,
        startDate: new Date(formData.startDate).toISOString(),
      },
      {
        onSuccess: () => {
          setIsAddDialogOpen(false);
          resetForm();
        },
        onError: (err) => {
          alert(`Error: ${err.message}`);
        },
      },
    );
  };

  const handleEditEmployee = (contractId: string) => {
    const emp = employees?.find(
      (employee) => employee.contractId === contractId,
    );
    if (emp) {
      const record = emp.payload;
      setEditingContractId(contractId);
      setFormData({
        name: record.name,
        employee: record.employee,
        salary: record.salary.toString(),
        role: record.role,
        startDate: record.startDate || new Date().toISOString().split("T")[0],
      });
      setIsEditDialogOpen(true);
    }
  };

  const handleUpdateEmployee = () => {
    if (
      !formData.name ||
      !formData.salary ||
      !formData.role ||
      !editingContractId
    ) {
      alert("Please fill in all fields");
      return;
    }

    updateEmployee(
      {
        contractId: editingContractId,
        newName: formData.name,
        newSalary: parseFloat(formData.salary),
        newRole: formData.role,
      },
      {
        onSuccess: () => {
          setIsEditDialogOpen(false);
          resetForm();
        },
        onError: (err) => {
          alert(`Error: ${err.message}`);
        },
      },
    );
  };

  const handleDeactivateEmployee = (contractId: string) => {
    if (confirm("Are you sure you want to deactivate this employee?")) {
      deactivateEmployee(contractId, {
        onError: (err) => {
          alert(`Error: ${err.message}`);
        },
      });
    }
  };

  const handleActivateEmployee = (contractId: string) => {
    activateEmployee(contractId, {
      onError: (err) => {
        alert(`Error: ${err.message}`);
      },
    });
  };

  if (!ready || !authenticated) {
    return (
      <div className="p-8 bg-[#114277] min-h-screen">
        <Card className="mt-8 text-black">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 text-yellow-600">
              <AlertCircle className="h-5 w-5" />
              Please authenticate to continue
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const activeCount =
    employees?.filter((employee) => employee.payload.isActive).length || 0;

  return (
    <div className="p-4 md:p-8 bg-[#114277] min-h-screen">
      <div className="mb-6 md:mb-8 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-white">
            Employees
          </h1>
          <p className="text-gray-300 mt-2 text-sm md:text-base">
            Manage your team and their payroll settings
          </p>
          {!hasMappedParty && walletAddress ? (
            <p className="mt-3 text-sm text-yellow-200">
              Connected wallet {walletAddress} is not mapped to a local Daml
              party. Use one of the seeded test wallets or rerun the reset
              script.
            </p>
          ) : null}
          <div className="mt-3 md:mt-4 flex gap-4 text-sm text-gray-300">
            <span>Total: {employees?.length || 0}</span>
            <span>Active: {activeCount}</span>
          </div>
        </div>

        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2 w-full md:w-auto">
              <Plus className="h-4 w-4" />
              <span className="hidden md:inline">Add Employee</span>
              <span className="md:hidden">Add</span>
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle className="text-black">Add New Employee</DialogTitle>
              <DialogDescription className="text-gray-600">
                Register a new employee to your payroll system.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="name" className="text-black">
                  Full Name
                </Label>
                <Input
                  id="name"
                  className="text-black"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  placeholder="Enter full name"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="employee" className="text-black">
                  Employee Party ID
                </Label>
                <Input
                  id="employee"
                  className="text-black"
                  value={formData.employee}
                  onChange={(e) =>
                    setFormData({ ...formData, employee: e.target.value })
                  }
                  placeholder="e.g., employee@daml.com"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="role" className="text-black">
                  Role/Position
                </Label>
                <Input
                  id="role"
                  className="text-black"
                  value={formData.role}
                  onChange={(e) =>
                    setFormData({ ...formData, role: e.target.value })
                  }
                  placeholder="e.g., Software Engineer"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="salary" className="text-black">
                  Monthly Salary
                </Label>
                <Input
                  id="salary"
                  type="number"
                  className="text-black"
                  value={formData.salary}
                  onChange={(e) =>
                    setFormData({ ...formData, salary: e.target.value })
                  }
                  placeholder="5000"
                />
              </div>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setIsAddDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button onClick={handleAddEmployee} disabled={isRegisterPending}>
                {isRegisterPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Adding...
                  </>
                ) : (
                  "Add Employee"
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <Card className="text-black">
        <CardHeader>
          <CardTitle>Employee List</CardTitle>
        </CardHeader>
        <CardContent>
          {!authenticated ? (
            <div className="text-center py-8 text-gray-500">
              Please authenticate to view employees.
            </div>
          ) : isLoading ? (
            <div className="text-center py-8 text-gray-500">
              <Loader2 className="h-8 w-8 animate-spin mx-auto mb-2" />
              Loading employees...
            </div>
          ) : error ? (
            <div className="text-center py-8 text-red-500">
              <AlertCircle className="h-8 w-8 mx-auto mb-2" />
              Error loading employees
            </div>
          ) : !employees || employees.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No employees found. Add your first employee to get started.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table className="text-black">
                <TableHeader>
                  <TableRow>
                    <TableHead className="min-w-[120px] text-black">Name</TableHead>
                    <TableHead className="min-w-[120px] text-black">Employee ID</TableHead>
                    <TableHead className="hidden md:table-cell min-w-[120px] text-black">
                      Role
                    </TableHead>
                    <TableHead className="min-w-[100px] text-black">Salary</TableHead>
                    <TableHead className="min-w-[80px] text-black">Status</TableHead>
                    <TableHead className="text-right min-w-[120px] text-black">
                      Actions
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {employees.map((emp) => {
                    const record = emp.payload;
                    const contractId = emp.contractId;
                    return (
                      <TableRow key={contractId} className="text-black">
                        <TableCell className="font-medium">
                          <div className="flex flex-col">
                            <span>{record.name}</span>
                            <span className="md:hidden text-xs text-gray-500">
                              {record.role}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell className="font-mono text-xs">
                          {record.employee.slice(0, 8)}...
                        </TableCell>
                        <TableCell className="hidden md:table-cell">
                          {record.role}
                        </TableCell>
                        <TableCell className="whitespace-nowrap">
                          ${Number(record.salary).toLocaleString()}
                        </TableCell>
                        <TableCell>
                          <span
                            className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                              record.isActive
                                ? "bg-green-100 text-green-800"
                                : "bg-gray-100 text-gray-800"
                            }`}
                          >
                            {record.isActive ? "Active" : "Inactive"}
                          </span>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-1 md:gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleEditEmployee(contractId)}
                              disabled={!record.isActive}
                              className="h-8 w-8 md:h-8 md:w-auto md:px-2"
                            >
                              <Edit className="h-3 w-3 md:h-4 md:w-4" />
                            </Button>
                            {record.isActive ? (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() =>
                                  handleDeactivateEmployee(contractId)
                                }
                                disabled={isDeactivatePending}
                                className="h-8 w-8 md:h-8 md:w-auto md:px-2"
                              >
                                <UserX className="h-3 w-3 md:h-4 md:w-4 text-red-500" />
                              </Button>
                            ) : (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() =>
                                  handleActivateEmployee(contractId)
                                }
                                disabled={isActivatePending}
                                className="h-8 w-8 md:h-8 md:w-auto md:px-2"
                              >
                                <UserCheck className="h-3 w-3 md:h-4 md:w-4 text-green-500" />
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Edit Employee Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle className="text-black">Edit Employee</DialogTitle>
            <DialogDescription className="text-gray-600">
              Update employee information and payroll settings.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="edit-name" className="text-black">
                Full Name
              </Label>
              <Input
                id="edit-name"
                className="text-black"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-role" className="text-black">
                Role
              </Label>
              <Input
                id="edit-role"
                className="text-black"
                value={formData.role}
                onChange={(e) =>
                  setFormData({ ...formData, role: e.target.value })
                }
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-salary" className="text-black">
                Monthly Salary
              </Label>
              <Input
                id="edit-salary"
                type="number"
                className="text-black"
                value={formData.salary}
                onChange={(e) =>
                  setFormData({ ...formData, salary: e.target.value })
                }
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsEditDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button onClick={handleUpdateEmployee} disabled={isUpdatePending}>
              {isUpdatePending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Updating...
                </>
              ) : (
                "Update Employee"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
