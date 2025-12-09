
import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';

interface TutorialModalProps {
    onClose: () => void;
}

const steps = [
    {
        title: 'مرحباً بك في رحلتك!',
        content: 'هذا التطبيق هو أكثر من مجرد مستعرض للنتائج، إنه رفيقك في رحلة خدمتك ونموك. دعنا نستكشف معاً كيف يمكنك تحقيق أقصى استفادة منه.',
        imageComponent: () => (
            <div className="bg-indigo-50 dark:bg-slate-700 p-8 rounded-lg flex items-center justify-center aspect-square">
                 <svg xmlns="http://www.w3.org/2000/svg" className="h-24 w-24 text-indigo-500 dark:text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 20l-5.447-2.724A1 1 0 013 16.382V7.618a1 1 0 011.447-.894L9 9m0 11l6-3m-6 3V9m6 3l6-3m-6 3l-6-3m6 3v4a1 1 0 01-1.447.894L9 20" />
                 </svg>
            </div>
        )
    },
    {
        title: 'الخطوة ١: اكتشف ملفك الشخصي',
        content: 'ابدأ بإدخال "كود الخادم" الخاص بك (رقم العضوية الكنسية) أو "رقم الموبايل" المسجل لدينا، ثم اضغط على زر "بحث" لفتح بوابتك إلى عالم من الإحصائيات والإنجازات.',
         imageComponent: () => (
            <div className="bg-slate-100 dark:bg-slate-700 p-6 rounded-lg border dark:border-slate-600 flex flex-col items-center justify-center aspect-square">
                <input type="text" value="12345" readOnly className="w-full text-center p-3 rounded-lg border-2 border-indigo-400 text-lg font-mono" />
                <button className="mt-4 w-full p-3 bg-indigo-600 text-white font-bold rounded-lg shadow-lg hover:bg-indigo-700 transition">بحث</button>
            </div>
        )
    },
    {
        title: 'الخطوة ٢: سجلك الزمني وإصدار الشهادات',
        content: 'تصفح سجلك الزمني المفصل الذي يعرض نتائج جميع الكورسات وتقييمات الخدمة على مر السنين. من هنا، يمكنك إصدار "شهادة تقدير" لأي كورس اجتزته بنجاح.',
        imageComponent: () => (
            <div className="bg-slate-100 dark:bg-slate-700 p-6 rounded-lg border dark:border-slate-600 text-center aspect-square flex flex-col justify-center">
                <div className="p-4 bg-white dark:bg-slate-600 rounded-lg shadow-sm mb-4">
                    <p className="font-bold text-slate-800 dark:text-slate-100">كورس مجتمع يسوع (2024)</p>
                    <div className="flex justify-around mt-2">
                        <p>الدرجة: <span className="font-bold text-green-600 dark:text-green-400">95/100</span></p>
                        <p>الحضور: <span className="font-bold text-green-600 dark:text-green-400">100%</span></p>
                    </div>
                </div>
                <button className="w-full p-3 bg-indigo-600 text-white font-bold rounded-lg shadow-lg hover:bg-indigo-700 transition">إصدار الشهادة</button>
            </div>
        )
    },
    {
        title: 'الخطوة ٣: رحلة الصعود',
        content: 'شاهد رحلتك التعليمية تنبض بالحياة! رسم "رحلة الصعود" البياني يصور تقدمك عبر الكورسات المختلفة. كل نقطة تمثل إنجازاً، مما يساعدك على رؤية نموك بوضوح.',
        imageComponent: () => (
             <div className="bg-slate-100 dark:bg-slate-700 p-6 rounded-lg border dark:border-slate-600 text-center aspect-square flex flex-col justify-center items-center">
                 <svg viewBox="0 0 100 50" className="w-full">
                    <path d="M 10 40 C 30 10, 50 30, 70 20 L 90 15" fill="none" stroke="#4f46e5" strokeWidth="2" strokeLinecap="round" />
                    <circle cx="10" cy="40" r="2" fill="#4f46e5" />
                    <text x="10" y="48" fontSize="4" textAnchor="middle" className="fill-slate-500 dark:fill-slate-400">2022</text>
                    <circle cx="70" cy="20" r="2" fill="#4f46e5" />
                     <text x="70" y="12" fontSize="4" textAnchor="middle" className="fill-slate-500 dark:fill-slate-400">2023</text>
                    <circle cx="90" cy="15" r="2" fill="#4f46e5" />
                    <text x="90" y="23" fontSize="4" textAnchor="middle" className="fill-slate-500 dark:fill-slate-400">2024</text>
                 </svg>
                 <p className="text-xs font-semibold text-slate-600 dark:text-slate-300 mt-2">رسم بياني يوضح تطور الدرجات</p>
             </div>
        )
    },
    {
        title: 'الخطوة ٤: صمم شهادتك واحفظها',
        content: 'أطلق العنان لإبداعك! اختر من بين مجموعة متنوعة من الإطارات، الألوان، والخطوط لتصميم شهادة فريدة. بعد ذلك، احفظها كملف PDF عالي الجودة للطباعة، أو كصورة لمشاركتها بفخر.',
         imageComponent: () => (
            <div className="bg-slate-100 dark:bg-slate-700 p-6 rounded-lg border dark:border-slate-600 text-center text-sm aspect-square flex flex-col justify-center">
                <div className="flex justify-between gap-4">
                    <div className="w-1/2 space-y-2 text-right">
                        <label className="block text-xs font-medium text-gray-700 dark:text-gray-300">تصميم الإطار</label>
                        <select className="w-full p-1 border rounded-md text-xs"><option>عتيق (Vintage)</option></select>
                        <label className="block text-xs font-medium text-gray-700 dark:text-gray-300">نوع الخط</label>
                        <select className="w-full p-1 border rounded-md text-xs"><option>أميري (Amiri)</option></select>
                    </div>
                     <div className="w-1/2 space-y-2">
                         <button className="w-full flex items-center justify-center gap-1 p-2 bg-green-600 text-white text-xs font-bold rounded-lg">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                            PDF
                        </button>
                        <button className="w-full flex items-center justify-center gap-1 p-2 bg-sky-600 text-white text-xs font-bold rounded-lg">
                             <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                            صورة
                        </button>
                    </div>
                </div>
            </div>
        )
    },
    {
        title: 'الخطوة ٥: المرشد الروحي الذكي',
        content: 'هل تحتاج إلى دفعة معنوية أو نصيحة روحية؟ المرشد الذكي هنا من أجلك. بضغطة زر، احصل على رسالة تشجيعية ملهمة أو نصيحة من أقوال الآباء، مصممة خصيصاً لك.',
         imageComponent: () => (
             <div className="bg-slate-100 dark:bg-slate-700 p-6 rounded-lg border dark:border-slate-600 text-center aspect-square flex flex-col justify-center">
                 <p className="font-bold text-lg mb-4 text-indigo-700 dark:text-indigo-300">✨ المرشد الروحي الذكي ✨</p>
                 <div className="space-y-3">
                    <button className="w-full p-2 bg-amber-500 text-white text-sm font-bold rounded-lg hover:bg-amber-600 transition">رسالة تشجيع</button>
                    <button className="w-full p-2 bg-teal-600 text-white text-sm font-bold rounded-lg hover:bg-teal-700 transition">نصيحة روحية</button>
                </div>
            </div>
        )
    },
    {
        title: 'أنت الآن جاهز للانطلاق!',
        content: 'نتمنى لك رحلة ممتعة ومثمرة في استكشاف إنجازاتك ومواصلة مسيرة النمو. خدمتك أمانة، وهذا التطبيق هنا لدعمك في كل خطوة.',
        imageComponent: () => (
            <div className="bg-indigo-50 dark:bg-slate-700 p-8 rounded-lg flex items-center justify-center aspect-square">
                 <svg xmlns="http://www.w3.org/2000/svg" className="h-24 w-24 text-indigo-500 dark:text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}><path strokeLinecap="round" strokeLinejoin="round" d="M5 3v4M3 5h4M6.343 17.657l-2.828 2.828m14.142-14.142l2.828 2.828m-12.728 0l2.828-2.828m0 0l2.828 2.828M3 12a9 9 0 1118 0 9 9 0 01-18 0z" /></svg>
            </div>
        )
    },
];

