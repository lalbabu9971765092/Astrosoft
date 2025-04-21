// src/VarshphalPage.jsx
import React, { useState, useEffect, useCallback, useMemo } from "react";
import { useOutletContext } from "react-router-dom";
import { useTranslation } from 'react-i18next'; // Import the hook
import api from "./api";
import DiamondChart from "./DiamondChart";
import DashaTable from "./DashaTable";
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

  // --- State for Calculation ---
  const [isLoading, setIsLoading] = useState(false);
  const [calculationError, setCalculationError] = useState(null);
  const [varshphalResult, setVarshphalResult] = useState(null);
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
    setInputDetailsUsed(null);

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
      // console.log("Calculating Varshphal with payload:", payload);
      const response = await api.post("/calculate-varshphal", payload);

      if (response.data) {
        setVarshphalResult(response.data);
        // console.log("Varshphal Result:", response.data);
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
        // console.log("VarshphalPage: calculationInputParams available, triggering calculation.");
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

  // --- Memoized values for rendering ---
  const { varshphalChart, muntha, muddaDasha, yearLord } = varshphalResult || {};
  const canRenderChart = varshphalChart?.houses && varshphalChart?.planetaryPositions?.sidereal;
  const hasDashaData = muddaDasha && Array.isArray(muddaDasha) && muddaDasha.length > 0;

  // --- Render Results ---
  const renderResults = () => {
    if (isInitialLoading && !varshphalResult && !calculationError && !initialError) {
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
    if (!varshphalResult) {
      // Translate prompt
      return <p className="info-text">{t('varshphalPage.selectYearPrompt')}</p>;
    }

    // Pass 't' to formatting function
    const displayNatalDate = inputDetailsUsed?.natalDate ? formatDisplayDateTime(inputDetailsUsed.natalDate, t) : t('utils.notAvailable', 'N/A');
    const displayPlace = inputDetailsUsed?.natalPlaceName || t('utils.notAvailable', 'N/A');
    const displayLat = inputDetailsUsed?.natalLatitude?.toFixed(4);
    const displayLon = inputDetailsUsed?.natalLongitude?.toFixed(4);
    const displayYear = inputDetailsUsed?.varshphalYear;

    return (
      <div className="varshphal-results-area">
        {/* Display Input Summary */}
        <div className="result-section input-summary">
          {/* Translate summary using interpolation */}
          {t('varshphalPage.inputSummary', {
            date: displayNatalDate,
            place: displayPlace,
            lat: displayLat,
            lon: displayLon,
            year: displayYear
          })}
        </div>

        <div className="two-column-layout">
          {/* Column 1: Chart & Basic Details */}
          <div className="results-column">
            {/* Translate title with interpolation */}
            <h3 className="result-sub-title">{t('varshphalPage.chartTitle', { year: displayYear })}</h3>
            {canRenderChart ? (
              <div className="varshphal-chart-wrapper">
                <DiamondChart
                  // Translate title with interpolation
                  title={t('varshphalPage.chartTitleFull', { year: displayYear })}
                  houses={varshphalChart.houses}
                  planets={varshphalChart.planetaryPositions.sidereal}
                  size={350}
                />
              </div>
            ) : (
              // Translate unavailable message
              <p>{t('varshphalPage.chartUnavailable')}</p>
            )}

            {/* Display Muntha, Year Lord etc. */}
            <div className="result-section varshphal-details">
              {/* Translate title */}
              <h4>{t('varshphalPage.keyDetailsTitle')}</h4>
              {muntha && (
                <p>
                  {/* Translate label */}
                  <strong>{t('varshphalPage.munthaLabel')}</strong>{' '}
                  {/* *** CORRECTED: Translate Sign *** */}
                  {t('varshphalPage.munthaText', {
                    house: muntha.house,
                    sign: t(`signs.${muntha.sign}`, muntha.sign) // Translate sign, fallback to original
                  })}
                </p>
              )}
              {yearLord && (
                <p>
                  {/* Translate label */}
                  <strong>{t('varshphalPage.yearLordLabel')}</strong>{' '}
                  {/* *** CORRECTED: Translate Planet *** */}
                  {t(`planets.${yearLord}`, yearLord)} {/* Translate planet, fallback to original */}
                </p>
              )}
              {/* Add more details from backend response as needed */}
            </div>
          </div>
          {/* Column 2: Mudda Dasha */}
          <div className="results-column">
            {/* Translate title */}
            <h3 className="result-sub-title">{t('varshphalPage.muddaDashaTitle')}</h3>
            {hasDashaData ? (
              <DashaTable
                dashaPeriods={muddaDasha}
                // Pass translated title to DashaTable if it accepts it
                // title={t('varshphalPage.muddaDashaTitleFull')} // Optional: Pass title if DashaTable uses it
              />
            ) : (
              // Translate unavailable message
              <p>{t('varshphalPage.muddaDashaUnavailable')}</p>
            )}
          </div>
        </div>
      </div>
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
        </div>
        {/* Display calculation error related to input if any */}
        {calculationError && !isLoading && (
          <p className="error-text small-error">{calculationError}</p>
        )}
      </div>

      {/* --- Results --- */}
      <div className="varshphal-results">{renderResults()}</div>
    </div>
  );
};

export default VarshphalPage;
