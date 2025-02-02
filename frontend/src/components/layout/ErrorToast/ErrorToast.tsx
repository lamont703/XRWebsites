import React, { useEffect } from 'react';

interface ErrorToastProps {
  message: string;
  isVisible: boolean;
  onClose: () => void;
  duration?: number;
}

const ErrorToast: React.FC<ErrorToastProps> = ({
  message,
  isVisible,
  onClose,
  duration = 5000,
}) => {
  useEffect(() => {
    if (isVisible) {
      const timer = setTimeout(() => {
        onClose();
      }, duration);

      return () => clearTimeout(timer);
    }
  }, [isVisible, duration, onClose]);

  if (!isVisible) return null;

  return (
    <div className="fixed z-50 animate-fade-in
      top-4 right-4 
      sm:max-w-sm 
      max-w-[calc(100%-2rem)] 
      mx-4 sm:mx-0"
    >
      <div className="bg-red-500 text-white px-4 sm:px-6 py-3 sm:py-4 rounded-lg shadow-lg">
        <div className="flex items-center justify-between gap-4">
          <span className="text-sm sm:text-base flex-1">{message}</span>
          <button
            onClick={onClose}
            className="text-white hover:text-red-200 focus:outline-none flex-shrink-0"
            aria-label="Close error message"
          >
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
};

export default ErrorToast; 