const TutorialModal: React.FC<TutorialModalProps> = ({ onClose }) => {
    const [currentStep, setCurrentStep] = useState(0);

    const handleNext = () => {
        if (currentStep < steps.length - 1) {
            setCurrentStep(currentStep + 1);
        } else {
            onClose();
        }
    };

    const handlePrev = () => {
        if (currentStep > 0) {
            setCurrentStep(currentStep - 1);
        }
    };
    
    // Disable body scroll when modal is open
    useEffect(() => {
        document.body.style.overflow = 'hidden';
        return () => {
            document.body.style.overflow = 'unset';
        };
    }, []);

    const { title, content, imageComponent: ImageComponent } = steps[currentStep];

    return createPortal(
        <div
            className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 transition-opacity duration-300"
            onClick={onClose}
            role="dialog"
            aria-modal="true"
            aria-labelledby="tutorial-modal-title"
        >
            <div
                className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-xl w-full max-w-lg m-4 flex flex-col h-auto max-h-[90vh] animate-fade-in-up"
                onClick={(e) => e.stopPropagation()}
            >
                <header className="flex-shrink-0 flex justify-between items-center pb-4 border-b border-gray-200 dark:border-slate-700">
                    <h2 id="tutorial-modal-title" className="text-xl font-bold text-slate-800 dark:text-slate-100">{title}</h2>
                    <button
                        onClick={onClose}
                        className="p-2 rounded-full text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-slate-700 transition-colors"
                        aria-label="إغلاق"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                </header>

                <main className="flex-grow overflow-y-auto py-6">
                    <div className="flex flex-col md:flex-row items-center gap-6">
                        <div className="w-full md:w-1/2 flex-shrink-0">
                           <ImageComponent />
                        </div>
                        <div className="w-full md:w-1/2">
                            <p className="text-slate-600 dark:text-slate-300 leading-relaxed">{content}</p>
                        </div>
                    </div>
                </main>
                
                <footer className="flex-shrink-0 flex justify-between items-center pt-4 border-t border-gray-200 dark:border-slate-700">
                    <div className="flex items-center gap-2">
                        {steps.map((_, index) => (
                            <button
                                key={index}
                                onClick={() => setCurrentStep(index)}
                                className={`w-2.5 h-2.5 rounded-full transition-colors ${currentStep === index ? 'bg-indigo-600' : 'bg-gray-300 dark:bg-slate-600 hover:bg-gray-400'}`}
                                aria-label={`Go to step ${index + 1}`}
                            />
                        ))}
                    </div>

                    <div className="flex items-center gap-3">
                        {currentStep > 0 && (
                            <button onClick={handlePrev} className="px-5 py-2 bg-gray-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 font-semibold rounded-lg hover:bg-gray-200 dark:hover:bg-slate-600 transition-colors">
                                السابق
                            </button>
                        )}
                        <button onClick={handleNext} className="px-5 py-2 bg-indigo-600 text-white font-bold rounded-lg hover:bg-indigo-700 transition-colors">
                            {currentStep === steps.length - 1 ? 'فهمت، لنبدأ!' : 'التالي'}
                        </button>
                    </div>
                </footer>

            </div>
        </div>,
        document.body
    );
};

export default TutorialModal;
