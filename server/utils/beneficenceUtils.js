// server/utils/beneficenceUtils.js
import logger from './logger.js';
import {
    PLANET_ORDER,
    RASHIS, // Used for RASHI_LORDS lookup
    RASHI_LORDS,
    FRIENDSHIP_PLANETS_ORDER,
    // VIMS_DASHA_SEQUENCE // Not directly used in current scoring
} from './constants.js';
import { getRashiDetails, getNakshatraDetails } from './planetaryUtils.js';
import { calculatePlanetStates } from './planetaryUtils.js'; // Use the version that gets a single state


// Helper to classify planet nature based on the provided document
function getNaturalPlanetNature(planetName) {
    switch (planetName) {
        case "Jupiter": return { type: "Benefic", score: 3 }; // Natural Benefic
        case "Venus": return { type: "Benefic", score: 2 }; // Natural Benefic
        // Moon (Waxing) and Mercury (Unafflicted) are handled by specific calculation, return base benefic type
        case "Moon": return { type: "Benefic", score: 0 };
        case "Mercury": return { type: "Benefic", score: 0 };
        case "Sun": return { type: "Malefic", score: -1 }; // Mild Malefic
        case "Mars": return { type: "Malefic", score: -2 }; // Malefic
        case "Saturn": return { type: "Malefic", score: -2 }; // Malefic
        case "Rahu":
        case "Ketu": return { type: "Malefic", score: -3 }; // Shadow Malefic
        default: return { type: "Neutral", score: 0 }; // Should not happen for core planets
    }
}

// 1. NATURAL BENEFICENCE SCORE (NBS)
function calculateNBS(planetName, chartData) {
    const { planetaryPositions } = chartData;
    const planetData = planetaryPositions.sidereal[planetName];
    if (!planetData) return 0;

    let score = getNaturalPlanetNature(planetName).score;

    // Special handling for Moon (Waxing vs. Waning)
    if (planetName === "Moon" && planetaryPositions.sidereal.Sun) {
        const moonLongitude = planetData.longitude;
        const sunLongitude = planetaryPositions.sidereal.Sun.longitude;
        // Normalize angle to 0-360, difference from Sun.
        // Moon is waxing if it's ahead of the Sun (0-180 degrees)
        const angleBetween = (moonLongitude - sunLongitude + 360) % 360;
        if (angleBetween > 0 && angleBetween <= 180) {
            score = 2; // Moon (Waxing)
        } else {
            score = -1; // Moon (Waning) - assumed mild malefic score based on Sun's score, as not specified.
        }
    }

    // Special handling for Mercury (Unafflicted)
    // The document implies this is a base benefic score. Affliction would reduce it elsewhere (e.g., ARS).
    // So, if Mercury, and not specifically afflicted here, its base score is 1.
    if (planetName === "Mercury") {
        // This is tricky. "Unafflicted" isn't directly measurable in a single variable easily here.
        // For NBS, we'll assign its base score as 1. If it's afflicted, other scores (like ARS) should penalize it.
        score = 1;
    }

    return score;
}

// 2. FUNCTIONAL BENEFICENCE SCORE (FBS)
function calculateFBS(planetName, chartData) {
    const { houses, ascendant } = chartData;
    let score = 0;

    if (!houses || !ascendant || !ascendant.sidereal_dms) {
        logger.warn(`FBS calculation skipped for ${planetName}: Missing houses or ascendant data.`);
        return 0;
    }

    for (let i = 0; i < houses.length; i++) {
        const houseNum = houses[i].house_number;
        const houseLord = houses[i]?.start_rashi_lord;
        const rashi = houses[i]?.start_rashi;

        let isConsideredLord = (houseLord === planetName);

        // Add co-lordship logic for Rahu and Ketu
        if (planetName === 'Rahu' && rashi === 'Aquarius') {
            isConsideredLord = true;
        } else if (planetName === 'Ketu' && rashi === 'Scorpio') {
            isConsideredLord = true;
        }


        if (isConsideredLord) {
            // A planet can lord multiple houses. Sum up the scores for each house it lords.
            switch (houseNum) {
                case 1: score += 2; break; // Benefic
                case 2:
                case 11: score += 0; break; // Mixed
                case 3: score += -1; break; // Malefic
                case 4:
                case 7:
                case 10: score += 0; break; // Neutral
                case 5:
                case 9: score += 3; break; // Benefic
                case 6: score += -2; break; // Malefic
                case 8: score += -3; break; // Strong Malefic
                case 12: score += -2; break; // Loss
                default: break;
            }
        }
    }
    return score;
}

