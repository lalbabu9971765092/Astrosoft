// utils/strengthUtils.js
import logger from './logger.js';
import { FRIENDSHIP_PLANETS_ORDER, PLANETARY_RELATIONS, ASHTAKAVARGA_PLANETS, RASHI_LORDS, RASHI_SPAN } from './constants.js';
import { normalizeAngle, convertDMSToDegrees } from './coreUtils.js';
import { getRashiDetails, getHouseOfPlanet, calculatePlanetStates } from './planetaryUtils.js';

// --- Temporal Friendship ---

/**
 * Calculates temporal friendship for a single planet based on placement relative to it.
 * @param {string} targetPlanet - The planet for which to calculate temporal friendship.
 * @param {object} siderealPositions - Object containing sidereal positions.
 * @returns {object} Object mapping other planets to 'F' (Friend) or 'E' (Enemy).
 */
export function calculateTemporalFriendshipForPlanet(targetPlanet, siderealPositions) {
    const friendships = {};
    const targetData = siderealPositions[targetPlanet];
    if (!targetData || isNaN(targetData.longitude)) {
        logger.warn(`Cannot calculate temporal friendship for ${targetPlanet}: Position unavailable.`);
        return {};
    }

    const targetRashiIndex = getRashiDetails(targetData.longitude).index;
    if (targetRashiIndex === -1) {
         logger.warn(`Cannot calculate temporal friendship for ${targetPlanet}: Rashi unavailable.`);
         return {};
    }

    // Houses relative to the target planet's Rashi (2nd, 3rd, 4th, 10th, 11th, 12th are friends)
    const friendRelativeHouses = [2, 3, 4, 10, 11, 12];

    for (const otherPlanet of FRIENDSHIP_PLANETS_ORDER) {
        if (targetPlanet === otherPlanet) continue;

        const otherData = siderealPositions[otherPlanet];
        if (!otherData || isNaN(otherData.longitude)) continue; // Skip if position missing

        const otherRashiIndex = getRashiDetails(otherData.longitude).index;
        if (otherRashiIndex === -1) continue;

        // Calculate house distance by Rashi count
        const rashiDiff = (otherRashiIndex - targetRashiIndex + 12) % 12;
        const relativeHouse = rashiDiff + 1;

        friendships[otherPlanet] = friendRelativeHouses.includes(relativeHouse) ? 'F' : 'E';
    }
    return friendships;
}

/**
 * Determines the resulting friendship (5-fold) based on natural and temporal status.
 * @param {string} naturalStatus - 'F', 'E', 'N'.
 * @param {string} temporalStatus - 'F', 'E'.
 * @returns {string} 'Best Friend', 'Friend', 'Neutral', 'Enemy', 'Bitter Enemy', or 'N/A'.
 */
export function getResultingFriendship(naturalStatus, temporalStatus) {
    if (naturalStatus === 'F' && temporalStatus === 'F') return 'Best Friend';
    if (naturalStatus === 'E' && temporalStatus === 'E') return 'Bitter Enemy';
    if (naturalStatus === 'N' && temporalStatus === 'F') return 'Friend';
    if (naturalStatus === 'F' && temporalStatus === 'E') return 'Neutral';
    if (naturalStatus === 'N' && temporalStatus === 'E') return 'Enemy';
    if (naturalStatus === 'E' && temporalStatus === 'F') return 'Neutral';
    return 'N/A'; // Should not happen with valid inputs
}


// --- Shadbala (Simplified Placeholders) ---

/**
 * Calculates Sthana Bala (Positional Strength) - Simplified.
 * Includes Uccha Bala, Saptavargaja Bala (placeholder), Ojhajugma Bala, Kendradi Bala, Drekkana Bala.
 * @param {string} planetName
 * @param {object} planetData - Sidereal position data for the planet.
 * @returns {number} Sthana Bala score (arbitrary units for now).
 */
