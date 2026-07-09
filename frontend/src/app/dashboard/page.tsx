"use client";

import React from "react";
import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api";
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  Clock,
  AlertTriangle,
  ArrowUpRight,
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  Legend,
} from "recharts";

interface DashboardData {
  stats: {
    today_income: number;
    today_expense: number;
    monthly_income: number;
    monthly_expense: number;
    pending_amount: number;
    total_profit: number;
  };
  recent_bills: Array<{
    bill_number: string;
    customer_name: string;
    total_amount: number;
    status: string;
    date: string;
    site_name?: string | null;
  }>;
  recent_payments: Array<{
    customer_name: string;
    amount: number;
    payment_method: string;
    date: string;
  }>;
  monthly_revenue: Array<{ month: string; income: number; expense: number }>;
  expense_breakdown: Array<{ category: string; amount: number }>;
  profit_trend: Array<{ month: string; profit: number }>;
}

const COLORS = [
  "#f59e0b",
  "#3b82f6",
  "#10b981",
  "#ef4444",
  "#8b5cf6",
  "#ec4899",
  "#06b6d4",
  "#f97316",
  "#14b8a6",
  "#6366f1",
];

const statusColors: Record<string, string> = {
  paid: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
  partial: "bg-amber-500/10 text-amber-400 border-amber-500/20",
  pending: "bg-red-500/10 text-red-400 border-red-500/20",
};

function formatCurrency(value: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(value);
}

