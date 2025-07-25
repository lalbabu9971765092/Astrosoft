// src/PrashnaTimeLocationPage.jsx
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import axios from 'axios'; // Needed for geocoding
import { useTranslation } from 'react-i18next'; // Import the hook
import api from './api';
import DiamondChart from './DiamondChart'; // Reuse chart component
// Import EVENT_HOUSES along with the default export
import KpSignificatorGrid, { EVENT_HOUSES } from './KpSignificatorGrid';
import DashaTable from './DashaTable'; // Import DashaTable
import {
    validateAndFormatDateTime,
    parseAndValidateCoords,
    getHouseNumbersFromString // Make sure this is imported or defined
} from './AstrologyUtils';
import '../styles/PrashnaPage.css'; // Create or reuse styles

// --- Helper Functions (Moved outside component) ---
// ... (formatDisplayDateTime remains the same) ...
const formatDisplayDateTime = (isoString, t) => {
  if (!isoString) return t ? t('utils.notAvailable', 'N/A') : 'N/A'; // Use translated N/A
  try {
    const date = new Date(isoString);
    if (isNaN(date.getTime())) return t ? t('utils.invalidDate', 'Invalid Date') : 'Invalid Date'; // Use translated Invalid Date
    // Using en-CA for YYYY-MM-DD format, adjust locale if needed
    return date.toLocaleDateString('en-CA', { year: 'numeric', month: '2-digit', day: '2-digit' }) + ' ' +
           date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false }); // 24-hour format
  } catch (e) {
    console.error("Error formatting date:", e);
    return isoString; // Return original string on error
  }
};

// *** ADDED: Helper function for Favourability Calculation (copied from PrashnaNumberPage) ***
const calculatePlanetFavourability = (allHouses, eventKey, t) => {
    // Use default 'N/A' values if no event is selected or event config is missing
    const defaultResult = { score: 0, favourability: 'N/A', completeness: 'N/A' };

    if (!eventKey || !EVENT_HOUSES[eventKey]) {
        return defaultResult;
    }

    const { favorable, unfavorable } = EVENT_HOUSES[eventKey];
    // Check if favorable/unfavorable arrays exist for the event
    if (!Array.isArray(favorable) || !Array.isArray(unfavorable)) {
         console.warn(`Missing favorable/unfavorable arrays for event key: ${eventKey}`);
         return defaultResult;
    }

    let score = 0;
    // We still need these flags to potentially differentiate between 0 score with houses vs 0 score with no houses
    let hasFavorable = false;
    let hasUnfavorable = false;

    // Ensure allHouses is an array before iterating
    if (!Array.isArray(allHouses)) {
        console.warn("calculatePlanetFavourability received non-array for allHouses:", allHouses);
        allHouses = []; // Treat as empty if invalid
    }

    // Calculate the score based on houses
    allHouses.forEach(house => {
        if (favorable.includes(house)) {
            score += 1; // Simple scoring: +1 for favorable
            hasFavorable = true;
        } else if (unfavorable.includes(house)) {
            score -= 1; // Simple scoring: -1 for unfavorable
            hasUnfavorable = true;
        }
    });

    // --- Determine Favourability string based on Score ---
    let favourability;
    if (score < 0) { // If score is negative, it's Unfavorable
        favourability = 'Unfavorable';
    } else if (score > 0) { // If score is positive, it's Favorable
        favourability = 'Favorable';
    } else { // Score is exactly 0
        // If score is 0, decide if it's Neutral (no relevant houses) or Mixed (balancing houses)
        if (hasFavorable || hasUnfavorable) { // Check if any scoring houses were involved
             favourability = 'Mixed'; // Score is 0, but houses were present
        } else {
             favourability = 'Neutral'; // Score is 0, and no favorable/unfavorable houses found
        }
    }

    // Determine Completeness string based on score (example logic - adjust as needed)
    let completeness = 'Weak'; // Default
    if (score <= -2) { // Example threshold for Strong Negative
        completeness = 'Strong Negative'; // Or just 'Strong' if you prefer
    } else if (score === -1) {
        completeness = 'Negative';
    } else if (score === 1) {
        completeness = 'Moderate';
    } else if (score >= 2) { // Example threshold for Strong Positive
        completeness = 'Strong';
    }
    // If score is 0, completeness remains 'Weak' or you could set it based on Neutral/Mixed

    return { score, favourability, completeness };
};


