// src/ZodiacCircleChart.jsx
import React from 'react';
import PropTypes from 'prop-types'; // Import PropTypes
import { useTranslation } from 'react-i18next'; // Import the hook
import '../styles/ZodiacCircleChart.css';
import { RASHIS, PLANET_SYMBOLS, convertDMSToDegrees, normalizeAngle } from './AstrologyUtils';

// --- Define Colors (Keep as is) ---
const NATAL_COLOR = "#333";
const TRANSIT_COLOR = "#007bff";
const HOUSE_COLOR = "#28a745";
const SIGN_COLOR = "#dc3545";
const GENERAL_STROKE_COLOR = "#ccc";
const GUIDE_STROKE_COLOR = "#eee";
const TRANSIT_RADIUS_OFFSET = 0.08;

// Helper function to format DMS to Degree°Minute' (Keep as is)
const formatDM = (dmsString) => {
    if (!dmsString || typeof dmsString !== 'string' || dmsString === "N/A" || dmsString === "Error") return "";
    const parts = dmsString.match(/(\d+)°(\d+)'([\d.]+)"/);
    if (!parts) return "";
    const degrees = parts[1];
    const minutes = parts[2];
    return `${degrees}°${minutes}'`;
};

const ZodiacCircleChart = ({
    natalPlanets,
    transitPlanets,
    houses: natalHouses, // Renamed for clarity
    transitHouses, // New prop for transit houses
    title = "Zodiac Chart",
    size = 300
}) => {
    const { t } = useTranslation(); // Call the hook

    // --- Constants and Calculations (Keep as is) ---
    const radius = size / 2;
    const center = radius;
    const natalPlanetRadius = radius * 0.75;
    const transitPlanetRadius = natalPlanetRadius * (1 + TRANSIT_RADIUS_OFFSET);
    const signLabelRadius = radius * 0.9;
    const houseLineRadius = radius;
    const houseLabelRadius = radius * 0.5;
    const transitHouseLabelRadius = radius * 0.65; // Place transit numbers slightly further out
    const planetSymbolFontSize = 12;
    const planetDegreeFontSize = 8;
    const degreeTextOffset = planetSymbolFontSize * 0.8;

    const getPosition = (angleDegrees, r) => {
        const angleRad = ((angleDegrees - 90) * Math.PI) / 180;
        return {
            x: center + r * Math.cos(angleRad),
            y: center + r * Math.sin(angleRad),
        };
    };

    // Modified renderPlanets (Keep as is)
    const renderPlanets = (planets, r, color, idPrefix) => {
        if (!planets || Object.keys(planets).length === 0) return null;

        // 1. Process and sort planets by their degree
        const processedPlanets = Object.entries(planets)
            .map(([name, data]) => {
                if (!data || !data.dms || data.dms === "Error") return null;
                const degrees = convertDMSToDegrees(data.dms);
                if (isNaN(degrees)) return null;
                return { name, data, degrees: normalizeAngle(degrees) };
            })
            .filter(p => p !== null)
            .sort((a, b) => a.degrees - b.degrees);

        // 2. Adjust radius for overlapping planets with a more robust clustering logic
        const overlapThreshold = 10; // degrees
        const radialOffset = 18;   // pixels to push planets outwards
        const adjustedPlanetData = [];

        for (let i = 0; i < processedPlanets.length; i++) {
            const current = processedPlanets[i];
            const prev = i > 0 ? processedPlanets[i - 1] : null;
            
            let angleDiff = 360; // Default to a large difference
            if (prev) {
                angleDiff = Math.abs(current.degrees - prev.degrees);
                if (angleDiff > 180) angleDiff = 360 - angleDiff; // Handle wrap-around
            }

            let currentRadius;
            if (angleDiff < overlapThreshold) {
                // This planet is part of a cluster with the previous one.
                // Alternate the radius based on the previous planet's radius.
                const prevAdjustedRadius = adjustedPlanetData[i - 1].adjustedRadius;
                currentRadius = (prevAdjustedRadius === r) ? r + radialOffset : r;
            } else {
                // Not in a cluster, or the start of a new one.
                currentRadius = r;
            }

            adjustedPlanetData.push({ ...current, adjustedRadius: currentRadius });
        }

        // 3. Render the adjusted planets
        return adjustedPlanetData.map(p => {
            const { name, data, degrees, adjustedRadius } = p;
            const pos = getPosition(degrees, adjustedRadius);
            // Use translation for the short planet name, with a fallback to the symbol constant.
            const symbol = t(`planetsShort.${name}`, { defaultValue: PLANET_SYMBOLS[name] || name.substring(0, 2) });
            const degreeText = formatDM(data.dms);
            const degreePos = getPosition(degrees, adjustedRadius + degreeTextOffset);

            return (
                <React.Fragment key={`${idPrefix}-${name}`}>
                    <text
                        x={pos.x}
                        y={pos.y}
                        textAnchor="middle"
                        dominantBaseline="middle"
                        fontSize={planetSymbolFontSize}
                        fontWeight="bold"
                        fill={color}
                        className={`planet-symbol ${idPrefix}-planet`}
                    >
                        {symbol}
                    </text>
                    {degreeText && (
                        <text
                            x={degreePos.x}
                            y={degreePos.y}
                            textAnchor="middle"
                            dominantBaseline="middle"
                            fontSize={planetDegreeFontSize}
                            fill={color}
                            className={`planet-degree ${idPrefix}-degree`}
                        >
                            {degreeText}
                        </text>
                    )}
                </React.Fragment>
            );
        });
    };

    const renderHouseCusps = (houseData, color, strokeWidth, strokeDasharray, idPrefix) => {
        if (!houseData || houseData.length !== 12 || !houseData.every(h => h?.start_dms)) {
            return null;
        }

        return (
            <>
                {houseData.map((house, index) => {
                    const cuspAngle = normalizeAngle(convertDMSToDegrees(house.start_dms));
                    if (isNaN(cuspAngle)) return null;

                    const cuspPos = getPosition(cuspAngle, houseLineRadius);
                    const nextCuspAngle = normalizeAngle(convertDMSToDegrees(houseData[(index + 1) % 12].start_dms));
                    let angleDiff = normalizeAngle(nextCuspAngle - cuspAngle);
                    if (angleDiff <= 0) angleDiff += 360;
                    const houseMidAngle = normalizeAngle(cuspAngle + angleDiff / 2);

                    // Determine the radius for the house number based on type
                    const labelRadius = idPrefix === 'natal' ? houseLabelRadius : transitHouseLabelRadius;
                    const houseLabelPos = getPosition(houseMidAngle, labelRadius);

                    return (
                        <React.Fragment key={`house-${idPrefix}-${index}`}>
                            <line x1={center} y1={center} x2={cuspPos.x} y2={cuspPos.y} stroke={color} strokeWidth={strokeWidth} strokeDasharray={strokeDasharray} />
                            <text x={houseLabelPos.x} y={houseLabelPos.y} textAnchor="middle" dominantBaseline="middle" fontSize="12" fontWeight="bold" fill={color}>
                                {index + 1}
                            </text>
                        </React.Fragment>
                    );
                })}
            </>
        );
    };

    return (
        <div className="zodiac-chart-container">
            <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="zodiac-chart-svg">
                {/* --- SVG Elements (Keep structure as is) --- */}
                <circle cx={center} cy={center} r={radius} fill="none" stroke={GENERAL_STROKE_COLOR} strokeWidth="1" />
                <circle cx={center} cy={center} r={natalPlanetRadius} fill="none" stroke={GUIDE_STROKE_COLOR} strokeDasharray="2,2" />
                 {transitPlanets && <circle cx={center} cy={center} r={transitPlanetRadius} fill="none" stroke={GUIDE_STROKE_COLOR} strokeDasharray="2,2" />}

                {/* Draw Zodiac Signs */}
                {RASHIS.map((signKey, index) => { // Use signKey from RASHIS array
                    const startAngle = index * 30;
                    const midAngle = startAngle + 15;
                    const startPos = getPosition(startAngle, radius);
                    const midPosLabel = getPosition(midAngle, signLabelRadius);
                    // Get translated short name, fallback to key's first 3 chars
                    const signLabel = t(`rashisShort.${signKey}`, signKey.substring(0, 3));

                    return (
                        <React.Fragment key={`sign-${signKey}`}>
                            <line
                                x1={center} y1={center} x2={startPos.x} y2={startPos.y}
                                stroke={SIGN_COLOR} strokeWidth="0.5" strokeDasharray="4,2"
                            />
                            <text
                                x={midPosLabel.x} y={midPosLabel.y}
                                textAnchor="middle" dominantBaseline="middle"
                                fontSize="10" fill={SIGN_COLOR} fontWeight="bold"
                            >
                                {signLabel} {/* Use translated short name */}
                            </text>
                        </React.Fragment>
                    );
                })}

                {/* Draw Natal House Cusps */}
                {renderHouseCusps(natalHouses, HOUSE_COLOR, "1", "none", "natal")}

                {/* Draw Transit House Cusps */}
                {renderHouseCusps(transitHouses, TRANSIT_COLOR, "0.75", "5,3", "transit")}

                {/* Draw Natal Planets (Keep as is) */}
                {renderPlanets(natalPlanets, natalPlanetRadius, NATAL_COLOR, 'natal')}

                {/* Draw Transit Planets (Keep as is) */}
                {renderPlanets(transitPlanets, transitPlanetRadius, TRANSIT_COLOR, 'transit')}

                {/* Optional Legend - TRANSLATED */}
                <g transform={`translate(${size * 0.05}, ${size * 0.95})`}>
                    <text x="0" y="0" fontSize="10" fill={NATAL_COLOR}>■ {t('zodiacCircleChart.legendNatal')}</text>
                    {transitPlanets && <text x="50" y="0" fontSize="10" fill={TRANSIT_COLOR}>■ {t('zodiacCircleChart.legendTransit')}</text>}
                    {natalHouses && <text x="110" y="0" fontSize="10" fill={HOUSE_COLOR}>■ {t('zodiacCircleChart.legendHouses')}</text>}
                    {transitHouses && <text x="110" y="12" fontSize="10" fill={TRANSIT_COLOR}>■ {t('zodiacCircleChart.legendTransitHouses', 'Transit Houses')}</text>}
                    <text x="170" y="0" fontSize="10" fill={SIGN_COLOR}>■ {t('zodiacCircleChart.legendSigns')}</text>
                </g>
            </svg>
        </div>
    );
};

// Define PropTypes
ZodiacCircleChart.propTypes = {
    natalPlanets: PropTypes.objectOf(PropTypes.shape({
        dms: PropTypes.string,
        // Add other expected properties if needed
    })).isRequired, // Natal planets are essential for the chart to render
    transitPlanets: PropTypes.objectOf(PropTypes.shape({
        dms: PropTypes.string,
    })),
    houses: PropTypes.arrayOf(PropTypes.shape({ // This is now natalHouses
        start_dms: PropTypes.string,
    })),
    transitHouses: PropTypes.arrayOf(PropTypes.shape({
        start_dms: PropTypes.string,
        // Add other expected house properties if needed
    })),
    title: PropTypes.string,
    size: PropTypes.number
};

export default ZodiacCircleChart;
