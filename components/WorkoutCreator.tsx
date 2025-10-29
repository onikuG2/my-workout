import React, { useState, useEffect } from 'react';
import { Workout, Exercise } from '../types';
import TrashIcon from './icons/TrashIcon';
import PlusIcon from './icons/PlusIcon';

interface WorkoutCreatorProps {
  onSave: (workout: Workout) => void;
  onCancel: () => void;
  workoutToEdit?: Workout | null;
}

const presetExercises = {
  '全身': ['バーピー', 'ジャンピングジャック', 'マウンテンクライマー', 'スクワットジャンプ'],
  '胸': ['プッシュアップ', 'インクラインプッシュアップ', 'デクラインプッシュアップ', 'ダンベルプレス', 'ダンベルフライ'],
  '背中': ['懸垂', 'ベントオーバーロウ', 'スーパーマン', 'デッドリフト'],
  '脚': ['スクワット', 'ランジ', 'ブルガリアンスクワット', 'レッグプレス', 'カーフレイズ', 'ヒップスラスト'],
  '肩': ['ショルダープレス', 'サイドレイズ', 'フロントレイズ', 'フェイスプル'],
  '腕': ['バイセップスカール', 'トライセップスエクステンション', 'ハンマーカール', 'ディップス'],
  '体幹': ['プランク', 'クランチ', 'レッグレイズ', 'ロシアンツイスト', 'バイシクルクランチ']
};

const allPresetNames = Object.values(presetExercises).flat();

const durationPresets = Array.from({ length: 10 }, (_, i) => (i + 1) * 30); // 30...300
const weightPresets = Array.from({ length: 20 }, (_, i) => (i + 1) * 5); // 5...100
const repsPresets = Array.from({ length: 10 }, (_, i) => (i + 1) * 5); // 5...50

const formatDurationForDisplay = (seconds: number): string => {
  if (seconds < 60) {
    return `${seconds} 秒`;
  }
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  if (remainingSeconds === 0) {
    return `${minutes} 分`;
  }
  return `${minutes} 分 ${remainingSeconds} 秒`;
};


