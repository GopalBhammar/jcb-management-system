"use client";

import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api";
import { useAuth } from "@/components/auth-provider";
import {
  Plus, Edit2, Trash2, X, Loader2, ChevronLeft, ChevronRight, Tags
} from "lucide-react";

interface ExpenseCategory {
  id: string;
  name: string;
}

interface Expense {
  id: string;
  category_name: string;
  date: string;
  amount: number;
  description: string | null;
  created_at: string;
}

interface PaginatedExpenses {
  items: Expense[];
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
}

function formatCurrency(v: number) {
  return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(v);
}

export default function ExpensesPage() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [categoryFilter, setCategoryFilter] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [showCategoryForm, setShowCategoryForm] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [formError, setFormError] = useState("");
  const [categoryName, setCategoryName] = useState("");

  const defaultFormData = {
    category_id: "",
    amount: 0,
    date: new Date().toISOString().split("T")[0],
    description: "",
  };
  const [formData, setFormData] = useState(defaultFormData);

  // Queries
  const { data, isLoading } = useQuery<PaginatedExpenses>({
    queryKey: ["expenses", page, categoryFilter],
    queryFn: () => apiFetch(`/expenses?page=${page}&page_size=15${categoryFilter ? `&category_id=${categoryFilter}` : ""}`),
  });

  const { data: categories } = useQuery<ExpenseCategory[]>({
    queryKey: ["expense_categories"],
    queryFn: () => apiFetch("/expenses/categories"),
  });

  // Mutations
  const createMutation = useMutation({
    mutationFn: (d: any) => apiFetch("/expenses", { method: "POST", json: d }),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["expenses"] }); closeForm(); },
    onError: (e: Error) => setFormError(e.message),
  });

  const updateMutation = useMutation({
    mutationFn: (d: any) => apiFetch(`/expenses/${editId}`, { method: "PUT", json: d }),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["expenses"] }); closeForm(); },
    onError: (e: Error) => setFormError(e.message),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => apiFetch(`/expenses/${id}`, { method: "DELETE" }),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["expenses"] }); setDeleteId(null); },
  });

  const categoryMutation = useMutation({
    mutationFn: (name: string) => apiFetch("/expenses/categories", { method: "POST", json: { name } }),
    onSuccess: () => { 
      queryClient.invalidateQueries({ queryKey: ["expense_categories"] });
      setCategoryName("");
      setShowCategoryForm(false);
    },
    onError: (e: Error) => setFormError(e.message),
  });

  const closeForm = () => {
    setShowForm(false); setEditId(null); setFormError("");
    setFormData(defaultFormData);
  };

  const openNewForm = () => {
    setFormData(defaultFormData);
    setShowForm(true);
  };

  const openEdit = async (id: string) => {
    const e = await apiFetch<any>(`/expenses/${id}`);
    setFormData({
      category_id: e.category_id,
      amount: e.amount,
      date: e.date || "",
      description: e.description || "",
    });
    setEditId(id); setShowForm(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.category_id) { setFormError("Category is required"); return; }
    if (formData.amount <= 0) { setFormError("Amount must be > 0"); return; }
    
    if (editId) updateMutation.mutate(formData);
    else createMutation.mutate(formData);
  };

  const handleCategorySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!categoryName.trim()) return;
    categoryMutation.mutate(categoryName);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <h1 className="text-2xl font-bold text-white">Expenses</h1>
        <div className="flex gap-3">
          {user?.role === "admin" && (
            <button onClick={() => setShowCategoryForm(true)} className="flex items-center gap-2 rounded-xl border border-neutral-800 bg-neutral-900/50 px-4 py-2.5 text-sm font-semibold text-neutral-300 hover:text-white transition-all">
              <Tags className="h-4 w-4" /> Manage Categories
            </button>
          )}
          <button onClick={openNewForm} className="flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-neutral-950 hover:bg-primary/90 transition-all">
            <Plus className="h-4 w-4" /> Add Expense
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-4">
        <select value={categoryFilter} onChange={(e) => { setCategoryFilter(e.target.value); setPage(1); }} className="w-full max-w-xs rounded-xl border border-neutral-800 bg-neutral-900/50 py-2.5 px-4 text-sm text-white focus:outline-none focus:ring-2 focus:ring-primary/30">
          <option value="">All Categories</option>
          {categories?.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
      </div>

      {/* Table */}
      <div className="rounded-2xl border border-neutral-800 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-neutral-800 bg-neutral-900/60">
                <th className="px-4 py-3 text-left text-xs font-semibold text-neutral-400 uppercase">Date</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-neutral-400 uppercase">Category</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-neutral-400 uppercase">Description</th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-neutral-400 uppercase">Amount</th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-neutral-400 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                [...Array(5)].map((_, i) => (
                  <tr key={i} className="border-b border-neutral-800/50">
                    {[...Array(5)].map((_, j) => (
                      <td key={j} className="px-4 py-3"><div className="h-4 bg-neutral-800 rounded animate-pulse" /></td>
                    ))}
                  </tr>
                ))
              ) : data?.items.length === 0 ? (
                <tr><td colSpan={5} className="px-4 py-12 text-center text-neutral-500">No expenses found</td></tr>
              ) : (
                data?.items.map((e) => (
                  <tr key={e.id} className="border-b border-neutral-800/50 hover:bg-neutral-900/30 transition-colors">
                    <td className="px-4 py-3 text-neutral-400">{e.date}</td>
                    <td className="px-4 py-3 font-medium text-white">
                      <span className="inline-block text-[10px] font-medium px-2 py-0.5 rounded-full border bg-neutral-800/50 text-neutral-300 border-neutral-700 uppercase">
                        {e.category_name}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-neutral-400">{e.description || "-"}</td>
                    <td className="px-4 py-3 text-right font-bold text-red-400">-{formatCurrency(e.amount)}</td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex justify-end gap-1">
                        <button onClick={() => openEdit(e.id)} className="p-1.5 rounded-lg hover:bg-neutral-800 text-neutral-400 hover:text-white transition-colors" title="Edit"><Edit2 className="h-3.5 w-3.5" /></button>
                        {user?.role === "admin" && (
                          <button onClick={() => setDeleteId(e.id)} className="p-1.5 rounded-lg hover:bg-red-500/10 text-neutral-400 hover:text-red-400 transition-colors" title="Delete"><Trash2 className="h-3.5 w-3.5" /></button>
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
          <span className="text-xs text-neutral-500">Showing {data.items.length} of {data.total} expenses</span>
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
              <h2 className="text-lg font-bold text-white">{editId ? "Edit Expense" : "Add Expense"}</h2>
              <button onClick={closeForm} className="text-neutral-500 hover:text-white"><X className="h-5 w-5" /></button>
            </div>
            {formError && <div className="mb-4 rounded-xl bg-red-500/10 border border-red-500/20 p-3 text-xs text-red-400">{formError}</div>}
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-neutral-400 mb-1.5">Category *</label>
                  <select value={formData.category_id} onChange={e => setFormData({ ...formData, category_id: e.target.value })} className="w-full rounded-xl border border-neutral-800 bg-neutral-900/50 py-2.5 px-4 text-sm text-white focus:outline-none focus:ring-2 focus:ring-primary/30">
                    <option value="">Select Category...</option>
                    {categories?.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-neutral-400 mb-1.5">Date *</label>
                  <input type="date" value={formData.date} onChange={e => setFormData({ ...formData, date: e.target.value })} className="w-full rounded-xl border border-neutral-800 bg-neutral-900/50 py-2.5 px-4 text-sm text-white focus:outline-none focus:ring-2 focus:ring-primary/30 [color-scheme:dark]" />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-neutral-400 mb-1.5">Amount (₹) *</label>
                <input type="number" min="1" value={formData.amount || ""} onChange={e => setFormData({ ...formData, amount: parseFloat(e.target.value) || 0 })} className="w-full rounded-xl border border-neutral-800 bg-neutral-900/50 py-2.5 px-4 text-sm text-white font-bold text-red-400 focus:outline-none focus:ring-2 focus:ring-primary/30" placeholder="0" />
              </div>

              <div>
                <label className="block text-xs font-semibold text-neutral-400 mb-1.5">Description</label>
                <textarea value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })} rows={3} className="w-full rounded-xl border border-neutral-800 bg-neutral-900/50 py-2.5 px-4 text-sm text-white focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none" placeholder="Details about this expense..." />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-neutral-800">
                <button type="button" onClick={closeForm} className="rounded-xl border border-neutral-800 px-4 py-2.5 text-sm font-medium text-neutral-400 hover:text-white">Cancel</button>
                <button type="submit" disabled={createMutation.isPending || updateMutation.isPending} className="flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-neutral-950 hover:bg-primary/90 disabled:opacity-50">
                  {(createMutation.isPending || updateMutation.isPending) && <Loader2 className="h-4 w-4 animate-spin" />}
                  {editId ? "Update Expense" : "Save Expense"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Manage Categories Modal */}
      {showCategoryForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4" onClick={() => setShowCategoryForm(false)}>
          <div className="w-full max-w-sm rounded-2xl border border-neutral-800 bg-neutral-950 p-6 shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-bold text-white">Expense Categories</h2>
              <button onClick={() => setShowCategoryForm(false)} className="text-neutral-500 hover:text-white"><X className="h-5 w-5" /></button>
            </div>
            {formError && <div className="mb-4 rounded-xl bg-red-500/10 border border-red-500/20 p-3 text-xs text-red-400">{formError}</div>}
            
            <div className="max-h-[50vh] overflow-y-auto mb-4 space-y-2">
              {categories?.map((c) => (
                <div key={c.id} className="flex items-center justify-between p-3 rounded-xl bg-neutral-900/50 border border-neutral-800">
                  <span className="text-sm text-white">{c.name}</span>
                </div>
              ))}
            </div>

            <form onSubmit={handleCategorySubmit} className="flex gap-2">
              <input type="text" value={categoryName} onChange={e => setCategoryName(e.target.value)} placeholder="New category name" className="flex-1 rounded-xl border border-neutral-800 bg-neutral-900/50 py-2.5 px-4 text-sm text-white focus:outline-none focus:ring-2 focus:ring-primary/30" />
              <button type="submit" disabled={!categoryName.trim() || categoryMutation.isPending} className="rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-neutral-950 hover:bg-primary/90 disabled:opacity-50">
                Add
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation */}
      {deleteId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-2xl border border-neutral-800 bg-neutral-950 p-6 shadow-2xl text-center">
            <Trash2 className="mx-auto h-10 w-10 text-red-400 mb-4" />
            <h3 className="text-lg font-bold text-white mb-2">Delete Expense?</h3>
            <p className="text-sm text-neutral-400 mb-6">This action cannot be undone.</p>
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
