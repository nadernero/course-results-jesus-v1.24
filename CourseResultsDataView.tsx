
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { read, utils, writeFile } from 'xlsx';
import { db } from './firebaseConfig';
import type { Servant, CourseResult } from './types';
import CourseResultFormModal from './CourseResultFormModal';
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
type CourseResultWithId = CourseResult & { id: string };
type DisplayResult = CourseResultWithId & { servantName: string };
type ImportStep = 'idle' | 'preview' | 'importing' | 'complete';
type ValidatedResult = { result: CourseResult, errors: string[] };

const PAGE_SIZE = 50;

const CourseResultsDataView: React.FC = () => {
    const [results, setResults] = useState<DisplayResult[]>([]);
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [error, setError] = useState<string>('');
    const [searchTerm, setSearchTerm] = useState<string>('');
    const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
    const [view, setView] = useState<'list' | 'import'>('list');

    // Modals state
    const [isFormModalOpen, setIsFormModalOpen] = useState<boolean>(false);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState<boolean>(false);
    const [currentResult, setCurrentResult] = useState<DisplayResult | null>(null);
    const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

    // Bulk actions state
    const [selectedResults, setSelectedResults] = useState<Set<string>>(new Set());
    const [isBulkDeleteModalOpen, setIsBulkDeleteModalOpen] = useState<boolean>(false);
    const [isExportingAll, setIsExportingAll] = useState<boolean>(false);

    // Importer State
    const [step, setStep] = useState<ImportStep>('idle');
    const [validatedData, setValidatedData] = useState<ValidatedResult[]>([]);
    const [fileName, setFileName] = useState<string>('');
    const [importStatus, setImportStatus] = useState({ success: 0, failed: 0, total: 0 });
    const [importError, setImportError] = useState<string>('');
    
    const { addToast } = useToast();

    const fetchResults = useCallback(async () => {
        setIsLoading(true);
        setError('');
        try {
            const servantsSnapshot = await db.collection("servants").get();
            const servantsMap = new Map<string, Servant>();
            servantsSnapshot.forEach(doc => {
                servantsMap.set(doc.id, { code: doc.id, ...doc.data() } as Servant);
            });

            const resultsSnapshot = await db.collection("courseResults").get();
            const resultsList = resultsSnapshot.docs.map(doc => {
                const data = doc.data() as CourseResult;
                const servantCodeStr = String(data.servantCode);
                const servant = servantsMap.get(servantCodeStr);
                return {
                    ...data,
                    servantCode: servantCodeStr, // Ensure servantCode is a string
                    id: doc.id,
                    servantName: servant?.name || 'خادم غير معروف',
                };
            });
            // Sort by Date Descending
            setResults(resultsList.sort((a,b) => {
                if (a.date && b.date) {
                    return new Date(b.date).getTime() - new Date(a.date).getTime();
                }
                return b.year - a.year || a.servantName.localeCompare(b.servantName);
            }));
        } catch (err: any) {
            console.error("Error fetching course results:", err);
            setError('حدث خطأ أثناء جلب بيانات الكورسات.');
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        if (view === 'list') {
            fetchResults();
        }
    }, [fetchResults, view]);

    // --- CRUD handlers ---
    const handleAdd = () => {
        setCurrentResult(null);
        setIsFormModalOpen(true);
    };

    const handleEdit = (result: DisplayResult) => {
        setCurrentResult(result);
        setIsFormModalOpen(true);
    };

    const handleDelete = (result: DisplayResult) => {
        setCurrentResult(result);
        setIsDeleteModalOpen(true);
    };

    const handleSaveResult = async (resultData: CourseResult, id?: string) => {
        setIsSubmitting(true);
        setError('');
        try {
            if (!id) { // This is a new entry, check for duplicates
                const q = db.collection('courseResults')
                    .where('servantCode', 'in', [resultData.servantCode, Number(resultData.servantCode)])
                    .where('courseName', '==', resultData.courseName)
                    .where('year', '==', resultData.year);
                
                const existingSnapshot = await q.get();
                if (!existingSnapshot.empty) {
                    addToast('خطأ: هذا الخادم مسجل بالفعل في هذا الكورس لنفس السنة.', 'error');
                    setIsSubmitting(false);
                    return; // Stop execution
                }
            }

            if (id) {
                await db.collection('courseResults').doc(id).set(resultData, { merge: true });
                addToast('تم تحديث النتيجة بنجاح.', 'success');
            } else {
                await db.collection('courseResults').add(resultData);
                addToast('تم إضافة النتيجة بنجاح.', 'success');
            }
            await fetchResults();
            setIsFormModalOpen(false);
            setCurrentResult(null);
        } catch (error) {
            console.error("Error saving result:", error);
            setError('فشل حفظ بيانات النتيجة.');
            addToast('فشل حفظ بيانات النتيجة.', 'error');
        } finally {
            setIsSubmitting(false);
        }
    };
    
    const handleDeleteConfirm = async () => {
        if (!currentResult) return;
        setIsSubmitting(true);
        setError('');
        try {
            await db.collection('courseResults').doc(currentResult.id).delete();
            addToast(`تم حذف النتيجة بنجاح.`, 'success');
            await fetchResults();
            setIsDeleteModalOpen(false);
            setCurrentResult(null);
        } catch (error) {
            console.error("Error deleting result:", error);
            setError('فشل حذف النتيجة.');
            addToast('فشل حذف النتيجة.', 'error');
        } finally {
            setIsSubmitting(false);
        }
    };

    // --- Filter and Pagination ---
    const filteredResults = useMemo(() => {
        if (!searchTerm.trim()) return results;
        const lowercasedFilter = searchTerm.toLowerCase().trim();
        return results.filter(result =>
            result.servantName.toLowerCase().includes(lowercasedFilter) ||
            String(result.servantCode).toLowerCase().includes(lowercasedFilter) ||
            result.courseName.toLowerCase().includes(lowercasedFilter)
        );
    }, [results, searchTerm]);

    const displayedResults = useMemo(() => {
        return filteredResults.slice(0, visibleCount);
    }, [filteredResults, visibleCount]);
    
    useEffect(() => {
        setVisibleCount(PAGE_SIZE);
        setSelectedResults(new Set());
    }, [searchTerm]);

    const handleLoadMore = () => {
        setVisibleCount(prev => prev + PAGE_SIZE);
    };

    // --- Bulk Action Handlers ---
    const handleSelectResult = (id: string) => {
        setSelectedResults(prev => {
            const newSet = new Set(prev);
            if (newSet.has(id)) newSet.delete(id);
            else newSet.add(id);
            return newSet;
        });
    };

    const handleSelectAllOnPage = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.checked) {
            const allIdsOnPage = new Set(displayedResults.map(r => r.id));
            setSelectedResults(allIdsOnPage);
        } else {
            setSelectedResults(new Set());
        }
    };
    
    const handleBulkDelete = () => setIsBulkDeleteModalOpen(true);

    const handleBulkDeleteConfirm = async () => {
        setIsSubmitting(true);
        try {
            const count = selectedResults.size;
            const batch = db.batch();
            selectedResults.forEach(id => batch.delete(db.collection('courseResults').doc(id)));
            await batch.commit();
            addToast(`تم حذف ${count} نتائج بنجاح.`, 'success');
            await fetchResults();
        } catch (err) {
            console.error("Error bulk deleting results:", err);
            setError("حدث خطأ أثناء حذف النتائج المحددة.");
            addToast("فشل حذف النتائج المحددة.", "error");
        } finally {
            setIsSubmitting(false);
            setIsBulkDeleteModalOpen(false);
        }
    };

    const handleBulkExport = () => {
        const dataToExport = results.filter(r => selectedResults.has(r.id));
        const worksheet = utils.json_to_sheet(dataToExport.map(({ servantCode, servantName, courseName, year, date, score, attendance }) => ({
            servantCode, servantName, courseName, year, date, score, attendance
        })));
        const workbook = utils.book_new();
        utils.book_append_sheet(workbook, worksheet, 'Selected Results');
        writeFile(workbook, `Selected_Results_${new Date().toISOString().split('T')[0]}.xlsx`);
    };

    const handleExportAll = () => {
        setIsExportingAll(true);
        try {
            const dataToExport = filteredResults.map(({ servantCode, servantName, courseName, year, date, score, attendance }) => ({
                'كود الخادم': servantCode,
                'اسم الخادم': servantName,
                'اسم الكورس': courseName,
                'السنة': year,
                'التاريخ': date || year,
                'الدرجة': score,
                'الحضار': typeof attendance === 'number' ? `${Math.round(attendance <= 1 ? attendance * 100 : attendance)}%` : '-'
            }));
            
            const worksheet = utils.json_to_sheet(dataToExport);
            const workbook = utils.book_new();
            utils.book_append_sheet(workbook, worksheet, 'All Results');
            writeFile(workbook, `All_Course_Results_${new Date().toISOString().split('T')[0]}.xlsx`);
        } catch (err) {
            console.error("Error exporting all results:", err);
            addToast("حدث خطأ أثناء تصدير البيانات.", "error");
        } finally {
            setIsExportingAll(false);
        }
    };

    const isAllOnPageSelected = displayedResults.length > 0 && displayedResults.every(r => selectedResults.has(r.id));


    // --- Importer Logic ---
    const validRecords = validatedData.filter(item => item.errors.length === 0);
    const invalidRecords = validatedData.filter(item => item.errors.length > 0);

    const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        setStep('preview');
        setFileName(file.name);
        setImportError('');
        setValidatedData([]);

        try {
            const data = await file.arrayBuffer();
            const workbook = read(data);
            const sheetName = workbook.SheetNames[0];
            const worksheet = workbook.Sheets[sheetName];
            const json = utils.sheet_to_json(worksheet, { defval: null }) as any[];
            
            const initialValidationResults: ValidatedResult[] = json.map((row) => {
                const errors: string[] = [];
                if (!row.servantCode || String(row.servantCode).trim() === '') errors.push('كود الخادم مطلوب');
                if (!row.courseName || String(row.courseName).trim() === '') errors.push('اسم الكورس مطلوب');
                if (row.score !== 'غائب' && (row.score === null || isNaN(Number(row.score)))) errors.push('الدرجة يجب أن تكون رقمًا أو "غائب"');
                if (row.attendance === null || isNaN(Number(row.attendance))) errors.push('نسبة الحضور مطلوبة ويجب أن تكون رقمًا');

                const scoreValue = String(row.score).trim().toLowerCase() === 'غائب' ? 'غائب' : Number(row.score);
                const year = Number(row.year) || new Date().getFullYear();
                
                return {
                    result: {
                        servantCode: String(row.servantCode).trim(),
                        courseName: String(row.courseName).trim(),
                        year: year,
                        date: row.date || `${year}-01-01`, // Default date if missing
                        score: scoreValue as number | 'غائب',
                        attendance: Number(row.attendance),
                    },
                    errors,
                };
            });

            // De-duplicate the data from the file before setting state
            const deDupedMap = new Map<string, ValidatedResult>();
            for (const record of initialValidationResults) {
                // Always keep records with errors to show them to the user
                if (record.errors.length > 0) {
                    deDupedMap.set(Math.random().toString(), record); // Use a random key for error records
                    continue;
                }

                const { servantCode, courseName, year, score } = record.result;
                const key = `${servantCode}|${courseName}|${year}`;
                const existingRecord = deDupedMap.get(key);

                if (!existingRecord) {
                    deDupedMap.set(key, record);
                } else {
                    const existingScore = existingRecord.result.score === 'غائب' ? -1 : existingRecord.result.score as number;
                    const newScore = score === 'غائب' ? -1 : score as number;
                    if (newScore > existingScore) {
                        deDupedMap.set(key, record);
                    }
                }
            }

            const finalValidatedData = Array.from(deDupedMap.values());
            setValidatedData(finalValidatedData);
        } catch (err) {
            console.error(err);
            setImportError('حدث خطأ أثناء قراءة الملف. تأكد من أنه ملف Excel صالح.');
            addToast('حدث خطأ أثناء قراءة الملف.', 'error');
            setStep('idle');
        } finally {
            event.target.value = '';
        }
    };
    
    const handleDownloadTemplate = () => {
        const data = [{ servantCode: '12345', courseName: 'كورس مجتمع يسوع', year: 2024, date: '2024-10-15', score: 95, attendance: 100 }];
        const worksheet = utils.json_to_sheet(data);
        const workbook = utils.book_new();
        utils.book_append_sheet(workbook, worksheet, 'Results');
        writeFile(workbook, 'Course_Results_Template.xlsx');
    };

    const handleImport = async () => {
        setStep('importing');

        // Create a map of existing results for fast lookup.
        const existingResultsMap = new Map<string, { id: string; score: number | 'غائب' }>();
        results.forEach(res => {
            const key = `${res.servantCode}|${res.courseName}|${res.year}`;
            const existing = existingResultsMap.get(key);
            if (existing) {
                const existingScore = existing.score === 'غائب' ? -1 : Number(existing.score);
                const newScore = res.score === 'غائب' ? -1 : Number(res.score);
                if (newScore > existingScore) {
                    existingResultsMap.set(key, { id: res.id, score: res.score });
                }
            } else {
                existingResultsMap.set(key, { id: res.id, score: res.score });
            }
        });

        const recordsToAdd: CourseResult[] = [];
        const recordsToUpdate: { id: string, data: CourseResult }[] = [];
        const skippedRecords: CourseResult[] = [];

        // Process valid records from the Excel file.
        validRecords.forEach(record => {
            const { result } = record;
            const key = `${result.servantCode}|${result.courseName}|${result.year}`;
            const existingResult = existingResultsMap.get(key);

            if (existingResult) {
                const existingScore = existingResult.score === 'غائب' ? -1 : Number(existingResult.score);
                const newScore = result.score === 'غائب' ? -1 : Number(result.score);
                if (newScore > existingScore) {
                    recordsToUpdate.push({ id: existingResult.id, data: result });
                } else {
                    skippedRecords.push(result);
                }
            } else {
                recordsToAdd.push(result);
            }
        });

        let successCount = 0;
        const totalToProcess = recordsToAdd.length + recordsToUpdate.length;
        setImportStatus({ success: 0, failed: 0, total: totalToProcess });

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
                        const docRef = db.collection('courseResults').doc();
                        batch.set(docRef, op.data);
                    } else if (op.type === 'update') {
                        const docRef = db.collection('courseResults').doc(op.id);
                        batch.set(docRef, op.data, { merge: true });
                    }
                });

                await batch.commit();
                successCount += chunk.length;
                setImportStatus(prev => ({ ...prev, success: successCount }));
            }

            setStep('complete');
            let toastMessage = `اكتمل الاستيراد! `;
            if (recordsToAdd.length > 0) toastMessage += `تم إضافة ${recordsToAdd.length} نتيجة جديدة. `;
            if (recordsToUpdate.length > 0) toastMessage += `تم تحديث ${recordsToUpdate.length} نتيجة. `;
            if (skippedRecords.length > 0) toastMessage += `تم تخطي ${skippedRecords.length} نتيجة (الدرجة الحالية أعلى).`;
            
            addToast(toastMessage.trim(), 'success');
            fetchResults();

        } catch (err) {
            console.error("Error during import:", err);
            setError("حدث خطأ فادح أثناء عملية الاستيراد.");
            addToast('حدث خطأ أثناء الاستيراد.', 'error');
            setStep('preview');
        }
    };

    const handleResetImporter = () => {
        setStep('idle');
        setValidatedData([]);
        setFileName('');
        setImportError('');
        setImportStatus({ success: 0, failed: 0, total: 0 });
        setView('list');
    };

    // --- Render Functions ---

    const renderImporter = () => (
        <div className="bg-white dark:bg-slate-800 p-6 md:p-8 rounded-lg shadow-sm border border-gray-200/80 dark:border-slate-700">
            <header className="flex justify-between items-center mb-8">
                 <div>
                    <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100">استيراد نتائج الكورسات</h2>
                    <p className="text-slate-500 dark:text-slate-400">أضف النتائج بشكل جماعي عن طريق رفع ملف Excel.</p>
                </div>
                 <button onClick={handleResetImporter} className="px-5 py-2 bg-gray-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 font-semibold rounded-lg hover:bg-gray-200 dark:hover:bg-slate-600">
                    العودة للقائمة
                </button>
            </header>

            {importError && <div className="mb-4 text-center text-red-600 bg-red-100 dark:bg-red-900/20 dark:text-red-400 p-3 rounded-lg">{importError}</div>}

            {step === 'idle' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
                    <div>
                        <h3 className="font-semibold text-lg text-slate-700 dark:text-slate-200 mb-3">الخطوات</h3>
                        <ol className="list-decimal list-inside space-y-3 text-slate-600 dark:text-slate-300">
                            <li><strong className="font-semibold">تنزيل القالب:</strong> قم بتحميل ملف Excel لضمان تطابق الأعمدة.</li>
                            <li><strong className="font-semibold">ملء البيانات:</strong> املأ القالب ببيانات النتائج.</li>
                            <li><strong className="font-semibold">رفع الملف:</strong> اختر الملف المعبأ لبدء عملية الاستيراد.</li>
                        </ol>
                        <button onClick={handleDownloadTemplate} className="mt-6 px-4 py-2 bg-green-600 text-white font-semibold rounded-lg hover:bg-green-700 transition">
                            تنزيل القالب
                        </button>
                    </div>
                    <div className="border-2 border-dashed border-gray-300 dark:border-slate-600 rounded-lg p-8 text-center">
                        <label htmlFor="course-results-upload" className="cursor-pointer block w-full h-full">
                            <UploadIconLarge />
                            <p className="mt-2 text-indigo-600 dark:text-indigo-400 font-semibold">اختر ملفاً</p>
                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">XLSX, XLS, CSV</p>
                            <input id="course-results-upload" type="file" className="hidden" onChange={handleFileChange} accept=".xlsx, .xls, .csv" />
                        </label>
                    </div>
                </div>
            )}
            
            {step === 'preview' && (
                <div>
                    <h3 className="font-semibold text-lg text-slate-700 dark:text-slate-200 mb-4">معاينة البيانات من: <span className="font-normal text-indigo-600">{fileName}</span></h3>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                        <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-700 p-4 rounded-lg text-center">
                            <p className="text-2xl font-bold text-green-700 dark:text-green-300">{validRecords.length}</p>
                            <p className="text-sm font-medium text-green-600 dark:text-green-400">نتيجة صالحة للاستيراد</p>
                        </div>
                         <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 p-4 rounded-lg text-center">
                            <p className="text-2xl font-bold text-red-700 dark:text-red-300">{invalidRecords.length}</p>
                            <p className="text-sm font-medium text-red-600 dark:text-red-400">نتيجة تحتوي على أخطاء</p>
                        </div>
                    </div>
                    
                    <div className="max-h-80 overflow-y-auto border dark:border-slate-600 rounded-lg">
                        <table className="min-w-full divide-y divide-gray-200 dark:divide-slate-600 text-sm">
                            <thead className="bg-gray-50 dark:bg-slate-700 sticky top-0"><tr className="text-right">
                                <th className="px-4 py-2 font-medium text-gray-500 dark:text-gray-300">الحالة</th>
                                <th className="px-4 py-2 font-medium text-gray-500 dark:text-gray-300">كود الخادم</th>
                                <th className="px-4 py-2 font-medium text-gray-500 dark:text-gray-300">اسم الكورس</th>
                                <th className="px-4 py-2 font-medium text-gray-500 dark:text-gray-300">الدرجة</th>
                                <th className="px-4 py-2 font-medium text-gray-500 dark:text-gray-300">الأخطاء</th>
                            </tr></thead>
                            <tbody className="bg-white dark:bg-slate-800 divide-y divide-gray-200 dark:divide-slate-600">
                                {validatedData.slice(0, 10).map(({result, errors}, i) => (
                                    <tr key={i} className={errors.length > 0 ? 'bg-red-50 dark:bg-red-900/20' : 'bg-green-50 dark:bg-green-900/20'}>
                                        <td className="px-4 py-2">{errors.length > 0 ? <XCircleIcon /> : <CheckCircleIcon />}</td>
                                        <td className="px-4 py-2 font-mono text-slate-800 dark:text-slate-200">{result.servantCode}</td>
                                        <td className="px-4 py-2 text-slate-800 dark:text-slate-200">{result.courseName}</td>
                                        <td className="px-4 py-2 text-slate-800 dark:text-slate-200">{result.score}</td>
                                        <td className="px-4 py-2 text-red-600 dark:text-red-400">{errors.join(', ')}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                    {validatedData.length > 10 && <p className="text-center text-sm text-gray-500 dark:text-gray-400 mt-2">... و {validatedData.length - 10} نتائج أخرى.</p>}

                    <div className="mt-6 flex justify-end gap-4">
                        <button onClick={handleResetImporter} className="px-5 py-2 bg-gray-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 font-semibold rounded-lg hover:bg-gray-200 dark:hover:bg-slate-600">إلغاء</button>
                        <button onClick={handleImport} disabled={validRecords.length === 0} className="px-5 py-2 bg-indigo-600 text-white font-bold rounded-lg hover:bg-indigo-700 disabled:bg-indigo-300">
                            بدء الاستيراد ({validRecords.length})
                        </button>
                    </div>
                </div>
            )}
            
            {step === 'importing' && (
                <div className="text-center py-12">
                     <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-600 mx-auto"></div>
                     <h3 className="text-xl font-semibold text-slate-700 dark:text-slate-200 mt-6">جاري الاستيراد...</h3>
                     <p className="text-slate-500 dark:text-slate-400 mt-2">
                        تم استيراد {importStatus.success} من {importStatus.total} نتيجة.
                     </p>
                </div>
            )}

            {step === 'complete' && (
                <div className="text-center py-12">
                     <SuccessIcon />
                     <h3 className="text-2xl font-bold text-green-700 dark:text-green-400 mt-4">اكتمل الاستيراد بنجاح!</h3>
                     <p className="text-slate-600 dark:text-slate-300 mt-2">
                        تمت معالجة {importStatus.success} نتيجة.
                     </p>
                     <button onClick={handleResetImporter} className="mt-6 px-6 py-2 bg-indigo-600 text-white font-semibold rounded-lg hover:bg-indigo-700">
                        استيراد ملف آخر
                     </button>
                </div>
            )}
        </div>
    );

    const renderListView = () => (
        <>
            <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
                <div>
                    <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100">إدارة نتائج الكورسات ({results.length})</h2>
                    <p className="text-slate-500 dark:text-slate-400 mt-1">عرض وإدارة جميع نتائج الكورسات المسجلة للخدام.</p>
                </div>
                 <div className="flex items-center gap-3">
                    <button onClick={() => setView('import')} className="flex items-center justify-center px-4 py-2 bg-green-600 text-white font-semibold rounded-lg hover:bg-green-700 transition-transform transform hover:scale-105">
                        <UploadIcon /> استيراد النتائج من Excel
                    </button>
                    <button onClick={handleAdd} className="flex items-center px-4 py-2 bg-indigo-600 text-white font-bold rounded-lg hover:bg-indigo-700 transition-transform transform hover:scale-105">
                        <AddIcon /> إضافة نتيجة يدوياً
                    </button>
                </div>
            </header>

            {error && <p className="mb-4 text-center text-red-600 bg-red-100 p-3 rounded-lg">{error}</p>}
            
            <div className="mb-4 flex flex-col sm:flex-row gap-4 justify-between">
                <div className="relative">
                    <input
                        type="text"
                        placeholder="ابحث باسم الخادم أو الكود أو اسم الكورس..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full sm:max-w-md px-4 py-2 pr-10 text-gray-700 bg-white dark:bg-slate-800 border border-gray-300 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:text-gray-200"
                    />
                    <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none"><SearchIcon /></div>
                </div>
                 <button onClick={handleExportAll} disabled={isExportingAll} className="flex items-center justify-center px-4 py-2 bg-green-100 text-green-800 font-semibold rounded-lg hover:bg-green-200 transition-colors dark:bg-green-900/30 dark:text-green-300 dark:hover:bg-green-900/50 disabled:opacity-50 disabled:cursor-wait">
                    <ExcelIcon /> {isExportingAll ? 'جاري التصدير...' : 'تصدير الكل (Excel)'}
                </button>
            </div>

            {/* Desktop Table View */}
            <div className="hidden md:block overflow-x-auto border border-gray-200 dark:border-slate-700 rounded-lg shadow-sm">
                 {selectedResults.size > 0 && (
                     <div className="p-4 bg-indigo-50 dark:bg-slate-800 border-b border-gray-200 dark:border-slate-700 flex justify-between items-center">
                        <p className="font-semibold text-sm text-indigo-800 dark:text-indigo-200">{selectedResults.size} نتائج محددة</p>
                        <div className="flex gap-2">
                            <button onClick={handleBulkExport} className="px-3 py-1.5 text-sm bg-green-600 text-white font-semibold rounded-md hover:bg-green-700 transition-colors">تصدير المحدد</button>
                            <button onClick={handleBulkDelete} className="px-3 py-1.5 text-sm bg-red-600 text-white font-semibold rounded-md hover:bg-red-700 transition-colors">حذف المحدد</button>
                        </div>
                    </div>
                )}
                <table className="min-w-full divide-y divide-gray-200 dark:divide-slate-700">
                    <thead className="bg-slate-100 dark:bg-slate-800">
                        <tr>
                            <th scope="col" className="p-4">
                               <input type="checkbox" className="h-4 w-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500" checked={isAllOnPageSelected} onChange={handleSelectAllOnPage} />
                            </th>
                            <th className="px-6 py-3 text-right text-sm font-medium text-gray-500 dark:text-gray-400 uppercase">اسم الخادم</th>
                            <th className="px-6 py-3 text-right text-sm font-medium text-gray-500 dark:text-gray-400 uppercase">الكورس</th>
                            <th className="px-6 py-3 text-right text-sm font-medium text-gray-500 dark:text-gray-400 uppercase">التاريخ</th>
                            <th className="px-6 py-3 text-right text-sm font-medium text-gray-500 dark:text-gray-400 uppercase">الدرجة</th>
                            <th className="px-6 py-3 text-right text-sm font-medium text-gray-500 dark:text-gray-400 uppercase">الحضور</th>
                            <th className="px-6 py-3 text-center text-sm font-medium text-gray-500 dark:text-gray-400 uppercase">إجراءات</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white dark:bg-slate-900 divide-y divide-gray-200 dark:divide-slate-700">
                        {displayedResults.map(result => {
                            const isSelected = selectedResults.has(result.id);
                            const normalizedAttendance = typeof result.attendance === 'number' ? (result.attendance <= 1 ? result.attendance * 100 : result.attendance) : 0;
                            const displayDate = result.date || result.year;
                            return (
                                <tr key={result.id} className={`transition-colors ${isSelected ? 'bg-indigo-50 dark:bg-indigo-900/20' : 'hover:bg-gray-50 dark:hover:bg-slate-800/60'}`}>
                                    <td className="p-4">
                                        <input type="checkbox" className="h-4 w-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500" checked={isSelected} onChange={() => handleSelectResult(result.id)} />
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-gray-100">{result.servantName} <span className="font-mono text-gray-400 dark:text-gray-500">({result.servantCode})</span></td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">{result.courseName}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">{displayDate}</td>
                                    <td className={`px-6 py-4 whitespace-nowrap text-sm font-semibold ${result.score === 'غائب' ? 'text-red-500' : 'text-gray-800 dark:text-gray-200'}`}>{result.score}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">{Math.round(normalizedAttendance)}%</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-center text-sm font-medium">
                                        <div className="flex justify-center items-center gap-4">
                                            <button onClick={() => handleEdit(result)} className="text-indigo-600 hover:text-indigo-900 dark:text-indigo-400 dark:hover:text-indigo-300" title="تعديل"><EditIcon /></button>
                                            <button onClick={() => handleDelete(result)} className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300" title="حذف"><DeleteIcon /></button>
                                        </div>
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
                {filteredResults.length === 0 && (
                     <div className="text-center text-gray-500 py-10">{isLoading ? <LoadingSpinner /> : 'لا توجد نتائج تطابق بحثك.'}</div>
                 )}
            </div>
            
            {/* Mobile Card View */}
             <div className="md:hidden space-y-4">
                {displayedResults.length > 0 && (
                    <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mb-4">
                        <label className="flex items-center gap-2 text-sm w-full">
                            <input type="checkbox" className="h-4 w-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500" onChange={handleSelectAllOnPage} checked={isAllOnPageSelected} />
                            <span className="text-slate-700 dark:text-slate-200">تحديد الكل</span>
                        </label>
                        {selectedResults.size > 0 && (
                            <div className="flex gap-2 w-full justify-end">
                                <button onClick={handleBulkExport} className="px-3 py-1.5 text-xs bg-green-600 text-white font-semibold rounded-md hover:bg-green-700">تصدير</button>
                                <button onClick={handleBulkDelete} className="px-3 py-1.5 text-xs bg-red-600 text-white font-semibold rounded-md hover:bg-red-700">حذف</button>
                            </div>
                        )}
                    </div>
                )}
                {displayedResults.map(result => {
                    const isSelected = selectedResults.has(result.id);
                    const normalizedAttendance = typeof result.attendance === 'number' ? (result.attendance <= 1 ? result.attendance * 100 : result.attendance) : 0;
                    const displayDate = result.date || result.year;
                    return (
                        <div key={result.id} className={`p-4 border dark:border-slate-700 rounded-lg transition-colors ${isSelected ? 'bg-indigo-50 dark:bg-indigo-900/20 border-indigo-200 dark:border-indigo-700' : 'bg-white dark:bg-slate-800 border-gray-200'}`}>
                             <div className="flex items-start justify-between gap-4">
                                <div className="flex items-start gap-3 flex-grow">
                                    <input type="checkbox" className="h-4 w-4 mt-1 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500" checked={isSelected} onChange={() => handleSelectResult(result.id)} />
                                    <div className="flex-grow">
                                        <p className="font-bold text-gray-800 dark:text-gray-100">{result.servantName} <span className="font-mono text-gray-400 dark:text-gray-500">({result.servantCode})</span></p>
                                        <p className="text-sm text-gray-500 dark:text-gray-400">{result.courseName} ({displayDate})</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-1 flex-shrink-0">
                                    <button onClick={() => handleEdit(result)} className="text-indigo-600 hover:text-indigo-900 dark:text-indigo-400 dark:hover:text-indigo-300 p-2" title="تعديل"><EditIcon /></button>
                                    <button onClick={() => handleDelete(result)} className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300 p-2" title="حذف"><DeleteIcon /></button>
                                </div>
                            </div>
                            <div className="mt-3 pt-3 border-t border-gray-100 dark:border-slate-700 flex justify-between text-sm">
                                <p><strong>الدرجة:</strong> <span className={`font-semibold ${result.score === 'غائب' ? 'text-red-500' : 'text-gray-800 dark:text-gray-200'}`}>{result.score}</span></p>
                                <p><strong>الحضور:</strong> <span className="font-semibold text-gray-800 dark:text-gray-200">{Math.round(normalizedAttendance)}%</span></p>
                            </div>
                        </div>
                    );
                })}
            </div>

            {visibleCount < filteredResults.length && (
                <div className="mt-6 text-center">
                    <button
                        onClick={handleLoadMore}
                        className="px-6 py-3 bg-indigo-600 text-white font-bold rounded-lg hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-opacity-75 transition-transform transform hover:scale-105"
                    >
                        تحميل المزيد ({filteredResults.length - visibleCount} متبقي)
                    </button>
                </div>
            )}

            {isFormModalOpen && (
                <CourseResultFormModal
                    result={currentResult}
                    onClose={() => setIsFormModalOpen(false)}
                    onSave={(data) => handleSaveResult(data, currentResult?.id)}
                    isSubmitting={isSubmitting}
                />
            )}

            {isDeleteModalOpen && currentResult && (
                <ConfirmationModal
                    title="تأكيد الحذف"
                    message={`هل أنت متأكد من حذف نتيجة كورس "${currentResult.courseName}" للخادم "${currentResult.servantName}"؟`}
                    onConfirm={handleDeleteConfirm}
                    onCancel={() => setIsDeleteModalOpen(false)}
                    isConfirming={isSubmitting}
                    confirmText="نعم، احذف"
                    confirmButtonClass="bg-red-600 hover:bg-red-700"
                />
            )}

             {isBulkDeleteModalOpen && (
                <ConfirmationModal
                    title={`تأكيد حذف ${selectedResults.size} نتائج`}
                    message={`هل أنت متأكد من رغبتك في حذف النتائج المحددة؟ لا يمكن التراجع عن هذا الإجراء.`}
                    onConfirm={handleBulkDeleteConfirm}
                    onCancel={() => setIsBulkDeleteModalOpen(false)}
                    isConfirming={isSubmitting}
                    confirmText="نعم، احذف المحدد"
                    confirmButtonClass="bg-red-600 hover:bg-red-700"
                />
            )}
        </>
    );
    
    if (isLoading && results.length === 0 && view === 'list') {
        return <div className="flex justify-center items-center py-20"><LoadingSpinner /></div>;
    }

    return (
        <div className="animate-fade-in-up">
            {view === 'list' ? renderListView() : renderImporter()}
        </div>
    );
};

export default CourseResultsDataView;
