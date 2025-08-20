// src/AstrologyForm.js
import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { useOutletContext } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import '../styles/AstrologyForm.css';
import '../styles/AstrologyFormContent.css';
import DiamondChart from './DiamondChart';
import {
    convertDMSToDegrees,
    convertToDMS,
    formatToLocalISOString, // Not needed directly here, but used by TimeAdjustmentTool
    calculateNakshatraPada,
    calculateNakshatraDegree,
    calculateRashi, // Returns the English key (e.g., "Aries")
    calculateVar,   // Returns the English key (e.g., "Sunday")
    calculateHouse,
    PLANET_ORDER,
    PLANET_SYMBOLS,
    RASHIS,
} from './AstrologyUtils';
import api from './api';

// --- Helper Function to Format Time (Panchang) ---
const formatPanchangTime = (dateTimeString, t, i18n) => { // Added i18n parameter
    // Handle special strings from suncalc first
    if (dateTimeString === "Always Up" || dateTimeString === "Always Down") {
        return t(`sunMoonTimes.${dateTimeString.replace(' ', '')}`, dateTimeString); // e.g., t('sunMoonTimes.AlwaysUp', 'Always Up')
    }
    if (!dateTimeString || typeof dateTimeString !== 'string') return t('utils.notAvailable', 'N/A');

    try {
        // Create Date object from ISO string (represents a specific moment in time)
        const date = new Date(dateTimeString);
        if (isNaN(date.getTime())) return t('utils.invalidTime', 'Invalid Time');

        // *** Use toLocaleTimeString with a specific timezone (e.g., IST) ***
        // Adjust 'Asia/Kolkata' if a different timezone is needed or make it dynamic
        const options = {
            hour: 'numeric',
            minute: '2-digit',
            hour12: true,
            timeZone: 'Asia/Kolkata' // Or another relevant timezone
        };

        // *** ADDED CHECK: Ensure i18n and i18n.language are valid before use ***
        // Determine the locale to use, falling back to browser default if i18n is unavailable
        const locale = (i18n && i18n.language) ? i18n.language : undefined;

        // Log a warning if the fallback locale is used
        if (!locale && i18n) { // Check if i18n was passed but language was missing
             console.warn("formatPanchangTime: i18n object provided but language property missing. Using browser default locale.");
        } else if (!i18n) { // Check if i18n object itself was missing
             console.warn("formatPanchangTime: i18n object not provided. Using browser default locale.");
        }

        // Use the determined locale (or undefined for default) with the specified options
        return date.toLocaleTimeString(locale, options);

    } catch (e) {
        console.error("Error formatting panchang time:", e);
        return t('utils.error', 'Error');
    }
};

// --- Helper Function to create basic house structure for charts ---
const createChartHousesFromAscendant = (ascendantDms, t) => { // Added t
    if (!ascendantDms || typeof ascendantDms !== 'string') return null;
    const ascendantDeg = convertDMSToDegrees(ascendantDms);
    if (isNaN(ascendantDeg)) return null;

    const ascendantRashiName = calculateRashi(ascendantDeg, t); // Pass t
    const ascendantRashiIndex = RASHIS.indexOf(ascendantRashiName);
    if (ascendantRashiIndex === -1) return null;

    const housesArray = [];
    for (let i = 0; i < 12; i++) {
        const currentRashiIndex = (ascendantRashiIndex + i) % 12;
        const rashiStartDeg = currentRashiIndex * 30;
        housesArray.push({
            start_dms: convertToDMS(rashiStartDeg, t) // Pass t
        });
    }
    return housesArray;
};