const WorkoutCreator: React.FC<WorkoutCreatorProps> = ({ onSave, onCancel, workoutToEdit }) => {
  const [name, setName] = useState('');
  const [exercises, setExercises] = useState<Exercise[]>([
    { id: `ex-${Date.now()}`, name: '', duration: 60, weight: undefined, reps: undefined },
  ]);
  
  useEffect(() => {
    if (workoutToEdit) {
      setName(workoutToEdit.name);
      setExercises(workoutToEdit.exercises);
    } else {
      setName('');
      setExercises([{ id: `ex-${Date.now()}`, name: '', duration: 60, weight: undefined, reps: undefined }]);
    }
  }, [workoutToEdit]);


  const handleExerciseChange = (id: string, field: keyof Omit<Exercise, 'id'>, value: string) => {
    setExercises(prevExercises =>
      prevExercises.map(ex => {
        if (ex.id === id) {
          const updatedEx = { ...ex };
          if (field === 'name') {
            updatedEx.name = value;
          } else {
            const numValue = parseInt(value, 10);
             if (field === 'duration') {
                updatedEx.duration = isNaN(numValue) ? 0 : numValue;
            } else { // weight or reps
                updatedEx[field] = isNaN(numValue) || value === '' ? undefined : numValue;
            }
          }
          return updatedEx;
        }
        return ex;
      })
    );
  };

  const addExercise = () => {
    setExercises([
      ...exercises,
      { id: `ex-${Date.now()}-${Math.random()}`, name: '', duration: 60, weight: undefined, reps: undefined },
    ]);
  };

  const removeExercise = (id: string) => {
    if (exercises.length > 1) {
      setExercises(exercises.filter(ex => ex.id !== id));
    } else {
      alert('ワークアウトには少なくとも1つのエクササイズが必要です。');
    }
  };

  const handleSave = () => {
    if (!name.trim()) {
      alert('ワークアウト名を入力してください。');
      return;
    }
    if (exercises.some(ex => !ex.name.trim() || !ex.duration || ex.duration <= 0)) {
      alert('すべてのエクササイズに名前と0より大きい時間を入力してください。');
      return;
    }
    const workoutData: Workout = {
      id: workoutToEdit ? workoutToEdit.id : `wo-${Date.now()}`,
      name,
      exercises,
    };
    onSave(workoutData);
  };

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-center text-cyan-400">
        {workoutToEdit ? 'ワークアウトを編集' : '新しいワークアウトを作成'}
      </h2>

      <div>
        <label htmlFor="workout-name" className="block text-sm font-medium text-gray-300 mb-1">
          ワークアウト名
        </label>
        <input
          type="text"
          id="workout-name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="例：全身トレーニング"
          className="w-full bg-gray-700 border border-gray-600 rounded-md py-2 px-3 text-white focus:ring-cyan-500 focus:border-cyan-500"
        />
      </div>

      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-gray-200">エクササイズ</h3>
        {exercises.map((exercise) => {
            const selectedName = allPresetNames.includes(exercise.name) ? exercise.name : '_custom_';
            const selectedDuration = durationPresets.includes(exercise.duration) ? String(exercise.duration) : '_custom_';
            const selectedWeight = exercise.weight !== undefined && weightPresets.includes(exercise.weight) ? String(exercise.weight) : '_custom_';
            const selectedReps = exercise.reps !== undefined && repsPresets.includes(exercise.reps) ? String(exercise.reps) : '_custom_';
            
            return (
              <div key={exercise.id} className="p-5 pr-12 bg-gray-700/50 rounded-lg space-y-3 relative">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                        <label htmlFor={`ex-preset-${exercise.id}`} className="block text-xs font-medium text-gray-400">エクササイズ名</label>
                        <select
                            id={`ex-preset-${exercise.id}`}
                            value={selectedName}
                            onChange={(e) => {
                                const value = e.target.value;
                                handleExerciseChange(exercise.id, 'name', value === '_custom_' ? '' : value);
                            }}
                            className="w-full mt-1 bg-gray-600 border-gray-500 rounded-md py-2 px-3 text-sm focus:ring-cyan-500 focus:border-cyan-500"
                        >
                            <option value="_custom_">その他（自由入力）</option>
                            {Object.entries(presetExercises).map(([group, list]) => (
                                <optgroup label={group} key={group}>
                                    {list.map(exName => <option key={exName} value={exName}>{exName}</option>)}
                                </optgroup>
                            ))}
                        </select>
                        {selectedName === '_custom_' && (
                             <input
                                type="text"
                                id={`ex-name-${exercise.id}`}
                                value={exercise.name}
                                onChange={(e) => handleExerciseChange(exercise.id, 'name', e.target.value)}
                                placeholder="カスタムエクササイズ名"
                                className="w-full mt-2 bg-gray-600 border-gray-500 rounded-md py-2 px-3 text-sm focus:ring-cyan-500 focus:border-cyan-500"
                            />
                        )}
                    </div>
                    <div>
                        <label htmlFor={`ex-duration-select-${exercise.id}`} className="block text-xs font-medium text-gray-400">時間</label>
                        <select
                            id={`ex-duration-select-${exercise.id}`}
                            value={selectedDuration}
                            onChange={(e) => handleExerciseChange(exercise.id, 'duration', e.target.value === '_custom_' ? '' : e.target.value)}
                            className="w-full mt-1 bg-gray-600 border-gray-500 rounded-md py-2 px-3 text-sm focus:ring-cyan-500 focus:border-cyan-500"
                        >
                            <option value="_custom_">任意入力</option>
                            {durationPresets.map(d => <option key={d} value={d}>{formatDurationForDisplay(d)}</option>)}
                        </select>
                        {selectedDuration === '_custom_' && (
                            <input
                                type="number"
                                id={`ex-duration-custom-${exercise.id}`}
                                value={exercise.duration || ''}
                                onChange={(e) => handleExerciseChange(exercise.id, 'duration', e.target.value)}
                                placeholder="秒数を入力 (例: 45)"
                                min="1"
                                className="w-full mt-2 bg-gray-600 border-gray-500 rounded-md py-2 px-3 text-sm focus:ring-cyan-500 focus:border-cyan-500"
                            />
                        )}
                    </div>
                     <div>
                        <label htmlFor={`ex-weight-select-${exercise.id}`} className="block text-xs font-medium text-gray-400">重量（kg、任意）</label>
                        <select
                            id={`ex-weight-select-${exercise.id}`}
                            value={selectedWeight}
                            onChange={(e) => handleExerciseChange(exercise.id, 'weight', e.target.value === '_custom_' ? '' : e.target.value)}
                            className="w-full mt-1 bg-gray-600 border-gray-500 rounded-md py-2 px-3 text-sm focus:ring-cyan-500 focus:border-cyan-500"
                        >
                            <option value="_custom_">任意入力</option>
                            {weightPresets.map(w => <option key={w} value={w}>{w} kg</option>)}
                        </select>
                        {selectedWeight === '_custom_' && (
                             <input
                                type="number"
                                id={`ex-weight-custom-${exercise.id}`}
                                value={exercise.weight ?? ''}
                                onChange={(e) => handleExerciseChange(exercise.id, 'weight', e.target.value)}
                                placeholder="例：20"
                                min="0"
                                className="w-full mt-2 bg-gray-600 border-gray-500 rounded-md py-2 px-3 text-sm focus:ring-cyan-500 focus:border-cyan-500"
                            />
                        )}
                    </div>
                     <div>
                        <label htmlFor={`ex-reps-select-${exercise.id}`} className="block text-xs font-medium text-gray-400">回数（任意）</label>
                         <select
                            id={`ex-reps-select-${exercise.id}`}
                            value={selectedReps}
                            onChange={(e) => handleExerciseChange(exercise.id, 'reps', e.target.value === '_custom_' ? '' : e.target.value)}
                            className="w-full mt-1 bg-gray-600 border-gray-500 rounded-md py-2 px-3 text-sm focus:ring-cyan-500 focus:border-cyan-500"
                        >
                            <option value="_custom_">任意入力</option>
                            {repsPresets.map(r => <option key={r} value={r}>{r} 回</option>)}
                        </select>
                        {selectedReps === '_custom_' && (
                            <input
                                type="number"
                                id={`ex-reps-custom-${exercise.id}`}
                                value={exercise.reps ?? ''}
                                onChange={(e) => handleExerciseChange(exercise.id, 'reps', e.target.value)}
                                placeholder="例：12"
                                min="0"
                                className="w-full mt-2 bg-gray-600 border-gray-500 rounded-md py-2 px-3 text-sm focus:ring-cyan-500 focus:border-cyan-500"
                            />
                        )}
                    </div>
                </div>
                <button
                  onClick={() => removeExercise(exercise.id)}
                  className="absolute top-3 right-3 p-2 text-gray-400 hover:text-red-500 rounded-full hover:bg-gray-600 transition-colors"
                  aria-label="エクササイズを削除"
                >
                  <TrashIcon className="w-5 h-5" />
                </button>
              </div>
            );
        })}
        <button
          onClick={addExercise}
          className="w-full flex items-center justify-center py-2 px-4 border-2 border-dashed border-gray-600 text-gray-400 rounded-md hover:border-cyan-500 hover:text-cyan-500 transition-colors"
        >
          <PlusIcon className="w-5 h-5 mr-2" />
          エクササイズを追加
        </button>
      </div>
      
      <div className="flex justify-end space-x-4 pt-4">
        <button
          onClick={onCancel}
          className="py-2 px-6 bg-gray-600 text-white font-semibold rounded-lg hover:bg-gray-500 transition-colors"
        >
          キャンセル
        </button>
        <button
          onClick={handleSave}
          className="py-2 px-6 bg-cyan-500 text-white font-semibold rounded-lg hover:bg-cyan-600 transition-colors"
        >
          ワークアウトを保存
        </button>
      </div>
    </div>
  );
};

export default WorkoutCreator;