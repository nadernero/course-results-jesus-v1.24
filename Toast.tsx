

import React, { useEffect, useState } from 'react';

export type ToastType = 'success' | 'error' | 'info';

interface ToastProps {
  message: string;
  type: ToastType;
  onDismiss: () => void;
}

// FIX: Replaced `JSX.Element` with `React.ReactElement` to resolve the "Cannot find namespace 'JSX'" error. This ensures the type is correctly resolved from the imported React module.
const icons: Record<ToastType, React.ReactElement> = {
  success: (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
  error: (
     <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
  info: (
     <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
};

const bgColors: Record<ToastType, string> = {
    success: 'bg-green-50 border-green-200 dark:bg-green-900/30 dark:border-green-700',
    error: 'bg-red-50 border-red-200 dark:bg-red-900/30 dark:border-red-700',
    info: 'bg-blue-50 border-blue-200 dark:bg-blue-900/30 dark:border-blue-700',
}

const textColors: Record<ToastType, string> = {
    success: 'text-gray-800 dark:text-green-200',
    error: 'text-gray-800 dark:text-red-200',
    info: 'text-gray-800 dark:text-blue-200',
}

const Toast: React.FC<ToastProps> = ({ message, type, onDismiss }) => {
  const [isExiting, setIsExiting] = useState(false);

  useEffect(() => {
    const exitTimer = setTimeout(() => {
        setIsExiting(true);
        const dismissTimer = setTimeout(onDismiss, 300); // Wait for exit animation
        return () => clearTimeout(dismissTimer);
    }, 4000); // 4 seconds visible

    return () => clearTimeout(exitTimer);
  }, [onDismiss]);
  
  const handleManualDismiss = () => {
      setIsExiting(true);
      setTimeout(onDismiss, 300);
  };

  return (
    <div
      className={`
        w-full max-w-sm p-4 rounded-xl shadow-lg border flex items-start gap-4 transition-all duration-300 ease-in-out
        ${bgColors[type]}
        ${isExiting ? 'opacity-0 -translate-x-full' : 'opacity-100 translate-x-0'}
      `}
      style={{ animation: 'toast-in-left 0.5s ease' }}
    >
      <div className="flex-shrink-0">{icons[type]}</div>
      <div className="flex-grow">
        <p className={`text-sm font-semibold ${textColors[type]}`}>{message}</p>
      </div>
      <button onClick={handleManualDismiss} className="text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 flex-shrink-0">
         <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>
  );
};

export default Toast;