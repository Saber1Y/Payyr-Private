"use client";

export const dynamic = "force-dynamic";

import { useMemo, useState } from "react";
import { usePrivy } from "@privy-io/react-auth";
import { NoAccessState } from "@/components/access/NoAccessState";
import {
  AlertCircle,
  BadgeCheck,
  CalendarDays,
  FileText,
  Loader2,
  ShieldCheck,
  Users,
  Wallet,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  useGrantPayrollAuditorAccess,
  usePayrollsByEmployer,
  useRevokePayrollAuditorAccess,
  useVisiblePayrolls,
} from "@/lib/daml/hooks";
import { resolveDamlParty } from "@/lib/daml/partyMapper";
import { useDamlParty } from "@/hooks/useDamlParty";
import {
  DEFAULT_PAYROLL_CURRENCY,
  formatPayrollAmount,
} from "@/lib/payrollCurrency";
import { useAlert, useConfirm } from "@/hooks/useDialogs";

interface AuditorAccessRecord {
  contractId: string;
  payrollId: number;
  auditor: string;
  grantedAt: string;
  totalAmount: number;
  paymentCurrency: string;
  employeeCount: number;
  isCompleted: boolean;
  isPublic: boolean;
}

interface PayrollVerificationRow {
  contractId: string;
  payrollId: number;
  timestamp: string;
  totalAmount: number;
  paymentCurrency: string;
  employeeCount: number;
  isCompleted: boolean;
  isPublic: boolean;
  auditors: string[];
}

