// src/PrashnaNumberPage.jsx
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import axios from 'axios'; // Needed for geocoding
import { useTranslation } from 'react-i18next'; // Import the hook
import api from './api';
import DiamondChart from './DiamondChart';
import KpSignificatorGrid, { EVENT_HOUSES } from './KpSignificatorGrid'; // Import EVENT_HOUSES
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

// Helper function to return ARRAY of house numbers, sorted numerically
const getHouseNumbersFromString = (houseString) => {
    if (!houseString || typeof houseString !== 'string') return [];
    return houseString.split(',')
                      .map(numStr => parseInt(numStr.trim(), 10))
                      .filter(num => !isNaN(num)) // Ensure only valid numbers
                      .sort((a, b) => a - b); // Sort numerically
};

// --- Helper function for Favourability Calculation ---
// (Adapt this logic based on your specific scoring rules)
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
    let hasFavorable = false;
    let hasUnfavorable = false;

    // Ensure allHouses is an array before iterating
    if (!Array.isArray(allHouses)) {
        console.warn("calculatePlanetFavourability received non-array for allHouses:", allHouses);
        allHouses = []; // Treat as empty if invalid
    }

    allHouses.forEach(house => {
        if (favorable.includes(house)) {
            score += 1; // Simple scoring: +1 for favorable
            hasFavorable = true;
        } else if (unfavorable.includes(house)) {
            score -= 1; // Simple scoring: -1 for unfavorable
            hasUnfavorable = true;
        }
    });

    // Determine Favourability string based on presence of favorable/unfavorable houses
    let favourability = 'Neutral'; // Default if neither type of house is present
    if (hasFavorable && hasUnfavorable) {
        favourability = 'Mixed';
    } else if (hasFavorable) {
        favourability = 'Favorable';
    } else if (hasUnfavorable) {
        favourability = 'Unfavorable';
    }

    // Determine Completeness string based on score (example logic)
    let completeness = 'Weak'; // Default
    if (score >= 2) { // Example threshold for Strong
        completeness = 'Strong';
    } else if (score > 0) { // Example threshold for Moderate
        completeness = 'Moderate';
    } else if (score < 0) { // Example for Negative impact
        completeness = 'Negative'; // Or adjust as needed
    }

    // Note: You might want to translate the favourability/completeness strings
    // here using t() if they are intended to be displayed directly and vary by language.
    // Example: favourability = t(`favourability.${favourability}`, favourability);
    // However, the CSS classes in KpSignificatorGrid rely on the English strings.

    return { score, favourability, completeness };
};


