// src/SharedInputLayout.js
import React, { useState, useCallback, useEffect, useMemo } from 'react';
import { Outlet } from 'react-router-dom';
import axios from 'axios';
import { useTranslation } from 'react-i18next';
import '../styles/SharedInputLayout.css';
import '../styles/AstrologyForm.css';
import {
    validateAndFormatDateTime,
    parseAndValidateCoords,
    formatToLocalISOString, // *** Import this helper ***
} from './AstrologyUtils';
import api from './api';
import TimeAdjustmentTool from './TimeAdjustmentTool';

const SharedInputLayout = () => {
    const { t } = useTranslation();

    // --- State (Keep all existing state here) ---
    const [date, setDate] = useState('');
    const [coords, setCoords] = useState('');
    const [placeName, setPlaceName] = useState('');
    const [isGeocoding, setIsGeocoding] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [isFetchingLocation, setIsFetchingLocation] = useState(false);
    const [error, setError] = useState(null);
    const [locationError, setLocationError] = useState(null);
    const [mainResult, setMainResult] = useState(null);
    const [kpResult, setKpResult] = useState(null);
    const [calculationInputParams, setCalculationInputParams] = useState(null);
    const [adjustedBirthDateTimeString, setAdjustedBirthDateTimeString] = useState(null);
    const [adjustedGocharDateTimeString, setAdjustedGocharDateTimeString] = useState(null);
    const [name, setName] = useState('');
    const [gender, setGender] = useState('');
    const [savedCharts, setSavedCharts] = useState([]);
    const [isLoadingSavedCharts, setIsLoadingSavedCharts] = useState(false);
    const [savedChartsError, setSavedChartsError] = useState(null);
    const [isSavingChart, setIsSavingChart] = useState(false);
    const [savingChartError, setSavingChartError] = useState(null);
    const [showLoadModal, setShowLoadModal] = useState(false);
    const [isDeletingChart, setIsDeletingChart] = useState(false);
    const [deletingChartId, setDeletingChartId] = useState(null);
    const [deletingChartError, setDeletingChartError] = useState(null);

    // --- Effects ---
    useEffect(() => {
        // Set initial date/time input to current local time
        const now = new Date();
        const timezoneOffsetMinutes = now.getTimezoneOffset();
        const localNow = new Date(now.getTime() - timezoneOffsetMinutes * 60000);
        const formattedDateTimeInput = localNow.toISOString().slice(0, 16); // YYYY-MM-DDTHH:MM for input field
        setDate(formattedDateTimeInput);

        // *** Set initial Gochar time string using the consistent local formatter ***
        const initialGocharStr = formatToLocalISOString(now); // YYYY-MM-DDTHH:MM:SS
        setAdjustedGocharDateTimeString(initialGocharStr);

        // Get current location
        if (navigator.geolocation) {
            setIsFetchingLocation(true);
            setLocationError(null);
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    const lat = position.coords.latitude;
                    const lon = position.coords.longitude;
                    const formattedCoords = `${lat.toFixed(6)},${lon.toFixed(6)}`;
                    setCoords(formattedCoords);
                    setPlaceName(t('sharedLayout.currentLocationDefault', "Current Location"));
                    setIsFetchingLocation(false);
                },
                (geoError) => {
                    console.error("Error getting geolocation:", geoError);
                    setLocationError(t('sharedLayout.locationErrorPrefix', { message: geoError.message }));
                    setIsFetchingLocation(false);
                },
                { enableHighAccuracy: false, timeout: 10000, maximumAge: 0 }
            );
        } else {
            console.warn("Geolocation is not supported.");
            setLocationError(t('sharedLayout.geolocationNotSupported'));
        }
        fetchSavedCharts();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [t]); // Add t to dependency array

    // *** MODIFIED: Initialize adjustedBirthDateTimeString directly from calculationInputParams.date ***
    useEffect(() => {
        if (calculationInputParams?.date) {
            // Directly use the validated local ISO string from the main calculation parameters
            setAdjustedBirthDateTimeString(calculationInputParams.date);
        } else {
            setAdjustedBirthDateTimeString(null);
        }
    }, [calculationInputParams]); // Only depends on calculationInputParams

    // --- Handlers (Keep existing handlers: handleFindCoordinates, handleCalculateAll, etc.) ---
    // Geocoding Handler
    const handleFindCoordinates = useCallback(async () => {
        if (!placeName.trim() || placeName === t('sharedLayout.currentLocationDefault', "Current Location")) {
            alert(t('sharedLayout.alertEnterPlace'));
            return;
        }
        setIsGeocoding(true);
        setError(null);
        setLocationError(null);
        setCoords('');
        try {
            const userAgent = 'AstrologyWebApp/1.0 (your-contact@example.com)';
            const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(placeName)}&format=json&limit=1&addressdetails=1`;
            const response = await axios.get(url, { headers: { 'User-Agent': userAgent } });
            if (response.data && response.data.length > 0) {
                const { lat, lon, display_name } = response.data[0];
                const latNum = parseFloat(lat);
                const lonNum = parseFloat(lon);
                if (!isNaN(latNum) && !isNaN(lonNum)) {
                    const formattedCoords = `${latNum.toFixed(6)},${lonNum.toFixed(6)}`;
                    setCoords(formattedCoords);
                    setPlaceName(display_name || placeName);
                } else { throw new Error('Received invalid coordinate data.'); }
            } else {
                setLocationError(t('sharedLayout.geocodingNotFound', { place: placeName }));
            }
        } catch (err) {
            console.error('Geocoding error:', err.response || err.message || err);
            setLocationError(t('sharedLayout.geocodingFailed', { message: err.response?.data?.error || err.message || 'Request failed.' }));
        } finally {
            setIsGeocoding(false);
        }
    }, [placeName, t]);

    // Main Calculation Handler
    const handleCalculateAll = useCallback(async (e) => {
        if (e) e.preventDefault();
        setIsLoading(true);
        setError(null);
        setLocationError(null);
        setMainResult(null);
        setKpResult(null);
        setCalculationInputParams(null); // Clear previous params

        const dateTimeValidation = validateAndFormatDateTime(date, t);
        if (!dateTimeValidation.isValid) { setError(dateTimeValidation.error); setIsLoading(false); return; }
        const coordsValidation = parseAndValidateCoords(coords, t);
        if (!coordsValidation.isValid) { setError(coordsValidation.error); setIsLoading(false); return; }

        const { formattedDate } = dateTimeValidation;
        const { latitude, longitude } = coordsValidation;
        const currentInputParams = { date: formattedDate, latitude, longitude, placeName: placeName };

        try {
            console.log(`Sending requests for date: ${formattedDate}, lat: ${latitude}, lon: ${longitude}`);
            const [mainResponse, kpResponse] = await Promise.all([
                api.post('/calculate', currentInputParams).catch(err => ({ error: err })),
                api.post('/kp-significators', currentInputParams).catch(err => ({ error: err }))
            ]);

            let errors = [];
            if (mainResponse.error) {
                console.error("Main calculation API error:", mainResponse.error.response?.data || mainResponse.error.message || mainResponse.error);
                errors.push(`Main Calc: ${mainResponse.error.response?.data?.error || mainResponse.error.message || t('sharedLayout.calculationFailedGeneric')}`);
                setMainResult(null);
            } else {
                setMainResult(mainResponse.data);
            }
            if (kpResponse.error) {
                console.error("KP Significator API error:", kpResponse.error.response?.data || kpResponse.error.message || kpResponse.error);
                errors.push(`KP Significators: ${kpResponse.error.response?.data?.error || kpResponse.error.message || t('sharedLayout.kpCalculationFailedGeneric')}`);
                setKpResult(null);
            } else {
                setKpResult({ ...kpResponse.data, inputParameters: currentInputParams });
            }

            // *** Set calculationInputParams AFTER requests complete ***
            // This ensures the useEffect depending on it runs with the correct data
            setCalculationInputParams(currentInputParams);

            if (errors.length > 0) setError(errors.join(' | '));

        } catch (err) {
            console.error("Overall calculation error:", err);
            setError(t('sharedLayout.calculationUnexpectedError'));
            setMainResult(null);
            setKpResult(null);
            setCalculationInputParams(null); // Clear params on overall error
        } finally {
            setIsLoading(false);
        }
    }, [date, coords, placeName, t]);

    // Effect to trigger initial calculation
    useEffect(() => {
        const hasValidInputs = date && coords && !locationError;
        const isReady = !isLoading && !isGeocoding && !isFetchingLocation;
        // Trigger only if calculationInputParams is not set yet (meaning first load or after error/reset)
        const needsCalculation = !calculationInputParams && !error;

        if (hasValidInputs && isReady && needsCalculation) {
            console.log("SharedInputLayout: Triggering initial calculation with default values...");
            handleCalculateAll();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [date, coords, locationError, isLoading, isGeocoding, isFetchingLocation, calculationInputParams, error]); // handleCalculateAll removed, added calculationInputParams

    // Time Adjustment Handlers
    const handleBirthTimeChange = useCallback((newDateTimeString) => {
        setAdjustedBirthDateTimeString(newDateTimeString);
    }, []);
    const handleGocharTimeChange = useCallback((newDateTimeString) => {
        setAdjustedGocharDateTimeString(newDateTimeString);
    }, []);

    // Fetch Saved Charts
    const fetchSavedCharts = useCallback(async () => {
        setIsLoadingSavedCharts(true);
        setSavedChartsError(null);
        setDeletingChartError(null);
        try {
            console.log("Fetching saved charts from API...");
            const response = await api.get('/charts');
            setSavedCharts(response.data?.charts || []);
        } catch (err) {
            console.error("Error fetching saved charts:", err);
            setSavedChartsError(t('sharedLayout.loadChartsFailed', { message: err.response?.data?.error || err.message || "Failed." }));
            setSavedCharts([]);
        } finally {
            setIsLoadingSavedCharts(false);
        }
    }, [t]);

    // Save Current Chart
    const handleSaveChart = useCallback(async () => {
        if (!name.trim()) {
            alert(t('sharedLayout.alertInvalidName'));
            return;
        }
        const dateTimeValidation = validateAndFormatDateTime(date, t);
        if (!dateTimeValidation.isValid) {
            alert(t('sharedLayout.alertInvalidDateTime', { error: dateTimeValidation.error }));
            return;
        }
        const coordsValidation = parseAndValidateCoords(coords, t);
        if (!coordsValidation.isValid) {
            alert(t('sharedLayout.alertInvalidCoords', { error: coordsValidation.error }));
            return;
        }

        setIsSavingChart(true);
        setSavingChartError(null);

        const chartDataToSave = {
            name: name.trim(),
            gender: gender,
            date: dateTimeValidation.formattedDate,
            latitude: coordsValidation.latitude,
            longitude: coordsValidation.longitude,
            placeName: placeName,
        };

        try {
            console.log("Saving chart data via API:", chartDataToSave);
            const response = await api.post('/charts', chartDataToSave);
            console.log("Chart saved successfully via API:", response.data);
            fetchSavedCharts();
        } catch (err) {
            console.error("Error saving chart via API:", err);
            const errorMsg = err.response?.data?.error || err.message || t('sharedLayout.saveChartFailedGeneric');
            setSavingChartError(errorMsg);
            alert(t('sharedLayout.saveChartErrorAlert', { message: errorMsg }));
        } finally {
            setIsSavingChart(false);
        }
    }, [name, gender, date, coords, placeName, fetchSavedCharts, t]);

    // Load Selected Chart
    const handleLoadChart = useCallback((chartToLoad) => {
        if (!chartToLoad) return;
        console.log("Loading chart:", chartToLoad.name, "with ID:", chartToLoad.id);
        setName(chartToLoad.name || '');
        setGender(chartToLoad.gender || '');
        let formattedLoadDate = '';
        if (chartToLoad.date) {
            try {
                // Use the validated string directly if possible, otherwise parse
                const validation = validateAndFormatDateTime(chartToLoad.date, t);
                if (validation.isValid && validation.formattedDate) {
                    // Need YYYY-MM-DDTHH:MM for input field
                    formattedLoadDate = validation.formattedDate.slice(0, 16);
                } else {
                    // Fallback parsing (less reliable)
                    const loadedDateObj = new Date(chartToLoad.date);
                    if (!isNaN(loadedDateObj.getTime())) {
                        const localDate = new Date(loadedDateObj.getTime() - loadedDateObj.getTimezoneOffset() * 60000);
                        formattedLoadDate = localDate.toISOString().slice(0, 16);
                    } else { console.error("Invalid date format in loaded chart data:", chartToLoad.date); }
                }
            } catch (e) { console.error("Error formatting loaded date:", e); }
        }
        setDate(formattedLoadDate);
        setCoords(`${chartToLoad.latitude?.toFixed(6) || ''},${chartToLoad.longitude?.toFixed(6) || ''}`);
        setPlaceName(chartToLoad.placeName || '');
        // Reset results and errors to trigger recalculation via useEffect
        setMainResult(null);
        setKpResult(null);
        setError(null);
        setLocationError(null);
        setCalculationInputParams(null); // *** Crucial: Reset params to force recalculation ***
        setShowLoadModal(false);
        setDeletingChartError(null);
    }, [t]); // Added t dependency

    // Delete Handler
    const handleDeleteChart = useCallback(async (chartIdToDelete, event) => {
        event.stopPropagation();

        if (!window.confirm(t('sharedLayout.deleteConfirmPrompt', { chartId: chartIdToDelete }))) {
            return;
        }

        setIsDeletingChart(true);
        setDeletingChartId(chartIdToDelete);
        setDeletingChartError(null);

        try {
            console.log(`Attempting to delete chart with ID: ${chartIdToDelete}`);
            await api.delete(`/charts/${chartIdToDelete}`);
            console.log(`Chart ${chartIdToDelete} deleted successfully.`);
            fetchSavedCharts();
        } catch (err) {
            console.error(`Error deleting chart ${chartIdToDelete}:`, err);
            const errorMsg = err.response?.data?.error || err.message || t('sharedLayout.deleteChartFailedGeneric');
            setDeletingChartError(t('sharedLayout.deleteChartErrorSpecific', { chartId: chartIdToDelete, message: errorMsg }));
        } finally {
            setIsDeletingChart(false);
            setDeletingChartId(null);
        }
    }, [fetchSavedCharts, t]);

    // --- Memos ---
    const locationForGocharTool = useMemo(() => {
        const coordsValidation = parseAndValidateCoords(coords); // No 't' needed here if errors aren't displayed
        if (coordsValidation.isValid) {
            return { lat: coordsValidation.latitude, lon: coordsValidation.longitude };
        } else if (calculationInputParams?.latitude && calculationInputParams?.longitude) {
            // Fallback to last calculated location if current input is invalid
            return { lat: calculationInputParams.latitude, lon: calculationInputParams.longitude };
        } else {
            return { lat: null, lon: null }; // No valid location available
        }
    }, [coords, calculationInputParams]);

    // --- RENDER ---
    return (
        <div className="shared-layout-container">
            {/* Top Strip */}
            <div className="top-strip">
                {/* Birth Time Rectification Tool */}
                <div className="top-strip-section birth-rectification-tool-section">
                    {/* Use adjustedBirthDateTimeString for the key to re-render on change */}
                    {calculationInputParams?.date && adjustedBirthDateTimeString ? (
                        <TimeAdjustmentTool
                            key={adjustedBirthDateTimeString} // Re-key when adjusted string changes
                            initialDateTimeString={calculationInputParams.date} // Always pass original for reset
                            onDateTimeChange={handleBirthTimeChange}
                            label={t('sharedLayout.rectificationToolLabel')}
                            showReset={true}
                        />
                    ) : (
                        <div className="tool-placeholder">{t('sharedLayout.rectificationPlaceholder')}</div>
                    )}
                </div>

                {/* Input Form Section */}
                <div className="top-strip-section input-form-section astrology-form-container">
                    <form onSubmit={handleCalculateAll} noValidate>
                        {/* Row 1: Name & Gender */}
                        <div className="form-row">
                            <div className="input-group half-width">
                                <label htmlFor="name-input">{t('sharedLayout.nameLabel')}</label>
                                <input
                                    id="name-input" type="text" value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    placeholder={t('sharedLayout.namePlaceholder')}
                                    disabled={isLoading || isGeocoding || isFetchingLocation || isSavingChart}
                                />
                            </div>
                            <div className="input-group half-width">
                                <label htmlFor="gender-select">{t('sharedLayout.genderLabel')}</label>
                                <select
                                    id="gender-select" value={gender}
                                    onChange={(e) => setGender(e.target.value)}
                                    disabled={isLoading || isGeocoding || isFetchingLocation || isSavingChart}
                                >
                                    <option value="">{t('sharedLayout.genderSelectPlaceholder')}</option>
                                    <option value="Male">{t('sharedLayout.genderMale')}</option>
                                    <option value="Female">{t('sharedLayout.genderFemale')}</option>
                                    <option value="Other">{t('sharedLayout.genderOther')}</option>
                                </select>
                            </div>
                        </div>

                        {/* Row 2: Date & Time */}
                        <div className="form-row">
                            <div className="input-group full-width">
                                <label htmlFor="date-input">{t('sharedLayout.dateTimeLabel')}</label>
                                <input
                                    id="date-input" type="datetime-local" value={date} // YYYY-MM-DDTHH:MM
                                    onChange={(e) => setDate(e.target.value)} required aria-required="true" step="1"
                                    disabled={isLoading || isGeocoding || isFetchingLocation || isSavingChart}
                                />
                            </div>
                        </div>

                        {/* Row 3: Place & Find Coords */}
                        <div className="form-row">
                            <div className="input-group place-group">
                                <label htmlFor="place-input">{t('sharedLayout.placeLabel')}</label>
                                <input
                                    id="place-input" type="text" value={placeName}
                                    onChange={(e) => setPlaceName(e.target.value)}
                                    placeholder={t('sharedLayout.placePlaceholder')}
                                    disabled={isGeocoding || isLoading || isFetchingLocation || isSavingChart}
                                />
                            </div>
                            <div className="button-container find-coords-button">
                                <button type="button" onClick={handleFindCoordinates}
                                    disabled={isGeocoding || isLoading || isFetchingLocation || isSavingChart || !placeName.trim() || placeName === t('sharedLayout.currentLocationDefault', "Current Location")}
                                    title={t('sharedLayout.findCoordsTitle')}
                                >
                                    {isGeocoding ? t('sharedLayout.findingCoordsButton') : t('sharedLayout.findCoordsButton')}
                                </button>
                                {isGeocoding && <div className="loader small-loader" aria-label={t('sharedLayout.findingCoordsButton')}></div>}
                            </div>
                        </div>

                        {/* Row 4: Coordinates */}
                        <div className="form-row">
                             <div className="input-group full-width">
                                <label htmlFor="coords-input">{t('sharedLayout.coordsLabel')}</label>
                                <input
                                    id="coords-input" type="text" value={coords}
                                    onChange={(e) => setCoords(e.target.value)}
                                    placeholder={t('sharedLayout.coordsPlaceholder')}
                                    required aria-required="true"
                                    disabled={isLoading || isGeocoding || isFetchingLocation || isSavingChart}
                                    title={t('sharedLayout.coordsTitle')}
                                />
                                {isFetchingLocation && <p className="hint-text loading-text small-hint">{t('sharedLayout.fetchingLocationHint')}</p>}
                                {locationError && <p className="error-text small-error">{locationError}</p>}
                            </div>
                        </div>

                        {/* Row 5: Action Buttons */}
                        <div className="form-row action-buttons-row">
                            <div className="submit-button-container">
                                <button type="submit" disabled={isLoading || isGeocoding || isFetchingLocation || isSavingChart}>
                                    {isLoading ? t('sharedLayout.calculatingButton') : t('sharedLayout.calculateButton')}
                                </button>
                            </div>
                            <div className="save-load-button-container">
                                <button type="button" onClick={handleSaveChart} disabled={isSavingChart || isLoading || isGeocoding || isFetchingLocation || !name.trim()}>
                                    {isSavingChart ? t('sharedLayout.savingButton') : t('sharedLayout.saveChartButton')}
                                </button>
                            </div>
                            <div className="save-load-button-container">
                                <button type="button" onClick={() => { setShowLoadModal(true); fetchSavedCharts(); }} disabled={isLoadingSavedCharts || isLoading || isGeocoding || isFetchingLocation || isSavingChart}>
                                    {isLoadingSavedCharts ? t('sharedLayout.loadingListButton') : t('sharedLayout.loadChartButton')}
                                </button>
                            </div>
                        </div>

                         {/* Global Loading/Error */}
                         {isLoading && <div className="main-loader small-loader" aria-live="polite">{t('sharedLayout.calculatingButton')}</div>}
                         {error && <p className="error-text small-error calculation-error" role="alert">{t('sharedLayout.calculationErrorPrefix')}: {error}</p>}
                         {savingChartError && <p className="error-text small-error save-load-error" role="alert">{t('sharedLayout.saveErrorPrefix')}: {savingChartError}</p>}
                    </form>
                </div>

                {/* Gochar Time Progression Tool */}
                <div className="top-strip-section transit-adjustment-tool-section">
                    {/* Use adjustedGocharDateTimeString for key */}
                    {locationForGocharTool.lat !== null && locationForGocharTool.lon !== null && adjustedGocharDateTimeString ? (
                        <TimeAdjustmentTool
                            key={adjustedGocharDateTimeString} // Re-key when adjusted string changes
                            initialDateTimeString={adjustedGocharDateTimeString} // Pass current adjusted string
                            onDateTimeChange={handleGocharTimeChange}
                            label={t('sharedLayout.gocharToolLabel')}
                            showReset={false} // Typically no reset needed for Gochar
                        />
                    ) : (
                         <div className="tool-placeholder">{t('sharedLayout.gocharPlaceholder')}</div>
                    )}
                </div>
            </div> {/* End Top Strip */}

            {/* Load Chart Modal */}
            {showLoadModal && (
                <div className="modal-overlay" onClick={() => { setShowLoadModal(false); setDeletingChartError(null); }}>
                    <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                        <h3>{t('sharedLayout.loadModalTitle')}</h3>
                        {isLoadingSavedCharts && <div className="loader">{t('sharedLayout.loadModalLoading')}</div>}
                        {savedChartsError && <p className="error-text">{savedChartsError}</p>}
                        {deletingChartError && <p className="error-text">{deletingChartError}</p>}

                        {!isLoadingSavedCharts && !savedChartsError && (
                            savedCharts.length > 0 ? (
                                <ul className="saved-charts-list">
                                    {savedCharts.map(chart => (
                                        <li key={chart.id}>
                                            <div className="chart-info" onClick={() => handleLoadChart(chart)}>
                                                <strong>{chart.name}</strong> ({t(`sharedLayout.gender${chart.gender}`) || chart.gender || t('utils.notAvailable', 'N/A')})
                                                <br />
                                                {/* Format date from loaded chart data */}
                                                <small>{formatToLocalISOString(new Date(chart.date))} - {chart.placeName}</small>
                                            </div>
                                            <button
                                                className="delete-chart-button"
                                                onClick={(e) => handleDeleteChart(chart.id, e)}
                                                disabled={isDeletingChart && deletingChartId === chart.id}
                                                title={t('sharedLayout.deleteButtonTitle', { chartName: chart.name })}
                                            >
                                                {isDeletingChart && deletingChartId === chart.id ? t('sharedLayout.deletingButton') : t('sharedLayout.deleteButton')}
                                            </button>
                                        </li>
                                    ))}
                                </ul>
                            ) : (
                                <p>{t('sharedLayout.loadModalNoCharts')}</p>
                            )
                        )}
                        <button onClick={() => { setShowLoadModal(false); setDeletingChartError(null); }} className="modal-close-button">{t('sharedLayout.loadModalCloseButton')}</button>
                    </div>
                </div>
            )}

            {/* Content Area */}
            <div className="content-area">
                <Outlet context={{
                    mainResult,
                    kpResult,
                    isLoading,
                    error,
                    calculationInputParams,
                    adjustedBirthDateTimeString,
                    handleBirthTimeChange,
                    adjustedGocharDateTimeString,
                    handleGocharTimeChange,
                    locationForGocharTool,
                    currentName: name,
                    currentGender: gender,
                    currentDate: date,
                    currentCoords: coords,
                    currentPlaceName: placeName,
                    isGeocoding,
                    isFetchingLocation
                 }} />
            </div>
        </div>
    );
};

export default SharedInputLayout;
