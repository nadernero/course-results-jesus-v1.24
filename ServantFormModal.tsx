
import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import type { Servant } from './types';

interface ServantFormModalProps {
    servant: Servant | null;
    onClose: () => void;
    onSave: (servant: Servant) => void;
    isSubmitting: boolean;
}

const ServantFormModal: React.FC<ServantFormModalProps> = ({ servant, onClose, onSave, isSubmitting }) => {
    const [formData, setFormData] = useState({
        code: '',
        name: '',
        mobileNumber: '',
        allServices: '',
    });
    const [errors, setErrors] = useState<Record<string, string>>({});
    
    const isEditing = !!servant;

    useEffect(() => {
        document.body.style.overflow = 'hidden';
        return () => {
            document.body.style.overflow = 'unset';
        };
    }, []);

    useEffect(() => {
        if (servant) {
            setFormData({
                code: servant.code,
                name: servant.name,
                mobileNumber: servant.mobileNumber || '',
                allServices: (servant.allServices || []).join(', '),
            });
        }
    }, [servant]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
        if (errors[name]) {
            setErrors(prev => ({ ...prev, [name]: '' }));
        }
    };

    const validate = () => {
        const newErrors: Record<string, string> = {};
        if (!formData.code.trim()) newErrors.code = 'الكود مطلوب';
        if (!formData.name.trim()) newErrors.name = 'الاسم مطلوب';
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!validate()) return;
        
        const servicesArray = formData.allServices.split(',').map(s => s.trim()).filter(Boolean);

        const servantToSave: Servant = {
            code: formData.code.trim(),
            name: formData.name.trim(),
            mobileNumber: formData.mobileNumber.trim(),
            allServices: servicesArray,
            primaryService: servicesArray[0] || '',
        };
        onSave(servantToSave);
    };

    return createPortal(
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50">
            <div className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-md m-4 animate-fade-in-up" role="dialog" aria-modal="true">
                <h3 className="text-xl font-bold text-slate-800 mb-6">{isEditing ? 'تعديل بيانات الخادم' : 'إضافة خادم جديد'}</h3>
                <form onSubmit={handleSubmit} noValidate>
                    <div className="space-y-4">
                        <div>
                            <label htmlFor="code" className="block text-sm font-medium text-gray-700">الكود</label>
                            <input
                                type="text"
                                name="code"
                                id="code"
                                value={formData.code}
                                onChange={handleChange}
                                disabled={isEditing}
                                className={`w-full mt-1 px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 ${isEditing ? 'bg-gray-100' : ''} ${errors.code ? 'border-red-500' : 'border-gray-300'}`}
                                required
                            />
                            {errors.code && <p className="text-red-500 text-xs mt-1">{errors.code}</p>}
                        </div>
                         <div>
                            <label htmlFor="name" className="block text-sm font-medium text-gray-700">الاسم بالكامل</label>
                            <input
                                type="text"
                                name="name"
                                id="name"
                                value={formData.name}
                                onChange={handleChange}
                                className={`w-full mt-1 px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 ${errors.name ? 'border-red-500' : 'border-gray-300'}`}
                                required
                            />
                            {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name}</p>}
                        </div>
                         <div>
                            <label htmlFor="mobileNumber" className="block text-sm font-medium text-gray-700">رقم الموبايل</label>
                            <input
                                type="text"
                                name="mobileNumber"
                                id="mobileNumber"
                                value={formData.mobileNumber}
                                onChange={handleChange}
                                className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                            />
                        </div>
                        <div>
                            <label htmlFor="allServices" className="block text-sm font-medium text-gray-700">الخدمات</label>
                            <input
                                type="text"
                                name="allServices"
                                id="allServices"
                                placeholder='مثال: خدمة ابتدائي, خدمة الحضانة'
                                value={formData.allServices}
                                onChange={handleChange}
                                className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                            />
                            <p className="text-xs text-gray-500 mt-1">افصل بين الخدمات بفاصلة ( , ).</p>
                        </div>
                    </div>
                    <div className="flex justify-end items-center gap-4 mt-8">
                        <button type="button" onClick={onClose} disabled={isSubmitting} className="px-5 py-2 bg-gray-100 text-slate-700 font-semibold rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-50">
                            إلغاء
                        </button>
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

export default ServantFormModal;