function calculateSthanaBala(planetName, planetData) {
    let bala = 0;
    // 1. Uccha Bala (Exaltation/Debilitation) - Needs precise exaltation points
    // Simplified: +60 if exalted, +0 if debilitated, proportional otherwise (placeholder)
    // TODO: Implement precise Uccha Bala calculation based on degrees from debilitation point.
    const state = calculatePlanetStates({ [planetName]: planetData })[planetName]; // Use helper
    if (state === 'Exalted') bala += 60;
    else if (state === 'Moolatrikona') bala += 45; // Assign points
    else if (state === 'Own Sign') bala += 30;
    // Add points for friendly signs based on resulting friendship?

    // 2. Saptavargaja Bala (Strength from 7 divisional charts) - Placeholder
    // Requires calculating D2, D3, D7, D9, D10, D12, D30 and checking dignity in each.
    bala += 10; // Placeholder value

    // 3. Ojhajugma Bala (Odd/Even Sign for Male/Female planets)
    const rashiIndex = getRashiDetails(planetData.longitude).index;
    const isOddSign = rashiIndex % 2 === 0; // Aries is 0 (odd), Taurus is 1 (even)
    const malePlanets = ["Sun", "Mars", "Jupiter"];
    const femalePlanets = ["Moon", "Venus"]; // Mercury/Saturn are neutral
    if (malePlanets.includes(planetName) && isOddSign) bala += 15;
    if (femalePlanets.includes(planetName) && !isOddSign) bala += 15;

    // 4. Kendradi Bala (Angular/Succedent/Cadent House) - Needs house calculation
    // Requires siderealCuspStartDegrees
    // const house = getHouseOfPlanet(planetData.longitude, siderealCuspStartDegrees);
    // if ([1, 4, 7, 10].includes(house)) bala += 60; // Kendra
    // else if ([2, 5, 8, 11].includes(house)) bala += 30; // Panaphara
    // else if ([3, 6, 9, 12].includes(house)) bala += 15; // Apoklima
    bala += 15; // Placeholder value

    // 5. Drekkana Bala (Placement in Drekkana for Male/Female/Neutral) - Needs D3 calculation
    // Requires calculating D3 chart position.
    bala += 5; // Placeholder value

    return bala;
}

/**
 * Calculates Dig Bala (Directional Strength).
 * @param {string} planetName
 * @param {object} planetData
 * @param {number[]} siderealCuspStartDegrees - Needed to find house.
 * @returns {number} Dig Bala score.
 */
function calculateDigBala(planetName, planetData, siderealCuspStartDegrees) {
    // Requires house calculation
    const house = getHouseOfPlanet(planetData.longitude, siderealCuspStartDegrees);
    if (house === null) return 0;

    const strongDirections = {
        Jupiter: 1, Mercury: 1, // East - House 1
        Moon: 4, Venus: 4,     // North - House 4
        Saturn: 7,             // West - House 7
        Sun: 10, Mars: 10       // South - House 10
    };

    if (strongDirections[planetName] === house) {
        return 60; // Max points
    }
    // TODO: Implement proportional calculation based on distance from strongest/weakest point (Nadir).
    return 0; // Simplified: Max or zero
}

/**
 * Calculates Kala Bala (Temporal Strength) - Simplified.
 * Includes Nathonatha Bala, Paksha Bala, Tribhaga Bala, Varsha/Masa/Dina Bala, Hora Bala, Ayana Bala.
 * @param {string} planetName
 * @param {object} planetData
 * @param {object} sunMoonTimes - Result from calculateSunMoonTimes.
 * @param {Date} utcDate - UTC date object for the chart.
 * @returns {number} Kala Bala score.
 */
