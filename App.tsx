import React, { useState, useEffect, useCallback } from 'react';
import { Workout, WorkoutHistoryEntry } from './types';
import WorkoutList from './components/WorkoutList';
import WorkoutCreator from './components/WorkoutCreator';
import WorkoutPlayer from './components/WorkoutPlayer';
import WorkoutHistory from './components/WorkoutHistory';

type View = 'list' | 'create' | 'player' | 'history';

// --- Cookie Helper Functions ---
function setCookie(name: string, value: string, days: number) {
    let expires = "";
    if (days) {
        const date = new Date();
        date.setTime(date.getTime() + (days * 24 * 60 * 60 * 1000));
        expires = "; expires=" + date.toUTCString();
    }
    const encodedValue = encodeURIComponent(value);
    if (encodedValue.length > 4000) {
        console.warn("Cookie size is approaching the 4KB limit. Data might not be saved correctly in the cookie.");
    }
    document.cookie = name + "=" + (encodedValue || "")  + expires + "; path=/; SameSite=Lax; Secure";
}

function getCookie(name: string): string | null {
    const nameEQ = name + "=";
    const ca = document.cookie.split(';');
    for(let i=0; i < ca.length; i++) {
        let c = ca[i];
        while (c.charAt(0) === ' ') c = c.substring(1, c.length);
        if (c.indexOf(nameEQ) === 0) return decodeURIComponent(c.substring(nameEQ.length, c.length));
    }
    return null;
}
// --- End Cookie Helper Functions ---

const App: React.FC = () => {
  const [workouts, setWorkouts] = useState<Workout[]>([]);
  const [workoutHistory, setWorkoutHistory] = useState<WorkoutHistoryEntry[]>([]);
  const [currentView, setCurrentView] = useState<View>('list');
  const [activeWorkout, setActiveWorkout] = useState<Workout | null>(null);
  const [workoutToEdit, setWorkoutToEdit] = useState<Workout | null>(null);

  useEffect(() => {
    try {
      const savedWorkoutsLS = localStorage.getItem('workouts');
      if (savedWorkoutsLS) {
        setWorkouts(JSON.parse(savedWorkoutsLS));
      } else {
        const savedWorkoutsCookie = getCookie('workouts');
        if (savedWorkoutsCookie) {
          const parsedWorkouts = JSON.parse(savedWorkoutsCookie);
          setWorkouts(parsedWorkouts);
          localStorage.setItem('workouts', JSON.stringify(parsedWorkouts));
        }
      }

      const savedHistoryLS = localStorage.getItem('workoutHistory');
      if(savedHistoryLS) {
        setWorkoutHistory(JSON.parse(savedHistoryLS));
      } else {
        const savedHistoryCookie = getCookie('workoutHistory');
        if (savedHistoryCookie) {
          const parsedHistory = JSON.parse(savedHistoryCookie);
          setWorkoutHistory(parsedHistory);
          localStorage.setItem('workoutHistory', JSON.stringify(parsedHistory));
        }
      }

    } catch (error) {
      console.error("Failed to load data from storage", error);
    }
  }, []);

  const saveWorkouts = useCallback((updatedWorkouts: Workout[]) => {
    try {
      const workoutsString = JSON.stringify(updatedWorkouts);
      localStorage.setItem('workouts', workoutsString);
      setCookie('workouts', workoutsString, 365);
      setWorkouts(updatedWorkouts);
    } catch (error) {
      console.error("Failed to save workouts to storage", error);
    }
  }, []);

  const saveWorkoutHistory = useCallback((updatedHistory: WorkoutHistoryEntry[]) => {
    try {
      const historyString = JSON.stringify(updatedHistory);
      localStorage.setItem('workoutHistory', historyString);
      setCookie('workoutHistory', historyString, 365);
      setWorkoutHistory(updatedHistory);
    } catch (error) {
      console.error("Failed to save workout history to storage", error);
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
    const newHistoryEntry: WorkoutHistoryEntry = {
      id: `hist-${Date.now()}`,
      workoutName: completedWorkout.name,
      completedAt: Date.now(),
      totalDuration: completedWorkout.exercises.reduce((acc, ex) => acc + ex.duration, 0),
    };
    saveWorkoutHistory([...workoutHistory, newHistoryEntry]);
    
    setActiveWorkout(null);
    setCurrentView('list');
  };

  const handleShowHistory = () => {
    setCurrentView('history');
  };

  const handleDeleteHistoryEntry = (entryId: string) => {
    const updatedHistory = workoutHistory.filter(entry => entry.id !== entryId);
    saveWorkoutHistory(updatedHistory);
  };

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
        />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 text-gray-100 font-sans p-4 sm:p-6 lg:p-8">
      <div className="max-w-2xl mx-auto">
        <header className="text-center mb-8">
          <h1 className="text-4xl sm:text-5xl font-bold text-cyan-400 tracking-tight">マイワークアウト</h1>
          <p className="text-gray-400 mt-2">カスタムワークアウトを作成、保存、実行します。</p>
        </header>
        <main className="bg-gray-800 rounded-xl shadow-2xl p-4 sm:p-6 transition-all duration-300">
          {renderContent()}
        </main>
      </div>
    </div>
  );
};

export default App;
