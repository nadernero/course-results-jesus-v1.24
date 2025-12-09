import React, { useState, useEffect } from 'react';
import type { CustomStyles } from './App';
import { defaultBgUrl } from './App';
import { db } from './firebaseConfig';
import { useToast } from './ToastProvider';

interface GeneralSettingsViewProps {
    setTheme: (theme: string) => void;
    isDarkMode: boolean;
    setIsDarkMode: (isDark: boolean) => void;
    customStyles: CustomStyles;
    setCustomStyles: React.Dispatch<React.SetStateAction<CustomStyles>>;
    setBackgroundUrl: (url: string) => void;
    backgroundUrl: string;
    backgroundGallery: string[];
    setBackgroundGallery: React.Dispatch<React.SetStateAction<string[]>>;
}

const themes = [
    { id: 'indigo', name: 'نيلي (افتراضي)', color: '#4f46e5', primary: 'bg-indigo-600', accent: 'text-indigo-600', light: 'bg-indigo-50' },
    { id: 'teal', name: 'أزرق مخضر', color: '#0d9488', primary: 'bg-teal-600', accent: 'text-teal-600', light: 'bg-teal-50' },
    { id: 'rose', name: 'وردي', color: '#e11d48', primary: 'bg-rose-600', accent: 'text-rose-600', light: 'bg-rose-50' },
    { id: 'purple', name: 'بنفسجي', color: '#9333ea', primary: 'bg-purple-600', accent: 'text-purple-600', light: 'bg-purple-50' },
    { id: 'green', name: 'أخضر', color: '#166534', primary: 'bg-green-800', accent: 'text-green-800', light: 'bg-green-50' },
    { id: 'amber', name: 'عنبري', color: '#d97706', primary: 'bg-amber-500', accent: 'text-amber-600', light: 'bg-amber-50' },
    { id: 'cyan', name: 'سماوي', color: '#0891b2', primary: 'bg-cyan-600', accent: 'text-cyan-600', light: 'bg-cyan-50' },
    { id: 'lime', name: 'ليموني', color: '#65a30d', primary: 'bg-lime-500', accent: 'text-lime-600', light: 'bg-lime-50' },
];

const paperSizeOptions = {
    a4: 'A4 (قياسي)',
    a5: 'A5 (صغير)',
    letter: 'Letter',
};


const presetColors = [
    '#000000', '#374151', '#7f1d1d', '#b91c1c', '#d97706', '#166534', '#065f46', '#115e59', '#0891b2', '#0c4a6e', '#1e3a8a', '#4f46e5', '#6d28d9', '#9333ea', '#be185d', '#e11d48'
];

// --- Icons ---
const PencilIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path d="M17.414 2.586a2 2 0 00-2.828 0L7 10.172V13h2.828l7.586-7.586a2 2 0 000-2.828z" /><path fillRule="evenodd" d="M2 6a2 2 0 012-2h4a1 1 0 010 2H4v10h10v-4a1 1 0 112 0v4a2 2 0 01-2 2H4a2 2 0 01-2-2V6z" clipRule="evenodd" /></svg>;
const CloseIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" /></svg>;

const ColorPickerWithPalette: React.FC<{ label: string; value: string; onChange: (value: string) => void }> = ({ label, value, onChange }) => (
    <div>
        <div className="flex items-center justify-between">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">{label}</label>
            <div className="relative w-28 h-8 border border-gray-300 dark:border-slate-600 rounded-md flex items-center">
                <input
                    type="color"
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                />
                <div className="w-8 h-full rounded-r-md" style={{ backgroundColor: value }}></div>
                <input 
                    type="text" 
                    value={value} 
                    onChange={(e) => onChange(e.target.value)} 
                    className="w-20 px-2 py-1 text-xs font-mono bg-transparent focus:outline-none text-gray-700 dark:text-gray-300"
                />
            </div>
        </div>
        <div className="mt-2 flex flex-wrap gap-2">
            {presetColors.map(color => (
                 <button
                    key={color}
                    type="button"
                    onClick={() => onChange(color)}
                    className={`w-6 h-6 rounded-full border border-gray-300 dark:border-slate-500 cursor-pointer transition transform hover:scale-110 ${value === color ? 'ring-2 ring-offset-2 ring-[rgb(var(--color-primary-rgb))]' : ''}`}
                    style={{ backgroundColor: color }}
                    aria-label={`Select color ${color}`}
                 />
            ))}
        </div>
    </div>
);


