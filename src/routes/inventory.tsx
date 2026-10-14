import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Boxes, Pencil, PackagePlus, Plus, Search, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Card, ConfirmButton, EmptyState, StatusBadge, selectClass, useMoney } from "@/components/kit";
import { addProduct, adjustStock, deleteProduct, editProduct, saveSettings, useData, PRODUCT_CATEGORIES } from "@/lib/store";
import { parseNum, stockStatus, type Product } from "@/lib/calc";

export const Route = createFileRoute("/inventory")({
  head: () => ({
    meta: [
      { title: "Inventory — Sari-Sari Manager" },
      { name: "description", content: "Manage products, prices and stock levels with low-stock alerts." },
      { property: "og:title", content: "Inventory — Sari-Sari Manager" },
      { property: "og:description", content: "Manage products, prices and stock levels." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Inventory,
});

function Inventory() {
  const d = useData()!;
  const money = useMoney();
  const [q, setQ] = useState("");
  const [cat, setCat] = useState("");
  const [status, setStatus] = useState("");
  const [editing, setEditing] = useState<Product | "new" | null>(null);
  const [restocking, setRestocking] = useState<Product | null>(null);
  const [thStr, setThStr] = useState(String(d.settings.lowStockThreshold));
  const th = d.settings.lowStockThreshold;

  const list = d.products
    .filter((p) => p.name.toLowerCase().includes(q.toLowerCase()))
    .filter((p) => !cat || p.category === cat)
    .filter((p) => !status || stockStatus(p.stock, th) === status)
    .sort((a, b) => a.name.localeCompare(b.name));

  function saveThreshold() {
    const r = saveSettings({ ...d.settings, lowStockThreshold: Math.floor(parseNum(thStr)) });
    r.ok ? toast.success("Low-stock threshold updated.") : toast.error(r.error);
  }

  return (
    <div className="space-y-4">
      <Card className="space-y-3">
        <div className="flex flex-wrap items-end gap-2">
          <div className="relative min-w-48 flex-1">
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input aria-label="Search by product name" placeholder="Search by product name…" className="pl-9" value={q} onChange={(e) => setQ(e.target.value)} />
          </div>
          <select aria-label="Filter by category" className={selectClass + " sm:w-48"} value={cat} onChange={(e) => setCat(e.target.value)}>
            <option value="">All categories</option>
            {PRODUCT_CATEGORIES.map((c) => (
              <option key={c}>{c}</option>
            ))}
          </select>
          <select aria-label="Filter by stock status" className={selectClass + " sm:w-40"} value={status} onChange={(e) => setStatus(e.target.value)}>
            <option value="">All statuses</option>
            <option>In Stock</option>
            <option>Low Stock</option>
            <option>Out of Stock</option>
          </select>
          <Button onClick={() => setEditing("new")}>
            <Plus className="size-4" /> Add product
          </Button>
        </div>
        <div className="flex flex-wrap items-end gap-2 text-sm">
          <div className="space-y-1">
            <Label htmlFor="th">Low-stock threshold</Label>
            <Input id="th" type="number" min={0} className="w-28" value={thStr} onChange={(e) => setThStr(e.target.value)} />
          </div>
          <Button variant="outline" onClick={saveThreshold}>
            Save threshold
          </Button>
          <p className="text-muted-foreground">Products with {th} or fewer units are marked Low Stock.</p>
        </div>
      </Card>

      <Card className="p-0">
        {list.length === 0 ? (
          <div className="p-4">
            <EmptyState icon={Boxes} title={d.products.length ? "No products match your filters" : "No products yet"} action={<Button onClick={() => setEditing("new")}>Add product</Button>} />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted text-left text-xs uppercase text-muted-foreground">
                <tr>
                  <th className="p-3">Product</th>
                  <th className="hidden p-3 md:table-cell">Category</th>
                  <th className="p-3 text-right">Price</th>
                  <th className="p-3 text-right">Stock</th>
                  <th className="p-3">Status</th>
                  <th className="p-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {list.map((p) => (
                  <tr key={p.id}>
                    <td className="p-3 font-semibold">
                      {p.name}
                      <span className="block text-xs font-normal text-muted-foreground md:hidden">{p.category}</span>
                    </td>
                    <td className="hidden p-3 md:table-cell">{p.category}</td>
                    <td className="p-3 text-right">{money(p.price)}</td>
                    <td className="p-3 text-right font-bold">{p.stock}</td>
                    <td className="p-3">
                      <StatusBadge status={stockStatus(p.stock, th)} />
                    </td>
                    <td className="p-3">
                      <div className="flex justify-end gap-1">
                        <Button size="icon" variant="outline" aria-label={`Update stock of ${p.name}`} onClick={() => setRestocking(p)}>
                          <PackagePlus className="size-4" />
                        </Button>
                        <Button size="icon" variant="outline" aria-label={`Edit ${p.name}`} onClick={() => setEditing(p)}>
                          <Pencil className="size-4" />
                        </Button>
                        <ConfirmButton
                          size="icon"
                          ariaLabel={`Delete ${p.name}`}
                          title={`Delete ${p.name}?`}
                          description="This product will be removed from inventory. Past sales records are kept."
                          onConfirm={() => {
                            const r = deleteProduct(p.id);
                            r.ok ? toast.success("Product deleted.") : toast.error(r.error);
                          }}
                        >
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

      {editing && <ProductForm product={editing === "new" ? null : editing} onClose={() => setEditing(null)} />}
      {restocking && <StockForm product={restocking} onClose={() => setRestocking(null)} />}
    </div>
  );
}

function ProductForm({ product, onClose }: { product: Product | null; onClose: () => void }) {
  const [name, setName] = useState(product?.name ?? "");
  const [category, setCategory] = useState(product?.category ?? PRODUCT_CATEGORIES[0]);
  const [price, setPrice] = useState(product ? String(product.price) : "");
  const [stock, setStock] = useState(product ? String(product.stock) : "");
  const [error, setError] = useState("");

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const input = { name, category, price: parseNum(price), stock: parseNum(stock) };
    const r = product ? editProduct(product.id, input) : addProduct(input);
    if (!r.ok) return setError(r.error);
    toast.success(product ? "Product updated." : "Product added.");
    onClose();
  }

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{product ? "Edit product" : "Add product"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={submit} className="space-y-3">
          <div className="space-y-1.5">
            <Label htmlFor="pname">Product name</Label>
            <Input id="pname" value={name} onChange={(e) => setName(e.target.value)} maxLength={100} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="pcat">Category</Label>
            <select id="pcat" className={selectClass} value={category} onChange={(e) => setCategory(e.target.value)}>
              {PRODUCT_CATEGORIES.map((c) => (
                <option key={c}>{c}</option>
              ))}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="pprice">Selling price (₱)</Label>
              <Input id="pprice" type="number" inputMode="decimal" min={0} step="0.01" value={price} onChange={(e) => setPrice(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="pstock">Stock quantity</Label>
              <Input id="pstock" type="number" inputMode="numeric" min={0} step={1} value={stock} onChange={(e) => setStock(e.target.value)} />
            </div>
          </div>
          {error && <p role="alert" className="rounded-md bg-danger-soft px-3 py-2 text-sm text-destructive">{error}</p>}
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
            <Button type="submit">Save product</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function StockForm({ product, onClose }: { product: Product; onClose: () => void }) {
  const [amount, setAmount] = useState("");
  const [mode, setMode] = useState<"add" | "remove">("add");
  const [error, setError] = useState("");

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const n = parseNum(amount);
    if (!Number.isInteger(n) || n <= 0) return setError("Enter a whole number greater than zero.");
    const r = adjustStock(product.id, mode === "add" ? n : -n);
    if (!r.ok) return setError(r.error);
    toast.success(`Stock updated for ${product.name}.`);
    onClose();
  }

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Update stock: {product.name}</DialogTitle>
        </DialogHeader>
        <form onSubmit={submit} className="space-y-3">
          <p className="text-sm">Current stock: <b>{product.stock}</b></p>
          <div className="grid grid-cols-2 gap-2">
            <Button type="button" variant={mode === "add" ? "default" : "outline"} onClick={() => setMode("add")}>Add (restock)</Button>
            <Button type="button" variant={mode === "remove" ? "default" : "outline"} onClick={() => setMode("remove")}>Remove (damaged/used)</Button>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="samt">Quantity</Label>
            <Input id="samt" type="number" min={1} step={1} value={amount} onChange={(e) => setAmount(e.target.value)} autoFocus />
          </div>
          {error && <p role="alert" className="rounded-md bg-danger-soft px-3 py-2 text-sm text-destructive">{error}</p>}
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
            <Button type="submit">Save stock</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
