export type ExerciseCategory =
  | "strength"
  | "cardio"
  | "mobility"
  | "flexibility"
  | "rehabilitation"
  | "athletic_performance";
export type ExerciseDifficulty = "beginner" | "intermediate" | "advanced";
export type Equipment =
  | "barbell"
  | "dumbbell"
  | "cable"
  | "machine"
  | "bodyweight"
  | "kettlebell"
  | "resistance_band"
  | "smith_machine"
  | "ez_bar"
  | "medicine_ball";

export const MUSCLE_GROUPS = [
  "Chest",
  "Back",
  "Lats",
  "Traps",
  "Shoulders",
  "Front Delts",
  "Side Delts",
  "Rear Delts",
  "Biceps",
  "Triceps",
  "Forearms",
  "Abs",
  "Obliques",
  "Lower Back",
  "Glutes",
  "Quads",
  "Hamstrings",
  "Calves",
  "Hip Flexors",
  "Neck",
] as const;
export type MuscleGroup = (typeof MUSCLE_GROUPS)[number];

export interface Exercise {
  id: string;
  name: string;
  alternativeNames: string[];
  category: ExerciseCategory;
  difficulty: ExerciseDifficulty;
  primaryMuscle: MuscleGroup;
  secondaryMuscles: MuscleGroup[];
  equipment: Equipment[];
  isBodyweight: boolean;
  isHomeFriendly: boolean;
  instructions: string;
}

function ex(
  id: string,
  name: string,
  primaryMuscle: MuscleGroup,
  secondaryMuscles: MuscleGroup[],
  equipment: Equipment[],
  opts?: Partial<Pick<Exercise, "category" | "difficulty" | "alternativeNames" | "instructions" | "isHomeFriendly">>
): Exercise {
  const isBodyweight = equipment.includes("bodyweight") && equipment.length === 1;
  return {
    id,
    name,
    alternativeNames: opts?.alternativeNames ?? [],
    category: opts?.category ?? "strength",
    difficulty: opts?.difficulty ?? "intermediate",
    primaryMuscle,
    secondaryMuscles,
    equipment,
    isBodyweight,
    isHomeFriendly: opts?.isHomeFriendly ?? isBodyweight,
    instructions: opts?.instructions ?? `Perform ${name.toLowerCase()} with controlled form, full range of motion, and a steady tempo.`,
  };
}

