// src/PrashnaNumberPage.jsx
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import axios from 'axios'; // Needed for geocoding
import { useTranslation } from 'react-i18next'; // Import the hook
import api from './api';
import DiamondChart from './DiamondChart';
import KpSignificatorGrid from './KpSignificatorGrid';
import DashaTable from './DashaTable'; // Import DashaTable
import {
    validateAndFormatDateTime,
    parseAndValidateCoords,
  
} from './AstrologyUtils';
import '../styles/PrashnaPage.css'; // Reuse styles

// --- Helper Functions (Moved outside component) ---
// Pass 't' for potential error/invalid messages
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

// Helper function to return ARRAY of house numbers, sorted numerically (Unchanged logic)
const getHouseNumbersFromString = (houseString) => {
    if (!houseString || typeof houseString !== 'string') return [];
    return houseString.split(',')
                      .map(numStr => parseInt(numStr.trim(), 10))
                      .filter(num => !isNaN(num)) // Ensure only valid numbers
                      .sort((a, b) => a - b); // Sort numerically
};

// --- Constants (Consider moving to a separate file if reused) ---
const SIGNIFICATOR_GRID_ORDER = [
    ['Ketu', 'Moon', 'Jupiter'],
    ['Venus', 'Mars', 'Saturn'],
    ['Sun', 'Rahu', 'Mercury']
];
const FLATTENED_GRID_ORDER = SIGNIFICATOR_GRID_ORDER.flat();

// Event keys remain the same, labels will be translated
const MAJOR_LIFE_EVENTS_KEYS = [
    '', 'education', 'career_start', 'career_promotion', 'marriage',
    'childbirth', 'property_purchase', 'vehicle_purchase', 'foreign_travel', 'health_issues'
];

// EVENT_HOUSES constant is used by KpSignificatorGrid, keep it there or pass as prop if needed.

