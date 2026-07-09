"use client";

import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api";
import { Download, FileText, Search } from "lucide-react";

interface CustomerLedgerEntry {
  date: string;
  type: "bill" | "payment";
  reference: string;
  description: string;
  debit: number;
  credit: number;
  balance: number;
}

function formatCurrency(v: number) {
  return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(v);
}

export default function ReportsPage() {
  const [selectedCustomer, setSelectedCustomer] = useState("");
  
  const { data: customers } = useQuery<{items: {id: string, name: string}[]}>({
    queryKey: ["customers_dropdown"],
    queryFn: () => apiFetch("/customers?page_size=1000"),
  });

  const { data: ledger, isLoading: isLoadingLedger } = useQuery<CustomerLedgerEntry[]>({
    queryKey: ["customer_ledger", selectedCustomer],
    queryFn: () => apiFetch(`/customers/${selectedCustomer}/ledger`),
    enabled: !!selectedCustomer,
  });

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <h1 className="text-2xl font-bold text-white">Reports</h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Customer Ledger Report */}
        <div className="col-span-1 md:col-span-2 rounded-2xl border border-neutral-800 bg-neutral-900/40 p-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
            <div>
              <h2 className="text-lg font-bold text-white">Customer Ledger</h2>
              <p className="text-sm text-neutral-400">View complete transaction history for a customer</p>
            </div>
            
            <div className="w-full sm:w-72">
              <select value={selectedCustomer} onChange={(e) => setSelectedCustomer(e.target.value)} className="w-full rounded-xl border border-neutral-800 bg-neutral-900/50 py-2.5 px-4 text-sm text-white focus:outline-none focus:ring-2 focus:ring-primary/30">
                <option value="">Select a Customer...</option>
                {customers?.items.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
          </div>

          {selectedCustomer ? (
            <div className="rounded-xl border border-neutral-800 overflow-hidden bg-neutral-950/50">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-neutral-800 bg-neutral-900/60">
                      <th className="px-4 py-3 text-left text-xs font-semibold text-neutral-400 uppercase">Date</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-neutral-400 uppercase">Description</th>
                      <th className="px-4 py-3 text-right text-xs font-semibold text-neutral-400 uppercase text-amber-400/80">Debit (Bill)</th>
                      <th className="px-4 py-3 text-right text-xs font-semibold text-neutral-400 uppercase text-emerald-400/80">Credit (Payment)</th>
                      <th className="px-4 py-3 text-right text-xs font-semibold text-neutral-400 uppercase">Balance</th>
                    </tr>
                  </thead>
                  <tbody>
                    {isLoadingLedger ? (
                      <tr><td colSpan={5} className="px-4 py-8 text-center text-neutral-500">Loading ledger...</td></tr>
                    ) : ledger?.length === 0 ? (
                      <tr><td colSpan={5} className="px-4 py-8 text-center text-neutral-500">No transactions found for this customer.</td></tr>
                    ) : (
                      ledger?.map((entry, i) => (
                        <tr key={i} className="border-b border-neutral-800/50 hover:bg-neutral-900/30">
                          <td className="px-4 py-3 text-neutral-400">{entry.date.split("T")[0]}</td>
                          <td className="px-4 py-3">
                            <span className="text-white font-medium">{entry.description}</span>
                            <span className="block text-xs text-neutral-500 font-mono mt-0.5">{entry.reference}</span>
                          </td>
                          <td className="px-4 py-3 text-right font-medium text-amber-400">
                            {entry.debit > 0 ? formatCurrency(entry.debit) : "-"}
                          </td>
                          <td className="px-4 py-3 text-right font-medium text-emerald-400">
                            {entry.credit > 0 ? formatCurrency(entry.credit) : "-"}
                          </td>
                          <td className={`px-4 py-3 text-right font-bold ${entry.balance > 0 ? "text-amber-400" : "text-white"}`}>
                            {formatCurrency(entry.balance)} {entry.balance > 0 ? "Dr" : entry.balance < 0 ? "Cr" : ""}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-48 border border-dashed border-neutral-800 rounded-xl bg-neutral-900/20">
              <FileText className="h-8 w-8 text-neutral-600 mb-2" />
              <p className="text-sm text-neutral-500">Select a customer to view their ledger</p>
            </div>
          )}
        </div>
      </div>
      
      {/* Note for other reports */}
      <div className="rounded-xl bg-primary/10 border border-primary/20 p-4">
        <p className="text-sm text-primary text-center">PDF and Excel export functionality will be implemented in the final phase.</p>
      </div>
    </div>
  );
}
