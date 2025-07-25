// src/KpSignificatorsPage.jsx
import React, { useState, useMemo, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import '../styles/KpSignificatorsPage.css';
import { validateAndFormatDateTime } from './AstrologyUtils';
import api from './api';
// Import the Grid component AND the named export EVENT_HOUSES
import KpSignificatorGrid, { EVENT_HOUSES } from './KpSignificatorGrid';
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

// --- Constants ---
const SIGNIFICATOR_GRID_ORDER = [
    ['Ketu', 'Moon', 'Jupiter'],
    ['Venus', 'Mars', 'Saturn'],
    ['Sun', 'Rahu', 'Mercury']
];
const FLATTENED_GRID_ORDER = SIGNIFICATOR_GRID_ORDER.flat();

// *** MODIFIED: Generate keys dynamically from EVENT_HOUSES ***
// Start with the empty string for the default option, then add all keys from EVENT_HOUSES,
// filtering out the empty string if it was already included (though Object.keys won't include it here).
const MAJOR_LIFE_EVENTS_KEYS = ['', ...Object.keys(EVENT_HOUSES).filter(key => key !== '')];
// Optional: Sort alphabetically if desired
// const MAJOR_LIFE_EVENTS_KEYS = ['', ...Object.keys(EVENT_HOUSES).filter(key => key !== '').sort()];


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
    // This useMemo hook remains the same, it will now use the dynamically generated keys
    const translatedLifeEvents = useMemo(() => {
        return MAJOR_LIFE_EVENTS_KEYS.map(eventKey => ({
            value: eventKey,
            label: eventKey ? t(`lifeEvents.${eventKey}`, eventKey) : t('kpSignificatorsPage.selectEventOption', '-- Select Event --')
        }));
    }, [t]);
// --- Calculate Favorable/Unfavorable Houses for Selected Event ---
const { favorableHouses, unfavorableHouses } = useMemo(() => {
    if (!selectedEvent || !EVENT_HOUSES[selectedEvent]) {
        return { favorableHouses: [], unfavorableHouses: [] };
    }
    const eventConfig = EVENT_HOUSES[selectedEvent];
    return {
        favorableHouses: [...new Set(eventConfig.favorable)].sort((a, b) => a - b), // Ensure unique & sorted
        unfavorableHouses: [...new Set(eventConfig.unfavorable)].sort((a, b) => a - b), // Ensure unique & sorted
    };
}, [selectedEvent]);
    // --- useEffect to fetch data ---
    useEffect(() => {
        console.log("useEffect triggered. adjustedBirthDateTimeString:", adjustedBirthDateTimeString, "calculationInputParams:", calculationInputParams);
        const shouldUseAdjusted = adjustedBirthDateTimeString &&
                                  calculationInputParams?.date &&
                                  adjustedBirthDateTimeString !== calculationInputParams.date;
        const dateToUse = shouldUseAdjusted ? adjustedBirthDateTimeString : calculationInputParams?.date;
        const latToUse = calculationInputParams?.latitude;
        const lonToUse = calculationInputParams?.longitude;
        const placeNameToUse = calculationInputParams?.placeName;
        console.log("Date being used for calculation:", dateToUse);

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
                    // Extract dashaPeriods array from the response object
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


    // --- Calculate Significator Details Map (MODIFIED TO INCLUDE SCORING & LOGGING) ---
    const significatorDetailsMap = useMemo(() => {
        const finalMap = new Map();
        if (!kpData || !Array.isArray(kpData) || kpData.length === 0) {
            return finalMap;
        }

        // *** Use the pre-calculated sets from the useMemo hook above ***
        // Convert arrays back to Sets for efficient lookup inside this calculation
        const favorableSet = new Set(favorableHouses);
        const unfavorableSet = new Set(unfavorableHouses);

        // Build intermediate map for efficient lookups (stores raw strings first)
        const intermediatePlanetData = new Map();
        const planetOrderSource = kpData.map(p => p.name);
        const allRelevantPlanetNames = [...new Set([...FLATTENED_GRID_ORDER, ...planetOrderSource])];

        allRelevantPlanetNames.forEach(planetName => {
            const planet = kpData.find(p => p.name === planetName);
            if (planet) {
                intermediatePlanetData.set(planetName, {
                    name: planetName,
                    occupiedHousesStr: planet.occupiedHouses,
                    ownedHousesStr: planet.ownedHouses,
                    signLordOwnedHousesStr: planet.signLordOwnedHouses,
                    aspectingOwnedHousesStr: planet.aspectingOwnedHouses,
                    nakshatraLordName: planet.nakshatraLord?.name || 'N/A',
                    subLordName: planet.subLord?.name || 'N/A',
                });
            } else if (FLATTENED_GRID_ORDER.includes(planetName)) {
                 intermediatePlanetData.set(planetName, {
                    name: planetName, occupiedHousesStr: '', ownedHousesStr: '', signLordOwnedHousesStr: '',
                    aspectingOwnedHousesStr: '', nakshatraLordName: 'N/A', subLordName: 'N/A',
                });
            }
        });

        // Helper function to get combined, unique, sorted houses for a planet from intermediate data
        const getCombinedHousesForPlanet = (planetName) => {
            const data = intermediatePlanetData.get(planetName);
            if (!data) return [];
            const allHousesStr = [
                data.occupiedHousesStr,
                data.ownedHousesStr,
                data.signLordOwnedHousesStr,
                data.aspectingOwnedHousesStr
            ].join(','); // Combine all house strings
            // Parse, filter NaN, sort unique numbers
            return [...new Set(
                        allHousesStr.split(',')
                                    .map(numStr => parseInt(numStr.trim(), 10))
                                    .filter(num => !isNaN(num))
                    )].sort((a, b) => a - b);
        };

        // Build the final map including scores
        FLATTENED_GRID_ORDER.forEach(planetName => {
            const planetData = intermediatePlanetData.get(planetName);
            if (!planetData) {
                console.warn(`Data missing for grid planet ${planetName} in intermediate map!`);
                finalMap.set(planetName, { name: planetName, allHouses: [], nakshatraLordName: 'N/A', nakLordAllHouses: [], subLordName: 'N/A', subLordAllHouses: [], score: 0, favourability: 'N/A', completeness: 'N/A' });
                return;
            }

            const nakLordName = planetData.nakshatraLordName;
            const subLordName = planetData.subLordName;

            // Get house lists for planet, nak lord, sub lord using the helper
            const planetAllHouses = getCombinedHousesForPlanet(planetName);
            const nakLordAllHouses = getCombinedHousesForPlanet(nakLordName);
            const subLordAllHouses = getCombinedHousesForPlanet(subLordName);

            let totalScore = 0;
            const allSignifiedHousesForCompleteness = new Set();
            const subLordSignifiedFavorable = new Set(); // Track favorable houses signified *only* by sublord

            // --- Score Calculation ---
            // Level 1: Planet itself (+1 / -1)
            planetAllHouses.forEach(house => {
                const isFav = favorableSet.has(house);
                const isUnfav = unfavorableSet.has(house);
                if (isFav) totalScore += 1;
                else if (isUnfav) totalScore -= 1;
                allSignifiedHousesForCompleteness.add(house);
            });

            // Level 2: Nakshatra Lord (+2 / -2)
            nakLordAllHouses.forEach(house => {
                const isFav = favorableSet.has(house);
                const isUnfav = unfavorableSet.has(house);
                if (isFav) totalScore += 2;
                else if (isUnfav) totalScore -= 2;
                allSignifiedHousesForCompleteness.add(house);
            });

            // Level 3: Sub Lord (+3 / -3)
            subLordAllHouses.forEach(house => {
                const isFav = favorableSet.has(house);
                const isUnfav = unfavorableSet.has(house);
                if (isFav) {
                    totalScore += 3;
                    subLordSignifiedFavorable.add(house); // Add to sublord specific set
                } else if (isUnfav) {
                    totalScore -= 3;
                }
                allSignifiedHousesForCompleteness.add(house);
            });

            // --- Determine Favourability ---
            let favourability = 'Neutral';
            // Use score-based logic similar to PrashnaNumberPage
            if (totalScore < 0) {
                favourability = 'Unfavorable';
            } else if (totalScore > 0) {
                favourability = 'Favorable';
            } else { // Score is 0
                // Check if any scoring houses were involved
                const hasAnyScoringHouse = planetAllHouses.some(h => favorableSet.has(h) || unfavorableSet.has(h)) ||
                                          nakLordAllHouses.some(h => favorableSet.has(h) || unfavorableSet.has(h)) ||
                                          subLordAllHouses.some(h => favorableSet.has(h) || unfavorableSet.has(h));
                if (hasAnyScoringHouse) {
                    favourability = 'Mixed';
                } else {
                    favourability = 'Neutral';
                }
            }


            // --- Determine Completeness ---
            let completeness = "Not Complete";
            const isCompleteSublord = favorableSet.size > 0 && [...favorableSet].every(favHouse => subLordSignifiedFavorable.has(favHouse));
            const isCompleteCombination = favorableSet.size > 0 && [...favorableSet].every(favHouse => allSignifiedHousesForCompleteness.has(favHouse));

            if (isCompleteSublord) {
                completeness = "Complete (Sublord)";
            } else if (isCompleteCombination) {
                completeness = "Complete (Combination)";
            }

            // If no event selected, reset score/favourability/completeness
            if (selectedEvent === '') {
                completeness = 'N/A';
                favourability = 'N/A';
                totalScore = 0;
            }

            // Store all calculated data in the map
            finalMap.set(planetName, {
                name: planetName,
                allHouses: planetAllHouses,
                nakshatraLordName: nakLordName,
                nakLordAllHouses: nakLordAllHouses,
                subLordName: subLordName,
                subLordAllHouses: subLordAllHouses,
                // Add the calculated score, favourability, and completeness
                score: totalScore,
                favourability: favourability,
                completeness: completeness,
            });
        });

        return finalMap;
    // Now depends on the calculated favorable/unfavorable houses as well
    }, [kpData, selectedEvent, favorableHouses, unfavorableHouses]); // Recalculate when kpData OR selectedEvent changes


    // --- Loading / Error / No Data States ---
    const isOverallLoading = isInitialLoading || isLoadingKp || isLoadingChart;
    const hasValidKpData = useMemo(() => significatorDetailsMap.size > 0, [significatorDetailsMap]);
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
                  {/* *** NEW: Display Favorable/Unfavorable Houses *** */}
                  {selectedEvent && (favorableHouses.length > 0 || unfavorableHouses.length > 0) && (
                        <div className="result-section event-houses-display small-summary">
                            {favorableHouses.length > 0 && (
                                <span>{t('kpSignificatorsPage.favorableHousesLabel', 'Favorable:')} <strong>{favorableHouses.join(', ')}</strong></span>
                            )}
                            {favorableHouses.length > 0 && unfavorableHouses.length > 0 && <span className="house-separator"> | </span>}
                            {unfavorableHouses.length > 0 && (
                                <span>{t('kpSignificatorsPage.unfavorableHousesLabel', 'Unfavorable:')} <strong>{unfavorableHouses.join(', ')}</strong></span>
                            )}
                        </div>
                    )}  
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
                                    significatorDetailsMap={significatorDetailsMap} // Pass the map with scores
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
