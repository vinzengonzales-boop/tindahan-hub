// Data storage for Sari-Sari Manager.
// All records are saved in the browser's localStorage under one key.
// Every change goes through an "action" function below, which validates the
// input first and only saves when everything is valid (no partial updates).
import { useSyncExternalStore } from "react";
import {
  cartTotal,
  computeChange,
  dateKey,
  debtBalance,
  round2,
  validateCheckout,
  validatePayment,
  type Customer,
  type Debt,
  type Expense,
  type Payment,
  type Product,
  type Sale,
  type SaleItem,
  type Settings,
} from "./calc";

export const STORAGE_KEY = "sari-sari-manager-v1";

export type AppData = {
  version: 1;
  products: Product[];
  sales: Sale[];
  customers: Customer[];
  debts: Debt[];
  payments: Payment[];
  expenses: Expense[];
  settings: Settings;
};

export type Result = { ok: true; message?: string; id?: string } | { ok: false; error: string };

export const PRODUCT_CATEGORIES = [
  "Beverages",
  "Canned Goods",
  "Snacks",
  "Instant Noodles",
  "Household Supplies",
  "Personal Care",
  "Others",
];

export const EXPENSE_CATEGORIES = [
  "Restocking / Supplies",
  "Electricity",
  "Water",
  "Rent",
  "Transportation",
  "Repairs",
  "Others",
];

export function newId(prefix: string): string {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
}

/** Initial sample data. Every value here can be edited inside the app. */
export function makeSeed(): AppData {
  const p = (name: string, category: string, price: number, stock: number): Product => ({
    id: newId("P"),
    name,
    category,
    price,
    stock,
  });
  const products = [
    p("Coke 1.5 L", "Beverages", 73, 67),
    p("Royal 1.5 L", "Beverages", 73, 16),
    p("Sprite 1.5 L", "Beverages", 73, 6),
    p("Mountain Dew 1.5 L", "Beverages", 73, 69),
    p("Sample: Century Tuna 155g", "Canned Goods", 38, 24),
    p("Sample: Ligo Sardines 155g", "Canned Goods", 25, 4),
    p("Sample: Argentina Corned Beef 150g", "Canned Goods", 42, 0),
    p("Sample: Piattos 40g", "Snacks", 20, 30),
    p("Sample: Skyflakes Crackers", "Snacks", 8, 50),
    p("Sample: Lucky Me Pancit Canton", "Instant Noodles", 16, 40),
    p("Sample: Nissin Cup Noodles", "Instant Noodles", 28, 3),
    p("Sample: Surf Powder Sachet", "Household Supplies", 9, 60),
    p("Sample: Joy Dishwashing Sachet", "Household Supplies", 7, 35),
    p("Sample: Safeguard Soap 60g", "Personal Care", 30, 12),
    p("Sample: Palmolive Shampoo Sachet", "Personal Care", 7, 80),
  ];
  const a: Customer = { id: newId("C"), name: "Customer A" };
  const b: Customer = { id: newId("C"), name: "Customer B" };
  const c: Customer = { id: newId("C"), name: "Customer C" };
  const da: Debt = { id: newId("D"), customerId: a.id, date: "2026-10-01", description: "Groceries (sample)", amount: 150 };
  const db: Debt = { id: newId("D"), customerId: b.id, date: "2026-10-05", description: "Groceries (sample)", amount: 250 };
  const dc: Debt = { id: newId("D"), customerId: c.id, date: "2026-10-08", description: "Groceries (sample)", amount: 75 };
  return {
    version: 1,
    products,
    sales: [],
    customers: [a, b, c],
    debts: [da, db, dc],
    payments: [{ id: newId("PAY"), debtId: db.id, customerId: b.id, date: "2026-10-05", amount: 250 }],
    expenses: [],
    settings: { storeName: "Sari-Sari Manager", lowStockThreshold: 10, currencySymbol: "₱" },
  };
}

// ---------- tiny store (subscribe / get / set) ----------
let data: AppData | null = null;
const listeners = new Set<() => void>();

function load(): AppData {
  if (data) return data;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : null;
    data = parsed && validateBackup(parsed) === null ? (parsed as AppData) : makeSeed();
  } catch {
    data = makeSeed();
  }
  if (!localStorage.getItem(STORAGE_KEY)) persist(data);
  return data;
}

function persist(d: AppData) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(d));
}

function commit(next: AppData) {
  persist(next); // throws if storage is full, so in-memory data stays unchanged
  data = next;
  listeners.forEach((l) => l());
}

function update(fn: (d: AppData) => AppData | string): Result {
  try {
    const cur = load();
    const out = fn(structuredClone(cur));
    if (typeof out === "string") return { ok: false, error: out };
    commit(out);
    return { ok: true };
  } catch (e) {
    return { ok: false, error: "Could not save: " + (e instanceof Error ? e.message : "unknown error") };
  }
}

export function getData(): AppData {
  return load();
}

export function useData(): AppData | null {
  return useSyncExternalStore(
    (cb) => {
      listeners.add(cb);
      return () => listeners.delete(cb);
    },
    () => load(),
    () => null,
  );
}

