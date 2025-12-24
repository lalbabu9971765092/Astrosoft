import React, { useState, useEffect, useCallback } from 'react';
import { useOutletContext } from 'react-router-dom';
import api from './api';
import { useTranslation } from 'react-i18next';
import '../styles/PredictionPage.css';

const PredictionPage = () => {
    const { t, i18n } = useTranslation();
    const { mainResult, calculationInputParams, adjustedGocharDateTimeString, adjustedBirthDateTimeString } = useOutletContext() || {};
    
    const [openSections, setOpenSections] = useState({
        general: true // Default the first section to be open
    });

    const toggleSection = (section) => {
        setOpenSections(prev => ({
            ...prev,
            [section]: !prev[section]
        }));
    };

    // Consolidating states
    const [varshphalData, setVarshphalData] = useState({ prediction: "", isLoading: false, error: null, year: null });

    // Holistic Prediction state will now hold all primary prediction data
    const [holisticPrediction, setHolisticPrediction] = useState(null);
    const [isLoadingHolisticPrediction, setIsLoadingHolisticPrediction] = useState(false);
    const [holisticPredictionError, setHolisticPredictionError] = useState(null);
    const [kpAnalysis, setKpAnalysis] = useState({ analysis: "", isLoading: false, error: null });


    const fetchVarshphalPrediction = useCallback(async () => {
        if (!calculationInputParams || !adjustedGocharDateTimeString) return;

        const yearValue = new Date(adjustedGocharDateTimeString).getFullYear();
        
        setVarshphalData({ prediction: "", isLoading: true, error: null, year: yearValue });

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
                const varshphalPayload = {
                    varshphalChart: varChart,
                    muntha: varData.muntha,
                    yearLord: varData.yearLord,
                    muddaDasha: varData.muddaDasha,
                    kpSignificators: varData.kpSignificators,
                    lang: i18n.language,
                    varshphalYear: yearValue,
                };
                const predResp = await api.post('/predictions/varshaphal', varshphalPayload);
                setVarshphalData({ prediction: predResp.data.prediction || '', isLoading: false, error: null, year: yearValue });
            } else {
                throw new Error(t('predictionPage.varshphalCalculationFailed', 'Varshphal calculation failed.'));
            }
        } catch (err) {
            console.error('Error fetching/calculating varshphal:', err.response?.data || err.message || err);
            const errorMsg = err.response?.data?.error || err.message || t('predictionPage.varshphalCalculationFailed');
            setVarshphalData({ prediction: "", isLoading: false, error: errorMsg, year: yearValue });
        }
    }, [adjustedBirthDateTimeString, adjustedGocharDateTimeString, calculationInputParams, i18n.language, t]);

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
                houseSystem: "placidus",
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

        const fetchKpAnalysis = useCallback(async (planetDetails) => {

            if (!planetDetails?.kpSignificators) return;

    

            setKpAnalysis({ analysis: "", isLoading: true, error: null });

            try {

                const payload = {

                    kpSignificators: planetDetails.kpSignificators,

                    planetDetails: planetDetails, // Pass the whole object

                    lang: i18n.language,

                };

                const response = await api.post('/predictions/kp-analysis', payload);

                setKpAnalysis({ analysis: response.data.analysis || '', isLoading: false, error: null });

            } catch (err) {

                console.error("Error fetching KP analysis:", err.response?.data || err.message || err);

                const errorMsg = err.response?.data?.error || err.message || t('predictionPage.kpAnalysisError', 'Failed to fetch KP analysis.');

                setKpAnalysis({ analysis: "", isLoading: false, error: errorMsg });

            }

        }, [i18n.language, t]);

    

        useEffect(() => {

            if (mainResult && calculationInputParams && calculationInputParams.date) {

                const currentLang = i18n.language;

    

                // Holistic prediction logic

                const transitDateChanged = holisticPrediction?.predictionDate !== adjustedGocharDateTimeString;

                const langChanged = holisticPrediction?.lang !== currentLang;

                const shouldFetchHolistic = !holisticPrediction || langChanged || transitDateChanged;

    

                if (shouldFetchHolistic) {

                    fetchHolisticPrediction();

                }

                

                // Varshphal prediction logic

                const yearForVarshphal = new Date(adjustedGocharDateTimeString).getFullYear();

                const shouldFetchVarshphal = !varshphalData.prediction || varshphalData.year !== yearForVarshphal;

    

                if (shouldFetchVarshphal) {

                    fetchVarshphalPrediction();

                }

    

                if (holisticPrediction?.planetDetails) {

                    fetchKpAnalysis(holisticPrediction.planetDetails);

                }

    

            } else {

                // Clear all predictions when main inputs are not valid

                setVarshphalData({ prediction: "", isLoading: false, error: null, year: null });

                setHolisticPrediction(null);

                setKpAnalysis({ analysis: "", isLoading: false, error: null });

            }

        }, [mainResult, calculationInputParams, adjustedGocharDateTimeString, i18n.language, fetchHolisticPrediction, fetchVarshphalPrediction, fetchKpAnalysis, holisticPrediction, varshphalData.prediction, varshphalData.year]);


    const renderContent = () => {
        if (!calculationInputParams?.date) {
            return <p className="info-text">{t('predictionPage.calculateFirst', 'Please calculate a chart first to see the predictions.')}</p>;
        }

        const overallLoading = isLoadingHolisticPrediction || varshphalData.isLoading;
        if (overallLoading) {
            return <div className="loader">{t('predictionPage.loading', 'Loading Predictions...')}</div>;
        }

        const overallError = holisticPredictionError || varshphalData.error;
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
                        <h3 className="prediction-title" onClick={() => toggleSection('general')}>
                            <span className="prediction-icon">🌟</span>
                            {t('predictionPage.generalPredictionTitle', 'General Prediction')}
                            <span className={`accordion-icon ${openSections.general ? 'open' : ''}`}>▼</span>
                        </h3>
                        {openSections.general && <div className="prediction-content"><p className="prediction-text" style={{ whiteSpace: 'pre-wrap' }}>{generalPrediction}</p></div>}
                    </div>
                )}

                {/* Yogas Table */}
                {yogas.length > 0 ? (
                    <div className="prediction-section">
                        <h3 className="prediction-title" onClick={() => toggleSection('yogas')}>
                            <span className="prediction-icon">✨</span>
                            {t('predictionPage.birthChartYogasTitle', 'Birth Chart Yogas')}
                            <span className={`accordion-icon ${openSections.yogas ? 'open' : ''}`}>▼</span>
                        </h3>
                        {openSections.yogas && (
                            <div className="prediction-content">
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
                                                <td>{t(`yogas.${yoga.name}_name`, { defaultValue: yoga.name })}</td>
                                                <td>{t(`yogas.${yoga.name}_description`, { defaultValue: yoga.description })}</td>
                                                <td>{yoga.planetsInvolved ? yoga.planetsInvolved.map(p => t(`planets.${p}`, { defaultValue: p })).join(', ') : 'N/A'}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                ) : (
                    !isLoadingHolisticPrediction && <p className="info-text">{t('predictionPage.noYogas', 'No significant predictions found in this chart.')}</p>
                )}

                {/* KP Significator Analysis Section */}
                {holisticPrediction?.planetDetails?.kpSignificators && (
                    <div className="prediction-section">
                        <h3 className="prediction-title" onClick={() => toggleSection('kp')}>
                            <span className="prediction-icon">🪐</span>
                            {t('predictionPage.kpSignificatorsTitle', 'KP Significator Analysis')}
                            <span className={`accordion-icon ${openSections.kp ? 'open' : ''}`}>▼</span>
                        </h3>
                        {openSections.kp && (
                            <div className="prediction-content">
                                {/* Cusp Significators */}
                                {holisticPrediction.planetDetails.kpSignificators.cusps && Object.keys(holisticPrediction.planetDetails.kpSignificators.cusps).length > 0 && (
                                    <div className="kp-cusp-significators">
                                        <h4>{t('predictionPage.cuspSignificators', 'Cusp Significators')}</h4>
                                        <table className="kp-table">
                                            <thead>
                                                <tr>
                                                    <th>{t('predictionPage.cusp', 'Cusp')}</th>
                                                    <th>{t('predictionPage.significators', 'Significators')}</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {Object.entries(holisticPrediction.planetDetails.kpSignificators.cusps).map(([cusp, significators]) => (
                                                    <tr key={cusp}>
                                                        <td>{cusp}</td>
                                                        <td>{significators.map(s => t(`planets.${s}`)).join(', ')}</td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                )}

                                {/* Planet Significators */}
                                {holisticPrediction.planetDetails.kpSignificators.planets && Object.keys(holisticPrediction.planetDetails.kpSignificators.planets).length > 0 && (
                                    <div className="kp-planet-significators">
                                        <h4>{t('predictionPage.planetSignificators', 'Planet Significators')}</h4>
                                        <table className="kp-table">
                                            <thead>
                                                <tr>
                                                    <th>{t('predictionPage.planet', 'Planet')}</th>
                                                    <th>{t('predictionPage.signifiesHouses', 'Signifies Houses')}</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {Object.entries(holisticPrediction.planetDetails.kpSignificators.planets).map(([planet, houses]) => (
                                                    <tr key={planet}>
                                                        <td>{t(`planets.${planet}`)}</td>
                                                        <td>{houses.join(', ')}</td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                )}
                                <p className="hint-text">{t('predictionPage.kpSignificatorsHint', "This is a powerful tool from KP astrology for precise predictions. The 'Cusp Significators' table shows which planets influence each life area (house). The 'Planet Significators' table shows which life areas each planet will affect.")}</p>
                                
                                <div className="kp-analysis-section">
                                    {kpAnalysis.isLoading ? (
                                        <div className="loader small-loader">{t('predictionPage.loadingKpAnalysis', 'Loading KP Analysis...')}</div>
                                    ) : kpAnalysis.error ? (
                                        <div className="error-text small-error">{kpAnalysis.error}</div>
                                    ) : (
                                        <p className="prediction-text" style={{ whiteSpace: 'pre-wrap' }}>{kpAnalysis.analysis}</p>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                )}
               
                {/* Life Areas Summary Section */}
                {holisticPrediction?.lifeAreaReports && (
                    <div className="prediction-section">
                        <h3 className="prediction-title" onClick={() => toggleSection('lifeAreas')}>
                            <span className="prediction-icon">🏡</span>
                            {t('predictionPage.lifeAreasTitle', 'Life Areas Summary')}
                            <span className={`accordion-icon ${openSections.lifeAreas ? 'open' : ''}`}>▼</span>
                        </h3>
                        {openSections.lifeAreas && (
                            <div className="prediction-content">
                                {Object.entries(holisticPrediction.lifeAreaReports).map(([area, report]) => (
                                    <div key={area} className="life-area-report">
                                        <h4>{t(`lifeAreas.${area}`, area)}</h4>
                                        <p>{report.narrative}</p>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {/* Event Timeline Section */}
                {holisticPrediction?.eventTimeline && holisticPrediction.eventTimeline.length > 0 && (
                    <div className="prediction-section">
                        <h3 className="prediction-title" onClick={() => toggleSection('timeline')}>
                            <span className="prediction-icon">⏳</span>
                            {t('predictionPage.eventTimelineTitle', 'Event Timeline (Transits)')}
                            <span className={`accordion-icon ${openSections.timeline ? 'open' : ''}`}>▼</span>
                        </h3>
                        {openSections.timeline && (
                            <div className="prediction-content">
                                <ul className="prediction-list">
                                    {holisticPrediction.eventTimeline.map((event, index) => (
                                        <li key={index}><strong>{t(`planets.${event.planet}`)} {t('predictionPage.inHouse', { houseNumber: event.house })}:</strong> {event.narration}</li>
                                    ))}
                                </ul>
                            </div>
                        )}
                    </div>
                )}
                {/* Dasha Analysis Section */}
                {holisticPrediction?.dashaLordAnalysis && holisticPrediction.dashaLordAnalysis.length > 0 && (
                    <div className="prediction-section">
                        <h3 className="prediction-title" onClick={() => toggleSection('dasha')}>
                            <span className="prediction-icon">🌀</span>
                            {t('predictionPage.dashaAnalysisTitle', 'Dasha Analysis for Selected Date')}
                            <span className={`accordion-icon ${openSections.dasha ? 'open' : ''}`}>▼</span>
                        </h3>
                        {openSections.dasha && (
                            <div className="prediction-content dasha-analysis-container">
                                {holisticPrediction.dashaLordAnalysis.map((analysis, index) => (
                                    <p key={index} className="prediction-text">{analysis}</p>
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {/* Varshphal-based Prediction Section */}
                <div className="prediction-section">
                    <h3 className="prediction-title" onClick={() => toggleSection('varshphal')}>
                        <span className="prediction-icon">📅</span>
                        {t('predictionPage.varshphalPredictionTitle', 'Varshphal-based Prediction')}
                        <span className={`accordion-icon ${openSections.varshphal ? 'open' : ''}`}>▼</span>
                    </h3>
                    {openSections.varshphal && (
                        <div className="prediction-content">
                            {varshphalData.isLoading ? (
                                <div className="loader small-loader">{t('predictionPage.calculatingVarshphal', 'Calculating Varshphal...')}</div>
                            ) : varshphalData.error ? (
                                <div className="error-text small-error">{varshphalData.error}</div>
                            ) : (
                                <p className="prediction-text" style={{ whiteSpace: 'pre-wrap' }}>{varshphalData.prediction}</p>
                            )}
                        </div>
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