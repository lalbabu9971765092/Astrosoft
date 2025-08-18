// src/VarshphalPage.jsx
import React, { useState, useEffect, useCallback, useMemo } from "react";
import { useOutletContext } from "react-router-dom";
import { useTranslation } from 'react-i18next'; // Import the hook
import api from "./api";
import DiamondChart from "./DiamondChart";
import DashaTable from "./DashaTable";
import KpSignificatorGrid from "./KpSignificatorGrid";
import "../styles/VarshphalPage.css";
import { validateAndFormatDateTime } from './AstrologyUtils'; // Import validation if needed for birth date check

// --- Constants ---
const CURRENT_YEAR = new Date().getFullYear();

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
  const { t } = useTranslation(); // Call the hook
  // --- Get Context from SharedInputLayout ---
  const {
    calculationInputParams,
    isLoading: isInitialLoading,
    error: initialError,
  } = useOutletContext();

  // --- State for Varshphal Year ---
  const [varshphalYear, setVarshphalYear] = useState(CURRENT_YEAR.toString());
  const [selectedHouse, setSelectedHouse] = useState(1);

  const handleHouseChange = (event) => {
    setSelectedHouse(parseInt(event.target.value, 10));
  };

  // --- State for Calculation ---
  const [isLoading, setIsLoading] = useState(false);
  const [calculationError, setCalculationError] = useState(null);
  const [varshphalResult, setVarshphalResult] = useState(null);
  const [rotatedVarshphalResult, setRotatedVarshphalResult] = useState(null);
  const [inputDetailsUsed, setInputDetailsUsed] = useState(null);

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

    const yearNum = parseInt(varshphalYear, 10);
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
  }, [calculationInputParams, varshphalYear, birthYear, t]); // Add t dependency

  useEffect(() => {
    const fetchRotatedData = async () => {
        setIsLoading(true);
        setCalculationError(null);
        try {
            let response;
            if (selectedHouse === 1) {
                // If House 1 is selected, fetch the original (non-rotated) data
                const payload = { ...inputDetailsUsed }; // Use the original input details
                response = await api.post("/calculate-varshphal", payload);
                setVarshphalResult(response.data); // Update the main result
                setRotatedVarshphalResult(null); // Clear rotated result
            } else {
                // Otherwise, fetch the rotated data
                const payload = {
                    ...inputDetailsUsed,
                    house_to_rotate: selectedHouse
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
}, [selectedHouse, inputDetailsUsed, t]);

  // --- Effect to Trigger Calculation Automatically ---
  useEffect(() => {
    if (calculationInputParams && !isInitialLoading && !initialError) {
      if (birthYear === null) {
        // Translate error
        setCalculationError(t('varshphalPage.errorBirthYearUnknown'));
        setVarshphalResult(null);
        return;
      }
      const yearNum = parseInt(varshphalYear, 10);
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
    varshphalYear,
    isInitialLoading,
    initialError,
    handleCalculateVarshphal,
    birthYear,
    t // Add t dependency
  ]);

  const chartResult = rotatedVarshphalResult || varshphalResult;
  const { varshphalChart, muntha, muddaDasha, yearLord, kpSignificators } = chartResult || {};

  const significatorDetailsMap = useMemo(() => {
    if (!kpSignificators) return new Map();
    // Filter out null/undefined items before mapping to prevent errors
    return new Map(kpSignificators.filter(item => item).map(item => [item.name, item]));
  }, [kpSignificators]);

  const canRenderChart = varshphalChart?.houses && varshphalChart?.planetaryPositions?.sidereal;
  const canRenderBhavaChalit = canRenderChart && varshphalChart.planetHousePlacements;
  const hasDashaData = muddaDasha && Array.isArray(muddaDasha) && muddaDasha.length > 0;

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
        <div className="result-section input-summary">
          {/* Translate summary using interpolation */}
          {t('varshphalPage.inputSummary', {
            date: displayNatalDate,
            varshphalDate: displayVarshphalDate,
            place: displayPlace,
            lat: displayLat,
            lon: displayLon,
            year: displayYear
          })}
        </div>
        
        <div className="two-column-layout">
          {/* --- Column 1: Main Chart and Tables --- */}
          <div className="results-column">
            {/* Varshphal Chart */}
            <h3 className="result-sub-title">{t('varshphalPage.chartTitle', { year: displayYear })}</h3>
            {canRenderChart ? (
              <div className="varshphal-chart-wrapper">
                <DiamondChart
                  title={t('varshphalPage.chartTitleFull', { year: displayYear })}
                  houses={varshphalChart.houses}
                  planets={varshphalChart.planetaryPositions.sidereal}
                  size={350}
                />
              </div>
            ) : (
              <p>{t('varshphalPage.chartUnavailable')}</p>
            )}

            {/* Sidereal Planetary Positions */}
            <div className="result-section planetary-positions">
              <h4>{t('varshphalPage.siderealPlanetaryPositionsTitle')}</h4>
              {varshphalChart?.planetaryPositions?.sidereal && (
                <table>
                  <thead>
                    <tr>
                      <th>{t('common.planet')}</th>
                      <th>{t('common.longitude')}</th>
                      <th>{t('common.rashi')}</th>
                      <th>{t('common.nakshatra')}</th>
                      <th>{t('common.subLord')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {Object.entries(varshphalChart.planetaryPositions.sidereal).map(([planetName, data]) => (
                      <tr key={planetName}>
                        <td>{t(`planets.${planetName}`, planetName)}</td>
                        <td>{data.dms || 'N/A'}</td>
                        <td>{t(`rashis.${data.rashi}`, data.rashi) || 'N/A'}</td>
                        <td>{t(`nakshatras.${data.nakshatra}`, data.nakshatra) || 'N/A'}</td>
                        <td>{t(`planets.${data.subLord}`, data.subLord) || 'N/A'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>

            {/* House Cusps */}
            <div className="result-section house-cusps">
              <h4>{t('varshphalPage.houseCuspsTitle')}</h4>
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
                        <td>{t(`rashis.${house.mean_rashi}`, house.mean_rashi) || 'N/A'}</td>
                        <td>{t(`nakshatras.${house.start_nakshatra}`, house.start_nakshatra) || 'N/A'} ({t(`planets.${house.start_nakshatra_lord}`, house.start_nakshatra_lord) || 'N/A'})</td>
                        <td>{t(`planets.${house.start_sub_lord}`, house.start_sub_lord) || 'N/A'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>

          {/* --- Column 2: Secondary Chart and Details --- */}
          <div className="results-column">
            {/* Nirayana Bhava Chalit Chart */}
            <h3 className="result-sub-title">{t('varshphalPage.bhavaChalitChartTitle', { year: displayYear })}</h3>
            {canRenderBhavaChalit ? (
              <div className="varshphal-chart-wrapper">
                <DiamondChart
                  title={t('varshphalPage.bhavaChalitChartTitleFull', { year: displayYear })}
                  houses={varshphalChart.houses}
                  planetHousePlacements={varshphalChart.planetHousePlacements}
                  size={350}
                />
              </div>
            ) : (
              <p>{t('varshphalPage.bhavaChalitChartUnavailable')}</p>
            )}

            {/* Muntha, Year Lord etc. */}
            <div className="result-section varshphal-details">
              <h4>{t('varshphalPage.keyDetailsTitle')}</h4>
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
            </div>

            {/* KP Significators */}
            <div className="result-section kp-significators">
              <h3 className="result-sub-title">{t('varshphalPage.kpSignificatorsTitle')}</h3>
              {chartResult?.kpSignificators ? (
                <KpSignificatorGrid significatorDetailsMap={significatorDetailsMap} selectedEvent="" />
              ) : (
                <p>{t('varshphalPage.kpSignificatorsUnavailable')}</p>
              )}
            </div>

            {/* Mudda Dasha */}
            <div className="result-section mudda-dasha">
              <h3 className="result-sub-title">{t('varshphalPage.muddaDashaTitle')}</h3>
              {hasDashaData ? (
                <DashaTable dashaPeriods={muddaDasha} />
              ) : (
                <p>{t('varshphalPage.muddaDashaUnavailable')}</p>
              )}
            </div>
          </div>
        </div>
      </>
    );
  };

  return (
    <div className="varshphal-page">
      {/* Translate page title */}
      <h1>{t('varshphalPage.pageTitle')}</h1>

      {/* --- Input Controls (Only Year) --- */}
      <div className="varshphal-controls">
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
              value={varshphalYear}
              onChange={(e) => setVarshphalYear(e.target.value)}
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
      </div>

      {/* --- Results --- */}
      <div className="varshphal-results">{renderResults()}</div>
    </div>
  );
};

export default VarshphalPage;