const PrashnaNumberPage = () => {
    const { t } = useTranslation(); // Call the hook

    // --- State ---
    const [prashnaNumber, setPrashnaNumber] = useState(''); // Input 1-249
    const [currentCoords, setCurrentCoords] = useState(''); // For calculation
    const [currentPlaceName, setCurrentPlaceName] = useState('');
    const [isLoadingLocation, setIsLoadingLocation] = useState(false);
    const [locationError, setLocationError] = useState(null);
    const [isGeocoding, setIsGeocoding] = useState(false);

    // State for Calculation Results
    const [isLoadingChart, setIsLoadingChart] = useState(false);
    const [chartError, setChartError] = useState(null);
    const [prashnaResult, setPrashnaResult] = useState(null); // From /calculate-prashna-number

    const [isLoadingKp, setIsLoadingKp] = useState(false);
    const [kpError, setKpError] = useState(null);
    const [kpData, setKpData] = useState(null); // From /kp-significators (using current time)

    // State for UI
    const [selectedEvent, setSelectedEvent] = useState('');
    const [inputDetails, setInputDetails] = useState(null); // Store params used

    // --- Handlers ---
    const getCurrentLocation = useCallback(() => {
        if (navigator.geolocation) {
            setIsLoadingLocation(true); setLocationError(null);
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    const lat = position.coords.latitude; const lon = position.coords.longitude;
                    setCurrentCoords(`${lat.toFixed(6)},${lon.toFixed(6)}`);
                    // Translate default location name if desired, or keep as is
                    setCurrentPlaceName(t('prashnaNumberPage.currentLocationDefault', "Current Location"));
                    setIsLoadingLocation(false);
                },
                (geoError) => {
                    console.error("Error getting geolocation:", geoError);
                    // Translate error message with interpolation
                    setLocationError(t('prashnaNumberPage.errorGetLocation', { message: geoError.message }));
                    setIsLoadingLocation(false);
                },
                { enableHighAccuracy: false, timeout: 10000, maximumAge: 0 } // Standard options
            );
        } else {
             // Translate error message
             setLocationError(t('prashnaNumberPage.errorGeolocationNotSupported'));
             setIsLoadingLocation(false); // Ensure loading state is cleared
        }
    }, [t]); // Add t dependency

    const handleFindCoordinates = useCallback(async () => {
        // Translate alert message
        if (!currentPlaceName.trim() || currentPlaceName === t('prashnaNumberPage.currentLocationDefault', "Current Location")) {
             alert(t('prashnaNumberPage.alertEnterPlace')); return;
        }
        setIsGeocoding(true); setLocationError(null); setCurrentCoords(''); // Clear coords while searching
        try {
            const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(currentPlaceName)}&format=json&limit=1&addressdetails=1`;
            const response = await axios.get(url, { headers: { 'User-Agent': 'AstrologyWebApp/1.0 (your-contact@example.com)' } }); // Replace with your contact
            if (response.data && response.data.length > 0) {
                const { lat, lon, display_name } = response.data[0];
                const latNum = parseFloat(lat); const lonNum = parseFloat(lon);
                if (!isNaN(latNum) && !isNaN(lonNum)) {
                    setCurrentCoords(`${latNum.toFixed(6)},${lonNum.toFixed(6)}`);
                    setCurrentPlaceName(display_name || currentPlaceName); // Update place name with more detail
                } else { throw new Error('Invalid coordinate data received.'); }
            } else {
                // Translate error message with interpolation
                setLocationError(t('prashnaNumberPage.errorGeocodingNotFound', { place: currentPlaceName }));
            }
        } catch (err) {
            console.error('Geocoding error:', err);
            // Translate error message with interpolation
            setLocationError(t('prashnaNumberPage.errorGeocodingFailed', { message: err.response?.data?.error || err.message || 'Request failed.' }));
        } finally { setIsGeocoding(false); }
    }, [currentPlaceName, t]); // Add t dependency

    // --- Effect for Initial Location ---
    useEffect(() => {
        getCurrentLocation();
    }, [getCurrentLocation]); // Run once on mount

    // --- Calculate Handler ---
    const handleCalculatePrashnaNumber = useCallback(async () => {
        // Reset states
        setChartError(null); setKpError(null);
        setPrashnaResult(null); setKpData(null);
        setInputDetails(null);

        // --- Validation ---
        const num = parseInt(prashnaNumber, 10);
        if (isNaN(num) || num < 1 || num > 249) {
            // Translate error message
            const errorMsg = t('prashnaNumberPage.errorInvalidNumber');
            setChartError(errorMsg); setKpError(errorMsg);
            return;
        }
        // Pass 't' to validation function
        const coordsValidation = parseAndValidateCoords(currentCoords, t);
        if (!coordsValidation.isValid) {
            setChartError(coordsValidation.error); setKpError(coordsValidation.error);
            return;
        }
        // --- End Validation ---

        setIsLoadingChart(true); setIsLoadingKp(true);

        // Get CURRENT time for BOTH calculations
        const now = new Date();
        const localNow = new Date(now.getTime() - now.getTimezoneOffset() * 60000);
        const currentDateTimeStr = localNow.toISOString().slice(0, 19); // YYYY-MM-DDTHH:MM:SS
        // Pass 't' to validation function
        const dateTimeValidation = validateAndFormatDateTime(currentDateTimeStr, t);
        if (!dateTimeValidation.isValid) {
            // Translate error message
            const errorMsg = t('prashnaNumberPage.errorCurrentTime');
            setChartError(errorMsg); setKpError(errorMsg);
            setIsLoadingChart(false); setIsLoadingKp(false);
            return;
        }

        const payloadChart = {
            number: num,
            latitude: coordsValidation.latitude,
            longitude: coordsValidation.longitude,
            placeName: currentPlaceName,
            date: dateTimeValidation.formattedDate // Pass CURRENT formatted time
        };
        const payloadKp = { // KP Significators always use current time/location
            date: dateTimeValidation.formattedDate,
            latitude: coordsValidation.latitude,
            longitude: coordsValidation.longitude,
            placeName: currentPlaceName
        };
        setInputDetails(payloadChart); // Store the input used for the chart part

        try {
            const [chartResponse, kpResponse] = await Promise.all([
                api.post('/calculate-prashna-number', payloadChart).catch(err => ({ error: err })),
                api.post('/kp-significators', payloadKp).catch(err => ({ error: err }))
            ]);

            // Process Chart Response
            if (chartResponse.error) {
                console.error("Prashna Number Chart Fetch Error:", chartResponse.error);
                // Translate error message
                setChartError(chartResponse.error.response?.data?.error || chartResponse.error.message || t('prashnaNumberPage.errorChartFetch'));
                setPrashnaResult(null);
            } else {
                setPrashnaResult(chartResponse.data);
            }

            // Process KP Response
            if (kpResponse.error) {
                console.error("Prashna Number KP Fetch Error:", kpResponse.error);
                // Translate error message
                setKpError(kpResponse.error.response?.data?.error || kpResponse.error.message || t('prashnaNumberPage.errorKpFetch'));
                setKpData(null);
            } else {
                setKpData(Array.isArray(kpResponse.data?.kpSignificatorsData) ? kpResponse.data.kpSignificatorsData : null);
            }

        } catch (err) { // Catch errors from Promise.all itself
            console.error("Overall Prashna Number Fetch Error:", err);
            // Translate error message
            const errorMsg = t('prashnaNumberPage.errorUnexpected');
            setChartError(errorMsg); setKpError(errorMsg);
            setPrashnaResult(null); setKpData(null);
        } finally {
            setIsLoadingChart(false); setIsLoadingKp(false);
        }
    }, [prashnaNumber, currentCoords, currentPlaceName, t]); // Add t dependency

    // --- Significator Map Calculation (Memoized) ---
    const significatorDetailsMap = useMemo(() => {
        const finalMap = new Map();
        if (!kpData || !Array.isArray(kpData) || kpData.length === 0) {
            return finalMap;
        }
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
                    nakshatraLordName: planet.nakshatraLord?.name || 'N/A',
                    subLordName: planet.subLord?.name || 'N/A',
                });
            } else if (FLATTENED_GRID_ORDER.includes(planetName)) {
                 intermediatePlanetData.set(planetName, {
                    name: planetName, occupiedHouses: [], ownedHouses: [], signLordOwnedHouses: [],
                    aspectingOwnedHouses: [], nakshatraLordName: 'N/A', subLordName: 'N/A',
                });
            }
        });

        FLATTENED_GRID_ORDER.forEach(planetName => {
            const planetData = intermediatePlanetData.get(planetName);
            if (!planetData) {
                finalMap.set(planetName, { name: planetName, allHouses: [], nakshatraLordName: 'N/A', nakLordAllHouses: [], subLordName: 'N/A', subLordAllHouses: [] });
                return;
            }
            const nakLordData = intermediatePlanetData.get(planetData.nakshatraLordName);
            const subLordData = intermediatePlanetData.get(planetData.subLordName);
            const nakLordHouses = nakLordData ? [...nakLordData.occupiedHouses, ...nakLordData.ownedHouses, ...nakLordData.signLordOwnedHouses, ...nakLordData.aspectingOwnedHouses] : [];
            const subLordHouses = subLordData ? [...subLordData.occupiedHouses, ...subLordData.ownedHouses, ...subLordData.signLordOwnedHouses, ...subLordData.aspectingOwnedHouses] : [];
            const planetAllHouses = [...new Set([...planetData.occupiedHouses, ...planetData.ownedHouses, ...planetData.signLordOwnedHouses, ...planetData.aspectingOwnedHouses])].sort((a, b) => a - b);
            const nakLordAllHouses = [...new Set(nakLordHouses)].sort((a, b) => a - b);
            const subLordAllHouses = [...new Set(subLordHouses)].sort((a, b) => a - b);

            finalMap.set(planetName, {
                name: planetName,
                allHouses: planetAllHouses,
                nakshatraLordName: planetData.nakshatraLordName,
                nakLordAllHouses: nakLordAllHouses,
                subLordName: planetData.subLordName,
                subLordAllHouses: subLordAllHouses,
            });
        });
        return finalMap;
    }, [kpData]); // Dependency is only kpData

    // --- Loading / Error States ---
    const isOverallLoading = isLoadingChart || isLoadingKp || isLoadingLocation || isGeocoding;
    // Combine specific errors, prioritizing calculation errors
    const overallError = chartError || kpError || locationError;

    // --- Generate translated event options ---
    const translatedLifeEvents = useMemo(() => {
        return MAJOR_LIFE_EVENTS_KEYS.map(eventKey => ({
            value: eventKey,
            // Translate label, provide fallback if key is empty
            label: eventKey ? t(`lifeEvents.${eventKey}`, eventKey) : t('prashnaNumberPage.selectEventOption', '-- Select Event --')
        }));
    }, [t]); // Dependency is t

    // --- Render Results ---
    const renderResults = () => {
         // Initial loading state before any calculation attempt
         // Translate loading message
         if (isOverallLoading && !prashnaResult && !kpData && !overallError) return <div className="loader">{t('prashnaNumberPage.resultsLoading')}</div>;

         // Display error if occurred and no results are available yet
         if (overallError && !prashnaResult && !kpData) return <p className="error-text">{overallError}</p>;

         // Check if the map exists before accessing size
         const hasValidKpDataForGrid = significatorDetailsMap && significatorDetailsMap.size > 0;
         // Check if chart data exists for Dasha
         const hasDashaData = prashnaResult?.dashaPeriods && Array.isArray(prashnaResult.dashaPeriods) && prashnaResult.dashaPeriods.length > 0;

         // Message if calculation hasn't been run or resulted in no data (and no error shown yet)
         // Translate initial prompt
         if (!prashnaResult && !hasValidKpDataForGrid && !overallError) return <p className="info-text">{t('prashnaNumberPage.resultsInitialPrompt')}</p>;

         // Extract data safely
         const { houses, planetaryPositions } = prashnaResult || {};
         const canRenderChart = houses && planetaryPositions?.sidereal;

         return (
             <div className="prashna-results-area two-column-layout">
                 {/* Column 1: Chart & Tables */}
                 <div className="results-column">
                     {/* Translate title with interpolation */}
                     <h3 className="result-sub-title">{t('prashnaNumberPage.chartTitle', { num: inputDetails?.number || 'N/A' })}</h3>
                     {/* Display chart loading/error specific to chart fetch */}
                     {/* Translate loading/error messages */}
                     {isLoadingChart && <div className="loader small-loader">{t('prashnaNumberPage.chartLoading')}</div>}
                     {chartError && !isLoadingChart && <p className="error-text small-error">{t('prashnaNumberPage.chartErrorPrefix')}: {chartError}</p>}
                     {/* Render chart only if data exists and no chart-specific error */}
                     {canRenderChart && !chartError ? (
                         <div className="prashna-chart-wrapper">
                             <DiamondChart
                                 // Translate title with interpolation
                                 title={t('prashnaNumberPage.chartTitleFull', { num: inputDetails?.number || '' })}
                                 houses={houses}
                                 planets={planetaryPositions.sidereal}
                                 size={350} // Adjust size as needed
                             />
                         </div>
                     ) : (!isLoadingChart && !chartError && <p>{t('prashnaNumberPage.chartUnavailable')}</p>)}
                     {/* Dasha Table */}
                     {hasDashaData && !chartError ? (
                        <DashaTable dashaPeriods={prashnaResult.dashaPeriods} />
                     ) : (!isLoadingChart && !chartError && <p>{t('prashnaNumberPage.dashaUnavailable')}</p>)}
                     {/* Add other tables (Planets, Houses) similarly, checking prashnaResult */}
                 </div>
                 {/* Column 2: KP Significators */}
                 <div className="results-column">
                     {/* Translate title */}
                     <h3 className="result-sub-title">{t('prashnaNumberPage.kpTitle')}</h3>
                     {/* Translate loading/error messages */}
                     {isLoadingKp && <div className="loader small-loader">{t('prashnaNumberPage.kpLoading')}</div>}
                     {kpError && !isLoadingKp && <p className="error-text small-error">{t('prashnaNumberPage.kpErrorPrefix')}: {kpError}</p>}
                     {/* Render grid only if data exists and no KP-specific error */}
                     {hasValidKpDataForGrid && !kpError ? (
                         <KpSignificatorGrid significatorDetailsMap={significatorDetailsMap} selectedEvent={selectedEvent} />
                     ) : (!isLoadingKp && !kpError && <p>{t('prashnaNumberPage.kpUnavailable')}</p>)}
                 </div>
             </div>
         );
    };

    return (
        <div className="prashna-page">
            {/* Translate page title */}
            <h1>{t('prashnaNumberPage.pageTitle')}</h1>

            {/* --- Controls --- */}
            <div className="prashna-controls">
                 {/* Input Summary */}
                {inputDetails && (
                    <div className="result-section input-summary small-summary">
                        {/* Translate summary using interpolation */}
                        {t('prashnaNumberPage.inputSummary', {
                            num: inputDetails.number,
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
                    <label htmlFor="life-event-select">{t('prashnaNumberPage.analyzeEventLabel')} </label>
                    <select id="life-event-select" value={selectedEvent} onChange={(e) => setSelectedEvent(e.target.value)} disabled={isOverallLoading}>
                         {/* Use translated options */}
                         {translatedLifeEvents.map(event => (<option key={event.value} value={event.value}>{event.label}</option>))}
                    </select>
                </div>
                {/* Number Input */}
                <div className="form-row">
                    <div className="input-group">
                        {/* Translate label */}
                        <label htmlFor="prashna-number">{t('prashnaNumberPage.numberLabel')}</label>
                        <input
                            id="prashna-number"
                            type="number"
                            value={prashnaNumber}
                            onChange={(e) => setPrashnaNumber(e.target.value)}
                            min="1"
                            max="249"
                            required
                            // Translate placeholder
                            placeholder={t('prashnaNumberPage.numberPlaceholder')}
                            disabled={isOverallLoading}
                        />
                    </div>
                </div>
                {/* Location Inputs (for CURRENT location) */}
                {/* Translate section title */}
                <p><strong>{t('prashnaNumberPage.locationSectionTitle')}</strong></p>
                 <div className="form-row">
                    <div className="input-group place-group">
                        {/* Translate label */}
                        <label htmlFor="prashna-place">{t('prashnaNumberPage.placeLabel')}</label>
                        <input
                            id="prashna-place"
                            type="text"
                            value={currentPlaceName}
                            onChange={(e) => setCurrentPlaceName(e.target.value)}
                            // Translate placeholder
                            placeholder={t('prashnaNumberPage.placePlaceholder')}
                            disabled={isGeocoding || isLoadingLocation}
                        />
                    </div>
                     <div className="button-container find-coords-button">
                        {/* Translate button text */}
                        <button type="button" onClick={handleFindCoordinates} disabled={isGeocoding || isLoadingLocation || !currentPlaceName.trim() || currentPlaceName === t('prashnaNumberPage.currentLocationDefault', "Current Location")}>
                            {isGeocoding ? t('prashnaNumberPage.findingCoordsButton') : t('prashnaNumberPage.findCoordsButton')}
                        </button>
                    </div>
                </div>
                 <div className="form-row">
                    <div className="input-group full-width">
                        {/* Translate label */}
                        <label htmlFor="prashna-coords">{t('prashnaNumberPage.coordsLabel')}</label>
                        <input
                            id="prashna-coords"
                            type="text"
                            value={currentCoords}
                            onChange={(e) => setCurrentCoords(e.target.value)}
                            // Translate placeholder
                            placeholder={t('prashnaNumberPage.coordsPlaceholder')}
                            required
                            disabled={isLoadingLocation || isGeocoding}
                        />
                        {/* Display location loading/error */}
                        {/* Translate loading hint */}
                        {isLoadingLocation && <p className="hint-text loading-text small-hint">{t('prashnaNumberPage.fetchingLocationHint')}</p>}
                        {locationError && <p className="error-text small-error">{locationError}</p>}
                    </div>
                     <div className="input-group half-width"> {/* Adjust width as needed */}
                         {/* Translate button text */}
                         <button type="button" onClick={getCurrentLocation} disabled={isLoadingLocation || isGeocoding}>
                            {isLoadingLocation ? t('prashnaNumberPage.gettingLocationButton') : t('prashnaNumberPage.useCurrentLocationButton')}
                         </button>
                    </div>
                </div>
                {/* Calculate Button */}
                <div className="form-row action-buttons-row">
                    {/* Translate button text */}
                    <button type="button" onClick={handleCalculatePrashnaNumber} disabled={isOverallLoading || !prashnaNumber || !currentCoords} className="calculate-button">
                        {isLoadingChart || isLoadingKp ? t('prashnaNumberPage.calculatingButton') : t('prashnaNumberPage.calculateButton')}
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

export default PrashnaNumberPage;
