// client/src/components/PrintableReport.js
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import api from './api';
import DiamondChart from './DiamondChart';
import CustomDetailedPlanetTable from './CustomDetailedPlanetTable'; // Changed import
import KpSignificatorGrid from './KpSignificatorGrid';
import ExpandedDashaTable from './ExpandedDashaTable';

import AshtakavargaReport from './AshtakavargaReport';


import VarshphalReport from './VarshphalReport';
import GaneshaImage from '../assets/images/ganesha.png';
import '../styles/PrintableReport.css'; // Import the print-specific CSS

import { useTranslation } from 'react-i18next';
import { formatDosha } from './doshaFormatter';
import {
    convertDMSToDegrees,
    calculateNakshatraPada,
    calculateRashi as getRashiFromDegree,
    calculateVar,
    createChartHousesFromAscendant, // Added import
    PLANET_ORDER, // Imported PLANET_ORDER
    getRashiLord, // Added import
    getNakshatraLord, // Added import
    calculateRashi, // Added for house cusp calculations
    calculateNakshatra, // Added for house cusp calculations
} from './AstrologyUtils';


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
            timeZone: 'Asia/Kolkata' // Assuming a default for printing
        };
        const locale = (i18n && i18n.language) ? i18n.language : undefined;
        return date.toLocaleTimeString(locale, options);
    } catch (e) {
        console.error("Error formatting panchang time:", e);
        return t('utils.error', 'Error');
    }
};

const formatDisplayDateTime = (localIsoString, t, i18n) => {
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
};

const interpretUPBS = (score, t) => {
        if (score >= 12) return t('upbsInterpretation.highlyBenefic');
        if (score >= 5) return t('upbsInterpretation.benefic');
        if (score >= 0) return t('upbsInterpretation.mildBenefic');
        if (score >= -4) return t('upbsInterpretation.mildMalefic');
        if (score >= -10) return t('upbsInterpretation.malefic');
        return t('upbsInterpretation.highlyMalefic'); // Score -11 to -20
    };


