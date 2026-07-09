/**
 * localDb.ts — Full offline client-side database engine
 * 
 * Simulates the entire backend API using localStorage.
 * Every table is stored as a JSON array under a localStorage key.
 * All CRUD, search, pagination, filtering, and dashboard aggregation
 * is performed in-memory on the client device.
 */

// ============================================================
// UTILITY HELPERS
// ============================================================

function uuid(): string {
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

function now(): string {
  return new Date().toISOString();
}

function today(): string {
  return new Date().toISOString().split("T")[0];
}

// ============================================================
// LOCAL STORAGE WRAPPER
// ============================================================

function getTable<T>(key: string): T[] {
  if (typeof window === "undefined") return [];
  const raw = localStorage.getItem(`jcb_${key}`);
  return raw ? JSON.parse(raw) : [];
}

function setTable<T>(key: string, data: T[]): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(`jcb_${key}`, JSON.stringify(data));
}

// ============================================================
// SEED DATA — runs once when app first loads
// ============================================================

function seedIfEmpty(): void {
  if (typeof window === "undefined") return;
  if (localStorage.getItem("jcb_seeded")) return;

  // Seed machines
  setTable("machines", [
    { id: uuid(), name: "JCB 3DX Super", type: "backhoe_loader", registration_number: "GJ-05-AB-1234", status: "active", created_at: now() },
    { id: uuid(), name: "JCB 4DX", type: "backhoe_loader", registration_number: "GJ-05-CD-5678", status: "active", created_at: now() },
  ]);

  // Seed expense categories
  setTable("expense_categories", [
    { id: uuid(), name: "Diesel" },
    { id: uuid(), name: "Maintenance" },
    { id: uuid(), name: "Driver Salary" },
    { id: uuid(), name: "Insurance" },
    { id: uuid(), name: "Spare Parts" },
    { id: uuid(), name: "Transport" },
    { id: uuid(), name: "Office" },
    { id: uuid(), name: "Other" },
  ]);

  // Seed settings
  setTable("settings", [{
    company_name: "JCB Rental Services",
    invoice_prefix: "INV",
    default_hourly_rate: 1500,
    gst_number: "",
  }]);

  // Seed admin user
  setTable("users", [{
    id: uuid(),
    email: "admin@jcb.com",
    password: "admin123",
    full_name: "Admin User",
    role: "admin",
    is_active: true,
    created_at: now(),
  }]);

  // Seed a counter for bill numbers
  localStorage.setItem("jcb_bill_counter", "0");

  localStorage.setItem("jcb_seeded", "true");
}

// ============================================================
// PARSE URL QUERY PARAMS
// ============================================================

function parseQuery(path: string): { base: string; params: Record<string, string> } {
  const [base, queryString] = path.split("?");
  const params: Record<string, string> = {};
  if (queryString) {
    queryString.split("&").forEach((p) => {
      const [k, v] = p.split("=");
      if (k) params[decodeURIComponent(k)] = decodeURIComponent(v || "");
    });
  }
  return { base, params };
}

// ============================================================
// ROUTE HANDLER — Main entry point for intercepted API calls
// ============================================================

