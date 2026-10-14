// Pure helper functions for calculations and validation.
// They do not read or write storage, so they are easy to test.

export type Product = { id: string; name: string; category: string; price: number; stock: number };
export type SaleItem = { productId: string; name: string; price: number; qty: number };
export type Sale = {
  id: string;
  date: string; // ISO date-time
  items: SaleItem[];
  total: number;
  paid: number;
  change: number;
  method: "Cash";
};
export type Customer = { id: string; name: string };
export type Debt = { id: string; customerId: string; date: string; description: string; amount: number };
export type Payment = { id: string; debtId: string; customerId: string; date: string; amount: number };
export type Expense = { id: string; description: string; amount: number; category: string; date: string };
export type Settings = {
  storeName: string;
  lowStockThreshold: number;
  currencySymbol: string;
  passwordHash?: string | undefined;
  passwordSalt?: string | undefined;
};

export type StockStatus = "In Stock" | "Low Stock" | "Out of Stock";
export type DebtStatus = "Unpaid" | "Partially Paid" | "Paid";

/** Round to 2 decimal places to avoid floating point errors like 0.1 + 0.2. */
export function round2(n: number): number {
  return Math.round((n + Number.EPSILON) * 100) / 100;
}

export function formatMoney(n: number, symbol = "₱"): string {
  return (
    symbol +
    round2(n).toLocaleString("en-PH", { minimumFractionDigits: 2, maximumFractionDigits: 2 })
  );
}

export function stockStatus(stock: number, threshold: number): StockStatus {
  if (stock <= 0) return "Out of Stock";
  if (stock <= threshold) return "Low Stock";
  return "In Stock";
}

export function lineSubtotal(item: { price: number; qty: number }): number {
  return round2(item.price * item.qty);
}

export function cartTotal(items: { price: number; qty: number }[]): number {
  return round2(items.reduce((sum, i) => sum + lineSubtotal(i), 0));
}

export function computeChange(total: number, paid: number): number {
  return round2(paid - total);
}

/** Returns an error message, or null when the checkout is valid. */
export function validateCheckout(
  items: SaleItem[],
  products: Product[],
  paid: number,
): string | null {
  if (items.length === 0) return "The cart is empty.";
  for (const item of items) {
    if (!Number.isInteger(item.qty) || item.qty <= 0) return `Invalid quantity for ${item.name}.`;
    const p = products.find((x) => x.id === item.productId);
    if (!p) return `${item.name} no longer exists in inventory.`;
    if (item.qty > p.stock) return `Not enough stock for ${p.name}. Only ${p.stock} left.`;
  }
  if (!Number.isFinite(paid) || paid < 0) return "Enter a valid amount received.";
  const total = cartTotal(items);
  if (round2(paid) < total) return `Insufficient payment. Total due is ${formatMoney(total)}.`;
  return null;
}

export function paidForDebt(debtId: string, payments: Payment[]): number {
  return round2(payments.filter((p) => p.debtId === debtId).reduce((s, p) => s + p.amount, 0));
}

export function debtBalance(debt: Debt, payments: Payment[]): number {
  return round2(debt.amount - paidForDebt(debt.id, payments));
}

export function debtStatus(debt: Debt, payments: Payment[]): DebtStatus {
  const paid = paidForDebt(debt.id, payments);
  if (paid <= 0) return "Unpaid";
  if (paid >= debt.amount) return "Paid";
  return "Partially Paid";
}

export function customerBalance(customerId: string, debts: Debt[], payments: Payment[]): number {
  return round2(
    debts.filter((d) => d.customerId === customerId).reduce((s, d) => s + debtBalance(d, payments), 0),
  );
}

export function totalOutstanding(debts: Debt[], payments: Payment[]): number {
  return round2(debts.reduce((s, d) => s + debtBalance(d, payments), 0));
}

/** Validate a payment: must be positive and not more than the remaining balance. */
export function validatePayment(amount: number, balance: number): string | null {
  if (!Number.isFinite(amount) || amount <= 0) return "Payment must be greater than zero.";
  if (round2(amount) > round2(balance))
    return `Payment cannot exceed the remaining balance of ${formatMoney(balance)}.`;
  return null;
}

/** Local date as YYYY-MM-DD. */
export function dateKey(d: Date | string): string {
  const x = typeof d === "string" ? new Date(d) : d;
  const m = String(x.getMonth() + 1).padStart(2, "0");
  const day = String(x.getDate()).padStart(2, "0");
  return `${x.getFullYear()}-${m}-${day}`;
}

/** True when a YYYY-MM-DD key is within an optional from/to range (inclusive). */
export function inRange(key: string, from?: string, to?: string): boolean {
  if (from && key < from) return false;
  if (to && key > to) return false;
  return true;
}

export function sumSales(sales: Sale[]): number {
  return round2(sales.reduce((s, x) => s + x.total, 0));
}

export function sumExpenses(expenses: Expense[]): number {
  return round2(expenses.reduce((s, x) => s + x.amount, 0));
}

export function bestSellers(sales: Sale[], limit = 5) {
  const map = new Map<string, { name: string; qty: number; revenue: number }>();
  for (const s of sales) {
    for (const i of s.items) {
      const cur = map.get(i.productId) ?? { name: i.name, qty: 0, revenue: 0 };
      cur.qty += i.qty;
      cur.revenue = round2(cur.revenue + lineSubtotal(i));
      map.set(i.productId, cur);
    }
  }
  return [...map.values()].sort((a, b) => b.qty - a.qty).slice(0, limit);
}

/** Parse a user-typed number. Returns NaN for empty or invalid input. */
export function parseNum(v: string): number {
  if (v.trim() === "") return NaN;
  const n = Number(v);
  return Number.isFinite(n) ? n : NaN;
}

export function toCSV(rows: (string | number)[][]): string {
  return rows
    .map((r) =>
      r
        .map((c) => {
          const s = String(c);
          return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
        })
        .join(","),
    )
    .join("\n");
}
