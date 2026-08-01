"use client";

import { useState, useTransition } from "react";
import { Plus, X } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import type { SkincareProduct, SkincareStepType } from "@/lib/types";
import { daysUntil } from "@/lib/scores";
import { addSkincareProduct, removeSkincareProduct } from "@/app/(app)/health/actions";

const PRODUCT_TYPES: SkincareStepType[] = [
  "cleanser",
  "toner",
  "serum",
  "moisturizer",
  "sunscreen",
  "retinol",
  "exfoliant",
  "mask",
  "other",
];

export function ProductDatabase({ products }: { products: SkincareProduct[] }) {
  const [, startTransition] = useTransition();
  const [adding, setAdding] = useState(false);
  const [draft, setDraft] = useState({ name: "", brand: "", productType: "other" as SkincareStepType, expiryDate: "" });

  return (
    <Card>
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-h3">Product shelf</h3>
        <button aria-label="Add product" onClick={() => setAdding((v) => !v)}>
          <Plus size={16} />
        </button>
      </div>

      {adding && (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (!draft.name.trim()) return;
            startTransition(() =>
              addSkincareProduct({
                name: draft.name,
                brand: draft.brand,
                productType: draft.productType,
                expiryDate: draft.expiryDate || null,
              })
            );
            setDraft({ name: "", brand: "", productType: "other", expiryDate: "" });
            setAdding(false);
          }}
          className="flex flex-wrap items-end gap-2 mb-4 p-3 rounded-lg bg-bg"
        >
          <Input placeholder="Product name" value={draft.name} onChange={(e) => setDraft((d) => ({ ...d, name: e.target.value }))} autoFocus />
          <Input placeholder="Brand" value={draft.brand} onChange={(e) => setDraft((d) => ({ ...d, brand: e.target.value }))} />
          <select
            value={draft.productType}
            onChange={(e) => setDraft((d) => ({ ...d, productType: e.target.value as SkincareStepType }))}
            className="text-small px-2 py-2 rounded-md border border-alabaster bg-linen dark:bg-bg-secondary"
          >
            {PRODUCT_TYPES.map((t) => (
              <option key={t} value={t} className="capitalize">
                {t}
              </option>
            ))}
          </select>
          <div>
            <label className="text-label text-graphite mb-1 block">Expiry</label>
            <input
              type="date"
              value={draft.expiryDate}
              onChange={(e) => setDraft((d) => ({ ...d, expiryDate: e.target.value }))}
              className="text-small px-2 py-2 rounded-md border border-alabaster bg-linen dark:bg-bg-secondary"
            />
          </div>
          <Button type="submit">Add</Button>
        </form>
      )}

      {products.length === 0 ? (
        <p className="text-small text-graphite py-2">No products yet.</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {products.map((p) => {
            const expiring = p.expiry_date ? daysUntil(p.expiry_date) : null;
            return (
              <div key={p.id} className="flex items-center justify-between gap-2 rounded-lg border border-alabaster px-3 py-2">
                <div className="min-w-0">
                  <p className="text-small font-medium truncate">{p.name}</p>
                  <p className="text-[11px] text-graphite truncate">
                    {p.brand ? `${p.brand} · ` : ""}
                    {p.product_type}
                  </p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  {expiring !== null && expiring <= 30 && (
                    <Badge variant={expiring <= 0 ? "danger" : "warning"}>
                      {expiring <= 0 ? "Expired" : `${expiring}d`}
                    </Badge>
                  )}
                  <button aria-label="Remove product" onClick={() => startTransition(() => removeSkincareProduct(p.id))}>
                    <X size={14} className="text-graphite" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </Card>
  );
}
