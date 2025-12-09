
import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { read, utils, writeFile } from 'xlsx';
import { db } from './firebaseConfig';
import firebase from 'firebase/compat/app';
import 'firebase/compat/firestore';
import type { Servant } from './types';
import ServantFormModal from './ServantFormModal';
import ConfirmationModal from './ConfirmationModal';
import ServantProfileModal from './ServantProfileModal';
import { useToast } from './ToastProvider';

// --- SVG Icons ---
const SearchIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>;
const LoadingSpinner = () => <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-indigo-600"></div>;
const EditIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.5L15.232 5.232z" /></svg>;
const DeleteIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>;
const AddIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" /></svg>;
const UploadIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-4-4V7a4 4 0 014-4h5l4 4v1m-4 5h-2m2 0h2m-4 5a2 2 0 104 0 2 2 0 10-4 0zM12 6v6m0 0v6m0-6h6m-6 0H6" /></svg>;
const CheckCircleIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>;
const XCircleIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>;
const UploadIconLarge = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-4-4V7a4 4 0 014-4h5l4 4v1m-4 5h-2m2 0h2m-4 5a2 2 0 104 0 2 2 0 10-4 0zM12 6v6m0 0v6m0-6h6m-6 0H6" /></svg>;
const ArrowUpIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 15l7-7 7 7" /></svg>;
const ArrowDownIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M19 9l-7 7-7 7" /></svg>;
const ExcelIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 24 24" fill="currentColor"><path d="M21.16,3.16a.5.5,0,0,0-.57-.16l-18,4A.5.5,0,0,0,2.5,8v8a.5.5,0,0,0,.16.37.5.5,0,0,0,.38.13l18,4a.5.5,0,0,0,.57-.6V3.5A.5.5,0,0,0,21.16,3.16ZM11,12.1,7.26,14.28,3.5,12.5,7.1,10.59Zm8.5,3.31-3.6-1.74,3.6-1.92ZM18,7.91,14.25,10,11,8.1,14.65,6Z"/></svg>;
const SuccessIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 mx-auto text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>;


const PAGE_SIZE = 50;

type ImportStep = 'idle' | 'preview' | 'importing' | 'complete';
type ValidationResult = { servant: Servant, errors: string[] };

