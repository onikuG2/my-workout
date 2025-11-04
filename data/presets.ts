export type PresetExercises = Record<string, string[]>;

const STORAGE_KEY = 'exercisePresets';

export const getDefaultPresetExercises = (): PresetExercises => ({
  '全身': ['バーピー', 'ジャンピングジャック', 'マウンテンクライマー', 'スクワットジャンプ'],
  '胸': ['プッシュアップ', 'インクラインプッシュアップ', 'デクラインプッシュアップ', 'ダンベルプレス', 'ダンベルフライ'],
  '背中': ['懸垂', 'ベントオーバーロウ', 'スーパーマン', 'デッドリフト'],
  '脚': ['スクワット', 'ランジ', 'ブルガリアンスクワット', 'レッグプレス', 'カーフレイズ', 'ヒップスラスト'],
  '肩': ['ショルダープレス', 'サイドレイズ', 'フロントレイズ', 'フェイスプル'],
  '腕': ['バイセップスカール', 'トライセップスエクステンション', 'ハンマーカール', 'ディップス'],
  '体幹': ['プランク', 'クランチ', 'レッグレイズ', 'ロシアンツイスト', 'バイシクルクランチ'],
});

export const loadPresetExercises = (): PresetExercises => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return getDefaultPresetExercises();
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed === 'object') return parsed as PresetExercises;
  } catch {}
  return getDefaultPresetExercises();
};

export const savePresetExercises = (presets: PresetExercises) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(presets));
};

export const addBodyPartPreset = (presets: PresetExercises, bodyPart: string): PresetExercises => {
  const name = bodyPart.trim();
  if (!name) return presets;
  if (presets[name]) return presets;
  const next = { ...presets, [name]: [] };
  savePresetExercises(next);
  return next;
};

export const deleteBodyPartPreset = (presets: PresetExercises, bodyPart: string): PresetExercises => {
  const next = { ...presets };
  delete next[bodyPart];
  savePresetExercises(next);
  return next;
};

export const addExercisePreset = (presets: PresetExercises, bodyPart: string, exerciseName: string): PresetExercises => {
  const part = bodyPart.trim();
  const name = exerciseName.trim();
  if (!part || !name) return presets;
  const list = presets[part] || [];
  if (list.includes(name)) return presets;
  const next = { ...presets, [part]: [...list, name] };
  savePresetExercises(next);
  return next;
};

export const deleteExercisePreset = (presets: PresetExercises, bodyPart: string, exerciseName: string): PresetExercises => {
  const list = presets[bodyPart] || [];
  const next = { ...presets, [bodyPart]: list.filter(n => n !== exerciseName) };
  savePresetExercises(next);
  return next;
};


