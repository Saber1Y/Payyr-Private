"use client";

import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { useAccount } from "wagmi";

interface EmployeePayment {
  payrollId: number;
  amount: number;
  date: Date;
  status: "pending" | "completed" | "failed";
  employerName: string;
}

export default function EmployeePortalPage() {
  const { address } = useAccount();
  const [payments, setPayments] = useState<EmployeePayment[]>([]);
  const [totalEarned, setTotalEarned] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // TODO: Fetch employee's payments from contract
    const loadPayments = async () => {
      try {
        setLoading(true);
        // Placeholder data
        const mockPayments: EmployeePayment[] = [];
        setPayments(mockPayments);
        setTotalEarned(0);
      } catch (error) {
        console.error("Error loading payments:", error);
      } finally {
        setLoading(false);
      }
    };

    if (address) {
      loadPayments();
    }
  }, [address]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">My Payment Portal</h1>
        <p className="text-gray-600 mt-2">
          View your confidential payment records. Only you can see this
          information.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="p-6">
          <h3 className="text-sm font-medium text-gray-600">Total Received</h3>
          <p className="text-3xl font-bold mt-2">
            ${totalEarned.toLocaleString()}
          </p>
        </Card>

        <Card className="p-6">
          <h3 className="text-sm font-medium text-gray-600">
            Payments Received
          </h3>
          <p className="text-3xl font-bold mt-2">{payments.length}</p>
        </Card>

        <Card className="p-6">
          <h3 className="text-sm font-medium text-gray-600">Account Status</h3>
          <p className="text-3xl font-bold mt-2 text-green-600">Active</p>
        </Card>
      </div>

      <Card className="p-6">
        <h2 className="text-xl font-semibold mb-4">Payment History</h2>
        <p className="text-sm text-gray-600 mb-4">
          ✓ Private: Only you can see your payment details.
        </p>

        {loading ? (
          <p className="text-gray-500">Loading payment history...</p>
        ) : payments.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-gray-500">No payments yet</p>
            <p className="text-sm text-gray-400 mt-1">
              Your payments will appear here when your employer runs payroll.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2 px-4 font-semibold">Date</th>
                  <th className="text-left py-2 px-4 font-semibold">
                    Employer
                  </th>
                  <th className="text-left py-2 px-4 font-semibold">Amount</th>
                  <th className="text-left py-2 px-4 font-semibold">Status</th>
                </tr>
              </thead>
              <tbody>
                {payments.map((payment) => (
                  <tr
                    key={payment.payrollId}
                    className="border-b hover:bg-gray-50"
                  >
                    <td className="py-3 px-4">
                      {payment.date.toLocaleDateString()}
                    </td>
                    <td className="py-3 px-4">{payment.employerName}</td>
                    <td className="py-3 px-4 font-semibold">
                      ${payment.amount.toLocaleString()}
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${
                          payment.status === "completed"
                            ? "bg-green-100 text-green-800"
                            : payment.status === "pending"
                              ? "bg-yellow-100 text-yellow-800"
                              : "bg-red-100 text-red-800"
                        }`}
                      >
                        {payment.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <Card className="p-6 bg-green-50 border-green-200">
        <h3 className="font-semibold text-green-900 mb-2">🔐 Your Privacy</h3>
        <ul className="text-sm text-green-800 space-y-1">
          <li>
            ✓ Your salary is private - only you and your employer can see it
          </li>
          <li>✓ Other employees cannot see your payment information</li>
          <li>
            ✓ Only auditors approved by your employer can access payroll data
          </li>
          <li>
            ✓ Your wallet address is not publicly visible on the blockchain
          </li>
        </ul>
      </Card>
    </div>
  );
}
