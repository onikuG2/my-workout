
import React, { useState, useEffect } from 'react';
import { Workout, Exercise } from '../types';
import TrashIcon from './icons/TrashIcon';
import PlusIcon from './icons/PlusIcon';
import { useAlert } from './AlertProvider';

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

const durationPresets = [0, 15, 30, 45, 60, 90, 120, 150, 180, 240, 300]; // 0s to 5min
const restPresets = [0, 15, 30, 45, 60, 90, 120, 180]; // 0s to 3min
const weightPresets = [0, ...Array.from({ length: 40 }, (_, i) => (i + 1) * 2.5)]; // 0kg to 100kg
const setsPresets = Array.from({ length: 10 }, (_, i) => i + 1); // 1 to 10
const repsPresets = [0, ...Array.from({ length: 19 }, (_, i) => i + 2), 25, 30, 50]; // 0, 2-20, 25, 30, 50

const WorkoutCreator: React.FC<WorkoutCreatorProps> = ({ onSave, onCancel, workoutToEdit }) => {
  const [workout, setWorkout] = useState<Workout>({
      id: `wo-${Date.now()}`,
      name: '',
      exercises: [],
    });
  const { showAlert } = useAlert();

  useEffect(() => {
    if (workoutToEdit) {
      setWorkout(workoutToEdit);
    } else {
      // Set a default empty state for new workouts
      setWorkout({
        id: `wo-${Date.now()}`,
        name: '',
        exercises: [],
      });
    }
  }, [workoutToEdit]);

  const handleWorkoutNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setWorkout({ ...workout, name: e.target.value });
  };

  const handleExerciseChange = (index: number, field: keyof Exercise, value: string | number) => {
    const newExercises = [...workout.exercises];
    const exercise = { ...newExercises[index] };

    // Update the field with either string (for name) or number
    (exercise as any)[field] = (field === 'name') ? value : Number(value);
    
    newExercises[index] = exercise;
    setWorkout({ ...workout, exercises: newExercises });
  };


  const addExercise = () => {
    const newExercise: Exercise = {
      id: `ex-${Date.now()}-${Math.random()}`,
      name: '',
      duration: 30,
      restDuration: 15,
      sets: 3,
      reps: 0, // Default to time-based
      weight: 0,
    };
    setWorkout({
      ...workout,
      exercises: [...workout.exercises, newExercise],
    });
  };

  const removeExercise = (index: number) => {
    const newExercises = workout.exercises.filter((_, i) => i !== index);
    setWorkout({ ...workout, exercises: newExercises });
  };

  const handleSave = () => {
    if (!workout.name.trim()) {
      showAlert('ワークアウト名を入力してください。', '入力エラー');
      return;
    }
    if (workout.exercises.length === 0) {
      showAlert('少なくとも1つのエクササイズを追加してください。', '入力エラー');
      return;
    }
    for (const ex of workout.exercises) {
      if (!ex.name.trim()) {
        showAlert('すべてのエクササイズに名前を入力してください。', '入力エラー');
        return;
      }
       if ((!ex.duration || ex.duration <= 0) && (!ex.reps || ex.reps <= 0)) {
        showAlert(`「${ex.name}」には時間または回数のいずれかを0より大きい値に設定してください。`, '入力エラー');
        return;
      }
    }
    onSave(workout);
  };
  
  const InputField = ({ label, children }: { label: string; children: React.ReactNode }) => (
    <div className="flex flex-col">
        <label className="text-sm font-medium text-gray-400 mb-1">{label}</label>
        {children}
    </div>
  );

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-cyan-400 mb-4">
          {workoutToEdit ? 'ワークアウトの編集' : '新しいワークアウトの作成'}
        </h2>
        <input
          type="text"
          value={workout.name}
          onChange={handleWorkoutNameChange}
          placeholder="ワークアウト名 (例: 全身HIIT)"
          className="w-full bg-gray-700 border border-gray-600 rounded-lg p-3 text-lg focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition"
        />
      </div>

      <div className="space-y-4">
        {workout.exercises.map((exercise, index) => (
          <div key={exercise.id} className="bg-gray-700/50 p-4 rounded-lg space-y-4 border border-gray-600">
            <div className="flex justify-between items-start">
              <div className="flex-grow">
                <label className="text-sm font-medium text-gray-400 mb-1 block">エクササイズ名</label>
                <input
                    type="text"
                    list="exercise-presets"
                    value={exercise.name}
                    onChange={(e) => handleExerciseChange(index, 'name', e.target.value)}
                    placeholder="例: スクワット"
                    className="w-full bg-gray-900 border border-gray-600 rounded-md p-2 focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition"
                />
                 <datalist id="exercise-presets">
                    {allPresetNames.map(name => <option key={name} value={name} />)}
                </datalist>
              </div>
              <button
                onClick={() => removeExercise(index)}
                className="ml-4 mt-6 p-2 text-gray-400 hover:text-white hover:bg-red-500 rounded-full transition-colors"
                aria-label="エクササイズを削除"
              >
                <TrashIcon className="w-5 h-5" />
              </button>
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
               <InputField label="時間 (秒)">
                 <select value={exercise.duration || 0} onChange={e => handleExerciseChange(index, 'duration', Number(e.target.value))} className="bg-gray-900 border border-gray-600 rounded-md p-2 focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition appearance-none text-center w-full">
                    {durationPresets.map(d => <option key={`dur-${d}`} value={d}>{d}s</option>)}
                 </select>
               </InputField>
               <InputField label="回数">
                  <select value={exercise.reps || 0} onChange={e => handleExerciseChange(index, 'reps', Number(e.target.value))} className="bg-gray-900 border border-gray-600 rounded-md p-2 focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition appearance-none text-center w-full">
                    {repsPresets.map(r => <option key={`rep-${r}`} value={r}>{r}回</option>)}
                 </select>
               </InputField>
               <InputField label="休憩 (秒)">
                 <select value={exercise.restDuration || 0} onChange={e => handleExerciseChange(index, 'restDuration', Number(e.target.value))} className="bg-gray-900 border border-gray-600 rounded-md p-2 focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition appearance-none text-center w-full">
                    {restPresets.map(r => <option key={`rest-${r}`} value={r}>{r}s</option>)}
                 </select>
               </InputField>
               <InputField label="セット数">
                 <select value={exercise.sets || 1} onChange={e => handleExerciseChange(index, 'sets', Number(e.target.value))} className="bg-gray-900 border border-gray-600 rounded-md p-2 focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition appearance-none text-center w-full">
                    {setsPresets.map(s => <option key={`set-${s}`} value={s}>{s}セット</option>)}
                 </select>
               </InputField>
               <InputField label="重量 (kg)">
                 <select value={exercise.weight || 0} onChange={e => handleExerciseChange(index, 'weight', Number(e.target.value))} className="bg-gray-900 border border-gray-600 rounded-md p-2 focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition appearance-none text-center w-full">
                    {weightPresets.map(w => <option key={`w-${w}`} value={w}>{w}kg</option>)}
                 </select>
               </InputField>
            </div>
            
             <p className="text-xs text-gray-500 text-center col-span-2 md:col-span-3">
                時間を0に設定すると回数ベースのトレーニングになります。
             </p>

          </div>
        ))}
      </div>

      <button
        onClick={addExercise}
        className="w-full flex items-center justify-center py-2 px-4 bg-gray-600 text-white font-semibold rounded-lg hover:bg-gray-500 transition-colors"
      >
        <PlusIcon className="w-5 h-5 mr-2" />
        エクササイズを追加
      </button>

      <div className="flex justify-end space-x-4 pt-4 border-t border-gray-700">
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
          {workoutToEdit ? '更新' : '保存'}
        </button>
      </div>
    </div>
  );
};

export default WorkoutCreator;