const GeneralSettingsView: React.FC<GeneralSettingsViewProps> = ({ setTheme, isDarkMode, setIsDarkMode, customStyles, setCustomStyles, setBackgroundUrl, backgroundUrl, backgroundGallery, setBackgroundGallery }) => {
    const [selectedThemeId, setSelectedThemeId] = useState(() => localStorage.getItem('theme') || 'indigo');
    const [customBgUrl, setCustomBgUrl] = useState('');
    const [isUploading, setIsUploading] = useState(false);
    const [editingIndex, setEditingIndex] = useState<number | null>(null);
    const [newUrlInput, setNewUrlInput] = useState('');
    const { addToast } = useToast();


    // Sync selectedThemeId with custom color changes
    useEffect(() => {
        const matchingTheme = themes.find(t => t.color === customStyles.primaryColor);
        if (matchingTheme) {
            setSelectedThemeId(matchingTheme.id);
            setTheme(matchingTheme.id);
        } else {
            setSelectedThemeId('custom');
            setTheme(''); // No predefined theme class
        }
    }, [customStyles.primaryColor, setTheme]);
    
    // Helper function to update background globally via Firestore
    const handleBackgroundUpdate = async (url: string) => {
        // Optimistic update for the admin immediately
        setBackgroundUrl(url);
        
        try {
            await db.collection('settings').doc('general').set({ backgroundUrl: url }, { merge: true });
            addToast('تم تحديث الخلفية لجميع المستخدمين.', 'success');
        } catch (error) {
            console.error("Error updating global background:", error);
            addToast('فشل تحديث الخلفية في قاعدة البيانات.', 'error');
        }
    };
    
    const handleThemeChange = (themeId: string) => {
        const theme = themes.find(t => t.id === themeId);
        if (theme) {
            setSelectedThemeId(themeId);
            setTheme(themeId); // This sets the CSS class in index.html
            setCustomStyles(prev => ({...prev, primaryColor: theme.color }));
        }
    };

    const handleStyleChange = (key: keyof CustomStyles, value: number | string) => {
        setCustomStyles(prev => ({ ...prev, [key]: value }));
    };
    
    const handleCustomUrlSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (customBgUrl.trim()) {
            handleBackgroundUpdate(customBgUrl.trim());
        }
    };

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadstart = () => setIsUploading(true);
            reader.onloadend = () => {
                const result = reader.result as string;
                handleBackgroundUpdate(result);
                setIsUploading(false);
            };
            reader.onerror = () => {
                setIsUploading(false);
                addToast('حدث خطأ أثناء قراءة الصورة.', 'error');
            }
            reader.readAsDataURL(file);
        }
    };

    const handleGalleryFileUpload = (e: React.ChangeEvent<HTMLInputElement>, index: number) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                const newGallery = [...backgroundGallery];
                newGallery[index] = reader.result as string;
                setBackgroundGallery(newGallery);
                setEditingIndex(null);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleUrlSubmit = (e: React.FormEvent, index: number) => {
        e.preventDefault();
        if (newUrlInput.trim()) {
            const newGallery = [...backgroundGallery];
            newGallery[index] = newUrlInput.trim();
            setBackgroundGallery(newGallery);
            setEditingIndex(null);
        }
    };


    return (
        <div className="space-y-8">
            <div className="bg-white dark:bg-slate-800 p-8 rounded-lg shadow-sm border border-gray-200/80 dark:border-slate-700">
                <h3 className="text-xl font-bold text-slate-700 dark:text-slate-200 mb-2">تخصيص نظام الألوان</h3>
                <p className="text-slate-500 dark:text-slate-400 mb-6">اختر نظام الألوان للوحة التحكم والعناصر الرئيسية.</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
                    {themes.map(theme => (
                        <div 
                            key={theme.id}
                            onClick={() => handleThemeChange(theme.id)}
                            className={`p-4 rounded-lg border-2 cursor-pointer transition-all duration-200 ${selectedThemeId === theme.id ? 'border-[rgb(var(--color-primary-rgb))] ring-2 ring-[rgb(var(--color-primary-rgb))]' : 'border-gray-300 dark:border-slate-600 hover:border-gray-400 dark:hover:border-slate-500'}`}
                        >
                            <div className="flex items-center justify-between mb-3">
                               <p className="font-semibold text-slate-800 dark:text-slate-200">{theme.name}</p>
                                {selectedThemeId === theme.id && <div className="text-[rgb(var(--color-primary-rgb))]"><svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg></div>}
                            </div>
                            <div className={`${theme.light} dark:bg-slate-700 p-3 rounded-md`}>
                                <p className={`text-sm font-medium ${theme.accent}`}>{theme.name}</p>
                                <button className={`px-3 py-1 text-xs text-white rounded-md mt-2 ${theme.primary}`}>زر</button>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
            
             <div className="bg-white dark:bg-slate-800 p-8 rounded-lg shadow-sm border border-gray-200/80 dark:border-slate-700">
                <h3 className="text-xl font-bold text-slate-700 dark:text-slate-200 mb-2">خلفية التطبيق</h3>
                <p className="text-slate-500 dark:text-slate-400 mb-6">اختر الخلفية لواجهة المستخدم الرئيسية. سيتم تطبيق التغييرات على جميع المستخدمين.</p>
                <div className="space-y-6">
                    <div>
                        <h4 className="font-semibold text-slate-600 dark:text-slate-300 mb-3">الخلفية الافتراضية</h4>
                        <button onClick={() => handleBackgroundUpdate(defaultBgUrl)} className="px-5 py-2 bg-gray-100 text-slate-700 font-semibold rounded-lg hover:bg-gray-200 dark:bg-slate-700 dark:text-slate-200 dark:hover:bg-slate-600">
                            استعادة الخلفية الافتراضية
                        </button>
                    </div>
                     <div className="border-t border-gray-200 dark:border-slate-700 pt-6">
                        <h4 className="font-semibold text-slate-600 dark:text-slate-300 mb-3">رفع صورة من الجهاز</h4>
                         <label htmlFor="bg-upload" className="cursor-pointer inline-flex items-center px-5 py-2 bg-[rgb(var(--color-primary-light-rgb))] text-[rgb(var(--color-primary-dark-text-rgb))] font-semibold rounded-lg hover:bg-[rgb(var(--color-primary-accent-rgb))]/20">
                           {isUploading ? 'جاري الرفع...' : 'اختر صورة'}
                        </label>
                        <input id="bg-upload" type="file" className="hidden" onChange={handleFileUpload} accept="image/*" />
                    </div>
                    <div className="border-t border-gray-200 dark:border-slate-700 pt-6">
                        <h4 className="font-semibold text-slate-600 dark:text-slate-300 mb-3">استخدام رابط صورة</h4>
                        <form onSubmit={handleCustomUrlSubmit} className="flex items-center gap-2">
                             <input type="url" placeholder="https://example.com/image.jpg" value={customBgUrl} onChange={(e) => setCustomBgUrl(e.target.value)} className="w-full sm:max-w-md px-4 py-2 text-gray-700 bg-white dark:bg-slate-700 border border-gray-300 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-[rgb(var(--color-primary-rgb))] dark:text-gray-200" />
                            <button type="submit" className="px-5 py-2 bg-[rgb(var(--color-primary-rgb))] text-white font-bold rounded-lg hover:bg-[rgb(var(--color-primary-accent-rgb))]">تطبيق</button>
                        </form>
                    </div>
                    <div className="border-t border-gray-200 dark:border-slate-700 pt-6">
                        <h4 className="font-semibold text-slate-600 dark:text-slate-300 mb-2">معرض الخلفيات</h4>
                        <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">اضغط على صورة لتغيير الخلفية مباشرةً للجميع، أو مرر الفأرة لتعديل الصورة في المعرض.</p>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            {backgroundGallery.map((url, index) => (
                                <div 
                                    key={index} 
                                    className="relative group aspect-video rounded-lg overflow-hidden shadow-md cursor-pointer"
                                    onClick={() => handleBackgroundUpdate(url)}
                                >
                                    <img
                                        src={url}
                                        alt={`خلفية ${index + 1}`}
                                        className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
                                        onError={(e) => (e.currentTarget.src = 'https://i.postimg.cc/8zW3pL2T/placeholder.png')}
                                    />
                                     {backgroundUrl === url && <div className="absolute inset-0 ring-4 ring-offset-2 ring-indigo-500 dark:ring-offset-slate-800 pointer-events-none rounded-lg"></div>}
                                    <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-40 transition-all duration-300 flex items-center justify-center opacity-0 group-hover:opacity-100">
                                        <button 
                                            onClick={(e) => { 
                                                e.stopPropagation(); 
                                                setEditingIndex(index); 
                                                setNewUrlInput(''); 
                                            }} 
                                            className="p-3 bg-white/80 dark:bg-slate-900/80 rounded-full text-slate-800 dark:text-white hover:scale-110 transition-transform" 
                                            aria-label="تعديل الصورة">
                                            <PencilIcon />
                                        </button>
                                    </div>

                                    {editingIndex === index && (
                                        <div 
                                            className="absolute inset-0 bg-black/80 z-10 flex flex-col justify-center items-center p-2 text-white animate-fade-in-up"
                                            onClick={(e) => e.stopPropagation()}
                                        >
                                            <button onClick={() => setEditingIndex(null)} className="absolute top-1 right-1 text-white/70 hover:text-white">
                                                <CloseIcon />
                                            </button>
                                            <h5 className="text-xs font-bold mb-2">تعديل الخلفية {index + 1}</h5>
                                            <form onSubmit={(e) => handleUrlSubmit(e, index)} className="w-full flex gap-1 mb-2">
                                                <input type="url" value={newUrlInput} onChange={(e) => setNewUrlInput(e.target.value)} placeholder="لصق رابط..." className="w-full text-xs px-2 py-1 bg-slate-700 text-white border border-slate-500 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                                                <button type="submit" className="text-xs px-2 py-1 bg-indigo-600 rounded-md hover:bg-indigo-700">حفظ</button>
                                            </form>
                                            <div className="relative my-1 w-full flex items-center"><span className="flex-grow border-t border-slate-600"></span><span className="flex-shrink mx-2 text-xs text-slate-400">أو</span><span className="flex-grow border-t border-slate-600"></span></div>
                                            <label htmlFor={`gallery-upload-${index}`} className="w-full text-center text-xs px-2 py-1 bg-slate-600 rounded-md hover:bg-slate-500 cursor-pointer">
                                                رفع صورة
                                            </label>
                                            <input id={`gallery-upload-${index}`} type="file" onChange={(e) => handleGalleryFileUpload(e, index)} accept="image/*" className="hidden" />
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            <div className="bg-white dark:bg-slate-800 p-8 rounded-lg shadow-sm border border-gray-200/80 dark:border-slate-700">
                <h3 className="text-xl font-bold text-slate-700 dark:text-slate-200 mb-2">الوضع الليلي</h3>
                <div className="flex items-center justify-between bg-slate-50 dark:bg-slate-700/50 p-4 rounded-lg">
                    <div className="flex items-center gap-3">
                        {isDarkMode ? 
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-yellow-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" /></svg> :
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
                        }
                        <span className="font-semibold text-slate-700 dark:text-slate-200">الوضع الليلي {isDarkMode ? 'مُفعّل' : 'غير مُفعّل'}</span>
                    </div>
                    <button onClick={() => setIsDarkMode(!isDarkMode)} className={`relative inline-flex flex-shrink-0 h-6 w-11 border-2 border-transparent rounded-full cursor-pointer transition-colors ease-in-out duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[rgb(var(--color-primary-rgb))] ${isDarkMode ? 'bg-[rgb(var(--color-primary-rgb))]' : 'bg-gray-200'}`}>
                        <span className={`inline-block w-5 h-5 bg-white rounded-full shadow-lg transform ring-0 transition ease-in-out duration-200 ${isDarkMode ? '-translate-x-5' : 'translate-x-0'}`} />
                    </button>
                </div>
            </div>
            
            <div className="bg-white dark:bg-slate-800 p-8 rounded-lg shadow-sm border border-gray-200/80 dark:border-slate-700">
                <h3 className="text-xl font-bold text-slate-700 dark:text-slate-200 mb-2">إعدادات الشهادة المتقدمة</h3>
                <p className="text-slate-500 dark:text-slate-400 mb-6">تحكم في أبعاد وجودة الشهادات عند تصديرها كملفات.</p>
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
                    <div>
                      <label htmlFor="paper-size" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        حجم الورق (لـ PDF)
                      </label>
                      <select
                        id="paper-size"
                        value={customStyles.paperSize}
                        onChange={(e) => handleStyleChange('paperSize', e.target.value)}
                        className="w-full p-2 border border-gray-300 dark:border-slate-600 rounded-md shadow-sm focus:ring-[rgb(var(--color-primary-rgb))] focus:border-[rgb(var(--color-primary-rgb))] bg-white dark:bg-slate-700 text-gray-800 dark:text-gray-200"
                      >
                         {Object.entries(paperSizeOptions).map(([value, label]) => (
                          <option key={value} value={value}>
                            {label}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label htmlFor="quality-scale" className="flex justify-between items-center text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        <span>مقياس الجودة (تكبير/تصغير)</span>
                        <span className="font-mono text-[rgb(var(--color-primary-dark-text-rgb))] dark:text-[rgb(var(--color-primary-light-text-rgb))] text-xs font-bold">{customStyles.qualityScale}x</span>
                      </label>
                       <input 
                        id="quality-scale" 
                        type="range" 
                        min="1" 
                        max="5" 
                        step="1"
                        value={customStyles.qualityScale} 
                        onChange={(e) => handleStyleChange('qualityScale', Number(e.target.value))} 
                        className="w-full h-2 bg-gray-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer"
                       />
                    </div>
                 </div>
            </div>

            <div className="bg-white dark:bg-slate-800 p-8 rounded-lg shadow-sm border border-gray-200/80 dark:border-slate-700">
                <h3 className="text-xl font-bold text-slate-700 dark:text-slate-200 mb-2">إعدادات المظهر المتقدمة</h3>
                <p className="text-slate-500 dark:text-slate-400 mb-6">تحكم في شفافية وضبابية وألوان البطاقات والنصوص في واجهة المستخدم الرئيسية.</p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
                    <div>
                        <label htmlFor="cardOpacity" className="flex justify-between items-center text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            <span>شفافية البطاقات (العتامة)</span>
                            <span className="font-mono text-[rgb(var(--color-primary-dark-text-rgb))] dark:text-[rgb(var(--color-primary-light-text-rgb))] text-xs font-bold">{Math.round(customStyles.cardOpacity * 100)}%</span>
                        </label>
                        <input id="cardOpacity" type="range" min="0" max="100" value={customStyles.cardOpacity * 100} onChange={(e) => handleStyleChange('cardOpacity', Number(e.target.value) / 100)} className="w-full h-2 bg-gray-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer" />
                    </div>
                     <div>
                        <label htmlFor="cardBorderOpacity" className="flex justify-between items-center text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            <span>شفافية حدود البطاقات</span>
                            <span className="font-mono text-[rgb(var(--color-primary-dark-text-rgb))] dark:text-[rgb(var(--color-primary-light-text-rgb))] text-xs font-bold">{Math.round(customStyles.cardBorderOpacity * 100)}%</span>
                        </label>
                        <input id="cardBorderOpacity" type="range" min="0" max="100" value={customStyles.cardBorderOpacity * 100} onChange={(e) => handleStyleChange('cardBorderOpacity', Number(e.target.value) / 100)} className="w-full h-2 bg-gray-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer" />
                    </div>
                    <div>
                        <label htmlFor="cardBlur" className="flex justify-between items-center text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                             <span>ضبابية الخلفية</span>
                            <span className="font-mono text-[rgb(var(--color-primary-dark-text-rgb))] dark:text-[rgb(var(--color-primary-light-text-rgb))] text-xs font-bold">{customStyles.cardBlur}px</span>
                        </label>
                        <input id="cardBlur" type="range" min="0" max="32" value={customStyles.cardBlur} onChange={(e) => handleStyleChange('cardBlur', Number(e.target.value))} className="w-full h-2 bg-gray-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer" />
                    </div>
                    <div></div> {/* Spacer */}
                    
                    <ColorPickerWithPalette
                        label="لون البطاقات الأساسي"
                        value={customStyles.cardColor}
                        onChange={(value) => handleStyleChange('cardColor', value)}
                    />
                     <ColorPickerWithPalette
                        label="اللون الأساسي (للأزرار)"
                        value={customStyles.primaryColor}
                        onChange={(value) => handleStyleChange('primaryColor', value)}
                    />
                    <ColorPickerWithPalette
                        label="لون النص (الوضع النهاري)"
                        value={customStyles.mainTextColorLight}
                        onChange={(value) => handleStyleChange('mainTextColorLight', value)}
                    />
                    <ColorPickerWithPalette
                        label="لون النص (الوضع الليلي)"
                        value={customStyles.mainTextColorDark}
                        onChange={(value) => handleStyleChange('mainTextColorDark', value)}
                    />
                </div>
            </div>

        </div>
    );
};

export default GeneralSettingsView;