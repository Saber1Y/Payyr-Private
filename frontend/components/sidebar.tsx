"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import {
  LayoutDashboard,
  Users,
  Wallet,
  Settings,
  DollarSign,
  PanelRight,
  Lock,
  Eye,
  ShieldCheck,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { usePrivy } from "@privy-io/react-auth";

const navigation = [
  {
    name: "Dashboard",
    href: "/dashboard",
    icon: LayoutDashboard,
  },
  {
    name: "Employees",
    href: "/employees",
    icon: Users,
  },
  {
    name: "Payroll",
    href: "/payroll",
    icon: Wallet,
  },
  {
    name: "Auditors",
    href: "/auditors",
    icon: ShieldCheck,
  },
  {
    name: "My Payments",
    href: "/employee-portal",
    icon: Eye,
  },
  {
    name: "Privacy Demo",
    href: "/privacy-demo",
    icon: Lock,
  },
  {
    name: "Settings",
    href: "/settings",
    icon: Settings,
  },
];

export function Sidebar() {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(true);
  const { authenticated } = usePrivy();

  const handleNavClick = (e: React.MouseEvent, href: string) => {
    if (!authenticated) {
      e.preventDefault();
    }
  };

  return (
    <div
      className={cn(
        "flex h-full flex-col bg-white border-r border-gray-200 transition-all duration-300 ease-in-out",
        isOpen ? "w-64" : "w-20"
      )}
    >
      {/* Logo/Brand */}
      <div className="flex h-16 items-center justify-between px-4">
        <div className="flex items-center space-x-2">
          <DollarSign className="h-8 w-8 text-indigo-600" />
          {isOpen && (
            <span className="text-xl font-bold text-gray-900">Payyr Private</span>
          )}
        </div>
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors"
        >
          {/* {isOpen ? (
            <ChevronLeft className="h-5 w-5 text-gray-500" />
          ) : (
            <ChevronRight className="h-5 w-5 text-gray-500" />
          )} */}
          <PanelRight className="h-5 w-5 text-gray-500" />
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1 px-4 py-4">
        {navigation.map((item) => {
          const isActive = pathname === item.href;
          const isDisabled = !authenticated && item.href !== "/";
          return (
            <Link
              key={item.name}
              href={item.href}
              title={!isOpen ? item.name : undefined}
              onClick={(e) => handleNavClick(e, item.href)}
              className={cn(
                "group flex items-center px-2 py-2 text-sm font-medium rounded-lg transition-colors relative",
                isActive
                  ? "bg-indigo-50 text-indigo-700"
                  : isDisabled
                  ? "text-gray-400 cursor-not-allowed"
                  : "text-gray-600 hover:bg-gray-50 hover:text-gray-900",
                !isOpen && "justify-center"
              )}
            >
              <item.icon
                className={cn(
                  "h-5 w-8 shrink-0",
                  isOpen && "mr-4",
                  isActive
                    ? "text-indigo-500"
                    : isDisabled
                    ? "text-gray-300"
                    : "text-gray-400 group-hover:text-gray-500"
                )}
              />
              {isOpen && <span className="truncate">{item.name}</span>}
              {!isOpen && (
                <div className="absolute left-full ml-2 px-2 py-1 bg-gray-900 text-white text-sm rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50">
                  {item.name}
                </div>
              )}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
