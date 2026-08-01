import rawDb from "./data/exercise-db.json";

export type ExerciseCategory =
  | "strength_training"
  | "bodybuilding"
  | "powerlifting"
  | "calisthenics"
  | "cardio"
  | "mobility"
  | "stretching"
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
  | "medicine_ball"
  | "trx";

export const CATEGORY_LABELS: Record<ExerciseCategory, string> = {
  strength_training: "Strength Training",
  bodybuilding: "Bodybuilding",
  powerlifting: "Powerlifting",
  calisthenics: "Calisthenics",
  cardio: "Cardio",
  mobility: "Mobility",
  stretching: "Stretching",
  rehabilitation: "Rehabilitation",
  athletic_performance: "Athletic Performance",
};

export const MUSCLE_GROUPS = [
  "Chest",
  "Upper Chest",
  "Lower Chest",
  "Back",
  "Lats",
  "Traps",
  "Rhomboids",
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
  description?: string;
  instructions: string[];
  /** Relative paths into the free-exercise-db image set — resolve with exerciseImageUrl(). */
  images?: string[];
  commonMistakes?: string[];
  tips?: string[];
  variations?: string[];
  beginnerAlternative?: string;
  advancedVariation?: string;
}

const IMAGE_BASE = "https://cdn.jsdelivr.net/gh/yuhonas/free-exercise-db@main/exercises/";
export function exerciseImageUrl(path: string): string {
  return `${IMAGE_BASE}${path}`;
}

interface RawDbEntry {
  id: string;
  name: string;
  alternativeNames: string[];
  category: string;
  difficulty: string;
  primaryMuscle: string;
  secondaryMuscles: string[];
  equipment: string[];
  isBodyweight: boolean;
  isHomeFriendly: boolean;
  instructions: string[];
  images: string[];
}

type Enrichment = Partial<
  Pick<Exercise, "alternativeNames" | "commonMistakes" | "tips" | "variations" | "beginnerAlternative" | "advancedVariation" | "description">
>;

/**
 * Hand-curated depth (common mistakes, tips, variations, beginner/advanced
 * progressions) for the ~40 most-trained lifts, layered onto the imported
 * free-exercise-db base data below. Keyed by that dataset's exercise id so
 * everything else in the library still gets full name/muscle/equipment/
 * instructions/image coverage without needing hand-written content for
 * all 870+ entries.
 */
