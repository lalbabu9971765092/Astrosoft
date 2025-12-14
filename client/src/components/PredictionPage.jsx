
import React, { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import api from './api';
import { useTranslation } from 'react-i18next';
import '../styles/PredictionPage.css';

const PredictionPage = () => {
    const { t, i18n } = useTranslation();
    const { mainResult, calculationInputParams, adjustedGocharDateTimeString, adjustedBirthDateTimeString } = useOutletContext() || {};
    const [yogas, setYogas] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);

    // --- State for General Prediction ---
    const [generalPrediction, setGeneralPrediction] = useState("");
    // --- State for Dasha Prediction ---
    const [dashaPredictionText, setDashaPredictionText] = useState("");
    const [isLoadingDashaPrediction, setIsLoadingDashaPrediction] = useState(false);
    const [dashaPredictionError, setDashaPredictionError] = useState(null);
    // --- State for Varshphal-based Prediction ---
    const [varshphalPrediction, setVarshphalPrediction] = useState("");
    const [isLoadingVarshphal, setIsLoadingVarshphal] = useState(false);
    const [varshphalError, setVarshphalError] = useState(null);
    const [varshphalYear, setVarshphalYear] = useState(new Date().getFullYear());
    const [varshphalStyle, setVarshphalStyle] = useState('detailed');


    useEffect(() => {
        const fetchDashaPrediction = async (mahadasha, bhukti, antar, lang) => {
            setIsLoadingDashaPrediction(true);
            setDashaPredictionError(null);
            try {
                const response = await api.get('/predictions/dasha', {
                    params: { mahadasha, bhukti, antar, lang }
                });
                setDashaPredictionText(response.data.prediction);
            } catch (err) {
                console.error("Error fetching Dasha prediction:", err.response?.data || err.message || err);
                setDashaPredictionError(t('predictionPage.dashaPredictionFetchError', 'Failed to fetch Dasha prediction.'));
                setDashaPredictionText("");
            } finally {
                setIsLoadingDashaPrediction(false);
            }
        };

        // Ensure both mainResult and calculationInputParams are available
        // mainResult is needed for ascendant, moon rashi/nakshatra, and dashaPeriods
        // calculationInputParams is needed for date, lat, lon for yoga API call
        if (mainResult && calculationInputParams && calculationInputParams.date) {
            const lang = i18n.language;
            const fetchYogaAndPredictions = async () => {
                setIsLoading(true);
                setError(null);
                try {
                    // Fetch Yogas (using original input params)
                    const payload = {
                        date: calculationInputParams.date,
                        latitude: calculationInputParams.latitude,
                        longitude: calculationInputParams.longitude,
                        lang: lang,
                    };
                    const response = await api.post('/yogas', payload);
                    setYogas(response.data.yogas || []);

                    // Generate General Prediction (via API call)
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
                                    lang: lang, // Pass the current language
                                }
                            });
                            setGeneralPrediction(predictionResponse.data.prediction || t('predictionPage.noGeneralPrediction', 'No specific general prediction found for this combination.'));
                        } catch (predErr) {
                            console.error("Error fetching general prediction:", predErr.response?.data || predErr.message || predErr);
                            setGeneralPrediction(t('predictionPage.predictionFetchError', 'Error fetching general prediction.'));
                        }
                    } else {
                        setGeneralPrediction(t('predictionPage.insufficientDataForGeneralPrediction', 'Insufficient data to generate general prediction (Ascendant Rashi, Moon Rashi, or Moon Nakshatra missing).'));
                    }

                } catch (error) { // Changed 'err' to 'error'
                    const errorMessage = error.response?.data?.error || error.message || 'An unknown error occurred.';
                    setError(errorMessage);
                    console.error("Error fetching yogas and predictions:", errorMessage);
                    setYogas([]); // Clear yogas on error
                    setGeneralPrediction(""); // Clear prediction on error
                } finally {
                    setIsLoading(false);
                }
            };
            fetchYogaAndPredictions();

            // --- Fetch Dasha Prediction ---
            if (mainResult.dashaPeriods) {
                const transitTime = adjustedGocharDateTimeString ? new Date(adjustedGocharDateTimeString) : new Date(); // Use adjustedGocharDateTimeString
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
                        // Only fetch if all 3 levels are available, otherwise simplify
                        if (pratyantarDasha && mahaDasha.lord && antarDasha.lord && pratyantarDasha.lord) {
                            fetchDashaPrediction(mahaDasha.lord, antarDasha.lord, pratyantarDasha.lord, lang);
                        } else if (antarDasha && mahaDasha.lord && antarDasha.lord) {
                            // If Pratyantar not found, use Antardasha for Antar for prediction
                            fetchDashaPrediction(mahaDasha.lord, antarDasha.lord, antarDasha.lord, lang);
                        } else if (mahaDasha && mahaDasha.lord) {
                            // If only Mahadasha, use Mahadasha for Bhukti and Antar for prediction
                            fetchDashaPrediction(mahaDasha.lord, mahaDasha.lord, mahaDasha.lord, lang);
                        }
                    } else if (mahaDasha && mahaDasha.lord) {
                        fetchDashaPrediction(mahaDasha.lord, mahaDasha.lord, mahaDasha.lord, lang);
                    }
                } else {
                    setDashaPredictionText(t('predictionPage.noCurrentDasha', 'No current Dasha period found.'));
                }
            } else {
                setDashaPredictionText("");
            }

                            // --- Fetch Varshphal and Varshphal-based prediction (server-side) ---
                            const fetchVarshphalPrediction = async (year = varshphalYear) => {
                                setIsLoadingVarshphal(true);
                                setVarshphalError(null);
                                setVarshphalPrediction("");
                                try {
                                    const natalDate = adjustedBirthDateTimeString || calculationInputParams.date; // prefer rectified birth time
                                    const payload = {
                                        natalDate,
                                        natalLatitude: calculationInputParams.latitude,
                                        natalLongitude: calculationInputParams.longitude,
                                        varshphalYear: year,
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
                                                lang: lang,
                                                style: varshphalStyle,
                                                varshphalYear: year,
                                            };
                                            const predResp = await api.post('/predictions/varshaphal', varshphalPayload);
                                            setVarshphalPrediction(predResp.data.prediction || '');
                                        } catch (predErr) {
                                            console.error('Error fetching varshphal prediction:', predErr.response?.data || predErr.message || predErr);
                                            setVarshphalError(t('predictionPage.varshphalPredictionFetchError', 'Failed to fetch Varshphal-based prediction.'));
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

                            // Fetch initial varshphal prediction for the chosen year
                            fetchVarshphalPrediction(varshphalYear);

        } else {
            setYogas([]);
            setGeneralPrediction("");
            setDashaPredictionText(""); // Clear dasha prediction too
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [mainResult, calculationInputParams, adjustedGocharDateTimeString, i18n.language, t]); // Added mainResult to dependency array

    const renderContent = () => {
        if (!calculationInputParams?.date) {
            return <p className="info-text">{t('predictionPage.calculateFirst', 'Please calculate a chart first to see the predictions.')}</p>;
        }

        if (isLoading) {
            return <div className="loader">{t('predictionPage.loading', 'Loading Predictions...')}</div>;
        }

        if (error) {
            return <div className="error-text">{t('predictionPage.error', 'Could not load predictions: {{error}}', { error })}</div>;
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
                                            if (varChart) {
                                                const varshphalPayload = { varshphalChart: varChart, muntha: varData.muntha, yearLord: varData.yearLord, muddaDasha: varData.muddaDasha, kpSignificators: varData.kpSignificators, lang: i18n.language, style: varshphalStyle, varshphalYear };
                                                const predResp = await api.post('/predictions/varshaphal', varshphalPayload);
                                                setVarshphalPrediction(predResp.data.prediction || '');
                                            } else {
                                                setVarshphalError(t('predictionPage.varshphalCalculationFailed', 'Varshphal calculation failed.'));
                                            }
                                        } catch (err) {
                                            console.error('Error recalculating varshphal:', err.response?.data || err.message || err);
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
