
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { read, utils, writeFile } from 'xlsx';
import { db } from './firebaseConfig';
import type { Servant, Evaluation } from './types';
import EvaluationFormModal from './EvaluationFormModal';
import ConfirmationModal from './ConfirmationModal';
import { useToast } from './ToastProvider';

// --- Icons ---
const SearchIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>;
const LoadingSpinner = () => <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-indigo-600"></div>;
const EditIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.5L15.232 5.232z" /></svg>;
const DeleteIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>;
const AddIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" /></svg>;
const UploadIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-4-4V7a4 4 0 014-4h5l4 4v1m-4 5h-2m2 0h2m-4 5a2 2 0 104 0 2 2 0 10-4 0zM12 6v6m0 0v6m0-6h6m-6 0H6" /></svg>;
const UploadIconLarge = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 mx-auto text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-4-4V7a4 4 0 014-4h5l4 4v1m-4 5h-2m2 0h2m-4 5a2 2 0 104 0 2 2 0 10-4 0zM12 6v6m0 0v6m0-6h6m-6 0H6" /></svg>;
const CheckCircleIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>;
const XCircleIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>;
const SuccessIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 mx-auto text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>;
const ExcelIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 24 24" fill="currentColor"><path d="M21.16,3.16a.5.5,0,0,0-.57-.16l-18,4A.5.5,0,0,0,2.5,8v8a.5.5,0,0,0,.16.37.5.5,0,0,0,.38.13l18,4a.5.5,0,0,0,.57-.6V3.5A.5.5,0,0,0,21.16,3.16ZM11,12.1,7.26,14.28,3.5,12.5,7.1,10.59Zm8.5,3.31-3.6-1.74,3.6-1.92ZM18,7.91,14.25,10,11,8.1,14.65,6Z"/></svg>;

// --- Types ---
type DisplayEvaluation = Evaluation & { servantName: string };
type ImportStep = 'idle' | 'preview' | 'importing' | 'complete';
type ValidatedEvaluation = { evaluation: Omit<Evaluation, 'id'>, errors: string[] };

const evaluationAxes: { key: keyof Evaluation['scores'], label: string }[] = [
    { key: 'spiritualLife', label: 'الحياة الروحية' },
    { key: 'commitment', label: 'الالتزام والمواظبة' },
    { key: 'preparationAndDelivery', label: 'التحضير والأداء' },
    { key: 'relationshipWithPeers', label: 'العلاقة بالخدام' },
    { key: 'relationshipWithCongregation', label: 'العلاقة بالمخدومين' },
    { key: 'personalGrowth', label: 'النمو الشخصي والتطوير' },
];

