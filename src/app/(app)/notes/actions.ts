"use server";

import { revalidatePath } from "next/cache";
import { requireUserId } from "@/lib/supabase/require-user";

export async function createNote(folderId: string | null) {
  const { supabase, userId } = await requireUserId();
  const { data, error } = await supabase
    .from("notes")
    .insert({ user_id: userId, folder_id: folderId, title: "Untitled" })
    .select("id")
    .single();
  revalidatePath("/notes");
  if (error) throw new Error(error.message);
  return data.id as string;
}

export async function updateNote(
  noteId: string,
  patch: Partial<{
    title: string;
    content: string;
    tags: string[];
    folder_id: string | null;
    chapter_id: string | null;
    is_favorite: boolean;
  }>
) {
  const { supabase, userId } = await requireUserId();
  await supabase
    .from("notes")
    .update({ ...patch, updated_at: new Date().toISOString() })
    .eq("id", noteId)
    .eq("user_id", userId);
  revalidatePath("/notes");
  revalidatePath(`/notes/${noteId}`);
}

export async function deleteNote(noteId: string) {
  const { supabase, userId } = await requireUserId();
  await supabase.from("notes").delete().eq("id", noteId).eq("user_id", userId);
  revalidatePath("/notes");
}

export async function createFolder(name: string) {
  const { supabase, userId } = await requireUserId();
  const trimmed = name.trim();
  if (!trimmed) return;
  const { data: existing } = await supabase.from("note_folders").select("id").eq("user_id", userId);
  await supabase
    .from("note_folders")
    .insert({ user_id: userId, name: trimmed, position: existing?.length ?? 0 });
  revalidatePath("/notes");
}

export async function deleteFolder(folderId: string) {
  const { supabase, userId } = await requireUserId();
  await supabase.from("note_folders").delete().eq("id", folderId).eq("user_id", userId);
  revalidatePath("/notes");
}
