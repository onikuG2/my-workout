import React, { useMemo, useState } from 'react';
import { 
  loadPresetExercises,
  addBodyPartPreset,
  deleteBodyPartPreset,
  addExercisePreset,
  deleteExercisePreset,
  PresetExercises
} from '../data/presets';

interface ExerciseMasterProps {
  onBack: () => void;
}

const ExerciseMaster: React.FC<ExerciseMasterProps> = ({ onBack }) => {
  const [presets, setPresets] = useState<PresetExercises>(loadPresetExercises());
  const [newBodyPart, setNewBodyPart] = useState('');
  const [selectedPart, setSelectedPart] = useState<string>('');
  const [newExercise, setNewExercise] = useState('');

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

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-cyan-400">部位・種目マスター</h2>
        <button onClick={onBack} className="py-2 px-4 bg-gray-600 text-white rounded-lg hover:bg-gray-500">戻る</button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="md:col-span-1 bg-gray-700/50 border border-gray-600 rounded-lg p-4 space-y-3">
          <h3 className="text-lg font-semibold text-gray-200">部位</h3>
          <div className="flex gap-2">
            <input value={newBodyPart} onChange={e => setNewBodyPart(e.target.value)} placeholder="新しい部位名" className="flex-1 bg-gray-900 border border-gray-600 rounded-md p-2 focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500" />
            <button onClick={addPart} className="px-3 py-2 bg-cyan-600 text-white rounded hover:bg-cyan-500">追加</button>
          </div>
          <ul className="space-y-2 max-h-80 overflow-auto">
            {bodyParts.map(part => (
              <li key={part} className={`flex items-center justify-between bg-gray-800/70 rounded px-2 py-1 ${selectedPart===part?'ring-2 ring-cyan-500':''}`}>
                <button className="text-left flex-1" onClick={() => setSelectedPart(part)}>{part}</button>
                <button onClick={() => removePart(part)} className="text-red-300 hover:text-red-200 px-2">削除</button>
              </li>
            ))}
          </ul>
        </div>

        <div className="md:col-span-2 bg-gray-700/50 border border-gray-600 rounded-lg p-4 space-y-3">
          <h3 className="text-lg font-semibold text-gray-200">{selectedPart ? `種目（${selectedPart}）` : '種目'}</h3>
          <div className="flex gap-2">
            <select value={selectedPart} onChange={e => setSelectedPart(e.target.value)} className="w-48 bg-gray-900 border border-gray-600 rounded-md p-2 focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500">
              <option value="">部位を選択</option>
              {bodyParts.map(part => (<option key={`sel-${part}`} value={part}>{part}</option>))}
            </select>
            <input value={newExercise} onChange={e => setNewExercise(e.target.value)} placeholder="新しい種目名" className="flex-1 bg-gray-900 border border-gray-600 rounded-md p-2 focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500" />
            <button onClick={addExercise} disabled={!selectedPart} className="px-3 py-2 bg-cyan-600 disabled:opacity-50 text-white rounded hover:bg-cyan-500">追加</button>
          </div>

          <ul className="space-y-2 max-h-96 overflow-auto">
            {exercisesOfSelected.map(name => (
              <li key={name} className="flex items-center justify-between bg-gray-800/70 rounded px-2 py-1">
                <span>{name}</span>
                <button onClick={() => removeExercise(name)} className="text-red-300 hover:text-red-200 px-2">削除</button>
              </li>
            ))}
            {selectedPart && exercisesOfSelected.length === 0 && (
              <li className="text-sm text-gray-400">まだ種目がありません。上の欄から追加してください。</li>
            )}
          </ul>
        </div>
      </div>
    </div>
  );
};

export default ExerciseMaster;


