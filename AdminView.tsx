
import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { db } from './firebaseConfig';
import { read, utils, writeFile } from 'xlsx';
import type { StudentResult, Servant, CourseResult, Evaluation } from './types';
import type { CertificateTexts, CustomStyles } from './App';
import { AIChatView } from './AIChatView';
import DetailsModal from './DetailsModal';
import SettingsView from './SettingsView';
import DataManagementView from './DataManagementView';
import CourseResultsDataView from './CourseResultsDataView';
import ExcelImportEvaluationsView from './ExcelImportEvaluationsView';
import GeneralSettingsView from './GeneralSettingsView';
import ConfirmationModal from './ConfirmationModal';
import ServantProfileModal from './ServantProfileModal';
import UsageStatsView from './UsageStatsView';


// --- SVG Icons ---
const HamburgerIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" /></svg>;
const CloseIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>;
const UsersIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M15 21v-1a6 6 0 00-1.78-4.125" /></svg>;
const ChartBarIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>;
const DocumentTextIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>;
const GraduationCapIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 14l9-5-9-5-9 5 9 5z" /><path strokeLinecap="round" strokeLinejoin="round" d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z" /><path strokeLinecap="round" strokeLinejoin="round" d="M12 14v6m-4-3v3m8-3v3" /></svg>;
const ClipboardCheckIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" /></svg>;
const SparklesIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M5 3v4M3 5h4M6.343 17.657l-2.828 2.828m14.142-14.142l2.828 2.828m-12.728 0l2.828-2.828m0 0l2.828 2.828M3 12a9 9 0 1118 0 9 9 0 01-18 0z" /></svg>;
const CogIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066 2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>;
const LogoutIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>;
const CheckCircleIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>;
const XCircleIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>;
const StarIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.52 4.674c.3.921-.755 1.688-1.54 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976-2.888c-.784.57-1.838-.197-1.539-1.118l1.52-4.674a1 1 0 00-.363-1.118L2.98 9.11c-.783-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.52-4.674z" /></svg>;
const CalendarIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>;
const TrophyIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M12 6V3m0 18v-3m6-9h-2m-4 0H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>;
const CourseIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" /></svg>;
const PaletteIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" /></svg>;
const TrendingUpIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" /></svg>;
const CameraIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" /></svg>;
const ExcelIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 24 24" fill="currentColor"><path d="M21.16,3.16a.5.5,0,0,0-.57-.16l-18,4A.5.5,0,0,0,2.5,8v8a.5.5,0,0,0,.16.37.5.5,0,0,0,.38.13l18,4a.5.5,0,0,0,.57-.6V3.5A.5.5,0,0,0,21.16,3.16ZM11,12.1,7.26,14.28,3.5,12.5,7.1,10.59Zm8.5,3.31-3.6-1.74,3.6-1.92ZM18,7.91,14.25,10,11,8.1,14.65,6Z"/></svg>;


const normalizeMobile = (num: string | number): string => String(num || '').trim().startsWith('0') ? String(num).substring(1) : String(num);
interface StatCardProps { icon: React.ReactNode; title: string; value: string | number; unit?: string; color: string; description?: string; onClick?: () => void; }
const StatCard: React.FC<StatCardProps> = ({ icon, title, value, unit, color, description, onClick }) => (
    <div onClick={onClick} className={`bg-white dark:bg-slate-800 rounded-xl p-6 shadow-md border border-gray-200/80 dark:border-slate-700 flex flex-col justify-between hover:shadow-lg hover:-translate-y-1 transition-all duration-300 ${onClick ? 'cursor-pointer' : ''}`}>
        <div className="flex items-center gap-4">
            <div className={`rounded-full p-3 ${color}`}>{icon}</div>
            <div>
                <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">{title}</p>
                <p className="text-2xl font-bold text-gray-800 dark:text-gray-200">{value}<span className="text-lg font-normal text-gray-600 dark:text-gray-300">{unit}</span></p>
            </div>
        </div>
        {description && <p className="text-xs text-gray-400 dark:text-gray-500 mt-2">{description}</p>}
    </div>
);
const HorizontalBarChart: React.FC<{ title: string; data: Record<string, number>; colors: Record<string, string>; total: number; unit?: string; icon: React.ReactNode; onBarClick?: (label: string) => void; }> = ({ title, data, colors, total, unit = 'خدام', icon, onBarClick }) => (
    <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-md border border-gray-200/80 dark:border-slate-700 h-full">
        <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-4 flex items-center gap-2">{icon} {title}</h3>
        <div className="space-y-4">
            {Object.entries(data).map(([label, count]) => {
                if (count === 0) return null;
                const percentage = total > 0 ? (Number(count) / total) * 100 : 0;
                return (
                    <div key={label} className={`group ${onBarClick ? 'cursor-pointer' : ''}`} onClick={() => onBarClick?.(label)}>
                        <div className="flex justify-between items-center mb-1 text-sm">
                            <span className="font-medium text-gray-700 dark:text-gray-300">{label}</span>
                            <span className="font-semibold text-gray-600 dark:text-gray-400 group-hover:text-[rgb(var(--color-primary-dark-text-rgb))] transition-colors">{count} {unit}</span>
                        </div>
                        <div className="w-full bg-gray-200 dark:bg-slate-700 rounded-full h-2.5">
                            <div className={`${colors[label]} h-2.5 rounded-full transition-all duration-500 ease-out`} style={{ width: `${percentage}%` }}></div>
                        </div>
                    </div>
                );
            })}
        </div>
    </div>
);

