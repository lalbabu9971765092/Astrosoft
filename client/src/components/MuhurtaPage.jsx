// src/components/MuhurtaPage.jsx
import React, { useState, useCallback, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useOutletContext } from 'react-router-dom';
import api from './api';
import { validateAndFormatDateTime, formatToLocalISOString } from './AstrologyUtils';

import moment from 'moment-timezone';
import { FaChevronDown, FaChevronUp } from 'react-icons/fa'; // Import icons
import '../../src/styles/MuhurtaPage.css'; // Import the new CSS file

// Helper function to format date/time for display
// Pass 't' for potential error/invalid messages
const formatDateTime = (dateTimeString, t) => {
    if (!dateTimeString) return t ? t('planetDegreeTable.notAvailable', 'N/A') : 'N/A';
    try {
        const date = new Date(dateTimeString);
        if (isNaN(date.getTime())) return t ? t('gocharPage.invalidDate', 'Invalid Date') : 'Invalid Date';
        // Consider using i18n.language for locale-aware formatting
        return date.toLocaleString(undefined, {
            year: 'numeric', month: 'numeric', day: 'numeric',
            hour: 'numeric', minute: 'numeric', second: 'numeric', hour12: true
        });
    } catch (e) {
        console.error("Error formatting date:", e);
        return dateTimeString; // Return original on error
    }
};