// --- AstrologyForm Component ---
const AstrologyForm = () => {
    const { t, i18n } = useTranslation();
    const {
        mainResult,
        isLoading: isInitialLoading,
        error: initialError,
        calculationInputParams,
        adjustedBirthDateTimeString,
        adjustedGocharDateTimeString,
        locationForGocharTool,
    } = useOutletContext();

    // --- State ---
    const [rectifiedResult, setRectifiedResult] = useState(null);
    const [isLoadingRectification, setIsLoadingRectification] = useState(false);
    const [rectificationError, setRectificationError] = useState(null);
    const [gocharData, setGocharData] = useState(null);
    const [isLoadingGochar, setIsLoadingGochar] = useState(false);
    const [gocharError, setGocharError] = useState(null);
    const [openSections, setOpenSections] = useState({
        basicInfo: true,
        dashaBalance: true,
        doshas: true,
        longevityFactors: true,
        panchanga: true,
        lordships: true,
        charts: true,
        houseCusps: true,
        planetaryPositions: true,
        transitHouseCusps: true,
        transitPlanetaryPositions: true,
        transitBasicInfo: true,
        transitPanchanga: true,
        transitLordships: true
    });

    const toggleSection = (section) => {
        setOpenSections(prev => ({ ...prev, [section]: !prev[section] }));
    };

    // --- Effects ---
    useEffect(() => {
        // --- Rectification fetch logic ---
         if (!adjustedBirthDateTimeString || !calculationInputParams?.latitude || !calculationInputParams?.longitude || !calculationInputParams?.date) {
            if (rectifiedResult) setRectifiedResult(null);
            if (rectificationError) setRectificationError(null);
            return;
        }
        try {
            // Compare the local ISO strings directly
            const originalDateStr = calculationInputParams.date;
            const adjustedDateStr = adjustedBirthDateTimeString;

            // Basic check if they are identical strings
             if (originalDateStr === adjustedDateStr) {
                 if (rectifiedResult) {
                     setRectifiedResult(null);
                     setRectificationError(null);
                 }
                 return; // No change, don't fetch
             }
             // More robust check: parse and compare time values if formats might differ slightly (e.g., missing seconds)
             // This assumes both strings represent the *same* local time if they are meant to be identical
             const originalDate = new Date(originalDateStr);
             const adjustedDate = new Date(adjustedDateStr);
             if (!isNaN(originalDate) && !isNaN(adjustedDate) && originalDate.getTime() === adjustedDate.getTime()) {
                 if (rectifiedResult) {
                     setRectifiedResult(null);
                     setRectificationError(null);
                 }
                 return; // No change, don't fetch
             }

        } catch (e) {
             console.error("Date comparison error during rectification check:", e);
             // Proceed with fetch if comparison fails, as they might be different
        }

       
        setIsLoadingRectification(true);
        setRectificationError(null);

        const fetchRectifiedData = async () => {
            try {
                // *** Convert UTC ISO string back to local YYYY-MM-DDTHH:MM:SS for API ***
                const dateForApi = formatToLocalISOString(new Date(adjustedBirthDateTimeString));
                if (!dateForApi) {
                    throw new Error(t('astrologyForm.rectificationInvalidDateConversion'));
                }
                const payload = {
                    date: dateForApi, // Send the correct local time string
                    latitude: calculationInputParams.latitude,
                    longitude: calculationInputParams.longitude,
                    placeName: calculationInputParams.placeName // Include placeName if backend uses it
                };
                const response = await api.post('/calculate', payload);
                setRectifiedResult(response.data);
                
            } catch (err) {
                console.error("Rectification: Fetch error:", err.response?.data || err.message || err);
                const backendError = err.response?.data?.error || err.response?.data?.message;
                setRectificationError(backendError || err.message || t('astrologyForm.rectificationFetchFailed'));
                setRectifiedResult(null);
            } finally {
                setIsLoadingRectification(false);
            }
        };
        // Debounce fetch slightly
        const timerId = setTimeout(fetchRectifiedData, 300);
        return () => clearTimeout(timerId);

    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [adjustedBirthDateTimeString, calculationInputParams, t]); // Keep dependencies

    useEffect(() => {
        // --- Gochar fetch logic ---
        if (locationForGocharTool?.lat !== null && locationForGocharTool?.lon !== null && adjustedGocharDateTimeString) {
           
            setIsLoadingGochar(true);
            setGocharError(null);

            const fetchGochar = async () => {
                try {
                    // *** Convert UTC ISO string back to local YYYY-MM-DDTHH:MM:SS for API ***
                    const dateForApi = formatToLocalISOString(new Date(adjustedGocharDateTimeString));
                     if (!dateForApi) {
                        throw new Error(t('astrologyForm.gocharInvalidDateConversion'));
                    }
                    const response = await api.post('/calculate', {
                        date: dateForApi,
                        latitude: locationForGocharTool.lat,
                        longitude: locationForGocharTool.lon
                        // placeName is likely not needed for Gochar, but add if required by backend
                    });
                    setGocharData(response.data);
                    
                } catch (err) {
                    console.error("Gochar fetch error:", err.response?.data || err.message || err);
                    setGocharError(err.response?.data?.error || err.message || t('astrologyForm.gocharFetchFailed'));
                    setGocharData(null);
                } finally {
                    setIsLoadingGochar(false);
                }
            };
            // Debounce fetch slightly
            const timerId = setTimeout(fetchGochar, 300);
            return () => clearTimeout(timerId);

        } else {
            // Clear Gochar data if inputs are missing
            if (gocharData) setGocharData(null);
            if (isLoadingGochar) setIsLoadingGochar(false);
            if (gocharError) setGocharError(null);
            
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [adjustedGocharDateTimeString, locationForGocharTool, t]); // Keep dependencies

    // --- Determine which result set to display ---
    const displayResult = rectifiedResult || mainResult;
    const displayInputParams = useMemo(() => {
        // Use adjusted time string if rectifiedResult exists
        return rectifiedResult ? {
            ...(calculationInputParams || {}),
            date: adjustedBirthDateTimeString // This is the local ISO string YYYY-MM-DDTHH:MM:SS
        } : calculationInputParams;
    }, [rectifiedResult, calculationInputParams, adjustedBirthDateTimeString]);

 // *** NEW: Memoized calculation for Bhava planet placements ***
    const bhavaPlanetPlacements = useMemo(() => {
        if (!displayResult?.planetaryPositions?.sidereal || !displayResult?.houses || displayResult.houses.length !== 12) {
            return null;
        }

        const placements = {};
        // Use the actual start of the house cusps for calculation
        const cuspStartDegrees = displayResult.houses.map(h => convertDMSToDegrees(h.start_dms));

        if (cuspStartDegrees.some(isNaN)) {
            console.warn("Bhava Placements: Could not convert all cusp start DMS to degrees.");
            return null;
        }

        PLANET_ORDER.forEach(planetName => {
            const planetData = displayResult.planetaryPositions.sidereal[planetName];
            if (planetData && planetData.dms && planetData.dms !== "Error") {
                const planetDeg = convertDMSToDegrees(planetData.dms);
                if (!isNaN(planetDeg)) {
                    // calculateHouse returns the house number (1-12)
                    const houseNumber = calculateHouse(planetDeg, cuspStartDegrees, t);
                    if (typeof houseNumber === 'number') {
                        placements[planetName] = houseNumber;
                    }
                }
            }
        });
        return placements;
    }, [displayResult, t]); // Dependency on displayResult and t

 
   
// *** NEW: Memoized Placidus Cusp Degrees for Bhava Table Consistency ***
    const placidusCuspDegrees = useMemo(() => {
        if (!displayResult?.houses || !Array.isArray(displayResult.houses) || displayResult.houses.length !== 12) return [];
        const degrees = displayResult.houses.map(h => convertDMSToDegrees(h?.start_dms));
        if (degrees.some(isNaN)) {
            console.warn("Could not convert all Placidus cusp start_dms to degrees for displayResult.");
            return [];
        }
        return degrees;
    }, [displayResult]);

    // --- FINAL VERSION: Helper to format date/time string for display USING BROWSER'S TIMEZONE (like TimeAdjustmentTool) ---
    const formatDisplayDateTime = useCallback((localIsoString) => {
        if (!localIsoString || typeof localIsoString !== 'string') return t('utils.notAvailable', 'N/A');

        try {
            // Create a Date object. JavaScript's Date constructor often interprets
            // YYYY-MM-DDTHH:MM:SS strings as local time in the browser's current timezone.
            // We rely on this interpretation to match the TimeAdjustmentTool.
            const dateObj = new Date(localIsoString);

            if (isNaN(dateObj.getTime())) {
                // Handle potential missing seconds if initial parsing fails
                if (localIsoString.length === 16 && !localIsoString.includes(':', 14)) {
                    const dateObjWithSeconds = new Date(`${localIsoString}:00`);
                    if (isNaN(dateObjWithSeconds.getTime())) {
                        console.warn("formatDisplayDateTime: Invalid date string format even after adding seconds:", localIsoString);
                        return t('utils.invalidDate', 'Invalid Date');
                    }
                    // Use toLocaleString() WITHOUT specific options to mimic the tool's display
                    return dateObjWithSeconds.toLocaleString(i18n.language);
                }
                console.warn("formatDisplayDateTime: Invalid date string format:", localIsoString);
                return t('utils.invalidDate', 'Invalid Date');
            }

            // Use toLocaleString() WITHOUT specific options to mimic the tool's display
            return dateObj.toLocaleString(i18n.language);

        } catch (e) {
            console.error("Error formatting display date/time:", e, "Input:", localIsoString);
            // Fallback remains the same
            const match = localIsoString.match(/^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})(?::(\d{2}))?$/);
            if (match) {
                const [, year, month, day, hours, minutes, seconds = '00'] = match;
                const H = parseInt(hours, 10);
                const ampm = H >= 12 ? 'PM' : 'AM';
                const displayHour = H % 12 === 0 ? 12 : H % 12;
                return `${year}/${month}/${day}, ${displayHour}:${minutes}:${seconds} ${ampm}`;
            }
            return t('utils.invalidDate', 'Invalid Date');
        }
    }, [t, i18n.language]); // Add i18n.language as dependency


    // --- Render Helper for Gochar Details (Column 3) - REVISED TRANSLATIONS ---
    const renderGocharDetails = () => {
        if (isLoadingGochar) return <div className="loader small-loader" aria-label={t('astrologyForm.loadingTransit')}></div>;
        if (gocharError) return <p className="error-text small-error">{t('astrologyForm.transitErrorPrefix')}: {gocharError}</p>;
        // Check if location is available before saying data is unavailable
        if (locationForGocharTool?.lat === null || locationForGocharTool?.lon === null) {
             return <p className="info-text">{t('astrologyForm.validLocationNeeded')}</p>;
        }
        if (!gocharData) return <p className="info-text">{t('astrologyForm.transitDataUnavailable')}</p>;


        const gocharAsc = gocharData.ascendant;
        const gocharPlanets = gocharData.planetaryPositions?.sidereal;
        const gocharMoon = gocharPlanets?.Moon;
        const gocharSunMoonTimes = gocharData.sunMoonTimes;
        const gocharPanchang = gocharData.panchang;

        // Extract keys/values safely
        const gocharTithi = gocharPanchang?.Tithi;
        const gocharTithiNameKey = gocharTithi?.name_en_IN; // Get English name key for Tithi
        const gocharPakshaKey = gocharPanchang?.Paksha?.name_en_IN; // Get English key
        const gocharNakshatra = gocharPanchang?.Nakshatra;
        const gocharYogaKey = gocharPanchang?.Yoga?.name_en_IN; // Get English key
        const gocharKaranaKey = gocharPanchang?.Karna?.name_en_IN; // Get English key
        const gocharLunarMonthKey = gocharPanchang?.Masa?.name_en_IN; // Get English key
        const gocharRituKey = gocharPanchang?.Ritu?.name_en_UK; // Get English key (from API response)
        const gocharSamvatsarKey = gocharData.panchang?.samvatsar;
        const gocharVikramSamvat = gocharData.panchang?.vikram_samvat;
         const gocharSakaYear = gocharData.panchang?.SakaYear;
        // Use the adjustedGocharDateTimeString (local ISO string) for Var calculation
        const { varName: gocharVarKey, dayLord: gocharDayLord } = calculateVar(adjustedGocharDateTimeString, t);

        if (!gocharAsc || !gocharMoon || !gocharPanchang) return <p className="info-text">{t('astrologyForm.transitIncompleteData')}</p>;

        const moonDeg = convertDMSToDegrees(gocharMoon?.dms);
        const moonRashiKey = calculateRashi(moonDeg, t); // Returns English key (e.g., "Sagittarius")
        const moonNakshatraKey = gocharNakshatra?.name_en_IN ?? gocharMoon?.nakshatra; // Get English key
        const moonPada = calculateNakshatraPada(moonDeg, t);

        // Format Tithi with translation - Use name_en_IN as key for the name part
        const formattedGocharTithi = gocharTithi
            ? `${t(`pakshas.${gocharPakshaKey}`, { defaultValue: gocharPakshaKey })} ${gocharTithi.number || ''} (${t(`tithis.${gocharTithiNameKey}`, { defaultValue: gocharTithiNameKey || 'N/A' })})`
            : t('utils.notAvailable', 'N/A');

        return (
            <div className="gochar-details-content">
                 {/* Transit Time, Basic Info */}
                 <div className="result-section">
                    <div className="section-header" onClick={() => toggleSection('transitBasicInfo')}>
                        <h3 className="result-sub-title">{t('astrologyForm.transitBasicInfoTitle')}</h3>
                        <button className="toggle-button">{openSections.transitBasicInfo ? '−' : '+'}</button>
                    </div>
                    <div className={`section-content ${openSections.transitBasicInfo ? '' : 'collapsed'}`}>
                        <p className="result-text">{t('astrologyForm.transitTimeTitle')}: {formatDisplayDateTime(adjustedGocharDateTimeString)}</p>
                        <p className="result-text">
                            {t('Transit Ascendent')} {gocharAsc.sidereal_dms ?? t('utils.notAvailable', 'N/A')}
                            {gocharAsc.rashi && ` (${t(`rashis.${gocharAsc.rashi}`, { defaultValue: gocharAsc.rashi })} - ${t(`planets.${gocharAsc.rashiLord}`, { defaultValue: gocharAsc.rashiLord })})`}
                        </p>
                        <p className="result-text">
                            {t('Transit Ascendent Detail')}
                            {gocharAsc.rashi && ` (${t(`rashis.${gocharAsc.rashi}`, { defaultValue: gocharAsc.rashi })}, ${t('astrologyForm.nakshatraLabel')} ${t(`nakshatras.${gocharAsc.nakshatra}`, { defaultValue: gocharAsc.nakshatra })} ${t('astrologyForm.padaLabel')}${gocharAsc.pada}, ${t('astrologyForm.lordLabel')} ${t(`planets.${gocharAsc.nakLord}`, { defaultValue: gocharAsc.nakLord })})`}
                        </p>
                        {gocharSunMoonTimes && (
                            <>
                                                                <p className="result-text">{t('astrologyForm.sunriseLabel')} {formatPanchangTime(gocharSunMoonTimes.sunrise, t, i18n) ?? t('utils.notAvailable', 'N/A')}</p>
                                <p className="result-text">{t('astrologyForm.sunsetLabel')} {formatPanchangTime(gocharSunMoonTimes.sunset, t, i18n) ?? t('utils.notAvailable', 'N/A')}</p>
                                                                <p className="result-text">{t('astrologyForm.moonriseLabel')} {formatPanchangTime(gocharSunMoonTimes.moonrise, t, i18n) ?? t('utils.notAvailable', 'N/A')}</p>
                                                                <p className="result-text">{t('astrologyForm.moonsetLabel')} {formatPanchangTime(gocharSunMoonTimes.moonset, t, i18n) ?? t('utils.notAvailable', 'N/A')}</p>
                            </>
                        )}
                    </div>
                 </div>
                 {/* Panchanga Details */}
                 <div className="result-section">
                    <div className="section-header" onClick={() => toggleSection('transitPanchanga')}>
                        <h3 className="result-sub-title">{t('astrologyForm.transitPanchangaTitle')}</h3>
                        <button className="toggle-button">{openSections.transitPanchanga ? '−' : '+'}</button>
                    </div>
                    <div className={`section-content ${openSections.transitPanchanga ? '' : 'collapsed'}`}>
                        <p className="result-text">{t('astrologyForm.samvatsarLabel')} {t(`samvatsaras.${gocharSamvatsarKey}`, { defaultValue: gocharSamvatsarKey ?? t('utils.notAvailable', 'N/A') })}</p>
                        <p className="result-text">{t('astrologyForm.vikramSamvatLabel')} {gocharVikramSamvat ?? t('utils.notAvailable', 'N/A')}</p>
                        <p className="result-text">{t('astrologyForm.sakaYearLabel')} {gocharSakaYear ?? t('utils.notAvailable', 'N/A')}</p>
                        <p className="result-text">{t('astrologyForm.lunarMonthLabel')} {t(`hindiMonths.${gocharLunarMonthKey}`, { defaultValue: gocharLunarMonthKey ?? t('utils.notAvailable', 'N/A') })}</p>
                        <p className="result-text">{t('astrologyForm.rituLabel')} {t(`ritus.${gocharRituKey}`, { defaultValue: gocharRituKey ?? t('utils.notAvailable', 'N/A') })}</p>
                        <p className="result-text">
                            {t('astrologyForm.tithiLabel')} {formattedGocharTithi}
                            {gocharTithi?.start && gocharTithi?.end && ` (${formatPanchangTime(gocharTithi.start, t, i18n)} - ${formatPanchangTime(gocharTithi.end, t, i18n)})`}
                        </p>
                        <p className="result-text">{t('astrologyForm.rashiMoLabel')} {t(`rashis.${moonRashiKey}`, { defaultValue: moonRashiKey ?? t('utils.notAvailable', 'N/A') })}</p>
                        <p className="result-text">
                            {t('astrologyForm.nakMoLabel')} {t(`nakshatras.${moonNakshatraKey}`, { defaultValue: moonNakshatraKey ?? t('utils.notAvailable', 'N/A') })}
                            {gocharMoon?.nakLord && ` (${t('astrologyForm.lordLabel')} ${t(`planets.${gocharMoon.nakLord}`, { defaultValue: gocharMoon.nakLord })})`}
                            {moonPada !== 'N/A' ? ` (${t('astrologyForm.padaLabel')}${moonPada})` : ""}
                            {gocharNakshatra?.start && gocharNakshatra?.end && ` (${formatPanchangTime(gocharNakshatra.start, t, i18n)} - ${formatPanchangTime(gocharNakshatra.end, t, i18n)})`}
                        </p>
                        <p className="result-text">
                            {t('astrologyForm.yogaLabel')} {t(`yogas.${gocharYogaKey}`, { defaultValue: gocharYogaKey ?? t('utils.notAvailable', 'N/A') })}
                            {gocharPanchang?.Yoga?.start && gocharPanchang?.Yoga?.end && ` (${formatPanchangTime(gocharPanchang.Yoga.start, t, i18n)} - ${formatPanchangTime(gocharPanchang.Yoga.end, t, i18n)})`}
                        </p>
                        <p className="result-text">
                            {t('astrologyForm.karanLabel')} {t(`karans.${gocharKaranaKey}`, { defaultValue: gocharKaranaKey ?? t('utils.notAvailable', 'N/A') })}
                            {gocharPanchang?.Karna?.start && gocharPanchang?.Karna?.end && ` (${formatPanchangTime(gocharPanchang.Karna.start, t, i18n)} - ${formatPanchangTime(gocharPanchang.Karna.end, t, i18n)})`}
                        </p>
                        <p className="result-text">{t('astrologyForm.varLabel')} {t(`weekdays.${gocharVarKey}`, { defaultValue: gocharVarKey ?? t('utils.notAvailable', 'N/A') })}</p>
                    </div>
                 </div>
                 <div className="result-section lordships-section">
                    <div className="section-header" onClick={() => toggleSection('transitLordships')}>
                        <h3 className="result-sub-title">{t('Transit Time Lordship')}</h3>
                        <button className="toggle-button">{openSections.transitLordships ? '−' : '+'}</button>
                    </div>
                    <div className={`section-content ${openSections.transitLordships ? '' : 'collapsed'}`}>
                        <div className="lordship-column">
                            <h4>{t('Transit Details')}</h4>
                            <p>{t('Day Lord')}: {t(`planets.${gocharDayLord}`, { defaultValue: 'N/A' })}</p>
                            <p>{t('Ascendent Lord')}: {t(`planets.${gocharData?.ascendant?.rashiLord}`, { defaultValue: gocharData?.ascendant?.rashiLord ?? 'N/A' })}</p>
                            <p>{t('Ascendant Nakshatra Lord')}: {t(`planets.${gocharData?.ascendant?.nakLord}`, { defaultValue: gocharData?.ascendant?.nakLord ?? 'N/A' })}</p>
                            <p>{t('Ascendant Nakshatra SubLord')}: {t(`planets.${gocharData?.ascendant?.subLord}`, { defaultValue: gocharData?.ascendant?.subLord ?? 'N/A' })}</p>
                            <p>{t('Moon Rashi Lord')}: {t(`planets.${gocharData?.planetaryPositions?.sidereal?.Moon?.rashiLord}`, { defaultValue: gocharData?.planetaryPositions?.sidereal?.Moon?.rashiLord ?? 'N/A' })}</p>
                            <p>{t('Moon Nakshatra Lord')}: {t(`planets.${gocharData?.planetaryPositions?.sidereal?.Moon?.nakLord}`, { defaultValue: gocharData?.planetaryPositions?.sidereal?.Moon?.nakLord ?? 'N/A' })}</p>
                            <p>{t('Moon Nakshatra SubLord')}: {t(`planets.${gocharData?.planetaryPositions?.sidereal?.Moon?.subLord}`, { defaultValue: gocharData?.planetaryPositions?.sidereal?.Moon?.subLord ?? 'N/A' })}</p>
                        </div>
                    </div>
                </div>
            </div>
        );
    };


    // --- Render Helper Functions for Columns ---

    // Column 1: Astrological Data (Birth or Rectified) - REVISED TRANSLATIONS ---
    const renderLeftColumn = () => {
        if (!displayResult) return null;
        const moonSiderealData = displayResult.planetaryPositions?.sidereal?.Moon;
        const birthSunMoonTimes = displayResult.sunMoonTimes;
        const birthPanchang = displayResult.panchang;
        const birthDoshas = displayResult.doshas;

        // Extract keys/values safely
        const birthTithi = birthPanchang?.Tithi;
        const birthTithiNameKey = birthTithi?.name_en_IN; // Get English name key for Tithi
        const birthPakshaKey = birthPanchang?.Paksha?.name_en_IN; // Get English key
        const birthNakshatra = birthPanchang?.Nakshatra;
        const birthYogaKey = birthPanchang?.Yoga?.name_en_IN; // Get English key
        const birthKaranaKey = birthPanchang?.Karna?.name_en_IN; // Get English key
        const birthLunarMonthKey = birthPanchang?.Masa?.name_en_IN; // Get English key
        const birthRituKey = birthPanchang?.Ritu?.name_en_UK; // Get English key (from API response)
        const birthSamvatsarKey = displayResult.panchang?.samvatsar;
        const birthVikramSamvat = displayResult.panchang?.vikram_samvat;
        // Use the displayInputParams.date (local ISO string) for Var calculation
        const birthSakaYear = displayResult.panchang?.SakaYear;
        const displayDate = displayInputParams?.date || '';
        const { varName: birthVarKey, dayLord: birthDayLord } = calculateVar(displayDate, t);

        const moonDeg = convertDMSToDegrees(moonSiderealData?.dms);
        const moonRashiKey = calculateRashi(moonDeg, t); // Returns English key (e.g., "Sagittarius")
        const moonNakshatraKey = birthNakshatra?.name_en_IN ?? moonSiderealData?.nakshatra; // Get English key
        const moonPada = calculateNakshatraPada(moonDeg, t);
        const moonNakDegree = calculateNakshatraDegree(moonDeg);

        // Format Tithi with translation - Use name_en_IN as key for the name part
        const formattedBirthTithi = birthTithi
            ? `${t(`pakshas.${birthPakshaKey}`, { defaultValue: birthPakshaKey })} ${birthTithi.number || ''} (${t(`tithis.${birthTithiNameKey}`, { defaultValue: birthTithiNameKey || 'N/A' })})`
            : t('utils.notAvailable', 'N/A');

        // Format Dosha (Keep as is, assuming keys are correct)
        const formatDosha = (doshaKey) => {
            if (!birthDoshas || !birthDoshas[doshaKey]) {
                return <span className="dosha-status dosha-na">{t('astrologyForm.doshaStatusNA')}</span>;
            }
            const doshaData = birthDoshas[doshaKey];
            if (doshaData.error) {
                 return <span className="dosha-status dosha-error">{t('astrologyForm.doshaStatusError')}</span>;
            }
            if (!doshaData.present) {
                return <span className="dosha-status dosha-absent">{t('astrologyForm.doshaStatusAbsent')}</span>;
            }
            let details = "";
            switch (doshaKey) {
                case 'mangal':
                    const fromSources = doshaData.from?.map(src => t(`doshaSources.${src}`, { defaultValue: src })).join(', ');
                    details = fromSources ? ` (${t('astrologyForm.doshaFromLabel')} ${fromSources})` : "";
                    if (doshaData.cancellation && doshaData.cancellation.length > 0) {
                        details += ` (${t('astrologyForm.doshaCancelledLabel')}: ${doshaData.cancellation.join(', ')})`;
                    }
                    break;
                case 'kaalsarpa':
                    details = doshaData.type ? ` (${t(`kaalsarpaTypes.${doshaData.type}`, { defaultValue: doshaData.type })})` : "";
                    break;
                case 'mool':
                    details = doshaData.nakshatra ? ` (${t(`nakshatras.${doshaData.nakshatra}`, { defaultValue: doshaData.nakshatra })})` : "";
                    break;
                default: break;
            }
            return <span className="dosha-status dosha-present">{t('astrologyForm.doshaStatusPresent')}{details}</span>;
        };

        return (
            <div className="results-column left-column">
                <h2 className="column-title">{rectifiedResult ? t('astrologyForm.leftColumnTitleRectified') : t('astrologyForm.leftColumnTitleBirth')}</h2>
                 {/* Input Summary */}
                 {displayInputParams && (
                    <div className="result-section input-summary">
                        <h3 className="result-sub-title">{t('astrologyForm.calculatedForLabel')}</h3>
                        {/* Use formatDisplayDateTime for the main date */}
                        <p><strong>{t('astrologyForm.dateLabel')}</strong> {formatDisplayDateTime(displayInputParams.date)}</p>
                        <p><strong>{t('astrologyForm.coordsLabel')}</strong> {displayInputParams.latitude?.toFixed(4)}, {displayInputParams.longitude?.toFixed(4)}</p>
                        {displayInputParams.placeName && <p><strong>{t('astrologyForm.placeLabel')}</strong> {displayInputParams.placeName}</p>}
                    </div>
                 )}
                 {/* Basic Info */}
                <div className="result-section">
                    <div className="section-header" onClick={() => toggleSection('basicInfo')}>
                        <h3 className="result-sub-title">{t('astrologyForm.basicInfoTitle')}</h3>
                        <button className="toggle-button">{openSections.basicInfo ? '−' : '+'}</button>
                    </div>
                    <div className={`section-content ${openSections.basicInfo ? '' : 'collapsed'}`}>
                        <p className="result-text">
                            {t('Birth Ascendant')} {displayResult.ascendant?.sidereal_dms ?? t('utils.notAvailable', 'N/A')}
                            {displayResult.ascendant?.rashi &&
                                ` (${t(`rashis.${displayResult.ascendant.rashi}`, { defaultValue: displayResult.ascendant.rashi })} - ${t(`planets.${displayResult.ascendant.rashiLord}`, { defaultValue: displayResult.ascendant.rashiLord })})`}
                        </p>
                        <p className="result-text">
                            {t('Birth Ascendant Detail')}
                            {displayResult.ascendant?.rashi &&
                                ` (${t('astrologyForm.nakshatraLabel')} ${t(`nakshatras.${displayResult.ascendant.nakshatra}`, { defaultValue: displayResult.ascendant.nakshatra })} ${t('astrologyForm.padaLabel')}${displayResult.ascendant.pada}${displayResult.ascendant.padaAlphabet ? ` (${displayResult.ascendant.padaAlphabet})` : ''}, ${t('astrologyForm.lordLabel')} ${t(`planets.${displayResult.ascendant.nakLord}`, { defaultValue: displayResult.ascendant.nakLord })})`}
                        </p>
                        {/* Badhak Details */}
                        {displayResult.badhakDetails && !displayResult.badhakDetails.error && (
                            <p className="result-text">
                                <strong>{t('astrologyForm.badhakTitle', 'Badhak:')}</strong>
                                {` ${t('astrologyForm.badhakHouseLabel', 'House')} ${displayResult.badhakDetails.badhakHouse} `}
                                {`(${t(`rashis.${displayResult.badhakDetails.badhakSign}`, { defaultValue: displayResult.badhakDetails.badhakSign })}, `}
                                {`${t('astrologyForm.lordLabel')} ${t(`planets.${displayResult.badhakDetails.badhakesh}`, { defaultValue: displayResult.badhakDetails.badhakesh })})`}
                            </p>
                        )}
                        {birthSunMoonTimes && (
                            <>
                                <p className="result-text">{t('astrologyForm.sunriseLabel')} {formatPanchangTime(birthSunMoonTimes.sunrise, t, i18n) ?? t('utils.notAvailable', 'N/A')}</p>
                                                                <p className="result-text">{t('astrologyForm.sunsetLabel')} {formatPanchangTime(birthSunMoonTimes.sunset, t, i18n) ?? t('utils.notAvailable', 'N/A')}</p>
                                <p className="result-text">{t('astrologyForm.moonriseLabel')} {formatPanchangTime(birthSunMoonTimes.moonrise, t, i18n) ?? t('utils.notAvailable', 'N/A')}</p>
                                <p className="result-text">{t('astrologyForm.moonsetLabel')} {formatPanchangTime(birthSunMoonTimes.moonset, t, i18n) ?? t('utils.notAvailable', 'N/A')}</p>
                            </>
                        )}
                    </div>
                </div>
                {/* Dasha Balance */}
                {displayResult.dashaBalance && (
                    <div className="result-section dasha-balance">
                        <div className="section-header" onClick={() => toggleSection('dashaBalance')}>
                            <h3 className="result-sub-title">{t('astrologyForm.dashaBalanceTitle')}</h3>
                            <button className="toggle-button">{openSections.dashaBalance ? '−' : '+'}</button>
                        </div>
                        <div className={`section-content ${openSections.dashaBalance ? '' : 'collapsed'}`}>
                            <p className="result-text">{t('astrologyForm.dashaLordLabel')} <strong>{t(`planets.${displayResult.dashaBalance.lord}`, { defaultValue: displayResult.dashaBalance.lord ?? t('utils.notAvailable', 'N/A') })}</strong></p>
                            <p className="result-text">{t('astrologyForm.dashaBalanceLabel')} {displayResult.dashaBalance.balance_str ?? t('utils.notAvailable', 'N/A')}</p>
                        </div>
                    </div>
                )}
                {/* Doshas */}
                <div className="result-section dosha-details">
                    <div className="section-header" onClick={() => toggleSection('doshas')}>
                        <h3 className="result-sub-title">{t('astrologyForm.doshaTitle')}</h3>
                        <button className="toggle-button">{openSections.doshas ? '−' : '+'}</button>
                    </div>
                    <div className={`section-content ${openSections.doshas ? '' : 'collapsed'}`}>
                        <p className="result-text">{t('astrologyForm.mangalDoshaLabel')} {formatDosha('mangal')}</p>
                        <p className="result-text">{t('astrologyForm.kaalsarpaDoshaLabel')} {formatDosha('kaalsarpa')}</p>
                        <p className="result-text">{t('astrologyForm.moolDoshaLabel')} {formatDosha('mool')}</p>
                    </div>
                </div>
                {/* Longevity Factors */}
                {displayResult.longevityFactors && !displayResult.longevityFactors.error && (
                    <div className="result-section">
                        <div className="section-header" onClick={() => toggleSection('longevityFactors')}>
                            <h3 className="result-sub-title">{t('astrologyForm.longevityFactorsTitle', 'Longevity Factors')}</h3>
                            <button className="toggle-button">{openSections.longevityFactors ? '−' : '+'}</button>
                        </div>
                        <div className={`section-content ${openSections.longevityFactors ? '' : 'collapsed'}`}>
                            {/* House-Based Longevity */}
                            {displayResult.houseBasedLongevity && !displayResult.houseBasedLongevity.error && (
                                <>
                                    <p className="result-text">
                                        <strong>{t('astrologyForm.longevityScoreLabel', 'Calculated Longevity:')}</strong>
                                        {` ${displayResult.houseBasedLongevity.longevity} ${t('astrologyForm.yearsLabel', 'years')}`}
                                    </p>
                                    <p className="result-text hint-text">
                                        ({t('astrologyForm.scoreALabel', 'Score A (Life+)')}: {displayResult.houseBasedLongevity.scoreA}, {t('astrologyForm.scoreBLabel', 'Score B (Life-)')}: {displayResult.houseBasedLongevity.scoreB})
                                    </p>
                                </>
                            )}
                            {/* Maraka/Badhaka */}
                            <p className="result-text"><strong>{t('astrologyForm.marakaPlanetsLabel', 'Maraka Planets (2nd & 7th Lords):')}</strong>{` ${displayResult.longevityFactors.marakaLords.map(lord => t(`planets.${lord}`, { defaultValue: lord })).join(', ')}`}</p>
                            <p className="result-text"><strong>{t('astrologyForm.eighthLordLabel', '8th Lord:')}</strong> {t(`planets.${displayResult.longevityFactors.eighthLord}`, { defaultValue: displayResult.longevityFactors.eighthLord })}</p>
                            {displayResult.badhakDetails && !displayResult.badhakDetails.error && (<p className="result-text"><strong>{t('astrologyForm.badhakeshLabel', 'Badhakesh (Obstructor):')}</strong> {t(`planets.${displayResult.badhakDetails.badhakesh}`, { defaultValue: displayResult.badhakDetails.badhakesh })}</p>)}
                        </div>
                    </div>
                )}
                {/* Panchanga Details */}
                <div className="result-section">
                    <div className="section-header" onClick={() => toggleSection('panchanga')}>
                        <h3 className="result-sub-title">{t('astrologyForm.birthPanchangaTitle')}</h3>
                        <button className="toggle-button">{openSections.panchanga ? '−' : '+'}</button>
                    </div>
                    <div className={`section-content ${openSections.panchanga ? '' : 'collapsed'}`}>
                        <p className="result-text">{t('astrologyForm.samvatsarLabel')} {t(`samvatsaras.${birthSamvatsarKey}`, { defaultValue: birthSamvatsarKey ?? t('utils.notAvailable', 'N/A') })}</p>
                        <p className="result-text">{t('astrologyForm.vikramSamvatLabel')} {birthVikramSamvat ?? t('utils.notAvailable', 'N/A')}</p>
                         <p className="result-text">{t('astrologyForm.sakaYearLabel')} {birthSakaYear ?? t('utils.notAvailable', 'N/A')}</p>
                        <p className="result-text">{t('astrologyForm.lunarMonthLabel')} {t(`hindiMonths.${birthLunarMonthKey}`, { defaultValue: birthLunarMonthKey ?? t('utils.notAvailable', 'N/A') })}</p>
                        <p className="result-text">{t('astrologyForm.rituLabel')} {t(`ritus.${birthRituKey}`, { defaultValue: birthRituKey ?? t('utils.notAvailable', 'N/A') })}</p>
                        <p className="result-text">
                            {t('astrologyForm.tithiLabel')} {formattedBirthTithi}
                            {birthTithi?.start && birthTithi?.end && ` (${formatPanchangTime(birthTithi.start, t, i18n)} - ${formatPanchangTime(birthTithi.end, t, i18n)})`}
                        </p>
                        <p className="result-text">{t('astrologyForm.rashiMoLabel')} {t(`rashis.${moonRashiKey}`, { defaultValue: moonRashiKey ?? t('utils.notAvailable', 'N/A') })}</p>
                        <p className="result-text">
                            {t('astrologyForm.nakMoLabel')} {t(`nakshatras.${moonNakshatraKey}`, { defaultValue: moonNakshatraKey ?? t('utils.notAvailable', 'N/A') })}
                            {moonSiderealData?.nakLord && ` (${t('astrologyForm.lordLabel')} ${t(`planets.${moonSiderealData.nakLord}`, { defaultValue: moonSiderealData.nakLord })})`}
                            {moonPada !== 'N/A' ? ` (${t('astrologyForm.padaLabel')}${moonPada}${moonSiderealData.padaAlphabet ? ` (${moonSiderealData.padaAlphabet})` : ''})` : ""}
                            {birthNakshatra?.start && birthNakshatra?.end && ` (${formatPanchangTime(birthNakshatra.start, t, i18n)} - ${formatPanchangTime(birthNakshatra.end, t, i18n)})`}
                        </p>
                        <p className="result-text">
                            {t('astrologyForm.nakDegLabel')} {convertToDMS(moonNakDegree, t)}
                        </p>
                        <p className="result-text">
                            {t('astrologyForm.yogaLabel')} {t(`yogas.${birthYogaKey}`, { defaultValue: birthYogaKey ?? t('utils.notAvailable', 'N/A') })}
                            {birthPanchang?.Yoga?.start && birthPanchang?.Yoga?.end && ` (${formatPanchangTime(birthPanchang.Yoga.start, t, i18n)} - ${formatPanchangTime(birthPanchang.Yoga.end, t, i18n)})`}
                        </p>
                        <p className="result-text">
                            {t('astrologyForm.karanLabel')} {t(`karans.${birthKaranaKey}`, { defaultValue: birthKaranaKey ?? t('utils.notAvailable', 'N/A') })}
                            {birthPanchang?.Karna?.start && birthPanchang?.Karna?.end && ` (${formatPanchangTime(birthPanchang.Karna.start, t, i18n)} - ${formatPanchangTime(birthPanchang.Karna.end, t, i18n)})`}
                        </p>
                        <p className="result-text">{t('astrologyForm.varLabel')} {t(`weekdays.${birthVarKey}`, { defaultValue: birthVarKey ?? t('utils.notAvailable', 'N/A') })}</p>
                    </div>
                </div>
                <div className="result-section lordships-section">
                    <div className="section-header" onClick={() => toggleSection('lordships')}>
                        <h3 className="result-sub-title">{t('Birth Time Lordship')}</h3>
                        <button className="toggle-button">{openSections.lordships ? '−' : '+'}</button>
                    </div>
                    <div className={`section-content ${openSections.lordships ? '' : 'collapsed'}`}>
                        <div className="lordship-column">
                            <h4>{t('Birth Details')}</h4>
                            <p>{t('Day Lord')}: {t(`planets.${birthDayLord}`, { defaultValue: 'N/A' })}</p>
                            <p>{t('Ascendant Lord')}: {t(`planets.${displayResult?.ascendant?.rashiLord}`, { defaultValue: displayResult?.ascendant?.rashiLord ?? 'N/A' })}</p>
                            <p>{t('Ascendant Nakshatra Lord')}: {t(`planets.${displayResult?.ascendant?.nakLord}`, { defaultValue: displayResult?.ascendant?.nakLord ?? 'N/A' })}</p>
                            <p>{t('Ascendant Nakshatra SubLord')}: {t(`planets.${displayResult?.ascendant?.subLord}`, { defaultValue: displayResult?.ascendant?.subLord ?? 'N/A' })}</p>
                            <p>{t('Moon Rashi Lord')}: {t(`planets.${displayResult?.planetaryPositions?.sidereal?.Moon?.rashiLord}`, { defaultValue: displayResult?.planetaryPositions?.sidereal?.Moon?.rashiLord ?? 'N/A' })}</p>
                            <p>{t('Moon Nakshatra Lord')}: {t(`planets.${displayResult?.planetaryPositions?.sidereal?.Moon?.nakLord}`, { defaultValue: displayResult?.planetaryPositions?.sidereal?.Moon?.nakLord ?? 'N/A' })}</p>
                            <p>{t('Moon Nakshatra SubLord')}: {t(`planets.${displayResult?.planetaryPositions?.sidereal?.Moon?.subLord}`, { defaultValue: displayResult?.planetaryPositions?.sidereal?.Moon?.subLord ?? 'N/A' })}</p>
                        </div>
                    </div>
                </div>
            </div>
        );
    };

    

    // --- renderRightColumn (Calls renderGocharDetails) ---
    const renderRightColumn = () => {
        const canRenderBirthCharts = displayResult && displayResult.houses && displayResult.planetaryPositions?.sidereal;
        const hasD9Data = displayResult?.d9_planets && displayResult?.d9_ascendant_dms; // Pass 't' when creating D9 houses
       
        const d9Houses = hasD9Data ? createChartHousesFromAscendant(displayResult.d9_ascendant_dms, t) : null;
        const hasGocharData = gocharData?.planetaryPositions?.sidereal && gocharData?.ascendant?.sidereal_dms;
        // Pass 't' when creating Gochar houses
        const gocharHouses = hasGocharData ? createChartHousesFromAscendant(gocharData.ascendant.sidereal_dms, t) : null;
        const canRenderAnyChart = canRenderBirthCharts || hasD9Data || hasGocharData;
        const hasHouseDataForTable = displayResult?.houses && Array.isArray(displayResult.houses) && displayResult.houses.length === 12;
        // *** FIX: Use placidusCuspDegrees for the check to ensure consistency with the table's calculation ***
        const hasPlanetDataForTable = displayResult?.planetaryPositions?.sidereal && placidusCuspDegrees.length === 12;
        
        const canRenderBhavaChart = canRenderBirthCharts && bhavaPlanetPlacements;

         return (
            <div className="results-column right-column">
                <div className="right-column-top">
                    <div className="right-column-top-left">
                        <h2 className="column-title">{t('Main Charts')}</h2>
                        {/* --- Charts Grid (2x2) --- */}
                        <div className="result-section">
                            <div className="section-header" onClick={() => toggleSection('charts')}>
                                <h3 className="result-sub-title">{t('Main Charts')}</h3>
                                <button className="toggle-button">{openSections.charts ? '−' : '+'}</button>
                            </div>
                            <div className={`section-content ${openSections.charts ? '' : 'collapsed'}`}>
                                {canRenderAnyChart ? (
                                    <div className="charts-container-vertical">
                                        {/* Top Row */}
                                        <div className="chart-cell">
                                            {canRenderBirthCharts ? (
                                                <DiamondChart
                                                    title={t('astrologyForm.chartD1Title')}
                                                    houses={displayResult.houses}
                                                    planets={displayResult.planetaryPositions.sidereal}
                                                    chartType="lagna" size={400}
                                                />
                                            ) : <div className="chart-placeholder">{t('astrologyForm.chartPlaceholderD1')}</div>}
                                        </div>
                                        <div className="chart-cell">
                                            {canRenderBhavaChart ? (
                                                <DiamondChart
                                                    title={t('astrologyForm.chartBhavaTitle')}
                                                    houses={displayResult.houses}
                                                    planetHousePlacements={bhavaPlanetPlacements}
                                                    chartType="bhava" size={400} // Pass the calculated placements
                                                />
                                            ) : <div className="chart-placeholder">{t('astrologyForm.chartPlaceholderBhava')}</div>}
                                        </div>
                                        {/* Bottom Row */}
                                        <div className="chart-cell">
                                            {hasD9Data && d9Houses ? (
                                                <DiamondChart
                                                    title={t('astrologyForm.chartD9Title')}
                                                    houses={d9Houses}
                                                    planets={displayResult.d9_planets}
                                                    chartType="d9" size={400}
                                                />
                                            ) : <div className="chart-placeholder">{t('astrologyForm.chartPlaceholderD9')}</div>}
                                        </div>
                                        <div className="chart-cell">
                                             {isLoadingGochar ? (
                                                <div className="chart-placeholder">{t('astrologyForm.chartPlaceholderLoadingGochar')}</div>
                                             ) : hasGocharData && gocharHouses ? (
                                                <DiamondChart
                                                    title={t('astrologyForm.chartGocharTitle')}
                                                    houses={gocharHouses}
                                                    planets={gocharData.planetaryPositions.sidereal}
                                                    chartType="gochar" size={400}
                                                />
                                            ) : <div className="chart-placeholder">{t('astrologyForm.chartPlaceholderGochar')}</div>}
                                        </div>
                                    </div>
                                ) : (
                                    !isLoadingRectification && <p className="info-text">{t('astrologyForm.chartDataUnavailable')}</p>
                                )}
                            </div>
                        </div>
                    </div>
                    <div className="right-column-top-right">
                        <h2 className="column-title">{t('astrologyForm.rightColumnTitle')}</h2>
                        {/* renderGocharDetails handles its own loading/error/data states */}
                        {renderGocharDetails()}
                    </div>
                </div>

                <div className="result-section">
                    <div className="section-header" onClick={() => toggleSection('houseCusps')}>
                        <h3 className="result-sub-title">{t('astrologyForm.houseCuspsTitle')}</h3>
                        <button className="toggle-button">{openSections.houseCusps ? '−' : '+'}</button>
                    </div>
                    <div className={`section-content ${openSections.houseCusps ? '' : 'collapsed'}`}>
                        {hasHouseDataForTable ? (
                            <div className="table-wrapper small-table">
                                <table className="results-table houses-table">
                                    <thead>
                                        <tr>
                                            <th>{t('astrologyForm.houseTableHHeader')}</th><th>{t('astrologyForm.houseTableCuspStartHeader')}</th>
                                            <th>{t('astrologyForm.houseTableMeanCuspHeader')}</th><th>{t('astrologyForm.houseTableNakMeanHeader')}</th>
                                            <th>{t('astrologyForm.houseTablePadaHeader')}</th><th>{t('astrologyForm.houseTableNakLordHeader')}</th>
                                            <th>{t('astrologyForm.houseTableRashiMeanHeader')}</th><th>{t('astrologyForm.houseTableRashiLordHeader')}</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {displayResult.houses.map((house) => (
                                            <tr key={house.house_number}>
                                                <td>{house.house_number ?? t('utils.notAvailable', 'N/A')}</td><td>{house.start_dms ?? t('utils.notAvailable', 'N/A')}</td>
                                                <td>{house.mean_dms ?? t('utils.notAvailable', 'N/A')}</td>
                                                <td>{t(`nakshatras.${house.mean_nakshatra}`, { defaultValue: house.mean_nakshatra ?? t('utils.notAvailable', 'N/A') })}</td>
                                                <td>{t(`planets.${house.mean_nakshatra_lord}`, { defaultValue: house.mean_nakshatra_lord ?? t('utils.notAvailable', 'N/A') })}</td>
                                                <td>{t(`rashis.${house.mean_rashi}`, { defaultValue: house.mean_rashi ?? t('utils.notAvailable', 'N/A') })}</td>
                                                <td>{t(`planets.${house.mean_rashi_lord}`, { defaultValue: house.mean_rashi_lord ?? t('utils.notAvailable', 'N/A') })}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        ) : (<p className="result-text">{t('astrologyForm.houseDataUnavailable')}</p>)}
                    </div>
                </div>
                <div className="result-section">
                    <div className="section-header" onClick={() => toggleSection('planetaryPositions')}>
                        <h3 className="result-sub-title">{t('astrologyForm.planetaryPositionsTitle')}</h3>
                        <button className="toggle-button">{openSections.planetaryPositions ? '−' : '+'}</button>
                    </div>
                    <div className={`section-content ${openSections.planetaryPositions ? '' : 'collapsed'}`}>
                        {hasPlanetDataForTable ? (
                            <div className="table-wrapper small-table">
                                <table className="results-table planets-table">
                                    <thead>
                                        <tr>
                                            <th>{t('astrologyForm.planetTableHeaderPlanet')}</th><th>{t('astrologyForm.planetTableHeaderPosition')}</th>
                                            <th>{t('astrologyForm.planetTableHeaderNakPada')}</th><th>{t('astrologyForm.planetTableHeaderNakLord')}</th>
                                            <th>{t('astrologyForm.planetTableHeaderSubLord')}</th><th>{t('astrologyForm.planetTableHeaderSubSub')}</th>
                                            <th>{t('astrologyForm.planetTableHeaderNakDeg')}</th><th>{t('astrologyForm.planetTableHeaderRashi')}</th>
                                            <th>{t('astrologyForm.planetTableHeaderRashiLord')}</th><th>{t('astrologyForm.planetTableHeaderBhava')}</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {PLANET_ORDER.map((body) => {
                                            const planetData = displayResult.planetaryPositions.sidereal[body];
                                            if (!planetData) return null;
                                            const siderealDeg = convertDMSToDegrees(planetData.dms);
                                            if (isNaN(siderealDeg) || planetData.dms === "Error") {
                                                return (<tr key={body}><td>{PLANET_SYMBOLS[body] || body}</td><td colSpan="9">{t('astrologyForm.planetDataError')}</td></tr>);
                                            }
                                            const pada = planetData.pada ?? calculateNakshatraPada(siderealDeg, t);
                                            const degreeWithinNakshatra = convertToDMS(calculateNakshatraDegree(siderealDeg), t);
                                           const rashiKey = planetData.rashi ?? calculateRashi(siderealDeg, t);
                                            // *** FIX: Use placidusCuspDegrees to calculate the house, matching the Bhava Chalit chart ***
                                            const house = calculateHouse(siderealDeg, placidusCuspDegrees, t);
                                           
                                            const nakshatraKey = planetData.nakshatra; // Get English key
                                            const nakLordKey = planetData.nakLord; // Get English key
                                            const subLordKey = planetData.subLord; // Get English key
                                            const subSubLordKey = planetData.subSubLord; // Get English key
                                            const rashiLordKey = planetData.rashiLord; // Get English key

                                            return (
                                                <tr key={body}>
                                                    <td>{PLANET_SYMBOLS[body] || body}</td><td>{planetData.dms ?? t('utils.notAvailable', 'N/A')}</td>
                                                    <td>{`${t(`nakshatras.${nakshatraKey}`, { defaultValue: nakshatraKey ?? t('utils.notAvailable', 'N/A') })} (${t('astrologyForm.padaLabel')}${pada}${planetData.padaAlphabet ? ` (${planetData.padaAlphabet})` : ''})`}</td>
                                                    <td>{t(`planets.${nakLordKey}`, { defaultValue: nakLordKey ?? t('utils.notAvailable', 'N/A') })}</td>
                                                    <td>{t(`planets.${subLordKey}`, { defaultValue: subLordKey ?? t('utils.notAvailable', 'N/A') })}</td>
                                                    <td>{t(`planets.${subSubLordKey}`, { defaultValue: subSubLordKey ?? t('utils.notAvailable', 'N/A') })}</td>
                                                    <td>{degreeWithinNakshatra}</td>
                                                    <td>{t(`rashis.${rashiKey}`, { defaultValue: rashiKey ?? t('utils.notAvailable', 'N/A') })}</td>
                                                    <td>{t(`planets.${rashiLordKey}`, { defaultValue: rashiLordKey ?? t('utils.notAvailable', 'N/A') })}</td>
                                                    <td>{house}</td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        ) : (<p className="result-text">{t('astrologyForm.planetDataUnavailable')}</p>)}
                    </div>
                </div>

                {/* Transit House Cusps Table */}
                {gocharData && (
                    <div className="result-section">
                        <div className="section-header" onClick={() => toggleSection('transitHouseCusps')}>
                            <h3 className="result-sub-title">{t('astrologyForm.transitHouseCuspsTitle')}</h3>
                            <button className="toggle-button">{openSections.transitHouseCusps ? '−' : '+'}</button>
                        </div>
                        <div className={`section-content ${openSections.transitHouseCusps ? '' : 'collapsed'}`}>
                            {gocharData.houses && gocharData.houses.length === 12 ? (
                                <div className="table-wrapper small-table">
                                    <table className="results-table houses-table">
                                        <thead>
                                            <tr>
                                                <th>{t('astrologyForm.houseTableHHeader')}</th><th>{t('astrologyForm.houseTableCuspStartHeader')}</th>
                                                <th>{t('astrologyForm.houseTableMeanCuspHeader')}</th><th>{t('astrologyForm.houseTableNakMeanHeader')}</th>
                                                <th>{t('astrologyForm.houseTablePadaHeader')}</th><th>{t('astrologyForm.houseTableNakLordHeader')}</th>
                                                <th>{t('astrologyForm.houseTableRashiMeanHeader')}</th><th>{t('astrologyForm.houseTableRashiLordHeader')}</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {gocharData.houses.map((house) => (
                                                <tr key={house.house_number}>
                                                    <td>{house.house_number ?? t('utils.notAvailable', 'N/A')}</td><td>{house.start_dms ?? t('utils.notAvailable', 'N/A')}</td>
                                                    <td>{house.mean_dms ?? t('utils.notAvailable', 'N/A')}</td>
                                                    <td>{t(`nakshatras.${house.mean_nakshatra}`, { defaultValue: house.mean_nakshatra ?? t('utils.notAvailable', 'N/A') })}</td>
                                                    <td>{house.mean_nakshatra_charan ?? t('utils.notAvailable', 'N/A')}</td>
                                                    <td>{t(`planets.${house.mean_nakshatra_lord}`, { defaultValue: house.mean_nakshatra_lord ?? t('utils.notAvailable', 'N/A') })}</td>
                                                    <td>{t(`rashis.${house.mean_rashi}`, { defaultValue: house.mean_rashi ?? t('utils.notAvailable', 'N/A') })}</td>
                                                    <td>{t(`planets.${house.mean_rashi_lord}`, { defaultValue: house.mean_rashi_lord ?? t('utils.notAvailable', 'N/A') })}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            ) : (<p className="result-text">{t('astrologyForm.transitHouseDataUnavailable')}</p>)}
                        </div>
                    </div>
                )}

                {/* Transit Planetary Positions Table */}
                {gocharData && (
                    <div className="result-section">
                        <div className="section-header" onClick={() => toggleSection('transitPlanetaryPositions')}>
                            <h3 className="result-sub-title">{t('astrologyForm.transitPlanetaryPositionsTitle')}</h3>
                            <button className="toggle-button">{openSections.transitPlanetaryPositions ? '−' : '+'}</button>
                        </div>
                        <div className={`section-content ${openSections.transitPlanetaryPositions ? '' : 'collapsed'}`}>
                            {gocharData.planetaryPositions?.sidereal ? (
                                <div className="table-wrapper small-table">
                                    <table className="results-table planets-table">
                                        <thead>
                                            <tr>
                                                <th>{t('astrologyForm.planetTableHeaderPlanet')}</th><th>{t('astrologyForm.planetTableHeaderPosition')}</th>
                                                <th>{t('astrologyForm.planetTableHeaderNakPada')}</th><th>{t('astrologyForm.planetTableHeaderNakLord')}</th>
                                                <th>{t('astrologyForm.planetTableHeaderSubLord')}</th><th>{t('astrologyForm.planetTableHeaderSubSub')}</th>
                                                <th>{t('astrologyForm.planetTableHeaderNakDeg')}</th><th>{t('astrologyForm.planetTableHeaderRashi')}</th>
                                                <th>{t('astrologyForm.planetTableHeaderRashiLord')}</th><th>{t('astrologyForm.planetTableHeaderBhava')}</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {PLANET_ORDER.map((body) => {
                                                const planetData = gocharData.planetaryPositions.sidereal[body];
                                                if (!planetData) return null;
                                                const siderealDeg = convertDMSToDegrees(planetData.dms);
                                                if (isNaN(siderealDeg) || planetData.dms === "Error") {
                                                    return (<tr key={body}><td>{PLANET_SYMBOLS[body] || body}</td><td colSpan="9">{t('astrologyForm.planetDataError')}</td></tr>);
                                                }
                                                const pada = planetData.pada ?? calculateNakshatraPada(siderealDeg, t);
                                                const degreeWithinNakshatra = convertToDMS(calculateNakshatraDegree(siderealDeg), t);
                                                const rashiKey = planetData.rashi ?? calculateRashi(siderealDeg, t);
                                                const house = calculateHouse(siderealDeg, gocharData.houses.map(h => convertDMSToDegrees(h.start_dms)), t);
                                                const nakshatraKey = planetData.nakshatra;
                                                const nakLordKey = planetData.nakLord;
                                                const subLordKey = planetData.subLord;
                                                const subSubLordKey = planetData.subSubLord;
                                                const rashiLordKey = planetData.rashiLord;

                                                return (
                                                    <tr key={body}>
                                                        <td>{PLANET_SYMBOLS[body] || body}</td><td>{planetData.dms ?? t('utils.notAvailable', 'N/A')}</td>
                                                        <td>{`${t(`nakshatras.${nakshatraKey}`, { defaultValue: nakshatraKey ?? t('utils.notAvailable', 'N/A') })} (${t('astrologyForm.padaLabel')}${pada}${planetData.padaAlphabet ? ` (${planetData.padaAlphabet})` : ''})`}</td>
                                                        <td>{t(`planets.${nakLordKey}`, { defaultValue: nakLordKey ?? t('utils.notAvailable', 'N/A') })}</td>
                                                        <td>{t(`planets.${subLordKey}`, { defaultValue: subLordKey ?? t('utils.notAvailable', 'N/A') })}</td>
                                                        <td>{t(`planets.${subSubLordKey}`, { defaultValue: subSubLordKey ?? t('utils.notAvailable', 'N/A') })}</td>
                                                        <td>{degreeWithinNakshatra}</td>
                                                        <td>{t(`rashis.${rashiKey}`, { defaultValue: rashiKey ?? t('utils.notAvailable', 'N/A') })}</td>
                                                        <td>{t(`planets.${rashiLordKey}`, { defaultValue: rashiLordKey ?? t('utils.notAvailable', 'N/A') })}</td>
                                                        <td>{house}</td>
                                                    </tr>
                                                );
                                            })}
                                        </tbody>
                                    </table>
                                </div>
                            ) : (<p className="result-text">{t('astrologyForm.transitPlanetDataUnavailable')}</p>)}
                        </div>
                    </div>
                )}
            </div>
        );
    };

    // --- Component Return ---
    return (
        <div className="astrology-form-content">
            {isInitialLoading && !mainResult && <div className="loading-overlay">{t('astrologyForm.loadingInitial')}</div>}
            {initialError && !mainResult && <div className="error-overlay">{t('astrologyForm.errorInitial', { error: initialError })}</div>}
            {/* Render columns if we have either birth/rectified data OR gochar data */}
            {displayResult || gocharData ? (
                <>
                    {renderLeftColumn()}
                    {renderRightColumn()}
                </>
            ) : (
                 // Show placeholder only if not loading and no initial error
                 !isInitialLoading && !initialError && (
                    <div className="placeholder-message">
                        {t('astrologyForm.placeholderMessage')}
                    </div>
                 )
            )}
        </div>
    );
};

export default AstrologyForm;
