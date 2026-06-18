"use client";

export const dynamic = "force-dynamic";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { usePrivy } from "@privy-io/react-auth";
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
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">My Payment Portal</h1>
        <p className="mt-2 text-gray-600">
          View and claim payment records that are visible only to you and your
          employer.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
        <Card className="p-6">
          <h3 className="text-sm font-medium text-gray-600">Total Payments</h3>
          <p className="mt-2 text-3xl font-bold">
            ${totalEarned.toLocaleString()}
          </p>
        </Card>

        <Card className="p-6">
          <h3 className="text-sm font-medium text-gray-600">Claimed</h3>
          <p className="mt-2 text-3xl font-bold">{claimedPayments.length}</p>
        </Card>

        <Card className="p-6">
          <h3 className="text-sm font-medium text-gray-600">Awaiting Claim</h3>
          <p className="mt-2 text-3xl font-bold">{pendingPayments.length}</p>
        </Card>
      </div>

      <Card className="p-6">
        <h2 className="mb-4 text-xl font-semibold">Payment History</h2>
        <p className="mb-4 text-sm text-gray-600">
          Private by default: these payment contracts are scoped to your party.
        </p>

        {isLoading ? (
          <p className="text-gray-500">Loading payment history...</p>
        ) : error ? (
          <p className="text-red-500">Failed to load your payments.</p>
        ) : paymentRecords.length === 0 ? (
          <div className="py-8 text-center">
            <p className="text-gray-500">No payments yet.</p>
            <p className="mt-1 text-sm text-gray-400">
              Your payroll payments appear here after a payroll run is issued.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {paymentRecords.map((payment) => (
              <div
                key={payment.contractId}
                className="flex flex-col gap-4 rounded-lg border p-4 md:flex-row md:items-center md:justify-between"
              >
                <div>
                  <p className="font-semibold">
                    Payroll #{payment.payload.payrollId}
                  </p>
                  <p className="text-sm text-gray-600">
                    Employer: {payment.payload.employer}
                  </p>
                  <p className="text-sm text-gray-600">
                    Amount: ${Number(payment.payload.amount).toLocaleString()}
                  </p>
                </div>
                <div className="flex items-center gap-3">
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
                    >
                      {isPending ? "Claiming..." : "Claim Payment"}
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      <Card className="border-green-200 bg-green-50 p-6">
        <h3 className="mb-2 font-semibold text-green-900">Privacy</h3>
        <ul className="space-y-1 text-sm text-green-800">
          <li>
            Your payment contracts are only visible to you and your employer.
          </li>
          <li>Claiming a payment updates the existing payroll record on-ledger.</li>
          <li>
            Approved auditors only observe payroll runs, not your wallet flow.
          </li>
        </ul>
      </Card>
    </div>
  );
}
