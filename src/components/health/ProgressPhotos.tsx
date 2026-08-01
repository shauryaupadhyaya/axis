"use client";

import { useMemo, useRef, useState, useTransition } from "react";
import { Camera, ChevronLeft, ChevronRight, SlidersHorizontal, Trash2, X } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { deleteProgressPhoto, PHOTO_CATEGORY_LABELS, uploadProgressPhoto, usePhotoUrl } from "@/lib/photos";
import { saveBodyMeasurement } from "@/app/(app)/health/actions";
import { toISODate, daysUntil } from "@/lib/scores";
import type { BodyMeasurement, ProgressPhoto, ProgressPhotoCategory } from "@/lib/types";
import { LineChart, Line, ResponsiveContainer, Tooltip, XAxis } from "recharts";

const CATEGORIES = Object.keys(PHOTO_CATEGORY_LABELS) as ProgressPhotoCategory[];

function PhotoThumb({ photo, onClick }: { photo: ProgressPhoto; onClick: () => void }) {
  const url = usePhotoUrl(photo.storage_path);
  return (
    <button
      onClick={onClick}
      className="group relative aspect-square rounded-xl overflow-hidden border border-alabaster hover:ring-2 hover:ring-tuscan transition-all bg-bg"
    >
      {url ? (
        <img src={url} alt={photo.caption || "Progress photo"} className="w-full h-full object-cover" />
      ) : (
        <div className="w-full h-full animate-skeleton-pulse bg-alabaster/30" />
      )}
      <div className="absolute bottom-0 left-0 right-0 p-2 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
        <p className="text-[11px] text-white">
          {new Date(photo.taken_at).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
        </p>
      </div>
    </button>
  );
}

function BeforeAfterSlider({ before, after }: { before: ProgressPhoto; after: ProgressPhoto }) {
  const beforeUrl = usePhotoUrl(before.storage_path);
  const afterUrl = usePhotoUrl(after.storage_path);
  const [pos, setPos] = useState(50);

  return (
    <div className="relative w-full max-w-[420px] aspect-[3/4] rounded-lg overflow-hidden select-none">
      {afterUrl && <img src={afterUrl} alt="After" className="absolute inset-0 w-full h-full object-cover" />}
      {beforeUrl && (
        <div className="absolute inset-0 overflow-hidden" style={{ width: `${pos}%` }}>
          <img src={beforeUrl} alt="Before" className="h-full object-cover" style={{ width: "420px", maxWidth: "none" }} />
        </div>
      )}
      <div className="absolute top-0 bottom-0 w-0.5 bg-white" style={{ left: `${pos}%` }} />
      <input
        type="range"
        min={0}
        max={100}
        value={pos}
        onChange={(e) => setPos(Number(e.target.value))}
        className="absolute inset-x-0 bottom-2 w-[90%] mx-[5%] accent-white"
      />
      <span className="absolute top-2 left-2 text-[10px] px-1.5 py-0.5 rounded bg-black/50 text-white">Before</span>
      <span className="absolute top-2 right-2 text-[10px] px-1.5 py-0.5 rounded bg-black/50 text-white">After</span>
    </div>
  );
}

const MEASUREMENT_FIELDS: Array<{ key: keyof BodyMeasurement; label: string }> = [
  { key: "weight_kg", label: "Weight (kg)" },
  { key: "body_fat_pct", label: "Body fat %" },
  { key: "chest_cm", label: "Chest (cm)" },
  { key: "waist_cm", label: "Waist (cm)" },
  { key: "arms_cm", label: "Arms (cm)" },
  { key: "thighs_cm", label: "Thighs (cm)" },
  { key: "neck_cm", label: "Neck (cm)" },
];

export function ProgressPhotos({
  photos = [],
  measurements = [],
}: {
  photos?: ProgressPhoto[];
  measurements?: BodyMeasurement[];
}) {
  const [, startTransition] = useTransition();
  const [category, setCategory] = useState<ProgressPhotoCategory>("gym");
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const [compareMode, setCompareMode] = useState(false);
  const [uploadAngle, setUploadAngle] = useState("front");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [measureDraft, setMeasureDraft] = useState<Record<string, string>>({});

  const filtered = useMemo(
    () => photos.filter((p) => p.category === category).sort((a, b) => (a.taken_at < b.taken_at ? 1 : -1)),
    [photos, category]
  );

  const latest = filtered[0] ?? null;
  const daysSince = latest ? -daysUntil(latest.taken_at) : null;

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    for (const file of Array.from(files)) {
      await uploadProgressPhoto(file, category, uploadAngle, toISODate(new Date()));
    }
    e.target.value = "";
    window.location.reload();
  }

  return (
    <div className="flex flex-col gap-5">
      <Card>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-h3">Progress photos</h3>
          <div className="flex items-center gap-2">
            {filtered.length >= 2 && (
              <Button variant="secondary" onClick={() => setCompareMode((v) => !v)} className="text-small">
                {compareMode ? "Exit compare" : "Compare"}
              </Button>
            )}
            <select value={uploadAngle} onChange={(e) => setUploadAngle(e.target.value)} className="text-small px-2 py-2 rounded-md border border-alabaster bg-linen dark:bg-bg-secondary">
              <option value="front">Front</option>
              <option value="left">Left</option>
              <option value="right">Right</option>
              <option value="back">Back</option>
            </select>
            <Button onClick={() => fileInputRef.current?.click()} className="flex items-center gap-1.5">
              <Camera size={16} /> Add photo
            </Button>
            <input ref={fileInputRef} type="file" accept="image/*" multiple className="hidden" onChange={handleUpload} />
          </div>
        </div>

        <div className="flex flex-wrap gap-2 mb-4">
          {CATEGORIES.map((c) => (
            <button
              key={c}
              onClick={() => setCategory(c)}
              className={`text-caption px-3 py-1.5 rounded-full border transition-fast ${
                category === c ? "border-tuscan bg-tuscan/15" : "border-alabaster hover:bg-bg"
              }`}
            >
              {PHOTO_CATEGORY_LABELS[c]}
            </button>
          ))}
        </div>

        {latest && (
          <p className="text-caption text-graphite mb-3">
            Latest update: {daysSince}d ago ({new Date(latest.taken_at).toLocaleDateString()})
          </p>
        )}

        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center border-2 border-dashed border-alabaster rounded-xl">
            <Camera size={48} className="text-graphite mb-3" strokeWidth={2} />
            <p className="text-body text-graphite mb-2">No {PHOTO_CATEGORY_LABELS[category].toLowerCase()} photos yet</p>
            <Button onClick={() => fileInputRef.current?.click()}>Upload your first photo</Button>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {filtered.map((photo, index) => (
              <PhotoThumb key={photo.id} photo={photo} onClick={() => setLightboxIndex(index)} />
            ))}
          </div>
        )}
      </Card>

      <Card>
        <h3 className="text-h3 mb-3">Body measurements</h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-3">
          {MEASUREMENT_FIELDS.map((f) => (
            <Input
              key={f.key}
              label={f.label}
              type="number"
              value={measureDraft[f.key] ?? ""}
              onChange={(e) => setMeasureDraft((d) => ({ ...d, [f.key]: e.target.value }))}
            />
          ))}
        </div>
        <Button
          onClick={() =>
            startTransition(() => {
              saveBodyMeasurement({
                weightKg: measureDraft.weight_kg ? Number(measureDraft.weight_kg) : null,
                bodyFatPct: measureDraft.body_fat_pct ? Number(measureDraft.body_fat_pct) : null,
                chestCm: measureDraft.chest_cm ? Number(measureDraft.chest_cm) : null,
                waistCm: measureDraft.waist_cm ? Number(measureDraft.waist_cm) : null,
                armsCm: measureDraft.arms_cm ? Number(measureDraft.arms_cm) : null,
                thighsCm: measureDraft.thighs_cm ? Number(measureDraft.thighs_cm) : null,
                neckCm: measureDraft.neck_cm ? Number(measureDraft.neck_cm) : null,
              });
            })
          }
        >
          Save today&apos;s measurements
        </Button>

        {measurements.length > 1 && (
          <div className="h-[160px] mt-5">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={[...measurements].reverse()}>
                <XAxis dataKey="logged_date" tick={{ fontSize: 10 }} tickFormatter={(v) => v.slice(5)} />
                <Tooltip
                  contentStyle={{ background: "var(--bg-secondary)", border: "1px solid var(--tuscan-sun)", fontSize: 12 }}
                />
                <Line type="monotone" dataKey="weight_kg" stroke="var(--info)" strokeWidth={2} dot={false} name="Weight (kg)" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
      </Card>

      {lightboxIndex !== null && (
        <div className="fixed inset-0 z-[1200] bg-black/80 flex items-center justify-center" onClick={() => setLightboxIndex(null)}>
          <button aria-label="Close" onClick={() => setLightboxIndex(null)} className="absolute top-4 right-4 w-10 h-10 rounded-full bg-black/40 flex items-center justify-center text-white z-10">
            <X size={20} />
          </button>
          {filtered.length > 1 && (
            <>
              <button
                aria-label="Previous"
                onClick={(e) => {
                  e.stopPropagation();
                  setLightboxIndex((i) => (i !== null ? (i - 1 + filtered.length) % filtered.length : null));
                }}
                className="absolute left-4 w-10 h-10 rounded-full bg-black/40 flex items-center justify-center text-white"
              >
                <ChevronLeft size={20} />
              </button>
              <button
                aria-label="Next"
                onClick={(e) => {
                  e.stopPropagation();
                  setLightboxIndex((i) => (i !== null ? (i + 1) % filtered.length : null));
                }}
                className="absolute right-4 w-10 h-10 rounded-full bg-black/40 flex items-center justify-center text-white"
              >
                <ChevronRight size={20} />
              </button>
            </>
          )}
          <div className="flex flex-col items-center gap-3" onClick={(e) => e.stopPropagation()}>
            {compareMode && lightboxIndex < filtered.length - 1 ? (
              <>
                <SlidersHorizontal size={16} className="text-white/70" />
                <BeforeAfterSlider before={filtered[filtered.length - 1]} after={filtered[lightboxIndex]} />
              </>
            ) : (
              <PhotoLightboxImage photo={filtered[lightboxIndex]} />
            )}
            <div className="flex items-center gap-3">
              <p className="text-small text-white/60">{new Date(filtered[lightboxIndex].taken_at).toLocaleDateString()}</p>
              <button
                onClick={() => {
                  deleteProgressPhoto(filtered[lightboxIndex].id, filtered[lightboxIndex].storage_path);
                  setLightboxIndex(null);
                  window.location.reload();
                }}
                className="text-white/60 hover:text-danger transition-fast"
                aria-label="Delete photo"
              >
                <Trash2 size={16} />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function PhotoLightboxImage({ photo }: { photo: ProgressPhoto }) {
  const url = usePhotoUrl(photo.storage_path);
  if (!url) return <div className="w-[300px] h-[400px] animate-skeleton-pulse bg-alabaster/30 rounded-lg" />;
  return <img src={url} alt={photo.caption || "Progress photo"} className="max-h-[75vh] max-w-[90vw] object-contain rounded-lg" />;
}
