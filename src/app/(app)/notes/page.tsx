import { createClient } from "@/lib/supabase/server";
import { NotesPageView } from "@/components/notes/NotesPageView";
import type { Chapter, Note, NoteFolder, Subject } from "@/lib/types";

export default async function NotesPage() {
  const supabase = await createClient();

  const [foldersRes, notesRes, subjectsRes, chaptersRes] = await Promise.all([
    supabase.from("note_folders").select("*").order("position"),
    supabase.from("notes").select("*").order("updated_at", { ascending: false }),
    supabase.from("subjects").select("*").order("created_at", { ascending: true }),
    supabase.from("chapters").select("*"),
  ]);

  return (
    <NotesPageView
      folders={(foldersRes.data as NoteFolder[]) ?? []}
      notes={(notesRes.data as Note[]) ?? []}
      subjects={(subjectsRes.data as Subject[]) ?? []}
      chapters={(chaptersRes.data as Chapter[]) ?? []}
    />
  );
}
