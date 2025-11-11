import React, { useState, useRef } from 'react';
import { Workout } from '../types';
import ImportConfirmModal from './modals/ImportConfirmModal';
import DownloadIcon from './icons/DownloadIcon';
import UploadIcon from './icons/UploadIcon';
import { loadPresetExercises, PresetExercises } from '../data/presets';
import { useAlert } from './AlertProvider';

interface LocalFileSyncProps {
  localWorkouts: Workout[];
  onWorkoutsLoaded: (workouts: Workout[]) => void;
  onPresetsLoaded?: (presets: PresetExercises) => void;
}

interface ExportData {
  workouts: Workout[];
  exercisePresets?: PresetExercises;
  version?: string;
}

const LocalFileSync: React.FC<LocalFileSyncProps> = ({ localWorkouts, onWorkoutsLoaded, onPresetsLoaded }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [importedWorkouts, setImportedWorkouts] = useState<Workout[] | null>(null);
  const [importedPresets, setImportedPresets] = useState<PresetExercises | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { showAlert } = useAlert();

  const handleExport = () => {
    if (localWorkouts.length === 0) {
      showAlert('エクスポートするワークアウトがありません。', 'エラー');
      return;
    }
    const presets = loadPresetExercises();
    const exportData: ExportData = {
      workouts: localWorkouts,
      exercisePresets: presets,
      version: '1.0',
    };
    const dataStr = JSON.stringify(exportData, null, 2);
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
        const parsed = JSON.parse(text);
        
        // 新しい形式（ExportData）か、古い形式（Workout[]のみ）かを判定
        let workouts: Workout[] = [];
        let presets: PresetExercises | null = null;
        
        if (parsed.workouts && Array.isArray(parsed.workouts)) {
          // 新しい形式
          workouts = parsed.workouts;
          presets = parsed.exercisePresets || null;
        } else if (Array.isArray(parsed)) {
          // 古い形式（後方互換性）
          workouts = parsed;
        } else {
          throw new Error("無効なファイル形式です。");
        }
        
        // Basic validation
        if (workouts.length === 0 || (workouts[0].id && workouts[0].name && workouts[0].exercises)) {
            setImportedWorkouts(workouts);
            setImportedPresets(presets);
            setIsModalOpen(true);
        } else {
            throw new Error("無効なファイル形式です。");
        }
      } catch (error) {
        showAlert(`ファイルのインポートに失敗しました: ${error instanceof Error ? error.message : String(error)}`, 'エラー');
      }
    };
    reader.onerror = () => {
        showAlert("ファイルの読み込み中にエラーが発生しました。", 'エラー');
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
    
    // マスターデータのインポート処理
    if (importedPresets && onPresetsLoaded) {
      if (type === 'overwrite') {
        onPresetsLoaded(importedPresets);
      } else { // merge
        const currentPresets = loadPresetExercises();
        const mergedPresets: PresetExercises = { ...currentPresets };
        
        // インポートしたマスターデータをマージ
        Object.keys(importedPresets).forEach(bodyPart => {
          const importedExercises = importedPresets[bodyPart] || [];
          const currentExercises = mergedPresets[bodyPart] || [];
          
          // 重複を避けてマージ
          const mergedExercises = [...currentExercises];
          importedExercises.forEach(exName => {
            if (!mergedExercises.includes(exName)) {
              mergedExercises.push(exName);
            }
          });
          
          mergedPresets[bodyPart] = mergedExercises;
        });
        
        onPresetsLoaded(mergedPresets);
      }
      showAlert('ワークアウトと種目マスターデータをインポートしました。', '成功');
    } else {
      showAlert('ワークアウトをインポートしました。', '成功');
    }
    
    closeModal();
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setImportedWorkouts(null);
    setImportedPresets(null);
  };
  
  return (
    <div>
      <p className="text-xs text-gray-500 mb-3 text-center">
        ワークアウトデータをファイルとして保存・読み込みできます。バックアップや別デバイスへの移行に便利です。
      </p>
      <div className="flex flex-col sm:flex-row justify-center gap-3">
        <button
            onClick={handleExport}
            className="flex items-center justify-center min-h-[44px] py-2.5 px-5 bg-gray-600 text-white font-semibold rounded-lg hover:bg-gray-500 transition-all duration-200 active:scale-95 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 focus:ring-gray-500 text-sm"
            aria-label="データをファイルにエクスポートする"
        >
          <DownloadIcon className="w-4 h-4 mr-2"/>
          エクスポート
        </button>
        <button
            onClick={handleImportClick}
            className="flex items-center justify-center min-h-[44px] py-2.5 px-5 bg-gray-600 text-white font-semibold rounded-lg hover:bg-gray-500 transition-all duration-200 active:scale-95 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 focus:ring-gray-500 text-sm"
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
            aria-label="ファイル選択"
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