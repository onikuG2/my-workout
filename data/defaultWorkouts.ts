import { Workout } from '../types';

export const defaultWorkouts: Workout[] = [
  {
    id: 'preset-1',
    name: '初心者向けクイック全身 (5分)',
    exercises: [
      { id: 'p1-ex1', name: 'ジャンピングジャック', duration: 30, restDuration: 15, sets: 1 },
      { id: 'p1-ex2', name: 'スクワット', duration: 30, restDuration: 15, sets: 1 },
      { id: 'p1-ex3', name: '腕立て伏せ (膝つき)', duration: 30, restDuration: 15, sets: 1 },
      { id: 'p1-ex4', name: 'プランク', duration: 30, restDuration: 15, sets: 1 },
      { id: 'p1-ex5', name: 'ジャンピングジャック', duration: 30, restDuration: 15, sets: 1 },
      { id: 'p1-ex6', name: 'スクワット', duration: 30, restDuration: 15, sets: 1 },
    ],
  },
  {
    id: 'preset-2',
    name: 'HIITチャレンジ (10分)',
    exercises: [
      { id: 'p2-ex1', name: 'バーピー', duration: 45, restDuration: 15, sets: 2 },
      { id: 'p2-ex2', name: 'マウンテンクライマー', duration: 45, restDuration: 15, sets: 2 },
      { id: 'p2-ex3', name: 'スクワットジャンプ', duration: 45, restDuration: 15, sets: 2 },
      { id: 'p2-ex4', name: 'ハイニー', duration: 45, restDuration: 15, sets: 2 },
    ],
  },
  {
    id: 'preset-3',
    name: '体幹集中コアワークアウト (8分)',
    exercises: [
      { id: 'p3-ex1', name: 'プランク', duration: 60, restDuration: 30, sets: 2 },
      { id: 'p3-ex2', name: 'クランチ', duration: 60, restDuration: 30, sets: 2 },
      { id: 'p3-ex3', name: 'レッグレイズ', duration: 60, restDuration: 30, sets: 2 },
    ],
  },
  {
    id: 'preset-4',
    name: '上半身強化の日',
    exercises: [
        { id: 'p4-ex1', name: 'プッシュアップ', duration: 0, reps: 10, restDuration: 60, sets: 3 },
        { id: 'p4-ex2', name: '懸垂 (またはアシスト)', duration: 0, reps: 8, restDuration: 60, sets: 3 },
        { id: 'p4-ex3', name: 'ダンベルショルダープレス', duration: 0, reps: 12, weight: 10, restDuration: 60, sets: 3 },
        { id: 'p4-ex4', name: 'ダンベルカール', duration: 0, reps: 12, weight: 8, restDuration: 60, sets: 3 },
        { id: 'p4-ex5', name: 'ディップス', duration: 0, reps: 10, restDuration: 60, sets: 3 },
    ]
  },
    {
    id: 'preset-5',
    name: '下半身強化の日',
    exercises: [
        { id: 'p5-ex1', name: 'スクワット', duration: 0, reps: 12, weight: 20, restDuration: 60, sets: 3 },
        { id: 'p5-ex2', name: 'ランジ', duration: 0, reps: 10, restDuration: 60, sets: 3 },
        { id: 'p5-ex3', name: 'デッドリフト', duration: 0, reps: 8, weight: 40, restDuration: 90, sets: 3 },
        { id: 'p5-ex4', name: 'カーフレイズ', duration: 0, reps: 20, restDuration: 45, sets: 3 },
        { id: 'p5-ex5', name: 'ヒップスラスト', duration: 0, reps: 12, weight: 30, restDuration: 60, sets: 3 },
    ]
  }
];