export default function DashboardPage() {
  const { data, isLoading, error } = useQuery<DashboardData>({
    queryKey: ["dashboard"],
    queryFn: () => apiFetch<DashboardData>("/dashboard"),
    refetchInterval: 30000,
  });

  if (isLoading) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-white">Dashboard</h1>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-28 rounded-2xl bg-neutral-900/50 animate-pulse" />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="h-80 rounded-2xl bg-neutral-900/50 animate-pulse" />
          <div className="h-80 rounded-2xl bg-neutral-900/50 animate-pulse" />
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="flex items-center justify-center h-64 text-neutral-400">
        <p>Failed to load dashboard data. Check backend connection.</p>
      </div>
    );
  }

  const { stats, recent_bills, recent_payments, monthly_revenue, expense_breakdown, profit_trend } = data;

  const statCards = [
    { label: "Today's Income", value: stats.today_income, icon: TrendingUp, color: "text-emerald-400", bg: "bg-emerald-500/10" },
    { label: "Today's Expense", value: stats.today_expense, icon: TrendingDown, color: "text-red-400", bg: "bg-red-500/10" },
    { label: "Monthly Income", value: stats.monthly_income, icon: DollarSign, color: "text-blue-400", bg: "bg-blue-500/10" },
    { label: "Monthly Expense", value: stats.monthly_expense, icon: DollarSign, color: "text-orange-400", bg: "bg-orange-500/10" },
    { label: "Pending Amount", value: stats.pending_amount, icon: Clock, color: "text-amber-400", bg: "bg-amber-500/10" },
    { label: "Profit", value: stats.total_profit, icon: ArrowUpRight, color: stats.total_profit >= 0 ? "text-emerald-400" : "text-red-400", bg: stats.total_profit >= 0 ? "bg-emerald-500/10" : "bg-red-500/10" },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-white">Dashboard</h1>
        <span className="text-xs text-neutral-500">
          Last updated: {new Date().toLocaleTimeString()}
        </span>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        {statCards.map((card, idx) => {
          const Icon = card.icon;
          return (
            <div
              key={idx}
              className="rounded-2xl border border-neutral-800 bg-neutral-900/40 p-4 hover:border-neutral-700 transition-all duration-300"
            >
              <div className="flex items-center gap-2 mb-3">
                <div className={`${card.bg} p-2 rounded-lg`}>
                  <Icon className={`h-4 w-4 ${card.color}`} />
                </div>
              </div>
              <p className="text-[11px] text-neutral-500 font-medium uppercase tracking-wider">
                {card.label}
              </p>
              <p className={`text-xl font-bold mt-1 ${card.color}`}>
                {formatCurrency(card.value)}
              </p>
            </div>
          );
        })}
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Monthly Revenue Chart */}
        <div className="rounded-2xl border border-neutral-800 bg-neutral-900/40 p-5">
          <h2 className="text-sm font-semibold text-white mb-4">
            Monthly Revenue
          </h2>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={monthly_revenue}>
              <CartesianGrid strokeDasharray="3 3" stroke="#262626" />
              <XAxis dataKey="month" tick={{ fill: "#737373", fontSize: 11 }} />
              <YAxis tick={{ fill: "#737373", fontSize: 11 }} />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#171717",
                  border: "1px solid #262626",
                  borderRadius: "12px",
                  fontSize: "12px",
                }}
              />
              <Legend wrapperStyle={{ fontSize: "11px" }} />
              <Bar dataKey="income" name="Income" fill="#10b981" radius={[4, 4, 0, 0]} />
              <Bar dataKey="expense" name="Expense" fill="#ef4444" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Expense Breakdown Pie Chart */}
        <div className="rounded-2xl border border-neutral-800 bg-neutral-900/40 p-5">
          <h2 className="text-sm font-semibold text-white mb-4">
            Expense Breakdown
          </h2>
          {expense_breakdown.length > 0 ? (
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={expense_breakdown}
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={90}
                  paddingAngle={3}
                  dataKey="amount"
                  nameKey="category"
                >
                  {expense_breakdown.map((_, index) => (
                    <Cell key={index} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#171717",
                    border: "1px solid #262626",
                    borderRadius: "12px",
                    fontSize: "12px",
                  }}
                />
                <Legend wrapperStyle={{ fontSize: "11px" }} />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-[250px] text-neutral-500 text-sm">
              No expenses recorded this month
            </div>
          )}
        </div>
      </div>

      {/* Profit Trend */}
      <div className="rounded-2xl border border-neutral-800 bg-neutral-900/40 p-5">
        <h2 className="text-sm font-semibold text-white mb-4">Profit Trend</h2>
        <ResponsiveContainer width="100%" height={200}>
          <LineChart data={profit_trend}>
            <CartesianGrid strokeDasharray="3 3" stroke="#262626" />
            <XAxis dataKey="month" tick={{ fill: "#737373", fontSize: 11 }} />
            <YAxis tick={{ fill: "#737373", fontSize: 11 }} />
            <Tooltip
              contentStyle={{
                backgroundColor: "#171717",
                border: "1px solid #262626",
                borderRadius: "12px",
                fontSize: "12px",
              }}
            />
            <Line
              type="monotone"
              dataKey="profit"
              stroke="#f59e0b"
              strokeWidth={2.5}
              dot={{ fill: "#f59e0b", r: 4 }}
              activeDot={{ r: 6 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Recent Bills & Payments */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Bills */}
        <div className="rounded-2xl border border-neutral-800 bg-neutral-900/40 p-5">
          <h2 className="text-sm font-semibold text-white mb-4">
            Recent Bills
          </h2>
          <div className="space-y-2">
            {recent_bills.length > 0 ? (
              recent_bills.map((bill, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between rounded-xl bg-neutral-800/30 px-4 py-3"
                >
                  <div>
                    <p className="text-xs font-semibold text-white">
                      {bill.bill_number}
                    </p>
                    <p className="text-[10px] text-neutral-500">
                      {bill.customer_name} • {bill.date} {bill.site_name && `• ${bill.site_name}`}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs font-bold text-white">
                      {formatCurrency(bill.total_amount)}
                    </p>
                    <span
                      className={`inline-block mt-1 text-[10px] font-medium px-2 py-0.5 rounded-full border ${
                        statusColors[bill.status] || ""
                      }`}
                    >
                      {bill.status}
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-sm text-neutral-500 text-center py-4">
                No bills yet
              </p>
            )}
          </div>
        </div>

        {/* Recent Payments */}
        <div className="rounded-2xl border border-neutral-800 bg-neutral-900/40 p-5">
          <h2 className="text-sm font-semibold text-white mb-4">
            Recent Payments
          </h2>
          <div className="space-y-2">
            {recent_payments.length > 0 ? (
              recent_payments.map((payment, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between rounded-xl bg-neutral-800/30 px-4 py-3"
                >
                  <div>
                    <p className="text-xs font-semibold text-white">
                      {payment.customer_name}
                    </p>
                    <p className="text-[10px] text-neutral-500">
                      {payment.payment_method.toUpperCase()} • {payment.date}
                    </p>
                  </div>
                  <p className="text-xs font-bold text-emerald-400">
                    +{formatCurrency(payment.amount)}
                  </p>
                </div>
              ))
            ) : (
              <p className="text-sm text-neutral-500 text-center py-4">
                No payments yet
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
