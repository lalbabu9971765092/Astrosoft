// src/GocharPage.jsx
import React, { useState, useEffect, useMemo } from 'react';
import { useOutletContext } from 'react-router-dom';
import { useTranslation } from 'react-i18next'; // Import the hook
import api from './api';
import DiamondChart from './DiamondChart'; // Import DiamondChart
import ZodiacCircleChart from './ZodiacCircleChart';
import DetailedPlanetTable from './DetailedPlanetTable';
import {
    validateAndFormatDateTime,
    PLANET_ORDER,
    PLANET_SYMBOLS,
    createChartHousesFromAscendant // Import house creation utility
} from './AstrologyUtils';
import '../styles/GocharPage.css'; // Ensure this CSS file exists and is linked

// Helper function to format date/time for display
// Pass 't' for potential error/invalid messages
const formatDateTime = (dateTimeString, t) => {
    if (!dateTimeString) return t ? t('planetDegreeTable.notAvailable', 'N/A') : 'N/A';
    try {
        const date = new Date(dateTimeString);
        if (isNaN(date.getTime())) return t ? t('gocharPage.invalidDate', 'Invalid Date') : 'Invalid Date';
        // Consider using i18n.language for locale-aware formatting
        return date.toLocaleString(undefined, {
            year: 'numeric', month: 'numeric', day: 'numeric',
            hour: 'numeric', minute: 'numeric', second: 'numeric', hour12: true
        });
    } catch (e) {
        console.error("Error formatting date:", e);
        return dateTimeString; // Return original on error
    }
};

