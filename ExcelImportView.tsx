import React, { useState } from 'react';
import { read, utils, writeFile } from 'xlsx';
import { db } from './firebaseConfig';
import type { Servant } from './types';

// --- SVG Icons ---
const UploadIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-4-4V7a4 4 0 014-4h5l4 4v1m-4 5h-2m2 0h2m-4 5a2 2 0 104 0 2 2 0 10-4 0zM12 6v6m0 0v6m0-6h6m-6 0H6" /></svg>;
const CheckCircleIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>;
const XCircleIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>;

type ImportStep = 'idle' | 'preview' | 'importing' | 'complete';
type ValidationResult = { servant: Servant, errors: string[] };

const ExcelImportView: React.FC = () => {
    const [step, setStep] = useState<ImportStep>('idle');
    const [validatedData, setValidatedData] = useState<ValidationResult[]>([]);
    const [fileName, setFileName] = useState<string>('');
    const [importStatus, setImportStatus] = useState({ success: 0, failed: 0, total: 0 });
    const [error, setError] = useState<string>('');

    const validRecords = validatedData.filter(item => item.errors.length === 0);
    const invalidRecords = validatedData.filter(item => item.errors.length > 0);

    const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        setStep('preview');
        setFileName(file.name);
        setError('');
        setValidatedData([]);

        try {
            const data = await file.arrayBuffer();
            const workbook = read(data);
            const sheetName = workbook.SheetNames[0];
            const worksheet = workbook.Sheets[sheetName];
            const json = utils.sheet_to_json(worksheet) as any[];
            
            const results: ValidationResult[] = json.map((row, index) => {
                const errors: string[] = [];
                if (!row.code || String(row.code).trim() === '') errors.push('الكود مطلوب');
                if (!row.name || String(row.name).trim() === '') errors.push('الاسم مطلوب');

                const allServices = (row.allServices || row.primaryService || '')
                    .toString()
                    .split(',')
                    .map((s: string) => s.trim())
                    .filter(Boolean);

                return {
                    servant: {
                        code: String(row.code).trim(),
                        name: String(row.name).trim(),
                        mobileNumber: String(row.mobileNumber || '').trim(),
                        primaryService: allServices[0] || '',
                        allServices: allServices,
                    },
                    errors,
                };
            });

            setValidatedData(results);
        } catch (err) {
            console.error(err);
            setError('حدث خطأ أثناء قراءة الملف. تأكد من أنه ملف Excel صالح.');
            setStep('idle');
        } finally {
            event.target.value = ''; // Reset file input
        }
    };
    
    const handleDownloadTemplate = () => {
        const data = [{ code: '12345', name: 'مثال اسم الخادم', mobileNumber: '01200000000', allServices: 'خدمة ابتدائي, خدمة مدارس الأحد' }];
        const worksheet = utils.json_to_sheet(data);
        const workbook = utils.book_new();
        utils.book_append_sheet(workbook, worksheet, 'Servants');
        writeFile(workbook, 'Servant_Import_Template.xlsx');
    };

    const handleImport = async () => {
        setStep('importing');
        let successCount = 0;
        const totalToImport = validRecords.length;
        setImportStatus({ success: 0, failed: 0, total: totalToImport });

        const chunks = [];
        for (let i = 0; i < totalToImport; i += 500) {
            chunks.push(validRecords.slice(i, i + 500));
        }

        for (const chunk of chunks) {
            const batch = db.batch();
            chunk.forEach(item => {
                const docRef = db.collection('servants').doc(item.servant.code);
                batch.set(docRef, item.servant, { merge: true });
            });
            await batch.commit();
            successCount += chunk.length;
            setImportStatus(prev => ({ ...prev, success: successCount }));
        }

        setStep('complete');
    };

    const handleReset = () => {
        setStep('idle');
        setValidatedData([]);
        setFileName('');
        setError('');
        setImportStatus({ success: 0, failed: 0, total: 0 });
    };

    return (
        <div className="bg-white p-8 rounded-lg shadow-sm border border-gray-200/80 animate-fade-in-up">
            <h2 className="text-2xl font-bold text-slate-800 mb-2">استيراد بيانات الخدام</h2>
            <p className="text-slate-500 mb-8">
                قم بإضافة أو تحديث بيانات الخدام بشكل جماعي عن طريق رفع ملف Excel.
            </p>

            {step === 'idle' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
                    <div>
                        <h3 className="font-semibold text-lg text-slate-700 mb-3">الخطوات</h3>
                        <ol className="list-decimal list-inside space-y-3 text-slate-600">
                            <li><strong className="font-semibold">تنزيل القالب:</strong> قم بتحميل ملف Excel النموذجي لضمان تطابق الأعمدة.</li>
                            <li><strong className="font-semibold">ملء البيانات:</strong> املأ القالب ببيانات الخدام. عمود `code` و `name` إجباريان.</li>
                            <li><strong className="font-semibold">رفع الملف:</strong> اختر الملف الذي قمت بتعبئته لبدء عملية الاستيراد.</li>
                        </ol>
                        <button onClick={handleDownloadTemplate} className="mt-6 px-4 py-2 bg-green-600 text-white font-semibold rounded-lg hover:bg-green-700 transition">
                            تنزيل القالب
                        </button>
                    </div>
                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                        <label htmlFor="file-upload" className="cursor-pointer">
                            <UploadIcon />
                            <p className="mt-2 text-indigo-600 font-semibold">اختر ملفاً</p>
                            <p className="text-xs text-gray-500 mt-1">XLSX, XLS, CSV</p>
                            <input id="file-upload" type="file" className="hidden" onChange={handleFileChange} accept=".xlsx, .xls, .csv" />
                        </label>
                    </div>
                </div>
            )}
            
            {step === 'preview' && (
                <div>
                    <h3 className="font-semibold text-lg text-slate-700 mb-4">معاينة البيانات من ملف: <span className="font-normal text-indigo-600">{fileName}</span></h3>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                        <div className="bg-green-50 border border-green-200 p-4 rounded-lg text-center">
                            <p className="text-2xl font-bold text-green-700">{validRecords.length}</p>
                            <p className="text-sm font-medium text-green-600">سجل صالح للاستيراد</p>
                        </div>
                         <div className="bg-red-50 border border-red-200 p-4 rounded-lg text-center">
                            <p className="text-2xl font-bold text-red-700">{invalidRecords.length}</p>
                            <p className="text-sm font-medium text-red-600">سجل يحتوي على أخطاء</p>
                        </div>
                    </div>
                    
                    <div className="max-h-80 overflow-y-auto border rounded-lg">
                        <table className="min-w-full divide-y divide-gray-200 text-sm">
                            <thead className="bg-gray-50 sticky top-0"><tr className="text-right">
                                <th className="px-4 py-2 font-medium text-gray-500">الحالة</th>
                                <th className="px-4 py-2 font-medium text-gray-500">الكود</th>
                                <th className="px-4 py-2 font-medium text-gray-500">الاسم</th>
                                <th className="px-4 py-2 font-medium text-gray-500">الخدمات</th>
                                <th className="px-4 py-2 font-medium text-gray-500">الأخطاء</th>
                            </tr></thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {validatedData.slice(0, 10).map(({servant, errors}, i) => (
                                    <tr key={i} className={errors.length > 0 ? 'bg-red-50' : 'bg-green-50'}>
                                        <td className="px-4 py-2">{errors.length > 0 ? <XCircleIcon /> : <CheckCircleIcon />}</td>
                                        <td className="px-4 py-2 font-mono">{servant.code}</td>
                                        <td className="px-4 py-2">{servant.name}</td>
                                        <td className="px-4 py-2">{servant.allServices?.join(', ')}</td>
                                        <td className="px-4 py-2 text-red-600">{errors.join(', ')}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                    {validatedData.length > 10 && <p className="text-center text-sm text-gray-500 mt-2">... و {validatedData.length - 10} سجلات أخرى.</p>}

                    <div className="mt-6 flex justify-end gap-4">
                        <button onClick={handleReset} className="px-5 py-2 bg-gray-100 text-slate-700 font-semibold rounded-lg hover:bg-gray-200">إلغاء</button>
                        <button onClick={handleImport} disabled={validRecords.length === 0} className="px-5 py-2 bg-indigo-600 text-white font-bold rounded-lg hover:bg-indigo-700 disabled:bg-indigo-300">
                            بدء الاستيراد ({validRecords.length})
                        </button>
                    </div>
                </div>
            )}
            
            {step === 'importing' && (
                <div className="text-center py-12">
                     <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-600 mx-auto"></div>
                     <h3 className="text-xl font-semibold text-slate-700 mt-6">جاري الاستيراد...</h3>
                     <p className="text-slate-500 mt-2">
                        تم استيراد {importStatus.success} من {importStatus.total} سجل.
                     </p>
                </div>
            )}

            {step === 'complete' && (
                <div className="text-center py-12">
                     <CheckCircleIcon />
                     <h3 className="text-2xl font-bold text-green-700 mt-4">اكتمل الاستيراد بنجاح!</h3>
                     <p className="text-slate-600 mt-2">
                        تمت معالجة {importStatus.success} سجل بنجاح.
                     </p>
                     <button onClick={handleReset} className="mt-6 px-6 py-2 bg-indigo-600 text-white font-semibold rounded-lg hover:bg-indigo-700">
                        استيراد ملف آخر
                     </button>
                </div>
            )}
        </div>
    );
};

export default ExcelImportView;
