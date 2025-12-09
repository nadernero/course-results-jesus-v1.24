
import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import type { CourseResult } from './types';

interface CourseResultFormModalProps {
    result: (CourseResult & { id?: string }) | null;
    onClose: () => void;
    onSave: (result: CourseResult) => void;
    isSubmitting: boolean;
}

const CourseResultFormModal: React.FC<CourseResultFormModalProps> = ({ result, onClose, onSave, isSubmitting }) => {
    const [formData, setFormData] = useState({
        servantCode: '',
        courseName: '',
        date: '',
        score: '',
        attendance: '',
    });
    const [errors, setErrors] = useState<Record<string, string>>({});
    
    const isEditing = !!result;

    useEffect(() => {
        document.body.style.overflow = 'hidden';
        return () => {
            document.body.style.overflow = 'unset';
        };
    }, []);

    useEffect(() => {
        if (result) {
            setFormData({
                servantCode: result.servantCode || '',
                courseName: result.courseName || '',
                date: result.date || (result.year ? `${result.year}-01-01` : ''),
                score: result.score?.toString() || '',
                attendance: result.attendance?.toString() || '0',
            });
        } else {
            // Default date to today for new entries
            const today = new Date().toISOString().split('T')[0];
            setFormData(prev => ({ ...prev, date: today }));
        }
    }, [result]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
        if (errors[name]) {
            setErrors(prev => ({ ...prev, [name]: '' }));
        }
    };

    const validate = () => {
        const newErrors: Record<string, string> = {};
        if (!formData.servantCode.trim()) newErrors.servantCode = 'كود الخادم مطلوب';
        if (!formData.courseName.trim()) newErrors.courseName = 'اسم الكورس مطلوب';
        if (formData.score.trim().toLowerCase() !== 'غائب' && (formData.score.trim() === '' || isNaN(Number(formData.score)))) {
            newErrors.score = 'الدرجة يجب أن تكون رقمًا أو كلمة "غائب"';
        }
        if (formData.attendance.trim() === '' || isNaN(Number(formData.attendance))) {
            newErrors.attendance = 'نسبة الحضور يجب أن تكون رقمًا';
        }
        if (!formData.date) {
            newErrors.date = 'التاريخ مطلوب';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!validate()) return;
        
        const year = parseInt(formData.date.split('-')[0], 10);

        const resultToSave: CourseResult = {
            servantCode: formData.servantCode.trim(),
            courseName: formData.courseName.trim(),
            year: year,
            date: formData.date,
            score: formData.score.trim().toLowerCase() === 'غائب' ? 'غائب' : Number(formData.score),
            attendance: Number(formData.attendance),
        };
        onSave(resultToSave);
    };

    return createPortal(
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50">
            <div className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-md m-4 animate-fade-in-up" role="dialog" aria-modal="true">
                <h3 className="text-xl font-bold text-slate-800 mb-6">{isEditing ? 'تعديل نتيجة كورس' : 'إضافة نتيجة كورس'}</h3>
                <form onSubmit={handleSubmit} noValidate>
                    <div className="space-y-4">
                        <div>
                            <label htmlFor="servantCode" className="block text-sm font-medium text-gray-700">كود الخادم</label>
                            <input type="text" name="servantCode" id="servantCode" value={formData.servantCode} onChange={handleChange} className={`w-full mt-1 px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 ${errors.servantCode ? 'border-red-500' : 'border-gray-300'}`} required />
                            {errors.servantCode && <p className="text-red-500 text-xs mt-1">{errors.servantCode}</p>}
                        </div>
                        <div>
                            <label htmlFor="courseName" className="block text-sm font-medium text-gray-700">اسم الكورس</label>
                            <input type="text" name="courseName" id="courseName" value={formData.courseName} onChange={handleChange} className={`w-full mt-1 px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 ${errors.courseName ? 'border-red-500' : 'border-gray-300'}`} required />
                            {errors.courseName && <p className="text-red-500 text-xs mt-1">{errors.courseName}</p>}
                        </div>
                        <div>
                            <label htmlFor="date" className="block text-sm font-medium text-gray-700">تاريخ الكورس</label>
                            <input type="date" name="date" id="date" value={formData.date} onChange={handleChange} className={`w-full mt-1 px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 ${errors.date ? 'border-red-500' : 'border-gray-300'}`} />
                            {errors.date && <p className="text-red-500 text-xs mt-1">{errors.date}</p>}
                        </div>
                        <div>
                            <label htmlFor="score" className="block text-sm font-medium text-gray-700">الدرجة</label>
                            <input type="text" name="score" id="score" placeholder='ادخل درجة أو كلمة "غائب"' value={formData.score} onChange={handleChange} className={`w-full mt-1 px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 ${errors.score ? 'border-red-500' : 'border-gray-300'}`} />
                            {errors.score && <p className="text-red-500 text-xs mt-1">{errors.score}</p>}
                        </div>
                        <div>
                            <label htmlFor="attendance" className="block text-sm font-medium text-gray-700">نسبة الحضور (%)</label>
                            <input type="number" name="attendance" id="attendance" value={formData.attendance} onChange={handleChange} className={`w-full mt-1 px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 ${errors.attendance ? 'border-red-500' : 'border-gray-300'}`} />
                             {errors.attendance && <p className="text-red-500 text-xs mt-1">{errors.attendance}</p>}
                        </div>
                    </div>
                    <div className="flex justify-end items-center gap-4 mt-8">
                        <button type="button" onClick={onClose} disabled={isSubmitting} className="px-5 py-2 bg-gray-100 text-slate-700 font-semibold rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-50">إلغاء</button>
                        <button type="submit" disabled={isSubmitting} className="px-5 py-2 bg-indigo-600 text-white font-bold rounded-lg hover:bg-indigo-700 transition-colors disabled:bg-indigo-300 disabled:cursor-wait">
                            {isSubmitting ? 'جاري الحفظ...' : 'حفظ'}
                        </button>
                    </div>
                </form>
            </div>
        </div>,
        document.body
    );
};

export default CourseResultFormModal;