import React, { useState, useMemo, useEffect } from 'react';
import { createPortal } from 'react-dom';
import type { FullStudentProfile, CourseResult } from './types';
import LoadingSpinner from './LoadingSpinner';

// --- SVG Icons ---
const SparklesIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5"><path strokeLinecap="round" strokeLinejoin="round" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0m-7.072 0L3 21m18-9a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>;
const UserCircleIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5.121 17.804A13.937 13.937 0 0112 16c2.5 0 4.847.655 6.879 1.804M15 10a3 3 0 11-6 0 3 3 0 016 0zm6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>;
const IdCardIcon = ({ className = "h-6 w-6" }: { className?: string }) => <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V8a2 2 0 00-2-2h-5m-4 0V5a2 2 0 012-2h2a2 2 0 012 2v1m-4 0h4" /></svg>;
const BriefcaseIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-slate-300 dark:text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>;
const CalendarIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5"><path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>;
const StarIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5"><path strokeLinecap="round" strokeLinejoin="round" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.52 4.674c.3.921-.755 1.688-1.54 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976-2.888c-.784.57-1.838-.197-1.539-1.118l1.52-4.674a1 1 0 00-.363-1.118L2.98 9.11c-.783-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.52-4.674z" /></svg>;
const GraduationCapIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5"><path strokeLinecap="round" strokeLinejoin="round" d="M12 14l9-5-9-5-9 5 9 5z" /><path strokeLinecap="round" strokeLinejoin="round" d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z" /><path strokeLinecap="round" strokeLinejoin="round" d="M12 14v6m-4-3v3m8-3v3" /></svg>;

interface CertificateData {
    name: string;
    service: string;
    courseName: string;
    score: number | 'غائب';
}

interface ResultDisplayProps {
  profile: FullStudentProfile;
  onShowCertificate: (data: CertificateData) => void;
  onGenerateMessage: () => void;
  motivationalMessage: string;
  isMessageLoading: boolean;
  onGenerateAdvice: () => void;
  spiritualAdvice: string;
  isAdviceLoading: boolean;
  onNewSearch: () => void;
  onGenerateSpecialMessage: () => void;
  specialMessage: string;
  isSpecialMessageLoading: boolean;
}

const serviceColors = [
    'bg-blue-500 text-white', 'bg-emerald-500 text-white', 'bg-amber-500 text-black',
    'bg-rose-500 text-white', 'bg-violet-500 text-white', 'bg-cyan-500 text-white',
    'bg-fuchsia-500 text-white', 'bg-lime-600 text-white', 'bg-teal-500 text-white',
    'bg-orange-500 text-white', 'bg-indigo-500 text-white', 'bg-pink-500 text-white',
];

const getServiceColor = (serviceName: string): string => {
    let hash = 0;
    for (let i = 0; i < serviceName.length; i++) {
        hash = serviceName.charCodeAt(i) + ((hash << 5) - hash);
    }
    const index = Math.abs(hash % serviceColors.length);
    return serviceColors[index];
};

const cardStyles = "bg-[var(--card-bg-light-rgba)] dark:bg-[var(--card-bg-dark-rgba)] backdrop-blur-[var(--card-backdrop-blur)] rounded-2xl shadow-lg border-2";

const getCardStyling = (score: number | 'غائب') => {
    if (score === 'غائب' || score === 0) return { grade: 'غائب', borderColor: 'border-red-500', bgColor: 'bg-red-500', textColor: 'text-red-300', pointColor: 'fill-red-500' };
    if (score >= 90) return { grade: 'ممتاز', borderColor: 'border-green-500', bgColor: 'bg-green-500', textColor: 'text-green-300', pointColor: 'fill-green-400' };
    if (score >= 80) return { grade: 'جيد جداً', borderColor: 'border-sky-500', bgColor: 'bg-sky-500', textColor: 'text-sky-300', pointColor: 'fill-sky-400' };
    if (score >= 70) return { grade: 'جيد', borderColor: 'border-amber-500', bgColor: 'bg-amber-500', textColor: 'text-amber-300', pointColor: 'fill-amber-400' };
    if (score >= 60) return { grade: 'مقبول', borderColor: 'border-orange-500', bgColor: 'bg-orange-500', textColor: 'text-orange-300', pointColor: 'fill-orange-400' };
    return { grade: 'ناجح', borderColor: 'border-slate-500', bgColor: 'bg-slate-500', textColor: 'text-slate-300', pointColor: 'fill-slate-400' };
};


