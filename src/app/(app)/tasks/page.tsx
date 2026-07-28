import { createClient } from "@/lib/supabase/server";
import { TasksView } from "@/components/tasks/TasksView";
import type { Task } from "@/lib/types";

export default async function TasksPage() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("tasks")
    .select("*")
    .order("due_at", { ascending: true, nullsFirst: false });

  return <TasksView tasks={(data as Task[]) ?? []} />;
}
