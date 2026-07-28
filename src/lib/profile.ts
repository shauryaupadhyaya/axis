"use client";

import { createClient } from "@/lib/supabase/client";

const BUCKET = "avatars";

export async function updateProfile({
  username,
  avatarFile,
}: {
  username?: string;
  avatarFile?: File;
}): Promise<{ avatarUrl: string | null }> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  let avatarUrl: string | null = null;
  if (avatarFile) {
    const storagePath = `${user.id}/avatar-${Date.now()}-${avatarFile.name}`;
    const { error: uploadError } = await supabase.storage.from(BUCKET).upload(storagePath, avatarFile);
    if (uploadError) throw uploadError;
    avatarUrl = supabase.storage.from(BUCKET).getPublicUrl(storagePath).data.publicUrl;
  }

  const data: Record<string, string> = {};
  if (username !== undefined) data.full_name = username;
  if (avatarUrl) data.avatar_url = avatarUrl;

  const { error } = await supabase.auth.updateUser({ data });
  if (error) throw error;

  return { avatarUrl };
}
