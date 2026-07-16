"use client";

import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api";
import { useAuth } from "@/components/auth-provider";
import {
  Plus, Search, Edit2, Trash2, Eye, X, Loader2, ChevronLeft, ChevronRight, Copy, FileText, CheckCircle2, Clock
} from "lucide-react";

interface Bill {
  id: string;
  bill_number: string;
  customer_name: string;
  date: string;
  machine_name: string;
  total_amount: number;
  paid_amount: number;
  remaining_amount: number;
  status: string;
  created_at: string;
}

interface BillDetail {
  id: string;
  bill_number: string;
  customer_id: string;
  customer_name: string;
  date: string;
  machine_id: string;
  machine_name: string;
  working_hours: number;
  hourly_rate: number;
  diesel_charge: number;
  transport_charge: number;
  other_charges: number;
  discount: number;
  gst_percent: number;
  total_amount: number;
  paid_amount: number;
  remaining_amount: number;
  status: string;
  created_at: string;
}

interface Customer {
  id: string;
  name: string;
}

interface Machine {
  id: string;
  name: string;
}

interface PaginatedBills {
  items: Bill[];
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
}

function formatCurrency(v: number) {
  return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(v);
}

const statusColors: Record<string, string> = {
  paid: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
  partial: "bg-amber-500/10 text-amber-400 border-amber-500/20",
  pending: "bg-red-500/10 text-red-400 border-red-500/20",
};

