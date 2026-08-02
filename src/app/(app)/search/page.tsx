import { createClient } from "@/lib/supabase/server";
import { SearchView } from "@/components/search/SearchView";
import type { Chapter, Note, NoteFolder, StudyAttachment, Subject } from "@/lib/types";

export default async function SearchPage() {
  const supabase = await createClient();

  const [notesRes, foldersRes, subjectsRes, chaptersRes, attachmentsRes] = await Promise.all([
    supabase.from("notes").select("*").order("updated_at", { ascending: false }),
    supabase.from("note_folders").select("*").order("position"),
    supabase.from("subjects").select("*").order("created_at", { ascending: true }),
    supabase.from("chapters").select("*"),
    supabase.from("study_attachments").select("*").order("created_at", { ascending: false }),
  ]);

  return (
    <SearchView
      notes={(notesRes.data as Note[]) ?? []}
      folders={(foldersRes.data as NoteFolder[]) ?? []}
      subjects={(subjectsRes.data as Subject[]) ?? []}
      chapters={(chaptersRes.data as Chapter[]) ?? []}
      attachments={(attachmentsRes.data as StudyAttachment[]) ?? []}
    />
  );
}