function calculateKalaBala(planetName, planetData, sunMoonTimes, utcDate) {
    let bala = 0;
    // 1. Nathonatha Bala (Day/Night Strength)
    // Benefics strong at night, Malefics strong during day? Moon, Saturn, Mars strong at night? Sun, Jup, Ven strong day? Merc always strong? Rules vary.
    bala += 10; // Placeholder

    // 2. Paksha Bala (Lunar Phase Strength) - Benefics gain in Shukla Paksha, Malefics in Krishna Paksha
    // Requires calculating Moon phase (distance from Sun)
    bala += 10; // Placeholder

    // 3. Tribhaga Bala (Strength based on time third of Day/Night)
    bala += 5; // Placeholder

    // 4. Varsha/Masa/Dina Bala (Lord of Year/Month/Day) - Needs external input or complex calculation
    bala += 5; // Placeholder

    // 5. Hora Bala (Lord of the Hour) - Needs Hora calculation
    bala += 5; // Placeholder

    // 6. Ayana Bala (Strength based on Declination) - Needs declination calculation
    // Requires swisseph.swe_calc_ut with SEFLG_EQUATORIAL flag
    bala += 10; // Placeholder

    return bala;
}

/**
 * Calculates Chesta Bala (Motional Strength) - Simplified.
 * Based on planetary speed, especially retrograde motion.
 * @param {string} planetName
 * @param {object} planetData - Must include speedLongitude.
 * @returns {number} Chesta Bala score.
 */
function calculateChestaBala(planetName, planetData) {
    // Sun/Moon don't get Chesta Bala based on retrogradation
    if (planetName === "Sun" || planetName === "Moon") return 30; // Average value?

    const speed = planetData.speedLongitude;
    if (isNaN(speed)) return 0;

    // Simplified: Max points if retrograde, proportional otherwise.
    // TODO: Implement proper calculation based on average speed and current speed.
    if (speed < 0) { // Retrograde
        return 60; // Max points
    } else {
        return 15; // Placeholder for direct motion
    }
}

/**
 * Calculates Naisargika Bala (Natural Strength). Fixed values.
 * @param {string} planetName
 * @returns {number} Naisargika Bala score.
 */
function calculateNaisargikaBala(planetName) {
    const naturalStrengthOrder = ["Saturn", "Mars", "Mercury", "Jupiter", "Venus", "Moon", "Sun"];
    const strengthValue = (naturalStrengthOrder.indexOf(planetName) + 1) * (60 / 7);
    return isNaN(strengthValue) ? 0 : strengthValue;
}

/**
 * Calculates Drik Bala (Aspectual Strength) - Simplified.
 * Strength gained/lost from aspects received.
 * @param {string} planetName
 * @param {object} aspectData - Result from calculateAspects.
 * @param {object} siderealPositions - Needed to check aspecting planet nature (benefic/malefic).
 * @returns {number} Drik Bala score.
 */
function calculateDrikBala(planetName, aspectData, siderealPositions) {
    // Simplified: +15 for benefic aspect, -30 for malefic aspect. Max/min apply.
    // TODO: Implement calculation based on aspect angle deviation from exact.
    let bala = 0;
    const benefics = ["Jupiter", "Venus", "Moon", "Mercury"]; // Moon/Mercury depend on context
    const malefics = ["Saturn", "Mars", "Sun", "Rahu", "Ketu"];

    const aspectingPlanets = aspectData[planetName] || [];

    for (const aspecterName of aspectingPlanets) {
        // Check nature of aspecting planet (needs refinement for Moon/Mercury)
        if (benefics.includes(aspecterName)) {
            bala += 15;
        } else if (malefics.includes(aspecterName)) {
            bala -= 30;
        }
    }
    // Apply caps? Total Drik Bala is often between -60 and +60.
    return Math.max(-60, Math.min(60, bala));
}

/**
 * Calculates total Shadbala for all planets.
 * NOTE: Uses simplified component calculations.
 * @param {object} siderealPositions - Sidereal positions object.
 * @param {object[]} housesData - Array of house data objects (needed for Dig Bala).
 * @param {object} aspectData - Result from calculateAspects (needed for Drik Bala).
 * @param {object} sunMoonTimes - Result from calculateSunMoonTimes (needed for Kala Bala).
 * @param {Date} utcDate - UTC date object (needed for Kala Bala).
 * @returns {object} Object containing total Shadbala and component balas for each planet.
 */
