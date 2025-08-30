// src/DiamondChart.jsx
import React, { useMemo } from 'react';
import PropTypes from 'prop-types';
import { useTranslation } from 'react-i18next';
import {
    RASHIS,
    // PLANET_SYMBOLS, // No longer needed directly for display text
    PLANET_ORDER,
    convertDMSToDegrees,
    convertToDMS, // Import convertToDMS
    calculateRashi,
    // Import t function if not already done (it's used via hook)
} from './AstrologyUtils';

// --- Helper function to calculate centroid (Unchanged) ---
function getPolygonCentroid(vertices) {
    // ... (function remains the same)
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
    title = 'Chart',
    size = 400, // Default size to 400
    houses = [],
    planets = null,
    scores = null,
    planetHousePlacements = null,
    prashnaCusps, // New prop
    chartType // Added prop
}) => {
    const { t } = useTranslation(); // Get the t function
    const chartSize = size;

    // --- Calculate Base Points (Unchanged) ---
    const points = useMemo(() => {
        // ... (points calculation remains the same)
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
        const center = { x: cx, y: cy };
        const intersection1 = { x: (cx + margin) / 2, y: (cy + margin) / 2 };
        const intersection3 = { x: cx + (cx - intersection1.x), y: intersection1.y };
        const intersection4 = { x: intersection3.x, y: cy + (cy - intersection1.y) };
        const intersection2 = { x: intersection1.x, y: intersection4.y };

        return { outerTL, outerTR, outerBR, outerBL, midTop, midRight, midBottom, midLeft, center, intersection1, intersection2, intersection3, intersection4 };
    }, [chartSize]);

    // --- Define House Polygon Vertices (Unchanged) ---
    const housePolygonVertices = useMemo(() => [
        // ... (vertices definitions remain the same)
        [points.intersection1, points.midTop, points.intersection3, points.center],       // House 1
        [points.outerTL, points.midTop, points.intersection1],                            // House 2
        [points.outerTL, points.intersection1, points.midLeft],                           // House 3
        [points.midLeft, points.intersection1, points.center, points.intersection2],      // House 4
        [points.midLeft, points.intersection2, points.outerBL],                           // House 5
        [points.outerBL, points.intersection2, points.midBottom],                         // House 6
        [points.intersection2, points.midBottom, points.intersection4, points.center],      // House 7
        [points.outerBR, points.midBottom, points.intersection4],                         // House 8
        [points.midRight, points.intersection4, points.outerBR],                          // House 9
        [points.center, points.intersection4, points.midRight, points.intersection3],      // House 10
        [points.outerTR, points.midRight, points.intersection3],                          // House 11
        [points.outerTR, points.intersection3, points.midTop],                            // House 12
    ], [points]);

    // --- Calculate Rashi, Planet Placements, and Scores ---
    const houseDetails = useMemo(() => {
            const details = Array(12).fill(null).map(() => ({
                rashiIndex: -1,
                rashiName: '',
                planets: [],
                score: null
            }));

            let effectiveCusps = houses;
            if (prashnaCusps && prashnaCusps.length === 12) {
                // If prashnaCusps are provided, use them to determine Rashi placements
                // This is crucial for Prashna charts where the Ascendant is fixed by number
                effectiveCusps = prashnaCusps.map(deg => ({ start_dms: convertToDMS(deg) }));
            }

            if (!effectiveCusps || !Array.isArray(effectiveCusps) || effectiveCusps.length < 1 || !effectiveCusps[0]?.start_dms) {
                console.warn("DiamondChart: Insufficient houses data for Rashi/Planet placement.");
                return details;
            }

            // Determine Rashi for each house based on chartType
            if (chartType === 'bhava') { // Apply Bhava Chalit logic
                for (let i = 0; i < 12; i++) {
                    const houseCuspDms = effectiveCusps[i].start_dms;
                    const houseCuspDeg = convertDMSToDegrees(houseCuspDms);
                    if (isNaN(houseCuspDeg)) {
                        console.warn(`DiamondChart: Could not determine Rashi for House ${i + 1} from cusp DMS:`, houseCuspDms);
                        continue; // Skip this house if degree is invalid
                    }
                    const rashiNameForCusp = calculateRashi(houseCuspDeg, t);
                    const rashiIndexForCusp = RASHIS.indexOf(rashiNameForCusp);

                    const houseIndex = i; // House index (0-11)
                    details[houseIndex].rashiIndex = rashiIndexForCusp;
                    details[houseIndex].rashiName = RASHIS[rashiIndexForCusp];

                    if (scores && Array.isArray(scores) && scores.length === 12 && scores[rashiIndexForCusp] !== undefined) {
                        details[houseIndex].score = scores[rashiIndexForCusp];
                    }
                }
            } else { // Apply standard Lagna/D1 logic (based on Ascendant and incrementing)
                const ascendantDms = effectiveCusps[0].start_dms;
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

                for (let i = 0; i < 12; i++) {
                    const currentRashiIndex = (ascendantRashiIndex + i) % 12;
                    const houseIndex = i;
                    details[houseIndex].rashiIndex = currentRashiIndex;
                    details[houseIndex].rashiName = RASHIS[currentRashiIndex];

                    if (scores && Array.isArray(scores) && scores.length === 12 && scores[currentRashiIndex] !== undefined) {
                        details[houseIndex].score = scores[currentRashiIndex];
                    }
                }
            }

            // *** NEW CONDITIONAL LOGIC FOR PLANET PLACEMENT ***
            if (planetHousePlacements) {
                // --- Logic for Bhava Chalit Chart ---
                // Places planets based on pre-calculated house number.
                Object.entries(planetHousePlacements).forEach(([planetName, houseNumber]) => {
                    // houseNumber is 1-12. The visual house index is houseNumber - 1.
                    if (houseNumber >= 1 && houseNumber <= 12) {
                        const symbol = t(`planetsShort.${planetName}`, { defaultValue: planetName.substring(0, 2) });
                        details[houseNumber - 1].planets.push(symbol);
                    }
                });
            } else if (planets && !scores) {
                // --- Original Logic for Rashi-based Charts (Lagna, D9, Gochar) ---
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
                                    const symbol = t(`planetsShort.${planetName}`, { defaultValue: planetName.substring(0, 2) });
                                    details[houseIndex].planets.push(symbol);
                                    break;
                                }
                            }
                        }
                    }
                });
            }

            return details;

        }, [houses, planets, scores, planetHousePlacements, prashnaCusps, t]);


    

    // --- Constants and Calculations (Keep as is) ---
    // const radius = size / 2; // Defined below
    // const center = radius; // Defined below
    // const natalPlanetRadius = radius * 0.75; // Used only if planets prop is passed
    // const signLabelRadius = radius * 0.9; // Defined below
    // const houseLineRadius = radius; // Used only if houses prop is passed
    // const houseLabelRadius = radius * 0.5; // Used only if houses prop is passed
    const planetSymbolFontSize = scores ? 9 : 10; // Slightly smaller if scores are present
    


    return (
        <div className="birth-chart-container">
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
                    const rashiTextYOffset = scores ? -12 : -15; // Position Rashi number higher, adjust if scores present
                    const contentTextYOffset = scores ? 8 : 5; // Position Planets/Score lower, adjust if scores present
                    const planetSpacing = scores ? 0 : 10; // Horizontal spacing between planets if scores aren't shown

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
                                    dominantBaseline="central" // Use central for better vertical alignment
                                    fontWeight="bold"
                                    style={{ pointerEvents: 'none' }}
                                >
                                    {/* Translate Rashi number if needed, or just display number */}
                                    {houseDetail.rashiIndex + 1}
                                </text>
                            )}

                            {/* Conditional Content: Score OR Planets */}
                            {houseDetail && (
                                <text
                                    x={centroid.x}
                                    y={centroid.y + contentTextYOffset}
                                    fontSize={scores ? "12" : planetSymbolFontSize} // Larger font for score
                                    fill={scores ? "blue" : "black"} // Different color for score
                                    textAnchor="middle"
                                    dominantBaseline="central" // Use central
                                    fontWeight={scores ? "bold" : "normal"} // Bold for score
                                    style={{ pointerEvents: 'none' }}
                                >
                                    {/* Display score if provided */}
                                    {scores && houseDetail.score !== null && houseDetail.score}

                                    {/* Display planets if scores are NOT provided */}
                                    {!scores && houseDetail.planets.length > 0 &&
                                        houseDetail.planets.map((planetSymbol, pIdx) => (
                                            // Use tspan for horizontal spacing
                                            <tspan key={pIdx} dx={pIdx > 0 ? planetSpacing : 0}>
                                                {planetSymbol}
                                            </tspan>
                                        ))
                                    }
                                    {/* Show '?' if score is expected but null */}
                                    {scores && houseDetail.score === null && '?'}
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
        // Add mean_dms if used for Bhava Chalit chart rendering
        mean_dms: PropTypes.string,
    })),
    planets: PropTypes.objectOf(PropTypes.shape({
        dms: PropTypes.string,
    })),
    sscores: PropTypes.arrayOf(PropTypes.number),
    planetHousePlacements: PropTypes.objectOf(PropTypes.number),
    chartType: PropTypes.string // Added chartType
};
// --- Update DefaultProps ---


export default DiamondChart;
