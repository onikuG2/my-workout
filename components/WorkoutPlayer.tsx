import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Workout } from '../types';
import PlayIcon from './icons/PlayIcon';
import PauseIcon from './icons/PauseIcon';
import StopIcon from './icons/StopIcon';
import ChevronLeftIcon from './icons/ChevronLeftIcon';

interface WorkoutPlayerProps {
  workout: Workout;
  onFinish: () => void;
}

const WorkoutPlayer: React.FC<WorkoutPlayerProps> = ({ workout, onFinish }) => {
  const [currentExerciseIndex, setCurrentExerciseIndex] = useState(0);
  const [timeLeft, setTimeLeft] = useState(workout.exercises[0].duration);
  const [isPaused, setIsPaused] = useState(true);
  const [isFinished, setIsFinished] = useState(false);

  const intervalRef = useRef<number | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);

  const playSound = useCallback((type: 'tick' | 'end_exercise' | 'end_workout') => {
    if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    const audioContext = audioContextRef.current;
    if (audioContext.state === 'suspended') {
        audioContext.resume();
    }

    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);

    gainNode.gain.setValueAtTime(0, audioContext.currentTime);
    gainNode.gain.linearRampToValueAtTime(0.5, audioContext.currentTime + 0.01);
    
    if (type === 'tick') {
        oscillator.frequency.setValueAtTime(440, audioContext.currentTime); // A4
        oscillator.type = 'sine';
    } else if (type === 'end_exercise') {
        oscillator.frequency.setValueAtTime(660, audioContext.currentTime); // E5
        oscillator.type = 'square';
    } else if (type === 'end_workout') {
        oscillator.frequency.setValueAtTime(880, audioContext.currentTime); // A5
        oscillator.type = 'triangle';
    }
    
    oscillator.start(audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.00001, audioContext.currentTime + 0.2);
    oscillator.stop(audioContext.currentTime + 0.2);
  }, []);

  useEffect(() => {
    if (isPaused || isFinished) {
      if (intervalRef.current) clearInterval(intervalRef.current);
      return;
    }

    intervalRef.current = window.setInterval(() => {
      setTimeLeft(prevTime => {
        if (prevTime <= 1) {
          if (currentExerciseIndex < workout.exercises.length - 1) {
            playSound('end_exercise');
            setCurrentExerciseIndex(prevIndex => prevIndex + 1);
            return workout.exercises[currentExerciseIndex + 1].duration;
          } else {
            playSound('end_workout');
            setIsFinished(true);
            if (intervalRef.current) clearInterval(intervalRef.current);
            return 0;
          }
        }
        if (prevTime > 1 && prevTime <= 4) {
          playSound('tick');
        }
        return prevTime - 1;
      });
    }, 1000);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isPaused, currentExerciseIndex, workout.exercises, isFinished, playSound]);

  const togglePause = () => {
    if (audioContextRef.current && audioContextRef.current.state === 'suspended') {
      audioContextRef.current.resume();
    }
    setIsPaused(!isPaused);
  };

  const currentExercise = workout.exercises[currentExerciseIndex];
  const nextExercise = workout.exercises[currentExerciseIndex + 1];
  const progress = ((currentExercise.duration - timeLeft) / currentExercise.duration) * 100;
  
  if (isFinished) {
    return (
      <div className="text-center p-8 flex flex-col items-center justify-center h-96">
        <h2 className="text-4xl font-bold text-green-400">ワークアウト完了！</h2>
        <p className="text-gray-300 mt-4">お疲れ様でした！{workout.name} ワークアウトが終了しました。</p>
        <button
          onClick={onFinish}
          className="mt-8 py-2 px-6 bg-cyan-500 text-white font-semibold rounded-md hover:bg-cyan-600 transition-colors flex items-center"
        >
          <ChevronLeftIcon className="w-5 h-5 mr-2" />
          一覧に戻る
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center text-center p-4 h-[500px]">
      <div className="w-full text-left mb-4">
        <button onClick={onFinish} className="text-cyan-400 hover:text-cyan-300 flex items-center text-sm">
          <ChevronLeftIcon className="w-4 h-4 mr-1" /> ワークアウト一覧に戻る
        </button>
      </div>
      
      <div className="flex-grow flex flex-col items-center justify-center">
        <p className="text-lg text-gray-400">
            エクササイズ {currentExerciseIndex + 1} / {workout.exercises.length}
        </p>
        <h2 className="text-4xl sm:text-5xl font-bold text-white my-2 break-words max-w-full">{currentExercise.name}</h2>
        
        {(currentExercise.weight || currentExercise.reps) && (
            <div className="flex items-center justify-center space-x-6 text-xl text-gray-300 mb-4">
                {currentExercise.weight && <span>⚖️ {currentExercise.weight} kg</span>}
                {currentExercise.reps && <span>🔄 {currentExercise.reps} 回</span>}
            </div>
        )}

        <div className="relative my-4 w-60 h-60 sm:w-64 sm:h-64 flex items-center justify-center">
            <svg className="absolute w-full h-full" viewBox="0 0 100 100">
                <circle className="text-gray-700" strokeWidth="8" stroke="currentColor" fill="transparent" r="45" cx="50" cy="50" />
                <circle
                    className="text-cyan-400"
                    strokeWidth="8"
                    strokeDasharray={2 * Math.PI * 45}
                    strokeDashoffset={(2 * Math.PI * 45) * (1 - progress / 100)}
                    strokeLinecap="round"
                    stroke="currentColor"
                    fill="transparent"
                    r="45"
                    cx="50"
                    cy="50"
                    style={{ transform: 'rotate(-90deg)', transformOrigin: '50% 50%', transition: 'stroke-dashoffset 1s linear' }}
                />
            </svg>
            <span className="text-6xl sm:text-7xl font-mono font-bold">{timeLeft}</span>
        </div>

        <p className="text-gray-400 h-6">
          次: {nextExercise ? nextExercise.name : '終了！'}
        </p>
      </div>
      
      <div className="flex items-center space-x-6 mt-4">
        <button
          onClick={togglePause}
          className="w-20 h-20 bg-cyan-500 rounded-full text-white flex items-center justify-center text-2xl font-bold hover:bg-cyan-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 focus:ring-cyan-500 transition-colors"
          aria-label={isPaused ? "再生" : "一時停止"}
        >
          {isPaused ? <PlayIcon className="w-10 h-10 ml-1"/> : <PauseIcon className="w-10 h-10" />}
        </button>
        <button
          onClick={onFinish}
          className="w-16 h-16 bg-red-600 rounded-full text-white flex items-center justify-center hover:bg-red-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 focus:ring-red-600 transition-colors"
          aria-label="ワークアウトを停止"
        >
            <StopIcon className="w-8 h-8"/>
        </button>
      </div>
    </div>
  );
};

export default WorkoutPlayer;