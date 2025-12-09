// (1) تم تغيير طريقة الاستيراد لتناسب React 19
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import { ToastProvider } from './ToastProvider';

const rootElement = document.getElementById('root');
if (rootElement) {
  // (2) تم تغيير طريقة إنشاء الـ root لتناسب React 19
  const root = createRoot(rootElement);
  root.render(
    // (3) تم تغيير <React.StrictMode> إلى <StrictMode>
    <StrictMode>
      <ToastProvider>
        <App />
      </ToastProvider>
    </StrictMode>,
  );
}