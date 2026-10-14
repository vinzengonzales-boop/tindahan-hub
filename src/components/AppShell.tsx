// Layout: login gate, desktop sidebar, mobile menu and page header.
import { useEffect, useState, type ReactNode } from "react";
import { Link, useLocation } from "@tanstack/react-router";
import {
  BarChart3,
  Boxes,
  History,
  LayoutDashboard,
  Lock,
  Menu,
  Receipt,
  Settings,
  ShoppingCart,
  Store,
  Users,
  WifiOff,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { setPasswordHash, useData } from "@/lib/store";
import { hashPassword, isUnlocked, makeSalt, setUnlocked, validateNewPassword } from "@/lib/auth";

export const NAV = [
  { to: "/", label: "Dashboard", icon: LayoutDashboard },
  { to: "/pos", label: "New Sale", icon: ShoppingCart },
  { to: "/inventory", label: "Inventory", icon: Boxes },
  { to: "/customers", label: "Customers & Utang", icon: Users },
  { to: "/sales", label: "Sales History", icon: History },
  { to: "/expenses", label: "Expenses", icon: Receipt },
  { to: "/reports", label: "Reports", icon: BarChart3 },
  { to: "/settings", label: "Settings & Backup", icon: Settings },
] as const;

export function AppShell({ children }: { children: ReactNode }) {
  const data = useData();
  const [unlocked, setU] = useState<boolean | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [online, setOnline] = useState(true);
  const { pathname } = useLocation();

  useEffect(() => {
    setU(isUnlocked());
    setOnline(navigator.onLine);
    const on = () => setOnline(true);
    const off = () => setOnline(false);
    window.addEventListener("online", on);
    window.addEventListener("offline", off);
    return () => {
      window.removeEventListener("online", on);
      window.removeEventListener("offline", off);
    };
  }, []);
  useEffect(() => setMenuOpen(false), [pathname]);

  if (!data || unlocked === null) {
    return <div className="flex min-h-screen items-center justify-center text-muted-foreground">Loading…</div>;
  }
  if (!unlocked) return <LoginScreen hasPassword={!!data.settings.passwordHash} onUnlock={() => setU(true)} />;

  const current = NAV.find((n) => n.to === pathname)?.label ?? "Tindahan Hub";

  const navList = (
    <nav aria-label="Main" className="flex flex-col gap-1">
      {NAV.map((n) => (
        <Link
          key={n.to}
          to={n.to}
          className={cn(
            "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-semibold text-sidebar-foreground/85 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
          )}
          activeProps={{ className: "bg-sidebar-accent text-sidebar-accent-foreground" }}
          activeOptions={{ exact: true }}
        >
          <n.icon className="size-5" aria-hidden />
          {n.label}
        </Link>
      ))}
      <button
        type="button"
        onClick={() => {
          setUnlocked(false);
          setU(false);
        }}
        className="mt-4 flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-semibold text-sidebar-foreground/85 hover:bg-sidebar-accent"
      >
        <Lock className="size-5" aria-hidden /> Lock app
      </button>
    </nav>
  );

  const brand = (
    <div className="flex items-center gap-2 px-2 py-1 text-sidebar-foreground">
      <Store className="size-6" aria-hidden />
      <div className="leading-tight">
        <p className="font-extrabold">Tindahan Hub</p>
        <p className="text-xs opacity-75">Store Management System</p>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen lg:flex">
      <aside className="no-print sticky top-0 hidden h-screen w-64 shrink-0 flex-col gap-6 bg-sidebar p-4 lg:flex">
        {brand}
        {navList}
      </aside>

      {menuOpen && (
        <div className="no-print fixed inset-0 z-40 lg:hidden">
          <button aria-label="Close menu" className="absolute inset-0 bg-foreground/40" onClick={() => setMenuOpen(false)} />
          <aside className="relative flex h-full w-72 flex-col gap-6 overflow-y-auto bg-sidebar p-4">
            <div className="flex items-center justify-between">
              {brand}
              <button aria-label="Close menu" onClick={() => setMenuOpen(false)} className="text-sidebar-foreground">
                <X className="size-6" />
              </button>
            </div>
            {navList}
          </aside>
        </div>
      )}

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="no-print sticky top-0 z-30 flex items-center gap-3 border-b bg-card px-4 py-3">
          <button className="lg:hidden" aria-label="Open menu" onClick={() => setMenuOpen(true)}>
            <Menu className="size-6" />
          </button>
          <div className="min-w-0">
            <p className="text-xs font-semibold text-primary lg:hidden">Tindahan Hub</p>
            <h1 className="truncate text-lg font-bold">{current}</h1>
          </div>
          {!online && (
            <span className="ml-auto inline-flex items-center gap-1 rounded-full bg-warning-soft px-2.5 py-1 text-xs font-semibold text-warning">
              <WifiOff className="size-3.5" /> Offline – saving on this device
            </span>
          )}
        </header>
        <main className="mx-auto w-full max-w-6xl flex-1 p-4 pb-24 lg:p-6">{children}</main>
      </div>

      {/* Quick bottom bar on phones */}
      <nav aria-label="Quick" className="no-print fixed inset-x-0 bottom-0 z-30 grid grid-cols-4 border-t bg-card lg:hidden">
        {NAV.slice(0, 4).map((n) => (
          <Link
            key={n.to}
            to={n.to}
            className="flex flex-col items-center gap-0.5 py-2 text-xs font-semibold text-muted-foreground"
            activeProps={{ className: "text-primary" }}
            activeOptions={{ exact: true }}
          >
            <n.icon className="size-5" aria-hidden />
            {n.label.split(" ")[0]}
          </Link>
        ))}
      </nav>
    </div>
  );
}

function LoginScreen({ hasPassword, onUnlock }: { hasPassword: boolean; onUnlock: () => void }) {
  const data = useData()!;
  const [pw, setPw] = useState("");
  const [pw2, setPw2] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (busy) return;
    setError("");
    setBusy(true);
    try {
      if (!hasPassword) {
        const err = validateNewPassword(pw, pw2);
        if (err) return setError(err);
        const salt = makeSalt();
        const r = setPasswordHash(await hashPassword(pw, salt), salt);
        if (!r.ok) return setError(r.error);
        toast.success("Owner password created.");
      } else {
        const h = await hashPassword(pw, data.settings.passwordSalt ?? "");
        if (h !== data.settings.passwordHash) return setError("Wrong password. Please try again.");
      }
      setUnlocked(true);
      onUnlock();
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <form onSubmit={submit} className="w-full max-w-sm space-y-4 rounded-2xl border bg-card p-6 shadow-sm">
        <div className="flex flex-col items-center gap-2 text-center">
          <div className="flex size-14 items-center justify-center rounded-2xl bg-primary text-primary-foreground">
            <Store className="size-7" />
          </div>
          <h1 className="text-2xl font-extrabold">Tindahan Hub</h1>
          <p className="text-sm text-muted-foreground">
            {hasPassword ? "Enter the owner password to continue." : "First time? Create an owner password to protect this app."}
          </p>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="pw">{hasPassword ? "Password" : "New password"}</Label>
          <Input id="pw" type="password" autoComplete={hasPassword ? "current-password" : "new-password"} value={pw} onChange={(e) => setPw(e.target.value)} required />
        </div>
        {!hasPassword && (
          <div className="space-y-1.5">
            <Label htmlFor="pw2">Confirm password</Label>
            <Input id="pw2" type="password" autoComplete="new-password" value={pw2} onChange={(e) => setPw2(e.target.value)} required />
          </div>
        )}
        {error && (
          <p role="alert" className="rounded-md bg-danger-soft px-3 py-2 text-sm text-destructive">
            {error}
          </p>
        )}
        <Button type="submit" className="h-11 w-full" disabled={busy}>
          {hasPassword ? "Unlock" : "Create password"}
        </Button>
        <p className="text-xs text-muted-foreground">
          Note: this lock keeps casual users out of this browser. Records are stored on this device and are not encrypted.
        </p>
      </form>
    </div>
  );
}