interface ServiceSelectionModalProps {
    services: string[];
    onSelect: (service: string) => void;
    onClose: () => void;
}

const ServiceSelectionModal: React.FC<ServiceSelectionModalProps> = ({ services, onSelect, onClose }) => {
    return createPortal(
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 transition-opacity duration-300" onClick={onClose}>
            <div className="bg-white dark:bg-slate-800 p-8 rounded-2xl shadow-xl w-full max-w-lg m-4 animate-fade-in-up" onClick={e => e.stopPropagation()} role="dialog" aria-modal="true" aria-labelledby="service-select-title">
                <h3 id="service-select-title" className="text-xl font-bold text-[var(--main-text-color-light)] dark:text-[var(--main-text-color-dark)] mb-2">اختر الخدمة للشهادة</h3>
                <p className="text-slate-600 dark:text-slate-300 mb-6">لقد وجدنا أنك تخدم في أكثر من خدمة. يرجى اختيار اسم الخدمة التي ترغب في ظهورها على شهادة التقدير.</p>
                <div className="space-y-3 max-h-60 overflow-y-auto pr-2">
                    {services.map(service => (
                        <button
                            key={service}
                            onClick={() => onSelect(service)}
                            className="w-full text-right px-4 py-3 bg-gray-50 dark:bg-slate-700 text-[var(--main-text-color-light)] dark:text-[var(--main-text-color-dark)] font-semibold rounded-lg hover:bg-[rgb(var(--color-primary-light-rgb))] hover:text-[rgb(var(--color-primary-dark-text-rgb))] dark:hover:bg-slate-600 transition-all duration-200 flex items-center gap-3 border border-gray-200 dark:border-slate-600"
                        >
                            <BriefcaseIcon />
                            <span>{service}</span>
                        </button>
                    ))}
                </div>
            </div>
        </div>,
        document.body
    );
};

const StatCard: React.FC<{ icon: React.ReactNode; value: string | number; label: string; valueLabel?: string; borderColorClass: string; }> = ({ icon, value, label, valueLabel, borderColorClass }) => (
    <div className={`${cardStyles} border-l-8 border-b-8 ${borderColorClass} p-6 flex flex-col items-center justify-center text-center transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl`}>
        <div className="text-white">{icon}</div>
        <p className="text-4xl font-bold text-white mt-2">{value}<span className="text-xl text-white/80">{valueLabel}</span></p>
        <p className="text-sm text-white/80 mt-1">{label}</p>
    </div>
);


