"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/components/auth-provider";
import {
  LayoutDashboard,
  Users,
  FileText,
  CreditCard,
  Wallet,
  BarChart3,
  Settings,
  LogOut,
  Menu,
  X,
  Wrench,
  ChevronRight,
} from "lucide-react";

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/dashboard/customers", label: "Customers", icon: Users },
  { href: "/dashboard/bills", label: "Bills", icon: FileText },
  { href: "/dashboard/payments", label: "Payments", icon: CreditCard },
  { href: "/dashboard/expenses", label: "Expenses", icon: Wallet },
  { href: "/dashboard/reports", label: "Reports", icon: BarChart3 },
  { href: "/dashboard/settings", label: "Settings", icon: Settings },
];

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, logout, isLoading } = useAuth();
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-neutral-950">
        <div className="flex flex-col items-center gap-4">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          <p className="text-sm text-neutral-400 animate-pulse">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) return null;

  const currentPage = navItems.find((item) => pathname === item.href);
  const breadcrumb = currentPage ? currentPage.label : "Dashboard";

  return (
    <div className="flex min-h-screen bg-neutral-950">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-64 transform bg-neutral-900/95 backdrop-blur-xl border-r border-neutral-800 transition-transform duration-300 ease-in-out lg:relative lg:translate-x-0 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* Sidebar Header */}
        <div className="flex h-16 items-center justify-between border-b border-neutral-800 px-5">
          <Link href="/dashboard" className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-neutral-900">
              <Wrench className="h-5 w-5 stroke-[2.5]" />
            </div>
            <div>
              <span className="font-bold text-sm text-white tracking-tight">
                JCB Manager
              </span>
              <span className="block text-[10px] text-neutral-500 -mt-0.5">
                Rental & Accounting
              </span>
            </div>
          </Link>
          <button
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden text-neutral-400 hover:text-white"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 space-y-1 px-3 py-4">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setSidebarOpen(false)}
                className={`flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-medium transition-all duration-200 ${
                  isActive
                    ? "bg-primary/10 text-primary shadow-sm"
                    : "text-neutral-400 hover:bg-neutral-800/50 hover:text-neutral-200"
                }`}
              >
                <Icon className={`h-4.5 w-4.5 ${isActive ? "text-primary" : ""}`} />
                {item.label}
                {isActive && (
                  <ChevronRight className="ml-auto h-3.5 w-3.5 text-primary/60" />
                )}
              </Link>
            );
          })}
        </nav>

        {/* User Info at Bottom */}
        <div className="border-t border-neutral-800 p-4">
          <div className="flex items-center gap-3 rounded-xl bg-neutral-800/30 p-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 text-primary text-xs font-bold">
              {user.full_name.charAt(0).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-white truncate">
                {user.full_name}
              </p>
              <p className="text-[10px] text-neutral-500 capitalize">
                {user.role}
              </p>
            </div>
            <button
              onClick={logout}
              className="text-neutral-500 hover:text-red-400 transition-colors"
              title="Sign out"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex flex-1 flex-col min-w-0">
        {/* Top Bar */}
        <header className="sticky top-0 z-30 flex h-14 items-center gap-4 border-b border-neutral-800 bg-neutral-950/80 backdrop-blur-md px-4 lg:px-6">
          <button
            onClick={() => setSidebarOpen(true)}
            className="lg:hidden text-neutral-400 hover:text-white"
          >
            <Menu className="h-5 w-5" />
          </button>

          {/* Breadcrumb */}
          <div className="flex items-center gap-2 text-sm">
            <span className="text-neutral-500">Dashboard</span>
            {breadcrumb !== "Dashboard" && (
              <>
                <ChevronRight className="h-3.5 w-3.5 text-neutral-600" />
                <span className="text-neutral-200 font-medium">
                  {breadcrumb}
                </span>
              </>
            )}
          </div>

          <div className="ml-auto flex items-center gap-3">
            <span className="hidden sm:block text-xs text-neutral-500">
              {user.email}
            </span>
            <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-primary text-xs font-bold">
              {user.full_name.charAt(0).toUpperCase()}
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 p-4 lg:p-6 overflow-auto">{children}</main>
      </div>
    </div>
  );
}
