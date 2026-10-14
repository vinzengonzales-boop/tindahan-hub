import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { HandCoins, Pencil, Plus, Search, Trash2, UserPlus, Users } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Card, ConfirmButton, EmptyState, StatusBadge, fmtDate, useMoney } from "@/components/kit";
import { addCustomer, addDebt, addPayment, deleteCustomer, deleteDebt, renameCustomer, useData } from "@/lib/store";
import { customerBalance, dateKey, debtBalance, debtStatus, paidForDebt, parseNum, totalOutstanding, type Debt } from "@/lib/calc";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/customers")({
  head: () => ({
    meta: [
      { title: "Customers & Utang — Sari-Sari Manager" },
      { name: "description", content: "Track customer utang, partial payments and remaining balances." },
      { property: "og:title", content: "Customers & Utang — Sari-Sari Manager" },
      { property: "og:description", content: "Track customer utang and payments." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Customers,
});

function Customers() {
  const d = useData()!;
  const money = useMoney();
  const [q, setQ] = useState("");
  const [selected, setSelected] = useState<string | null>(null);
  const [newName, setNewName] = useState("");
  const [debtFor, setDebtFor] = useState<string | null>(null);
  const [payFor, setPayFor] = useState<Debt | null>(null);
  const [renaming, setRenaming] = useState(false);

  const list = d.customers
    .filter((c) => c.name.toLowerCase().includes(q.toLowerCase()))
    .map((c) => ({ ...c, balance: customerBalance(c.id, d.debts, d.payments) }))
    .sort((a, b) => b.balance - a.balance || a.name.localeCompare(b.name));
  const cust = d.customers.find((c) => c.id === selected) ?? null;

  function add(e: React.FormEvent) {
    e.preventDefault();
    const r = addCustomer(newName);
    if (!r.ok) return toast.error(r.error);
    toast.success("Customer added.");
    setNewName("");
    setSelected(r.id ?? null);
  }

  return (
    <div className="grid gap-4 lg:grid-cols-[340px_1fr]">
      <Card className="h-fit space-y-3">
        <p className="text-sm text-muted-foreground">
          Total outstanding: <b className="text-foreground">{money(totalOutstanding(d.debts, d.payments))}</b>
        </p>
        <form onSubmit={add} className="flex gap-2">
          <Input aria-label="New customer name" placeholder="Name or nickname" value={newName} onChange={(e) => setNewName(e.target.value)} maxLength={60} />
          <Button type="submit" aria-label="Add customer"><UserPlus className="size-4" /></Button>
        </form>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input aria-label="Search customers" placeholder="Search customers…" className="pl-9" value={q} onChange={(e) => setQ(e.target.value)} />
        </div>
        {list.length === 0 ? (
          <EmptyState icon={Users} title="No customers found" />
        ) : (
          <ul className="divide-y rounded-lg border">
            {list.map((c) => (
              <li key={c.id}>
                <button
                  type="button"
                  onClick={() => setSelected(c.id)}
                  className={cn("flex w-full items-center justify-between gap-2 px-3 py-2.5 text-left text-sm hover:bg-accent", selected === c.id && "bg-accent")}
                >
                  <span className="font-semibold">{c.name}</span>
                  <span className={cn("font-bold", c.balance > 0 ? "text-destructive" : "text-success")}>{money(c.balance)}</span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </Card>

      {!cust ? (
        <Card>
          <EmptyState icon={Users} title="Select a customer" text="Choose a customer to see their utang, payments and history, or add a new one." />
        </Card>
      ) : (
        <CustomerDetail
          key={cust.id}
          customerId={cust.id}
          onAddDebt={() => setDebtFor(cust.id)}
          onPay={setPayFor}
          onRename={() => setRenaming(true)}
          onDeleted={() => setSelected(null)}
        />
      )}

      {debtFor && <DebtForm customerId={debtFor} onClose={() => setDebtFor(null)} />}
      {payFor && <PaymentForm debt={payFor} onClose={() => setPayFor(null)} />}
      {renaming && cust && <RenameForm id={cust.id} name={cust.name} onClose={() => setRenaming(false)} />}
    </div>
  );
}

function CustomerDetail({ customerId, onAddDebt, onPay, onRename, onDeleted }: { customerId: string; onAddDebt: () => void; onPay: (d: Debt) => void; onRename: () => void; onDeleted: () => void }) {
  const d = useData()!;
  const money = useMoney();
  const cust = d.customers.find((c) => c.id === customerId)!;
  const debts = d.debts.filter((x) => x.customerId === customerId).sort((a, b) => b.date.localeCompare(a.date));
  const payments = d.payments.filter((p) => p.customerId === customerId);
  const balance = customerBalance(customerId, d.debts, d.payments);
  const history = [
    ...debts.map((x) => ({ id: x.id, date: x.date, type: "Utang" as const, text: x.description, amount: x.amount })),
    ...payments.map((p) => ({ id: p.id, date: p.date, type: "Payment" as const, text: "Payment received", amount: p.amount })),
  ].sort((a, b) => b.date.localeCompare(a.date));

  return (
    <div className="space-y-4">
      <Card className="flex flex-wrap items-center gap-3">
        <div className="min-w-0 flex-1">
          <h2 className="text-xl font-extrabold">{cust.name}</h2>
          <p className="text-sm text-muted-foreground">
            Remaining balance: <b className={balance > 0 ? "text-destructive" : "text-success"}>{money(balance)}</b>
          </p>
        </div>
        <Button onClick={onAddDebt}><Plus className="size-4" /> Record utang</Button>
        <Button variant="outline" size="icon" aria-label="Rename customer" onClick={onRename}><Pencil className="size-4" /></Button>
        <ConfirmButton
          size="icon"
          ariaLabel="Delete customer"
          title={`Delete ${cust.name}?`}
          description="This permanently deletes the customer and ALL their utang and payment records."
          onConfirm={() => {
            const r = deleteCustomer(customerId);
            if (r.ok) {
              toast.success("Customer deleted.");
              onDeleted();
            } else toast.error(r.error);
          }}
        >
          <Trash2 className="size-4" />
        </ConfirmButton>
      </Card>

      <Card>
        <h3 className="mb-3 font-bold">Utang records</h3>
        {debts.length === 0 ? (
          <EmptyState icon={HandCoins} title="No utang recorded" />
        ) : (
          <ul className="space-y-2">
            {debts.map((x) => {
              const bal = debtBalance(x, d.payments);
              const st = debtStatus(x, d.payments);
              return (
                <li key={x.id} className="flex flex-wrap items-center gap-2 rounded-lg border p-3 text-sm">
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold">{x.description}</p>
                    <p className="text-muted-foreground">
                      {fmtDate(x.date)} · Original {money(x.amount)} · Paid {money(paidForDebt(x.id, d.payments))}
                    </p>
                    <p>Balance: <b>{money(bal)}</b></p>
                  </div>
                  <StatusBadge status={st} />
                  {bal > 0 && <Button size="sm" onClick={() => onPay(x)}>Record payment</Button>}
                  <ConfirmButton
                    size="icon"
                    variant="ghost"
                    ariaLabel="Delete utang record"
                    title="Delete this utang record?"
                    description="The utang and its payment history will be permanently removed."
                    onConfirm={() => {
                      const r = deleteDebt(x.id);
                      r.ok ? toast.success("Utang record deleted.") : toast.error(r.error);
                    }}
                  >
                    <Trash2 className="size-4 text-destructive" />
                  </ConfirmButton>
                </li>
              );
            })}
          </ul>
        )}
      </Card>

      <Card>
        <h3 className="mb-3 font-bold">Transaction history</h3>
        {history.length === 0 ? (
          <p className="text-sm text-muted-foreground">No history yet.</p>
        ) : (
          <ul className="divide-y text-sm">
            {history.map((h) => (
              <li key={h.id} className="flex justify-between gap-2 py-2">
                <span>
                  <span className="font-semibold">{h.type}</span> · {h.text}
                  <span className="block text-xs text-muted-foreground">{fmtDate(h.date)}</span>
                </span>
                <span className={cn("font-bold", h.type === "Payment" ? "text-success" : "text-destructive")}>
                  {h.type === "Payment" ? "−" : "+"}
                  {money(h.amount)}
                </span>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}

function ErrorText({ error }: { error: string }) {
  return error ? <p role="alert" className="rounded-md bg-danger-soft px-3 py-2 text-sm text-destructive">{error}</p> : null;
}

function DebtForm({ customerId, onClose }: { customerId: string; onClose: () => void }) {
  const [date, setDate] = useState(dateKey(new Date()));
  const [desc, setDesc] = useState("");
  const [amount, setAmount] = useState("");
  const [error, setError] = useState("");
  function submit(e: React.FormEvent) {
    e.preventDefault();
    const r = addDebt(customerId, date, desc, parseNum(amount));
    if (!r.ok) return setError(r.error);
    toast.success("Utang recorded.");
    onClose();
  }
  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent>
        <DialogHeader><DialogTitle>Record new utang</DialogTitle></DialogHeader>
        <form onSubmit={submit} className="space-y-3">
          <div className="space-y-1.5">
            <Label htmlFor="ddesc">Description (items taken)</Label>
            <Input id="ddesc" value={desc} onChange={(e) => setDesc(e.target.value)} placeholder="e.g. 2 sardines, 1 rice" maxLength={120} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="ddate">Date</Label>
              <Input id="ddate" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="damt">Amount (₱)</Label>
              <Input id="damt" type="number" inputMode="decimal" min={0} step="0.01" value={amount} onChange={(e) => setAmount(e.target.value)} />
            </div>
          </div>
          <ErrorText error={error} />
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
            <Button type="submit">Save utang</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function PaymentForm({ debt, onClose }: { debt: Debt; onClose: () => void }) {
  const d = useData()!;
  const money = useMoney();
  const bal = debtBalance(debt, d.payments);
  const [date, setDate] = useState(dateKey(new Date()));
  const [amount, setAmount] = useState("");
  const [error, setError] = useState("");
  function submit(e: React.FormEvent) {
    e.preventDefault();
    const r = addPayment(debt.id, date, parseNum(amount));
    if (!r.ok) return setError(r.error);
    toast.success("Payment recorded.");
    onClose();
  }
  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent>
        <DialogHeader><DialogTitle>Record payment</DialogTitle></DialogHeader>
        <form onSubmit={submit} className="space-y-3">
          <p className="text-sm">{debt.description} — remaining balance <b>{money(bal)}</b></p>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="pdate">Date</Label>
              <Input id="pdate" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="pamt">Amount paid (₱)</Label>
              <Input id="pamt" type="number" inputMode="decimal" min={0} max={bal} step="0.01" value={amount} onChange={(e) => setAmount(e.target.value)} />
            </div>
          </div>
          <Button type="button" variant="outline" size="sm" onClick={() => setAmount(String(bal))}>Pay full balance</Button>
          <ErrorText error={error} />
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
            <Button type="submit">Save payment</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function RenameForm({ id, name, onClose }: { id: string; name: string; onClose: () => void }) {
  const [v, setV] = useState(name);
  const [error, setError] = useState("");
  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent>
        <DialogHeader><DialogTitle>Rename customer</DialogTitle></DialogHeader>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            const r = renameCustomer(id, v);
            if (!r.ok) return setError(r.error);
            toast.success("Customer renamed.");
            onClose();
          }}
          className="space-y-3"
        >
          <Label htmlFor="rname">Name or nickname</Label>
          <Input id="rname" value={v} onChange={(e) => setV(e.target.value)} maxLength={60} />
          <ErrorText error={error} />
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
            <Button type="submit">Save</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