const CourseResultCard: React.FC<{
  result: CourseResult;
  onInitiateCertificate: (result: CourseResult) => void;
}> = ({ result, onInitiateCertificate }) => {
  const { grade, borderColor, bgColor, textColor } = getCardStyling(result.score);
  const attendance = Math.round(result.attendance <= 1 ? result.attendance * 100 : result.attendance);

  // Format date if available, else show year
  const dateDisplay = result.date ? new Date(result.date).toLocaleDateString('ar-EG', { year: 'numeric', month: 'long', day: 'numeric' }) : result.year;

  return (
    <div className={`${cardStyles} border-l-8 border-b-8 ${borderColor} p-6 mb-6`}>
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 gap-2">
        <div className="flex flex-wrap items-center gap-3">
            <div className={`p-2 rounded-lg ${bgColor} bg-opacity-20`}>
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" /></svg>
            </div>
            <h3 className={`text-xl font-bold text-white`}>{result.courseName}</h3>
            {/* Display date next to course name */}
            <span className="text-base font-bold text-yellow-300 bg-black/20 px-3 py-1 rounded-md">{dateDisplay}</span>
        </div>
        <div className="flex items-center gap-3">
             <span className={`font-bold text-lg text-white ${bgColor} px-4 py-1 rounded-full`}>{grade}</span>
        </div>
      </div>
      
      {/* Body */}
      <div className="grid grid-cols-2 gap-4 items-center my-6">
        {/* Attendance (Right in RTL) */}
        <div className="text-center">
          <p className="text-slate-200 font-semibold text-base">الحاضر</p>
          <p className="text-white font-bold text-3xl mt-1">{attendance}%</p>
          <div className="w-full bg-gray-200/20 rounded-full h-2.5 mt-2">
            <div className={`${bgColor} h-2.5 rounded-full`} style={{ width: `${attendance}%` }}></div>
          </div>
        </div>
        
        {/* Score (Left in RTL) */}
        <div className="text-center">
          <p className="text-slate-200 font-semibold text-base">الدرجة</p>
          {result.score !== 'غائب' ? (
            <p className="text-white font-bold text-3xl mt-1">
              <span className={textColor}>{result.score}</span>
              <span className="text-white/70"> / 100</span>
            </p>
          ) : (
             <p className={`text-3xl font-bold mt-1 ${textColor}`}>غائب</p>
          )}
        </div>
      </div>

      {/* Footer */}
      {result.score !== 'غائب' && (
        <div className="text-center mt-6">
          <button
            onClick={() => onInitiateCertificate(result)}
            className="px-8 py-3 bg-[rgb(var(--color-primary-rgb))] text-white font-bold rounded-lg hover:bg-[rgb(var(--color-primary-accent-rgb))] transition-transform transform hover:scale-105 shadow-lg"
          >
            إصدار الشهادة
          </button>
        </div>
      )}
    </div>
  );
};

const SmartGuideSection: React.FC<Omit<ResultDisplayProps, 'onShowCertificate' | 'onNewSearch'>> = ({
    profile,
    onGenerateMessage, motivationalMessage, isMessageLoading,
    onGenerateAdvice, spiritualAdvice, isAdviceLoading,
    onGenerateSpecialMessage, specialMessage, isSpecialMessageLoading,
}) => {
  const isLoading = isMessageLoading || isAdviceLoading || isSpecialMessageLoading;
  const messageToShow = specialMessage || spiritualAdvice || motivationalMessage;
  
  const showSpecialMessageButton = useMemo(() => {
    if (!profile || !profile.results || profile.results.length === 0) {
        return false;
    }
    // Find the latest result by sorting by year descending
    const latestResult = [...profile.results].sort((a, b) => b.year - a.year)[0];
    if (!latestResult) return false;

    const attendance = typeof latestResult.attendance === 'number' 
        ? (latestResult.attendance <= 1 ? latestResult.attendance * 100 : latestResult.attendance)
        : 0;
        
    return attendance < 50;
  }, [profile]);


  return (
      <div className={`my-8 ${cardStyles} border-transparent p-6`}>
          <h3 className="text-xl font-bold text-white dark:text-slate-100 mb-6 text-center flex items-center justify-center gap-3">
              <SparklesIcon />
              المرشد الروحي الذكي
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <button onClick={onGenerateMessage} disabled={isLoading} className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-amber-500/80 text-white font-semibold rounded-lg hover:bg-amber-600 transition disabled:opacity-50 disabled:cursor-not-allowed">
                  {isMessageLoading ? <LoadingSpinner /> : <SparklesIcon />}
                  <span>رسالة تشجيع</span>
              </button>
              <button onClick={onGenerateAdvice} disabled={isLoading} className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-teal-500/80 text-white font-semibold rounded-lg hover:bg-teal-600 transition disabled:opacity-50 disabled:cursor-not-allowed">
                  {isAdviceLoading ? <LoadingSpinner /> : <UserCircleIcon />}
                  <span>نصيحة روحية</span>
              </button>
              {showSpecialMessageButton && (
                <button onClick={onGenerateSpecialMessage} disabled={isLoading} className="w-full md:col-span-2 flex items-center justify-center gap-2 px-4 py-3 bg-rose-500/80 text-white font-semibold rounded-lg hover:bg-rose-600 transition disabled:opacity-50 disabled:cursor-not-allowed">
                    {isSpecialMessageLoading ? <LoadingSpinner /> : <IdCardIcon className="h-5 w-5" />}
                    <span>رسالة شخصية</span>
                </button>
              )}
          </div>
           <div className="mt-6 pt-6 border-t border-[var(--card-border-rgba)]">
                <div className="min-h-[10rem] flex items-center justify-center text-center">
                  {isLoading ? (
                      <div className="flex flex-col items-center justify-center" role="status">
                          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-slate-500"></div>
                          <p className="text-slate-400 mt-3 text-sm">المرشد الذكي يفكر...</p>
                      </div>
                  ) : messageToShow ? (
                      <blockquote className="relative w-full animate-fade-in-up">
                          <p className="text-lg md:text-xl text-white dark:text-slate-100 leading-loose whitespace-pre-wrap" style={{fontFamily: "'Amiri', serif"}}>
                              {messageToShow}
                          </p>
                      </blockquote>
                  ) : (
                      <p className="text-slate-300 dark:text-slate-400">اختر إحدى الخيارات أعلاه لاكتشاف رسالة ملهمة أو نصيحة روحية.</p>
                  )}
              </div>
          </div>
      </div>
  );
};


