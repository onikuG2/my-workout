
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Workout, Exercise } from '../types';
import TrashIcon from './icons/TrashIcon';
import PlusIcon from './icons/PlusIcon';
import { useAlert } from './AlertProvider';
import { loadPresetExercises, PresetExercises } from '../data/presets';

interface WorkoutCreatorProps {
  onSave: (workout: Workout) => void;
  onCancel: () => void;
  workoutToEdit?: Workout | null;
}

const durationPresets = [0, 15, 30, 45, 60, 90, 120, 150, 180, 240, 300]; // 0s to 5min
const restPresets = [0, 15, 30, 45, 60, 90, 120, 180]; // 0s to 3min
const weightPresets = [0, ...Array.from({ length: 40 }, (_, i) => (i + 1) * 2.5)]; // 0kg to 100kg
const setsPresets = Array.from({ length: 10 }, (_, i) => i + 1); // 1 to 10
const repsPresets = [0, ...Array.from({ length: 19 }, (_, i) => i + 2), 25, 30, 50]; // 0, 2-20, 25, 30, 50

const WorkoutCreator: React.FC<WorkoutCreatorProps> = ({ onSave, onCancel, workoutToEdit }) => {
  // 動的にpresetExercisesを読み込む
  const [presetExercises, setPresetExercises] = useState<PresetExercises>(loadPresetExercises());
  
  // localStorageの変更を監視して、ExerciseMasterでの変更を検知
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'exercisePresets' || e.key === null) {
        setPresetExercises(loadPresetExercises());
      }
    };
    
    // 定期的にチェック（同じタブ内での変更を検知）
    const interval = setInterval(() => {
      const current = loadPresetExercises();
      setPresetExercises(prev => {
        const prevStr = JSON.stringify(prev);
        const currentStr = JSON.stringify(current);
        if (prevStr !== currentStr) {
          return current;
        }
        return prev;
      });
    }, 1000);
    
    window.addEventListener('storage', handleStorageChange);
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      clearInterval(interval);
    };
  }, []);
  
  // 部位オプションと種目名をメモ化
  const bodyPartOptions = useMemo(() => Object.keys(presetExercises), [presetExercises]);
  const allPresetNames = useMemo(() => Object.values(presetExercises).flat(), [presetExercises]);
  
  // 種目名から部位を検索する関数
  const findBodyPartByExercise = useCallback((exerciseName: string): string => {
    if (!exerciseName) return '全身';
    for (const part of bodyPartOptions) {
      const exercises = presetExercises[part] || [];
      if (exercises.includes(exerciseName)) {
        return part;
      }
    }
    return '全身';
  }, [presetExercises, bodyPartOptions]);
  
  const [workout, setWorkout] = useState<Workout>({
      id: `wo-${Date.now()}`,
      name: '',
      exercises: [],
    });
  const { showAlert } = useAlert();
  const [selectedBodyParts, setSelectedBodyParts] = useState<string[]>([]);
  const [customDurationFlags, setCustomDurationFlags] = useState<boolean[]>([]);
  const [customRepsFlags, setCustomRepsFlags] = useState<boolean[]>([]);
  const [customRestFlags, setCustomRestFlags] = useState<boolean[]>([]);
  const [validationErrors, setValidationErrors] = useState<{ [key: number]: string }>({});
  const [nextSuperSetGroupId, setNextSuperSetGroupId] = useState<number>(1);
  
  const validateExercise = (exercise: Exercise, index: number): string | null => {
    if (!exercise.name.trim()) {
      return '種目名を入力してください';
    }
    if ((!exercise.duration || exercise.duration <= 0) && (!exercise.reps || exercise.reps <= 0)) {
      return 'ワークタイムまたは回数を設定してください';
    }
    return null;
  };

  useEffect(() => {
    if (workoutToEdit) {
      setWorkout(workoutToEdit);
      // 初期表示時に各エクササイズから部位を推定
      const initialBodyParts = (workoutToEdit.exercises || []).map(ex => findBodyPartByExercise(ex.name || ''));
      setSelectedBodyParts(initialBodyParts);
      // 既存値がプリセット外なら任意入力フラグをON
      const initCustomDuration = (workoutToEdit.exercises || []).map(ex => !durationPresets.includes(ex.duration || 0) && (ex.duration || 0) > 0);
      const initCustomReps = (workoutToEdit.exercises || []).map(ex => !repsPresets.includes(ex.reps || 0) && (ex.reps || 0) > 0);
      const initCustomRest = (workoutToEdit.exercises || []).map(ex => !restPresets.includes(ex.restDuration || 0) && (ex.restDuration || 0) > 0);
      setCustomDurationFlags(initCustomDuration);
      setCustomRepsFlags(initCustomReps);
      setCustomRestFlags(initCustomRest);
      // 初期バリデーション
      const initialErrors: { [key: number]: string } = {};
      (workoutToEdit.exercises || []).forEach((ex, idx) => {
        const error = validateExercise(ex, idx);
        if (error) initialErrors[idx] = error;
      });
      setValidationErrors(initialErrors);
      // 既存のスーパーセットグループIDの最大値を取得
      const maxGroupId = workoutToEdit.exercises.reduce((max, ex) => {
        return Math.max(max, ex.superSetGroupId || 0);
      }, 0);
      setNextSuperSetGroupId(maxGroupId + 1);
    } else {
      // Set a default empty state for new workouts
      setWorkout({
        id: `wo-${Date.now()}`,
        name: '',
        exercises: [],
      });
      setSelectedBodyParts([]);
      setCustomDurationFlags([]);
      setCustomRepsFlags([]);
      setCustomRestFlags([]);
      setValidationErrors({});
      setNextSuperSetGroupId(1);
    }
  }, [workoutToEdit, findBodyPartByExercise]);

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
    
    // リアルタイムバリデーション
    const error = validateExercise(exercise, index);
    setValidationErrors(prev => ({
      ...prev,
      [index]: error || ''
    }));
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
    setSelectedBodyParts(prev => [...prev, '全身']);
    setCustomDurationFlags(prev => [...prev, false]);
    setCustomRepsFlags(prev => [...prev, false]);
    setCustomRestFlags(prev => [...prev, false]);
    setValidationErrors(prev => ({ ...prev, [workout.exercises.length]: '' }));
  };

  const addExerciseToSuperSet = () => {
    const newExercise: Exercise = {
      id: `ex-${Date.now()}-${Math.random()}`,
      name: '',
      duration: 30,
      restDuration: 15,
      sets: 3,
      reps: 0, // Default to time-based
      weight: 0,
    };
    
    // 前のエクササイズがスーパーセットに属している場合は同じグループに追加
    // そうでない場合は新しいグループを作成
    const lastExercise = workout.exercises.length > 0 ? workout.exercises[workout.exercises.length - 1] : null;
    if (lastExercise?.superSetGroupId) {
      newExercise.superSetGroupId = lastExercise.superSetGroupId;
    } else {
      newExercise.superSetGroupId = nextSuperSetGroupId;
      setNextSuperSetGroupId(nextSuperSetGroupId + 1);
    }
    
    setWorkout({
      ...workout,
      exercises: [...workout.exercises, newExercise],
    });
    setSelectedBodyParts(prev => [...prev, '全身']);
    setCustomDurationFlags(prev => [...prev, false]);
    setCustomRepsFlags(prev => [...prev, false]);
    setCustomRestFlags(prev => [...prev, false]);
    setValidationErrors(prev => ({ ...prev, [workout.exercises.length]: '' }));
  };

  const removeExercise = (index: number) => {
    const newExercises = workout.exercises.filter((_, i) => i !== index);
    setWorkout({ ...workout, exercises: newExercises });
    setSelectedBodyParts(prev => prev.filter((_, i) => i !== index));
    const newErrors = { ...validationErrors };
    delete newErrors[index];
    // インデックスを再マッピング
    const reindexedErrors: { [key: number]: string } = {};
    Object.keys(newErrors).forEach(key => {
      const oldIndex = Number(key);
      if (oldIndex > index) {
        reindexedErrors[oldIndex - 1] = newErrors[oldIndex];
      } else if (oldIndex < index) {
        reindexedErrors[oldIndex] = newErrors[oldIndex];
      }
    });
    setValidationErrors(reindexedErrors);
  };

  const handleBodyPartChange = (index: number, newPart: string) => {
    setSelectedBodyParts(prev => {
      const next = [...prev];
      next[index] = newPart;
      return next;
    });
    // 部位変更時、現在の種目がその部位に存在しなければ種目名をリセット
    const validNames = presetExercises[newPart] || [];
    const currentName = workout.exercises[index]?.name || '';
    if (!validNames.includes(currentName)) {
      handleExerciseChange(index, 'name', '');
    }
  };

  const handleToggleSuperSet = (index: number) => {
    const newExercises = [...workout.exercises];
    const exercise = { ...newExercises[index] };
    
    if (exercise.superSetGroupId) {
      // スーパーセットから削除
      exercise.superSetGroupId = undefined;
    } else {
      // 前のエクササイズがスーパーセットに属している場合は同じグループに追加
      // そうでない場合は新しいグループを作成
      const prevExercise = index > 0 ? newExercises[index - 1] : null;
      if (prevExercise?.superSetGroupId) {
        exercise.superSetGroupId = prevExercise.superSetGroupId;
      } else {
        exercise.superSetGroupId = nextSuperSetGroupId;
        setNextSuperSetGroupId(nextSuperSetGroupId + 1);
      }
    }
    
    newExercises[index] = exercise;
    setWorkout({ ...workout, exercises: newExercises });
  };

  const getSuperSetGroupMembers = (groupId: number): number[] => {
    return workout.exercises
      .map((ex, idx) => ex.superSetGroupId === groupId ? idx : -1)
      .filter(idx => idx !== -1);
  };

  const isFirstInSuperSet = (index: number): boolean => {
    const exercise = workout.exercises[index];
    if (!exercise.superSetGroupId) return false;
    const groupMembers = getSuperSetGroupMembers(exercise.superSetGroupId);
    return groupMembers[0] === index;
  };

  const isLastInSuperSet = (index: number): boolean => {
    const exercise = workout.exercises[index];
    if (!exercise.superSetGroupId) return false;
    const groupMembers = getSuperSetGroupMembers(exercise.superSetGroupId);
    return groupMembers[groupMembers.length - 1] === index;
  };

  const handleSelectWithCustom = (
    index: number,
    field: 'duration' | 'reps' | 'restDuration',
    value: number,
  ) => {
    if (field === 'duration') {
      if (value === -1) {
        setCustomDurationFlags(prev => {
          const next = [...prev];
          next[index] = true;
          return next;
        });
      } else {
        setCustomDurationFlags(prev => {
          const next = [...prev];
          next[index] = false;
          return next;
        });
        handleExerciseChange(index, 'duration', value);
      }
    }
    if (field === 'reps') {
      if (value === -1) {
        setCustomRepsFlags(prev => {
          const next = [...prev];
          next[index] = true;
          return next;
        });
      } else {
        setCustomRepsFlags(prev => {
          const next = [...prev];
          next[index] = false;
          return next;
        });
        handleExerciseChange(index, 'reps', value);
      }
    }
    if (field === 'restDuration') {
      if (value === -1) {
        setCustomRestFlags(prev => {
          const next = [...prev];
          next[index] = true;
          return next;
        });
      } else {
        setCustomRestFlags(prev => {
          const next = [...prev];
          next[index] = false;
          return next;
        });
        handleExerciseChange(index, 'restDuration', value);
      }
    }
  };

  // スーパーセット全体のセット数と休憩時間を変更する関数
  const handleSuperSetChange = (groupId: number, field: 'sets' | 'restDuration', value: number) => {
    const newExercises = workout.exercises.map(ex => {
      if (ex.superSetGroupId === groupId) {
        return { ...ex, [field]: value };
      }
      return ex;
    });
    setWorkout({ ...workout, exercises: newExercises });
  };

  // スーパーセット全体のセット数と休憩時間を取得する関数
  const getSuperSetValue = (groupId: number, field: 'sets' | 'restDuration'): number => {
    const firstExercise = workout.exercises.find(ex => ex.superSetGroupId === groupId);
    return firstExercise ? (firstExercise[field] || (field === 'sets' ? 1 : 0)) : (field === 'sets' ? 1 : 0);
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
        showAlert(`「${ex.name}」にはワークタイムまたは回数のいずれかを0より大きい値に設定してください。`, '入力エラー');
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
        <h2 className="text-2xl sm:text-3xl font-bold text-cyan-400 mb-4">
          {workoutToEdit ? 'ワークアウトの編集' : '新しいワークアウトの作成'}
        </h2>
        <input
          type="text"
          value={workout.name}
          onChange={handleWorkoutNameChange}
          placeholder="ワークアウト名 (例: 全身HIIT)"
          className="w-full bg-gray-700 border border-gray-600 rounded-lg p-3 text-base sm:text-lg focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition min-h-[44px]"
          aria-label="ワークアウト名"
        />
        
      </div>

      <div>
        {workout.exercises.map((exercise, index) => {
          const isInSuperSet = !!exercise.superSetGroupId;
          const isFirst = isFirstInSuperSet(index);
          const isLast = isLastInSuperSet(index);
          const prevExercise = index > 0 ? workout.exercises[index - 1] : null;
          const isPrevInSameSuperSet = prevExercise?.superSetGroupId === exercise.superSetGroupId;
          const nextExercise = index < workout.exercises.length - 1 ? workout.exercises[index + 1] : null;
          const isNextInSameSuperSet = nextExercise?.superSetGroupId === exercise.superSetGroupId;
          
          return (
            <div 
              key={`exercise-${exercise.id}`}
              className={`${isPrevInSameSuperSet ? 'mt-0' : !isInSuperSet && index > 0 ? 'mt-4' : isFirst && isInSuperSet ? 'mt-2' : ''}`}
            >
              <div 
                key={exercise.id} 
                className={`p-4 space-y-4 border ${
                  isInSuperSet 
                    ? 'bg-purple-900/30 border-purple-500/50' 
                    : 'bg-gray-700/50 border-gray-600 rounded-lg'
                } ${
                  isInSuperSet && isFirst 
                    ? 'rounded-t-lg border-b-0' 
                    : isInSuperSet && isLast && !isNextInSameSuperSet
                    ? 'border-t-0 border-b-0 rounded-none' 
                    : isInSuperSet && isLast
                    ? 'border-t-0 rounded-b-lg'
                    : isInSuperSet && !isFirst && !isLast
                    ? 'border-t-0 border-b-0 rounded-none'
                    : ''
                } ${isFirst && isInSuperSet ? 'mt-2' : ''} ${isLast && isInSuperSet && !isNextInSameSuperSet ? 'mb-0' : isLast && isInSuperSet ? 'mb-2' : ''} ${isPrevInSameSuperSet ? 'border-t border-purple-500/30' : ''}`}
              >
              {isFirst && isInSuperSet && (
                <div className="mb-4 pb-4 border-b border-purple-500/30">
                  <div className="flex items-center gap-2 mb-3">
                    <span className="text-xs font-semibold text-purple-400 bg-purple-900/50 px-2 py-1 rounded">
                      スーパーセット
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <InputField label="セット数">
                      <select 
                        value={getSuperSetValue(exercise.superSetGroupId!, 'sets')} 
                        onChange={e => handleSuperSetChange(exercise.superSetGroupId!, 'sets', Number(e.target.value))} 
                        className="bg-gray-900 border border-gray-600 rounded-md p-2 focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition appearance-none text-center w-full"
                      >
                        {setsPresets.map(s => <option key={`superset-set-${s}`} value={s}>{s}セット</option>)}
                      </select>
                    </InputField>
                    <InputField label="休憩 (秒)">
                      <div className="flex items-center gap-2">
                        <select 
                          value={customRestFlags[index] ? -1 : getSuperSetValue(exercise.superSetGroupId!, 'restDuration')} 
                          onChange={e => {
                            const val = Number(e.target.value);
                            const groupId = exercise.superSetGroupId!;
                            const groupMembers = getSuperSetGroupMembers(groupId);
                            if (val === -1) {
                              setCustomRestFlags(prev => {
                                const next = [...prev];
                                // スーパーセット内のすべてのエクササイズのフラグを更新
                                groupMembers.forEach(memberIndex => {
                                  next[memberIndex] = true;
                                });
                                return next;
                              });
                            } else {
                              setCustomRestFlags(prev => {
                                const next = [...prev];
                                // スーパーセット内のすべてのエクササイズのフラグを更新
                                groupMembers.forEach(memberIndex => {
                                  next[memberIndex] = false;
                                });
                                return next;
                              });
                              handleSuperSetChange(groupId, 'restDuration', val);
                            }
                          }} 
                          className="bg-gray-900 border border-gray-600 rounded-md p-2 focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition appearance-none text-center w-full"
                        >
                          <option value={-1}>任意入力…</option>
                          {restPresets.map(r => <option key={`superset-rest-${r}`} value={r}>{r}s</option>)}
                        </select>
                        {customRestFlags[index] && (
                          <input 
                            type="number" 
                            min={0} 
                            placeholder="秒" 
                            value={getSuperSetValue(exercise.superSetGroupId!, 'restDuration')} 
                            onChange={e => handleSuperSetChange(exercise.superSetGroupId!, 'restDuration', Number(e.target.value))} 
                            className="w-28 bg-gray-900 border border-gray-600 rounded-md p-2 focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition text-right" 
                          />
                        )}
                      </div>
                    </InputField>
                  </div>
                </div>
              )}
            <div className="flex justify-between items-start">
              <div className="flex-grow grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex flex-col">
                  <label className="text-sm font-medium text-gray-400 mb-1">部位</label>
                  <select
                    value={selectedBodyParts[index] ?? findBodyPartByExercise(exercise.name || '')}
                    onChange={(e) => handleBodyPartChange(index, e.target.value)}
                    className="bg-gray-900 border border-gray-600 rounded-md p-2 focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition w-full"
                  >
                    {bodyPartOptions.map(part => (
                      <option key={part} value={part}>{part}</option>
                    ))}
                  </select>
                </div>
                <div className="flex flex-col">
                  <label className="text-sm font-medium text-gray-400 mb-1">種目</label>
                  <select
                    value={exercise.name}
                    onChange={(e) => handleExerciseChange(index, 'name', e.target.value)}
                    className="bg-gray-900 border border-gray-600 rounded-md p-2 focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition w-full"
                  >
                    <option value="">選択してください</option>
                    {(presetExercises[selectedBodyParts[index] ?? findBodyPartByExercise(exercise.name || '')] || []).map(name => (
                      <option key={name} value={name}>{name}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="ml-4 mt-6 flex flex-col gap-2">
                <button
                  onClick={() => handleToggleSuperSet(index)}
                  className={`min-w-[44px] min-h-[44px] p-2.5 rounded-full transition-all duration-200 active:scale-95 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 ${
                    isInSuperSet
                      ? 'bg-purple-600 text-white hover:bg-purple-500 focus:ring-purple-500'
                      : 'bg-gray-600 text-gray-300 hover:bg-gray-500 focus:ring-gray-500'
                  }`}
                  aria-label={isInSuperSet ? 'スーパーセットから削除' : 'スーパーセットに追加'}
                  title={isInSuperSet ? 'スーパーセットから削除' : 'スーパーセットに追加'}
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </button>
                <button
                  onClick={() => removeExercise(index)}
                  className="min-w-[44px] min-h-[44px] p-2.5 text-gray-400 hover:text-white hover:bg-red-500 rounded-full transition-all duration-200 active:scale-95 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 focus:ring-red-500"
                  aria-label="エクササイズを削除"
                >
                  <TrashIcon className="w-5 h-5" />
                </button>
              </div>
            </div>
            {validationErrors[index] && (
              <div className="text-red-400 text-sm mt-2 flex items-center">
                <svg className="w-4 h-4 mr-1 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                {validationErrors[index]}
              </div>
            )}
            
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
               <InputField label="ワークタイム (秒)">
                 <div className="flex items-center gap-2">
                   <select value={customDurationFlags[index] ? -1 : (exercise.duration || 0)} onChange={e => handleSelectWithCustom(index, 'duration', Number(e.target.value))} className="bg-gray-900 border border-gray-600 rounded-md p-2 focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition appearance-none text-center w-full">
                      <option value={-1}>任意入力…</option>
                      {durationPresets.map(d => <option key={`dur-${d}`} value={d}>{d}s</option>)}
                   </select>
                   {customDurationFlags[index] && (
                     <input type="number" min={0} placeholder="秒" value={exercise.duration || 0} onChange={e => handleExerciseChange(index, 'duration', Number(e.target.value))} className="w-28 bg-gray-900 border border-gray-600 rounded-md p-2 focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition text-right" />
                   )}
                 </div>
               </InputField>
               <InputField label="回数">
                 <div className="flex items-center gap-2">
                   <select value={customRepsFlags[index] ? -1 : (exercise.reps || 0)} onChange={e => handleSelectWithCustom(index, 'reps', Number(e.target.value))} className="bg-gray-900 border border-gray-600 rounded-md p-2 focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition appearance-none text-center w-full">
                     <option value={-1}>任意入力…</option>
                     {repsPresets.map(r => <option key={`rep-${r}`} value={r}>{r}回</option>)}
                   </select>
                   {customRepsFlags[index] && (
                     <input type="number" min={0} placeholder="回" value={exercise.reps || 0} onChange={e => handleExerciseChange(index, 'reps', Number(e.target.value))} className="w-28 bg-gray-900 border border-gray-600 rounded-md p-2 focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition text-right" />
                   )}
                 </div>
               </InputField>
               {!isInSuperSet ? (
                 <InputField label="休憩 (秒)">
                   <div className="flex items-center gap-2">
                     <select value={customRestFlags[index] ? -1 : (exercise.restDuration || 0)} onChange={e => handleSelectWithCustom(index, 'restDuration', Number(e.target.value))} className="bg-gray-900 border border-gray-600 rounded-md p-2 focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition appearance-none text-center w-full">
                        <option value={-1}>任意入力…</option>
                        {restPresets.map(r => <option key={`rest-${r}`} value={r}>{r}s</option>)}
                     </select>
                     {customRestFlags[index] && (
                       <input type="number" min={0} placeholder="秒" value={exercise.restDuration || 0} onChange={e => handleExerciseChange(index, 'restDuration', Number(e.target.value))} className="w-28 bg-gray-900 border border-gray-600 rounded-md p-2 focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition text-right" />
                     )}
                   </div>
                 </InputField>
               ) : null}
               {!isInSuperSet ? (
                 <InputField label="セット数">
                   <select value={exercise.sets || 1} onChange={e => handleExerciseChange(index, 'sets', Number(e.target.value))} className="bg-gray-900 border border-gray-600 rounded-md p-2 focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition appearance-none text-center w-full">
                      {setsPresets.map(s => <option key={`set-${s}`} value={s}>{s}セット</option>)}
                   </select>
                 </InputField>
               ) : null}
               <InputField label="重量 (kg)">
                 <select value={exercise.weight || 0} onChange={e => handleExerciseChange(index, 'weight', Number(e.target.value))} className="bg-gray-900 border border-gray-600 rounded-md p-2 focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition appearance-none text-center w-full">
                    {weightPresets.map(w => <option key={`w-${w}`} value={w}>{w}kg</option>)}
                 </select>
               </InputField>
            </div>
            
             <p className="text-xs text-gray-500 text-center col-span-2 md:col-span-3">
                ワークタイムを0に設定すると回数ベースのトレーニングになります。
                {isInSuperSet && (
                  <span className="block mt-1 text-purple-400">
                    スーパーセット内のエクササイズ間は休憩なしで連続実行されます。
                  </span>
                )}
             </p>

            {isLast && isInSuperSet && !isNextInSameSuperSet && (
              <div className="pt-2 mt-4 border-t border-purple-500/30">
                <button
                  onClick={addExerciseToSuperSet}
                  className="w-full flex items-center justify-center min-h-[44px] py-2.5 px-4 bg-purple-600 text-white font-semibold rounded-lg hover:bg-purple-500 transition-all duration-200 active:scale-95 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 focus:ring-purple-500 text-base"
                  aria-label="スーパーセットにエクササイズを追加"
                >
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                  スーパーセットに追加
                </button>
              </div>
            )}
              </div>
            </div>
          );
        })}
      </div>

      <button
        onClick={addExercise}
        className="w-full flex items-center justify-center min-h-[44px] py-2.5 px-4 bg-gray-600 text-white font-semibold rounded-lg hover:bg-gray-500 transition-all duration-200 active:scale-95 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 focus:ring-gray-500 text-base"
        aria-label="エクササイズを追加"
      >
        <PlusIcon className="w-5 h-5 mr-2" />
        エクササイズを追加
      </button>

      <div className="flex flex-col sm:flex-row justify-end gap-4 pt-4 border-t border-gray-700">
        <button
          onClick={onCancel}
          className="min-h-[44px] py-2.5 px-6 bg-gray-600 text-white font-semibold rounded-lg hover:bg-gray-500 transition-all duration-200 active:scale-95 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 focus:ring-gray-500 text-base"
          aria-label="キャンセル"
        >
          キャンセル
        </button>
        <button
          onClick={handleSave}
          className="min-h-[44px] py-2.5 px-6 bg-cyan-500 text-white font-semibold rounded-lg hover:bg-cyan-600 transition-all duration-200 active:scale-95 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 focus:ring-cyan-500 text-base"
          aria-label={workoutToEdit ? '更新' : '保存'}
        >
          {workoutToEdit ? '更新' : '保存'}
        </button>
      </div>
    </div>
  );
};

export default WorkoutCreator;