// --- Constants ---
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
                    setCurrentPlaceName(t('prashnaNumberPage.currentLocationDefault', "Current Location"));
                    setIsLoadingLocation(false);
                },
                (geoError) => {
                    console.error("Error getting geolocation:", geoError);
                    setLocationError(t('prashnaNumberPage.errorGetLocation', { message: geoError.message }));
                    setIsLoadingLocation(false);
                },
                { enableHighAccuracy: false, timeout: 10000, maximumAge: 0 }
            );
        } else {
             setLocationError(t('prashnaNumberPage.errorGeolocationNotSupported'));
             setIsLoadingLocation(false);
        }
    }, [t]); // Add t dependency

    const handleFindCoordinates = useCallback(async () => {
        if (!currentPlaceName.trim() || currentPlaceName === t('prashnaNumberPage.currentLocationDefault', "Current Location")) {
             alert(t('prashnaNumberPage.alertEnterPlace')); return;
        }
        setIsGeocoding(true); setLocationError(null); setCurrentCoords('');
        try {
            // Consider using a more robust geocoding service or adding API keys if needed
            const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(currentPlaceName)}&format=json&limit=1&addressdetails=1`;
            const response = await axios.get(url, { headers: { 'User-Agent': 'AstrologyWebApp/1.0 (your-contact@example.com)' } }); // Replace with your contact
            if (response.data && response.data.length > 0) {
                const { lat, lon, display_name } = response.data[0];
                const latNum = parseFloat(lat); const lonNum = parseFloat(lon);
                if (!isNaN(latNum) && !isNaN(lonNum)) {
                    setCurrentCoords(`${latNum.toFixed(6)},${lonNum.toFixed(6)}`);
                    setCurrentPlaceName(display_name || currentPlaceName);
                } else { throw new Error(t('prashnaNumberPage.errorInvalidCoordsReceived')); } // Translate error
            } else {
                setLocationError(t('prashnaNumberPage.errorGeocodingNotFound', { place: currentPlaceName }));
            }
        } catch (err) {
            console.error('Geocoding error:', err);
            setLocationError(t('prashnaNumberPage.errorGeocodingFailed', { message: err.response?.data?.error || err.message || 'Request failed.' }));
        } finally { setIsGeocoding(false); }
    }, [currentPlaceName, t]); // Add t dependency

    // --- Effect for Initial Location ---
    useEffect(() => {
        getCurrentLocation();
    }, [getCurrentLocation]); // Run once on mount

    // --- Calculate Handler ---
    const handleCalculatePrashnaNumber = useCallback(async () => {
        setChartError(null); setKpError(null);
        setPrashnaResult(null); setKpData(null);
        setInputDetails(null);

        const num = parseInt(prashnaNumber, 10);
        if (isNaN(num) || num < 1 || num > 249) {
            const errorMsg = t('prashnaNumberPage.errorInvalidNumber');
            setChartError(errorMsg); setKpError(errorMsg);
            return;
        }
        const coordsValidation = parseAndValidateCoords(currentCoords, t);
        if (!coordsValidation.isValid) {
            setChartError(coordsValidation.error); setKpError(coordsValidation.error);
            return;
        }

        setIsLoadingChart(true); setIsLoadingKp(true);

        const now = new Date();
        const localNow = new Date(now.getTime() - now.getTimezoneOffset() * 60000);
        const currentDateTimeStr = localNow.toISOString().slice(0, 19);
        const dateTimeValidation = validateAndFormatDateTime(currentDateTimeStr, t);
        if (!dateTimeValidation.isValid) {
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
            date: dateTimeValidation.formattedDate
        };
        const payloadKp = {
            date: dateTimeValidation.formattedDate,
            latitude: coordsValidation.latitude,
            longitude: coordsValidation.longitude,
            placeName: currentPlaceName
        };
        setInputDetails(payloadChart);

        try {
            // Use Promise.allSettled for better error handling of individual requests
            const results = await Promise.allSettled([
                api.post('/calculate-prashna-number', payloadChart),
                api.post('/kp-significators', payloadKp)
            ]);

            const chartResult = results[0];
            const kpResult = results[1];

            // Process Chart Response
            if (chartResult.status === 'fulfilled') {
                setPrashnaResult(chartResult.value.data);
            } else {
                console.error("Prashna Number Chart Fetch Error:", chartResult.reason);
                const error = chartResult.reason;
                setChartError(error.response?.data?.error || error.message || t('prashnaNumberPage.errorChartFetch'));
                setPrashnaResult(null);
            }

            // Process KP Response
            if (kpResult.status === 'fulfilled') {
                // Ensure the data structure is as expected
                const significators = kpResult.value.data?.kpSignificatorsData;
                setKpData(Array.isArray(significators) ? significators : null);
                if (!Array.isArray(significators)) {
                     console.warn("KP Significators data received is not an array:", kpResult.value.data);
                     setKpError(t('prashnaNumberPage.errorKpInvalidData')); // Add specific error message
                }
            } else {
                console.error("Prashna Number KP Fetch Error:", kpResult.reason);
                const error = kpResult.reason;
                setKpError(error.response?.data?.error || error.message || t('prashnaNumberPage.errorKpFetch'));
                setKpData(null);
            }

        } catch (err) { // Catch errors unlikely with Promise.allSettled but good practice
            console.error("Overall Prashna Number Fetch Error:", err);
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

        // --- Step 1: Create Intermediate Map with Raw Data ---
        const intermediatePlanetData = new Map();
        const planetOrderSource = kpData.map(p => p.name);
        // Ensure all planets in the grid order are considered, even if not in kpData
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
                 // Add placeholder for planets in grid but missing from data
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

            // Default object if planetData is missing entirely (shouldn't happen with above logic)
            if (!planetData) {
                finalMap.set(planetName, {
                    name: planetName, allHouses: [], nakshatraLordName: t('utils.notAvailable', 'N/A'), nakLordAllHouses: [],
                    subLordName: t('utils.notAvailable', 'N/A'), subLordAllHouses: [],
                    score: 0, favourability: 'N/A', completeness: 'N/A' // Add defaults
                });
                return; // Skip to next planet
            }

            // Get lord data from the intermediate map
            const nakLordData = intermediatePlanetData.get(planetData.nakshatraLordName);
            const subLordData = intermediatePlanetData.get(planetData.subLordName);

            // Calculate combined houses for the planet and its lords (raw lists)
            const planetHousesRaw = [...planetData.occupiedHouses, ...planetData.ownedHouses, ...planetData.signLordOwnedHouses, ...planetData.aspectingOwnedHouses];
            const nakLordHousesRaw = nakLordData ? [...nakLordData.occupiedHouses, ...nakLordData.ownedHouses, ...nakLordData.signLordOwnedHouses, ...nakLordData.aspectingOwnedHouses] : [];
            const subLordHousesRaw = subLordData ? [...subLordData.occupiedHouses, ...subLordData.ownedHouses, ...subLordData.signLordOwnedHouses, ...subLordData.aspectingOwnedHouses] : [];

            // Get unique, sorted lists for display
            const planetAllHousesDisplay = [...new Set(planetHousesRaw)].sort((a, b) => a - b);
            const nakLordAllHousesDisplay = [...new Set(nakLordHousesRaw)].sort((a, b) => a - b);
            const subLordAllHousesDisplay = [...new Set(subLordHousesRaw)].sort((a, b) => a - b);

            // *** Calculate Favourability ***
            // Combine all houses (planet + NL + SL) into a single unique set for scoring
            const combinedHousesForScoring = [...new Set([...planetHousesRaw, ...nakLordHousesRaw, ...subLordHousesRaw])];
            // Call the calculation function
            const { score, favourability, completeness } = calculatePlanetFavourability(combinedHousesForScoring, selectedEvent, t);

            // Set the final data in the map, including favourability info
            finalMap.set(planetName, {
                name: planetName,
                allHouses: planetAllHousesDisplay, // Use the sorted unique list for display
                nakshatraLordName: planetData.nakshatraLordName,
                nakLordAllHouses: nakLordAllHousesDisplay, // Use the sorted unique list for display
                subLordName: planetData.subLordName,
                subLordAllHouses: subLordAllHousesDisplay, // Use the sorted unique list for display
                // Add the calculated values
                score: score,
                favourability: favourability, // This will be used by KpSignificatorGrid for styling
                completeness: completeness,
            });
        });
        return finalMap;
        // *** Update Dependency Array ***
    }, [kpData, selectedEvent, t]); // Add selectedEvent and t

    // --- Loading / Error States ---
    const isOverallLoading = isLoadingChart || isLoadingKp || isLoadingLocation || isGeocoding;
    // Combine specific errors, prioritizing calculation errors
    const overallError = chartError || kpError || locationError;

    // --- Generate translated event options ---
    const translatedLifeEvents = useMemo(() => {
        return MAJOR_LIFE_EVENTS_KEYS.map(eventKey => ({
            value: eventKey,
            label: eventKey ? t(`lifeEvents.${eventKey}`, eventKey) : t('prashnaNumberPage.selectEventOption', '-- Select Event --')
        }));
    }, [t]); // Dependency is t

    // --- Render Results ---
    const renderResults = () => {
         if (isOverallLoading && !prashnaResult && !kpData && !overallError) return <div className="loader">{t('prashnaNumberPage.resultsLoading', 'Loading results...')}</div>;
         if (overallError && !prashnaResult && !kpData) return <p className="error-text">{overallError}</p>;

         const hasValidKpDataForGrid = significatorDetailsMap && significatorDetailsMap.size > 0;
         const hasDashaData = prashnaResult?.dashaPeriods && Array.isArray(prashnaResult.dashaPeriods) && prashnaResult.dashaPeriods.length > 0;

         if (!prashnaResult && !hasValidKpDataForGrid && !overallError) return <p className="info-text">{t('prashnaNumberPage.resultsInitialPrompt', 'Enter a Prashna number (1-249) and click Calculate.')}</p>;

         const { houses, planetaryPositions } = prashnaResult || {};
         const canRenderChart = houses && planetaryPositions?.sidereal;

         return (
             <div className="prashna-results-area two-column-layout">
                 {/* Column 1: Chart & Tables */}
                 <div className="results-column">
                     <h3 className="result-sub-title">{t('prashnaNumberPage.chartTitle', { num: inputDetails?.number || 'N/A' })}</h3>
                     {isLoadingChart && <div className="loader small-loader">{t('prashnaNumberPage.chartLoading', 'Loading Chart...')}</div>}
                     {chartError && !isLoadingChart && <p className="error-text small-error">{t('prashnaNumberPage.chartErrorPrefix', 'Chart Error')}: {chartError}</p>}
                     {canRenderChart && !chartError ? (
                         <div className="prashna-chart-wrapper">
                             <DiamondChart
                                 title={t('prashnaNumberPage.chartTitleFull', { num: inputDetails?.number || '' })}
                                 houses={houses}
                                 planets={planetaryPositions.sidereal}
                                 size={350}
                             />
                         </div>
                     ) : (!isLoadingChart && !chartError && <p>{t('prashnaNumberPage.chartUnavailable', 'Chart data unavailable.')}</p>)}
                     {/* Dasha Table */}
                     {hasDashaData && !chartError ? (
                        <DashaTable dashaPeriods={prashnaResult.dashaPeriods} />
                     ) : (!isLoadingChart && !chartError && <p>{t('prashnaNumberPage.dashaUnavailable', 'Dasha data unavailable.')}</p>)}
                     {/* Add other tables (Planets, Houses) similarly */}
                 </div>
                 {/* Column 2: KP Significators */}
                 <div className="results-column">
                     <h3 className="result-sub-title">{t('prashnaNumberPage.kpTitle', 'KP Significators (Current Time)')}</h3>
                     {isLoadingKp && <div className="loader small-loader">{t('prashnaNumberPage.kpLoading', 'Loading KP Data...')}</div>}
                     {kpError && !isLoadingKp && <p className="error-text small-error">{t('prashnaNumberPage.kpErrorPrefix', 'KP Error')}: {kpError}</p>}
                     {hasValidKpDataForGrid && !kpError ? (
                         <KpSignificatorGrid significatorDetailsMap={significatorDetailsMap} selectedEvent={selectedEvent} />
                     ) : (!isLoadingKp && !kpError && <p>{t('prashnaNumberPage.kpUnavailable', 'KP Significator data unavailable.')}</p>)}
                 </div>
             </div>
         );
    };

    return (
        <div className="prashna-page">
            <h1>{t('prashnaNumberPage.pageTitle', 'Prashna Number Analysis')}</h1>

            {/* --- Controls --- */}
            <div className="prashna-controls">
                {inputDetails && (
                    <div className="result-section input-summary small-summary">
                        {t('prashnaNumberPage.inputSummary', {
                            num: inputDetails.number,
                            dateTime: formatDisplayDateTime(inputDetails.date, t),
                            place: inputDetails.placeName || t('utils.notAvailable', 'N/A'),
                            lat: inputDetails.latitude?.toFixed(4),
                            lon: inputDetails.longitude?.toFixed(4)
                        })}
                    </div>
                )}
                 <div className="result-section life-event-selector small-selector">
                    <label htmlFor="life-event-select">{t('prashnaNumberPage.analyzeEventLabel', 'Analyze for Event:')} </label>
                    <select id="life-event-select" value={selectedEvent} onChange={(e) => setSelectedEvent(e.target.value)} disabled={isOverallLoading}>
                         {translatedLifeEvents.map(event => (<option key={event.value} value={event.value}>{event.label}</option>))}
                    </select>
                </div>
                <div className="form-row">
                    <div className="input-group">
                        <label htmlFor="prashna-number">{t('prashnaNumberPage.numberLabel', 'Prashna Number (1-249):')}</label>
                        <input
                            id="prashna-number"
                            type="number"
                            value={prashnaNumber}
                            onChange={(e) => setPrashnaNumber(e.target.value)}
                            min="1"
                            max="249"
                            required
                            placeholder={t('prashnaNumberPage.numberPlaceholder', 'Enter 1-249')}
                            disabled={isOverallLoading}
                        />
                    </div>
                </div>
                <p><strong>{t('prashnaNumberPage.locationSectionTitle', 'Current Location (for Calculation Time)')}</strong></p>
                 <div className="form-row">
                    <div className="input-group place-group">
                        <label htmlFor="prashna-place">{t('prashnaNumberPage.placeLabel', 'Place Name:')}</label>
                        <input
                            id="prashna-place"
                            type="text"
                            value={currentPlaceName}
                            onChange={(e) => setCurrentPlaceName(e.target.value)}
                            placeholder={t('prashnaNumberPage.placePlaceholder', 'e.g., London, UK')}
                            disabled={isGeocoding || isLoadingLocation}
                        />
                    </div>
                     <div className="button-container find-coords-button">
                        <button type="button" onClick={handleFindCoordinates} disabled={isGeocoding || isLoadingLocation || !currentPlaceName.trim() || currentPlaceName === t('prashnaNumberPage.currentLocationDefault', "Current Location")}>
                            {isGeocoding ? t('prashnaNumberPage.findingCoordsButton', 'Finding...') : t('prashnaNumberPage.findCoordsButton', 'Find Coords')}
                        </button>
                    </div>
                </div>
                 <div className="form-row">
                    <div className="input-group full-width">
                        <label htmlFor="prashna-coords">{t('prashnaNumberPage.coordsLabel', 'Coordinates (Lat, Lon):')}</label>
                        <input
                            id="prashna-coords"
                            type="text"
                            value={currentCoords}
                            onChange={(e) => setCurrentCoords(e.target.value)}
                            placeholder={t('prashnaNumberPage.coordsPlaceholder', 'e.g., 51.5074, -0.1278')}
                            required
                            disabled={isLoadingLocation || isGeocoding}
                        />
                        {isLoadingLocation && <p className="hint-text loading-text small-hint">{t('prashnaNumberPage.fetchingLocationHint', 'Fetching location...')}</p>}
                        {locationError && <p className="error-text small-error">{locationError}</p>}
                    </div>
                     <div className="input-group half-width">
                         <button type="button" onClick={getCurrentLocation} disabled={isLoadingLocation || isGeocoding}>
                            {isLoadingLocation ? t('prashnaNumberPage.gettingLocationButton', 'Getting...') : t('prashnaNumberPage.useCurrentLocationButton', 'Use Current')}
                         </button>
                    </div>
                </div>
                <div className="form-row action-buttons-row">
                    <button type="button" onClick={handleCalculatePrashnaNumber} disabled={isOverallLoading || !prashnaNumber || !currentCoords} className="calculate-button">
                        {isLoadingChart || isLoadingKp ? t('prashnaNumberPage.calculatingButton', 'Calculating...') : t('prashnaNumberPage.calculateButton', 'Calculate Prashna Chart')}
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