const AscentJourney: React.FC<{ results: CourseResult[] }> = ({ results }) => {
    const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

    const chartData = useMemo(() => {
        // Sort chronologically: Oldest first (Left to Right)
        return results
            .map(r => ({ ...r, score: r.score === 'غائب' ? 0 : r.score }))
            .filter((r): r is CourseResult & { score: number } => typeof r.score === 'number')
            .sort((a, b) => {
                if (a.date && b.date) {
                    return new Date(a.date).getTime() - new Date(b.date).getTime();
                }
                return a.year - b.year || a.courseName.localeCompare(b.courseName);
            });
    }, [results]);

    if (chartData.length < 2) {
        return <p className="text-center text-slate-400 py-8">تحتاج إلى نتيجتين على الأقل لعرض رحلة الصعود.</p>;
    }
    
    const width = 800;
    const height = 400;
    const padding = { top: 50, right: 60, bottom: 80, left: 40 };
    const chartWidth = width - padding.left - padding.right;
    const chartHeight = height - padding.top - padding.bottom;

    const xScale = (index: number) => padding.left + (index / (chartData.length - 1)) * chartWidth; // Left to Right
    const yScale = (score: number) => padding.top + chartHeight - (score / 100) * chartHeight;

    const linePathD = chartData.map((d, i) => `${i === 0 ? 'M' : 'L'} ${xScale(i)} ${yScale(d.score)}`).join(' ');
    
    const areaPathD = `${linePathD} L ${xScale(chartData.length - 1)} ${height - padding.bottom} L ${xScale(0)} ${height - padding.bottom} Z`;
    
    const yAxisLabels = [
        { score: 100, label: "100" }, { score: 90, label: "ممتاز" }, { score: 80, label: "جيد جداً" }, 
        { score: 70, label: "جيد" }, { score: 60, label: "مقبول" }, { score: 0, label: "0" }
    ];

    const climber = chartData[chartData.length - 1]; // Current (last) position
    const climberX = climber ? xScale(chartData.length - 1) : 0;
    const climberY = climber ? yScale(climber.score) : 0;

    return (
        <div className="w-full overflow-x-auto py-4 flex justify-start">
            <svg viewBox={`0 0 ${width} ${height}`} className="min-w-[${width}px] font-sans" onClick={() => setHoveredIndex(null)}>
                <defs>
                    <linearGradient id="pathGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%" stopColor="rgb(var(--color-primary-accent-rgb))" />
                        <stop offset="100%" stopColor="rgb(var(--color-primary-rgb))" />
                    </linearGradient>
                     <linearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="rgb(var(--color-primary-accent-rgb))" stopOpacity="0.1"/>
                        <stop offset="100%" stopColor="rgb(var(--color-primary-rgb))" stopOpacity="0.01"/>
                    </linearGradient>
                </defs>

                {/* Background mountain silhouette */}
                <path d="M0 300 C 150 200, 250 350, 400 250 S 550 150, 700 220 L 800 180 V 400 H 0 Z" fill="rgba(100, 116, 139, 0.05)" />

                {/* Y-Axis Grid Lines and Labels */}
                {yAxisLabels.map(({ score, label }) => (
                    <g key={score}>
                        <line 
                            x1={padding.left} y1={yScale(score)} 
                            x2={width - padding.right} y2={yScale(score)} 
                            stroke="rgba(148, 163, 179, 0.6)" strokeWidth="1" strokeDasharray="4 4"
                        />
                        <text x={width - padding.right + 8} y={yScale(score) + 4} fill="rgb(148, 163, 179)" className="text-xs font-semibold">{label}</text>
                    </g>
                ))}

                {/* Area under path */}
                <path d={areaPathD} fill="url(#areaGradient)" />

                {/* Main Path */}
                <path d={linePathD} fill="none" stroke="url(#pathGradient)" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" className="animate-draw-line" />

                {/* Data Points (Milestones) */}
                {chartData.map((d, i) => {
                    const { pointColor } = getCardStyling(d.score);
                    return (
                        <g key={i} onClick={(e) => { e.stopPropagation(); setHoveredIndex(hoveredIndex === i ? null : i); }}>
                            <circle cx={xScale(i)} cy={yScale(d.score)} r="12" fill="transparent" className="cursor-pointer" />
                            <circle 
                                cx={xScale(i)} cy={yScale(d.score)} r={hoveredIndex === i ? 8 : 5}
                                className={`${pointColor} stroke-slate-800/50 transition-all duration-200 cursor-pointer`}
                                strokeWidth="2"
                            />
                        </g>
                    );
                })}

                {/* Climber Icon */}
                <g transform={`translate(${climberX}, ${climberY})`}>
                     <circle cx="0" cy="-14" r="4" fill="white" />
                     <path d="M -5 -12 L 5 -12 L 0 -4 Z" fill="white" />
                </g>

                {/* Tooltip */}
                {hoveredIndex !== null && (() => {
                    const d = chartData[hoveredIndex];
                    const x = xScale(hoveredIndex);
                    const y = yScale(d.score);
                    
                    const displayDate = d.date ? d.date : d.year;
                    const textContent = `${d.courseName} (${displayDate})  |  ${d.score}/100`;
                    const tooltipWidth = textContent.length * 6.5 + 20;
                    const tooltipHeight = 36;
                    const edgePadding = 10;

                    // --- Y Position Logic ---
                    // Default is above the point. Anchor point is 20px above the data point.
                    let groupTranslateY = y - 20; 
                    // By default, the rectangle is drawn upwards from the anchor point.
                    let rectInternalY = -tooltipHeight; 

                    // Check if the tooltip goes off the top edge of the SVG.
                    if (groupTranslateY + rectInternalY < edgePadding) {
                        // If it does, flip it to be below the data point.
                        groupTranslateY = y + 20; // Anchor 20px below the data point.
                        rectInternalY = 0; // Draw the rectangle downwards from the anchor.
                    }
                    
                    // --- X Position Logic ---
                    // Default is to center the tooltip on the data point's x-coordinate.
                    let rectInternalX = -tooltipWidth / 2;

                    // Check for collision with the right edge.
                    if (x + rectInternalX + tooltipWidth > width - edgePadding) {
                        const overflow = (x + rectInternalX + tooltipWidth) - (width - edgePadding);
                        rectInternalX -= overflow; // Shift the tooltip to the left by the overflow amount.
                    }
                    
                    // Check for collision with the left edge.
                    if (x + rectInternalX < edgePadding) {
                        const underflow = edgePadding - (x + rectInternalX);
                        rectInternalX += underflow; // Shift the tooltip to the right by the underflow amount.
                    }

                    return (
                        <g transform={`translate(${x}, ${groupTranslateY})`} className="pointer-events-none">
                            <rect 
                                x={rectInternalX} 
                                y={rectInternalY}
                                width={tooltipWidth} 
                                height={tooltipHeight} 
                                rx="10" 
                                fill="rgba(30, 41, 59, 0.95)" 
                                stroke="rgba(255,255,255,0.2)" 
                                strokeWidth="1"
                            />
                            <text 
                                x={rectInternalX + tooltipWidth / 2} 
                                y={rectInternalY + tooltipHeight / 2} 
                                textAnchor="middle" 
                                alignmentBaseline="middle" 
                                fill="white" 
                                className="text-xs font-bold" 
                                style={{ direction: 'rtl' }}
                            >
                                {textContent}
                            </text>
                        </g>
                    );
                })()}

            </svg>
        </div>
    );
};


