
import React from 'react';
import Logo from './Logo';
import type { CertificateTexts } from './App';

// A simplified type for what this component actually needs to render
interface CertificateDisplayData {
  name: string;
  service: string;
  score: number | 'غائب';
  courseName: string; // Add courseName here
}


const getGrade = (score: number): string => {
  if (score >= 90) return 'ممتاز';
  if (score >= 80) return 'جيد جدًا';
  if (score >= 70) return 'جيد';
  if (score >= 60) return 'مقبول';
  return 'ناجح';
};

// Color schemes definition
const colorSchemes: Record<string, Record<string, string>> = {
  gold: {
    border: '#D4AF37',
    text: '#5D4037',
    header: '#4A2C2A',
    background: '#FDFBF5',
    frameAccent: '#EADCB3',
  },
  blue: {
    border: '#4A90E2',
    text: '#004085',
    header: '#002752',
    background: '#F0F8FF',
    frameAccent: '#B0C4DE',
  },
  green: {
    border: '#2E7D32',
    text: '#1B5E20',
    header: '#003300',
    background: '#F5FFF5',
    frameAccent: '#A5D6A7',
  },
  maroon: {
    border: '#880E4F',
    text: '#560027',
    header: '#4A001F',
    background: '#FFF5F8',
    frameAccent: '#F48FB1',
  },
};

interface CertificateProps {
  result: CertificateDisplayData;
  fontFamily: string;
  colorScheme: string;
  certificateDesign: string;
  fontColor: string;
  certificateRef: React.RefObject<HTMLDivElement>;
  certificateTexts: CertificateTexts;
}

