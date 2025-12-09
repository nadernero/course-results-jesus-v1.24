import React, { useState, useEffect } from 'react';
import LoadingSpinner from './LoadingSpinner';

interface SearchFormProps {
  query: string;
  setQuery: (query: string) => void;
  onSearch: () => void;
  isLoading: boolean;
  error: string;
  onShowTutorial: () => void;
}

const verses = [
  { text: "لأَنَّهُ حَيْثُمَا اجْتَمَعَ اثْنَانِ أَوْ ثَلاَثَةٌ بِاسْمِي فَهُنَاكَ أَكُونُ فِي وَسْطِهِمْ", reference: "متى 18: 20" },
  { text: "أَسْتَطِيعُ كُلَّ شَيْءٍ فِي الْمَسِيحِ الَّذِي يُقَوِِّينِي.", reference: "فيلبي 4: 13" },
  { text: "اَلرَّبُّ رَاعِيَّ فَلاَ يُعْوِزُنِي شَيْءٌ.", reference: "مزمور 23: 1" },
  { text: "فِي الْعَالَمِ سَيَكُونُ لَكُمْ ضِيقٌ، وَلكِنْ ثِقُوا: أَنَا قَدْ غَلَبْتُ الْعَالَمَ.", reference: "يوحنا 16: 33" },
  { text: "لاَ تَخَفْ لأَنِّي مَعَكَ. لاَ تَتَلَفَّتْ لأَنِّي إِلهُكَ. قَدْ أَيَّدْتُكَ وَأَعَنْتُكَ وَعَضَدْتُكَ بِيَمِينِ بِرِّي.", reference: "إشعياء 41: 10" }
];

const IdCardIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-gray-400 dark:text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V8a2 2 0 00-2-2h-5m-4 0V5a2 2 0 012-2h2a2 2 0 012 2v1m-4 0h4" />
    </svg>
);


const VerseOfTheDay: React.FC = () => {
    const [verse, setVerse] = useState({ text: '', reference: '' });

    useEffect(() => {
        const randomIndex = Math.floor(Math.random() * verses.length);
        setVerse(verses[randomIndex]);
    }, []);

    if (!verse.text) return null;

    return (
        <div className="w-full mt-10 pt-6 border-t border-[var(--card-border-rgba)] text-center">
            <h3 className="text-sm font-bold text-[rgb(var(--color-primary-light-text-rgb))]/90 mb-2 tracking-widest uppercase">آية اليوم</h3>
            <blockquote className="text-white/80 text-lg" style={{ fontFamily: "'Amiri', serif" }}>
                <p>"{verse.text}"</p>
                <footer className="mt-2 text-xs text-white/50">({verse.reference})</footer>
            </blockquote>
        </div>
    );
};

const SearchForm: React.FC<SearchFormProps> = ({ query, setQuery, onSearch, isLoading, error, onShowTutorial }) => {
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch();
  };

  return (
    <div 
        className="w-full flex items-center justify-center p-4">
        <div className="relative w-full max-w-lg bg-[var(--card-bg-light-rgba)] dark:bg-[var(--card-bg-dark-rgba)] backdrop-blur-[var(--card-backdrop-blur)] rounded-2xl p-10 md:p-14 shadow-2xl border border-[var(--card-border-rgba)] text-center animate-fade-in-up">
            <h2 className="text-3xl lg:text-4xl font-bold text-white mb-3" style={{ fontFamily: "'El Messiri', sans-serif" }}>
              استعلم عن نتيجتك
            </h2>
            <p className="text-white/80 mb-8 max-w-md mx-auto">
              أدخل الكود الخاص بك وهو رقم العضوية الكنسية .
            </p>
            
            <form onSubmit={handleSubmit} className="w-full max-w-sm mx-auto">
              <div className="relative mb-4">
                 <div className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none">
                    <IdCardIcon />
                </div>
                <input
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="الكود ( رقم العضوية الكنسية)"
                  className="w-full px-4 py-4 pr-12 text-lg text-[var(--main-text-color-light)] dark:text-white bg-white/80 dark:bg-white/10 border-2 border-transparent focus:bg-white dark:focus:bg-white/20 rounded-xl focus:outline-none focus:ring-2 focus:ring-[rgb(var(--color-primary-rgb))] transition-all duration-300"
                  disabled={isLoading}
                />
              </div>
              
              <button
                type="submit"
                className="w-full px-8 py-4 bg-[rgb(var(--color-primary-rgb))] hover:bg-[rgb(var(--color-primary-accent-rgb))] text-white font-bold text-lg rounded-xl focus:outline-none focus:ring-4 focus:ring-[rgb(var(--color-primary-rgb))]/50 disabled:bg-[rgb(var(--color-primary-accent-rgb))] disabled:opacity-70 disabled:cursor-not-allowed transition-all duration-300 transform hover:scale-105 flex items-center justify-center gap-2 shadow-lg shadow-indigo-500/30"
                disabled={isLoading}
              >
                {isLoading ? <LoadingSpinner /> : 'بحث'}
              </button>
            </form>
            
            {error && <p className="text-red-300 bg-red-900/50 p-2 rounded-md mt-4 font-semibold">{error}</p>}
            
            <div className="mt-8">
              <button 
                onClick={onShowTutorial} 
                className="flex items-center justify-center gap-2 text-sm text-[rgb(var(--color-primary-light-text-rgb))] hover:text-white font-semibold hover:underline"
              >
                 <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                شرح طريقة الاستخدام
              </button>
            </div>

            <VerseOfTheDay />
        </div>
    </div>
  );
};

export default SearchForm;