interface AdminViewProps {
    onLogout: () => void;
    certificateTexts: CertificateTexts;
    setCertificateTexts: React.Dispatch<React.SetStateAction<CertificateTexts>>;
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

const AdminView: React.FC<AdminViewProps> = ({ onLogout, certificateTexts, setCertificateTexts, setTheme, isDarkMode, setIsDarkMode, customStyles, setCustomStyles, setBackgroundUrl, backgroundUrl, backgroundGallery, setBackgroundGallery }) => {
    const [courseRegistrations, setCourseRegistrations] = useState<StudentResult[]>([]);
    // New states for full data access in AI Chat
    const [rawServants, setRawServants] = useState<Servant[]>([]);
    const [rawResults, setRawResults] = useState<CourseResult[]>([]);
    const [rawEvaluations, setRawEvaluations] = useState<Evaluation[]>([]);

    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [error, setError] = useState<string>('');
    const [searchTerm, setSearchTerm] = useState<string>('');
    const [activeTab, setActiveTab] = useState('info');
    const [selectedCourses, setSelectedCourses] = useState<string[]>([]);
    const [isCourseDropdownOpen, setIsCourseDropdownOpen] = useState(false);
    const courseFilterRef = useRef<HTMLDivElement>(null);
    const [selectedServices, setSelectedServices] = useState<string[]>([]);
    const [isServiceDropdownOpen, setIsServiceDropdownOpen] = useState(false);
    const serviceFilterRef = useRef<HTMLDivElement>(null);
    const [modalData, setModalData] = useState<{ title: string; students: StudentResult[] } | null>(null);
    
    // Mobile sidebar state
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    
    // Global search state
    const [globalSearchTerm, setGlobalSearchTerm] = useState('');
    const [globalSearchResults, setGlobalSearchResults] = useState<Servant[]>([]);
    const [isGlobalSearchFocused, setIsGlobalSearchFocused] = useState(false);
    const [servantToView, setServantToView] = useState<Servant | null>(null);
    const globalSearchRef = useRef<HTMLDivElement>(null);

    // Export states
    const dashboardRef = useRef<HTMLDivElement>(null);
    const [isExportingImage, setIsExportingImage] = useState(false);
    const [isExportingAll, setIsExportingAll] = useState(false);

    useEffect(() => {
        const fetchStudents = async () => {
            setIsLoading(true); setError('');
            try {
                const servantsSnapshot = await db.collection("servants").get();
                const resultsSnapshot = await db.collection("courseResults").get();
                const evaluationsSnapshot = await db.collection("evaluations").get();
                
                const servantsMap = new Map<string, Servant>();
                const servantsList: Servant[] = [];
                servantsSnapshot.forEach(doc => { 
                    const servant = { ...doc.data(), code: doc.id } as Servant; 
                    servantsMap.set(doc.id, servant);
                    servantsList.push(servant);
                });
                
                const resultsList: CourseResult[] = [];
                // Group results by servant to de-duplicate per servant
                const resultsByServant = new Map<string, CourseResult[]>();
                resultsSnapshot.forEach(doc => {
                    const result = doc.data() as CourseResult;
                    resultsList.push(result);
                    const servantCode = String(result.servantCode);
                    if (!resultsByServant.has(servantCode)) {
                        resultsByServant.set(servantCode, []);
                    }
                    resultsByServant.get(servantCode)!.push(result);
                });

                const evaluationsList: Evaluation[] = [];
                evaluationsSnapshot.forEach(doc => {
                    const data = doc.data();
                    // Basic normalization if needed, similar to other components
                    if (data.scores) {
                        evaluationsList.push({ id: doc.id, ...data } as Evaluation);
                    } else {
                        // Handle old format
                        const rating = data.rating || 0;
                        const overallAverage = rating * 20;
                        evaluationsList.push({
                            id: doc.id,
                            servantCode: data.servantCode,
                            serviceName: data.serviceName,
                            year: data.year,
                            evaluatorName: data.evaluatorName,
                            scores: {
                                spiritualLife: overallAverage,
                                commitment: overallAverage,
                                preparationAndDelivery: overallAverage,
                                relationshipWithPeers: overallAverage,
                                relationshipWithCongregation: overallAverage,
                                personalGrowth: overallAverage,
                            },
                            overallAverage,
                            generalNotes: data.notes
                        } as Evaluation);
                    }
                });

                setRawServants(servantsList);
                setRawResults(resultsList);
                setRawEvaluations(evaluationsList);

                const allDeDupedResults: CourseResult[] = [];
                for (const servantResults of resultsByServant.values()) {
                    const uniqueResultsMap = new Map<string, CourseResult>();
                    for (const result of servantResults) {
                        const key = `${result.courseName}|${result.year}`;
                        const existingResult = uniqueResultsMap.get(key);

                        if (!existingResult) {
                            uniqueResultsMap.set(key, result);
                        } else {
                            const existingScore = existingResult.score === 'غائب' ? -1 : existingResult.score as number;
                            const newScore = result.score === 'غائب' ? -1 : result.score as number;
                            if (newScore > existingScore) {
                                uniqueResultsMap.set(key, result);
                            }
                        }
                    }
                    allDeDupedResults.push(...Array.from(uniqueResultsMap.values()));
                }

                const registrationsList: StudentResult[] = [];
                allDeDupedResults.forEach(result => {
                    const servantCode = String(result.servantCode); 
                    const servant = servantsMap.get(servantCode);
                    if (servant) { 
                        registrationsList.push({ 
                            code: servant.code, 
                            name: servant.name || 'اسم غير متوفر', 
                            mobileNumber: servant.mobileNumber || 'غير متوفر', 
                            service: (Array.isArray(servant.allServices) && servant.allServices.length > 0) ? servant.allServices.join(' / ') : servant.primaryService || 'خدمة غير محددة', 
                            courseName: result.courseName || 'كورس غير مسمى', 
                            score: result.score ?? 'غائب', 
                            attendance: result.attendance || 0, 
                        }); 
                    }
                });
                setCourseRegistrations(registrationsList);
            } catch (err: any) { console.error("Error fetching students:", err); if (err.message.includes("permission-denied") || err.message.includes("insufficient permissions")) { setError('خطأ في الأذونات: تأكد من تحديث قواعد أمان Firestore للسماح بقراءة البيانات.'); } else { setError('حدث خطأ أثناء جلب بيانات الخدام. يرجى المحاولة مرة أخرى.'); }
            } finally { setIsLoading(false); }
        };
        fetchStudents();
    }, []);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (globalSearchRef.current && !globalSearchRef.current.contains(event.target as Node)) {
                setIsGlobalSearchFocused(false);
            }
             if (courseFilterRef.current && !courseFilterRef.current.contains(event.target as Node)) {
                setIsCourseDropdownOpen(false);
            }
            if (serviceFilterRef.current && !serviceFilterRef.current.contains(event.target as Node)) {
                setIsServiceDropdownOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    // --- Global Search Logic ---
    const uniqueServants = useMemo(() => {
        const servantsMap = new Map<string, Servant>();
        courseRegistrations.forEach(reg => {
            if (!servantsMap.has(reg.code)) {
                servantsMap.set(reg.code, {
                    code: reg.code,
                    name: reg.name,
                    mobileNumber: reg.mobileNumber,
                    primaryService: reg.service.split(' / ')[0] || '',
                    allServices: reg.service.split(' / ').map(s => s.trim()).filter(Boolean)
                });
            }
        });
        return Array.from(servantsMap.values());
    }, [courseRegistrations]);
    
    useEffect(() => {
        if (globalSearchTerm.trim()) {
            const lowercasedFilter = globalSearchTerm.toLowerCase().trim();
            const results = uniqueServants.filter(servant => 
                servant.name.toLowerCase().includes(lowercasedFilter) || 
                servant.code.toLowerCase().includes(lowercasedFilter)
            ).slice(0, 7); // Limit to 7 results
            setGlobalSearchResults(results);
        } else {
            setGlobalSearchResults([]);
        }
    }, [globalSearchTerm, uniqueServants]);

    const handleSelectServantFromSearch = (servant: Servant) => {
        setServantToView(servant);
        setGlobalSearchTerm('');
        setGlobalSearchResults([]);
        setIsGlobalSearchFocused(false);
    };


    const courses = useMemo(() => { if (courseRegistrations.length === 0) return []; const courseSet = new Set(courseRegistrations.map(s => s.courseName.trim()).filter(Boolean)); return ['الكل', ...Array.from(courseSet).sort()]; }, [courseRegistrations]);
    const services = useMemo(() => { if (courseRegistrations.length === 0) return []; const serviceSet = new Set<string>(); courseRegistrations.forEach(s => { s.service.split(' / ').forEach(service => { if(service.trim()) serviceSet.add(service.trim()); }); }); return ['الكل', ...Array.from(serviceSet).sort()]; }, [courseRegistrations]);
    
    // Set default filter to all
    useEffect(() => {
        if (courses.length > 1) setSelectedCourses(['الكل']);
        if (services.length > 1) setSelectedServices(['الكل']);
    }, [courses.length, services.length]);
    
    const handleCourseChange = (course: string) => {
        setSelectedCourses(prev => {
            const allIndividualCourses = courses.filter(c => c !== 'الكل');
            
            if (course === 'الكل') {
                return prev.includes('الكل') ? [] : courses;
            }

            let newSelection = new Set(prev.filter(c => c !== 'الكل'));
            if (newSelection.has(course)) {
                newSelection.delete(course);
            } else {
                newSelection.add(course);
            }
            
            if (newSelection.size === allIndividualCourses.length) {
                return courses;
            }

            return Array.from(newSelection);
        });
    };

    const handleServiceChange = (service: string) => {
        setSelectedServices(prev => {
            const allIndividualServices = services.filter(s => s !== 'الكل');
            
            if (service === 'الكل') {
                return prev.includes('الكل') ? [] : services;
            }

            let newSelection = new Set(prev.filter(s => s !== 'الكل'));
            if (newSelection.has(service)) {
                newSelection.delete(service);
            } else {
                newSelection.add(service);
            }

            if (newSelection.size === allIndividualServices.length) {
                return services;
            }

            return Array.from(newSelection);
        });
    };

    const stats = useMemo(() => {
        if (courseRegistrations.length === 0) return null;
        
        const isCourseFilterActive = !selectedCourses.includes('الكل');
        const isServiceFilterActive = !selectedServices.includes('الكل');
        
        let dataForStats = courseRegistrations;

        if(selectedCourses.length === 0 || selectedServices.length === 0) {
            dataForStats = [];
        } else {
            if (isCourseFilterActive) {
                const courseSet = new Set(selectedCourses);
                dataForStats = dataForStats.filter(s => courseSet.has(s.courseName.trim()));
            }
    
            if (isServiceFilterActive) {
                const serviceSet = new Set(selectedServices);
                dataForStats = dataForStats.filter(s => {
                    const studentServices = s.service.split(' / ').map(serv => serv.trim());
                    return studentServices.some(ss => serviceSet.has(ss));
                });
            }
        }
        
        const totalUniqueInDB = new Set(courseRegistrations.map(s => s.code)).size; const uniquePeopleCount = new Set(dataForStats.map(s => s.code)).size;
        const absentStudents = dataForStats.filter(s => s.score === 'غائب'); const presentStudents = dataForStats.filter((s): s is StudentResult & { score: number } => typeof s.score === 'number');
        const totalRegistrationsInFilter = dataForStats.length; const absent = absentStudents.length; const present = presentStudents.length;
        const totalScore = presentStudents.reduce((sum, s) => sum + s.score, 0); const avgScore = present > 0 ? Math.round(totalScore / present) : 0;
        const totalAttendance = dataForStats.reduce((sum, s) => { const attendanceValue = typeof s.attendance === 'number' ? s.attendance : 0; const normalized = attendanceValue <= 1 ? attendanceValue * 100 : attendanceValue; return sum + normalized; }, 0);
        const avgAttendance = totalRegistrationsInFilter > 0 ? Math.round(totalAttendance / totalRegistrationsInFilter) : 0;
        const gradeDistributionLists: Record<string, (StudentResult & { score: number })[]> = { 'ممتاز (90+)': presentStudents.filter(s => s.score >= 90), 'جيد جداً (80-89)': presentStudents.filter(s => s.score >= 80 && s.score < 90), 'جيد (70-79)': presentStudents.filter(s => s.score >= 70 && s.score < 80), 'مقبول (60-69)': presentStudents.filter(s => s.score >= 60 && s.score < 70), 'راسب (<60)': presentStudents.filter(s => s.score < 60), };
        const gradeDistributionCounts = Object.fromEntries(Object.entries(gradeDistributionLists).map(([key, value]) => [key, value.length]));
        const attendanceDistributionLists: Record<string, StudentResult[]> = { 'ممتاز (90+%)': dataForStats.filter(s => (s.attendance <= 1 ? s.attendance * 100 : s.attendance) >= 90), 'جيد (75-89%)': dataForStats.filter(s => { const normalized = s.attendance <= 1 ? s.attendance * 100 : s.attendance; return normalized >= 75 && normalized < 90; }), 'مقبول (50-74%)': dataForStats.filter(s => { const normalized = s.attendance <= 1 ? s.attendance * 100 : s.attendance; return normalized >= 50 && normalized < 75; }), 'ضعيف (<50%)': dataForStats.filter(s => (s.attendance <= 1 ? s.attendance * 100 : s.attendance) < 50), };
        const attendanceDistributionCounts = Object.fromEntries(Object.entries(attendanceDistributionLists).map(([key, value]) => [key, value.length]));
        const topPerformersMap = new Map<string, StudentResult & { score: number }>();
        presentStudents.forEach(s => { if (!topPerformersMap.has(s.code) || s.score > topPerformersMap.get(s.code)!.score) { topPerformersMap.set(s.code, s); } });
        const topPerformers = Array.from(topPerformersMap.values()).sort((a, b) => b.score - a.score).slice(0, 5);
        const courseDistributionAllRecords: Record<string, StudentResult[]> = {};
        courseRegistrations.forEach(student => { const course = student.courseName.trim(); if (course) { if (!courseDistributionAllRecords[course]) courseDistributionAllRecords[course] = []; courseDistributionAllRecords[course].push(student); } });
        const sortedCourseDistribution = Object.entries(courseDistributionAllRecords).map(([course, studentList]) => ({ course, count: studentList.length })).sort((a, b) => b.count - a.count).slice(0, 5);
        return { total: uniquePeopleCount, totalUniqueInDB, present, absent, avgScore, avgAttendance, gradeDistribution: gradeDistributionCounts, courseDistribution: sortedCourseDistribution, topPerformers, attendanceDistribution: attendanceDistributionCounts, totalRegistrations: courseRegistrations.length, absentStudents, presentStudents, gradeDistributionLists, attendanceDistributionLists, courseDistributionAllRecords, isFiltered: isCourseFilterActive || isServiceFilterActive, selectedRegistrations: totalRegistrationsInFilter, };
    }, [courseRegistrations, selectedCourses, selectedServices]);

    const handleGradeBarClick = (gradeLabel: string) => {
        if (stats?.gradeDistributionLists[gradeLabel]) {
            setModalData({
                title: `الخدام الحاصلون على تقدير "${gradeLabel}"`,
                students: stats.gradeDistributionLists[gradeLabel],
            });
        }
    };
    
    const handleAttendanceBarClick = (attendanceLabel: string) => {
        if (stats?.attendanceDistributionLists[attendanceLabel]) {
            setModalData({
                title: `الخدام في فئة الحضور "${attendanceLabel}"`,
                students: stats.attendanceDistributionLists[attendanceLabel],
            });
        }
    };

    const handleExportImage = () => {
        if (!dashboardRef.current || !window.html2canvas) return;
        setIsExportingImage(true);
        window.html2canvas(dashboardRef.current, { scale: 2, useCORS: true, backgroundColor: isDarkMode ? '#1e293b' : '#f8fafc' })
          .then(canvas => {
            const link = document.createElement('a');
            link.href = canvas.toDataURL('image/png');
            link.download = 'dashboard.png';
            link.click();
          })
          .catch(err => console.error("Error exporting image:", err))
          .finally(() => setIsExportingImage(false));
    };

    const handleExportAllFiltered = () => {
        if (!stats) return;
        setIsExportingAll(true);
        // @google/genai-ts: Fix: 'isFiltered' was not defined. It should be accessed from the 'stats' object.
        // @google/genai-ts: Fix: Corrected a type error in array concatenation by using the spread operator (...) to merge 'presentStudents' and 'absentStudents', ensuring type compatibility.
        const dataToExport = (stats.isFiltered ? [...stats.presentStudents, ...stats.absentStudents] : courseRegistrations).map(s => ({
            'الكود': s.code,
            'الاسم': s.name,
            'الموبايل': s.mobileNumber,
            'الخدمة': s.service,
            'الكورس': s.courseName,
            'الدرجة': s.score,
            'الحضور': `${Math.round(s.attendance <= 1 ? s.attendance * 100 : s.attendance)}%`
        }));

        const worksheet = utils.json_to_sheet(dataToExport);
        const workbook = utils.book_new();
        utils.book_append_sheet(workbook, worksheet, "Filtered Registrations");
        writeFile(workbook, `filtered_data_${new Date().toISOString().split('T')[0]}.xlsx`);
        setIsExportingAll(false);
    };

    const tabs = [
        { id: 'info', name: 'المعلومات والإحصائيات', icon: <ChartBarIcon /> },
        { id: 'ai_chat', name: 'المساعد الذكي', icon: <SparklesIcon /> },
        { id: 'servants_data', name: 'إدارة الخدام', icon: <UsersIcon /> },
        { id: 'courses_data', name: 'إدارة نتائج الكورسات', icon: <GraduationCapIcon /> },
        { id: 'evaluations_data', name: 'إدارة التقييمات', icon: <ClipboardCheckIcon /> },
        { id: 'usage_stats', name: 'إحصائيات الاستخدام', icon: <TrendingUpIcon /> },
        { id: 'texts_settings', name: 'إعدادات نصوص الشهادة', icon: <DocumentTextIcon /> },
        { id: 'general_settings', name: 'الإعدادات العامة والمظهر', icon: <PaletteIcon /> },
    ];

    const renderContent = () => {
        if (isLoading) {
            return <div className="flex justify-center items-center h-96"><div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-600"></div></div>;
        }
        switch (activeTab) {
            case 'info':
                if (!stats) return <p>لا توجد بيانات كافية لعرض الإحصائيات.</p>;
                const gradeColors = { 'ممتاز (90+)': 'bg-green-500', 'جيد جداً (80-89)': 'bg-sky-500', 'جيد (70-79)': 'bg-yellow-500', 'مقبول (60-69)': 'bg-orange-500', 'راسب (<60)': 'bg-red-500', };
                const attendanceColors = { 'ممتاز (90+%)': 'bg-green-500', 'جيد (75-89%)': 'bg-sky-500', 'مقبول (50-74%)': 'bg-orange-500', 'ضعيف (<50%)': 'bg-red-500', };
                return (
                    <div ref={dashboardRef} className="space-y-8 bg-slate-50 dark:bg-slate-900 p-4 sm:p-6 rounded-lg">
                        <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
                            <div>
                                <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100">لوحة المعلومات</h2>
                                <p className="text-slate-500 dark:text-slate-400 mt-1">نظرة شاملة على أداء الخدام في الكورسات المحددة.</p>
                            </div>
                             <div className="flex items-center gap-2">
                                <button onClick={handleExportImage} disabled={isExportingImage} className="flex items-center px-4 py-2 bg-sky-100 text-sky-800 font-semibold rounded-lg hover:bg-sky-200 disabled:opacity-50 dark:bg-sky-900/50 dark:text-sky-300 dark:hover:bg-sky-900/70">
                                    <CameraIcon /> {isExportingImage ? 'جاري الحفظ...' : 'حفظ كصورة'}
                                </button>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                            <StatCard icon={<UsersIcon />} title="إجمالي الخدام" value={stats.total} unit=" خادم" color="bg-indigo-100 text-indigo-600 dark:bg-indigo-900/50 dark:text-indigo-300" description={`من إجمالي ${stats.totalUniqueInDB} في قاعدة البيانات`} />
                            <StatCard icon={<CheckCircleIcon />} title="الحضور" value={stats.present} unit=" خادم" color="bg-green-100 text-green-600 dark:bg-green-900/50 dark:text-green-300" description={`${stats.selectedRegistrations > 0 ? Math.round((stats.present / stats.selectedRegistrations) * 100) : 0}% من المحدد`} onClick={() => setModalData({ title: 'الخدام الحاضرون', students: stats.presentStudents })}/>
                            <StatCard icon={<XCircleIcon />} title="الغياب" value={stats.absent} unit=" خادم" color="bg-red-100 text-red-600 dark:bg-red-900/50 dark:text-red-300" description={`${stats.selectedRegistrations > 0 ? Math.round((stats.absent / stats.selectedRegistrations) * 100) : 0}% من المحدد`} onClick={() => setModalData({ title: 'الخدام الغائبون', students: stats.absentStudents })}/>
                            <StatCard icon={<TrophyIcon />} title="متوسط الدرجات" value={stats.avgScore} unit="/100" color="bg-yellow-100 text-yellow-600 dark:bg-yellow-900/50 dark:text-yellow-300" description="للخدام الحاضرين فقط"/>
                        </div>

                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            <HorizontalBarChart title="توزيع التقديرات" data={stats.gradeDistribution} colors={gradeColors} total={stats.present} icon={<StarIcon />} onBarClick={handleGradeBarClick} />
                            <HorizontalBarChart title="توزيع الحضور" data={stats.attendanceDistribution} colors={attendanceColors} total={stats.selectedRegistrations} icon={<CalendarIcon />} onBarClick={handleAttendanceBarClick} />
                        </div>
                    </div>
                );
            case 'ai_chat': return <AIChatView servants={rawServants} results={rawResults} evaluations={rawEvaluations} students={courseRegistrations} />;
            case 'servants_data': return <DataManagementView />;
            case 'courses_data': return <CourseResultsDataView />;
            case 'evaluations_data': return <ExcelImportEvaluationsView />;
            case 'texts_settings': return <SettingsView certificateTexts={certificateTexts} setCertificateTexts={setCertificateTexts} />;
            case 'general_settings': return <GeneralSettingsView setTheme={setTheme} isDarkMode={isDarkMode} setIsDarkMode={setIsDarkMode} customStyles={customStyles} setCustomStyles={setCustomStyles} setBackgroundUrl={setBackgroundUrl} backgroundUrl={backgroundUrl} backgroundGallery={backgroundGallery} setBackgroundGallery={setBackgroundGallery} />;
            case 'usage_stats': return <UsageStatsView />;
            default: return null;
        }
    };
    
    return (
        <div className="w-full max-w-7xl mx-auto admin-font bg-slate-50 dark:bg-slate-900 rounded-2xl shadow-2xl border border-black/5 dark:border-white/5 animate-fade-in-up mt-[-2rem] mb-8">
            <div className="flex flex-col lg:flex-row min-h-[80vh]">
                {/* --- Mobile Sidebar Toggle --- */}
                <div className="lg:hidden p-4 flex justify-between items-center border-b border-gray-200 dark:border-slate-700">
                    <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100">لوحة التحكم</h2>
                    <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="p-2 rounded-md hover:bg-gray-100 dark:hover:bg-slate-800">
                        {isSidebarOpen ? <CloseIcon /> : <HamburgerIcon />}
                    </button>
                </div>

                {/* --- Sidebar --- */}
                <aside className={`flex-shrink-0 w-full lg:w-64 bg-white dark:bg-slate-800/50 border-r border-gray-200 dark:border-slate-700/50 rounded-r-2xl lg:rounded-r-none lg:rounded-l-2xl transition-all duration-300 ${isSidebarOpen ? 'block' : 'hidden'} lg:block`}>
                     <div className="p-6">
                        <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100">لوحة التحكم</h2>
                        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">كنيسة القديس بولس</p>
                    </div>
                    <nav className="flex flex-col p-4">
                        {tabs.map(tab => (
                             <button key={tab.id} onClick={() => { setActiveTab(tab.id); setIsSidebarOpen(false); }} className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-semibold transition-colors ${activeTab === tab.id ? 'bg-indigo-50 dark:bg-indigo-500/10 text-indigo-700 dark:text-indigo-300' : 'text-slate-600 dark:text-slate-300 hover:bg-gray-100 dark:hover:bg-slate-700/50'}`}>
                                {tab.icon}
                                <span>{tab.name}</span>
                            </button>
                        ))}
                        <button onClick={onLogout} className="flex items-center gap-3 px-4 py-3 mt-4 rounded-lg text-sm font-semibold text-slate-600 dark:text-slate-300 hover:bg-gray-100 dark:hover:bg-slate-700/50">
                            <LogoutIcon />
                            <span>تسجيل الخروج</span>
                        </button>
                    </nav>
                </aside>
                
                {/* --- Main Content --- */}
                <main className="flex-grow p-4 sm:p-6 lg:p-8">
                    <div className="flex flex-col sm:flex-row justify-between items-start gap-4 mb-6">
                        {/* Global Search */}
                        <div ref={globalSearchRef} className="relative w-full sm:max-w-md">
                            <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none"><svg className="h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg></div>
                            <input type="text" placeholder="بحث سريع عن خادم..." value={globalSearchTerm} onChange={e => setGlobalSearchTerm(e.target.value)} onFocus={() => setIsGlobalSearchFocused(true)} className="w-full px-4 py-2 pr-10 text-gray-700 bg-white dark:bg-slate-800 border border-gray-300 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:text-gray-200"/>
                            {isGlobalSearchFocused && globalSearchResults.length > 0 && (
                                <div className="absolute z-10 top-full mt-2 w-full bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg shadow-xl overflow-hidden">
                                    <ul className="divide-y divide-gray-100 dark:divide-slate-700">
                                        {globalSearchResults.map(servant => (
                                            <li key={servant.code} onClick={() => handleSelectServantFromSearch(servant)} className="px-4 py-3 hover:bg-gray-50 dark:hover:bg-slate-700 cursor-pointer">
                                                <p className="font-semibold text-gray-800 dark:text-gray-200">{servant.name}</p>
                                                <p className="text-sm text-gray-500 dark:text-gray-400">الكود: {servant.code}</p>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            )}
                        </div>
                        {/* Filters for Info Tab */}
                        {activeTab === 'info' && (
                             <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
                                <div ref={courseFilterRef} className="relative w-full sm:w-48">
                                    <button onClick={() => setIsCourseDropdownOpen(!isCourseDropdownOpen)} className="w-full flex justify-between items-center px-4 py-2 bg-white dark:bg-slate-800 border border-gray-300 dark:border-slate-600 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-200">
                                        <span>فلتر الكورسات</span>
                                        <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" /></svg>
                                    </button>
                                    {isCourseDropdownOpen && (
                                         <div className="absolute z-10 top-full mt-2 w-full bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg shadow-xl max-h-60 overflow-y-auto">
                                             {courses.map(course => (
                                                <label key={course} className="flex items-center px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-slate-700 cursor-pointer">
                                                    <input type="checkbox" checked={selectedCourses.includes(course)} onChange={() => handleCourseChange(course)} className="h-4 w-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500" />
                                                    <span className="mr-3">{course}</span>
                                                </label>
                                            ))}
                                        </div>
                                    )}
                                </div>
                                <div ref={serviceFilterRef} className="relative w-full sm:w-48">
                                    <button onClick={() => setIsServiceDropdownOpen(!isServiceDropdownOpen)} className="w-full flex justify-between items-center px-4 py-2 bg-white dark:bg-slate-800 border border-gray-300 dark:border-slate-600 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-200">
                                        <span>فلتر الخدمات</span>
                                        <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" /></svg>
                                    </button>
                                     {isServiceDropdownOpen && (
                                         <div className="absolute z-10 top-full mt-2 w-full bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg shadow-xl max-h-60 overflow-y-auto">
                                             {services.map(service => (
                                                <label key={service} className="flex items-center px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-slate-700 cursor-pointer">
                                                    <input type="checkbox" checked={selectedServices.includes(service)} onChange={() => handleServiceChange(service)} className="h-4 w-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500" />
                                                    <span className="mr-3">{service}</span>
                                                </label>
                                            ))}
                                        </div>
                                    )}
                                </div>
                             </div>
                        )}
                    </div>
                    {renderContent()}
                </main>
            </div>
             {modalData && <DetailsModal title={modalData.title} students={modalData.students} onClose={() => setModalData(null)} />}
             {servantToView && <ServantProfileModal servant={servantToView} onClose={() => setServantToView(null)} />}
        </div>
    );
};

export default AdminView;