export async function handleLocalRequest<T>(path: string, options: { method?: string; json?: any; body?: any } = {}): Promise<T> {
  seedIfEmpty();

  const method = (options.method || "GET").toUpperCase();
  const { base, params } = parseQuery(path);
  const body = options.json || (options.body ? JSON.parse(options.body as string) : null);

  // ---- AUTH ----
  if (base === "/auth/login" && method === "POST") return handleLogin(body) as T;
  if (base === "/auth/me" && method === "GET") return handleMe() as T;
  if (base === "/auth/signup" && method === "POST") return handleSignup(body) as T;

  // ---- CUSTOMERS ----
  if (base === "/customers" && method === "GET") return listCustomers(params) as T;
  if (base === "/customers" && method === "POST") return createCustomer(body) as T;
  const customerMatch = base.match(/^\/customers\/([a-f0-9-]+)$/);
  if (customerMatch) {
    const id = customerMatch[1];
    if (method === "GET") return getCustomer(id) as T;
    if (method === "PUT") return updateCustomer(id, body) as T;
    if (method === "DELETE") return deleteCustomer(id) as T;
  }
  const ledgerMatch = base.match(/^\/customers\/([a-f0-9-]+)\/ledger$/);
  if (ledgerMatch) return getCustomerLedger(ledgerMatch[1]) as T;

  // ---- BILLS ----
  if (base === "/bills" && method === "GET") return listBills(params) as T;
  if (base === "/bills" && method === "POST") return createBill(body) as T;
  const billMatch = base.match(/^\/bills\/([a-f0-9-]+)$/);
  if (billMatch) {
    const id = billMatch[1];
    if (method === "GET") return getBill(id) as T;
    if (method === "PUT") return updateBill(id, body) as T;
    if (method === "DELETE") return deleteBill(id) as T;
  }

  // ---- PAYMENTS ----
  if (base === "/payments" && method === "GET") return listPayments(params) as T;
  if (base === "/payments" && method === "POST") return createPayment(body) as T;
  const paymentMatch = base.match(/^\/payments\/([a-f0-9-]+)$/);
  if (paymentMatch) {
    const id = paymentMatch[1];
    if (method === "GET") return getPayment(id) as T;
    if (method === "PUT") return updatePayment(id, body) as T;
    if (method === "DELETE") return deletePayment(id) as T;
  }

  // ---- EXPENSES ----
  if (base === "/expenses/categories" && method === "GET") return getExpenseCategories() as T;
  if (base === "/expenses/categories" && method === "POST") return createExpenseCategory(body) as T;
  if (base === "/expenses" && method === "GET") return listExpenses(params) as T;
  if (base === "/expenses" && method === "POST") return createExpense(body) as T;
  const expenseMatch = base.match(/^\/expenses\/([a-f0-9-]+)$/);
  if (expenseMatch) {
    const id = expenseMatch[1];
    if (method === "GET") return getExpense(id) as T;
    if (method === "PUT") return updateExpense(id, body) as T;
    if (method === "DELETE") return deleteExpense(id) as T;
  }

  // ---- MACHINES ----
  if (base === "/machines" && method === "GET") return getMachines() as T;

  // ---- SETTINGS ----
  if (base === "/settings" && method === "GET") return getSettings() as T;
  if (base === "/settings" && method === "PUT") return updateSettings(body) as T;

  // ---- DASHBOARD ----
  if (base === "/dashboard" && method === "GET") return getDashboard() as T;

  console.warn(`[LocalDB] Unhandled route: ${method} ${path}`);
  return {} as T;
}

// ============================================================
// AUTH HANDLERS
// ============================================================

function handleLogin(body: { email: string; password: string }): any {
  const users = getTable<any>("users");
  const user = users.find((u) => u.email === body.email && u.password === body.password);
  if (!user) throw new Error("Invalid email or password");
  // Store current user id for /auth/me
  localStorage.setItem("jcb_current_user", user.id);
  return { access_token: "offline-token-" + user.id, token_type: "bearer" };
}

function handleMe(): any {
  const userId = localStorage.getItem("jcb_current_user");
  const users = getTable<any>("users");
  const user = users.find((u) => u.id === userId);
  if (!user) throw new Error("Not authenticated");
  const { password, ...safeUser } = user;
  return safeUser;
}

function handleSignup(body: { email: string; password: string; full_name: string; role?: string }): any {
  const users = getTable<any>("users");
  const existing = users.find((u) => u.email === body.email);
  if (existing) throw new Error("User with this email already exists");

  const newUser = {
    id: uuid(),
    email: body.email,
    password: body.password,
    full_name: body.full_name,
    role: body.role || "operator",
    is_active: true,
    created_at: now(),
  };
  users.push(newUser);
  setTable("users", users);

  const { password, ...safeUser } = newUser;
  return safeUser;
}

// ============================================================
// CUSTOMER HANDLERS
// ============================================================

