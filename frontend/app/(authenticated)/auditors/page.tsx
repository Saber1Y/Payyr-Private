"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useAccount } from "wagmi";

interface AuditorAccessRecord {
  payrollId: number;
  auditorAddress: string;
  grantedAt: Date;
  status: "active" | "revoked";
}

export default function AuditorsPage() {
  const { address } = useAccount();
  const [auditors, setAuditors] = useState<AuditorAccessRecord[]>([]);
  const [newAuditorAddress, setNewAuditorAddress] = useState("");
  const [selectedPayrollId, setSelectedPayrollId] = useState("");
  const [loading, setLoading] = useState(false);

  const handleGrantAccess = async () => {
    if (!newAuditorAddress || !selectedPayrollId) {
      alert("Please provide auditor address and payroll ID");
      return;
    }

    setLoading(true);
    try {
      // TODO: Call contract function grantAuditorAccess
      const newRecord: AuditorAccessRecord = {
        payrollId: parseInt(selectedPayrollId),
        auditorAddress: newAuditorAddress,
        grantedAt: new Date(),
        status: "active",
      };
      setAuditors([...auditors, newRecord]);
      setNewAuditorAddress("");
      setSelectedPayrollId("");
    } catch (error) {
      console.error("Error granting auditor access:", error);
      alert("Failed to grant auditor access");
    } finally {
      setLoading(false);
    }
  };

  const handleRevokeAccess = async (
    auditorAddress: string,
    payrollId: number,
  ) => {
    if (!window.confirm("Are you sure you want to revoke auditor access?")) {
      return;
    }

    setLoading(true);
    try {
      // TODO: Call contract function revokeAuditorAccess
      setAuditors(
        auditors.map((record) =>
          record.auditorAddress === auditorAddress &&
          record.payrollId === payrollId
            ? { ...record, status: "revoked" as const }
            : record,
        ),
      );
    } catch (error) {
      console.error("Error revoking auditor access:", error);
      alert("Failed to revoke auditor access");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Auditor Access Control</h1>
        <p className="text-gray-600 mt-2">
          Grant or revoke auditor access to your payroll batches. Auditors can
          verify payroll records without accessing public information.
        </p>
      </div>

      <Card className="p-6">
        <h2 className="text-xl font-semibold mb-4">Grant Auditor Access</h2>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">
              Payroll Batch ID
            </label>
            <Input
              type="number"
              placeholder="Enter payroll ID"
              value={selectedPayrollId}
              onChange={(e) => setSelectedPayrollId(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">
              Auditor Wallet Address
            </label>
            <Input
              type="text"
              placeholder="0x..."
              value={newAuditorAddress}
              onChange={(e) => setNewAuditorAddress(e.target.value)}
            />
          </div>
          <Button
            onClick={handleGrantAccess}
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-700"
          >
            {loading ? "Granting Access..." : "Grant Auditor Access"}
          </Button>
        </div>
      </Card>

      <Card className="p-6">
        <h2 className="text-xl font-semibold mb-4">
          Active Auditor Permissions
        </h2>
        {auditors.length === 0 ? (
          <p className="text-gray-500">No auditor access records yet</p>
        ) : (
          <div className="space-y-3">
            {auditors
              .filter((a) => a.status === "active")
              .map((record) => (
                <div
                  key={`${record.payrollId}-${record.auditorAddress}`}
                  className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border"
                >
                  <div>
                    <p className="font-mono text-sm">{record.auditorAddress}</p>
                    <p className="text-xs text-gray-600">
                      Payroll ID: {record.payrollId}
                    </p>
                  </div>
                  <Button
                    onClick={() =>
                      handleRevokeAccess(
                        record.auditorAddress,
                        record.payrollId,
                      )
                    }
                    variant="destructive"
                    size="sm"
                  >
                    Revoke
                  </Button>
                </div>
              ))}
          </div>
        )}
      </Card>

      <Card className="p-6 bg-blue-50 border-blue-200">
        <h3 className="font-semibold text-blue-900 mb-2">
          🔐 Privacy Information
        </h3>
        <ul className="text-sm text-blue-800 space-y-1">
          <li>
            • Auditors can view full payroll details only for batches they have
            access to
          </li>
          <li>• Employees can only see their own payment information</li>
          <li>• Other employees cannot see any payroll data</li>
          <li>• You can revoke auditor access at any time</li>
        </ul>
      </Card>
    </div>
  );
}
