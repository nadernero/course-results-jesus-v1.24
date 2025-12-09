import React, { useState, useEffect, useMemo } from 'react';
import { db } from './firebaseConfig';
import firebase from 'firebase/compat/app';
import 'firebase/compat/firestore';
import ConfirmationModal from './ConfirmationModal';
import { useToast } from './ToastProvider';


// --- SVG Icons ---
const TotalQueriesIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v.01" /></svg>;
const TodayQueriesIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>;
const LoadingSpinner = () => <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-600"></div>;
const TrashIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>;


interface QueryLog {
    id: string;
    timestamp: firebase.firestore.Timestamp;
    searchedId: string;
    foundCode: string;
    foundName: string;
}

interface StatCardProps {
    icon: React.ReactNode;
    title: string;
    value: string | number;
    color: string;
}
const StatCard: React.FC<StatCardProps> = ({ icon, title, value, color }) => (
    <div className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-md border border-gray-200/80 dark:border-slate-700 flex items-center gap-6">
        <div className={`rounded-full p-4 ${color}`}>
            {icon}
        </div>
        <div>
            <p className="text-lg text-gray-500 dark:text-gray-400 font-medium">{title}</p>
            <p className="text-4xl font-bold text-gray-800 dark:text-gray-200">{value}</p>
        </div>
    </div>
);


const UsageStatsView: React.FC = () => {
    const [logs, setLogs] = useState<QueryLog[]>([]);
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [error, setError] = useState<string>('');
    const [isClearModalOpen, setIsClearModalOpen] = useState<boolean>(false);
    const [isConfirming, setIsConfirming] = useState<boolean>(false);
    const { addToast } = useToast();


    useEffect(() => {
        const fetchData = async () => {
            setIsLoading(true);
            setError('');
            try {
                // Fetch logs
                const logsQuery = db.collection("queryLogs").orderBy("timestamp", "desc").limit(1000);
                const logsSnapshot = await logsQuery.get();
                const logsData = logsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as QueryLog));
                setLogs(logsData);

            } catch (err: any) {
                console.error("Error fetching usage stats:", err);
                setError("حدث خطأ أثناء تحميل سجل الاستخدام. قد تكون أذونات الوصول إلى قاعدة البيانات غير كافية.");
            } finally {
                setIsLoading(false);
            }
        };
        fetchData();
    }, []);

    const stats = useMemo(() => {
        // Query Log stats
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const todayLogs = logs.filter(log => log.timestamp && log.timestamp.toDate() >= today);
        
        return {
            totalQueries: logs.length,
            todayQueries: todayLogs.length,
        };
    }, [logs]);
    
    const handleClearLogs = async () => {
        setIsConfirming(true);
        try {
            const collectionRef = db.collection("queryLogs");
            let snapshot = await collectionRef.limit(500).get();
            while (snapshot.size > 0) {
                const batch = db.batch();
                snapshot.docs.forEach(doc => batch.delete(doc.ref));
                await batch.commit();
                snapshot = await collectionRef.limit(500).get();
            }
            addToast('تم مسح سجل الاستعلامات بنجاح.', 'success');
            setLogs([]);
        } catch (err) {
            console.error("Error clearing logs:", err);
            addToast('فشل مسح السجل.', 'error');
            setError('حدث خطأ أثناء محاولة مسح السجل.');
        } finally {
            setIsConfirming(false);
            setIsClearModalOpen(false);
        }
    };


    if (isLoading) {
        return <div className="flex justify-center items-center py-20"><LoadingSpinner /></div>;
    }

    if (error && logs.length === 0) {
        return <p className="text-red-500 text-center py-10 font-semibold">{error}</p>;
    }
    
    // We will display the most recent 100 logs in the table
    const recentLogs = logs.slice(0, 100);

    return (
        <div className="space-y-8 animate-fade-in-up">
            <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                 <div>
                    <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100">ملخص الاستخدام</h2>
                    <p className="text-slate-500 dark:text-slate-400 mt-1">نظرة عامة على عمليات الاستعلام التي تمت في التطبيق.</p>
                </div>
                <button
                    onClick={() => setIsClearModalOpen(true)}
                    className="flex items-center justify-center px-4 py-2 bg-red-600 text-white font-semibold rounded-lg hover:bg-red-700 transition-transform transform hover:scale-105"
                >
                    <TrashIcon />
                    مسح السجل
                </button>
            </header>
            
            {error && <p className="text-red-500 text-center py-2 font-semibold bg-red-100 dark:bg-red-900/30 rounded-lg">{error}</p>}
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 gap-6">
                <StatCard 
                    icon={<TotalQueriesIcon />}
                    title="إجمالي الاستعلامات (آخر 1000)"
                    value={stats.totalQueries}
                    color="bg-blue-100 text-blue-600 dark:bg-blue-900/50 dark:text-blue-300"
                />
                <StatCard 
                    icon={<TodayQueriesIcon />}
                    title="استعلامات اليوم"
                    value={stats.todayQueries}
                    color="bg-green-100 text-green-600 dark:bg-green-900/50 dark:text-green-300"
                />
            </div>

            <div className="bg-white dark:bg-slate-800 p-6 rounded-lg shadow-sm border border-gray-200/80 dark:border-slate-700">
                <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-4">
                    سجل الاستعلامات (آخر 100 عملية)
                </h3>
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200 dark:divide-slate-700">
                        <thead className="bg-slate-100 dark:bg-slate-700">
                            <tr>
                                <th className="px-6 py-3 text-right text-sm font-medium text-gray-500 dark:text-gray-400">الوقت والتاريخ</th>
                                <th className="px-6 py-3 text-right text-sm font-medium text-gray-500 dark:text-gray-400">اسم الخادم</th>
                                <th className="px-6 py-3 text-right text-sm font-medium text-gray-500 dark:text-gray-400">الكود</th>
                                <th className="px-6 py-3 text-right text-sm font-medium text-gray-500 dark:text-gray-400">المدخل للبحث</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white dark:bg-slate-800 divide-y divide-gray-200 dark:divide-slate-700">
                            {recentLogs.length > 0 ? (
                                recentLogs.map(log => (
                                    <tr key={log.id} className="hover:bg-gray-50 dark:hover:bg-slate-700/50">
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                                            {log.timestamp ? log.timestamp.toDate().toLocaleString('ar-EG') : 'غير متوفر'}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-gray-100">
                                            {log.foundName}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400 font-mono">
                                            {log.foundCode}
                                        </td>
                                         <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400 font-mono">
                                            {log.searchedId}
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan={4} className="text-center text-gray-500 py-10">
                                        لا توجد سجلات استعلام لعرضها.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
             {isClearModalOpen && (
                <ConfirmationModal
                    title="تأكيد مسح السجل"
                    message="هل أنت متأكد من رغبتك في مسح جميع سجلات الاستعلام؟ لا يمكن التراجع عن هذا الإجراء."
                    onConfirm={handleClearLogs}
                    onCancel={() => setIsClearModalOpen(false)}
                    isConfirming={isConfirming}
                    confirmText="نعم، امسح السجل"
                    confirmButtonClass="bg-red-600 hover:bg-red-700"
                />
            )}
        </div>
    );
};

export default UsageStatsView;