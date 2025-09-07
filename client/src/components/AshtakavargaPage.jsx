// src/AshtakavargaPage.jsx
import React, { useState, useEffect, useMemo } from 'react';
import { useOutletContext } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { PLANET_ORDER, validateAndFormatDateTime } from './AstrologyUtils';
import api from './api';
import DiamondChart from './DiamondChart'; // Import the chart component
import '../styles/AshtakavargaPage.css';

// Helper function to format date/time (keep as is)
const formatDateTime = (dateTimeString) => {
    if (!dateTimeString) return 'N/A';
    try {
        return new Date(dateTimeString).toLocaleString(undefined, {
            year: 'numeric', month: 'numeric', day: 'numeric',
            hour: 'numeric', minute: 'numeric', second: 'numeric', hour12: true
        });
    } catch (e) {
        console.error("Error formatting date:", e);
        return dateTimeString;
    }
};

// BhinnaAshtakavargaTable component is no longer needed here
// const BhinnaAshtakavargaTable = ({ planetName, scores }) => { ... };


const AshtakavargaPage = () => {
    const { t } = useTranslation();
    const {
        mainResult,
        calculationInputParams,
        adjustedBirthDateTimeString
    } = useOutletContext() || {};

    const [rectifiedResultLocal, setRectifiedResultLocal] = useState(null);
    const [isLoadingRectification, setIsLoadingRectification] = useState(false);
    const [rectificationError, setRectificationError] = useState(null);

    // useEffect for rectification (keep as is)
    useEffect(() => {
        // ... (keep existing useEffect logic)
        if (!adjustedBirthDateTimeString || !calculationInputParams?.latitude || !calculationInputParams?.longitude || !calculationInputParams?.date) {
            if (rectifiedResultLocal) setRectifiedResultLocal(null);
            if (rectificationError) setRectificationError(null);
            return;
        }

        try {
            const originalDate = new Date(calculationInputParams.date);
            const adjustedDate = new Date(adjustedBirthDateTimeString);
            if (!isNaN(originalDate) && !isNaN(adjustedDate) && originalDate.getTime() === adjustedDate.getTime()) {
                if (rectifiedResultLocal) {
                    setRectifiedResultLocal(null);
                    setRectificationError(null);
                }
                return;
            }
        } catch (e) {
            console.error("AshtakavargaPage: Date comparison error:", e);
        }

        const dateTimeValidation = validateAndFormatDateTime(adjustedBirthDateTimeString);
        if (!dateTimeValidation.isValid) {
            setRectificationError(t('ashtakavargaPage.invalidAdjustedDateError', { error: dateTimeValidation.error }));
            setRectifiedResultLocal(null);
            setIsLoadingRectification(false);
            return;
        }
        const formattedDateForApi = dateTimeValidation.formattedDate;

       
        setIsLoadingRectification(true);
        setRectificationError(null);

        const fetchRectifiedData = async () => {
            try {
                const payload = {
                    date: formattedDateForApi,
                    latitude: calculationInputParams.latitude,
                    longitude: calculationInputParams.longitude,
                    placeName: calculationInputParams.placeName
                };
                const response = await api.post('/calculate', payload);
                setRectifiedResultLocal(response.data);
                
            } catch (err) {
                console.error("AshtakavargaPage: Rectification fetch error:", err.response?.data || err.message || err);
                const backendError = err.response?.data?.error || err.response?.data?.message;
                setRectificationError(backendError || err.message || t('ashtakavargaPage.rectificationFetchFailed'));
                setRectifiedResultLocal(null);
            } finally {
                setIsLoadingRectification(false);
            }
        };

        const timerId = setTimeout(fetchRectifiedData, 300);
        return () => clearTimeout(timerId);

    }, [adjustedBirthDateTimeString, calculationInputParams, t, rectificationError, rectifiedResultLocal]);

    const displayNatalResult = rectifiedResultLocal || mainResult;

    const displayNatalInputParams = useMemo(() => {
        // ... (keep existing useMemo logic)
        if (rectifiedResultLocal && calculationInputParams) {
            return { ...calculationInputParams, date: adjustedBirthDateTimeString };
        } else {
            return calculationInputParams;
        }
    }, [rectifiedResultLocal, calculationInputParams, adjustedBirthDateTimeString]);

    const ashtakavargaData = displayNatalResult?.ashtakavarga;
    const bhinnaData = ashtakavargaData?.bhinna;
    const sarvaData = ashtakavargaData?.sarva?.scores;

    const ashtakavargaPlanets = PLANET_ORDER.filter(p =>
        ["Sun", "Moon", "Mars", "Mercury", "Jupiter", "Venus", "Saturn"].includes(p)
    );

    const hasBhinnaData = bhinnaData && Object.keys(bhinnaData).length > 0;
    const hasSarvaData = sarvaData && Array.isArray(sarvaData) && sarvaData.length === 12;

    const showRectificationLoader = isLoadingRectification && mainResult;
    const showRectificationError = rectificationError && mainResult;

    // Loading/Error states (keep as is)
    if (!displayNatalResult && !isLoadingRectification && !rectificationError) {
        // ...
        return (
            <div className="ashtakavarga-page result-container">
                <h2 className="result-title">{t('ashtakavargaPage.title')}</h2>
                {/* Add Key Info Here Too for Consistency */}
                <p
                    className="chart-key-info"
                    dangerouslySetInnerHTML={{ __html: t('ashtakavargaPage.chartKeyInfo') }}
                />
                <p className="info-text">{t('ashtakavargaPage.calculateFirst')}</p>
            </div>
        );
    }
     if (!displayNatalResult && isLoadingRectification) {
         // ...
         return <div className="loader main-loader">{t('ashtakavargaPage.loadingData')}</div>;
     }
      if (!displayNatalResult && rectificationError) {
         // ...
         return <div className="error-text main-error">{t('ashtakavargaPage.errorLoadingData', { error: rectificationError })}</div>;
     }


    return (
        <div className="ashtakavarga-page result-container">
            <h2 className="result-title">{t('ashtakavargaPage.title')}</h2>

            {/* --- Add Key Info Here --- */}
            <p
                className="chart-key-info"
                dangerouslySetInnerHTML={{ __html: t('ashtakavargaPage.chartKeyInfo') }}
            />
            {/* --- End Key Info --- */}


            {showRectificationLoader && <div className="loader secondary-loader">{t('ashtakavargaPage.loadingRectifiedData')}</div>}
            {showRectificationError && <p className="error-text secondary-error">{t('ashtakavargaPage.rectificationErrorPrefix')}: {rectificationError}</p>}


            {displayNatalInputParams && (
                <div className="result-section input-summary">
                    {/* ... (keep input summary rendering) */}
                    <h3 className="result-sub-title">{t('ashtakavargaPage.basedOnLabel')}</h3>
                    <p><strong>{t('ashtakavargaPage.dateLabel')}</strong> {formatDateTime(displayNatalInputParams.date)}</p>
                    <p><strong>{t('ashtakavargaPage.coordsLabel')}</strong> {displayNatalInputParams.latitude?.toFixed(4)}, {displayNatalInputParams.longitude?.toFixed(4)}</p>
                    {displayNatalInputParams.placeName && <p><strong>{t('ashtakavargaPage.placeLabel')}</strong> {displayNatalInputParams.placeName}</p>}
                </div>
            )}

            {displayNatalResult && !ashtakavargaData && !isLoadingRectification && (
                 <p className="error-text">{t('ashtakavargaPage.dataUnavailableError')}</p>
            )}

            {ashtakavargaData && (
                <>
                    {/* --- SAV Section: Use Diamond Chart --- */}
                    <div className="result-section sav-section">
                        {hasSarvaData ? (
                            <DiamondChart
                                title={t('ashtakavargaPage.savTitle')} // Pass translated title
                                size={400} // Keep SAV chart larger
                                houses={displayNatalResult.houses} // Pass houses data
                                scores={sarvaData} // Pass the SAV scores array to the 'scores' prop
                                // Do not pass 'planets' prop here
                            />
                        ) : (
                            <p className="info-text">{t('ashtakavargaPage.savUnavailable')}</p>
                        )}
                    </div>

                    {/* --- BAV Section: Use Diamond Charts in a Grid --- */}
                    <div className="result-section bav-section">
                        <h3 className="result-sub-title">{t('ashtakavargaPage.bavTitle')}</h3>
                        {hasBhinnaData ? (
                            <div className="bav-chart-grid"> {/* Use a grid for layout */}
                                {ashtakavargaPlanets.map(planetName => {
                                    // Get the object for the specific planet
                                    const planetBhinnaData = bhinnaData[planetName];

                                    // Access the 'scores' array within the object
                                    const bavScoresArray = planetBhinnaData?.scores ?? [];

                                    // Use the 'total' directly from the object if available, or calculate
                                    const totalScore = planetBhinnaData?.total ?? (Array.isArray(bavScoresArray)
                                        ? bavScoresArray.reduce((sum, score) => sum + (Number(score) || 0), 0)
                                        : 0); // Fallback calculation if total is missing
                        
                                    // Generate translated title for each BAV chart
                                    const translatedPlanetName = t(`planets.${planetName}`, { defaultValue: planetName });
                                    const chartTitle = t('bhinnaTable.title', { planetName: translatedPlanetName, totalScore });
                        
                                    // *** FIX: Check if the extracted 'bavScoresArray' is actually an array ***
                                    const isValidScoreArray = Array.isArray(bavScoresArray);
                        
                                    return (
                                        <DiamondChart
                                            key={`bav-chart-${planetName}`}
                                            title={chartTitle}
                                            size={300} // Make BAV charts smaller
                                            houses={displayNatalResult.houses}
                                            // *** FIX: Pass the 'bavScoresArray' if it's valid, otherwise null ***
                                            scores={isValidScoreArray ? bavScoresArray : null}
                                            // Do not pass 'planets' prop
                                        />
                                    );
                                })}
                            </div>
                        ) : (
                            <p className="info-text">{t('ashtakavargaPage.bavUnavailable')}</p>
                        )}
                        
                    </div>
                </>
            )}

        </div>
    );
};

export default AshtakavargaPage;