export const Certificate: React.FC<CertificateProps> = ({
  result,
  fontFamily,
  colorScheme,
  certificateDesign,
  fontColor,
  certificateRef,
  certificateTexts,
}) => {
  const activeColorScheme = colorSchemes[colorScheme] || colorSchemes.gold;
  
  const getDynamicTextStyle = (
    baseColor: string,
    dynamicColor: string
  ): React.CSSProperties => {
      const baseStyle: React.CSSProperties = {
          textShadow: '1px 1px 3px rgba(0, 0, 0, 0.25)',
      };

      if (dynamicColor === 'default') {
          return { ...baseStyle, color: baseColor };
      }
      switch (dynamicColor) {
          case 'shinyGold':
              return { ...baseStyle, color: '#B8860B' };
          case 'royalBlue':
              return { ...baseStyle, color: '#4169E1' };
          case 'emeraldGreen':
              return { ...baseStyle, color: '#2ECC71' };
          case 'deepMaroon':
              return { ...baseStyle, color: '#AD1457' };
          default:
              return { ...baseStyle, color: baseColor };
      }
  };

  const specialTitleStyle = getDynamicTextStyle(activeColorScheme.header, fontColor);
  const regularTextStyle = { color: activeColorScheme.text };

  const paragraphClass = fontFamily === "'Amiri', serif"
    ? "text-base sm:text-xl md:text-2xl leading-relaxed"
    : "text-sm sm:text-lg md:text-xl leading-relaxed";

  const BorderWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const innerPadding = 'pt-0 pb-4 sm:pb-6 px-4 sm:px-6';
    
    switch (certificateDesign) {
      case 'nader':
      case 'rare':
        return (
          <div
            style={{
              backgroundImage: `url('https://i.postimg.cc/Fs1d8n0C/2.png')`,
              backgroundSize: '100% 100%',
              backgroundRepeat: 'no-repeat',
              backgroundPosition: 'center',
            }}
            className={`h-full flex flex-col pt-8 pb-6 px-10 sm:pt-10 sm:pb-8 sm:px-12`}
          >
            {children}
          </div>
        );
      case 'nader_new_ar':
        return (
          <div
            style={{
              backgroundImage: `url('https://i.postimg.cc/28Q2tymW/6.png')`,
              backgroundSize: '100% 100%',
              backgroundRepeat: 'no-repeat',
              backgroundPosition: 'center',
            }}
            className={`h-full flex flex-col pt-8 pb-6 px-10 sm:pt-10 sm:pb-8 sm:px-12`}
          >
            {children}
          </div>
        );
      case 'nader_new_en':
        return (
          <div
            style={{
              backgroundImage: `url('https://i.postimg.cc/hjJgzp5P/5.png')`,
              backgroundSize: '100% 100%',
              backgroundRepeat: 'no-repeat',
              backgroundPosition: 'center',
            }}
            className={`h-full flex flex-col pt-8 pb-6 px-10 sm:pt-10 sm:pb-8 sm:px-12`}
          >
            {children}
          </div>
        );
      case 'modern':
        return (
          <div style={{ padding: '8px', border: `2px solid ${activeColorScheme.border}` }} className="h-full flex flex-col">
            <div style={{ border: `6px solid ${activeColorScheme.frameAccent}` }} className={`h-full flex flex-col ${innerPadding}`}>
              {children}
            </div>
          </div>
        );
      case 'formal':
        return (
          <div style={{ padding: '4px', border: `1px solid ${activeColorScheme.border}` }} className="h-full flex flex-col">
            <div style={{ padding: '4px', border: `4px solid ${activeColorScheme.border}` }} className="h-full flex flex-col">
               <div style={{ border: `1px solid ${activeColorScheme.border}` }} className={`h-full flex flex-col ${innerPadding}`}>
                 {children}
               </div>
            </div>
          </div>
        );
      case 'vintage':
        return (
          <div style={{ padding: '4px', border: `1px solid ${activeColorScheme.frameAccent}` }} className="h-full flex flex-col">
            <div style={{ padding: '8px', border: `6px groove ${activeColorScheme.border}` }} className="h-full flex flex-col">
              <div style={{ border: `1px solid ${activeColorScheme.frameAccent}` }} className={`h-full flex flex-col ${innerPadding}`}>
                {children}
              </div>
            </div>
          </div>
        );
      case 'classic':
      default:
        return (
          <div style={{ padding: '12px', border: `12px double ${activeColorScheme.border}` }} className={`h-full flex flex-col ${innerPadding}`}>
            {children}
          </div>
        );
    }
  };

  // Robust replacement logic for Course Name styling
  const placeholder = certificateTexts.bodyLine3;
  const fullBodyText = certificateTexts.bodyLine2;
  let textPre = "";
  let textPost = "";
  let hasSeparator = false;

  // Try to find the exact placeholder from settings
  if (placeholder && fullBodyText.includes(placeholder)) {
      const parts = fullBodyText.split(placeholder);
      textPre = parts[0];
      textPost = parts.slice(1).join(placeholder);
      hasSeparator = true;
  } else if (fullBodyText.includes('كورس مجتمع يسوع')) {
      // Fallback 1: force split default phrase 'كورس مجتمع يسوع'
      const parts = fullBodyText.split('كورس مجتمع يسوع');
      textPre = parts[0];
      textPost = parts.slice(1).join('كورس مجتمع يسوع');
      hasSeparator = true;
  } else {
      // Fallback 2: No placeholder found, assume course name goes at the end if strict replacement fails
      // However, to keep it clean, we will just use the full text but appending the course name might look double if not careful.
      // Better strategy: If we can't find a place to put it, we assume the user wrote a generic text and we append the specific course name.
      textPre = fullBodyText + " ";
      textPost = "";
      hasSeparator = true; 
  }


  return (
    <div
      ref={certificateRef}
      className="w-full max-w-5xl bg-white shadow-lg flex flex-col"
      style={{
        backgroundColor: activeColorScheme.background,
        aspectRatio: '297 / 210',
      }}
    >
      <BorderWrapper>
        <div className="w-full h-full relative">
            <div style={{
                position: 'absolute',
                top: 0, left: 0, width: '100%', height: '100%',
                backgroundImage: `url('https://i.postimg.cc/3NwDhXRv/image.png')`,
                backgroundSize: '35%',
                backgroundPosition: 'center 65%',
                backgroundRepeat: 'no-repeat',
                opacity: 0.1,
            }} />
            
            <div className="w-full h-full flex flex-col text-center" style={{ fontFamily, position: 'relative' }}>
               <header className="flex flex-row items-start justify-between gap-x-4 mb-2 sm:mb-4 md:mb-6 px-1 md:px-4">
                  <img
                    src="https://i.postimg.cc/7YGfNYTP/Add-a-new-certificate-design-option-called-minimalist-with-a-simple-clean-border-and-minimal-deco.png"
                    alt="شعار مجتمع يسوع"
                    className="w-16 h-16 sm:w-24 sm:h-24 md:w-32 md:h-32 object-contain flex-shrink-0"
                  />
                  <div className="text-center mt-0 sm:mt-2 md:mt-3">
                      <h2 className="text-2xl sm:text-3xl md:text-5xl font-black" style={{ ...specialTitleStyle, fontFamily: "'Cairo', sans-serif" }}>
                        {certificateTexts.mainTitle}
                      </h2>
                       <p className="text-xs sm:text-base md:text-lg mt-5 sm:mt-6 font-semibold" style={{ ...regularTextStyle, fontFamily: "'Cairo', sans-serif" }}>
                        {certificateTexts.subTitle1}
                      </p>
                      <p className="text-xs sm:text-base md:text-lg mt-1 font-semibold" style={{ ...regularTextStyle, fontFamily: "'Cairo', sans-serif" }}>
                        {certificateTexts.subTitle2}
                      </p>
                  </div>
                  <Logo className="w-16 h-16 sm:w-24 sm:h-24 md:w-32 md:h-32 object-contain flex-shrink-0" />
                </header>
    
              <main className="flex-grow flex flex-col items-center justify-center px-1 md:px-4">
                <p className="mt-1 sm:mt-2 md:mt-4 text-xs sm:text-base md:text-lg" style={regularTextStyle}>
                  {certificateTexts.introLine}
                </p>
                <h3 className="my-1 sm:my-2 md:my-4 text-xl sm:text-3xl md:text-4xl font-bold" style={{ ...specialTitleStyle, fontFamily: fontFamily }}>
                  {result.name}
                </h3>
                <p className={paragraphClass} style={regularTextStyle}>
                  {certificateTexts.bodyLine1} <strong style={specialTitleStyle}>{result.service}</strong>{' '}
                  {hasSeparator ? (
                      <>
                          {textPre}
                          <strong style={{...specialTitleStyle, fontSize: '1.1em'}}>{result.courseName}</strong>
                          {textPost}
                      </>
                  ) : (
                      fullBodyText
                  )}
                </p>
                <p className={`${paragraphClass} mt-2 text-center`} style={regularTextStyle}>
                  {certificateTexts.bodyLine5} <strong style={specialTitleStyle}>{typeof result.score === 'number' ? getGrade(result.score) : 'ناجح'}</strong>.
                </p>
              </main>
    
              <footer className="mt-auto pt-2 sm:pt-4 md:pt-8 pb-4 sm:pb-6 md:pb-8 px-2 sm:px-4 md:px-8 flex justify-between items-center w-full">
                <div className="text-center">
                  <p className="text-[10px] sm:text-sm md:text-base font-semibold" style={regularTextStyle}>{certificateTexts.patronageTitle}</p>
                  <p className="text-[10px] sm:text-sm md:text-base whitespace-pre-wrap" style={regularTextStyle}>
                    {certificateTexts.patronName}
                  </p>
                </div>
                <div className="text-center">
                  <p className="text-[10px] sm:text-sm md:text-base font-semibold" style={regularTextStyle}>{certificateTexts.responsiblePriestTitle}</p>
                  <div className="border-t mt-8 sm:mt-10 w-20 sm:w-32 md:w-44" style={{ borderColor: activeColorScheme.text }}></div>
                </div>
              </footer>
            </div>
        </div>
      </BorderWrapper>
    </div>
  );
};

export default Certificate;
