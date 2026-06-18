"use client";

export const dynamic = "force-dynamic";

import { useEffect, useMemo, useState } from "react";
import { usePrivy } from "@privy-io/react-auth";
import {
  AlertCircle,
  FileText,
  Loader2,
  ShieldCheck,
  Users,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  useGrantPayrollAuditorAccess,
  usePayrollsByEmployer,
  useRevokePayrollAuditorAccess,
} from "@/lib/daml/hooks";
import { damlClient } from "@/lib/daml/client";
import { resolveDamlParty } from "@/lib/daml/partyMapper";
import { useDamlParty } from "@/hooks/useDamlParty";

interface AuditorAccessRecord {
  contractId: string;
  payrollId: number;
  auditor: string;
  grantedAt: string;
}

export default function AuditorsPage() {
  const { authenticated } = usePrivy();
  const { damlParty: employerParty } = useDamlParty();

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

  const uniqueAuditors = new Set(accessRecords.map((record) => record.auditor));
  const payrollsWithAuditors = new Set(
    accessRecords.map((record) => record.payrollId),
  );

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
        auditor: resolveDamlParty(newAuditorParty),
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
    <div className="min-h-screen bg-[#114277] p-4 md:p-8">
      <div className="space-y-6 md:space-y-8">
        <div>
          <h1 className="text-2xl font-bold text-white md:text-3xl">
            Auditor Access
          </h1>
          <p className="mt-2 text-sm text-gray-300 md:text-base">
            Grant and revoke scoped auditor visibility for private payroll runs
            on the Daml ledger.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-3 md:gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">
                Active Permissions
              </CardTitle>
              <ShieldCheck className="h-4 w-4 text-indigo-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-900">
                {accessRecords.length}
              </div>
              <p className="mt-1 text-xs text-gray-500">
                Auditor grants currently visible on ledger
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">
                Unique Auditors
              </CardTitle>
              <Users className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-900">
                {uniqueAuditors.size}
              </div>
              <p className="mt-1 text-xs text-gray-500">
                Distinct parties with payroll access
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">
                Payrolls Shared
              </CardTitle>
              <FileText className="h-4 w-4 text-emerald-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-900">
                {payrollsWithAuditors.size}
              </div>
              <p className="mt-1 text-xs text-gray-500">
                Payroll runs with explicit auditor access
              </p>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)] md:gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg font-semibold text-black">
                Grant Auditor Access
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">
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
                <label className="mb-2 block text-sm font-medium text-gray-700">
                  Auditor Party
                </label>
                <Input
                  type="text"
                  placeholder="auditor::party"
                  value={newAuditorParty}
                  onChange={(event) => setNewAuditorParty(event.target.value)}
                />
              </div>
              <div className="rounded-xl border border-blue-100 bg-blue-50 p-4 text-sm text-blue-900">
                Use this to share a specific payroll run with an auditor party
                without exposing every employee payment contract.
              </div>
              <Button
                onClick={handleGrantAccess}
                disabled={isMutating || isLoading}
                className="w-full gap-2"
              >
                {isGrantPending ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Granting Access...
                  </>
                ) : (
                  "Grant Auditor Access"
                )}
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg font-semibold text-black">
                Active Auditor Permissions
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="flex items-center gap-2 text-gray-500">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Loading payroll runs...
                </div>
              ) : error ? (
                <div className="flex items-start gap-2 rounded-xl border border-red-100 bg-red-50 p-4 text-sm text-red-700">
                  <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                  Failed to load payroll runs.
                </div>
              ) : accessRecords.length === 0 ? (
                <div className="rounded-xl border border-dashed border-gray-200 bg-gray-50 px-4 py-10 text-center">
                  <p className="text-gray-500">No auditor access records yet.</p>
                  <p className="mt-1 text-sm text-gray-400">
                    Shared payroll runs will appear here.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {accessRecords.map((record) => (
                    <div
                      key={`${record.contractId}-${record.auditor}`}
                      className="flex flex-col gap-4 rounded-xl border bg-gray-50 p-4 md:flex-row md:items-center md:justify-between"
                    >
                      <div className="min-w-0">
                        <p className="truncate font-mono text-sm text-gray-900">
                          {record.auditor}
                        </p>
                        <p className="mt-1 text-xs text-gray-600">
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
            </CardContent>
          </Card>
        </div>

        <Card className="border-blue-200 bg-blue-50">
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-blue-900">
              Privacy on Daml
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-1 text-sm text-blue-800">
              <li>Auditors only observe payroll runs you explicitly authorize.</li>
              <li>
                Employee payment contracts stay visible to the employer and
                employee.
              </li>
              <li>You can revoke payroll-run access at any time.</li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
