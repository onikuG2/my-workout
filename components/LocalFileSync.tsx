import React, { useState, useRef } from 'react';
import { Workout } from '../types';
import ImportConfirmModal from './modals/ImportConfirmModal';
import DownloadIcon from './icons/DownloadIcon';
import UploadIcon from './icons/UploadIcon';

interface LocalFileSyncProps {
  localWorkouts: Workout[];
  onWorkoutsLoaded: (workouts: Workout[]) => void;
}

const LocalFileSync: React.FC<LocalFileSyncProps> = ({ localWorkouts, onWorkoutsLoaded }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [importedWorkouts, setImportedWorkouts] = useState<Workout[] | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleExport = () => {
    if (localWorkouts.length === 0) {
      alert('エクスポートするワークアウトがありません。');
      return;
    }
    const dataStr = JSON.stringify(localWorkouts, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'my-workouts.json';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const text = e.target?.result;
        if (typeof text !== 'string') {
            throw new Error("ファイルの読み込みに失敗しました。");
        }
        const parsedWorkouts = JSON.parse(text);
        // Basic validation
        if (Array.isArray(parsedWorkouts) && (parsedWorkouts.length === 0 || (parsedWorkouts[0].id && parsedWorkouts[0].name && parsedWorkouts[0].exercises))) {
            setImportedWorkouts(parsedWorkouts);
            setIsModalOpen(true);
        } else {
            throw new Error("無効なファイル形式です。");
        }
      } catch (error) {
        alert(`ファイルのインポートに失敗しました: ${error instanceof Error ? error.message : String(error)}`);
      }
    };
    reader.onerror = () => {
        alert("ファイルの読み込み中にエラーが発生しました。");
    };
    reader.readAsText(file);
    
    // Reset file input to allow re-importing the same file
    event.target.value = '';
  };

  const handleConfirmImport = (type: 'merge' | 'overwrite') => {
    if (!importedWorkouts) return;

    if (type === 'overwrite') {
        onWorkoutsLoaded(importedWorkouts);
    } else { // merge
        const mergedWorkouts = [...localWorkouts];
        importedWorkouts.forEach(importedWorkout => {
            const existingIndex = mergedWorkouts.findIndex(w => w.id === importedWorkout.id);
            if (existingIndex > -1) {
                mergedWorkouts[existingIndex] = importedWorkout; // Overwrite existing with the same ID
            } else {
                mergedWorkouts.push(importedWorkout); // Add new
            }
        });
        onWorkoutsLoaded(mergedWorkouts);
    }
    closeModal();
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setImportedWorkouts(null);
  };
  
  return (
    <div>
      <div className="flex justify-center gap-4">
        <button
            onClick={handleExport}
            className="flex items-center justify-center py-2 px-4 bg-gray-600 text-white font-semibold rounded-lg hover:bg-gray-500 transition-colors text-sm"
            aria-label="データをファイルにエクスポートする"
        >
          <DownloadIcon className="w-4 h-4 mr-2"/>
          エクスポート
        </button>
        <button
            onClick={handleImportClick}
            className="flex items-center justify-center py-2 px-4 bg-gray-600 text-white font-semibold rounded-lg hover:bg-gray-500 transition-colors text-sm"
            aria-label="ファイルからデータをインポートする"
        >
          <UploadIcon className="w-4 h-4 mr-2"/>
          インポート
        </button>
        <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            accept=".json"
            className="hidden"
        />
      </div>
      <ImportConfirmModal
        isOpen={isModalOpen}
        onClose={closeModal}
        onConfirm={handleConfirmImport}
      />
    </div>
  );
};

export default LocalFileSync;