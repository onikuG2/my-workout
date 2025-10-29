import React from 'react';

interface ImportConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (type: 'merge' | 'overwrite') => void;
}

const ImportConfirmModal: React.FC<ImportConfirmModalProps> = ({ isOpen, onClose, onConfirm }) => {
  if (!isOpen) return null;

  const handleModalContentClick = (e: React.MouseEvent) => {
    e.stopPropagation();
  };

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-75 z-50 flex justify-center items-center p-4 transition-opacity"
      aria-modal="true"
      role="dialog"
      onClick={onClose}
    >
      <div 
        className="bg-gray-800 rounded-lg shadow-xl p-6 w-full max-w-md mx-auto transform transition-all animate-fade-in-up"
        onClick={handleModalContentClick}
      >
        <h3 className="text-xl font-bold text-white mb-4">データのインポート</h3>
        <p className="text-gray-300 mb-6">インポートしたデータをどのように反映しますか？</p>
        <div className="space-y-4">
            <button
                onClick={() => onConfirm('merge')}
                className="w-full text-left p-4 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 focus:ring-cyan-500"
            >
                <h4 className="font-semibold text-white">マージ</h4>
                <p className="text-sm text-gray-400">
                    現在のデータとインポートしたデータを統合します。同じIDのワークアウトはインポートしたデータで上書きされます。
                </p>
            </button>
            <button
                onClick={() => onConfirm('overwrite')}
                className="w-full text-left p-4 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 focus:ring-red-500"
            >
                <h4 className="font-semibold text-white">上書き</h4>
                <p className="text-sm text-gray-400">
                    現在のデータをすべて削除し、インポートしたデータで完全に置き換えます。
                </p>
            </button>
        </div>
        <div className="flex justify-end mt-6">
          <button
            onClick={onClose}
            className="py-2 px-5 bg-gray-600 text-white font-semibold rounded-lg hover:bg-gray-500 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 focus:ring-gray-500"
          >
            キャンセル
          </button>
        </div>
      </div>
      <style>{`
        @keyframes fade-in-up {
          from { opacity: 0; transform: translateY(20px) scale(0.95); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
        .animate-fade-in-up {
          animation: fade-in-up 0.3s ease-out forwards;
        }
      `}</style>
    </div>
  );
};

export default ImportConfirmModal;