const PrintableReport = ({ calculationInputParams, varshphalYear, setIsPrinting }) => {
    const [mainResult, setMainResult] = useState(null);
    const [mainError, setMainError] = useState(null); // Re-added mainError
    const [kpResult, setKpResult] = useState(null);
    const [varshphalResult, setVarshphalResult] = useState(null);
    const [kpError, setKpError] = useState(null);
    const [varshphalError, setVarshphalError] = useState(null);
    // New state for Transit data
    const [transitResult, setTransitResult] = useState(null);
    const [transitError, setTransitError] = useState(null);
    // Combined loading state for initial fetch
    const [isLoading, setIsLoading] = useState(true); 
    const { t, i18n } = useTranslation();

    // --- Derived data for rendering ---
    const displayResult = mainResult; // No rectification for now in printable report

    const displayInputParams = calculationInputParams;

    // --- Calculate Shadbala Ranks ---
    const shadbalaRanks = useMemo(() => {
        if (!displayResult?.planetDetails?.shadbala || typeof displayResult.planetDetails.shadbala !== 'object') {
            return {};
        }
        const shadbalaData = displayResult.planetDetails.shadbala;
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
    }, [displayResult?.planetDetails?.shadbala]);



    // --- Derived state for current Dasha ---
    const findCurrentDasha = useCallback((dashaPeriods, targetDate) => {
        if (!dashaPeriods) return null;
        const transitTime = new Date(targetDate);

        const findPeriod = (periods, level, parentLord) => {
            return periods.find(p => {
                const start = new Date(p.start);
                const end = new Date(p.end);
                const isParentMatch = (level === 1) || (level === 2 && p.mahaLord === parentLord) || (level === 3 && p.antarLord === parentLord);
                return p.level === level && isParentMatch && transitTime >= start && transitTime <= end;
            });
        };

        const mahaDasha = findPeriod(dashaPeriods, 1);
        if (mahaDasha) {
            const antarDasha = findPeriod(dashaPeriods, 2, mahaDasha.lord);
            if (antarDasha) {
                const pratyantarDasha = findPeriod(dashaPeriods, 3, antarDasha.lord);
                return { mahaDasha, antarDasha, pratyantarDasha };
            }
            return { mahaDasha, antarDasha: null, pratyantarDasha: null };
        }
        return null;
    }, []);

    useEffect(() => {
        const fetchPrintData = async () => {
            setIsLoading(true);
            setMainError(null);
            setKpError(null);
            setVarshphalError(null);
            setTransitError(null); // Reset transit error
            try {
                const varshphalPayload = {
                    natalDate: calculationInputParams.date,
                    natalLatitude: calculationInputParams.latitude,
                    natalLongitude: calculationInputParams.longitude,
                    natalPlaceName: calculationInputParams.placeName,
                    varshphalYear: varshphalYear
                };

                // Payload for transit, using current date but natal location
                const transitPayload = {
                    date: new Date().toISOString(),
                    latitude: calculationInputParams.latitude,
                    longitude: calculationInputParams.longitude,
                    placeName: calculationInputParams.placeName,
                };

                const [mainResponse, kpResponse, varshphalResponse, transitResponse] = await Promise.all([
                    api.post('/calculate', calculationInputParams).catch(err => ({ error: err })),
                    api.post('/kp-significators', calculationInputParams).catch(err => ({ error: err })),
                    api.post('/calculate-varshphal', varshphalPayload).catch(err => ({ error: err })),
                    api.post('/calculate', transitPayload).catch(err => ({ error: err })) // Fetch transit data
                ]);

                if (mainResponse.error) setMainError(mainResponse.error.response?.data?.error || mainResponse.error.message || 'Failed to fetch main chart data.');
                else setMainResult(mainResponse.data);

                if (kpResponse.error) setKpError(kpResponse.error.response?.data?.error || kpResponse.error.message || 'Failed to fetch KP significators data.');
                else setKpResult(kpResponse.data);

                if (varshphalResponse.error) setVarshphalError(varshphalResponse.error.response?.data?.error || varshphalResponse.error.message || 'Failed to fetch Varshphal data.');
                else setVarshphalResult(varshphalResponse.data);

                if (transitResponse.error) setTransitError(transitResponse.error.response?.data?.error || transitResponse.error.message || 'Failed to fetch transit chart data.');
                else setTransitResult(transitResponse.data);
               
            } catch (error) {
                console.error('Error fetching print data:', error);
                setMainError('An unexpected error occurred while fetching print data.');
            } finally {
                setIsLoading(false);
            }
        };

        fetchPrintData();
    }, [calculationInputParams, varshphalYear]);

    useEffect(() => {
        if (!isLoading && !mainError && !kpError && !varshphalError && !transitError && mainResult && kpResult && varshphalResult && transitResult) {
            window.print();
            setIsPrinting(false);
        } else if (!isLoading && (mainError || kpError || varshphalError || transitError)) {
            // If there's an error and loading is complete, stop printing and maybe show an alert
            alert('Could not generate full print report due to errors. Please check console for details.');
            setIsPrinting(false);
        }
    }, [isLoading, mainResult, kpResult, varshphalResult, transitResult, mainError, kpError, varshphalError, transitError, setIsPrinting, displayInputParams]);

    if (isLoading) {
        return <div>Loading print data...</div>;
    }

    if (mainError || kpError || varshphalError || transitError) {
        return (
            <div>
                <h2>Error Generating Print Report</h2>
                {mainError && <p>Main Chart Error: {mainError}</p>}
                {kpError && <p>KP Significators Error: {kpError}</p>}
                {varshphalError && <p>Varshphal Error: {varshphalError}</p>}
                {transitError && <p>Transit Chart Error: {transitError}</p>}
                <button onClick={() => setIsPrinting(false)}>Close Print View</button>
            </div>
        );
    }


    const birthSunMoonTimes = displayResult?.sunMoonTimes;
    const birthPanchang = displayResult?.panchang;
    const birthDoshas = displayResult?.doshas;
    const moonSiderealData = displayResult?.planetaryPositions?.sidereal?.Moon;

    const birthTithi = birthPanchang?.Tithi;
    const birthTithiNameKey = birthTithi?.name_en_IN;
    const birthPakshaKey = birthPanchang?.Paksha?.name_en_IN;
    const birthNakshatra = birthPanchang?.Nakshatra;
    const birthYogaKey = birthPanchang?.Yoga?.name_en_IN;
    const birthKaranaKey = birthPanchang?.Karna?.name_en_IN;
    const birthSolarMonthKey = birthPanchang?.Masa?.name_en_IN;
    const birthAmantaMonthKey = birthPanchang?.MoonMasa?.name_en_IN;
    const birthPurnimantaMonthKey = birthPanchang?.PurnimantaMasa?.name_en_IN;
    const birthRituKey = birthPanchang?.Ritu?.name_en_UK;
    const birthSamvatsarKey = displayResult?.panchang?.samvatsar;
    const birthVikramSamvat = displayResult?.panchang?.vikram_samvat;
    const birthSakaYear = displayResult?.panchang?.SakaYear;
    const displayDate = displayInputParams?.date || '';
    const { varName: birthVarKey, dayLord: birthDayLord } = calculateVar(displayDate, t);

    const moonDeg = convertDMSToDegrees(moonSiderealData?.dms);
    const moonRashiKey = getRashiFromDegree(moonDeg, t);
    const moonNakshatraKey = birthNakshatra?.name_en_IN ?? moonSiderealData?.nakshatra;
    const moonPada = calculateNakshatraPada(moonDeg, t);

    const formattedBirthTithi = birthTithi
        ? `${t(`pakshas.${birthPakshaKey}`, { defaultValue: birthPakshaKey })} ${birthTithi.number || ''} (${t(`tithis.${birthTithiNameKey}`, { defaultValue: birthTithiNameKey || 'N/A' })})`
        : t('utils.notAvailable', 'N/A');

    // Define columns for the two tables for vertical split
    const COLUMNS_TABLE_1 = [
        'planet', 'position', 'nakPada', 'nakLord', 'subLord', 'subSub', 'nakDeg', 'rashi', 'rashiLord', 'bhava'
    ];
    const COLUMNS_TABLE_2 = [
        'planet', 'dignity', 'balaadi', 'jagradadi', 'deeptaadi', 'speed', 'retrograde', 'combust'
    ];


    return (
        <div>
            {mainResult && (
                <>
                    <div style={{ textAlign: 'center', marginBottom: '20px' }}>
                        <img src={GaneshaImage} alt="Lord Ganesha" style={{ maxWidth: '100px', height: 'auto' }} />
                        <p style={{ fontFamily: 'sans-serif', fontSize: '1.2em', margin: '10px 0' }}>श्री गणेशाय नमः</p>
                        {displayInputParams?.name && <h1 style={{ margin: '5px 0' }}>{displayInputParams.name}</h1>}
                    </div>

                    {/* 1. Name, Sex, Date & Time, Place with Coordinates */}
                    {displayInputParams && (
                        <div className="report-section input-summary">
                            <h3>Basic Input Parameters</h3>
                            {displayInputParams.name && <p><strong>Name:</strong> {displayInputParams.name}</p>}
                            {displayInputParams.gender && <p><strong>Gender:</strong> {displayInputParams.gender}</p>}
                            <p><strong>Date & Time:</strong> {formatDisplayDateTime(displayInputParams.date, t, i18n)}</p>
                            <p><strong>Place:</strong> {displayInputParams.placeName}</p>
                            <p><strong>Coordinates:</strong> {displayInputParams.latitude.toFixed(4)}, {displayInputParams.longitude.toFixed(4)}</p>
                        </div>
                    )}

                    {/* 2. Basic Info */}
                    <div className="report-section">
                        <h3>{t('astrologyForm.basicInfoTitle')}</h3>
                        <p>
                            {t('Birth Ascendant')} {displayResult.ascendant?.sidereal_dms ?? t('utils.notAvailable', 'N/A')}
                            {displayResult.ascendant?.rashi &&
                                ` (${t(`rashis.${displayResult.ascendant.rashi}`, { defaultValue: displayResult.ascendant.rashi })} - ${t(`planets.${displayResult.ascendant.rashiLord}`, { defaultValue: displayResult.ascendant.rashiLord })})`}
                        </p>
                        <p>
                            {t('Birth Ascendant Detail')}
                            {displayResult.ascendant?.rashi &&
                                ` (${t('astrologyForm.nakshatraLabel')} ${t(`nakshatras.${displayResult.ascendant.nakshatra}`, { defaultValue: displayResult.ascendant.nakshatra })} ${t('astrologyForm.padaLabel')}${displayResult.ascendant.pada}${displayResult.ascendant.padaAlphabet ? ` (${t(`naamAksharas.${displayResult.ascendant.padaAlphabet}`, { defaultValue: displayResult.ascendant.padaAlphabet })})` : ''}, ${t('astrologyForm.lordLabel')} ${t(`planets.${displayResult.ascendant.nakLord}`, { defaultValue: displayResult.ascendant.nakLord })})`}
                        </p>
                        {displayResult.badhakDetails && !displayResult.badhakDetails.error && (
                            <p>
                                <strong>{t('astrologyForm.badhakTitle', 'Badhak:')}</strong>
                                {` ${t('astrologyForm.badhakHouseLabel', 'House')} ${displayResult.badhakDetails.badhakHouse} `}
                                {`(${t(`rashis.${displayResult.badhakDetails.badhakSign}`, { defaultValue: displayResult.badhakDetails.badhakSign })}, `}
                                {`${t('astrologyForm.lordLabel')} ${t(`planets.${displayResult.badhakDetails.badhakesh}`, { defaultValue: displayResult.badhakDetails.badhakesh })})`}
                            </p>
                        )}
                        {birthSunMoonTimes && (
                            <>
                                <p>{t('astrologyForm.sunriseLabel')} {formatPanchangTime(birthSunMoonTimes.sunrise, t, i18n) ?? t('utils.notAvailable', 'N/A')}</p>
                                <p>{t('astrologyForm.sunsetLabel')} {formatPanchangTime(birthSunMoonTimes.sunset, t, i18n) ?? t('utils.notAvailable', 'N/A')}</p>
                                <p>{t('astrologyForm.moonriseLabel')} {formatPanchangTime(birthSunMoonTimes.moonrise, t, i18n) ?? t('utils.notAvailable', 'N/A')}</p>
                                <p>{t('astrologyForm.moonsetLabel')} {formatPanchangTime(birthSunMoonTimes.moonset, t, i18n) ?? t('utils.notAvailable', 'N/A')}</p>
                            </>
                        )}
                    </div>

                    {/* 3. Birth Panchang */}
                    <div className="report-section">
                        <h3>{t('astrologyForm.birthPanchangaTitle')}</h3>
                        <p>{t('astrologyForm.samvatsarLabel')} {t(`samvatsaras.${birthSamvatsarKey}`, { defaultValue: birthSamvatsarKey ?? t('utils.notAvailable', 'N/A') })}</p>
                        <p>{t('astrologyForm.vikramSamvatLabel')} {birthVikramSamvat ?? t('utils.notAvailable', 'N/A')}</p>
                        <p>{t('astrologyForm.sakaYearLabel')} {birthSakaYear ?? t('utils.notAvailable', 'N/A')}</p>
                        <p>{t('astrologyForm.solarMonthLabel')} {t(`hindiMonths.${birthSolarMonthKey}`, { defaultValue: birthSolarMonthKey ?? t('utils.notAvailable', 'N/A') })} ({birthPanchang?.Masa?.solar_day})</p>
                        <p>{t('astrologyForm.amantaLunarMonthLabel')} {t(`hindiMonths.${birthAmantaMonthKey}`, { defaultValue: birthAmantaMonthKey ?? t('utils.notAvailable', 'N/A') })}</p>
                        <p>{t('astrologyForm.purnimantaLunarMonthLabel')} {t(`hindiMonths.${birthPurnimantaMonthKey}`, { defaultValue: birthPurnimantaMonthKey ?? t('utils.notAvailable', 'N/A') })}</p>
                        <p>{t('astrologyForm.rituLabel')} {t(`ritus.${birthRituKey}`, { defaultValue: birthRituKey ?? t('utils.notAvailable', 'N/A') })}</p>
                        <p>
                            {t('astrologyForm.tithiLabel')} {formattedBirthTithi}
                            {birthTithi?.start && birthTithi?.end && ` (${formatPanchangTime(birthTithi.start, t, i18n)} - ${formatPanchangTime(birthTithi.end, t, i18n)})`}
                        </p>
                        <p>{t('astrologyForm.rashiMoLabel')} {t(`rashis.${moonRashiKey}`, { defaultValue: moonRashiKey ?? t('utils.notAvailable', 'N/A') })}</p>
                        <p>
                            {t('astrologyForm.nakMoLabel')} {t(`nakshatras.${moonNakshatraKey}`, { defaultValue: moonNakshatraKey ?? t('utils.notAvailable', 'N/A') })}
                            {moonSiderealData?.nakLord && ` (${t('astrologyForm.lordLabel')} ${t(`planets.${moonSiderealData.nakLord}`, { defaultValue: moonSiderealData.nakLord })})`}
                            {moonPada !== 'N/A' ? ` (${t('astrologyForm.padaLabel')}${moonPada}${moonSiderealData?.padaAlphabet ? ` (${t(`naamAksharas.${moonSiderealData.padaAlphabet}`, { defaultValue: moonSiderealData.padaAlphabet })})` : ''})` : ""}
                            {birthNakshatra?.start && birthNakshatra?.end && ` (${formatPanchangTime(birthNakshatra.start, t, i18n)} - ${formatPanchangTime(birthNakshatra.end, t, i18n)})`}
                        </p>
                        <p>
                            {t('astrologyForm.yogaLabel')} {t(`yogas.${birthYogaKey}.name`, { defaultValue: birthYogaKey ?? t('utils.notAvailable', 'N/A') })}
                            {birthPanchang?.Yoga?.start && birthPanchang?.Yoga?.end && ` (${formatPanchangTime(birthPanchang.Yoga.start, t, i18n)} - ${formatPanchangTime(birthPanchang.Yoga.end, t, i18n)})`}
                        </p>
                        <p>
                            {t('astrologyForm.karanLabel')} {t(`karans.${birthKaranaKey}`, { defaultValue: birthKaranaKey ?? t('utils.notAvailable', 'N/A') })}
                            {birthPanchang?.Karna?.start && birthPanchang?.Karna?.end && ` (${formatPanchangTime(birthPanchang.Karna.start, t, i18n)} - ${formatPanchangTime(birthPanchang.Karna.end, t, i18n)})`}
                        </p>
                        <p>{t('astrologyForm.varLabel')} {t(`weekdays.${birthVarKey}`, { defaultValue: birthVarKey ?? t('utils.notAvailable', 'N/A') })}</p>
                    </div>

                    {/* 4. Birth Time Lordship */}
                    <div className="report-section">
                        <h3>{t('Birth Time Lordship')}</h3>
                        <div className="lordship-column">
                            <p>{t('Day Lord')}: {t(`planets.${birthDayLord}`, { defaultValue: 'N/A' })}</p>
                            <p>{t('Ascendant Lord')}: {t(`planets.${displayResult?.ascendant?.rashiLord}`, { defaultValue: displayResult?.ascendant?.rashiLord ?? 'N/A' })}</p>
                            <p>{t('Ascendant Nakshatra Lord')}: {t(`planets.${displayResult?.ascendant?.nakLord}`, { defaultValue: displayResult?.ascendant?.nakLord ?? 'N/A' })}</p>
                            <p>{t('Ascendant Nakshatra SubLord')}: {t(`planets.${displayResult?.ascendant?.subLord}`, { defaultValue: displayResult?.ascendant?.subLord ?? 'N/A' })}</p>
                            <p>{t('Moon Rashi Lord')}: {t(`planets.${displayResult?.planetaryPositions?.sidereal?.Moon?.rashiLord}`, { defaultValue: displayResult?.planetaryPositions?.sidereal?.Moon?.rashiLord ?? 'N/A' })}</p>
                            <p>{t('Moon Nakshatra Lord')}: {t(`planets.${displayResult?.planetaryPositions?.sidereal?.Moon?.nakLord}`, { defaultValue: displayResult?.planetaryPositions?.sidereal?.Moon?.nakLord ?? 'N/A' })}</p>
                            <p>{t('Moon Nakshatra SubLord')}: {t(`planets.${displayResult?.planetaryPositions?.sidereal?.Moon?.subLord}`, { defaultValue: displayResult?.planetaryPositions?.sidereal?.Moon?.subLord ?? 'N/A' })}</p>
                        </div>
                    </div>

                    {/* 5. Astrological Dosha */}
                    <div className="report-section dosha-details">
                        <h3>{t('astrologyForm.doshaTitle')}</h3>
                        <p>{t('astrologyForm.mangalDoshaLabel')} {formatDosha('mangal', birthDoshas, t)}</p>
                        <p>{t('astrologyForm.kaalsarpaDoshaLabel')} {formatDosha('kaalsarpa', birthDoshas, t)}</p>
                        <p>{t('astrologyForm.moolDoshaLabel')} {formatDosha('mool', birthDoshas, t)}</p>
                    </div>

                    {/* 6. Longevity Factors */}
                    {displayResult.longevityFactors && !displayResult.longevityFactors.error && (
                        <div className="report-section">
                           
                            <p><strong>{t('astrologyForm.marakaPlanetsLabel', 'Maraka Planets (2nd & 7th Lords):')}</strong>{` ${displayResult.longevityFactors.marakaLords.map(lord => t(`planets.${lord}`, { defaultValue: lord })).join(', ')}`}</p>
                            <p><strong>{t('astrologyForm.eighthLordLabel', '8th Lord:')}</strong> {t(`planets.${displayResult.longevityFactors.eighthLord}`, { defaultValue: displayResult.longevityFactors.eighthLord })}</p>
                            {displayResult.badhakDetails && !displayResult.badhakDetails.error && (<p><strong>{t('astrologyForm.badhakeshLabel', 'Badhakesh (Obstructor):')}</strong> {t(`planets.${displayResult.badhakDetails.badhakesh}`, { defaultValue: displayResult.badhakDetails.badhakesh })}</p>)}
                        </div>
                    )}

                    {/* 7. Dasha Balance */}
                    {displayResult.dashaBalance && (
                        <div className="report-section">
                            <h3>{t('astrologyForm.dashaBalanceTitle')}</h3>
                            <p>{t('astrologyForm.dashaLordLabel')} {t(`planets.${displayResult.dashaBalance.lord}`, { defaultValue: displayResult.dashaBalance.lord })}</p>
                            <p>{t('astrologyForm.dashaBalanceLabel')} {displayResult.dashaBalance.balance_str}</p>
                        </div>
                    )}

                    {/* 8. D1 Diamond Chart, 9. Nirayan Chart, 10. D9 Chart */}
                    
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '0px', justifyItems: 'center', pageBreakInside: 'avoid' }}>
                        <h3>Charts</h3>
                        {/* D1 - Lagna Chart */}
                        <h4 style={{ margin: '5px 0' }}>{t('astrologyForm.chartD1Title')}</h4>
                        <DiamondChart
                            title={t('astrologyForm.chartD1Title')}
                            houses={mainResult.houses}
                            planets={mainResult.planetaryPositions.sidereal}
                            chartType="lagna"
                            size={400}// Adjust size for print
                        />

                        {/* Nirayan Chart (effectively D1, but labeled differently) */}
                        <h4 style={{ margin: '5px 0' }}>{t('astrologyForm.chartNirayanTitle')}</h4>
                        <DiamondChart
                            title={t('astrologyForm.chartNirayanTitle')}
                            houses={mainResult.houses}
                            planets={mainResult.planetaryPositions.sidereal}
                            chartType="lagna"
                            size={400} // Adjust size for print
                        />

                        {/* D9 - Navamsha Chart */}
                        {mainResult.d9_planets && mainResult.d9_ascendant_dms && (
                            <>
                                <h4 style={{ margin: '5px 0' }}>{t('astrologyForm.chartD9Title')}</h4>
                                <DiamondChart
                                    title={t('astrologyForm.chartD9Title')}
                                    houses={createChartHousesFromAscendant(mainResult.d9_ascendant_dms, t)}
                                    planets={mainResult.d9_planets}
                                    chartType="d9"
                                    size={400} // Adjust size for print
                                />
                            </>
                        )}
                    </div>
                    {/* Birth Chart House Cusps Table */}
                    {mainResult?.houses && (
                        <div className="report-section" style={{ pageBreakInside: 'avoid' }}>
                            <h3 style={{ pageBreakBefore: 'always' }}>Birth Chart House Cusps</h3>
                            <div className="table-wrapper">
                                <table className="results-table">
                                    <thead>
                                        <tr>
                                            <th>{t('common.house')}</th>
                                            <th>{t('common.start')}</th>
                                            <th>{t('common.mean')}</th>
                                            <th>{t('common.end')}</th>
                                            <th>{t('common.rashi')}</th>
                                            <th>{t('common.nakshatra')}</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {mainResult.houses.map((house) => (
                                            <tr key={house.house_number}>
                                                <td>{house.house_number}</td>
                                                <td>{house.start_dms || 'N/A'}</td>
                                                <td>{house.mean_dms || 'N/A'}</td>
                                                <td>{house.end_dms || 'N/A'}</td>
                                                {(() => {
                                                    const startDegree = convertDMSToDegrees(house.start_dms);
                                                    const rashiName = calculateRashi(startDegree, t);
                                                    const rashiLord = getRashiLord(rashiName, t);
                                                    const nakshatraName = calculateNakshatra(startDegree, t);
                                                    const nakshatraLord = getNakshatraLord(nakshatraName, t);
                                                    return (
                                                        <>
                                                            <td>{t(`rashis.${rashiName}`, { defaultValue: rashiName }) || 'N/A'} ({t(`planets.${rashiLord}`, { defaultValue: rashiLord }) || 'N/A'})</td>
                                                            <td>{t(`nakshatras.${nakshatraName}`, { defaultValue: nakshatraName }) || 'N/A'} ({t(`planets.${nakshatraLord}`, { defaultValue: nakshatraLord }) || 'N/A'})</td>
                                                        </>
                                                    );
                                                })()}
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}
                    
                    {/* 11. Planet Details Table */}
                    <div className="portrait-section" style={{ pageBreakInside: 'avoid' }}>
                        <h2 style={{ width: '100%', textAlign: 'center', pageBreakBefore: 'always' }}>Planet Details</h2>
                        <div style={{ marginBottom: '20px' }}> {/* Wrapper for first table */}
                            <CustomDetailedPlanetTable 
                                planets={mainResult.planetaryPositions.sidereal} 
                                houses={mainResult.houses} 
                                planetDetails={mainResult.planetDetails} 
                                planetOrder={PLANET_ORDER} 
                                columns={COLUMNS_TABLE_1}
                            />
                        </div>
                        <div style={{ pageBreakBefore: 'avoid' }}> {/* Wrapper for second table */}
                            <CustomDetailedPlanetTable 
                                planets={mainResult.planetaryPositions.sidereal} 
                                houses={mainResult.houses} 
                                planetDetails={mainResult.planetDetails} 
                                planetOrder={PLANET_ORDER} 
                                columns={COLUMNS_TABLE_2}
                            />
                        </div>
                    </div>

                    {/* 12. Planetary Aspects */}
                    {displayResult?.planetDetails?.aspects?.directAspects && (
                        <div className="report-section" style={{ pageBreakInside: 'avoid' }}>
                            <h3 style={{ pageBreakBefore: 'always' }}>{t('planetDetailsPage.aspectsTitle')}</h3>
                            <div className="table-wrapper">
                                <table className="results-table aspect-table">
                                    <thead>
                                        <tr>
                                            <th>{t('aspectTableHeaders.planet')}</th>
                                            {PLANET_ORDER.map(p => <th key={p}>{t(`planetsShort.${p}`, p)}</th>)}
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {PLANET_ORDER.map(planet => (
                                            <tr key={planet}>
                                                <td>{t(`planets.${planet}`, planet)}</td>
                                                {PLANET_ORDER.map(aspecter => (
                                                    <td key={`${planet}-${aspecter}`} className={displayResult.planetDetails.aspects.directAspects[planet]?.includes(aspecter) ? 'has-aspect' : ''}>
                                                        {displayResult.planetDetails.aspects.directAspects[planet]?.includes(aspecter) ? '✓' : ''}
                                                    </td>
                                                ))}
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}
                    
                    {/* 13. Planetary Friendships */}
                    {displayResult?.planetDetails?.resultingFriendship && (
                        <div className="report-section" style={{ pageBreakInside: 'avoid' }}>
                            <h3>{t('planetDetailsPage.friendshipsTitle')}</h3>
                            <div className="table-wrapper">
                                <table className="results-table friendship-table">
                                    <thead>
                                        <tr>
                                            <th>{t('friendshipTableHeaders.planet')}</th>
                                            {PLANET_ORDER.filter(p => p !== 'Rahu' && p !== 'Ketu').map(p => <th key={p}>{t(`planetsShort.${p}`, p)}</th>)}
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {PLANET_ORDER.filter(p => p !== 'Rahu' && p !== 'Ketu').map(planet => (
                                            <tr key={planet}>
                                                <td>{t(`planets.${planet}`, planet)}</td>
                                                {PLANET_ORDER.filter(p => p !== 'Rahu' && p !== 'Ketu').map(otherPlanet => {
                                                    const friendship = displayResult.planetDetails.resultingFriendship[planet]?.[otherPlanet];
                                                    const className = friendship ? `friendship-${friendship.toLowerCase().replace(' ', '-')}` : '';
                                                    return (
                                                        <td key={`${planet}-${otherPlanet}`} className={className}>
                                                            {planet === otherPlanet
                                                                ? t('planetDetailsPage.friendshipSelf')
                                                                : friendship
                                                                    ? t(`friendshipTerms.${friendship}`, friendship)
                                                                    : 'N/A'}
                                                        </td>
                                                    );
                                                })}
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}

                    {/* 14. Shadbala */}
                    {displayResult?.planetDetails?.shadbala && (
                        <div className="report-section" style={{ pageBreakInside: 'avoid' }}>
                            <h3 style={{ pageBreakBefore: 'always' }}>{t('planetDetailsPage.shadbalaTitle')}</h3>
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
                                        {PLANET_ORDER.filter(p => displayResult.planetDetails.shadbala[p]).map((planet) => {
                                            const sb = displayResult.planetDetails.shadbala[planet];
                                            const components = sb?.components;

                                            if (!sb || typeof components !== 'object') {
                                                // Translate planet name in error row
                                                return ( <tr key={`shad-${planet}`}> <td>{t(`planets.${planet}`, { defaultValue: planet })}</td> <td colSpan="8">{t('planetDetailsPage.shadbalaDataMissing')}</td> </tr> );
                                            }
                                            const na = t('utils.notAvailable', 'N/A');
                                            const totalRupas = parseFloat(sb.total);
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
                                {displayResult.planetDetails.shadbala.minimum_requirements && (
                                    <div className="shadbala-minimums">
                                        <p><strong>{t('planetDetailsPage.shadbalaMinimumsTitle')}</strong></p>
                                        <ul>
                                            {/* Translate planet names in minimum requirements list */}
                                            {Object.entries(displayResult.planetDetails.shadbala.minimum_requirements).map(([planet, req]) => (
                                                <li key={`min-${planet}`}>{t(`planets.${planet}`, { defaultValue: planet })}: {req}</li>
                                            ))}
                                        </ul>
                                    </div>
                                )}
                                {PLANET_ORDER.find(p => displayResult.planetDetails.shadbala[p]?.note) && (
                                    <p className="hint-text small-hint shadbala-note">
                                        {t('planetDetailsPage.shadbalaNotePrefix')} {PLANET_ORDER.map(p => displayResult.planetDetails.shadbala[p]?.note).filter(Boolean).join(' ')}
                                    </p>
                                )}
                            </div>
                        </div>
                    )}

                    {/* 15. Uncommon Planetary Beneficence Score (UPBS) */}
                    {displayResult?.planetDetails?.upbsScores && (
                        <div className="report-section" style={{ pageBreakInside: 'avoid' }}>
                            <h3 style={{ pageBreakBefore: 'always' }}>{t('planetDetailsPage.upbsTitle')}</h3>
                            <div className="table-wrapper upbs-table-wrapper">
                                <table className="results-table upbs-table">
                                    <thead>
                                        <tr>
                                            <th>{t('upbsTableHeaders.planet')}</th>
                                            <th>{t('upbsBreakdownShort.NBS')}</th>
                                            <th>{t('upbsBreakdownShort.FBS')}</th>
                                            <th>{t('upbsBreakdownShort.PDS')}</th>
                                            <th>{t('upbsBreakdownShort.SS')}</th>
                                            <th>{t('upbsBreakdownShort.CRS')}</th>
                                            <th>{t('upbsBreakdownShort.HPS')}</th>
                                            <th>{t('upbsBreakdownShort.ARS')}</th>
                                            <th>{t('upbsBreakdownShort.NLM')}</th>
                                            <th>{t('upbsBreakdownShort.ASC')}</th>
                                            <th>{t('upbsTableHeaders.totalScoreShort')}</th>
                                            <th>{t('upbsTableHeaders.interpretationShort')}</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {PLANET_ORDER.filter(p => p !== 'Uranus' && p !== 'Neptune' && p !== 'Pluto').map(planet => {
                                            const planetUPBS = displayResult.planetDetails.upbsScores[planet];
                                            if (!planetUPBS || isNaN(planetUPBS.total) || !planetUPBS.breakdown) {
                                                return (
                                                    <tr key={`upbs-${planet}`}>
                                                        <td>{t(`planets.${planet}`, planet)}</td>
                                                        <td colSpan="11">{t('planetDetailsPage.upbsDataMissing')}</td>
                                                    </tr>
                                                );
                                            }
                                            const interpretation = interpretUPBS(planetUPBS.total, t);
                                            return (
                                                <tr key={`upbs-${planet}`}>
                                                    <td>{t(`planets.${planet}`, planet)}</td>
                                                    <td>{(planetUPBS.breakdown.NBS ?? 0).toFixed(2)}</td>
                                                    <td>{(planetUPBS.breakdown.FBS ?? 0).toFixed(2)}</td>
                                                    <td>{(planetUPBS.breakdown.PDS ?? 0).toFixed(2)}</td>
                                                    <td>{(planetUPBS.breakdown.SS ?? 0).toFixed(2)}</td>
                                                    <td>{(planetUPBS.breakdown.CRS ?? 0).toFixed(2)}</td>
                                                    <td>{(planetUPBS.breakdown.HPS ?? 0).toFixed(2)}</td>
                                                    <td>{(planetUPBS.breakdown.ARS ?? 0).toFixed(2)}</td>
                                                    <td>{(planetUPBS.breakdown.NLM ?? 0).toFixed(2)}</td>
                                                    <td>{(planetUPBS.breakdown.ASC ?? 0).toFixed(2)}</td>
                                                    <td><strong>{(planetUPBS.total ?? 0).toFixed(2)}</strong></td>
                                                    <td>{interpretation}</td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                            <div className="upbs-legend">
                                <h4>{t('upbsLegend.title')}</h4>
                                <ul>
                                    <li><strong>{t('upbsBreakdownShort.NBS')}</strong>: {t('upbsBreakdown.NBS')}</li>
                                    <li><strong>{t('upbsBreakdownShort.FBS')}</strong>: {t('upbsBreakdown.FBS')}</li>
                                    <li><strong>{t('upbsBreakdownShort.PDS')}</strong>: {t('upbsBreakdown.PDS')}</li>
                                    <li><strong>{t('upbsBreakdownShort.SS')}</strong>: {t('upbsBreakdown.SS')}</li>
                                    <li><strong>{t('upbsBreakdownShort.CRS')}</strong>: {t('upbsBreakdown.CRS')}</li>
                                    <li><strong>{t('upbsBreakdownShort.HPS')}</strong>: {t('upbsBreakdown.HPS')}</li>
                                    <li><strong>{t('upbsBreakdownShort.ARS')}</strong>: {t('upbsBreakdown.ARS')}</li>
                                    <li><strong>{t('upbsBreakdownShort.NLM')}</strong>: {t('upbsBreakdown.NLM')}</li>
                                    <li><strong>{t('upbsBreakdownShort.ASC')}</strong>: {t('upbsBreakdown.ASC')}</li>
                                    <li><strong>{t('upbsTableHeaders.totalScoreShort')}</strong>: {t('upbsTableHeaders.totalScore')}</li>
                                    <li><strong>{t('upbsTableHeaders.interpretationShort')}</strong>: {t('upbsTableHeaders.interpretation')}</li>
                                </ul>
                            </div>
                        </div>
                    )}

                    {/* 16. Full Expanded Dasha Periods */}
                    {mainResult.dashaPeriods && (
                        <div className="report-section" style={{ pageBreakBefore: 'always' }}>
                            <h3>{t('astrologyForm.dashaPeriodsTitle', 'Dasha Periods')}</h3>
                            <ExpandedDashaTable dashaPeriods={mainResult.dashaPeriods} />
                        </div>
                    )}

                    {/* 17. Ashtakavarga Charts */}
                    
                    <AshtakavargaReport ashtakavargaData={mainResult.ashtakavarga} houses={mainResult.houses} inputParams={displayInputParams} />
                </>
            )}
            {/* 18. KP Significators */}
            {kpResult && (
                <>
                    <h2 style={{ pageBreakBefore: 'always' }}>KP Significators</h2>
                    {kpResult.kpSignificatorsData && (
                        <KpSignificatorGrid
                            significatorDetailsMap={new Map(kpResult.kpSignificatorsData.map(s => [s.name, s]))}
                            selectedEvent=""
                            significatorPlanet=""
                        />
                    )}
                </>
            )}
            {/* 19. Varshphal Report */}
            {varshphalResult && (
                <>
                  
                    <VarshphalReport varshphalResult={varshphalResult} reportYear={varshphalYear} natalInputParams={displayInputParams} t={t} i18n={i18n} formatDisplayDateTime={formatDisplayDateTime} isPrintable={true} />
                </>
            )}

            {/* 20. Transit Report */}
            {transitResult && (
                <div className="transit-report" style={{ pageBreakBefore: 'always' }}>
                    <h2>{t('varshphalPage.transitReportTitle', 'Transit Report (Gochar)')}</h2>
                    {/* Transit Input Summary */}
                    <div className="report-section input-summary">
                        <h3>{t('sharedLayout.transitDetailsTitle', 'Transit Details')}</h3>
                        <p><strong>{t('sharedLayout.transitDateTimeLabel', 'Date & Time:')}</strong> {formatDisplayDateTime(transitResult.inputParameters.date, t, i18n)}</p>
                        <p><strong>{t('sharedLayout.transitPlaceLabel', 'Place:')}</strong> {transitResult.inputParameters.placeName || t('utils.notAvailable', 'N/A')}</p>
                        <p><strong>{t('sharedLayout.coordsLabel', 'Coordinates:')}</strong> {transitResult.inputParameters.latitude.toFixed(4)}, {transitResult.inputParameters.longitude.toFixed(4)}</p>
                    </div>

                    {/* Transit Charts */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '0px', justifyItems: 'center', pageBreakInside: 'avoid' }}>
                        <h3>{t('astrologyForm.mainChartsTitle', 'Charts')}</h3>
                        {/* Lagna Chart */}
                        <h4 style={{ margin: '5px 0' }}>{t('astrologyForm.chartD1Title', 'Lagna Chart')}</h4>
                        <DiamondChart
                            title={t('astrologyForm.chartD1Title')}
                            houses={transitResult.houses}
                            planets={transitResult.planetaryPositions.sidereal}
                            chartType="lagna"
                            size={400}
                        />

                        {/* Nirayan Chart */}
                        <h4 style={{ margin: '5px 0' }}>{t('astrologyForm.chartNirayanTitle', 'Nirayan Chart')}</h4>
                        <DiamondChart
                            title={t('astrologyForm.chartNirayanTitle')}
                            houses={transitResult.houses}
                            planets={transitResult.planetaryPositions.sidereal}
                            chartType="lagna"
                            size={400}
                        />
                    </div>

                    {/* Transit Panchang */}
                    {transitResult.panchang && (
                        <div className="report-section" style={{ pageBreakInside: 'avoid' }}>
                            <h3>{t('astrologyForm.transitPanchangaTitle', 'Transit Panchanga')}</h3>
                            <p>{t('astrologyForm.samvatsarLabel')} {t(`samvatsaras.${transitResult.panchang?.samvatsar}`, { defaultValue: transitResult.panchang?.samvatsar ?? t('utils.notAvailable', 'N/A') })}</p>
                            <p>{t('astrologyForm.vikramSamvatLabel')} {transitResult.panchang?.vikram_samvat ?? t('utils.notAvailable', 'N/A')}</p>
                            <p>{t('astrologyForm.sakaYearLabel')} {transitResult.panchang?.SakaYear ?? t('utils.notAvailable', 'N/A')}</p>
                            <p>{t('astrologyForm.solarMonthLabel')} {t(`hindiMonths.${transitResult.panchang?.Masa?.name_en_IN}`, { defaultValue: transitResult.panchang?.Masa?.name_en_IN ?? t('utils.notAvailable', 'N/A') })} ({transitResult.panchang?.Masa?.solar_day})</p>
                            <p>{t('astrologyForm.amantaLunarMonthLabel')} {t(`hindiMonths.${transitResult.panchang?.MoonMasa?.name_en_IN}`, { defaultValue: transitResult.panchang?.MoonMasa?.name_en_IN ?? t('utils.notAvailable', 'N/A') })}</p>
                            <p>{t('astrologyForm.purnimantaLunarMonthLabel')} {t(`hindiMonths.${transitResult.panchang?.PurnimantaMasa?.name_en_IN}`, { defaultValue: transitResult.panchang?.PurnimantaMasa?.name_en_IN ?? t('utils.notAvailable', 'N/A') })}</p>
                            <p>{t('astrologyForm.rituLabel')} {t(`ritus.${transitResult.panchang?.Ritu?.name_en_UK}`, { defaultValue: transitResult.panchang?.Ritu?.name_en_UK ?? t('utils.notAvailable', 'N/A') })}</p>
                            <p>
                                {t('astrologyForm.tithiLabel')} {transitResult.panchang?.Tithi
                                    ? `${t(`pakshas.${transitResult.panchang.Tithi.paksha_en_IN}`, { defaultValue: transitResult.panchang.Tithi.paksha_en_IN })} ${transitResult.panchang.Tithi.number || ''} (${t(`tithis.${transitResult.panchang.Tithi.name_en_IN}`, { defaultValue: transitResult.panchang.Tithi.name_en_IN || 'N/A' })})`
                                    : t('utils.notAvailable', 'N/A')}
                                {transitResult.panchang?.Tithi?.start && transitResult.panchang?.Tithi?.end && ` (${formatPanchangTime(transitResult.panchang.Tithi.start, t, i18n)} - ${formatPanchangTime(transitResult.panchang.Tithi.end, t, i18n)})`}
                            </p>
                            <p>{t('astrologyForm.rashiMoLabel')} {t(`rashis.${getRashiFromDegree(convertDMSToDegrees(transitResult.planetaryPositions.sidereal.Moon?.dms), t)}`, { defaultValue: getRashiFromDegree(convertDMSToDegrees(transitResult.planetaryPositions.sidereal.Moon?.dms), t) ?? t('utils.notAvailable', 'N/A') })}</p>
                            <p>
                                {t('astrologyForm.nakMoLabel')} {t(`nakshatras.${transitResult.panchang?.Nakshatra?.name_en_IN}`, { defaultValue: transitResult.panchang?.Nakshatra?.name_en_IN ?? t('utils.notAvailable', 'N/A') })}
                                {transitResult.planetaryPositions.sidereal.Moon?.nakLord && ` (${t('astrologyForm.lordLabel')} ${t(`planets.${transitResult.planetaryPositions.sidereal.Moon.nakLord}`, { defaultValue: transitResult.planetaryPositions.sidereal.Moon.nakLord })})`}
                                {calculateNakshatraPada(convertDMSToDegrees(transitResult.planetaryPositions.sidereal.Moon?.dms), t) !== 'N/A' ? ` (${t('astrologyForm.padaLabel')}${calculateNakshatraPada(convertDMSToDegrees(transitResult.planetaryPositions.sidereal.Moon?.dms), t)})` : ""}
                                {transitResult.panchang?.Nakshatra?.start && transitResult.panchang?.Nakshatra?.end && ` (${formatPanchangTime(transitResult.panchang.Nakshatra.start, t, i18n)} - ${formatPanchangTime(transitResult.panchang.Nakshatra.end, t, i18n)})`}
                            </p>
                            <p>
                                {t('astrologyForm.yogaLabel')} {t(`yogas.${transitResult.panchang?.Yoga?.name_en_IN}.name`, { defaultValue: transitResult.panchang?.Yoga?.name_en_IN ?? t('utils.notAvailable', 'N/A') })}
                                {transitResult.panchang?.Yoga?.start && transitResult.panchang?.Yoga?.end && ` (${formatPanchangTime(transitResult.panchang.Yoga.start, t, i18n)} - ${formatPanchangTime(transitResult.panchang.Yoga.end, t, i18n)})`}
                            </p>
                            <p>
                                {t('astrologyForm.karanLabel')} {t(`karans.${transitResult.panchang?.Karna?.name_en_IN}`, { defaultValue: transitResult.panchang?.Karna?.name_en_IN ?? t('utils.notAvailable', 'N/A') })}
                                {transitResult.panchang?.Karna?.start && transitResult.panchang?.Karna?.end && ` (${formatPanchangTime(transitResult.panchang.Karna.start, t, i18n)} - ${formatPanchangTime(transitResult.panchang.Karna.end, t, i18n)})`}
                            </p>
                            <p>{t('astrologyForm.varLabel')} {t(`weekdays.${calculateVar(transitResult.inputParameters.date, t).varName}`, { defaultValue: calculateVar(transitResult.inputParameters.date, t).varName ?? t('utils.notAvailable', 'N/A') })}</p>
                        </div>
                    )}

                    {/* Transit House Cusps Table */}
                    {transitResult?.houses && (
                        <div className="report-section" style={{ pageBreakInside: 'avoid' }}>
                            <h3>{t('astrologyForm.transitHouseCuspsTitle', 'Transit House Cusps')}</h3>
                            <div className="table-wrapper">
                                <table className="results-table">
                                    <thead>
                                        <tr>
                                            <th>{t('common.house')}</th>
                                            <th>{t('common.start')}</th>
                                            <th>{t('common.mean')}</th>
                                            <th>{t('common.end')}</th>
                                            <th>{t('common.rashi')}</th>
                                            <th>{t('common.nakshatra')}</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {transitResult.houses.map((house) => (
                                            <tr key={house.house_number}>
                                                <td>{house.house_number}</td>
                                                <td>{house.start_dms || 'N/A'}</td>
                                                <td>{house.mean_dms || 'N/A'}</td>
                                                <td>{house.end_dms || 'N/A'}</td>
                                                {(() => {
                                                    const startDegree = convertDMSToDegrees(house.start_dms);
                                                    const rashiName = calculateRashi(startDegree, t);
                                                    const rashiLord = getRashiLord(rashiName, t);
                                                    const nakshatraName = calculateNakshatra(startDegree, t);
                                                    const nakshatraLord = getNakshatraLord(nakshatraName, t);
                                                    return (
                                                        <>
                                                            <td>{t(`rashis.${rashiName}`, { defaultValue: rashiName }) || 'N/A'} ({t(`planets.${rashiLord}`, { defaultValue: rashiLord }) || 'N/A'})</td>
                                                            <td>{t(`nakshatras.${nakshatraName}`, { defaultValue: nakshatraName }) || 'N/A'} ({t(`planets.${nakshatraLord}`, { defaultValue: nakshatraLord }) || 'N/A'})</td>
                                                        </>
                                                    );
                                                })()}
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}

                    {/* Transit Planetary Positions Table */}
                    {transitResult?.planetaryPositions?.sidereal && (
                        <div className="report-section" style={{ pageBreakInside: 'avoid' }}>
                            <h3>{t('astrologyForm.transitPlanetaryPositionsTitle', 'Transit Planetary Positions')}</h3>
                            <div style={{ marginBottom: '20px' }}>
                                <CustomDetailedPlanetTable
                                    planets={transitResult.planetaryPositions.sidereal}
                                    houses={transitResult.houses}
                                    planetDetails={transitResult.planetDetails}
                                    planetOrder={PLANET_ORDER}
                                    columns={COLUMNS_TABLE_1}
                                />
                            </div>
                            <div style={{ pageBreakBefore: 'avoid' }}>
                                <CustomDetailedPlanetTable
                                    planets={transitResult.planetaryPositions.sidereal}
                                    houses={transitResult.houses}
                                    planetDetails={transitResult.planetDetails}
                                    planetOrder={PLANET_ORDER}
                                    columns={COLUMNS_TABLE_2}
                                />
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default PrintableReport;