export const EXERCISE_LIBRARY: Exercise[] = [
  // Chest
  ex("barbell-bench-press", "Barbell Bench Press", "Chest", ["Triceps", "Front Delts"], ["barbell"], { alternativeNames: ["Flat Bench Press"] }),
  ex("incline-bench-press", "Incline Barbell Press", "Chest", ["Front Delts", "Triceps"], ["barbell"]),
  ex("dumbbell-bench-press", "Dumbbell Bench Press", "Chest", ["Triceps", "Front Delts"], ["dumbbell"]),
  ex("incline-dumbbell-press", "Incline Dumbbell Press", "Chest", ["Front Delts", "Triceps"], ["dumbbell"]),
  ex("dumbbell-flyes", "Dumbbell Flyes", "Chest", ["Front Delts"], ["dumbbell"]),
  ex("cable-crossover", "Cable Crossover", "Chest", ["Front Delts"], ["cable"]),
  ex("pushups", "Push-ups", "Chest", ["Triceps", "Front Delts", "Abs"], ["bodyweight"], { difficulty: "beginner" }),
  ex("dips-chest", "Chest Dips", "Chest", ["Triceps", "Front Delts"], ["bodyweight"], { difficulty: "advanced" }),
  ex("machine-chest-press", "Machine Chest Press", "Chest", ["Triceps"], ["machine"], { difficulty: "beginner" }),
  ex("pec-deck", "Pec Deck", "Chest", [], ["machine"], { difficulty: "beginner" }),

  // Back / Lats / Traps
  ex("deadlift", "Deadlift", "Back", ["Glutes", "Hamstrings", "Lower Back", "Traps"], ["barbell"], { difficulty: "advanced" }),
  ex("pull-ups", "Pull-ups", "Lats", ["Biceps", "Back"], ["bodyweight"], { difficulty: "advanced" }),
  ex("chin-ups", "Chin-ups", "Lats", ["Biceps"], ["bodyweight"], { difficulty: "advanced" }),
  ex("lat-pulldown", "Lat Pulldown", "Lats", ["Biceps", "Back"], ["cable"], { difficulty: "beginner" }),
  ex("barbell-row", "Barbell Row", "Back", ["Lats", "Biceps", "Rear Delts"], ["barbell"], { alternativeNames: ["Bent-Over Row"] }),
  ex("dumbbell-row", "One-Arm Dumbbell Row", "Back", ["Lats", "Biceps"], ["dumbbell"]),
  ex("seated-cable-row", "Seated Cable Row", "Back", ["Lats", "Biceps"], ["cable"], { difficulty: "beginner" }),
  ex("t-bar-row", "T-Bar Row", "Back", ["Lats", "Biceps"], ["barbell"]),
  ex("face-pull", "Face Pull", "Rear Delts", ["Traps", "Back"], ["cable"], { difficulty: "beginner" }),
  ex("shrugs", "Barbell Shrugs", "Traps", [], ["barbell"], { difficulty: "beginner" }),
  ex("hyperextension", "Back Hyperextension", "Lower Back", ["Glutes", "Hamstrings"], ["bodyweight"], { category: "rehabilitation", difficulty: "beginner" }),
  ex("good-morning", "Good Morning", "Lower Back", ["Hamstrings", "Glutes"], ["barbell"], { difficulty: "advanced" }),

  // Shoulders
  ex("overhead-press", "Overhead Press", "Front Delts", ["Side Delts", "Triceps"], ["barbell"], { alternativeNames: ["Military Press"] }),
  ex("dumbbell-shoulder-press", "Dumbbell Shoulder Press", "Front Delts", ["Side Delts", "Triceps"], ["dumbbell"]),
  ex("lateral-raise", "Lateral Raise", "Side Delts", [], ["dumbbell"], { difficulty: "beginner" }),
  ex("front-raise", "Front Raise", "Front Delts", [], ["dumbbell"], { difficulty: "beginner" }),
  ex("rear-delt-flye", "Rear Delt Flye", "Rear Delts", ["Back"], ["dumbbell"], { difficulty: "beginner" }),
  ex("arnold-press", "Arnold Press", "Front Delts", ["Side Delts", "Triceps"], ["dumbbell"]),
  ex("cable-lateral-raise", "Cable Lateral Raise", "Side Delts", [], ["cable"], { difficulty: "beginner" }),
  ex("upright-row", "Upright Row", "Side Delts", ["Traps"], ["barbell"]),

  // Arms
  ex("barbell-curl", "Barbell Curl", "Biceps", ["Forearms"], ["barbell"], { difficulty: "beginner" }),
  ex("dumbbell-curl", "Dumbbell Curl", "Biceps", ["Forearms"], ["dumbbell"], { difficulty: "beginner" }),
  ex("hammer-curl", "Hammer Curl", "Biceps", ["Forearms"], ["dumbbell"], { difficulty: "beginner" }),
  ex("ez-bar-curl", "EZ-Bar Curl", "Biceps", ["Forearms"], ["ez_bar"], { difficulty: "beginner" }),
  ex("cable-curl", "Cable Curl", "Biceps", ["Forearms"], ["cable"], { difficulty: "beginner" }),
  ex("preacher-curl", "Preacher Curl", "Biceps", [], ["ez_bar"]),
  ex("tricep-pushdown", "Tricep Pushdown", "Triceps", [], ["cable"], { difficulty: "beginner" }),
  ex("skull-crushers", "Skull Crushers", "Triceps", [], ["ez_bar"], { alternativeNames: ["Lying Tricep Extension"] }),
  ex("overhead-tricep-extension", "Overhead Tricep Extension", "Triceps", [], ["dumbbell"]),
  ex("close-grip-bench", "Close-Grip Bench Press", "Triceps", ["Chest", "Front Delts"], ["barbell"]),
  ex("dips-triceps", "Triceps Dips", "Triceps", ["Chest", "Front Delts"], ["bodyweight"], { difficulty: "advanced" }),
  ex("wrist-curl", "Wrist Curl", "Forearms", [], ["dumbbell"], { difficulty: "beginner" }),

  // Core
  ex("plank", "Plank", "Abs", ["Obliques", "Lower Back"], ["bodyweight"], { difficulty: "beginner", category: "strength" }),
  ex("crunches", "Crunches", "Abs", [], ["bodyweight"], { difficulty: "beginner" }),
  ex("hanging-leg-raise", "Hanging Leg Raise", "Abs", ["Hip Flexors"], ["bodyweight"], { difficulty: "advanced" }),
  ex("cable-crunch", "Cable Crunch", "Abs", [], ["cable"]),
  ex("russian-twist", "Russian Twist", "Obliques", ["Abs"], ["bodyweight"], { difficulty: "beginner" }),
  ex("side-plank", "Side Plank", "Obliques", ["Abs"], ["bodyweight"], { difficulty: "beginner" }),
  ex("ab-wheel-rollout", "Ab Wheel Rollout", "Abs", ["Obliques", "Lower Back"], ["bodyweight"], { difficulty: "advanced" }),
  ex("mountain-climbers", "Mountain Climbers", "Abs", ["Hip Flexors"], ["bodyweight"], { category: "cardio", difficulty: "beginner" }),

  // Legs
  ex("barbell-squat", "Barbell Back Squat", "Quads", ["Glutes", "Hamstrings"], ["barbell"], { difficulty: "advanced" }),
  ex("front-squat", "Front Squat", "Quads", ["Glutes"], ["barbell"], { difficulty: "advanced" }),
  ex("leg-press", "Leg Press", "Quads", ["Glutes", "Hamstrings"], ["machine"], { difficulty: "beginner" }),
  ex("lunges", "Walking Lunges", "Quads", ["Glutes", "Hamstrings"], ["bodyweight"], { difficulty: "beginner" }),
  ex("bulgarian-split-squat", "Bulgarian Split Squat", "Quads", ["Glutes"], ["dumbbell"], { difficulty: "advanced" }),
  ex("leg-extension", "Leg Extension", "Quads", [], ["machine"], { difficulty: "beginner" }),
  ex("romanian-deadlift", "Romanian Deadlift", "Hamstrings", ["Glutes", "Lower Back"], ["barbell"]),
  ex("leg-curl", "Leg Curl", "Hamstrings", [], ["machine"], { difficulty: "beginner" }),
  ex("hip-thrust", "Hip Thrust", "Glutes", ["Hamstrings"], ["barbell"]),
  ex("glute-bridge", "Glute Bridge", "Glutes", ["Hamstrings"], ["bodyweight"], { difficulty: "beginner" }),
  ex("cable-kickback", "Cable Glute Kickback", "Glutes", [], ["cable"], { difficulty: "beginner" }),
  ex("calf-raise", "Standing Calf Raise", "Calves", [], ["machine"], { difficulty: "beginner" }),
  ex("seated-calf-raise", "Seated Calf Raise", "Calves", [], ["machine"], { difficulty: "beginner" }),
  ex("goblet-squat", "Goblet Squat", "Quads", ["Glutes"], ["kettlebell"], { difficulty: "beginner" }),
  ex("kettlebell-swing", "Kettlebell Swing", "Glutes", ["Hamstrings", "Lower Back"], ["kettlebell"], { category: "athletic_performance" }),

  // Cardio / mobility / flexibility / neck
  ex("treadmill-run", "Treadmill Run", "Quads", ["Hamstrings", "Calves"], ["machine"], { category: "cardio", difficulty: "beginner" }),
  ex("rowing-machine", "Rowing Machine", "Back", ["Lats", "Quads", "Hamstrings"], ["machine"], { category: "cardio", difficulty: "beginner" }),
  ex("jump-rope", "Jump Rope", "Calves", ["Quads"], ["bodyweight"], { category: "cardio", difficulty: "beginner" }),
  ex("burpees", "Burpees", "Chest", ["Quads", "Abs"], ["bodyweight"], { category: "athletic_performance", difficulty: "intermediate" }),
  ex("cat-cow", "Cat-Cow Stretch", "Lower Back", ["Abs"], ["bodyweight"], { category: "mobility", difficulty: "beginner" }),
  ex("hip-flexor-stretch", "Hip Flexor Stretch", "Hip Flexors", ["Glutes"], ["bodyweight"], { category: "flexibility", difficulty: "beginner" }),
  ex("neck-flexion-stretch", "Neck Flexion Stretch", "Neck", [], ["bodyweight"], { category: "flexibility", difficulty: "beginner" }),
  ex("band-pull-apart", "Resistance Band Pull-Apart", "Rear Delts", ["Traps"], ["resistance_band"], { category: "rehabilitation", difficulty: "beginner" }),
  ex("shoulder-external-rotation", "Band External Rotation", "Rear Delts", ["Shoulders"], ["resistance_band"], { category: "rehabilitation", difficulty: "beginner" }),
  ex("smith-machine-squat", "Smith Machine Squat", "Quads", ["Glutes"], ["smith_machine"], { difficulty: "beginner" }),
  ex("medicine-ball-slam", "Medicine Ball Slam", "Abs", ["Shoulders"], ["medicine_ball"], { category: "athletic_performance" }),
];

