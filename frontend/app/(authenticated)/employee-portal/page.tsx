"use client";

export const dynamic = "force-dynamic";

import { useMemo } from "react";
import { usePrivy } from "@privy-io/react-auth";
import { NoAccessState } from "@/components/access/NoAccessState";
import {
  CheckCircle2,
  Clock3,
  DollarSign,
  FileText,
  Loader2,
  ShieldCheck,
  Wallet,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  useClaimPayment,
  useEmployeePayments,
  useEmployeeWallets,
} from "@/lib/daml/hooks";
import { useDamlParty } from "@/hooks/useDamlParty";
import { DEFAULT_PAYROLL_CURRENCY, formatPayrollAmount } from "@/lib/payrollCurrency";
import { useAlert } from "@/hooks/useDialogs";

export default function EmployeePortalPage() {
  const { authenticated } = usePrivy();
  const { damlParty: employeeParty, walletRole } = useDamlParty();
  const { showAlert, AlertDialogElement } = useAlert();

  const {
    data: payments,
    isLoading,
    error,
  } = useEmployeePayments(employeeParty);
  const { data: wallets, isLoading: isWalletLoading } =
    useEmployeeWallets(employeeParty);
  const { mutate: claimPayment, isPending } = useClaimPayment();

  const paymentRecords = useMemo(() => {
    return [...(payments ?? [])].sort((left, right) => {
      return (
        new Date(right.payload.issuedAt).getTime() -
        new Date(left.payload.issuedAt).getTime()
      );
    });
  }, [payments]);
  const employeeWallet = wallets?.[0]?.payload;
  const walletBalance = Number(employeeWallet?.balance ?? 0);
  const totalEarned = paymentRecords.reduce(
    (sum, payment) => sum + Number(payment.payload.amount),
    0,
  );
  const claimedPayments = paymentRecords.filter(
    (payment) => payment.payload.claimed,
  );
  const pendingPayments = paymentRecords.filter(
    (payment) => !payment.payload.claimed,
  );
  const latestPayment = paymentRecords[0];

  if (!authenticated) {
    return <div>Please log in to view your payment portal.</div>;
  }

  if (walletRole !== "employee") {
    return (
      <NoAccessState message="This page is only available to the employee who received the payment. This wallet is not authorized to view private receipts or balances." />
    );
  }

  return (
    <div className="min-h-screen bg-[#114277] p-4 md:p-8">
      <div className="space-y-6 md:space-y-8">
        <div>
          <h1 className="text-2xl font-bold text-white md:text-3xl">
            My Payments
          </h1>
          <p className="mt-2 text-sm text-gray-300 md:text-base">
            View and claim private {DEFAULT_PAYROLL_CURRENCY} payroll payments
            that are visible only to you and your employer.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-5 md:gap-6">
          <Card className="text-black">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">
                Total Payments
              </CardTitle>
              <DollarSign className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-900">
                {formatPayrollAmount(totalEarned)}
              </div>
              <p className="mt-1 text-xs text-gray-500">
                Value issued from payroll runs in {DEFAULT_PAYROLL_CURRENCY}
              </p>
            </CardContent>
          </Card>

          <Card className="text-black">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">
                Wallet Balance
              </CardTitle>
              <Wallet className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-900">
                {isWalletLoading
                  ? "Loading..."
                  : formatPayrollAmount(
                      walletBalance,
                      employeeWallet?.currency ?? DEFAULT_PAYROLL_CURRENCY,
                    )}
              </div>
              <p className="mt-1 text-xs text-gray-500">
                Private wallet balance credited by payroll settlement
              </p>
            </CardContent>
          </Card>

          <Card className="text-black">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">
                Claimed
              </CardTitle>
              <CheckCircle2 className="h-4 w-4 text-emerald-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-900">
                {claimedPayments.length}
              </div>
              <p className="mt-1 text-xs text-gray-500">
                Payments already acknowledged
              </p>
            </CardContent>
          </Card>

          <Card className="text-black">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">
                Awaiting Claim
              </CardTitle>
              <Clock3 className="h-4 w-4 text-amber-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-900">
                {pendingPayments.length}
              </div>
              <p className="mt-1 text-xs text-gray-500">
                Ready for your next action
              </p>
            </CardContent>
          </Card>

          <Card className="text-black">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">
                Latest Receipt
              </CardTitle>
              <FileText className="h-4 w-4 text-indigo-600" />
            </CardHeader>
            <CardContent>
              <div className="text-lg font-bold text-gray-900">
                {latestPayment
                  ? latestPayment.payload.receiptReference
                  : "No receipt"}
              </div>
              <p className="mt-1 text-xs text-gray-500">
                Private proof reference for your most recent payroll record
              </p>
            </CardContent>
          </Card>
        </div>

        <Card className="text-black">
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-black">
              Payment Receipts
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="mb-4 text-sm text-gray-600">
              Private by default: each receipt is scoped to your party and your
              employer, with a proof reference you can use during payroll
              support or audit review.
            </p>

            {isLoading ? (
              <div className="flex items-center gap-2 text-gray-500">
                <Loader2 className="h-4 w-4 animate-spin" />
                Loading payment history...
              </div>
            ) : error ? (
              <p className="text-red-500">Failed to load your payments.</p>
            ) : paymentRecords.length === 0 ? (
              <div className="rounded-xl border border-dashed border-gray-200 bg-gray-50 px-4 py-10 text-center">
                <p className="text-gray-500">No payments yet.</p>
                <p className="mt-1 text-sm text-gray-400">
                  Your payroll payments appear here after a payroll run is
                  issued.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {paymentRecords.map((payment) => (
                  <div
                    key={payment.contractId}
                    className="rounded-xl border bg-gray-50 p-4"
                  >
                    <div className="flex flex-col gap-4">
                      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <p className="font-semibold text-gray-900">
                              Payroll #{payment.payload.payrollId}
                            </p>
                            <span
                              className={`inline-block rounded-full px-3 py-1 text-xs font-medium ${
                                payment.payload.claimed
                                  ? "bg-green-100 text-green-800"
                                  : "bg-yellow-100 text-yellow-800"
                              }`}
                            >
                              {payment.payload.claimed
                                ? "Claimed"
                                : payment.payload.settled
                                  ? "Settled"
                                  : "Pending"}
                            </span>
                          </div>
                          <p className="mt-2 text-2xl font-bold text-gray-900">
                            {formatPayrollAmount(
                              Number(payment.payload.amount),
                              payment.payload.paymentCurrency,
                            )}
                          </p>
                          <p className="mt-1 text-sm text-gray-600 wrap-break-word leading-relaxed max-w-md whitespace-normal">
                            Employer: {payment.payload.employer}
                          </p>
                        </div>

                        {!payment.payload.claimed && (
                          <Button
                            disabled={isPending}
                            onClick={() =>
                              claimPayment({ contractId: payment.contractId, party: employeeParty }, {
                                onError: (claimError) => {
                                  showAlert(
                                    `Failed to claim payment: ${claimError.message}`,
                                  );
                                },
                              })
                            }
                            className="gap-2"
                          >
                            {isPending ? (
                              <>
                                <Loader2 className="h-4 w-4 animate-spin" />
                                Claiming...
                              </>
                            ) : (
                              <>
                                <Wallet className="h-4 w-4" />
                                Claim Payment
                              </>
                            )}
                          </Button>
                        )}
                      </div>

                      <div className="grid grid-cols-1 gap-3 rounded-lg border border-gray-200 bg-white p-4 md:grid-cols-2">
                        <div>
                          <p className="text-xs uppercase tracking-wide text-gray-500">
                            Receipt Reference
                          </p>
                          <p className="mt-1 font-mono text-sm text-gray-900">
                            {payment.payload.receiptReference}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs uppercase tracking-wide text-gray-500">
                            Currency
                          </p>
                          <p className="mt-1 text-sm font-medium text-gray-900">
                            {payment.payload.paymentCurrency}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs uppercase tracking-wide text-gray-500">
                            Receipt Scope
                          </p>
                          <p className="mt-1 text-sm font-medium text-gray-900">
                            Employee + Employer only
                          </p>
                        </div>
                        <div>
                          <p className="text-xs uppercase tracking-wide text-gray-500">
                            Proof Status
                          </p>
                          <p className="mt-1 text-sm font-medium text-gray-900">
                            {payment.payload.claimed
                              ? "Acknowledged on ledger"
                              : payment.payload.settled
                                ? "Settled to private wallet"
                                : "Awaiting employee claim"}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs uppercase tracking-wide text-gray-500">
                            Settled At
                          </p>
                          <p className="mt-1 text-sm font-medium text-gray-900">
                            {payment.payload.settledAt
                              ? new Date(payment.payload.settledAt).toLocaleString(
                                  "en-US",
                                )
                              : "Not settled"}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs uppercase tracking-wide text-gray-500">
                            Claimed At
                          </p>
                          <p className="mt-1 text-sm font-medium text-gray-900">
                            {payment.payload.claimedAt
                              ? new Date(payment.payload.claimedAt).toLocaleString(
                                  "en-US",
                                )
                              : "Not claimed yet"}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="border-blue-200 bg-blue-50 text-black">
          <CardHeader>
            <div className="flex items-center gap-2">
              <ShieldCheck className="h-5 w-5 text-blue-900" />
              <CardTitle className="text-lg font-semibold text-blue-900">
                Receipt Proof
              </CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <ul className="space-y-1 text-sm text-blue-800">
              <li>
                Each payroll receipt includes a private reference tied to the
                ledger contract.
              </li>
              <li>
                Your employer can use that reference to reconcile support
                requests without exposing other employees.
              </li>
              <li>
                The wallet balance above proves that the private payroll
                settlement already credited your account.
              </li>
              <li>
                Claimed receipts act as your acknowledgement of the payroll
                record on-ledger.
              </li>
            </ul>
          </CardContent>
        </Card>

        <Card className="border-green-200 bg-green-50 text-black">
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-green-900">
              Privacy
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-1 text-sm text-green-800">
              <li>
                Your payment contracts are only visible to you and your
                employer.
              </li>
              <li>
                Claiming a payment updates the existing payroll record
                on-ledger.
              </li>
              <li>
                Approved auditors only observe payroll runs, not your wallet
                details or private {DEFAULT_PAYROLL_CURRENCY} receipt view.
              </li>
            </ul>
          </CardContent>
        </Card>
      </div>

      {AlertDialogElement}
    </div>
  );
}