// 3. PLANETARY DIGNITY SCORE (PDS)
function calculatePDS(planetName, chartData) {
    const { planetaryPositions } = chartData;
    const planetData = planetaryPositions.sidereal[planetName];
    if (!planetData) return 0;

    // calculatePlanetStates is designed to return a single string state
    const planetState = calculatePlanetStates(planetaryPositions.sidereal)[planetName];

    switch (planetState) {
        case "Exalted": return 4;
        case "Moolatrikona": return 3;
        case "Own Sign": return 2;
        case "Friend": return 2; // "Friendly sign" in doc
        case "Neutral": return 0;
        case "Enemy": return -2;
        case "Debilitated": return -4;
        default: return 0;
    }
}

// 4. STRENGTH SCORE (SS)
function calculateSS(planetName, chartData) {
    const { shadbala, d9_planets, planetaryPositions } = chartData;
    let score = 0;

    // Shadbala - Not applicable for Rahu/Ketu
    if (shadbala && Object.keys(shadbala).length > 0 && shadbala[planetName]) {
        const shadbalaEntry = shadbala[planetName];
        if (shadbalaEntry && !isNaN(parseFloat(shadbalaEntry.percentage))) {
            const percentage = parseFloat(shadbalaEntry.percentage);
            if (percentage > 150) score += 2;
            else if (percentage >= 110 && percentage <= 150) score += 1;
            else if (percentage < 70) score += -2;
        }
    }

    // Avastha (Deepta/Sushupti, Mrita/Bhrashta)
    const planetAvasthas = planetaryPositions.sidereal[planetName]?.avasthas;
    if (planetAvasthas) {
        const positiveAvasthas = ['Deepta', 'Pramudita', 'Shanta', 'Swastha'];
        const negativeAvasthas = ['Dukḥita', 'Khala', 'Vikala', 'Deena'];

        if (positiveAvasthas.includes(planetAvasthas.deeptaadi)) score += 1;
        if (negativeAvasthas.includes(planetAvasthas.deeptaadi)) score += -1;

        if (planetAvasthas.jagradadi === 'Jagrata') score += 1;
        if (planetAvasthas.jagradadi === 'Mrita') score += -1;
    }

    // Navamsa
    if (d9_planets && Object.keys(d9_planets).length > 0) { // Check if d9_planets exists and is not empty
        const d9PlanetData = d9_planets[planetName];
        if (d9PlanetData && d9PlanetData.rashi && planetaryPositions.sidereal[planetName]?.rashi) {
            const d9PlanetState = calculatePlanetStates({ [planetName]: { rashi: d9PlanetData.rashi } })[planetName];
            if (d9PlanetState === 'Exalted' || d9PlanetState === 'Moolatrikona') score += 2;

            // Vargottama (D1 Rashi == D9 Rashi)
            const d1Rashi = planetaryPositions.sidereal[planetName].rashi;
            if (d1Rashi === d9PlanetData.rashi) score += 1;

            if (d9PlanetState === 'Enemy' || d9PlanetState === 'Debilitated') score += -1;
        }
    }

    return score;
}

// 5. COMBUSTION & RETROGRADE SCORE (CRS)
function calculateCRS(planetName, chartData) {
    const { planetaryPositions } = chartData;
    const planetAvasthas = planetaryPositions.sidereal[planetName]?.avasthas;
    if (!planetAvasthas) return 0;

    let score = 0;
    const { isCombust, isRetrograde } = planetAvasthas;

    // Combustion - Not applicable to Rahu/Ketu
    if (isCombust) {
        // Doc: Strong -2, Mild -1. Without criteria, assume -2 for all combustion.
        score += -2;
    }

    // Retrograde
    if (isRetrograde) {
        // For Rahu/Ketu, they are always retrograde, this will consistently apply.
        const naturalNature = getNaturalPlanetNature(planetName);
        if (naturalNature.type === "Benefic") score += 1;
        else if (naturalNature.type === "Malefic") score += -1;
    }
    return score;
}

