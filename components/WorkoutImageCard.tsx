
import React, { forwardRef } from 'react';
import { Workout, WorkoutHistoryEntry } from '../types';

interface WorkoutImageCardProps {
  workout?: Workout;
  historyEntry?: WorkoutHistoryEntry;
  onImageReady?: (imageUrl: string) => void;
}

const WorkoutImageCard = forwardRef<HTMLDivElement, WorkoutImageCardProps>(({ workout, historyEntry }, ref) => {

  const formatDuration = (totalSeconds: number) => {
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return minutes > 0 ? `${minutes}分${seconds}秒` : `${seconds}秒`;
  };

  const displayName = workout?.name || historyEntry?.workoutName || '';
  const totalDuration = workout 
    ? workout.exercises.reduce((acc, ex) => acc + ((ex.duration || 0) + (ex.restDuration || 0)) * (ex.sets || 1), 0)
    : (historyEntry?.totalDuration || 0);
  const exercises = workout?.exercises || historyEntry?.exercises || [];

  return (
    <div
      ref={ref}
      className="bg-gray-900 text-white p-8 rounded-lg shadow-xl"
      style={{ width: '800px', minHeight: '600px' }}
    >
      <div className="text-center mb-6">
        <h1 className="text-4xl font-bold text-cyan-400 mb-2">{displayName}</h1>
        <p className="text-xl text-gray-300">ワークアウト完了！</p>
      </div>

      <div className="bg-gray-800 rounded-lg p-6 mb-6">
        <div className="grid grid-cols-2 gap-4 text-center">
          <div>
            <p className="text-gray-400 text-sm mb-1">合計時間</p>
            <p className="text-2xl font-bold text-cyan-400">{formatDuration(totalDuration)}</p>
          </div>
          <div>
            <p className="text-gray-400 text-sm mb-1">エクササイズ数</p>
            <p className="text-2xl font-bold text-cyan-400">{exercises.length}種目</p>
          </div>
        </div>
      </div>

      {exercises.length > 0 && (
        <div className="bg-gray-800 rounded-lg p-6">
          <h2 className="text-2xl font-bold text-gray-200 mb-4">エクササイズ詳細</h2>
          <div className="space-y-3">
            {exercises.map((ex, index) => (
              <div key={ex.id || index} className="bg-gray-700 rounded-lg p-4">
                <div className="flex justify-between items-start mb-2">
                  <h3 className="text-xl font-semibold text-white">{ex.name}</h3>
                  <span className="text-sm text-gray-400">#{index + 1}</span>
                </div>
                <div className="grid grid-cols-4 gap-2 text-sm text-gray-300">
                  {ex.duration > 0 && (
                    <div>
                      <span className="text-gray-400">時間:</span> {ex.duration}秒
                    </div>
                  )}
                  {ex.reps > 0 && (
                    <div>
                      <span className="text-gray-400">回数:</span> {ex.reps}回
                    </div>
                  )}
                  <div>
                    <span className="text-gray-400">セット:</span> {ex.sets || 1}セット
                  </div>
                  {ex.restDuration > 0 && (
                    <div>
                      <span className="text-gray-400">休憩:</span> {ex.restDuration}秒
                    </div>
                  )}
                  {ex.weight > 0 && (
                    <div>
                      <span className="text-gray-400">重量:</span> {ex.weight}kg
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="mt-6 text-center">
        <p className="text-gray-400 text-sm">https://myworkout.odenman.me/</p>
        <p className="text-gray-500 text-xs mt-2">#マイワークアウト #ワークアウト #筋トレ</p>
      </div>
    </div>
  );
});

WorkoutImageCard.displayName = 'WorkoutImageCard';

export default WorkoutImageCard;

