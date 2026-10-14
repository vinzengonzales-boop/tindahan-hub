import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { AlertTriangle, Info, ShoppingCart, TrendingUp, Users, Wallet, Receipt } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, EmptyState, StatCard, StatusBadge, useMoney } from "@/components/kit";
import { useData } from "@/lib/store";
import { bestSellers, dateKey, inRange, round2, stockStatus, sumExpenses, sumSales, totalOutstanding } from "@/lib/calc";

export const Route = createFileRoute("/reports")({
  head: () => ({
    meta: [
      { title: "Reports — Sari-Sari Manager" },
      { name: "description", content: "Sales revenue, best sellers, expenses and outstanding utang for any period." },
      { property: "og:title", content: "Reports — Sari-Sari Manager" },
      { property: "og:description", content: "Sales, best sellers, expenses and utang reports." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Reports,
});

function Reports() {
  const d = useData()!;
  const money = useMoney();
  const today = dateKey(new Date());
  const monthStart = today.slice(0, 8) + "01";
  const [from, setFrom] = useState(monthStart);
  const [to, setTo] = useState(today);

  const sales = d.sales.filter((s) => inRange(dateKey(s.date), from || undefined, to || undefined));
  const expenses = d.expenses.filter((e) => inRange(e.date, from || undefined, to || undefined));
  const revenue = sumSales(sales);
  const exp = sumExpenses(expenses);
  const best = bestSellers(sales, 10);
  const th = d.settings.lowStockThreshold;
  const low = d.products.filter((p) => stockStatus(p.stock, th) !== "In Stock").sort((a, b) => a.stock - b.stock);

  return (
    <div className="space-y-4">
      <Card className="flex flex-wrap items-end gap-2">
        <div className="space-y-1">
          <Label htmlFor="rfrom">From</Label>
          <Input id="rfrom" type="date" value={from} onChange={(e) => setFrom(e.target.value)} />
        </div>
        <div className="space-y-1">
          <Label htmlFor="rto">To</Label>
          <Input id="rto" type="date" value={to} onChange={(e) => setTo(e.target.value)} />
        </div>
        <Button variant="outline" onClick={() => { setFrom(today); setTo(today); }}>Today</Button>
        <Button variant="outline" onClick={() => { setFrom(monthStart); setTo(today); }}>This month</Button>
        <Button variant="ghost" onClick={() => { setFrom(""); setTo(""); }}>All time</Button>
      </Card>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Sales revenue" value={money(revenue)} icon={Wallet} />
        <StatCard label="Completed transactions" value={String(sales.length)} icon={ShoppingCart} />
        <StatCard label="Expenses" value={money(exp)} icon={Receipt} tone="warning" />
        <StatCard label="Outstanding utang (all time)" value={money(totalOutstanding(d.debts, d.payments))} icon={Users} tone="danger" />
      </div>

      <Card className="flex gap-3 bg-secondary">
        <Info className="mt-0.5 size-5 shrink-0 text-primary" />
        <div className="text-sm">
          <p className="font-bold">Estimated cash difference: {money(round2(revenue - exp))}</p>
          <p className="text-muted-foreground">
            Calculated as <b>sales revenue − recorded expenses</b> for this period. This is <b>not true profit</b>: the app does not
            know each product's purchase cost, so it cannot compute cost of goods sold. Utang collections are not included in sales revenue.
          </p>
        </div>
      </Card>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <h2 className="mb-3 flex items-center gap-2 font-bold"><TrendingUp className="size-5" /> Best-selling products</h2>
          {best.length === 0 ? (
            <EmptyState icon={TrendingUp} title="No sales in this period" />
          ) : (
            <ol className="divide-y text-sm">
              {best.map((b, i) => (
                <li key={b.name + i} className="flex justify-between gap-2 py-2">
                  <span><b>{i + 1}.</b> {b.name}</span>
                  <span className="text-right"><b>{b.qty}</b> sold · {money(b.revenue)}</span>
                </li>
              ))}
            </ol>
          )}
        </Card>
        <Card>
          <h2 className="mb-3 flex items-center gap-2 font-bold"><AlertTriangle className="size-5" /> Low-stock products</h2>
          {low.length === 0 ? (
            <EmptyState icon={AlertTriangle} title="No low-stock products" />
          ) : (
            <ul className="divide-y text-sm">
              {low.map((p) => (
                <li key={p.id} className="flex items-center justify-between gap-2 py-2">
                  <span>{p.name}</span>
                  <span className="flex items-center gap-2"><b>{p.stock}</b><StatusBadge status={stockStatus(p.stock, th)} /></span>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>
    </div>
  );
}