const MuhurtaPage = () => {
    const { t } = useTranslation();
    // Get context from SharedInputLayout
    const {
        adjustedGocharDateTimeString, // Use the transit time
        locationForGocharTool, // Use the transit location
        isLoading: parentIsLoading,
        error: parentError,
        transitPlaceName,
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

        const dateTimeValidation = validateAndFormatDateTime(adjustedGocharDateTimeString, t);
        if (!dateTimeValidation.isValid) {
            setError(t('muhurtaPage.invalidDateFormatError', { error: dateTimeValidation.error }));
            setIsLoading(false);
            setMuhurtaData(null);
            return;
        }
        const dateForApi = formatToLocalISOString(new Date(adjustedGocharDateTimeString));

        setIsLoading(true);
        setError(null);
        setMuhurtaData(null);

        try {
            const payload = {
                date: dateForApi, // Use the correctly formatted date
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
                                    <tr key={index} className={c.periodType === 'auspicious' ? 'auspicious-period' : 'inauspicious-period'}>
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

   

    // Helper function to format yoga names for translation
    const formatYogaNameForTranslation = (name) => {
        const yogaNameMap = {
            "Sarvarth Siddha Yoga": "sarvarthSiddhi",
            "Amrit Siddhi Yoga": "amritSiddhi",
            "Guru Pushya Yoga": "guruPushya",
            // Add other yoga names if they come in full form from backend
        };
        return yogaNameMap[name] || name; // Return mapped name or original if not found
    };

    const renderCombinedMuhurtaAndYogas = (muhurtaDataArray) => {
        if (!muhurtaDataArray || muhurtaDataArray.length === 0) return <p>{t('muhurtaPage.noMuhurta')}</p>;

        // Sort all items by start time for a chronological view
        const allItems = [...muhurtaDataArray].sort((a, b) => moment(a.start).diff(moment(b.start)));

        return (
            <div className="muhurta-section">
                <div className="section-header" onClick={() => toggleCollapse(setIsMuhurtaCollapsed)}>
                    <h3>{t('muhurtaPage.muhurtaTitle', 'Muhurta Periods')} & {t('muhurtaPage.yogasTitle', 'Yogas')}</h3>
                    <button className="toggle-button">
                        {isMuhurtaCollapsed ? <FaChevronDown /> : <FaChevronUp />}
                    </button>
                </div>
                <div className={`section-content ${isMuhurtaCollapsed ? 'collapsed' : ''}`}>
                    <div className="table-wrapper">
                        <table className="results-table">
                            <thead>
                                <tr>
                                    <th>{t('muhurtaPage.name', 'Name')}</th>
                                    <th>{t('muhurtaPage.type', 'Type')}</th>
                                    <th>{t('muhurtaPage.start', 'Start')}</th>
                                    <th>{t('muhurtaPage.end', 'End')}</th>
                                    <th>{t('muhurtaPage.description', 'Description')}</th>
                                </tr>
                            </thead>
                            <tbody>
                                {allItems.map((m, index) => (
                                    <tr key={`muhurta-${index}`} className={m.type === 'auspicious' ? 'auspicious-period' : 'inauspicious-period'}>
                                        <td>{t(`yogas.${formatYogaNameForTranslation(m.name)}`, { defaultValue: m.name })}</td>
                                        <td>{t(`muhurtaTypes.${m.type}`, { defaultValue: m.type })}</td>
                                        <td>{moment(m.start).format('HH:mm:ss')}</td>
                                        <td>{moment(m.end).format('HH:mm:ss')}</td>
                                        <td>{m.description}</td>
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
                    <div className="info-row">
                        <p><strong>{t('muhurtaPage.date')}:</strong> {moment(muhurtaData.inputParameters.date).format('LL')}</p>
                        <p><strong>{t('muhurtaPage.day')}:</strong> {t(`weekdays.${muhurtaData.inputParameters.day}`, { defaultValue: muhurtaData.inputParameters.day })}</p>
                        <p><strong>{t('muhurtaPage.sunrise', 'Sunrise')}:</strong> {moment(muhurtaData.inputParameters.sunrise).format('HH:mm:ss')}</p>
                        <p><strong>{t('muhurtaPage.sunset', 'Sunset')}:</strong> {moment(muhurtaData.inputParameters.sunset).format('HH:mm:ss')}</p>
                    </div>
                    <div className="info-row">
                        <p><strong>{t('muhurtaPage.time', 'Time')}:</strong> {formatDateTime(adjustedGocharDateTimeString, t)}</p>
                        <p><strong>{t('muhurtaPage.coords', 'Coords')}:</strong> {locationForGocharTool?.lat?.toFixed(4)}, {locationForGocharTool?.lon?.toFixed(4)}</p>
                        {transitPlaceName && <p><strong>{t('muhurtaPage.place', 'Place')}:</strong> {transitPlaceName}</p>}
                    </div>
                    <div className="info-row">
                        <p className="inauspicious-period"><strong>{t('muhurtaPage.dishaShool', 'Disha Shool')}:</strong> {t(`directions.${muhurtaData.dishaShool}`, { defaultValue: muhurtaData.dishaShool })}</p>
                        {muhurtaData.activeChoghadiya && (
                            <p className={muhurtaData.activeChoghadiya.periodType === 'auspicious' ? 'auspicious-period' : 'inauspicious-period'}>
                                <strong>{t('muhurtaPage.activeChoghadiya', 'Active Choghadiya')}:</strong> {t(`choghadiyaNames.${muhurtaData.activeChoghadiya.name}`, { defaultValue: muhurtaData.activeChoghadiya.name })}
                            </p>
                        )}
                        {muhurtaData.activeHora && (
                            <p>
                                <strong>{t('muhurtaPage.activeHora', 'Active Hora')}:</strong> {t(`planets.${muhurtaData.activeHora.lord}`, { defaultValue: muhurtaData.activeHora.lord })}
                            </p>
                        )}
                        {muhurtaData.activeLagna && (
                            <p>
                                <strong>{t('muhurtaPage.activeLagna', 'Active Lagna')}:</strong> {t(`rashis.${muhurtaData.activeLagna.rashi}`, { defaultValue: muhurtaData.activeLagna.rashi })}
                            </p>
                        )}
                    </div>
                    <div className="info-row">
                        {muhurtaData.activeYogas && muhurtaData.activeYogas.map((yoga, index) => (
                            <p key={`active-yoga-${index}`} className={yoga.type === 'auspicious' ? 'auspicious-period' : 'inauspicious-period'}>
                                <strong>{t(`yogas.${formatYogaNameForTranslation(yoga.name)}`, { defaultValue: yoga.name })}:</strong> {` (${moment(yoga.start).format('HH:mm')} - ${moment(yoga.end).format('HH:mm')})`}
                            </p>
                        ))}
                         {muhurtaData.bhadra && muhurtaData.bhadra.bhadra_details && (
                    <p className="inauspicious-period">
                        <strong>{t('muhurtaPage.bhadra', 'Bhadra')}:</strong> {`${moment(muhurtaData.bhadra.bhadra_details.start).format('HH:mm')} - ${moment(muhurtaData.bhadra.bhadra_details.end).format('HH:mm')} (${t(`bhadraResidence.${muhurtaData.bhadra.bhadra_details.residence}`, { defaultValue: muhurtaData.bhadra.bhadra_details.residence })})`}
                    </p>
                )}

                {/* Display Gand Mool Dosha */}
                {muhurtaData.gandMool && muhurtaData.gandMool.active_gand_mool && (
                    <p className="inauspicious-period">
                        <strong>{t('muhurtaPage.gandMool', 'Gand Mool Dosha')}:</strong> {`${moment(muhurtaData.gandMool.active_gand_mool.start).format('HH:mm')} - ${moment(muhurtaData.gandMool.active_gand_mool.end).format('HH:mm')}`}
                    </p>
                )}

                {/* Display Yam Ghanta */}
                {muhurtaData.yamGhanta && (
                    <p className="inauspicious-period">
                        <strong>{t('muhurtaPage.yamGhanta', 'Yam Ghanta')}:</strong> {`(${muhurtaData.yamGhanta.start} - ${muhurtaData.yamGhanta.end})`}
                    </p>
                )}
                    </div>
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
                        {renderCombinedMuhurtaAndYogas(muhurtaData.muhurta)}
                    </div>
                )}
                {!(parentIsLoading || isLoading) && !parentError && !error && !muhurtaData && <p>{t('muhurtaPage.noDataYet')}</p>}
            </div>
        </div>
    );
};

export default MuhurtaPage;
