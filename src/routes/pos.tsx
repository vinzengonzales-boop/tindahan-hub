import { createFileRoute } from "@tanstack/react-router";
import { useRef, useState } from "react";
import { Minus, Plus, Search, ShoppingCart, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, ConfirmButton, EmptyState, ReceiptDialog, StatusBadge, selectClass, useMoney } from "@/components/kit";
import { checkout, useData, PRODUCT_CATEGORIES } from "@/lib/store";
import { cartTotal, computeChange, lineSubtotal, parseNum, stockStatus, type Sale, type SaleItem } from "@/lib/calc";

export const Route = createFileRoute("/pos")({
  head: () => ({
    meta: [
      { title: "New Sale — Sari-Sari Manager" },
      { name: "description", content: "Point of sale: add items to the cart, take cash and print a receipt." },
      { property: "og:title", content: "New Sale — Sari-Sari Manager" },
      { property: "og:description", content: "Point of sale for your sari-sari store." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: POS,
});

function POS() {
  const d = useData()!;
  const money = useMoney();
  const [q, setQ] = useState("");
  const [cat, setCat] = useState("");
  const [cart, setCart] = useState<SaleItem[]>([]);
  const [paidStr, setPaidStr] = useState("");
  const [receipt, setReceipt] = useState<Sale | null>(null);
  const busy = useRef(false);

  const th = d.settings.lowStockThreshold;
  const list = d.products.filter((p) => p.name.toLowerCase().includes(q.toLowerCase()) && (!cat || p.category === cat));
  const total = cartTotal(cart);
  const paid = parseNum(paidStr);
  const change = Number.isFinite(paid) ? computeChange(total, paid) : 0;

  function stockOf(id: string) {
    return d.products.find((p) => p.id === id)?.stock ?? 0;
  }

  function setQty(productId: string, qty: number) {
    const max = stockOf(productId);
    if (qty > max) {
      toast.error(`Only ${max} in stock.`);
      qty = max;
    }
    setCart((c) => (qty <= 0 ? c.filter((i) => i.productId !== productId) : c.map((i) => (i.productId === productId ? { ...i, qty } : i))));
  }

  function add(pId: string) {
    const p = d.products.find((x) => x.id === pId)!;
    const inCart = cart.find((i) => i.productId === pId);
    if ((inCart?.qty ?? 0) + 1 > p.stock) return void toast.error(`Not enough stock for ${p.name}.`);
    if (inCart) setQty(pId, inCart.qty + 1);
    else setCart((c) => [...c, { productId: p.id, name: p.name, price: p.price, qty: 1 }]);
  }

  function doCheckout() {
    if (busy.current) return; // prevent double submit
    busy.current = true;
    const r = checkout(cart, paid);
    busy.current = false;
    if (!r.ok) return void toast.error(r.error);
    toast.success(`Sale ${r.sale!.id} saved. Change: ${money(r.sale!.change)}`);
    setCart([]);
    setPaidStr("");
    setReceipt(r.sale!);
  }

  return (
    <div className="grid gap-4 lg:grid-cols-[1fr_380px]">
      <Card>
        <div className="mb-3 grid gap-2 sm:grid-cols-[1fr_200px]">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input aria-label="Search products" placeholder="Search products…" className="pl-9" value={q} onChange={(e) => setQ(e.target.value)} />
          </div>
          <select aria-label="Category" className={selectClass} value={cat} onChange={(e) => setCat(e.target.value)}>
            <option value="">All categories</option>
            {PRODUCT_CATEGORIES.map((c) => (
              <option key={c}>{c}</option>
            ))}
          </select>
        </div>
        {list.length === 0 ? (
          <EmptyState icon={Search} title="No products found" />
        ) : (
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            {list.map((p) => {
              const out = p.stock <= 0;
              return (
                <button
                  key={p.id}
                  type="button"
                  disabled={out}
                  onClick={() => add(p.id)}
                  className="flex flex-col items-start gap-1 rounded-lg border bg-card p-3 text-left hover:border-primary hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <span className="line-clamp-2 text-sm font-semibold">{p.name}</span>
                  <span className="font-bold text-primary">{money(p.price)}</span>
                  <span className="flex items-center gap-1 text-xs text-muted-foreground">
                    {p.stock} left {stockStatus(p.stock, th) !== "In Stock" && <StatusBadge status={stockStatus(p.stock, th)} />}
                  </span>
                </button>
              );
            })}
          </div>
        )}
      </Card>

      <Card className="h-fit space-y-4 lg:sticky lg:top-20">
        <h2 className="flex items-center gap-2 font-bold">
          <ShoppingCart className="size-5" /> Cart
        </h2>
        {cart.length === 0 ? (
          <EmptyState icon={ShoppingCart} title="Cart is empty" text="Tap a product to add it." />
        ) : (
          <ul className="divide-y">
            {cart.map((i) => (
              <li key={i.productId} className="py-2">
                <div className="flex justify-between gap-2 text-sm">
                  <span className="font-semibold">{i.name}</span>
                  <span className="font-bold">{money(lineSubtotal(i))}</span>
                </div>
                <div className="mt-1 flex items-center gap-1">
                  <Button size="icon" variant="outline" className="size-8" aria-label={`Decrease ${i.name}`} onClick={() => setQty(i.productId, i.qty - 1)}>
                    <Minus className="size-4" />
                  </Button>
                  <Input
                    aria-label={`Quantity of ${i.name}`}
                    type="number"
                    min={1}
                    className="h-8 w-16 text-center"
                    value={i.qty}
                    onChange={(e) => {
                      const n = Math.floor(parseNum(e.target.value));
                      if (Number.isFinite(n)) setQty(i.productId, n);
                    }}
                  />
                  <Button size="icon" variant="outline" className="size-8" aria-label={`Increase ${i.name}`} onClick={() => setQty(i.productId, i.qty + 1)}>
                    <Plus className="size-4" />
                  </Button>
                  <span className="ml-1 text-xs text-muted-foreground">× {money(i.price)}</span>
                  <Button size="icon" variant="ghost" className="ml-auto size-8 text-destructive" aria-label={`Remove ${i.name}`} onClick={() => setQty(i.productId, 0)}>
                    <Trash2 className="size-4" />
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        )}

        <div className="space-y-3 border-t pt-3">
          <div className="flex justify-between text-lg font-extrabold">
            <span>Total</span>
            <span data-testid="cart-total">{money(total)}</span>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="paid">Cash received (₱)</Label>
            <Input id="paid" type="number" inputMode="decimal" min={0} step="0.01" value={paidStr} onChange={(e) => setPaidStr(e.target.value)} placeholder="0.00" className="h-11 text-lg" />
          </div>
          <div className="flex justify-between text-sm">
            <span>Change</span>
            <span data-testid="change" className={change < 0 ? "font-bold text-destructive" : "font-bold"}>
              {Number.isFinite(paid) ? (change < 0 ? `Short by ${money(-change)}` : money(change)) : "—"}
            </span>
          </div>
          <Button className="h-12 w-full text-base font-bold" disabled={cart.length === 0 || !Number.isFinite(paid) || change < 0} onClick={doCheckout}>
            Complete sale
          </Button>
          {cart.length > 0 && (
            <ConfirmButton
              title="Cancel this sale?"
              description="The cart will be cleared. Nothing will be saved and stock will not change."
              confirmLabel="Cancel sale"
              variant="outline"
              onConfirm={() => {
                setCart([]);
                setPaidStr("");
                toast("Sale cancelled.");
              }}
            >
              Cancel sale
            </ConfirmButton>
          )}
        </div>
      </Card>
      <ReceiptDialog sale={receipt} onClose={() => setReceipt(null)} />
    </div>
  );
}
