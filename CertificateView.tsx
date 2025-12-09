
import React, { useState, useRef } from 'react';
import { Certificate } from './Certificate';
import CertificateCustomizer from './CertificateCustomizer';
import type { CertificateTexts, CustomStyles } from './App';
import { db } from './firebaseConfig';
import firebase from 'firebase/compat/app';

declare global {
  interface Window {
    html2canvas: (element: HTMLElement, options?: any) => Promise<HTMLCanvasElement>;
    jspdf: {
      jsPDF: new (options?: any) => any;
    };
  }
}

interface CertificateData {
    name: string;
    service: string;
    courseName: string;
    score: number | 'غائب';
}

interface CertificateViewProps {
  certData: CertificateData;
  onBackToResult: () => void;
  certificateTexts: CertificateTexts;
  customStyles: CustomStyles;
}

const CertificateView: React.FC<CertificateViewProps> = ({ certData, onBackToResult, certificateTexts, customStyles }) => {
  const [fontFamily, setFontFamily] = useState<string>("'Noto Naskh Arabic', serif");
  const [colorScheme, setColorScheme] = useState<string>('blue');
  const [certificateDesign, setCertificateDesign] = useState<string>('vintage');
  const [fontColor, setFontColor] = useState<string>('default');
  const [isDownloading, setIsDownloading] = useState<boolean>(false);
  const [isDownloadingImage, setIsDownloadingImage] = useState<boolean>(false);

  const { paperSize, qualityScale } = customStyles;

  const certificateRef = useRef<HTMLDivElement>(null);
  
  // Create a version of certificateTexts with the dynamic course name
  const dynamicCertificateTexts: CertificateTexts = {
      ...certificateTexts,
      bodyLine3: certData.courseName, // Pass the dynamic course name
  };


  const handleDownloadPdf = () => {
    const certificateElement = certificateRef.current;
    if (!certificateElement || !window.html2canvas || !window.jspdf) {
      alert("لا يمكن تحميل الشهادة الآن، يرجى المحاولة مرة أخرى.");
      return;
    }

    setIsDownloading(true);
    const { jsPDF } = window.jspdf;

    // FIX: Force scale to 2 for PDF export. 
    // Higher scales (3, 4, 5) create massive images (e.g., 50MP+) that bloat the PDF file size 
    // significantly (20MB+) even with compression. Scale 2 provides ~200 DPI which is excellent for A4 print 
    // and keeps file size small (~1-2MB).
    const pdfScale = 2; 

    window.html2canvas(certificateElement, {
      scale: pdfScale, 
      useCORS: true,
      backgroundColor: '#ffffff', // Required for JPEG (no transparency)
    }).then(canvas => {
      // FIX: Use 'image/jpeg' with 0.6 (60%) quality.
      // PNG (previous default) is lossless and creates huge files. 
      // JPEG at 60% reduces file size by ~90% with negligible visual difference for documents.
      const imgData = canvas.toDataURL('image/jpeg', 0.6);
      
      const pdf = new jsPDF({
        orientation: 'landscape',
        unit: 'px',
        format: paperSize
      });

      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      
      // Add image as JPEG
      pdf.addImage(imgData, 'JPEG', 0, 0, pdfWidth, pdfHeight);
      pdf.save(`شهادة-${certData.name}.pdf`);
    }).catch(err => {
      console.error("Error generating PDF:", err);
      alert("حدث خطأ أثناء إنشاء ملف PDF.");
    }).finally(() => {
      setIsDownloading(false);
    });
  };

  const handleDownloadImage = () => {
    const certificateElement = certificateRef.current;
    if (!certificateElement || !window.html2canvas) {
      alert("لا يمكن حفظ الشهادة كصورة الآن، يرجى المحاولة مرة أخرى.");
      return;
    }
    setIsDownloadingImage(true);

    window.html2canvas(certificateElement, {
      scale: qualityScale, // Use user's chosen quality for direct image download (PNG needs to be sharp)
      useCORS: true,
      backgroundColor: null, 
    }).then(canvas => {
      const link = document.createElement('a');
      link.href = canvas.toDataURL('image/png');
      link.download = `شهادة-${certData.name}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }).catch(err => {
      console.error("Error generating image:", err);
      alert("حدث خطأ أثناء إنشاء الصورة.");
    }).finally(() => {
      setIsDownloadingImage(false);
    });
  };

  return (
    <div className="flex flex-col items-center w-full">
      <div className="no-print w-full">
        <CertificateCustomizer
          fontFamily={fontFamily}
          setFontFamily={setFontFamily}
          colorScheme={colorScheme}
          setColorScheme={setColorScheme}
          certificateDesign={certificateDesign}
          setCertificateDesign={setCertificateDesign}
          fontColor={fontColor}
          setFontColor={setFontColor}
        />
      </div>

      <div id="certificate-print-area" className="w-full mt-4 sm:mt-6">
        <Certificate
          result={{ 
              name: certData.name,
              service: certData.service,
              score: certData.score,
              courseName: certData.courseName,
          }}
          fontFamily={fontFamily}
          colorScheme={colorScheme}
          certificateDesign={certificateDesign}
          fontColor={fontColor}
          certificateRef={certificateRef}
          certificateTexts={dynamicCertificateTexts}
        />
      </div>


      <div className="flex flex-col sm:flex-row justify-center items-center gap-4 mt-4 sm:mt-6 w-full max-w-5xl no-print">
         <button
            onClick={handleDownloadPdf}
            disabled={isDownloading || isDownloadingImage}
            className="w-full sm:w-auto bg-green-600 text-white font-bold py-3 px-8 rounded-lg hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-opacity-75 transition-transform transform hover:scale-105 disabled:bg-green-300 disabled:cursor-wait"
        >
            {isDownloading ? 'جاري التحميل...' : 'حفظ الشهادة PDF'}
        </button>
        <button
            onClick={handleDownloadImage}
            disabled={isDownloading || isDownloadingImage}
            className="w-full sm:w-auto bg-sky-600 text-white font-bold py-3 px-8 rounded-lg hover:bg-sky-700 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:ring-opacity-75 transition-transform transform hover:scale-105 disabled:bg-sky-300 disabled:cursor-wait"
        >
            {isDownloadingImage ? 'جاري الحفظ...' : 'حفظ الشهادة كصورة'}
        </button>
        <button
            onClick={onBackToResult}
            className="w-full sm:w-auto bg-gray-500 text-white font-bold py-3 px-8 rounded-lg hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-opacity-75 transition-transform transform hover:scale-105"
        >
            العودة للنتيجة
        </button>
      </div>
    </div>
  );
};

export default CertificateView;