export function findExercise(id: string): Exercise | undefined {
  return EXERCISE_LIBRARY.find((e) => e.id === id);
}

export interface ExerciseFilters {
  query?: string;
  muscleGroup?: MuscleGroup;
  equipment?: Equipment;
  difficulty?: ExerciseDifficulty;
  homeOnly?: boolean;
  bodyweightOnly?: boolean;
  favoriteIds?: Set<string>;
  favoritesOnly?: boolean;
}

export function filterExercises(filters: ExerciseFilters): Exercise[] {
  return EXERCISE_LIBRARY.filter((e) => {
    if (filters.query) {
      const q = filters.query.toLowerCase();
      const matches = e.name.toLowerCase().includes(q) || e.alternativeNames.some((n) => n.toLowerCase().includes(q));
      if (!matches) return false;
    }
    if (filters.muscleGroup && e.primaryMuscle !== filters.muscleGroup && !e.secondaryMuscles.includes(filters.muscleGroup)) return false;
    if (filters.equipment && !e.equipment.includes(filters.equipment)) return false;
    if (filters.difficulty && e.difficulty !== filters.difficulty) return false;
    if (filters.homeOnly && !e.isHomeFriendly) return false;
    if (filters.bodyweightOnly && !e.isBodyweight) return false;
    if (filters.favoritesOnly && !filters.favoriteIds?.has(e.id)) return false;
    return true;
  });
}

export function exercisesForMuscle(muscle: MuscleGroup): Exercise[] {
  return EXERCISE_LIBRARY.filter((e) => e.primaryMuscle === muscle || e.secondaryMuscles.includes(muscle));
}
