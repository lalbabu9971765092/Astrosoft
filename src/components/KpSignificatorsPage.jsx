// src/KpSignificatorsPage.jsx
import React, { useState, useMemo, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import '../styles/KpSignificatorsPage.css';
import { validateAndFormatDateTime } from './AstrologyUtils';
import api from './api';
import KpSignificatorGrid from './KpSignificatorGrid';
import DashaTable from './DashaTable';

// --- Helper Functions ---
const formatDateTime = (dateTimeString, t) => {
  if (!dateTimeString) return t ? t('utils.notAvailable', 'N/A') : 'N/A';
  try {
    const date = new Date(dateTimeString);
    if (isNaN(date.getTime())) return t ? t('utils.invalidDate', 'Invalid Date') : 'Invalid Date';
    // Using en-CA for YYYY-MM-DD format, adjust locale if needed
    return date.toLocaleDateString('en-CA', { year: 'numeric', month: '2-digit', day: '2-digit' }) + ' ' +
           date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false }); // 24-hour format
  } catch (e) {
    console.error("Error formatting date:", e);
    return dateTimeString; // Return original string on error
  }
};

const getHouseNumbersFromString = (houseString) => {
    if (!houseString || typeof houseString !== 'string') return [];
    return houseString.split(',')
                      .map(numStr => parseInt(numStr.trim(), 10))
                      .filter(num => !isNaN(num)) // Ensure only valid numbers
                      .sort((a, b) => a - b); // Sort numerically
};

// --- Constants ---
const SIGNIFICATOR_GRID_ORDER = [
    ['Ketu', 'Moon', 'Jupiter'],
    ['Venus', 'Mars', 'Saturn'],
    ['Sun', 'Rahu', 'Mercury']
];
const FLATTENED_GRID_ORDER = SIGNIFICATOR_GRID_ORDER.flat();

const MAJOR_LIFE_EVENTS_KEYS = [
    '', 'education', 'career_start', 'career_promotion', 'marriage',
    'childbirth', 'property_purchase', 'vehicle_purchase', 'foreign_travel', 'health_issues'
];