// --- Constants (Populated) ---
const SIGNIFICATOR_GRID_ORDER = [ // Needed for map calculation
    ['Ketu', 'Moon', 'Jupiter'],
    ['Venus', 'Mars', 'Saturn'],
    ['Sun', 'Rahu', 'Mercury']
];
const FLATTENED_GRID_ORDER = SIGNIFICATOR_GRID_ORDER.flat();

// *** MODIFIED: Generate keys dynamically from EVENT_HOUSES ***
const MAJOR_LIFE_EVENTS_KEYS = ['', ...Object.keys(EVENT_HOUSES).filter(key => key !== '')];
// Optional: Sort alphabetically
// const MAJOR_LIFE_EVENTS_KEYS = ['', ...Object.keys(EVENT_HOUSES).filter(key => key !== '').sort()];


const PrashnaTimeLocationPage = () => {
    // ... (state variables remain the same) ...
    const { t } = useTranslation(); // Call the hook

    // --- State ---
    // const [question, setQuestion] = useState(''); // Removed unused state
    const [prashnaDateTime, setPrashnaDateTime] = useState(''); // ISO YYYY-MM-DDTHH:MM:SS
    const [prashnaCoords, setPrashnaCoords] = useState('');
    const [prashnaPlaceName, setPrashnaPlaceName] = useState('');
    const [isLoadingLocation, setIsLoadingLocation] = useState(false);
    const [locationError, setLocationError] = useState(null);
    const [isGeocoding, setIsGeocoding] = useState(false);

    // State for Chart Calculation
    const [isLoadingChart, setIsLoadingChart] = useState(false);
    const [chartError, setChartError] = useState(null);
    const [prashnaResult, setPrashnaResult] = useState(null); // Stores result from /calculate

    // State for KP Significators Calculation
    const [isLoadingKp, setIsLoadingKp] = useState(false);
    const [kpError, setKpError] = useState(null);
    const [kpData, setKpData] = useState(null); // Stores result from /kp-significators

    // State for UI
    const [selectedEvent, setSelectedEvent] = useState('');
    const [inputDetails, setInputDetails] = useState(null); // Store params used for calculation

    // --- Handlers ---
    // ... (getCurrentTimeAndLocation, handleFindCoordinates remain the same) ...
    const getCurrentTimeAndLocation = useCallback(() => {
        // Set current time
        const now = new Date();
        const localNow = new Date(now.getTime() - now.getTimezoneOffset() * 60000);
        const formattedDateTime = localNow.toISOString().slice(0, 16); // YYYY-MM-DDTHH:MM
        setPrashnaDateTime(formattedDateTime);

        // Get current location
        if (navigator.geolocation) {
            setIsLoadingLocation(true); setLocationError(null);
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    const lat = position.coords.latitude; const lon = position.coords.longitude;
                    setPrashnaCoords(`${lat.toFixed(6)},${lon.toFixed(6)}`);
                    // Translate default location name
                    setPrashnaPlaceName(t('prashnaTimeLocPage.currentLocationDefault', "Current Location"));
                    setIsLoadingLocation(false);
                },
                (geoError) => {
                    console.error("Error getting geolocation:", geoError);
                    // Translate error message with interpolation
                    setLocationError(t('prashnaTimeLocPage.errorGetLocation', { message: geoError.message }));
                    setIsLoadingLocation(false);
                },
                { enableHighAccuracy: false, timeout: 10000, maximumAge: 0 }
            );
        } else {
             // Translate error message
             setLocationError(t('prashnaTimeLocPage.errorGeolocationNotSupported'));
             setIsLoadingLocation(false);
        }
    }, [t]); // Add t dependency

    const handleFindCoordinates = useCallback(async () => {
        // Translate alert message and default location name
        if (!prashnaPlaceName.trim() || prashnaPlaceName === t('prashnaTimeLocPage.currentLocationDefault', "Current Location")) {
             alert(t('prashnaTimeLocPage.alertEnterPlace')); return;
        }
        setIsGeocoding(true); setLocationError(null); setPrashnaCoords(''); // Clear coords while searching
        try {
            // IMPORTANT: Add your User-Agent details
            const userAgent = 'AstrologyWebApp/1.0 (your-contact@example.com)'; // Replace with your app name and contact
            const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(prashnaPlaceName)}&format=json&limit=1&addressdetails=1`;
            const response = await axios.get(url, { headers: { 'User-Agent': userAgent } });
            if (response.data && response.data.length > 0) {
                const { lat, lon, display_name } = response.data[0];
                const latNum = parseFloat(lat); const lonNum = parseFloat(lon);
                if (!isNaN(latNum) && !isNaN(lonNum)) {
                    setPrashnaCoords(`${latNum.toFixed(6)},${lonNum.toFixed(6)}`);
                    setPrashnaPlaceName(display_name || prashnaPlaceName); // Update place name
                } else { throw new Error('Invalid coordinate data received.'); }
            } else {
                // Translate error message with interpolation
                setLocationError(t('prashnaTimeLocPage.errorGeocodingNotFound', { place: prashnaPlaceName }));
            }
        } catch (err) {
            console.error('Geocoding error:', err);
            // Translate error message with interpolation
            setLocationError(t('prashnaTimeLocPage.errorGeocodingFailed', { message: err.response?.data?.error || err.message || 'Request failed.' }));
        } finally { setIsGeocoding(false); }
    }, [prashnaPlaceName, t]); // Add t dependency

    // --- Effect for Initial Load ---
    useEffect(() => {
        getCurrentTimeAndLocation();
    }, [getCurrentTimeAndLocation]); // Run once on mount

    // --- Calculate Prashna Chart & KP Significators ---
    // ... (handleCalculatePrashna remains the same) ...
    const handleCalculatePrashna = useCallback(async () => {
        setChartError(null); setKpError(null);
        setPrashnaResult(null); setKpData(null);
        setInputDetails(null);

        // --- Validation ---
        // Ensure datetime-local value includes seconds for validation function
        const dateTimeWithSeconds = prashnaDateTime.length === 16 ? `${prashnaDateTime}:00` : prashnaDateTime;
        // Pass 't' to validation functions
        const dateTimeValidation = validateAndFormatDateTime(dateTimeWithSeconds, t);
        if (!dateTimeValidation.isValid) {
            setChartError(dateTimeValidation.error);
            setKpError(dateTimeValidation.error);
            return;
        }
        const coordsValidation = parseAndValidateCoords(prashnaCoords, t);
        if (!coordsValidation.isValid) {
            setChartError(coordsValidation.error);
            setKpError(coordsValidation.error);
            return;
        }
        // --- End Validation ---

        setIsLoadingChart(true); setIsLoadingKp(true);

        const payload = {
            date: dateTimeValidation.formattedDate, // Use validated/formatted date
            latitude: coordsValidation.latitude,
            longitude: coordsValidation.longitude,
            placeName: prashnaPlaceName
        };
        setInputDetails(payload); // Store the input used

        try {
            // console.log("Calculating Prashna (Time/Loc) with payload:", payload);
            // Fetch both chart and KP data concurrently
            const [chartResponse, kpResponse] = await Promise.all([
                api.post('/calculate', payload).catch(err => ({ error: err })),
                api.post('/kp-significators', payload).catch(err => ({ error: err }))
            ]);

            // Process Chart Response
            if (chartResponse.error) {
                console.error("Prashna Chart calculation error:", chartResponse.error);
                // Translate error message
                const errMsg = chartResponse.error.response?.data?.error || chartResponse.error.message || t('prashnaTimeLocPage.errorChartFetch');
                setChartError(errMsg);
                setPrashnaResult(null);
            } else {
                setPrashnaResult(chartResponse.data);
                // console.log("Prashna Chart Result:", chartResponse.data);
            }

            // Process KP Response
            if (kpResponse.error) {
                console.error("Prashna KP calculation error:", kpResponse.error);
                // Translate error message
                const errMsg = kpResponse.error.response?.data?.error || kpResponse.error.message || t('prashnaTimeLocPage.errorKpFetch');
                setKpError(errMsg);
                setKpData(null);
            } else {
                // Ensure kpSignificatorsData is an array before setting
                setKpData(Array.isArray(kpResponse.data?.kpSignificatorsData) ? kpResponse.data.kpSignificatorsData : null);
                // console.log("Prashna KP Result:", kpResponse.data);
            }

        } catch (err) { // Catch errors from Promise.all itself
            console.error("Overall Prashna calculation error:", err);
            // Translate error message
            const errMsg = t('prashnaTimeLocPage.errorUnexpected');
            setChartError(errMsg); setKpError(errMsg);
            setPrashnaResult(null); setKpData(null);
        } finally {
            setIsLoadingChart(false); setIsLoadingKp(false);
        }
    }, [prashnaDateTime, prashnaCoords, prashnaPlaceName, t]); // Add t dependency

    // --- Calculate Significator Details Map (Memoized) ---
    // *** MODIFIED: Added Favourability Calculation ***
    const significatorDetailsMap = useMemo(() => {
        const finalMap = new Map();
        if (!kpData || !Array.isArray(kpData) || kpData.length === 0) {
            return finalMap;
        }

        // --- Step 1: Create Intermediate Map with Raw Data ---
        const intermediatePlanetData = new Map();
        const planetOrderSource = kpData.map(p => p.name);
        const allRelevantPlanetNames = [...new Set([...FLATTENED_GRID_ORDER, ...planetOrderSource])];

        allRelevantPlanetNames.forEach(planetName => {
            const planet = kpData.find(p => p.name === planetName);
            if (planet) {
                intermediatePlanetData.set(planetName, {
                    name: planetName,
                    occupiedHouses: getHouseNumbersFromString(planet.occupiedHouses),
                    ownedHouses: getHouseNumbersFromString(planet.ownedHouses),
                    signLordOwnedHouses: getHouseNumbersFromString(planet.signLordOwnedHouses),
                    aspectingOwnedHouses: getHouseNumbersFromString(planet.aspectingOwnedHouses),
                    // Use translated N/A for consistency
                    nakshatraLordName: planet.nakshatraLord?.name || t('utils.notAvailable', 'N/A'),
                    subLordName: planet.subLord?.name || t('utils.notAvailable', 'N/A'),
                });
            } else if (FLATTENED_GRID_ORDER.includes(planetName)) {
                 intermediatePlanetData.set(planetName, {
                    name: planetName, occupiedHouses: [], ownedHouses: [], signLordOwnedHouses: [],
                    aspectingOwnedHouses: [],
                    nakshatraLordName: t('utils.notAvailable', 'N/A'),
                    subLordName: t('utils.notAvailable', 'N/A'),
                });
            }
        });

        // --- Step 2: Create Final Map with Processed Data and Favourability ---
        FLATTENED_GRID_ORDER.forEach(planetName => {
            const planetData = intermediatePlanetData.get(planetName);

            if (!planetData) {
                finalMap.set(planetName, {
                    name: planetName, allHouses: [], nakshatraLordName: t('utils.notAvailable', 'N/A'), nakLordAllHouses: [],
                    subLordName: t('utils.notAvailable', 'N/A'), subLordAllHouses: [],
                    score: 0, favourability: 'N/A', completeness: 'N/A' // Add defaults
                });
                return;
            }

            const nakLordData = intermediatePlanetData.get(planetData.nakshatraLordName);
            const subLordData = intermediatePlanetData.get(planetData.subLordName);

            const planetHousesRaw = [...planetData.occupiedHouses, ...planetData.ownedHouses, ...planetData.signLordOwnedHouses, ...planetData.aspectingOwnedHouses];
            const nakLordHousesRaw = nakLordData ? [...nakLordData.occupiedHouses, ...nakLordData.ownedHouses, ...nakLordData.signLordOwnedHouses, ...nakLordData.aspectingOwnedHouses] : [];
            const subLordHousesRaw = subLordData ? [...subLordData.occupiedHouses, ...subLordData.ownedHouses, ...subLordData.signLordOwnedHouses, ...subLordData.aspectingOwnedHouses] : [];

            const planetAllHousesDisplay = [...new Set(planetHousesRaw)].sort((a, b) => a - b);
            const nakLordAllHousesDisplay = [...new Set(nakLordHousesRaw)].sort((a, b) => a - b);
            const subLordAllHousesDisplay = [...new Set(subLordHousesRaw)].sort((a, b) => a - b);

            // *** Calculate Favourability ***
            const combinedHousesForScoring = [...new Set([...planetHousesRaw, ...nakLordHousesRaw, ...subLordHousesRaw])];
            // Call the calculation function
            const { score, favourability, completeness } = calculatePlanetFavourability(combinedHousesForScoring, selectedEvent, t);

            // Set the final data in the map
            finalMap.set(planetName, {
                name: planetName,
                allHouses: planetAllHousesDisplay,
                nakshatraLordName: planetData.nakshatraLordName,
                nakLordAllHouses: nakLordAllHousesDisplay,
                subLordName: planetData.subLordName,
                subLordAllHouses: subLordAllHousesDisplay,
                // Add the calculated values
                score: score,
                favourability: favourability,
                completeness: completeness,
            });
        });
        return finalMap;
    // *** Update Dependency Array ***
    }, [kpData, selectedEvent, t]); // Add selectedEvent and t

    // --- Loading / Error States ---
    // ... (isOverallLoading, overallError remain the same) ...
    const isOverallLoading = isLoadingChart || isLoadingKp || isLoadingLocation || isGeocoding;
    const overallError = chartError || kpError || locationError;

    // --- Generate translated event options ---
    // ... (translatedLifeEvents remains the same) ...
    const translatedLifeEvents = useMemo(() => {
        return MAJOR_LIFE_EVENTS_KEYS.map(eventKey => ({
            value: eventKey,
            // Translate label, provide fallback if key is empty
            label: eventKey ? t(`lifeEvents.${eventKey}`, eventKey) : t('prashnaTimeLocPage.selectEventOption', '-- Select Event --')
        }));
    }, [t]); // Dependency is t

    // --- Render Results ---
    // ... (renderResults remains the same) ...
    const renderResults = () => {
        // Initial loading state
        // Translate loading message
        if (isOverallLoading && !prashnaResult && !kpData && !overallError) return <div className="loader">{t('prashnaTimeLocPage.resultsLoading')}</div>;
        // Display error if occurred and no results available yet
        if (overallError && !prashnaResult && !kpData) return <p className="error-text">{overallError}</p>;

        // Check data validity
        const hasValidKpDataForGrid = significatorDetailsMap && significatorDetailsMap.size > 0;
        const hasDashaData = prashnaResult?.dashaPeriods && Array.isArray(prashnaResult.dashaPeriods) && prashnaResult.dashaPeriods.length > 0;
        const { houses, planetaryPositions } = prashnaResult || {};
        const canRenderChart = houses && planetaryPositions?.sidereal;

        // Message if calculation hasn't run or resulted in no data (and no error shown yet)
        // Translate initial prompt
        if (!prashnaResult && !hasValidKpDataForGrid && !overallError) return <p className="info-text">{t('prashnaTimeLocPage.resultsInitialPrompt')}</p>;

        return (
            <div className="prashna-results-area two-column-layout"> {/* Use CSS for layout */}
                {/* Column 1: Chart and Tables */}
                <div className="results-column">
                    {/* Translate title */}
                    <h3 className="result-sub-title">{t('prashnaTimeLocPage.chartTitle')}</h3>
                    {/* Translate loading/error messages */}
                    {isLoadingChart && <div className="loader small-loader">{t('prashnaTimeLocPage.chartLoading')}</div>}
                    {chartError && !isLoadingChart && <p className="error-text small-error">{t('prashnaTimeLocPage.chartErrorPrefix')}: {chartError}</p>}
                    {/* Render chart only if data exists and no chart-specific error */}
                    {canRenderChart && !chartError ? (
                        <div className="prashna-chart-wrapper">
                            <DiamondChart
                                // Translate title
                                title={t('prashnaTimeLocPage.chartTitleFull')}
                                houses={houses}
                                planets={planetaryPositions.sidereal}
                                size={350} // Adjust size as needed
                            />
                        </div>
                    ) : (!isLoadingChart && !chartError && <p>{t('prashnaTimeLocPage.chartUnavailable')}</p>)}
                    {/* Dasha Table */}
                     {hasDashaData && !chartError ? (
                        <DashaTable dashaPeriods={prashnaResult.dashaPeriods} />
                     ) : (!isLoadingChart && !chartError && <p>{t('prashnaTimeLocPage.dashaUnavailable')}</p>)}
                    {/* Add Planetary/House Tables here if needed */}
                </div>

                {/* Column 2: KP Significators */}
                <div className="results-column">
                    {/* Translate title */}
                    <h3 className="result-sub-title">{t('prashnaTimeLocPage.kpTitle')}</h3>
                    {/* Translate loading/error messages */}
                    {isLoadingKp && <div className="loader small-loader">{t('prashnaTimeLocPage.kpLoading')}</div>}
                    {kpError && !isLoadingKp && <p className="error-text small-error">{t('prashnaTimeLocPage.kpErrorPrefix')}: {kpError}</p>}
                    {/* Render grid only if data exists and no KP-specific error */}
                    {hasValidKpDataForGrid && !kpError ? (
                        <KpSignificatorGrid
                            significatorDetailsMap={significatorDetailsMap} // Pass the map including favourability
                            selectedEvent={selectedEvent}
                        />
                    ) : (!isLoadingKp && !kpError && <p>{t('prashnaTimeLocPage.kpUnavailable')}</p>)}
                </div>
            </div>
        );
    };

    // --- Component Return ---
    // ... (return statement remains the same) ...
    return (
        <div className="prashna-page">
            {/* Translate page title */}
            <h1>{t('prashnaTimeLocPage.pageTitle')}</h1>

            {/* --- Controls --- */}
            <div className="prashna-controls">
                {/* Input Summary */}
                {inputDetails && (
                    <div className="result-section input-summary small-summary">
                        {/* Translate summary using interpolation */}
                        {t('prashnaTimeLocPage.inputSummary', {
                            dateTime: formatDisplayDateTime(inputDetails.date, t), // Pass t
                            place: inputDetails.placeName || t('utils.notAvailable', 'N/A'), // Translate N/A
                            lat: inputDetails.latitude?.toFixed(4),
                            lon: inputDetails.longitude?.toFixed(4)
                        })}
                    </div>
                )}
                {/* Event Selector */}
                 <div className="result-section life-event-selector small-selector">
                    {/* Translate label */}
                    <label htmlFor="life-event-select">{t('prashnaTimeLocPage.analyzeEventLabel')} </label>
                    <select id="life-event-select" value={selectedEvent} onChange={(e) => setSelectedEvent(e.target.value)} disabled={isOverallLoading}>
                         {/* Use translated options */}
                         {translatedLifeEvents.map(event => (<option key={event.value} value={event.value}>{event.label}</option>))}
                    </select>
                </div>
                {/* Question Input (Optional - Removed state, so commented out) */}
                {/* <div className="form-row">
                    <div className="input-group full-width">
                        <label htmlFor="prashna-question">Question:</label>
                        <textarea
                            id="prashna-question"
                            // value={question} // Removed
                            // onChange={(e) => setQuestion(e.target.value)} // Removed
                            rows="2"
                            placeholder="Enter the question asked (optional)"
                            disabled={isOverallLoading}
                        />
                    </div>
                </div> */}
                {/* DateTime Input */}
                 <div className="form-row">
                    <div className="input-group">
                        {/* Translate label */}
                        <label htmlFor="prashna-datetime">{t('prashnaTimeLocPage.dateTimeLabel')}</label>
                        <input
                            id="prashna-datetime"
                            type="datetime-local"
                            value={prashnaDateTime}
                            onChange={(e) => setPrashnaDateTime(e.target.value)}
                            required
                            disabled={isOverallLoading}
                            // Consider adding max property for future dates if needed
                        />
                    </div>
                </div>
                {/* Location Inputs */}
                 <div className="form-row">
                    <div className="input-group place-group">
                        {/* Translate label */}
                        <label htmlFor="prashna-place">{t('prashnaTimeLocPage.placeLabel')}</label>
                        <input
                            id="prashna-place"
                            type="text"
                            value={prashnaPlaceName}
                            onChange={(e) => setPrashnaPlaceName(e.target.value)}
                            // Translate placeholder
                            placeholder={t('prashnaTimeLocPage.placePlaceholder')}
                            disabled={isGeocoding || isLoadingLocation}
                        />
                    </div>
                     <div className="button-container find-coords-button">
                        {/* Translate button text */}
                        <button type="button" onClick={handleFindCoordinates} disabled={isGeocoding || isLoadingLocation || !prashnaPlaceName.trim() || prashnaPlaceName === t('prashnaTimeLocPage.currentLocationDefault', "Current Location")}>
                            {isGeocoding ? t('prashnaTimeLocPage.findingCoordsButton') : t('prashnaTimeLocPage.findCoordsButton')}
                        </button>
                    </div>
                </div>
                 <div className="form-row">
                    <div className="input-group full-width">
                        {/* Translate label */}
                        <label htmlFor="prashna-coords">{t('prashnaTimeLocPage.coordsLabel')}</label>
                        <input
                            id="prashna-coords"
                            type="text"
                            value={prashnaCoords}
                            onChange={(e) => setPrashnaCoords(e.target.value)}
                            // Translate placeholder
                            placeholder={t('prashnaTimeLocPage.coordsPlaceholder')}
                            required
                            disabled={isLoadingLocation || isGeocoding}
                        />
                        {/* Display location loading/error */}
                        {/* Translate loading hint */}
                        {isLoadingLocation && <p className="hint-text loading-text small-hint">{t('prashnaTimeLocPage.fetchingLocationHint')}</p>}
                        {locationError && <p className="error-text small-error">{locationError}</p>}
                    </div>
                     <div className="input-group half-width">
                         {/* Translate button text */}
                         <button type="button" onClick={getCurrentTimeAndLocation} disabled={isLoadingLocation || isGeocoding}>
                            {isLoadingLocation ? t('prashnaTimeLocPage.gettingLocationButton') : t('prashnaTimeLocPage.useCurrentTimeLocationButton')}
                         </button>
                    </div>
                </div>
                {/* Calculate Button */}
                 <div className="form-row action-buttons-row">
                    {/* Translate button text */}
                    <button type="button" onClick={handleCalculatePrashna} disabled={isOverallLoading || !prashnaDateTime || !prashnaCoords} className="calculate-button">
                        {isLoadingChart || isLoadingKp ? t('prashnaTimeLocPage.calculatingButton') : t('prashnaTimeLocPage.calculateButton')}
                    </button>
                </div>
            </div>

            {/* --- Results --- */}
            <div className="prashna-results">
                {renderResults()}
            </div>
        </div>
    );
};

export default PrashnaTimeLocationPage;