const ResultDisplay: React.FC<ResultDisplayProps> = (props) => {
  const { 
    profile,
    onShowCertificate, 
    onNewSearch,
  } = props;

  const [pendingCertificate, setPendingCertificate] = useState<CourseResult | null>(null);
  
  const { servant, results } = profile;
  
  const stats = useMemo(() => {
    if (!results || results.length === 0) {
        return { avgAttendance: 0, avgScore: 0, attendedCourses: 0, totalCourses: 0 };
    }

    const totalAttendance = results.reduce((sum, r) => {
        const attendanceValue = typeof r.attendance === 'number' ? r.attendance : 0;
        const normalized = attendanceValue <= 1 ? attendanceValue * 100 : attendanceValue;
        return sum + normalized;
    }, 0);
    const avgAttendance = Math.round(totalAttendance / results.length);

    const scoredResults = results.filter((r): r is CourseResult & { score: number } => typeof r.score === 'number');
    const totalScore = scoredResults.reduce((sum, r) => sum + r.score, 0);
    const avgScore = scoredResults.length > 0 ? Math.round(totalScore / scoredResults.length) : 0;

    const attendedCourses = scoredResults.length;
    const totalCourses = results.length;

    return { avgAttendance, avgScore, attendedCourses, totalCourses };
  }, [results]);

  useEffect(() => {
    const isModalOpen = !!pendingCertificate;
    if (isModalOpen) {
        document.body.style.overflow = 'hidden';
    } else {
        document.body.style.overflow = 'unset';
    }
    return () => {
        document.body.style.overflow = 'unset';
    };
  }, [pendingCertificate]);

  const uniqueResults = useMemo(() => {
    const seen = new Set<string>();
    return results.filter(result => {
        const timeIdentifier = result.date || result.year;
        const identifier = `${result.courseName}|${timeIdentifier}`;
        if (seen.has(identifier)) {
            return false;
        }
        seen.add(identifier);
        return true;
    });
  }, [results]);

  // Sort descending: Newest first (Top to Bottom)
  const sortedResults = [...uniqueResults].sort((a, b) => {
      if (a.date && b.date) {
          return new Date(b.date).getTime() - new Date(a.date).getTime();
      }
      return b.year - a.year;
  });

  const handleInitiateCertificate = (result: CourseResult) => {
      const allServices = (Array.isArray(servant.allServices) && servant.allServices.length > 0 ? servant.allServices : [servant.primaryService]).filter(Boolean);
      if (allServices.length > 1) {
          setPendingCertificate(result);
      } else {
          onShowCertificate({
              name: servant.name,
              service: allServices[0] || 'خدمة غير محددة',
              courseName: result.courseName,
              score: result.score,
          });
      }
  };

  const handleServiceSelect = (service: string) => {
      if (pendingCertificate) {
          onShowCertificate({
              name: servant.name,
              service: service,
              courseName: pendingCertificate.courseName,
              score: pendingCertificate.score,
          });
      }
      setPendingCertificate(null);
  };
  
  return (
    <div className="animate-fade-in-up p-4 w-full max-w-4xl mx-auto">
        {pendingCertificate && (
            <ServiceSelectionModal
                services={(Array.isArray(servant.allServices) && servant.allServices.length > 0 ? servant.allServices : [servant.primaryService]).filter(Boolean)}
                onSelect={handleServiceSelect}
                onClose={() => setPendingCertificate(null)}
            />
        )}
        
        <div className={`${cardStyles} border-transparent p-6 mb-8 flex items-center justify-between gap-6`}>
            <div className="flex-shrink-0">
                <img 
                    src={servant.avatarUrl || 'https://i.postimg.cc/9XJjqvFn/tsmym-bdwn-ʿnwan.png'}
                    alt={`صورة ${servant.name}`}
                    className="w-32 h-32 rounded-full object-cover border-4 border-white/20 shadow-lg"
                />
            </div>
            <div className="flex-grow text-right">
                <h2 className="text-4xl font-bold bg-gradient-to-r from-purple-500 via-pink-500 to-red-500 bg-clip-text text-transparent" style={{ fontFamily: "'El Messiri', sans-serif" }}>{servant.name}</h2>
                <div className="inline-flex items-center gap-2 mt-3 bg-[rgb(var(--color-primary-rgb))] text-white px-4 py-2 rounded-full text-lg font-semibold">
                    <IdCardIcon className="h-6 w-6" />
                    <span>الكود: {servant.code}</span>
                </div>
                <div className="flex flex-wrap items-center justify-end gap-2 mt-4">
                    {(Array.isArray(servant.allServices) && servant.allServices.length > 0 ? servant.allServices : [servant.primaryService]).filter(Boolean).map(service => (
                        <span key={service} className={`px-4 py-1.5 text-base font-semibold rounded-full ${getServiceColor(service)}`}>
                            {service}
                        </span>
                    ))}
                </div>
            </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
            <StatCard 
                icon={<CalendarIcon />} 
                value={`${stats.avgAttendance}`}
                valueLabel="%"
                label="متوسط الحضور"
                borderColorClass="border-sky-400"
            />
            <StatCard 
                icon={<StarIcon />} 
                value={`${stats.avgScore}`}
                valueLabel="/100"
                label="متوسط الدرجات"
                borderColorClass="border-amber-400"
            />
            <StatCard 
                icon={<GraduationCapIcon />} 
                value={`${stats.attendedCourses}/${stats.totalCourses}`}
                label="كورسات تم حضورها"
                borderColorClass="border-emerald-400"
            />
        </div>

        {sortedResults.map((result, index) => (
             <div key={`${result.courseName}-${result.date || result.year}`} style={{ animationDelay: `${index * 100}ms`}}>
                <CourseResultCard result={result} onInitiateCertificate={handleInitiateCertificate} />
            </div>
        ))}

        <div className={`${cardStyles} border-transparent p-6 mt-12`}>
            <h3 className="text-2xl font-bold text-white dark:text-slate-100 mb-4 text-center">
                رحلة الصعود
            </h3>
            <p className="text-center text-lg text-slate-100 max-w-2xl mx-auto mb-6">
                هذا الرسم يصور رحلتك التعليمية عبر الكورسات. كل نقطة مضيئة تمثل إنجازاً في كورس معين. حرك مؤشر الفأرة فوق النقاط (أو المسها على شاشة الموبايل) لاكتشاف اسم الكورس ودرجتك. الصعود يعكس تقدمك، والهبوط قد يشير إلى غياب أو تحدٍ واجهته.
            </p>
            <AscentJourney results={profile.results} />
        </div>

        <SmartGuideSection {...props} />


        <div className="text-center">
            <button onClick={onNewSearch} className="mt-12 px-6 py-3 bg-[var(--card-bg-light-rgba)] dark:bg-[var(--card-bg-dark-rgba)] text-white font-semibold rounded-lg hover:bg-black/20 dark:hover:bg-black/30 backdrop-blur-md border border-[var(--card-border-rgba)] focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-opacity-75 transition-all duration-300 transform hover:scale-105 flex items-center justify-center gap-2 mx-auto">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
                <span>بحث جديد</span>
            </button>
        </div>
    </div>
  );
};

export default ResultDisplay;