// --- Reusable Planet Degree Table Component ---
const PlanetDegreeTable = ({ titleKey, planets }) => { // Use titleKey for translation
    const { t } = useTranslation(); // Get translation function

    if (!planets || Object.keys(planets).length === 0) {
        // Translate unavailable message with interpolation
        return <p className="info-text small-info">{t('planetDegreeTable.dataUnavailable', { type: titleKey })}</p>;
    }

    return (
        <div className="planet-degree-table-section">
            {/* Translate title with interpolation */}
            <h4 className="result-sub-title small-sub-title">{t('planetDegreeTable.title', { type: titleKey })}</h4>
            <div className="table-wrapper small-table">
                <table className="results-table planet-degrees">
                    <thead>
                        <tr>
                            {/* Translate headers */}
                            <th>{t('planetDegreeTable.headerPlanet')}</th>
                            <th>{t('planetDegreeTable.headerPosition')}</th>
                        </tr>
                    </thead>
                    <tbody>
                        {PLANET_ORDER.map((planetName) => {
                            const planetData = planets[planetName];
                            if (!planetData) return null;
                            return (
                                <tr key={`${titleKey}-${planetName}`}>
                                    <td>{PLANET_SYMBOLS[planetName] || planetName}</td>
                                    {/* Translate N/A */}
                                    <td>{planetData.dms || t('planetDegreeTable.notAvailable', 'N/A')}</td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
        </div>
    );
};
// --- End Reusable Component ---


const GocharPage = () => {
    const { t } = useTranslation(); // Call the hook
    // Get context from SharedInputLayout
    const {
        mainResult,
        calculationInputParams,
        adjustedBirthDateTimeString,
        adjustedGocharDateTimeString,
        locationForGocharTool,
        transitResult,
        isCalculatingTransit,
        transitError
    } = useOutletContext() || {};

    // --- State for NATAL Rectification Data ---
    const [rectifiedNatalResult, setRectifiedNatalResult] = useState(null);
    const [isLoadingRectification, setIsLoadingRectification] = useState(false);
    const [rectificationError, setRectificationError] = useState(null);
    const [openSections, setOpenSections] = useState({
        threeColumnLayout: true,
        detailedPlanetTable: true,
    });
    // --- State for Chart Visibility ---
    const [visibility, setVisibility] = useState({
        showNatalHouses: true,
        showNatalPlanets: true,
        showTransitHouses: true,
        showTransitPlanets: true,
    });

    const toggleSection = (section) => {
        setOpenSections(prev => ({ ...prev, [section]: !prev[section] }));
    };

    // --- Effect to Fetch Rectified NATAL Data ---
    useEffect(() => {
        if (!adjustedBirthDateTimeString || !calculationInputParams?.latitude || !calculationInputParams?.longitude || !calculationInputParams?.date) {
            setRectifiedNatalResult(null);
            setRectificationError(null);
            return;
        }
        try {
            const originalDate = new Date(calculationInputParams.date);
            const adjustedDate = new Date(adjustedBirthDateTimeString);
            if (!isNaN(originalDate) && !isNaN(adjustedDate) && originalDate.getTime() === adjustedDate.getTime()) {
                setRectifiedNatalResult(null);
                setRectificationError(null);
                return;
            }
        } catch (e) { console.error("GocharPage (Natal Rectification): Date comparison error:", e); }

        // Pass 't' to validation function
        const dateTimeValidation = validateAndFormatDateTime(adjustedBirthDateTimeString, t);
        if (!dateTimeValidation.isValid) {
            // Translate error message with interpolation
            setRectificationError(t('gocharPage.invalidAdjustedBirthDate', { error: dateTimeValidation.error }));
            setRectifiedNatalResult(null); setIsLoadingRectification(false); return;
        }
        const formattedDateForApi = dateTimeValidation.formattedDate;

       
        setIsLoadingRectification(true); setRectificationError(null);

        const fetchRectifiedNatalData = async () => {
            try {
                const payload = { date: formattedDateForApi, latitude: calculationInputParams.latitude, longitude: calculationInputParams.longitude, placeName: calculationInputParams.placeName };
                const response = await api.post('/calculate', payload);
                setRectifiedNatalResult(response.data);
               
            } catch (err) {
                console.error("GocharPage: Rectified NATAL fetch error:", err.response?.data || err.message || err);
                const backendError = err.response?.data?.error || err.response?.data?.message;
                // Translate generic fetch error
                setRectificationError(backendError || err.message || t('gocharPage.fetchRectifiedNatalFailed'));
                setRectifiedNatalResult(null);
            } finally { setIsLoadingRectification(false); }
        };
        const timerId = setTimeout(fetchRectifiedNatalData, 300);
        return () => clearTimeout(timerId);
    }, [adjustedBirthDateTimeString, calculationInputParams, t]); // Add t dependency

    // --- Determine which NATAL result set to display (Unchanged) ---
    const displayNatalResult = rectifiedNatalResult || mainResult;

    // --- Determine which NATAL input parameters to show (Unchanged) ---
    const displayNatalInputParams = useMemo(() => {
        if (rectifiedNatalResult && calculationInputParams) {
            return { ...calculationInputParams, date: adjustedBirthDateTimeString };
        } else { return calculationInputParams; }
    }, [rectifiedNatalResult, calculationInputParams, adjustedBirthDateTimeString]);

    // --- Determine location used for transit calculation (Unchanged) ---
    const transitLocation = useMemo(() => {
        if (locationForGocharTool?.lat !== null && locationForGocharTool?.lon !== null) {
            return { lat: locationForGocharTool.lat, lon: locationForGocharTool.lon };
        } else if (transitResult?.inputParameters) {
             return { lat: transitResult.inputParameters.latitude, lon: transitResult.inputParameters.longitude };
        }
        return { lat: null, lon: null };
    }, [locationForGocharTool, transitResult]);

    // --- Determine if chart can be displayed (Unchanged) ---
    const canDisplayChart = displayNatalResult?.planetaryPositions?.sidereal
                            && displayNatalResult?.houses
                            && transitResult?.planetaryPositions?.sidereal;

    // Combine loading states (Unchanged)
    const isLoading = isLoadingRectification || isCalculatingTransit;
    // Combine error states (Unchanged)
    const displayError = transitError || rectificationError;

    // Extract planet data for tables (Unchanged)
    const natalPlanetsForTable = displayNatalResult?.planetaryPositions?.sidereal;

    // --- Create houses for the transit chart ---
    const transitHousesForChart = useMemo(() => {
        return transitResult?.ascendant?.sidereal_dms ? createChartHousesFromAscendant(transitResult.ascendant.sidereal_dms, t) : null;
    }, [transitResult, t]);

    // --- Handler for checkbox changes ---
    const handleVisibilityChange = (event) => {
        const { name, checked } = event.target;
        setVisibility(prev => ({
            ...prev,
            [name]: checked
        }));
    };
    return (
        <div className="gochar-page result-container">
            {/* Translate page title */}
            <h2 className="result-title">{t('gocharPage.pageTitle')}</h2>

            {/* Loading/Error messages that affect the whole page */}
            {/* Translate initial loading/error */}
            {isLoadingRectification && !mainResult && <div className="loader main-loader">{t('gocharPage.loadingInitialNatal')}</div>}
            {rectificationError && !mainResult && <p className="error-text main-error">{t('gocharPage.errorInitialNatal', { error: rectificationError })}</p>}

            <div className="section-header" onClick={() => toggleSection('threeColumnLayout')}>
                <h3 className="result-sub-title">{t('gocharPage.chartTitle')}</h3>
                <button className="toggle-button">{openSections.threeColumnLayout ? '−' : '+'}</button>
            </div>
            {openSections.threeColumnLayout &&
                <div className="gochar-layout-container">

                    {/* Column 1: Natal Info */}
                    <div className="gochar-column gochar-column-natal">
                        {displayNatalInputParams ? (
                            <div className="result-section input-summary">
                                {/* Translate title */}
                                <h3 className="result-sub-title">{t('gocharPage.natalChartForTitle')}</h3>
                                {/* Translate labels */}
                                <p><strong>{t('gocharPage.dateLabel')}</strong> {formatDateTime(displayNatalInputParams.date, t)}</p>
                                <p><strong>{t('gocharPage.coordsLabel')}</strong> {displayNatalInputParams.latitude?.toFixed(4)}, {displayNatalInputParams.longitude?.toFixed(4)}</p>
                                {displayNatalInputParams.placeName && <p><strong>{t('gocharPage.placeLabel')}</strong> {displayNatalInputParams.placeName}</p>}
                                {/* Natal Planet Table - Pass translated key */}
                                <PlanetDegreeTable titleKey="Natal" planets={natalPlanetsForTable} />
                                {/* Natal Loading/Error (Specific to rectification update) */}
                                {/* Translate loading/error */}
                                {isLoadingRectification && mainResult && <div className="loader tiny-loader" aria-label={t('gocharPage.updatingNatalData')}></div>}
                                {!isLoadingRectification && rectificationError && mainResult && <p className="error-text tiny-error" role="alert">{t('gocharPage.natalUpdateErrorPrefix')}: {rectificationError}</p>}

                                {/* --- Transit D1 Chart --- */}
                                {transitResult && transitHousesForChart && (
                                    <div className="transit-d1-chart-container">
                                        <h3 className="result-sub-title">{t('astrologyForm.chartGocharTitle')}</h3>
                                        <DiamondChart
                                            title={t('astrologyForm.chartGocharTitle')}
                                            houses={transitHousesForChart}
                                            planets={transitResult.planetaryPositions.sidereal}
                                            chartType="gochar"
                                            size={250}
                                        />
                                    </div>
                                )}


                            </div>
                        ) : (
                            // Translate info text
                            !isLoadingRectification && <p className="info-text">{t('gocharPage.natalDataNeeded')}</p>
                        )}
                    </div>

                    {/* Column 2: Chart Area */}
                    <div className="gochar-column gochar-column-chart">
                        <div className="gochar-chart-area">
                            {/* --- Chart Header with Title and Controls --- */}
                            <div className="chart-header">
                                <h4 className="chart-title">{t('gocharPage.chartTitle')}</h4>
                                <div className="chart-controls">
                                    <label>
                                        <input type="checkbox" name="showNatalPlanets" checked={visibility.showNatalPlanets} onChange={handleVisibilityChange} />
                                        {t('gocharPage.toggleNatalPlanets', 'Natal Planets')}
                                    </label>
                                    <label>
                                        <input type="checkbox" name="showNatalHouses" checked={visibility.showNatalHouses} onChange={handleVisibilityChange} />
                                        {t('gocharPage.toggleNatalHouse', 'Natal House')}
                                    </label>
                                    <label>
                                        <input type="checkbox" name="showTransitPlanets" checked={visibility.showTransitPlanets} onChange={handleVisibilityChange} />
                                        {t('gocharPage.toggleTransitPlanets', 'Transit Planets')}
                                    </label>
                                    <label>
                                        <input type="checkbox" name="showTransitHouses" checked={visibility.showTransitHouses} onChange={handleVisibilityChange} />
                                        {t('gocharPage.toggleTransitHouse', 'Transit House')}
                                    </label>
                                </div>
                            </div>
                            {canDisplayChart && !displayError ? (
                                <ZodiacCircleChart
                                    // Translate chart title
                                    title="" // Title is now rendered outside
                                    natalPlanets={visibility.showNatalPlanets ? displayNatalResult.planetaryPositions.sidereal : {}}
                                    transitPlanets={visibility.showTransitPlanets ? transitResult.planetaryPositions.sidereal : {}}
                                    houses={visibility.showNatalHouses ? displayNatalResult.houses : null}
                                    transitHouses={visibility.showTransitHouses ? transitResult.houses : null}
                                    size={700} // Slightly smaller than before to fit better
                                />
                            ) : (
                                <div className="chart-placeholder-area" style={{ height: '500px' }}>
                                    {/* Translate placeholder messages */}
                                    {!isLoading && displayError && <p className="error-text">{t('gocharPage.errorDisplayChart')}</p>}
                                    {!isLoading && !displayError && !displayNatalResult && <p className="info-text">{t('gocharPage.errorLoadNatalFirst')}</p>}
                                    {!isLoading && !displayError && displayNatalResult && !transitResult && <p className="info-text">{t('gocharPage.errorLoadingTransitForChart')}</p>}
                                    {isLoading && <p className="info-text">{t('gocharPage.errorLoadingChartData')}</p>}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Column 3: Transit Info */}
                    <div className="gochar-column gochar-column-transit">
                        <div className="result-section input-summary">
                            {/* Translate title */}
                            <h3 className="result-sub-title">{t('gocharPage.transitsForTitle')}</h3>
                            {transitResult && transitResult.inputParameters && (
                                <div className="input-summary">
                                    <p><strong>{t('gocharPage.dateLabel')}</strong> {formatDateTime(transitResult.inputParameters.date, t)}</p>
                                    <p><strong>{t('gocharPage.coordsLabel')}</strong> {transitResult.inputParameters.latitude?.toFixed(4)}, {transitResult.inputParameters.longitude?.toFixed(4)}</p>
                                    {transitResult.inputParameters.placeName && <p><strong>{t('gocharPage.placeLabel')}</strong> {transitResult.inputParameters.placeName}</p>}
                                </div>
                            )}

                            {/* Transit Planet Table - Pass translated key */}
                            <PlanetDegreeTable titleKey="Transit" planets={transitResult?.planetaryPositions?.sidereal} />
                            {/* Transit Loading/Error */}
                            {/* Translate loading/error */}
                            {isCalculatingTransit && <div className="loader tiny-loader" aria-label={t('gocharPage.loadingTransitData')}></div>}
                            {!isCalculatingTransit && transitError && <p className="error-text tiny-error" role="alert">{t('gocharPage.transitErrorPrefix')}: {transitError}</p>}

                         {/* --- Transit Bhava Chalit Chart --- */}
                         {transitResult?.houses && transitResult?.planetHousePlacements && (
                            <div className="transit-bhava-chart-container">
                                <h3 className="result-sub-title">{t('astrologyForm.chartBhavaTitle')} - {t('nav.gochar')}</h3>
                                <DiamondChart
                                    title={`${t('astrologyForm.chartBhavaTitle')} - ${t('nav.gochar')}`}
                                    houses={transitResult.houses}
                                    planetHousePlacements={transitResult.planetHousePlacements}
                                    chartType="bhava"
                                    size={250}
                                />
                            </div>
                         )}

                        </div>
                    </div>

                </div>}
            <div className="full-width-table">
                <div className="section-header" onClick={() => toggleSection('detailedPlanetTable')}>
                    <h3 className="result-sub-title">{t('astrologyForm.transitPlanetaryPositionsTitle')}</h3>
                    <button className="toggle-button">{openSections.detailedPlanetTable ? '−' : '+'}</button>
                </div>
                {openSections.detailedPlanetTable && transitResult && transitResult.planetaryPositions && transitResult.houses && transitResult.planetDetails && <DetailedPlanetTable planets={transitResult.planetaryPositions.sidereal} houses={transitResult.houses} planetDetails={transitResult.planetDetails} />}
            </div>
        </div>
    );
};

export default GocharPage;
