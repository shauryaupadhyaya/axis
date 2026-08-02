"use client";

import { createClient } from "@/lib/supabase/client";
import { addStudyAttachment } from "@/app/(app)/study/actions";

const BUCKET = "study-attachments";

/** Uploads the file to storage, then records it via the addStudyAttachment server action (which owns the DB write + revalidation). */
export async function uploadStudyAttachment(chapterId: string, file: File): Promise<string> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const storagePath = `${user.id}/${chapterId}/${Date.now()}-${file.name}`;
  const { error: uploadError } = await supabase.storage.from(BUCKET).upload(storagePath, file);
  if (uploadError) throw uploadError;

  return addStudyAttachment(chapterId, file.name, storagePath, file.size, file.type || "application/octet-stream");
}

export async function getStudyAttachmentUrl(storagePath: string): Promise<string> {
  const supabase = createClient();
  const { data, error } = await supabase.storage.from(BUCKET).createSignedUrl(storagePath, 3600);
  if (error) throw error;
  return data.signedUrl;
}

export function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      resolve(result.split(",")[1] ?? "");
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}
