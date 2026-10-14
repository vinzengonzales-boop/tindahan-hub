import { describe, expect, it } from "vitest";
import {
  cartTotal,
  computeChange,
  debtBalance,
  debtStatus,
  stockStatus,
  validateCheckout,
  validatePayment,
  type Product,
} from "@/lib/calc";

const products: Product[] = [{ id: "p1", name: "Coke 1.5 L", category: "Beverages", price: 73, stock: 6 }];

describe("sales", () => {
  it("totals and change", () => {
    const items = [{ productId: "p1", name: "Coke", price: 73, qty: 2 }];
    expect(cartTotal(items)).toBe(146);
    expect(computeChange(146, 200)).toBe(54);
  });
  it("rejects insufficient payment", () => {
    expect(validateCheckout([{ productId: "p1", name: "Coke", price: 73, qty: 1 }], products, 50)).toMatch(/Insufficient/);
  });
  it("rejects insufficient stock", () => {
    expect(validateCheckout([{ productId: "p1", name: "Coke", price: 73, qty: 7 }], products, 1000)).toMatch(/Not enough stock/);
  });
});

describe("stock status", () => {
  it("labels by threshold", () => {
    expect(stockStatus(0, 10)).toBe("Out of Stock");
    expect(stockStatus(6, 10)).toBe("Low Stock");
    expect(stockStatus(67, 10)).toBe("In Stock");
  });
});

describe("utang", () => {
  const debt = { id: "d1", customerId: "c1", date: "2026-10-01", description: "x", amount: 150 };
  it("partial then full payment", () => {
    const partial = [{ id: "a", debtId: "d1", customerId: "c1", date: "2026-10-02", amount: 50 }];
    expect(debtBalance(debt, partial)).toBe(100);
    expect(debtStatus(debt, partial)).toBe("Partially Paid");
    const full = [...partial, { id: "b", debtId: "d1", customerId: "c1", date: "2026-10-03", amount: 100 }];
    expect(debtStatus(debt, full)).toBe("Paid");
  });
  it("blocks overpayment", () => {
    expect(validatePayment(151, 150)).toMatch(/cannot exceed/);
  });
});
