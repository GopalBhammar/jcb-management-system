import Link from "next/link";
import { Wrench, ArrowRight, ShieldCheck, FileSpreadsheet, LayoutDashboard } from "lucide-react";

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen bg-gradient-to-br from-neutral-900 via-neutral-950 to-neutral-900 text-neutral-100">
      {/* Header */}
      <header className="px-6 lg:px-12 h-20 flex items-center border-b border-neutral-800 bg-neutral-950/80 backdrop-blur-md sticky top-0 z-50 justify-between">
        <div className="flex items-center gap-2.5">
          <div className="p-2.5 bg-primary rounded-xl text-neutral-900 font-bold shadow-lg shadow-primary/20">
            <Wrench className="h-6 w-6 stroke-[2.5]" />
          </div>
          <div>
            <span className="font-extrabold text-xl tracking-tight bg-gradient-to-r from-white via-neutral-200 to-primary bg-clip-text text-transparent">
              JCB
            </span>
            <span className="text-neutral-400 font-medium text-sm block -mt-1">
              Rental & Accounting
            </span>
          </div>
        </div>
        <Link
          href="/login"
          className="inline-flex items-center justify-center rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-neutral-950 hover:bg-primary/90 transition-all duration-200 shadow-md shadow-primary/10 hover:shadow-primary/20 hover:scale-[1.02]"
        >
          Sign In
        </Link>
      </header>

      {/* Hero Section */}
      <main className="flex-1 flex flex-col justify-center items-center px-6 py-16 text-center max-w-5xl mx-auto">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-primary/20 bg-primary/5 text-primary text-xs font-semibold uppercase tracking-wider mb-8 animate-pulse">
          ⚡ Production Ready Management System
        </div>
        <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight text-white mb-6 leading-tight sm:leading-none">
          Streamline Your <span className="text-primary bg-gradient-to-r from-primary to-amber-500 bg-clip-text text-transparent">JCB Rentals</span> & Accounting
        </h1>
        <p className="text-lg sm:text-xl text-neutral-400 max-w-2xl mb-12 font-light">
          An intuitive, role-based platform designed specifically for machinery fleet operations. Track bills, monitor expenses, manage customer ledgers, and view real-time profit analytics.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 mb-20 w-full sm:w-auto">
          <Link
            href="/login"
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-8 py-4 text-base font-semibold text-neutral-950 hover:bg-primary/90 transition-all duration-200 hover:scale-[1.02] shadow-xl shadow-primary/20"
          >
            Access Dashboard
            <ArrowRight className="h-5 w-5" />
          </Link>
          <a
            href="#features"
            className="inline-flex items-center justify-center rounded-xl border border-neutral-800 bg-neutral-900/50 hover:bg-neutral-900 px-8 py-4 text-base font-semibold text-neutral-200 transition-all duration-200 hover:border-neutral-700"
          >
            Explore Features
          </a>
        </div>

        {/* Feature Grid */}
        <section id="features" className="grid grid-cols-1 md:grid-cols-3 gap-8 w-full text-left">
          <div className="p-6 rounded-2xl border border-neutral-800 bg-neutral-950/40 backdrop-blur-sm hover:border-neutral-700 transition-all duration-300">
            <div className="p-3 bg-neutral-900 rounded-xl text-primary w-fit mb-5">
              <LayoutDashboard className="h-6 w-6" />
            </div>
            <h3 className="text-lg font-bold text-white mb-2">Modern Dashboard</h3>
            <p className="text-neutral-400 text-sm font-light">
              Get an instant operational overview of income, pending amounts, and expense breakdown using interactive charts.
            </p>
          </div>

          <div className="p-6 rounded-2xl border border-neutral-800 bg-neutral-950/40 backdrop-blur-sm hover:border-neutral-700 transition-all duration-300">
            <div className="p-3 bg-neutral-900 rounded-xl text-primary w-fit mb-5">
              <FileSpreadsheet className="h-6 w-6" />
            </div>
            <h3 className="text-lg font-bold text-white mb-2">Billing & Ledger</h3>
            <p className="text-neutral-400 text-sm font-light">
              Auto-calculate rentals based on hours, rate, and diesel deductions. Generate PDF invoices and export customer statement statements.
            </p>
          </div>

          <div className="p-6 rounded-2xl border border-neutral-800 bg-neutral-950/40 backdrop-blur-sm hover:border-neutral-700 transition-all duration-300">
            <div className="p-3 bg-neutral-900 rounded-xl text-primary w-fit mb-5">
              <ShieldCheck className="h-6 w-6" />
            </div>
            <h3 className="text-lg font-bold text-white mb-2">Role Permissions</h3>
            <p className="text-neutral-400 text-sm font-light">
              Secure authentication separating Admins and Operators, guaranteeing operators cannot delete database records.
            </p>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-neutral-900 bg-neutral-950/90 py-8 px-6 text-center text-xs text-neutral-500 font-light">
        <p>© {new Date().getFullYear()} JCB Management System. All rights reserved.</p>
      </footer>
    </div>
  );
}