function listCustomers(params: Record<string, string>): any {
  let customers = getTable<any>("customers");
  const search = params.search || "";
  if (search) {
    customers = customers.filter((c: any) =>
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      (c.mobile_number && c.mobile_number.includes(search)) ||
      (c.village && c.village.toLowerCase().includes(search.toLowerCase()))
    );
  }

  // Calculate outstanding for each customer
  const bills = getTable<any>("bills");
  const payments = getTable<any>("payments");

  customers = customers.map((c: any) => {
    const totalBilled = bills.filter((b: any) => b.customer_id === c.id).reduce((s: number, b: any) => s + b.total_amount, 0);
    const totalPaid = payments.filter((p: any) => p.customer_id === c.id).reduce((s: number, p: any) => s + p.amount, 0);
    return { ...c, outstanding: totalBilled - totalPaid };
  });

  // Sort
  const sortBy = params.sort_by || "created_at";
  const sortOrder = params.sort_order || "desc";
  customers.sort((a: any, b: any) => {
    const va = a[sortBy] ?? "";
    const vb = b[sortBy] ?? "";
    if (typeof va === "number" && typeof vb === "number") return sortOrder === "asc" ? va - vb : vb - va;
    return sortOrder === "asc" ? String(va).localeCompare(String(vb)) : String(vb).localeCompare(String(va));
  });

  const page = parseInt(params.page || "1");
  const pageSize = parseInt(params.page_size || "20");
  const total = customers.length;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const items = customers.slice((page - 1) * pageSize, page * pageSize);

  return { items, total, page, page_size: pageSize, total_pages: totalPages };
}

function createCustomer(body: any): any {
  const customers = getTable<any>("customers");
  const counter = customers.length + 1;
  const customer = {
    id: uuid(),
    customer_id: `CUST-${String(counter).padStart(4, "0")}`,
    name: body.name,
    mobile_number: body.mobile_number || null,
    village: body.village || null,
    address: body.address || null,
    gst_number: body.gst_number || null,
    notes: body.notes || null,
    created_at: now(),
  };
  customers.push(customer);
  setTable("customers", customers);
  return getCustomer(customer.id);
}

function getCustomer(id: string): any {
  const customers = getTable<any>("customers");
  const c = customers.find((x: any) => x.id === id);
  if (!c) throw new Error("Customer not found");

  const bills = getTable<any>("bills");
  const payments = getTable<any>("payments");
  const totalBilled = bills.filter((b: any) => b.customer_id === c.id).reduce((s: number, b: any) => s + b.total_amount, 0);
  const totalPaid = payments.filter((p: any) => p.customer_id === c.id).reduce((s: number, p: any) => s + p.amount, 0);

  return { ...c, total_billed: totalBilled, total_paid: totalPaid, outstanding: totalBilled - totalPaid };
}

function updateCustomer(id: string, body: any): any {
  const customers = getTable<any>("customers");
  const idx = customers.findIndex((x: any) => x.id === id);
  if (idx === -1) throw new Error("Customer not found");
  customers[idx] = { ...customers[idx], ...body };
  setTable("customers", customers);
  return getCustomer(id);
}

function deleteCustomer(id: string): any {
  let customers = getTable<any>("customers");
  customers = customers.filter((x: any) => x.id !== id);
  setTable("customers", customers);
  return { message: "Deleted" };
}

// ============================================================
// BILL HANDLERS
// ============================================================

function getNextBillNumber(): string {
  const counter = parseInt(localStorage.getItem("jcb_bill_counter") || "0") + 1;
  localStorage.setItem("jcb_bill_counter", String(counter));
  const settings = getTable<any>("settings")[0] || { invoice_prefix: "INV" };
  return `${settings.invoice_prefix}-${String(counter).padStart(5, "0")}`;
}

function calculateBillTotal(data: any): number {
  const base = (data.working_hours || 0) * (data.hourly_rate || 0);
  const subtotal = base + (data.diesel_charge || 0) + (data.transport_charge || 0) + (data.other_charges || 0);
  const afterDiscount = subtotal - (data.discount || 0);
  const gst = afterDiscount * ((data.gst_percent || 0) / 100);
  return Math.round(afterDiscount + gst);
}

