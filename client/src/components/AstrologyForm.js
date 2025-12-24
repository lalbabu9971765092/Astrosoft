    import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { useOutletContext } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { formatDosha } from './doshaFormatter';
import '../styles/AstrologyForm.css';
import '../styles/AstrologyFormContent.css';
import DiamondChart from './DiamondChart';
import {
    convertDMSToDegrees,
    convertToDMS,
    formatToLocalISOString,
    calculateNakshatraPada,
    calculateNakshatraDegree,
    calculateRashi as getRashiFromDegree,
    calculateNakshatra as getNakshatraFromDegree,
    getNakshatraLord,
    getRashiLord,
    getNaamAkshar,
    calculateVar,
    calculateHouse,
    PLANET_ORDER,
    PLANET_SYMBOLS,
    RASHIS,
} from './AstrologyUtils';
import api from './api';

// --- Helper Function to Format Time (Panchang) ---
const formatPanchangTime = (dateTimeString, t, i18n) => {
    if (dateTimeString === "Always Up" || dateTimeString === "Always Down") {
        return t(`sunMoonTimes.${dateTimeString.replace(' ', '')}`, dateTimeString);
    }
    if (!dateTimeString || typeof dateTimeString !== 'string') return t('utils.notAvailable', 'N/A');
    try {
        const date = new Date(dateTimeString);
        if (isNaN(date.getTime())) return t('utils.invalidTime', 'Invalid Time');
        const options = {
            hour: 'numeric',
            minute: '2-digit',
            hour12: true,
            timeZone: 'Asia/Kolkata'
        };
        const locale = (i18n && i18n.language) ? i18n.language : undefined;
        return date.toLocaleTimeString(locale, options);
    } catch (e) {
        console.error("Error formatting panchang time:", e);
        return t('utils.error', 'Error');
    }
};

const createChartHousesFromAscendant = (ascendantDms, t) => {
    if (!ascendantDms || typeof ascendantDms !== 'string') return null;
    const ascendantDeg = convertDMSToDegrees(ascendantDms);
    if (isNaN(ascendantDeg)) return null;
    const ascendantRashiName = getRashiFromDegree(ascendantDeg, t);
    const ascendantRashiIndex = RASHIS.indexOf(ascendantRashiName);
    if (ascendantRashiIndex === -1) return null;
    const housesArray = [];
    for (let i = 0; i < 12; i++) {
        const currentRashiIndex = (ascendantRashiIndex + i) % 12;
        const rashiStartDeg = currentRashiIndex * 30;
        housesArray.push({
            start_dms: convertToDMS(rashiStartDeg, t)
        });
    }
    return housesArray;
};

