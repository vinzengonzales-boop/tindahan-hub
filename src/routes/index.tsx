import { createFileRoute, Link } from "@tanstack/react-router";
import { AlertTriangle, Boxes, History, PackageX, ShoppingCart, Users, Wallet } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, EmptyState, StatCard, StatusBadge, fmtDateTime, useMoney } from "@/components/kit";
import { useData } from "@/lib/store";
import { dateKey, stockStatus, sumSales, totalOutstanding } from "@/lib/calc";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Dashboard — Tindahan Hub" },
      { name: "description", content: "Daily sales, stock alerts and utang summary for your sari-sari store." },
      { property: "og:title", content: "Dashboard — Tindahan Hub" },
      { property: "og:description", content: "Daily sales, stock alerts and utang summary for your sari-sari store." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Dashboard,
});

function Dashboard() {
  const d = useData()!;
  const money = useMoney();
  const today = dateKey(new Date());
  const todaySales = d.sales.filter((s) => dateKey(s.date) === today);
  const th = d.settings.lowStockThreshold;
  const restock = d.products.filter((p) => stockStatus(p.stock, th) !== "In Stock").sort((a, b) => a.stock - b.stock);
  const recent = [...d.sales].reverse().slice(0, 5);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label={`Today's sales (${todaySales.length})`} value={money(sumSales(todaySales))} icon={Wallet} />
        <StatCard label="Total products" value={String(d.products.length)} icon={Boxes} />
        <StatCard label="Low / out of stock" value={String(restock.length)} icon={AlertTriangle} tone="warning" />
        <StatCard label="Outstanding utang" value={money(totalOutstanding(d.debts, d.payments))} icon={Users} tone="danger" />
      </div>

      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        <QuickLink to="/pos" icon={ShoppingCart} label="New Sale" primary />
        <QuickLink to="/inventory" icon={Boxes} label="Manage Inventory" />
        <QuickLink to="/customers" icon={Users} label="Record Utang" />
        <QuickLink to="/sales" icon={History} label="Sales History" />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <h2 className="mb-3 font-bold">Recent sales</h2>
          {recent.length === 0 ? (
            <EmptyState icon={ShoppingCart} title="No sales yet" text="Completed sales will appear here." />
          ) : (
            <ul className="divide-y">
              {recent.map((s) => (
                <li key={s.id} className="flex items-center justify-between gap-2 py-2 text-sm">
                  <div className="min-w-0">
                    <p className="font-semibold">{s.id}</p>
                    <p className="truncate text-muted-foreground">
                      {fmtDateTime(s.date)} · {s.items.reduce((n, i) => n + i.qty, 0)} items
                    </p>
                  </div>
                  <span className="font-bold">{money(s.total)}</span>
                </li>
              ))}
            </ul>
          )}
        </Card>
        <Card>
          <h2 className="mb-3 font-bold">Needs restocking (≤ {th} left)</h2>
          {restock.length === 0 ? (
            <EmptyState icon={PackageX} title="All products are well stocked" />
          ) : (
            <ul className="divide-y">
              {restock.slice(0, 8).map((p) => (
                <li key={p.id} className="flex items-center justify-between gap-2 py-2 text-sm">
                  <span className="min-w-0 truncate">{p.name}</span>
                  <span className="flex items-center gap-2">
                    <span className="font-semibold">{p.stock}</span>
                    <StatusBadge status={stockStatus(p.stock, th)} />
                  </span>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>
    </div>
  );
}

function QuickLink({ to, icon: Icon, label, primary }: { to: "/pos" | "/inventory" | "/customers" | "/sales"; icon: typeof Boxes; label: string; primary?: boolean }) {
  return (
    <Button asChild variant={primary ? "default" : "outline"} className="h-14 justify-start gap-2 text-sm font-bold">
      <Link to={to}>
        <Icon className="size-5" /> {label}
      </Link>
    </Button>
  );
}
