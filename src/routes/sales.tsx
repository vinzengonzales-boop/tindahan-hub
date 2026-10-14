import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { History, Receipt, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, EmptyState, ReceiptDialog, StatCard, fmtDateTime, useMoney } from "@/components/kit";
import { useData } from "@/lib/store";
import { dateKey, inRange, sumSales, type Sale } from "@/lib/calc";
import { ShoppingCart, Wallet } from "lucide-react";

export const Route = createFileRoute("/sales")({
  head: () => ({
    meta: [
      { title: "Sales History — Sari-Sari Manager" },
      { name: "description", content: "Search past transactions, filter by date and reprint receipts." },
      { property: "og:title", content: "Sales History — Sari-Sari Manager" },
      { property: "og:description", content: "Search past transactions and reprint receipts." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: SalesHistory,
});

function SalesHistory() {
  const d = useData()!;
  const money = useMoney();
  const [q, setQ] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [view, setView] = useState<Sale | null>(null);

  const list = d.sales
    .filter((s) => s.id.toLowerCase().includes(q.trim().toLowerCase()))
    .filter((s) => inRange(dateKey(s.date), from || undefined, to || undefined))
    .slice()
    .reverse();

  return (
    <div className="space-y-4">
      <Card className="flex flex-wrap items-end gap-2">
        <div className="min-w-48 flex-1 space-y-1">
          <Label htmlFor="sq">Transaction ID</Label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input id="sq" placeholder="e.g. TXN-20261014-0001" className="pl-9" value={q} onChange={(e) => setQ(e.target.value)} />
          </div>
        </div>
        <div className="space-y-1">
          <Label htmlFor="sfrom">From</Label>
          <Input id="sfrom" type="date" value={from} onChange={(e) => setFrom(e.target.value)} />
        </div>
        <div className="space-y-1">
          <Label htmlFor="sto">To</Label>
          <Input id="sto" type="date" value={to} onChange={(e) => setTo(e.target.value)} />
        </div>
        <Button variant="outline" onClick={() => { const t = dateKey(new Date()); setFrom(t); setTo(t); }}>Today</Button>
        <Button variant="ghost" onClick={() => { setQ(""); setFrom(""); setTo(""); }}>Clear</Button>
      </Card>

      <div className="grid gap-3 sm:grid-cols-2">
        <StatCard label="Total sales (filtered)" value={money(sumSales(list))} icon={Wallet} />
        <StatCard label="Completed transactions" value={String(list.length)} icon={ShoppingCart} />
      </div>

      <Card className="p-0">
        {list.length === 0 ? (
          <div className="p-4"><EmptyState icon={History} title="No transactions found" text="Completed sales from the New Sale page appear here." /></div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted text-left text-xs uppercase text-muted-foreground">
                <tr>
                  <th className="p-3">Transaction</th>
                  <th className="hidden p-3 md:table-cell">Items</th>
                  <th className="p-3 text-right">Total</th>
                  <th className="hidden p-3 sm:table-cell">Payment</th>
                  <th className="p-3 text-right">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {list.map((s) => (
                  <tr key={s.id}>
                    <td className="p-3">
                      <span className="font-semibold">{s.id}</span>
                      <span className="block text-xs text-muted-foreground">{fmtDateTime(s.date)}</span>
                    </td>
                    <td className="hidden p-3 md:table-cell">{s.items.map((i) => `${i.name} ×${i.qty}`).join(", ")}</td>
                    <td className="p-3 text-right font-bold">{money(s.total)}</td>
                    <td className="hidden p-3 sm:table-cell">{s.method}</td>
                    <td className="p-3 text-right">
                      <Button size="sm" variant="outline" onClick={() => setView(s)}><Receipt className="size-4" /> Receipt</Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
      <ReceiptDialog sale={view} onClose={() => setView(null)} />
    </div>
  );
}