export default function AuditorsPage() {
  const { authenticated } = usePrivy();
  const { damlParty: viewerParty, walletRole } = useDamlParty();
  const isEmployerView = walletRole === "employer";
  const isAuditorView = walletRole === "auditor";
  const { showAlert, AlertDialogElement } = useAlert();
  const { showConfirm, ConfirmDialogElement } = useConfirm();

  const [newAuditorParty, setNewAuditorParty] = useState("");
  const [selectedPayrollId, setSelectedPayrollId] = useState("");

  const employerPayrollQuery = usePayrollsByEmployer(
    isEmployerView ? viewerParty : "",
  );
  const visiblePayrollQuery = useVisiblePayrolls(
    isAuditorView && !!viewerParty,
  );

  const payrolls = useMemo(() => {
    if (isEmployerView) {
      return employerPayrollQuery.data ?? [];
    }

    if (isAuditorView) {
      return (visiblePayrollQuery.data ?? []).filter((payroll) =>
        payroll.payload.authorizedAuditors.includes(viewerParty),
      );
    }

    return [];
  }, [
    employerPayrollQuery.data,
    isAuditorView,
    isEmployerView,
    viewerParty,
    visiblePayrollQuery.data,
  ]);

  const isLoading = isEmployerView
    ? employerPayrollQuery.isLoading
    : isAuditorView
      ? visiblePayrollQuery.isLoading
      : false;
  const error = isEmployerView
    ? employerPayrollQuery.error
    : isAuditorView
      ? visiblePayrollQuery.error
      : null;

  const { mutate: grantAuditorAccess, isPending: isGrantPending } =
    useGrantPayrollAuditorAccess();
  const { mutate: revokeAuditorAccess, isPending: isRevokePending } =
    useRevokePayrollAuditorAccess();

  const accessRecords = useMemo<AuditorAccessRecord[]>(() => {
    if (isAuditorView) {
      return (payrolls ?? []).map((payroll) => ({
        contractId: payroll.contractId,
        payrollId: Number(payroll.payload.payrollId),
        auditor: viewerParty,
        grantedAt: payroll.payload.timestamp,
        totalAmount: Number(payroll.payload.totalAmount),
        paymentCurrency: payroll.payload.paymentCurrency,
        employeeCount: Number(payroll.payload.employeeCount),
        isCompleted: payroll.payload.isCompleted,
        isPublic: payroll.payload.isPublic,
      }));
    }

    return (payrolls ?? []).flatMap((payroll) =>
      payroll.payload.authorizedAuditors.map((auditor) => ({
        contractId: payroll.contractId,
        payrollId: Number(payroll.payload.payrollId),
        auditor,
        grantedAt: payroll.payload.timestamp,
        totalAmount: Number(payroll.payload.totalAmount),
        paymentCurrency: payroll.payload.paymentCurrency,
        employeeCount: Number(payroll.payload.employeeCount),
        isCompleted: payroll.payload.isCompleted,
        isPublic: payroll.payload.isPublic,
      })),
    );
  }, [isAuditorView, payrolls, viewerParty]);

  const payrollVerificationRows = useMemo<PayrollVerificationRow[]>(() => {
    return [...(payrolls ?? [])]
      .map((payroll) => ({
        contractId: payroll.contractId,
        payrollId: Number(payroll.payload.payrollId),
        timestamp: payroll.payload.timestamp,
        totalAmount: Number(payroll.payload.totalAmount),
        paymentCurrency:
          payroll.payload.paymentCurrency || DEFAULT_PAYROLL_CURRENCY,
        employeeCount: Number(payroll.payload.employeeCount),
        isCompleted: payroll.payload.isCompleted,
        isPublic: payroll.payload.isPublic,
        auditors: isEmployerView
          ? payroll.payload.authorizedAuditors
          : payroll.payload.authorizedAuditors.filter(
              (auditor) => auditor === viewerParty,
            ),
      }))
      .sort((left, right) => right.payrollId - left.payrollId);
  }, [isEmployerView, payrolls, viewerParty]);

  const uniqueAuditors = new Set(accessRecords.map((record) => record.auditor));
  const payrollsWithAuditors = new Set(
    accessRecords.map((record) => record.payrollId),
  );
  const sharedPayrollRows = payrollVerificationRows.filter(
    (row) => row.auditors.length > 0,
  );
  const totalSharedValue = sharedPayrollRows.reduce(
    (sum, payroll) => sum + payroll.totalAmount,
    0,
  );
  const coveredEmployees = sharedPayrollRows.reduce(
    (sum, payroll) => sum + payroll.employeeCount,
    0,
  );
  const latestSharedRun = sharedPayrollRows[0];
  const summaryCards = isEmployerView
    ? [
        {
          title: "Active Permissions",
          value: String(accessRecords.length),
          description: "Auditor grants currently visible on ledger",
          icon: ShieldCheck,
          iconClassName: "text-indigo-600",
        },
        {
          title: "Unique Auditors",
          value: String(uniqueAuditors.size),
          description: "Distinct parties with payroll access",
          icon: Users,
          iconClassName: "text-blue-600",
        },
        {
          title: "Payrolls Shared",
          value: String(payrollsWithAuditors.size),
          description: "Payroll runs with explicit auditor access",
          icon: FileText,
          iconClassName: "text-emerald-600",
        },
        {
          title: "Verified Value",
          value: formatPayrollAmount(totalSharedValue),
          description: `Total ${DEFAULT_PAYROLL_CURRENCY} value shared with auditors`,
          icon: Wallet,
          iconClassName: "text-green-600",
        },
      ]
    : [
        {
          title: "Payrolls Shared",
          value: String(sharedPayrollRows.length),
          description: "Payroll runs this auditor can verify",
          icon: ShieldCheck,
          iconClassName: "text-indigo-600",
        },
        {
          title: "Employees Covered",
          value: String(coveredEmployees),
          description: "Employee entries visible inside shared payrolls",
          icon: Users,
          iconClassName: "text-blue-600",
        },
        {
          title: "Verified Value",
          value: formatPayrollAmount(totalSharedValue),
          description: `Total ${DEFAULT_PAYROLL_CURRENCY} amount shared for verification`,
          icon: Wallet,
          iconClassName: "text-green-600",
        },
        {
          title: "Latest Shared Run",
          value: latestSharedRun ? `#${latestSharedRun.payrollId}` : "None",
          description: latestSharedRun
            ? new Date(latestSharedRun.timestamp).toLocaleString()
            : "No payroll runs shared yet",
          icon: FileText,
          iconClassName: "text-emerald-600",
        },
      ];

  const handleGrantAccess = () => {
    if (!newAuditorParty || !selectedPayrollId) {
      showAlert("Please provide auditor party and payroll ID");
      return;
    }

    const payroll = payrolls?.find(
      (item) => Number(item.payload.payrollId) === Number(selectedPayrollId),
    );

    if (!payroll) {
      showAlert("Payroll run not found");
      return;
    }

    grantAuditorAccess(
      {
        contractId: payroll.contractId,
        auditor: resolveDamlParty(newAuditorParty),
        party: viewerParty,
      },
      {
        onSuccess: () => {
          setNewAuditorParty("");
          setSelectedPayrollId("");
        },
        onError: (grantError) => {
          showAlert(`Failed to grant auditor access: ${grantError.message}`);
        },
      },
    );
  };

  const handleRevokeAccess = async (contractId: string, auditor: string) => {
    const confirmed = await showConfirm(
      "Are you sure you want to revoke auditor access?",
    );
    if (!confirmed) {
      return;
    }

    revokeAuditorAccess(
      {
        contractId,
        auditor,
        party: viewerParty,
      },
      {
        onError: (revokeError) => {
          showAlert(`Failed to revoke auditor access: ${revokeError.message}`);
        },
      },
    );
  };

  const isMutating = isGrantPending || isRevokePending;

  if (!authenticated) {
    return <div>Please log in to manage auditor access.</div>;
  }

  if (!isEmployerView && !isAuditorView) {
    return (
      <NoAccessState message="This wallet is not authorized to manage auditor access or view shared payroll verification." />
    );
  }

  return (
    <div className="min-h-screen bg-[#114277] p-4 md:p-8">
      <div className="space-y-6 md:space-y-8">
        <div>
          <h1 className="text-2xl font-bold text-white md:text-3xl">
            {isEmployerView ? "Auditor Access" : "Auditor Verification"}
          </h1>
          <p className="mt-2 text-sm text-gray-300 md:text-base">
            {isEmployerView
              ? `Grant, review, and revoke scoped auditor visibility for private ${DEFAULT_PAYROLL_CURRENCY} payroll runs on the Daml ledger.`
              : `Review only the payroll runs explicitly shared with your auditor party. Private payroll data stays hidden until access is granted.`}
          </p>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4 md:gap-6">
          {summaryCards.map((card) => {
            const Icon = card.icon;

            return (
              <Card key={card.title} className="text-black">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-gray-600">
                    {card.title}
                  </CardTitle>
                  <Icon className={`h-4 w-4 ${card.iconClassName}`} />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-gray-900">
                    {card.value}
                  </div>
                  <p className="mt-1 text-xs text-gray-500">
                    {card.description}
                  </p>
                </CardContent>
              </Card>
            );
          })}
        </div>

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)] md:gap-6">
          {isEmployerView ? (
            <Card className="text-black">
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
                    onChange={(event) =>
                      setSelectedPayrollId(event.target.value)
                    }
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
                  Use this to share a specific payroll run with an auditor
                  party without exposing every employee payment contract beyond
                  the authorized verification scope.
                </div>
                {payrollVerificationRows.length > 0 ? (
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-gray-700">
                      Recent payroll runs
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {payrollVerificationRows.slice(0, 6).map((payroll) => (
                        <Button
                          key={payroll.contractId}
                          type="button"
                          variant="outline"
                          className="text-black"
                          onClick={() =>
                            setSelectedPayrollId(String(payroll.payrollId))
                          }
                        >
                          #{payroll.payrollId}
                        </Button>
                      ))}
                    </div>
                  </div>
                ) : null}
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
          ) : (
            <Card className="text-black">
              <CardHeader>
                <CardTitle className="text-lg font-semibold text-black">
                  Your Auditor Scope
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="rounded-xl border border-indigo-100 bg-indigo-50 p-4 text-sm text-indigo-950">
                  You are viewing the ledger as an auditor. Only payroll runs
                  explicitly shared with your mapped auditor party appear here.
                </div>
                <div className="rounded-xl border border-gray-200 bg-gray-50 p-4">
                  <p className="text-sm font-medium text-gray-700">
                    Auditor party
                  </p>
                  <p className="mt-2 break-all font-mono text-sm text-gray-900">
                    {viewerParty}
                  </p>
                </div>
                <div className="rounded-xl border border-blue-100 bg-blue-50 p-4 text-sm text-blue-900">
                  This is a read-only verification workspace. The employer must
                  grant or revoke access from their own view.
                </div>
              </CardContent>
            </Card>
          )}

          <Card className="text-black">
            <CardHeader>
              <CardTitle className="text-lg font-semibold text-black">
                {isEmployerView
                  ? "Verification Coverage"
                  : "Shared Payroll Verification"}
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
              ) : payrollVerificationRows.length === 0 ? (
                <div className="rounded-xl border border-dashed border-gray-200 bg-gray-50 px-4 py-10 text-center">
                  <p className="text-gray-500">
                    {isEmployerView
                      ? "No payroll runs available yet."
                      : "No payroll runs have been shared with this auditor party yet."}
                  </p>
                  <p className="mt-1 text-sm text-gray-400">
                    {isEmployerView
                      ? "Run payroll first, then authorize audit access per run."
                      : "Ask the employer to grant access to a payroll run before returning here."}
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="rounded-xl border border-emerald-100 bg-emerald-50 p-4">
                    <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                      <div>
                        <p className="text-sm font-medium text-emerald-900">
                          {isEmployerView
                            ? "Audit-ready payroll coverage"
                            : "Shared verification coverage"}
                        </p>
                        <p className="mt-1 text-sm text-emerald-800">
                          {sharedPayrollRows.length} payroll runs covering{" "}
                          {coveredEmployees} employee entries are currently{" "}
                          {isEmployerView
                            ? "shared with auditors."
                            : "visible to this auditor party."}
                        </p>
                      </div>
                      {latestSharedRun ? (
                        <div className="rounded-lg border border-emerald-200 bg-white px-3 py-2 text-sm text-gray-700">
                          Latest shared run #{latestSharedRun.payrollId}
                        </div>
                      ) : (
                        <div className="rounded-lg border border-amber-200 bg-white px-3 py-2 text-sm text-amber-700">
                          No payroll runs shared yet
                        </div>
                      )}
                    </div>
                  </div>

                  {payrollVerificationRows.map((payroll) => (
                    <div
                      key={payroll.contractId}
                      className="rounded-xl border bg-gray-50 p-4"
                    >
                      <div className="flex flex-col gap-4">
                        <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                          <div className="min-w-0">
                            <div className="flex flex-wrap items-center gap-2">
                              <p className="font-semibold text-gray-900">
                                Payroll #{payroll.payrollId}
                              </p>
                              <span
                                className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${
                                  payroll.auditors.length > 0
                                    ? "bg-green-100 text-green-800"
                                    : "bg-gray-200 text-gray-700"
                                }`}
                              >
                                {payroll.auditors.length > 0
                                  ? isEmployerView
                                    ? "Shared with auditors"
                                    : "Shared to you"
                                  : "Private only"}
                              </span>
                              <span
                                className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${
                                  payroll.isCompleted
                                    ? "bg-blue-100 text-blue-800"
                                    : "bg-yellow-100 text-yellow-800"
                                }`}
                              >
                                {payroll.isCompleted ? "Completed" : "Open"}
                              </span>
                            </div>
                            <div className="mt-2 flex flex-wrap items-center gap-4 text-sm text-gray-600">
                              <span>
                                {formatPayrollAmount(
                                  payroll.totalAmount,
                                  payroll.paymentCurrency,
                                )}
                              </span>
                              <span>{payroll.employeeCount} employees</span>
                              <span>
                                {payroll.isPublic ? "Public" : "Private"}
                              </span>
                            </div>
                          </div>

                          <div className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700">
                            <div className="flex items-center gap-2">
                              <CalendarDays className="h-4 w-4 text-gray-500" />
                              {new Date(payroll.timestamp).toLocaleString()}
                            </div>
                          </div>
                        </div>

                        {payroll.auditors.length === 0 ? (
                          <div className="rounded-lg border border-dashed border-gray-200 bg-white px-4 py-4 text-sm text-gray-500">
                            This payroll run is still private to the employer
                            and authorized employee parties. Grant access above
                            when you need audit verification.
                          </div>
                        ) : !isEmployerView ? (
                          <div className="space-y-3 rounded-lg border border-green-100 bg-white p-4">
                            <div className="flex items-center gap-2 text-sm font-medium text-green-900">
                              <BadgeCheck className="h-4 w-4" />
                              Shared with your auditor party
                            </div>
                            <div className="rounded-lg border border-gray-100 bg-gray-50 p-3">
                              <p className="break-all font-mono text-sm text-gray-900">
                                {viewerParty}
                              </p>
                              <p className="mt-1 text-xs text-gray-500">
                                This payroll run is visible to you for
                                verification because the employer explicitly
                                granted access.
                              </p>
                            </div>
                          </div>
                        ) : (
                          <div className="space-y-3 rounded-lg border border-green-100 bg-white p-4">
                            <div className="flex items-center gap-2 text-sm font-medium text-green-900">
                              <BadgeCheck className="h-4 w-4" />
                              Authorized auditors
                            </div>
                            <div className="space-y-3">
                              {payroll.auditors.map((auditor) => {
                                const record = accessRecords.find(
                                  (entry) =>
                                    entry.contractId === payroll.contractId &&
                                    entry.auditor === auditor,
                                );

                                return (
                                  <div
                                    key={`${payroll.contractId}-${auditor}`}
                                    className="flex flex-col gap-3 rounded-lg border border-gray-100 bg-gray-50 p-3 md:flex-row md:items-center md:justify-between"
                                  >
                                    <div className="min-w-0">
                                      <p className="truncate font-mono text-sm text-gray-900">
                                        {auditor}
                                      </p>
                                      <p className="mt-1 text-xs text-gray-500">
                                        Granted:{" "}
                                        {record
                                          ? new Date(
                                              record.grantedAt,
                                            ).toLocaleString()
                                          : "Unknown"}
                                      </p>
                                    </div>
                                    <Button
                                      onClick={() =>
                                        handleRevokeAccess(
                                          payroll.contractId,
                                          auditor,
                                        )
                                      }
                                      variant="destructive"
                                      size="sm"
                                      disabled={isMutating}
                                    >
                                      Revoke
                                    </Button>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <Card className="border-blue-200 bg-blue-50 text-black">
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-blue-900">
              Privacy on Daml
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-1 text-sm text-blue-800">
              {isEmployerView ? (
                <>
                  <li>
                    Auditors only observe payroll runs you explicitly
                    authorize.
                  </li>
                  <li>
                    Verification scope is tied to a payroll run, its employee
                    count, and its {DEFAULT_PAYROLL_CURRENCY} total.
                  </li>
                  <li>
                    Employee payment contracts stay visible to the employer and
                    employee.
                  </li>
                  <li>You can revoke payroll-run access at any time.</li>
                </>
              ) : (
                <>
                  <li>
                    You only see payroll runs that were explicitly shared with
                    your auditor party.
                  </li>
                  <li>
                    Unshared payroll runs and unrelated employee payment
                    contracts stay hidden from this view.
                  </li>
                  <li>
                    Your verification scope is limited to the payroll run,
                    employee count, and {DEFAULT_PAYROLL_CURRENCY} total.
                  </li>
                  <li>
                    The employer controls access and can revoke it at any time.
                  </li>
                </>
              )}
            </ul>
          </CardContent>
        </Card>
      </div>

      {AlertDialogElement}
      {ConfirmDialogElement}
    </div>
  );
}
