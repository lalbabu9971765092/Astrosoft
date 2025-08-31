// src/PrashnaNumberPage.jsx
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import axios from 'axios'; // Needed for geocoding
import { useTranslation } from 'react-i18next'; // Import the hook
import api from './api';
import DiamondChart from './DiamondChart';
// Import EVENT_HOUSES along with the default export
import KpSignificatorGrid, { EVENT_HOUSES } from './KpSignificatorGrid';
import DashaTable from './DashaTable'; // Import DashaTable
import {
    validateAndFormatDateTime,
    parseAndValidateCoords,
} from './AstrologyUtils';
import '../styles/PrashnaPage.css'; // Reuse styles

// --- Helper Functions ---
// ... (formatDisplayDateTime, getHouseNumbersFromString, calculatePlanetFavourability remain the same) ...
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

    // --- MODIFIED LOGIC: Determine Favourability string based on Score ---
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


// --- Constants ---
const SIGNIFICATOR_GRID_ORDER = [
    ['Ketu', 'Moon', 'Jupiter'],
    ['Venus', 'Mars', 'Saturn'],
    ['Sun', 'Rahu', 'Mercury']
];
const FLATTENED_GRID_ORDER = SIGNIFICATOR_GRID_ORDER.flat();

// *** MODIFIED: Generate keys dynamically from EVENT_HOUSES ***
const MAJOR_LIFE_EVENTS_KEYS = ['', ...Object.keys(EVENT_HOUSES).filter(key => key !== '')];
// Optional: Sort alphabetically
// const MAJOR_LIFE_EVENTS_KEYS = ['', ...Object.keys(EVENT_HOUSES).filter(key => key !== '').sort()];


