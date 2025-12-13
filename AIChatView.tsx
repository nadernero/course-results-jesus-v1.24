
import React, { useState, useRef, useEffect, useMemo } from 'react';
import type { StudentResult, Servant, CourseResult, Evaluation } from './types';

// --- SVG Icons (New & Polished) ---
const SendIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 transform -rotate-45" viewBox="0 0 24 24" fill="currentColor"><path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/></svg>;
const BotIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>;
const UserIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>;
const SparklesIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-indigo-500" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M5 2a1 1 0 011 1v1h1a1 1 0 010 2H6v1a1 1 0 01-2 0V6H3a1 1 0 010-2h1V3a1 1 0 011-1zm0 9a1 1 0 011 1v1h1a1 1 0 110 2H6v1a1 1 0 11-2 0v-1H3a1 1 0 110-2h1v-1a1 1 0 011-1zm7-1a1 1 0 100 2h1v1a1 1 0 102 0v-1h1a1 1 0 100-2h-1V7a1 1 0 10-2 0v1h-1z" clipRule="evenodd" /></svg>;

interface AIChatViewProps {
    students: StudentResult[];
    servants: Servant[];
    results: CourseResult[];
    evaluations: Evaluation[];
}

interface Message {
    sender: 'user' | 'ai';
    text: string;
}

