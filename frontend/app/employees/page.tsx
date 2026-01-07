"use client";

import { useState, useEffect } from "react";
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
  ShieldCheck,
} from "lucide-react";
import {
  useReadContract,
  useReadContracts,
  useWriteContract,
  useAccount,
} from "wagmi";
import { formatUnits, parseUnits } from "viem";
import EmployeeRegistryABI from "../../lib/abi/EmployeeRegistry.json";
import type { Abi } from "viem";
import { useQueryClient } from "@tanstack/react-query";
import { usePublicClient } from "wagmi";

const EMPLOYEE_REGISTRY_ADDRESS =
  "0x20B3dB45a351E92673112064A3F01951115eD6B7" as const;

// Type for formatted employee data
interface EmployeeData {
  address: string;
  name: string;
  salary: string;
  isActive: boolean;
  role: string;
}

export default function EmployeesPage() {
  const { address } = useAccount();
  const queryClient = useQueryClient();
  const publicClient = usePublicClient();
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    walletAddress: "",
    salary: "",
    role: "",
  });

  const {
    writeContract,
    isPending: isAddPending,
    data: addData,
  } = useWriteContract();
  const {
    writeContract: writeUpdateContract,
    isPending: isUpdatePending,
    data: updateData,
  } = useWriteContract();
  const {
    writeContract: writeDeactivateContract,
    isPending: isDeactivatePending,
    data: deactivateData,
  } = useWriteContract();
  const {
    writeContract: writeActivateContract,
    isPending: isActivatePending,
    data: activateData,
  } = useWriteContract();
  const {
    writeContract: writeRegisterContract,
    isPending: isRegisterPending,
    data: registerData,
  } = useWriteContract();

  // Handle success callbacks
  useEffect(() => {
    if (addData) {
      setIsAddDialogOpen(false);
      resetForm();
      queryClient.invalidateQueries({ queryKey: ["readContract"] });
    }
  }, [addData, queryClient]);

  useEffect(() => {
    if (updateData) {
      setIsEditDialogOpen(false);
      resetForm();
      queryClient.invalidateQueries({ queryKey: ["readContract"] });
    }
  }, [updateData, queryClient]);

  useEffect(() => {
    if (deactivateData || activateData) {
      queryClient.invalidateQueries({ queryKey: ["readContract"] });
    }
  }, [deactivateData, activateData, queryClient]);

  useEffect(() => {
    if (registerData) {
      queryClient.invalidateQueries({ queryKey: ["readContract"] });
    }
  }, [registerData, queryClient]);

  /* ==================== READ CONTRACTS ==================== */

  // Get counts
  const { data: totalEmployees } = useReadContract({
    address: EMPLOYEE_REGISTRY_ADDRESS,
    abi: EmployeeRegistryABI.abi,
    functionName: "totalEmployees",
  });

  const { data: activeEmployees } = useReadContract({
    address: EMPLOYEE_REGISTRY_ADDRESS,
    abi: EmployeeRegistryABI.abi,
    functionName: "activeEmployees",
  });

  const { data: isEmployer } = useReadContract({
    address: EMPLOYEE_REGISTRY_ADDRESS,
    abi: EmployeeRegistryABI.abi,
    functionName: "isEmployer",
    args: [address],
    query: {
      enabled: !!address,
    },
  });

  console.log("totalEmployees:", totalEmployees?.toString());
  console.log("activeEmployees:", activeEmployees?.toString());
  console.log("isEmployer:", isEmployer);

  // Get list of addresses for current employer
  const { data: employeeAddresses } = useReadContract({
    address: EMPLOYEE_REGISTRY_ADDRESS,
    abi: EmployeeRegistryABI.abi,
    functionName: "getEmployerEmployees",
    args: [address],
    query: {
      enabled: !!address && isEmployer === true,
    },
  });

  // BATCH FETCH: Create array of calls for each employee
  const employeeCalls =
    (employeeAddresses as string[] | undefined)?.map((addr) => ({
      address: EMPLOYEE_REGISTRY_ADDRESS,
      abi: EmployeeRegistryABI.abi as Abi,
      functionName: "employees",
      args: [addr],
    })) || [];

  // Execute batch call to get all employee data at once
  const { data: employeesResults, isLoading: isTableLoading } =
    useReadContracts({
      contracts: employeeCalls,
    });

  // FORMAT: Convert blockchain data to usable format
  const tableData: EmployeeData[] =
    employeesResults
      ?.map((res, index) => {
        // Check if we got valid data
        if (!res.result) {
          console.log(" No result for this employee!");
          return null;
        }

        // Destructure the struct returned from Solidity
        // Solidity returns: (string name, uint256 salary, bool isActive, uint256 startDate, string role)
        const [name, salary, isActive, startDate, role] = res.result as [
          string,
          bigint,
          boolean,
          bigint,
          string
        ];

        console.log(" Parsed data:", {
          name,
          salary: salary.toString(),
          isActive,
          role,
        });

        return {
          address: (employeeAddresses as string[])[index],
          name,
          salary: formatUnits(salary, 6), // Convert to readable USDC
          isActive,
          role,
        };
      })
      .filter((item): item is EmployeeData => item !== null) || [];

  /* ==================== HANDLERS ==================== */

  const resetForm = () => {
    setFormData({
      name: "",
      walletAddress: "",
      salary: "",
      role: "",
    });
    setEditingEmployee(null);
  };

  const handleRegisterEmployer = () => {
    if (!address) {
      alert("Please connect your wallet first");
      return;
    }
    writeRegisterContract({
      address: EMPLOYEE_REGISTRY_ADDRESS,
      abi: EmployeeRegistryABI.abi,
      functionName: "registerAsEmployer",
    });
  };

  const handleAddEmployee = () => {
    if (
      !formData.name ||
      !formData.walletAddress ||
      !formData.salary ||
      !formData.role
    ) {
      alert("Please fill in all fields");
      return;
    }

    const salaryInSmallestUnit = parseUnits(formData.salary, 6);

    writeContract({
      address: EMPLOYEE_REGISTRY_ADDRESS,
      abi: EmployeeRegistryABI.abi,
      functionName: "addEmployee",
      args: [
        formData.walletAddress as `0x${string}`,
        formData.name,
        salaryInSmallestUnit,
        formData.role,
      ],
    });
  };

  const handleEditEmployee = (employeeAddress: string) => {
    // Find employee in our already-fetched data
    const employee = tableData.find((e) => e.address === employeeAddress);

    if (employee) {
      setEditingEmployee(employeeAddress);
      setFormData({
        name: employee.name,
        walletAddress: employeeAddress,
        salary: employee.salary, // Already formatted from tableData
        role: employee.role,
      });
      setIsEditDialogOpen(true);
    }
  };

  const handleUpdateEmployee = () => {
    if (
      !editingEmployee ||
      !formData.name ||
      !formData.salary ||
      !formData.role
    ) {
      alert("Please fill in all fields");
      return;
    }

    const salaryInSmallestUnit = parseUnits(formData.salary, 6);

    writeUpdateContract({
      address: EMPLOYEE_REGISTRY_ADDRESS,
      abi: EmployeeRegistryABI.abi,
      functionName: "updateEmployee",
      args: [
        editingEmployee as `0x${string}`,
        formData.name,
        salaryInSmallestUnit,
        formData.role,
      ],
    });
  };

  const handleDeactivateEmployee = (employeeAddress: string) => {
    if (confirm("Are you sure you want to deactivate this employee?")) {
      writeDeactivateContract({
        address: EMPLOYEE_REGISTRY_ADDRESS,
        abi: EmployeeRegistryABI.abi,
        functionName: "deactivateEmployee",
        args: [employeeAddress as `0x${string}`],
      });
    }
  };

  const handleActivateEmployee = (employeeAddress: string) => {
    writeActivateContract({
      address: EMPLOYEE_REGISTRY_ADDRESS,
      abi: EmployeeRegistryABI.abi,
      functionName: "activateEmployee",
      args: [employeeAddress as `0x${string}`],
    });
  };

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
          <div className="mt-3 md:mt-4 flex gap-4 text-sm text-gray-300">
            <span>Your Employees: {employeeAddresses?.length ?? "0"}</span>
          </div>
        </div>

        <div className="flex gap-2">
          {isEmployer === false && (
            <Button
              onClick={handleRegisterEmployer}
              disabled={isRegisterPending}
              variant="outline"
              className="gap-2 w-full md:w-auto"
            >
              {isRegisterPending ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Registering...
                </>
              ) : (
                <>
                  <ShieldCheck className="h-4 w-4 text-black" />
                  <span className="hidden md:inline text-black">
                    Register as Employer
                  </span>
                  <span className="md:hidden text-black">Register</span>
                </>
              )}
            </Button>
          )}
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button
                className="gap-2 w-full md:w-auto"
                disabled={isEmployer !== true}
              >
                <Plus className="h-4 w-4" />
                <span className="hidden md:inline">Add Employee</span>
                <span className="md:hidden">Add</span>
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px] text-black">
              <DialogHeader>
                <DialogTitle>Add New Employee</DialogTitle>
                <DialogDescription>
                  Add a new employee to your payroll system on-chain.
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="name">Full Name</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                    placeholder="Enter full name"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="address">Wallet Address</Label>
                  <Input
                    id="address"
                    value={formData.walletAddress}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        walletAddress: e.target.value,
                      })
                    }
                    placeholder="0x..."
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="role">Role/Position</Label>
                  <Input
                    id="role"
                    value={formData.role}
                    onChange={(e) =>
                      setFormData({ ...formData, role: e.target.value })
                    }
                    placeholder="e.g., Software Engineer"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="salary">Monthly Salary (USDC)</Label>
                  <Input
                    id="salary"
                    type="number"
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
                <Button onClick={handleAddEmployee} disabled={isAddPending}>
                  {isAddPending ? (
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
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-black">Employee List</CardTitle>
        </CardHeader>
        <CardContent>
          {!address ? (
            <div className="text-center py-8 text-gray-500">
              Please connect your wallet to view employees.
            </div>
          ) : isEmployer === false ? (
            <div className="text-center py-8 text-gray-500">
              <ShieldCheck className="h-12 w-12 mx-auto mb-4 text-gray-400" />
              <p className="mb-4">
                Register as an employer to start managing your team.
              </p>
              <Button
                onClick={handleRegisterEmployer}
                disabled={isRegisterPending}
              >
                {isRegisterPending ? "Registering..." : "Register as Employer"}
              </Button>
            </div>
          ) : isTableLoading ? (
            <div className="text-center py-8 text-gray-500">
              <Loader2 className="h-8 w-8 animate-spin mx-auto mb-2" />
              Loading employees...
            </div>
          ) : tableData.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No employees found. Add your first employee to get started.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="min-w-[120px]">Name</TableHead>
                    <TableHead className="min-w-[100px]">
                      Wallet Address
                    </TableHead>
                    <TableHead className="hidden md:table-cell min-w-[120px]">
                      Role
                    </TableHead>
                    <TableHead className="min-w-[100px]">Salary</TableHead>
                    <TableHead className="min-w-[80px]">Status</TableHead>
                    <TableHead className="text-right min-w-[120px]">
                      Actions
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {tableData.map((employee) => (
                    <TableRow key={employee.address} className="text-black">
                      <TableCell className="font-medium">
                        <div className="flex flex-col">
                          <span>{employee.name}</span>
                          <span className="md:hidden text-xs text-gray-500">
                            {employee.role}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="font-mono text-xs">
                        {employee.address.slice(0, 6)}...
                        {employee.address.slice(-4)}
                      </TableCell>
                      <TableCell className="hidden md:table-cell">
                        {employee.role}
                      </TableCell>
                      <TableCell className="whitespace-nowrap">
                        ${Number(employee.salary).toLocaleString()}
                      </TableCell>
                      <TableCell>
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                            employee.isActive
                              ? "bg-green-100 text-green-800"
                              : "bg-gray-100 text-gray-800"
                          }`}
                        >
                          {employee.isActive ? "Active" : "Inactive"}
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1 md:gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEditEmployee(employee.address)}
                            disabled={!employee.isActive}
                            className="h-8 w-8 md:h-8 md:w-auto md:px-2"
                          >
                            <Edit className="h-3 w-3 md:h-4 md:w-4" />
                          </Button>
                          {employee.isActive ? (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() =>
                                handleDeactivateEmployee(employee.address)
                              }
                              className="h-8 w-8 md:h-8 md:w-auto md:px-2"
                            >
                              <UserX className="h-3 w-3 md:h-4 md:w-4 text-red-500" />
                            </Button>
                          ) : (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() =>
                                handleActivateEmployee(employee.address)
                              }
                              className="h-8 w-8 md:h-8 md:w-auto md:px-2"
                            >
                              <UserCheck className="h-3 w-3 md:h-4 md:w-4 text-green-500" />
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Edit Employee Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[425px] text-black">
          <DialogHeader>
            <DialogTitle>Edit Employee</DialogTitle>
            <DialogDescription>
              Update employee information and payroll settings.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="edit-name">Full Name</Label>
              <Input
                id="edit-name"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-role">Role/Position</Label>
              <Input
                id="edit-role"
                value={formData.role}
                onChange={(e) =>
                  setFormData({ ...formData, role: e.target.value })
                }
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-salary">Monthly Salary (USDC)</Label>
              <Input
                id="edit-salary"
                type="number"
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
