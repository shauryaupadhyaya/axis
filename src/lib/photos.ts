"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { ProgressPhotoCategory } from "@/lib/types";

const BUCKET = "progress-photos";

export const PHOTO_CATEGORY_LABELS: Record<ProgressPhotoCategory, string> = {
  gym: "Gym progress",
  weight_loss: "Weight loss",
  muscle_gain: "Muscle gain",
  skincare: "Skincare",
  face: "Face progress",
  custom: "Custom",
};

export async function uploadProgressPhoto(
  file: File,
  category: ProgressPhotoCategory,
  angle: string,
  takenAt: string
): Promise<string> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const storagePath = `${user.id}/${category}/${Date.now()}-${file.name}`;
  const { error: uploadError } = await supabase.storage.from(BUCKET).upload(storagePath, file);
  if (uploadError) throw uploadError;

  const { error } = await supabase.from("progress_photos").insert({
    user_id: user.id,
    category,
    angle,
    storage_path: storagePath,
    taken_at: takenAt,
  });
  if (error) throw error;
  return storagePath;
}

export async function getProgressPhotoUrl(storagePath: string): Promise<string> {
  const supabase = createClient();
  const { data, error } = await supabase.storage.from(BUCKET).createSignedUrl(storagePath, 3600);
  if (error) throw error;
  return data.signedUrl;
}

export async function deleteProgressPhoto(id: string, storagePath: string): Promise<void> {
  const supabase = createClient();
  await supabase.storage.from(BUCKET).remove([storagePath]);
  await supabase.from("progress_photos").delete().eq("id", id);
}

export function usePhotoUrl(storagePath: string | null) {
  const [url, setUrl] = useState<string | null>(null);
  useEffect(() => {
    let active = true;
    if (!storagePath) return;
    getProgressPhotoUrl(storagePath).then((u) => {
      if (active) setUrl(u);
    });
    return () => {
      active = false;
    };
  }, [storagePath]);
  return url;
}
