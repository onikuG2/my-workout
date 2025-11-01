import React, { useState } from 'react';
import { WorkoutHistoryEntry } from '../types';
import TrashIcon from './icons/TrashIcon';
import ClockIcon from './icons/ClockIcon';
import ChevronLeftIcon from './icons/ChevronLeftIcon';
import ConfirmModal from './modals/ConfirmModal';

interface WorkoutHistoryProps {
  history: WorkoutHistoryEntry[];
  onDelete: (entryId: string) => void;
  onBack: () => void;
}

const WorkoutHistory: React.FC<WorkoutHistoryProps> = ({ history, onDelete, onBack }) => {
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [entryToDelete, setEntryToDelete] = useState<WorkoutHistoryEntry | null>(null);

  const formatDuration = (totalSeconds: number) => {
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes}m ${seconds}s`;
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleString('ja-JP', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };
  
  const openDeleteConfirmation = (entry: WorkoutHistoryEntry) => {
    setEntryToDelete(entry);
    setIsDeleteModalOpen(true);
  };

  const closeDeleteConfirmation = () => {
    setIsDeleteModalOpen(false);
    setTimeout(() => {
        setEntryToDelete(null);
    }, 300);
  };

  const handleConfirmDelete = () => {
    if (entryToDelete) {
      onDelete(entryToDelete.id);
      closeDeleteConfirmation();
    }
  };

  const sortedHistory = [...history].sort((a, b) => b.completedAt - a.completedAt);

  return (
    <>
      <div className="space-y-4">
        <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-cyan-400">ワークアウト履歴</h2>
            <button onClick={onBack} className="flex items-center text-cyan-400 hover:text-cyan-300">
                <ChevronLeftIcon className="w-5 h-5 mr-1" />
                一覧に戻る
            </button>
        </div>
        
        {sortedHistory.length === 0 ? (
          <div className="text-center py-12 px-6 bg-gray-700/50 rounded-lg">
            <h2 className="text-xl font-semibold text-gray-300">まだ完了したワークアウトがありません</h2>
            <p className="text-gray-400 mt-2">ワークアウトを完了すると、ここに記録が表示されます。</p>
          </div>
        ) : (
          sortedHistory.map(entry => (
            <div key={entry.id} className="bg-gray-700 p-4 rounded-lg flex items-center justify-between shadow-md">
              <div>
                <h3 className="text-xl font-bold text-white">{entry.workoutName}</h3>
                <div className="flex flex-col sm:flex-row sm:items-center text-sm text-gray-400 mt-1 sm:space-x-4">
                  <span>{formatDate(entry.completedAt)}</span>
                  <span className="flex items-center mt-1 sm:mt-0">
                    <ClockIcon className="w-4 h-4 mr-1" />
                    {formatDuration(entry.totalDuration)}
                  </span>
                </div>
              </div>
              <div className="flex items-center">
                <button
                  onClick={() => openDeleteConfirmation(entry)}
                  className="p-3 bg-red-600 rounded-full text-white hover:bg-red-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 focus:ring-red-600 transition-colors"
                  aria-label={`履歴 ${entry.workoutName} を削除`}
                >
                  <TrashIcon className="w-5 h-5" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      <ConfirmModal
          isOpen={isDeleteModalOpen}
          onClose={closeDeleteConfirmation}
          onConfirm={handleConfirmDelete}
          title="履歴の削除"
          message={entryToDelete ? `「${entryToDelete.workoutName}」のこの履歴を本当に削除しますか？` : ''}
      />
    </>
  );
};

export default WorkoutHistory;