const DataManagementView: React.FC = () => {
    const [allServants, setAllServants] = useState<Servant[]>([]);
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [error, setError] = useState<string>('');
    const [searchTerm, setSearchTerm] = useState<string>('');
    const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
    const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
    const [view, setView] = useState<'list' | 'import'>('list');

    // Modals
    const [isFormModalOpen, setIsFormModalOpen] = useState<boolean>(false);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState<boolean>(false);
    const [currentServant, setCurrentServant] = useState<Servant | null>(null);
    const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
    const [servantToView, setServantToView] = useState<Servant | null>(null);

    // Bulk actions
    const [selectedServants, setSelectedServants] = useState<Set<string>>(new Set());
    const [isBulkDeleteModalOpen, setIsBulkDeleteModalOpen] = useState<boolean>(false);
    const [isExportingAll, setIsExportingAll] = useState<boolean>(false);
    
    // Service Filter
    const [allServices, setAllServices] = useState<string[]>([]);
    const [selectedServices, setSelectedServices] = useState<string[]>(['الكل']);
    const [isServiceDropdownOpen, setIsServiceDropdownOpen] = useState(false);
    const serviceFilterRef = useRef<HTMLDivElement>(null);
    
    const { addToast } = useToast();

    // Importer
    const [step, setStep] = useState<ImportStep>('idle');
    const [validatedData, setValidatedData] = useState<ValidationResult[]>([]);
    const [fileName, setFileName] = useState<string>('');
    const [importStatus, setImportStatus] = useState({ success: 0, failed: 0, total: 0 });
    const [importError, setImportError] = useState<string>('');

    const fetchData = useCallback(async () => {
        setIsLoading(true);
        setError('');
        try {
            const servantsSnapshot = await db.collection("servants").get();
            const servantsList = servantsSnapshot.docs.map(doc => ({
                ...(doc.data() as Omit<Servant, 'code'>),
                code: doc.id
            }));
            setAllServants(servantsList);

            const serviceSet = new Set<string>();
            servantsList.forEach(servant => {
                if (Array.isArray(servant.allServices)) {
                    servant.allServices.forEach(s => s && serviceSet.add(s.trim()));
                } else if (servant.primaryService) {
                    serviceSet.add(servant.primaryService.trim());
                }
            });
            setAllServices(['الكل', ...Array.from(serviceSet).sort()]);

        } catch (err: any) {
            console.error("Error fetching servants:", err);
            setError('حدث خطأ أثناء جلب بيانات الخدام.');
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        if (view === 'list') {
            fetchData();
        }
    }, [view, fetchData]);

     useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (serviceFilterRef.current && !serviceFilterRef.current.contains(event.target as Node)) {
                setIsServiceDropdownOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const filteredServants = useMemo(() => {
        let servants = [...allServants];

        if (!selectedServices.includes('الكل') && selectedServices.length > 0) {
            const serviceSet = new Set(selectedServices);
            servants = servants.filter(s => {
                const servantServices = s.allServices || [s.primaryService];
                return servantServices.some(ss => serviceSet.has(ss));
            });
        }
        
        if (searchTerm.trim()) {
            const lowercasedFilter = searchTerm.toLowerCase().trim();
            servants = servants.filter(servant => 
                servant.name.toLowerCase().includes(lowercasedFilter) || 
                servant.code.toLowerCase().includes(lowercasedFilter)
            );
        }

        servants.sort((a, b) => {
            const nameA = a.name.toUpperCase();
            const nameB = b.name.toUpperCase();
            if (nameA < nameB) return sortOrder === 'asc' ? -1 : 1;
            if (nameA > nameB) return sortOrder === 'asc' ? 1 : -1;
            return 0;
        });

        return servants;
    }, [allServants, searchTerm, sortOrder, selectedServices]);

    const displayedServants = useMemo(() => {
        return filteredServants.slice(0, visibleCount);
    }, [filteredServants, visibleCount]);

    useEffect(() => {
        setVisibleCount(PAGE_SIZE);
    }, [searchTerm, selectedServices]);

    const handleLoadMore = () => {
        setVisibleCount(prev => prev + PAGE_SIZE);
    };

    const handleSaveServant = async (servantData: Servant) => {
        setIsSubmitting(true);
        try {
            const { code, ...dataToSave } = servantData;
            await db.collection('servants').doc(code).set(dataToSave, { merge: true });
            addToast(currentServant ? 'تم تحديث الخادم.' : 'تم إضافة الخادم.', 'success');
            fetchData();
            setIsFormModalOpen(false);
        } catch (error) {
            addToast('فشل حفظ بيانات الخادم.', 'error');
        } finally {
            setIsSubmitting(false);
        }
    };
    
    const handleDeleteConfirm = async () => {
        if (!currentServant) return;
        setIsSubmitting(true);
        try {
            await db.collection('servants').doc(currentServant.code).delete();
            addToast(`تم حذف الخادم "${currentServant.name}".`, 'success');
            fetchData();
            setIsDeleteModalOpen(false);
        } catch (error) {
            addToast('فشل حذف الخادم.', 'error');
        } finally {
            setIsSubmitting(false);
        }
    };
    
    const handleAdd = () => { setCurrentServant(null); setIsFormModalOpen(true); };
    const handleEdit = (s: Servant) => { setCurrentServant(s); setIsFormModalOpen(true); };
    const handleViewProfile = (s: Servant) => setServantToView(s);
    const handleDelete = (s: Servant) => { setCurrentServant(s); setIsDeleteModalOpen(true); };
    
    const handleServiceChange = (service: string) => {
        setSelectedServices(prev => {
            if (service === 'الكل') {
                // If 'All' is already in the selection, clear it. Otherwise, select all.
                return prev.includes('الكل') ? [] : allServices;
            }
    
            const newSelection = new Set(prev.filter(s => s !== 'الكل'));
            if (newSelection.has(service)) {
                newSelection.delete(service);
            } else {
                newSelection.add(service);
            }
    
            // If all individual services are selected, also select 'All'
            if (newSelection.size === allServices.length - 1) {
                return allServices;
            }
    
            return Array.from(newSelection);
        });
    };
    
    const handleExportAllFiltered = () => {
        setIsExportingAll(true);
        try {
            const dataToExport = filteredServants.map(({ code, name, mobileNumber, allServices }) => ({
                'الكود': code, 'الاسم': name, 'رقم الموبايل': mobileNumber, 'الخدمات': allServices?.join(', ')
            }));
            const worksheet = utils.json_to_sheet(dataToExport);
            const workbook = utils.book_new();
            utils.book_append_sheet(workbook, worksheet, 'Filtered Servants');
            writeFile(workbook, `Filtered_Servants_${new Date().toISOString().split('T')[0]}.xlsx`);
        } catch (err) {
            addToast("حدث خطأ أثناء تصدير البيانات.", "error");
        } finally {
            setIsExportingAll(false);
        }
    };
    
    // --- Importer logic (same as before) ---
    const validRecords = validatedData.filter(item => item.errors.length === 0);
    const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0]; if (!file) return;
        setStep('preview'); setFileName(file.name); setImportError(''); setValidatedData([]);
        try {
            const data = await file.arrayBuffer(); const workbook = read(data);
            const sheetName = workbook.SheetNames[0]; const worksheet = workbook.Sheets[sheetName];
            const json = utils.sheet_to_json(worksheet) as any[];
            const results: ValidationResult[] = json.map((row) => {
                const errors: string[] = [];
                if (!row.code || String(row.code).trim() === '') errors.push('الكود مطلوب');
                if (!row.name || String(row.name).trim() === '') errors.push('الاسم مطلوب');
                const allServices = (row.allServices || row.primaryService || '').toString().split(',').map((s: string) => s.trim()).filter(Boolean);
                return { servant: { code: String(row.code).trim(), name: String(row.name).trim(), mobileNumber: String(row.mobileNumber || '').trim(), primaryService: allServices[0] || '', allServices: allServices, }, errors };
            });
            setValidatedData(results);
        } catch (err) { setImportError('حدث خطأ أثناء قراءة الملف.'); addToast('حدث خطأ أثناء قراءة الملف.', 'error'); setStep('idle'); } finally { event.target.value = ''; }
    };
    // @google/genai-ts: Fix: The 'handleDownloadTemplate' function was empty. It has been implemented to generate and download an Excel template file for importing servant data.
    const handleDownloadTemplate = () => {
        const data = [{ code: '12345', name: 'مثال اسم الخادم', mobileNumber: '01200000000', allServices: 'خدمة ابتدائي, خدمة مدارس الأحد' }];
        const worksheet = utils.json_to_sheet(data);
        const workbook = utils.book_new();
        utils.book_append_sheet(workbook, worksheet, 'Servants');
        writeFile(workbook, 'Servant_Import_Template.xlsx');
    };
    const handleImport = async () => {
        setStep('importing'); let successCount = 0; const totalToImport = validRecords.length; setImportStatus({ success: 0, failed: 0, total: totalToImport });
        const chunks = []; for (let i = 0; i < totalToImport; i += 500) { chunks.push(validRecords.slice(i, i + 500)); }
        for (const chunk of chunks) { const batch = db.batch(); chunk.forEach(item => { const docRef = db.collection('servants').doc(item.servant.code); batch.set(docRef, item.servant, { merge: true }); }); await batch.commit(); successCount += chunk.length; setImportStatus(prev => ({ ...prev, success: successCount })); }
        setStep('complete'); addToast(`اكتمل الاستيراد! تم استيراد ${successCount} سجل.`, 'success'); fetchData();
    };
    const handleResetImporter = () => { setStep('idle'); setView('list'); };

    if (isLoading && allServants.length === 0) return <div className="flex justify-center items-center py-20"><LoadingSpinner /></div>;

    // @google/genai-ts: Fix: The 'renderImporter' function was missing. It has been added to provide the UI for the Excel import functionality, resolving a compile-time error.
    const renderImporter = () => (
        <div className="bg-white dark:bg-slate-800 p-6 md:p-8 rounded-lg shadow-sm border border-gray-200/80 dark:border-slate-700">
            <header className="flex justify-between items-center mb-8">
                <div>
                    <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100">استيراد بيانات الخدام</h2>
                    <p className="text-slate-500 dark:text-slate-400">أضف أو حدِّث بيانات الخدام بشكل جماعي.</p>
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
                            <li><strong className="font-semibold">ملء البيانات:</strong> املأ القالب ببيانات الخدام.</li>
                            <li><strong className="font-semibold">رفع الملف:</strong> اختر الملف المعبأ لبدء عملية الاستيراد.</li>
                        </ol>
                        <button onClick={handleDownloadTemplate} className="mt-6 px-4 py-2 bg-green-600 text-white font-semibold rounded-lg hover:bg-green-700 transition">
                            تنزيل القالب
                        </button>
                    </div>
                    <div className="border-2 border-dashed border-gray-300 dark:border-slate-600 rounded-lg p-8 text-center">
                        <label htmlFor="servants-file-upload" className="cursor-pointer block w-full h-full">
                            <UploadIconLarge />
                            <p className="mt-2 text-indigo-600 dark:text-indigo-400 font-semibold">اختر ملفاً</p>
                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">XLSX, XLS, CSV</p>
                            <input id="servants-file-upload" type="file" className="hidden" onChange={handleFileChange} accept=".xlsx, .xls, .csv" />
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
                            <p className="text-sm font-medium text-green-600 dark:text-green-400">سجل صالح للاستيراد</p>
                        </div>
                        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 p-4 rounded-lg text-center">
                            <p className="text-2xl font-bold text-red-700 dark:text-red-300">{validatedData.length - validRecords.length}</p>
                            <p className="text-sm font-medium text-red-600 dark:text-red-400">سجل يحتوي على أخطاء</p>
                        </div>
                    </div>
                    
                     <div className="max-h-80 overflow-y-auto border dark:border-slate-600 rounded-lg">
                        <table className="min-w-full divide-y divide-gray-200 dark:divide-slate-600 text-sm">
                            <thead className="bg-gray-50 dark:bg-slate-700 sticky top-0"><tr className="text-right">
                                <th className="px-4 py-2 font-medium text-gray-500 dark:text-gray-300">الحالة</th>
                                <th className="px-4 py-2 font-medium text-gray-500 dark:text-gray-300">الكود</th>
                                <th className="px-4 py-2 font-medium text-gray-500 dark:text-gray-300">الاسم</th>
                                <th className="px-4 py-2 font-medium text-gray-500 dark:text-gray-300">الخدمات</th>
                                <th className="px-4 py-2 font-medium text-gray-500 dark:text-gray-300">الأخطاء</th>
                            </tr></thead>
                            <tbody className="bg-white dark:bg-slate-800 divide-y divide-gray-200 dark:divide-slate-600">
                                {validatedData.slice(0, 10).map(({servant, errors}, i) => (
                                    <tr key={i} className={errors.length > 0 ? 'bg-red-50 dark:bg-red-900/20' : 'bg-green-50 dark:bg-green-900/20'}>
                                        <td className="px-4 py-2">{errors.length > 0 ? <XCircleIcon /> : <CheckCircleIcon />}</td>
                                        <td className="px-4 py-2 font-mono text-slate-800 dark:text-slate-200">{servant.code}</td>
                                        <td className="px-4 py-2 text-slate-800 dark:text-slate-200">{servant.name}</td>
                                        <td className="px-4 py-2 text-slate-800 dark:text-slate-200">{servant.allServices?.join(', ')}</td>
                                        <td className="px-4 py-2 text-red-600 dark:text-red-400">{errors.join(', ')}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                    {validatedData.length > 10 && <p className="text-center text-sm text-gray-500 dark:text-gray-400 mt-2">... و {validatedData.length - 10} سجلات أخرى.</p>}
                    
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
                     <p className="text-slate-500 dark:text-slate-400 mt-2">تم استيراد {importStatus.success} من {importStatus.total} سجل.</p>
                 </div>
            )}

            {step === 'complete' && (
                <div className="text-center py-12">
                     <SuccessIcon />
                     <h3 className="text-2xl font-bold text-green-700 dark:text-green-400 mt-4">اكتمل الاستيراد بنجاح!</h3>
                     <p className="text-slate-600 dark:text-slate-300 mt-2">تمت معالجة {importStatus.success} سجل بنجاح.</p>
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
                    <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100">إدارة الخدام ({allServants.length})</h2>
                    <p className="text-slate-500 dark:text-slate-400 mt-1">عرض، إضافة، تعديل، وحذف بيانات الخدام المسجلين.</p>
                </div>
                <div className="flex items-center gap-3">
                    <button onClick={() => setView('import')} className="flex items-center justify-center px-4 py-2 bg-green-600 text-white font-semibold rounded-lg hover:bg-green-700"><UploadIcon /> استيراد</button>
                    <button onClick={handleAdd} className="flex items-center px-4 py-2 bg-indigo-600 text-white font-bold rounded-lg hover:bg-indigo-700"><AddIcon /> إضافة خادم</button>
                </div>
            </header>

            <div className="mb-4 flex flex-col sm:flex-row gap-4 justify-between">
                 <div className="flex gap-4">
                    <div className="relative">
                        <input type="text" placeholder="ابحث بالاسم أو بالكود..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full sm:w-64 px-4 py-2 pr-10 text-gray-700 bg-white dark:bg-slate-800 border border-gray-300 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:text-gray-200" />
                        <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none"><SearchIcon /></div>
                    </div>
                     <div ref={serviceFilterRef} className="relative w-full sm:w-48">
                        <button onClick={() => setIsServiceDropdownOpen(!isServiceDropdownOpen)} className="w-full flex justify-between items-center px-4 py-2 bg-white dark:bg-slate-800 border border-gray-300 dark:border-slate-600 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-200">
                            <span>فلتر الخدمات</span>
                            <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" /></svg>
                        </button>
                        {isServiceDropdownOpen && (
                             <div className="absolute z-10 top-full mt-2 w-full bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg shadow-xl max-h-60 overflow-y-auto">
                                 {allServices.map(service => (
                                    <label key={service} className="flex items-center px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-slate-700 cursor-pointer">
                                        <input type="checkbox" checked={selectedServices.includes(service)} onChange={() => handleServiceChange(service)} className="h-4 w-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500" />
                                        <span className="mr-3">{service}</span>
                                    </label>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
                 <div className="flex items-center gap-4">
                    <p className="text-sm font-semibold text-slate-600 dark:text-slate-300">يتم عرض: {displayedServants.length} من {filteredServants.length} خدام</p>
                    <button onClick={handleExportAllFiltered} disabled={isExportingAll} className="flex items-center justify-center px-4 py-2 bg-green-100 text-green-800 font-semibold rounded-lg hover:bg-green-200 dark:bg-green-900/30 dark:text-green-300 disabled:opacity-50">
                        <ExcelIcon /> {isExportingAll ? 'جاري...' : 'تصدير الكل'}
                    </button>
                 </div>
            </div>
            
            <div className="overflow-x-auto border border-gray-200 dark:border-slate-700 rounded-lg shadow-sm">
                 <table className="min-w-full divide-y divide-gray-200 dark:divide-slate-700">
                    <thead className="bg-slate-100 dark:bg-slate-800">
                        <tr>
                            <th className="px-6 py-3 text-right text-sm font-medium text-gray-500 dark:text-gray-400">
                                <button onClick={() => setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc')} className="flex items-center gap-1 group">
                                    <span>الاسم</span> {sortOrder === 'asc' ? <ArrowUpIcon /> : <ArrowDownIcon />}
                                </button>
                            </th>
                            <th className="px-6 py-3 text-right text-sm font-medium text-gray-500 dark:text-gray-400">الخدمات</th>
                            <th className="px-6 py-3 text-right text-sm font-medium text-gray-500 dark:text-gray-400">الموبايل</th>
                            <th className="px-6 py-3 text-center text-sm font-medium text-gray-500 dark:text-gray-400">إجراءات</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white dark:bg-slate-900 divide-y divide-gray-200 dark:divide-slate-700">
                        {displayedServants.map(servant => (
                            <tr key={servant.code} className="hover:bg-gray-50 dark:hover:bg-slate-800/60">
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <div className="font-medium text-gray-900 dark:text-gray-100 hover:text-indigo-600 cursor-pointer" onClick={() => handleViewProfile(servant)}>{servant.name}</div>
                                    <div className="text-sm text-gray-500 dark:text-gray-400 font-mono">{servant.code}</div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400 max-w-sm truncate">{(servant.allServices || []).join(', ')}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400 font-mono">{servant.mobileNumber}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-center text-sm font-medium">
                                    <div className="flex justify-center items-center gap-4">
                                        <button onClick={() => handleEdit(servant)} className="text-indigo-600 hover:text-indigo-900" title="تعديل"><EditIcon /></button>
                                        <button onClick={() => handleDelete(servant)} className="text-red-600 hover:text-red-900" title="حذف"><DeleteIcon /></button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                 {filteredServants.length === 0 && <div className="text-center text-gray-500 py-10">لا توجد نتائج.</div>}
            </div>
            {visibleCount < filteredServants.length && (
                <div className="mt-6 text-center">
                    <button
                        onClick={handleLoadMore}
                        className="px-6 py-3 bg-indigo-600 text-white font-bold rounded-lg hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-opacity-75 transition-transform transform hover:scale-105"
                    >
                        تحميل المزيد ({filteredServants.length - visibleCount} متبقي)
                    </button>
                </div>
            )}
             {isFormModalOpen && <ServantFormModal servant={currentServant} onClose={() => setIsFormModalOpen(false)} onSave={handleSaveServant} isSubmitting={isSubmitting} />}
             {isDeleteModalOpen && currentServant && <ConfirmationModal title="تأكيد الحذف" message={`هل تريد حذف "${currentServant.name}"؟`} onConfirm={handleDeleteConfirm} onCancel={() => setIsDeleteModalOpen(false)} isConfirming={isSubmitting} confirmButtonClass="bg-red-600" />}
             {servantToView && <ServantProfileModal servant={servantToView} onClose={() => setServantToView(null)} />}
        </>
    );

    return (
        <div className="animate-fade-in-up">
            {view === 'list' ? renderListView() : renderImporter()}
        </div>
    );
};

export default DataManagementView;
