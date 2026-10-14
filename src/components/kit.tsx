// Small reusable UI pieces used across pages.
import type { ReactNode } from "react";
import { useState } from "react";
import type { LucideIcon } from "lucide-react";
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
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Printer } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatMoney, lineSubtotal, type Sale } from "@/lib/calc";
import { useData } from "@/lib/store";

export function useMoney() {
  const d = useData();
  const sym = d?.settings.currencySymbol ?? "₱";
  return (n: number) => formatMoney(n, sym);
}

export function Card({ className, children }: { className?: string; children: ReactNode }) {
  return <section className={cn("rounded-xl border bg-card p-4 shadow-sm", className)}>{children}</section>;
}

export function StatCard({ label, value, icon: Icon, tone = "default" }: { label: string; value: string; icon: LucideIcon; tone?: "default" | "warning" | "danger" }) {
  return (
    <Card className="flex items-center gap-3">
      <div
        className={cn(
          "flex size-11 shrink-0 items-center justify-center rounded-lg",
          tone === "default" && "bg-success-soft text-success",
          tone === "warning" && "bg-warning-soft text-warning",
          tone === "danger" && "bg-danger-soft text-destructive",
        )}
      >
        <Icon className="size-5" aria-hidden />
      </div>
      <div className="min-w-0">
        <p className="text-sm text-muted-foreground">{label}</p>
        <p className="truncate text-xl font-bold">{value}</p>
      </div>
    </Card>
  );
}

const STATUS_TONE: Record<string, string> = {
  "In Stock": "bg-success-soft text-success",
  Paid: "bg-success-soft text-success",
  "Low Stock": "bg-warning-soft text-warning",
  "Partially Paid": "bg-warning-soft text-warning",
  "Out of Stock": "bg-danger-soft text-destructive",
  Unpaid: "bg-danger-soft text-destructive",
};

export function StatusBadge({ status }: { status: string }) {
  return (
    <span className={cn("inline-flex whitespace-nowrap rounded-full px-2.5 py-0.5 text-xs font-semibold", STATUS_TONE[status] ?? "bg-muted text-muted-foreground")}>
      {status}
    </span>
  );
}

export function EmptyState({ icon: Icon, title, text, action }: { icon: LucideIcon; title: string; text?: string; action?: ReactNode }) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 rounded-lg border border-dashed bg-muted/40 px-4 py-10 text-center">
      <Icon className="size-8 text-muted-foreground" aria-hidden />
      <p className="font-semibold">{title}</p>
      {text && <p className="max-w-sm text-sm text-muted-foreground">{text}</p>}
      {action}
    </div>
  );
}

/** A button that asks "Are you sure?" before running onConfirm. */
export function ConfirmButton({
  title,
  description,
  confirmLabel = "Delete",
  onConfirm,
  children,
  variant = "destructive",
  size = "sm",
  ariaLabel,
}: {
  title: string;
  description: string;
  confirmLabel?: string;
  onConfirm: () => void;
  children: ReactNode;
  variant?: "destructive" | "outline" | "ghost";
  size?: "sm" | "default" | "icon";
  ariaLabel?: string;
}) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button type="button" variant={variant} size={size} onClick={() => setOpen(true)} aria-label={ariaLabel}>
        {children}
      </Button>
      <AlertDialog open={open} onOpenChange={setOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{title}</AlertDialogTitle>
            <AlertDialogDescription>{description}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => {
                onConfirm();
                setOpen(false);
              }}
            >
              {confirmLabel}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

export function fmtDateTime(iso: string) {
  return new Date(iso).toLocaleString("en-PH", { dateStyle: "medium", timeStyle: "short" });
}
export function fmtDate(key: string) {
  const [y, m, d] = key.split("-").map(Number);
  return new Date(y, m - 1, d).toLocaleDateString("en-PH", { dateStyle: "medium" });
}

/** Receipt dialog with a Print button. */
export function ReceiptDialog({ sale, onClose }: { sale: Sale | null; onClose: () => void }) {
  const money = useMoney();
  const data = useData();
  return (
    <Dialog open={!!sale} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="print-area max-w-sm">
        <DialogHeader>
          <DialogTitle className="text-center">{data?.settings.storeName ?? "Sari-Sari Manager"}</DialogTitle>
        </DialogHeader>
        {sale && (
          <div className="space-y-3 font-mono text-sm">
            <div className="text-center text-xs text-muted-foreground">
              <p>Official Sales Receipt (unofficial / for records)</p>
              <p>{sale.id}</p>
              <p>{fmtDateTime(sale.date)}</p>
            </div>
            <div className="border-y border-dashed py-2">
              {sale.items.map((i) => (
                <div key={i.productId} className="flex justify-between gap-2">
                  <span className="min-w-0">
                    {i.name}
                    <br />
                    <span className="text-muted-foreground">
                      {i.qty} × {money(i.price)}
                    </span>
                  </span>
                  <span>{money(lineSubtotal(i))}</span>
                </div>
              ))}
            </div>
            <div className="space-y-1">
              <Row l="TOTAL" r={money(sale.total)} bold />
              <Row l={`Cash received`} r={money(sale.paid)} />
              <Row l="Change" r={money(sale.change)} />
              <Row l="Payment method" r={sale.method} />
            </div>
            <p className="text-center text-xs text-muted-foreground">Salamat po! Come again.</p>
          </div>
        )}
        <div className="no-print flex gap-2">
          <Button className="flex-1" onClick={() => window.print()}>
            <Printer className="size-4" /> Print receipt
          </Button>
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function Row({ l, r, bold }: { l: string; r: string; bold?: boolean }) {
  return (
    <div className={cn("flex justify-between", bold && "text-base font-bold")}>
      <span>{l}</span>
      <span>{r}</span>
    </div>
  );
}

export const selectClass =
  "h-10 w-full rounded-md border border-input bg-card px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";
