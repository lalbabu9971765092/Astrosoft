// src/App.js
import React from 'react';
import { BrowserRouter as Router, Routes, Route, NavLink } from 'react-router-dom';
import SharedInputLayout from './components/SharedInputLayout';
import AstrologyForm from './components/AstrologyForm';
import PlanetDetailsPage from './components/PlanetDetailsPage';
import GocharPage from './components/GocharPage';
import KpSignificatorsPage from './components/KpSignificatorsPage';
import AshtakavargaPage from './components/AshtakavargaPage';
import FestivalsPage from './components/FestivalsPage';
import PrashnaTimeLocationPage from './components/PrashnaTimeLocationPage';
import PrashnaNumberPage from './components/PrashnaNumberPage';
import VarshphalPage from './components/VarshphalPage';
import RemediesPage from './components/RemediesPage';
// Import the hook
import { useTranslation } from 'react-i18next';
import './App.css';

function App() {
  // Get the translation function 't' and the i18n instance
  const { t, i18n } = useTranslation();

  return (
    <Router>
      <div className="App">
        {/* Navigation */}
        <nav className="main-nav">
          <ul>
            {/* Use the t function with keys from your translation files */}
            <li><NavLink to="/" className={({ isActive }) => isActive ? 'active-link' : ''}>{t('nav.mainChart')}</NavLink></li>
            <li><NavLink to="/planets" className={({ isActive }) => isActive ? 'active-link' : ''}>{t('nav.planetDetails')}</NavLink></li>
            <li><NavLink to="/gochar" className={({ isActive }) => isActive ? 'active-link' : ''}>{t('nav.gochar')}</NavLink></li>
            <li><NavLink to="/kp" className={({ isActive }) => isActive ? 'active-link' : ''}>{t('nav.kpSignificators')}</NavLink></li>
            <li><NavLink to="/ashtakavarga" className={({ isActive }) => isActive ? 'active-link' : ''}>{t('nav.ashtakavarga')}</NavLink></li>
            <li><NavLink to="/festivals" className={({ isActive }) => isActive ? 'active-link' : ''}>{t('nav.festivals')}</NavLink></li>
            <li><NavLink to="/prashna-time" className={({ isActive }) => isActive ? 'active-link' : ''}>{t('nav.prashnaTime')}</NavLink></li>
            <li><NavLink to="/prashna-number" className={({ isActive }) => isActive ? 'active-link' : ''}>{t('nav.prashnaNumber')}</NavLink></li>
            <li><NavLink to="/remedies" className={({ isActive }) => isActive ? 'active-link' : ''}>{t('nav.remedies')}</NavLink></li>
            <li><NavLink to="/varshphal" className={({ isActive }) => isActive ? 'active-link' : ''}>{t('nav.varshphal')}</NavLink></li>
          </ul>
        </nav>

        {/* Language Switcher */}
        <div style={{ padding: '10px', textAlign: 'right', borderTop: '1px solid #ccc', borderBottom: '1px solid #ccc', marginBottom: '10px' }}>
          <button onClick={() => i18n.changeLanguage('en')} disabled={i18n.language === 'en'} style={{ marginRight: '5px' }}>
            English
          </button>
          <button onClick={() => i18n.changeLanguage('hi')} disabled={i18n.language === 'hi'}>
            हिन्दी
          </button>
        </div>

        {/* Routes */}
        <Routes>
          {/* Routes using the SharedInputLayout */}
          <Route path="/" element={<SharedInputLayout />}>
            {/* Use t() for page titles if needed within components */}
            <Route index element={<AstrologyForm />} />
            <Route path="planets" element={<PlanetDetailsPage />} />
            <Route path="gochar" element={<GocharPage />} />
            <Route path="kp" element={<KpSignificatorsPage />} />
            <Route path="ashtakavarga" element={<AshtakavargaPage />} />
            <Route path="varshphal" element={<VarshphalPage />} />
          </Route>

          {/* Top-level routes (not using SharedInputLayout) */}
          <Route path="festivals" element={<FestivalsPage />} />
          <Route path="prashna-time" element={<PrashnaTimeLocationPage />} />
          <Route path="prashna-number" element={<PrashnaNumberPage />} />
          <Route path="remedies" element={<RemediesPage />} />

          {/* Optional: Add a catch-all or Not Found route */}
          {/* <Route path="*" element={<NotFoundPage />} /> */}
        </Routes>
      </div>
    </Router>
  );
}

export default App;
