import React, { useState, useMemo, useEffect } from 'react';
import { createPortal } from 'react-dom';
import type { StudentResult } from './types';
import { utils, writeFile } from 'xlsx';

// Close Icon
const CloseIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>;
const ExcelIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 24 24" fill="currentColor"><path d="M21.16,3.16a.5.5,0,0,0-.57-.16l-18,4A.5.5,0,0,0,2.5,8v8a.5.5,0,0,0,.16.37.5.5,0,0,0,.38.13l18,4a.5.5,0,0,0,.57-.6V3.5A.5.5,0,0,0,21.16,3.16ZM11,12.1,7.26,14.28,3.5,12.5,7.1,10.59Zm8.5,3.31-3.6-1.74,3.6-1.92ZM18,7.91,14.25,10,11,8.1,14.65,6Z"/></svg>;


interface DetailsModalProps {
    title: string;
    students: StudentResult[];
    onClose: () => void;
}

const PAGE_SIZE = 50; // Number of students per page

const DetailsModal: React.FC<DetailsModalProps> = ({ title, students, onClose }) => {
    const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
    
    // Prevent background scrolling when modal is open
    useEffect(() => {
        document.body.style.overflow = 'hidden';
        return () => {
            document.body.style.overflow = 'unset';
        };
    }, []);

    const displayedStudents = useMemo(() => {
        return students.slice(0, visibleCount);
    }, [students, visibleCount]);

    const handleLoadMore = () => {
        setVisibleCount(prev => prev + PAGE_SIZE);
    };

    const handleExport = () => {
        const dataToExport = students.map(s => ({
            'الكود': s.code,
            'الاسم': s.name,
            'الخدمة': s.service,
            'الكورس': s.courseName,
            'الدرجة': s.score,
            'الحضور': `${Math.round(s.attendance <= 1 ? s.attendance * 100 : s.attendance)}%`
        }));
    
        const worksheet = utils.json_to_sheet(dataToExport);
        const workbook = utils.book_new();
        utils.book_append_sheet(workbook, worksheet, "Details");
        writeFile(workbook, `${title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.xlsx`);
    };

    return createPortal(
        <div
            className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 transition-opacity duration-300"
            onClick={onClose}
            role="dialog"
            aria-modal="true"
            aria-labelledby="details-modal-title"
        >
            <div
                className="bg-white dark:bg-slate-900 p-0 rounded-2xl shadow-xl w-full max-w-4xl m-4 flex flex-col h-[90vh] animate-fade-in-up"
                onClick={(e) => e.stopPropagation()} // Prevent closing when clicking inside the modal
            >
                <header className="flex-shrink-0 flex justify-between items-center border-b border-gray-200 dark:border-slate-700 p-4 md:p-6">
                    <h2 id="details-modal-title" className="text-xl font-bold text-slate-800 dark:text-slate-100">{title} ({students.length})</h2>
                    <button
                        onClick={onClose}
                        className="p-2 rounded-full text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-slate-700 hover:text-gray-800 dark:hover:text-gray-100 transition-colors"
                        aria-label="إغلاق"
                    >
                        <CloseIcon />
                    </button>
                </header>
                <main className="flex-grow overflow-y-auto p-4 md:p-6">
                    {students.length > 0 ? (
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200 dark:divide-slate-700">
                                <thead className="bg-gray-50 dark:bg-slate-800 sticky top-0">
                                    <tr>
                                        <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">الاسم</th>
                                        <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">الخدمة</th>
                                        <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">الدرجة</th>
                                        <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">الحضور</th>
                                        <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">الكود</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white dark:bg-slate-900 divide-y divide-gray-200 dark:divide-slate-700">
                                    {displayedStudents.map((student, index) => {
                                        const normalizedAttendance = student.attendance <= 1 ? student.attendance * 100 : student.attendance;
                                        return (
                                        <tr key={`${student.code}-${student.name}-${index}`} className="hover:bg-gray-50 dark:hover:bg-slate-800/60">
                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-gray-100">{student.name}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">{student.service}</td>
                                            <td className={`px-6 py-4 whitespace-nowrap text-sm font-semibold ${student.score === 'غائب' ? 'text-red-500' : 'text-gray-800 dark:text-gray-200'}`}>{student.score}</td>
                                            <td className={`px-6 py-4 whitespace-nowrap text-sm font-semibold ${normalizedAttendance < 50 ? 'text-amber-500' : 'text-gray-800 dark:text-gray-200'}`}>{Math.round(normalizedAttendance)}%</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">{student.code || 'N/A'}</td>
                                        </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    ) : (
                        <div className="flex items-center justify-center h-full">
                            <p className="text-gray-500 dark:text-gray-400">لا توجد بيانات لعرضها لهذه الفئة.</p>
                        </div>
                    )}
                </main>
                <footer className="flex-shrink-0 flex items-center justify-between border-t border-gray-200 dark:border-slate-700 px-4 py-3 sm:px-6">
                    <div>
                        {students.length > 0 && (
                            <button onClick={handleExport} className="flex items-center justify-center px-4 py-2 bg-green-600 text-white font-semibold rounded-lg hover:bg-green-700 transition">
                                <ExcelIcon /> تصدير إلى Excel
                            </button>
                        )}
                    </div>
                    {visibleCount < students.length && (
                        <div className="flex flex-1 justify-end">
                            <button
                                onClick={handleLoadMore}
                                className="px-5 py-2 bg-indigo-600 text-white font-bold rounded-lg hover:bg-indigo-700 transition-colors"
                            >
                                تحميل المزيد ({students.length - visibleCount} متبقي)
                            </button>
                        </div>
                    )}
                </footer>
            </div>
        </div>,
        document.body
    );
};

export default DetailsModal;
