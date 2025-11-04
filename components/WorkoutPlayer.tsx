
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Workout, Exercise } from '../types';
import PlayIcon from './icons/PlayIcon';
import PauseIcon from './icons/PauseIcon';
import StopIcon from './icons/StopIcon';
import ChevronDoubleLeftIcon from './icons/ChevronDoubleLeftIcon';
import ChevronDoubleRightIcon from './icons/ChevronDoubleRightIcon';
import TwitterIcon from './icons/TwitterIcon';
import { tweetWorkout } from '../utils/twitter';
import WorkoutImageCard from './WorkoutImageCard';
import { generateWorkoutImage, copyImageToClipboard, tweetWithImage } from '../utils/workoutImage';
import { useAlert } from './AlertProvider';

interface WorkoutPlayerProps {
  workout: Workout;
  onFinish: (workout: Workout) => void;
}

type Phase = 'work' | 'rest' | 'rep_wait';

declare var confetti: any;

const WorkoutPlayer: React.FC<WorkoutPlayerProps> = ({ workout, onFinish }) => {
  const [exerciseIndex, setExerciseIndex] = useState(0);
  const [setIndex, setSetIndex] = useState(0);
  const [phase, setPhase] = useState<Phase>('work');
  const [timeLeft, setTimeLeft] = useState(0);
  const [isPaused, setIsPaused] = useState(true);
  const [isFinished, setIsFinished] = useState(false);
  const [isGeneratingImage, setIsGeneratingImage] = useState(false);
  const imageCardRef = useRef<HTMLDivElement>(null);
  const { showAlert } = useAlert();

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);

  const currentExercise = workout.exercises[exerciseIndex];
  const totalSets = currentExercise?.sets || 1;

  const playCompletionSound = useCallback(() => {
    if (!audioContextRef.current) return;

    const audioContext = audioContextRef.current;
    if (audioContext.state === 'suspended') {
      audioContext.resume();
    }

    const now = audioContext.currentTime;
    
    // 華やかな完成音：メジャーコード（C-E-G-C）のアーペジオ
    const notes = [
      { freq: 523.25, time: 0 },    // C5
      { freq: 659.25, time: 0.1 },  // E5
      { freq: 783.99, time: 0.2 },  // G5
      { freq: 1046.50, time: 0.3 }, // C6
    ];

    notes.forEach((note, index) => {
      const oscillator1 = audioContext.createOscillator();
      const oscillator2 = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      
      oscillator1.type = 'sine';
      oscillator2.type = 'triangle';
      
      oscillator1.frequency.setValueAtTime(note.freq, now + note.time);
      oscillator2.frequency.setValueAtTime(note.freq * 2, now + note.time); // オクターブ上
      
      oscillator1.connect(gainNode);
      oscillator2.connect(gainNode);
      gainNode.connect(audioContext.destination);
      
      // エンベロープ：各音が華やかに響く
      const startTime = now + note.time;
      const duration = 0.4;
      
      gainNode.gain.setValueAtTime(0, startTime);
      gainNode.gain.linearRampToValueAtTime(0.25, startTime + 0.05);
      gainNode.gain.exponentialRampToValueAtTime(0.01, startTime + duration);
      
      oscillator1.start(startTime);
      oscillator2.start(startTime);
      oscillator1.stop(startTime + duration);
      oscillator2.stop(startTime + duration);
    });
  }, []);

  const playSound = useCallback((sound: 'tick' | 'end_exercise') => {
    if (!audioContextRef.current) return;

    const audioContext = audioContextRef.current;
    if (audioContext.state === 'suspended') {
      audioContext.resume();
    }

    const now = audioContext.currentTime;

    if (sound === 'tick') {
      // カウントダウン音：よりクリアで心地よい音
      const oscillator1 = audioContext.createOscillator();
      const oscillator2 = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      
      oscillator1.type = 'sine';
      oscillator2.type = 'sine';
      
      // メインの周波数（A5）とハーモニック（オクターブ上）
      oscillator1.frequency.setValueAtTime(880, now);
      oscillator2.frequency.setValueAtTime(1760, now);
      
      oscillator1.connect(gainNode);
      oscillator2.connect(gainNode);
      gainNode.connect(audioContext.destination);
      
      // エンベロープ：滑らかなフェードイン・アウト
      gainNode.gain.setValueAtTime(0, now);
      gainNode.gain.linearRampToValueAtTime(0.15, now + 0.01);
      gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.08);
      
      oscillator1.start(now);
      oscillator2.start(now);
      oscillator1.stop(now + 0.08);
      oscillator2.stop(now + 0.08);
    } else { // end_exercise
      // 終了音：より充実した音
      const oscillator1 = audioContext.createOscillator();
      const oscillator2 = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      
      oscillator1.type = 'sine';
      oscillator2.type = 'triangle';
      
      // 美しい和音（C5とE5）
      oscillator1.frequency.setValueAtTime(523.25, now); // C5
      oscillator2.frequency.setValueAtTime(659.25, now); // E5
      
      oscillator1.connect(gainNode);
      oscillator2.connect(gainNode);
      gainNode.connect(audioContext.destination);
      
      // エンベロープ：滑らかなフェードイン・アウト
      gainNode.gain.setValueAtTime(0, now);
      gainNode.gain.linearRampToValueAtTime(0.2, now + 0.05);
      gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.3);
      
      oscillator1.start(now);
      oscillator2.start(now);
      oscillator1.stop(now + 0.3);
      oscillator2.stop(now + 0.3);
    }
  }, []);

  const moveToNext = useCallback(() => {
    playSound('end_exercise');

    const isLastExercise = exerciseIndex === workout.exercises.length - 1;
    const isLastSet = setIndex === totalSets - 1;

    // Case 1: ワークまたはレップ待機フェーズが完了し、休憩がある場合 -> 休憩フェーズへ
    // ただし、最終エクササイズの最終セットの場合は休憩をスキップする
    if ((phase === 'work' || phase === 'rep_wait') && (currentExercise.restDuration || 0) > 0 && !(isLastExercise && isLastSet)) {
      setPhase('rest');
      setTimeLeft(currentExercise.restDuration as number);
      setIsPaused(false); // 休憩タイマーは自動的に開始
      return;
    }

    // Case 2: 次のセットがある場合 -> 次のセットへ
    if (setIndex < totalSets - 1) {
      setSetIndex(prev => prev + 1);
      const isRepBased = currentExercise.duration === 0;
      setPhase(isRepBased ? 'rep_wait' : 'work');
      setTimeLeft(currentExercise.duration);
      setIsPaused(isRepBased); // 回数ベースなら一時停止、時間ベースなら続行
      return;
    }

    // Case 3: 次のエクササイズがある場合 -> 次のエクササイズへ
    if (exerciseIndex < workout.exercises.length - 1) {
      const nextExercise = workout.exercises[exerciseIndex + 1];
      setExerciseIndex(prev => prev + 1);
      setSetIndex(0);
      const isRepBased = nextExercise.duration === 0;
      setPhase(isRepBased ? 'rep_wait' : 'work');
      setTimeLeft(nextExercise.duration);
      setIsPaused(isRepBased); // 回数ベースなら一時停止、時間ベースなら続行
      return;
    }

    // Case 4: ワークアウト終了
    setIsFinished(true);
    setIsPaused(true);
    playCompletionSound();
  }, [phase, currentExercise, setIndex, totalSets, exerciseIndex, workout.exercises, playSound, playCompletionSound]);

  useEffect(() => {
    const firstExercise = workout.exercises[0];
    if (firstExercise) {
      setTimeLeft(firstExercise.duration);
      setPhase(firstExercise.duration > 0 ? 'work' : 'rep_wait');
    }
    
    return () => {
        if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
            audioContextRef.current.close();
        }
    }
  }, [workout.exercises]);

  useEffect(() => {
    if (isPaused || isFinished || phase === 'rep_wait') {
      if (timerRef.current) clearInterval(timerRef.current);
      return;
    }
    timerRef.current = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          moveToNext();
          return 0;
        }
        if (prev <= 4) {
          playSound('tick');
        }
        return prev - 1;
      });
    }, 1000);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isPaused, isFinished, phase, playSound, moveToNext]);
  
  useEffect(() => {
    if (isFinished && typeof confetti === 'function') {
      const duration = 2 * 1000;
      const animationEnd = Date.now() + duration;
      const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 0 };

      const randomInRange = (min: number, max: number) => {
        return Math.random() * (max - min) + min;
      }

      const interval: ReturnType<typeof setInterval> = setInterval(() => {
        const timeLeft = animationEnd - Date.now();

        if (timeLeft <= 0) {
          return clearInterval(interval);
        }

        const particleCount = 50 * (timeLeft / duration);
        confetti({ ...defaults, particleCount, origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 } });
        confetti({ ...defaults, particleCount, origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 } });
      }, 250);

      return () => clearInterval(interval);
    }
  }, [isFinished]);

  const handlePlayPause = () => {
    if (!audioContextRef.current) {
        try {
            audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
        } catch (e) {
            console.error("Web Audio API is not supported in this browser.");
        }
    }

    if (phase === 'rep_wait') {
      moveToNext();
    } else {
      setIsPaused(prev => !prev);
    }
  };
  
  const handleSkip = useCallback((direction: 1 | -1) => {
    if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
    }

    if (direction === 1) { // Forward
        if (setIndex < totalSets - 1) {
            // Move to the next set
            setSetIndex(prev => prev + 1);
            setPhase(currentExercise.duration > 0 ? 'work' : 'rep_wait');
            setTimeLeft(currentExercise.duration);
            setIsPaused(true);
        } else if (exerciseIndex < workout.exercises.length - 1) {
            // Move to the next exercise
            const nextExerciseIndex = exerciseIndex + 1;
            const nextExercise = workout.exercises[nextExerciseIndex];
            setExerciseIndex(nextExerciseIndex);
            setSetIndex(0);
            setPhase(nextExercise.duration > 0 ? 'work' : 'rep_wait');
            setTimeLeft(nextExercise.duration);
            setIsPaused(true);
        }
    } else { // Backward
        if (setIndex > 0) {
            // Move to the previous set
            setSetIndex(prev => prev - 1);
            setPhase(currentExercise.duration > 0 ? 'work' : 'rep_wait');
            setTimeLeft(currentExercise.duration);
            setIsPaused(true);
        } else if (exerciseIndex > 0) {
            // Move to the previous exercise
            const prevExerciseIndex = exerciseIndex - 1;
            const prevExercise = workout.exercises[prevExerciseIndex];
            const lastSetOfPrev = (prevExercise.sets || 1) - 1;
            setExerciseIndex(prevExerciseIndex);
            setSetIndex(lastSetOfPrev);
            setPhase(prevExercise.duration > 0 ? 'work' : 'rep_wait');
            setTimeLeft(prevExercise.duration);
            setIsPaused(true);
        }
    }
  }, [exerciseIndex, setIndex, totalSets, workout.exercises, currentExercise]);

  const totalDuration = phase === 'work' ? currentExercise.duration : currentExercise.restDuration || 0;
  const progress = totalDuration > 0 ? ((totalDuration - timeLeft) / totalDuration) * 100 : 0;
  
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  const nextExerciseName = exerciseIndex < workout.exercises.length - 1 ? workout.exercises[exerciseIndex + 1].name : '最後の種目です';

  if (!currentExercise) return <div className="text-center">ワークアウトの読み込みに失敗しました。</div>;
  
  const handleGenerateAndTweet = async () => {
    if (!imageCardRef.current) return;
    
    setIsGeneratingImage(true);
    try {
      const imageUrl = await generateWorkoutImage(imageCardRef.current, workout);
      const success = await copyImageToClipboard(imageUrl);
      
      if (success) {
        showAlert('画像をクリップボードにコピーしました。Twitterの投稿画面で画像をペースト（Ctrl+V）してください。', '成功');
        await tweetWithImage(workout);
      } else {
        showAlert('クリップボードへのコピーに失敗しました。通常のツイートに切り替えます。', 'エラー');
        tweetWorkout(workout);
      }
    } catch (error) {
      console.error('画像生成エラー:', error);
      showAlert('画像生成に失敗しました。通常のツイートに切り替えます。', 'エラー');
      // エラー時は通常のツイートにフォールバック
      tweetWorkout(workout);
    } finally {
      setIsGeneratingImage(false);
    }
  };

  if (isFinished) {
      return (
          <>
            {/* 画像生成用の非表示要素 */}
            <div className="fixed -left-[9999px] top-0">
              <WorkoutImageCard ref={imageCardRef} workout={workout} />
            </div>
            
            <div className="flex flex-col items-center justify-center text-center h-96">
              <h2 className="text-4xl font-bold text-cyan-400 mb-4 z-10">お疲れ様でした！</h2>
              <p className="text-gray-300 text-lg mb-8 z-10">ワークアウトが完了しました。</p>
              <div className="flex gap-4 z-10">
                <button
                    onClick={handleGenerateAndTweet}
                    disabled={isGeneratingImage}
                    className="flex items-center justify-center py-3 px-6 bg-sky-500 text-white font-semibold rounded-lg hover:bg-sky-600 transition-colors text-lg disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    <TwitterIcon className="w-5 h-5 mr-2" />
                    {isGeneratingImage ? '画像生成中...' : '画像でツイート'}
                </button>
                <button
                    onClick={() => tweetWorkout(workout)}
                    className="flex items-center justify-center py-3 px-6 bg-gray-600 text-white font-semibold rounded-lg hover:bg-gray-500 transition-colors text-lg"
                >
                    <TwitterIcon className="w-5 h-5 mr-2" />
                    テキストでツイート
                </button>
                <button
                    onClick={() => onFinish(workout)}
                    className="py-3 px-8 bg-cyan-500 text-white font-semibold rounded-lg hover:bg-cyan-600 transition-colors text-lg"
                >
                    終了する
                </button>
              </div>
            </div>
          </>
      )
  }

  return (
    <div className="flex flex-col items-center p-4">
        <header className="w-full text-center">
            <h2 className="text-3xl font-bold text-cyan-400">{workout.name}</h2>
            <p className="text-gray-400">{exerciseIndex + 1} / {workout.exercises.length}</p>
        </header>

        <div className="relative w-64 h-64 sm:w-80 sm:h-80 my-8 flex items-center justify-center">
            <svg className="absolute w-full h-full" viewBox="0 0 100 100">
                <circle className="text-gray-700" strokeWidth="5" stroke="currentColor" fill="transparent" r="45" cx="50" cy="50" />
                <circle
                    className={`${phase === 'rest' ? 'text-green-400' : 'text-cyan-400'} transition-all duration-500`}
                    strokeWidth="5"
                    strokeDasharray={2 * Math.PI * 45}
                    strokeDashoffset={(2 * Math.PI * 45) * (1 - progress / 100)}
                    strokeLinecap="round"
                    stroke="currentColor"
                    fill="transparent"
                    r="45" cx="50" cy="50"
                    transform="rotate(-90 50 50)"
                />
            </svg>
            <div className="z-10 text-center">
                <p className={`text-xl font-semibold uppercase tracking-widest mb-2 ${phase === 'work' ? 'text-cyan-400' : phase === 'rest' ? 'text-green-400' : 'text-yellow-400'}`}>
                  {phase === 'work' && 'ワーク'}
                  {phase === 'rest' && '休憩'}
                  {phase === 'rep_wait' && '準備'}
                </p>
                {phase === 'rep_wait' ? (
                    <div className="text-5xl font-bold">{currentExercise.reps || 0}回</div>
                ) : (
                    <div className="text-6xl font-mono font-bold">{formatTime(timeLeft)}</div>
                )}
                <p className="text-gray-400 mt-2">セット {setIndex + 1} / {totalSets}</p>
            </div>
        </div>

        <div className="text-center w-full">
            <h3 className="text-2xl font-semibold">{currentExercise.name}</h3>
            {currentExercise.weight && <p className="text-gray-400">{currentExercise.weight} kg</p>}
            <p className="text-gray-500 mt-2 h-6">次: {nextExerciseName}</p>
        </div>
        
        <div className="w-full mt-8 pt-6">
            <div className="flex justify-center items-center space-x-4">
                <button onClick={() => handleSkip(-1)} disabled={exerciseIndex === 0 && setIndex === 0} className="p-3 text-gray-300 rounded-full hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors">
                    <ChevronDoubleLeftIcon className="w-8 h-8"/>
                </button>
                <button onClick={handlePlayPause} className="p-5 bg-cyan-500 text-white rounded-full hover:bg-cyan-600 transition-colors">
                    {isPaused ? <PlayIcon className="w-10 h-10" /> : <PauseIcon className="w-10 h-10" />}
                </button>
                <button onClick={() => handleSkip(1)} disabled={exerciseIndex === workout.exercises.length - 1 && setIndex === totalSets - 1} className="p-3 text-gray-300 rounded-full hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors">
                    <ChevronDoubleRightIcon className="w-8 h-8"/>
                </button>
            </div>
            <div className="text-center mt-6">
              <button onClick={() => onFinish(workout)} className="flex items-center justify-center mx-auto py-2 px-5 bg-red-600 text-white font-semibold rounded-lg hover:bg-red-500 transition-colors">
                  <StopIcon className="w-5 h-5 mr-2" />
                  ワークアウトを終了
              </button>
            </div>
        </div>
    </div>
  );
};

export default WorkoutPlayer;
