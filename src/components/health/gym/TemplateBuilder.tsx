"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Play, Plus, X } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { ExerciseLibraryModal } from "./ExerciseLibraryModal";
import type { WorkoutTemplate, WorkoutTemplateExercise } from "@/lib/types";
import type { Exercise } from "@/lib/gym/exercise-library";
import { toISODate } from "@/lib/scores";
import {
  addTemplateExercise,
  createWorkoutTemplate,
  removeTemplateExercise,
  removeWorkoutTemplate,
  startWorkoutFromTemplate,
} from "@/app/(app)/health/actions";

const PRESET_TEMPLATES = ["Push Day", "Pull Day", "Legs Day", "Upper Body", "Full Body"];

export function TemplateBuilder({
  templates,
  templateExercises,
  favoriteIds,
}: {
  templates: WorkoutTemplate[];
  templateExercises: WorkoutTemplateExercise[];
  favoriteIds: Set<string>;
}) {
  const router = useRouter();
  const [, startTransition] = useTransition();
  const [creating, setCreating] = useState(false);
  const [newName, setNewName] = useState("");
  const [pickerFor, setPickerFor] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<string | null>(null);

  function handleCreate(name: string) {
    if (!name.trim()) return;
    startTransition(() => {
      createWorkoutTemplate(name);
    });
    setNewName("");
    setCreating(false);
  }

  function handleSelectExercise(templateId: string, exercise: Exercise) {
    startTransition(() => addTemplateExercise(templateId, exercise.id, exercise.name, exercise.primaryMuscle));
    setPickerFor(null);
  }

  async function handleStart(template: WorkoutTemplate) {
    const id = await startWorkoutFromTemplate(template.id, template.name, toISODate(new Date()));
    if (id) router.push(`/health/workouts/${id}`);
  }

  return (
    <Card>
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-h3">Templates</h3>
        <button aria-label="New template" onClick={() => setCreating((v) => !v)}>
          <Plus size={16} />
        </button>
      </div>

      {creating && (
        <div className="flex flex-wrap items-center gap-2 mb-4">
          {PRESET_TEMPLATES.map((p) => (
            <button
              key={p}
              onClick={() => handleCreate(p)}
              className="text-caption px-3 py-1.5 rounded-full border border-alabaster hover:border-tuscan transition-fast"
            >
              {p}
            </button>
          ))}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleCreate(newName);
            }}
            className="flex gap-2"
          >
            <Input placeholder="Custom name" value={newName} onChange={(e) => setNewName(e.target.value)} className="w-40" />
            <Button type="submit">Add</Button>
          </form>
        </div>
      )}

      {templates.length === 0 ? (
        <p className="text-small text-graphite py-2">No templates yet — create one above.</p>
      ) : (
        <div className="flex flex-col gap-2">
          {templates.map((t) => {
            const exs = templateExercises.filter((te) => te.template_id === t.id).sort((a, b) => a.position - b.position);
            const isOpen = expanded === t.id;
            return (
              <div key={t.id} className="rounded-lg border border-alabaster">
                <div className="flex items-center justify-between px-3 py-2.5 cursor-pointer" onClick={() => setExpanded(isOpen ? null : t.id)}>
                  <div>
                    <p className="text-body font-medium">{t.name}</p>
                    <p className="text-[11px] text-graphite">{exs.length} exercises</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleStart(t);
                      }}
                      className="flex items-center gap-1 text-caption px-2.5 py-1.5 rounded-md bg-tuscan/20 hover:bg-tuscan/30 transition-fast"
                    >
                      <Play size={12} /> Start
                    </button>
                    <button
                      aria-label="Delete template"
                      onClick={(e) => {
                        e.stopPropagation();
                        startTransition(() => removeWorkoutTemplate(t.id));
                      }}
                    >
                      <X size={14} className="text-graphite" />
                    </button>
                  </div>
                </div>

                {isOpen && (
                  <div className="px-3 pb-3">
                    <ul className="flex flex-col gap-1.5 mb-2">
                      {exs.map((te) => (
                        <li key={te.id} className="flex items-center justify-between text-small">
                          <span>
                            {te.custom_name ?? te.exercise_id} <span className="text-[11px] text-graphite">· {te.muscle_group}</span>
                          </span>
                          <button aria-label="Remove exercise" onClick={() => startTransition(() => removeTemplateExercise(te.id))}>
                            <X size={12} className="text-graphite" />
                          </button>
                        </li>
                      ))}
                    </ul>
                    <button
                      onClick={() => setPickerFor(t.id)}
                      className="text-caption text-tuscan flex items-center gap-1"
                    >
                      <Plus size={12} /> Add exercise
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {pickerFor && (
        <ExerciseLibraryModal favoriteIds={favoriteIds} onClose={() => setPickerFor(null)} onSelect={(ex) => handleSelectExercise(pickerFor, ex)} />
      )}
    </Card>
  );
}
