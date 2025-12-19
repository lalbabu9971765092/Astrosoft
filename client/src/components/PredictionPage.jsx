import React, { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import api from './api';
import { useTranslation } from 'react-i18next';
import '../styles/PredictionPage.css';

const PredictionPage = () => {
    const { t, i18n } = useTranslation();
    const { mainResult, calculationInputParams, adjustedGocharDateTimeString, adjustedBirthDateTimeString } = useOutletContext() || {};
    
    // Existing states for original predictions
    const [yogas, setYogas] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);
    const [generalPrediction, setGeneralPrediction] = useState("");
    const [dashaPredictionText, setDashaPredictionText] = useState("");
    const [isLoadingDashaPrediction, setIsLoadingDashaPrediction] = useState(false);
    const [dashaPredictionError, setDashaPredictionError] = useState(null);
    const [varshphalPrediction, setVarshphalPrediction] = useState("");
    const [isLoadingVarshphal, setIsLoadingVarshphal] = useState(false);
    const [varshphalError, setVarshphalError] = useState(null);
    const [varshphalYear, setVarshphalYear] = useState(new Date().getFullYear());
    const [varshphalStyle, setVarshphalStyle] = useState('detailed');

    // New states for Holistic Prediction
    const [holisticPrediction, setHolisticPrediction] = useState(null);
    const [isLoadingHolisticPrediction, setIsLoadingHolisticPrediction] = useState(false);
    const [holisticPredictionError, setHolisticPredictionError] = useState(null);


    useEffect(() => {
        // fetchDashaPrediction is a utility that's self-contained.
        const fetchDashaPrediction = async (mahadasha, bhukti, antar) => { // lang is now available from outer scope
            setIsLoadingDashaPrediction(true);
            setDashaPredictionError(null);
            try {
                const response = await api.get('/predictions/dasha', {
                    params: { mahadasha, bhukti, antar, lang: i18n.language } // Use i18n.language directly
                });
                setDashaPredictionText(response.data.prediction);
            } catch (err) {
                console.error("Error fetching Dasha prediction:", err.response?.data || err.message || err);
                setDashaPredictionError(t('predictionPage.dashaPredictionError', 'Failed to fetch Dasha prediction.'));
                setDashaPredictionText("");
            } finally {
                setIsLoadingDashaPrediction(false);
            }
        };

        const fetchYogaAndPredictions = async () => {
            setIsLoading(true);
            setError(null);
            try {
                const payload = {
                    date: calculationInputParams.date,
                    latitude: calculationInputParams.latitude,
                    longitude: calculationInputParams.longitude,
                    lang: i18n.language, // Use i18n.language directly
                };
                const response = await api.post('/yogas', payload);
                setYogas(response.data.yogas || []);

                const ascendantRashi = mainResult.ascendant?.rashi;
                const moonRashi = mainResult.planetaryPositions?.sidereal?.Moon?.rashi;
                const moonNakshatra = mainResult.planetaryPositions?.sidereal?.Moon?.nakshatra;
                
                if (ascendantRashi && moonRashi && moonNakshatra) {
                    try {
                        const predictionResponse = await api.get('/predictions', {
                            params: {
                                lagnaRashi: ascendantRashi,
                                moonRashi: moonRashi,
                                moonNakshatra: moonNakshatra,
                                lang: i18n.language, // Use i18n.language directly
                            }
                        });
                        setGeneralPrediction(predictionResponse.data.prediction || t('predictionPage.noGeneralPrediction', 'No specific general prediction found for this combination.'));
                    } catch (predErr) {
                        console.error("Error fetching general prediction:", predErr.response?.data || predErr.message || predErr);
                        setGeneralPrediction(t('predictionPage.predictionFetchError', 'Error fetching general prediction.'));
                    }
                } else {
                    setGeneralPrediction(t('predictionPage.insufficientDataForGeneralPrediction', 'Insufficient data for general prediction.'));
                }

            } catch (error) {
                const errorMessage = error.response?.data?.error || error.message || 'An unknown error occurred.';
                setError(errorMessage);
                console.error("Error fetching yogas and predictions:", errorMessage);
                setYogas([]);
                setGeneralPrediction("");
            } finally {
                setIsLoading(false);
            }
        };


        const fetchVarshphalPrediction = async (yearValue = varshphalYear) => { // yearValue is parameter for selected year
            setIsLoadingVarshphal(true);
            setVarshphalError(null);
            setVarshphalPrediction("");
            try {
                const natalDate = adjustedBirthDateTimeString || calculationInputParams.date;
                const payload = {
                    natalDate,
                    natalLatitude: calculationInputParams.latitude,
                    natalLongitude: calculationInputParams.longitude,
                    varshphalYear: yearValue, // Use yearValue
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
                            lang: i18n.language, // Use i18n.language directly
                            style: varshphalStyle,
                            varshphalYear: yearValue, // Use yearValue
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
        };

        // --- Fetch Holistic Prediction ---
        const fetchHolisticPrediction = async () => { // lang is now available from outer scope
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
                    transitDate: adjustedGocharDateTimeString, // Optional, can be null
                    lang: i18n.language, // Use i18n.language directly
                };
                const response = await api.post('/predictions/holistic', payload);
                setHolisticPrediction(response.data); // Assuming response.data is the full prediction object
            } catch (err) {
                console.error("Error fetching holistic prediction:", err.response?.data || err.message || err);
                setHolisticPredictionError(t('predictionPage.holisticPredictionError', 'Failed to fetch holistic prediction.'));
                setHolisticPrediction(null);
            } finally {
                setIsLoadingHolisticPrediction(false);
            }
        };


        if (mainResult && calculationInputParams && calculationInputParams.date) {
            fetchYogaAndPredictions(); // Call here
            fetchVarshphalPrediction(varshphalYear); // Call here
            fetchHolisticPrediction(); // Call here

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
                        } else if (mahaDasha && mahaDasha.lord) {
                            fetchDashaPrediction(mahaDasha.lord, mahaDasha.lord, mahaDasha.lord);
                        }
                    } else if (mahaDasha && mahaDasha.lord) {
                        fetchDashaPrediction(mahaDasha.lord, mahaDasha.lord, mahaDasha.lord);
                    }
                } else {
                    setDashaPredictionText(t('predictionPage.noCurrentDasha', 'No current Dasha period found.'));
                }
            } else {
                setDashaPredictionText("");
            }
        } else {
            // Clear all predictions and states if no main data
            setYogas([]);
            setGeneralPrediction("");
            setDashaPredictionText("");
            setVarshphalPrediction("");
            setHolisticPrediction(null); // Clear holistic prediction if no main data
        }
    }, [mainResult, calculationInputParams, adjustedGocharDateTimeString, i18n.language, t, varshphalYear, varshphalStyle, adjustedBirthDateTimeString]);


    const renderContent = () => {
        if (!calculationInputParams?.date) {
            return <p className="info-text">{t('predictionPage.calculateFirst', 'Please calculate a chart first to see the predictions.')}</p>;
        }

        // Combine loading states
        const overallLoading = isLoading || isLoadingHolisticPrediction || isLoadingDashaPrediction || isLoadingVarshphal;
        if (overallLoading) {
            return <div className="loader">{t('predictionPage.loading', 'Loading Predictions...')}</div>;
        }

        // Combine error states
        const overallError = error || holisticPredictionError || dashaPredictionError || varshphalError;
        if (overallError) {
            return <div className="error-text">{t('predictionPage.error', 'Could not load predictions: {{error}}', { error: overallError })}</div>;
        }

        return (
            <>
                {/* General Prediction Section */}
                {generalPrediction && (
                    <div className="general-prediction-section">
                        <h3 className="general-prediction-title">{t('predictionPage.generalPredictionTitle', 'General Prediction')}</h3>
                        <p className="general-prediction-text">{generalPrediction}</p>
                    </div>
                )}

                {/* Yogas Table (only render if yogas exist) */}
                {yogas.length > 0 ? (
                    <div className="yoga-table-container">
                        <h3 className="yoga-table-title">{t('predictionPage.birthChartYogasTitle', 'Birth Chart Yogas')}</h3>
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
                    <p className="info-text">{t('predictionPage.noYogas', 'No significant predictions found in this chart.')}</p>
                )}

                {/* Dasha Prediction Section */}
                {dashaPredictionText && (
                    <div className="dasha-prediction-section">
                        <h3 className="dasha-prediction-title">{t('predictionPage.dashaPredictionTitle', 'Current Dasha Prediction')}</h3>
                        {isLoadingDashaPrediction ? (
                            <div className="loader small-loader">{t('predictionPage.loadingDashaPrediction', 'Loading Dasha Prediction...')}</div>
                        ) : dashaPredictionError ? (
                            <div className="error-text small-error">{dashaPredictionError}</div>
                        ) : (
                            <p className="dasha-prediction-text">{dashaPredictionText}</p>
                        )}
                    </div>
                )}

                {/* Varshphal-based Prediction Section */}
                {calculationInputParams?.date && (
                    <div className="varshphal-prediction-section">
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                            <h3 className="varshphal-prediction-title">{t('predictionPage.varshphalPredictionTitle', 'Varshphal-based Prediction')}</h3>
                                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                                <label style={{ fontSize: '0.9rem' }}>{t('predictionPage.varshphalYear', 'Year')}</label>
                                <input type="number" value={varshphalYear} onChange={e => setVarshphalYear(Number(e.target.value))} style={{ width: '100px', padding: '4px' }} />
                                <label style={{ fontSize: '0.9rem' }}>{t('predictionPage.style', 'Style')}</label>
                                <select value={varshphalStyle} onChange={e => setVarshphalStyle(e.target.value)} style={{ padding: '4px' }}>
                                    <option value="simple">{t('predictionPage.styleSimple', 'Simple')}</option>
                                    <option value="detailed">{t('predictionPage.styleDetailed', 'Detailed')}</option>
                                </select>
                                <button className="nav-button" onClick={() => {
                                    // Re-run prediction for selected year
                                    setVarshphalPrediction('');
                                    setVarshphalError(null);
                                    (async () => {
                                        setIsLoadingVarshphal(true);
                                        try {
                                            const natalDate = adjustedBirthDateTimeString || calculationInputParams.date;
                                            const payload = { natalDate, natalLatitude: calculationInputParams.latitude, natalLongitude: calculationInputParams.longitude, varshphalYear };
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
                                                        lang: i18n.language, // Use i18n.language directly
                                                        style: varshphalStyle,
                                                        varshphalYear: varshphalYear, // Changed 'year' to 'varshphalYear'
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
                                    })();
                                }}>{t('predictionPage.recalculate', 'Recalculate')}</button>
                            </div>
                        </div>

                        {isLoadingVarshphal ? (
                            <div className="loader small-loader">{t('predictionPage.calculatingVarshphal', 'Calculating Varshphal...')}</div>
                        ) : varshphalError ? (
                            <div className="error-text small-error">{varshphalError}</div>
                        ) : (
                            <p className="varshphal-prediction-text" style={{ whiteSpace: 'pre-wrap' }}>{varshphalPrediction}</p>
                        )}
                    </div>
                )}

                {/* Holistic Prediction Section */}
                {holisticPrediction && (
                    <div className="holistic-prediction-section" style={{ marginTop: '2rem', borderTop: '1px solid #ccc', paddingTop: '1rem' }}>
                        <h3 className="holistic-prediction-title">{t('predictionPage.holisticPredictionTitle', 'Holistic Prediction Report')}</h3>
                        {isLoadingHolisticPrediction ? (
                            <div className="loader small-loader">{t('predictionPage.loadingHolisticPrediction', 'Loading Holistic Prediction...')}</div>
                        ) : holisticPredictionError ? (
                            <div className="error-text small-error">{holisticPredictionError}</div>
                        ) : holisticPrediction.error ? (
                            <div className="error-text">{holisticPrediction.error}</div>
                        ) : (
                            <p className="holistic-prediction-text" style={{ whiteSpace: 'pre-wrap' }}>{holisticPrediction.summary}</p>
                        )}
                    </div>
                )}
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