export function calculateShadbala(siderealPositions, housesData, aspectData, sunMoonTimes, utcDate) {
    const shadbalaResults = {};
    const requiredUnits = 60 * 6; // Total required Rupas (units) for Shadbala = 360

    // Need cusp degrees for Dig Bala calculation
    const siderealCuspStartDegrees = housesData.map(h => convertDMSToDegrees(h.start_dms));
     if (siderealCuspStartDegrees.some(isNaN) || siderealCuspStartDegrees.length !== 12) {
         logger.error("Cannot calculate Shadbala: Invalid house cusp data derived from housesData.");
         // Return empty object or throw?
         return {};
     }


    for (const planetName of FRIENDSHIP_PLANETS_ORDER) { // Calculate for 7 main planets
        const planetData = siderealPositions[planetName];
        if (!planetData || isNaN(planetData.longitude)) {
            shadbalaResults[planetName] = { total: 0, required: 0, percentage: 0, components: {} };
            continue;
        }

        const components = {};
        components.sthana = calculateSthanaBala(planetName, planetData);
        components.dig = calculateDigBala(planetName, planetData, siderealCuspStartDegrees);
        components.kala = calculateKalaBala(planetName, planetData, sunMoonTimes, utcDate);
        components.chesta = calculateChestaBala(planetName, planetData);
        components.naisargika = calculateNaisargikaBala(planetName);
        components.drik = calculateDrikBala(planetName, aspectData, siderealPositions);

        const totalBala = Object.values(components).reduce((sum, val) => sum + val, 0);
        const requiredBala = 60; // Required strength per planet (example value)
        const percentage = (totalBala / requiredBala) * 100;

        shadbalaResults[planetName] = {
            total: totalBala.toFixed(2),
            required: requiredBala,
            percentage: percentage.toFixed(2),
            components: components
        };
    }

    // Add total required and achieved for all planets?
    // const totalAchieved = Object.values(shadbalaResults).reduce((sum, p) => sum + parseFloat(p.total || 0), 0);
    // shadbalaResults.Overall = { total: totalAchieved, required: requiredUnits };

  
    return shadbalaResults;
}


// --- Ashtakavarga ---

/**
 * Calculates Bhinna Ashtakavarga for a single planet.
 * Determines auspicious points contributed by planets based on their positions relative to the target planet and Ascendant.
 * @param {string} targetPlanetName - The planet whose BAV is being calculated (Sun, Moon, ..., Saturn, Ascendant).
 * @param {object} siderealPositions - Object containing sidereal positions.
 * @param {number} siderealAscendantDeg - Sidereal longitude of the Ascendant.
 * @returns {object} Object with { scores: number[12], total: number } for the target planet. scores array is 0-indexed for Aries-Pisces.
 */
