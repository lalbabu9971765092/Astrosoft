// src/App.js
import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, NavLink, useLocation } from 'react-router-dom';
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
import MuhurtaPage from './components/MuhurtaPage';
import api from './components/api'; // Assuming api setup for context

// Import the hook and context
import { useTranslation } from 'react-i18next';
import './App.css';

// --- Context for shared calculation results ---
export const CalculationContext = React.createContext(null);

function AppWrapper() {
  // We need a component inside Router to use useLocation
  const location = useLocation();
  const [isNavOpen, setIsNavOpen] = useState(false);
  const { t, i18n } = useTranslation();

  // --- State for shared calculation results ---
  const [mainResult, setMainResult] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [calculationInputParams, setCalculationInputParams] = useState(null); // Store input params used

  // --- State for adjustments (passed down via context) ---
  const [adjustedBirthDateTimeString, setAdjustedBirthDateTimeString] = useState('');
  const [adjustedGocharDateTimeString, setAdjustedGocharDateTimeString] = useState('');
  const [locationForGocharTool, setLocationForGocharTool] = useState({ lat: null, lon: null, name: '' });

  // --- Function to perform main calculation ---
  const performCalculation = async (params) => {
    console.log("Performing main calculation with:", params);
    setIsLoading(true);
    setError(null);
    setMainResult(null); // Clear previous result
    setCalculationInputParams(params); // Store the input parameters
    setAdjustedBirthDateTimeString(params.date); // Initialize adjusted time
    setAdjustedGocharDateTimeString(''); // Clear gochar time on new calculation
    setLocationForGocharTool({ lat: null, lon: null, name: '' }); // Clear gochar location

    try {
      const response = await api.post('/calculate', params);
      setMainResult(response.data);
      console.log("Main calculation successful:", response.data);
    } catch (err) {
      console.error("Main calculation error:", err.response?.data || err.message || err);
      const backendError = err.response?.data?.error || err.response?.data?.message;
      setError(backendError || err.message || 'Failed to fetch calculation results.');
      setMainResult(null);
    } finally {
      setIsLoading(false);
    }
  };

  // --- Toggle mobile navigation ---
  const toggleNav = () => {
    setIsNavOpen(!isNavOpen);
  };

  // --- Close mobile nav on route change ---
  useEffect(() => {
    setIsNavOpen(false); // Close nav when the location changes
  }, [location]);

  // --- Context value ---
  const contextValue = {
    mainResult,
    isLoading,
    error,
    calculationInputParams,
    performCalculation, // Pass down the function
    // Adjustment state and setters
    adjustedBirthDateTimeString,
    setAdjustedBirthDateTimeString,
    adjustedGocharDateTimeString,
    setAdjustedGocharDateTimeString,
    locationForGocharTool,
    setLocationForGocharTool
  };

  return (
    // Provide the context to all child routes
    <CalculationContext.Provider value={contextValue}>
      <div className="App">
        {/* Navigation */}
        <nav className="main-nav">
          <div className="nav-container">
            {/* Optional: Add a logo or brand name here */}
            {/* <div className="logo">AstroApp</div> */}

            {/* Hamburger Button */}
            <button className="hamburger-button" onClick={toggleNav} aria-label="Toggle navigation" aria-expanded={isNavOpen}>
              ☰ {/* You can replace this with an SVG icon */}
            </button>

            {/* Navigation Links */}
            {/* Apply 'active' class based on state */}
            <ul className={`nav-links ${isNavOpen ? 'active' : ''}`}>
              {/* Use NavLink for active styling */}
              {/* onClick added to close menu on mobile after clicking a link */}
              <li><NavLink to="/" className={({ isActive }) => isActive ? 'active' : ''} onClick={() => setIsNavOpen(false)}>{t('Main Chart')}</NavLink></li>
              <li><NavLink to="/planets" className={({ isActive }) => isActive ? 'active' : ''} onClick={() => setIsNavOpen(false)}>{t('nav.planetDetails')}</NavLink></li>
              <li><NavLink to="/gochar" className={({ isActive }) => isActive ? 'active' : ''} onClick={() => setIsNavOpen(false)}>{t('nav.gochar')}</NavLink></li>
              <li><NavLink to="/kp" className={({ isActive }) => isActive ? 'active' : ''} onClick={() => setIsNavOpen(false)}>{t('nav.kpSignificators')}</NavLink></li>
              <li><NavLink to="/ashtakavarga" className={({ isActive }) => isActive ? 'active' : ''} onClick={() => setIsNavOpen(false)}>{t('nav.ashtakavarga')}</NavLink></li>
              <li><NavLink to="/festivals" className={({ isActive }) => isActive ? 'active' : ''} onClick={() => setIsNavOpen(false)}>{t('nav.festivals')}</NavLink></li>
              <li><NavLink to="/prashna-time" className={({ isActive }) => isActive ? 'active' : ''} onClick={() => setIsNavOpen(false)}>{t('nav.prashnaTime')}</NavLink></li>
              <li><NavLink to="/prashna-number" className={({ isActive }) => isActive ? 'active' : ''} onClick={() => setIsNavOpen(false)}>{t('nav.prashnaNumber')}</NavLink></li>
              <li><NavLink to="/remedies" className={({ isActive }) => isActive ? 'active' : ''} onClick={() => setIsNavOpen(false)}>{t('nav.remedies')}</NavLink></li>
              <li><NavLink to="/varshphal" className={({ isActive }) => isActive ? 'active' : ''} onClick={() => setIsNavOpen(false)}>{t('nav.varshphal')}</NavLink></li>
              <li><NavLink to="/muhurta" className={({ isActive }) => isActive ? 'active' : ''} onClick={() => setIsNavOpen(false)}>{t('nav.muhurta')}</NavLink></li>
            </ul>
          </div>
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

        {/* Main content area where routed components will render */}
        <main className="main-content">
          {/* Routes */}
          <Routes>
            {/* Routes using the SharedInputLayout */}
            <Route path="/" element={<SharedInputLayout />}>
              <Route index element={<AstrologyForm />} />
              <Route path="planets" element={<PlanetDetailsPage />} />
              <Route path="gochar" element={<GocharPage />} />
              <Route path="kp" element={<KpSignificatorsPage />} />
              <Route path="ashtakavarga" element={<AshtakavargaPage />} />
              <Route path="varshphal" element={<VarshphalPage />} />
              <Route path="muhurta" element={<MuhurtaPage />} />
            </Route>

            {/* Routes that do NOT use SharedInputLayout (e.g., Festivals, Prashna) */}
            <Route path="/festivals" element={<FestivalsPage />} />
            <Route path="/prashna-time" element={<PrashnaTimeLocationPage />} />
            <Route path="/prashna-number" element={<PrashnaNumberPage />} />
            <Route path="/remedies" element={<RemediesPage />} />

            {/* Optional: Add a catch-all or Not Found route */}
            {/* <Route path="*" element={<NotFoundPage />} /> */}
          </Routes>
        </main>

        {/* Optional: Add a footer */}
        {/* <footer className="app-footer">
          <p>&copy; 2024 Your Astro App</p>
        </footer> */}
      </div>
    </CalculationContext.Provider>
  );
}

// Wrap AppWrapper with Router
function App() {
  return (
    <Router future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <AppWrapper />
    </Router>
  );
}

export default App;