function listBills(params: Record<string, string>): any {
  let bills = getTable<any>("bills");
  const customers = getTable<any>("customers");
  const machines = getTable<any>("machines");
  const payments = getTable<any>("payments");

  const search = params.search || "";
  const status = params.status || "";
  const customerId = params.customer_id || "";

  // Enrich bills with names and payment status
  let enriched = bills.map((b: any) => {
    const cust = customers.find((c: any) => c.id === b.customer_id);
    const machine = machines.find((m: any) => m.id === b.machine_id);
    const paidAmount = payments.filter((p: any) => p.bill_id === b.id).reduce((s: number, p: any) => s + p.amount, 0);
    const remaining = b.total_amount - paidAmount;
    const billStatus = remaining <= 0 ? "paid" : paidAmount > 0 ? "partial" : "pending";
    return {
      ...b,
      customer_name: cust?.name || "Unknown",
      machine_name: machine?.name || "Unknown",
      paid_amount: paidAmount,
      remaining_amount: Math.max(0, remaining),
      status: billStatus,
    };
  });

  if (search) {
    enriched = enriched.filter((b: any) =>
      b.bill_number.toLowerCase().includes(search.toLowerCase()) ||
      b.customer_name.toLowerCase().includes(search.toLowerCase())
    );
  }
  if (status) {
    enriched = enriched.filter((b: any) => b.status === status);
  }
  if (customerId) {
    enriched = enriched.filter((b: any) => b.customer_id === customerId);
  }

  enriched.sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

  const page = parseInt(params.page || "1");
  const pageSize = parseInt(params.page_size || "20");
  const total = enriched.length;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const items = enriched.slice((page - 1) * pageSize, page * pageSize);

  return { items, total, page, page_size: pageSize, total_pages: totalPages };
}

function createBill(body: any): any {
  const bills = getTable<any>("bills");
  const bill = {
    id: uuid(),
    bill_number: getNextBillNumber(),
    customer_id: body.customer_id,
    machine_id: body.machine_id,
    date: body.date || today(),
    working_hours: body.working_hours || 0,
    hourly_rate: body.hourly_rate || 0,
    diesel_charge: body.diesel_charge || 0,
    transport_charge: body.transport_charge || 0,
    other_charges: body.other_charges || 0,
    discount: body.discount || 0,
    gst_percent: body.gst_percent || 0,
    site_name: body.site_name || "",
    total_amount: calculateBillTotal(body),
    created_at: now(),
  };
  bills.push(bill);
  setTable("bills", bills);
  return getBill(bill.id);
}

function getBill(id: string): any {
  const bills = getTable<any>("bills");
  const b = bills.find((x: any) => x.id === id);
  if (!b) throw new Error("Bill not found");

  const customers = getTable<any>("customers");
  const machines = getTable<any>("machines");
  const payments = getTable<any>("payments");

  const cust = customers.find((c: any) => c.id === b.customer_id);
  const machine = machines.find((m: any) => m.id === b.machine_id);
  const paidAmount = payments.filter((p: any) => p.bill_id === b.id).reduce((s: number, p: any) => s + p.amount, 0);
  const remaining = b.total_amount - paidAmount;
  const status = remaining <= 0 ? "paid" : paidAmount > 0 ? "partial" : "pending";

  return {
    ...b,
    customer_name: cust?.name || "Unknown",
    machine_name: machine?.name || "Unknown",
    paid_amount: paidAmount,
    remaining_amount: Math.max(0, remaining),
    status,
  };
}

function updateBill(id: string, body: any): any {
  const bills = getTable<any>("bills");
  const idx = bills.findIndex((x: any) => x.id === id);
  if (idx === -1) throw new Error("Bill not found");
  
  const updatedData = { ...bills[idx], ...body };
  updatedData.total_amount = calculateBillTotal(updatedData);
  bills[idx] = updatedData;
  setTable("bills", bills);
  return getBill(id);
}