export function calculateBhinnaAshtakavarga(targetPlanetName, siderealPositions, siderealAscendantDeg) {
    const scores = Array(12).fill(0);
    let totalScore = 0;

    // Define the contribution rules (which houses relative to each contributor are auspicious)
    // Based on standard BPHS rules. Total should be 337.
    const contributionRules = {
        Sun: { // BAV of Sun (Total 48)
            Sun: [1, 2, 4, 7, 8, 9, 10, 11], Moon: [3, 6, 10, 11], Mars: [1, 2, 4, 7, 8, 9, 10, 11],
            Mercury: [3, 5, 6, 9, 10, 11, 12], Jupiter: [5, 6, 9, 11], Venus: [6, 7, 12],
            Saturn: [1, 2, 4, 7, 8, 9, 10, 11], Ascendant: [3, 4, 6, 10, 11, 12]
        },
        Moon: { // BAV of Moon (Total 49)
             Sun: [3, 6, 7, 8, 10, 11], Moon: [1, 3, 6, 7, 10, 11], Mars: [2, 3, 5, 6, 9, 10, 11],
             Mercury: [1, 3, 4, 5, 7, 8, 10, 11], Jupiter: [1, 4, 7, 8, 10, 11, 12], Venus: [3, 4, 5, 7, 9, 10, 11],
             Saturn: [3, 5, 6, 11], Ascendant: [3, 6, 10, 11]
        },
         Mars: { // BAV of Mars (Total 39) - CORRECTED
             Sun: [3, 5, 6, 10, 11], Moon: [3, 6, 11], Mars: [1, 2, 4, 7, 8, 10, 11],
             Mercury: [3, 5, 6, 11], Jupiter: [6, 10, 11, 12], Venus: [6, 8, 11, 12],
             Saturn: [1, 4, 7, 8, 9, 10, 11], Ascendant: [1, 3, 6, 10, 11]
         },
         Mercury: { // BAV of Mercury (Total 54) - CORRECTED
             Sun: [5, 6, 9, 11, 12], Moon: [2, 4, 6, 8, 10, 11], Mars: [1, 2, 4, 7, 8, 9, 10, 11],
             Mercury: [1, 3, 5, 6, 9, 10, 11, 12], Jupiter: [6, 8, 11, 12], Venus: [1, 2, 3, 4, 5, 8, 9, 11], // Removed 12 from Venus contribution
             Saturn: [1, 2, 4, 7, 8, 9, 10, 11], Ascendant: [1, 2, 4, 6, 8, 10, 11]
         },
         Jupiter: { // BAV of Jupiter (Total 56)
             Sun: [1, 2, 3, 4, 7, 8, 9, 10, 11], Moon: [2, 5, 7, 9, 11], Mars: [1, 2, 4, 7, 8, 10, 11],
             Mercury: [1, 2, 4, 5, 6, 9, 10, 11], Jupiter: [1, 2, 3, 4, 7, 8, 10, 11], Venus: [2, 5, 6, 9, 10, 11],
             Saturn: [3, 5, 6, 12], Ascendant: [1, 2, 4, 5, 6, 7, 9, 10, 11]
         },
         Venus: { // BAV of Venus (Total 52) - CORRECTED
             Sun: [8, 11, 12], Moon: [1, 2, 3, 4, 5, 8, 9, 11, 12], Mars: [3, 5, 6, 9, 11, 12],
             Mercury: [3, 5, 6, 9, 11], Jupiter: [5, 8, 9, 10, 11], Venus: [1, 2, 3, 4, 5, 8, 9, 10, 11],
             Saturn: [3, 4, 5, 8, 9, 10, 11], Ascendant: [1, 2, 3, 4, 5, 8, 9, 11]
         },
         Saturn: { // BAV of Saturn (Total 39) - CORRECTED
             Sun: [1, 2, 4, 7, 8, 10, 11], Moon: [3, 6, 11], Mars: [3, 5, 6, 10, 11, 12],
             Mercury: [6, 8, 9, 10, 11, 12], Jupiter: [5, 6, 11, 12], Venus: [6, 11, 12],
             Saturn: [3, 5, 6, 11], Ascendant: [1, 3, 4, 6, 10, 11]
         },
    };

    const rules = contributionRules[targetPlanetName];
    if (!rules) {
        // Ascendant doesn't have its own BAV in the same way planets do.
        if (targetPlanetName === 'Ascendant') {
             return { scores: scores, total: 0 };
        }
        // Use Error for consistency with throwing strategy
        throw new Error(`Ashtakavarga contribution rules not found for ${targetPlanetName}`);
    }

    // Iterate through each contributor (Sun to Saturn + Ascendant)
    for (const contributorName of ASHTAKAVARGA_PLANETS) {
        let contributorLon;
        if (contributorName === 'Ascendant') {
            contributorLon = siderealAscendantDeg;
        } else {
            const contributorData = siderealPositions[contributorName];
            if (!contributorData || isNaN(contributorData.longitude)) {
                logger.warn(`BAV for ${targetPlanetName}: Skipping contributor ${contributorName} - position unavailable.`);
                continue;
            }
            contributorLon = contributorData.longitude;
        }

        if (isNaN(contributorLon)) {
             logger.warn(`BAV for ${targetPlanetName}: Skipping contributor ${contributorName} - longitude is NaN.`);
             continue;
        }

        const contributorRashiIndex = Math.floor(normalizeAngle(contributorLon) / RASHI_SPAN);
        const auspiciousHouses = rules[contributorName]; // Get the houses this contributor makes auspicious

        if (!auspiciousHouses || auspiciousHouses.length === 0) {
            
            continue;
        }

        // For each auspicious house relative to the contributor, add a point to that Rashi
        for (const houseNum of auspiciousHouses) {
            if (houseNum < 1 || houseNum > 12) continue; // Skip invalid house numbers

            // Calculate the Rashi index corresponding to that house number relative to the contributor
            const targetRashiIndex = (contributorRashiIndex + houseNum - 1) % 12;
            scores[targetRashiIndex]++;
            totalScore++;
        }
    }

    // Verify total score for the planet (optional sanity check)
    const expectedTotals = { Sun: 48, Moon: 49, Mars: 39, Mercury: 54, Jupiter: 56, Venus: 52, Saturn: 39 };
    if (expectedTotals[targetPlanetName] && totalScore !== expectedTotals[targetPlanetName]) {
        logger.warn(`BAV calculation for ${targetPlanetName} resulted in ${totalScore} points, expected ${expectedTotals[targetPlanetName]}.`);
    }


    return { scores: scores, total: totalScore };
}