// 6. HOUSE PLACEMENT SCORE (HPS)
function calculateHPS(planetName, chartData) {
    const { planetHousePlacements } = chartData;
    const house = planetHousePlacements[planetName]; // Nirayana Bhav Chalit house placement
    if (!house) return 0;

    switch (house) {
        case 1:
        case 5:
        case 9: return 2;
        case 2:
        case 4:
        case 7:
        case 10: return 1;
        case 3:
        case 6:
        case 11: return 0;
        case 8:
        case 12: return -2;
        default: return 0;
    }
}

// 7. ASPECT RECEIVED SCORE (ARS)
function calculateARS(planetName, chartData) {
    const { planetDetails } = chartData;
    const { reverseAspects } = planetDetails.aspects; // Aspects RECEIVED by 'planetName'
    let score = 0;

    const aspectingPlanets = reverseAspects[planetName] || [];

    for (const aspecter of aspectingPlanets) {
        const naturalNature = getNaturalPlanetNature(aspecter);
        // Scores are specific to the aspecting planet's natural nature and name
        if (naturalNature.type === "Benefic") {
            switch (aspecter) {
                case "Jupiter": score += 2; break;
                case "Venus": score += 1; break;
                case "Mercury": score += 1; break; // Assumed unafflicted for aspect. If aspecting benefics, it's benefic
                case "Moon": score += 1; break; // Assumed waxing for aspect.
                default: break; // Should not happen for benefics
            }
        } else if (naturalNature.type === "Malefic") {
            switch (aspecter) {
                case "Saturn": score += -2; break;
                case "Mars": score += -2; break;
                case "Rahu":
                case "Ketu": score += -2; break;
                case "Sun": score += -1; break;
                default: break; // Should not happen for malefics
            }
        }
    }
    return score;
}

// 8. NAKSHATRA-LORD MODIFIER (NLM)
function calculateNLM(planetName, chartData) {
    const { planetaryPositions } = chartData;
    const planetData = planetaryPositions.sidereal[planetName];
    if (!planetData || !planetData.nakLord) return 0;

    const nakLord = planetData.nakLord;
    const naturalNatureOfNakLord = getNaturalPlanetNature(nakLord);

    if (naturalNatureOfNakLord.type === "Benefic") return 1;
    if (naturalNatureOfNakLord.type === "Malefic") return -1;
    return 0; // Neutral nakshatra lord
}

