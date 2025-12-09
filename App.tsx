import React, { useState, useCallback, useMemo, useEffect, Suspense, lazy } from 'react';
import { db, auth } from './firebaseConfig';
// @google/genai-ts: Fix: The 'firebase/firestore' module does not have exported members like 'collection', 'doc', etc. in v8. The code is being updated to use the v8-compatible syntax.
import firebase from 'firebase/compat/app';
import type { Servant, CourseResult, FullStudentProfile, Evaluation } from './types';
import SearchForm from './SearchForm';
import CertificateView from './CertificateView';
import ResultDisplay from './ResultDisplay';
import Logo from './Logo';
import LoginModal from './LoginModal';
import { useToast } from './ToastProvider';


const AdminView = lazy(() => import('./AdminView'));
const TutorialModal = lazy(() => import('./TutorialModal'));


// ----------------------------------------------------

export interface CertificateTexts {
  mainTitle: string;
  subTitle1: string;
  subTitle2: string;
  introLine: string;
  bodyLine1: string; // "الخادم في"
  bodyLine2: string; // "وذلك لاجتيازه بنجاح..."
  // bodyLine3 is the placeholder course name for replacement
  bodyLine3: string; 
  // bodyLine4 is removed and merged into bodyLine2
  bodyLine5: string; // "بتقدير عام"
  patronageTitle: string;
  patronName: string;
  responsiblePriestTitle: string;
}

// Data needed for generating a certificate
interface CertificateData {
    name: string;
    service: string;
    courseName: string;
    score: number | 'غائب';
}

export interface CustomStyles {
    cardOpacity: number;
    cardBlur: number;
    cardBorderOpacity: number;
    mainTextBrightness: number; // Kept for compatibility with old localStorage saves
    cardColor: string;
    mainTextColorLight: string;
    mainTextColorDark: string;
    primaryColor: string;
    paperSize: string;
    qualityScale: number;
}

export const defaultBgUrl = 'https://i.postimg.cc/4yWkhPNC/0c86e3d51827469990f639e43138f4ba.jpg';


