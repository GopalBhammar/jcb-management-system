"use client";

import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api";
import { useAuth } from "@/components/auth-provider";
import {
  Plus, Search, Edit2, Trash2, X, Loader2, ChevronLeft, ChevronRight, CreditCard
} from "lucide-react";

interface Payment {
  id: string;
  bill_number: string;
  customer_name: string;
  amount: number;
  date: string;
  payment_method: string;
  reference_number: string | null;
  created_at: string;
}

interface PaymentDetail extends Payment {
  bill_id: string | null;
  customer_id: string;
  remark: string | null;
  receiver_name: string;
}

interface Customer {
  id: string;
  name: string;
  outstanding?: number; // Optional for selection context
}

interface Bill {
  id: string;
  bill_number: string;
  remaining_amount: number;
}

interface PaginatedPayments {
  items: Payment[];
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
}

function formatCurrency(v: number) {
  return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(v);
}

export default function PaymentsPage() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [customerFilter, setCustomerFilter] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [formError, setFormError] = useState("");
  const [customerSearch, setCustomerSearch] = useState("");
  const [showCustomerDropdown, setShowCustomerDropdown] = useState(false);

  const defaultFormData = {
    customer_id: "",
    bill_id: "",
    amount: 0,
    date: new Date().toISOString().split("T")[0],
    payment_method: "cash",
    reference_number: "",
    remark: "",
  };
  const [formData, setFormData] = useState(defaultFormData);

  // Queries
  const { data, isLoading } = useQuery<PaginatedPayments>({
    queryKey: ["payments", page, customerFilter],
    queryFn: () => apiFetch(`/payments?page=${page}&page_size=10${customerFilter ? `&customer_id=${customerFilter}` : ""}`),
  });

  const { data: customers } = useQuery<{items: Customer[]}>({
    queryKey: ["customers_dropdown"],
    queryFn: () => apiFetch("/customers?page_size=1000"),
  });

  const { data: customerBills } = useQuery<{items: Bill[]}>({
    queryKey: ["customer_bills", formData.customer_id],
    queryFn: () => apiFetch(`/bills?customer_id=${formData.customer_id}&status=pending&page_size=100`),
    enabled: !!formData.customer_id,
  });

  // Mutations
  const createMutation = useMutation({
    mutationFn: (d: any) => apiFetch("/payments", { method: "POST", json: d }),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["payments"] }); queryClient.invalidateQueries({ queryKey: ["bills"] }); closeForm(); },
    onError: (e: Error) => setFormError(e.message),
  });

  const updateMutation = useMutation({
    mutationFn: (d: any) => apiFetch(`/payments/${editId}`, { method: "PUT", json: d }),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["payments"] }); queryClient.invalidateQueries({ queryKey: ["bills"] }); closeForm(); },
    onError: (e: Error) => setFormError(e.message),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => apiFetch(`/payments/${id}`, { method: "DELETE" }),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["payments"] }); queryClient.invalidateQueries({ queryKey: ["bills"] }); setDeleteId(null); },
  });

  const closeForm = () => {
    setShowForm(false); setEditId(null); setFormError("");
    setCustomerSearch(""); setShowCustomerDropdown(false);
    setFormData(defaultFormData);
  };

  const openNewForm = () => {
    setCustomerSearch(""); setShowCustomerDropdown(false);
    setFormData(defaultFormData);
    setShowForm(true);
  };

  const openEdit = async (id: string) => {
    const p = await apiFetch<PaymentDetail>(`/payments/${id}`);
    setFormData({
      customer_id: p.customer_id,
      bill_id: p.bill_id || "",
      amount: p.amount,
      date: p.date || "",
      payment_method: p.payment_method,
      reference_number: p.reference_number || "",
      remark: p.remark || "",
    });
    const selected = customers?.items.find(c => c.id === p.customer_id);
    setCustomerSearch(selected ? selected.name : "");
    setShowCustomerDropdown(false);
    setEditId(id); setShowForm(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.customer_id) { setFormError("Customer is required"); return; }
    if (formData.amount <= 0) { setFormError("Amount must be > 0"); return; }
    
    // Prepare payload (convert empty bill_id string to null)
    const payload = { ...formData, bill_id: formData.bill_id || null };

    if (editId) updateMutation.mutate(payload);
    else createMutation.mutate(payload);
  };

  // Auto-fill amount if bill is selected
  const handleBillSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const bId = e.target.value;
    setFormData(prev => ({ ...prev, bill_id: bId }));
    if (bId && customerBills?.items) {
      const selectedBill = customerBills.items.find((b: any) => b.id === bId);
      if (selectedBill) {
        setFormData(prev => ({ ...prev, amount: selectedBill.remaining_amount }));
      }
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <h1 className="text-2xl font-bold text-white">Payments Received</h1>
        <button onClick={openNewForm} className="flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-neutral-950 hover:bg-primary/90 transition-all">
          <Plus className="h-4 w-4" /> Add Payment
        </button>
      </div>

      {/* Filters */}
      <div className="flex gap-4">
        <select value={customerFilter} onChange={(e) => { setCustomerFilter(e.target.value); setPage(1); }} className="w-full max-w-xs rounded-xl border border-neutral-800 bg-neutral-900/50 py-2.5 px-4 text-sm text-white focus:outline-none focus:ring-2 focus:ring-primary/30">
          <option value="">All Customers</option>
          {customers?.items.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
      </div>

      {/* Table */}
      <div className="rounded-2xl border border-neutral-800 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-neutral-800 bg-neutral-900/60">
                <th className="px-4 py-3 text-left text-xs font-semibold text-neutral-400 uppercase">Date</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-neutral-400 uppercase">Customer</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-neutral-400 uppercase">Linked Bill</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-neutral-400 uppercase">Method</th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-neutral-400 uppercase">Amount</th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-neutral-400 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                [...Array(5)].map((_, i) => (
                  <tr key={i} className="border-b border-neutral-800/50">
                    {[...Array(6)].map((_, j) => (
                      <td key={j} className="px-4 py-3"><div className="h-4 bg-neutral-800 rounded animate-pulse" /></td>
                    ))}
                  </tr>
                ))
              ) : data?.items.length === 0 ? (
                <tr><td colSpan={6} className="px-4 py-12 text-center text-neutral-500">No payments found</td></tr>
              ) : (
                data?.items.map((p) => (
                  <tr key={p.id} className="border-b border-neutral-800/50 hover:bg-neutral-900/30 transition-colors">
                    <td className="px-4 py-3 text-neutral-400">{p.date}</td>
                    <td className="px-4 py-3 font-medium text-white">{p.customer_name}</td>
                    <td className="px-4 py-3 font-mono text-xs text-neutral-400">{p.bill_number || "Advance / General"}</td>
                    <td className="px-4 py-3">
                      <span className="inline-block text-[10px] font-medium px-2 py-0.5 rounded-full border bg-neutral-800/50 text-neutral-300 border-neutral-700 uppercase">
                        {p.payment_method}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right font-bold text-emerald-400">+{formatCurrency(p.amount)}</td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex justify-end gap-1">
                        <button onClick={() => openEdit(p.id)} className="p-1.5 rounded-lg hover:bg-neutral-800 text-neutral-400 hover:text-white transition-colors" title="Edit"><Edit2 className="h-3.5 w-3.5" /></button>
                        {user?.role === "admin" && (
                          <button onClick={() => setDeleteId(p.id)} className="p-1.5 rounded-lg hover:bg-red-500/10 text-neutral-400 hover:text-red-400 transition-colors" title="Delete"><Trash2 className="h-3.5 w-3.5" /></button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination */}
      {data && data.total_pages > 1 && (
        <div className="flex items-center justify-between">
          <span className="text-xs text-neutral-500">Showing {data.items.length} of {data.total} payments</span>
          <div className="flex items-center gap-2">
            <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="p-2 rounded-lg border border-neutral-800 text-neutral-400 hover:text-white disabled:opacity-30"><ChevronLeft className="h-4 w-4" /></button>
            <span className="text-xs text-neutral-400">Page {page} of {data.total_pages}</span>
            <button onClick={() => setPage(p => Math.min(data.total_pages, p + 1))} disabled={page === data.total_pages} className="p-2 rounded-lg border border-neutral-800 text-neutral-400 hover:text-white disabled:opacity-30"><ChevronRight className="h-4 w-4" /></button>
          </div>
        </div>
      )}

      {/* Create/Edit Modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4" onClick={closeForm}>
          <div className="w-full max-w-lg rounded-2xl border border-neutral-800 bg-neutral-950 p-6 shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-bold text-white">{editId ? "Edit Payment" : "Record Payment"}</h2>
              <button onClick={closeForm} className="text-neutral-500 hover:text-white"><X className="h-5 w-5" /></button>
            </div>
            {formError && <div className="mb-4 rounded-xl bg-red-500/10 border border-red-500/20 p-3 text-xs text-red-400">{formError}</div>}
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="relative">
                <label className="block text-xs font-semibold text-neutral-400 mb-1.5">Customer *</label>
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Type name to search customer..."
                    value={customerSearch}
                    onFocus={() => {
                      setShowCustomerDropdown(true);
                      if (formData.customer_id) {
                        setCustomerSearch("");
                      }
                    }}
                    onChange={(e) => {
                      setCustomerSearch(e.target.value);
                      setShowCustomerDropdown(true);
                      if (formData.customer_id) {
                        setFormData(prev => ({ ...prev, customer_id: "", bill_id: "" }));
                      }
                    }}
                    className="w-full rounded-xl border border-neutral-800 bg-neutral-900/50 py-2.5 px-4 text-sm text-white focus:outline-none focus:ring-2 focus:ring-primary/30"
                  />
                  {formData.customer_id && (
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] bg-primary/20 text-primary border border-primary/30 px-2.5 py-0.5 rounded-full font-bold pointer-events-none">
                      Selected
                    </span>
                  )}
                </div>
                
                {/* Autocomplete Dropdown List */}
                {showCustomerDropdown && (
                  <>
                    <div className="fixed inset-0 z-10" onClick={() => {
                      setShowCustomerDropdown(false);
                      const curr = customers?.items.find(c => c.id === formData.customer_id);
                      setCustomerSearch(curr ? curr.name : "");
                    }} />
                    <div className="absolute left-0 right-0 mt-1 max-h-60 overflow-y-auto rounded-xl border border-neutral-800 bg-neutral-950 p-1.5 shadow-2xl z-20 space-y-0.5">
                      {customers?.items.filter(c => 
                        c.name.toLowerCase().includes(customerSearch.toLowerCase())
                      ).length === 0 ? (
                        <div className="p-3 text-xs text-neutral-500 text-center">
                          No customers found. Add customer first.
                        </div>
                      ) : (
                        customers?.items
                          .filter(c => c.name.toLowerCase().includes(customerSearch.toLowerCase()))
                          .map(c => (
                            <button
                              key={c.id}
                              type="button"
                              onClick={() => {
                                setFormData(prev => ({ ...prev, customer_id: c.id, bill_id: "" }));
                                setCustomerSearch(c.name);
                                setShowCustomerDropdown(false);
                              }}
                              className={`w-full text-left rounded-lg py-2 px-3 text-sm transition-all flex items-center justify-between ${
                                formData.customer_id === c.id 
                                  ? "bg-primary text-neutral-950 font-semibold" 
                                  : "text-neutral-300 hover:bg-neutral-900"
                              }`}
                            >
                              <span>{c.name}</span>
                            </button>
                          ))
                      )}
                    </div>
                  </>
                )}
              </div>

              {formData.customer_id && (
                <div>
                  <label className="block text-xs font-semibold text-neutral-400 mb-1.5">Link to Bill (Optional)</label>
                  <select value={formData.bill_id} onChange={handleBillSelect} className="w-full rounded-xl border border-neutral-800 bg-neutral-900/50 py-2.5 px-4 text-sm text-white focus:outline-none focus:ring-2 focus:ring-primary/30">
                    <option value="">Advance / General Payment</option>
                    {customerBills?.items.map((b: any) => (
                      <option key={b.id} value={b.id}>{b.bill_number} (Due: {formatCurrency(b.remaining_amount)})</option>
                    ))}
                  </select>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-neutral-400 mb-1.5">Amount (₹) *</label>
                  <input type="number" min="1" value={formData.amount || ""} onChange={e => setFormData({ ...formData, amount: parseFloat(e.target.value) || 0 })} className="w-full rounded-xl border border-neutral-800 bg-neutral-900/50 py-2.5 px-4 text-sm text-white font-bold text-emerald-400 focus:outline-none focus:ring-2 focus:ring-primary/30" placeholder="0" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-neutral-400 mb-1.5">Date *</label>
                  <input type="date" value={formData.date} onChange={e => setFormData({ ...formData, date: e.target.value })} className="w-full rounded-xl border border-neutral-800 bg-neutral-900/50 py-2.5 px-4 text-sm text-white focus:outline-none focus:ring-2 focus:ring-primary/30 [color-scheme:dark]" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-neutral-400 mb-1.5">Payment Method *</label>
                  <select value={formData.payment_method} onChange={e => setFormData({ ...formData, payment_method: e.target.value })} className="w-full rounded-xl border border-neutral-800 bg-neutral-900/50 py-2.5 px-4 text-sm text-white focus:outline-none focus:ring-2 focus:ring-primary/30">
                    <option value="cash">Cash</option>
                    <option value="upi">UPI</option>
                    <option value="bank">Bank Transfer</option>
                    <option value="cheque">Cheque</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-neutral-400 mb-1.5">Ref. / UTR No.</label>
                  <input type="text" value={formData.reference_number} onChange={e => setFormData({ ...formData, reference_number: e.target.value })} className="w-full rounded-xl border border-neutral-800 bg-neutral-900/50 py-2.5 px-4 text-sm text-white focus:outline-none focus:ring-2 focus:ring-primary/30" placeholder="Optional" />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-neutral-400 mb-1.5">Remark</label>
                <input type="text" value={formData.remark} onChange={e => setFormData({ ...formData, remark: e.target.value })} className="w-full rounded-xl border border-neutral-800 bg-neutral-900/50 py-2.5 px-4 text-sm text-white focus:outline-none focus:ring-2 focus:ring-primary/30" placeholder="Optional notes" />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-neutral-800">
                <button type="button" onClick={closeForm} className="rounded-xl border border-neutral-800 px-4 py-2.5 text-sm font-medium text-neutral-400 hover:text-white">Cancel</button>
                <button type="submit" disabled={createMutation.isPending || updateMutation.isPending} className="flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-neutral-950 hover:bg-primary/90 disabled:opacity-50">
                  {(createMutation.isPending || updateMutation.isPending) && <Loader2 className="h-4 w-4 animate-spin" />}
                  {editId ? "Update Payment" : "Save Payment"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation */}
      {deleteId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-2xl border border-neutral-800 bg-neutral-950 p-6 shadow-2xl text-center">
            <Trash2 className="mx-auto h-10 w-10 text-red-400 mb-4" />
            <h3 className="text-lg font-bold text-white mb-2">Delete Payment?</h3>
            <p className="text-sm text-neutral-400 mb-6">This action cannot be undone. Any linked bill will have its paid amount updated.</p>
            <div className="flex justify-center gap-3">
              <button onClick={() => setDeleteId(null)} className="rounded-xl border border-neutral-800 px-4 py-2.5 text-sm font-medium text-neutral-400">Cancel</button>
              <button onClick={() => deleteId && deleteMutation.mutate(deleteId)} className="rounded-xl bg-red-50 px-4 py-2.5 text-sm font-semibold text-white hover:bg-red-600">
                {deleteMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
