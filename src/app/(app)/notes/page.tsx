import { createClient } from "@/lib/supabase/server";
import { NotesPageView } from "@/components/notes/NotesPageView";
import type { Note, NoteFolder } from "@/lib/types";

export default async function NotesPage() {
  const supabase = await createClient();

  const [foldersRes, notesRes] = await Promise.all([
    supabase.from("note_folders").select("*").order("position"),
    supabase.from("notes").select("*").order("updated_at", { ascending: false }),
  ]);

  return (
    <NotesPageView
      folders={(foldersRes.data as NoteFolder[]) ?? []}
      notes={(notesRes.data as Note[]) ?? []}
    />
  );
}