// --- Main Page Component ---
const KpSignificatorsPage = () => {
    const { t } = useTranslation();
    const {
        isLoading: isInitialLoading,
        error: initialError,
        calculationInputParams,
        adjustedBirthDateTimeString
    } = useOutletContext();

    // --- Local state ---
    const [kpData, setKpData] = useState(null); // Holds KP significator array
    const [isLoadingKp, setIsLoadingKp] = useState(false);
    const [kpError, setKpError] = useState(null);
    const [chartData, setChartData] = useState(null); // Holds Dasha array extracted from chart response
    const [isLoadingChart, setIsLoadingChart] = useState(false);
    const [chartError, setChartError] = useState(null);
    const [currentApiParams, setCurrentApiParams] = useState(null);
    const [selectedEvent, setSelectedEvent] = useState('');

    // --- Generate translated event options ---
    const translatedLifeEvents = useMemo(() => {
        return MAJOR_LIFE_EVENTS_KEYS.map(eventKey => ({
            value: eventKey,
            label: eventKey ? t(`lifeEvents.${eventKey}`, eventKey) : t('kpSignificatorsPage.selectEventOption', '-- Select Event --')
        }));
    }, [t]);

    // --- useEffect to fetch data ---
    useEffect(() => {
        const shouldUseAdjusted = adjustedBirthDateTimeString &&
                                  calculationInputParams?.date &&
                                  adjustedBirthDateTimeString !== calculationInputParams.date;
        const dateToUse = shouldUseAdjusted ? adjustedBirthDateTimeString : calculationInputParams?.date;
        const latToUse = calculationInputParams?.latitude;
        const lonToUse = calculationInputParams?.longitude;
        const placeNameToUse = calculationInputParams?.placeName;

        // Clear previous data and errors if inputs are missing
        if (!dateToUse || latToUse === undefined || lonToUse === undefined) {
            setKpData(null); setChartData(null); setCurrentApiParams(null);
            setKpError(null); setChartError(null);
            setIsLoadingKp(false); setIsLoadingChart(false);
            return;
        }

        // Validate the date format before making API calls
        const dateTimeValidation = validateAndFormatDateTime(dateToUse, t);
         if (!dateTimeValidation.isValid) {
             const errorMsg = t('kpSignificatorsPage.invalidDateFormatError', { error: dateTimeValidation.error });
             setKpError(errorMsg); setChartError(errorMsg); setKpData(null); setChartData(null);
             setCurrentApiParams(null); setIsLoadingKp(false); setIsLoadingChart(false);
             return;
         }
        const formattedDateForApi = dateTimeValidation.formattedDate;

        // Set loading states and clear errors
        setIsLoadingKp(true); setIsLoadingChart(true); setKpError(null); setChartError(null);
        const paramsForFetch = { date: formattedDateForApi, latitude: latToUse, longitude: lonToUse, placeName: placeNameToUse };
        setCurrentApiParams(paramsForFetch);

        const fetchAllData = async () => {
            try {
                const [kpResponse, chartResponse] = await Promise.all([
                    api.post('/kp-significators', paramsForFetch).catch(err => ({ error: err })),
                    api.post('/calculate', paramsForFetch).catch(err => ({ error: err })) // Fetches the object containing Dasha data
                ]);

                // Process KP Response
                if (kpResponse.error) {
                    const kpErrMsg = kpResponse.error.response?.data?.error || kpResponse.error.message || t('kpSignificatorsPage.kpFetchFailed', 'KP Fetch Failed');
                    console.error("KP Fetch Error:", kpResponse.error);
                    setKpError(kpErrMsg);
                    setKpData(null);
                } else {
                    // Assuming KP data is nested under kpSignificatorsData
                    setKpData(Array.isArray(kpResponse.data?.kpSignificatorsData) ? kpResponse.data.kpSignificatorsData : null);
                }

                // Process Chart Response (for Dashas)
                if (chartResponse.error) {
                    const chartErrMsg = chartResponse.error.response?.data?.error || chartResponse.error.message || t('kpSignificatorsPage.chartFetchFailed', 'Chart Fetch Failed');
                    console.error("Chart Fetch Error (for Dashas):", chartResponse.error);
                    setChartError(chartErrMsg);
                    setChartData(null); // Clear chartData on error
                } else {
                    // *** CORRECTED: Extract dashaPeriods array from the response object ***
                    const dashaDataFromApi = chartResponse.data?.dashaPeriods;

                    // Check if dashaDataFromApi is actually an array before setting state
                    if (Array.isArray(dashaDataFromApi)) {
                        setChartData(dashaDataFromApi); // Set chartData to the extracted array
                    } else {
                        console.warn("fetchAllData: 'dashaPeriods' key not found or not an array in chart response. Setting chartData to null.");
                        setChartData(null); // Set to null if the expected key/structure isn't found
                    }
                }
            } catch (err) {
                const errorMsg = t('kpSignificatorsPage.unexpectedFetchError');
                console.error("Overall Fetch Error:", err);
                setKpError(errorMsg); setChartError(errorMsg);
                setKpData(null); setChartData(null); // Clear data on overall error
            } finally {
                setIsLoadingKp(false); setIsLoadingChart(false);
            }
        };

        // Debounce the fetch slightly
        const timerId = setTimeout(fetchAllData, 300);
        return () => clearTimeout(timerId); // Cleanup timeout

    }, [calculationInputParams, adjustedBirthDateTimeString, t]); // Dependencies


    // --- Calculate Significator Details Map ---
    const significatorDetailsMap = useMemo(() => {
        const finalMap = new Map();
        if (!kpData || !Array.isArray(kpData) || kpData.length === 0) {
            return finalMap; // Return empty map if kpData is invalid
        }

        // Build intermediate map for efficient lookups
        const intermediatePlanetData = new Map();
        const planetOrderSource = kpData.map(p => p.name);
        // Ensure all planets needed for the grid AND present in the data are processed
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
                 // Add default entry if a grid planet is missing from API data
                 intermediatePlanetData.set(planetName, {
                    name: planetName, occupiedHouses: [], ownedHouses: [], signLordOwnedHouses: [],
                    aspectingOwnedHouses: [], nakshatraLordName: 'N/A', subLordName: 'N/A',
                });
            }
        });

        // Build the final map using the intermediate map
        FLATTENED_GRID_ORDER.forEach(planetName => {
            const planetData = intermediatePlanetData.get(planetName);
            if (!planetData) {
                // Should ideally not happen due to the check above, but good failsafe
                console.warn(`Data missing for grid planet ${planetName} in intermediate map!`);
                finalMap.set(planetName, { name: planetName, allHouses: [], nakshatraLordName: 'N/A', nakLordAllHouses: [], subLordName: 'N/A', subLordAllHouses: [] });
                return;
            }

            const nakLordData = intermediatePlanetData.get(planetData.nakshatraLordName);
            const subLordData = intermediatePlanetData.get(planetData.subLordName);

            // Combine houses from planet, its nakshatra lord, and sub lord
            const nakLordHouses = nakLordData ? [...nakLordData.occupiedHouses, ...nakLordData.ownedHouses, ...nakLordData.signLordOwnedHouses, ...nakLordData.aspectingOwnedHouses] : [];
            const subLordHouses = subLordData ? [...subLordData.occupiedHouses, ...subLordData.ownedHouses, ...subLordData.signLordOwnedHouses, ...subLordData.aspectingOwnedHouses] : [];

            // Get unique, sorted house numbers
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


    // --- Loading / Error / No Data States ---
    const isOverallLoading = isInitialLoading || isLoadingKp || isLoadingChart;
    const hasValidKpData = useMemo(() => significatorDetailsMap.size > 0, [significatorDetailsMap]);

    // Check if chartData (which should hold the Dasha array) is valid
    const hasDashaData = chartData && Array.isArray(chartData) && chartData.length > 0;

    const displayInputDetails = currentApiParams;

    // --- Initial state checks (EARLY RETURNS) ---
    if (isInitialLoading && !calculationInputParams) return null; // Still loading initial context
    if (initialError && !calculationInputParams) {
        return (
            <div className="kp-significators-page result-container">
                <p className="error-text">{t('kpSignificatorsPage.initialCalcFailedError', { error: initialError })}</p>
            </div>
        );
    }
    // No calculation performed yet
    if (!calculationInputParams) {
        return (
            <div className="kp-significators-page result-container">
                <p>{t('kpSignificatorsPage.calculateFirstPrompt')}</p>
            </div>
        );
    }

    // --- Handler for select change ---
    const handleEventChange = (event) => {
        setSelectedEvent(event.target.value);
    };


    // --- Component Return ---
    return (
        <div className="kp-significators-page">
            <div className="result-container">
                <h2 className="result-title">{t('kpSignificatorsPage.pageTitle')}</h2>

                {/* --- Top Info Container --- */}
                <div className="top-info-container">
                    {/* Display Input Summary */}
                    {displayInputDetails && (
                        <div className="result-section input-summary small-summary">
                            {t('kpSignificatorsPage.calculatedForLabel')} {t('kpSignificatorsPage.dateAtPlaceLabel', {
                                date: formatDateTime(displayInputDetails.date, t), // Pass t for translation fallbacks
                                place: displayInputDetails.placeName || t('utils.notAvailable', 'N/A')
                            })} ({displayInputDetails.latitude?.toFixed(4)}, {displayInputDetails.longitude?.toFixed(4)})
                        </div>
                    )}
                    {/* Event Selector */}
                     <div className="result-section life-event-selector small-selector">
                        <label htmlFor="life-event-select">{t('kpSignificatorsPage.analyzeEventLabel')} </label>
                        <select id="life-event-select" value={selectedEvent} onChange={handleEventChange} disabled={isOverallLoading}>
                             {translatedLifeEvents.map(event => (<option key={event.value} value={event.value}>{event.label}</option>))}
                        </select>
                    </div>
                </div>

                {/* Display Combined loading/error states */}
                {isOverallLoading && <div className="loader">{t('kpSignificatorsPage.loadingData')}</div>}
                {!isOverallLoading && (kpError || chartError) && (
                    <p className="error-text">
                        {kpError && `${t('kpSignificatorsPage.kpErrorPrefix')}: ${kpError}`}
                        {kpError && chartError && " | "}
                        {chartError && `${t('kpSignificatorsPage.dashaErrorPrefix')}: ${chartError}`}
                    </p>
                )}

                {/* Only render layout if not loading and no initial error */}
                {!isOverallLoading && !initialError && (
                    <div className="kp-layout-container">
                        {/* --- Significators Grid Column --- */}
                        <div className="kp-significators-grid-column">
                            <h3 className="result-sub-title">{t('kpSignificatorsPage.significatorsSubTitle')}</h3>
                            {/* Show grid if data is valid, otherwise show unavailable message */}
                            {hasValidKpData ? (
                                <KpSignificatorGrid
                                    significatorDetailsMap={significatorDetailsMap}
                                    selectedEvent={selectedEvent}
                                />
                            ) : (
                                !kpError && <p>{t('kpSignificatorsPage.kpDataUnavailable')}</p> // Don't show if kpError is already displayed
                            )}
                        </div>

                        {/* --- Dasha Column --- */}
                        <div className="kp-dasha-column">
                            <h3 className="result-sub-title">{t('kpSignificatorsPage.dashaSubTitle')}</h3>
                            {/* Show table if data is valid, otherwise show unavailable message */}
                            {hasDashaData ? (
                                // Pass the chartData array directly to the DashaTable
                                <DashaTable dashaPeriods={chartData} />
                            ) : (
                                !chartError && <p>{t('kpSignificatorsPage.dashaDataUnavailable')}</p> // Don't show if chartError is already displayed
                            )}
                        </div>
                    </div>
                )}
            </div> {/* End result-container */}
        </div> // End kp-significators-page
    );
};

export default KpSignificatorsPage;
