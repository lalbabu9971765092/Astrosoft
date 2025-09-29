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
    if (!dateTimeString) return t ? t('planetDegreeTable.notAvailable', { defaultValue: 'N/A' }) : 'N/A';
    try {
        const date = new Date(dateTimeString);
        if (isNaN(date.getTime())) return t ? t('gocharPage.invalidDate', { defaultValue: 'Invalid Date' }) : 'Invalid Date';
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

const formatDuration = (ms) => {
    if (ms === null || isNaN(ms)) return 'N/A';
    const totalSeconds = Math.floor(ms / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    return [
        hours.toString().padStart(2, '0'),
        minutes.toString().padStart(2, '0'),
        seconds.toString().padStart(2, '0')
    ].join(':');
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
    const [isInfoBarCollapsed, setIsInfoBarCollapsed] = useState(false);
    

    // Generic toggle function
    const toggleCollapse = useCallback((setter) => {
        setter(prev => !prev);
    }, []);

    const handleCalculateMuhurta = useCallback(async () => {
        if (!adjustedGocharDateTimeString || !locationForGocharTool?.lat || !locationForGocharTool?.lon) {
            setMuhurtaData(null);
            setError(t('muhurtaPage.noDataYet', { defaultValue: 'Please calculate a chart first to see Muhurta details.' }));
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
            <div className="muhurta-section muhurta-section-shade-1">
                <>
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
                </>
            </div>
        );
    };

    const renderHoras = (horas) => {
        if (!horas || horas.length === 0) return <p>{t('muhurtaPage.noHoras')}</p>;
        return (
            <div className="muhurta-section muhurta-section-shade-2">
                <>
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
                </>
            </div>
        );
    };

    const renderLagnas = (lagnas) => {
        if (!lagnas || lagnas.length === 0) return <p>{t('muhurtaPage.noLagnas')}</p>;
        return (
            <div className="muhurta-section muhurta-section-shade-3">
                <>
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
                </>
            </div>
        );
    };

   

    // Helper function to format yoga names for translation
    const formatYogaNameForTranslation = (name) => {
        const yogaNameMap = {
            "Sarvarth Siddha Yoga": "sarvarth_siddhi",
            "Amrit Siddhi Yoga": "amrit_siddhi",
            "Guru Pushya Yoga": "guru_pushya",
            "Abhijit Muhurta": "abhijit_muhurta",
            "Yama Ghanta": "yam_ghanta",
            "Gulika Kaal (Day)": "guli_kaal_day",
            "Varjyam": "varjyam",
            "Dur Muhurta (Day)": "dur_muhurta_day",
            "Dur Muhurta (Day) 1": "dur_muhurta_1",
            "Dur Muhurta (Day) 2": "dur_muhurta_2",
            "Dur Muhurta (Night)": "dur_muhurta_night",
            "Rahu Kaal": "rahu_kaal",
            "Pradosh Kaal": "pradosh_kaal",
            "Guli Kaal (Night)": "guli_kaal_night",
            "Day Ardha Prahar 1": "day_ardha_prahar_1",
            "Day Ardha Prahar 2": "day_ardha_prahar_2",
            "Day Ardha Prahar 3": "day_ardha_prahar_3",
            "Day Ardha Prahar 4": "day_ardha_prahar_4",
            "Night Ardha Prahar 1": "night_ardha_prahar_1",
            "Night Ardha Prahar 2": "night_ardha_prahar_2",
            "Night Ardha Prahar 3": "night_ardha_prahar_3",
            "Night Ardha Prahar 4": "night_ardha_prahar_4",
            // Add other yoga names if they come in full form from backend
        };
        return yogaNameMap[name] || name.toLowerCase().replace(/\s+/g, '_').replace(/[()]/g, '');
    };

    const renderCombinedMuhurtaAndYogas = (muhurtaDataArray) => {
        if (!muhurtaDataArray || muhurtaDataArray.length === 0) return <p>{t('muhurtaPage.noMuhurta')}</p>;

        const groupedMuhurtas = {};

        // Define the order of display for different types
        const displayOrder = [
            "Abhijit Muhurta",
            "Rahu Kaal",
            "Yama Ghanta",
            "Gulika Kaal (Day)",
            "Gulika Kaal (Night)",
            "Dur Muhurta (Day)",
            "Dur Muhurta (Night)",
            "Pradosh Kaal",
            "Varjyam",
            "Panchak",
            "Gand Mool Dosha",
            "Bhadra",
            "Day Ardha Prahar", // Group all day ardhapraharas
            "Night Ardha Prahar", // Group all night ardhapraharas
            "Sarvarth Siddha Yoga",
            "Amrit Siddhi Yoga",
            "Guru Pushya Yoga",
            "Visha Yoga",
            // Add other yoga types if needed
        ];

        muhurtaDataArray.forEach(item => {
            let groupName = item.name;
            if (item.name.startsWith("Day Ardha Prahar")) {
                groupName = "Day Ardha Prahar";
            } else if (item.name.startsWith("Night Ardha Prahar")) {
                groupName = "Night Ardha Prahar";
            } else if (item.name.startsWith("Dur Muhurta (Day")) {
                groupName = "Dur Muhurta (Day)"; // Group day Dur Muhurtas
            } else if (item.name.startsWith("Dur Muhurta (Night")) {
                groupName = "Dur Muhurta (Night)"; // Group night Dur Muhurtas
            }

            if (!groupedMuhurtas[groupName]) {
                groupedMuhurtas[groupName] = [];
            }
            groupedMuhurtas[groupName].push(item);
        });

        return (
            <div className="muhurta-section muhurta-section-shade-4">
                <div className="section-header" onClick={() => toggleCollapse(setIsMuhurtaCollapsed)}>
                    <h3>{t('muhurtaPage.muhurtaTitle', { defaultValue: 'Muhurta Periods' })} & {t('muhurtaPage.yogasTitle', { defaultValue: 'Yogas' })}</h3>
                    <button className="toggle-button">
                        {isMuhurtaCollapsed ? <FaChevronDown /> : <FaChevronUp />}
                    </button>
                </div>
                <div className={`section-content ${isMuhurtaCollapsed ? 'collapsed' : ''}`}>
                    <div className="table-wrapper">
                        <table className="results-table">
                            <thead>
                                <tr>
                                    <th>{t('muhurtaPage.name', { defaultValue: 'Name' })}</th>
                                    <th>{t('muhurtaPage.type', { defaultValue: 'Type' })}</th>
                                    <th>{t('muhurtaPage.start', { defaultValue: 'Start' })}</th>
                                    <th>{t('muhurtaPage.end', { defaultValue: 'End' })}</th>
                                    <th>{t('muhurtaPage.description', { defaultValue: 'Description' })}</th>
                                </tr>
                            </thead>
                            <tbody>
                                {displayOrder.map(groupName => {
                                    const items = groupedMuhurtas[groupName];
                                    if (!items || items.length === 0) return null;

                                    const sortedItems = [...items].sort((a, b) => moment(a.start).diff(moment(b.start)));

                                                                                    return sortedItems.map((m, index) => {
                                                                                        console.log("Item name:", m.name);
                                                                                        let translatedName = m.name;
                                        let translatedDescription;

                                        if (m.name.includes("Yoga") || m.name.includes("Ardha Prahar")) {
                                            const yogaTranslation = t(`yogas.${formatYogaNameForTranslation(m.name)}`, { returnObjects: true, defaultValue: { name: m.name, description: m.description } });
                                            translatedName = yogaTranslation.name;
                                            translatedDescription = yogaTranslation.description;
                                        } else {
                                            // For all other muhurta periods, use muhurtaNames
                                            const muhurtaTranslation = t(`muhurtaNames.${formatYogaNameForTranslation(m.name)}`, { returnObjects: true, defaultValue: { name: m.name, description: m.description } });
                                            translatedName = muhurtaTranslation.name;
                                            translatedDescription = muhurtaTranslation.description;
                                        }

                                        if (typeof translatedDescription === 'object' && translatedDescription !== null) {
                                            translatedDescription = translatedDescription.description;
                                        }                                        return (
                                            <tr key={`${groupName}-${index}`} className={m.type === 'auspicious' ? 'auspicious-period' : 'inauspicious-period'}>
                                                <td>{translatedName}</td>
                                                <td>{t(`muhurtaTypes.${m.type}`, { defaultValue: m.type })}</td>
                                                <td>{moment(m.start).format('HH:mm:ss')}</td>
                                                <td>{moment(m.end).format('HH:mm:ss')}</td>
                                                <td>{translatedDescription}</td>
                                            </tr>
                                        );
                                    });
                                })}
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
                <div className="muhurta-section muhurta-section-shade-1">
                    <div className="section-header" onClick={() => toggleCollapse(setIsInfoBarCollapsed)}>
                        <h3>{t('muhurtaPage.infoBarTitle', { defaultValue: 'Current Astrological Details' })}</h3>
                        <button className="toggle-button">
                            {isInfoBarCollapsed ? <FaChevronDown /> : <FaChevronUp />}
                        </button>
                    </div>
                    <div className={`section-content ${isInfoBarCollapsed ? 'collapsed' : ''}`}>
                        <div className="muhurta-info-bar">
                            <div className="info-row">
                                <p><strong>{t('muhurtaPage.time', { defaultValue: 'Time' })}:</strong> {formatDateTime(adjustedGocharDateTimeString, t)}</p>
                                <p><strong>{t('muhurtaPage.coords', { defaultValue: 'Coords' })}:</strong> {locationForGocharTool?.lat?.toFixed(4)}, {locationForGocharTool?.lon?.toFixed(4)}</p>
                                {transitPlaceName && <p><strong>{t('muhurtaPage.place', { defaultValue: 'Place' })}:</strong> {transitPlaceName}</p>}
                            </div>
                            <div className="info-row">
                                <p><strong>{t('muhurtaPage.date')}:</strong> {moment(muhurtaData.inputParameters.date).format('LL')}</p>
                                <p><strong>{t('muhurtaPage.day')}:</strong> {t(`weekdays.${muhurtaData.inputParameters.day}`, { defaultValue: muhurtaData.inputParameters.day })}</p>
                                <p><strong>{t('muhurtaPage.sunrise', { defaultValue: 'Sunrise' })}:</strong> {moment(muhurtaData.inputParameters.sunrise).format('HH:mm:ss')}</p>
                                <p><strong>{t('muhurtaPage.sunset', { defaultValue: 'Sunset' })}:</strong> {moment(muhurtaData.inputParameters.sunset).format('HH:mm:ss')}</p>
                                <p><strong>{t('muhurtaPage.dinamaan', { defaultValue: 'Dinamaan' })}:</strong> {formatDuration(muhurtaData.inputParameters.dayDurationMs)}</p>
                                <p><strong>{t('muhurtaPage.ratrimaan', { defaultValue: 'Ratriman' })}:</strong> {formatDuration(muhurtaData.inputParameters.nightDurationMs)}</p>
                            </div>
                            <div className="info-row">
                                {muhurtaData.panchang && (
                                    <>
                                        <p className="vikram-samvat-color"><strong>{t('muhurtaPage.vikramSamvat', { defaultValue: 'Vikram Samvat' })}:</strong> {muhurtaData.panchang?.vikram_samvat}</p>
                                        <p className="samvatsar-color"><strong>{t('muhurtaPage.samvatsar', { defaultValue: 'Samvatsar' })}:</strong> {t(`samvatsaras.${muhurtaData.panchang?.samvatsar}`, { defaultValue: muhurtaData.panchang?.samvatsar })}</p>
                                        <p className="moon-rashi-color"><strong>{t('muhurtaPage.moonRashi', { defaultValue: 'Moon Rashi' })}:</strong> {t(`rashis.${muhurtaData.moonRashi}`, { defaultValue: muhurtaData.moonRashi })}</p>
                                        <p className="lunar-month-color"><strong>{t('muhurtaPage.lunarMonth', { defaultValue: 'Lunar Month' })}:</strong> {t(`hindiMonths.${muhurtaData.panchang?.PurnimantaMasa?.name_en_IN}`, { defaultValue: muhurtaData.panchang?.PurnimantaMasa?.name_en_IN })}</p>
                                        <p className="tithi-color"><strong>{t('muhurtaPage.tithi', { defaultValue: 'Tithi' })}:</strong> {t(`tithis.${muhurtaData.panchang?.Tithi?.name_en_IN}`, { defaultValue: muhurtaData.panchang?.Tithi?.name_en_IN })}</p>
                                        <p className="moon-nakshatra-color"><strong>{t('muhurtaPage.moonNakshatra', { defaultValue: 'Moon Nakshatra' })}:</strong> {t(`nakshatras.${muhurtaData.panchang?.Nakshatra?.name_en_IN}`, { defaultValue: muhurtaData.panchang?.Nakshatra?.name_en_IN })}</p>
                                        <p className="yoga-color"><strong>{t('muhurtaPage.yoga', { defaultValue: 'Yoga' })}:</strong> {t(`yogas.${muhurtaData.panchang?.Yoga?.name_en_IN}.name`, { defaultValue: muhurtaData.panchang?.Yoga?.name_en_IN })}</p>
                                        <p className="karana-color"><strong>{t('muhurtaPage.karana', { defaultValue: 'Karana' })}:</strong> {t(`karans.${muhurtaData.panchang?.Karna?.name_en_IN}`, { defaultValue: muhurtaData.panchang?.Karna?.name_en_IN })}</p>
                                    </>
                                )}
                            </div>
                            <div className="info-row">
                                <p className="inauspicious-period"><strong>{t('muhurtaPage.dishaShool', { defaultValue: 'Disha Shool' })}:</strong> {t(`directions.${muhurtaData.dishaShool}`, { defaultValue: muhurtaData.dishaShool })}</p>
                                <p className="auspicious-period"><strong>{t('muhurtaPage.sanmukhChandra', { defaultValue: 'Sanmukh Chandra' })}:</strong> {t(`directions.${muhurtaData.sanmukhChandra}`, { defaultValue: muhurtaData.sanmukhChandra })}</p>
                                {muhurtaData.activeChoghadiya && (
                                    <p className={muhurtaData.activeChoghadiya.periodType === 'auspicious' ? 'auspicious-period' : 'inauspicious-period'}>
                                        <strong>{t('muhurtaPage.activeChoghadiya', { defaultValue: 'Active Choghadiya' })}:</strong> {t(`choghadiyaNames.${muhurtaData.activeChoghadiya.name}`, { defaultValue: muhurtaData.activeChoghadiya.name })}
                                    </p>
                                )}
                                {muhurtaData.activeHora && (
                                    <p>
                                        <strong>{t('muhurtaPage.activeHora', { defaultValue: 'Active Hora' })}:</strong> {t(`planets.${muhurtaData.activeHora.lord}`, { defaultValue: muhurtaData.activeHora.lord })}
                                    </p>
                                )}
                                {muhurtaData.activeLagna && (
                                    <p>
                                        <strong>{t('muhurtaPage.activeLagna', { defaultValue: 'Active Lagna' })}:</strong> {t(`rashis.${muhurtaData.activeLagna.rashi}`, { defaultValue: muhurtaData.activeLagna.rashi })}
                                    </p>
                                )}
                            </div>
                            <div className="info-row">
                                {muhurtaData.activeYogas && muhurtaData.activeYogas.map((yoga, index) => (
                                    <p key={`active-yoga-${index}`} className={yoga.type === 'auspicious' ? 'auspicious-period' : 'inauspicious-period'}>
                                        <strong>{t(`yogas.${formatYogaNameForTranslation(yoga.name)}.name`, { defaultValue: yoga.name })}:</strong> {` (${moment(yoga.start).format('HH:mm')} - ${moment(yoga.end).format('HH:mm')})`}
                                    </p>
                                ))}
                                 {muhurtaData.bhadra && muhurtaData.bhadra.bhadra_details && (
                            <p className="inauspicious-period">
                                <strong>{t('muhurtaNames.bhadra.name', { defaultValue: 'Bhadra' })}:</strong> {`${moment(muhurtaData.bhadra.bhadra_details.start).format('HH:mm')} - ${moment(muhurtaData.bhadra.bhadra_details.end).format('HH:mm')} (${t(`bhadraResidence.${muhurtaData.bhadra.bhadra_details.residence}`, { defaultValue: muhurtaData.bhadra.bhadra_details.residence })})`}</p>
                        )}
                        {/* Display Gand Mool Dosha */}
                        {muhurtaData.gandMool && muhurtaData.gandMool.active_gand_mool && (
                            <p className="inauspicious-period">
                                <strong>{t('muhurtaNames.gand_mool.name', { defaultValue: 'Gand Mool Dosha' })}:</strong> {`${moment(muhurtaData.gandMool.active_gand_mool.start).format('HH:mm')} - ${moment(muhurtaData.gandMool.active_gand_mool.end).format('HH:mm')}`}</p>
                        )}
                        {/* Display Yam Ghanta */}
                        {muhurtaData.yamGhanta && (
                            <p className="inauspicious-period">
                                <strong>{t('muhurtaPage.yamGhanta', { defaultValue: 'Yam Ghanta' })}:</strong> {`(${muhurtaData.yamGhanta.start} - ${muhurtaData.yamGhanta.end})`}</p>
                        )}
                            </div>
                        </div>
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
                {!(parentIsLoading || isLoading) && !parentError && !error && !muhurtaData && <p>{t('muhurtaPage.noDataYet', { defaultValue: 'Please calculate a chart first to see Muhurta details.' })}</p>}
            </div>
        </div>
    );
};

export default MuhurtaPage;
