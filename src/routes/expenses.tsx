import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Pencil, Plus, Receipt, Search, Trash2, Wallet } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Card, ConfirmButton, EmptyState, StatCard, fmtDate, selectClass, useMoney } from "@/components/kit";
import { addExpense, deleteExpense, editExpense, useData, EXPENSE_CATEGORIES } from "@/lib/store";
import { dateKey, inRange, parseNum, sumExpenses, type Expense } from "@/lib/calc";

export const Route = createFileRoute("/expenses")({
  head: () => ({
    meta: [
      { title: "Expenses — Sari-Sari Manager" },
      { name: "description", content: "Record and review store expenses by category and date." },
      { property: "og:title", content: "Expenses — Sari-Sari Manager" },
      { property: "og:description", content: "Record and review store expenses." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Expenses,
});

function Expenses() {
  const d = useData()!;
  const money = useMoney();
  const [q, setQ] = useState("");
  const [cat, setCat] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [editing, setEditing] = useState<Expense | "new" | null>(null);

  const list = d.expenses
    .filter((e) => e.description.toLowerCase().includes(q.toLowerCase()))
    .filter((e) => !cat || e.category === cat)
    .filter((e) => inRange(e.date, from || undefined, to || undefined))
    .sort((a, b) => b.date.localeCompare(a.date));

  return (
    <div className="space-y-4">
      <Card className="flex flex-wrap items-end gap-2">
        <div className="min-w-44 flex-1 space-y-1">
          <Label htmlFor="eq">Search</Label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input id="eq" placeholder="Description…" className="pl-9" value={q} onChange={(e) => setQ(e.target.value)} />
          </div>
        </div>
        <div className="space-y-1">
          <Label htmlFor="ecat">Category</Label>
          <select id="ecat" className={selectClass + " w-48"} value={cat} onChange={(e) => setCat(e.target.value)}>
            <option value="">All categories</option>
            {EXPENSE_CATEGORIES.map((c) => <option key={c}>{c}</option>)}
          </select>
        </div>
        <div className="space-y-1">
          <Label htmlFor="efrom">From</Label>
          <Input id="efrom" type="date" value={from} onChange={(e) => setFrom(e.target.value)} />
        </div>
        <div className="space-y-1">
          <Label htmlFor="eto">To</Label>
          <Input id="eto" type="date" value={to} onChange={(e) => setTo(e.target.value)} />
        </div>
        <Button onClick={() => setEditing("new")}><Plus className="size-4" /> Add expense</Button>
      </Card>

      <StatCard label={`Total expenses (${list.length} records shown)`} value={money(sumExpenses(list))} icon={Wallet} tone="warning" />

      <Card className="p-0">
        {list.length === 0 ? (
          <div className="p-4"><EmptyState icon={Receipt} title="No expenses found" action={<Button onClick={() => setEditing("new")}>Add expense</Button>} /></div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted text-left text-xs uppercase text-muted-foreground">
                <tr>
                  <th className="p-3">Description</th>
                  <th className="hidden p-3 sm:table-cell">Category</th>
                  <th className="p-3">Date</th>
                  <th className="p-3 text-right">Amount</th>
                  <th className="p-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {list.map((e) => (
                  <tr key={e.id}>
                    <td className="p-3 font-semibold">{e.description}<span className="block text-xs font-normal text-muted-foreground sm:hidden">{e.category}</span></td>
                    <td className="hidden p-3 sm:table-cell">{e.category}</td>
                    <td className="p-3">{fmtDate(e.date)}</td>
                    <td className="p-3 text-right font-bold">{money(e.amount)}</td>
                    <td className="p-3">
                      <div className="flex justify-end gap-1">
                        <Button size="icon" variant="outline" aria-label={`Edit ${e.description}`} onClick={() => setEditing(e)}><Pencil className="size-4" /></Button>
                        <ConfirmButton size="icon" ariaLabel={`Delete ${e.description}`} title="Delete this expense?" description="This expense record will be permanently removed." onConfirm={() => { const r = deleteExpense(e.id); r.ok ? toast.success("Expense deleted.") : toast.error(r.error); }}>
                          <Trash2 className="size-4" />
                        </ConfirmButton>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
      {editing && <ExpenseForm expense={editing === "new" ? null : editing} onClose={() => setEditing(null)} />}
    </div>
  );
}

function ExpenseForm({ expense, onClose }: { expense: Expense | null; onClose: () => void }) {
  const [description, setDescription] = useState(expense?.description ?? "");
  const [amount, setAmount] = useState(expense ? String(expense.amount) : "");
  const [category, setCategory] = useState(expense?.category ?? EXPENSE_CATEGORIES[0]);
  const [date, setDate] = useState(expense?.date ?? dateKey(new Date()));
  const [error, setError] = useState("");
  function submit(e: React.FormEvent) {
    e.preventDefault();
    const input = { description, amount: parseNum(amount), category, date };
    const r = expense ? editExpense(expense.id, input) : addExpense(input);
    if (!r.ok) return setError(r.error);
    toast.success(expense ? "Expense updated." : "Expense added.");
    onClose();
  }
  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent>
        <DialogHeader><DialogTitle>{expense ? "Edit expense" : "Add expense"}</DialogTitle></DialogHeader>
        <form onSubmit={submit} className="space-y-3">
          <div className="space-y-1.5">
            <Label htmlFor="xdesc">Description</Label>
            <Input id="xdesc" value={description} onChange={(e) => setDescription(e.target.value)} maxLength={100} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="xcat">Category</Label>
            <select id="xcat" className={selectClass} value={category} onChange={(e) => setCategory(e.target.value)}>
              {EXPENSE_CATEGORIES.map((c) => <option key={c}>{c}</option>)}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="xamt">Amount (₱)</Label>
              <Input id="xamt" type="number" inputMode="decimal" min={0} step="0.01" value={amount} onChange={(e) => setAmount(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="xdate">Date</Label>
              <Input id="xdate" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
            </div>
          </div>
          {error && <p role="alert" className="rounded-md bg-danger-soft px-3 py-2 text-sm text-destructive">{error}</p>}
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
            <Button type="submit">Save expense</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
