// src/VarshphalPage.jsx
import React, { useState, useEffect, useCallback, useMemo } from "react";
import { useOutletContext } from "react-router-dom";
import { useTranslation } from 'react-i18next'; // Import the hook
import api from "./api";
import DiamondChart from "./DiamondChart";
import DashaTable from "./DashaTable";
import KpSignificatorGrid from "./KpSignificatorGrid";
import DetailedPlanetTable from "./DetailedPlanetTable"; // Import DetailedPlanetTable
import "../styles/VarshphalPage.css";
import { validateAndFormatDateTime } from './AstrologyUtils'; // Import validation if needed for birth date check

// --- Constants ---
const SIGNIFICATOR_GRID_ORDER = [
    ['Ketu', 'Moon', 'Jupiter'],
    ['Venus', 'Mars', 'Saturn'],
    ['Sun', 'Rahu', 'Mercury']
];
const FLATTENED_GRID_ORDER = SIGNIFICATOR_GRID_ORDER.flat();


// Helper to format date/time for display (handles potential errors)
// Pass 't' for potential error/invalid messages
const formatDisplayDateTime = (isoString, t) => {
  if (!isoString) return t ? t('utils.notAvailable', 'N/A') : 'N/A'; // Use translated N/A
  try {
    const date = new Date(isoString);
    if (isNaN(date.getTime())) return t ? t('utils.invalidDate', 'Invalid Date') : 'Invalid Date'; // Use translated Invalid Date
    // Use toLocaleString for a user-friendly local representation
    return date.toLocaleString(undefined, {
      year: "numeric",
      month: "numeric",
      day: "numeric",
      hour: "numeric",
      minute: "numeric",
      second: "numeric",
      hour12: true,
    });
  } catch (e) {
    console.error("Error formatting date:", e);
    return isoString; // Return original string on error
  }
};

