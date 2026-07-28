"use client";

import { useState, useRef } from "react";
import { Camera, X, ChevronLeft, ChevronRight } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/cn";

interface ProgressPhoto {
  id: string;
  date: string;
  url: string;
  caption?: string;
}

const MOCK_PHOTOS: ProgressPhoto[] = [];

/**
 * Progress photos gallery — gym progress tracking per the spec.
 * Supports timeline view, lightbox full-screen, and comparison slider.
 * In MVP, photos are stored as local object URLs; upload integration
 * (Supabase Storage) can be added via the upload handler.
 */
export function ProgressPhotos() {
  const [photos, setPhotos] = useState<ProgressPhoto[]>(MOCK_PHOTOS);
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const [compareMode, setCompareMode] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  function handleAddPhoto(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    const newPhotos: ProgressPhoto[] = Array.from(files).map((file, i) => ({
      id: `photo-${Date.now()}-${i}`,
      date: new Date().toISOString(),
      url: URL.createObjectURL(file),
      caption: file.name.replace(/\.[^/.]+$/, ""),
    }));
    setPhotos((prev) => [...newPhotos, ...prev]);
    e.target.value = "";
  }

  const sorted = [...photos].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-h3">Progress photos</h3>
        <div className="flex gap-2">
          {photos.length >= 2 && (
            <Button
              variant="secondary"
              onClick={() => setCompareMode((v) => !v)}
              className="text-small"
            >
              {compareMode ? "Exit compare" : "Compare"}
            </Button>
          )}
          <Button
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center gap-1.5"
          >
            <Camera size={16} /> Add photo
          </Button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            onChange={handleAddPhoto}
          />
        </div>
      </div>

      {sorted.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-center border-2 border-dashed border-alabaster rounded-xl">
          <Camera size={48} className="text-graphite mb-3" strokeWidth={2} />
          <p className="text-body text-graphite mb-2">No progress photos yet</p>
          <p className="text-caption text-graphite mb-4 max-w-[280px]">
            Track your transformation by adding photos over time.
          </p>
          <Button onClick={() => fileInputRef.current?.click()}>
            Upload your first photo
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
          {sorted.map((photo, index) => (
            <button
              key={photo.id}
              onClick={() => setLightboxIndex(index)}
              className="group relative aspect-square rounded-xl overflow-hidden border border-alabaster hover:ring-2 hover:ring-tuscan transition-all"
            >
              <img
                src={photo.url}
                alt={photo.caption || "Progress photo"}
                className="w-full h-full object-cover"
              />
              <div className="absolute bottom-0 left-0 right-0 p-2 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
                <p className="text-[11px] text-white">
                  {new Date(photo.date).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                  })}
                </p>
              </div>
            </button>
          ))}
        </div>
      )}

      {/* Lightbox */}
      {lightboxIndex !== null && (
        <div
          className="fixed inset-0 z-[1200] bg-black/80 flex items-center justify-center"
          onClick={() => setLightboxIndex(null)}
        >
          <button
            aria-label="Close lightbox"
            onClick={() => setLightboxIndex(null)}
            className="absolute top-4 right-4 w-10 h-10 rounded-full bg-black/40 flex items-center justify-center text-white hover:bg-black/60 transition-fast z-10"
          >
            <X size={20} />
          </button>

          {sorted.length > 1 && (
            <>
              <button
                aria-label="Previous"
                onClick={(e) => {
                  e.stopPropagation();
                  setLightboxIndex((i) => (i !== null ? (i - 1 + sorted.length) % sorted.length : null));
                }}
                className="absolute left-4 w-10 h-10 rounded-full bg-black/40 flex items-center justify-center text-white hover:bg-black/60 transition-fast"
              >
                <ChevronLeft size={20} />
              </button>
              <button
                aria-label="Next"
                onClick={(e) => {
                  e.stopPropagation();
                  setLightboxIndex((i) => (i !== null ? (i + 1) % sorted.length : null));
                }}
                className="absolute right-4 w-10 h-10 rounded-full bg-black/40 flex items-center justify-center text-white hover:bg-black/60 transition-fast"
              >
                <ChevronRight size={20} />
              </button>
            </>
          )}

          <div
            className="max-w-[90vw] max-h-[85vh]"
            onClick={(e) => e.stopPropagation()}
          >
            {compareMode && lightboxIndex < sorted.length - 1 ? (
              <div className="relative">
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <p className="text-caption text-white/60 mb-2 text-center">
                      {new Date(sorted[lightboxIndex].date).toLocaleDateString()}
                    </p>
                    <img
                      src={sorted[lightboxIndex].url}
                      alt="Before"
                      className="max-h-[70vh] w-full object-contain rounded-lg"
                    />
                  </div>
                  <div>
                    <p className="text-caption text-white/60 mb-2 text-center">
                      {new Date(sorted[lightboxIndex + 1]?.date ?? sorted[0].date).toLocaleDateString()}
                    </p>
                    <img
                      src={sorted[lightboxIndex + 1]?.url ?? sorted[0].url}
                      alt="After"
                      className="max-h-[70vh] w-full object-contain rounded-lg"
                    />
                  </div>
                </div>
              </div>
            ) : (
              <img
                src={sorted[lightboxIndex].url}
                alt={sorted[lightboxIndex].caption || "Progress photo"}
                className="max-h-[80vh] max-w-full object-contain rounded-lg"
              />
            )}
            <p className="text-small text-white/60 text-center mt-3">
              {new Date(sorted[lightboxIndex].date).toLocaleDateString("en-US", {
                weekday: "long",
                month: "long",
                day: "numeric",
                year: "numeric",
              })}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
