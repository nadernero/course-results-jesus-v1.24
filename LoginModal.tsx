import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import Logo from './Logo';

interface LoginModalProps {
    onClose: () => void;
    onLogin: (email: string, pass: string) => Promise<void>;
    isLoggingIn: boolean;
    loginError: string;
}

const LoginModal: React.FC<LoginModalProps> = ({ onClose, onLogin, isLoggingIn, loginError }) => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');

    useEffect(() => {
        const savedEmail = localStorage.getItem('loginEmail');
        if (savedEmail) {
            setEmail(savedEmail);
        }
    }, []);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onLogin(email, password);
    };

    return createPortal(
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 transition-opacity duration-300">
            <div className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-sm m-4 animate-fade-in-up" role="dialog" aria-modal="true" aria-labelledby="login-modal-title">
                <div className="text-center">
                   <Logo className="w-24 h-24 object-contain mx-auto mb-4" />
                   <h3 id="login-modal-title" className="text-xl font-bold text-slate-800">دخول المسؤولين</h3>
                   <p className="text-slate-600 mb-6">يرجى تسجيل الدخول للوصول إلى لوحة التحكم.</p>
                </div>
                <form onSubmit={handleSubmit} noValidate>
                    <div className="space-y-4">
                        <div>
                            <label htmlFor="email" className="block text-sm font-medium text-gray-700">البريد الإلكتروني</label>
                            <input
                                id="email"
                                name="email"
                                type="email"
                                autoComplete="email"
                                required
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                            />
                        </div>
                        <div>
                            <label htmlFor="password"className="block text-sm font-medium text-gray-700">كلمة السر</label>
                            <input
                                id="password"
                                name="password"
                                type="password"
                                autoComplete="current-password"
                                required
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                            />
                        </div>
                    </div>

                    {loginError && <p className="text-red-500 mt-4 text-sm font-semibold text-center" role="alert">{loginError}</p>}
                    
                    <div className="flex justify-end items-center gap-4 mt-8">
                        <button type="button" onClick={onClose} disabled={isLoggingIn} className="px-5 py-2 bg-gray-100 text-slate-700 font-semibold rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-50">
                            إلغاء
                        </button>
                        <button type="submit" disabled={isLoggingIn || !email || !password} className="w-28 px-5 py-2 bg-indigo-600 text-white font-bold rounded-lg hover:bg-indigo-700 transition-colors disabled:bg-indigo-300 disabled:cursor-wait flex justify-center items-center">
                            {isLoggingIn ? (
                                <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-white"></div>
                            ) : (
                                'دخول'
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>,
        document.body
    );
};

export default LoginModal;