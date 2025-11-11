import React, { useState } from 'react';
import { Workout } from '../types';
import PlusIcon from './icons/PlusIcon';
import TrashIcon from './icons/TrashIcon';
import PlayIcon from './icons/PlayIcon';
import ClockIcon from './icons/ClockIcon';
import PencilIcon from './icons/PencilIcon';
import HistoryIcon from './icons/HistoryIcon';
import SparklesIcon from './icons/SparklesIcon';
import ConfirmModal from './modals/ConfirmModal';
import PresetWorkoutModal from './modals/PresetWorkoutModal';
import LocalFileSync from './LocalFileSync';

import { PresetExercises } from '../data/presets';

interface WorkoutListProps {
  workouts: Workout[];
  setWorkouts: (workouts: Workout[]) => void;
  onCreate: () => void;
  onStart: (workout: Workout) => void;
  onDelete: (workoutId: string) => void;
  onEdit: (workout: Workout) => void;
  onShowHistory: () => void;
  onOpenMaster: () => void;
  onPresetsLoaded?: (presets: PresetExercises) => void;
}

const WorkoutList: React.FC<WorkoutListProps> = ({ 
  workouts, 
  setWorkouts,
  onCreate, 
  onStart, 
  onDelete, 
  onEdit,
  onShowHistory,
  onOpenMaster,
  onPresetsLoaded,
}) => {
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [workoutToDelete, setWorkoutToDelete] = useState<Workout | null>(null);
  const [isPresetModalOpen, setIsPresetModalOpen] = useState(false);

  const getTotalDuration = (workout: Workout) => {
    const totalSeconds = workout.exercises.reduce((acc, ex) => {
      const sets = ex.sets || 1;
      return acc + ((ex.duration || 0) + (ex.restDuration || 0)) * sets;
    }, 0);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes}m ${seconds}s`;
  };

  const openDeleteConfirmation = (workout: Workout) => {
    setWorkoutToDelete(workout);
    setIsDeleteModalOpen(true);
  };

  const closeDeleteConfirmation = () => {
    setIsDeleteModalOpen(false);
    setTimeout(() => {
        setWorkoutToDelete(null);
    }, 300); 
  };

  const handleConfirmDelete = () => {
    if (workoutToDelete) {
      onDelete(workoutToDelete.id);
      closeDeleteConfirmation();
    }
  };

  const handleAddPresets = (presets: Workout[]) => {
    const newWorkouts = presets.map(workout => {
      const newWorkoutId = `wo-${Date.now()}-${Math.random()}`;
      const newExercises = workout.exercises.map(ex => ({
        ...ex,
        id: `ex-${Date.now()}-${Math.random()}`
      }));
      return {
        ...workout,
        id: newWorkoutId,
        exercises: newExercises
      };
    });

    const updatedWorkouts = [...workouts, ...newWorkouts];
    setWorkouts(updatedWorkouts);
    setIsPresetModalOpen(false);
  };

  return (
    <>
      <div className="space-y-4">
          <div className="flex flex-col sm:flex-row justify-between gap-3">
            <button
              onClick={onOpenMaster}
              className="flex items-center justify-center min-h-[44px] py-2.5 px-5 bg-gray-600 text-white font-semibold rounded-lg hover:bg-gray-500 transition-all duration-200 text-base active:scale-95 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 focus:ring-gray-500"
              aria-label="種目マスターを開く"
            >
              種目マスター
            </button>
            <button
              onClick={onShowHistory}
              className="flex items-center justify-center min-h-[44px] py-2.5 px-5 bg-gray-600 text-white font-semibold rounded-lg hover:bg-gray-500 transition-all duration-200 text-base active:scale-95 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 focus:ring-gray-500"
              aria-label="ワークアウト履歴を表示"
            >
              <HistoryIcon className="w-5 h-5 mr-2" />
              ワークアウト履歴
            </button>
          </div>
          {workouts.length === 0 ? (
              <div className="text-center py-16 px-6 bg-gray-700/50 rounded-lg border-2 border-dashed border-gray-600">
                  <div className="text-6xl mb-4">💪</div>
                  <h2 className="text-2xl font-bold text-gray-200 mb-2">まだワークアウトがありません</h2>
                  <p className="text-gray-400 text-base mb-6">下のボタンをクリックして、最初のワークアウトを作成してください！</p>
              </div>
          ) : (
              workouts.map(workout => (
              <div key={workout.id} className="bg-gray-700 p-5 rounded-lg shadow-lg transition-all duration-300 hover:shadow-xl hover:bg-gray-700/90 border border-gray-600">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                      <div className="flex-1">
                          <h3 className="text-2xl font-bold text-white mb-2">{workout.name}</h3>
                          <div className="flex flex-wrap items-center gap-4 text-base text-gray-300">
                              <span className="flex items-center font-medium">
                                  <span className="text-cyan-400 mr-1">📋</span>
                                  {workout.exercises.length} エクササイズ
                              </span>
                              <span className="flex items-center font-medium">
                                  <ClockIcon className="w-5 h-5 mr-1.5 text-cyan-400"/>
                                  {getTotalDuration(workout)}
                              </span>
                          </div>
                      </div>
                      <div className="flex items-center justify-end sm:justify-start gap-3 flex-shrink-0">
                          <button 
                              onClick={() => onStart(workout)}
                              className="min-w-[44px] min-h-[44px] p-3 bg-cyan-500 rounded-full text-white hover:bg-cyan-400 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 focus:ring-cyan-500 transition-all duration-200 active:scale-95"
                              aria-label={`${workout.name} を開始`}
                          >
                              <PlayIcon className="w-6 h-6" />
                          </button>
                          <button 
                              onClick={() => onEdit(workout)}
                              className="min-w-[44px] min-h-[44px] p-3 bg-gray-600 rounded-full text-white hover:bg-gray-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 focus:ring-gray-500 transition-all duration-200 active:scale-95"
                              aria-label={`${workout.name} を編集`}
                          >
                              <PencilIcon className="w-6 h-6" />
                          </button>
                          <button 
                              onClick={() => openDeleteConfirmation(workout)}
                              className="min-w-[44px] min-h-[44px] p-3 bg-red-600 rounded-full text-white hover:bg-red-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 focus:ring-red-600 transition-all duration-200 active:scale-95"
                              aria-label={`${workout.name} を削除`}
                          >
                              <TrashIcon className="w-6 h-6" />
                          </button>
                      </div>
                  </div>
              </div>
              ))
          )}
          <button
              onClick={onCreate}
              className="w-full flex items-center justify-center min-h-[52px] py-3.5 px-6 bg-cyan-500 text-white font-semibold rounded-lg hover:bg-cyan-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 focus:ring-cyan-500 transition-all duration-200 active:scale-98 text-base"
              aria-label="新しいワークアウトを作成"
          >
              <PlusIcon className="w-6 h-6 mr-2" />
              新しいワークアウトを作成
          </button>
          
          <div className="border-t border-gray-700 pt-4 mt-4 space-y-4">
              <button
                onClick={() => setIsPresetModalOpen(true)}
                className="w-full flex items-center justify-center min-h-[44px] py-2.5 px-4 bg-purple-600 text-white font-semibold rounded-lg hover:bg-purple-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 focus:ring-purple-500 transition-all duration-200 active:scale-95 text-base"
                aria-label="おすすめワークアウトを追加"
              >
                  <SparklesIcon className="w-5 h-5 mr-2" />
                  おすすめワークアウトを追加
              </button>
          </div>
          
          <div className="border-t border-gray-700 pt-4 mt-4">
            <h3 className="text-sm font-semibold text-gray-400 mb-3 text-center uppercase tracking-wider">
              データ管理
            </h3>
            <LocalFileSync localWorkouts={workouts} onWorkoutsLoaded={setWorkouts} onPresetsLoaded={onPresetsLoaded} />
          </div>
      </div>

      <ConfirmModal
          isOpen={isDeleteModalOpen}
          onClose={closeDeleteConfirmation}
          onConfirm={handleConfirmDelete}
          title="ワークアウトの削除"
          message={workoutToDelete ? `「${workoutToDelete.name}」を本当に削除しますか？この操作は元に戻せません。` : ''}
        />
      
      <PresetWorkoutModal 
        isOpen={isPresetModalOpen}
        onClose={() => setIsPresetModalOpen(false)}
        onAdd={handleAddPresets}
      />
    </>
  );
};

export default WorkoutList;