"use client";

import React, { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api";
import { useAuth } from "@/components/auth-provider";
import { Settings, Save, Loader2, Building, Receipt, FileText, UserCircle } from "lucide-react";

interface AppSettings {
  company_name: string;
  invoice_prefix: string;
  default_hourly_rate: number;
  gst_number: string | null;
}

export default function SettingsPage() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState<AppSettings>({
    company_name: "",
    invoice_prefix: "",
    default_hourly_rate: 1500,
    gst_number: "",
  });
  const [successMsg, setSuccessMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  const { data, isLoading } = useQuery<AppSettings>({
    queryKey: ["settings"],
    queryFn: () => apiFetch("/settings"),
  });

  useEffect(() => {
    if (data) {
      setFormData({
        company_name: data.company_name,
        invoice_prefix: data.invoice_prefix,
        default_hourly_rate: data.default_hourly_rate,
        gst_number: data.gst_number || "",
      });
    }
  }, [data]);

  const updateMutation = useMutation({
    mutationFn: (d: AppSettings) => apiFetch("/settings", { method: "PUT", json: d }),
    onSuccess: () => { 
      queryClient.invalidateQueries({ queryKey: ["settings"] });
      setSuccessMsg("Settings updated successfully!");
      setTimeout(() => setSuccessMsg(""), 3000);
    },
    onError: (e: Error) => setErrorMsg(e.message),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSuccessMsg("");
    setErrorMsg("");
    updateMutation.mutate(formData);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center gap-3 mb-8">
        <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
          <Settings className="h-5 w-5" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-white">Settings</h1>
          <p className="text-sm text-neutral-400">Manage application preferences and company details</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Sidebar Nav */}
        <div className="space-y-1">
          <button className="w-full flex items-center gap-3 px-4 py-3 rounded-xl bg-neutral-900/80 border border-neutral-800 text-white font-medium text-sm text-left">
            <Building className="h-4 w-4 text-primary" /> Company Profile
          </button>
          <button className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-neutral-400 hover:bg-neutral-900/50 hover:text-white font-medium text-sm text-left transition-colors">
            <UserCircle className="h-4 w-4" /> Account Security
          </button>
        </div>

        {/* Main Content */}
        <div className="md:col-span-2 space-y-6">
          <div className="rounded-2xl border border-neutral-800 bg-neutral-900/40 p-6">
            <h2 className="text-lg font-bold text-white mb-6 border-b border-neutral-800 pb-4">Company Profile</h2>
            
            {isLoading ? (
              <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-5">
                {successMsg && <div className="rounded-xl bg-emerald-500/10 border border-emerald-500/20 p-3 text-sm text-emerald-400">{successMsg}</div>}
                {errorMsg && <div className="rounded-xl bg-red-500/10 border border-red-500/20 p-3 text-sm text-red-400">{errorMsg}</div>}

                <div>
                  <label className="block text-sm font-semibold text-neutral-300 mb-2">Company Name</label>
                  <input type="text" value={formData.company_name} onChange={e => setFormData({ ...formData, company_name: e.target.value })} disabled={user?.role !== 'admin'} className="w-full rounded-xl border border-neutral-800 bg-neutral-950 py-3 px-4 text-sm text-white focus:outline-none focus:ring-2 focus:ring-primary/30 disabled:opacity-50" />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-neutral-300 mb-2">GST Number</label>
                  <input type="text" value={formData.gst_number || ""} onChange={e => setFormData({ ...formData, gst_number: e.target.value })} disabled={user?.role !== 'admin'} className="w-full rounded-xl border border-neutral-800 bg-neutral-950 py-3 px-4 text-sm text-white focus:outline-none focus:ring-2 focus:ring-primary/30 disabled:opacity-50" />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-neutral-300 mb-2 flex items-center gap-2"><Receipt className="h-3.5 w-3.5" /> Invoice Prefix</label>
                    <input type="text" value={formData.invoice_prefix} onChange={e => setFormData({ ...formData, invoice_prefix: e.target.value })} disabled={user?.role !== 'admin'} className="w-full rounded-xl border border-neutral-800 bg-neutral-950 py-3 px-4 text-sm text-white focus:outline-none focus:ring-2 focus:ring-primary/30 disabled:opacity-50" />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-neutral-300 mb-2 flex items-center gap-2"><FileText className="h-3.5 w-3.5" /> Default Hourly Rate</label>
                    <input type="number" value={formData.default_hourly_rate} onChange={e => setFormData({ ...formData, default_hourly_rate: parseFloat(e.target.value) || 0 })} disabled={user?.role !== 'admin'} className="w-full rounded-xl border border-neutral-800 bg-neutral-950 py-3 px-4 text-sm text-white focus:outline-none focus:ring-2 focus:ring-primary/30 disabled:opacity-50" />
                  </div>
                </div>

                <div className="pt-6 mt-6 border-t border-neutral-800">
                  <button type="submit" disabled={user?.role !== 'admin' || updateMutation.isPending} className="flex items-center gap-2 rounded-xl bg-primary px-6 py-3 text-sm font-bold text-neutral-950 hover:bg-primary/90 disabled:opacity-50">
                    {updateMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                    Save Changes
                  </button>
                  {user?.role !== 'admin' && <p className="text-xs text-neutral-500 mt-3">Only administrators can modify application settings.</p>}
                </div>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
