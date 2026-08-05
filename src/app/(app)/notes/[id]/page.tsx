import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { NoteOverview } from "@/components/notes/NoteOverview";
import type { Note, NoteFolder } from "@/lib/types";

export default async function NoteDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const [noteRes, foldersRes] = await Promise.all([
    supabase.from("notes").select("*").eq("id", id).single(),
    supabase.from("note_folders").select("*").order("position"),
  ]);

  if (!noteRes.data) notFound();

  return (
    <NoteOverview
      note={noteRes.data as Note}
      folders={(foldersRes.data as NoteFolder[]) ?? []}
    />
  );
}