// ---------- validation helpers ----------
function cleanText(s: string, max = 100): string {
  return s.trim().replace(/\s+/g, " ").slice(0, max);
}

export type ProductInput = { name: string; category: string; price: number; stock: number };

function validateProduct(p: ProductInput, all: Product[], ignoreId?: string): string | null {
  const name = cleanText(p.name);
  if (!name) return "Product name is required.";
  if (!p.category) return "Please choose a category.";
  if (!Number.isFinite(p.price) || p.price < 0) return "Price must be zero or more.";
  if (!Number.isInteger(p.stock) || p.stock < 0) return "Stock must be a whole number, zero or more.";
  if (all.some((x) => x.id !== ignoreId && x.name.toLowerCase() === name.toLowerCase()))
    return "A product with this name already exists.";
  return null;
}

// ---------- products ----------
export function addProduct(input: ProductInput): Result {
  return update((d) => {
    const err = validateProduct(input, d.products);
    if (err) return err;
    d.products.push({ id: newId("P"), name: cleanText(input.name), category: input.category, price: round2(input.price), stock: input.stock });
    return d;
  });
}

export function editProduct(id: string, input: ProductInput): Result {
  return update((d) => {
    const err = validateProduct(input, d.products, id);
    if (err) return err;
    const p = d.products.find((x) => x.id === id);
    if (!p) return "Product not found.";
    Object.assign(p, { name: cleanText(input.name), category: input.category, price: round2(input.price), stock: input.stock });
    return d;
  });
}

/** Add (positive) or remove (negative) stock. Stock can never go below zero. */
export function adjustStock(id: string, delta: number): Result {
  return update((d) => {
    if (!Number.isInteger(delta) || delta === 0) return "Enter a whole number that is not zero.";
    const p = d.products.find((x) => x.id === id);
    if (!p) return "Product not found.";
    if (p.stock + delta < 0) return `Stock cannot go below zero. Current stock is ${p.stock}.`;
    p.stock += delta;
    return d;
  });
}

export function deleteProduct(id: string): Result {
  return update((d) => {
    d.products = d.products.filter((x) => x.id !== id);
    return d;
  });
}

// ---------- sales ----------
function nextSaleId(sales: Sale[], now: Date): string {
  const day = dateKey(now).replace(/-/g, "");
  const count = sales.filter((s) => s.id.startsWith(`TXN-${day}`)).length + 1;
  let id = `TXN-${day}-${String(count).padStart(4, "0")}`;
  while (sales.some((s) => s.id === id)) id += "A";
  return id;
}

/** Saves the sale AND deducts stock together. If anything is invalid, nothing changes. */
export function checkout(items: SaleItem[], paid: number): Result & { sale?: Sale } {
  let created: Sale | undefined;
  const res = update((d) => {
    const err = validateCheckout(items, d.products, paid);
    if (err) return err;
    const now = new Date();
    const total = cartTotal(items);
    for (const item of items) {
      const p = d.products.find((x) => x.id === item.productId)!;
      p.stock -= item.qty;
    }
    created = {
      id: nextSaleId(d.sales, now),
      date: now.toISOString(),
      items: items.map((i) => ({ ...i })),
      total,
      paid: round2(paid),
      change: computeChange(total, paid),
      method: "Cash",
    };
    d.sales.push(created);
    return d;
  });
  return res.ok ? { ...res, sale: created } : res;
}

// ---------- customers & utang ----------
export function addCustomer(name: string): Result {
  let id = "";
  const r = update((d) => {
    const n = cleanText(name, 60);
    if (!n) return "Customer name is required.";
    if (d.customers.some((c) => c.name.toLowerCase() === n.toLowerCase())) return "This customer already exists.";
    id = newId("C");
    d.customers.push({ id, name: n });
    return d;
  });
  return r.ok ? { ok: true, id } : r;
}

export function renameCustomer(id: string, name: string): Result {
  return update((d) => {
    const n = cleanText(name, 60);
    if (!n) return "Customer name is required.";
    if (d.customers.some((c) => c.id !== id && c.name.toLowerCase() === n.toLowerCase())) return "This name is already used.";
    const c = d.customers.find((x) => x.id === id);
    if (!c) return "Customer not found.";
    c.name = n;
    return d;
  });
}

export function deleteCustomer(id: string): Result {
  return update((d) => {
    d.customers = d.customers.filter((c) => c.id !== id);
    d.debts = d.debts.filter((x) => x.customerId !== id);
    d.payments = d.payments.filter((x) => x.customerId !== id);
    return d;
  });
}

export function addDebt(customerId: string, date: string, description: string, amount: number): Result {
  return update((d) => {
    if (!d.customers.some((c) => c.id === customerId)) return "Please choose a customer.";
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return "Please enter a valid date.";
    if (!Number.isFinite(amount) || amount <= 0) return "Amount must be greater than zero.";
    d.debts.push({ id: newId("D"), customerId, date, description: cleanText(description, 120) || "Utang", amount: round2(amount) });
    return d;
  });
}

