import React, { useState, useEffect, useCallback } from 'react';
import { Workout } from './types';
import WorkoutList from './components/WorkoutList';
import WorkoutCreator from './components/WorkoutCreator';
import WorkoutPlayer from './components/WorkoutPlayer';

type View = 'list' | 'create' | 'player';

const App: React.FC = () => {
  const [workouts, setWorkouts] = useState<Workout[]>([]);
  const [currentView, setCurrentView] = useState<View>('list');
  const [activeWorkout, setActiveWorkout] = useState<Workout | null>(null);
  const [workoutToEdit, setWorkoutToEdit] = useState<Workout | null>(null);

  useEffect(() => {
    try {
      const savedWorkouts = localStorage.getItem('workouts');
      if (savedWorkouts) {
        setWorkouts(JSON.parse(savedWorkouts));
      }
    } catch (error) {
      console.error("Failed to load workouts from localStorage", error);
    }
  }, []);

  const saveWorkouts = useCallback((updatedWorkouts: Workout[]) => {
    try {
      localStorage.setItem('workouts', JSON.stringify(updatedWorkouts));
      setWorkouts(updatedWorkouts);
    } catch (error) {
      console.error("Failed to save workouts to localStorage", error);
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

  const handleFinishWorkout = () => {
    setActiveWorkout(null);
    setCurrentView('list');
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
      case 'list':
      default:
        return <WorkoutList 
          workouts={workouts} 
          onCreate={handleCreateWorkout} 
          onStart={handleStartWorkout} 
          onDelete={handleDeleteWorkout}
          onEdit={handleEditWorkout}
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