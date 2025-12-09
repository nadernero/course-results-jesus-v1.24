import React, { useState, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import type { Evaluation } from './types';

interface EvaluationFormModalProps {
    evaluation: (Evaluation & { id?: string }) | null;
    onClose: () => void;
    onSave: (evaluation: Omit<Evaluation, 'id'>, id?: string) => void;
    isSubmitting: boolean;
}

const evaluationAxes: { key: keyof Evaluation['scores'], label: string }[] = [
    { key: 'spiritualLife', label: 'الحياة الروحية' },
    { key: 'commitment', label: 'الالتزام والمواظبة' },
    { key: 'preparationAndDelivery', label: 'التحضير والأداء' },
    { key: 'relationshipWithPeers', label: 'العلاقة بالخدام' },
    { key: 'relationshipWithCongregation', label: 'العلاقة بالمخدومين' },
    { key: 'personalGrowth', label: 'النمو الشخصي والتطوير' },
];

const EvaluationFormModal: React.FC<EvaluationFormModalProps> = ({ evaluation, onClose, onSave, isSubmitting }) => {
    const [formData, setFormData] = useState({
        servantCode: '',
        serviceName: '',
        year: new Date().getFullYear().toString(),
        scores: {
            spiritualLife: 75,
            commitment: 75,
            preparationAndDelivery: 75,
            relationshipWithPeers: 75,
            relationshipWithCongregation: 75,
            personalGrowth: 75,
        },
        generalNotes: '',
        evaluatorName: '',
    });
    const [errors, setErrors] = useState<Record<string, string>>({});
    
    const isEditing = !!evaluation;

    const overallAverage = useMemo(() => {
        const total = (Object.values(formData.scores) as number[]).reduce((sum: number, score) => sum + Number(score), 0);
        return Math.round(total / Object.keys(formData.scores).length);
    }, [formData.scores]);

    useEffect(() => {
        document.body.style.overflow = 'hidden';
        return () => {
            document.body.style.overflow = 'unset';
        };
    }, []);

    useEffect(() => {
        if (evaluation) {
            setFormData({
                servantCode: evaluation.servantCode || '',
                serviceName: evaluation.serviceName || '',
                year: (evaluation.year || new Date().getFullYear()).toString(),
                scores: evaluation.scores,
                generalNotes: evaluation.generalNotes || '',
                evaluatorName: evaluation.evaluatorName || '',
            });
        }
    }, [evaluation]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
        if (errors[name]) {
            setErrors(prev => ({ ...prev, [name]: '' }));
        }
    };

    const handleScoreChange = (key: keyof Evaluation['scores'], value: number) => {
        setFormData(prev => ({
            ...prev,
            scores: {
                ...prev.scores,
                [key]: value,
            }
        }));
    };

    const validate = () => {
        const newErrors: Record<string, string> = {};
        if (!formData.servantCode.trim()) newErrors.servantCode = 'كود الخادم مطلوب';
        if (!formData.serviceName.trim()) newErrors.serviceName = 'اسم الخدمة مطلوب';
        if (!formData.evaluatorName.trim()) newErrors.evaluatorName = 'اسم المُقيِّم مطلوب';
        if (isNaN(Number(formData.year)) || formData.year.length !== 4) newErrors.year = 'السنة غير صالحة';

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!validate()) return;
        
        const evaluationToSave: Omit<Evaluation, 'id'> = {
            servantCode: formData.servantCode.trim(),
            serviceName: formData.serviceName.trim(),
            year: Number(formData.year),
            scores: formData.scores,
            overallAverage: overallAverage,
            generalNotes: formData.generalNotes.trim(),
            evaluatorName: formData.evaluatorName.trim(),
        };
        onSave(evaluationToSave, evaluation?.id);
    };

    return createPortal(
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50">
            <div className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-2xl m-4 animate-fade-in-up max-h-[90vh] flex flex-col" role="dialog" aria-modal="true">
                <h3 className="text-xl font-bold text-slate-800 mb-6 flex-shrink-0">{isEditing ? 'تعديل تقييم الخدمة' : 'إضافة تقييم جديد'}</h3>
                <form onSubmit={handleSubmit} noValidate className="flex-grow overflow-y-auto pr-2">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label htmlFor="servantCode" className="block text-sm font-medium text-gray-700">كود الخادم</label>
                            <input type="text" name="servantCode" id="servantCode" value={formData.servantCode} onChange={handleChange} className={`w-full mt-1 px-3 py-2 border rounded-md shadow-sm ${errors.servantCode ? 'border-red-500' : 'border-gray-300'}`} required />
                            {errors.servantCode && <p className="text-red-500 text-xs mt-1">{errors.servantCode}</p>}
                        </div>
                        <div>
                            <label htmlFor="serviceName" className="block text-sm font-medium text-gray-700">اسم الخدمة</label>
                            <input type="text" name="serviceName" id="serviceName" value={formData.serviceName} onChange={handleChange} className={`w-full mt-1 px-3 py-2 border rounded-md shadow-sm ${errors.serviceName ? 'border-red-500' : 'border-gray-300'}`} required />
                            {errors.serviceName && <p className="text-red-500 text-xs mt-1">{errors.serviceName}</p>}
                        </div>
                        <div>
                            <label htmlFor="year" className="block text-sm font-medium text-gray-700">سنة التقييم</label>
                            <input type="number" name="year" id="year" value={formData.year} onChange={handleChange} className={`w-full mt-1 px-3 py-2 border rounded-md shadow-sm ${errors.year ? 'border-red-500' : 'border-gray-300'}`} />
                            {errors.year && <p className="text-red-500 text-xs mt-1">{errors.year}</p>}
                        </div>
                        <div>
                            <label htmlFor="evaluatorName" className="block text-sm font-medium text-gray-700">اسم المُقيِّم</label>
                            <input type="text" name="evaluatorName" id="evaluatorName" value={formData.evaluatorName} onChange={handleChange} className={`w-full mt-1 px-3 py-2 border rounded-md shadow-sm ${errors.evaluatorName ? 'border-red-500' : 'border-gray-300'}`} required />
                            {errors.evaluatorName && <p className="text-red-500 text-xs mt-1">{errors.evaluatorName}</p>}
                        </div>
                    </div>
                    <div className="mt-6 pt-4 border-t">
                        <div className="flex justify-between items-center mb-4">
                            <h4 className="text-lg font-semibold text-slate-700">محاور التقييم</h4>
                            <div className="text-center">
                                <p className="text-sm font-medium text-gray-500">المتوسط العام</p>
                                <p className="text-2xl font-bold text-indigo-600">{overallAverage}%</p>
                            </div>
                        </div>
                        <div className="space-y-4">
                            {evaluationAxes.map(({ key, label }) => (
                                <div key={key}>
                                    <label htmlFor={key} className="flex justify-between items-center text-sm font-medium text-gray-700 mb-1">
                                        <span>{label}</span>
                                        <span className="font-mono text-indigo-600 text-xs font-bold">{formData.scores[key]}%</span>
                                    </label>
                                    <input
                                        id={key}
                                        type="range"
                                        min="0"
                                        max="100"
                                        value={formData.scores[key]}
                                        onChange={(e) => handleScoreChange(key, parseInt(e.target.value, 10))}
                                        className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                                    />
                                </div>
                            ))}
                        </div>
                    </div>
                     <div className="mt-6">
                        <label htmlFor="generalNotes" className="block text-sm font-medium text-gray-700">ملاحظات عامة</label>
                        <textarea name="generalNotes" id="generalNotes" rows={3} value={formData.generalNotes} onChange={handleChange} className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-md shadow-sm"></textarea>
                    </div>
                </form>
                <div className="flex justify-end items-center gap-4 mt-8 flex-shrink-0">
                    <button type="button" onClick={onClose} disabled={isSubmitting} className="px-5 py-2 bg-gray-100 text-slate-700 font-semibold rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-50">إلغاء</button>
                    <button type="button" onClick={handleSubmit} disabled={isSubmitting} className="px-5 py-2 bg-indigo-600 text-white font-bold rounded-lg hover:bg-indigo-700 transition-colors disabled:bg-indigo-300 disabled:cursor-wait">
                        {isSubmitting ? 'جاري الحفظ...' : 'حفظ'}
                    </button>
                </div>
            </div>
        </div>,
        document.body
    );
};

export default EvaluationFormModal;