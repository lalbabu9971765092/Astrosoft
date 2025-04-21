// src/DiamondChart.jsx
import React, { useMemo } from 'react';
import PropTypes from 'prop-types';
import { useTranslation } from 'react-i18next';
import {
    RASHIS,
    PLANET_SYMBOLS,
    PLANET_ORDER,
    convertDMSToDegrees,
    calculateRashi,
   
} from './AstrologyUtils';

// --- Helper function to calculate centroid (Unchanged) ---
function getPolygonCentroid(vertices) {
    if (!vertices || vertices.length === 0) {
        return { x: 0, y: 0 };
    }
    let sumX = 0;
    let sumY = 0;
    vertices.forEach(p => {
        sumX += p.x;
        sumY += p.y;
    });
    return {
        x: sumX / vertices.length,
        y: sumY / vertices.length,
    };
}

// --- Main Component ---
const DiamondChart = ({
    title,
    size = 300,
    houses,
    planets,
    scores // <-- Renamed from savScores
}) => {
    const { t } = useTranslation();
    const chartSize = size;

    // --- Calculate Base Points (Unchanged) ---
    const points = useMemo(() => {
        const margin = chartSize * 0.05;
        const cx = chartSize / 2;
        const cy = chartSize / 2;
        const outerTL = { x: margin, y: margin };
        const outerTR = { x: chartSize - margin, y: margin };
        const outerBR = { x: chartSize - margin, y: chartSize - margin };
        const outerBL = { x: margin, y: chartSize - margin };
        const midTop = { x: cx, y: margin };
        const midRight = { x: chartSize - margin, y: cy };
        const midBottom = { x: cx, y: chartSize - margin };
        const midLeft = { x: margin, y: cy };
        const center = { x: cx, y: cy }; // Corrected center y value
        const intersection1 = { x: (cx + margin) / 2, y: (cy + margin) / 2 };
        const intersection3 = { x: cx + (cx - intersection1.x), y: intersection1.y };
        const intersection4 = { x: intersection3.x, y: cy + (cy - intersection1.y) };
        const intersection2 = { x: intersection1.x, y: intersection4.y };

        return { outerTL, outerTR, outerBR, outerBL, midTop, midRight, midBottom, midLeft, center, intersection1, intersection2, intersection3, intersection4 };
    }, [chartSize]);

    // --- Define House Polygon Vertices (Unchanged) ---
    const housePolygonVertices = useMemo(() => [
        [points.intersection1, points.midTop, points.intersection3, points.center],       // House 1 (Astro Index 0)
        [points.outerTL, points.midTop, points.intersection1],                            // House 2 (Astro Index 1)
        [points.outerTL, points.intersection1, points.midLeft],                           // House 3 (Astro Index 2)
        [points.midLeft, points.intersection1, points.center, points.intersection2],      // House 4 (Astro Index 3)
        [points.midLeft, points.intersection2, points.outerBL],                           // House 5 (Astro Index 4)
        [points.outerBL, points.intersection2, points.midBottom],                         // House 6 (Astro Index 5)
        [points.intersection2, points.midBottom, points.intersection4, points.center],      // House 7 (Astro Index 6)
        [points.outerBR, points.midBottom, points.intersection4],                         // House 8 (Astro Index 7)
        [points.midRight, points.intersection4, points.outerBR],                          // House 9 (Astro Index 8)
        [points.center, points.intersection4, points.midRight, points.intersection3],      // House 10 (Astro Index 9)
        [points.outerTR, points.midRight, points.intersection3],                          // House 11 (Astro Index 10)
        [points.outerTR, points.intersection3, points.midTop],                            // House 12 (Astro Index 11)
    ], [points]);

    // --- Calculate Rashi, Planet Placements, and Scores ---
    const houseDetails = useMemo(() => {
        // Initialize with rashiIndex, rashiName, planets array, and score
        const details = Array(12).fill(null).map(() => ({
            rashiIndex: -1,
            rashiName: '',
            planets: [],
            score: null // <-- Renamed from savScore
        }));

        if (!houses || !Array.isArray(houses) || houses.length < 1 || !houses[0]?.start_dms) {
            console.warn("DiamondChart: Insufficient houses data for Rashi/Planet placement.");
            return details; // Return initialized details if houses are missing
        }

        const ascendantDms = houses[0].start_dms;
        const ascendantDeg = convertDMSToDegrees(ascendantDms);
        if (isNaN(ascendantDeg)) {
             console.warn("DiamondChart: Could not determine Ascendant degree.");
             return details;
        }
        const ascendantRashiName = calculateRashi(ascendantDeg, t);
        const ascendantRashiIndex = RASHIS.indexOf(ascendantRashiName);

        if (ascendantRashiIndex === -1) {
            console.warn("DiamondChart: Could not determine Ascendant Rashi index.");
            return details;
        }

        // Map houses to Rashi indices and assign scores
        for (let i = 0; i < 12; i++) {
            const currentRashiIndex = (ascendantRashiIndex + i) % 12;
            const houseIndex = i; // Astro house index (0-11) matches array index
            details[houseIndex].rashiIndex = currentRashiIndex;
            details[houseIndex].rashiName = RASHIS[currentRashiIndex];

            // Assign score if available (scores array index corresponds to Rashi index)
            if (scores && Array.isArray(scores) && scores.length === 12 && scores[currentRashiIndex] !== undefined) {
                details[houseIndex].score = scores[currentRashiIndex];
            }
        }

        // Place planets (only if planets data is provided and scores are NOT)
        if (planets && !scores) { // Check !scores instead of !savScores
            PLANET_ORDER.forEach(planetName => {
                if (planetName === 'Ascendant') return;
                const planetData = planets[planetName];
                if (planetData && planetData.dms && planetData.dms !== "Error") {
                    const planetDeg = convertDMSToDegrees(planetData.dms);
                    if (!isNaN(planetDeg)) {
                        const planetRashiName = calculateRashi(planetDeg, t);
                        const planetRashiIndex = RASHIS.indexOf(planetRashiName);
                        for (let houseIndex = 0; houseIndex < 12; houseIndex++) {
                            if (details[houseIndex].rashiIndex === planetRashiIndex) {
                                details[houseIndex].planets.push(PLANET_SYMBOLS[planetName] || planetName.substring(0, 2));
                                break;
                            }
                        }
                    }
                }
            });
        }

        return details;

    }, [houses, planets, scores, t]); // <-- Use scores in dependency array

    // --- SVG Rendering ---
    return (
        <div className="birth-chart-container">
            <h4 className="chart-title">{title}</h4>
            <svg
                width={chartSize}
                height={chartSize}
                viewBox={`0 0 ${chartSize} ${chartSize}`}
                className="diamond-chart-svg north-indian-chart"
                aria-labelledby={`chart-title-${title?.replace(/\s+/g, '-') || 'chart'}`}
                style={{ border: '1px solid #ccc', display: 'block', margin: 'auto' }}
            >
                 <title id={`chart-title-${title?.replace(/\s+/g, '-') || 'chart'}`}>{title || 'Astrology Chart'}</title>

                {/* Draw House Polygons, Rashi Numbers, and Planets/Scores */}
                {housePolygonVertices.map((vertices, astroIdx) => {
                    if (!vertices || vertices.length < 3) return null;
                    const pointsString = vertices.map(p => `${p.x},${p.y}`).join(' ');
                    const centroid = getPolygonCentroid(vertices);
                    const houseDetail = houseDetails[astroIdx];
                    // Adjust text positioning
                    const rashiTextYOffset = -15; // Position Rashi number higher
                    const contentTextYOffset = 5; // Position Planets/Score lower

                    return (
                        <g key={`house-group-${astroIdx}`} className={`house-group house-group-${astroIdx + 1}`}>
                            {/* House Polygon */}
                            <polygon points={pointsString} fill="none" stroke="grey" strokeWidth="1" className={`house-polygon house-${astroIdx + 1}`} />

                            {/* Rashi Number */}
                            {houseDetail && houseDetail.rashiIndex !== -1 && (
                                <text
                                    x={centroid.x}
                                    y={centroid.y + rashiTextYOffset}
                                    fontSize="10"
                                    fill="red"
                                    textAnchor="middle"
                                    dominantBaseline="middle"
                                    fontWeight="bold"
                                    style={{ pointerEvents: 'none' }}
                                >
                                    {houseDetail.rashiIndex + 1}
                                </text>
                            )}

                            {/* Conditional Content: Score OR Planets */}
                            {houseDetail && (
                                <text
                                    x={centroid.x}
                                    y={centroid.y + contentTextYOffset}
                                    fontSize={scores ? "12" : "9"} // Larger font for score
                                    fill={scores ? "blue" : "black"} // Different color for score
                                    textAnchor="middle"
                                    dominantBaseline="middle"
                                    fontWeight={scores ? "bold" : "normal"} // Bold for score
                                    style={{ pointerEvents: 'none' }}
                                >
                                    {/* Display score if provided, otherwise display planets */}
                                    {scores // Check scores instead of savScores
                                        ? (houseDetail.score !== null ? houseDetail.score : '?') // Display score or '?'
                                        : (houseDetail.planets.length > 0 ? houseDetail.planets.join(' ') : '') // Display planets
                                    }
                                </text>
                            )}
                        </g>
                    );
                })}

                 {/* Draw Main Chart Lines (Unchanged) */}
                <polygon points={`${points.outerTL.x},${points.outerTL.y} ${points.outerTR.x},${points.outerTR.y} ${points.outerBR.x},${points.outerBR.y} ${points.outerBL.x},${points.outerBL.y}`} className="chart-border" fill="none" stroke="black" strokeWidth="1.5"/>
                <polygon points={`${points.midTop.x},${points.midTop.y} ${points.midRight.x},${points.midRight.y} ${points.midBottom.x},${points.midBottom.y} ${points.midLeft.x},${points.midLeft.y}`} className="chart-line" fill="none" stroke="black" strokeWidth="1"/>
                <line x1={points.outerTL.x} y1={points.outerTL.y} x2={points.outerBR.x} y2={points.outerBR.y} className="chart-line" stroke="black" strokeWidth="1"/>
                <line x1={points.outerTR.x} y1={points.outerTR.y} x2={points.outerBL.x} y2={points.outerBL.y} className="chart-line" stroke="black" strokeWidth="1"/>
            </svg>
        </div>
    );
};

// --- Update PropTypes ---
DiamondChart.propTypes = {
    title: PropTypes.string,
    size: PropTypes.number,
    houses: PropTypes.arrayOf(PropTypes.shape({
        start_dms: PropTypes.string,
    })),
    planets: PropTypes.objectOf(PropTypes.shape({ // Keep planets optional
        dms: PropTypes.string,
    })),
    scores: PropTypes.arrayOf(PropTypes.number) // Renamed from savScores
};

// --- Update DefaultProps ---
DiamondChart.defaultProps = {
    title: 'Chart',
    size: 300,
    houses: [],
    planets: null, // Default planets to null if not provided
    scores: null // Renamed from savScores
};

export default DiamondChart;
