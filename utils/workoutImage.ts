import html2canvas from 'html2canvas';
import { Workout, WorkoutHistoryEntry } from '../types';

export const generateWorkoutImage = async (
  element: HTMLElement,
  workout?: Workout,
  historyEntry?: WorkoutHistoryEntry
): Promise<string> => {
  try {
    const canvas = await html2canvas(element, {
      backgroundColor: '#111827',
      scale: 2,
      logging: false,
      useCORS: true,
    });

    return canvas.toDataURL('image/png');
  } catch (error) {
    console.error('画像生成エラー:', error);
    throw error;
  }
};

export const downloadImage = (dataUrl: string, filename: string) => {
  const link = document.createElement('a');
  link.download = filename;
  link.href = dataUrl;
  link.click();
};

export const copyImageToClipboard = async (dataUrl: string): Promise<boolean> => {
  try {
    // データURLをBlobに変換
    const response = await fetch(dataUrl);
    const blob = await response.blob();
    
    // ClipboardItemを使用して画像をクリップボードにコピー
    const item = new ClipboardItem({ 'image/png': blob });
    await navigator.clipboard.write([item]);
    return true;
  } catch (error) {
    console.error('クリップボードへのコピーエラー:', error);
    return false;
  }
};

export const tweetWithImage = async (workout?: Workout, historyEntry?: WorkoutHistoryEntry) => {
  const displayName = workout?.name || historyEntry?.workoutName || 'ワークアウト';
  const text = `🏋️ ${displayName} を完了しました！\n\nhttps://myworkout.odenman.me/\n\n#マイワークアウト #ワークアウト #筋トレ`;
  const encodedText = encodeURIComponent(text);
  const url = `https://twitter.com/intent/tweet?text=${encodedText}`;
  
  // Twitterを開く
  window.open(url, '_blank', 'width=550,height=420');
};

