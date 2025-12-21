import React, { useState, useEffect, useCallback } from 'react';
import { useOutletContext } from 'react-router-dom';
import api from './api';
import { useTranslation } from 'react-i18next';
import '../styles/PredictionPage.css';

const PredictionPage = () => {
    const { t, i18n } = useTranslation();
    const { mainResult, calculationInputParams, adjustedGocharDateTimeString, adjustedBirthDateTimeString } = useOutletContext() || {};
    
    // Consolidating states
    const [dashaPredictionText, setDashaPredictionText] = useState("");
    const [isLoadingDashaPrediction, setIsLoadingDashaPrediction] = useState(false);
    const [dashaPredictionError, setDashaPredictionError] = useState(null);
    const [varshphalPrediction, setVarshphalPrediction] = useState("");
    const [isLoadingVarshphal, setIsLoadingVarshphal] = useState(false);
    const [varshphalError, setVarshphalError] = useState(null);
    const [varshphalYear, setVarshphalYear] = useState(new Date().getFullYear());
    const [varshphalStyle, setVarshphalStyle] = useState('detailed');

    // Holistic Prediction state will now hold all primary prediction data
    const [holisticPrediction, setHolisticPrediction] = useState(null);
    const [isLoadingHolisticPrediction, setIsLoadingHolisticPrediction] = useState(false);
    const [holisticPredictionError, setHolisticPredictionError] = useState(null);

    const fetchDashaPrediction = useCallback(async (mahadasha, bhukti, antar) => {
        setIsLoadingDashaPrediction(true);
        setDashaPredictionError(null);
        try {
            const response = await api.get('/predictions/dasha', {
                params: { mahadasha, bhukti, antar, lang: i18n.language }
            });
            setDashaPredictionText(response.data.prediction);
        } catch (err) {
            console.error("Error fetching Dasha prediction:", err.response?.data || err.message || err);
            setDashaPredictionError(t('predictionPage.dashaPredictionError', 'Failed to fetch Dasha prediction.'));
            setDashaPredictionText("");
        } finally {
            setIsLoadingDashaPrediction(false);
        }
    }, [i18n.language, t]);

    const fetchVarshphalPrediction = useCallback(async (yearValue = varshphalYear) => {
        setIsLoadingVarshphal(true);
        setVarshphalError(null);
        setVarshphalPrediction("");
        try {
            const natalDate = adjustedBirthDateTimeString || calculationInputParams.date;
            const payload = {
                natalDate,
                natalLatitude: calculationInputParams.latitude,
                natalLongitude: calculationInputParams.longitude,
                varshphalYear: yearValue,
            };
            const varResp = await api.post('/calculate-varshphal', payload);
            const varData = varResp.data;
            const varChart = varData.varshphalChart;
            if (varChart && varChart.ascendant && varChart.planetaryPositions && varChart.planetaryPositions.sidereal) {
                try {
                    const varshphalPayload = {
                        varshphalChart: varChart,
                        muntha: varData.muntha,
                        yearLord: varData.yearLord,
                        muddaDasha: varData.muddaDasha,
                        kpSignificators: varData.kpSignificators,
                        lang: i18n.language,
                        style: varshphalStyle,
                        varshphalYear: yearValue,
                    };
                    const predResp = await api.post('/predictions/varshaphal', varshphalPayload);
                    setVarshphalPrediction(predResp.data.prediction || '');
                } catch (predErr) {
                    console.error('Error fetching varshphal prediction:', predErr.response?.data || predErr.message || predErr);
                    setVarshphalError(t('predictionPage.varshphalPredictionError', 'Failed to fetch Varshphal-based prediction.'));
                }
            } else {
                setVarshphalError(t('predictionPage.varshphalCalculationFailed', 'Varshphal calculation failed.'));
            }
        } catch (err) {
            console.error('Error calculating varshphal:', err.response?.data || err.message || err);
            setVarshphalError(t('predictionPage.varshphalCalculationFailed', 'Varshphal calculation failed.'));
        } finally {
            setIsLoadingVarshphal(false);
        }
    }, [varshphalYear, adjustedBirthDateTimeString, calculationInputParams, i18n.language, varshphalStyle, t]);

    const fetchHolisticPrediction = useCallback(async () => {
        if (!calculationInputParams?.date || !calculationInputParams?.latitude || !calculationInputParams?.longitude) {
            setHolisticPrediction(null);
            return;
        }

        setIsLoadingHolisticPrediction(true);
        setHolisticPredictionError(null);

        try {
            const payload = {
                birthDate: adjustedBirthDateTimeString || calculationInputParams.date,
                latitude: calculationInputParams.latitude,
                longitude: calculationInputParams.longitude,
                transitDate: adjustedGocharDateTimeString,
                lang: i18n.language,
            };
            const response = await api.post('/predictions/holistic', payload);
            setHolisticPrediction(response.data);
        } catch (err) {
            console.error("Error fetching holistic prediction:", err.response?.data || err.message || err);
            setHolisticPredictionError(t('predictionPage.holisticPredictionError', 'Failed to fetch holistic prediction.'));
            setHolisticPrediction(null);
        } finally {
            setIsLoadingHolisticPrediction(false);
        }
    }, [calculationInputParams, adjustedBirthDateTimeString, adjustedGocharDateTimeString, i18n.language, t]);


    useEffect(() => {
        if (mainResult && calculationInputParams && calculationInputParams.date) {
            const currentLang = i18n.language;
            // Determine if a re-fetch of holistic prediction is needed
            // - If there's no holisticPrediction data yet (initial load)
            // - OR if the language of the existing holisticPrediction data does not match the current UI language
            const shouldFetchHolistic = !holisticPrediction || (holisticPrediction.lang !== currentLang);

            if (shouldFetchHolistic) {
                // Clear the state *before* fetching to prevent showing stale data and trigger new loading state
                setHolisticPrediction(null); // Explicitly clear before new fetch
                fetchHolisticPrediction();
            }
            fetchVarshphalPrediction(varshphalYear);

            if (mainResult.dashaPeriods) {
                const transitTime = adjustedGocharDateTimeString ? new Date(adjustedGocharDateTimeString) : new Date();
                const findCurrentPeriod = (periods, level) => {
                    return periods.find(p => {
                        const start = new Date(p.start);
                        const end = new Date(p.end);
                        return p.level === level && transitTime >= start && transitTime <= end;
                    });
                };

                const mahaDasha = findCurrentPeriod(mainResult.dashaPeriods, 1);
                if (mahaDasha) {
                    const antardashas = mainResult.dashaPeriods.filter(p => p.level === 2 && p.mahaLord === mahaDasha.lord);
                    const antarDasha = findCurrentPeriod(antardashas, 2);
                    if (antarDasha) {
                        const pratyantardashas = mainResult.dashaPeriods.filter(p => p.level === 3 && p.mahaLord === mahaDasha.lord && p.antarLord === antarDasha.lord);
                        const pratyantarDasha = findCurrentPeriod(pratyantardashas, 3);
                        if (pratyantarDasha && mahaDasha.lord && antarDasha.lord && pratyantarDasha.lord) {
                            fetchDashaPrediction(mahaDasha.lord, antarDasha.lord, pratyantarDasha.lord);
                        } else if (antarDasha && mahaDasha.lord && antarDasha.lord) {
                            fetchDashaPrediction(mahaDasha.lord, antarDasha.lord, antarDasha.lord);
                        }
                    } else {
                        fetchDashaPrediction(mahaDasha.lord, mahaDasha.lord, mahaDasha.lord);
                    }
                } else { // if no mahadasha is found
                    setDashaPredictionText(t('predictionPage.noCurrentDasha', 'No current Dasha period found.'));
                }
            } else { // if mainResult.dashaPeriods does not exist
                setDashaPredictionText("");
            }
        } else {
            // Clear all predictions when main inputs are not valid
            setDashaPredictionText("");
            setVarshphalPrediction("");
            setHolisticPrediction(null);
        }
    }, [mainResult, calculationInputParams, adjustedGocharDateTimeString, i18n.language, t, varshphalYear, varshphalStyle, adjustedBirthDateTimeString, fetchDashaPrediction, fetchHolisticPrediction, fetchVarshphalPrediction]);


    const renderContent = () => {
        if (!calculationInputParams?.date) {
            return <p className="info-text">{t('predictionPage.calculateFirst', 'Please calculate a chart first to see the predictions.')}</p>;
        }

        const overallLoading = isLoadingHolisticPrediction || isLoadingDashaPrediction || isLoadingVarshphal;
        if (overallLoading) {
            return <div className="loader">{t('predictionPage.loading', 'Loading Predictions...')}</div>;
        }

        const overallError = holisticPredictionError || dashaPredictionError || varshphalError;
        if (overallError) {
            return <div className="error-text">{t('predictionPage.error', 'Could not load predictions: {{error}}', { error: overallError })}</div>;
        }

        // Use data directly from holisticPrediction state
        const generalPrediction = holisticPrediction?.overallReport;
        const yogas = holisticPrediction?.yogas || [];

        return (
            <>
                {/* General Prediction Section */}
                {generalPrediction && (
                    <div className="prediction-section">
                        <h3 className="prediction-title">{t('predictionPage.generalPredictionTitle', 'General Prediction')}</h3>
                        <p className="prediction-text" style={{ whiteSpace: 'pre-wrap' }}>{generalPrediction}</p>
                    </div>
                )}

                {/* Yogas Table */}
                {yogas.length > 0 ? (
                    <div className="prediction-section">
                        <h3 className="prediction-title">{t('predictionPage.birthChartYogasTitle', 'Birth Chart Yogas')}</h3>
                        <table className="yoga-table">
                            <thead>
                                <tr>
                                    <th>{t('predictionPage.yogaName', 'Yoga Name')}</th>
                                    <th>{t('predictionPage.description', 'Description')}</th>
                                    <th>{t('predictionPage.planetsInvolved', 'Planets Involved')}</th>
                                </tr>
                            </thead>
                            <tbody>
                                {yogas.map((yoga, index) => (
                                    <tr key={index}>
                                        <td>{yoga.name}</td>
                                        <td>{yoga.description}</td>
                                        <td>{yoga.planetsInvolved ? yoga.planetsInvolved.map(p => t(`planets.${p}`)).join(', ') : 'N/A'}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                ) : (
                    !isLoadingHolisticPrediction && <p className="info-text">{t('predictionPage.noYogas', 'No significant predictions found in this chart.')}</p>
                )}

               
                {/* Life Areas Summary Section */}
                {holisticPrediction?.lifeAreaReports && (
                    <div className="prediction-section">
                        <h3 className="prediction-title">{t('predictionPage.lifeAreasTitle', 'Life Areas Summary')}</h3>
                        {Object.entries(holisticPrediction.lifeAreaReports).map(([area, report]) => (
                            <div key={area} className="life-area-report">
                                <h4>{t(`lifeAreas.${area}`, area)}</h4>
                                <p>{report.narrative}</p>
                            </div>
                        ))}
                    </div>
                )}

                {/* Event Timeline Section */}
                {holisticPrediction?.eventTimeline && holisticPrediction.eventTimeline.length > 0 && (
                    <div className="prediction-section">
                        <h3 className="prediction-title">{t('predictionPage.eventTimelineTitle', 'Event Timeline (Transits)')}</h3>
                        <ul className="prediction-list">
                            {holisticPrediction.eventTimeline.map((event, index) => (
                                <li key={index}><strong>{t(`planets.${event.planet}`)} {t('predictionPage.inHouse', { houseNumber: event.house })}:</strong> {event.narration}</li>
                            ))}
                        </ul>
                    </div>
                )}
                 {/* Dasha Prediction Section */}
                {dashaPredictionText && (
                    <div className="prediction-section">
                        <h3 className="prediction-title">{t('predictionPage.dashaPredictionTitle', 'Current Dasha Prediction')}</h3>
                        <p className="prediction-text" style={{ whiteSpace: 'pre-wrap' }}>{dashaPredictionText}</p>
                    </div>
                )}
                
                {/* Dasha Lords Section */}
                {holisticPrediction?.dashaLordAnalysis && holisticPrediction.dashaLordAnalysis.length > 0 && (
                    <div className="prediction-section">
                        <h3 className="prediction-title">{t('predictionPage.dashaLordsTitle', 'Dasha Lords in Chart')}</h3>
                        <ul className="prediction-list">
                            {holisticPrediction.dashaLordAnalysis.map((analysis, index) => (
                                <li key={index}>{analysis}</li>
                            ))}
                        </ul>
                    </div>
                )}

                {/* Varshphal-based Prediction Section */}
                <div className="prediction-section">
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
                        <h3 className="prediction-title">{t('predictionPage.varshphalPredictionTitle', 'Varshphal-based Prediction')}</h3>
                        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                            <label style={{ fontSize: '0.9rem' }}>{t('predictionPage.varshphalYear', 'Year')}</label>
                            <input type="number" value={varshphalYear} onChange={e => setVarshphalYear(Number(e.target.value))} style={{ width: '100px', padding: '4px' }} />
                            <label style={{ fontSize: '0.9rem' }}>{t('predictionPage.style', 'Style')}</label>
                            <select value={varshphalStyle} onChange={e => setVarshphalStyle(e.target.value)} style={{ padding: '4px' }}>
                                <option value="simple">{t('predictionPage.styleSimple', 'Simple')}</option>
                                <option value="detailed">{t('predictionPage.styleDetailed', 'Detailed')}</option>
                            </select>
                            <button className="nav-button" onClick={() => fetchVarshphalPrediction(varshphalYear)}>{t('predictionPage.recalculate', 'Recalculate')}</button>
                        </div>
                    </div>
                    {isLoadingVarshphal ? (
                        <div className="loader small-loader">{t('predictionPage.calculatingVarshphal', 'Calculating Varshphal...')}</div>
                    ) : varshphalError ? (
                        <div className="error-text small-error">{varshphalError}</div>
                    ) : (
                        <p className="prediction-text" style={{ whiteSpace: 'pre-wrap' }}>{varshphalPrediction}</p>
                    )}
                </div>

            </>
        );
    };

    return (
        <div className="prediction-page-container result-container">
            <h2 className="result-title">{t('predictionPage.title', 'Birth Chart Predictions')}</h2>
            {renderContent()}
        </div>
    );
};

export default PredictionPage;