/**
 * Calculates Sarva Ashtakavarga (SAV) by summing up Bhinna Ashtakavarga scores.
 * @param {object} bhinnaAshtakavargaData - Object containing BAV results for each planet.
 * Example: { Sun: { scores: [...], total: N }, Moon: { scores: [...], total: M }, ... }
 * @returns {object} Object with { scores: number[12], total: number }. scores array is 0-indexed for Aries-Pisces.
 */
export function calculateSarvaAshtakavarga(bhinnaAshtakavargaData) {
    const savScores = Array(12).fill(0);
    let totalSavScore = 0;

    // Sum scores for Sun to Saturn (Ascendant BAV is not summed here)
    const planetsToSum = ["Sun", "Moon", "Mars", "Mercury", "Jupiter", "Venus", "Saturn"];

    for (const planetName of planetsToSum) {
        const bavData = bhinnaAshtakavargaData[planetName];
        if (bavData && Array.isArray(bavData.scores) && bavData.scores.length === 12) {
            for (let i = 0; i < 12; i++) {
                savScores[i] += bavData.scores[i] || 0; // Add score for each Rashi
            }
            // Sum the total reported by the BAV calculation for accuracy check
            totalSavScore += bavData.total || 0;
        } else {
            logger.warn(`Cannot calculate SAV: Bhinna Ashtakavarga data missing or invalid for ${planetName}.`);
            // Decide how to handle missing data - skip planet or throw error? Skipping for now.
        }
    }

     // Optional: Add Ascendant's contribution if calculated separately? Standard SAV usually sums the 7 planets.
     // Some systems calculate an "Ascendant BAV" based on benefic points *it receives*, which could be added here.
     // For now, standard sum of 7 planets.

    // Total SAV score should theoretically be 337 if all rules are standard.
    const expectedTotalSav = 337;
    if (totalSavScore !== expectedTotalSav) {
         // This warning should now only trigger if the BAV totals themselves were wrong or summing failed
         logger.warn(`Calculated total SAV score is ${totalSavScore}, expected ${expectedTotalSav}. Check BAV rules/calculations.`);
    } else {
         
    }


    return { scores: savScores, total: totalSavScore };
}