// 9. ASSOCIATION SCORE (ASC)
function calculateASC(planetName, chartData) {
    const { planetHousePlacements, planetaryPositions, planetDetails } = chartData;
    const planetHouse = planetHousePlacements[planetName]; // House of the target planet
    if (!planetHouse) return 0;

    let score = 0;

    // --- Conjunctions ---
    // Planets in the same house
    const planetsInSameHouse = Object.keys(planetHousePlacements).filter(
        p => p !== planetName && planetHousePlacements[p] === planetHouse && FRIENDSHIP_PLANETS_ORDER.includes(p) // Only consider core planets for conjunctions for now
    );

    for (const associatedPlanet of planetsInSameHouse) {
        const naturalNature = getNaturalPlanetNature(associatedPlanet);
        if (naturalNature.type === "Benefic") {
            // Strong benefic conjunction +2, Weak benefic +1
            // Without clear criteria for strong/weak, let's use +1 for all benefics for now.
            // A more advanced implementation might use dignity/shadbala of the associated planet.
            score += 1; // Default to 'Weak benefic'
        } else if (naturalNature.type === "Malefic") {
            score += -2;
        }
    }

    // --- Hemmed by benefics/malefics ---
    // This requires checking planets in adjacent houses to the 'planetHouse'.
    // Given the complexity of "hemmed" definitions (e.g., within degrees of house cusp, influence of stronger planets)
    // and the high-level description, this is simplified.
    // For a basic implementation, we can check adjacent houses.
    // House numbers are 1-12. Adjacent houses are (current - 1) and (current + 1).
    // Handle wrap-around for house 1 (house 12) and house 12 (house 1).

    const prevHouse = planetHouse === 1 ? 12 : planetHouse - 1;
    const nextHouse = planetHouse === 12 ? 1 : planetHouse + 1;

    const planetsInPrevHouse = Object.keys(planetHousePlacements).filter(
        p => planetHousePlacements[p] === prevHouse && FRIENDSHIP_PLANETS_ORDER.includes(p)
    );
    const planetsInNextHouse = Object.keys(planetHousePlacements).filter(
        p => planetHousePlacements[p] === nextHouse && FRIENDSHIP_PLANETS_ORDER.includes(p)
    );

    let hasBeneficHemming = false;
    let hasMaleficHemming = false;

    // Check previous house for benefics/malefics
    for (const p of planetsInPrevHouse) {
        const naturalNature = getNaturalPlanetNature(p);
        if (naturalNature.type === "Benefic") hasBeneficHemming = true;
        if (naturalNature.type === "Malefic") hasMaleficHemming = true;
    }
    // Check next house for benefics/malefics
    for (const p of planetsInNextHouse) {
        const naturalNature = getNaturalPlanetNature(p);
        if (naturalNature.type === "Benefic") hasBeneficHemming = true;
        if (naturalNature.type === "Malefic") hasMaleficHemming = true;
    }

    // Apply hemmed scores (simplified)
    if (hasBeneficHemming && !hasMaleficHemming) {
        score += 1; // Hemmed by benefics
    } else if (hasMaleficHemming && !hasBeneficHemming) {
        score += -2; // Hemmed by malefics
    }
    // If hemmed by both, score remains unchanged from conjunctions, or needs more complex rule.
    // Doc: Hemmed by benefics +1, Hemmed by malefics -2. Implies exclusive.

    return score;
}


// 10. FINAL FORMULA (UPBS)
const UPBS_WEIGHTS = {
    NBS: 1.0, // Natural Beneficence
    FBS: 1.5, // Functional Beneficence (often more important)
    PDS: 1.0, // Dignity
    SS: 1.0,  // Shadbala & Avasthas
    CRS: 0.8, // Combustion/Retrograde (slightly less weight as it's a specific condition)
    HPS: 1.2, // House Placement (very important for results)
    ARS: 1.2, // Aspects Received
    NLM: 0.5, // Nakshatra Lord (subtle influence)
    ASC: 1.0, // Associations
};


export function calculateUPBS(planetName, chartData) {
    if (!chartData || !chartData.planetaryPositions || !chartData.planetHousePlacements || !chartData.planetDetails || !chartData.shadbala || !chartData.d9_planets || !chartData.ascendant || !chartData.houses) {
        logger.warn(`Missing required chartData for UPBS calculation for ${planetName}.`);
        return { total: NaN, breakdown: {} };
    }

    const breakdown = {
        NBS: calculateNBS(planetName, chartData),
        FBS: calculateFBS(planetName, chartData),
        PDS: calculatePDS(planetName, chartData),
        SS: calculateSS(planetName, chartData),
        CRS: calculateCRS(planetName, chartData),
        HPS: calculateHPS(planetName, chartData),
        ARS: calculateARS(planetName, chartData),
        NLM: calculateNLM(planetName, chartData),
        ASC: calculateASC(planetName, chartData),
    };

    // For Rahu/Ketu, some scores are not applicable (e.g. Shadbala). We should reflect that.
    // The functions themselves handle missing data, so we can proceed.
    // The SS function will return a lower score for Rahu/Ketu as Shadbala part is skipped.

    const total = (breakdown.NBS * UPBS_WEIGHTS.NBS) +
                  (breakdown.FBS * UPBS_WEIGHTS.FBS) +
                  (breakdown.PDS * UPBS_WEIGHTS.PDS) +
                  (breakdown.SS * UPBS_WEIGHTS.SS) +
                  (breakdown.CRS * UPBS_WEIGHTS.CRS) +
                  (breakdown.HPS * UPBS_WEIGHTS.HPS) +
                  (breakdown.ARS * UPBS_WEIGHTS.ARS) +
                  (breakdown.NLM * UPBS_WEIGHTS.NLM) +
                  (breakdown.ASC * UPBS_WEIGHTS.ASC);

    return { total, breakdown };
}

