import React, { useState } from 'react';
import { Workout } from '../types';
import PlusIcon from './icons/PlusIcon';
import TrashIcon from './icons/TrashIcon';
import PlayIcon from './icons/PlayIcon';
import ClockIcon from './icons/ClockIcon';
import PencilIcon from './icons/PencilIcon';
import HistoryIcon from './icons/HistoryIcon';
import ConfirmModal from './modals/ConfirmModal';
import LocalFileSync from './LocalFileSync';

interface WorkoutListProps {
  workouts: Workout[];
  setWorkouts: (workouts: Workout[]) => void;
  onCreate: () => void;
  onStart: (workout: Workout) => void;
  onDelete: (workoutId: string) => void;
  onEdit: (workout: Workout) => void;
  onShowHistory: () => void;
}

const WorkoutList: React.FC<WorkoutListProps> = ({ 
  workouts, 
  setWorkouts,
  onCreate, 
  onStart, 
  onDelete, 
  onEdit,
  onShowHistory,
}) => {
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [workoutToDelete, setWorkoutToDelete] = useState<Workout | null>(null);

  const getTotalDuration = (workout: Workout) => {
    const totalSeconds = workout.exercises.reduce((acc, ex) => acc + ex.duration, 0);
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

  return (
    <>
      <div className="space-y-4">
          <div className="flex justify-end">
            <button
              onClick={onShowHistory}
              className="flex items-center justify-center py-2 px-4 bg-gray-600 text-white font-semibold rounded-lg hover:bg-gray-500 transition-colors text-sm"
            >
              <HistoryIcon className="w-5 h-5 mr-2" />
              ワークアウト履歴
            </button>
          </div>
          {workouts.length === 0 ? (
              <div className="text-center py-12 px-6 bg-gray-700/50 rounded-lg">
                  <h2 className="text-xl font-semibold text-gray-300">まだワークアウトがありません</h2>
                  <p className="text-gray-400 mt-2">下のボタンをクリックして、最初のワークアウトを作成してください！</p>
              </div>
          ) : (
              workouts.map(workout => (
              <div key={workout.id} className="bg-gray-700 p-4 rounded-lg flex items-center justify-between shadow-md transition-transform hover:scale-105 duration-200">
                  <div>
                  <h3 className="text-xl font-bold text-white">{workout.name}</h3>
                  <div className="flex items-center text-sm text-gray-400 mt-1 space-x-4">
                      <span>{workout.exercises.length} エクササイズ</span>
                      <span className="flex items-center">
                          <ClockIcon className="w-4 h-4 mr-1"/>
                          {getTotalDuration(workout)}
                      </span>
                  </div>
                  </div>
                  <div className="flex items-center space-x-2">
                  <button 
                      onClick={() => onStart(workout)}
                      className="p-3 bg-green-500 rounded-full text-white hover:bg-green-400 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 focus:ring-green-500 transition-colors"
                      aria-label={`${workout.name} を開始`}
                  >
                      <PlayIcon className="w-5 h-5" />
                  </button>
                  <button 
                      onClick={() => onEdit(workout)}
                      className="p-3 bg-blue-500 rounded-full text-white hover:bg-blue-400 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 focus:ring-blue-500 transition-colors"
                      aria-label={`${workout.name} を編集`}
                  >
                      <PencilIcon className="w-5 h-5" />
                  </button>
                  <button 
                      onClick={() => openDeleteConfirmation(workout)}
                      className="p-3 bg-red-600 rounded-full text-white hover:bg-red-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 focus:ring-red-600 transition-colors"
                      aria-label={`${workout.name} を削除`}
                  >
                      <TrashIcon className="w-5 h-5" />
                  </button>
                  </div>
              </div>
              ))
          )}
          <button
              onClick={onCreate}
              className="w-full flex items-center justify-center py-3 px-6 bg-cyan-500 text-white font-semibold rounded-lg hover:bg-cyan-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 focus:ring-cyan-500 transition-all duration-200 transform hover:scale-102"
          >
              <PlusIcon className="w-6 h-6 mr-2" />
              新しいワークアウトを作成
          </button>

          <div className="border-t border-gray-700 pt-4 mt-4">
            <LocalFileSync
                localWorkouts={workouts}
                onWorkoutsLoaded={setWorkouts}
            />
          </div>
      </div>

      <ConfirmModal
          isOpen={isDeleteModalOpen}
          onClose={closeDeleteConfirmation}
          onConfirm={handleConfirmDelete}
          title="ワークアウトの削除"
          message={workoutToDelete ? `「${workoutToDelete.name}」を本当に削除しますか？この操作は元に戻せません。` : ''}
        />
    </>
  );
};

export default WorkoutList;