const ENRICHMENT: Record<string, Enrichment> = {
  "barbell-bench-press-medium-grip": {
    alternativeNames: ["Bench Press", "Flat Bench Press"],
    commonMistakes: ["Bouncing the bar off the chest", "Flaring elbows to 90°, straining the shoulders", "Lifting the hips off the bench"],
    tips: ["Keep shoulder blades pinched and driven into the bench", "Bar path should be a slight diagonal, not straight up and down", "Drive through your feet for leg drive"],
    variations: ["Incline Barbell Press", "Close-Grip Bench Press", "Spoto Press (pause above chest)"],
    beginnerAlternative: "Machine Chest Press",
    advancedVariation: "Pause Bench Press with chains or bands",
  },
  "barbell-incline-bench-press-medium-grip": {
    alternativeNames: ["Incline Bench Press"],
    commonMistakes: ["Setting the bench too steep, turning it into a shoulder press", "Not controlling the descent"],
    tips: ["30–45° incline targets the upper chest without overloading the front delts", "Keep wrists stacked over elbows at the bottom"],
    variations: ["Incline Dumbbell Press", "Incline Smith Machine Press"],
    beginnerAlternative: "Incline Push-up",
    advancedVariation: "Incline Bench Press with a 2-second pause",
  },
  "dumbbell-bench-press": {
    commonMistakes: ["Letting the dumbbells drift too far apart at the top", "Flaring elbows too wide on the descent"],
    tips: ["Greater range of motion than barbell — let the dumbbells travel below chest level", "Squeeze at the top without clanking the dumbbells together"],
    variations: ["Neutral-Grip Dumbbell Press", "Single-Arm Dumbbell Press"],
    beginnerAlternative: "Push-up",
    advancedVariation: "Dumbbell Bench Press with a 3-second eccentric",
  },
  "dumbbell-flyes": {
    commonMistakes: ["Bending the elbows too much, turning it into a press", "Going too heavy and straining the shoulder joint"],
    tips: ["Keep a soft, fixed bend in the elbows throughout", "Think 'hugging a tree' rather than pressing"],
    variations: ["Incline Dumbbell Flyes", "Cable Crossover"],
    beginnerAlternative: "Pec Deck",
    advancedVariation: "Single-Arm Cable Flye",
  },
  "cable-crossover": {
    commonMistakes: ["Using too much weight and relying on momentum", "Standing too far forward or back, losing the crossing angle"],
    tips: ["Lean slightly forward with a soft knee bend", "Cross the hands slightly at full contraction for peak squeeze"],
    variations: ["Low-to-High Cable Crossover", "Single-Arm Cable Crossover"],
    beginnerAlternative: "Dumbbell Flyes",
    advancedVariation: "Low Cable Crossover (upper chest emphasis)",
  },
  "barbell-squat": {
    alternativeNames: ["Back Squat", "Barbell Back Squat"],
    commonMistakes: ["Knees caving inward", "Losing a neutral spine (excessive rounding)", "Not hitting consistent depth"],
    tips: ["Brace your core like you're about to be punched in the stomach", "Push knees out in line with your toes", "Keep the bar over your mid-foot throughout"],
    variations: ["Front Squat", "Box Squat", "Pause Squat"],
    beginnerAlternative: "Goblet Squat",
    advancedVariation: "Pause Squat or Bands/Chains Squat",
  },
  "bodyweight-squat": {
    alternativeNames: ["Air Squat"],
    commonMistakes: ["Heels lifting off the ground", "Leaning too far forward"],
    tips: ["Keep weight through your whole foot, not just the toes", "Sit back like you're reaching for a low chair"],
    variations: ["Jump Squat", "Sumo Squat"],
    beginnerAlternative: "Box Squat (sit to a chair and stand)",
    advancedVariation: "Pistol Squat",
  },
  "front-squat-clean-grip": {
    alternativeNames: ["Front Squat"],
    commonMistakes: ["Letting the elbows drop, dumping the bar forward", "Excessive forward lean"],
    tips: ["Keep elbows high and pointed forward throughout the lift", "Stay more upright than a back squat"],
    variations: ["Cross-Arm Front Squat", "Front Squat with straps"],
    beginnerAlternative: "Goblet Squat",
    advancedVariation: "Front Squat with a pause at depth",
  },
  "barbell-deadlift": {
    alternativeNames: ["Conventional Deadlift"],
    commonMistakes: ["Rounding the lower back", "Bar drifting away from the shins", "Hyperextending at lockout"],
    tips: ["Take the slack out of the bar before pulling", "Push the floor away with your legs rather than just pulling with your back", "Keep the bar in contact with your legs the whole way up"],
    variations: ["Sumo Deadlift", "Deficit Deadlift", "Trap Bar Deadlift"],
    beginnerAlternative: "Romanian Deadlift with lighter load",
    advancedVariation: "Deficit Deadlift or Deadlift with bands",
  },
  "romanian-deadlift": {
    alternativeNames: ["RDL"],
    commonMistakes: ["Squatting the weight down instead of hinging", "Rounding the back to chase depth"],
    tips: ["Push your hips back first — knees stay softly bent, not driving forward", "Lower until you feel a stretch in the hamstrings, not to the floor"],
    variations: ["Single-Leg RDL", "Dumbbell RDL"],
    beginnerAlternative: "Glute Bridge",
    advancedVariation: "Single-Leg Romanian Deadlift",
  },
  "barbell-hip-thrust": {
    alternativeNames: ["Hip Thrust"],
    commonMistakes: ["Overextending the lower back at the top instead of squeezing glutes", "Bar rolling due to no pad"],
    tips: ["Drive through your heels", "Tuck your chin slightly and squeeze glutes hard at the top"],
    variations: ["Single-Leg Hip Thrust", "Banded Hip Thrust"],
    beginnerAlternative: "Glute Bridge",
    advancedVariation: "Single-Leg Barbell Hip Thrust",
  },
  "goblet-squat": {
    commonMistakes: ["Letting the weight pull you forward onto your toes", "Elbows losing contact with the knees at depth"],
    tips: ["Hold the weight close to your chest", "Use your elbows brushing your knees as a depth cue"],
    variations: ["Kettlebell Front Squat", "Goblet Box Squat"],
    beginnerAlternative: "Bodyweight Squat",
    advancedVariation: "Barbell Back Squat",
  },
  pullups: {
    alternativeNames: ["Pull-up"],
    commonMistakes: ["Using momentum/kipping", "Not achieving full extension at the bottom"],
    tips: ["Start from a full dead hang", "Pull your elbows down and back rather than just up"],
    variations: ["Chin-Up (underhand)", "Weighted Pull-up", "Wide-Grip Pull-up"],
    beginnerAlternative: "Band-Assisted Pull-up or Lat Pulldown",
    advancedVariation: "Weighted Pull-up",
  },
  "bent-over-barbell-row": {
    alternativeNames: ["Barbell Row", "Bent-Over Row"],
    commonMistakes: ["Standing too upright, turning it into a shrug", "Using body English/momentum to heave the weight up"],
    tips: ["Hinge to roughly 45° and keep it fixed throughout the set", "Pull the bar toward your lower ribs, elbows close to the body"],
    variations: ["Pendlay Row", "Underhand Barbell Row"],
    beginnerAlternative: "Seated Cable Row",
    advancedVariation: "Pendlay Row (dead-stop each rep)",
  },
  "seated-cable-rows": {
    alternativeNames: ["Seated Cable Row"],
    commonMistakes: ["Rounding the back to add range of motion", "Leaning back excessively and using momentum"],
    tips: ["Keep your torso mostly still — the movement comes from the arms and shoulder blades", "Squeeze the shoulder blades together at the finish"],
    variations: ["Single-Arm Cable Row", "Wide-Grip Cable Row"],
    beginnerAlternative: "Machine Row",
    advancedVariation: "Single-Arm Seated Cable Row",
  },
  "t-bar-row-with-handle": {
    alternativeNames: ["T-Bar Row"],
    commonMistakes: ["Jerking the weight up with the lower back", "Not achieving a full stretch at the bottom"],
    tips: ["Keep your chest up and core braced throughout", "Drive elbows back, not out to the sides"],
    variations: ["Chest-Supported T-Bar Row"],
    beginnerAlternative: "Seated Cable Row",
    advancedVariation: "Single-Arm T-Bar Row",
  },
  "wide-grip-lat-pulldown": {
    alternativeNames: ["Lat Pulldown"],
    commonMistakes: ["Leaning back too far and turning it into a row", "Pulling behind the neck"],
    tips: ["Lead with your elbows, driving them down toward your hips", "Pull to your upper chest, not your neck"],
    variations: ["Close-Grip Pulldown", "Single-Arm Pulldown"],
    beginnerAlternative: "Assisted Pulldown machine (lighter stack)",
    advancedVariation: "Single-Arm Lat Pulldown",
  },
  "standing-military-press": {
    alternativeNames: ["Overhead Press", "Military Press"],
    commonMistakes: ["Excessive lower-back arch to compensate for tight shoulders", "Pressing the bar forward instead of straight up"],
    tips: ["Squeeze your glutes and brace your core to protect the lower back", "Move your head back slightly as the bar passes your face, then push it through at the top"],
    variations: ["Push Press", "Seated Barbell Press"],
    beginnerAlternative: "Dumbbell Shoulder Press",
    advancedVariation: "Push Press (with leg drive)",
  },
  "dumbbell-shoulder-press": {
    commonMistakes: ["Flaring elbows too far back, stressing the shoulder", "Arching the lower back excessively"],
    tips: ["Keep your core tight and avoid leaning back", "Press up and slightly inward so the dumbbells finish near each other overhead"],
    variations: ["Arnold Press", "Seated Dumbbell Press"],
    beginnerAlternative: "Machine Shoulder Press",
    advancedVariation: "Single-Arm Dumbbell Press",
  },
  "face-pull": {
    commonMistakes: ["Using too much weight and losing the high-elbow position", "Pulling straight back instead of toward the face"],
    tips: ["Pull toward your forehead with elbows high, externally rotating at the finish", "Great finisher for shoulder health — keep the weight light"],
    variations: ["Band Face Pull", "Rope Face Pull to overhead"],
    beginnerAlternative: "Band Pull-Apart",
    advancedVariation: "Face Pull with external rotation hold",
  },
  "barbell-curl": {
    commonMistakes: ["Swinging the torso to generate momentum", "Flaring elbows forward at the top"],
    tips: ["Keep elbows pinned to your sides throughout", "Control the eccentric (lowering) portion instead of dropping the weight"],
    variations: ["EZ-Bar Curl", "Wide-Grip Barbell Curl"],
    beginnerAlternative: "Dumbbell Curl",
    advancedVariation: "21s (7 bottom-half, 7 top-half, 7 full reps)",
  },
  "dumbbell-bicep-curl": {
    alternativeNames: ["Dumbbell Curl"],
    commonMistakes: ["Letting the elbow drift forward as the weight gets heavy", "Using momentum from the shoulders"],
    tips: ["Rotate your palm to fully face up (supinate) as you curl", "Keep a slight bend in the elbow at the bottom rather than locking out"],
    variations: ["Alternating Dumbbell Curl", "Concentration Curl"],
    beginnerAlternative: "Cable Curl (constant, lighter tension)",
    advancedVariation: "Incline Dumbbell Curl",
  },
  "hammer-curls": {
    alternativeNames: ["Hammer Curl"],
    commonMistakes: ["Swinging the weight up using body momentum"],
    tips: ["Neutral grip (palms facing each other) shifts emphasis onto the brachialis and forearms", "Keep elbows fixed at your sides"],
    variations: ["Cross-Body Hammer Curl", "Cable Hammer Curl with rope"],
    beginnerAlternative: "Lighter dumbbell hammer curl, seated",
    advancedVariation: "Cross-Body Hammer Curl",
  },
  "preacher-curl": {
    commonMistakes: ["Not fully extending the arm at the bottom", "Bouncing out of the stretched position"],
    tips: ["The preacher bench removes momentum — control every rep strictly", "Stop just short of full lockout to keep tension on the biceps"],
    variations: ["Dumbbell Preacher Curl", "Cable Preacher Curl"],
    beginnerAlternative: "Dumbbell Curl",
    advancedVariation: "Single-Arm Preacher Curl",
  },
  "triceps-pushdown": {
    alternativeNames: ["Tricep Pushdown", "Cable Pushdown"],
    commonMistakes: ["Letting the elbows drift away from the body", "Using shoulder movement to assist"],
    tips: ["Keep elbows pinned to your sides — only the forearms move", "Fully extend at the bottom and squeeze the triceps"],
    variations: ["Rope Pushdown", "Reverse-Grip Pushdown"],
    beginnerAlternative: "Machine Tricep Extension",
    advancedVariation: "Single-Arm Rope Pushdown",
  },
  "ez-bar-skullcrusher": {
    alternativeNames: ["Skull Crushers", "Lying Tricep Extension"],
    commonMistakes: ["Flaring the elbows out as the weight gets heavy", "Lowering the bar toward the forehead instead of behind the head"],
    tips: ["Keep upper arms vertical and stationary — only the forearms move", "Lower the bar toward your forehead or just behind it, not your chest"],
    variations: ["Dumbbell Skull Crusher", "Cable Skull Crusher"],
    beginnerAlternative: "Overhead Dumbbell Tricep Extension",
    advancedVariation: "Skull Crusher to Press combo",
  },
  "dips-triceps-version": {
    alternativeNames: ["Triceps Dips"],
    commonMistakes: ["Going too deep and straining the shoulder joint", "Flaring elbows wide (shifts to chest, increases shoulder strain)"],
    tips: ["Stay upright with elbows close to the body to bias the triceps", "Stop when your upper arm is roughly parallel to the floor"],
    variations: ["Bench Dips", "Weighted Dips"],
    beginnerAlternative: "Bench Dips",
    advancedVariation: "Weighted Dips",
  },
  plank: {
    commonMistakes: ["Letting the hips sag toward the floor", "Hiking the hips up too high"],
    tips: ["Squeeze your glutes and brace your abs like you're about to be poked", "Keep a straight line from head to heels"],
    variations: ["Side Plank", "Plank with shoulder taps"],
    beginnerAlternative: "Incline Plank (hands on a bench)",
    advancedVariation: "Plank with a weight plate on the back",
  },
  "hanging-leg-raise": {
    commonMistakes: ["Swinging the body to generate momentum", "Only using the hip flexors without curling the pelvis"],
    tips: ["Curl your pelvis up at the top rather than just lifting the legs", "Control the descent — don't let your legs drop"],
    variations: ["Knee Raise", "Toes-to-Bar"],
    beginnerAlternative: "Lying Leg Raise",
    advancedVariation: "Toes-to-Bar",
  },
  "russian-twist": {
    commonMistakes: ["Moving only the arms instead of rotating through the torso", "Rounding the lower back"],
    tips: ["Keep your chest up and rotate from your ribcage", "Add a weight or medicine ball to increase difficulty"],
    variations: ["Weighted Russian Twist", "Cable Russian Twist"],
    beginnerAlternative: "Seated Torso Rotation (feet down)",
    advancedVariation: "Russian Twist with feet elevated",
  },
  "leg-press": {
    commonMistakes: ["Locking out the knees hard at the top", "Letting the lower back round off the pad at the bottom"],
    tips: ["Keep your lower back flush against the pad throughout", "Don't lower further than your hips can control without rounding"],
    variations: ["Single-Leg Press", "Narrow-Stance Leg Press"],
    beginnerAlternative: "Bodyweight Squat",
    advancedVariation: "Single-Leg Press",
  },
  "lying-leg-curls": {
    alternativeNames: ["Leg Curl"],
    commonMistakes: ["Using momentum by lifting the hips off the pad", "Not controlling the eccentric"],
    tips: ["Keep your hips pressed into the pad throughout", "Squeeze at the top for a full second"],
    variations: ["Seated Leg Curl", "Standing Single-Leg Curl"],
    beginnerAlternative: "Stability Ball Leg Curl",
    advancedVariation: "Single-Leg Lying Curl",
  },
  "leg-extensions": {
    alternativeNames: ["Leg Extension"],
    commonMistakes: ["Using momentum/swinging the weight up", "Locking out hard and slamming the weight down"],
    tips: ["Pause and squeeze the quads at the top of each rep", "Control the weight back down slowly"],
    variations: ["Single-Leg Extension"],
    beginnerAlternative: "Bodyweight Squat",
    advancedVariation: "Single-Leg Extension with a pause",
  },
  "dumbbell-lunges": {
    alternativeNames: ["Walking Lunge"],
    commonMistakes: ["Letting the front knee travel far past the toes", "Taking too short a step, reducing glute involvement"],
    tips: ["Take a stride long enough that your front shin stays roughly vertical", "Keep your torso upright throughout"],
    variations: ["Reverse Lunge", "Bulgarian Split Squat"],
    beginnerAlternative: "Bodyweight Reverse Lunge",
    advancedVariation: "Bulgarian Split Squat",
  },
  "one-arm-kettlebell-swings": {
    alternativeNames: ["Kettlebell Swing"],
    commonMistakes: ["Squatting the weight instead of hinging", "Using the arms to lift instead of hip drive"],
    tips: ["This is a hip hinge, not a squat — power comes from snapping the hips forward", "The arms are just along for the ride"],
    variations: ["Two-Arm Kettlebell Swing", "American Swing (overhead)"],
    beginnerAlternative: "Two-Arm Kettlebell Swing with a lighter bell",
    advancedVariation: "Single-Arm American Swing",
  },
  "barbell-shrug": {
    commonMistakes: ["Rolling the shoulders instead of a straight vertical shrug", "Using the arms/biceps to help lift"],
    tips: ["Shrug straight up toward your ears, then pause and squeeze", "Keep arms straight — they're just hooks holding the bar"],
    variations: ["Dumbbell Shrug", "Behind-the-Back Barbell Shrug"],
    beginnerAlternative: "Dumbbell Shrug",
    advancedVariation: "Barbell Shrug with a 2-second hold at the top",
  },
  "good-morning": {
    commonMistakes: ["Rounding the lower back", "Bending the knees too much, turning it into a squat"],
    tips: ["Keep a soft knee bend and hinge from the hips, chest proud", "Start light — this is an advanced posterior-chain movement"],
    variations: ["Seated Good Morning", "Band Good Morning"],
    beginnerAlternative: "Romanian Deadlift",
    advancedVariation: "Good Morning off pins from a dead stop",
  },
  "barbell-glute-bridge": {
    alternativeNames: ["Glute Bridge"],
    commonMistakes: ["Overarching the lower back instead of squeezing glutes", "Feet placed too far from the hips"],
    tips: ["Drive through your heels and squeeze glutes hard at the top", "Keep your chin tucked slightly"],
    variations: ["Single-Leg Glute Bridge", "Banded Glute Bridge"],
    beginnerAlternative: "Bodyweight Glute Bridge",
    advancedVariation: "Barbell Hip Thrust",
  },
  "donkey-calf-raises": {
    alternativeNames: ["Calf Raise"],
    commonMistakes: ["Using a short, bouncy range of motion", "Not reaching a full stretch at the bottom"],
    tips: ["Pause briefly at the top and bottom of each rep", "Go slow — calves respond well to time under tension"],
    variations: ["Seated Calf Raise", "Single-Leg Calf Raise"],
    beginnerAlternative: "Bodyweight Standing Calf Raise",
    advancedVariation: "Single-Leg Calf Raise",
  },
};

