import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';

// Filter benign Emscripten/TFLite stderr diagnostic lines that Emscripten forwards to console.error
if (typeof window !== 'undefined') {
  const originalError = console.error;
  console.error = (...args: any[]) => {
    const msg = typeof args[0] === 'string' ? args[0] : '';
    if (
      msg.includes('INFO: Created TensorFlow Lite') ||
      msg.includes('Created TensorFlow Lite XNNPACK delegate') ||
      msg.includes('XNNPACK delegate for CPU') ||
      msg.includes('TensorFlow Lite XNNPACK')
    ) {
      console.info(...args);
      return;
    }
    originalError.apply(console, args);
  };
}

createRoot(document.getElementById('root')!).render(<App />);