const VarshphalPage = () => {
  const { t, i18n } = useTranslation(); // Call the hook and destructure i18n
  // --- Get Context from SharedInputLayout ---
  const {
    calculationInputParams,
    isLoading: isInitialLoading,
    error: initialError,
    selectedVarshphalYear,
    setSelectedVarshphalYear,
  } = useOutletContext() || {};
  const outletHouseToRotate = (useOutletContext() || {}).houseToRotate;
  const outletSetHouseToRotate = (useOutletContext() || {}).setHouseToRotate;
  const [selectedHouse, setSelectedHouse] = useState(() => (typeof outletHouseToRotate === 'number' ? outletHouseToRotate : 1));

  const handleHouseChange = (event) => {
    setSelectedHouse(parseInt(event.target.value, 10));
  };

  // Keep selectedHouse in sync with global outlet houseToRotate
  useEffect(() => {
    if (typeof outletHouseToRotate === 'number' && outletHouseToRotate !== selectedHouse) {
      setSelectedHouse(outletHouseToRotate);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [outletHouseToRotate]);

  useEffect(() => {
    if (typeof outletSetHouseToRotate === 'function') {
      try { outletSetHouseToRotate(selectedHouse); } catch (e) {}
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedHouse]);

  // --- State for Calculation ---
  const [isLoading, setIsLoading] = useState(false);
  const [calculationError, setCalculationError] = useState(null);
  const [varshphalResult, setVarshphalResult] = useState(null);
  const [rotatedVarshphalResult, setRotatedVarshphalResult] = useState(null);
  const [inputDetailsUsed, setInputDetailsUsed] = useState(null);

  // State for UI
  const [openSections, setOpenSections] = useState({
    inputBlock: true,
    inputSummary: true,
    varshphalChart: true,
    planetaryPositions: true,
    houseCusps: true,
    bhavaChalitChart: true,
    keyDetails: true,
    kpSignificators: true,
    muddaDasha: true,
    upbs: true, // Add this line for the UPBS section
  });

      const toggleSection = (section) => {
        setOpenSections(prev => ({ ...prev, [section]: !prev[section] }));
      };
    
      // Helper function to interpret UPBS score (copied from PlanetDetailsPage.jsx)
      const interpretUPBS = (score) => {
        if (score >= 12) return t('upbsInterpretation.highlyBenefic');
        if (score >= 5) return t('upbsInterpretation.benefic');
        if (score >= 0) return t('upbsInterpretation.mildBenefic');
        if (score >= -4) return t('upbsInterpretation.mildMalefic');
        if (score >= -10) return t('upbsInterpretation.malefic');
        return t('upbsInterpretation.highlyMalefic'); // Score -11 to -20
      };
  
      // --- Extract Birth Year (Memoized) ---
      const birthYear = useMemo(() => {
        if (!calculationInputParams?.date) return null;
        try {
          // Validate date before parsing
          // Pass 't' to validation function if it's used for error messages within validation
          const validation = validateAndFormatDateTime(calculationInputParams.date, t);
          if (!validation.isValid) {
            console.error(
              "VarshphalPage: Invalid date format in calculationInputParams:",
              calculationInputParams.date,
              validation.error
            );
            // Optionally set an error state here if needed
            return null;
          }
          // Use the validated date string (or original if validation doesn't modify it)
          const dateObj = new Date(validation.formattedDate || calculationInputParams.date);
          if (isNaN(dateObj.getTime())) { // Double check after potential formatting
            console.error("VarshphalPage: Still invalid date after validation check:", validation.formattedDate || calculationInputParams.date);
            return null;
          }
          return dateObj.getFullYear();
        } catch (e) {
          console.error("VarshphalPage: Error parsing birth date for year:", e);
          return null;
        }
      }, [calculationInputParams?.date, t]); // Add t dependency
  
      // --- Calculation Handler ---
      const handleCalculateVarshphal = useCallback(async () => {
        setCalculationError(null);
        setVarshphalResult(null);
        setRotatedVarshphalResult(null);
        setInputDetailsUsed(null);
        setSelectedHouse(1);
    
        // --- Validation ---
        if (
          !calculationInputParams?.date ||
          calculationInputParams?.latitude === undefined ||
          calculationInputParams?.longitude === undefined
        ) {
          // Translate error
          setCalculationError(t('varshphalPage.errorBaseChartNeeded'));
          setIsLoading(false);
          return;
        }
    
        const yearNum = parseInt(selectedVarshphalYear, 10);
        if (isNaN(yearNum) || yearNum < 1900 || yearNum > 2100) {
          // Translate error
          setCalculationError(t('varshphalPage.errorInvalidYear'));
          setIsLoading(false);
          return;
        }
    
        if (birthYear === null) {
          // Translate error
          setCalculationError(t('varshphalPage.errorBirthYearUnknown'));
          setIsLoading(false);
          return;
        }
        if (yearNum < birthYear) {
          // Translate error with interpolation
          setCalculationError(t('varshphalPage.errorYearBeforeBirth', { yearNum, birthYear }));
          setIsLoading(false);
          return;
        }
        // --- END VALIDATION ---
    
        setIsLoading(true);
    
        const payload = {
          natalDate: calculationInputParams.date,
          natalLatitude: calculationInputParams.latitude,
          natalLongitude: calculationInputParams.longitude,
          natalPlaceName: calculationInputParams.placeName || t('utils.notAvailable', 'N/A'), // Translate N/A
          varshphalYear: yearNum,
          lang: i18n.language, // Add current language
        };
        setInputDetailsUsed(payload);
    
        try {
          
          const response = await api.post("/calculate-varshphal", payload);
    
          if (response.data) {
            setVarshphalResult(response.data);
           
          } else {
            // Translate error
            throw new Error(t('varshphalPage.errorEmptyResponse'));
          }
        } catch (err) {
          console.error("Varshphal calculation error:", err);
          // Translate error
          const errMsg = err.response?.data?.error || err.message || t('varshphalPage.errorCalculationFailed');
          setCalculationError(errMsg);
          setVarshphalResult(null);
        } finally {
          setIsLoading(false);
        }
      }, [calculationInputParams.date, calculationInputParams.latitude, calculationInputParams.longitude, calculationInputParams.placeName, selectedVarshphalYear, birthYear, t, i18n.language]); // Add t dependency
    
      useEffect(() => {
        const fetchRotatedData = async () => {
            setIsLoading(true);
            setCalculationError(null);
            try {
                let response;
                if (selectedHouse === 1) {
                    // If House 1 is selected, fetch the original (non-rotated) data
                    const payload = { ...inputDetailsUsed, lang: i18n.language }; // Use the original input details and add language
                    response = await api.post("/calculate-varshphal", payload);
                    setVarshphalResult(response.data); // Update the main result
                    setRotatedVarshphalResult(null); // Clear rotated result
                } else {
                    // Otherwise, fetch the rotated data
                    const payload = {
                        ...inputDetailsUsed,
                        house_to_rotate: selectedHouse,
                        lang: i18n.language, // Add current language
                    };
                    response = await api.post('/calculate-varshphal/rotated', payload);
                    setRotatedVarshphalResult(response.data); // Update rotated result
                    setVarshphalResult(null); // Clear main result
                }
            } catch (error) {
                console.error("Varshphal Chart calculation error:", error);
                const errMsg = error.response?.data?.error || error.message || t('varshphalPage.errorChartFetch');
                setCalculationError(errMsg);
                setVarshphalResult(null);
                setRotatedVarshphalResult(null);
            } finally {
                setIsLoading(false);
            }
        };
    
        if (inputDetailsUsed) {
            fetchRotatedData();
        }
    }, [selectedHouse, inputDetailsUsed, t, i18n.language]);
    
      // --- Effect to Trigger Calculation Automatically ---
      useEffect(() => {
        if (calculationInputParams && !isInitialLoading && !initialError) {
          if (birthYear === null) {
            // Translate error
            setCalculationError(t('varshphalPage.errorBirthYearUnknown'));
            setVarshphalResult(null);
            return;
          }
          const yearNum = parseInt(selectedVarshphalYear, 10);
          if (
            !isNaN(yearNum) &&
            yearNum >= birthYear &&
            yearNum >= 1900 &&
            yearNum <= 2100
          ) {
            
            handleCalculateVarshphal();
          } else if (!isNaN(yearNum) && yearNum < birthYear) {
            // Translate error with interpolation
            setCalculationError(t('varshphalPage.errorYearBeforeBirth', { yearNum, birthYear }));
            setVarshphalResult(null);
          } else if (isNaN(yearNum) || yearNum < 1900 || yearNum > 2100) {
            // Translate error
            setCalculationError(t('varshphalPage.errorInvalidYear'));
            setVarshphalResult(null);
          }
        } else if (initialError) {
          // Translate error with interpolation
          setCalculationError(t('varshphalPage.errorInitialChart', { error: initialError }));
          setVarshphalResult(null);
        } else if (!calculationInputParams && !isInitialLoading) {
          // Translate error
          setCalculationError(t('varshphalPage.errorBaseChartNeeded'));
          setVarshphalResult(null);
        }
      }, [
        calculationInputParams,
        selectedVarshphalYear,
        isInitialLoading,
        initialError,
        handleCalculateVarshphal,
        birthYear,
        t // Add t dependency
      ]);
    
      const chartResult = rotatedVarshphalResult || varshphalResult;
      const { varshphalChart, muntha, muddaDasha, yearLord, kpSignificators: kpSignificatorsObject } = chartResult || {};
    
      const significatorDetailsMap = useMemo(() => {
        const finalMap = new Map();
        if (!kpSignificatorsObject?.detailedPlanets || !Array.isArray(kpSignificatorsObject.detailedPlanets) || kpSignificatorsObject.detailedPlanets.length === 0) {
            return finalMap;
        }

        const intermediatePlanetData = new Map();
        kpSignificatorsObject.detailedPlanets.forEach(planet => {
            if (planet) {
                intermediatePlanetData.set(planet.name, {
                    name: planet.name,
                    occupiedHouses: planet.occupiedHouses || [],
                    ownedHouses: planet.ownedHouses || [],
                    signLordOwnedHouses: planet.signLordOwnedHouses || [],
                    aspectingOwnedHouses: planet.aspectingOwnedHouses || [],
                    nakshatraLordName: planet.nakshatraLordName || 'N/A',
                    nakshatraLordAllHouses: planet.nakshatraLordAllHouses || [],
                    subLordName: planet.subLordName || 'N/A',
                    subLordAllHouses: planet.subLordAllHouses || [],
                    A: planet.A || [],
                    B: planet.B || [],
                    C: planet.C || [],
                    D: planet.D || [],
                });
            }
        });
      
        const getCombinedHousesForPlanet = (planetName) => {
            const data = intermediatePlanetData.get(planetName);
            if (!data) return [];
            const allHouses = [
                ...(data.occupiedHouses || []),
                ...(data.ownedHouses || []),
                ...(data.signLordOwnedHouses || []),
                ...(data.aspectingOwnedHouses || [])
            ];
            return [...new Set(allHouses)].sort((a, b) => a - b);
        };

        FLATTENED_GRID_ORDER.forEach(planetName => {
            const planetData = intermediatePlanetData.get(planetName);
            if (!planetData) {
                finalMap.set(planetName, { name: planetName, allHouses: [], nakshatraLordName: 'N/A', nakshatraLordAllHouses: [], subLordName: 'N/A', subLordAllHouses: [], score: 0, favourability: 'N/A', completeness: 'N/A' });
                return;
            }

            const planetAllHouses = getCombinedHousesForPlanet(planetName);

            finalMap.set(planetName, {
                ...planetData,
                allHouses: planetAllHouses,
            });
        });

        return finalMap;
    }, [kpSignificatorsObject]);

    
      const canRenderChart = varshphalChart?.houses && varshphalChart?.planetaryPositions?.sidereal;
      const canRenderBhavaChalit = canRenderChart && varshphalChart.planetHousePlacements;
      const hasDashaData = muddaDasha && Array.isArray(muddaDasha) && muddaDasha.length > 0;
      const upbsScores = varshphalChart?.planetDetails?.upbsScores;
      const hasUPBSData = upbsScores && typeof upbsScores === 'object' && Object.keys(upbsScores).length > 0;
    
      // --- Render Results ---
      const renderResults = () => {
        if (isInitialLoading && !chartResult && !calculationError && !initialError) {
          // Translate loading message
          return <div className="loader">{t('varshphalPage.loadingBaseChart')}</div>;
        }
        if (isLoading) {
          // Translate loading message
          return <div className="loader">{t('varshphalPage.calculatingVarshphal')}</div>;
        }
        if (calculationError) {
          return <p className="error-text">{calculationError}</p>;
        }
        if (!chartResult) {
          // Translate prompt
          return <p className="info-text">{t('varshphalPage.selectYearPrompt')}</p>;
        }
    
        // Pass 't' to formatting function
        const displayNatalDate = inputDetailsUsed?.natalDate ? formatDisplayDateTime(inputDetailsUsed.natalDate, t) : t('utils.notAvailable', 'N/A');
        // The Varshphal chart time is the start of the first Mudda Dasha period.
        const displayVarshphalDate = hasDashaData ? formatDisplayDateTime(muddaDasha[0].start, t) : t('utils.notAvailable', 'N/A');
        const displayPlace = inputDetailsUsed?.natalPlaceName || t('utils.notAvailable', 'N/A');
        const displayLat = inputDetailsUsed?.natalLatitude?.toFixed(4);
        const displayLon = inputDetailsUsed?.natalLongitude?.toFixed(4);
        const displayYear = inputDetailsUsed?.varshphalYear;
    
        return (
          <>
            {/* Display Input Summary */}
            <div className="section-header" onClick={() => toggleSection('inputSummary')}>
              <h3 className="result-sub-title">{t('varshphalPage.inputSummaryTitle', 'Input Summary')}</h3>
              <button className="toggle-button">{openSections.inputSummary ? '−' : '+'}</button>
            </div>
            {openSections.inputSummary && <div className="result-section input-summary">
              {/* Translate summary using interpolation */}
              {t('varshphalPage.inputSummary', {
                date: displayNatalDate,
                varshphalDate: displayVarshphalDate,
                place: displayPlace,
                lat: displayLat,
                lon: displayLon,
                year: displayYear
              })}
            </div>}
            
            <div className="two-column-layout">
              {/* --- Column 1: Main Chart and Tables --- */}
              <div className="results-column">
                {/* Varshphal Chart */}
                <div className="section-header" onClick={() => toggleSection('varshphalChart')}>
                  <h3 className="result-sub-title">{t('varshphalPage.chartTitle', { year: displayYear })}</h3>
                  <button className="toggle-button">{openSections.varshphalChart ? '−' : '+'}</button>
                </div>
                {openSections.varshphalChart && (
                  <>
                    {canRenderChart ? (
                      <div className="varshphal-chart-wrapper">
                        <DiamondChart
                          title={t('varshphalPage.chartTitleFull', { year: displayYear })}
                          houses={varshphalChart.houses}
                          planets={varshphalChart.planetaryPositions.sidereal}
                          size={350}
                          chartType="lagna"
                        />
                      </div>
                    ) : (
                      <p>{t('varshphalPage.chartUnavailable')}</p>
                    )}
                  </>
                )}
    
                {/* Mudda Dasha */}
                <div className="section-header" onClick={() => toggleSection('muddaDasha')}>
                  <h3 className="result-sub-title">{t('varshphalPage.muddaDashaTitle')}</h3>
                  <button className="toggle-button">{openSections.muddaDasha ? '−' : '+'}</button>
                </div>
                {openSections.muddaDasha && <div className="result-section mudda-dasha">
                  {hasDashaData ? (
                    <DashaTable dashaPeriods={muddaDasha} />
                  ) : (
                    <p>{t('varshphalPage.muddaDashaUnavailable')}</p>
                  )}
                </div>}
    
                {/* House Cusps */}
                <div className="section-header" onClick={() => toggleSection('houseCusps')}>
                  <h4 className="result-sub-title">{t('varshphalPage.houseCuspsTitle')}</h4>
                  <button className="toggle-button">{openSections.houseCusps ? '−' : '+'}</button>
                </div>
                {openSections.houseCusps && <div className="result-section house-cusps">
                  {varshphalChart?.houses && (
                    <table>
                      <thead>
                        <tr>
                          <th>{t('common.house')}</th>
                          <th>{t('common.start')}</th>
                          <th>{t('common.mean')}</th>
                          <th>{t('common.end')}</th>
                          <th>{t('common.rashi')}</th>
                          <th>{t('common.nakshatra')}</th>
                          <th>{t('common.subLord')}</th>
                        </tr>
                      </thead>
                      <tbody>
                        {varshphalChart.houses.map((house) => (
                          <tr key={house.house_number}>
                            <td>{house.house_number}</td>
                            <td>{house.start_dms || 'N/A'}</td>
                            <td>{house.mean_dms || 'N/A'}</td>
                            <td>{house.end_dms || 'N/A'}</td>
                            <td>{t(`rashis.${house.start_rashi}`, house.start_rashi) || 'N/A'} ({t(`planets.${house.start_rashi_lord}`, house.start_rashi_lord) || 'N/A'})</td>
                            <td>{t(`nakshatras.${house.start_nakshatra}`, house.start_nakshatra) || 'N/A'} ({t(`planets.${house.start_nakshatra_lord}`, house.start_nakshatra_lord) || 'N/A'})</td>
                            <td>{t(`planets.${house.start_sub_lord}`, house.start_sub_lord) || 'N/A'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>}
              </div>
    
              {/* --- Column 2: Secondary Chart and Details --- */}
              <div className="results-column">
                {/* Nirayana Bhava Chalit Chart */}
                <div className="section-header" onClick={() => toggleSection('bhavaChalitChart')}>
                  <h3 className="result-sub-title">{t('varshphalPage.bhavaChalitChartTitle', { year: displayYear })}</h3>
                  <button className="toggle-button">{openSections.bhavaChalitChart ? '−' : '+'}</button>
                </div>
                {openSections.bhavaChalitChart && (
                  <>
                    {canRenderBhavaChalit ? (
                      <div className="varshphal-chart-wrapper">
                        <DiamondChart
                          title={t('varshphalPage.bhavaChalitChartTitleFull', { year: displayYear })}
                          houses={varshphalChart.houses}
                          planetHousePlacements={varshphalChart.planetHousePlacements}
                          size={350}
                          chartType="bhava"
                        />
                      </div>
                    ) : (
                      <p>{t('varshphalPage.bhavaChalitChartUnavailable')}</p>
                    )}
                  </>
                )}
    
                {/* Muntha, Year Lord etc. */}
                <div className="section-header" onClick={() => toggleSection('keyDetails')}>
                  <h4 className="result-sub-title">{t('varshphalPage.keyDetailsTitle')}</h4>
                  <button className="toggle-button">{openSections.keyDetails ? '−' : '+'}</button>
                </div>
                {openSections.keyDetails && <div className="result-section varshphal-details">
                  {muntha && (
                    <p>
                      <strong>{t('varshphalPage.munthaLabel')}</strong>{' '}
                      {t('varshphalPage.munthaText', {
                        house: muntha.house,
                        sign: t(`signs.${muntha.sign}`, muntha.sign)
                      })}
                    </p>
                  )}
                  {yearLord && (
                    <p>
                      <strong>{t('varshphalPage.yearLordLabel')}</strong>{' '}
                      {t(`planets.${yearLord}`, yearLord)}
                    </p>
                  )}
                </div>}
    
                {/* KP Significators */}
                <div
                  className="section-header"
                  onClick={() => toggleSection("kpSignificators")}
                >
                  <h3 className="result-sub-title">{t('varshphalPage.kpSignificatorsTitle')}</h3>
                  <button className="toggle-button">{openSections.kpSignificators ? '−' : '+'}</button>
                </div>
                {openSections.kpSignificators && <div className="result-section kp-significators">
                  {kpSignificatorsObject?.detailedPlanets ? (
                    <KpSignificatorGrid significatorDetailsMap={significatorDetailsMap} selectedEvent="" />
                  ) : (
                    <p>
                      {t(
                        "varshphalPage.kpSignificatorsUnavailable"
                      )}
                    </p>
                  )}
                </div>}
              </div>
            </div>
            
            {/* Sidereal Planetary Positions */}
            <div className="section-header" onClick={() => toggleSection('planetaryPositions')}>
                <h4 className="result-sub-title">{t('varshphalPage.siderealPlanetaryPositionsTitle')}</h4>
                <button className="toggle-button">{openSections.planetaryPositions ? '−' : '+'}</button>
            </div>
            {openSections.planetaryPositions && <div className="result-section planetary-positions">
                {varshphalChart?.planetaryPositions?.sidereal && (
                <DetailedPlanetTable
                    planets={varshphalChart.planetaryPositions.sidereal}
                    houses={varshphalChart.houses}
                    planetDetails={varshphalChart.planetDetails}
                />
                )}
            </div>}
  
            {/* UPBS Table */}
            <div className="section-header" onClick={() => toggleSection('upbs')}>
              <h3 className="result-sub-title">{t('varshphalPage.upbsTitle')}</h3>
              <button className="toggle-button">{openSections.upbs ? '−' : '+'}</button>
            </div>
            {openSections.upbs && <div className="result-section upbs-table">
              {hasUPBSData ? (
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
                      {Object.keys(upbsScores).map(planet => {
                        const planetUPBS = upbsScores[planet];
                        if (!planetUPBS || isNaN(planetUPBS.total)) {
                          return (
                            <tr key={`upbs-${planet}`}>
                              <td>{t(`planets.${planet}`, planet)}</td>
                              <td colSpan="11">{t('varshphalPage.upbsDataMissing')}</td>
                            </tr>
                          );
                        }
                        const interpretation = interpretUPBS(planetUPBS.total);
                        return (
                          <tr key={`upbs-${planet}`}>
                            <td>{t(`planets.${planet}`, planet)}</td>
                            <td>{planetUPBS.breakdown.NBS.toFixed(2)}</td>
                            <td>{planetUPBS.breakdown.FBS.toFixed(2)}</td>
                            <td>{planetUPBS.breakdown.PDS.toFixed(2)}</td>
                            <td>{planetUPBS.breakdown.SS.toFixed(2)}</td>
                            <td>{planetUPBS.breakdown.CRS.toFixed(2)}</td>
                            <td>{planetUPBS.breakdown.HPS.toFixed(2)}</td>
                            <td>{planetUPBS.breakdown.ARS.toFixed(2)}</td>
                            <td>{planetUPBS.breakdown.NLM.toFixed(2)}</td>
                            <td>{planetUPBS.breakdown.ASC.toFixed(2)}</td>
                            <td><strong>{planetUPBS.total.toFixed(2)}</strong></td>
                            <td>{interpretation}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="result-text">{t('varshphalPage.upbsDataUnavailable')}</p>
              )}
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
            </div>}
          </>
        );
      };
  return (
    <div className="varshphal-page">
      {/* Translate page title */}
      <h1>{t('varshphalPage.pageTitle')}</h1>

      {/* --- Input Controls (Only Year) --- */}
      <div className="section-header" onClick={() => toggleSection('inputBlock')}>
        <h2 className="result-sub-title">{t('varshphalPage.inputBlockTitle', 'Input Details')}</h2>
        <button className="toggle-button">{openSections.inputBlock ? '−' : '+'}</button>
      </div>
      {openSections.inputBlock && <div className="varshphal-controls">
        {/* Translate description */}
        <p>{t('varshphalPage.description')}</p>

        {/* Varshphal Year Input */}
        <div className="form-row">
          <div className="input-group">
            {/* Translate label */}
            <label htmlFor="varshphal-year">{t('varshphalPage.yearLabel')}</label>
            <input
              id="varshphal-year"
              type="number"
              value={selectedVarshphalYear}
              onChange={(e) => setSelectedVarshphalYear(e.target.value)}
              required
              min="1900"
              max="2100"
              step="1"
              disabled={isLoading || isInitialLoading}
              // Translate placeholder
              placeholder={t('varshphalPage.yearPlaceholder')}
            />
          </div>
          <div className="input-group">
            <label htmlFor="house-select">Rotate from House:</label>
            <select id="house-select" value={selectedHouse} onChange={handleHouseChange}>
              {[...Array(12).keys()].map(i => (
                <option key={i + 1} value={i + 1}>
                  House {i + 1}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>}

      {/* --- Results --- */}
      <div className="varshphal-results">{renderResults()}</div>
    </div>
  );
};

export default VarshphalPage;
