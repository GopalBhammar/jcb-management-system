"use client"

import React from "react";
import { useAuth } from "@/components/auth-provider";
import { LayoutDashboard, LogOut, Shield, User as UserIcon } from "lucide-react";

export default function DashboardPage() {
  const { user, logout, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-neutral-950 text-neutral-400">
        <p className="animate-pulse">Loading dashboard session...</p>
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100 flex flex-col">
      {/* Top Navbar */}
      <header className="h-16 border-b border-neutral-900 px-6 flex items-center justify-between bg-neutral-900/40 backdrop-blur-md">
        <div className="flex items-center gap-2">
          <LayoutDashboard className="h-5 w-5 text-primary" />
          <span className="font-bold tracking-tight">JCB Dashboard</span>
        </div>
        <button
          onClick={logout}
          className="inline-flex items-center gap-2 rounded-lg border border-neutral-800 bg-neutral-900 hover:bg-neutral-800 px-4 py-2 text-xs font-semibold text-neutral-300 transition-all duration-200"
        >
          <LogOut className="h-3.5 w-3.5" />
          Sign Out
        </button>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 p-6 max-w-4xl mx-auto w-full flex flex-col justify-center">
        <div className="rounded-3xl border border-neutral-800 bg-neutral-900/30 p-8 text-center space-y-6">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 text-primary">
            {user.role === "admin" ? (
              <Shield className="h-8 w-8" />
            ) : (
              <UserIcon className="h-8 w-8" />
            )}
          </div>
          <div>
            <h1 className="text-2xl font-extrabold text-white">Hello, {user.full_name}!</h1>
            <p className="text-sm text-neutral-400 font-light mt-1">
              You are signed in as <span className="text-primary font-medium">{user.role}</span>
            </p>
          </div>
          <div className="border-t border-neutral-800/80 pt-6 grid grid-cols-2 gap-4 text-left max-w-md mx-auto text-xs">
            <div>
              <span className="text-neutral-500 block">Email Address</span>
              <span className="text-neutral-300 font-medium">{user.email}</span>
            </div>
            <div>
              <span className="text-neutral-500 block">User ID</span>
              <span className="text-neutral-300 font-mono font-medium truncate block max-w-[150px]">{user.id}</span>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
