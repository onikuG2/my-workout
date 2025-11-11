import React, { useMemo, useState } from 'react';
import { 
  loadPresetExercises,
  addBodyPartPreset,
  deleteBodyPartPreset,
  addExercisePreset,
  deleteExercisePreset,
  resetPresetExercises,
  PresetExercises
} from '../data/presets';
import ConfirmModal from './modals/ConfirmModal';

interface ExerciseMasterProps {
  onBack: () => void;
}

const ExerciseMaster: React.FC<ExerciseMasterProps> = ({ onBack }) => {
  const [presets, setPresets] = useState<PresetExercises>(loadPresetExercises());
  const [newBodyPart, setNewBodyPart] = useState('');
  const [selectedPart, setSelectedPart] = useState<string>('');
  const [newExercise, setNewExercise] = useState('');
  const [isResetModalOpen, setIsResetModalOpen] = useState(false);

  const bodyParts = useMemo(() => Object.keys(presets), [presets]);
  const exercisesOfSelected = useMemo(() => (selectedPart ? (presets[selectedPart] || []) : []), [presets, selectedPart]);

  const addPart = () => {
    const next = addBodyPartPreset(presets, newBodyPart);
    setPresets(next);
    if (newBodyPart.trim() && !selectedPart) setSelectedPart(newBodyPart.trim());
    setNewBodyPart('');
  };

  const removePart = (part: string) => {
    const next = deleteBodyPartPreset(presets, part);
    setPresets(next);
    if (selectedPart === part) setSelectedPart('');
  };

  const addExercise = () => {
    if (!selectedPart) return;
    const next = addExercisePreset(presets, selectedPart, newExercise);
    setPresets(next);
    setNewExercise('');
  };

  const removeExercise = (name: string) => {
    if (!selectedPart) return;
    const next = deleteExercisePreset(presets, selectedPart, name);
    setPresets(next);
  };

  const handleReset = () => {
    setIsResetModalOpen(true);
  };

  const confirmReset = () => {
    try {
      const defaults = resetPresetExercises();
      setPresets(defaults);
      setSelectedPart('');
      setIsResetModalOpen(false);
    } catch (error) {
      console.error('Failed to reset preset exercises:', error);
      setIsResetModalOpen(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <h2 className="text-2xl sm:text-3xl font-bold text-cyan-400">部位・種目マスター</h2>
        <div className="flex flex-col sm:flex-row gap-3">
          <button 
            onClick={handleReset}
            className="min-h-[44px] py-2.5 px-5 bg-yellow-600 text-white rounded-lg hover:bg-yellow-500 transition-all duration-200 active:scale-95 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 focus:ring-yellow-500"
            aria-label="デフォルトに復元"
          >
            デフォルトに復元
          </button>
          <button 
            onClick={onBack} 
            className="min-h-[44px] py-2.5 px-5 bg-gray-600 text-white rounded-lg hover:bg-gray-500 transition-all duration-200 active:scale-95 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 focus:ring-gray-500"
            aria-label="一覧に戻る"
          >
            戻る
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4">
        <div className="bg-gray-700/50 border border-gray-600 rounded-lg p-4 space-y-3 overflow-hidden flex flex-col">
          <h3 className="text-lg font-semibold text-gray-200">部位</h3>
          <div className="flex gap-2 items-stretch min-w-0">
            <input 
              value={newBodyPart} 
              onChange={e => setNewBodyPart(e.target.value)} 
              placeholder="新しい部位名" 
              className="flex-1 min-w-0 bg-gray-900 border border-gray-600 rounded-md px-3 py-2.5 min-h-[44px] text-white focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500" 
            />
            <button 
              onClick={addPart} 
              className="px-4 py-2.5 bg-cyan-600 text-white rounded hover:bg-cyan-500 transition-all duration-200 active:scale-95 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 focus:ring-cyan-500 whitespace-nowrap flex-shrink-0 flex items-center justify-center min-h-[44px]" 
              aria-label="部位を追加"
            >
              追加
            </button>
          </div>
          <ul className="space-y-2 max-h-80 overflow-y-auto overflow-x-hidden pr-1 -mr-1">
            {bodyParts.map(part => (
              <li 
                key={part} 
                className={`flex items-center justify-between gap-2 min-w-0 bg-gray-800/70 rounded px-3 py-2 ${selectedPart===part?'ring-2 ring-cyan-500':''}`}
              >
                <button 
                  className="text-left flex-1 min-w-0 text-gray-200 hover:text-cyan-400 transition-colors truncate" 
                  onClick={() => setSelectedPart(part)}
                >
                  {part}
                </button>
                <button 
                  onClick={() => removePart(part)} 
                  className="text-red-300 hover:text-red-200 px-2 py-1 whitespace-nowrap flex-shrink-0" 
                  aria-label={`${part}を削除`}
                >
                  削除
                </button>
              </li>
            ))}
          </ul>
        </div>

        <div className="bg-gray-700/50 border border-gray-600 rounded-lg p-4 space-y-3 overflow-hidden flex flex-col">
          <h3 className="text-lg font-semibold text-gray-200">{selectedPart ? `種目（${selectedPart}）` : '種目'}</h3>
          <div className="flex flex-col sm:flex-row gap-2 items-stretch sm:items-center min-w-0">
            <select 
              value={selectedPart} 
              onChange={e => setSelectedPart(e.target.value)} 
              className="w-full sm:w-48 bg-gray-900 border border-gray-600 rounded-md px-3 py-2.5 min-h-[44px] text-white focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 flex-shrink-0"
            >
              <option value="">部位を選択</option>
              {bodyParts.map(part => (<option key={`sel-${part}`} value={part}>{part}</option>))}
            </select>
            <input 
              value={newExercise} 
              onChange={e => setNewExercise(e.target.value)} 
              placeholder="新しい種目名" 
              className="flex-1 min-w-0 bg-gray-900 border border-gray-600 rounded-md px-3 py-2.5 min-h-[44px] text-white focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500" 
            />
            <button 
              onClick={addExercise} 
              disabled={!selectedPart} 
              className="min-h-[44px] px-4 py-2.5 bg-cyan-600 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded hover:bg-cyan-500 transition-all duration-200 active:scale-95 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 focus:ring-cyan-500 whitespace-nowrap flex-shrink-0" 
              aria-label="種目を追加"
            >
              追加
            </button>
          </div>

          <ul className="space-y-2 max-h-96 overflow-y-auto overflow-x-hidden pr-1 -mr-1">
            {exercisesOfSelected.map(name => (
              <li 
                key={name} 
                className="flex items-center justify-between gap-2 min-w-0 bg-gray-800/70 rounded px-3 py-2"
              >
                <span className="text-gray-200 flex-1 min-w-0 truncate">{name}</span>
                <button 
                  onClick={() => removeExercise(name)} 
                  className="text-red-300 hover:text-red-200 px-2 py-1 whitespace-nowrap flex-shrink-0" 
                  aria-label={`${name}を削除`}
                >
                  削除
                </button>
              </li>
            ))}
            {selectedPart && exercisesOfSelected.length === 0 && (
              <li className="text-sm text-gray-400">まだ種目がありません。上の欄から追加してください。</li>
            )}
          </ul>
        </div>
      </div>
      
      <ConfirmModal
        isOpen={isResetModalOpen}
        onClose={() => setIsResetModalOpen(false)}
        onConfirm={confirmReset}
        title="デフォルトに復元"
        message="すべての部位と種目をデフォルトの状態に戻します。現在のカスタマイズ内容は失われます。よろしいですか？"
        confirmButtonText="復元"
        confirmButtonColor="yellow"
      />
    </div>
  );
};

export default ExerciseMaster;


