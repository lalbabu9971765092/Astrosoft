// src/FestivalsPage.jsx
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useOutletContext } from 'react-router-dom';
import { useTranslation } from 'react-i18next'; // Import the hook
import api from './api'; // Assuming api.js is set up for base URL etc.
import '../styles/FestivalsPage.css';

// Use keys for mapping, translation will happen via i18next
// These keys now represent Lunar (Chandra) Masa names as used by MhahPanchang's MoonMasa property
const HINDI_MONTH_KEYS = [
    "Chaitra", "Baisakha", "Jyestha", "Asadha",
    "Srabana", "Bhadraba", "Aswina", "Karttika",
    "Margasira", "Pausa", "Magha", "Phalguna",
];

const FETCH_DEBOUNCE_DELAY = 500; // ms

// Define a fallback translation key (add this to your JSON files)
const FALLBACK_UNKNOWN_KEY = 'utils.unknown'; // e.g., "Unknown" in en, "अज्ञात" in hi

const FestivalsPage = () => {
    // Get t function and i18n instance
    const { t, i18n } = useTranslation();
    // Get location context from the main layout
    const { calculationInputParams } = useOutletContext() || {};

    const currentYear = useMemo(() => new Date().getFullYear(), []);
    const [selectedYear, setSelectedYear] = useState(String(currentYear));
    const [yearForFetching, setYearForFetching] = useState(currentYear);

    // States for data, loading, and errors
    const [sankrantiData, setSankrantiData] = useState([]);
    const [isLoadingSankranti, setIsLoadingSankranti] = useState(false);
    const [sankrantiError, setSankrantiError] = useState(null);

    const [calculatedTithiFestivals, setCalculatedTithiFestivals] = useState([]);
    const [isLoadingTithiFestivals, setIsLoadingTithiFestivals] = useState(false);
    const [tithiFestivalError, setTithiFestivalError] = useState(null);

    const [eclipseData, setEclipseData] = useState([]);
    const [isLoadingEclipses, setIsLoadingEclipses] = useState(false);
    const [isEclipseButtonActive, setIsEclipseButtonActive] = useState(true);
    const [eclipseError, setEclipseError] = useState(null);

    const [recurringTithiResults, setRecurringTithiResults] = useState(null); // { dates: [], tithiLabel: 'Translated Label' }
    const [activeTithiButton, setActiveTithiButton] = useState(11); // Track which recurring tithi button is active
    const [isLoadingRecurringTithis, setIsLoadingRecurringTithis] = useState(false);
    const [recurringTithiError, setRecurringTithiError] = useState(null);

    // States for Tithi Finder
    const [tithiSearchYear, setTithiSearchYear] = useState(String(currentYear));
    const [targetHindiMonth, setTargetHindiMonth] = useState(''); // Store the key ('Chaitra', etc.) or '' for all, now refers to Lunar Month
    const [targetTithi, setTargetTithi] = useState('1'); // Tithi number as string
    const [targetPaksha, setTargetPaksha] = useState('Shukla'); // Store the key ('Shukla' or 'Krishna')
    const [tithiDates, setTithiDates] = useState([]);
    const [isLoadingTithiDates, setIsLoadingTithiDates] = useState(false);
    const [tithiDateError, setTithiDateError] = useState(null);

    // --- Clear Results Helpers ---
    const clearSankrantiResults = useCallback(() => { setSankrantiData([]); setSankrantiError(null); }, []);
    const clearTithiFestivalResults = useCallback(() => { setCalculatedTithiFestivals([]); setTithiFestivalError(null); }, []);
    const clearEclipseResults = useCallback(() => { setEclipseData([]); setEclipseError(null); }, []);
    const clearRecurringTithiResults = useCallback(() => { setRecurringTithiResults(null); setRecurringTithiError(null); }, []);
    const clearManualTithiResults = useCallback(() => { setTithiDates([]); setTithiDateError(null); }, []);

    // --- Helper to generate translation key from festival name ---
    const getFestivalTranslationKey = useCallback((name) => {
        if (!name) return 'unknown'; // Handle null/undefined names

        let key = name.toLowerCase();

        // Remove content in parentheses (e.g., "(Holika Dahan...)")
        key = key.replace(/\s*\(.*\)\s*/g, '').trim();

        // Remove content after slash (e.g., "/ Lakshmi Puja")
        key = key.split('/')[0].trim();

        // Replace spaces and hyphens with underscores
        key = key.replace(/[\s-]+/g, '_');

        // Remove any remaining non-alphanumeric characters (except underscore)
        // Consider if this is needed or too aggressive
        // key = key.replace(/[^a-z0-9_]/g, '');

        // Specific known mappings if the generated key doesn't match JSON
        // Add more specific mappings here if needed based on your JSON keys
        if (key === 'vijayadashami') key = 'dussehra';
        if (key === 'sharad_navratri_start') key = 'navaratri_start'; // Map to the key used in JSON
        if (key === 'chaitra_navratri_start') key = 'navaratri_start'; // Also map Chaitra Navratri if needed
        if (key === 'narak_chaturdashi') key = 'choti_diwali'; // Example mapping
        if (key === 'diwali') key = 'diwali_lakshmi_puja'; // Example if JSON uses a more specific key
        if (key === 'buddha_purnima') key = 'vaisakha_purnima'; // Example mapping

        return key || 'unknown'; // Return 'unknown' if processing results in empty string
    }, []); // No dependencies needed if it only uses the name argument


    // --- Fetch Sankranti Data ---
    const fetchSankranti = useCallback(async (year) => {
        const yearNum = parseInt(year, 10);
        if (!yearNum || isNaN(yearNum) || yearNum < 1900 || yearNum > 2100) {
            setSankrantiError(t('festivalsPage.errorValidYear'));
            setSankrantiData([]);
            return;
        }
        clearSankrantiResults();
        setIsLoadingSankranti(true);
        try {
            const response = await api.get(`/general/sankranti/${yearNum}`);
            const data = response.data || [];
            setSankrantiData(data);
            if (data.length === 0) {
                setSankrantiError(t('festivalsPage.errorNoSankrantiData', { year: yearNum }));
            }
        } catch (err) {
            console.error("Error fetching Sankranti data:", err);
            const backendError = err.response?.data?.error || err.message;
            setSankrantiError(backendError || t('festivalsPage.errorFetchSankranti'));
        } finally {
            setIsLoadingSankranti(false);
        }
    }, [clearSankrantiResults, t]); // Add t dependency

    // --- Fetch Calculated Tithi-based festivals ---
    const fetchCalculatedTithiFestivals = useCallback(async (year) => {
        const yearNum = parseInt(year, 10);
         if (!yearNum || isNaN(yearNum) || yearNum < 1900 || yearNum > 2100) {
            setTithiFestivalError(t('festivalsPage.errorValidYear'));
            setCalculatedTithiFestivals([]);
            return;
        }
        clearTithiFestivalResults();
        setIsLoadingTithiFestivals(true);

        const lat = calculationInputParams?.latitude;
        const lon = calculationInputParams?.longitude;
        const params = {};
        if (lat !== undefined && lon !== undefined) {
            params.lat = lat;
            params.lon = lon;
        }

        try {
            const response = await api.get(`/general/tithi-festivals/${yearNum}`, { params });
            const data = response.data || [];
            setCalculatedTithiFestivals(data);
             if (data.length === 0) {
                setTithiFestivalError(t('festivalsPage.errorNoTithiFestivalsData', { year: yearNum }));
            }
        } catch (err) {
            console.error("Error fetching calculated tithi festivals:", err);
            const backendError = err.response?.data?.error || err.message;
            setTithiFestivalError(backendError || t('festivalsPage.errorFetchTithiFestivals'));
        } finally {
            setIsLoadingTithiFestivals(false);
        }
    }, [clearTithiFestivalResults, t, calculationInputParams]); // Add t and calculationInputParams dependency

    // --- Fetch Eclipse Data ---
    const fetchEclipses = useCallback(async (year) => {
        const yearNum = parseInt(year, 10);
        if (!yearNum || isNaN(yearNum) || yearNum < 1900 || yearNum > 2100) {
            setEclipseError(t('festivalsPage.errorValidYear'));
            setEclipseData([]);
            return;
        }
        clearEclipseResults();
        setIsLoadingEclipses(true);
        try {
            // Eclipses require location, so we need to get it from the context
            // If not available, the backend will use default coordinates.
            const lat = calculationInputParams?.latitude;
            const lon = calculationInputParams?.longitude;

            const params = {};
            if (lat !== undefined && lon !== undefined) {
                params.lat = lat;
                params.lon = lon;
            }

            const response = await api.get(`/general/eclipses/${yearNum}`, {
                params
            });

            const data = response.data || [];
            setEclipseData(data);
            if (data.length === 0) {
                setEclipseError(t('festivalsPage.errorNoEclipseData', { year: yearNum }));
            }
        } catch (err) {
            console.error("Error fetching eclipse data:", err);
            const backendError = err.response?.data?.error || err.message;
            setEclipseError(backendError || t('festivalsPage.errorFetchEclipses'));
        } finally {
            setIsLoadingEclipses(false);
        }
    }, [clearEclipseResults, t, calculationInputParams]); // Add calculationInputParams dependency

    // --- Function to fetch Recurring Tithis (Ekadashi, etc.) ---
    const findRecurringTithis = useCallback(async (year, tithiNumber) => {
        setActiveTithiButton(tithiNumber); // Set the active button
        const yearNum = parseInt(year, 10);
        if (!yearNum || isNaN(yearNum) || yearNum < 1900 || yearNum > 2100) {
            setRecurringTithiError(t('festivalsPage.errorValidYear'));
            setRecurringTithiResults(null);
            return;
        }
        clearRecurringTithiResults();
        setIsLoadingRecurringTithis(true);

        // Determine the translated label for the tithi being fetched
        let tithiLabelKey;
        if (tithiNumber === 11) tithiLabelKey = 'festivalsPage.ekadashiButton';
        else if (tithiNumber === 13) tithiLabelKey = 'festivalsPage.trayodashiButton';
        else if (tithiNumber === 14) tithiLabelKey = 'festivalsPage.chaturdashiButton';
        else tithiLabelKey = `Tithi ${tithiNumber}`; // Fallback, consider translating if more numbers needed

        const translatedTithiLabel = t(tithiLabelKey); // Translate the label

        const lat = calculationInputParams?.latitude;
        const lon = calculationInputParams?.longitude;
        const params = {};
        if (lat !== undefined && lon !== undefined) {
            params.lat = lat;
            params.lon = lon;
        }

        try {
            const response = await api.get(`/general/find-tithis/${yearNum}/${tithiNumber}`, { params });
            const data = response.data || {};
            // Store the translated label along with the fetched dates
            setRecurringTithiResults({ dates: data.dates || [], tithiLabel: translatedTithiLabel });
            if (!data.dates || data.dates.length === 0) {
                setRecurringTithiError(t('festivalsPage.errorNoRecurringTithiData', { tithiLabel: translatedTithiLabel, year: yearNum }));
            }
        } catch (err) {
            console.error(`Error fetching recurring Tithi ${tithiNumber}:`, err);
            const backendError = err.response?.data?.error || err.message;
            setRecurringTithiError(backendError || t('festivalsPage.errorFetchRecurringTithi', { tithiLabel: translatedTithiLabel }));
        } finally {
            setIsLoadingRecurringTithis(false);
        }
    }, [clearRecurringTithiResults, t, calculationInputParams]); // Add t and calculationInputParams dependency

    // --- Function to find specific Tithi dates (Manual Finder) ---
    const findTithiDates = useCallback(async () => {
        const searchYearNum = parseInt(tithiSearchYear, 10);
        const tithiNum = parseInt(targetTithi, 10);
        const hindiMonthKey = targetHindiMonth || null; // Use the key ('Chaitra', etc.) or null

        // Validate inputs using translated error messages
        if (isNaN(searchYearNum) || searchYearNum < 1900 || searchYearNum > 2100) { setTithiDateError(t('festivalsPage.errorTithiFinderValidYear')); setTithiDates([]); return; }
        if (isNaN(tithiNum) || tithiNum < 1 || tithiNum > 15) { setTithiDateError(t('festivalsPage.errorTithiFinderTithiNum')); setTithiDates([]); return; }
        if (targetPaksha !== 'Shukla' && targetPaksha !== 'Krishna') { setTithiDateError(t('festivalsPage.errorTithiFinderPaksha')); setTithiDates([]); return; } // Should not happen with select, but good practice

        clearManualTithiResults();
        setIsLoadingTithiDates(true);

        const lat = calculationInputParams?.latitude;
        const lon = calculationInputParams?.longitude;

        try {
            // Prepare parameters for the API call
            const params = { year: searchYearNum, tithi: tithiNum, paksha: targetPaksha };
            if (lat !== undefined && lon !== undefined) {
                params.lat = lat;
                params.lon = lon;
            }
            if (hindiMonthKey) { params.hindiMonth = hindiMonthKey; } // Send the key if a month is selected

            const response = await api.get(`/general/find-tithi-date`, { params });
            const data = response.data || {};
            const foundDates = data.dates || [];
            setTithiDates(foundDates);

             if (foundDates.length === 0) {
                const monthName = hindiMonthKey ? t(`hindiMonths.${hindiMonthKey}`) : undefined;
                const errorKey = monthName
                    ? 'festivalsPage.errorTithiFinderNoDatesWithMonth'
                    : 'festivalsPage.errorTithiFinderNoDates';

                // Translate error message with details
                setTithiDateError(t(errorKey, {
                    tithi: tithiNum,
                    paksha: t(`festivalsPage.tithiFinderPaksha${targetPaksha}`), // Translate paksha name
                    month: monthName, // Translate month name if selected
                    year: searchYearNum
                }));
            }
        } catch (err) {
            console.error("Error finding tithi dates:", err);
            const backendError = err.response?.data?.error || err.response?.data?.message || err.message;
            setTithiDateError(backendError || t('festivalsPage.errorTithiFinderFetch'));
            setTithiDates([]); // Clear dates on error
        } finally {
            setIsLoadingTithiDates(false);
        }
    }, [tithiSearchYear, targetHindiMonth, targetTithi, targetPaksha, clearManualTithiResults, t, calculationInputParams]); // Add t and calculationInputParams dependency

    // --- Debounce Effect for Main Year Input ---
    useEffect(() => {
        const handler = setTimeout(() => {
            const yearNum = parseInt(selectedYear, 10);
            // Basic validation before setting the year for fetching
            if (!isNaN(yearNum) && yearNum >= 1900 && yearNum <= 2100) {
                setYearForFetching(yearNum);
            } else if (selectedYear !== '' && (yearNum < 1900 || yearNum > 2100)) {
                // Optionally show a temporary validation message near the input if desired
                console.warn("Year out of typical range (1900-2100)");
            }
        }, FETCH_DEBOUNCE_DELAY);
        return () => clearTimeout(handler); // Cleanup timeout on unmount or change
    }, [selectedYear]);

    // --- Effect to Fetch Data When yearForFetching Changes ---
    useEffect(() => {
        if (yearForFetching) {
            // When the main year changes, fetch non-location-dependent data.
            fetchSankranti(yearForFetching);
            fetchCalculatedTithiFestivals(yearForFetching);
            // Optionally fetch a default recurring tithi (e.g., Ekadashi) for the new year
            findRecurringTithis(yearForFetching, 11); // Fetch Ekadashi by default
        }
    }, [yearForFetching, fetchSankranti, fetchCalculatedTithiFestivals, findRecurringTithis]);

    // --- Effect to Fetch Eclipses when year OR location changes ---
    useEffect(() => {
        if (yearForFetching) {
            fetchEclipses(yearForFetching);
        }
        // This effect runs when the year changes, or when fetchEclipses changes (due to location change).
    }, [yearForFetching, fetchEclipses]);

    // --- Effect to trigger initial Tithi Finder search on component mount ---
    useEffect(() => {
        findTithiDates();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []); // Empty dependency array ensures this runs only once on mount

    // --- Input Handlers ---
    const handleYearChange = (event) => { setSelectedYear(event.target.value); };
    const handleTithiYearChange = (event) => { setTithiSearchYear(event.target.value); };
    const handleHindiMonthChange = (event) => { setTargetHindiMonth(event.target.value); }; // Value is the key ('Chaitra', '')
    const handleTithiNumChange = (event) => { setTargetTithi(event.target.value); };
    const handlePakshaChange = (event) => { setTargetPaksha(event.target.value); }; // Value is the key ('Shukla', 'Krishna')
    // Allow Enter key press in Tithi Finder inputs to trigger search
    const handleTithiKeyPress = (event) => { if (event.key === 'Enter') { findTithiDates(); } };

    // --- Formatting Helpers (Using i18next for locale and placeholders) ---
    const formatDateForDisplay = useCallback((dateString) => {
        if (!dateString) return t('festivalsPage.notAvailable'); // Use translated N/A
        try {
            // Attempt to handle both date-only and datetime strings more robustly
            const date = new Date(dateString.includes('T') ? dateString : dateString + 'T00:00:00Z'); // Assume UTC if only date
            if (isNaN(date.getTime())) return t('festivalsPage.invalidDate'); // Use translated placeholder

            // Use Intl.DateTimeFormat via toLocaleDateString for better locale support
            const options = { year: 'numeric', month: 'long', day: 'numeric', timeZone: 'UTC' }; // Display date part in UTC
            
            const dayIndex = date.getUTCDay();
            const englishDays = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
            const hindiDays = ["रविवार", "सोमवार", "मंगलवार", "बुधवार", "गुरुवार", "शुक्रवार", "शनिवार"];
            
            let dayName;
            if (i18n.language === 'hi') {
                dayName = hindiDays[dayIndex];
            } else {
                dayName = englishDays[dayIndex];
            }

            return `${date.toLocaleDateString(i18n.language, options)} (${dayName})`; // Use current language locale
        } catch (error) {
            console.error("Error formatting date:", dateString, error);
            return t('festivalsPage.invalidDate');
        }
    }, [t, i18n.language]); // Add t and i18n.language dependency

    const formatDateTimeForDisplay = useCallback((dateTimeString) => {
        if (!dateTimeString) return t('festivalsPage.notAvailable');
        try {
            const date = new Date(dateTimeString);
            if (isNaN(date.getTime())) return t('festivalsPage.invalidTime');

            // Use Intl.DateTimeFormat via toLocaleTimeString
            // Explicitly set IST for consistency as requested. Consider making this configurable later.
            const options = { hour: 'numeric', minute: '2-digit', hour12: true, timeZone: 'Asia/Kolkata' };
            const timeString = date.toLocaleTimeString(i18n.language, options); // Use current language locale

            // Append translated IST suffix if needed, or handle timezone display differently
            // return `${timeString} ${t('festivalsPage.timeSuffixIST', 'IST')}`; // Example if suffix needed
            return timeString; // Return just the formatted time in IST

        } catch (error) {
            console.error("Error formatting date/time:", dateTimeString, error);
            return t('festivalsPage.invalidTime');
        }
    }, [t, i18n.language]); // Add t and i18n.language dependency

    // Specific formatter for Sankranti moment which might be approx or already formatted
    const formatSankrantiMoment = useCallback((momentString) => {
        if (!momentString) return t('festivalsPage.notAvailable');
        // If the string already contains indicators like Approx, IST, UTC, or time components, return as is.
        if (/\b(Approx|IST|UTC)\b|\d{1,2}:\d{2}/i.test(momentString)) {
             // Use translation for the suffix if it exists
             if (momentString.includes('(Approx. Ingress Date)')) {
                 return momentString.replace('(Approx. Ingress Date)', t('festivalsPage.sankrantiApproxSuffix'));
             }
             return momentString; // Assume pre-formatted or special case
        }
        // Otherwise, assume it's a date/time string needing formatting (likely approx date)
        const formattedDateTime = formatDateTimeForDisplay(momentString);
        if (formattedDateTime !== t('festivalsPage.invalidTime') && formattedDateTime !== t('festivalsPage.notAvailable')) {
            // Append translated approx suffix if it was just a date formatted as time
             return `${formattedDateTime} ${t('festivalsPage.sankrantiApproxSuffix')}`;
        }
        // Fallback if formatting failed
        return t('festivalsPage.notAvailable');
    }, [formatDateTimeForDisplay, t]); // Add t dependency

    // --- Memoized Heading for Tithi Finder Results ---
    const tithiResultsHeading = useMemo(() => {
        // Only generate heading if we have results or are loading them
        if (isLoadingTithiDates || tithiDates.length > 0) {
            const hindiMonthName = targetHindiMonth ? t(`hindiMonths.${targetHindiMonth}`) : undefined; // Translate month name
            const pakshaName = t(`festivalsPage.tithiFinderPaksha${targetPaksha}`); // Translate paksha name

            const translationKey = hindiMonthName
                ? 'festivalsPage.tithiFinderResultsTitleWithMonth'
                : 'festivalsPage.tithiFinderResultsTitle';

            return t(translationKey, {
                tithi: targetTithi,
                paksha: pakshaName,
                month: hindiMonthName,
                year: tithiSearchYear || '...'
            });
        }
        return null; // No heading if no search initiated or no results/error
    }, [targetTithi, targetPaksha, targetHindiMonth, tithiSearchYear, tithiDates, isLoadingTithiDates, t]); // Add dependencies

    // Combined loading state for disabling main year input
    const isMainLoading = isLoadingSankranti || isLoadingTithiFestivals || isLoadingEclipses || isLoadingRecurringTithis;
    // Determine which recurring tithi button is currently loading
    const loadingRecurringTithiLabel = isLoadingRecurringTithis ? recurringTithiResults?.tithiLabel : null;

    return (
        <div className="festivals-page">
            {/* Page Title */}
            <h1>{t('festivalsPage.pageTitle')}</h1>

            {/* --- Year Selection and Main Action Buttons --- */}
            <div className="main-controls-container centered-controls">
                <h2 className="result-title">{t('festivalsPage.mainControlsTitle')}</h2>
                <div className="controls-group year-control-group">
                    <label htmlFor="main-year-input">{t('festivalsPage.yearLabel')} </label>
                    <input
                        type="number"
                        id="main-year-input"
                        value={selectedYear}
                        onChange={handleYearChange}
                        min="1900"
                        max="2100"
                        placeholder={t('festivalsPage.yearPlaceholder')}
                        disabled={isMainLoading} // Disable input while any main data is loading
                        className="year-input"
                    />
                    {/* Optional: Add a small loading indicator near the input if isMainLoading */}
                </div>
                {/* Action buttons to trigger data fetching */}
                <div className="action-buttons-group">
                     <button
                        onClick={() => fetchSankranti(yearForFetching)}
                        disabled={isLoadingSankranti || !yearForFetching}
                        title={t('festivalsPage.refreshSankrantiTitle', { year: yearForFetching })}
                        className="action-button sankranti-button"
                    >
                        {isLoadingSankranti ? t('festivalsPage.loadingButton') : t('festivalsPage.sankrantiButton')}
                    </button>
                    <button
                        onClick={() => fetchCalculatedTithiFestivals(yearForFetching)}
                        disabled={isLoadingTithiFestivals || !yearForFetching}
                        title={t('festivalsPage.refreshTithiFestivalsTitle', { year: yearForFetching })}
                         className="action-button tithi-festival-button"
                    >
                        {isLoadingTithiFestivals ? t('festivalsPage.loadingButton') : t('festivalsPage.tithiFestivalsButton')}
                    </button>
                    <button
                        onClick={() => setIsEclipseButtonActive(!isEclipseButtonActive)}
                        disabled={isLoadingEclipses || !yearForFetching}
                        title={t('festivalsPage.showEclipsesTitle', { year: yearForFetching })}
                        className={`action-button eclipse-button ${isEclipseButtonActive ? 'active' : ''}`}
                    >
                        {isLoadingEclipses ? t('festivalsPage.loadingButton') : t('festivalsPage.eclipsesButton')}
                    </button>
                    {/* Buttons for recurring tithis */}
                    <button
                        onClick={() => findRecurringTithis(yearForFetching, 11)} // Ekadashi
                        disabled={isLoadingRecurringTithis || !yearForFetching}
                        title={t('festivalsPage.showEkadashiTitle', { year: yearForFetching })}
                        className={`action-button recurring-tithi-button ${activeTithiButton === 11 ? 'active' : ''}`}
                    >
                        {loadingRecurringTithiLabel === t('festivalsPage.ekadashiButton') ? t('festivalsPage.loadingButton') : t('festivalsPage.ekadashiButton')}
                    </button>
                    <button
                        onClick={() => findRecurringTithis(yearForFetching, 13)} // Trayodashi
                        disabled={isLoadingRecurringTithis || !yearForFetching}
                        title={t('festivalsPage.showTrayodashiTitle', { year: yearForFetching })}
                        className={`action-button recurring-tithi-button ${activeTithiButton === 13 ? 'active' : ''}`}
                    >
                        {loadingRecurringTithiLabel === t('festivalsPage.trayodashiButton') ? t('festivalsPage.loadingButton') : t('festivalsPage.trayodashiButton')}
                    </button>
                    <button
                        onClick={() => findRecurringTithis(yearForFetching, 14)} // Chaturdashi
                        disabled={isLoadingRecurringTithis || !yearForFetching}
                        title={t('festivalsPage.showChaturdashiTitle', { year: yearForFetching })}
                        className={`action-button recurring-tithi-button ${activeTithiButton === 14 ? 'active' : ''}`}
                    >
                        {loadingRecurringTithiLabel === t('festivalsPage.chaturdashiButton') ? t('festivalsPage.loadingButton') : t('festivalsPage.chaturdashiButton')}
                    </button>
                </div>
                {/* Location Display */}
                {calculationInputParams && (
                    <div className="location-display">
                        {t('festivalsPage.locationLabel', 'Location:')}
                        <strong>
                            {` ${calculationInputParams.placeName || 'N/A'} (${calculationInputParams.latitude?.toFixed(4)}, ${calculationInputParams.longitude?.toFixed(4)})`}
                        </strong>
                    </div>
                )}
            </div>

            {/* --- Three Column Layout for Results --- */}
            <div className="results-grid-container">

                {/* --- Column 1: Sankranti & Eclipses --- */}
                <div className="results-column sankranti-column">
                    <h2 className="result-title">{t('festivalsPage.sankrantiColumnTitle', { year: yearForFetching || '...' })}</h2>
                    {isLoadingSankranti && <div className="loader">{t('festivalsPage.sankrantiLoading')}</div>}
                    {sankrantiError && <p className="error-text">{sankrantiError}</p>}
                    {!isLoadingSankranti && !sankrantiError && sankrantiData.length > 0 && (
                        <div className="table-container">
                            <table className="results-table">
                                <thead><tr>
                                    <th>{t('festivalsPage.sankrantiHeaderName')}</th>
                                    <th>{t('festivalsPage.sankrantiHeaderDate')}</th>
                                    <th>{t('festivalsPage.sankrantiHeaderMoment')}</th>
                                </tr></thead>
                                <tbody>
                                    {sankrantiData.map((sankranti, index) => (
                                        <tr key={sankranti.rashi || `sankranti-${index}-${sankranti.date}`}>
                                            <td>
                                                {t(`festivalsPage.sankrantiNames.${sankranti.rashi}`, {
                                                    defaultValue: sankranti.name || t(FALLBACK_UNKNOWN_KEY)
                                                })}
                                            </td>
                                            <td>{formatDateForDisplay(sankranti.date)}</td>
                                            <td>{formatSankrantiMoment(sankranti.moment || sankranti.date)}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                    {!isLoadingSankranti && !sankrantiError && sankrantiData.length === 0 && (
                        <p className="info-text">{t('festivalsPage.sankrantiNoData')}</p>
                    )}

                    {/* --- Eclipses Display --- */}
                    <div className="eclipses-section" style={{ marginTop: '2rem' }}>
                        <h2 className="result-title">{t('festivalsPage.eclipsesColumnTitle', { year: yearForFetching || '...' })}</h2>
                        {isLoadingEclipses && <div className="loader">{t('festivalsPage.eclipsesLoading')}</div>}
                        {eclipseError && <p className="error-text">{eclipseError}</p>}
                        {!isLoadingEclipses && !eclipseError && eclipseData.length > 0 && (
                            <div className="table-container">
                                <table className="results-table">
                                    <thead><tr>
                                        <th>{t('festivalsPage.eclipseHeaderType')}</th>
                                        <th>{t('festivalsPage.eclipseHeaderNature')}</th>
                                        <th>{t('festivalsPage.eclipseHeaderDate')}</th>
                                        <th>{t('festivalsPage.eclipseHeaderPeakTime')}</th>
                                        <th>{t('festivalsPage.eclipseHeaderStartTime')}</th>
                                        <th>{t('festivalsPage.eclipseHeaderEndTime')}</th>
                                        <th>{t('festivalsPage.eclipseHeaderMagnitude')}</th>
                                    </tr></thead>
                                    <tbody>
                                        {eclipseData.map((eclipse, index) => (
                                            <tr key={`eclipse-${index}-${eclipse.date}`}>
                                                <td>{t(`festivalsPage.eclipseTypes.${eclipse.type}`, {
                                                    defaultValue: eclipse.type || t(FALLBACK_UNKNOWN_KEY)
                                                })}</td>
                                                <td>{t(`festivalsPage.eclipseNatures.${eclipse.nature}`, {
                                                    defaultValue: eclipse.nature || t(FALLBACK_UNKNOWN_KEY)
                                                })}</td>
                                                <td>{formatDateForDisplay(eclipse.date)}</td>
                                                <td>{formatDateTimeForDisplay(eclipse.peakTime)}</td>
                                                <td>{formatDateTimeForDisplay(eclipse.startTime)}</td>
                                                <td>{formatDateTimeForDisplay(eclipse.endTime)}</td>
                                                <td>{eclipse.magnitude}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                        {!isLoadingEclipses && !eclipseError && eclipseData.length === 0 && (
                            <p className="info-text">{t('festivalsPage.eclipsesNoData')}</p>
                        )}
                    </div>
                </div>

                {/* --- Column 2: Calculated Tithi-Based Festivals --- */}
                <div className="results-column tithi-festivals-column">
                    <h2 className="result-title">{t('festivalsPage.tithiFestivalsColumnTitle', { year: yearForFetching || '...' })}</h2>
                    {isLoadingTithiFestivals && <div className="loader">{t('festivalsPage.tithiFestivalsLoading')}</div>}
                    {tithiFestivalError && <p className="error-text">{tithiFestivalError}</p>}
                    {!isLoadingTithiFestivals && !tithiFestivalError && calculatedTithiFestivals.length > 0 && (
                        <div className="table-container">
                            <table className="results-table">
                                <thead><tr>
                                    <th>{t('festivalsPage.tithiFestivalsHeaderFestival')}</th>
                                    <th>{t('festivalsPage.tithiFestivalsHeaderDate')}</th>
                                    <th>{t('festivalsPage.tithiFestivalsHeaderSunrise')}</th>
                                    <th>{t('festivalsPage.tithiFestivalsHeaderStart')}</th>
                                    <th>{t('festivalsPage.tithiFestivalsHeaderEnd')}</th>
                                </tr></thead>
                                <tbody>
                                    {calculatedTithiFestivals.map((festival, index) => {
                                        const translationKey = getFestivalTranslationKey(festival.name);
                                        return (
                                            <tr key={`${translationKey}-${index}-${festival.date}`}>
                                                <td>
                                                    {t(`festivalsPage.festivalNames.${translationKey}`, {
                                                        defaultValue: festival.name || t(FALLBACK_UNKNOWN_KEY)
                                                    })}
                                                </td>
                                                <td>{formatDateForDisplay(festival.date)}</td>
                                                <td>{formatDateTimeForDisplay(festival.sunrise)}</td>
                                                <td>{formatDateTimeForDisplay(festival.startTime)}</td>
                                                <td>{formatDateTimeForDisplay(festival.endTime)}</td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    )}
                    {!isLoadingTithiFestivals && !tithiFestivalError && calculatedTithiFestivals.length === 0 && (
                        <p className="info-text">{t('festivalsPage.tithiFestivalsNoData')}</p>
                    )}
                </div>

                {/* --- Column 3: Recurring Tithis & Tithi Finder --- */}
                <div className="results-column combined-column">
                    {/* --- Recurring Tithis Display --- */}
                    <div className="recurring-tithis-section">
                        <h2 className="result-title">
                            {t('festivalsPage.recurringTithisColumnTitle', {
                                tithiLabel: recurringTithiResults?.tithiLabel || t('festivalsPage.recurringTithisDefaultTitle'),
                                year: yearForFetching || '...'
                            })}
                        </h2>
                        {isLoadingRecurringTithis && <div className="loader">{t('festivalsPage.recurringTithisLoading')}</div>}
                        {recurringTithiError && <p className="error-text">{recurringTithiError}</p>}
                        {!isLoadingRecurringTithis && !recurringTithiError && recurringTithiResults?.dates?.length > 0 && (
                            <>
                                {recurringTithiResults.tithiLabel === t('festivalsPage.trayodashiButton') && (
                                    <p className="info-text note">{t('festivalsPage.pradoshNote')}</p>
                                )}
                                <div className="table-container">
                                    <table className="results-table">
                                        <thead><tr>
                                            <th>{t('festivalsPage.recurringTithisHeaderDate')}</th>
                                            <th>{t('festivalsPage.recurringTithisHeaderPaksha')}</th>
                                            <th>{t('festivalsPage.recurringTithisHeaderSunrise')}</th>
                                            <th>{t('festivalsPage.recurringTithisHeaderStart')}</th>
                                            <th>{t('festivalsPage.recurringTithisHeaderEnd')}</th>
                                        </tr></thead>
                                        <tbody>
                                            {recurringTithiResults.dates.map((tithiDate, index) => (
                                                <tr key={`recurring-${index}-${tithiDate.date}`}>
                                                    <td>{formatDateForDisplay(tithiDate.date)}</td>
                                                    <td>{t(`festivalsPage.tithiFinderPaksha${tithiDate.paksha}`, { defaultValue: tithiDate.paksha }) }</td>
                                                    <td>{formatDateTimeForDisplay(tithiDate.sunrise)}</td>
                                                    <td>{formatDateTimeForDisplay(tithiDate.startTime)}</td>
                                                    <td>{formatDateTimeForDisplay(tithiDate.endTime)}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </>
                        )}
                        {!isLoadingRecurringTithis && !recurringTithiError && (!recurringTithiResults?.dates || recurringTithiResults.dates.length === 0) && (
                            <p className="info-text">{t('festivalsPage.recurringTithisNoData')}</p>
                        )}
                    </div>

                    {/* --- Tithi Date Finder (Manual Specific Search) --- */}
                    <div className="tithi-finder-section" style={{ marginTop: '2rem' }}>
                        <h2 className="result-title">{t('festivalsPage.tithiFinderColumnTitle')}</h2>
                        <div className="tithi-finder-controls">
                            <label htmlFor="tithi-year-input">{t('festivalsPage.yearLabel')} </label>
                            <input type="number" id="tithi-year-input" value={tithiSearchYear} onChange={handleTithiYearChange} onKeyPress={handleTithiKeyPress} min="1900" max="2100" placeholder={t('festivalsPage.yearPlaceholder')} disabled={isLoadingTithiDates} className="year-input" />

                            <label htmlFor="hindi-month-select">{t('festivalsPage.tithiFinderMonthLabel')} </label>
                            <select id="hindi-month-select" value={targetHindiMonth} onChange={handleHindiMonthChange} onKeyPress={handleTithiKeyPress} disabled={isLoadingTithiDates}>
                                <option value="">{t('festivalsPage.tithiFinderAllMonthsOption')}</option>
                                {HINDI_MONTH_KEYS.map(monthKey => (
                                    <option key={monthKey} value={monthKey}>{t(`hindiMonths.${monthKey}`, { defaultValue: monthKey })}</option>
                                ))}
                            </select>

                            <label htmlFor="tithi-num-input">{t('festivalsPage.tithiFinderTithiLabel')} </label>
                            <input type="number" id="tithi-num-input" value={targetTithi} onChange={handleTithiNumChange} onKeyPress={handleTithiKeyPress} min="1" max="15" placeholder={t('festivalsPage.tithiFinderTithiPlaceholder')} disabled={isLoadingTithiDates} />

                            <label htmlFor="paksha-select">{t('festivalsPage.tithiFinderPakshaLabel')} </label>
                            <select id="paksha-select" value={targetPaksha} onChange={handlePakshaChange} onKeyPress={handleTithiKeyPress} disabled={isLoadingTithiDates}>
                                <option value="Shukla">{t('festivalsPage.tithiFinderPakshaShukla')}</option>
                                <option value="Krishna">{t('festivalsPage.tithiFinderPakshaKrishna')}</option>
                            </select>

                            <button onClick={findTithiDates} disabled={isLoadingTithiDates}>
                                {isLoadingTithiDates ? t('festivalsPage.tithiFinderSearchingButton') : t('festivalsPage.tithiFinderFindButton')}
                            </button>
                        </div>

                        {tithiDateError && <p className="error-text">{tithiDateError}</p>}
                        <div className="tithi-results-section">
                            {isLoadingTithiDates && <div className="loader">{t('festivalsPage.tithiFinderSearchingButton')}</div>}
                            {!isLoadingTithiDates && !tithiDateError && tithiDates.length > 0 && (
                                <>
                                    {tithiResultsHeading && <h4 className="result-sub-title">{tithiResultsHeading}:</h4>}
                                    <div className="table-container">
                                        <table className="results-table">
                                            <thead><tr>
                                                <th>{t('festivalsPage.tithiFinderResultsHeaderDate')}</th>
                                                <th>{t('festivalsPage.tithiFinderResultsHeaderSunrise')}</th>
                                                <th>{t('festivalsPage.tithiFinderResultsHeaderStart')}</th>
                                                <th>{t('festivalsPage.tithiFinderResultsHeaderEnd')}</th>
                                            </tr></thead>
                                            <tbody>
                                                {tithiDates.map((tithiInfo, index) => (
                                                    <tr key={`specific-tithi-row-${index}-${tithiInfo.date}`}>
                                                        <td>{formatDateForDisplay(tithiInfo.date)}</td>
                                                        <td>{formatDateTimeForDisplay(tithiInfo.sunrise)}</td>
                                                        <td>{formatDateTimeForDisplay(tithiInfo.startTime)}</td>
                                                        <td>{formatDateTimeForDisplay(tithiInfo.endTime)}</td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </>
                            )}
                            {!isLoadingTithiDates && !tithiDateError && tithiDates.length === 0 && (
                                <p className="info-text">{t('festivalsPage.tithiFinderNoResults')}</p>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default FestivalsPage;
