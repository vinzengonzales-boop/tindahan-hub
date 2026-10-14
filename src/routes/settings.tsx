import { createFileRoute } from "@tanstack/react-router";
import { useRef, useState } from "react";
import { Download, KeyRound, ShieldAlert, Upload, WifiOff } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, ConfirmButton } from "@/components/kit";
import { getData, resetToSample, restoreBackup, saveSettings, setPasswordHash, useData, validateBackup } from "@/lib/store";
import { customerBalance, dateKey, debtBalance, debtStatus, parseNum, toCSV } from "@/lib/calc";
import { hashPassword, makeSalt, validateNewPassword } from "@/lib/auth";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

export const Route = createFileRoute("/settings")({
  head: () => ({
    meta: [
      { title: "Settings & Backup — Sari-Sari Manager" },
      { name: "description", content: "Store settings, password, CSV/JSON export and backup restore." },
      { property: "og:title", content: "Settings & Backup — Sari-Sari Manager" },
      { property: "og:description", content: "Store settings and data backup." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: SettingsPage,
});

function download(filename: string, content: string, type: string) {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

function SettingsPage() {
  const d = useData()!;
  const [storeName, setStoreName] = useState(d.settings.storeName);
  const [th, setTh] = useState(String(d.settings.lowStockThreshold));
  const [sym, setSym] = useState(d.settings.currencySymbol);
  const [pending, setPending] = useState<unknown>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const stamp = dateKey(new Date());

  function save(e: React.FormEvent) {
    e.preventDefault();
    const r = saveSettings({ storeName, lowStockThreshold: Math.floor(parseNum(th)), currencySymbol: sym });
    r.ok ? toast.success("Settings saved.") : toast.error(r.error);
  }

  function exportJSON() {
    const data = { ...getData(), settings: { ...getData().settings, passwordHash: undefined, passwordSalt: undefined } };
    download(`sari-sari-backup-${stamp}.json`, JSON.stringify(data, null, 2), "application/json");
    toast.success("Backup downloaded.");
  }

  function exportCSV(kind: "products" | "sales" | "utang" | "expenses") {
    const x = getData();
    let rows: (string | number)[][] = [];
    if (kind === "products") rows = [["Name", "Category", "Price", "Stock"], ...x.products.map((p) => [p.name, p.category, p.price.toFixed(2), p.stock])];
    if (kind === "sales")
      rows = [["Transaction ID", "Date/Time", "Items", "Total", "Cash Received", "Change", "Payment Method"], ...x.sales.map((s) => [s.id, new Date(s.date).toLocaleString("en-PH"), s.items.map((i) => `${i.name} x${i.qty}`).join("; "), s.total.toFixed(2), s.paid.toFixed(2), s.change.toFixed(2), s.method])];
    if (kind === "utang")
      rows = [
        ["Customer", "Date", "Description", "Original Amount", "Balance", "Status", "Customer Total Balance"],
        ...x.debts.map((db) => {
          const c = x.customers.find((c) => c.id === db.customerId);
          return [c?.name ?? "?", db.date, db.description, db.amount.toFixed(2), debtBalance(db, x.payments).toFixed(2), debtStatus(db, x.payments), customerBalance(db.customerId, x.debts, x.payments).toFixed(2)];
        }),
      ];
    if (kind === "expenses") rows = [["Date", "Description", "Category", "Amount"], ...x.expenses.map((e) => [e.date, e.description, e.category, e.amount.toFixed(2)])];
    download(`sari-sari-${kind}-${stamp}.csv`, toCSV(rows), "text/csv");
    toast.success(`${kind} CSV downloaded.`);
  }

  async function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    e.target.value = "";
    if (!f) return;
    try {
      const parsed = JSON.parse(await f.text());
      const err = validateBackup(parsed);
      if (err) return toast.error(err);
      setPending(parsed);
    } catch {
      toast.error("This file is not valid JSON.");
    }
  }

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <Card>
        <h2 className="mb-3 font-bold">Store settings</h2>
        <form onSubmit={save} className="space-y-3">
          <div className="space-y-1.5">
            <Label htmlFor="sname">Store name</Label>
            <Input id="sname" value={storeName} onChange={(e) => setStoreName(e.target.value)} maxLength={60} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="sth">Low-stock threshold</Label>
              <Input id="sth" type="number" min={0} value={th} onChange={(e) => setTh(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="ssym">Currency symbol</Label>
              <Input id="ssym" value={sym} onChange={(e) => setSym(e.target.value)} maxLength={4} />
            </div>
          </div>
          <p className="text-xs text-muted-foreground">Default currency: Philippine peso (₱). Amounts always show 2 decimal places.</p>
          <Button type="submit">Save settings</Button>
        </form>
      </Card>

      <ChangePassword />

      <Card className="space-y-3">
        <h2 className="font-bold">Backup & export</h2>
        <p className="text-sm text-muted-foreground">Download a full backup regularly (e.g. every day) and keep it in Google Drive, Messenger or a USB drive.</p>
        <Button onClick={exportJSON} className="w-full"><Download className="size-4" /> Download full backup (JSON)</Button>
        <div className="grid grid-cols-2 gap-2">
          <Button variant="outline" onClick={() => exportCSV("products")}>Products CSV</Button>
          <Button variant="outline" onClick={() => exportCSV("sales")}>Sales CSV</Button>
          <Button variant="outline" onClick={() => exportCSV("utang")}>Utang CSV</Button>
          <Button variant="outline" onClick={() => exportCSV("expenses")}>Expenses CSV</Button>
        </div>
        <div className="border-t pt-3">
          <input ref={fileRef} type="file" accept="application/json,.json" className="hidden" onChange={onFile} aria-label="Backup file" />
          <Button variant="outline" className="w-full" onClick={() => fileRef.current?.click()}><Upload className="size-4" /> Restore from backup file…</Button>
        </div>
        <ConfirmButton
          variant="outline"
          title="Reset to sample data?"
          description="ALL current products, sales, utang and expenses will be replaced with sample data. Download a backup first!"
          confirmLabel="Reset everything"
          onConfirm={() => { const r = resetToSample(); r.ok ? toast.success("Sample data restored.") : toast.error(r.error); }}
        >
          Reset to sample data
        </ConfirmButton>
      </Card>

      <Card className="space-y-3 text-sm">
        <h2 className="flex items-center gap-2 font-bold"><WifiOff className="size-5" /> Offline use & privacy</h2>
        <ul className="list-disc space-y-1 pl-5 text-muted-foreground">
          <li>All records are saved <b>only in this browser on this device</b>. They are not sent to the internet and do not sync to other phones.</li>
          <li>Once the app is open, sales, inventory, utang and expenses keep working even if the internet drops.</li>
          <li>Reopening the app with no internet at all may not load the page; keep the tab open or open it while online.</li>
          <li>Clearing browser data or uninstalling the browser deletes the records — download backups.</li>
        </ul>
        <p className="flex gap-2 rounded-md bg-warning-soft p-3 text-warning">
          <ShieldAlert className="size-5 shrink-0" />
          The password lock is a convenience lock, not full security. The password is stored as a salted hash, but the records themselves are not encrypted and someone with technical skills and access to this device could read them.
        </p>
      </Card>

      <AlertDialog open={!!pending} onOpenChange={(o) => !o && setPending(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Replace all current records?</AlertDialogTitle>
            <AlertDialogDescription>
              The backup is valid. Restoring will REPLACE all current products, sales, customers, utang and expenses with the backup's records. Your password stays the same.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => {
                const r = restoreBackup(pending);
                r.ok ? toast.success("Backup restored.") : toast.error(r.error);
                setPending(null);
              }}
            >
              Restore backup
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function ChangePassword() {
  const d = useData()!;
  const [cur, setCur] = useState("");
  const [pw, setPw] = useState("");
  const [pw2, setPw2] = useState("");
  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const h = await hashPassword(cur, d.settings.passwordSalt ?? "");
    if (h !== d.settings.passwordHash) return toast.error("Current password is wrong.");
    const err = validateNewPassword(pw, pw2);
    if (err) return toast.error(err);
    const salt = makeSalt();
    const r = setPasswordHash(await hashPassword(pw, salt), salt);
    if (!r.ok) return toast.error(r.error);
    toast.success("Password changed.");
    setCur(""); setPw(""); setPw2("");
  }
  return (
    <Card>
      <h2 className="mb-3 flex items-center gap-2 font-bold"><KeyRound className="size-5" /> Change owner password</h2>
      <form onSubmit={submit} className="space-y-3">
        <div className="space-y-1.5"><Label htmlFor="cpw">Current password</Label><Input id="cpw" type="password" autoComplete="current-password" value={cur} onChange={(e) => setCur(e.target.value)} /></div>
        <div className="space-y-1.5"><Label htmlFor="npw">New password</Label><Input id="npw" type="password" autoComplete="new-password" value={pw} onChange={(e) => setPw(e.target.value)} /></div>
        <div className="space-y-1.5"><Label htmlFor="npw2">Confirm new password</Label><Input id="npw2" type="password" autoComplete="new-password" value={pw2} onChange={(e) => setPw2(e.target.value)} /></div>
        <Button type="submit">Change password</Button>
      </form>
    </Card>
  );
}
