// src/PlanetDetailsPage.jsx
import React, { useState, useMemo, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import '../styles/PlanetDetailsPage.css'; // Keep your CSS import
import {
    PLANET_ORDER, // Import the full order
    convertToDMS,
    convertDMSToDegrees,
    validateAndFormatDateTime,
} from './AstrologyUtils';
import DetailedPlanetTable from './DetailedPlanetTable';
import api from './api';


// Helper function to format date/time
const formatDateTime = (dateTimeString, t) => {
    if (!dateTimeString) return t ? t('utils.notAvailable', 'N/A') : 'N/A';
    try {
        const date = new Date(dateTimeString);
        if (isNaN(date.getTime())) return t ? t('utils.invalidDate', 'Invalid Date') : 'Invalid Date';
        return date.toLocaleString(undefined, {
            year: 'numeric', month: 'numeric', day: 'numeric',
            hour: 'numeric', minute: 'numeric', second: 'numeric', hour12: true
        });
    } catch (e) {
        console.error("Error formatting date:", e);
        return dateTimeString;
    }
};

// Define planets to exclude from specific tables
const EXCLUDED_PLANETS_ASPECTS_FRIENDSHIP = ['Uranus', 'Neptune', 'Pluto'];
// Define planets for core Vedic tables (excluding outer planets, Rahu, Ketu for friendship)
const CORE_VEDIC_PLANETS = PLANET_ORDER.filter(p => !EXCLUDED_PLANETS_ASPECTS_FRIENDSHIP.includes(p) && p !== 'Rahu' && p !== 'Ketu');
// Define planets for aspect table (excluding outer planets)
const ASPECT_TABLE_PLANETS = PLANET_ORDER.filter(p => !EXCLUDED_PLANETS_ASPECTS_FRIENDSHIP.includes(p));


const PlanetDetailsPage = () => {
    const { t } = useTranslation();
    // Get initial data and context
    const {
        mainResult,
        isLoading: isInitialLoading,
        error: initialError,
        calculationInputParams,
        adjustedBirthDateTimeString
    } = useOutletContext() || {};

    // --- Local State for Rectified Data ---
    const [rectifiedResultLocal, setRectifiedResultLocal] = useState(null);
    const [isLoadingRectification, setIsLoadingRectification] = useState(false);
    const [rectificationError, setRectificationError] = useState(null);
    const [openSections, setOpenSections] = useState({
        planets: true,
        aspects: true,
        friendship: true,
        shadbala: true,
    });

    const toggleSection = (section) => {
        setOpenSections(prev => ({ ...prev, [section]: !prev[section] }));
    };

    // --- Effect to Fetch Rectified Data ---
    useEffect(() => {
        if (!adjustedBirthDateTimeString || !calculationInputParams?.latitude || !calculationInputParams?.longitude || !calculationInputParams?.date) {
            if (rectifiedResultLocal) setRectifiedResultLocal(null);
            if (rectificationError) setRectificationError(null);
            return;
        }
        try {
            const originalDate = new Date(calculationInputParams.date);
            const adjustedDate = new Date(adjustedBirthDateTimeString);
            if (!isNaN(originalDate) && !isNaN(adjustedDate) && originalDate.getTime() === adjustedDate.getTime()) {
                if (rectifiedResultLocal) {
                    setRectifiedResultLocal(null);
                    setRectificationError(null);
                }
                return;
            }
        } catch (e) { console.error("PlanetDetailsPage: Date comparison error during rectification check:", e); }
        const dateTimeValidation = validateAndFormatDateTime(adjustedBirthDateTimeString, t);
        if (!dateTimeValidation.isValid) {
            setRectificationError(t('planetDetailsPage.invalidAdjustedDateError', { error: dateTimeValidation.error }));
            setRectifiedResultLocal(null);
            setIsLoadingRectification(false);
            return;
        }
        const formattedDateForApi = dateTimeValidation.formattedDate;
       
        setIsLoadingRectification(true);
        setRectificationError(null);
        const fetchRectifiedData = async () => {
            try {
                const payload = { date: formattedDateForApi, latitude: calculationInputParams.latitude, longitude: calculationInputParams.longitude, placeName: calculationInputParams.placeName };
                // Ensure API path is correct, e.g., '/astrology/calculate' or '/calculate' based on your setup
                const response = await api.post('/calculate', payload);
                setRectifiedResultLocal(response.data);
              
            } catch (err) {
                console.error("PlanetDetailsPage: Rectification fetch error:", err.response?.data || err.message || err);
                const backendError = err.response?.data?.error || err.response?.data?.message;
                setRectificationError(backendError || err.message || t('planetDetailsPage.fetchRectifiedDataFailed'));
                setRectifiedResultLocal(null);
            } finally { setIsLoadingRectification(false); }
        };
        const timerId = setTimeout(fetchRectifiedData, 300);
        return () => clearTimeout(timerId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [adjustedBirthDateTimeString, calculationInputParams, t]);


    // --- Determine which result set and input parameters to display ---
    const displayResult = rectifiedResultLocal || mainResult;
    const displayInputParams = useMemo(() => {
        if (rectifiedResultLocal) {
            return {
                ...(calculationInputParams || {}),
                date: adjustedBirthDateTimeString,
                placeName: calculationInputParams?.placeName,
                latitude: calculationInputParams?.latitude,
                longitude: calculationInputParams?.longitude
            };
        }
        return calculationInputParams;
    }, [rectifiedResultLocal, calculationInputParams, adjustedBirthDateTimeString]);

    // --- Extract data from the ACTIVE result set (displayResult) ---
    const planetDetails = displayResult?.planetDetails;
    const planetsPos = displayResult?.planetaryPositions?.sidereal;
    const houses = displayResult?.houses;
    const aspectData = displayResult?.planetDetails?.aspects;
    const friendshipData = displayResult?.planetDetails?.resultingFriendship;
    const shadbalaData = displayResult?.planetDetails?.shadbala;

    // Memoized Mean Cusp Degrees
    const meanCuspDegrees = useMemo(() => {
        if (!Array.isArray(houses) || houses.length !== 12) return [];
        const degrees = houses.map(h => convertDMSToDegrees(h?.mean_dms));
         if (degrees.some(isNaN)) {
              console.warn("Could not convert all mean cusp DMS to degrees for displayResult.");
             return [];
         }
        return degrees;
    }, [houses]);

    // --- Calculate Shadbala Ranks ---
    const shadbalaRanks = useMemo(() => {
        if (!shadbalaData || typeof shadbalaData !== 'object') {
            return {};
        }
        const scores = PLANET_ORDER
            .map(planet => ({
                planet,
                score: parseFloat(shadbalaData[planet]?.total) || -Infinity
            }))
            .filter(item => item.score > -Infinity);
        scores.sort((a, b) => b.score - a.score);
        const ranks = {};
        let currentRank = 0;
        let lastScore = Infinity;
        scores.forEach((item, index) => {
            if (item.score < lastScore) {
                currentRank = index + 1;
                lastScore = item.score;
            }
            ranks[item.planet] = currentRank;
        });
        return ranks;
    }, [shadbalaData]);


    // --- Loading / Error States ---
    const isLoading = isInitialLoading || isLoadingRectification;
    const error = rectificationError || initialError;

    // --- Render Logic ---
    if (isLoading && !displayResult) {
        return <div className="loader">{t('planetDetailsPage.loadingInitial')}</div>;
    }
    if (error && !displayResult) {
        return <div className="error-overlay">{t('planetDetailsPage.errorInitial', { error: error })}</div>;
    }
    if (!displayResult) {
        return <div className="placeholder-message">{t('planetDetailsPage.calculateFirstPrompt')}</div>;
    }

    // Check if essential data for tables is present
    const hasPlanetPosData = planetsPos && Object.keys(planetsPos).length > 0;
    const hasHouseData = Array.isArray(houses) && houses.length === 12;
    // Ensure meanCuspDegrees is checked safely
    const hasMeanCusps = Array.isArray(meanCuspDegrees) && meanCuspDegrees.length === 12;
    const canRenderPlanetTable = hasPlanetPosData && hasHouseData && hasMeanCusps;
    const hasAspectData = aspectData && Object.keys(aspectData).length > 0;
    const hasFriendshipData = friendshipData && Object.keys(friendshipData).length > 0;
    const hasShadbalaData = shadbalaData && typeof shadbalaData === 'object' && Object.keys(shadbalaData).length > 0;


    return (
        <div className="planet-details-page result-container">
            {/* Title, Loading/Error, Input Summary */}
            <h2 className="result-title">{t('planetDetailsPage.pageTitle')}</h2>
            {isLoadingRectification && mainResult && <div className="loader secondary-loader">{t('planetDetailsPage.loadingRectifiedData')}</div>}
            {rectificationError && mainResult && <p className="error-text secondary-error">{t('planetDetailsPage.rectificationErrorPrefix')}: {rectificationError}</p>}
            {displayInputParams && (
                <div className="result-section input-summary">
                    <h3 className="result-sub-title">{t('planetDetailsPage.basedOnLabel')}</h3>
                    <p><strong>{t('planetDetailsPage.dateLabel')}</strong> {formatDateTime(displayInputParams.date, t)}</p>
                    <p><strong>{t('planetDetailsPage.placeLabel')}</strong> {displayInputParams.placeName || t('utils.notAvailable')}</p>
                    <p><strong>{t('planetDetailsPage.coordsLabel')}</strong> {displayInputParams.latitude?.toFixed(4)}, {displayInputParams.longitude?.toFixed(4)}</p>
                    {displayResult.inputParameters?.ayanamsa && <p><strong>{t('planetDetailsPage.ayanamsaLabel')}</strong> {convertToDMS(displayResult.inputParameters.ayanamsa)}</p>}
                </div>
            )}

            {/* Planetary Positions Table */}
            <div className="result-section">
                <div className="section-header" onClick={() => toggleSection('planets')}>
                    <h3 className="result-sub-title">{t('planetDetailsPage.positionsTitle')}</h3>
                    <button className="toggle-button">{openSections.planets ? '−' : '+'}</button>
                </div>
                <div className={`section-content ${openSections.planets ? '' : 'collapsed'}`}>
                {canRenderPlanetTable ? (
                    <DetailedPlanetTable planets={planetsPos} houses={houses} planetDetails={planetDetails} />
                ) : (
                    <p className="result-text">{t('planetDetailsPage.planetDataUnavailable')}</p>
                )}
                </div>
            </div>

            {/* Aspects Table */}
            <div className="result-section">
                <div className="section-header" onClick={() => toggleSection('aspects')}>
                    <h3 className="result-sub-title">{t('planetDetailsPage.aspectsTitle')}</h3>
                    <button className="toggle-button">{openSections.aspects ? '−' : '+'}</button>
                </div>
                <div className={`section-content ${openSections.aspects ? '' : 'collapsed'}`}>
                {hasAspectData ? (
                    <div className="table-wrapper aspect-table-wrapper">
                        <table className="results-table aspect-table">
                            <thead>
                                <tr>
                                    <th>{t('aspectTableHeaders.planet')}</th>
                                    {/* Translate headers */}
                                    {ASPECT_TABLE_PLANETS.map(p => <th key={`head-${p}`}>{t(`planets.${p}`, { defaultValue: p })}</th>)}
                                </tr>
                            </thead>
                            <tbody>
                                {ASPECT_TABLE_PLANETS.map((planet) => {
                                    const aspectingPlanetsArray = aspectData[planet];
                                    return (
                                        <tr key={`row-${planet}`}>
                                            {/* Translate row label */}
                                            <td>{t(`planets.${planet}`, { defaultValue: planet })}</td>
                                            {ASPECT_TABLE_PLANETS.map((targetPlanet) => {
                                                const hasAspect = planet !== targetPlanet && aspectingPlanetsArray?.includes(targetPlanet);
                                                return (
                                                    <td key={`cell-${planet}-${targetPlanet}`} className={hasAspect ? 'has-aspect' : ''}>
                                                        {hasAspect ? '✓' : '-'}
                                                    </td>
                                                );
                                            })}
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                ) : (
                    <p className="result-text">{t('planetDetailsPage.aspectDataUnavailable')}</p>
                )}
                </div>
            </div>

            {/* Friendships Table */}
            <div className="result-section">
                <div className="section-header" onClick={() => toggleSection('friendship')}>
                    <h3 className="result-sub-title">{t('planetDetailsPage.friendshipsTitle')}</h3>
                    <button className="toggle-button">{openSections.friendship ? '−' : '+'}</button>
                </div>
                <div className={`section-content ${openSections.friendship ? '' : 'collapsed'}`}>
                {hasFriendshipData ? (
                    <div className="table-wrapper friendship-table-wrapper">
                        <table className="results-table friendship-table">
                             <thead>
                                <tr>
                                    <th>{t('friendshipTableHeaders.planet')}</th>
                                    {/* Translate headers */}
                                    {CORE_VEDIC_PLANETS.map(p => <th key={`head-friend-${p}`}>{t(`planets.${p}`, { defaultValue: p })}</th>)}
                                </tr>
                            </thead>
                            <tbody>
                                {CORE_VEDIC_PLANETS.map((planet) => (
                                    <tr key={`row-friend-${planet}`}>
                                        {/* Translate row label */}
                                        <td>{t(`planets.${planet}`, { defaultValue: planet })}</td>
                                        {CORE_VEDIC_PLANETS.map((targetPlanet) => {
                                            const friendshipTermKey = friendshipData[planet]?.[targetPlanet];
                                            // Helper to create a CSS-friendly class name from the friendship term
                                            const friendshipClass = friendshipTermKey ? `friendship-${friendshipTermKey.toLowerCase().replace(/ /g, '-')}` : '';
                                            return (
                                                <td
                                                    key={`cell-friend-${planet}-${targetPlanet}`}
                                                    className={friendshipClass}
                                                >
                                                    {planet === targetPlanet
                                                        ? t('planetDetailsPage.friendshipSelf')
                                                        // Translate friendship term
                                                        : t(`friendshipTerms.${friendshipTermKey}`, { defaultValue: friendshipTermKey ?? '-' })
                                                    }
                                                </td>
                                            );
                                        })}
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                ) : (
                    <p className="result-text">{t('planetDetailsPage.friendshipDataUnavailable')}</p>
                )}
                </div>
            </div>

            {/* Shadbala Table */}
            <div className="result-section">
                <div className="section-header" onClick={() => toggleSection('shadbala')}>
                    <h3 className="result-sub-title">{t('planetDetailsPage.shadbalaTitle')}</h3>
                    <button className="toggle-button">{openSections.shadbala ? '−' : '+'}</button>
                </div>
                <div className={`section-content ${openSections.shadbala ? '' : 'collapsed'}`}>
                {hasShadbalaData ? (
                    <div className="table-wrapper">
                        <table className="results-table shadbala-table">
                            <thead>
                                <tr>
                                    <th>{t('shadbalaTableHeaders.planet')}</th>
                                    <th>{t('shadbalaTableHeaders.sthana')}</th>
                                    <th>{t('shadbalaTableHeaders.dig')}</th>
                                    <th>{t('shadbalaTableHeaders.kala')}</th>
                                    <th>{t('shadbalaTableHeaders.chesta')}</th>
                                    <th>{t('shadbalaTableHeaders.naisargika')}</th>
                                    <th>{t('shadbalaTableHeaders.drik')}</th>
                                    <th>{t('shadbalaTableHeaders.total')}</th>
                                    <th>{t('shadbalaTableHeaders.rank')}</th>
                                </tr>
                            </thead>
                            <tbody>
                                {PLANET_ORDER.filter(p => shadbalaData[p]).map((planet) => {
                                    const bala = shadbalaData[planet];
                                    const components = bala?.components;

                                    if (!bala || typeof components !== 'object') {
                                        // Translate planet name in error row
                                        return ( <tr key={`shad-${planet}`}> <td>{t(`planets.${planet}`, { defaultValue: planet })}</td> <td colSpan="8">{t('planetDetailsPage.shadbalaDataMissing')}</td> </tr> );
                                    }
                                    const na = t('utils.notAvailable', 'N/A');
                                    const totalRupas = parseFloat(bala.total);
                                    const rank = shadbalaRanks[planet];

                                    return (
                                        <tr key={`shad-${planet}`}>
                                            {/* Translate row label */}
                                            <td>{t(`planets.${planet}`, { defaultValue: planet })}</td>
                                            <td>{typeof components.sthana === 'number' ? components.sthana.toFixed(2) : na}</td>
                                            <td>{typeof components.dig === 'number' ? components.dig.toFixed(2) : na}</td>
                                            <td>{typeof components.kala === 'number' ? components.kala.toFixed(2) : na}</td>
                                            <td>{typeof components.chesta === 'number' ? components.chesta.toFixed(2) : na}</td>
                                            <td>{typeof components.naisargika === 'number' ? components.naisargika.toFixed(2) : na}</td>
                                            <td>{typeof components.drik === 'number' ? components.drik.toFixed(2) : na}</td>
                                            <td><strong>{!isNaN(totalRupas) ? totalRupas.toFixed(2) : na}</strong></td>
                                            <td>{rank ?? na}</td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                         {/* Minimum Requirements and Note */}
                         {shadbalaData.minimum_requirements && (
                             <div className="shadbala-minimums">
                                 <p><strong>{t('planetDetailsPage.shadbalaMinimumsTitle')}</strong></p>
                                 <ul>
                                     {/* Translate planet names in minimum requirements list */}
                                     {Object.entries(shadbalaData.minimum_requirements).map(([planet, req]) => (
                                         <li key={`min-${planet}`}>{t(`planets.${planet}`, { defaultValue: planet })}: {req}</li>
                                     ))}
                                 </ul>
                             </div>
                         )}
                         {PLANET_ORDER.find(p => shadbalaData[p]?.note) && (
                             <p className="hint-text small-hint shadbala-note">
                                 {t('planetDetailsPage.shadbalaNotePrefix')} {PLANET_ORDER.map(p => shadbalaData[p]?.note).filter(Boolean).join(' ')}
                             </p>
                         )}
                    </div>
                ) : (
                    <p className="result-text">{t('planetDetailsPage.shadbalaDataUnavailable')}</p>
                )}
                </div>
            </div>

        </div>
    );
};

export default PlanetDetailsPage;