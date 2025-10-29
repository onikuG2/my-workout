import React, { useState } from 'react';
import GoogleDriveIcon from './icons/GoogleDriveIcon';
import SpinnerIcon from './icons/SpinnerIcon';
import MergeConfirmModal from './modals/MergeConfirmModal';
import { Workout } from '../types';

// Fix: Add a global declaration for window.gapi to inform TypeScript of its existence.
declare global {
  interface Window {
    gapi: any;
  }
}

const FILE_NAME = 'workouts.json';

interface GoogleDriveSyncProps {
  isGapiLoaded: boolean;
  isSignedIn: boolean;
  onAuthClick: () => void;
  onSignoutClick: () => void;
  localWorkouts: Workout[];
  onWorkoutsLoaded: (workouts: Workout[]) => void;
  authError: string | null;
}

type SyncState = 'idle' | 'loading' | 'success' | 'error';
type SyncOperation = 'save' | 'load' | null;

const GoogleDriveSync: React.FC<GoogleDriveSyncProps> = ({ 
    isGapiLoaded, isSignedIn, onAuthClick, onSignoutClick, localWorkouts, onWorkoutsLoaded, authError 
}) => {
  const [syncState, setSyncState] = useState<SyncState>('idle');
  const [operation, setOperation] = useState<SyncOperation>(null);
  const [isMergeModalOpen, setIsMergeModalOpen] = useState(false);
  const [driveWorkouts, setDriveWorkouts] = useState<Workout[] | null>(null);

  const getFileId = async (): Promise<string | null> => {
    const response = await window.gapi.client.drive.files.list({
      spaces: 'appDataFolder',
      fields: 'files(id, name)',
    });
    const files = response.result.files;
    const existingFile = files.find((file: any) => file.name === FILE_NAME);
    return existingFile ? existingFile.id : null;
  };
  
  const handleSaveToDrive = async () => {
    setOperation('save');
    setSyncState('loading');
    const fileId = await getFileId();
    const content = JSON.stringify(localWorkouts, null, 2);
    const blob = new Blob([content], { type: 'application/json' });
  
    const form = new FormData();
    form.append('metadata', new Blob([JSON.stringify({ name: FILE_NAME, parents: ['appDataFolder'] })], { type: 'application/json' }));
    form.append('file', blob);

    const path = `/upload/drive/v3/files${fileId ? `/${fileId}` : ''}`;
    const method = fileId ? 'PATCH' : 'POST';

    try {
      await window.gapi.client.request({
        path: path,
        method: method,
        params: { uploadType: 'multipart' },
        body: form
      });
      setSyncState('success');
    } catch (error) {
      console.error("Error saving to Drive", error);
      setSyncState('error');
    } finally {
      setTimeout(() => setSyncState('idle'), 2000);
    }
  };

  const handleLoadFromDrive = async () => {
    setOperation('load');
    setSyncState('loading');
    try {
        const fileId = await getFileId();
        if (!fileId) {
            alert("Google Driveにバックアップファイルが見つかりません。");
            setSyncState('idle');
            return;
        }

        const response = await window.gapi.client.drive.files.get({
            fileId: fileId,
            alt: 'media',
        });
        
        const loadedWorkouts = JSON.parse(response.body);
        setDriveWorkouts(loadedWorkouts);
        setIsMergeModalOpen(true);
        // Modal will handle the final state update
    } catch (error) {
        console.error("Error loading from Drive", error);
        setSyncState('error');
        setTimeout(() => setSyncState('idle'), 2000);
    }
  };

  const handleConfirmMerge = (type: 'merge' | 'overwrite') => {
    if (!driveWorkouts) return;
    if (type === 'overwrite') {
        onWorkoutsLoaded(driveWorkouts);
    } else { // merge
        const mergedWorkouts = [...localWorkouts];
        
        driveWorkouts.forEach(driveWorkout => {
            const existingIndex = mergedWorkouts.findIndex(w => w.id === driveWorkout.id);
            if(existingIndex > -1) {
                mergedWorkouts[existingIndex] = driveWorkout; // Overwrite existing with the same ID
            } else {
                mergedWorkouts.push(driveWorkout); // Add new
            }
        });
        onWorkoutsLoaded(mergedWorkouts);
    }
    closeMergeModal();
  };

  const closeMergeModal = () => {
    setIsMergeModalOpen(false);
    setDriveWorkouts(null);
    setSyncState('success');
    setTimeout(() => setSyncState('idle'), 2000);
  }

  const renderButtonContent = (btnOperation: SyncOperation, text: string) => {
    if (syncState === 'loading' && operation === btnOperation) return <SpinnerIcon className="w-5 h-5 animate-spin" />;
    if (syncState === 'success' && operation === btnOperation) return '完了!';
    if (syncState === 'error' && operation === btnOperation) return 'エラー';
    return text;
  };
  
  return (
    <div className="bg-gray-700/50 p-4 rounded-lg">
      <h3 className="text-lg font-semibold text-gray-200 mb-3 flex items-center">
        <GoogleDriveIcon className="w-6 h-6 mr-2" />
        Google Drive バックアップ
      </h3>
      {authError ? (
          <div className="text-center text-red-400 bg-red-900/50 p-3 rounded-md">{authError}</div>
      ) :!isGapiLoaded ? (
        <div className="text-center text-gray-400">APIを読み込み中...</div>
      ) : !isSignedIn ? (
        <button
          onClick={onAuthClick}
          className="w-full flex items-center justify-center py-2 px-4 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors"
        >
          Googleアカウントに接続
        </button>
      ) : (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-300">
                ログイン済み
            </span>
            <button onClick={onSignoutClick} className="text-xs text-cyan-400 hover:underline">
              切断
            </button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <button
                onClick={handleSaveToDrive}
                disabled={syncState === 'loading'}
                className="py-2 px-4 bg-green-600 text-white font-semibold rounded-lg hover:bg-green-700 disabled:bg-gray-500 disabled:cursor-not-allowed transition-colors"
            >
              {renderButtonContent('save', 'Driveに保存')}
            </button>
            <button
                onClick={handleLoadFromDrive}
                disabled={syncState === 'loading'}
                className="py-2 px-4 bg-cyan-600 text-white font-semibold rounded-lg hover:bg-cyan-700 disabled:bg-gray-500 disabled:cursor-not-allowed transition-colors"
            >
              {renderButtonContent('load', 'Driveから読み込み')}
            </button>
          </div>
        </div>
      )}
      <MergeConfirmModal 
        isOpen={isMergeModalOpen}
        onClose={closeMergeModal}
        onConfirm={handleConfirmMerge}
      />
    </div>
  );
};

export default GoogleDriveSync;