const PrashnaNumberPage = () => {
    // ... (rest of the component remains the same) ...
    const { t } = useTranslation(); // Call the hook

    // --- State ---
    const [inputDetails, setInputDetails] = useState(null);
    const [prashnaNumber, setPrashnaNumber] = useState(''); // Input 1-249
    const [currentCoords, setCurrentCoords] = useState(''); // For calculation
    const [currentPlaceName, setCurrentPlaceName] = useState('');
    const [isLoadingLocation, setIsLoadingLocation] = useState(false);
    const [locationError, setLocationError] = useState(null);
    const [isGeocoding, setIsGeocoding] = useState(false);

    const [selectedEvent, setSelectedEvent] = useState(''); // State for selected event

    // State for Calculation Results
    const [isLoadingChart, setIsLoadingChart] = useState(false);
    const [chartError, setChartError] = useState(null);
    const [prashnaResult, setPrashnaResult] = useState(null); // From /calculate-prashna-number
    const [rotatedPrashnaResult, setRotatedPrashnaResult] = useState(null);

    const [isLoadingKp, setIsLoadingKp] = useState(false);
    const [kpError, setKpError] = useState(null);
    const [kpData, setKpData] = useState(null); // From /kp-significators (using current time)

    const [selectedHouse, setSelectedHouse] = useState(1); // Default to House 1

    const handleHouseChange = (event) => {
        setSelectedHouse(parseInt(event.target.value, 10));
    };

    // State for UI
    const [openSections, setOpenSections] = useState({
        inputBlock: true,
    });

    const toggleSection = (section) => {
        setOpenSections(prev => ({ ...prev, [section]: !prev[section] }));
    };

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
        setSelectedHouse(1);

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
        setInputDetails(payloadChart);

        try {
            const response = await api.post('/calculate-prashna-number', payloadChart);
            const { kpSignificators, planetHousePlacements, siderealCuspStartDegrees, ...restOfData } = response.data;
            setPrashnaResult({ ...restOfData, planetHousePlacements, siderealCuspStartDegrees }); // Store planetHousePlacements and siderealCuspStartDegrees with prashnaResult
            setKpData(kpSignificators);

        } catch (err) { // Catch errors unlikely with Promise.allSettled but good practice
            console.error("Overall Prashna Number Fetch Error:", err);
            const errorMsg = t('prashnaNumberPage.errorUnexpected');
            setChartError(errorMsg); setKpError(errorMsg);
            setPrashnaResult(null); setKpData(null);
        } finally {
            setIsLoadingChart(false); setIsLoadingKp(false);
        }
    }, [prashnaNumber, currentCoords, currentPlaceName, t]); // Add t dependency

    useEffect(() => {
        const fetchRotatedData = async () => {
            setIsLoadingChart(true);
            setChartError(null);
            try {
                let response;
                let payload;

                if (selectedHouse === 1) {
                    // If House 1 is selected, fetch the original (non-rotated) data
                    payload = { ...inputDetails };
                    response = await api.post('/calculate-prashna-number', payload);
                    setPrashnaResult(response.data); // Update the main result
                    setRotatedPrashnaResult(null); // Clear rotated result
                } else {
                    // Otherwise, fetch the rotated data
                    payload = {
                        ...inputDetails,
                        house_to_rotate: selectedHouse
                    };
                    response = await api.post('/calculate-prashna-number/rotated', payload);
                    setRotatedPrashnaResult(response.data); // Update rotated result
                    setPrashnaResult(null); // Clear main result
                }

                // Extract KP significators and other data from the response
                const { kpSignificators, planetHousePlacements, siderealCuspStartDegrees } = response.data;
                setKpData(kpSignificators); // Always update KP data from the response

            } catch (error) {
                console.error("Prashna Chart calculation error:", error);
                const errMsg = error.response?.data?.error || error.message || t('prashnaNumberPage.errorChartFetch');
                setChartError(errMsg);
                setPrashnaResult(null);
                setRotatedPrashnaResult(null);
                setKpData(null); // Clear KP data on error
            } finally {
                setIsLoadingChart(false);
            }
        };

        if (inputDetails) {
            fetchRotatedData();
        }
    }, [selectedHouse, inputDetails, t]);

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
                    occupiedHouses: planet.occupiedHouses || [],
                    ownedHouses: planet.ownedHouses || [],
                    signLordOwnedHouses: planet.signLordOwnedHouses || [],
                    aspectingOwnedHouses: planet.aspectingOwnedHouses || [],
                    nakshatraLordName: planet.nakshatraLordName || t('utils.notAvailable', 'N/A'),
                    nakshatraLordAllHouses: planet.nakLordAllHouses || [],
                    subLordName: planet.subLordName || t('utils.notAvailable', 'N/A'),
                    subLordAllHouses: planet.subLordAllHouses || [],
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

        // Helper function to get combined, unique, sorted houses for a planet from intermediate data
        const getCombinedHousesForPlanet = (planetName) => {
            const data = intermediatePlanetData.get(planetName);
            if (!data) return [];
            const allHouses = [
                ...(data.occupiedHouses || []),
                ...(data.ownedHouses || []),
                ...(data.signLordOwnedHouses || []),
                ...(data.aspectingOwnedHouses || [])
            ];
            // Ensure unique and sorted numbers
            return [...new Set(allHouses)].sort((a, b) => a - b);
        };

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

            const planetAllHouses = getCombinedHousesForPlanet(planetName);
            const nakLordAllHouses = planetData.nakshatraLordAllHouses || [];
            const subLordAllHouses = planetData.subLordAllHouses || [];

            // *** Calculate Favourability ***
            const combinedHousesForScoring = [...new Set([...planetAllHouses, ...nakLordAllHouses, ...subLordAllHouses])];
            const { score, favourability, completeness } = calculatePlanetFavourability(combinedHousesForScoring, selectedEvent, t);

            // Set the final data in the map
            finalMap.set(planetName, {
                name: planetName,
                allHouses: planetAllHouses,
                nakshatraLordName: planetData.nakshatraLordName,
                nakLordAllHouses: nakLordAllHouses,
                subLordName: planetData.subLordName,
                subLordAllHouses: subLordAllHouses,
                score: score,
                favourability: favourability,
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
        const chartResult = rotatedPrashnaResult || prashnaResult;

         if (isOverallLoading && !chartResult && !kpData && !overallError) return <div className="loader">{t('prashnaNumberPage.resultsLoading', 'Loading results...')}</div>;
         if (overallError && !chartResult && !kpData) return <p className="error-text">{overallError}</p>;

         const hasValidKpDataForGrid = significatorDetailsMap && significatorDetailsMap.size > 0;
         const hasDashaData = chartResult?.dashaPeriods && Array.isArray(chartResult.dashaPeriods) && chartResult.dashaPeriods.length > 0;

         if (!chartResult && !hasValidKpDataForGrid && !overallError) return <p className="info-text">{t('prashnaNumberPage.resultsInitialPrompt', 'Enter a Prashna number (1-249) and click Calculate.')}</p>;

         const { houses, planetaryPositions } = chartResult || {};
         const canRenderChart = houses && planetaryPositions?.sidereal;

       

         return (
             <div className="prashna-results-area">
                 {/* Row 1: Charts */}
                 <div className="charts-row">
                     <div className="chart-container">
                         <h3 className="result-sub-title">{t('prashnaNumberPage.chartTitle', { num: inputDetails?.number || 'N/A' })}</h3>
                         {isLoadingChart && <div className="loader small-loader">{t('prashnaNumberPage.chartLoading', 'Loading Chart...')}</div>}
                         {chartError && !isLoadingChart && <p className="error-text small-error">{t('prashnaNumberPage.chartErrorPrefix', 'Chart Error')}: {chartError}</p>}
                         {canRenderChart && !chartError ? (
                             <div className="prashna-chart-wrapper">
                                 <DiamondChart
                                     title={t('prashnaNumberPage.chartTitleFull', { num: inputDetails?.number || '' })}
                                     houses={houses}
                                     planets={planetaryPositions.sidereal}
                                     prashnaCusps={chartResult.siderealCuspStartDegrees}
                                     size={400}
                                     chartType="lagna"
                                 />
                             </div>
                         ) : (!isLoadingChart && !chartError && <p>{t('prashnaNumberPage.chartUnavailable', 'Chart data unavailable.')}</p>)}
                     </div>

                     {chartResult.planetHousePlacements && (
                         <div className="chart-container">
                             <h3 className="result-sub-title">{t('prashnaNumberPage.bhavaChalitChartTitle', 'Nirayan Bhava Chalit Chart')}</h3>
                             <div className="prashna-chart-wrapper bhava-chalit-chart">
                                 <DiamondChart
                                     title={t('prashnaNumberPage.bhavaChalitChartTitleFull', { num: inputDetails?.number || '' })}
                                     houses={houses}
                                     planetHousePlacements={chartResult.planetHousePlacements}
                                     prashnaCusps={chartResult.siderealCuspStartDegrees}
                                     size={400}
                                     chartType="bhava"
                                 />
                             </div>
                         </div>
                     )}
                 </div>

                 {/* Row 2: KP Significators and Dasha */}
                 <div className="kp-dasha-row">
                     <div className="kp-significators-column">
                         <h3 className="result-sub-title">{t('prashnaNumberPage.kpTitle', 'KP Significators (Current Time)')}</h3>
                         {isLoadingKp && <div className="loader small-loader">{t('prashnaNumberPage.kpLoading', 'Loading KP Data...')}</div>}
                         {kpError && !isLoadingKp && <p className="error-text small-error">{t('prashnaNumberPage.kpErrorPrefix', 'KP Error')}: {kpError}</p>}
                         {hasValidKpDataForGrid && !kpError ? (
                             <KpSignificatorGrid significatorDetailsMap={significatorDetailsMap} selectedEvent={selectedEvent} />
                         ) : (!isLoadingKp && !kpError && <p>{t('prashnaNumberPage.kpUnavailable', 'KP Significator data unavailable.')}</p>)}
                     </div>

                     <div className="dasha-column">
                         <h3 className="result-sub-title">{t('prashnaNumberPage.dashaTitle', 'Vimshottari Dasha Periods')}</h3>
                         {hasDashaData && !chartError ? (
                             <DashaTable dashaPeriods={chartResult.dashaPeriods} />
                         ) : (!isLoadingChart && !chartError && <p>{t('prashnaNumberPage.dashaUnavailable', 'Dasha data unavailable.')}</p>)}
                     </div>
                 </div>
             </div>
         );
    };

    return (
        <div className="prashna-page">
            <h1>{t('prashnaNumberPage.pageTitle', 'Prashna Number Analysis')}</h1>

            {/* --- Controls --- */}
            <div className="section-header" onClick={() => toggleSection('inputBlock')}>
                <h2 className="result-sub-title">{t('prashnaNumberPage.inputBlockTitle', 'Input Details')}</h2>
                <button className="toggle-button">{openSections.inputBlock ? '−' : '+'}</button>
            </div>
            {openSections.inputBlock && <div className="prashna-controls">
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
                <div className="house-selection-container">
                    <label htmlFor="house-select">Rotate from House:</label>
                    <select id="house-select" value={selectedHouse} onChange={handleHouseChange}>
                        {[...Array(12).keys()].map(i => (
                            <option key={i + 1} value={i + 1}>
                                House {i + 1}
                            </option>
                        ))}
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
}
            {/* --- Results --- */}
            <div className="prashna-results">
                {renderResults()}
            </div>
        </div>
    );
};

export default PrashnaNumberPage;