// --- Text Formatter Component ---
const FormattedText: React.FC<{ text: string }> = ({ text }) => {
    if (!text) return null;
    const lines = text.split('\n');
    
    return (
        <div className="space-y-1.5 text-[15px] leading-relaxed">
            {lines.map((line, index) => {
                const trimmedLine = line.trim();
                
                // 1. Handle Bullet Points
                if (trimmedLine.startsWith('- ') || trimmedLine.startsWith('* ')) {
                    const content = trimmedLine.substring(2);
                    return (
                        <div key={index} className="flex items-start gap-2 mr-1">
                            <span className="text-indigo-400 mt-2 text-[10px]">●</span>
                            <span className="flex-1" dangerouslySetInnerHTML={{ __html: parseBold(content) }} />
                        </div>
                    );
                }
                
                // 2. Handle Headings
                if (trimmedLine.endsWith(':') || /^\d+\./.test(trimmedLine) || trimmedLine.startsWith('#')) {
                     const cleanLine = trimmedLine.replace(/^#+\s*/, '');
                     return (
                        <p key={index} className="font-bold text-indigo-700 dark:text-indigo-300 mt-3 mb-1" dangerouslySetInnerHTML={{ __html: parseBold(cleanLine) }} />
                     );
                }
                
                // 3. Empty lines
                if (trimmedLine === '') return <div key={index} className="h-1"></div>;

                // 4. Regular Paragraphs
                return <p key={index} dangerouslySetInnerHTML={{ __html: parseBold(line) }} />;
            })}
        </div>
    );
};

const parseBold = (text: string) => {
    const safeText = text.replace(/</g, "&lt;").replace(/>/g, "&gt;");
    return safeText.replace(/\*\*(.*?)\*\*/g, '<strong class="font-bold text-indigo-900 dark:text-indigo-100">$1</strong>');
};

export const AIChatView: React.FC<AIChatViewProps> = ({ students, servants, results, evaluations }) => {
    const [messages, setMessages] = useState<Message[]>([
        { sender: 'ai', text: 'أهلاً بك يا خادم الرب! ✝️\nأنا مساعدك الذكي لتحليل بيانات الخدمة.\n\nيمكنك سؤالي عن خادم محدد بالاسم، وسأقوم بجلب سجله الكامل وتحليله، بما في ذلك:\n- **نتائج الكورسات والحضور**\n- **تقييمات الخدمة التفصيلية**\n- **تحليل نقاط القوة والضعف**\n- **توصيات عملية**\n\nأو اسألني عن إحصائيات عامة للخدمة.' }
    ]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const chatEndRef = useRef<HTMLDivElement>(null);

    // Auto-scroll to bottom
    useEffect(() => {
        chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages, isLoading]);

    // Optimize Search: Index servants by name for fast lookup
    const servantNameIndex = useMemo(() => {
        const index: Record<string, Servant> = {};
        servants.forEach(s => {
            const normalizedName = s.name.toLowerCase().trim();
            index[normalizedName] = s;
            // Also index parts of the name for partial matching? Maybe too risky for privacy without explicit intent.
            // Let's stick to simple includes check in the handler.
        });
        return index;
    }, [servants]);

    const handleSendMessage = async (e?: React.FormEvent, customInput?: string) => {
        if (e) e.preventDefault();
        const textToSend = customInput || input;
        
        if (!textToSend.trim() || isLoading) return;

        const userMessage: Message = { sender: 'user', text: textToSend };
        setMessages(prev => [...prev, userMessage]);
        setInput('');
        setIsLoading(true);
        
        try {
            // 1. Determine Intent: Specific Servant or General?
            // Simple heuristic: Does the input contain a known servant name?
            const normalizedInput = textToSend.toLowerCase();
            const matchedServants = servants.filter(s => normalizedInput.includes(s.name.toLowerCase().split(' ')[0])); // Match at least first name
            
            let dataContext = "";
            let promptInstruction = "";

            if (matchedServants.length > 0) {
                // --- Specific Servant Context ---
                // Pick the best match (e.g., longest name match or first found)
                // For simplicity, we take the first few matches (in case of "Peter")
                const selectedServantsData = matchedServants.slice(0, 3).map(servant => {
                    const servantResults = results.filter(r => String(r.servantCode) === servant.code).sort((a,b) => b.year - a.year);
                    const servantEvaluations = evaluations.filter(ev => String(ev.servantCode) === servant.code).sort((a,b) => b.year - a.year);
                    
                    return {
                        profile: servant,
                        courses: servantResults,
                        evaluations: servantEvaluations
                    };
                });

                dataContext = JSON.stringify(selectedServantsData);
                promptInstruction = `
                لقد سأل المستخدم عن خادم (أو خدام) محددين. البيانات المرفقة تحتوي على السجل الكامل لهم.
                
                **المطلوب منك كخبير تحليل:**
                لكل خادم تم العثور عليه، قدم تقريراً مفصلاً يحتوي على الأقسام التالية بوضوح:
                
                1. **ملخص الكورسات:** اذكر الكورسات التي حضرها، درجاته، ونسب الحضور. هل هو ملتزم؟
                2. **تحليل التقييمات:** انظر إلى درجات التقييم (Evaluations) عبر السنين. هل يتحسن؟ ما هي "المحاور" (مثل التحضير، الالتزام، العلاقة بالآخرين) التي حصل فيها على درجات منخفضة؟ وما هي نقاط قوته؟
                3. **توصيات للخادم:** نصائح عملية ومحددة له لتحسين خدمته وحياته الروحية بناءً على نقاط ضعفه.
                4. **توصيات للأمين:** نصائح للمسؤول عنه (كيف يتابعه، ماذا يحتاج منه).
                5. **رسالة تشجيعية:** رسالة قصيرة دافئة موجهة للخادم باسمه.

                استخدم التنسيق الجميل (العناوين، النقاط، الإيموجي) لتسهيل القراءة.
                `;

            } else {
                // --- General Context ---
                // Send summarized data (StudentResults) to save tokens
                dataContext = JSON.stringify(students.slice(0, 200)); 
                promptInstruction = `
                المستخدم يسأل سؤالاً عاماً عن الخدمة أو الإحصائيات.
                البيانات المرفقة هي قائمة مختصرة للنتائج.
                أجب بدقة بناءً على الأرقام المتاحة.
                `;
            }

            const systemInstruction = `
            أنت "المساعد الذكي" لخدمة مجتمع يسوع في كنيسة القديس بولس بالعبور.
            دورك هو مساعدة أمناء الخدمة في متابعة الخدام وتحليل أدائهم الروحي والخدمي.
            
            البيانات: ${dataContext}
            
            ${promptInstruction}
            
            سؤال المستخدم: ${userMessage.text}
            `;
            
            const response = await fetch('/.netlify/functions/gemini', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ contents: systemInstruction }),
            });

            if (!response.ok) throw new Error('Network response was not ok');

            const data = await response.json();
            const text = data.text;

            if (!text) throw new Error("No text found");

            setMessages(prev => [...prev, { sender: 'ai', text }]);

        } catch (err: any) {
            console.error("Chat Error:", err);
            setMessages(prev => [...prev, { sender: 'ai', text: "عذراً، حدث خطأ أثناء الاتصال بالخادم. يرجى المحاولة مرة أخرى." }]);
        } finally {
            setIsLoading(false);
        }
    };
    
    const suggestedPrompts = [
        "من هم أعلى 5 خدام في الدرجات؟ 🏆",
        "تحليل لأداء الخادم [اكتب الاسم] 🧐",
        "أعطني قائمة بالخدام الغائبين ⚠️",
        "ما هي التوصيات العامة لتحسين الخدمة؟ 💡",
    ];

    return (
        <div className="flex flex-col h-[600px] max-h-[75vh] bg-slate-50 dark:bg-slate-900 rounded-2xl shadow-xl border border-gray-200 dark:border-slate-700 overflow-hidden font-sans">
            {/* Header */}
            <div className="bg-white dark:bg-slate-800 p-4 border-b border-gray-200 dark:border-slate-700 flex items-center gap-3 shadow-sm z-10">
                <div className="bg-indigo-100 dark:bg-indigo-900/50 p-2 rounded-full">
                    <SparklesIcon />
                </div>
                <div>
                    <h3 className="font-bold text-slate-800 dark:text-slate-100 text-lg">المساعد الذكي (مُطور)</h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400">تحليل عميق للنتائج والتقييمات</p>
                </div>
            </div>

            {/* Chat Area */}
            <div className="flex-1 p-4 sm:p-6 overflow-y-auto space-y-6 bg-slate-50 dark:bg-slate-900 scroll-smooth">
                {messages.map((msg, index) => (
                     <div key={index} className={`flex items-start gap-3 ${msg.sender === 'user' ? 'flex-row-reverse' : 'flex-row'} animate-fade-in-up`}>
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 shadow-sm border border-gray-100 dark:border-slate-700 ${msg.sender === 'ai' ? 'bg-white dark:bg-slate-800 text-indigo-600' : 'bg-indigo-600 text-white'}`}>
                            {msg.sender === 'ai' ? <BotIcon/> : <UserIcon/>}
                        </div>
                        
                        <div className={`px-5 py-3.5 rounded-2xl max-w-[95%] md:max-w-2xl shadow-sm ${
                            msg.sender === 'user' 
                            ? 'bg-indigo-600 text-white rounded-tr-none' 
                            : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 rounded-tl-none border border-gray-200 dark:border-slate-700'
                        }`}>
                            {msg.sender === 'ai' ? (
                                <FormattedText text={msg.text} />
                            ) : (
                                <p className="text-[15px]">{msg.text}</p>
                            )}
                        </div>
                    </div>
                ))}
                
                {isLoading && (
                    <div className="flex items-start gap-3 animate-pulse">
                        <div className="w-10 h-10 rounded-full bg-white dark:bg-slate-800 text-indigo-600 flex items-center justify-center flex-shrink-0 shadow-sm border border-gray-200 dark:border-slate-700">
                            <BotIcon/>
                        </div>
                        <div className="px-5 py-4 rounded-2xl bg-white dark:bg-slate-800 rounded-tl-none shadow-sm border border-gray-200 dark:border-slate-700">
                            <div className="flex items-center gap-1.5">
                                <span className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce [animation-delay:-0.3s]"></span>
                                <span className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce [animation-delay:-0.15s]"></span>
                                <span className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce"></span>
                            </div>
                            <p className="text-xs text-slate-400 mt-2">جاري تحليل البيانات...</p>
                        </div>
                    </div>
                )}
                <div ref={chatEndRef} />
            </div>
            
            {/* Suggested Prompts (Chips) */}
            {!isLoading && (
                <div className="px-4 py-2 bg-slate-50 dark:bg-slate-900 border-t border-gray-100 dark:border-slate-800">
                    <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar mask-gradient">
                        {suggestedPrompts.map((prompt, idx) => (
                            <button 
                                key={idx} 
                                onClick={() => handleSendMessage(undefined, prompt)} 
                                className="flex-shrink-0 px-3 py-1.5 bg-white dark:bg-slate-800 hover:bg-indigo-50 dark:hover:bg-slate-700 text-indigo-700 dark:text-indigo-300 text-xs font-semibold rounded-full border border-indigo-100 dark:border-slate-600 transition-colors shadow-sm whitespace-nowrap"
                            >
                                {prompt}
                            </button>
                        ))}
                    </div>
                </div>
            )}
            
            {/* Input Area */}
            <div className="p-4 bg-white dark:bg-slate-800 border-t border-gray-200 dark:border-slate-700">
                <form onSubmit={(e) => handleSendMessage(e)} className="relative flex items-center gap-2">
                    <input 
                        type="text" 
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        placeholder="اكتب اسم الخادم للتحليل أو أي سؤال آخر..." 
                        className="w-full pl-4 pr-12 py-3.5 bg-gray-100 dark:bg-slate-900 border-transparent focus:bg-white dark:focus:bg-black focus:border-indigo-500 rounded-xl focus:ring-0 text-slate-800 dark:text-slate-100 placeholder-gray-400 transition-all shadow-inner text-sm"
                        disabled={isLoading}
                    />
                    <button 
                        type="submit" 
                        disabled={isLoading || !input.trim()} 
                        className="absolute left-2 top-1/2 transform -translate-y-1/2 p-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:bg-gray-300 dark:disabled:bg-slate-700 disabled:cursor-not-allowed transition-all shadow-md flex items-center justify-center"
                    >
                        {isLoading ? <div className="w-5 h-5 border-2 border-white/50 border-t-white rounded-full animate-spin"></div> : <SendIcon />}
                    </button>
                </form>
            </div>
        </div>
    );
};