function deleteBill(id: string): any {
  let bills = getTable<any>("bills");
  bills = bills.filter((x: any) => x.id !== id);
  setTable("bills", bills);
  return { message: "Deleted" };
}

// ============================================================
// PAYMENT HANDLERS
// ============================================================

function listPayments(params: Record<string, string>): any {
  let payments = getTable<any>("payments");
  const customers = getTable<any>("customers");
  const bills = getTable<any>("bills");

  const customerId = params.customer_id || "";
  const billId = params.bill_id || "";

  let enriched = payments.map((p: any) => {
    const cust = customers.find((c: any) => c.id === p.customer_id);
    const bill = bills.find((b: any) => b.id === p.bill_id);
    return {
      ...p,
      customer_name: cust?.name || "Unknown",
      bill_number: bill?.bill_number || null,
    };
  });

  if (customerId) enriched = enriched.filter((p: any) => p.customer_id === customerId);
  if (billId) enriched = enriched.filter((p: any) => p.bill_id === billId);

  enriched.sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

  const page = parseInt(params.page || "1");
  const pageSize = parseInt(params.page_size || "20");
  const total = enriched.length;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const items = enriched.slice((page - 1) * pageSize, page * pageSize);

  return { items, total, page, page_size: pageSize, total_pages: totalPages };
}

function createPayment(body: any): any {
  const payments = getTable<any>("payments");
  const payment = {
    id: uuid(),
    customer_id: body.customer_id,
    bill_id: body.bill_id || null,
    amount: body.amount || 0,
    date: body.date || today(),
    payment_method: body.payment_method || "cash",
    reference_number: body.reference_number || null,
    remark: body.remark || null,
    receiver_name: "Admin",
    created_at: now(),
  };
  payments.push(payment);
  setTable("payments", payments);
  return getPayment(payment.id);
}

function getPayment(id: string): any {
  const payments = getTable<any>("payments");
  const p = payments.find((x: any) => x.id === id);
  if (!p) throw new Error("Payment not found");

  const customers = getTable<any>("customers");
  const bills = getTable<any>("bills");
  const cust = customers.find((c: any) => c.id === p.customer_id);
  const bill = bills.find((b: any) => b.id === p.bill_id);

  return { ...p, customer_name: cust?.name || "Unknown", bill_number: bill?.bill_number || null };
}

function updatePayment(id: string, body: any): any {
  const payments = getTable<any>("payments");
  const idx = payments.findIndex((x: any) => x.id === id);
  if (idx === -1) throw new Error("Payment not found");
  payments[idx] = { ...payments[idx], ...body, bill_id: body.bill_id || null };
  setTable("payments", payments);
  return getPayment(id);
}

function deletePayment(id: string): any {
  let payments = getTable<any>("payments");
  payments = payments.filter((x: any) => x.id !== id);
  setTable("payments", payments);
  return { message: "Deleted" };
}

// ============================================================
// EXPENSE HANDLERS
// ============================================================

function getExpenseCategories(): any {
  return getTable<any>("expense_categories");
}

function createExpenseCategory(body: any): any {
  const categories = getTable<any>("expense_categories");
  const cat = { id: uuid(), name: body.name };
  categories.push(cat);
  setTable("expense_categories", categories);
  return cat;
}

function listExpenses(params: Record<string, string>): any {
  let expenses = getTable<any>("expenses");
  const categories = getTable<any>("expense_categories");
  const categoryId = params.category_id || "";

  let enriched = expenses.map((e: any) => {
    const cat = categories.find((c: any) => c.id === e.category_id);
    return { ...e, category_name: cat?.name || "Unknown" };
  });

  if (categoryId) enriched = enriched.filter((e: any) => e.category_id === categoryId);

  enriched.sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

  const page = parseInt(params.page || "1");
  const pageSize = parseInt(params.page_size || "20");
  const total = enriched.length;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const items = enriched.slice((page - 1) * pageSize, page * pageSize);

  return { items, total, page, page_size: pageSize, total_pages: totalPages };
}

