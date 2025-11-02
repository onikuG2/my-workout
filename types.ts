export interface Exercise {
  id: string;
  name: string;
  duration: number; // in seconds
  restDuration?: number; // in seconds, new "Interval"
  sets?: number; // optional
  weight?: number; // optional, in kg
  reps?: number; // optional
}

export interface Workout {
  id:string;
  name: string;
  exercises: Exercise[];
}

export interface WorkoutHistoryEntry {
  id: string;
  workoutName: string;
  completedAt: number; // timestamp
  totalDuration: number; // in seconds
}