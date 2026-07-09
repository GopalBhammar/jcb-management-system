"use client";

import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api";
import { useAuth } from "@/components/auth-provider";
import {
  Plus, Search, Edit2, Trash2, Eye, X, Loader2, ChevronLeft, ChevronRight,
} from "lucide-react";

interface Customer {
  id: string;
  customer_id: string;
  name: string;
  mobile_number: string | null;
  village: string | null;
  outstanding: number;
  created_at: string;
}

interface CustomerDetail {
  id: string;
  customer_id: string;
  name: string;
  mobile_number: string | null;
  village: string | null;
  address: string | null;
  gst_number: string | null;
  notes: string | null;
  total_billed: number;
  total_paid: number;
  outstanding: number;
  created_at: string;
}

interface PaginatedCustomers {
  items: Customer[];
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
}

function formatCurrency(v: number) {
  return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(v);
}

export default function CustomersPage() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [viewCustomer, setViewCustomer] = useState<CustomerDetail | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [formData, setFormData] = useState({ name: "", mobile_number: "", village: "", address: "", gst_number: "", notes: "" });
  const [formError, setFormError] = useState("");

  const { data, isLoading } = useQuery<PaginatedCustomers>({
    queryKey: ["customers", page, search],
    queryFn: () => apiFetch(`/customers?page=${page}&page_size=10&search=${search}`),
  });

  const createMutation = useMutation({
    mutationFn: (d: typeof formData) => apiFetch("/customers", { method: "POST", json: d }),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["customers"] }); closeForm(); },
    onError: (e: Error) => setFormError(e.message),
  });

  const updateMutation = useMutation({
    mutationFn: (d: typeof formData) => apiFetch(`/customers/${editId}`, { method: "PUT", json: d }),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["customers"] }); closeForm(); },
    onError: (e: Error) => setFormError(e.message),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => apiFetch(`/customers/${id}`, { method: "DELETE" }),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["customers"] }); setDeleteId(null); },
  });

  const closeForm = () => {
    setShowForm(false); setEditId(null); setFormError("");
    setFormData({ name: "", mobile_number: "", village: "", address: "", gst_number: "", notes: "" });
  };

  const openEdit = async (id: string) => {
    const c = await apiFetch<CustomerDetail>(`/customers/${id}`);
    setFormData({ name: c.name, mobile_number: c.mobile_number || "", village: c.village || "", address: c.address || "", gst_number: c.gst_number || "", notes: c.notes || "" });
    setEditId(id); setShowForm(true);
  };

  const openView = async (id: string) => {
    const c = await apiFetch<CustomerDetail>(`/customers/${id}`);
    setViewCustomer(c);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) { setFormError("Name is required"); return; }
    if (editId) updateMutation.mutate(formData);
    else createMutation.mutate(formData);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <h1 className="text-2xl font-bold text-white">Customers</h1>
        <button onClick={() => { closeForm(); setShowForm(true); }} className="flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-neutral-950 hover:bg-primary/90 transition-all">
          <Plus className="h-4 w-4" /> Add Customer
        </button>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-500" />
        <input type="text" placeholder="Search by name, mobile, village..." value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          className="w-full rounded-xl border border-neutral-800 bg-neutral-900/50 py-2.5 pl-10 pr-4 text-sm text-white placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-primary/30" />
      </div>

      {/* Table */}
      <div className="rounded-2xl border border-neutral-800 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-neutral-800 bg-neutral-900/60">
                <th className="px-4 py-3 text-left text-xs font-semibold text-neutral-400 uppercase">ID</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-neutral-400 uppercase">Name</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-neutral-400 uppercase">Mobile</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-neutral-400 uppercase">Village</th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-neutral-400 uppercase">Outstanding</th>
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
                <tr><td colSpan={6} className="px-4 py-12 text-center text-neutral-500">No customers found</td></tr>
              ) : (
                data?.items.map((c) => (
                  <tr key={c.id} className="border-b border-neutral-800/50 hover:bg-neutral-900/30 transition-colors">
                    <td className="px-4 py-3 font-mono text-xs text-neutral-400">{c.customer_id}</td>
                    <td className="px-4 py-3 font-medium text-white">{c.name}</td>
                    <td className="px-4 py-3 text-neutral-400">{c.mobile_number || "-"}</td>
                    <td className="px-4 py-3 text-neutral-400">{c.village || "-"}</td>
                    <td className={`px-4 py-3 text-right font-semibold ${c.outstanding > 0 ? "text-amber-400" : "text-emerald-400"}`}>
                      {formatCurrency(c.outstanding)}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex justify-end gap-1">
                        <button onClick={() => openView(c.id)} className="p-1.5 rounded-lg hover:bg-neutral-800 text-neutral-400 hover:text-white transition-colors"><Eye className="h-3.5 w-3.5" /></button>
                        <button onClick={() => openEdit(c.id)} className="p-1.5 rounded-lg hover:bg-neutral-800 text-neutral-400 hover:text-white transition-colors"><Edit2 className="h-3.5 w-3.5" /></button>
                        {user?.role === "admin" && (
                          <button onClick={() => setDeleteId(c.id)} className="p-1.5 rounded-lg hover:bg-red-500/10 text-neutral-400 hover:text-red-400 transition-colors"><Trash2 className="h-3.5 w-3.5" /></button>
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
          <span className="text-xs text-neutral-500">Showing {data.items.length} of {data.total} customers</span>
          <div className="flex items-center gap-2">
            <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="p-2 rounded-lg border border-neutral-800 text-neutral-400 hover:text-white disabled:opacity-30"><ChevronLeft className="h-4 w-4" /></button>
            <span className="text-xs text-neutral-400">Page {page} of {data.total_pages}</span>
            <button onClick={() => setPage(p => Math.min(data.total_pages, p + 1))} disabled={page === data.total_pages} className="p-2 rounded-lg border border-neutral-800 text-neutral-400 hover:text-white disabled:opacity-30"><ChevronRight className="h-4 w-4" /></button>
          </div>
        </div>
      )}

      {/* Create/Edit Modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={closeForm}>
          <div className="w-full max-w-lg rounded-2xl border border-neutral-800 bg-neutral-950 p-6 shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-bold text-white">{editId ? "Edit Customer" : "Add Customer"}</h2>
              <button onClick={closeForm} className="text-neutral-500 hover:text-white"><X className="h-5 w-5" /></button>
            </div>
            {formError && <div className="mb-4 rounded-xl bg-red-500/10 border border-red-500/20 p-3 text-xs text-red-400">{formError}</div>}
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-neutral-400 mb-1.5">Name *</label>
                <input type="text" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} className="w-full rounded-xl border border-neutral-800 bg-neutral-900/50 py-2.5 px-4 text-sm text-white focus:outline-none focus:ring-2 focus:ring-primary/30" placeholder="Customer name" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-neutral-400 mb-1.5">Mobile Number</label>
                  <input type="text" value={formData.mobile_number} onChange={e => setFormData({ ...formData, mobile_number: e.target.value })} className="w-full rounded-xl border border-neutral-800 bg-neutral-900/50 py-2.5 px-4 text-sm text-white focus:outline-none focus:ring-2 focus:ring-primary/30" placeholder="9876543210" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-neutral-400 mb-1.5">Village</label>
                  <input type="text" value={formData.village} onChange={e => setFormData({ ...formData, village: e.target.value })} className="w-full rounded-xl border border-neutral-800 bg-neutral-900/50 py-2.5 px-4 text-sm text-white focus:outline-none focus:ring-2 focus:ring-primary/30" placeholder="Village name" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-neutral-400 mb-1.5">Address</label>
                <textarea value={formData.address} onChange={e => setFormData({ ...formData, address: e.target.value })} className="w-full rounded-xl border border-neutral-800 bg-neutral-900/50 py-2.5 px-4 text-sm text-white focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none" rows={2} placeholder="Full address" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-neutral-400 mb-1.5">GST Number</label>
                  <input type="text" value={formData.gst_number} onChange={e => setFormData({ ...formData, gst_number: e.target.value })} className="w-full rounded-xl border border-neutral-800 bg-neutral-900/50 py-2.5 px-4 text-sm text-white focus:outline-none focus:ring-2 focus:ring-primary/30" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-neutral-400 mb-1.5">Notes</label>
                  <input type="text" value={formData.notes} onChange={e => setFormData({ ...formData, notes: e.target.value })} className="w-full rounded-xl border border-neutral-800 bg-neutral-900/50 py-2.5 px-4 text-sm text-white focus:outline-none focus:ring-2 focus:ring-primary/30" />
                </div>
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={closeForm} className="rounded-xl border border-neutral-800 px-4 py-2.5 text-sm font-medium text-neutral-400 hover:text-white">Cancel</button>
                <button type="submit" disabled={createMutation.isPending || updateMutation.isPending} className="flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-neutral-950 hover:bg-primary/90 disabled:opacity-50">
                  {(createMutation.isPending || updateMutation.isPending) && <Loader2 className="h-4 w-4 animate-spin" />}
                  {editId ? "Update" : "Create"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* View Modal */}
      {viewCustomer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={() => setViewCustomer(null)}>
          <div className="w-full max-w-lg rounded-2xl border border-neutral-800 bg-neutral-950 p-6 shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-bold text-white">{viewCustomer.name}</h2>
              <button onClick={() => setViewCustomer(null)} className="text-neutral-500 hover:text-white"><X className="h-5 w-5" /></button>
            </div>
            <div className="space-y-3 text-sm">
              <div className="grid grid-cols-2 gap-4">
                <div><span className="text-neutral-500 text-xs">Customer ID</span><p className="text-white font-mono">{viewCustomer.customer_id}</p></div>
                <div><span className="text-neutral-500 text-xs">Mobile</span><p className="text-white">{viewCustomer.mobile_number || "-"}</p></div>
                <div><span className="text-neutral-500 text-xs">Village</span><p className="text-white">{viewCustomer.village || "-"}</p></div>
                <div><span className="text-neutral-500 text-xs">GST</span><p className="text-white">{viewCustomer.gst_number || "-"}</p></div>
              </div>
              {viewCustomer.address && <div><span className="text-neutral-500 text-xs">Address</span><p className="text-white">{viewCustomer.address}</p></div>}
              <div className="grid grid-cols-3 gap-4 pt-4 border-t border-neutral-800">
                <div className="text-center"><span className="text-neutral-500 text-xs block">Total Billed</span><p className="text-white font-bold">{formatCurrency(viewCustomer.total_billed)}</p></div>
                <div className="text-center"><span className="text-neutral-500 text-xs block">Total Paid</span><p className="text-emerald-400 font-bold">{formatCurrency(viewCustomer.total_paid)}</p></div>
                <div className="text-center"><span className="text-neutral-500 text-xs block">Outstanding</span><p className="text-amber-400 font-bold">{formatCurrency(viewCustomer.outstanding)}</p></div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation */}
      {deleteId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-2xl border border-neutral-800 bg-neutral-950 p-6 shadow-2xl text-center">
            <Trash2 className="mx-auto h-10 w-10 text-red-400 mb-4" />
            <h3 className="text-lg font-bold text-white mb-2">Delete Customer?</h3>
            <p className="text-sm text-neutral-400 mb-6">This action cannot be undone. All associated bills and payments will be deleted.</p>
            <div className="flex justify-center gap-3">
              <button onClick={() => setDeleteId(null)} className="rounded-xl border border-neutral-800 px-4 py-2.5 text-sm font-medium text-neutral-400">Cancel</button>
              <button onClick={() => deleteId && deleteMutation.mutate(deleteId)} className="rounded-xl bg-red-500 px-4 py-2.5 text-sm font-semibold text-white hover:bg-red-600">
                {deleteMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