const ExcelImportEvaluationsView: React.FC = () => {
    const [evaluations, setEvaluations] = useState<DisplayEvaluation[]>([]);
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [error, setError] = useState<string>('');
    const [searchTerm, setSearchTerm] = useState<string>('');
    const [view, setView] = useState<'list' | 'import'>('list');

    // Modals state
    const [isFormModalOpen, setIsFormModalOpen] = useState<boolean>(false);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState<boolean>(false);
    const [currentEvaluation, setCurrentEvaluation] = useState<DisplayEvaluation | null>(null);
    const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
    
    // Importer State
    const [step, setStep] = useState<ImportStep>('idle');
    const [validatedData, setValidatedData] = useState<ValidatedEvaluation[]>([]);
    const [fileName, setFileName] = useState<string>('');
    const [importStatus, setImportStatus] = useState({ success: 0, failed: 0, total: 0 });
    const [importError, setImportError] = useState<string>('');
    const [isExportingAll, setIsExportingAll] = useState<boolean>(false);
    
    const { addToast } = useToast();

    const fetchEvaluations = useCallback(async () => {
        setIsLoading(true);
        setError('');
        try {
            const servantsSnapshot = await db.collection("servants").get();
            const servantsMap = new Map<string, Servant>();
            servantsSnapshot.forEach(doc => {
                servantsMap.set(doc.id, { code: doc.id, ...doc.data() } as Servant);
            });

            const evaluationsSnapshot = await db.collection("evaluations").get();
            const evaluationsList = evaluationsSnapshot.docs.map(doc => {
                const data = doc.data() as Omit<Evaluation, 'id'>;
                const servantCodeStr = String(data.servantCode);
                const servant = servantsMap.get(servantCodeStr);
                return {
                    ...data,
                    id: doc.id,
                    servantName: servant?.name || 'خادم غير معروف',
                };
            });
            setEvaluations(evaluationsList.sort((a,b) => b.year - a.year || a.servantName.localeCompare(b.servantName)));
        } catch (err: any) {
            console.error("Error fetching evaluations:", err);
            setError('حدث خطأ أثناء جلب بيانات التقييمات.');
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        if (view === 'list') {
            fetchEvaluations();
        }
    }, [fetchEvaluations, view]);

    const handleSaveEvaluation = async (evaluationData: Omit<Evaluation, 'id'>, id?: string) => {
        setIsSubmitting(true);
        try {
            if (id) {
                await db.collection('evaluations').doc(id).set(evaluationData, { merge: true });
                addToast('تم تحديث التقييم بنجاح.', 'success');
            } else {
                await db.collection('evaluations').add(evaluationData);
                addToast('تم إضافة التقييم بنجاح.', 'success');
            }
            fetchEvaluations();
            setIsFormModalOpen(false);
        } catch (error) {
            addToast('فشل حفظ بيانات التقييم.', 'error');
        } finally {
            setIsSubmitting(false);
        }
    };
    
    const handleDeleteConfirm = async () => {
        if (!currentEvaluation) return;
        setIsSubmitting(true);
        try {
            await db.collection('evaluations').doc(currentEvaluation.id).delete();
            addToast('تم حذف التقييم بنجاح.', 'success');
            fetchEvaluations();
            setIsDeleteModalOpen(false);
        } catch (error) {
            addToast('فشل حذف التقييم.', 'error');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleExportAll = () => {
        setIsExportingAll(true);
        try {
            const dataToExport = filteredEvaluations.map(ev => ({
                'كود الخادم': ev.servantCode,
                'اسم الخادم': ev.servantName,
                'الخدمة': ev.serviceName,
                'السنة': ev.year,
                'المُقيِّم': ev.evaluatorName,
                ...Object.fromEntries(evaluationAxes.map(axis => [axis.label, ev.scores[axis.key]])),
                'المتوسط العام': ev.overallAverage,
                'ملاحظات': ev.generalNotes,
            }));
            
            const worksheet = utils.json_to_sheet(dataToExport);
            const workbook = utils.book_new();
            utils.book_append_sheet(workbook, worksheet, 'All Evaluations');
            writeFile(workbook, `All_Evaluations_${new Date().toISOString().split('T')[0]}.xlsx`);
        } catch (err) {
            addToast("حدث خطأ أثناء تصدير البيانات.", "error");
        } finally {
            setIsExportingAll(false);
        }
    };

    const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0]; if (!file) return;
        setStep('preview'); setFileName(file.name); setImportError('');
        try {
            const data = await file.arrayBuffer();
            const workbook = read(data);
            const worksheet = workbook.Sheets[workbook.SheetNames[0]];
            const json = utils.sheet_to_json(worksheet, { defval: null }) as any[];
            
            const validationResults: ValidatedEvaluation[] = json.map((row) => {
                const errors: string[] = [];
                const scores: any = {};
                let totalScore = 0;
                let scoreCount = 0;

                evaluationAxes.forEach(axis => {
                    const score = row[axis.label];
                    if (score === null || isNaN(Number(score)) || Number(score) < 0 || Number(score) > 100) {
                        errors.push(`قيمة "${axis.label}" غير صالحة`);
                    } else {
                        scores[axis.key] = Number(score);
                        totalScore += Number(score);
                        scoreCount++;
                    }
                });

                if (!row['كود الخادم']) errors.push('كود الخادم مطلوب');
                if (!row['الخدمة']) errors.push('اسم الخدمة مطلوب');

                return {
                    evaluation: {
                        servantCode: String(row['كود الخادم'] || '').trim(),
                        serviceName: String(row['الخدمة'] || '').trim(),
                        year: Number(row['السنة']) || new Date().getFullYear(),
                        evaluatorName: String(row['المُقيِّم'] || '').trim(),
                        scores: scores,
                        overallAverage: scoreCount > 0 ? Math.round(totalScore / scoreCount) : 0,
                        generalNotes: String(row['ملاحظات'] || '').trim(),
                    },
                    errors,
                };
            });
            setValidatedData(validationResults);
        } catch (err) {
            setImportError('حدث خطأ أثناء قراءة الملف.');
            addToast('حدث خطأ أثناء قراءة الملف.', 'error');
            setStep('idle');
        } finally {
            event.target.value = '';
        }
    };
    
    const handleDownloadTemplate = () => {
        const data = [{
            'كود الخادم': '12345', 'الخدمة': 'خدمة ابتدائي', 'السنة': 2024, 'المُقيِّم': 'أمين الخدمة',
            ...Object.fromEntries(evaluationAxes.map(axis => [axis.label, 80])),
            'ملاحظات': 'خادم ممتاز وملتزم'
        }];
        const worksheet = utils.json_to_sheet(data);
        const workbook = utils.book_new();
        utils.book_append_sheet(workbook, worksheet, 'Evaluations');
        writeFile(workbook, 'Evaluations_Import_Template.xlsx');
    };

    const handleImport = async () => {
        setStep('importing');
        const validRecords = validatedData.filter(v => v.errors.length === 0);
        setImportStatus({ success: 0, failed: 0, total: validRecords.length });

        const existingEvalsMap = new Map<string, string>(); // key -> docId
        evaluations.forEach(ev => {
            const key = `${ev.servantCode}|${ev.serviceName}|${ev.year}`;
            existingEvalsMap.set(key, ev.id);
        });

        const recordsToAdd: Omit<Evaluation, 'id'>[] = [];
        const recordsToUpdate: { id: string, data: Omit<Evaluation, 'id'> }[] = [];

        validRecords.forEach(record => {
            const { evaluation } = record;
            const key = `${evaluation.servantCode}|${evaluation.serviceName}|${evaluation.year}`;
            const existingId = existingEvalsMap.get(key);

            if (existingId) {
                recordsToUpdate.push({ id: existingId, data: evaluation });
            } else {
                recordsToAdd.push(evaluation);
            }
        });

        let successCount = 0;
        try {
            const allOperations = [
                ...recordsToAdd.map(data => ({ type: 'add' as const, data })),
                ...recordsToUpdate.map(item => ({ type: 'update' as const, id: item.id, data: item.data }))
            ];

            for (let i = 0; i < allOperations.length; i += 500) {
                const chunk = allOperations.slice(i, i + 500);
                const batch = db.batch();

                chunk.forEach(op => {
                    if (op.type === 'add') {
                        const docRef = db.collection('evaluations').doc();
                        batch.set(docRef, op.data);
                    } else if (op.type === 'update') {
                        const docRef = db.collection('evaluations').doc(op.id);
                        batch.set(docRef, op.data, { merge: true });
                    }
                });

                await batch.commit();
                successCount += chunk.length;
                setImportStatus(prev => ({ ...prev, success: successCount }));
            }

            setStep('complete');
            let toastMessage = `اكتمل الاستيراد! `;
            if(recordsToAdd.length > 0) toastMessage += `تم إضافة ${recordsToAdd.length} تقييم جديد. `;
            if(recordsToUpdate.length > 0) toastMessage += `تم تحديث ${recordsToUpdate.length} تقييم.`;
            addToast(toastMessage.trim(), 'success');
            fetchEvaluations();
        } catch (err) {
            console.error('Error during evaluation import:', err);
            addToast('حدث خطأ أثناء استيراد التقييمات.', 'error');
            setStep('preview');
        }
    };
    
    const filteredEvaluations = useMemo(() => {
        if (!searchTerm.trim()) return evaluations;
        const lowercasedFilter = searchTerm.toLowerCase().trim();
        return evaluations.filter(ev =>
            ev.servantName.toLowerCase().includes(lowercasedFilter) ||
            ev.servantCode.toLowerCase().includes(lowercasedFilter) ||
            ev.serviceName.toLowerCase().includes(lowercasedFilter)
        );
    }, [evaluations, searchTerm]);

    const handleResetImporter = () => setView('list');

    if (isLoading && view === 'list') {
        return <div className="flex justify-center items-center py-20"><LoadingSpinner /></div>;
    }

    const renderListView = () => (
        <>
           <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
                <div>
                    <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100">إدارة التقييمات ({evaluations.length})</h2>
                    <p className="text-slate-500 dark:text-slate-400 mt-1">عرض وإدارة جميع تقييمات الخدام.</p>
                </div>
                <div className="flex items-center gap-3">
                    <button onClick={() => setView('import')} className="flex items-center justify-center px-4 py-2 bg-green-600 text-white font-semibold rounded-lg hover:bg-green-700"><UploadIcon /> استيراد</button>
                    <button onClick={() => { setCurrentEvaluation(null); setIsFormModalOpen(true); }} className="flex items-center px-4 py-2 bg-indigo-600 text-white font-bold rounded-lg hover:bg-indigo-700"><AddIcon /> إضافة تقييم</button>
                </div>
            </header>
            <div className="mb-4 flex flex-col sm:flex-row gap-4 justify-between">
                 <div className="relative">
                    <input type="text" placeholder="ابحث باسم الخادم, الكود, الخدمة..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full sm:max-w-md px-4 py-2 pr-10 text-gray-700 bg-white dark:bg-slate-800 border border-gray-300 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:text-gray-200" />
                    <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none"><SearchIcon /></div>
                </div>
                 <button onClick={handleExportAll} disabled={isExportingAll} className="flex items-center justify-center px-4 py-2 bg-green-100 text-green-800 font-semibold rounded-lg hover:bg-green-200 dark:bg-green-900/30 dark:text-green-300 disabled:opacity-50">
                    <ExcelIcon /> {isExportingAll ? 'جاري...' : 'تصدير الكل'}
                </button>
            </div>
            <div className="space-y-4">
                {filteredEvaluations.map(ev => (
                    <div key={ev.id} className="bg-white dark:bg-slate-800 p-4 rounded-lg shadow-sm border border-gray-200/80 dark:border-slate-700 flex flex-col sm:flex-row justify-between items-start gap-4">
                       <div className="flex-grow">
                            <div className="flex items-center justify-between">
                                <p className="font-bold text-indigo-700 dark:text-indigo-300">{ev.servantName} <span className="font-mono text-xs text-gray-400">({ev.servantCode})</span></p>
                                <span className="text-sm font-semibold bg-indigo-100 text-indigo-800 px-2 py-0.5 rounded-full dark:bg-slate-700 dark:text-indigo-300">{ev.year}</span>
                            </div>
                            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">الخدمة: <span className="font-medium text-gray-700 dark:text-gray-300">{ev.serviceName}</span></p>
                             <div className="flex items-center gap-2 mt-2">
                                <p className="text-sm font-semibold text-gray-800 dark:text-gray-200">المتوسط: {ev.overallAverage}%</p>
                             </div>
                        </div>
                         <div className="flex items-center gap-2 self-end sm:self-center">
                            <button onClick={() => { setCurrentEvaluation(ev); setIsFormModalOpen(true); }} className="text-indigo-600 hover:text-indigo-900 p-2"><EditIcon /></button>
                            <button onClick={() => { setCurrentEvaluation(ev); setIsDeleteModalOpen(true); }} className="text-red-600 hover:text-red-900 p-2"><DeleteIcon /></button>
                        </div>
                    </div>
                ))}
            </div>
        </>
    );

    const renderImporter = () => (
         <div className="bg-white dark:bg-slate-800 p-6 md:p-8 rounded-lg shadow-sm border border-gray-200/80 dark:border-slate-700">
             <header className="flex justify-between items-center mb-8">
                <div>
                    <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100">استيراد التقييمات</h2>
                    <p className="text-slate-500 dark:text-slate-400">أضف التقييمات بشكل جماعي.</p>
                </div>
                <button onClick={handleResetImporter} className="px-5 py-2 bg-gray-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 font-semibold rounded-lg hover:bg-gray-200 dark:hover:bg-slate-600">
                    العودة للقائمة
                </button>
            </header>
            {importError && <div className="mb-4 text-center text-red-600 bg-red-100 dark:bg-red-900/20 dark:text-red-400 p-3 rounded-lg">{importError}</div>}
            {step === 'idle' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
                    <div>
                        <h3 className="font-semibold text-lg">الخطوات</h3>
                        <ol className="list-decimal list-inside space-y-3 mt-3">
                            <li><strong className="font-semibold">تنزيل القالب:</strong> لضمان تطابق الأعمدة.</li>
                            <li><strong className="font-semibold">ملء البيانات:</strong> املأ القالب ببيانات التقييمات.</li>
                            <li><strong className="font-semibold">رفع الملف:</strong> لبدء عملية الاستيراد.</li>
                        </ol>
                        <button onClick={handleDownloadTemplate} className="mt-6 px-4 py-2 bg-green-600 text-white font-semibold rounded-lg">تنزيل القالب</button>
                    </div>
                    <div className="border-2 border-dashed rounded-lg p-8 text-center">
                        <label htmlFor="evaluations-file-upload" className="cursor-pointer block w-full h-full">
                            <UploadIconLarge />
                            <p className="mt-2 text-indigo-600 font-semibold">اختر ملفاً</p>
                            <input id="evaluations-file-upload" type="file" className="hidden" onChange={handleFileChange} accept=".xlsx, .xls, .csv" />
                        </label>
                    </div>
                </div>
            )}
             {step === 'preview' && (
                 <div>
                    <h3 className="font-semibold text-lg">معاينة البيانات من: <span className="font-normal text-indigo-600">{fileName}</span></h3>
                    <div className="mt-6 flex justify-end gap-4">
                        <button onClick={handleResetImporter} className="px-5 py-2 bg-gray-100 rounded-lg">إلغاء</button>
                        <button onClick={handleImport} disabled={validatedData.filter(v => v.errors.length === 0).length === 0} className="px-5 py-2 bg-indigo-600 text-white font-bold rounded-lg">
                            بدء الاستيراد
                        </button>
                    </div>
                </div>
            )}
            {step === 'complete' && (
                 <div className="text-center py-12">
                     <SuccessIcon />
                     <h3 className="text-2xl font-bold mt-4">اكتمل الاستيراد!</h3>
                     <button onClick={handleResetImporter} className="mt-6 px-6 py-2 bg-indigo-600 text-white rounded-lg">استيراد ملف آخر</button>
                </div>
            )}
        </div>
    );

    return (
        <div className="animate-fade-in-up">
            {view === 'list' ? renderListView() : renderImporter()}
            {isFormModalOpen && (
                <EvaluationFormModal
                    evaluation={currentEvaluation}
                    onClose={() => setIsFormModalOpen(false)}
                    onSave={(data, id) => handleSaveEvaluation(data, id)}
                    isSubmitting={isSubmitting}
                />
            )}
            {isDeleteModalOpen && currentEvaluation && (
                 <ConfirmationModal
                    title="تأكيد الحذف"
                    message={`هل أنت متأكد من حذف تقييم ${currentEvaluation.serviceName}؟`}
                    onConfirm={handleDeleteConfirm}
                    onCancel={() => setIsDeleteModalOpen(false)}
                    isConfirming={isSubmitting}
                    confirmButtonClass="bg-red-600"
                />
            )}
        </div>
    );
};

export default ExcelImportEvaluationsView;
