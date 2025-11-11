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

/**
 * PresetExercisesのデータ構造を検証する
 */
const validatePresetExercises = (data: any): data is PresetExercises => {
  if (!data || typeof data !== 'object') {
    return false;
  }
  
  // すべての値が配列であることを確認
  for (const key in data) {
    if (!Array.isArray(data[key])) {
      return false;
    }
    // 配列の要素がすべて文字列であることを確認
    if (!data[key].every((item: any) => typeof item === 'string' && item.trim().length > 0)) {
      return false;
    }
  }
  
  return true;
};

export const loadPresetExercises = (): PresetExercises => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return getDefaultPresetExercises();
    }
    
    const parsed = JSON.parse(raw);
    
    // データ構造を検証
    if (!validatePresetExercises(parsed)) {
      console.warn('Invalid preset exercises data structure, using defaults');
      // 破損したデータを削除
      try {
        localStorage.removeItem(STORAGE_KEY);
      } catch (e) {
        console.error('Failed to remove corrupted data:', e);
      }
      return getDefaultPresetExercises();
    }
    
    return parsed;
  } catch (error) {
    console.error('Failed to load preset exercises:', error);
    // エラー時は破損したデータを削除してデフォルトを返す
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch (e) {
      console.error('Failed to remove corrupted data:', e);
    }
    return getDefaultPresetExercises();
  }
};

export const savePresetExercises = (presets: PresetExercises): void => {
  try {
    // 保存前にデータ構造を検証
    if (!validatePresetExercises(presets)) {
      console.error('Invalid preset exercises data structure, cannot save');
      throw new Error('Invalid data structure');
    }
    
    const serialized = JSON.stringify(presets);
    localStorage.setItem(STORAGE_KEY, serialized);
  } catch (error) {
    console.error('Failed to save preset exercises:', error);
    throw error;
  }
};

export const addBodyPartPreset = (presets: PresetExercises, bodyPart: string): PresetExercises => {
  const name = bodyPart.trim();
  if (!name) {
    console.warn('Empty body part name provided');
    return presets;
  }
  if (presets[name]) {
    return presets;
  }
  const next = { ...presets, [name]: [] };
  try {
    savePresetExercises(next);
  } catch (error) {
    console.error('Failed to save body part:', error);
    return presets;
  }
  return next;
};

export const deleteBodyPartPreset = (presets: PresetExercises, bodyPart: string): PresetExercises => {
  if (!presets[bodyPart]) {
    return presets;
  }
  const next = { ...presets };
  delete next[bodyPart];
  try {
    savePresetExercises(next);
  } catch (error) {
    console.error('Failed to delete body part:', error);
    return presets;
  }
  return next;
};

export const addExercisePreset = (presets: PresetExercises, bodyPart: string, exerciseName: string): PresetExercises => {
  const part = bodyPart.trim();
  const name = exerciseName.trim();
  if (!part || !name) {
    console.warn('Empty body part or exercise name provided');
    return presets;
  }
  
  // 部位が存在しない場合は作成
  if (!presets[part]) {
    const next = { ...presets, [part]: [name] };
    try {
      savePresetExercises(next);
      return next;
    } catch (error) {
      console.error('Failed to add exercise:', error);
      return presets;
    }
  }
  
  const list = presets[part] || [];
  if (list.includes(name)) {
    return presets;
  }
  const next = { ...presets, [part]: [...list, name] };
  try {
    savePresetExercises(next);
  } catch (error) {
    console.error('Failed to add exercise:', error);
    return presets;
  }
  return next;
};

export const deleteExercisePreset = (presets: PresetExercises, bodyPart: string, exerciseName: string): PresetExercises => {
  if (!presets[bodyPart]) {
    return presets;
  }
  const list = presets[bodyPart] || [];
  const next = { ...presets, [bodyPart]: list.filter(n => n !== exerciseName) };
  try {
    savePresetExercises(next);
  } catch (error) {
    console.error('Failed to delete exercise:', error);
    return presets;
  }
  return next;
};

export const resetPresetExercises = (): PresetExercises => {
  const defaults = getDefaultPresetExercises();
  try {
    savePresetExercises(defaults);
  } catch (error) {
    console.error('Failed to reset preset exercises:', error);
    throw error;
  }
  return defaults;
};