export function addPayment(debtId: string, date: string, amount: number): Result {
  return update((d) => {
    const debt = d.debts.find((x) => x.id === debtId);
    if (!debt) return "Debt record not found.";
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return "Please enter a valid date.";
    const err = validatePayment(amount, debtBalance(debt, d.payments));
    if (err) return err;
    d.payments.push({ id: newId("PAY"), debtId, customerId: debt.customerId, date, amount: round2(amount) });
    return d;
  });
}

export function deleteDebt(debtId: string): Result {
  return update((d) => {
    d.debts = d.debts.filter((x) => x.id !== debtId);
    d.payments = d.payments.filter((x) => x.debtId !== debtId);
    return d;
  });
}

// ---------- expenses ----------
export type ExpenseInput = { description: string; amount: number; category: string; date: string };
function validateExpense(e: ExpenseInput): string | null {
  if (!cleanText(e.description)) return "Description is required.";
  if (!Number.isFinite(e.amount) || e.amount <= 0) return "Amount must be greater than zero.";
  if (!e.category) return "Please choose a category.";
  if (!/^\d{4}-\d{2}-\d{2}$/.test(e.date)) return "Please enter a valid date.";
  return null;
}
export function addExpense(e: ExpenseInput): Result {
  return update((d) => {
    const err = validateExpense(e);
    if (err) return err;
    d.expenses.push({ id: newId("E"), ...e, description: cleanText(e.description), amount: round2(e.amount) });
    return d;
  });
}
export function editExpense(id: string, e: ExpenseInput): Result {
  return update((d) => {
    const err = validateExpense(e);
    if (err) return err;
    const x = d.expenses.find((y) => y.id === id);
    if (!x) return "Expense not found.";
    Object.assign(x, { ...e, description: cleanText(e.description), amount: round2(e.amount) });
    return d;
  });
}
export function deleteExpense(id: string): Result {
  return update((d) => {
    d.expenses = d.expenses.filter((x) => x.id !== id);
    return d;
  });
}

// ---------- settings ----------
export function saveSettings(s: { storeName: string; lowStockThreshold: number; currencySymbol: string }): Result {
  return update((d) => {
    const name = cleanText(s.storeName, 60);
    if (!name) return "Store name is required.";
    if (!Number.isInteger(s.lowStockThreshold) || s.lowStockThreshold < 0 || s.lowStockThreshold > 10000)
      return "Low-stock threshold must be a whole number from 0 to 10000.";
    const sym = s.currencySymbol.trim().slice(0, 4);
    if (!sym) return "Currency symbol is required.";
    d.settings = { ...d.settings, storeName: name, lowStockThreshold: s.lowStockThreshold, currencySymbol: sym };
    return d;
  });
}

export function setPasswordHash(hash: string, salt: string): Result {
  return update((d) => {
    d.settings.passwordHash = hash;
    d.settings.passwordSalt = salt;
    return d;
  });
}

// ---------- backup ----------
const isNum = (n: unknown) => typeof n === "number" && Number.isFinite(n);
const isStr = (s: unknown) => typeof s === "string";

/** Checks that an object looks like a valid Sari-Sari Manager backup. */
export function validateBackup(x: unknown): string | null {
  if (!x || typeof x !== "object") return "File is not a valid backup.";
  const d = x as Record<string, unknown>;
  if (d.version !== 1) return "Unsupported backup version.";
  const arrays = ["products", "sales", "customers", "debts", "payments", "expenses"];
  for (const k of arrays) if (!Array.isArray(d[k])) return `Backup is missing "${k}".`;
  const ok =
    (d.products as Product[]).every((p) => isStr(p.id) && isStr(p.name) && isNum(p.price) && isNum(p.stock) && p.stock >= 0) &&
    (d.sales as Sale[]).every((s) => isStr(s.id) && isStr(s.date) && Array.isArray(s.items) && isNum(s.total)) &&
    (d.customers as Customer[]).every((c) => isStr(c.id) && isStr(c.name)) &&
    (d.debts as Debt[]).every((c) => isStr(c.id) && isStr(c.customerId) && isNum(c.amount)) &&
    (d.payments as Payment[]).every((c) => isStr(c.id) && isStr(c.debtId) && isNum(c.amount)) &&
    (d.expenses as Expense[]).every((c) => isStr(c.id) && isNum(c.amount) && isStr(c.date));
  if (!ok) return "Backup contains invalid records.";
  const s = d.settings as Settings | undefined;
  if (!s || !isStr(s.storeName) || !isNum(s.lowStockThreshold)) return "Backup settings are invalid.";
  return null;
}

export function restoreBackup(x: unknown): Result {
  const err = validateBackup(x);
  if (err) return { ok: false, error: err };
  const incoming = x as AppData;
  // Keep the current password so restoring a backup does not lock the owner out.
  const cur = load();
  return update(() => ({ ...incoming, settings: { ...incoming.settings, passwordHash: cur.settings.passwordHash, passwordSalt: cur.settings.passwordSalt } }));
}

export function resetToSample(): Result {
  const cur = load();
  const seed = makeSeed();
  seed.settings.passwordHash = cur.settings.passwordHash;
  seed.settings.passwordSalt = cur.settings.passwordSalt;
  return update(() => seed);
}
