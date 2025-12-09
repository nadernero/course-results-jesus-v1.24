import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';

interface ConfirmationModalProps {
    title: string;
    message: string;
    onConfirm: () => void;
    onCancel: () => void;
    isConfirming: boolean;
    confirmText?: string;
    cancelText?: string;
    confirmButtonClass?: string;
}

const ConfirmationModal: React.FC<ConfirmationModalProps> = ({
    title,
    message,
    onConfirm,
    onCancel,
    isConfirming,
    confirmText = 'تأكيد',
    cancelText = 'إلغاء',
    confirmButtonClass = 'bg-indigo-600 hover:bg-indigo-700',
}) => {
    useEffect(() => {
        document.body.style.overflow = 'hidden';
        return () => {
            document.body.style.overflow = 'unset';
        };
    }, []);

    return createPortal(
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50">
            <div className="bg-white dark:bg-slate-800 p-8 rounded-2xl shadow-xl w-full max-w-sm m-4 animate-fade-in-up" role="dialog" aria-modal="true">
                <h3 className="text-xl font-bold text-slate-800 dark:text-slate-100">{title}</h3>
                <p className="text-slate-600 dark:text-slate-300 my-4">{message}</p>
                <div className="flex justify-end items-center gap-4 mt-6">
                    <button
                        type="button"
                        onClick={onCancel}
                        disabled={isConfirming}
                        className="px-5 py-2 bg-gray-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 font-semibold rounded-lg hover:bg-gray-200 dark:hover:bg-slate-600 transition-colors disabled:opacity-50"
                    >
                        {cancelText}
                    </button>
                    <button
                        type="button"
                        onClick={onConfirm}
                        disabled={isConfirming}
                        className={`px-5 py-2 text-white font-bold rounded-lg transition-colors disabled:cursor-wait ${confirmButtonClass} disabled:opacity-70`}
                    >
                        {isConfirming ? 'جاري التنفيذ...' : confirmText}
                    </button>
                </div>
            </div>
        </div>,
        document.body
    );
};

export default ConfirmationModal;