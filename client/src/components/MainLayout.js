// src/components/MainLayout.js
import React, { useState, useEffect } from 'react';
import { NavLink, useLocation, Outlet } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import '../App.css';

const MainLayout = () => {
    const location = useLocation();
    const [isNavOpen, setIsNavOpen] = useState(false);
    const { t, i18n } = useTranslation();

    const toggleNav = () => {
        setIsNavOpen(!isNavOpen);
    };

    useEffect(() => {
        setIsNavOpen(false);
    }, [location]);

    return (
        <div className="App">
            <nav className="main-nav">
                <div className="nav-container">
                    <button className="hamburger-button" onClick={toggleNav} aria-label="Toggle navigation" aria-expanded={isNavOpen}>
                        ☰
                    </button>
                    <ul className={`nav-links ${isNavOpen ? 'active' : ''}`}>
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

            <div style={{ padding: '10px', borderTop: '1px solid #ccc', borderBottom: '1px solid #ccc', marginBottom: '10px', display: 'flex', justifyContent: 'flex-end', alignItems: 'center' }}>
                <div>
                    <button onClick={() => i18n.changeLanguage('en')} disabled={i18n.language === 'en'} style={{ marginRight: '5px' }}>
                        English
                    </button>
                    <button onClick={() => i18n.changeLanguage('hi')} disabled={i18n.language === 'hi'}>
                        हिन्दी
                    </button>
                </div>
            </div>

            <div style={{ textAlign: 'center', margin: '20px 0', fontSize: '1.8em', fontWeight: 'bold', color: '#3498db', textShadow: '2px 2px 4px rgba(0,0,0,0.3)' }}>
                {t('sharedLayout.preparedBy')}
            </div>

            <main className="main-content">
                <Outlet />
            </main>
        </div>
    );
};

export default MainLayout;
