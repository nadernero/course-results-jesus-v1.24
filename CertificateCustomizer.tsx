import React from 'react';

export const fontOptions = {
  "'Noto Naskh Arabic', serif": 'نسخ (Naskh)',
  "'Cairo', sans-serif": 'نادر (Cairo)',
  "'Amiri', serif": 'أميري (Amiri)',
  "'El Messiri', sans-serif": 'المسيري (El Messiri)',
  "'Dancing Script', cursive": 'Dancing Script',
  "'Lobster', cursive": 'Lobster',
};

export const colorSchemeOptions = {
  gold: 'ذهبي وبني',
  blue: 'أزرق ووميض',
  green: 'أخضر وذهبي',
  maroon: 'عنابي وذهبي',
};

export const fontColorOptions = {
  default: 'لون التصميم الافتراضي',
  shinyGold: 'ذهبي',
  royalBlue: 'أزرق ملكي',
  emeraldGreen: 'أخضر زمردي',
  deepMaroon: 'عنابي غامق',
};

export const certificateDesignOptions = {
  classic: 'كلاسيكي (مزدوج)',
  modern: 'حديث (بسيط)',
  formal: 'رسمي (متعدد)',
  vintage: 'عتيق (زخارف قديمة)',
  rare: 'الإطار الذهبي',
  nader_new_ar: 'نادر',
  nader_new_en: 'Nader',
};

interface CertificateCustomizerProps {
  fontFamily: string;
  setFontFamily: (font: string) => void;
  colorScheme: string;
  setColorScheme: (scheme: string) => void;
  certificateDesign: string;
  setCertificateDesign: (design: string) => void;
  fontColor: string;
  setFontColor: (color: string) => void;
}

const CertificateCustomizer: React.FC<CertificateCustomizerProps> = ({
  fontFamily, setFontFamily,
  colorScheme, setColorScheme,
  certificateDesign, setCertificateDesign,
  fontColor, setFontColor,
}) => {
  return (
    <div className="w-full max-w-5xl mb-6 bg-gray-50/80 backdrop-blur-sm p-4 rounded-lg border border-gray-200 shadow-sm">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Font Family */}
        <div>
          <label htmlFor="font-family" className="block text-sm font-medium text-gray-700 mb-1">
            نوع خط الاسم
          </label>
          <select
            id="font-family"
            value={fontFamily}
            onChange={(e) => setFontFamily(e.target.value)}
            className="w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
          >
            {Object.entries(fontOptions).map(([value, label]) => (
              <option key={value} value={value} style={{ fontFamily: value }}>
                {label}
              </option>
            ))}
          </select>
        </div>

        {/* Color Scheme */}
        <div>
          <label htmlFor="color-scheme" className="block text-sm font-medium text-gray-700 mb-1">
            نظام الألوان
          </label>
          <select
            id="color-scheme"
            value={colorScheme}
            onChange={(e) => setColorScheme(e.target.value)}
            className="w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
          >
             {Object.entries(colorSchemeOptions).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </div>
        
        {/* Font Color */}
        <div>
          <label htmlFor="font-color" className="block text-sm font-medium text-gray-700 mb-1">
            لون الخط
          </label>
          <select
            id="font-color"
            value={fontColor}
            onChange={(e) => setFontColor(e.target.value)}
            className="w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
          >
            {Object.entries(fontColorOptions).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </div>

        {/* Certificate Design */}
        <div>
          <label htmlFor="certificate-design" className="block text-sm font-medium text-gray-700 mb-1">
            تصميم الإطار
          </label>
          <select
            id="certificate-design"
            value={certificateDesign}
            onChange={(e) => setCertificateDesign(e.target.value)}
            className="w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
          >
             {Object.entries(certificateDesignOptions).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );
};

export default CertificateCustomizer;