export default function BillsPage() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [viewBill, setViewBill] = useState<BillDetail | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [formError, setFormError] = useState("");
  const [customerSearch, setCustomerSearch] = useState("");
  const [showCustomerDropdown, setShowCustomerDropdown] = useState(false);
  const [machineSearch, setMachineSearch] = useState("");
  const [showMachineDropdown, setShowMachineDropdown] = useState(false);


  const defaultFormData = {
    customer_id: "",
    machine_id: "",
    site_name: "",
    date: new Date().toISOString().split("T")[0],
    working_hours: 0,
    hourly_rate: 1500, // Example default
    diesel_charge: 0,
    transport_charge: 0,
    other_charges: 0,
    discount: 0,
    gst_percent: 0,
    is_paid: false,
  };
  const [formData, setFormData] = useState(defaultFormData);

  // Queries
  const { data, isLoading } = useQuery<PaginatedBills>({
    queryKey: ["bills", page, search, statusFilter],
    queryFn: () => apiFetch(`/bills?page=${page}&page_size=10&search=${search}&status=${statusFilter}`),
  });

  const { data: customers } = useQuery<{items: Customer[]}>({
    queryKey: ["customers_dropdown"],
    queryFn: () => apiFetch("/customers?page_size=1000"),
  });

  const { data: machines } = useQuery<Machine[]>({
    queryKey: ["machines_dropdown"],
    queryFn: () => apiFetch("/machines"),
  });

  const { data: settings } = useQuery<any>({
    queryKey: ["settings"],
    queryFn: () => apiFetch("/settings"),
  });

  // Mutations
  const createMutation = useMutation({
    mutationFn: (d: typeof formData) => apiFetch("/bills", { method: "POST", json: d }),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["bills"] }); closeForm(); },
    onError: (e: Error) => setFormError(e.message),
  });

  const updateMutation = useMutation({
    mutationFn: (d: typeof formData) => apiFetch(`/bills/${editId}`, { method: "PUT", json: d }),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["bills"] }); closeForm(); },
    onError: (e: Error) => setFormError(e.message),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => apiFetch(`/bills/${id}`, { method: "DELETE" }),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["bills"] }); setDeleteId(null); },
  });

  const duplicateMutation = useMutation({
    mutationFn: (id: string) => apiFetch(`/bills/${id}/duplicate`, { method: "POST" }),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["bills"] }); },
  });

  const closeForm = () => {
    setShowForm(false); setEditId(null); setFormError("");
    setCustomerSearch(""); setShowCustomerDropdown(false);
    setMachineSearch(""); setShowMachineDropdown(false);
    setFormData({ ...defaultFormData, hourly_rate: settings?.default_hourly_rate || 1500 });
  };

  const openNewForm = () => {
    setCustomerSearch(""); setShowCustomerDropdown(false);
    setMachineSearch(""); setShowMachineDropdown(false);
    setFormData({ ...defaultFormData, hourly_rate: settings?.default_hourly_rate || 1500 });
    setShowForm(true);
  };

  const openEdit = async (id: string) => {
    const b = await apiFetch<BillDetail>(`/bills/${id}`);
    setFormData({
      customer_id: b.customer_id,
      machine_id: b.machine_id,
      site_name: b.site_name || "",
      date: b.date || "",
      working_hours: b.working_hours,
      hourly_rate: b.hourly_rate,
      diesel_charge: b.diesel_charge,
      transport_charge: b.transport_charge,
      other_charges: b.other_charges,
      discount: b.discount,
      gst_percent: b.gst_percent,
      is_paid: b.status === "paid",
    });
    const selected = customers?.items.find(c => c.id === b.customer_id);
    setCustomerSearch(selected ? selected.name : "");
    setShowCustomerDropdown(false);
    const selectedMachine = machines?.find(m => m.id === b.machine_id);
    setMachineSearch(selectedMachine ? selectedMachine.name : "");
    setShowMachineDropdown(false);
    setEditId(id); setShowForm(true);
  };

  const openView = async (id: string) => {
    const b = await apiFetch<BillDetail>(`/bills/${id}`);
    setViewBill(b);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.customer_id) { setFormError("Customer is required"); return; }
    
    let finalMachineId = formData.machine_id;
    if (!finalMachineId) {
      if (!machineSearch.trim()) { setFormError("Machine is required"); return; }
      try {
        const newMachine = await apiFetch<Machine>("/machines", { method: "POST", json: { name: machineSearch.trim(), is_active: true } });
        finalMachineId = newMachine.id;
        queryClient.invalidateQueries({ queryKey: ["machines_dropdown"] });
      } catch (err: any) {
        setFormError(err.message || "Failed to create machine type");
        return;
      }
    }
    
    if (formData.working_hours <= 0) { setFormError("Working hours must be > 0"); return; }
    
    const payload = { ...formData, machine_id: finalMachineId };
    if (payload.is_paid) {
      const subtotal = (payload.working_hours * payload.hourly_rate) + payload.diesel_charge + payload.transport_charge + payload.other_charges - payload.discount;
      const gst = subtotal * (payload.gst_percent / 100);
      payload.paid_amount = subtotal + gst;
    } else {
      payload.paid_amount = 0;
    }
    
    if (editId) updateMutation.mutate(payload);
    else createMutation.mutate(payload);
  };

  // Auto-calculated fields for preview
  const subtotal = (formData.working_hours * formData.hourly_rate) + formData.diesel_charge + formData.transport_charge + formData.other_charges - formData.discount;
  const gst_amount = subtotal * (formData.gst_percent / 100);
  const previewTotal = subtotal + gst_amount;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <h1 className="text-2xl font-bold text-white">Bills / Invoices</h1>
        <button onClick={openNewForm} className="flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-neutral-950 hover:bg-primary/90 transition-all">
          <Plus className="h-4 w-4" /> Create Bill
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-500" />
          <input type="text" placeholder="Search bill number or customer..." value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            className="w-full rounded-xl border border-neutral-800 bg-neutral-900/50 py-2.5 pl-10 pr-4 text-sm text-white placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-primary/30" />
        </div>
        <select value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }} className="rounded-xl border border-neutral-800 bg-neutral-900/50 py-2.5 px-4 text-sm text-white focus:outline-none focus:ring-2 focus:ring-primary/30">
          <option value="">All Statuses</option>
          <option value="pending">Pending</option>
          <option value="partial">Partial</option>
          <option value="paid">Paid</option>
        </select>
      </div>

      {/* Table */}
      <div className="rounded-2xl border border-neutral-800 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-neutral-800 bg-neutral-900/60">
                <th className="px-4 py-3 text-left text-xs font-semibold text-neutral-400 uppercase">Bill No</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-neutral-400 uppercase">Date</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-neutral-400 uppercase">Customer</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-neutral-400 uppercase">Machine</th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-neutral-400 uppercase">Total Amount</th>
                <th className="px-4 py-3 text-center text-xs font-semibold text-neutral-400 uppercase">Status</th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-neutral-400 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                [...Array(5)].map((_, i) => (
                  <tr key={i} className="border-b border-neutral-800/50">
                    {[...Array(7)].map((_, j) => (
                      <td key={j} className="px-4 py-3"><div className="h-4 bg-neutral-800 rounded animate-pulse" /></td>
                    ))}
                  </tr>
                ))
              ) : data?.items.length === 0 ? (
                <tr><td colSpan={7} className="px-4 py-12 text-center text-neutral-500">No bills found</td></tr>
              ) : (
                data?.items.map((b) => (
                  <tr key={b.id} className="border-b border-neutral-800/50 hover:bg-neutral-900/30 transition-colors">
                    <td className="px-4 py-3 font-mono text-xs text-white font-medium">{b.bill_number}</td>
                    <td className="px-4 py-3 text-neutral-400">{b.date}</td>
                    <td className="px-4 py-3">
                      <div className="font-medium text-white">{b.customer_name}</div>
                      {b.site_name && <div className="text-xs text-neutral-500 mt-0.5">{b.site_name}</div>}
                    </td>
                    <td className="px-4 py-3 text-neutral-400">{b.machine_name}</td>
                    <td className="px-4 py-3 text-right font-bold text-white">{formatCurrency(b.total_amount)}</td>
                    <td className="px-4 py-3 text-center">
                      <span className={`inline-block text-[10px] font-medium px-2 py-0.5 rounded-full border ${statusColors[b.status] || ""}`}>
                        {b.status.toUpperCase()}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex justify-end gap-1">
                        <button onClick={() => openView(b.id)} className="p-1.5 rounded-lg hover:bg-neutral-800 text-neutral-400 hover:text-white transition-colors" title="View"><Eye className="h-3.5 w-3.5" /></button>
                        <button onClick={() => duplicateMutation.mutate(b.id)} className="p-1.5 rounded-lg hover:bg-neutral-800 text-neutral-400 hover:text-white transition-colors" title="Duplicate"><Copy className="h-3.5 w-3.5" /></button>
                        <button onClick={() => openEdit(b.id)} className="p-1.5 rounded-lg hover:bg-neutral-800 text-neutral-400 hover:text-white transition-colors" title="Edit"><Edit2 className="h-3.5 w-3.5" /></button>
                        {user?.role === "admin" && (
                          <button onClick={() => setDeleteId(b.id)} className="p-1.5 rounded-lg hover:bg-red-500/10 text-neutral-400 hover:text-red-400 transition-colors" title="Delete"><Trash2 className="h-3.5 w-3.5" /></button>
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
          <span className="text-xs text-neutral-500">Showing {data.items.length} of {data.total} bills</span>
          <div className="flex items-center gap-2">
            <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="p-2 rounded-lg border border-neutral-800 text-neutral-400 hover:text-white disabled:opacity-30"><ChevronLeft className="h-4 w-4" /></button>
            <span className="text-xs text-neutral-400">Page {page} of {data.total_pages}</span>
            <button onClick={() => setPage(p => Math.min(data.total_pages, p + 1))} disabled={page === data.total_pages} className="p-2 rounded-lg border border-neutral-800 text-neutral-400 hover:text-white disabled:opacity-30"><ChevronRight className="h-4 w-4" /></button>
          </div>
        </div>
      )}

      {/* Create/Edit Modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto" onClick={closeForm}>
          <div className="w-full max-w-2xl rounded-2xl border border-neutral-800 bg-neutral-950 p-6 shadow-2xl my-8" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-bold text-white">{editId ? "Edit Bill" : "Create Bill"}</h2>
              <button onClick={closeForm} className="text-neutral-500 hover:text-white"><X className="h-5 w-5" /></button>
            </div>
            {formError && <div className="mb-4 rounded-xl bg-red-500/10 border border-red-500/20 p-3 text-xs text-red-400">{formError}</div>}
            
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Primary Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                          setFormData(prev => ({ ...prev, customer_id: "" }));
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
                                  setFormData(prev => ({ ...prev, customer_id: c.id }));
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
                <div className="relative">
                  <label className="block text-xs font-semibold text-neutral-400 mb-1.5">Machine *</label>
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="Type to search or create machine..."
                      value={machineSearch}
                      onFocus={() => {
                        setShowMachineDropdown(true);
                        if (formData.machine_id) {
                          setMachineSearch("");
                        }
                      }}
                      onChange={(e) => {
                        setMachineSearch(e.target.value);
                        setShowMachineDropdown(true);
                        if (formData.machine_id) {
                          setFormData(prev => ({ ...prev, machine_id: "" }));
                        }
                      }}
                      className="w-full rounded-xl border border-neutral-800 bg-neutral-900/50 py-2.5 px-4 text-sm text-white focus:outline-none focus:ring-2 focus:ring-primary/30"
                    />
                    {formData.machine_id && (
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] bg-primary/20 text-primary border border-primary/30 px-2.5 py-0.5 rounded-full font-bold pointer-events-none">
                        Selected
                      </span>
                    )}
                  </div>
                  
                  {/* Autocomplete Dropdown List */}
                  {showMachineDropdown && (
                    <>
                      <div className="fixed inset-0 z-10" onClick={() => {
                        setShowMachineDropdown(false);
                        const curr = machines?.find(m => m.id === formData.machine_id);
                        setMachineSearch(curr ? curr.name : machineSearch);
                      }} />
                      <div className="absolute left-0 right-0 mt-1 max-h-60 overflow-y-auto rounded-xl border border-neutral-800 bg-neutral-950 p-1.5 shadow-2xl z-20 space-y-0.5">
                        {machines?.filter(m => 
                          m.name.toLowerCase().includes(machineSearch.toLowerCase())
                        ).length === 0 ? (
                          <div className="p-3 text-xs text-neutral-500 text-center">
                            Press Create/Update to save "{machineSearch}" as a new machine type.
                          </div>
                        ) : (
                          machines?.filter(m => m.name.toLowerCase().includes(machineSearch.toLowerCase()))
                            .map(m => (
                              <button
                                key={m.id}
                                type="button"
                                onClick={() => {
                                  setFormData(prev => ({ ...prev, machine_id: m.id }));
                                  setMachineSearch(m.name);
                                  setShowMachineDropdown(false);
                                }}
                                className={`w-full text-left rounded-lg py-2 px-3 text-sm transition-all flex items-center justify-between ${
                                  formData.machine_id === m.id 
                                    ? "bg-primary text-neutral-950 font-semibold" 
                                    : "text-neutral-300 hover:bg-neutral-900"
                                }`}
                              >
                                <span>{m.name}</span>
                              </button>
                            ))
                        )}
                      </div>
                    </>
                  )}
                </div>
                 <div>
                  <label className="block text-xs font-semibold text-neutral-400 mb-1.5">Bill Date *</label>
                  <input type="date" value={formData.date} onChange={e => setFormData({ ...formData, date: e.target.value })} className="w-full rounded-xl border border-neutral-800 bg-neutral-900/50 py-2.5 px-4 text-sm text-white focus:outline-none focus:ring-2 focus:ring-primary/30 [color-scheme:dark]" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-neutral-400 mb-1.5">Site/Project Name</label>
                  <input type="text" placeholder="e.g. Highway Project, Sector 5..." value={formData.site_name} onChange={e => setFormData({ ...formData, site_name: e.target.value })} className="w-full rounded-xl border border-neutral-800 bg-neutral-900/50 py-2.5 px-4 text-sm text-white focus:outline-none focus:ring-2 focus:ring-primary/30" />
                </div>
              </div>

              <div className="border-t border-neutral-800 pt-4">
                <h3 className="text-sm font-semibold text-white mb-4">Billing Details</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-neutral-400 mb-1.5">Working Hours *</label>
                    <input type="number" step="0.5" min="0" value={formData.working_hours || ""} onChange={e => setFormData({ ...formData, working_hours: parseFloat(e.target.value) || 0 })} className="w-full rounded-xl border border-neutral-800 bg-neutral-900/50 py-2.5 px-4 text-sm text-white focus:outline-none focus:ring-2 focus:ring-primary/30" />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-neutral-400 mb-1.5">Hourly Rate (₹) *</label>
                    <input type="number" step="10" min="0" value={formData.hourly_rate || ""} onChange={e => setFormData({ ...formData, hourly_rate: parseFloat(e.target.value) || 0 })} className="w-full rounded-xl border border-neutral-800 bg-neutral-900/50 py-2.5 px-4 text-sm text-white focus:outline-none focus:ring-2 focus:ring-primary/30" />
                  </div>
                </div>
              </div>

              {/* Live Preview */}
              <div className="rounded-xl bg-primary/10 border border-primary/20 p-4 flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-primary uppercase tracking-wider">Estimated Total</p>
                  <p className="text-2xl font-bold text-white mt-1">{formatCurrency(previewTotal)}</p>
                </div>
                <div className="flex flex-col items-end gap-2">
                  <div className="text-right text-xs text-neutral-400">
                    <p>Base: {formData.working_hours} hrs @ {formatCurrency(formData.hourly_rate)}/hr</p>
                  </div>
                  <label className="flex items-center gap-2 cursor-pointer mt-2">
                    <input 
                      type="checkbox" 
                      checked={formData.is_paid} 
                      onChange={e => setFormData({ ...formData, is_paid: e.target.checked })} 
                      className="w-4 h-4 rounded border-neutral-700 text-primary focus:ring-primary/50 bg-neutral-900" 
                    />
                    <span className="text-sm font-semibold text-white">Mark as Fully Paid</span>
                  </label>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-neutral-800">
                <button type="button" onClick={closeForm} className="rounded-xl border border-neutral-800 px-4 py-2.5 text-sm font-medium text-neutral-400 hover:text-white">Cancel</button>
                <button type="submit" disabled={createMutation.isPending || updateMutation.isPending} className="flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-neutral-950 hover:bg-primary/90 disabled:opacity-50">
                  {(createMutation.isPending || updateMutation.isPending) && <Loader2 className="h-4 w-4 animate-spin" />}
                  {editId ? "Update Bill" : "Generate Bill"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* View Modal */}
      {viewBill && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto" onClick={() => setViewBill(null)}>
          <div className="w-full max-w-2xl rounded-2xl border border-neutral-800 bg-neutral-950 shadow-2xl my-8 overflow-hidden" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between p-6 border-b border-neutral-800">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                  <FileText className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-white">{viewBill.bill_number}</h2>
                  <p className="text-xs text-neutral-500">{viewBill.date}</p>
                </div>
              </div>
              <button onClick={() => setViewBill(null)} className="text-neutral-500 hover:text-white"><X className="h-5 w-5" /></button>
            </div>
            
            <div className="p-6 space-y-6">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-xs font-semibold text-neutral-500 uppercase tracking-wider mb-1">Billed To</p>
                  <p className="text-lg font-bold text-white">{viewBill.customer_name}</p>
                </div>
                {viewBill.site_name && (
                  <div>
                    <p className="text-xs font-semibold text-neutral-500 uppercase tracking-wider mb-1">Site/Project Name</p>
                    <p className="text-white font-medium">{viewBill.site_name}</p>
                  </div>
                )}
                <div className="text-right">
                  <p className="text-xs font-semibold text-neutral-500 uppercase tracking-wider mb-1">Machine</p>
                  <p className="text-white font-medium">{viewBill.machine_name}</p>
                </div>
              </div>

              <div className="rounded-xl border border-neutral-800 bg-neutral-900/30 overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-neutral-900/60 border-b border-neutral-800">
                    <tr>
                      <th className="px-4 py-3 text-left font-semibold text-neutral-400">Description</th>
                      <th className="px-4 py-3 text-right font-semibold text-neutral-400">Amount</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-800/50">
                    <tr>
                      <td className="px-4 py-3 text-neutral-300">
                        Machine Work ({viewBill.working_hours} hrs @ {formatCurrency(viewBill.hourly_rate)}/hr)
                      </td>
                      <td className="px-4 py-3 text-right text-white font-medium">{formatCurrency(viewBill.working_hours * viewBill.hourly_rate)}</td>
                    </tr>
                    {viewBill.diesel_charge > 0 && (
                      <tr><td className="px-4 py-3 text-neutral-300">Diesel Charge</td><td className="px-4 py-3 text-right text-white font-medium">{formatCurrency(viewBill.diesel_charge)}</td></tr>
                    )}
                    {viewBill.transport_charge > 0 && (
                      <tr><td className="px-4 py-3 text-neutral-300">Transport Charge</td><td className="px-4 py-3 text-right text-white font-medium">{formatCurrency(viewBill.transport_charge)}</td></tr>
                    )}
                    {viewBill.other_charges > 0 && (
                      <tr><td className="px-4 py-3 text-neutral-300">Other Charges</td><td className="px-4 py-3 text-right text-white font-medium">{formatCurrency(viewBill.other_charges)}</td></tr>
                    )}
                    {viewBill.discount > 0 && (
                      <tr><td className="px-4 py-3 text-emerald-400">Discount</td><td className="px-4 py-3 text-right text-emerald-400 font-medium">-{formatCurrency(viewBill.discount)}</td></tr>
                    )}
                  </tbody>
                  <tfoot className="bg-neutral-900/60 border-t border-neutral-800">
                    {viewBill.gst_percent > 0 && (
                      <tr>
                        <td className="px-4 py-3 text-right font-semibold text-neutral-400">GST ({viewBill.gst_percent}%)</td>
                        <td className="px-4 py-3 text-right text-white font-medium">{formatCurrency((viewBill.total_amount / (1 + viewBill.gst_percent/100)) * (viewBill.gst_percent/100))}</td>
                      </tr>
                    )}
                    <tr>
                      <td className="px-4 py-4 text-right font-bold text-white text-base">Grand Total</td>
                      <td className="px-4 py-4 text-right font-bold text-primary text-xl">{formatCurrency(viewBill.total_amount)}</td>
                    </tr>
                  </tfoot>
                </table>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="rounded-xl bg-neutral-900/50 border border-neutral-800 p-4 text-center">
                  <p className="text-xs text-neutral-500 mb-1">Total Amount</p>
                  <p className="font-bold text-white">{formatCurrency(viewBill.total_amount)}</p>
                </div>
                <div className="rounded-xl bg-neutral-900/50 border border-neutral-800 p-4 text-center">
                  <p className="text-xs text-neutral-500 mb-1">Paid Amount</p>
                  <p className="font-bold text-emerald-400">{formatCurrency(viewBill.paid_amount)}</p>
                </div>
                <div className="rounded-xl bg-neutral-900/50 border border-neutral-800 p-4 text-center">
                  <p className="text-xs text-neutral-500 mb-1">Remaining</p>
                  <p className="font-bold text-amber-400">{formatCurrency(viewBill.remaining_amount)}</p>
                </div>
              </div>
            </div>
            
            <div className="bg-neutral-900/30 p-4 border-t border-neutral-800 flex justify-end gap-3">
              <button onClick={() => setViewBill(null)} className="rounded-xl border border-neutral-800 px-5 py-2.5 text-sm font-medium text-white hover:bg-neutral-800 transition-colors">Close</button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation */}
      {deleteId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-2xl border border-neutral-800 bg-neutral-950 p-6 shadow-2xl text-center">
            <Trash2 className="mx-auto h-10 w-10 text-red-400 mb-4" />
            <h3 className="text-lg font-bold text-white mb-2">Delete Bill?</h3>
            <p className="text-sm text-neutral-400 mb-6">This action cannot be undone. Associated payments will also be deleted.</p>
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
