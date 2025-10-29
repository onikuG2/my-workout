import React from 'react';

interface ConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
}

const ConfirmModal: React.FC<ConfirmModalProps> = ({ isOpen, onClose, onConfirm, title, message }) => {
  if (!isOpen) return null;

  // Stop propagation to prevent clicks inside the modal from closing it
  const handleModalContentClick = (e: React.MouseEvent) => {
    e.stopPropagation();
  };

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-75 z-50 flex justify-center items-center p-4 transition-opacity"
      aria-modal="true"
      role="dialog"
      onClick={onClose} // Allow closing by clicking on the backdrop
    >
      <div 
        className="bg-gray-800 rounded-lg shadow-xl p-6 w-full max-w-md mx-auto transform transition-all animate-fade-in-up"
        onClick={handleModalContentClick}
      >
        <h3 className="text-xl font-bold text-white mb-4">{title}</h3>
        <p className="text-gray-300 mb-6">{message}</p>
        <div className="flex justify-end space-x-4">
          <button
            onClick={onClose}
            className="py-2 px-5 bg-gray-600 text-white font-semibold rounded-lg hover:bg-gray-500 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 focus:ring-gray-500"
          >
            キャンセル
          </button>
          <button
            onClick={onConfirm}
            className="py-2 px-5 bg-red-600 text-white font-semibold rounded-lg hover:bg-red-500 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 focus:ring-red-600"
          >
            削除
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

export default ConfirmModal;