const HAND_ADDED: Exercise[] = [
  {
    id: "smith-machine-squat",
    name: "Smith Machine Squat",
    alternativeNames: [],
    category: "strength_training",
    difficulty: "beginner",
    primaryMuscle: "Quads",
    secondaryMuscles: ["Glutes"],
    equipment: ["smith_machine"],
    isBodyweight: false,
    isHomeFriendly: false,
    instructions: [
      "Set the bar at shoulder height and step under it, resting it across your upper back.",
      "Unrack the bar and position your feet slightly in front of your hips.",
      "Bend your knees and hips to lower into a squat, keeping your torso upright.",
      "Push through your heels to return to standing.",
    ],
    tips: ["The fixed bar path lets you focus purely on depth and leg drive", "Position your feet slightly forward since the bar path is vertical, not natural"],
    beginnerAlternative: "Goblet Squat",
    advancedVariation: "Barbell Back Squat",
  },
  {
    id: "smith-machine-bench-press",
    name: "Smith Machine Bench Press",
    alternativeNames: [],
    category: "strength_training",
    difficulty: "beginner",
    primaryMuscle: "Chest",
    secondaryMuscles: ["Triceps", "Front Delts"],
    equipment: ["smith_machine"],
    isBodyweight: false,
    isHomeFriendly: false,
    instructions: [
      "Lie on a bench positioned under the bar with your eyes roughly under the bar.",
      "Unrack the bar and lower it to your mid-chest with control.",
      "Press the bar back up to full arm extension.",
    ],
    tips: ["The fixed vertical path removes the need to stabilize the bar, useful for isolating chest drive", "Keep shoulder blades pinched throughout"],
    beginnerAlternative: "Machine Chest Press",
    advancedVariation: "Barbell Bench Press",
  },
  {
    id: "smith-machine-shoulder-press",
    name: "Smith Machine Shoulder Press",
    alternativeNames: [],
    category: "strength_training",
    difficulty: "beginner",
    primaryMuscle: "Front Delts",
    secondaryMuscles: ["Side Delts", "Triceps"],
    equipment: ["smith_machine"],
    isBodyweight: false,
    isHomeFriendly: false,
    instructions: [
      "Sit on a bench positioned under the bar with the bar at shoulder height.",
      "Unrack the bar and press it overhead to full extension.",
      "Lower with control back to shoulder height.",
    ],
    tips: ["Keep your core braced to avoid over-arching your lower back", "Great option if overhead stability is limiting your dumbbell press"],
    beginnerAlternative: "Dumbbell Shoulder Press (seated, lighter)",
    advancedVariation: "Standing Barbell Overhead Press",
  },
  {
    id: "trx-row",
    name: "TRX Row",
    alternativeNames: ["Suspension Row"],
    category: "calisthenics",
    difficulty: "beginner",
    primaryMuscle: "Back",
    secondaryMuscles: ["Lats", "Biceps", "Rear Delts"],
    equipment: ["trx"],
    isBodyweight: true,
    isHomeFriendly: true,
    instructions: [
      "Grip the handles and lean back with arms extended, feet under the anchor point, body straight.",
      "Pull your chest toward the handles, driving elbows back and squeezing shoulder blades together.",
      "Lower back down with control to full arm extension.",
    ],
    tips: ["Walk your feet forward to make it easier, or lean back further to increase difficulty", "Keep your body in a straight line — don't let the hips sag"],
    beginnerAlternative: "TRX Row with a more upright body angle",
    advancedVariation: "Single-Arm TRX Row",
  },
  {
    id: "trx-chest-press",
    name: "TRX Chest Press",
    alternativeNames: ["Suspension Chest Press"],
    category: "calisthenics",
    difficulty: "beginner",
    primaryMuscle: "Chest",
    secondaryMuscles: ["Triceps", "Front Delts"],
    equipment: ["trx"],
    isBodyweight: true,
    isHomeFriendly: true,
    instructions: [
      "Face away from the anchor point holding the handles, arms extended, body in a straight plank line.",
      "Bend your elbows to lower your chest toward your hands.",
      "Press back to the starting position.",
    ],
    tips: ["Lean your body forward to increase resistance", "Keep your core braced throughout — this doubles as a core exercise"],
    beginnerAlternative: "Incline Push-up",
    advancedVariation: "Single-Arm TRX Chest Press",
  },
  {
    id: "trx-pike",
    name: "TRX Pike",
    alternativeNames: ["Suspension Pike"],
    category: "calisthenics",
    difficulty: "advanced",
    primaryMuscle: "Abs",
    secondaryMuscles: ["Hip Flexors", "Shoulders"],
    equipment: ["trx"],
    isBodyweight: true,
    isHomeFriendly: true,
    instructions: [
      "Start in a plank position with your feet in the TRX foot cradles.",
      "Keeping your legs straight, raise your hips up toward the ceiling, pulling your feet toward your hands.",
      "Lower back down with control to the plank position.",
    ],
    commonMistakes: ["Letting the hips sag instead of maintaining a plank before piking", "Bending the knees to fake the range of motion"],
    tips: ["Keep your arms locked and let your hips do all the moving", "Slow the eccentric down for extra core demand"],
    beginnerAlternative: "TRX Knee Tuck",
    advancedVariation: "TRX Pike to Push-up combo",
  },
  {
    id: "trx-pistol-squat",
    name: "TRX Assisted Pistol Squat",
    alternativeNames: ["Suspension Pistol Squat"],
    category: "calisthenics",
    difficulty: "advanced",
    primaryMuscle: "Quads",
    secondaryMuscles: ["Glutes", "Hamstrings"],
    equipment: ["trx"],
    isBodyweight: true,
    isHomeFriendly: true,
    instructions: [
      "Hold the TRX handles for balance, facing the anchor point.",
      "Extend one leg forward off the ground and lower down on the standing leg using the straps for balance.",
      "Push back up to standing through the working leg.",
    ],
    commonMistakes: ["Relying too heavily on the straps instead of the working leg", "Letting the knee cave inward"],
    tips: ["Use just enough assistance from the straps to maintain balance, not to do the lifting", "Go as low as your mobility allows with control"],
    beginnerAlternative: "TRX-Assisted Split Squat",
    advancedVariation: "Unassisted Pistol Squat",
  },
];

