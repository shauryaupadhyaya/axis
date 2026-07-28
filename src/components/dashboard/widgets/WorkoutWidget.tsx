import { Clock, Check, X } from "lucide-react";
import { Card } from "@/components/ui/Card";
import type { Workout } from "@/lib/types";

export function WorkoutWidget({ workout }: { workout: Workout | null }) {
  return (
    <Card>
      <h3 className="text-h3 mb-3">Workout</h3>
      {!workout ? (
        <p className="text-small text-graphite py-4 text-center">No workout scheduled today</p>
      ) : (
        <div>
          <p className="text-body font-medium mb-1">{workout.name}</p>
          <div className="flex items-center gap-1.5 text-small text-graphite mb-3">
            {workout.status === "completed" && <Check size={14} className="text-success" />}
            {workout.status === "scheduled" && <Clock size={14} />}
            {workout.status === "skipped" && <X size={14} className="text-danger" />}
            <span className="capitalize">{workout.status}</span>
          </div>
          {workout.status === "scheduled" && (
            <p className="text-caption text-graphite">
              Gym session tracking lands in a future update.
            </p>
          )}
        </div>
      )}
    </Card>
  );
}
