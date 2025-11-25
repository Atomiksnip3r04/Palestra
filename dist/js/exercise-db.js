export const EXERCISE_DB = {
    // Chest
    "panca piana": ["chest", "triceps", "front-delts"],
    "panca inclinata": ["upper-chest", "triceps", "front-delts"],
    "croci": ["chest"],
    "chest press": ["chest", "triceps"],
    "piegamenti": ["chest", "abs"],
    "bench press": ["chest", "triceps", "front-delts"],
    "push up": ["chest", "abs"],
    "dips": ["chest", "triceps"],

    // Back
    "trazioni": ["lats", "biceps", "traps"],
    "lat machine": ["lats", "biceps"],
    "pulley": ["lats", "rhomboids", "biceps"],
    "rematore": ["lats", "rhomboids", "biceps", "lower-back"],
    "pull up": ["lats", "biceps"],
    "row": ["lats", "rhomboids"],
    "deadlift": ["hamstrings", "glutes", "lower-back", "traps"],
    "stacco": ["hamstrings", "glutes", "lower-back", "traps"],

    // Legs
    "squat": ["quads", "glutes", "core"],
    "pressa": ["quads", "glutes"],
    "leg extension": ["quads"],
    "leg curl": ["hamstrings"],
    "affondi": ["quads", "glutes"],
    "calfs": ["calves"],
    "polpacci": ["calves"],

    // Shoulders
    "military press": ["front-delts", "triceps", "core"],
    "lento avanti": ["front-delts", "triceps"],
    "alzate laterali": ["side-delts"],
    "alzate frontali": ["front-delts"],
    "shoulder press": ["front-delts", "triceps"],

    // Arms
    "curl": ["biceps"],
    "curl manubri": ["biceps"],
    "curl bilanciere": ["biceps"],
    "french press": ["triceps"],
    "push down": ["triceps"],
    "tricipiti": ["triceps"],

    // Core
    "crunch": ["abs"],
    "plank": ["abs", "core"],
    "leg raise": ["abs"]
};

export const MUSCLE_GROUPS = {
    "chest": { label: "Pettorali", group: "push" },
    "upper-chest": { label: "Petto Alto", group: "push" },
    "lats": { label: "Dorsali", group: "pull" },
    "traps": { label: "Trapezio", group: "pull" },
    "rhomboids": { label: "Centro Schiena", group: "pull" },
    "lower-back": { label: "Lombari", group: "pull" },
    "front-delts": { label: "Spalle Anteriori", group: "push" },
    "side-delts": { label: "Spalle Laterali", group: "push" },
    "rear-delts": { label: "Spalle Posteriori", group: "pull" },
    "biceps": { label: "Bicipiti", group: "pull" },
    "triceps": { label: "Tricipiti", group: "push" },
    "forearms": { label: "Avambracci", group: "pull" },
    "abs": { label: "Addominali", group: "core" },
    "core": { label: "Core", group: "core" },
    "glutes": { label: "Glutei", group: "legs" },
    "quads": { label: "Quadricipiti", group: "legs" },
    "hamstrings": { label: "Femorali", group: "legs" },
    "calves": { label: "Polpacci", group: "legs" }
};

