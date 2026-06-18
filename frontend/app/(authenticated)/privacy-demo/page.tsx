"use client";

import { Card } from "@/components/ui/card";

interface DemoEmployee {
  name: string;
  salary: number;
  status: "Paid" | "Pending";
}

const demoEmployees: DemoEmployee[] = [
  { name: "Ada", salary: 1500, status: "Paid" },
  { name: "Malik", salary: 2000, status: "Paid" },
  { name: "Sara", salary: 1200, status: "Paid" },
];

export default function PrivacyDemoPage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Payyr Private: Privacy Demo</h1>
        <p className="text-gray-600 mt-2">
          See how Payyr Private uses Canton-style privacy to protect payroll
          data. Different users see only the information they are allowed to
          see.
        </p>
      </div>

      {/* Three-column demo */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Employer View */}
        <div>
          <Card className="p-6 border-blue-200 bg-blue-50">
            <h2 className="text-xl font-bold text-blue-900 mb-1">
              👔 Employer View
            </h2>
            <p className="text-sm text-blue-700 mb-4">
              You can see all payroll details
            </p>

            <div className="space-y-3 mb-6">
              <div className="bg-white rounded p-3 border-l-4 border-blue-500">
                <p className="font-semibold">Ada</p>
                <p className="text-sm text-gray-600">Salary: $1,500</p>
                <span className="inline-block mt-1 px-2 py-1 bg-green-100 text-green-800 text-xs rounded">
                  Paid
                </span>
              </div>

              <div className="bg-white rounded p-3 border-l-4 border-blue-500">
                <p className="font-semibold">Malik</p>
                <p className="text-sm text-gray-600">Salary: $2,000</p>
                <span className="inline-block mt-1 px-2 py-1 bg-green-100 text-green-800 text-xs rounded">
                  Paid
                </span>
              </div>

              <div className="bg-white rounded p-3 border-l-4 border-blue-500">
                <p className="font-semibold">Sara</p>
                <p className="text-sm text-gray-600">Salary: $1,200</p>
                <span className="inline-block mt-1 px-2 py-1 bg-green-100 text-green-800 text-xs rounded">
                  Paid
                </span>
              </div>
            </div>

            <div className="text-sm bg-blue-100 p-3 rounded text-blue-900">
              <p className="font-semibold mb-1">Summary</p>
              <p>Total: $4,700 paid to 3 employees</p>
            </div>
          </Card>
        </div>

        {/* Employee View (Malik) */}
        <div>
          <Card className="p-6 border-green-200 bg-green-50">
            <h2 className="text-xl font-bold text-green-900 mb-1">
              👤 Employee View
            </h2>
            <p className="text-sm text-green-700 mb-4">
              Malik can only see their own payment
            </p>

            <div className="space-y-3 mb-6">
              <div className="bg-white rounded p-3 border-l-4 border-green-500">
                <p className="font-semibold">Malik</p>
                <p className="text-sm text-gray-600">Your Payment: $2,000</p>
                <span className="inline-block mt-1 px-2 py-1 bg-green-100 text-green-800 text-xs rounded">
                  Paid
                </span>
              </div>

              <div className="bg-gray-200 rounded p-3 opacity-50">
                <p className="font-semibold text-gray-600">••••• (hidden)</p>
                <p className="text-sm text-gray-500">
                  You don't have permission to view this
                </p>
              </div>

              <div className="bg-gray-200 rounded p-3 opacity-50">
                <p className="font-semibold text-gray-600">••••• (hidden)</p>
                <p className="text-sm text-gray-500">
                  You don't have permission to view this
                </p>
              </div>
            </div>

            <div className="text-sm bg-green-100 p-3 rounded text-green-900">
              <p className="font-semibold mb-1">Your Info</p>
              <p>Your payment this period: $2,000</p>
            </div>
          </Card>
        </div>

        {/* Public View (Unauthorized) */}
        <div>
          <Card className="p-6 border-red-200 bg-red-50">
            <h2 className="text-xl font-bold text-red-900 mb-1">
              🚫 Public View
            </h2>
            <p className="text-sm text-red-700 mb-4">
              Unauthorized users see nothing
            </p>

            <div className="space-y-3 mb-6">
              <div className="bg-gray-300 rounded p-3 opacity-40">
                <p className="font-semibold text-gray-600">••••• (hidden)</p>
                <p className="text-sm text-gray-500">No permission</p>
              </div>

              <div className="bg-gray-300 rounded p-3 opacity-40">
                <p className="font-semibold text-gray-600">••••• (hidden)</p>
                <p className="text-sm text-gray-500">No permission</p>
              </div>

              <div className="bg-gray-300 rounded p-3 opacity-40">
                <p className="font-semibold text-gray-600">••••• (hidden)</p>
                <p className="text-sm text-gray-500">No permission</p>
              </div>
            </div>

            <div className="text-sm bg-red-100 p-3 rounded text-red-900">
              <p className="font-semibold mb-1">Access Denied</p>
              <p>You do not have permission to view this payroll batch.</p>
            </div>
          </Card>
        </div>
      </div>

      {/* Privacy Features Explanation */}
      <Card className="p-8 bg-gradient-to-r from-purple-50 to-blue-50 border-purple-200">
        <h2 className="text-2xl font-bold mb-6 text-purple-900">
          🔐 How Payyr Private Works
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h3 className="font-semibold text-lg mb-2 text-purple-900">
              Private Salary Records
            </h3>
            <p className="text-gray-700">
              Employee salaries are encrypted and only visible to the employee
              and their employer. Other employees cannot see salary information.
            </p>
          </div>

          <div>
            <h3 className="font-semibold text-lg mb-2 text-purple-900">
              Private Payroll Batches
            </h3>
            <p className="text-gray-700">
              Payroll batch details (total amount, employee count) are only
              visible to the employer and authorized auditors.
            </p>
          </div>

          <div>
            <h3 className="font-semibold text-lg mb-2 text-purple-900">
              Employee-Only Visibility
            </h3>
            <p className="text-gray-700">
              Each employee only sees their own payment amount and status. They
              cannot see other employees' compensation.
            </p>
          </div>

          <div>
            <h3 className="font-semibold text-lg mb-2 text-purple-900">
              Auditor Access Control
            </h3>
            <p className="text-gray-700">
              Employers can grant auditors temporary access to verify payroll
              records without exposing data to the public.
            </p>
          </div>

          <div>
            <h3 className="font-semibold text-lg mb-2 text-purple-900">
              Role-Based Permissions
            </h3>
            <p className="text-gray-700">
              The system enforces role-based access control at the smart
              contract level, ensuring data access policies are
              cryptographically enforced.
            </p>
          </div>

          <div>
            <h3 className="font-semibold text-lg mb-2 text-purple-900">
              Canton Privacy Native
            </h3>
            <p className="text-gray-700">
              These privacy features align with Canton's design pattern for
              financial workflows requiring selective data visibility.
            </p>
          </div>
        </div>
      </Card>

      {/* Use Cases */}
      <Card className="p-8">
        <h2 className="text-2xl font-bold mb-6">Real-World Use Cases</h2>

        <div className="space-y-4">
          <div className="border-l-4 border-blue-500 pl-4">
            <h3 className="font-semibold text-lg mb-1">Global Teams</h3>
            <p className="text-gray-700">
              Companies with employees in different regions can run payroll
              confidentially, keeping salary data private across borders.
            </p>
          </div>

          <div className="border-l-4 border-green-500 pl-4">
            <h3 className="font-semibold text-lg mb-1">Contractor Networks</h3>
            <p className="text-gray-700">
              Pay multiple contractors without exposing their rates to each
              other or the public, protecting competitive information.
            </p>
          </div>

          <div className="border-l-4 border-purple-500 pl-4">
            <h3 className="font-semibold text-lg mb-1">Auditor Verification</h3>
            <p className="text-gray-700">
              Companies can prove payroll execution to auditors and tax
              authorities without making employee salary data public.
            </p>
          </div>

          <div className="border-l-4 border-orange-500 pl-4">
            <h3 className="font-semibold text-lg mb-1">
              Privacy-Conscious Employees
            </h3>
            <p className="text-gray-700">
              Employees can trust that their compensation details remain
              confidential and are not exposed across the broader ledger.
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
}
