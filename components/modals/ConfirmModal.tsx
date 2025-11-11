import React from 'react';

interface ConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmButtonText?: string;
  confirmButtonColor?: 'red' | 'yellow';
}

const ConfirmModal: React.FC<ConfirmModalProps> = ({ 
  isOpen, 
  onClose, 
  onConfirm, 
  title, 
  message,
  confirmButtonText = '削除',
  confirmButtonColor = 'red'
}) => {
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
      aria-labelledby="modal-title"
      aria-describedby="modal-description"
      onClick={onClose}
    >
      <div 
        className="bg-gray-800 rounded-lg shadow-xl p-6 w-full max-w-md mx-auto transform transition-all animate-fade-in-up border border-gray-700"
        onClick={handleModalContentClick}
      >
        <div className="mb-4">
          <div className={`flex items-center justify-center w-12 h-12 mx-auto mb-4 rounded-full ${
            confirmButtonColor === 'yellow' ? 'bg-yellow-500/20' : 'bg-red-500/20'
          }`}>
            <svg className={`w-6 h-6 ${confirmButtonColor === 'yellow' ? 'text-yellow-400' : 'text-red-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h3 id="modal-title" className="text-xl font-bold text-white mb-2 text-center">{title}</h3>
        </div>
        <p id="modal-description" className="text-gray-300 mb-6 text-center">{message}</p>
        <div className="flex justify-center gap-4">
          <button
            onClick={onClose}
            className="min-h-[44px] py-2.5 px-6 bg-gray-600 text-white font-semibold rounded-lg hover:bg-gray-500 transition-all duration-200 active:scale-95 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 focus:ring-gray-500"
            aria-label="キャンセル"
          >
            キャンセル
          </button>
          <button
            onClick={onConfirm}
            className={`min-h-[44px] py-2.5 px-6 text-white font-semibold rounded-lg transition-all duration-200 active:scale-95 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 ${
              confirmButtonColor === 'yellow' 
                ? 'bg-yellow-600 hover:bg-yellow-500 focus:ring-yellow-600' 
                : 'bg-red-600 hover:bg-red-500 focus:ring-red-600'
            }`}
            aria-label={confirmButtonText}
          >
            {confirmButtonText}
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
