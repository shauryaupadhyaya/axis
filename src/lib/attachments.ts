"use client";

import { createClient } from "@/lib/supabase/client";
import type { TaskAttachment } from "@/lib/types";

const BUCKET = "task-attachments";

export async function uploadTaskAttachment(taskId: string, file: File): Promise<TaskAttachment> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const storagePath = `${user.id}/${taskId}/${Date.now()}-${file.name}`;
  const { error: uploadError } = await supabase.storage.from(BUCKET).upload(storagePath, file);
  if (uploadError) throw uploadError;

  const { data, error } = await supabase
    .from("task_attachments")
    .insert({
      task_id: taskId,
      user_id: user.id,
      file_name: file.name,
      storage_path: storagePath,
      size_bytes: file.size,
    })
    .select("*")
    .single();
  if (error) throw error;
  return data as TaskAttachment;
}

export async function getAttachmentUrl(storagePath: string): Promise<string> {
  const supabase = createClient();
  const { data, error } = await supabase.storage.from(BUCKET).createSignedUrl(storagePath, 3600);
  if (error) throw error;
  return data.signedUrl;
}

export async function removeTaskAttachment(attachment: TaskAttachment): Promise<void> {
  const supabase = createClient();
  await supabase.storage.from(BUCKET).remove([attachment.storage_path]);
  await supabase.from("task_attachments").delete().eq("id", attachment.id);
}

export async function uploadInlineImage(taskId: string, file: File): Promise<string> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const storagePath = `${user.id}/${taskId}/inline/${Date.now()}-${file.name}`;
  const { error: uploadError } = await supabase.storage.from(BUCKET).upload(storagePath, file);
  if (uploadError) throw uploadError;

  const { data, error } = await supabase.storage
    .from(BUCKET)
    .createSignedUrl(storagePath, 60 * 60 * 24 * 365);
  if (error) throw error;
  return data.signedUrl;
}