function createExpense(body: any): any {
  const expenses = getTable<any>("expenses");
  const expense = {
    id: uuid(),
    category_id: body.category_id,
    amount: body.amount || 0,
    date: body.date || today(),
    description: body.description || null,
    created_at: now(),
  };
  expenses.push(expense);
  setTable("expenses", expenses);
  return getExpense(expense.id);
}

function getExpense(id: string): any {
  const expenses = getTable<any>("expenses");
  const e = expenses.find((x: any) => x.id === id);
  if (!e) throw new Error("Expense not found");
  const categories = getTable<any>("expense_categories");
  const cat = categories.find((c: any) => c.id === e.category_id);
  return { ...e, category_name: cat?.name || "Unknown" };
}

function updateExpense(id: string, body: any): any {
  const expenses = getTable<any>("expenses");
  const idx = expenses.findIndex((x: any) => x.id === id);
  if (idx === -1) throw new Error("Expense not found");
  expenses[idx] = { ...expenses[idx], ...body };
  setTable("expenses", expenses);
  return getExpense(id);
}

function deleteExpense(id: string): any {
  let expenses = getTable<any>("expenses");
  expenses = expenses.filter((x: any) => x.id !== id);
  setTable("expenses", expenses);
  return { message: "Deleted" };
}

// ============================================================
// MACHINE HANDLERS
// ============================================================

function getMachines(): any {
  return getTable<any>("machines");
}

// ============================================================
// SETTINGS HANDLERS
// ============================================================

function getSettings(): any {
  const settings = getTable<any>("settings");
  return settings[0] || {
    company_name: "JCB Rental Services",
    invoice_prefix: "INV",
    default_hourly_rate: 1500,
    gst_number: "",
  };
}

function updateSettings(body: any): any {
  setTable("settings", [body]);
  return body;
}

// ============================================================
// CUSTOMER LEDGER
// ============================================================

function getCustomerLedger(customerId: string): any {
  const bills = getTable<any>("bills").filter((b: any) => b.customer_id === customerId);
  const payments = getTable<any>("payments").filter((p: any) => p.customer_id === customerId);

  type LedgerEntry = { date: string; type: string; reference: string; description: string; debit: number; credit: number; balance: number; sortDate: number };
  const entries: LedgerEntry[] = [];

  bills.forEach((b: any) => {
    entries.push({
      date: b.date || b.created_at,
      type: "bill",
      reference: b.bill_number,
      description: `Bill ${b.bill_number}${b.site_name ? ` - ${b.site_name}` : ""}`,
      debit: b.total_amount,
      credit: 0,
      balance: 0,
      sortDate: new Date(b.date || b.created_at).getTime(),
    });
  });

  payments.forEach((p: any) => {
    entries.push({
      date: p.date || p.created_at,
      type: "payment",
      reference: p.reference_number || "Payment",
      description: `Payment (${p.payment_method})`,
      debit: 0,
      credit: p.amount,
      balance: 0,
      sortDate: new Date(p.date || p.created_at).getTime(),
    });
  });

  // Sort by date
  entries.sort((a, b) => a.sortDate - b.sortDate);

  // Calculate running balance
  let runningBalance = 0;
  entries.forEach((entry) => {
    runningBalance += entry.debit - entry.credit;
    entry.balance = runningBalance;
  });

  return entries;
}

// ============================================================
// DASHBOARD HANDLER
// ============================================================

