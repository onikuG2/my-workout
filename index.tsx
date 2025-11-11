import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { AlertProvider } from './components/AlertProvider';
import './index.css';

// グローバルエラーハンドラーを設定
window.addEventListener('error', (event) => {
  console.error('Global error caught:', event.error);
  // エラー報告サービスに送信することも可能
});

// Promise rejectionのハンドリング
window.addEventListener('unhandledrejection', (event) => {
  console.error('Unhandled promise rejection:', event.reason);
  // エラー報告サービスに送信することも可能
  // デフォルトのエラーハンドリングを防ぐ（ErrorBoundaryで処理するため）
  event.preventDefault();
});

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <AlertProvider>
      <App />
    </AlertProvider>
  </React.StrictMode>
);
