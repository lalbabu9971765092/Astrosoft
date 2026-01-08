// src/components/MainLayout.js
import React, { useState, useEffect } from 'react';
import { NavLink, useLocation, Outlet, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useDispatch, useSelector } from 'react-redux';
import { logout } from '../store/actions/userActions';
import '../App.css';

const MainLayout = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const [isNavOpen, setIsNavOpen] = useState(false);
    const { t, i18n } = useTranslation();

    const dispatch = useDispatch();
    const userLogin = useSelector((state) => state.userLogin);
    const { userInfo } = userLogin;

    const toggleNav = () => {
        setIsNavOpen(!isNavOpen);
    };

    useEffect(() => {
        setIsNavOpen(false);
    }, [location]);

    const logoutHandler = () => {
        dispatch(logout());
        navigate('/login');
    };

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
                        <li><NavLink to="/divisional-charts" className={({ isActive }) => isActive ? 'active' : ''} onClick={() => setIsNavOpen(false)}>{t('nav.divisionalCharts')}</NavLink></li>
                        <li><NavLink to="/yogas" className={({ isActive }) => isActive ? 'active' : ''} onClick={() => setIsNavOpen(false)}>{t('nav.predictions')}</NavLink></li>
                       <li><NavLink to="/prashna-time" className={({ isActive }) => isActive ? 'active' : ''} onClick={() => setIsNavOpen(false)}>{t('nav.prashnaTime')}</NavLink></li>
                        <li><NavLink to="/prashna-number" className={({ isActive }) => isActive ? 'active' : ''} onClick={() => setIsNavOpen(false)}>{t('nav.prashnaNumber')}</NavLink></li>
                        <li><NavLink to="/remedies" className={({ isActive }) => isActive ? 'active' : ''} onClick={() => setIsNavOpen(false)}>{t('nav.remedies')}</NavLink></li>
                        <li><NavLink to="/varshphal" className={({ isActive }) => isActive ? 'active' : ''} onClick={() => setIsNavOpen(false)}>{t('nav.varshphal')}</NavLink></li>
                         <li><NavLink to="/festivals" className={({ isActive }) => isActive ? 'active' : ''} onClick={() => setIsNavOpen(false)}>{t('nav.festivals')}</NavLink></li>
                         <li><NavLink to="/muhurta" className={({ isActive }) => isActive ? 'active' : ''} onClick={() => setIsNavOpen(false)}>{t('nav.muhurta')}</NavLink></li>
                        <li><NavLink to="/monthly-yogas" className={({ isActive }) => isActive ? 'active' : ''} onClick={() => setIsNavOpen(false)}>{t('nav.monthlyYogas')}</NavLink></li>
                       {userInfo ? (
                            <>
                                <li><button onClick={logoutHandler} className="nav-button">{t('nav.logout')}{userInfo?.name ? ` (${userInfo.name})` : ''}</button></li>
                            </>
                        ) : (
                            <li><NavLink to="/login" className={({ isActive }) => isActive ? 'active' : ''} onClick={() => setIsNavOpen(false)}>{t('nav.login')}</NavLink></li>
                        )}
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

            <div className="prepared-by-text" style={{ textAlign: 'center', margin: '20px 0', fontSize: '1.8em', fontWeight: 'bold', color: '#3498db', textShadow: '2px 2px 4px rgba(0,0,0,0.3)' }}>
                {t('sharedLayout.preparedBy')}
.            </div>

            <main className="main-content">
                <Outlet />
            </main>
        </div>
    );
};

export default MainLayout;
