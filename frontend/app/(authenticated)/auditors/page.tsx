"use client";

import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { usePrivy } from "@privy-io/react-auth";
import {
  useGrantPayrollAuditorAccess,
  usePayrollsByEmployer,
  useRevokePayrollAuditorAccess,
} from "@/lib/daml/hooks";
import { damlClient } from "@/lib/daml/client";

interface AuditorAccessRecord {
  contractId: string;
  payrollId: number;
  auditor: string;
  grantedAt: string;
}

export default function AuditorsPage() {
  const { user, authenticated } = usePrivy();
  const employerParty = user?.wallet?.address || "";

  const [newAuditorParty, setNewAuditorParty] = useState("");
  const [selectedPayrollId, setSelectedPayrollId] = useState("");

  useEffect(() => {
    damlClient.setParty(employerParty);
  }, [employerParty]);

  const {
    data: payrolls,
    isLoading,
    error,
  } = usePayrollsByEmployer(employerParty);

  const { mutate: grantAuditorAccess, isPending: isGrantPending } =
    useGrantPayrollAuditorAccess();
  const { mutate: revokeAuditorAccess, isPending: isRevokePending } =
    useRevokePayrollAuditorAccess();

  const accessRecords = useMemo<AuditorAccessRecord[]>(() => {
    return (payrolls ?? []).flatMap((payroll) =>
      payroll.payload.authorizedAuditors.map((auditor) => ({
        contractId: payroll.contractId,
        payrollId: Number(payroll.payload.payrollId),
        auditor,
        grantedAt: payroll.payload.timestamp,
      })),
    );
  }, [payrolls]);

  const handleGrantAccess = () => {
    if (!newAuditorParty || !selectedPayrollId) {
      alert("Please provide auditor party and payroll ID");
      return;
    }

    const payroll = payrolls?.find(
      (item) => Number(item.payload.payrollId) === Number(selectedPayrollId),
    );

    if (!payroll) {
      alert("Payroll run not found");
      return;
    }

    grantAuditorAccess(
      {
        contractId: payroll.contractId,
        auditor: newAuditorParty,
      },
      {
        onSuccess: () => {
          setNewAuditorParty("");
          setSelectedPayrollId("");
        },
        onError: (grantError) => {
          alert(`Failed to grant auditor access: ${grantError.message}`);
        },
      },
    );
  };

  const handleRevokeAccess = (contractId: string, auditor: string) => {
    if (!window.confirm("Are you sure you want to revoke auditor access?")) {
      return;
    }

    revokeAuditorAccess(
      {
        contractId,
        auditor,
      },
      {
        onError: (revokeError) => {
          alert(`Failed to revoke auditor access: ${revokeError.message}`);
        },
      },
    );
  };

  const isMutating = isGrantPending || isRevokePending;

  if (!authenticated) {
    return <div>Please log in to manage auditor access.</div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Auditor Access Control</h1>
        <p className="mt-2 text-gray-600">
          Grant or revoke auditor access to payroll runs stored on the Daml
          ledger.
        </p>
      </div>

      <Card className="p-6">
        <h2 className="mb-4 text-xl font-semibold">Grant Auditor Access</h2>
        <div className="space-y-4">
          <div>
            <label className="mb-2 block text-sm font-medium">
              Payroll Run ID
            </label>
            <Input
              type="number"
              placeholder="Enter payroll run ID"
              value={selectedPayrollId}
              onChange={(event) => setSelectedPayrollId(event.target.value)}
            />
          </div>
          <div>
            <label className="mb-2 block text-sm font-medium">
              Auditor Party
            </label>
            <Input
              type="text"
              placeholder="auditor::party"
              value={newAuditorParty}
              onChange={(event) => setNewAuditorParty(event.target.value)}
            />
          </div>
          <Button
            onClick={handleGrantAccess}
            disabled={isMutating || isLoading}
            className="w-full bg-blue-600 hover:bg-blue-700"
          >
            {isGrantPending ? "Granting Access..." : "Grant Auditor Access"}
          </Button>
        </div>
      </Card>

      <Card className="p-6">
        <h2 className="mb-4 text-xl font-semibold">
          Active Auditor Permissions
        </h2>
        {isLoading ? (
          <p className="text-gray-500">Loading payroll runs...</p>
        ) : error ? (
          <p className="text-red-500">Failed to load payroll runs.</p>
        ) : accessRecords.length === 0 ? (
          <p className="text-gray-500">No auditor access records yet.</p>
        ) : (
          <div className="space-y-3">
            {accessRecords.map((record) => (
              <div
                key={`${record.contractId}-${record.auditor}`}
                className="flex items-center justify-between rounded-lg border bg-gray-50 p-4"
              >
                <div>
                  <p className="font-mono text-sm">{record.auditor}</p>
                  <p className="text-xs text-gray-600">
                    Payroll ID: {record.payrollId}
                  </p>
                  <p className="text-xs text-gray-500">
                    Granted: {new Date(record.grantedAt).toLocaleString()}
                  </p>
                </div>
                <Button
                  onClick={() =>
                    handleRevokeAccess(record.contractId, record.auditor)
                  }
                  variant="destructive"
                  size="sm"
                  disabled={isMutating}
                >
                  Revoke
                </Button>
              </div>
            ))}
          </div>
        )}
      </Card>

      <Card className="border-blue-200 bg-blue-50 p-6">
        <h3 className="mb-2 font-semibold text-blue-900">
          Privacy on Daml
        </h3>
        <ul className="space-y-1 text-sm text-blue-800">
          <li>Auditors only observe payroll runs you explicitly authorize.</li>
          <li>
            Employee payment contracts stay visible to the employer and
            employee.
          </li>
          <li>You can revoke payroll-run access at any time.</li>
        </ul>
      </Card>
    </div>
  );
}