function toExercise(e: RawDbEntry): Exercise {
  const enrichment = ENRICHMENT[e.id] ?? {};
  return {
    id: e.id,
    name: e.name,
    alternativeNames: enrichment.alternativeNames ?? e.alternativeNames,
    category: e.category as ExerciseCategory,
    difficulty: e.difficulty as ExerciseDifficulty,
    primaryMuscle: e.primaryMuscle as MuscleGroup,
    secondaryMuscles: e.secondaryMuscles as MuscleGroup[],
    equipment: e.equipment as Equipment[],
    isBodyweight: e.isBodyweight,
    isHomeFriendly: e.isHomeFriendly,
    instructions: e.instructions,
    images: e.images,
    ...enrichment,
  };
}

export const EXERCISE_LIBRARY: Exercise[] = [...(rawDb as RawDbEntry[]).map(toExercise), ...HAND_ADDED];

export function findExercise(id: string): Exercise | undefined {
  return EXERCISE_LIBRARY.find((e) => e.id === id);
}

export interface ExerciseFilters {
  query?: string;
  muscleGroup?: MuscleGroup;
  equipment?: Equipment;
  category?: ExerciseCategory;
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
      const matches =
        e.name.toLowerCase().includes(q) ||
        e.alternativeNames.some((n) => n.toLowerCase().includes(q)) ||
        e.primaryMuscle.toLowerCase().includes(q) ||
        e.secondaryMuscles.some((m) => m.toLowerCase().includes(q)) ||
        e.equipment.some((eq) => eq.replace("_", " ").includes(q));
      if (!matches) return false;
    }
    if (filters.muscleGroup && e.primaryMuscle !== filters.muscleGroup && !e.secondaryMuscles.includes(filters.muscleGroup)) return false;
    if (filters.equipment && !e.equipment.includes(filters.equipment)) return false;
    if (filters.category && e.category !== filters.category) return false;
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
