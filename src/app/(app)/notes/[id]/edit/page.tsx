import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { NoteEditorFull } from "@/components/notes/NoteEditorFull";
import type { Note } from "@/lib/types";

export default async function NoteEditPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const { data } = await supabase.from("notes").select("*").eq("id", id).single();

  if (!data) notFound();

  return <NoteEditorFull note={data as Note} />;
}
