// src/components/MuhurtaPage.jsx
import React, { useState, useCallback, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useOutletContext } from 'react-router-dom';
import api from './api';
import { validateAndFormatDateTime } from './AstrologyUtils';

import moment from 'moment-timezone';
import { FaChevronDown, FaChevronUp } from 'react-icons/fa'; // Import icons
import '../../src/styles/MuhurtaPage.css'; // Import the new CSS file

const MuhurtaPage = () => {
    const { t } = useTranslation();
    // Get context from SharedInputLayout
    const {
        adjustedGocharDateTimeString, // Use the transit time
        locationForGocharTool, // Use the transit location
        isLoading: parentIsLoading,
        error: parentError,
    } = useOutletContext() || {};

    const [muhurtaData, setMuhurtaData] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);

    // State for collapsible sections
    const [isChoghadiyaCollapsed, setIsChoghadiyaCollapsed] = useState(false);
    const [isHorasCollapsed, setIsHorasCollapsed] = useState(false);
    const [isLagnasCollapsed, setIsLagnasCollapsed] = useState(false);
    const [isMuhurtaCollapsed, setIsMuhurtaCollapsed] = useState(false);

    // Generic toggle function
    const toggleCollapse = useCallback((setter) => {
        setter(prev => !prev);
    }, []);

    const handleCalculateMuhurta = useCallback(async () => {
        if (!adjustedGocharDateTimeString || !locationForGocharTool?.lat || !locationForGocharTool?.lon) {
            setMuhurtaData(null);
            setError(t('muhurtaPage.noDataYet', 'Please calculate a chart first to see Muhurta details.'));
            return;
        }

        // Validate and format the date before sending it to the backend
        const dateTimeValidation = validateAndFormatDateTime(adjustedGocharDateTimeString, t);
        if (!dateTimeValidation.isValid) {
            setError(t('muhurtaPage.invalidDateFormatError', { error: dateTimeValidation.error }));
            setIsLoading(false);
            setMuhurtaData(null);
            return;
        }
        const formattedDateForApi = dateTimeValidation.formattedDate;

        setIsLoading(true);
        setError(null);
        setMuhurtaData(null);

        try {
            const payload = {
                date: formattedDateForApi, // Use the correctly formatted date
                latitude: locationForGocharTool.lat,
                longitude: locationForGocharTool.lon,
            };
            const response = await api.post('/calculate-muhurta', payload);
            setMuhurtaData(response.data);
        } catch (err) {
            console.error("Error fetching muhurta data:", err);
            setError(err.response?.data?.error || err.message || t('muhurtaPage.fetchError'));
        } finally {
            setIsLoading(false);
        }
    }, [adjustedGocharDateTimeString, locationForGocharTool, t]);

    // Trigger Muhurta calculation when transit time or location change
    useEffect(() => {
        handleCalculateMuhurta();
    }, [handleCalculateMuhurta]);

    const renderChoghadiya = (choghadiyas) => {
        if (!choghadiyas || choghadiyas.length === 0) return <p>{t('muhurtaPage.noChoghadiya')}</p>;
        return (
            <div className="muhurta-section">
                <div className="section-header" onClick={() => toggleCollapse(setIsChoghadiyaCollapsed)}>
                    <h3>{t('muhurtaPage.choghadiyaTitle')}</h3>
                    <button className="toggle-button">
                        {isChoghadiyaCollapsed ? <FaChevronDown /> : <FaChevronUp />}
                    </button>
                </div>
                <div className={`section-content ${isChoghadiyaCollapsed ? 'collapsed' : ''}`}>
                    <div className="table-wrapper">
                        <table className="results-table">
                            <thead>
                                <tr>
                                    <th>{t('muhurtaPage.type')}</th>
                                    <th>{t('muhurtaPage.name')}</th>
                                    <th>{t('muhurtaPage.lord')}</th>
                                    <th>{t('muhurtaPage.periodType')}</th>
                                    <th>{t('muhurtaPage.start')}</th>
                                    <th>{t('muhurtaPage.end')}</th>
                                </tr>
                            </thead>
                            <tbody>
                                {choghadiyas.map((c, index) => (
                                    <tr key={index}>
                                        <td>{t(`choghadiyaTypes.${c.type}`, { defaultValue: c.type })}</td>
                                        <td>{t(`choghadiyaNames.${c.name}`, { defaultValue: c.name })}</td>
                                        <td>{t(`planets.${c.lord}`, { defaultValue: c.lord })}</td>
                                        <td>{t(`choghadiyaPeriodTypes.${c.periodType}`, { defaultValue: c.periodType })}</td>
                                        <td>{moment(c.start).format('HH:mm:ss')}</td>
                                        <td>{moment(c.end).format('HH:mm:ss')}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        );
    };

    const renderHoras = (horas) => {
        if (!horas || horas.length === 0) return <p>{t('muhurtaPage.noHoras')}</p>;
        return (
            <div className="muhurta-section">
                <div className="section-header" onClick={() => toggleCollapse(setIsHorasCollapsed)}>
                    <h3>{t('muhurtaPage.horasTitle')}</h3>
                    <button className="toggle-button">
                        {isHorasCollapsed ? <FaChevronDown /> : <FaChevronUp />}
                    </button>
                </div>
                <div className={`section-content ${isHorasCollapsed ? 'collapsed' : ''}`}>
                    <div className="table-wrapper">
                        <table className="results-table">
                            <thead>
                                <tr>
                                    <th>{t('muhurtaPage.type')}</th>
                                    <th>{t('muhurtaPage.lord')}</th>
                                    <th>{t('muhurtaPage.start')}</th>
                                    <th>{t('muhurtaPage.end')}</th>
                                </tr>
                            </thead>
                            <tbody>
                                {horas.map((h, index) => (
                                    <tr key={index}>
                                        <td>{t(`choghadiyaTypes.${h.type}`, { defaultValue: h.type })}</td>
                                        <td>{t(`planets.${h.lord}`, { defaultValue: h.lord })}</td>
                                        <td>{moment(h.start).format('HH:mm:ss')}</td>
                                        <td>{moment(h.end).format('HH:mm:ss')}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        );
    };

    const renderLagnas = (lagnas) => {
        if (!lagnas || lagnas.length === 0) return <p>{t('muhurtaPage.noLagnas')}</p>;
        return (
            <div className="muhurta-section">
                <div className="section-header" onClick={() => toggleCollapse(setIsLagnasCollapsed)}>
                    <h3>{t('muhurtaPage.lagnasTitle')}</h3>
                    <button className="toggle-button">
                        {isLagnasCollapsed ? <FaChevronDown /> : <FaChevronUp />}
                    </button>
                </div>
                <div className={`section-content ${isLagnasCollapsed ? 'collapsed' : ''}`}>
                    <div className="table-wrapper">
                        <table className="results-table">
                            <thead>
                                <tr>
                                    <th>{t('muhurtaPage.time')}</th>
                                    <th>{t('muhurtaPage.rashi')}</th>
                                    <th>{t('muhurtaPage.rashiLord')}</th>
                                </tr>
                            </thead>
                            <tbody>
                                {lagnas.map((l, index) => (
                                    <tr key={index}>
                                        <td>{`${moment(l.start_time).format('HH:mm:ss')} to ${moment(l.end_time).format('HH:mm:ss')}`}</td>
                                        <td>{t(`rashis.${l.rashi}`, { defaultValue: l.rashi })}</td>
                                        <td>{t(`planets.${l.rashiLord}`, { defaultValue: l.rashiLord })}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        );
    };

    // Helper function to create a translation key from a Muhurta name
    const getMuhurtaTranslationKey = (name) => {
        if (!name) return 'unknown';
        // Converts "Abhijit Muhurta" to "abhijit_muhurta"
        return name.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '');
    };

    const renderMuhurta = (muhurta) => {
        if (!muhurta || muhurta.length === 0) return <p>{t('muhurtaPage.noMuhurta')}</p>;
        return (
            <div className="muhurta-section">
                <div className="section-header" onClick={() => toggleCollapse(setIsMuhurtaCollapsed)}>
                    <h3>{t('muhurtaPage.muhurtaTitle')}</h3>
                    <button className="toggle-button">
                        {isMuhurtaCollapsed ? <FaChevronDown /> : <FaChevronUp />}
                    </button>
                </div>
                <div className={`section-content ${isMuhurtaCollapsed ? 'collapsed' : ''}`}>
                    <div className="table-wrapper">
                        <table className="results-table">
                            <thead>
                                <tr>
                                    <th>{t('muhurtaPage.name')}</th>
                                    <th>{t('muhurtaPage.type')}</th>
                                    <th>{t('muhurtaPage.start')}</th>
                                    <th>{t('muhurtaPage.end')}</th>
                                    <th>{t('muhurtaPage.description')}</th>
                                </tr>
                            </thead>
                            <tbody>
                                {muhurta.map((m, index) => (
                                    <tr key={index}>
                                        <td>{t(`muhurtaNames.${getMuhurtaTranslationKey(m.name)}`, { defaultValue: m.name })}</td>
                                        <td>{t(`muhurtaTypes.${m.type}`, { defaultValue: m.type })}</td>
                                        <td>{moment(m.start).format('HH:mm:ss')}</td>
                                        <td>{moment(m.end).format('HH:mm:ss')}</td>
                                        {/* Translate the description */}
                                        <td>
                                            {t(`muhurtaDescriptions.${getMuhurtaTranslationKey(m.name)}`, { defaultValue: m.description })}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        );
    };

    return (
        <div className="muhurta-page">
            <h1 className="page-title">{t('muhurtaPage.pageTitle')}</h1>
            
            {/* Display Date, Day, Sunrise, Sunset */}
            {muhurtaData && muhurtaData.inputParameters && (
                <div className="muhurta-info-bar">
                    <p><strong>{t('muhurtaPage.date')}:</strong> {moment(muhurtaData.inputParameters.date).format('LL')}</p>
                    <p><strong>{t('muhurtaPage.day')}:</strong> {t(`weekdays.${muhurtaData.inputParameters.day}`, { defaultValue: muhurtaData.inputParameters.day })}</p>
                    <p><strong>{t('muhurtaPage.sunrise')}:</strong> {moment(muhurtaData.inputParameters.sunrise).format('HH:mm:ss')}</p>
                    <p><strong>{t('muhurtaPage.sunset')}:</strong> {moment(muhurtaData.inputParameters.sunset).format('HH:mm:ss')}</p>
                </div>
            )}

            <div className="muhurta-results-container">
                {(parentIsLoading || isLoading) && <p>{t('muhurtaPage.loadingData')}</p>}
                {(parentError || error) && <p className="error-text">{parentError || error}</p>}
                {!(parentIsLoading || isLoading) && !parentError && !error && muhurtaData && (
                    <div className="muhurta-details">
                       {renderChoghadiya(muhurtaData.choghadiya)}
                        {renderHoras(muhurtaData.horas)}
                        {renderLagnas(muhurtaData.lagnas)}
                        {renderMuhurta(muhurtaData.muhurta)}
                    </div>
                )}
                {!(parentIsLoading || isLoading) && !parentError && !error && !muhurtaData && <p>{t('muhurtaPage.noDataYet')}</p>}
            </div>
        </div>
    );
};

export default MuhurtaPage;
