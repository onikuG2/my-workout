
import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
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
  const isMovingRef = useRef(false);
  const setIndexRef = useRef(0);

  // exercisesLengthをメモ化して安定化
  const exercisesLength = useMemo(() => {
    return workout?.exercises?.length ?? 0;
  }, [workout?.exercises?.length]);

  // setIndexが変更されたときにsetIndexRefを更新（バックアップ用）
  useEffect(() => {
    setIndexRef.current = setIndex;
  }, [setIndex]);

  // workoutが変更されたときにexerciseIndexをリセット
  useEffect(() => {
    if (workout && workout.exercises && workout.exercises.length > 0) {
      // workoutが変更されたときは常に0から開始
      setExerciseIndex(0);
      setSetIndex(0);
      setIndexRef.current = 0;
      setIsFinished(false);
      setIsPaused(true);
      const firstExercise = workout.exercises[0];
      if (firstExercise) {
        setTimeLeft(firstExercise.duration || 0);
        setPhase((firstExercise.duration || 0) > 0 ? 'work' : 'rep_wait');
      }
    } else {
      // workoutが無効な場合は状態をリセット
      setExerciseIndex(0);
      setSetIndex(0);
      setIndexRef.current = 0;
      setIsFinished(false);
      setIsPaused(true);
      setTimeLeft(0);
    }
    
    return () => {
      // クリーンアップ: オーディオコンテキストを閉じる
      if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
        audioContextRef.current.close();
      }
      // タイマーをクリア
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [workout?.id]); // workoutのIDが変更されたときのみリセット

  // exerciseIndexが範囲外になっていないかチェック
  useEffect(() => {
    if (exercisesLength === 0) return;
    
    if (exerciseIndex >= exercisesLength || exerciseIndex < 0) {
      console.warn('exerciseIndex out of range, resetting to 0', {
        exerciseIndex,
        exercisesLength,
      });
      setExerciseIndex(0);
      setSetIndex(0);
      setIndexRef.current = 0;
    }
  }, [exerciseIndex, exercisesLength]); // exerciseIndexまたはexercisesLengthが変更されたときにチェック

  // currentExerciseを安全に取得（isFinishedがfalseの場合のみ）
  const currentExercise = !isFinished ? workout?.exercises?.[exerciseIndex] : undefined;
  const totalSets = currentExercise?.sets || 1;

  // スーパーセット情報を取得
  const getSuperSetInfo = useMemo(() => {
    if (!currentExercise?.superSetGroupId) return null;
    
    const groupId = currentExercise.superSetGroupId;
    const superSetExercises = workout.exercises
      .map((ex, idx) => ({ exercise: ex, index: idx }))
      .filter(({ exercise }) => exercise.superSetGroupId === groupId);
    
    const currentSuperSetIndex = superSetExercises.findIndex(({ index }) => index === exerciseIndex);
    
    return {
      groupId,
      exercises: superSetExercises,
      currentIndex: currentSuperSetIndex,
      totalCount: superSetExercises.length,
    };
  }, [currentExercise, workout, exerciseIndex]);

  const isInSuperSet = !!getSuperSetInfo;

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
    // 既に完了している場合は何もしない
    if (isFinished) return;
    
    // 既に移動中の場合は何もしない（重複実行を防ぐ）
    if (isMovingRef.current) return;
    isMovingRef.current = true;
    
    // タイマーを停止
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    
    // workoutまたはexercisesが無効な場合は終了
    if (!workout || !workout.exercises || workout.exercises.length === 0) {
      setIsFinished(true);
      setIsPaused(true);
      isMovingRef.current = false;
      return;
    }
    
    // currentExerciseが存在しない場合は終了
    const currentEx = workout.exercises[exerciseIndex];
    if (!currentEx) {
      setIsFinished(true);
      setIsPaused(true);
      isMovingRef.current = false;
      return;
    }

    playSound('end_exercise');

    const isLastExercise = exerciseIndex === workout.exercises.length - 1;
    const currentSets = currentEx.sets || 1;
    const currentSetIndex = setIndexRef.current;
    const isLastSet = currentSetIndex === currentSets - 1;

    // Case 1: 休憩フェーズが完了した場合 -> 次のセットへ
    if (phase === 'rest') {
      // スーパーセットの場合、最初のエクササイズの次のセットに進む
      if (currentEx.superSetGroupId) {
        const firstSuperSetIndex = workout.exercises.findIndex(ex => ex.superSetGroupId === currentEx.superSetGroupId);
        if (firstSuperSetIndex !== -1) {
          const firstEx = workout.exercises[firstSuperSetIndex];
          const firstExSets = firstEx.sets || 1;
          const nextSetIndex = currentSetIndex + 1;
          if (nextSetIndex < firstExSets) {
            setExerciseIndex(firstSuperSetIndex);
            setSetIndex(nextSetIndex);
            setIndexRef.current = nextSetIndex;
            const isRepBased = firstEx.duration === 0;
            setPhase(isRepBased ? 'rep_wait' : 'work');
            setTimeLeft(firstEx.duration || 0);
            setIsPaused(isRepBased);
            setTimeout(() => {
              isMovingRef.current = false;
            }, 0);
            return;
          }
        }
      }
      // スーパーセット外の場合、次のセットがある場合 -> 次のセットへ
      if (currentSetIndex < currentSets - 1) {
        const nextSetIndex = currentSetIndex + 1;
        setSetIndex(nextSetIndex);
        setIndexRef.current = nextSetIndex;
        const isRepBased = currentEx.duration === 0;
        setPhase(isRepBased ? 'rep_wait' : 'work');
        setTimeLeft(currentEx.duration || 0);
        setIsPaused(isRepBased); // 回数ベースなら一時停止、時間ベースなら続行
        // 次のレンダリングサイクルまで待ってからリセット
        setTimeout(() => {
          isMovingRef.current = false;
        }, 0);
        return;
      }
      // 休憩が終了し、次のセットがない場合は次のケースに進む
    }

    // スーパーセットのチェック
    const nextExercise = !isLastExercise ? workout.exercises[exerciseIndex + 1] : null;
    const isNextInSameSuperSet = nextExercise && currentEx.superSetGroupId && nextExercise.superSetGroupId === currentEx.superSetGroupId;
    
    // スーパーセット内の次のエクササイズを取得
    const getNextSuperSetExercise = (): { index: number; exercise: Exercise } | null => {
      if (!currentEx.superSetGroupId) return null;
      
      // 同じスーパーセットグループ内のエクササイズを探す
      for (let i = exerciseIndex + 1; i < workout.exercises.length; i++) {
        const ex = workout.exercises[i];
        if (ex.superSetGroupId === currentEx.superSetGroupId) {
          return { index: i, exercise: ex };
        }
        // スーパーセットグループが異なる場合は終了
        if (ex.superSetGroupId !== currentEx.superSetGroupId) {
          break;
        }
      }
      return null;
    };
    
    const nextSuperSetExercise = getNextSuperSetExercise();
    
    // Case 2a: スーパーセット内の最後のエクササイズのセットが完了した場合
    // 現在のエクササイズがスーパーセット内の最後のエクササイズで、セットが完了した場合
    if ((phase === 'work' || phase === 'rep_wait') && currentEx.superSetGroupId && !nextSuperSetExercise) {
      // スーパーセット内の最初のエクササイズを探す
      const firstSuperSetIndex = workout.exercises.findIndex(ex => ex.superSetGroupId === currentEx.superSetGroupId);
      if (firstSuperSetIndex !== -1 && firstSuperSetIndex !== exerciseIndex) {
        const firstEx = workout.exercises[firstSuperSetIndex];
        const firstExSets = firstEx.sets || 1;
        // 最初のエクササイズの次のセットがあるか確認
        const nextSetIndex = currentSetIndex + 1;
        // 次のセットがある場合、休憩を取ってから次のセットに進む
        if (nextSetIndex < firstExSets && (currentEx.restDuration || 0) > 0) {
          setPhase('rest');
          setTimeLeft(currentEx.restDuration as number);
          setIsPaused(false); // 休憩タイマーは自動的に開始
          setTimeout(() => {
            isMovingRef.current = false;
          }, 0);
          return;
        }
        // 休憩がない場合、または次のセットがない場合
        if (nextSetIndex < firstExSets) {
          setExerciseIndex(firstSuperSetIndex);
          setSetIndex(nextSetIndex);
          setIndexRef.current = nextSetIndex;
          const isRepBased = firstEx.duration === 0;
          setPhase(isRepBased ? 'rep_wait' : 'work');
          setTimeLeft(firstEx.duration || 0);
          setIsPaused(isRepBased);
          setTimeout(() => {
            isMovingRef.current = false;
          }, 0);
          return;
        }
        // スーパーセット全体が完了した場合（最後のセットが完了した場合）、休憩を取る（次のエクササイズがある場合）
        if (isLastSet && (currentEx.restDuration || 0) > 0 && exerciseIndex < workout.exercises.length - 1) {
          setPhase('rest');
          setTimeLeft(currentEx.restDuration as number);
          setIsPaused(false); // 休憩タイマーは自動的に開始
          setTimeout(() => {
            isMovingRef.current = false;
          }, 0);
          return;
        }
      } else if (firstSuperSetIndex === exerciseIndex) {
        // スーパーセット内にエクササイズが1つしかない場合（通常は発生しないが、念のため）
        // スーパーセット全体が完了した場合、休憩を取る（次のエクササイズがある場合）
        if (isLastSet && (currentEx.restDuration || 0) > 0 && exerciseIndex < workout.exercises.length - 1) {
          setPhase('rest');
          setTimeLeft(currentEx.restDuration as number);
          setIsPaused(false);
          setTimeout(() => {
            isMovingRef.current = false;
          }, 0);
          return;
        }
      }
    }
    
    // Case 2b: スーパーセット内の次のエクササイズの同じセットに進む
    // 現在のエクササイズのセットが完了し、スーパーセット内に次のエクササイズがある場合
    if ((phase === 'work' || phase === 'rep_wait') && nextSuperSetExercise) {
      const { index: nextIndex, exercise: nextEx } = nextSuperSetExercise;
      setExerciseIndex(nextIndex);
      // セットインデックスを維持（リセットしない）
      setSetIndex(currentSetIndex);
      setIndexRef.current = currentSetIndex;
      const isRepBased = nextEx.duration === 0;
      setPhase(isRepBased ? 'rep_wait' : 'work');
      setTimeLeft(nextEx.duration || 0);
      setIsPaused(isRepBased); // 回数ベースなら一時停止、時間ベースなら続行
      setTimeout(() => {
        isMovingRef.current = false;
      }, 0);
      return;
    }

    // Case 4: ワークまたはレップ待機フェーズが完了し、休憩がある場合 -> 休憩フェーズへ
    // ただし、最終エクササイズの最終セットの場合は休憩をスキップする
    // また、次のエクササイズが同じスーパーセットグループに属している場合も休憩をスキップする
    if ((phase === 'work' || phase === 'rep_wait') && (currentEx.restDuration || 0) > 0 && !(isLastExercise && isLastSet) && !isNextInSameSuperSet) {
      setPhase('rest');
      setTimeLeft(currentEx.restDuration as number);
      setIsPaused(false); // 休憩タイマーは自動的に開始
      // 次のレンダリングサイクルまで待ってからリセット
      setTimeout(() => {
        isMovingRef.current = false;
      }, 0);
      return;
    }

    // Case 5: 次のセットがある場合 -> 次のセットへ（休憩がない場合、かつスーパーセット外）
    if (currentSetIndex < currentSets - 1 && !currentEx.superSetGroupId) {
      const nextSetIndex = currentSetIndex + 1;
      setSetIndex(nextSetIndex);
      setIndexRef.current = nextSetIndex;
      const isRepBased = currentEx.duration === 0;
      setPhase(isRepBased ? 'rep_wait' : 'work');
      setTimeLeft(currentEx.duration || 0);
      setIsPaused(isRepBased); // 回数ベースなら一時停止、時間ベースなら続行
      // 次のレンダリングサイクルまで待ってからリセット
      setTimeout(() => {
        isMovingRef.current = false;
      }, 0);
      return;
    }

    // Case 6: 次のエクササイズがある場合 -> 次のエクササイズへ（スーパーセット外）
    if (exerciseIndex < workout.exercises.length - 1 && !isNextInSameSuperSet) {
      const nextExerciseIndex = exerciseIndex + 1;
      // 範囲チェックを追加
      if (nextExerciseIndex >= workout.exercises.length) {
        setIsFinished(true);
        setIsPaused(true);
        isMovingRef.current = false;
        return;
      }
      const nextEx = workout.exercises[nextExerciseIndex];
      if (!nextEx) {
        setIsFinished(true);
        setIsPaused(true);
        isMovingRef.current = false;
        return;
      }
      setExerciseIndex(nextExerciseIndex);
      setSetIndex(0);
      setIndexRef.current = 0;
      const isRepBased = nextEx.duration === 0;
      setPhase(isRepBased ? 'rep_wait' : 'work');
      setTimeLeft(nextEx.duration || 0);
      setIsPaused(isRepBased); // 回数ベースなら一時停止、時間ベースなら続行
      // 次のレンダリングサイクルまで待ってからリセット
      setTimeout(() => {
        isMovingRef.current = false;
      }, 0);
      return;
    }

    // Case 5: ワークアウト終了
    setIsFinished(true);
    setIsPaused(true);
    playCompletionSound();
    isMovingRef.current = false;
  }, [phase, exerciseIndex, workout, playSound, playCompletionSound, isFinished]);

  useEffect(() => {
    if (isPaused || isFinished || phase === 'rep_wait') {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
      return;
    }
    
    // currentExerciseが存在しない場合はタイマーを開始しない
    if (!currentExercise) {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
      return;
    }
    
    timerRef.current = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          // タイマーを停止してからmoveToNextを呼ぶ
          if (timerRef.current) {
            clearInterval(timerRef.current);
            timerRef.current = null;
          }
          // 次のイベントループでmoveToNextを呼ぶ（重複実行を防ぐ）
          setTimeout(() => {
            moveToNext();
          }, 0);
          return 0;
        }
        if (prev <= 4) {
          playSound('tick');
        }
        return prev - 1;
      });
    }, 1000);
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [isPaused, isFinished, phase, playSound, moveToNext, exerciseIndex, currentExercise]);
  
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

  const handlePlayPause = useCallback(() => {
    if (!audioContextRef.current) {
        try {
            audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
        } catch (e) {
            console.error("Web Audio API is not supported in this browser.");
        }
    }

    if (phase === 'rep_wait') {
      // rep_waitフェーズのときは、直接休憩または次のセット/エクササイズへ遷移する
      // workフェーズを経由せずにmoveToNextを呼ぶことで、ワークタイマーの一瞬の表示を防ぐ
      moveToNext();
    } else {
      setIsPaused(prev => !prev);
    }
  }, [phase, moveToNext]);
  
  const handleSkip = useCallback((direction: 1 | -1) => {
    if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
    }

    // workoutまたはexercisesが無効な場合は何もしない
    if (!workout || !workout.exercises || workout.exercises.length === 0) {
      return;
    }

    // currentExerciseが無効な場合は何もしない
    if (!currentExercise) {
      return;
    }

    if (direction === 1) { // Forward
        if (setIndex < totalSets - 1) {
            // Move to the next set
            const nextSetIndex = setIndex + 1;
            setSetIndex(nextSetIndex);
            setIndexRef.current = nextSetIndex;
            setPhase((currentExercise.duration || 0) > 0 ? 'work' : 'rep_wait');
            setTimeLeft(currentExercise.duration || 0);
            setIsPaused(true);
        } else if (exerciseIndex < workout.exercises.length - 1) {
            // Move to the next exercise
            const nextExerciseIndex = exerciseIndex + 1;
            const nextExercise = workout.exercises[nextExerciseIndex];
            if (!nextExercise) {
              return;
            }
            setExerciseIndex(nextExerciseIndex);
            setSetIndex(0);
            setIndexRef.current = 0;
            setPhase((nextExercise.duration || 0) > 0 ? 'work' : 'rep_wait');
            setTimeLeft(nextExercise.duration || 0);
            setIsPaused(true);
        }
    } else { // Backward
        if (setIndex > 0) {
            // Move to the previous set
            const prevSetIndex = setIndex - 1;
            setSetIndex(prevSetIndex);
            setIndexRef.current = prevSetIndex;
            setPhase((currentExercise.duration || 0) > 0 ? 'work' : 'rep_wait');
            setTimeLeft(currentExercise.duration || 0);
            setIsPaused(true);
        } else if (exerciseIndex > 0) {
            // Move to the previous exercise
            const prevExerciseIndex = exerciseIndex - 1;
            const prevExercise = workout.exercises[prevExerciseIndex];
            if (!prevExercise) {
              return;
            }
            const lastSetOfPrev = (prevExercise.sets || 1) - 1;
            setExerciseIndex(prevExerciseIndex);
            setSetIndex(lastSetOfPrev);
            setIndexRef.current = lastSetOfPrev;
            setPhase((prevExercise.duration || 0) > 0 ? 'work' : 'rep_wait');
            setTimeLeft(prevExercise.duration || 0);
            setIsPaused(true);
        }
    }
  }, [exerciseIndex, setIndex, totalSets, workout, currentExercise]);

  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (isFinished) return;
      
      if (e.code === 'Space') {
        e.preventDefault();
        handlePlayPause();
      } else if (e.code === 'ArrowLeft') {
        e.preventDefault();
        if (!(exerciseIndex === 0 && setIndex === 0)) {
          handleSkip(-1);
        }
      } else if (e.code === 'ArrowRight') {
        e.preventDefault();
        if (!(exerciseIndex === workout.exercises.length - 1 && setIndex === totalSets - 1)) {
          handleSkip(1);
        }
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [isFinished, exerciseIndex, setIndex, workout.exercises.length, totalSets, handlePlayPause, handleSkip]);

  const totalDuration = currentExercise ? (phase === 'work' ? currentExercise.duration : currentExercise.restDuration || 0) : 0;
  const progress = totalDuration > 0 ? ((totalDuration - timeLeft) / totalDuration) * 100 : 0;
  
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

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

  // 完了画面は currentExercise のチェックより前に表示
  if (isFinished) {
      // workoutが無効な場合は、エラー画面を表示
      if (!workout || !workout.exercises || workout.exercises.length === 0) {
        const handleBackToList = () => {
          if (workout) {
            onFinish(workout);
          } else {
            // workoutが無効な場合は、空のワークアウトオブジェクトを渡す
            onFinish({
              id: '',
              name: '',
              exercises: [],
            });
          }
        };
        
        return (
          <div className="text-center p-8">
            <p className="text-red-400 text-lg mb-4">ワークアウトの読み込みに失敗しました。</p>
            <button
              onClick={handleBackToList}
              className="min-h-[44px] py-2.5 px-6 bg-gray-600 text-white font-semibold rounded-lg hover:bg-gray-500 transition-all duration-200 active:scale-95 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 focus:ring-gray-500"
            >
              一覧に戻る
            </button>
          </div>
        );
      }
      
      return (
          <>
            {/* 画像生成用の非表示要素 */}
            <div className="fixed -left-[9999px] top-0">
              <WorkoutImageCard ref={imageCardRef} workout={workout} />
            </div>
            
            <div className="flex flex-col items-center justify-center text-center h-96">
              <h2 className="text-4xl font-bold text-cyan-400 mb-4 z-10">お疲れ様でした！</h2>
              <p className="text-gray-300 text-lg mb-8 z-10">ワークアウトが完了しました。</p>
            <div className="flex flex-col sm:flex-row gap-4 z-10">
                <button
                    onClick={handleGenerateAndTweet}
                    disabled={isGeneratingImage}
                    className="flex items-center justify-center min-h-[44px] py-3 px-6 bg-sky-500 text-white font-semibold rounded-lg hover:bg-sky-600 transition-all duration-200 text-base sm:text-lg disabled:opacity-50 disabled:cursor-not-allowed active:scale-95 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 focus:ring-sky-500"
                    aria-label="画像でツイート"
                >
                    {isGeneratingImage ? (
                      <>
                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                        画像生成中...
                      </>
                    ) : (
                      <>
                        <TwitterIcon className="w-5 h-5 mr-2" />
                        画像でツイート
                      </>
                    )}
                </button>
                <button
                    onClick={() => tweetWorkout(workout)}
                    className="flex items-center justify-center min-h-[44px] py-3 px-6 bg-gray-600 text-white font-semibold rounded-lg hover:bg-gray-500 transition-all duration-200 text-base sm:text-lg active:scale-95 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 focus:ring-gray-500"
                    aria-label="テキストでツイート"
                >
                    <TwitterIcon className="w-5 h-5 mr-2" />
                    テキストでツイート
                </button>
                <button
                    onClick={() => onFinish(workout)}
                    className="min-h-[44px] py-3 px-8 bg-cyan-500 text-white font-semibold rounded-lg hover:bg-cyan-600 transition-all duration-200 text-base sm:text-lg active:scale-95 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 focus:ring-cyan-500"
                    aria-label="終了する"
                >
                    終了する
                </button>
              </div>
            </div>
          </>
      )
  }

  // workoutまたはexercisesが無効な場合のチェック
  if (!workout || !workout.exercises || workout.exercises.length === 0) {
    const handleBackToList = () => {
      if (workout) {
        onFinish(workout);
      } else {
        // workoutが無効な場合は、空のワークアウトオブジェクトを渡す
        onFinish({
          id: '',
          name: '',
          exercises: [],
        });
      }
    };
    
    return (
      <div className="text-center p-8">
        <p className="text-red-400 text-lg mb-4">ワークアウトの読み込みに失敗しました。</p>
        <button
          onClick={handleBackToList}
          className="min-h-[44px] py-2.5 px-6 bg-gray-600 text-white font-semibold rounded-lg hover:bg-gray-500 transition-all duration-200 active:scale-95 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 focus:ring-gray-500"
        >
          一覧に戻る
        </button>
      </div>
    );
  }

  // isFinishedがfalseの場合のみcurrentExerciseをチェック
  if (!isFinished && !currentExercise) {
    // デバッグ情報をコンソールに出力
    console.error('WorkoutPlayer: currentExercise is undefined', {
      workout,
      exerciseIndex,
      exercisesLength: workout.exercises?.length,
      exercises: workout.exercises,
    });
    
    return (
      <div className="text-center p-8">
        <p className="text-red-400 text-lg mb-4">エクササイズの読み込みに失敗しました。</p>
        {process.env.NODE_ENV === 'development' && (
          <div className="mb-4 p-3 bg-gray-800 rounded text-left text-xs text-gray-400">
            <p>デバッグ情報:</p>
            <p>exerciseIndex: {exerciseIndex}</p>
            <p>exercises.length: {workout.exercises?.length || 0}</p>
            <p>workout.id: {workout?.id || 'N/A'}</p>
          </div>
        )}
        <button
          onClick={() => onFinish(workout)}
          className="min-h-[44px] py-2.5 px-6 bg-gray-600 text-white font-semibold rounded-lg hover:bg-gray-500 transition-all duration-200 active:scale-95 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 focus:ring-gray-500"
        >
          一覧に戻る
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center p-4">
        <header className="w-full text-center mb-4">
            <h2 className="text-2xl sm:text-3xl font-bold text-cyan-400">{workout.name}</h2>
            <div className="flex items-center justify-center gap-3 mt-2">
              {isInSuperSet && getSuperSetInfo && (
                <span className="text-xs font-semibold text-purple-400 bg-purple-900/50 px-3 py-1 rounded-full border border-purple-500/50">
                  スーパーセット
                </span>
              )}
              <p className="text-gray-400 text-sm sm:text-base">{exerciseIndex + 1} / {workout.exercises.length}</p>
            </div>
        </header>

        {/* スーパーセット内のエクササイズ一覧 */}
        {isInSuperSet && getSuperSetInfo && (
          <div className="w-full max-w-md mb-4 px-4">
            <div className="bg-purple-900/20 border border-purple-500/30 rounded-lg p-3">
              <p className="text-xs text-purple-400 mb-2 font-semibold">スーパーセット内のエクササイズ</p>
              <div className="flex flex-wrap gap-2 justify-center">
                {getSuperSetInfo.exercises.map(({ exercise, index }, idx) => (
                  <div
                    key={index}
                    className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                      idx === getSuperSetInfo.currentIndex
                        ? 'bg-purple-600 text-white ring-2 ring-purple-400'
                        : idx < getSuperSetInfo.currentIndex
                        ? 'bg-purple-700/50 text-purple-200'
                        : 'bg-gray-700/50 text-gray-400'
                    }`}
                  >
                    {exercise.name}
                  </div>
                ))}
              </div>
              <p className="text-xs text-purple-300 mt-2 text-center">
                {getSuperSetInfo.currentIndex + 1} / {getSuperSetInfo.totalCount}
              </p>
            </div>
          </div>
        )}

        <div className={`relative w-64 h-64 sm:w-80 sm:h-80 md:w-96 md:h-96 my-8 flex items-center justify-center rounded-full ${
          isInSuperSet 
            ? phase === 'rest' 
              ? 'bg-green-500/10 ring-4 ring-green-500/30' 
              : 'bg-purple-500/10 ring-4 ring-purple-500/30'
            : phase === 'rest' 
              ? 'bg-green-500/10 ring-4 ring-green-500/30' 
              : phase === 'work' 
              ? 'bg-cyan-500/10 ring-4 ring-cyan-500/30' 
              : 'bg-yellow-500/10 ring-4 ring-yellow-500/30'
        } transition-all duration-500`}>
            <svg className="absolute w-full h-full" viewBox="0 0 100 100">
                <circle className="text-gray-700" strokeWidth="5" stroke="currentColor" fill="transparent" r="45" cx="50" cy="50" />
                <circle
                    className={`${
                      isInSuperSet && phase !== 'rest'
                        ? 'text-purple-400'
                        : phase === 'rest' 
                        ? 'text-green-400' 
                        : 'text-cyan-400'
                    } transition-all duration-500`}
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
                <p className={`text-lg sm:text-xl font-semibold uppercase tracking-widest mb-2 ${
                  isInSuperSet && phase !== 'rest'
                    ? 'text-purple-400'
                    : phase === 'work' 
                    ? 'text-cyan-400' 
                    : phase === 'rest' 
                    ? 'text-green-400' 
                    : 'text-yellow-400'
                }`}>
                  {phase === 'work' && 'ワーク'}
                  {phase === 'rest' && '休憩'}
                  {phase === 'rep_wait' && '準備'}
                </p>
                {phase === 'rep_wait' ? (
                    <div className="text-4xl sm:text-5xl font-bold">{currentExercise.reps || 0}回</div>
                ) : (
                    <div className="text-5xl sm:text-6xl font-mono font-bold">{formatTime(timeLeft)}</div>
                )}
                <p className="text-gray-400 mt-2 text-sm sm:text-base">セット {setIndex + 1} / {totalSets}</p>
                {isInSuperSet && getSuperSetInfo && (
                  <p className="text-purple-400 mt-1 text-xs font-medium">
                    スーパーセット {getSuperSetInfo.currentIndex + 1} / {getSuperSetInfo.totalCount}
                  </p>
                )}
            </div>
        </div>

        <div className="text-center w-full px-4">
            <h3 className="text-xl sm:text-2xl font-semibold mb-1">{currentExercise.name}</h3>
            {currentExercise.weight != null && currentExercise.weight !== 0 && <p className="text-gray-400 text-base sm:text-lg mb-2">{currentExercise.weight} kg</p>}
            {exerciseIndex < workout.exercises.length - 1 && (
                <div className={`mt-3 p-3 rounded-lg border ${
                  workout.exercises[exerciseIndex + 1].superSetGroupId === currentExercise.superSetGroupId
                    ? 'bg-purple-900/30 border-purple-500/50'
                    : 'bg-gray-800/50 border-gray-700'
                }`}>
                    <p className={`text-xs mb-1 ${
                      workout.exercises[exerciseIndex + 1].superSetGroupId === currentExercise.superSetGroupId
                        ? 'text-purple-400'
                        : 'text-gray-500'
                    }`}>
                      次
                      {workout.exercises[exerciseIndex + 1].superSetGroupId === currentExercise.superSetGroupId && '（スーパーセット内）'}
                    </p>
                    <p className="text-sm sm:text-base text-gray-300 font-medium">{workout.exercises[exerciseIndex + 1].name}</p>
                    {workout.exercises[exerciseIndex + 1].duration > 0 && (
                        <p className="text-xs text-gray-500 mt-1">{workout.exercises[exerciseIndex + 1].duration}秒</p>
                    )}
                    {workout.exercises[exerciseIndex + 1].reps > 0 && (
                        <p className="text-xs text-gray-500 mt-1">{workout.exercises[exerciseIndex + 1].reps}回</p>
                    )}
                </div>
            )}
        </div>
        
        <div className="w-full mt-8 pt-6">
            {/* 全体の進捗バー */}
            <div className="mb-6 px-4">
                <div className="flex justify-between text-xs text-gray-400 mb-2">
                    <span>進捗</span>
                    <span>{exerciseIndex + 1} / {workout.exercises.length}</span>
                </div>
                <div className="w-full bg-gray-700 rounded-full h-2">
                    <div 
                        className="bg-cyan-500 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${((exerciseIndex + 1) / workout.exercises.length) * 100}%` }}
                    />
                </div>
            </div>
            
            <div className="flex justify-center items-center space-x-4">
                <button 
                    onClick={() => handleSkip(-1)} 
                    disabled={exerciseIndex === 0 && setIndex === 0} 
                    className="min-w-[48px] min-h-[48px] p-3 text-gray-300 rounded-full hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 active:scale-95 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 focus:ring-gray-500"
                    aria-label="前へ戻る"
                >
                    <ChevronDoubleLeftIcon className="w-8 h-8"/>
                </button>
                <button 
                    onClick={handlePlayPause} 
                    className="min-w-[64px] min-h-[64px] p-5 bg-cyan-500 text-white rounded-full hover:bg-cyan-600 transition-all duration-200 active:scale-95 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 focus:ring-cyan-500"
                    aria-label={isPaused ? '開始' : '一時停止'}
                >
                    {isPaused ? <PlayIcon className="w-10 h-10" /> : <PauseIcon className="w-10 h-10" />}
                </button>
                <button 
                    onClick={() => handleSkip(1)} 
                    disabled={exerciseIndex === workout.exercises.length - 1 && setIndex === totalSets - 1} 
                    className="min-w-[48px] min-h-[48px] p-3 text-gray-300 rounded-full hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 active:scale-95 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 focus:ring-gray-500"
                    aria-label="次へ進む"
                >
                    <ChevronDoubleRightIcon className="w-8 h-8"/>
                </button>
            </div>
            <div className="text-center mt-6">
              <button 
                  onClick={() => onFinish(workout)} 
                  className="flex items-center justify-center mx-auto min-h-[44px] py-2.5 px-6 bg-red-600 text-white font-semibold rounded-lg hover:bg-red-500 transition-all duration-200 active:scale-95 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 focus:ring-red-600"
                  aria-label="ワークアウトを終了"
              >
                  <StopIcon className="w-5 h-5 mr-2" />
                  ワークアウトを終了
              </button>
            </div>
        </div>
    </div>
  );
};

export default WorkoutPlayer;
