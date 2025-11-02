import React, { useState, useMemo } from 'react';
import { Workout } from '../../types';
import { defaultWorkouts } from '../../data/defaultWorkouts';
import ClockIcon from '../icons/ClockIcon';

interface PresetWorkoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (selectedWorkouts: Workout[]) => void;
}

const PresetWorkoutModal: React.FC<PresetWorkoutModalProps> = ({ isOpen, onClose, onAdd }) => {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const handleToggleWorkout = (workoutId: string) => {
    setSelectedIds(prev => {
      const newSet = new Set(prev);
      if (newSet.has(workoutId)) {
        newSet.delete(workoutId);
      } else {
        newSet.add(workoutId);
      }
      return newSet;
    });
  };

  const handleAddClick = () => {
    const selected = defaultWorkouts.filter(w => selectedIds.has(w.id));
    if (selected.length > 0) {
      onAdd(selected);
    }
  };

  const getTotalDuration = (workout: Workout) => {
    const totalSeconds = workout.exercises.reduce((acc, ex) => {
      const sets = ex.sets || 1;
      return acc + ((ex.duration || 0) + (ex.restDuration || 0)) * sets;
    }, 0);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes}m ${seconds}s`;
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-75 z-50 flex justify-center items-center p-4 transition-opacity"
      aria-modal="true"
      role="dialog"
      onClick={onClose}
    >
      <div
        className="bg-gray-800 rounded-lg shadow-xl p-6 w-full max-w-lg mx-auto transform transition-all animate-fade-in-up"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="text-xl font-bold text-white mb-4">おすすめワークアウトを追加</h3>
        <p className="text-gray-300 mb-6">追加したいワークアウトを選択してください。</p>
        
        <div className="space-y-3 max-h-80 overflow-y-auto pr-2">
            {defaultWorkouts.map(workout => {
                const isSelected = selectedIds.has(workout.id);
                return (
                    <div
                        key={workout.id}
                        onClick={() => handleToggleWorkout(workout.id)}
                        className={`p-4 rounded-lg cursor-pointer transition-all duration-200 border-2 ${
                            isSelected ? 'bg-indigo-500/20 border-indigo-500' : 'bg-gray-700 border-transparent hover:border-gray-500'
                        }`}
                    >
                        <div className="flex justify-between items-start">
                           <div>
                                <h4 className="font-bold text-white">{workout.name}</h4>
                                <div className="flex items-center text-sm text-gray-400 mt-1 space-x-4">
                                    <span>{workout.exercises.length} エクササイズ</span>
                                    <span className="flex items-center">
                                        <ClockIcon className="w-4 h-4 mr-1"/>
                                        {getTotalDuration(workout)}
                                    </span>
                                </div>
                           </div>
                           <div className={`w-6 h-6 rounded-full flex-shrink-0 mt-1 flex items-center justify-center border-2 ${isSelected ? 'bg-indigo-500 border-indigo-400' : 'bg-gray-600 border-gray-500'}`}>
                            {isSelected && (
                                <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" />
                                </svg>
                            )}
                           </div>
                        </div>
                    </div>
                )
            })}
        </div>

        <div className="flex justify-end space-x-4 mt-6">
          <button
            onClick={onClose}
            className="py-2 px-5 bg-gray-600 text-white font-semibold rounded-lg hover:bg-gray-500 transition-colors"
          >
            キャンセル
          </button>
          <button
            onClick={handleAddClick}
            disabled={selectedIds.size === 0}
            className="py-2 px-5 bg-indigo-500 text-white font-semibold rounded-lg hover:bg-indigo-600 transition-colors disabled:bg-gray-500 disabled:cursor-not-allowed"
          >
            {selectedIds.size > 0 ? `${selectedIds.size}件を追加` : '追加'}
          </button>
        </div>
      </div>
      <style>{`
        @keyframes fade-in-up {
          from { opacity: 0; transform: translateY(20px) scale(0.95); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
        .animate-fade-in-up {
          animation: fade-in-up 0.3s ease-out forwards;
        }
      `}</style>
    </div>
  );
};

export default PresetWorkoutModal;