const App: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [foundProfile, setFoundProfile] = useState<FullStudentProfile | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  
  const [selectedCertData, setSelectedCertData] = useState<CertificateData | null>(null);
  
  const [motivationalMessage, setMotivationalMessage] = useState<string>('');
  const [isMessageLoading, setIsMessageLoading] = useState<boolean>(false);

  const [spiritualAdvice, setSpiritualAdvice] = useState<string>('');
  const [isAdviceLoading, setIsAdviceLoading] = useState<boolean>(false);
  
  const [specialMessage, setSpecialMessage] = useState<string>('');
  const [isSpecialMessageLoading, setIsSpecialMessageLoading] = useState<boolean>(false);

  // --- Auth State ---
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isAuthLoading, setIsAuthLoading] = useState(true);
  const [isLoginModalVisible, setIsLoginModalVisible] = useState(false);
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [loginError, setLoginError] = useState('');
  
  // --- Tutorial Modal State ---
  const [isTutorialModalOpen, setIsTutorialModalOpen] = useState(false);

  // --- Theme State ---
  const [theme, setTheme] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('theme') || 'indigo';
    }
    return 'indigo';
  });

  // --- Dark Mode State ---
  const [isDarkMode, setIsDarkMode] = useState(() => {
    if (typeof window !== 'undefined') {
        return localStorage.getItem('darkMode') === 'true';
    }
    return false;
  });

  // --- Background State ---
  const [backgroundUrl, setBackgroundUrl] = useState(() => {
    if (typeof window !== 'undefined') {
        return localStorage.getItem('backgroundUrl') || defaultBgUrl;
    }
    return defaultBgUrl;
  });

  const defaultGallery = [
    'https://i.postimg.cc/Sx5hC2FK/2642ef1dd290b3ad3d2a1193e3110ae0.jpg',
    'https://i.postimg.cc/Y043yK6L/fd3ab396167b3ee5ec021a44cf182f7d.jpg',
    'https://i.postimg.cc/CLBPcD76/d4d5bd701ebd58c342ef9f74886e2cbc.jpg',
    defaultBgUrl,
  ];

  const [backgroundGallery, setBackgroundGallery] = useState<string[]>(() => {
    if (typeof window !== 'undefined') {
        const savedGallery = localStorage.getItem('backgroundGallery');
        return savedGallery ? JSON.parse(savedGallery) : defaultGallery;
    }
    return defaultGallery;
  });
  
  // --- Advanced Custom Styles State ---
  const [customStyles, setCustomStyles] = useState<CustomStyles>(() => {
    const savedStyles = typeof window !== 'undefined' ? localStorage.getItem('customStyles') : null;
     const defaults: CustomStyles = {
        cardOpacity: 0.2,
        cardBlur: 16,
        cardBorderOpacity: 0.2,
        mainTextBrightness: 1, // Kept for compatibility
        cardColor: '#000000',
        mainTextColorLight: '#374151',
        mainTextColorDark: '#e2e8f0',
        primaryColor: '#4f46e5', // Default Indigo from Tailwind
        paperSize: 'a4',
        qualityScale: 3,
    };
    if (savedStyles) {
        return { ...defaults, ...JSON.parse(savedStyles) };
    }
    return defaults;
  });

  const [certificateTexts, setCertificateTexts] = useState<CertificateTexts>({
    mainTitle: 'شهادة تقدير',
    subTitle1: 'الأمانة العامة لكنيسة القديس بولس بالعبور',
    subTitle2: 'إجتماع الخدام العام',
    introLine: 'بكل الحب والتقدير تتشرف الأمانة العامة للخدمة بمنح هذه الشهادة الي',
    bodyLine1: 'الخادم في',
    bodyLine2: 'وذلك لاجتيازه بنجاح كورس مجتمع يسوع لخدام وخادمات الكنيسة',
    bodyLine3: 'كورس مجتمع يسوع', // This acts as a placeholder for replacement
    bodyLine5: 'بتقدير عام',
    patronageTitle: 'تحت رعاية',
    patronName: 'القمص روفائيل الأنبا بيشوي\nالنائب البابوي لمدينة العبور',
    responsiblePriestTitle: 'الأب الكاهن المسئول',
  });

  const { addToast } = useToast();

  const hexToRgb = (hex: string): string | null => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? `${parseInt(result[1], 16)} ${parseInt(result[2], 16)} ${parseInt(result[3], 16)}` : null;
  };
  
  // Helper to adjust hex color brightness
  const adjustColor = (hex: string, percent: number): string => {
      let r = parseInt(hex.substring(1, 3), 16);
      let g = parseInt(hex.substring(3, 5), 16);
      let b = parseInt(hex.substring(5, 7), 16);
      const p = percent / 100;
      
      if (percent > 0) { // lighten
          r = Math.round(r + (255 - r) * p);
          g = Math.round(g + (255 - g) * p);
          b = Math.round(b + (255 - b) * p);
      } else { // darken
          r = Math.round(r * (1 + p));
          g = Math.round(g * (1 + p));
          b = Math.round(b * (1 + p));
      }

      const toHex = (c: number) => ('00' + Math.max(0, Math.min(255, c)).toString(16)).slice(-2);
      return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
  };

  useEffect(() => {
    // @google/genai-ts: Fix: 'onAuthStateChanged' is not an exported member of 'firebase/auth' in v8. Use 'auth.onAuthStateChanged' instead.
    const unsubscribe = auth.onAuthStateChanged(user => {
        setIsLoggedIn(!!user);
        setIsAuthLoading(false);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const isModalOpen = isLoginModalVisible || isTutorialModalOpen;
    if (isModalOpen) {
        document.body.style.overflow = 'hidden';
    } else {
        document.body.style.overflow = 'unset';
    }
    return () => {
        document.body.style.overflow = 'unset';
    };
  }, [isLoginModalVisible, isTutorialModalOpen]);

  useEffect(() => {
    document.documentElement.classList.remove('theme-indigo', 'theme-teal', 'theme-rose', 'theme-purple', 'theme-green', 'theme-amber', 'theme-cyan', 'theme-lime');
    if (theme) {
        document.documentElement.classList.add(`theme-${theme}`);
        localStorage.setItem('theme', theme);
    }
  }, [theme]);
  
  useEffect(() => {
    const root = window.document.documentElement;
    if (isDarkMode) {
        root.classList.add('dark');
        localStorage.setItem('darkMode', 'true');
    } else {
        root.classList.remove('dark');
        localStorage.setItem('darkMode', 'false');
    }
  }, [isDarkMode]);

  // Sync backgroundUrl with LocalStorage AND Listen to Firebase
  useEffect(() => {
      // Save to local storage as fallback/cache
      localStorage.setItem('backgroundUrl', backgroundUrl);
  }, [backgroundUrl]);

  // Listen to global settings from Firestore
  useEffect(() => {
      const settingsRef = db.collection('settings').doc('general');
      const unsubscribe = settingsRef.onSnapshot((doc) => {
          if (doc.exists) {
              const data = doc.data();
              if (data && data.backgroundUrl) {
                  setBackgroundUrl(data.backgroundUrl);
              }
          }
      }, (error: any) => {
          // Suppress permission-denied errors to avoid console noise for visitors without admin access
          if (error?.code === 'permission-denied' || error?.message?.includes('permission')) {
              // Silently ignore permission errors for viewers
              console.log("Global settings sync unavailable (using defaults).");
          } else {
              console.error("Error fetching global settings:", error);
          }
      });

      return () => unsubscribe();
  }, []);

  useEffect(() => {
      localStorage.setItem('backgroundGallery', JSON.stringify(backgroundGallery));
  }, [backgroundGallery]);
  
  useEffect(() => {
    const root = document.documentElement;

    // Card background color and opacity
    const cardRgb = hexToRgb(customStyles.cardColor) || '0 0 0';
    root.style.setProperty('--card-bg-light-rgba', `rgba(${cardRgb.replace(/ /g, ',')}, ${customStyles.cardOpacity * 0.5})`);
    root.style.setProperty('--card-bg-dark-rgba', `rgba(${cardRgb.replace(/ /g, ',')}, ${customStyles.cardOpacity})`);

    // Other card styles
    root.style.setProperty('--card-backdrop-blur', `${customStyles.cardBlur}px`);
    root.style.setProperty('--card-border-rgba', `rgba(255, 255, 255, ${customStyles.cardBorderOpacity})`);
    
    // Text colors
    root.style.setProperty('--main-text-color-light', customStyles.mainTextColorLight);
    root.style.setProperty('--main-text-color-dark', customStyles.mainTextColorDark);
    
    // Primary theme color and its variations
    const primaryRgb = hexToRgb(customStyles.primaryColor);
    if (primaryRgb) {
        root.style.setProperty('--color-primary-rgb', primaryRgb);

        const accentColor = adjustColor(customStyles.primaryColor, -10); // darken for hover
        const accentRgb = hexToRgb(accentColor);
        if (accentRgb) root.style.setProperty('--color-primary-accent-rgb', accentRgb);
        
        const lightColor = adjustColor(customStyles.primaryColor, 90); // lighten for light backgrounds
        const lightRgb = hexToRgb(lightColor);
        if (lightRgb) root.style.setProperty('--color-primary-light-rgb', lightRgb);

        // For text colors that are the primary color
        root.style.setProperty('--color-primary-dark-text-rgb', primaryRgb);
        const lightTextColor = adjustColor(customStyles.primaryColor, 20); // lighten for links
        const lightTextRgb = hexToRgb(lightTextColor);
        if (lightTextRgb) root.style.setProperty('--color-primary-light-text-rgb', lightTextRgb);
    }

    localStorage.setItem('customStyles', JSON.stringify(customStyles));
  }, [customStyles]);


  const handleSearch = useCallback(async () => {
    if (!searchQuery.trim()) {
      setError('يرجى إدخال الكود أو رقم الموبايل');
      setFoundProfile(null);
      return;
    }
    
    setIsLoading(true);
    setError('');
    setFoundProfile(null);
    
    const queryLog = {
      searchedId: searchQuery,
      // @google/genai-ts: Fix: 'serverTimestamp' is not an exported member of 'firebase/firestore' in v8. Use 'firebase.firestore.FieldValue.serverTimestamp()' instead.
      timestamp: firebase.firestore.FieldValue.serverTimestamp(),
      foundCode: '',
      foundName: '',
    };

    try {
        const queryTrimmed = searchQuery.trim();

        if (queryTrimmed.startsWith('0')) {
            setError('لم يتم العثور على خادم بهذا الكود');
            setIsLoading(false);
            return;
        }
        
        // @google/genai-ts: Fix: The 'firebase/firestore' module does not have an exported member 'collection'. Use 'db.collection()' instead for v8 compatibility.
        const servantsRef = db.collection("servants");
        let servantData: Servant | null = null;
        let servantCode: string | null = null;

        if (!isNaN(Number(queryTrimmed))) {
            // @google/genai-ts: Fix: 'getDoc' and 'doc' are not exported members of 'firebase/firestore' in v8. Use the chained '.doc().get()' syntax instead.
            const servantDocSnap = await servantsRef.doc(queryTrimmed).get();
            if (servantDocSnap.exists) {
                servantData = servantDocSnap.data() as Servant;
                servantCode = servantDocSnap.id;
            } else {
                let withZero, withoutZero;
                if (queryTrimmed.startsWith('0')) {
                    withZero = queryTrimmed;
                    withoutZero = queryTrimmed.substring(1);
                } else {
                    withZero = '0' + queryTrimmed;
                    withoutZero = queryTrimmed;
                }
                const mobileAsNumber = parseInt(withoutZero, 10);
                // @google/genai-ts: Fix: 'getDocs', 'query', 'where', and 'limit' are not exported from 'firebase/firestore' in v8. Use the chained '.where().limit().get()' syntax.
                const mobileQuerySnap = await servantsRef.where("mobileNumber", "in", [withZero, withoutZero, mobileAsNumber]).limit(1).get();
                if (!mobileQuerySnap.empty) {
                    const foundDoc = mobileQuerySnap.docs[0];
                    servantData = foundDoc.data() as Servant;
                    servantCode = foundDoc.id;
                }
            }
        } else {
            setError('البحث بالاسم غير مدعوم حالياً. يرجى استخدام الكود أو رقم الموبايل.');
            setIsLoading(false);
            return;
        }

        if (servantData && servantCode) {
            queryLog.foundCode = servantCode;
            queryLog.foundName = servantData.name;

            const servantCodeAsNumber = parseInt(servantCode, 10);

            // @google/genai-ts: Fix: 'collection' is not an exported member of 'firebase/firestore' in v8. Use 'db.collection()' instead.
            const resultsRef = db.collection("courseResults");
            // @google/genai-ts: Fix: 'query', 'where', and 'getDocs' are not exported from 'firebase/firestore' in v8. Use the chained '.where().get()' syntax.
            const resultsQuery = resultsRef.where("servantCode", "in", [servantCode, servantCodeAsNumber]);
            const resultsSnapshot = await resultsQuery.get();
            const results = resultsSnapshot.docs.map(doc => doc.data() as CourseResult);

            // De-duplicate results, keeping the one with the highest score for each course/year.
            const uniqueResultsMap = new Map<string, CourseResult>();
            for (const result of results) {
                // Use date if available, otherwise year
                const timeKey = result.date ? result.date : result.year;
                const key = `${result.courseName}|${timeKey}`;
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
            const deDupedResults = Array.from(uniqueResultsMap.values());

            // @google/genai-ts: Fix: 'collection' is not an exported member of 'firebase/firestore' in v8. Use 'db.collection()' instead.
            const evaluationsRef = db.collection("evaluations");
            // @google/genai-ts: Fix: 'query', 'where', and 'getDocs' are not exported from 'firebase/firestore' in v8. Use the chained '.where().get()' syntax.
            const evaluationsQuery = evaluationsRef.where("servantCode", "in", [servantCode, servantCodeAsNumber]);
            const evaluationsSnapshot = await evaluationsQuery.get();
            const evaluations = evaluationsSnapshot.docs.map(doc => {
                const data = doc.data() as any;
                if (data.scores && typeof data.overallAverage === 'number') {
                    // It's already new format, just ensure it has an id
                    return { id: doc.id, ...data } as Evaluation;
                }

                // Old format, convert it
                const rating = data.rating || 0;
                const overallAverage = rating * 20;

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
                    scores,
                    overallAverage,
                    generalNotes: data.notes,
                };
                return convertedEvaluation;
            });
            
            const serviceNames = new Set<string>();

            if (Array.isArray(servantData.allServices) && servantData.allServices.length > 0) {
                servantData.allServices.forEach(s => {
                    if (s && s.trim()) serviceNames.add(s.trim());
                });
            } else {
                if (servantData.primaryService && servantData.primaryService.trim()) {
                    serviceNames.add(servantData.primaryService.trim());
                }
                evaluations.forEach(evaluation => {
                    if (evaluation.serviceName && evaluation.serviceName.trim()) {
                        serviceNames.add(evaluation.serviceName.trim());
                    }
                });
            }

            const allUniqueServices = Array.from(serviceNames);

            const augmentedServant: Servant = {
                ...servantData,
                code: servantCode,
                allServices: allUniqueServices,
            };

            setFoundProfile({ servant: augmentedServant, results: deDupedResults, evaluations });

        } else {
            setFoundProfile(null);
            setError('لم يتم العثور على خادم بهذا الكود');
        }
    } catch (err: any) {
      console.error("Error searching Firestore:", err);
      if (err.code === 'permission-denied') {
          setError('خطأ في الأذونات. لا يمكن الوصول إلى قاعدة البيانات. يرجى مراجعة مسؤول الخدمة.');
      } else {
          setError('حدث خطأ أثناء البحث. يرجى المحاولة مرة أخرى.');
      }
    } finally {
      setIsLoading(false);
      // Per user suggestion, log all successful searches to get better usage metrics.
      // A successful search is one where a profile was found.
      if (queryLog.foundCode) {
          try {
            await db.collection("queryLogs").add(queryLog);
          } catch (logError: any) {
            // This is a background task, so we don't show an error to the user.
            // This might fail due to Firestore permissions, which need to be configured
            // in the Firebase console to allow public writes to 'queryLogs'.
            if (logError?.code !== 'permission-denied') {
                console.error("Error writing to query log:", logError);
            }
          }
      }
    }
  }, [searchQuery]);
  
  const resetSearch = () => {
    setSearchQuery('');
    setFoundProfile(null);
    setSelectedCertData(null);
    setError('');
    setMotivationalMessage('');
    setSpiritualAdvice('');
    setSpecialMessage('');
  };

  const handleShowCertificate = (data: CertificateData) => {
    setSelectedCertData(data);
  };
  
  // --- الكود الآمن الجديد ---

  // دالة مساعدة جديدة تتصل بالخادم الآمن
  const callSecureGenerator = async (prompt: string, errorSetter: (msg: string) => void): Promise<string | null> => {
      try {
          const response = await fetch('/.netlify/functions/gemini', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ contents: prompt }),
          });

          if (!response.ok) {
              const errorBody = await response.json();
              console.error('Proxy Error:', errorBody);
              throw new Error(errorBody.error || 'Failed to fetch response from proxy.');
          }

          const data = await response.json();
          // The Netlify function might return a simplified object { text: "..." }
          // or the full GenerateContentResponse where the .text getter is lost in serialization.
          // This handles both cases and also allows for empty strings as a valid response.
          const text = data.text ?? data?.candidates?.[0]?.content?.parts?.[0]?.text;

          if (text === undefined || text === null) {
              console.error("No text found in response:", data);
              throw new Error("لم يتم العثور على رد نصي من المساعد.");
          }
          return text;
      } catch (err: any) {
          console.error("Error with proxy or Gemini API:", err);
          let errorMessage = "حدث خطأ أثناء التواصل مع المساعد الذكي. يرجى المحاولة مرة أخرى.";
          if (err.message && err.message.includes("API key not configured")) {
              errorMessage = "عفواً، خدمة الذكاء الاصطناعي غير متاحة حالياً بسبب مشكلة في الإعدادات. يرجى التواصل مع مسؤول الخدمة.";
          }
          errorSetter(errorMessage); // عرض الخطأ في الواجهة
          return null;
      }
  };

  // الدالة الأولى (آمنة)
  const handleGenerateMessage = useCallback(async () => {
      if (!foundProfile) return;
      setIsMessageLoading(true);
      setMotivationalMessage('');
      setSpiritualAdvice('');
      setSpecialMessage('');

      const errorSetter = (msg: string) => {
          setMotivationalMessage(msg);
          addToast(msg, 'error'); // إظهار الخطأ للمستخدم
      };

      const successfulResult = foundProfile.results.find(r => r.score !== 'غائب');
      const prompt = `اكتب رسالة تشجيعية وملهمة قصيرة (سطرين أو ثلاثة) ذات طابع مسيحي لـ "${foundProfile.servant.name}" الذي يخدم في كنيسة القديس بولس بالعبور. ${successfulResult ? `وكانت إحدى درجاته في أحد الكورسات هي ${successfulResult.score} من 100.` : ''}`;
      
      const generatedText = await callSecureGenerator(prompt, errorSetter);
      if (generatedText !== null) {
          setMotivationalMessage(generatedText);
          addToast('تم إنشاء الرسالة بنجاح!', 'success');
      }
      setIsMessageLoading(false);
  }, [foundProfile, addToast]); // أضفنا addToast هنا

  // الدالة الثانية (آمنة)
  const handleGenerateAdvice = useCallback(async () => {
      if (!foundProfile) return;
      setIsAdviceLoading(true);
      setSpiritualAdvice('');
      setMotivationalMessage('');
      setSpecialMessage('');

      const errorSetter = (msg: string) => {
          setSpiritualAdvice(msg);
          addToast(msg, 'error');
      };

      const prompt = `اكتب نصيحة روحية قصيرة (من 3 إلى 5 أسطر) للخادم الروحي "${foundProfile.servant.name}"، مستوحاة من تعاليم وكتابات قداسة البابا شنودة الثالث عن الخدمة والخدام.`;

      const generatedText = await callSecureGenerator(prompt, errorSetter);
      if (generatedText !== null) {
          setSpiritualAdvice(generatedText);
          addToast('تم إنشاء النصيحة بنجاح!', 'success');
      }
      setIsAdviceLoading(false);
  }, [foundProfile, addToast]); // أضفنا addToast هنا

  // الدالة الثالثة (آمنة)
  const handleGenerateSpecialMessage = useCallback(async () => {
      if (!foundProfile) return;
      setIsSpecialMessageLoading(true);
      setSpecialMessage('');
      setMotivationalMessage('');
      setSpiritualAdvice('');

      const errorSetter = (msg: string) => {
          setSpecialMessage(msg);
          addToast(msg, 'error');
      };

      const fullName = foundProfile.servant.name;
      const firstName = fullName.split(' ')[0];
      
      const prompt = `اكتب رسالة شخصية ذات طابع مسيحي روحي إلى ${fullName}.
      يجب أن تبدأ الرسالة بمخاطبة ${fullName} مباشرة.
      يجب أن تذكر اسمه الأول، "${firstName}"، مرتين في متن الرسالة.
      الرسالة يجب أن تحثه بلطف ومحبة على أهمية الحضور والمشاركة في اجتماعات الكورس القادمة، وتؤكد على أن وجوده ومشاركته يضيفان قيمة كبيرة للمجموعة وأن الجميع يفتقده.
      الرسالة يجب ألا تزيد عن 12 سطراً.
      مهم جداً: لا تقم بإضافة أي خاتمة أو توقيع في نهاية الرسالة، فقط محتوى الرسالة نفسها.`;

      const generatedText = await callSecureGenerator(prompt, errorSetter);
      if (generatedText !== null) {
          const finalMessage = generatedText.trim() + "\n\nراعي الامانة العامة / أبونا يوسيف سيدهم";
          setSpecialMessage(finalMessage);
          addToast('تم إنشاء الرسالة الخاصة بنجاح!', 'success');
      }
      setIsSpecialMessageLoading(false);
  }, [foundProfile, addToast]); // أضفنا addToast هنا

  const handleLogin = async (email: string, pass: string) => {
      setIsLoggingIn(true);
      setLoginError('');
      try {
          // @google/genai-ts: Fix: 'signInWithEmailAndPassword' is not an exported member of 'firebase/auth' in v8. Use 'auth.signInWithEmailAndPassword' instead.
          await auth.signInWithEmailAndPassword(email, pass);
          localStorage.setItem('loginEmail', email); // Remember email on successful login
          setIsLoginModalVisible(false);
      } catch (error: any) {
          if (error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password' || error.code === 'auth/invalid-credential') {
              setLoginError('البريد الإلكتروني أو كلمة السر غير صحيحة.');
          } else if (error.code === 'auth/network-request-failed') {
              setLoginError('حدث خطأ في الشبكة. يرجى التحقق من اتصالك بالإنترنت والمحاولة مرة أخرى.');
          } else {
              setLoginError('حدث خطأ غير متوقع. يرجى المحاولة مرة أخرى.');
          }
          console.error("Login failed:", error);
      } finally {
          setIsLoggingIn(false);
      }
  };

  const handleLogout = async () => {
      // @google/genai-ts: Fix: 'signOut' is not an exported member of 'firebase/auth' in v8. Use 'auth.signOut()' instead.
      await auth.signOut();
  };
  

  const renderContent = () => {
    if (selectedCertData) {
      return (
        <CertificateView 
          certData={selectedCertData}
          onBackToResult={() => setSelectedCertData(null)}
          certificateTexts={certificateTexts}
          customStyles={customStyles}
        />
      );
    }
    if (foundProfile) {
      return (
        <ResultDisplay
          profile={foundProfile}
          onShowCertificate={handleShowCertificate}
          onGenerateMessage={handleGenerateMessage}
          motivationalMessage={motivationalMessage}
          isMessageLoading={isMessageLoading}
          onGenerateAdvice={handleGenerateAdvice}
          spiritualAdvice={spiritualAdvice}
          isAdviceLoading={isAdviceLoading}
          onGenerateSpecialMessage={handleGenerateSpecialMessage}
          specialMessage={specialMessage}
          isSpecialMessageLoading={isSpecialMessageLoading}
          onNewSearch={resetSearch}
        />
      );
    }
    return (
      <SearchForm
        query={searchQuery}
        setQuery={setSearchQuery}
        onSearch={handleSearch}
        isLoading={isLoading}
        error={error}
        onShowTutorial={() => setIsTutorialModalOpen(true)}
      />
    );
  };

  const loadingFallback = (
    <main className="w-full max-w-7xl mx-auto flex-grow flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[rgb(var(--color-primary-rgb))]"></div>
    </main>
  );

  return (
    <div className="relative min-h-screen bg-gray-100 text-[var(--main-text-color-light)] flex flex-col items-center p-4 transition-colors duration-300">
        {/* Background Image */}
        <div
            className="absolute inset-0 bg-cover bg-center bg-fixed"
            style={{ backgroundImage: `url('${backgroundUrl}')` }}
        ></div>
        {/* Dark Mode Overlay */}
        <div className={`absolute inset-0 bg-black/75 transition-opacity duration-500 ${isDarkMode ? 'opacity-100' : 'opacity-0'} pointer-events-none`}></div>

        <div className="relative z-10 w-full flex flex-col flex-grow items-center dark:text-[var(--main-text-color-dark)]">
            <header className="w-full max-w-7xl mx-auto text-center py-8 no-print">
                <Logo className="w-40 h-40 object-contain mx-auto" alt="شعار كنيسة القديس بولس الرسول بالعبور" />
                <h1 className="text-3xl md:text-4xl font-bold text-white [text-shadow:_0_2px_4px_rgb(0_0_0_/_40%)] dark:text-[rgb(var(--color-primary-light-text-rgb))] mt-4">كنيسة القديس بولس الرسول بالعبور</h1>
                <p className="text-2xl text-slate-100 [text-shadow:_0_2px_4px_rgb(0_0_0_/_40%)] dark:text-slate-300 mt-1">الأمانة العامة للخدمة</p>
                <p className="text-xl text-slate-200 [text-shadow:_0_2px_4px_rgb(0_0_0_/_40%)] dark:text-slate-400 mt-2">استعلام عن نتائج الكورسات وإصدار شهادات التقدير</p>
            </header>

            {isLoggedIn ? (
                <Suspense fallback={loadingFallback}>
                    <AdminView
                        onLogout={handleLogout}
                        certificateTexts={certificateTexts}
                        setCertificateTexts={setCertificateTexts}
                        setTheme={setTheme}
                        isDarkMode={isDarkMode}
                        setIsDarkMode={setIsDarkMode}
                        customStyles={customStyles}
                        setCustomStyles={setCustomStyles}
                        setBackgroundUrl={setBackgroundUrl}
                        backgroundUrl={backgroundUrl}
                        backgroundGallery={backgroundGallery}
                        setBackgroundGallery={setBackgroundGallery}
                    />
                </Suspense>
            ) : (
                <main className="w-full max-w-7xl mx-auto flex-grow flex items-center justify-center">
                    {renderContent()}
                </main>
            )}

            {isLoginModalVisible && (
                <LoginModal
                    onClose={() => setIsLoginModalVisible(false)}
                    onLogin={handleLogin}
                    isLoggingIn={isLoggingIn}
                    loginError={loginError}
                />
            )}

            {isTutorialModalOpen && (
                <Suspense fallback={null}>
                    <TutorialModal onClose={() => setIsTutorialModalOpen(false)} />
                </Suspense>
            )}

            <footer className="w-full text-center p-4 text-slate-200 [text-shadow:_0_1px_2px_rgb(0_0_0_/_30%)] dark:text-slate-400 mt-8 no-print">
                <p>&copy; {new Date().getFullYear()} كنيسة القديس بولس الرسول بالعبور. كل الحقوق محفوظة.</p>
                {!isAuthLoading && (
                    <div className="flex justify-center items-center gap-4">
                        {isLoggedIn ? (
                            <button onClick={handleLogout} className="mt-2 text-slate-200 hover:text-white dark:text-slate-400 dark:hover:text-slate-200 underline text-sm">
                                خروج
                            </button>
                        ) : (
                            <button onClick={() => { setLoginError(''); setIsLoginModalVisible(true); }} className="mt-2 text-transparent hover:text-slate-200 dark:hover:text-slate-200 underline text-sm">
                                لوحة تحكم
                            </button>
                        )}
                    </div>
                )}
            </footer>
        </div>
    </div>
  );
};

export default App;