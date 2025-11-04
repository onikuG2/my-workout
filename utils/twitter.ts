import { Workout, WorkoutHistoryEntry, Exercise } from '../types';

const SERVICE_URL = 'https://myworkout.odenman.me/';

const formatExerciseDetail = (ex: Exercise, index: number): string => {
  const parts: string[] = [];
  parts.push(`${index + 1}. ${ex.name}`);
  
  if (ex.duration > 0) parts.push(`時間: ${ex.duration}秒`);
  if (ex.reps > 0) parts.push(`回数: ${ex.reps}回`);
  if (ex.sets && ex.sets > 0) parts.push(`セット: ${ex.sets}`);
  if (ex.restDuration && ex.restDuration > 0) parts.push(`休憩: ${ex.restDuration}秒`);
  if (ex.weight && ex.weight > 0) parts.push(`重量: ${ex.weight}kg`);
  
  return parts.join(' / ');
};

export const createTweetText = (
  workoutName: string, 
  totalDuration: number, 
  exercises?: Exercise[]
): string => {
  const minutes = Math.floor(totalDuration / 60);
  const seconds = totalDuration % 60;
  const durationText = minutes > 0 ? `${minutes}分${seconds}秒` : `${seconds}秒`;
  
  let text = `🏋️ ${workoutName} を完了しました！\n\n⏱️ 時間: ${durationText}\n💪 エクササイズ数: ${exercises?.length || 0}種目\n\n`;
  
  if (exercises && exercises.length > 0) {
    text += '📋 エクササイズ詳細:\n';
    exercises.forEach((ex, index) => {
      text += `${formatExerciseDetail(ex, index)}\n`;
    });
    text += '\n';
  }
  
  text += `${SERVICE_URL}\n\n#マイワークアウト #ワークアウト #筋トレ`;
  
  return text;
};

export const createTweetUrl = (text: string): string => {
  const encodedText = encodeURIComponent(text);
  const encodedUrl = encodeURIComponent(SERVICE_URL);
  return `https://twitter.com/intent/tweet?text=${encodedText}&url=${encodedUrl}`;
};

export const tweetWorkout = (workout: Workout): void => {
  const totalDuration = workout.exercises.reduce((acc, ex) => {
    return acc + ((ex.duration || 0) + (ex.restDuration || 0)) * (ex.sets || 1);
  }, 0);
  const text = createTweetText(workout.name, totalDuration, workout.exercises);
  const url = createTweetUrl(text);
  window.open(url, '_blank', 'width=550,height=420');
};

export const tweetHistoryEntry = (entry: WorkoutHistoryEntry): void => {
  const text = createTweetText(entry.workoutName, entry.totalDuration, entry.exercises);
  const url = createTweetUrl(text);
  window.open(url, '_blank', 'width=550,height=420');
};
