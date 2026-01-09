"use client";

export const dynamic = "force-dynamic";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Settings as SettingsIcon, Save } from "lucide-react";

export default function SettingsPage() {
  const [settings, setSettings] = useState({
    companyName: "Arc Network Inc.",
    timezone: "America/New_York",
    autopay: true,
    notificationEmail: "admin@arcnetwork.com",
    contractAddress: "0x1234...5678",
  });

  const handleSave = () => {
    console.log("Saving settings:", settings);
    // Show success message
  };

  const timezones = [
    { value: "America/New_York", label: "Eastern Time (ET)" },
    { value: "America/Chicago", label: "Central Time (CT)" },
    { value: "America/Denver", label: "Mountain Time (MT)" },
    { value: "America/Los_Angeles", label: "Pacific Time (PT)" },
    { value: "Europe/London", label: "London (GMT)" },
    { value: "Europe/Paris", label: "Paris (CET)" },
    { value: "Asia/Tokyo", label: "Tokyo (JST)" },
    { value: "Asia/Singapore", label: "Singapore (SGT)" },
  ];

  return (
    <div className="p-4 md:p-8 bg-[#114277] min-h-screen text-black">
      <div className="mb-6 md:mb-8">
        <h1 className="text-2xl md:text-3xl font-bold text-white">Settings</h1>
        <p className="text-white mt-2 text-sm md:text-base">
          Configure your payroll system preferences
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
        {/* Company Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <SettingsIcon className="h-5 w-5" />
              Company Settings
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-2">
              <Label htmlFor="company-name">Company Name</Label>
              <Input
                id="company-name"
                value={settings.companyName}
                onChange={(e) =>
                  setSettings({ ...settings, companyName: e.target.value })
                }
                placeholder="Your Company Name"
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="notification-email">Notification Email</Label>
              <Input
                id="notification-email"
                type="email"
                value={settings.notificationEmail}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    notificationEmail: e.target.value,
                  })
                }
                placeholder="admin@company.com"
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="timezone">Timezone</Label>
              <select
                id="timezone"
                value={settings.timezone}
                onChange={(e) =>
                  setSettings({ ...settings, timezone: e.target.value })
                }
                className="flex h-10 w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm ring-offset-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2"
              >
                {timezones.map((tz) => (
                  <option key={tz.value} value={tz.value}>
                    {tz.label}
                  </option>
                ))}
              </select>
            </div>
          </CardContent>
        </Card>

        {/* Payroll Settings */}
        <Card>
          <CardHeader>
            <CardTitle>Payroll Settings</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Automatic Payroll</Label>
                <p className="text-sm text-gray-500">
                  Automatically process payroll on scheduled dates
                </p>
              </div>
              <button
                onClick={() =>
                  setSettings({ ...settings, autopay: !settings.autopay })
                }
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  settings.autopay ? "bg-indigo-600" : "bg-gray-200"
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    settings.autopay ? "translate-x-6" : "translate-x-1"
                  }`}
                />
              </button>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="contract-address">Contract Address</Label>
              <Input
                id="contract-address"
                value={settings.contractAddress}
                onChange={(e) =>
                  setSettings({ ...settings, contractAddress: e.target.value })
                }
                placeholder="0x..."
                className="font-mono"
              />
              <p className="text-xs text-gray-500">
                The smart contract address for your payroll system
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Network Information */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Network Information</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Network</Label>
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <span className="font-medium">Arc Network</span>
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                    Connected
                  </span>
                </div>
              </div>
              <div className="space-y-2">
                <Label>Block Explorer</Label>
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <span className="text-sm text-gray-600">arcscan.io</span>
                  <Button variant="ghost" size="sm">
                    View
                  </Button>
                </div>
              </div>
              <div className="space-y-2">
                <Label>USDC Token</Label>
                <div className="p-3 bg-gray-50 rounded-lg">
                  <span className="text-sm font-mono">0xA0b8...c3D4</span>
                </div>
              </div>
              <div className="space-y-2">
                <Label>Gas Price</Label>
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <span className="text-sm">0.1 ARC</span>
                  <span className="text-xs text-gray-500">Standard</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Save Button */}
      <div className="mt-8 flex justify-end">
        <Button onClick={handleSave} className="gap-2">
          <Save className="h-4 w-4" />
          Save Settings
        </Button>
      </div>
    </div>
  );
}
