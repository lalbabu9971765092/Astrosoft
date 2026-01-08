import React, { useState, useEffect, useCallback } from 'react';
import { useOutletContext } from 'react-router-dom';
import api from './api';
import { useTranslation } from 'react-i18next';
import '../styles/PredictionPage.css';

const PredictionPage = () => {
    const { t, i18n } = useTranslation();
    const { mainResult, calculationInputParams, adjustedGocharDateTimeString, adjustedBirthDateTimeString, houseToRotate } = useOutletContext() || {};

    const [openSections, setOpenSections] = useState({ general: true });
    const toggleSection = (section) => setOpenSections(prev => ({ ...prev, [section]: !prev[section] }));

    const [varshphalData, setVarshphalData] = useState({ prediction: '', isLoading: false, error: null, year: null });

    const [holisticPrediction, setHolisticPrediction] = useState(null);
    const [isLoadingHolisticPrediction, setIsLoadingHolisticPrediction] = useState(false);
    const [holisticPredictionError, setHolisticPredictionError] = useState(null);

    const [rotatedHolisticPrediction, setRotatedHolisticPrediction] = useState(null);
    const [isLoadingRotatedHolisticPrediction, setIsLoadingRotatedHolisticPrediction] = useState(false);
    const [rotatedHolisticPredictionError, setRotatedHolisticPredictionError] = useState(null);
    const [lastHolisticKey, setLastHolisticKey] = useState(null);
    const [lastRotatedHolisticKey, setLastRotatedHolisticKey] = useState(null);
    const [lastKpKey, setLastKpKey] = useState(null);

    const [kpAnalysis, setKpAnalysis] = useState({ analysis: '', isLoading: false, error: null });

    const fetchVarshphalPrediction = useCallback(async () => {
        if (!calculationInputParams || !adjustedGocharDateTimeString) return;
        const yearValue = new Date(adjustedGocharDateTimeString).getFullYear();
        setVarshphalData({ prediction: '', isLoading: true, error: null, year: yearValue });
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
            setVarshphalData({ prediction: '', isLoading: false, error: errorMsg, year: yearValue });
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
                houseSystem: 'placidus',
            };
            const response = await api.post('/predictions/holistic', payload);
            setHolisticPrediction(response.data);
            try { 
                const birthDateString = adjustedBirthDateTimeString || calculationInputParams.date;
                setLastHolisticKey(`${birthDateString}|${adjustedGocharDateTimeString}|${i18n.language}`); 
            } catch (e) {}
        } catch (err) {
            console.error('Error fetching holistic prediction:', err.response?.data || err.message || err);
            setHolisticPredictionError(t('predictionPage.holisticPredictionError', 'Failed to fetch holistic prediction.'));
            setHolisticPrediction(null);
        } finally {
            setIsLoadingHolisticPrediction(false);
        }
    }, [calculationInputParams, adjustedBirthDateTimeString, adjustedGocharDateTimeString, i18n.language, t]);

    const fetchRotatedHolisticPrediction = useCallback(async (rotateHouse) => {
        if (!calculationInputParams?.date || !calculationInputParams?.latitude || !calculationInputParams?.longitude) {
            setRotatedHolisticPrediction(null);
            return;
        }
        setIsLoadingRotatedHolisticPrediction(true);
        setRotatedHolisticPredictionError(null);
        try {
            const payload = {
                birthDate: adjustedBirthDateTimeString || calculationInputParams.date,
                latitude: calculationInputParams.latitude,
                longitude: calculationInputParams.longitude,
                transitDate: adjustedGocharDateTimeString,
                lang: i18n.language,
                houseSystem: 'placidus',
                house_to_rotate: rotateHouse,
            };
            const response = await api.post('/predictions/holistic', payload);
            setRotatedHolisticPrediction(response.data);
            try { 
                const birthDateString = adjustedBirthDateTimeString || calculationInputParams.date;
                setLastRotatedHolisticKey(`${birthDateString}|${adjustedGocharDateTimeString}|${i18n.language}|${rotateHouse}`); 
            } catch (e) {}
        } catch (err) {
            console.error('Error fetching rotated holistic prediction:', err.response?.data || err.message || err);
            setRotatedHolisticPredictionError(t('predictionPage.holisticPredictionError', 'Failed to fetch holistic prediction.'));
            setRotatedHolisticPrediction(null);
        } finally {
            setIsLoadingRotatedHolisticPrediction(false);
        }
    }, [calculationInputParams, adjustedBirthDateTimeString, adjustedGocharDateTimeString, i18n.language, t]);

    const fetchKpAnalysis = useCallback(async (planetDetails) => {
        if (!planetDetails?.kpSignificators) return;
        setKpAnalysis({ analysis: '', isLoading: true, error: null });
        try {
            const payload = {
                kpSignificators: planetDetails.kpSignificators,
                planetDetails: planetDetails,
                lang: i18n.language,
            };
            const response = await api.post('/predictions/kp-analysis', payload);
            setKpAnalysis({ analysis: response.data.analysis.analysisText || '', isLoading: false, error: null });
            try { 
                const birthDateString = adjustedBirthDateTimeString || calculationInputParams.date;
                setLastKpKey(`${birthDateString}|${adjustedGocharDateTimeString}|${i18n.language}`); 
            } catch (e) {}
        } catch (err) {
            console.error('Error fetching KP analysis:', err.response?.data || err.message || err);
            const errorMsg = err.response?.data?.error || err.message || t('predictionPage.kpAnalysisError', 'Failed to fetch KP analysis.');
            setKpAnalysis({ analysis: '', isLoading: false, error: errorMsg });
        }
    }, [i18n.language, t, adjustedGocharDateTimeString, adjustedBirthDateTimeString, calculationInputParams]);

    useEffect(() => {
        if (mainResult && calculationInputParams && calculationInputParams.date) {
            const currentLang = i18n.language;
            const birthDateString = adjustedBirthDateTimeString || calculationInputParams.date;

            const transitKey = `${birthDateString}|${adjustedGocharDateTimeString}|${currentLang}`;
            const rotatedKey = `${birthDateString}|${adjustedGocharDateTimeString}|${currentLang}|${houseToRotate}`;

            // Decide whether to fetch rotated or normal holistic
            if (typeof houseToRotate === 'number' && houseToRotate > 1) {
                if (lastRotatedHolisticKey !== rotatedKey) {
                    fetchRotatedHolisticPrediction(houseToRotate);
                }
            } else {
                if (rotatedHolisticPrediction) {
                    setRotatedHolisticPrediction(null);
                }
                if (lastHolisticKey !== transitKey) {
                    fetchHolisticPrediction();
                }
            }

            // Varshphal
            const yearForVarshphal = new Date(adjustedGocharDateTimeString).getFullYear();
            const shouldFetchVarshphal = !varshphalData.prediction || varshphalData.year !== yearForVarshphal;
            if (shouldFetchVarshphal) fetchVarshphalPrediction();

            // KP analysis - use effectiveHolistic to derive kpSignificators
            const effectiveHolistic = (typeof houseToRotate === 'number' && houseToRotate > 1) ? rotatedHolisticPrediction || holisticPrediction : holisticPrediction;
            const kpKey = `${birthDateString}|${adjustedGocharDateTimeString}|${i18n.language}`;
            if (effectiveHolistic?.planetDetails && lastKpKey !== kpKey) {
                fetchKpAnalysis(effectiveHolistic.planetDetails);
            }
        } else {
            setVarshphalData({ prediction: '', isLoading: false, error: null, year: null });
            setHolisticPrediction(null);
            setRotatedHolisticPrediction(null);
            setKpAnalysis({ analysis: '', isLoading: false, error: null });
        }
    }, [mainResult, calculationInputParams, adjustedBirthDateTimeString, adjustedGocharDateTimeString, i18n.language, fetchHolisticPrediction, fetchRotatedHolisticPrediction, fetchVarshphalPrediction, fetchKpAnalysis, varshphalData.prediction, varshphalData.year, houseToRotate, lastHolisticKey, lastRotatedHolisticKey, lastKpKey, holisticPrediction, rotatedHolisticPrediction]);

    const renderContent = () => {
        if (!calculationInputParams?.date) return <p className="info-text">{t('predictionPage.calculateFirst', 'Please calculate a chart first to see the predictions.')}</p>;

        const overallLoading = (typeof houseToRotate === 'number' && houseToRotate > 1 ? isLoadingRotatedHolisticPrediction : isLoadingHolisticPrediction) || varshphalData.isLoading;
        if (overallLoading) return <div className="loader">{t('predictionPage.loading', 'Loading Predictions...')}</div>;

        const overallError = (typeof houseToRotate === 'number' && houseToRotate > 1 ? rotatedHolisticPredictionError : holisticPredictionError) || varshphalData.error;
        if (overallError) return <div className="error-text">{t('predictionPage.error', 'Could not load predictions: {{error}}', { error: overallError })}</div>;

        const effectiveHolistic = (typeof houseToRotate === 'number' && houseToRotate > 1) ? rotatedHolisticPrediction || holisticPrediction : holisticPrediction;
        const generalPrediction = effectiveHolistic?.overallReport;
        const yogas = effectiveHolistic?.yogas || [];

        return (
            <>
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

                {effectiveHolistic?.planetDetails?.kpSignificators && (
                    <div className="prediction-section">
                        <h3 className="prediction-title" onClick={() => toggleSection('kp')}>
                            <span className="prediction-icon">🪐</span>
                            {t('predictionPage.kpSignificatorsTitle', 'KP Significator Analysis')}
                            <span className={`accordion-icon ${openSections.kp ? 'open' : ''}`}>▼</span>
                        </h3>
                        {openSections.kp && (
                            <div className="prediction-content">
                                {effectiveHolistic.planetDetails.kpSignificators.cusps && Object.keys(effectiveHolistic.planetDetails.kpSignificators.cusps).length > 0 && (
                                    <div className="kp-cusp-significators">
                                        <h4>{t('predictionPage.cuspSignificators', 'Cusp Significators')}</h4>
                                        <div className="kp-grid">
                                            {Object.entries(effectiveHolistic.planetDetails.kpSignificators.cusps).map(([cusp, significators]) => (
                                                <div key={cusp} className="kp-card">
                                                    <div className="kp-card-title">{t('predictionPage.cusp', 'Cusp')} {cusp}</div>
                                                    <div className="kp-card-content">
                                                        <strong>{t('predictionPage.significators', 'Significators')}:</strong>
                                                        <p>{significators.map(s => t(`planets.${s}`)).join(', ')}</p>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {effectiveHolistic.planetDetails.kpSignificators.planets && Object.keys(effectiveHolistic.planetDetails.kpSignificators.planets).length > 0 && (
                                    <div className="kp-planet-significators">
                                        <h4>{t('predictionPage.planetSignificators', 'Planet Significators')}</h4>
                                        <div className="kp-grid">
                                            {Object.entries(effectiveHolistic.planetDetails.kpSignificators.planets).map(([planet, houses]) => (
                                                <div key={planet} className="kp-card">
                                                    <div className="kp-card-title">{t(`planets.${planet}`)}</div>
                                                    <div className="kp-card-content">
                                                        <strong>{t('predictionPage.signifiesHouses', 'Signifies Houses')}:</strong>
                                                        <p>{houses.join(', ')}</p>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
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

                {effectiveHolistic?.lifeAreaReports && (
                    <div className="prediction-section">
                        <h3 className="prediction-title" onClick={() => toggleSection('lifeAreas')}>
                            <span className="prediction-icon">🏡</span>
                            {t('predictionPage.lifeAreasTitle', 'Life Areas Summary')}
                            <span className={`accordion-icon ${openSections.lifeAreas ? 'open' : ''}`}>▼</span>
                        </h3>
                        {openSections.lifeAreas && (
                            <div className="prediction-content">
                                {Object.entries(effectiveHolistic.lifeAreaReports).map(([area, report]) => (
                                    <div key={area} className="life-area-report">
                                        <h4><span className="life-area-icon">🏠</span>{t(`lifeAreas.${area}`, area.replace(/_/g, ' '))}</h4>
                                        {report.intro && <p>{report.intro}</p>}
                                        {report.analysis && (
                                            <div className="analysis-section">
                                                <p><strong>{t('predictionPage.supportive', 'Supportive Influences')}:</strong> {report.analysis.supportive}</p>
                                                <p><strong>{t('predictionPage.challenging', 'Challenging Influences')}:</strong> {report.analysis.challenging}</p>
                                                <p><strong>{t('predictionPage.summary', 'Summary')}:</strong> {report.analysis.summary}</p>
                                            </div>
                                        )}
                                        {report.timing && <p><strong>{t('predictionPage.timing', 'Timing of Events')}:</strong> {report.timing}</p>}
                                        {report.varga && <p><strong>{t('predictionPage.divisional', 'Divisional Chart')}:</strong> {report.varga}</p>}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {effectiveHolistic?.eventTimeline && effectiveHolistic.eventTimeline.length > 0 && (
                    <div className="prediction-section">
                        <h3 className="prediction-title" onClick={() => toggleSection('timeline')}>
                            <span className="prediction-icon">⏳</span>
                            {t('predictionPage.eventTimelineTitle', 'Event Timeline (Transits)')}
                            <span className={`accordion-icon ${openSections.timeline ? 'open' : ''}`}>▼</span>
                        </h3>
                        {openSections.timeline && (
                            <div className="prediction-content">
                                <ul className="prediction-list">
                                    {effectiveHolistic.eventTimeline.map((event, index) => (
                                        <li key={index}><strong>{t(`planets.${event.planet}`)} {t('predictionPage.inHouse', { houseNumber: event.house })}:</strong> {event.narration}</li>
                                    ))}
                                </ul>
                            </div>
                        )}
                    </div>
                )}

                {effectiveHolistic?.dashaLordAnalysis && effectiveHolistic.dashaLordAnalysis.length > 0 && (
                    <div className="prediction-section">
                        <h3 className="prediction-title" onClick={() => toggleSection('dasha')}>
                            <span className="prediction-icon">🌀</span>
                            {t('predictionPage.dashaAnalysisTitle', 'Dasha Analysis for Selected Date')}
                            <span className={`accordion-icon ${openSections.dasha ? 'open' : ''}`}>▼</span>
                        </h3>
                        {openSections.dasha && (
                            <div className="prediction-content dasha-analysis-container">
                                {effectiveHolistic.dashaLordAnalysis.map((analysis, index) => (
                                    <p key={index} className="prediction-text">{analysis}</p>
                                ))}
                            </div>
                        )}
                    </div>
                )}

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