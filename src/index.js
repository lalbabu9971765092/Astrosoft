// src/index.js
import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import reportWebVitals from './reportWebVitals';

// Import the i18n configuration
import './i18n'; // This runs the i18n.init() function

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  // Wrap with Suspense for loading translations
  <React.Suspense fallback="Loading...">
    <React.StrictMode>
      <App />
    </React.StrictMode>
  </React.Suspense>
);

reportWebVitals();
