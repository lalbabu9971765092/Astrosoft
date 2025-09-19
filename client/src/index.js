// src/index.js
import React from 'react';
import ReactDOM from 'react-dom/client';
import { Provider } from 'react-redux';
import store from './store/store';
import './index.css';
import App from './App';
import reportWebVitals from './reportWebVitals';

// Import the i18n configuration
import './i18n'; // This runs the i18n.init() function

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  // Wrap with Suspense for loading translations
  <React.Suspense fallback="Loading...">
    <Provider store={store}>
      <React.StrictMode>
        <App />
      </React.StrictMode>
    </Provider>
  </React.Suspense>
);

reportWebVitals();