const AstrologyForm = () => {
    const { t, i18n } = useTranslation();
    const outletContext = useOutletContext() || {};
    const {
        mainResult,
        isLoading: isInitialLoading,
        error: initialError,
        calculationInputParams,
        adjustedBirthDateTimeString,
        adjustedGocharDateTimeString,
        locationForGocharTool,
        transitPlaceName,
    } = outletContext;

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
        birthChartYogas: true,
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
    const [currentDasha, setCurrentDasha] = useState(null);

    const toggleSection = (section) => {
        setOpenSections(prev => ({ ...prev, [section]: !prev[section] }));
    };

    // --- Effects ---
    useEffect(() => {
        if (!adjustedBirthDateTimeString || !calculationInputParams?.latitude || !calculationInputParams?.longitude || !calculationInputParams?.date) {
            if (rectifiedResult) setRectifiedResult(null);
            if (rectificationError) setRectificationError(null);
            return;
        }
        try {
            const originalDateStr = calculationInputParams.date;
            const adjustedDateStr = adjustedBirthDateTimeString;
            if (originalDateStr === adjustedDateStr) {
                if (rectifiedResult) {
                    setRectifiedResult(null);
                    setRectificationError(null);
                }
                return;
            }
            const originalDate = new Date(originalDateStr);
            const adjustedDate = new Date(adjustedDateStr);
            if (!isNaN(originalDate) && !isNaN(adjustedDate) && originalDate.getTime() === adjustedDate.getTime()) {
                if (rectifiedResult) {
                    setRectifiedResult(null);
                    setRectificationError(null);
                }
                return;
            }
        } catch (e) {
            console.error("Date comparison error during rectification check:", e);
        }
        setIsLoadingRectification(true);
        setRectificationError(null);
        const fetchRectifiedData = async () => {
            try {
                const dateForApi = formatToLocalISOString(new Date(adjustedBirthDateTimeString));
                if (!dateForApi) {
                    throw new Error(t('astrologyForm.rectificationInvalidDateConversion'));
                }
                const payload = {
                    date: dateForApi,
                    latitude: calculationInputParams.latitude,
                    longitude: calculationInputParams.longitude,
                    placeName: calculationInputParams.placeName,
                    lang: i18n.language
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
        const timerId = setTimeout(fetchRectifiedData, 300);
        return () => clearTimeout(timerId);
    }, [adjustedBirthDateTimeString, calculationInputParams, t, rectifiedResult, rectificationError, i18n.language]);

    useEffect(() => {
        if (locationForGocharTool?.lat !== null && locationForGocharTool?.lon !== null && adjustedGocharDateTimeString) {
            setIsLoadingGochar(true);
            setGocharError(null);
            const fetchGochar = async () => {
                try {
                    const dateForApi = formatToLocalISOString(new Date(adjustedGocharDateTimeString));
                    if (!dateForApi) {
                        throw new Error(t('astrologyForm.gocharInvalidDateConversion'));
                    }
                    const response = await api.post('/calculate', {
                        date: dateForApi,
                        latitude: locationForGocharTool.lat,
                        longitude: locationForGocharTool.lon,
                        placeName: transitPlaceName,
                        lang: i18n.language
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
            const timerId = setTimeout(fetchGochar, 300);
            return () => clearTimeout(timerId);
        } else {
            if (gocharData) setGocharData(null);
            if (isLoadingGochar) setIsLoadingGochar(false);
            if (gocharError) setGocharError(null);
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [adjustedGocharDateTimeString, locationForGocharTool, t, transitPlaceName]);
    const displayResult = rectifiedResult || mainResult;

    useEffect(() => {
        if (displayResult && displayResult.dashaPeriods) {
            const transitTime = adjustedGocharDateTimeString ? new Date(adjustedGocharDateTimeString) : new Date();
            const findCurrentPeriod = (periods, level) => {
                return periods.find(p => {
                    const start = new Date(p.start);
                    const end = new Date(p.end);
                    return p.level === level && transitTime >= start && transitTime <= end;
                });
            };

            const mahaDasha = findCurrentPeriod(displayResult.dashaPeriods, 1);
            if (mahaDasha) {
                const antardashas = displayResult.dashaPeriods.filter(p => p.level === 2 && p.mahaLord === mahaDasha.lord);
                const antarDasha = findCurrentPeriod(antardashas, 2);
                if (antarDasha) {
                    const pratyantardashas = displayResult.dashaPeriods.filter(p => p.level === 3 && p.mahaLord === mahaDasha.lord && p.antarLord === antarDasha.lord);
                    const pratyantarDasha = findCurrentPeriod(pratyantardashas, 3);
                    setCurrentDasha({ mahaDasha, antarDasha, pratyantarDasha });
                } else {
                    setCurrentDasha({ mahaDasha, antarDasha: null, pratyantarDasha: null });
                }
            } else {
                setCurrentDasha(null);
            }
        }
    }, [displayResult, adjustedGocharDateTimeString]);

    
    const displayInputParams = useMemo(() => {
        return rectifiedResult ? {
            ...(calculationInputParams || {}),
            date: adjustedBirthDateTimeString
        } : calculationInputParams;
    }, [rectifiedResult, calculationInputParams, adjustedBirthDateTimeString]);

    const bhavaPlanetPlacements = useMemo(() => {
        if (!displayResult?.planetaryPositions?.sidereal || !displayResult?.houses || displayResult.houses.length !== 12) {
            return null;
        }
        // Use the pre-calculated placements from the API if available.
        // This is the correct data source for a Bhava Chalit chart.
        return displayResult.planetHousePlacements || null;
    }, [displayResult]);

    const placidusCuspDegrees = useMemo(() => {
        if (!displayResult?.houses || !Array.isArray(displayResult.houses) || displayResult.houses.length !== 12) return [];
        const degrees = displayResult.houses.map(h => convertDMSToDegrees(h?.start_dms));
        if (degrees.some(isNaN)) {
            return [];
        }
        return degrees;
    }, [displayResult]);

    const formatDisplayDateTime = useCallback((localIsoString) => {
        if (!localIsoString || typeof localIsoString !== 'string') return t('utils.notAvailable', 'N/A');
        try {
            const dateObj = new Date(localIsoString);
            if (isNaN(dateObj.getTime())) {
                if (localIsoString.length === 16 && !localIsoString.includes(':', 14)) {
                    const dateObjWithSeconds = new Date(`${localIsoString}:00`);
                    if (isNaN(dateObjWithSeconds.getTime())) {
                        return t('utils.invalidDate', 'Invalid Date');
                    }
                    return dateObjWithSeconds.toLocaleString('en-GB');
                }
                return t('utils.invalidDate', 'Invalid Date');
            }
            return dateObj.toLocaleString('en-GB');
        } catch (e) {
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
    }, [t]);
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
        const gocharSolarMonthKey = gocharPanchang?.Masa?.name_en_IN; // Get English key
        const gocharAmantaMonthKey = gocharPanchang?.MoonMasa?.name_en_IN; // Get English key
        const gocharPurnimantaMonthKey = gocharPanchang?.PurnimantaMasa?.name_en_IN; // Get English key
        const gocharRituKey = gocharPanchang?.Ritu?.name_en_UK; // Get English key (from API response)
        const gocharSamvatsarKey = gocharData.panchang?.samvatsar;
        const gocharVikramSamvat = gocharData.panchang?.vikram_samvat;
         const gocharSakaYear = gocharData.panchang?.SakaYear;
        // Use the adjustedGocharDateTimeString (local ISO string) for Var calculation
        const { varName: gocharVarKey, dayLord: gocharDayLord } = calculateVar(adjustedGocharDateTimeString, t);

        if (!gocharAsc || !gocharMoon || !gocharPanchang) return <p className="info-text">{t('astrologyForm.transitIncompleteData')}</p>;

        const moonDeg = convertDMSToDegrees(gocharMoon?.dms);
        const moonRashiKey = getRashiFromDegree(moonDeg, t); // Returns English key (e.g., "Sagittarius")
        const moonNakshatraKey = gocharNakshatra?.name_en_IN ?? gocharMoon?.nakshatra; // Get English key
        const moonPada = calculateNakshatraPada(moonDeg, t);

        // Format Tithi with translation - Use name_en_IN as key for the name part
        const formattedGocharTithi = gocharTithi
            ? `${t(`pakshas.${gocharPakshaKey}`, { defaultValue: gocharPakshaKey })} ${gocharTithi.number || ''} (${t(`tithis.${gocharTithiNameKey}`, { defaultValue: gocharTithiNameKey || 'N/A' })})`
            : t('utils.notAvailable', 'N/A');

        return (
            <div className="gochar-details-content">
                {gocharData && gocharData.inputParameters && (
                    <div className="result-section input-summary">
                        <h4 className="result-sub-title">{t('astrologyForm.transitCalculatedForLabel', 'Calculated for')}</h4>
                        <p><strong>{t('astrologyForm.dateLabel')}</strong> {formatDisplayDateTime(gocharData.inputParameters.date)}</p>
                        <p><strong>{t('astrologyForm.coordsLabel')}</strong> {gocharData.inputParameters.latitude?.toFixed(4)}, {gocharData.inputParameters.longitude?.toFixed(4)}</p>
                        {(gocharData.inputParameters.placeName || gocharData.placeName) && <p><strong>{t('astrologyForm.placeLabel')}</strong> {gocharData.inputParameters.placeName || gocharData.placeName}</p>}
                    </div>
                 )}
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
                        <p className="result-text">{t('astrologyForm.solarMonthLabel')} {t(`hindiMonths.${gocharSolarMonthKey}`, { defaultValue: gocharSolarMonthKey ?? t('utils.notAvailable', 'N/A') })} ({gocharPanchang?.Masa?.solar_day})</p>
                        <p className="result-text">{t('astrologyForm.amantaLunarMonthLabel')} {t(`hindiMonths.${gocharAmantaMonthKey}`, { defaultValue: gocharAmantaMonthKey ?? t('utils.notAvailable', 'N/A') })}</p>
                        <p className="result-text">{t('astrologyForm.purnimantaLunarMonthLabel')} {t(`hindiMonths.${gocharPurnimantaMonthKey}`, { defaultValue: gocharPurnimantaMonthKey ?? t('utils.notAvailable', 'N/A') })}</p>
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
                            {t('astrologyForm.yogaLabel')} {t(`yogas.${gocharYogaKey}_name`, { defaultValue: gocharYogaKey ?? t('utils.notAvailable', 'N/A') })}
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
        const birthSolarMonthKey = birthPanchang?.Masa?.name_en_IN; // Get English key
        const birthAmantaMonthKey = birthPanchang?.MoonMasa?.name_en_IN; // Get English key
        const birthPurnimantaMonthKey = birthPanchang?.PurnimantaMasa?.name_en_IN; // Get English key
        const birthRituKey = birthPanchang?.Ritu?.name_en_UK; // Get English key (from API response)
        const birthSamvatsarKey = displayResult.panchang?.samvatsar;
        const birthVikramSamvat = displayResult.panchang?.vikram_samvat;
        // Use the displayInputParams.date (local ISO string) for Var calculation
        const birthSakaYear = displayResult.panchang?.SakaYear;
        const displayDate = displayInputParams?.date || '';
        const { varName: birthVarKey, dayLord: birthDayLord } = calculateVar(displayDate, t);

        const moonDeg = convertDMSToDegrees(moonSiderealData?.dms);
        const moonRashiKey = getRashiFromDegree(moonDeg, t); // Returns English key (e.g., "Sagittarius")
        const moonNakshatraKey = birthNakshatra?.name_en_IN ?? moonSiderealData?.nakshatra; // Get English key
        const moonPada = calculateNakshatraPada(moonDeg, t);
        const moonNakDegree = calculateNakshatraDegree(moonDeg);

        // Format Tithi with translation - Use name_en_IN as key for the name part
        const formattedBirthTithi = birthTithi
            ? `${t(`pakshas.${birthPakshaKey}`, { defaultValue: birthPakshaKey })} ${birthTithi.number || ''} (${t(`tithis.${birthTithiNameKey}`, { defaultValue: birthTithiNameKey || 'N/A' })})`
            : t('utils.notAvailable', 'N/A');

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
                                ` (${t('astrologyForm.nakshatraLabel')} ${t(`nakshatras.${displayResult.ascendant.nakshatra}`, { defaultValue: displayResult.ascendant.nakshatra })} ${t('astrologyForm.padaLabel')}${displayResult.ascendant.pada}${displayResult.ascendant.padaAlphabet ? ` (${t(`naamAksharas.${displayResult.ascendant.padaAlphabet}`, { defaultValue: displayResult.ascendant.padaAlphabet })})` : ''}, ${t('astrologyForm.lordLabel')} ${t(`planets.${displayResult.ascendant.nakLord}`, { defaultValue: displayResult.ascendant.nakLord })})`}
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
                {/* Birth Chart Yogas */}
                {displayResult.yogas && displayResult.yogas.length > 0 && (
                    <div className="result-section">
                        <div className="section-header" onClick={() => toggleSection('birthChartYogas')}>
                            <h3 className="result-sub-title">{t('astrologyForm.birthChartYogasTitle', 'Birth Chart Yogas')}</h3>
                            <button className="toggle-button">{openSections.birthChartYogas ? '−' : '+'}</button>
                        </div>
                        <div className={`section-content ${openSections.birthChartYogas ? '' : 'collapsed'}`}>
                            <ul className="yoga-names-list">
                                {displayResult.yogas.map((yoga, index) => (
                                    <li key={index}>{yoga.name}</li>
                                ))}
                            </ul>
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
                        <p className="result-text">{t('astrologyForm.mangalDoshaLabel')} {formatDosha('mangal', birthDoshas, t)}</p>
                        <p className="result-text">{t('astrologyForm.kaalsarpaDoshaLabel')} {formatDosha('kaalsarpa', birthDoshas, t)}</p>
                        <p className="result-text">{t('astrologyForm.moolDoshaLabel')} {formatDosha('mool', birthDoshas, t)}</p>
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
                        <p className="result-text">{t('astrologyForm.solarMonthLabel')} {t(`hindiMonths.${birthSolarMonthKey}`, { defaultValue: birthSolarMonthKey ?? t('utils.notAvailable', 'N/A') })} ({birthPanchang?.Masa?.solar_day})</p>
                        <p className="result-text">{t('astrologyForm.amantaLunarMonthLabel')} {t(`hindiMonths.${birthAmantaMonthKey}`, { defaultValue: birthAmantaMonthKey ?? t('utils.notAvailable', 'N/A') })}</p>
                        <p className="result-text">{t('astrologyForm.purnimantaLunarMonthLabel')} {t(`hindiMonths.${birthPurnimantaMonthKey}`, { defaultValue: birthPurnimantaMonthKey ?? t('utils.notAvailable', 'N/A') })}</p>
                        <p className="result-text">{t('astrologyForm.rituLabel')} {t(`ritus.${birthRituKey}`, { defaultValue: birthRituKey ?? t('utils.notAvailable', 'N/A') })}</p>
                        <p className="result-text">
                            {t('astrologyForm.tithiLabel')} {formattedBirthTithi}
                            {birthTithi?.start && birthTithi?.end && ` (${formatPanchangTime(birthTithi.start, t, i18n)} - ${formatPanchangTime(birthTithi.end, t, i18n)})`}
                        </p>
                        <p className="result-text">{t('astrologyForm.rashiMoLabel')} {t(`rashis.${moonRashiKey}`, { defaultValue: moonRashiKey ?? t('utils.notAvailable', 'N/A') })}</p>
                        <p className="result-text">
                            {t('astrologyForm.nakMoLabel')} {t(`nakshatras.${moonNakshatraKey}`, { defaultValue: moonNakshatraKey ?? t('utils.notAvailable', 'N/A') })}
                            {moonSiderealData?.nakLord && ` (${t('astrologyForm.lordLabel')} ${t(`planets.${moonSiderealData.nakLord}`, { defaultValue: moonSiderealData.nakLord })})`}
                            {moonPada !== 'N/A' ? ` (${t('astrologyForm.padaLabel')}${moonPada}${moonSiderealData.padaAlphabet ? ` (${t(`naamAksharas.${moonSiderealData.padaAlphabet}`, { defaultValue: moonSiderealData.padaAlphabet })})` : ''})` : ""}
                            {birthNakshatra?.start && birthNakshatra?.end && ` (${formatPanchangTime(birthNakshatra.start, t, i18n)} - ${formatPanchangTime(birthNakshatra.end, t, i18n)})`}
                        </p>
                        <p className="result-text">
                            {t('astrologyForm.nakDegLabel')} {convertToDMS(moonNakDegree, t)}
                        </p>
                        <p className="result-text">
                            {t('astrologyForm.yogaLabel')} {t(`yogas.${birthYogaKey}_name`, { defaultValue: birthYogaKey ?? t('utils.notAvailable', 'N/A') })}
                            {birthPanchang?.Yoga?.start && birthPanchang?.Yoga?.end && ` (${formatPanchangTime(birthPanchang.Yoga.start, t, i18n)} - ${formatPanchangTime(birthPanchang.Yoga.end, t, i18n)})`}
                        </p>
                        <p className="result-text">
                            {t('astrologyForm.karanLabel')} {t(`karans.${birthKaranaKey}`, { defaultValue: birthKaranaKey ?? t('utils.notAvailable', 'N/A') })}
                            {birthPanchang?.Karna?.start && birthPanchang?.Karna?.end && ` (${formatPanchangTime(birthPanchang.Karna.start, t, i18n)} - ${formatPanchangTime(birthPanchang.Karna.end, t, i18n)})`}
                        </p>
                        <p className="result-text">{t('astrologyForm.varLabel')} {t(`weekdays.${birthVarKey}`, { defaultValue: birthVarKey ?? t('utils.notAvailable', 'N/A') })}</p>
                    </div>
                </div>
                {/* Dasha Balance */}
                {displayResult.dashaBalance && (
                    <div className="result-section">
                        <div className="section-header" onClick={() => toggleSection('dashaBalance')}>
                            <h3 className="result-sub-title">{t('astrologyForm.dashaBalanceTitle')}</h3>
                            <button className="toggle-button">{openSections.dashaBalance ? '−' : '+'}</button>
                        </div>
                        <div className={`section-content ${openSections.dashaBalance ? '' : 'collapsed'}`}>
                            <p className="result-text">{t('astrologyForm.dashaLordLabel')} {t(`planets.${displayResult.dashaBalance.lord}`, { defaultValue: displayResult.dashaBalance.lord })}</p>
                            <p className="result-text">{t('astrologyForm.dashaBalanceLabel')} {displayResult.dashaBalance.balance_str}</p>
                        </div>
                    </div>
                )}
                {/* Current Dasha */}
                {currentDasha && (
                    <div className="result-section current-dasha-display">
                        <h4 className="result-sub-title">{t('astrologyForm.currentDashaTitle')}</h4>
                        <div className="dasha-level">
                            {currentDasha.mahaDasha && (
                                <p>
                                    <strong>{t('astrologyForm.mahaDashaLabel', 'Mahadasha:')}</strong>
                                    {` ${t(`planets.${currentDasha.mahaDasha.lord}`)} (${formatDisplayDateTime(currentDasha.mahaDasha.start)} - ${formatDisplayDateTime(currentDasha.mahaDasha.end)})`}
                                </p>
                            )}
                            {currentDasha.antarDasha && (
                                <p>
                                    <strong>{t('astrologyForm.antarDashaLabel', 'Antardasha:')}</strong>
                                    {` ${t(`planets.${currentDasha.antarDasha.lord}`)} (${formatDisplayDateTime(currentDasha.antarDasha.start)} - ${formatDisplayDateTime(currentDasha.antarDasha.end)})`}
                                </p>
                            )}
                            {currentDasha.pratyantarDasha && (
                                <p>
                                    <strong>{t('astrologyForm.pratyantarDashaLabel', 'Pratyantar dasha:')}</strong>
                                    {` ${t(`planets.${currentDasha.pratyantarDasha.lord}`)} (${formatDisplayDateTime(currentDasha.pratyantarDasha.start)} - ${formatDisplayDateTime(currentDasha.pratyantarDasha.end)})`}
                                </p>
                            )}
                        </div>
                    </div>
                )}
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
                                                <>
                                                    <h3 className='chart-title'>{t('astrologyForm.chartD1Title')}</h3>
                                                    <DiamondChart
                                                        title={t('astrologyForm.chartD1Title')}
                                                        houses={displayResult.houses}
                                                        planets={displayResult.planetaryPositions.sidereal}
                                                        chartType="lagna" size={400}
                                                    />
                                                </>
                                            ) : <div className="chart-placeholder">{t('astrologyForm.chartPlaceholderD1')}</div>}
                                        </div>
                                        <div className="chart-cell">
                                            {canRenderBhavaChart ? (
                                                <>
                                                    <h3 className='chart-title'>{t('astrologyForm.chartBhavaTitle')}</h3>
                                                    <DiamondChart
                                                        title={t('astrologyForm.chartBhavaTitle')}
                                                        houses={displayResult.houses}
                                                        planetHousePlacements={bhavaPlanetPlacements}
                                                        chartType="bhava" size={400} // Pass the calculated placements
                                                    />
                                                </>
                                            ) : <div className="chart-placeholder">{t('astrologyForm.chartPlaceholderBhava')}</div>}
                                        </div>
                                        {/* Bottom Row */}
                                        <div className="chart-cell">
                                            {hasD9Data && d9Houses ? (
                                                <>
                                                    <h3 className='chart-title'>{t('astrologyForm.chartD9Title')}</h3>
                                                    <DiamondChart
                                                        title={t('astrologyForm.chartD9Title')}
                                                        houses={d9Houses}
                                                        planets={displayResult.d9_planets}
                                                        chartType="d9" size={400}
                                                    />
                                                </>
                                            ) : <div className="chart-placeholder">{t('astrologyForm.chartPlaceholderD9')}</div>}
                                        </div>
                                        <div className="chart-cell">
                                             {isLoadingGochar ? (
                                                <div className="chart-placeholder">{t('astrologyForm.chartPlaceholderLoadingGochar')}</div>
                                             ) : hasGocharData && gocharHouses ? (
                                                <>
                                                    <h3 className='chart-title'>{t('astrologyForm.chartGocharTitle')}</h3>
                                                    <DiamondChart
                                                        title={t('astrologyForm.chartGocharTitle')}
                                                        houses={gocharHouses}
                                                        planets={gocharData.planetaryPositions.sidereal}
                                                        chartType="gochar" size={400}
                                                    />
                                                </>
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
                                            <th>{t('astrologyForm.houseTableMeanCuspHeader')}</th><th>{t('astrologyForm.houseTableNakHeader')}</th>
                                            <th>{t('astrologyForm.houseTablePadaHeader')}</th><th>{t('astrologyForm.houseTableNakLordHeader')}</th>
                                            <th>{t('astrologyForm.houseTableRashiHeader')}</th><th>{t('astrologyForm.houseTableRashiLordHeader')}</th>
                                            <th>{t('astrologyForm.houseTableSubLordHeader')}</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {displayResult.houses.map((house) => {
                                            const cuspDegree = convertDMSToDegrees(house.start_dms);
                                            const nakshatra = getNakshatraFromDegree(cuspDegree, t);
                                            const pada = calculateNakshatraPada(cuspDegree, t);
                                            const nakshatraLord = getNakshatraLord(nakshatra, t);
                                            const rashi = getRashiFromDegree(cuspDegree, t);
                                            const rashiLord = getRashiLord(rashi, t);
                                            const naamAkshar = getNaamAkshar(nakshatra, pada, t); // Calculate Naam Akshar
                                             // Check if naamAkshar is the translated 'N/A' string before trying to translate it again
                                            const displayNaamAkshar = naamAkshar === t('utils.notAvailable', 'N/A')
                                                ? naamAkshar
                                                : t(`naamAksharas.${naamAkshar}`, { defaultValue: naamAkshar });
                                           return (
                                                <tr key={house.house_number}>
                                                    <td>{house.house_number ?? t('utils.notAvailable', 'N/A')}</td><td>{house.start_dms ?? t('utils.notAvailable', 'N/A')}</td>
                                                    <td>{house.mean_dms ?? t('utils.notAvailable', 'N/A')}</td>
                                                    <td>{t(`nakshatras.${nakshatra}`, { defaultValue: nakshatra ?? t('utils.notAvailable', 'N/A') })}</td>
                                                    <td>{`${pada ?? t('utils.notAvailable', 'N/A')} (${displayNaamAkshar})`}</td>
                                                   <td>{t(`planets.${nakshatraLord}`, { defaultValue: nakshatraLord ?? t('utils.notAvailable', 'N/A') })}</td>
                                                    <td>{t(`rashis.${rashi}`, { defaultValue: rashi ?? t('utils.notAvailable', 'N/A') })}</td>
                                                    <td>{t(`planets.${rashiLord}`, { defaultValue: rashiLord ?? t('utils.notAvailable', 'N/A') })}</td>
                                                    <td>{t(`planets.${house.start_sub_lord}`, { defaultValue: house.start_sub_lord ?? t('utils.notAvailable', 'N/A') })}</td>
                                                </tr>
                                            );
                                        })}</tbody>
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
                                    </thead><tbody>
                                        {PLANET_ORDER.map((body) => {
                                            const planetData = displayResult.planetaryPositions.sidereal[body];
                                            if (!planetData) return null;
                                            const siderealDeg = convertDMSToDegrees(planetData.dms);
                                            if (isNaN(siderealDeg) || planetData.dms === "Error") {
                                                return (<tr key={body}><td>{PLANET_SYMBOLS[body] || body}</td><td colSpan="9">{t('astrologyForm.planetDataError')}</td></tr>);
                                            }
                                            const pada = planetData.pada ?? calculateNakshatraPada(siderealDeg, t);
                                            const degreeWithinNakshatra = convertToDMS(calculateNakshatraDegree(siderealDeg), t);
                                           const rashiKey = planetData.rashi ?? getRashiFromDegree(siderealDeg, t);
                                            // *** FIX: Use placidusCuspDegrees to calculate the house, matching the Bhava Chalit chart ***
                                            const house = calculateHouse(siderealDeg, placidusCuspDegrees, t);
                                           
                                            const nakshatraKey = planetData.nakshatra; // Get English key
                                            const nakLordKey = planetData.nakLord; // Get English key
                                            const subLordKey = planetData.subLord; // Get English key
                                            const subSubLordKey = planetData.subSubLord; // Get English key
                                            const rashiLordKey = planetData.rashiLord; // Get English key

                                            return (
                                                <tr key={body}>
                                                    <td>{t(`planetsShort.${body}`, { defaultValue: PLANET_SYMBOLS[body] || body })}</td><td>{planetData.dms ?? t('utils.notAvailable', 'N/A')}</td>
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
                                        })}</tbody>
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
                                                <th>{t('astrologyForm.houseTableMeanCuspHeader')}</th><th>{t('astrologyForm.houseTableNakHeader')}</th>
                                                <th>{t('astrologyForm.houseTablePadaHeader')}</th><th>{t('astrologyForm.houseTableNakLordHeader')}</th>
                                                <th>{t('astrologyForm.houseTableRashiHeader')}</th><th>{t('astrologyForm.houseTableRashiLordHeader')}</th>
                                                <th>{t('astrologyForm.houseTableSubLordHeader')}</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {gocharData.houses.map((house) => {
                                                const cuspDegree = convertDMSToDegrees(house.start_dms);
                                                const nakshatra = getNakshatraFromDegree(cuspDegree, t);
                                                const pada = calculateNakshatraPada(cuspDegree, t);
                                                const nakshatraLord = getNakshatraLord(nakshatra, t);
                                                const rashi = getRashiFromDegree(cuspDegree, t);
                                                const rashiLord = getRashiLord(rashi, t);
                                                const naamAkshar = getNaamAkshar(nakshatra, pada, t); // Calculate Naam Akshar
                                               // Check if naamAkshar is the translated 'N/A' string before trying to translate it again
                                                const displayNaamAkshar = naamAkshar === t('utils.notAvailable', 'N/A')
                                                    ? naamAkshar
                                                    : t(`naamAksharas.${naamAkshar}`, { defaultValue: naamAkshar });
                                               return (
                                                    <tr key={house.house_number}>
                                                        <td>{house.house_number ?? t('utils.notAvailable', 'N/A')}</td><td>{house.start_dms ?? t('utils.notAvailable', 'N/A')}</td>
                                                        <td>{house.mean_dms ?? t('utils.notAvailable', 'N/A')}</td>
                                                        <td>{t(`nakshatras.${nakshatra}`, { defaultValue: nakshatra ?? t('utils.notAvailable', 'N/A') })}</td>
                                                       <td>{`${pada ?? t('utils.notAvailable', 'N/A')} (${displayNaamAkshar})`}</td>
                                                        <td>{t(`planets.${nakshatraLord}`, { defaultValue: nakshatraLord ?? t('utils.notAvailable', 'N/A') })}</td>
                                                        <td>{t(`rashis.${rashi}`, { defaultValue: rashi ?? t('utils.notAvailable', 'N/A') })}</td>
                                                        <td>{t(`planets.${rashiLord}`, { defaultValue: rashiLord ?? t('utils.notAvailable', 'N/A') })}</td>
                                                        <td>{t(`planets.${house.start_sub_lord}`, { defaultValue: house.start_sub_lord ?? t('utils.notAvailable', 'N/A') })}</td>
                                                    </tr>
                                                );
                                            })}</tbody>
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
                                        </thead><tbody>
                                            {PLANET_ORDER.map((body) => {
                                                const planetData = gocharData.planetaryPositions.sidereal[body];
                                                if (!planetData) return null;
                                                const siderealDeg = convertDMSToDegrees(planetData.dms);
                                                if (isNaN(siderealDeg) || planetData.dms === "Error") {
                                                    return (<tr key={body}><td>{PLANET_SYMBOLS[body] || body}</td><td colSpan="9">{t('astrologyForm.planetDataError')}</td></tr>);
                                                }
                                                const pada = planetData.pada ?? calculateNakshatraPada(siderealDeg, t);
                                                const degreeWithinNakshatra = convertToDMS(calculateNakshatraDegree(siderealDeg), t);
                                                const rashiKey = planetData.rashi ?? getRashiFromDegree(siderealDeg, t);
                                                const house = calculateHouse(siderealDeg, gocharData.houses.map(h => convertDMSToDegrees(h.start_dms)), t);
                                                const nakshatraKey = planetData.nakshatra;
                                                const nakLordKey = planetData.nakLord;
                                                const subLordKey = planetData.subLord;
                                                const subSubLordKey = planetData.subSubLord;
                                                const rashiLordKey = planetData.rashiLord;

                                                return (
                                                    <tr key={body}>
                                                        <td>{t(`planetsShort.${body}`, { defaultValue: PLANET_SYMBOLS[body] || body })}</td><td>{planetData.dms ?? t('utils.notAvailable', 'N/A')}</td>
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
                                            })}</tbody>
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
            {(displayResult || gocharData) ? (
                <>
                    {renderLeftColumn()}
                    {renderRightColumn()}
                </>
            ) : (
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