function getDashboard(): any {
  const bills = getTable<any>("bills");
  const payments = getTable<any>("payments");
  const expenses = getTable<any>("expenses");
  const customers = getTable<any>("customers");
  const categories = getTable<any>("expense_categories");

  const todayStr = today();
  const currentMonth = todayStr.substring(0, 7); // YYYY-MM

  // Stats
  const todayPayments = payments.filter((p: any) => (p.date || "").startsWith(todayStr));
  const todayExpenses = expenses.filter((e: any) => (e.date || "").startsWith(todayStr));
  const monthlyPayments = payments.filter((p: any) => (p.date || "").startsWith(currentMonth));
  const monthlyExpenses = expenses.filter((e: any) => (e.date || "").startsWith(currentMonth));

  const todayIncome = todayPayments.reduce((s: number, p: any) => s + p.amount, 0);
  const todayExpense = todayExpenses.reduce((s: number, e: any) => s + e.amount, 0);
  const monthlyIncome = monthlyPayments.reduce((s: number, p: any) => s + p.amount, 0);
  const monthlyExpense = monthlyExpenses.reduce((s: number, e: any) => s + e.amount, 0);

  const totalBilled = bills.reduce((s: number, b: any) => s + b.total_amount, 0);
  const totalPaid = payments.reduce((s: number, p: any) => s + p.amount, 0);
  const pendingAmount = totalBilled - totalPaid;

  const totalExpenses = expenses.reduce((s: number, e: any) => s + e.amount, 0);
  const totalProfit = totalPaid - totalExpenses;

  // Recent bills (last 5)
  const enrichedBills = bills.map((b: any) => {
    const cust = customers.find((c: any) => c.id === b.customer_id);
    const paidAmt = payments.filter((p: any) => p.bill_id === b.id).reduce((s: number, p: any) => s + p.amount, 0);
    const remaining = b.total_amount - paidAmt;
    return {
      bill_number: b.bill_number,
      customer_name: cust?.name || "Unknown",
      site_name: b.site_name || "",
      total_amount: b.total_amount,
      status: remaining <= 0 ? "paid" : paidAmt > 0 ? "partial" : "pending",
      date: b.date,
    };
  });
  enrichedBills.sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime());

  // Recent payments (last 5)
  const enrichedPayments = payments.map((p: any) => {
    const cust = customers.find((c: any) => c.id === p.customer_id);
    return {
      customer_name: cust?.name || "Unknown",
      amount: p.amount,
      payment_method: p.payment_method,
      date: p.date,
    };
  });
  enrichedPayments.sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime());

  // Monthly revenue (last 6 months)
  const monthlyRevenue: { month: string; income: number; expense: number }[] = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date();
    d.setMonth(d.getMonth() - i);
    const monthKey = d.toISOString().substring(0, 7);
    const monthLabel = d.toLocaleDateString("en-US", { month: "short" });
    const income = payments.filter((p: any) => (p.date || "").startsWith(monthKey)).reduce((s: number, p: any) => s + p.amount, 0);
    const expense = expenses.filter((e: any) => (e.date || "").startsWith(monthKey)).reduce((s: number, e: any) => s + e.amount, 0);
    monthlyRevenue.push({ month: monthLabel, income, expense });
  }

  // Expense breakdown by category
  const expenseBreakdown: { category: string; amount: number }[] = [];
  categories.forEach((cat: any) => {
    const catExpenses = expenses.filter((e: any) => e.category_id === cat.id);
    const amount = catExpenses.reduce((s: number, e: any) => s + e.amount, 0);
    if (amount > 0) expenseBreakdown.push({ category: cat.name, amount });
  });

  // Profit trend (last 6 months)
  const profitTrend: { month: string; profit: number }[] = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date();
    d.setMonth(d.getMonth() - i);
    const monthKey = d.toISOString().substring(0, 7);
    const monthLabel = d.toLocaleDateString("en-US", { month: "short" });
    const income = payments.filter((p: any) => (p.date || "").startsWith(monthKey)).reduce((s: number, p: any) => s + p.amount, 0);
    const expense = expenses.filter((e: any) => (e.date || "").startsWith(monthKey)).reduce((s: number, e: any) => s + e.amount, 0);
    profitTrend.push({ month: monthLabel, profit: income - expense });
  }

  return {
    stats: {
      today_income: todayIncome,
      today_expense: todayExpense,
      monthly_income: monthlyIncome,
      monthly_expense: monthlyExpense,
      pending_amount: Math.max(0, pendingAmount),
      total_profit: totalProfit,
    },
    recent_bills: enrichedBills.slice(0, 5),
    recent_payments: enrichedPayments.slice(0, 5),
    monthly_revenue: monthlyRevenue,
    expense_breakdown: expenseBreakdown,
    profit_trend: profitTrend,
  };
}
