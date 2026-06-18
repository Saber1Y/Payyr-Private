"use client";

export const dynamic = "force-dynamic";

import { useEffect } from "react";
import { usePrivy } from "@privy-io/react-auth";
import {
  CheckCircle2,
  Clock3,
  DollarSign,
  Loader2,
  Wallet,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useClaimPayment, useEmployeePayments } from "@/lib/daml/hooks";
import { damlClient } from "@/lib/daml/client";

export default function EmployeePortalPage() {
  const { user, authenticated } = usePrivy();
  const employeeParty = user?.wallet?.address || "";

  useEffect(() => {
    damlClient.setParty(employeeParty);
  }, [employeeParty]);

  const {
    data: payments,
    isLoading,
    error,
  } = useEmployeePayments(employeeParty);
  const { mutate: claimPayment, isPending } = useClaimPayment();

  const paymentRecords = payments ?? [];
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

  if (!authenticated) {
    return <div>Please log in to view your payment portal.</div>;
  }

  return (
    <div className="min-h-screen bg-[#114277] p-4 md:p-8">
      <div className="space-y-6 md:space-y-8">
        <div>
          <h1 className="text-2xl font-bold text-white md:text-3xl">
            My Payments
          </h1>
          <p className="mt-2 text-sm text-gray-300 md:text-base">
            View and claim payroll payments that are visible only to you and
            your employer.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-3 md:gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">
                Total Payments
              </CardTitle>
              <DollarSign className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-900">
                ${totalEarned.toLocaleString()}
              </div>
              <p className="mt-1 text-xs text-gray-500">
                Value issued from payroll runs
              </p>
            </CardContent>
          </Card>

          <Card>
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

          <Card>
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
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-black">
              Payment History
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="mb-4 text-sm text-gray-600">
              Private by default: these payment contracts are scoped to your
              party.
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
                    className="flex flex-col gap-4 rounded-xl border bg-gray-50 p-4 md:flex-row md:items-center md:justify-between"
                  >
                    <div>
                      <p className="font-semibold text-gray-900">
                        Payroll #{payment.payload.payrollId}
                      </p>
                      <p className="mt-1 text-sm text-gray-600">
                        Employer: {payment.payload.employer}
                      </p>
                      <p className="text-sm text-gray-600">
                        Amount: ${Number(payment.payload.amount).toLocaleString()}
                      </p>
                    </div>
                    <div className="flex flex-wrap items-center gap-3">
                      <span
                        className={`inline-block rounded-full px-3 py-1 text-xs font-medium ${
                          payment.payload.claimed
                            ? "bg-green-100 text-green-800"
                            : "bg-yellow-100 text-yellow-800"
                        }`}
                      >
                        {payment.payload.claimed ? "Claimed" : "Pending"}
                      </span>
                      {!payment.payload.claimed && (
                        <Button
                          disabled={isPending}
                          onClick={() =>
                            claimPayment(payment.contractId, {
                              onError: (claimError) => {
                                alert(
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
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="border-green-200 bg-green-50">
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
                Claiming a payment updates the existing payroll record on-ledger.
              </li>
              <li>
                Approved auditors only observe payroll runs, not your wallet
                flow.
              </li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
