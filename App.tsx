import React, { useState, useEffect, useCallback } from 'react';
import { Workout, WorkoutHistoryEntry } from './types';
import WorkoutList from './components/WorkoutList';
import WorkoutCreator from './components/WorkoutCreator';
import WorkoutPlayer from './components/WorkoutPlayer';
import WorkoutHistory from './components/WorkoutHistory';
import ExerciseMaster from './components/ExerciseMaster';
import ErrorBoundary from './components/ErrorBoundary';
import { savePresetExercises, PresetExercises } from './data/presets';

type View = 'list' | 'create' | 'player' | 'history' | 'master';

// --- Cookie Helper Functions ---
function setCookie(name: string, value: string, days: number): boolean {
    try {
        let expires = "";
        if (days) {
            const date = new Date();
            date.setTime(date.getTime() + (days * 24 * 60 * 60 * 1000));
            expires = "; expires=" + date.toUTCString();
        }
        const encodedValue = encodeURIComponent(value);
        if (encodedValue.length > 4000) {
            console.warn("Cookie size is approaching the 4KB limit. Data might not be saved correctly in the cookie.");
            return false;
        }
        document.cookie = name + "=" + (encodedValue || "")  + expires + "; path=/; SameSite=Lax; Secure";
        return true;
    } catch (error) {
        console.error(`Failed to set cookie ${name}:`, error);
        return false;
    }
}

function getCookie(name: string): string | null {
    try {
        const nameEQ = name + "=";
        const ca = document.cookie.split(';');
        for(let i=0; i < ca.length; i++) {
            let c = ca[i];
            while (c.charAt(0) === ' ') c = c.substring(1, c.length);
            if (c.indexOf(nameEQ) === 0) {
                try {
                    return decodeURIComponent(c.substring(nameEQ.length, c.length));
                } catch (e) {
                    console.error(`Failed to decode cookie ${name}:`, e);
                    return null;
                }
            }
        }
        return null;
    } catch (error) {
        console.error(`Failed to get cookie ${name}:`, error);
        return null;
    }
}
// --- End Cookie Helper Functions ---

/**
 * Workoutデータの検証
 */
function validateWorkout(data: any): data is Workout {
    if (!data || typeof data !== 'object') return false;
    if (!data.id || typeof data.id !== 'string') return false;
    if (!data.name || typeof data.name !== 'string') return false;
    if (!Array.isArray(data.exercises)) return false;
    return true;
}

/**
 * WorkoutHistoryEntryデータの検証
 */
function validateWorkoutHistoryEntry(data: any): data is WorkoutHistoryEntry {
    if (!data || typeof data !== 'object') return false;
    if (!data.id || typeof data.id !== 'string') return false;
    if (!data.workoutName || typeof data.workoutName !== 'string') return false;
    if (typeof data.completedAt !== 'number') return false;
    return true;
}

