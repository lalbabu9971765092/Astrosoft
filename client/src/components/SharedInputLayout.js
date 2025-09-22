// src/SharedInputLayout.js
import React, { useState, useCallback, useEffect, useMemo, useRef } from 'react';
import { Outlet } from 'react-router-dom';
import axios from 'axios';
import { useTranslation } from 'react-i18next';
// --- Import Icons ---
import { FaChevronUp, FaEdit } from 'react-icons/fa'; // Added FaEdit for collapsed state
// --- Import Styles ---
import '../styles/SharedInputLayout.css';
import '../styles/AstrologyForm.css'; // Keep if styles are shared
// --- Import Utils ---
import {
    validateAndFormatDateTime,
    parseAndValidateCoords,
    formatToLocalISOString,
} from './AstrologyUtils';
import api from './api';
import TimeAdjustmentTool from './TimeAdjustmentTool';

const SharedInputLayout = () => {
    const { t } = useTranslation();

    // --- State ---
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
    const [isSavingChart, setIsSavingChart] = useState(false);
    const [savingChartError, setSavingChartError] = useState(null);
    const [isTopStripCollapsed, setIsTopStripCollapsed] = useState(false);
    const [initialBirthDateTime, setInitialBirthDateTime] = useState(null);
    const hasSetInitialBirthDate = useRef(false);
    const [initialGocharDateTime, setInitialGocharDateTime] = useState(null);
    const [transitDateTime, setTransitDateTime] = useState('');
    const [transitPlaceName, setTransitPlaceName] = useState('');
    const [transitCoords, setTransitCoords] = useState('');
    const [transitResult, setTransitResult] = useState(null);
    const [isCalculatingTransit, setIsCalculatingTransit] = useState(false);
    const [transitError, setTransitError] = useState(null);


    const fetchSavedCharts = useCallback(async () => {
        try {
            await api.get('/charts');
        } catch (err) {
            console.error("Error fetching saved charts:", err);
        }
    }, []);

    const calculateInitialTransit = useCallback(async (initialTransitDateTime, initialTransitCoords, initialTransitPlaceName) => {
        setIsCalculatingTransit(true);
        setTransitError(null);

        const dateTimeValidation = validateAndFormatDateTime(initialTransitDateTime, t);
        if (!dateTimeValidation.isValid) {
            setTransitError(dateTimeValidation.error);
            setIsCalculatingTransit(false);
            return;
        }
        const coordsValidation = parseAndValidateCoords(initialTransitCoords, t);
        if (!coordsValidation.isValid) {
            setTransitError(coordsValidation.error);
            setIsCalculatingTransit(false);
            return;
        }

        const { formattedDate } = dateTimeValidation;
        const { latitude, longitude } = coordsValidation;
        const transitInputParams = { date: formattedDate, latitude, longitude, placeName: initialTransitPlaceName };

        try {
            const response = await api.post('/calculate', transitInputParams);
            setTransitResult(response.data);
        } catch (err) {
            console.error("Initial transit calculation API error:", err.response?.data || err.message || err);
            setTransitError(err.response?.data?.error || err.message || t('sharedLayout.calculationFailedGeneric'));
            setTransitResult(null);
        } finally {
            setIsCalculatingTransit(false);
        }
    }, [t]);

    // --- Effects ---
    useEffect(() => {
        const now = new Date();
        const timezoneOffsetMinutes = now.getTimezoneOffset();
        const localNow = new Date(now.getTime() - timezoneOffsetMinutes * 60000);
        const formattedDateTimeInput = localNow.toISOString().slice(0, 16);
        setDate(formattedDateTimeInput);
        setTransitDateTime(formattedDateTimeInput);

        const initialGocharStr = formatToLocalISOString(now);
        setAdjustedGocharDateTimeString(initialGocharStr);
        setInitialGocharDateTime(initialGocharStr);

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
                    setTransitCoords(formattedCoords);
                    setTransitPlaceName(t('sharedLayout.currentLocationDefault', "Current Location"));
                    setIsFetchingLocation(false);
                    calculateInitialTransit(formattedDateTimeInput, formattedCoords, t('sharedLayout.currentLocationDefault', "Current Location"));
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
    }, [t, fetchSavedCharts, calculateInitialTransit]);

    useEffect(() => {
        if (calculationInputParams?.date) {
            setAdjustedBirthDateTimeString(calculationInputParams.date);
            if (!hasSetInitialBirthDate.current) {
                setInitialBirthDateTime(calculationInputParams.date);
                hasSetInitialBirthDate.current = true;
            }
        } else {
            setAdjustedBirthDateTimeString(null);
            setInitialBirthDateTime(null);
            hasSetInitialBirthDate.current = false;
        }
    }, [calculationInputParams]);

    const handleLoadChart = useCallback((chartToLoad) => {
        if (!chartToLoad) return;
        setName(chartToLoad.name || '');
        setGender(chartToLoad.gender || '');
        let formattedLoadDate = '';
        if (chartToLoad.date) {
            try {
                const validation = validateAndFormatDateTime(chartToLoad.date, t);
                if (validation.isValid && validation.formattedDate) {
                    formattedLoadDate = validation.formattedDate.slice(0, 16);
                } else {
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
        setMainResult(null); setKpResult(null); setError(null); setLocationError(null); setCalculationInputParams(null);
    }, [t]);

    useEffect(() => {
        const handleChartLoadEvent = (event) => {
            const { chartToLoad } = event.detail;
            if (chartToLoad) {
                handleLoadChart(chartToLoad);
            }
        };

        window.addEventListener('loadChart', handleChartLoadEvent);

        return () => {
            window.removeEventListener('loadChart', handleChartLoadEvent);
        };
    }, [handleLoadChart]);

    // --- Handlers ---
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

    const handleFindTransitCoordinates = useCallback(async () => {
        if (!transitPlaceName.trim() || transitPlaceName === t('sharedLayout.currentLocationDefault', "Current Location")) {
            alert(t('sharedLayout.alertEnterPlace'));
            return;
        }
        setIsGeocoding(true);
        setTransitError(null);
        setTransitCoords('');
        try {
            const userAgent = 'AstrologyWebApp/1.0 (your-contact@example.com)';
            const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(transitPlaceName)}&format=json&limit=1&addressdetails=1`;
            const response = await axios.get(url, { headers: { 'User-Agent': userAgent } });
            if (response.data && response.data.length > 0) {
                const { lat, lon, display_name } = response.data[0];
                const latNum = parseFloat(lat);
                const lonNum = parseFloat(lon);
                if (!isNaN(latNum) && !isNaN(lonNum)) {
                    const formattedCoords = `${latNum.toFixed(6)},${lonNum.toFixed(6)}`;
                    setTransitCoords(formattedCoords);
                    setTransitPlaceName(display_name || transitPlaceName);
                } else { throw new Error('Received invalid coordinate data.'); }
            } else {
                setTransitError(t('sharedLayout.geocodingNotFound', { place: transitPlaceName }));
            }
        } catch (err) {
            console.error('Geocoding error:', err.response || err.message || err);
            setTransitError(t('sharedLayout.geocodingFailed', { message: err.response?.data?.error || err.message || 'Request failed.' }));
        } finally {
            setIsGeocoding(false);
        }
    }, [transitPlaceName, t]);

    const handleCalculateAll = useCallback(async (e, gocharDate = null) => {
        if (e) e.preventDefault();
        setIsLoading(true);
        setError(null);
        setLocationError(null);
        setMainResult(null);
        setKpResult(null);


        const dateTimeToUse = gocharDate || date;

        const dateTimeValidation = validateAndFormatDateTime(dateTimeToUse, t);
        if (!dateTimeValidation.isValid) { setError(dateTimeValidation.error); setIsLoading(false); return; }
        const coordsValidation = parseAndValidateCoords(coords, t);
        if (!coordsValidation.isValid) { setError(coordsValidation.error); setIsLoading(false); return; }

        const { formattedDate } = dateTimeValidation;
        const { latitude, longitude } = coordsValidation;
        const currentInputParams = { date: formattedDate, latitude, longitude, placeName: placeName };

        try {
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

            if (JSON.stringify(currentInputParams) !== JSON.stringify(calculationInputParams)) {
                setCalculationInputParams(currentInputParams);
            }
            if (errors.length > 0) setError(errors.join(' | '));

        } catch (err) {
            console.error("Overall calculation error:", err);
            setError(t('sharedLayout.calculationUnexpectedError'));
            setMainResult(null); setKpResult(null); setCalculationInputParams(null);
        } finally {
            setIsLoading(false);
        }
    }, [date, coords, placeName, t, calculationInputParams]);

    const handleUpdateTransit = useCallback(async (e) => {
        if (e) e.preventDefault();
        setIsCalculatingTransit(true);
        setTransitError(null);
        setTransitResult(null);

        const dateTimeValidation = validateAndFormatDateTime(transitDateTime, t);
        if (!dateTimeValidation.isValid) { setTransitError(dateTimeValidation.error); setIsCalculatingTransit(false); return; }
        const coordsValidation = parseAndValidateCoords(transitCoords, t);
        if (!coordsValidation.isValid) { setTransitError(coordsValidation.error); setIsCalculatingTransit(false); return; }

        const { formattedDate } = dateTimeValidation;
        const { latitude, longitude } = coordsValidation;
        const transitInputParams = { date: formattedDate, latitude, longitude, placeName: transitPlaceName };

        try {
            const response = await api.post('/calculate', transitInputParams);
            setTransitResult(response.data);
            setAdjustedGocharDateTimeString(formattedDate);
        } catch (err) {
            console.error("Transit calculation API error:", err.response?.data || err.message || err);
            setTransitError(err.response?.data?.error || err.message || t('sharedLayout.calculationFailedGeneric'));
            setTransitResult(null);
        } finally {
            setIsCalculatingTransit(false);
        }
    }, [transitDateTime, transitCoords, transitPlaceName, t]);

    useEffect(() => {
        const hasValidInputs = date && coords && !locationError;
        const isReady = !isLoading && !isGeocoding && !isFetchingLocation;
        const needsCalculation = !calculationInputParams && !error;

        if (hasValidInputs && isReady && needsCalculation) {
            handleCalculateAll();
        }
    }, [date, coords, locationError, isLoading, isGeocoding, isFetchingLocation, calculationInputParams, error, handleCalculateAll]);

    const handleBirthTimeChange = useCallback((newDateTimeString) => {
        setAdjustedBirthDateTimeString(newDateTimeString);

        const dateObj = new Date(newDateTimeString);
        if (!isNaN(dateObj.getTime())) {
            const localDate = new Date(dateObj.getTime() - dateObj.getTimezoneOffset() * 60000);
            const formattedForInput = localDate.toISOString().slice(0, 16);
            setDate(formattedForInput);
        } else {
            setDate(newDateTimeString.slice(0, 16));
        }

        handleCalculateAll(null, newDateTimeString);
    }, [handleCalculateAll]);

    const handleGocharTimeChange = useCallback((newDateTimeString) => {
        setAdjustedGocharDateTimeString(newDateTimeString);
    }, []);

    const handleSaveChart = useCallback(async () => {
        if (!name.trim()) { alert(t('sharedLayout.alertInvalidName')); return; }
        const dateTimeValidation = validateAndFormatDateTime(date, t);
        if (!dateTimeValidation.isValid) { alert(t('sharedLayout.alertInvalidDateTime', { error: dateTimeValidation.error })); return; }
        const coordsValidation = parseAndValidateCoords(coords, t);
        if (!coordsValidation.isValid) { alert(t('sharedLayout.alertInvalidCoords', { error: coordsValidation.error })); return; }

        setIsSavingChart(true); setSavingChartError(null);
        const chartDataToSave = { name: name.trim(), gender: gender, date: dateTimeValidation.formattedDate, latitude: coordsValidation.latitude, longitude: coordsValidation.longitude, placeName: placeName };
        try {
            await api.post('/charts', chartDataToSave);
            fetchSavedCharts();
        } catch (err) {
            console.error("Error saving chart via API:", err);
            const errorMsg = err.response?.data?.error || err.message || t('sharedLayout.saveChartFailedGeneric');
            setSavingChartError(errorMsg); alert(t('sharedLayout.saveChartErrorAlert', { message: errorMsg }));
        } finally { setIsSavingChart(false); }
    }, [name, gender, date, coords, placeName, fetchSavedCharts, t]);

    const handleOpenLoadChartWindow = () => {
        const newWindow = window.open('/saved-charts', 'SavedCharts', 'width=600,height=400');
        if (newWindow) newWindow.focus();
    };

    const locationForGocharTool = useMemo(() => {
        const coordsValidation = parseAndValidateCoords(coords);
        if (coordsValidation.isValid) {
            return { lat: coordsValidation.latitude, lon: coordsValidation.longitude };
        } else if (calculationInputParams?.latitude && calculationInputParams?.longitude) {
            return { lat: calculationInputParams.latitude, lon: calculationInputParams.longitude };
        } else {
            return { lat: null, lon: null };
        }
    }, [coords, calculationInputParams]);

    const toggleTopStripCollapse = () => {
        setIsTopStripCollapsed(prev => !prev);
    };

    return (
        <div className="shared-layout-container">
            <div
                id="top-strip-controls"
                className={`top-strip ${isTopStripCollapsed ? 'collapsed' : ''}`}
            >
                <button
                    onClick={toggleTopStripCollapse}
                    className="top-strip-toggle-button"
                    title={isTopStripCollapsed ? t('sharedLayout.expandInputs') : t('sharedLayout.collapseInputs')}
                    aria-expanded={!isTopStripCollapsed}
                    aria-controls="top-strip-controls"
                >
                    {isTopStripCollapsed ? <FaEdit /> : <FaChevronUp />}
                    <span className="sr-only">
                        {isTopStripCollapsed ? t('sharedLayout.expandInputs') : t('sharedLayout.collapseInputs')}
                    </span>
                </button>

                <div className="top-strip-section birth-rectification-tool-section">
                    {calculationInputParams?.date && adjustedBirthDateTimeString ? (
                        <TimeAdjustmentTool
                           key="birth-time-adjustment-tool"
                            initialDateTimeString={initialBirthDateTime}
                            value={adjustedBirthDateTimeString}
                            onDateTimeChange={handleBirthTimeChange}
                            label={t('sharedLayout.rectificationToolLabel')}
                            showReset={true}
                        />
                    ) : (
                        <div className="tool-placeholder">{t('sharedLayout.rectificationPlaceholder')}</div>
                    )}
                </div>

                <div className="top-strip-section input-form-section astrology-form-container">
                    <form onSubmit={handleCalculateAll} noValidate>
                        <h3>{t('sharedLayout.birthDetailsTitle', 'Birth Details')}</h3>
                        <div className="form-row">
                            <div className="input-group half-width">
                                <label htmlFor="name-input">{t('sharedLayout.nameLabel')}</label>
                                <input id="name-input" type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder={t('sharedLayout.namePlaceholder')} disabled={isLoading || isGeocoding || isFetchingLocation || isSavingChart} />
                            </div>
                            <div className="input-group half-width">
                                <label htmlFor="gender-select">{t('sharedLayout.genderLabel')}</label>
                                <select id="gender-select" value={gender} onChange={(e) => setGender(e.target.value)} disabled={isLoading || isGeocoding || isFetchingLocation || isSavingChart}>
                                    <option value="">{t('sharedLayout.genderSelectPlaceholder')}</option>
                                    <option value="Male">{t('sharedLayout.genderMale')}</option>
                                    <option value="Female">{t('sharedLayout.genderFemale')}</option>
                                    <option value="Other">{t('sharedLayout.genderOther')}</option>
                                </select>
                            </div>
                        </div>
                        <div className="form-row">
                            <div className="input-group full-width">
                                <label htmlFor="date-input">{t('sharedLayout.dateTimeLabel')}</label>
                                <input id="date-input" type="datetime-local" value={date} onChange={(e) => setDate(e.target.value)} required aria-required="true" step="1" disabled={isLoading || isGeocoding || isFetchingLocation || isSavingChart} />
                            </div>
                        </div>
                        <div className="form-row">
                            <div className="input-group place-group">
                                <label htmlFor="place-input">{t('sharedLayout.placeLabel')}</label>
                                <input id="place-input" type="text" value={placeName} onChange={(e) => setPlaceName(e.target.value)} placeholder={t('sharedLayout.placePlaceholder')} disabled={isGeocoding || isLoading || isFetchingLocation || isSavingChart} />
                            </div>
                            <div className="button-container find-coords-button">
                                <button type="button" onClick={handleFindCoordinates} disabled={isGeocoding || isLoading || isFetchingLocation || isSavingChart || !placeName.trim() || placeName === t('sharedLayout.currentLocationDefault', "Current Location")} title={t('sharedLayout.findCoordsTitle')}>
                                    {isGeocoding ? t('sharedLayout.findingCoordsButton') : t('sharedLayout.findCoordsButton')}
                                </button>
                                {isGeocoding && <div className="loader small-loader" aria-label={t('sharedLayout.findingCoordsButton')}></div>}
                            </div>
                        </div>
                        <div className="form-row">
                             <div className="input-group full-width">
                                <label htmlFor="coords-input">{t('sharedLayout.coordsLabel')}</label>
                                <input id="coords-input" type="text" value={coords} onChange={(e) => setCoords(e.target.value)} placeholder={t('sharedLayout.coordsPlaceholder')} required aria-required="true" disabled={isLoading || isGeocoding || isFetchingLocation || isSavingChart} title={t('sharedLayout.coordsTitle')} />
                                {isFetchingLocation && <p className="hint-text loading-text small-hint">{t('sharedLayout.fetchingLocationHint')}</p>}
                                {locationError && <p className="error-text small-error">{locationError}</p>}
                            </div>
                        </div>
                        <div className="form-row">
                            <div className="action-buttons-row">
                                    <button type="submit" disabled={isLoading || isGeocoding || isFetchingLocation || isSavingChart}>
                                        {isLoading ? t('sharedLayout.calculatingButton') : t('sharedLayout.calculateButton')}
                                    </button>
                                    <button type="button" onClick={handleSaveChart} disabled={isSavingChart || isLoading || isGeocoding || isFetchingLocation || !name.trim()}>
                                        {isSavingChart ? t('sharedLayout.savingButton') : t('sharedLayout.saveChartButton')}
                                    </button>
                                    <button type="button" onClick={handleOpenLoadChartWindow} disabled={isLoading || isGeocoding || isFetchingLocation || isSavingChart}>
                                        {t('sharedLayout.loadChartButton')}
                                    </button>
                                </div>
                        </div>
                         {isLoading && <div className="main-loader small-loader" aria-live="polite">{t('sharedLayout.calculatingButton')}</div>}
                         {error && <p className="error-text small-error calculation-error" role="alert">{t('sharedLayout.calculationErrorPrefix')}: {error}</p>}
                         {savingChartError && <p className="error-text small-error save-load-error" role="alert">{t('sharedLayout.saveErrorPrefix')}: {savingChartError}</p>}
                        <hr />
                        <h3>{t('sharedLayout.transitDetailsTitle', 'Transit Details')}</h3>
                        <div className="form-row">
                            <div className="input-group full-width">
                                <label htmlFor="transit-date-input">{t('sharedLayout.transitDateTimeLabel', 'Transit Time')}</label>
                                <input id="transit-date-input" type="datetime-local" value={transitDateTime} onChange={(e) => setTransitDateTime(e.target.value)} step="1" disabled={isCalculatingTransit || isGeocoding} />
                            </div>
                        </div>
                        <div className="form-row">
                            <div className="input-group place-group">
                                <label htmlFor="transit-place-input">{t('sharedLayout.transitPlaceLabel', 'Transit Place')}</label>
                                <input id="transit-place-input" type="text" value={transitPlaceName} onChange={(e) => setTransitPlaceName(e.target.value)} placeholder={t('sharedLayout.placePlaceholder')} disabled={isCalculatingTransit || isGeocoding} />
                            </div>
                            <div className="button-container find-coords-button">
                                <button type="button" onClick={handleFindTransitCoordinates} disabled={isCalculatingTransit || isGeocoding || !transitPlaceName.trim() || transitPlaceName === t('sharedLayout.currentLocationDefault', "Current Location")} title={t('sharedLayout.findCoordsTitle')}>
                                    {isGeocoding ? t('sharedLayout.findingCoordsButton') : t('sharedLayout.findCoordsButton')}
                                </button>
                                {isGeocoding && <div className="loader small-loader" aria-label={t('sharedLayout.findingCoordsButton')}></div>}
                            </div>
                        </div>
                        <div className="form-row">
                             <div className="input-group full-width">
                                <label htmlFor="transit-coords-input">{t('sharedLayout.coordsLabel')}</label>
                                <input id="transit-coords-input" type="text" value={transitCoords} onChange={(e) => setTransitCoords(e.target.value)} placeholder={t('sharedLayout.coordsPlaceholder')} required aria-required="true" disabled={isCalculatingTransit || isGeocoding} title={t('sharedLayout.coordsTitle')} />
                                {transitError && <p className="error-text small-error">{transitError}</p>}
                            </div>
                        </div>
                        <div className="form-row action-buttons-row">
                            <div className="submit-button-container">
                                <button type="button" onClick={handleUpdateTransit} disabled={isCalculatingTransit || isGeocoding}>
                                    {isCalculatingTransit ? t('sharedLayout.calculatingButton') : t('sharedLayout.updateTransitButton', 'Update Transit')}
                                </button>
                            </div>
                        </div>
                        {isCalculatingTransit && <div className="main-loader small-loader" aria-live="polite">{t('sharedLayout.calculatingButton')}</div>}
                    </form>
                </div>

                <div className="top-strip-section transit-adjustment-tool-section">
                    {locationForGocharTool.lat !== null && locationForGocharTool.lon !== null && adjustedGocharDateTimeString ? (
                        <TimeAdjustmentTool
                            initialDateTimeString={initialGocharDateTime}
                            value={adjustedGocharDateTimeString}
                            onDateTimeChange={handleGocharTimeChange}
                            label={t('sharedLayout.gocharToolLabel')}
                            showReset={true}
                        />
                    ) : (
                         <div className="tool-placeholder">{t('sharedLayout.gocharPlaceholder')}</div>
                    )}
                </div>
            </div>

            <div className="content-area">
                <Outlet context={{
                    mainResult, kpResult, isLoading, error, calculationInputParams,
                    adjustedBirthDateTimeString, handleBirthTimeChange,
                    adjustedGocharDateTimeString, handleGocharTimeChange,
                    locationForGocharTool, currentName: name, currentGender: gender,
                    currentDate: date, currentCoords: coords, currentPlaceName: placeName,
                    isGeocoding, isFetchingLocation, transitDateTime, transitResult,
                    isCalculatingTransit, transitError, transitPlaceName
                 }} />
            </div>
        </div>
    );
};

export default SharedInputLayout;
