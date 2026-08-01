"use client";

import { useState } from "react";
import { GlassWater, Martini, CupSoda, Beaker, Plus, X } from "lucide-react";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import type { WaterContainer } from "@/lib/types";
import { CONTAINER_PRESETS, allContainers } from "@/lib/water";
import { addWaterContainer, removeWaterContainer } from "@/app/(app)/health/actions";

const ICONS: Record<string, React.ComponentType<{ size?: number }>> = {
  "glass-sm": Martini,
  "glass-md": GlassWater,
  "glass-lg": GlassWater,
  bottle: CupSoda,
  "sports-bottle": CupSoda,
  mug: Beaker,
  "smart-bottle": Beaker,
};

export function ContainerPicker({
  custom,
  onLog,
}: {
  custom: WaterContainer[];
  onLog: (amountMl: number) => void;
}) {
  const [managing, setManaging] = useState(false);
  const [name, setName] = useState("");
  const [volume, setVolume] = useState(250);
  const containers = allContainers(custom);

  return (
    <div>
      <div className="flex items-center gap-2 overflow-x-auto pb-1 -mx-1 px-1">
        {containers.map((c) => {
          const Icon = ICONS[c.icon] ?? GlassWater;
          const isCustom = !c.id.startsWith("preset-");
          return (
            <button
              key={c.id}
              onClick={() => onLog(c.volumeMl)}
              className="group relative shrink-0 flex flex-col items-center gap-1 px-3 py-2.5 rounded-xl border border-alabaster bg-linen dark:bg-bg-secondary hover:border-tuscan hover:-translate-y-0.5 transition-fast"
            >
              <Icon size={20} />
              <span className="text-caption whitespace-nowrap">{c.name}</span>
              <span className="text-[10px] text-graphite text-mono">{c.volumeMl}ml</span>
              {isCustom && (
                <span
                  role="button"
                  aria-label={`Remove ${c.name}`}
                  onClick={(e) => {
                    e.stopPropagation();
                    removeWaterContainer(c.id);
                  }}
                  className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full bg-danger text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-fast"
                >
                  <X size={10} />
                </span>
              )}
            </button>
          );
        })}
        <button
          onClick={() => setManaging((v) => !v)}
          className="shrink-0 flex flex-col items-center justify-center gap-1 px-3 py-2.5 rounded-xl border border-dashed border-alabaster hover:border-tuscan transition-fast text-graphite"
        >
          <Plus size={20} />
          <span className="text-caption">Custom</span>
        </button>
      </div>

      {managing && (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (!name.trim() || volume <= 0) return;
            addWaterContainer(name, volume, "smart-bottle");
            setName("");
            setVolume(250);
            setManaging(false);
          }}
          className="flex items-end gap-2 mt-3"
        >
          <Input label="Name" placeholder="e.g. Gym shaker" value={name} onChange={(e) => setName(e.target.value)} />
          <Input
            label="Volume (ml)"
            type="number"
            value={volume}
            onChange={(e) => setVolume(Number(e.target.value))}
            className="w-28"
          />
          <Button type="submit">Add</Button>
        </form>
      )}
    </div>
  );
}

export { CONTAINER_PRESETS };