const App: React.FC = () => {
  const [workouts, setWorkouts] = useState<Workout[]>([]);
  const [workoutHistory, setWorkoutHistory] = useState<WorkoutHistoryEntry[]>([]);
  const [currentView, setCurrentView] = useState<View>('list');
  const [activeWorkout, setActiveWorkout] = useState<Workout | null>(null);
  const [workoutToEdit, setWorkoutToEdit] = useState<Workout | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    const loadData = () => {
      try {
        setLoadError(null);
        
        // ワークアウトデータの読み込み
        let loadedWorkouts: Workout[] = [];
        const savedWorkoutsLS = localStorage.getItem('workouts');
        if (savedWorkoutsLS) {
          try {
            const parsed = JSON.parse(savedWorkoutsLS);
            if (Array.isArray(parsed)) {
              // データ検証とフィルタリング
              loadedWorkouts = parsed.filter(validateWorkout);
              if (loadedWorkouts.length !== parsed.length) {
                console.warn('Some workout data was invalid and filtered out');
              }
            } else {
              throw new Error('Invalid data format');
            }
          } catch (parseError) {
            console.error('Failed to parse workouts from localStorage:', parseError);
            // 破損したデータを削除
            try {
              localStorage.removeItem('workouts');
            } catch (e) {
              console.error('Failed to remove corrupted data:', e);
            }
          }
        }
        
        // localStorageにデータがない場合、Cookieから読み込む
        if (loadedWorkouts.length === 0) {
          const savedWorkoutsCookie = getCookie('workouts');
          if (savedWorkoutsCookie) {
            try {
              const parsed = JSON.parse(savedWorkoutsCookie);
              if (Array.isArray(parsed)) {
                loadedWorkouts = parsed.filter(validateWorkout);
                // Cookieから読み込んだデータをlocalStorageに保存
                if (loadedWorkouts.length > 0) {
                  try {
                    localStorage.setItem('workouts', JSON.stringify(loadedWorkouts));
                  } catch (e) {
                    console.warn('Failed to save workouts to localStorage:', e);
                  }
                }
              }
            } catch (parseError) {
              console.error('Failed to parse workouts from cookie:', parseError);
            }
          }
        }
        
        setWorkouts(loadedWorkouts);

        // 履歴データの読み込み
        let loadedHistory: WorkoutHistoryEntry[] = [];
        const savedHistoryLS = localStorage.getItem('workoutHistory');
        if (savedHistoryLS) {
          try {
            const parsed = JSON.parse(savedHistoryLS);
            if (Array.isArray(parsed)) {
              // データ検証とフィルタリング
              loadedHistory = parsed.filter(validateWorkoutHistoryEntry);
              if (loadedHistory.length !== parsed.length) {
                console.warn('Some history data was invalid and filtered out');
              }
            } else {
              throw new Error('Invalid data format');
            }
          } catch (parseError) {
            console.error('Failed to parse history from localStorage:', parseError);
            // 破損したデータを削除
            try {
              localStorage.removeItem('workoutHistory');
            } catch (e) {
              console.error('Failed to remove corrupted data:', e);
            }
          }
        }
        
        // localStorageにデータがない場合、Cookieから読み込む
        if (loadedHistory.length === 0) {
          const savedHistoryCookie = getCookie('workoutHistory');
          if (savedHistoryCookie) {
            try {
              const parsed = JSON.parse(savedHistoryCookie);
              if (Array.isArray(parsed)) {
                loadedHistory = parsed.filter(validateWorkoutHistoryEntry);
                // Cookieから読み込んだデータをlocalStorageに保存
                if (loadedHistory.length > 0) {
                  try {
                    localStorage.setItem('workoutHistory', JSON.stringify(loadedHistory));
                  } catch (e) {
                    console.warn('Failed to save history to localStorage:', e);
                  }
                }
              }
            } catch (parseError) {
              console.error('Failed to parse history from cookie:', parseError);
            }
          }
        }
        
        setWorkoutHistory(loadedHistory);

      } catch (error) {
        console.error("Failed to load data from storage", error);
        setLoadError("データの読み込みに失敗しました。保存されたデータが破損している可能性があります。");
      }
    };
    
    loadData();
  }, []);

  const saveWorkouts = useCallback((updatedWorkouts: Workout[]) => {
    try {
      // データ検証
      const validWorkouts = updatedWorkouts.filter(validateWorkout);
      if (validWorkouts.length !== updatedWorkouts.length) {
        console.warn('Some workouts were invalid and filtered out');
      }
      
      const workoutsString = JSON.stringify(validWorkouts);
      
      // localStorageに保存
      try {
        localStorage.setItem('workouts', workoutsString);
      } catch (e) {
        console.error('Failed to save workouts to localStorage:', e);
        // localStorageが満杯の場合、古いデータを削除して再試行
        if (e instanceof DOMException && e.code === 22) {
          try {
            localStorage.removeItem('workoutHistory');
            localStorage.setItem('workouts', workoutsString);
          } catch (retryError) {
            console.error('Failed to save workouts after cleanup:', retryError);
          }
        }
      }
      
      // Cookieに保存（失敗しても続行）
      setCookie('workouts', workoutsString, 365);
      
      setWorkouts(validWorkouts);
    } catch (error) {
      console.error("Failed to save workouts to storage", error);
      // エラーが発生しても状態は更新（メモリ上では動作する）
      setWorkouts(updatedWorkouts);
    }
  }, []);

  const saveWorkoutHistory = useCallback((updatedHistory: WorkoutHistoryEntry[]) => {
    try {
      // データ検証
      const validHistory = updatedHistory.filter(validateWorkoutHistoryEntry);
      if (validHistory.length !== updatedHistory.length) {
        console.warn('Some history entries were invalid and filtered out');
      }
      
      const historyString = JSON.stringify(validHistory);
      
      // localStorageに保存
      try {
        localStorage.setItem('workoutHistory', historyString);
      } catch (e) {
        console.error('Failed to save history to localStorage:', e);
        // localStorageが満杯の場合、古い履歴を削除して再試行
        if (e instanceof DOMException && e.code === 22) {
          try {
            // 古い履歴を削除（最新の100件を保持）
            const recentHistory = validHistory.slice(-100);
            localStorage.setItem('workoutHistory', JSON.stringify(recentHistory));
            setWorkoutHistory(recentHistory);
            return;
          } catch (retryError) {
            console.error('Failed to save history after cleanup:', retryError);
          }
        }
      }
      
      // Cookieに保存（失敗しても続行）
      setCookie('workoutHistory', historyString, 365);
      
      setWorkoutHistory(validHistory);
    } catch (error) {
      console.error("Failed to save workout history to storage", error);
      // エラーが発生しても状態は更新（メモリ上では動作する）
      setWorkoutHistory(updatedHistory);
    }
  }, []);

  const handleCreateWorkout = () => {
    setWorkoutToEdit(null);
    setCurrentView('create');
  };

  const handleEditWorkout = (workout: Workout) => {
    setWorkoutToEdit(workout);
    setCurrentView('create');
  };

  const handleSaveWorkout = (workout: Workout) => {
    const existingIndex = workouts.findIndex(w => w.id === workout.id);
    let newWorkouts;
    if (existingIndex > -1) {
        newWorkouts = [...workouts];
        newWorkouts[existingIndex] = workout;
    } else {
        newWorkouts = [...workouts, workout];
    }
    saveWorkouts(newWorkouts);
    setWorkoutToEdit(null);
    setCurrentView('list');
  };

  const handleDeleteWorkout = (workoutId: string) => {
    const updatedWorkouts = workouts.filter(w => w.id !== workoutId);
    saveWorkouts(updatedWorkouts);
  };

  const handleStartWorkout = (workout: Workout) => {
    setActiveWorkout(workout);
    setCurrentView('player');
  };
  
  const handleCancelCreate = () => {
    setWorkoutToEdit(null);
    setCurrentView('list');
  };

  const handleFinishWorkout = (completedWorkout: Workout) => {
    try {
      const newHistoryEntry: WorkoutHistoryEntry = {
        id: `hist-${Date.now()}`,
        workoutName: completedWorkout.name,
        completedAt: Date.now(),
        totalDuration: completedWorkout.exercises.reduce((acc, ex) => acc + ((ex.duration || 0) + (ex.restDuration || 0)) * (ex.sets || 1), 0),
        exercises: completedWorkout.exercises.map(ex => ({ ...ex })), // エクササイズ詳細を保存
      };
      saveWorkoutHistory([...workoutHistory, newHistoryEntry]);
    } catch (error) {
      console.error('Failed to save workout history:', error);
    }
    
    // 状態を更新する前にactiveWorkoutをクリア
    setActiveWorkout(null);
    // ビューを変更
    setCurrentView('list');
  };

  const handleShowHistory = () => {
    setCurrentView('history');
  };

  const handleOpenMaster = () => {
    setCurrentView('master');
  };

  const handleDeleteHistoryEntry = (entryId: string) => {
    const updatedHistory = workoutHistory.filter(entry => entry.id !== entryId);
    saveWorkoutHistory(updatedHistory);
  };

  const handlePresetsLoaded = useCallback((presets: PresetExercises) => {
    try {
      savePresetExercises(presets);
      // マスターデータを更新したので、種目マスター画面を開いている場合は更新を反映
      // WorkoutCreatorは毎回loadPresetExercisesを呼ぶので、次回開く時に反映される
    } catch (error) {
      console.error("Failed to save presets", error);
    }
  }, []);

  const renderContent = () => {
    switch (currentView) {
      case 'create':
        return <WorkoutCreator onSave={handleSaveWorkout} onCancel={handleCancelCreate} workoutToEdit={workoutToEdit} />;
      case 'player':
        if (activeWorkout) {
          return <WorkoutPlayer workout={activeWorkout} onFinish={handleFinishWorkout} />;
        }
        return null;
      case 'history':
        return <WorkoutHistory 
          history={workoutHistory}
          onDelete={handleDeleteHistoryEntry}
          onBack={() => setCurrentView('list')}
        />;
      case 'master':
        return <ExerciseMaster onBack={() => setCurrentView('list')} />;
      case 'list':
      default:
        return <WorkoutList 
          workouts={workouts} 
          setWorkouts={saveWorkouts}
          onCreate={handleCreateWorkout} 
          onStart={handleStartWorkout} 
          onDelete={handleDeleteWorkout}
          onEdit={handleEditWorkout}
          onShowHistory={handleShowHistory}
          onOpenMaster={handleOpenMaster}
          onPresetsLoaded={handlePresetsLoaded}
        />;
    }
  };

  const getBreadcrumb = () => {
    switch (currentView) {
      case 'create':
        return [{ label: 'ホーム', view: 'list' as View }, { label: workoutToEdit ? 'ワークアウトの編集' : '新しいワークアウトの作成', view: 'create' as View }];
      case 'player':
        return [{ label: 'ホーム', view: 'list' as View }, { label: 'ワークアウト実行', view: 'player' as View }];
      case 'history':
        return [{ label: 'ホーム', view: 'list' as View }, { label: 'ワークアウト履歴', view: 'history' as View }];
      case 'master':
        return [{ label: 'ホーム', view: 'list' as View }, { label: '種目マスター', view: 'master' as View }];
      default:
        return [{ label: 'ホーム', view: 'list' as View }];
    }
  };

  const breadcrumbs = getBreadcrumb();

  return (
    <div className="min-h-screen bg-gray-900 text-gray-100 font-sans p-4 sm:p-6 lg:p-8">
      <div className="max-w-2xl mx-auto">
        <header className="text-center mb-6 sm:mb-8">
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-cyan-400 tracking-tight">マイワークアウト</h1>
          <p className="text-gray-400 mt-2 text-sm sm:text-base">カスタムワークアウトを作成、保存、実行します。</p>
        </header>
        
        {/* パンくずリスト */}
        {currentView !== 'list' && (
          <nav className="mb-4" aria-label="パンくずリスト">
            <ol className="flex items-center space-x-2 text-sm text-gray-400">
              {breadcrumbs.map((crumb, index) => (
                <li key={index} className="flex items-center">
                  {index > 0 && <span className="mx-2">/</span>}
                  {index === breadcrumbs.length - 1 ? (
                    <span className="text-gray-300 font-medium">{crumb.label}</span>
                  ) : (
                    <button
                      onClick={() => setCurrentView(crumb.view)}
                      className="hover:text-cyan-400 transition-colors focus:outline-none focus:ring-2 focus:ring-cyan-500 rounded px-1"
                      aria-label={`${crumb.label}に戻る`}
                    >
                      {crumb.label}
                    </button>
                  )}
                </li>
              ))}
            </ol>
          </nav>
        )}
        
        <main className="bg-gray-800 rounded-xl shadow-2xl p-4 sm:p-6 transition-all duration-300">
          {loadError ? (
            <div className="bg-red-900/50 border border-red-500 text-red-300 p-4 rounded-lg text-center">
              <p className="font-semibold text-base">エラー</p>
              <p className="text-sm mt-1">{loadError}</p>
            </div>
          ) : (
            <ErrorBoundary>
              {renderContent()}
            </ErrorBoundary>
          )}
        </main>
      </div>
    </div>
  );
};

export default App;