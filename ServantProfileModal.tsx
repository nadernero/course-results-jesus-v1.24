import React, { useState, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { db } from './firebaseConfig';
import type { Servant, CourseResult, Evaluation } from './types';

// --- Icons ---
const CloseIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>;
const IdCardIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V8a2 2 0 00-2-2h-5m-4 0V5a2 2 0 012-2h2a2 2 0 012 2v1m-4 0h4" /></svg>;
const PhoneIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" /></svg>;
const BriefcaseIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>;
const LoadingSpinner = () => <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-indigo-600"></div>;
const GraduationCapIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 14l9-5-9-5-9 5 9 5z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 14v6m-4-3v3m8-3v3" /></svg>;
const ClipboardCheckIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" /></svg>;
const StarIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.52 4.674c.3.921-.755 1.688-1.54 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976-2.888c-.784.57-1.838-.197-1.539-1.118l1.52-4.674a1 1 0 00-.363-1.118L2.98 9.11c-.783-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.52-4.674z" /></svg>;
const CalendarIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>;

// --- Sub-components ---

const ProfileHeader: React.FC<{ servant: Servant }> = ({ servant }) => (
    <div className="bg-gradient-to-br from-indigo-50 to-white dark:from-slate-800/50 dark:to-slate-900 rounded-t-2xl p-6 shadow-sm border-b border-gray-200 dark:border-slate-700 flex flex-col sm:flex-row items-center gap-6 text-center sm:text-right flex-shrink-0">
        <div className="relative flex-shrink-0">
            <img
                src={servant.avatarUrl || 'https://i.postimg.cc/9XJjqvFn/tsmym-bdwn-ʿnwan.png'}
                alt={`صورة ${servant.name}`}
                className="w-28 h-28 rounded-full object-cover border-4 border-white dark:border-slate-600 shadow-lg"
            />
        </div>
        <div className="flex-grow">
            <h2 className="text-3xl font-bold text-indigo-800 dark:text-indigo-300" style={{ fontFamily: "'El Messiri', sans-serif" }}>{servant.name}</h2>
            <div className="flex flex-col sm:flex-row sm:items-center gap-x-4 gap-y-2 mt-3 justify-center sm:justify-start">
                <div className="flex items-center gap-2 bg-indigo-100 text-indigo-800 px-3 py-1.5 rounded-full text-sm font-semibold self-center">
                    <IdCardIcon />
                    <span>الكود: {servant.code}</span>
                </div>
                {servant.mobileNumber && (
                     <div className="flex items-center gap-2 bg-slate-100 dark:bg-slate-700 text-slate-800 dark:text-slate-200 px-3 py-1.5 rounded-full text-sm font-semibold self-center">
                        <PhoneIcon />
                        <span>{servant.mobileNumber}</span>
                    </div>
                )}
            </div>
            <div className="mt-4 flex flex-wrap items-center justify-center sm:justify-start gap-2">
                <BriefcaseIcon />
                {(servant.allServices && servant.allServices.length > 0 ? servant.allServices : [servant.primaryService]).filter(Boolean).map(service => (
                    <span key={service} className="bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 px-3 py-1 text-xs font-semibold rounded-full">
                        {service}
                    </span>
                ))}
            </div>
        </div>
    </div>
);

interface StatCardProps { icon: React.ReactNode; title: string; value: string; color: string; }
const StatCard: React.FC<StatCardProps> = ({ icon, title, value, color }) => (
    <div className="bg-white dark:bg-slate-800 rounded-xl p-5 shadow-sm border border-gray-200/80 dark:border-slate-700 flex items-center gap-4">
        <div className={`rounded-full p-3 ${color}`}>{icon}</div>
        <div>
            <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">{title}</p>
            <p className="text-2xl font-bold text-gray-800 dark:text-gray-200">{value}</p>
        </div>
    </div>
);

const ProfileStats: React.FC<{ results: CourseResult[], evaluations: Evaluation[] }> = ({ results, evaluations }) => {
    const stats = useMemo(() => {
        const attendedResults = results.filter((r): r is CourseResult & { score: number } => typeof r.score === 'number');
        const avgScore = attendedResults.length > 0 ? Math.round(attendedResults.reduce((sum: number, r) => sum + r.score, 0) / attendedResults.length) : 0;
        const avgAttendance = results.length > 0 ? Math.round(results.reduce((sum: number, r) => {
            const attendanceValue = typeof r.attendance === 'number' ? r.attendance : 0;
            const normalized = attendanceValue <= 1 ? attendanceValue * 100 : attendanceValue;
            return sum + normalized;
        }, 0) / results.length) : 0;
        const avgEvaluation = evaluations.length > 0 ? Math.round(evaluations.reduce((sum: number, e) => sum + e.overallAverage, 0) / evaluations.length) : 0;
        return { avgScore, avgAttendance, avgEvaluation };
    }, [results, evaluations]);

    return (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 my-6 px-6 flex-shrink-0">
            <StatCard icon={<StarIcon />} title="متوسط الدرجات" value={`${stats.avgScore}/100`} color="bg-yellow-100 text-yellow-600" />
            <StatCard icon={<CalendarIcon />} title="متوسط الحضور" value={`${stats.avgAttendance}%`} color="bg-green-100 text-green-600" />
            <StatCard icon={<ClipboardCheckIcon />} title="متوسط التقييم" value={`${stats.avgEvaluation}%`} color="bg-sky-100 text-sky-600" />
        </div>
    );
};

const evaluationAxes = {
    spiritualLife: "الحياة الروحية",
    commitment: "الالتزام",
    preparationAndDelivery: "التحضير والأداء",
    relationshipWithPeers: "العلاقة بالخدام",
    relationshipWithCongregation: "العلاقة بالمخدومين",
    personalGrowth: "النمو الشخصي",
};

const RadarChart: React.FC<{ scores: Evaluation['scores'] }> = ({ scores }) => {
    const size = 150;
    const center = size / 2;
    const labels = Object.values(evaluationAxes);
    const dataPoints = Object.values(scores) as number[];
    const numAxes = labels.length;

    const points = dataPoints.map((value, i) => {
        const angle = (Math.PI / 2) - (2 * Math.PI * i) / numAxes;
        const x = center + (center * 0.8 * (value / 100) * Math.cos(angle));
        const y = center - (center * 0.8 * (value / 100) * Math.sin(angle));
        return `${x},${y}`;
    }).join(' ');

    return (
        <svg viewBox={`0 0 ${size} ${size}`} className="w-full h-full">
            <defs>
                <linearGradient id="radarGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" style={{ stopColor: "rgba(var(--color-primary-rgb), 0.5)" }} />
                    <stop offset="100%" style={{ stopColor: "rgba(var(--color-primary-accent-rgb), 0.5)" }} />
                </linearGradient>
            </defs>
            {/* Grid lines and labels */}
            {labels.map((label, i) => {
                const angle = (Math.PI / 2) - (2 * Math.PI * i) / numAxes;
                const x1 = center;
                const y1 = center;
                const x2 = center + (center * 0.9 * Math.cos(angle));
                const y2 = center - (center * 0.9 * Math.sin(angle));
                const labelX = center + (center * 1.1 * Math.cos(angle));
                const labelY = center - (center * 1.1 * Math.sin(angle));

                return (
                    <g key={i}>
                        <line x1={x1} y1={y1} x2={x2} y2={y2} stroke="rgba(156, 163, 175, 0.3)" strokeWidth="0.5" />
                        <text x={labelX} y={labelY} fontSize="6" textAnchor="middle" alignmentBaseline="middle" className="fill-current text-gray-500 dark:text-gray-400 font-semibold">{label}</text>
                    </g>
                )
            })}
             {[0.25, 0.5, 0.75, 1].map((radius, i) => (
                <polygon key={i} points={labels.map((_, j) => {
                    const angle = (Math.PI/2) - (2 * Math.PI * j) / numAxes;
                    const x = center + center * 0.8 * radius * Math.cos(angle);
                    const y = center - center * 0.8 * radius * Math.sin(angle);
                    return `${x},${y}`;
                }).join(' ')} fill="none" stroke="rgba(156, 163, 175, 0.3)" strokeWidth="0.5" />
            ))}

            {/* Data Polygon */}
            <polygon points={points} fill="url(#radarGradient)" stroke="rgb(var(--color-primary-rgb))" strokeWidth="1.5" />
        </svg>
    );
};


const EvaluationCard: React.FC<{ evaluation: Evaluation }> = ({ evaluation }) => {
    const [isExpanded, setIsExpanded] = useState(false);
    const { overallAverage, scores } = evaluation;
    const strokeWidth = 8;
    const radius = 40;
    const circumference = 2 * Math.PI * radius;
    const progress = (overallAverage / 100) * circumference;

    return (
        <div className="border border-gray-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 shadow-sm transition-all duration-300">
            <div className="p-4 flex items-center gap-4 cursor-pointer" onClick={() => setIsExpanded(!isExpanded)}>
                <div className="relative w-24 h-24 flex-shrink-0">
                     <svg className="w-full h-full" viewBox="0 0 100 100">
                        <circle className="text-gray-200 dark:text-slate-700" strokeWidth={strokeWidth} stroke="currentColor" fill="transparent" r={radius} cx="50" cy="50" />
                        <circle
                            className="text-indigo-500"
                            strokeWidth={strokeWidth}
                            strokeLinecap="round"
                            stroke="currentColor"
                            fill="transparent"
                            r={radius}
                            cx="50"
                            cy="50"
                            style={{ strokeDasharray: circumference, strokeDashoffset: circumference - progress, transition: 'stroke-dashoffset 0.5s ease-out' }}
                            transform="rotate(-90 50 50)"
                        />
                        <text x="50" y="52" className="font-bold text-2xl text-indigo-800 dark:text-indigo-300" textAnchor="middle" alignmentBaseline="middle">{Math.round(overallAverage)}%</text>
                    </svg>
                </div>
                <div className="flex-grow">
                     <div className="flex justify-between items-start">
                        <h4 className="font-semibold text-slate-800 dark:text-slate-200">{evaluation.serviceName}</h4>
                        <span className="text-sm font-medium bg-indigo-100 text-indigo-800 px-2 py-0.5 rounded-full">{evaluation.year}</span>
                    </div>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">المُقيِّم: {evaluation.evaluatorName}</p>
                </div>
                <svg xmlns="http://www.w3.org/2000/svg" className={`h-5 w-5 text-gray-400 transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
            </div>
            {isExpanded && (
                 <div className="p-4 border-t border-gray-200 dark:border-slate-700 animate-fade-in-up grid grid-cols-1 md:grid-cols-2 gap-4">
                     <div className="flex items-center justify-center">
                         <RadarChart scores={scores} />
                     </div>
                    <div className="space-y-3">
                        {Object.entries(scores).map(([key, value]) => (
                            <div key={key}>
                                <div className="flex justify-between items-center mb-1 text-sm">
                                    <span className="font-medium text-gray-700 dark:text-gray-300">{evaluationAxes[key as keyof typeof evaluationAxes]}</span>
                                    <span className="font-semibold text-indigo-700 dark:text-indigo-300">{value}%</span>
                                </div>
                                <div className="w-full bg-gray-200 dark:bg-slate-700 rounded-full h-2">
                                    <div className="bg-indigo-500 h-2 rounded-full" style={{ width: `${value}%` }}></div>
                                </div>
                            </div>
                        ))}
                    </div>
                     {evaluation.generalNotes && <p className="md:col-span-2 text-sm text-slate-600 dark:text-slate-300 italic border-r-2 border-gray-200 dark:border-slate-600 pr-2 mt-4">"{evaluation.generalNotes}"</p>}
                </div>
            )}
        </div>
    );
};


// --- Main Component ---
interface ServantProfileModalProps { servant: Servant; onClose: () => void; }
const RESULTS_PAGE_SIZE = 10;

const ServantProfileModal: React.FC<ServantProfileModalProps> = ({ servant, onClose }) => {
    const [results, setResults] = useState<CourseResult[]>([]);
    const [evaluations, setEvaluations] = useState<Evaluation[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');
    const [activeTab, setActiveTab] = useState('evaluations');
    const [resultsCurrentPage, setResultsCurrentPage] = useState(1);

    useEffect(() => {
        document.body.style.overflow = 'hidden';
        
        const fetchData = async () => {
            setIsLoading(true); setError('');
            try {
                const servantCode = servant.code;
                const servantCodeAsNumber = parseInt(servant.code, 10);
                
                const resultsQuery = db.collection("courseResults").where("servantCode", "in", [servantCode, servantCodeAsNumber]);
                const resultsSnapshot = await resultsQuery.get();
                const fetchedResults = resultsSnapshot.docs.map(doc => doc.data() as CourseResult);
                
                const evaluationsQuery = db.collection("evaluations").where("servantCode", "in", [servantCode, servantCodeAsNumber]);
                const evaluationsSnapshot = await evaluationsQuery.get();
                const fetchedEvals = evaluationsSnapshot.docs.map(doc => {
                    const data = doc.data() as any; // Treat as any to inspect properties
                    // If it has the new structure, use it as is.
                    if (data.scores && typeof data.overallAverage === 'number') {
                        return { id: doc.id, ...data } as Evaluation;
                    }

                    // Otherwise, it's the old structure. Convert it.
                    // Old rating was 1-5 stars. Convert to a percentage.
                    const rating = data.rating || 0;
                    const overallAverage = rating * 20;

                    // Create a synthetic `scores` object. All axes will reflect the overall score.
                    const scores: Evaluation['scores'] = {
                        spiritualLife: overallAverage,
                        commitment: overallAverage,
                        preparationAndDelivery: overallAverage,
                        relationshipWithPeers: overallAverage,
                        relationshipWithCongregation: overallAverage,
                        personalGrowth: overallAverage,
                    };

                    const convertedEvaluation: Evaluation = {
                        id: doc.id,
                        servantCode: data.servantCode,
                        serviceName: data.serviceName,
                        year: data.year,
                        evaluatorName: data.evaluatorName,
                        scores: scores,
                        overallAverage: overallAverage,
                        generalNotes: data.notes, // Map old `notes` to `generalNotes`
                    };
                    return convertedEvaluation;
                });


                setResults(fetchedResults.sort((a, b) => b.year - a.year));
                setEvaluations(fetchedEvals.sort((a, b) => b.year - a.year));
            } catch (err) {
                console.error("Error fetching servant history:", err);
                setError("حدث خطأ أثناء تحميل سجل الخادم.");
            } finally {
                setIsLoading(false);
            }
        };

        fetchData();
        return () => { document.body.style.overflow = 'unset'; };
    }, [servant.code]);

    const resultsPageCount = Math.ceil(results.length / RESULTS_PAGE_SIZE);
    const paginatedResults = useMemo(() => {
        const startIndex = (resultsCurrentPage - 1) * RESULTS_PAGE_SIZE;
        return results.slice(startIndex, startIndex + RESULTS_PAGE_SIZE);
    }, [results, resultsCurrentPage]);

    const renderTabContent = () => {
        switch (activeTab) {
            case 'results':
                return (
                    <div className="animate-fade-in-up">
                        {results.length > 0 ? (
                            <div className="border border-gray-200 dark:border-slate-700 rounded-lg overflow-hidden shadow-sm">
                                <table className="min-w-full divide-y divide-gray-200 dark:divide-slate-700 text-sm">
                                    <thead className="bg-gray-50 dark:bg-slate-700"><tr>
                                        <th className="px-4 py-2 text-right font-medium text-gray-500 dark:text-gray-300">الكورس</th>
                                        <th className="px-4 py-2 text-right font-medium text-gray-500 dark:text-gray-300">السنة</th>
                                        <th className="px-4 py-2 text-right font-medium text-gray-500 dark:text-gray-300">الدرجة</th>
                                        <th className="px-4 py-2 text-right font-medium text-gray-500 dark:text-gray-300">الحضور</th>
                                    </tr></thead>
                                    <tbody className="bg-white dark:bg-slate-800 divide-y divide-gray-200 dark:divide-slate-700">
                                        {paginatedResults.map((res, i) => (
                                            <tr key={i}>
                                                <td className="px-4 py-2 font-medium text-slate-800 dark:text-slate-200">{res.courseName}</td>
                                                <td className="px-4 py-2 text-slate-600 dark:text-slate-400">{res.year}</td>
                                                <td className={`px-4 py-2 font-semibold ${res.score === 'غائب' ? 'text-red-500' : 'text-slate-800 dark:text-slate-200'}`}>{res.score}</td>
                                                <td className="px-4 py-2 text-slate-600 dark:text-slate-400">{typeof res.attendance === 'number' ? `${Math.round(res.attendance <= 1 ? res.attendance * 100 : res.attendance)}%` : '-'}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                                {resultsPageCount > 1 && (
                                    <div className="flex items-center justify-end gap-2 border-t border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-4 py-3">
                                        <button onClick={() => setResultsCurrentPage(p => Math.max(1, p - 1))} disabled={resultsCurrentPage === 1} className="relative inline-flex items-center rounded-md border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 px-3 py-1 text-xs font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-slate-600 disabled:opacity-50">السابق</button>
                                        <span className="text-xs text-gray-700 dark:text-gray-300">صفحة {resultsCurrentPage} من {resultsPageCount}</span>
                                        <button onClick={() => setResultsCurrentPage(p => Math.min(resultsPageCount, p + 1))} disabled={resultsCurrentPage === resultsPageCount} className="relative inline-flex items-center rounded-md border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 px-3 py-1 text-xs font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-slate-600 disabled:opacity-50">التالي</button>
                                    </div>
                                )}
                            </div>
                        ) : <p className="text-slate-500 dark:text-slate-400 bg-gray-100 dark:bg-slate-800 p-4 rounded-md text-center">لا يوجد سجل كورسات لهذا الخادم.</p>}
                    </div>
                );
            case 'evaluations':
                 return (
                    <div className="animate-fade-in-up space-y-4">
                        {evaluations.length > 0 ? evaluations.map((ev) => (
                            <EvaluationCard key={ev.id} evaluation={ev} />
                        )) : <p className="text-slate-500 dark:text-slate-400 bg-gray-100 dark:bg-slate-800 p-4 rounded-md text-center">لا يوجد سجل تقييمات لهذا الخادم.</p>}
                    </div>
                );
            default: return null;
        }
    };

    return createPortal(
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50" onClick={onClose}>
            <div className="bg-gray-50 dark:bg-slate-900 rounded-2xl shadow-xl w-full max-w-4xl m-4 flex flex-col h-[90vh] animate-fade-in-up" onClick={e => e.stopPropagation()}>
                <main className="flex-grow flex flex-col overflow-hidden">
                    <ProfileHeader servant={servant} />

                    <div className="flex-grow overflow-y-auto">
                        {isLoading ? (
                            <div className="flex justify-center items-center h-full"><LoadingSpinner /></div>
                        ) : error ? (
                            <p className="text-center text-red-500 py-10">{error}</p>
                        ) : (
                            <>
                                <ProfileStats results={results} evaluations={evaluations} />
        
                                <div className="border-b border-gray-200 dark:border-slate-700 px-6">
                                    <nav className="-mb-px flex justify-center gap-x-6 sm:gap-x-8" aria-label="Tabs">
                                         <button onClick={() => setActiveTab('evaluations')} className={`flex items-center gap-2 whitespace-nowrap py-4 px-1 border-b-4 font-semibold text-base transition-colors ${activeTab === 'evaluations' ? 'border-indigo-500 text-indigo-600' : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:border-gray-300 dark:hover:border-slate-600'}`}>
                                            <ClipboardCheckIcon /> سجل التقييمات
                                        </button>
                                        <button onClick={() => setActiveTab('results')} className={`flex items-center gap-2 whitespace-nowrap py-4 px-1 border-b-4 font-semibold text-base transition-colors ${activeTab === 'results' ? 'border-indigo-500 text-indigo-600' : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:border-gray-300 dark:hover:border-slate-600'}`}>
                                            <GraduationCapIcon /> سجل الكورسات
                                        </button>
                                    </nav>
                                </div>
        
                                <div className="p-6">
                                    {renderTabContent()}
                                </div>
                            </>
                        )}
                    </div>
                </main>

                <footer className="flex-shrink-0 text-center border-t border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-4 rounded-b-2xl">
                     <button onClick={onClose} className="px-6 py-3 bg-gray-100 dark:bg-slate-700 text-slate-600 dark:text-slate-200 font-semibold rounded-lg hover:bg-gray-200 dark:hover:bg-slate-600 focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-opacity-75 transition-all duration-300 transform hover:scale-105 flex items-center justify-center gap-2 mx-auto">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                        <span>إغلاق</span>
                    </button>
                </footer>
            </div>
        </div>,
        document.body
    );
};

export default ServantProfileModal;