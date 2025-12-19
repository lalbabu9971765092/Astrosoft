// utils/strengthUtils.js
import { FRIENDSHIP_PLANETS_ORDER, PLANETARY_RELATIONS, ASHTAKAVARGA_PLANETS, RASHI_LORDS, RASHI_SPAN, PLANET_EXALTATION_POINTS, PLANET_AVERAGE_SPEED, WEEKDAY_LORDS, SHADBALA_REQUIRED_RUPAS } from './constants.js';
import { normalizeAngle, convertDMSToDegrees } from './coreUtils.js';
import { getRashiDetails, getHouseOfPlanet, calculatePlanetStates } from './planetaryUtils.js';

// --- Uccha Bala Calculation ---
function calculateUcchaBala(planetName, planetLongitude) {
    const exaltationPoint = PLANET_EXALTATION_POINTS[planetName];
    if (exaltationPoint === undefined) {
        //logger.warn(`Exaltation point not defined for ${planetName}. Returning 0 Uccha Bala.`);
        return 0;
    }

    const debilitationPoint = normalizeAngle(exaltationPoint + 180); // Debilitation point is 180 deg from exaltation

    let distance = normalizeAngle(planetLongitude - debilitationPoint);

    // Uccha Bala ranges from 0 (at debilitation) to 60 (at exaltation)
    // Scale distance (0-360) to Uccha Bala (0-60)
    // If distance is 0, planet is at debilitation (0 bala)
    // If distance is 180, planet is at exaltation (60 bala)
    // So, bala = distance / 3
    let ucchaBala = distance / 3;

    // Ensure bala is within 0-60 range
    ucchaBala = Math.max(0, Math.min(60, ucchaBala));

    return ucchaBala;
}

// --- Saptavargaja Bala Calculation ---
const DIGNITY_SCORES = {
    Moolatrikona: 45,
    'Own Sign': 30,
    'Best Friend': 22.5,
    Friend: 15,
    Neutral: 7.5,
    Enemy: 3.75,
    'Bitter Enemy': 1.875,
};

function getDignityScore(planetName, ruler, resultingFriendship) {
    const friendship = resultingFriendship[planetName]?.[ruler];
    return DIGNITY_SCORES[friendship] || 0;
}





function calculateSaptavargajaBala(planetName, divisionalPositions, resultingFriendship) {
    let saptavargajaBala = 0;
    const vargas = {
        'D1': 1.5, // Rasi
        'D2': 1,   // Hora
        'D3': 1,   // Drekkana
        'D9': 1.5, // Navamsa
        'D12': 0.5, // Dwadasamsa
        'D30': 1, // Trimsamsa
        'D7': 0.5, // Saptamsa - Not standard, but sometimes included
    };

    for (const varga in vargas) {
        const weight = vargas[varga];
        const divisionalPlanet = divisionalPositions[varga]?.[planetName];
        
        if (divisionalPlanet && divisionalPlanet.longitude) {
            const rashi = getRashiDetails(divisionalPlanet.longitude);
            const ruler = rashi.lord;
            const state = calculatePlanetStates({ [planetName]: divisionalPlanet })[planetName];

            let score = 0;
            if (state === 'Moolatrikona') {
                score = DIGNITY_SCORES.Moolatrikona;
            } else if (state === 'Own Sign') {
                score = DIGNITY_SCORES['Own Sign'];
            } else {
                score = getDignityScore(planetName, ruler, resultingFriendship);
            }
            saptavargajaBala += (score / 45) * weight * 15; // Normalize to 15 and apply weight
        }
    }

    return saptavargajaBala;
}

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

function calculateSthanaBala(planetName, planetData, divisionalPositions, resultingFriendship, siderealCuspStartDegrees) {
    let bala = 0;
    // 1. Uccha Bala (Exaltation/Debilitation)
    bala += calculateUcchaBala(planetName, planetData.longitude);

    // 2. Saptavargaja Bala (Strength from 7 divisional charts)
    bala += calculateSaptavargajaBala(planetName, divisionalPositions, resultingFriendship);

    // 3. Ojhajugma Bala (Odd/Even Sign for Male/Female planets)
    const rashiIndex = getRashiDetails(planetData.longitude).index;
    const isOddSign = rashiIndex % 2 === 0; // Aries is 0 (odd), Taurus is 1 (even)
    const malePlanets = ["Sun", "Mars", "Jupiter"];
    const femalePlanets = ["Moon", "Venus"]; // Mercury/Saturn are neutral
    if (malePlanets.includes(planetName) && isOddSign) bala += 15;
    if (femalePlanets.includes(planetName) && !isOddSign) bala += 15;

    // 4. Kendradi Bala (Angular/Succedent/Cadent House)
    const house = getHouseOfPlanet(planetData.longitude, siderealCuspStartDegrees);
    if ([1, 4, 7, 10].includes(house)) bala += 60; // Kendra
    else if ([2, 5, 8, 11].includes(house)) bala += 30; // Panaphara
    else if ([3, 6, 9, 12].includes(house)) bala += 15; // Apoklima
    
    // 5. Drekkana Bala (Placement in Drekkana for Male/Female/Neutral)
    const longitudeInSign = planetData.longitude % 30;
    const malePlanetsForDrekkana = ["Sun", "Mars", "Jupiter"];
    const femalePlanetsForDrekkana = ["Moon", "Venus"];
    const neuterPlanetsForDrekkana = ["Mercury", "Saturn"];

    if (malePlanetsForDrekkana.includes(planetName) && longitudeInSign >= 0 && longitudeInSign < 10) {
        bala += 15;
    } else if (neuterPlanetsForDrekkana.includes(planetName) && longitudeInSign >= 10 && longitudeInSign < 20) {
        bala += 15;
    } else if (femalePlanetsForDrekkana.includes(planetName) && longitudeInSign >= 20 && longitudeInSign < 30) {
        bala += 15;
    }

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
    if (!siderealCuspStartDegrees || siderealCuspStartDegrees.length !== 12) return 0;

    let strongPointCuspLong;
    const planetLong = planetData.longitude;

    // Define the directional strength points (cusps of the angular houses)
    if (planetName === 'Jupiter' || planetName === 'Mercury') { // East (1st house cusp)
        strongPointCuspLong = siderealCuspStartDegrees[0]; // Ascendant
    } else if (planetName === 'Moon' || planetName === 'Venus') { // North (4th house cusp)
        strongPointCuspLong = siderealCuspStartDegrees[3]; // IC
    } else if (planetName === 'Saturn') { // West (7th house cusp)
        strongPointCuspLong = siderealCuspStartDegrees[6]; // Descendant
    } else if (planetName === 'Sun' || planetName === 'Mars') { // South (10th house cusp)
        strongPointCuspLong = siderealCuspStartDegrees[9]; // MC
    } else {
        return 0; // Outer planets, Rahu, Ketu don't have standard Dig Bala calculation
    }

    // Calculate angular distance to the strong directional point
    let diff = Math.abs(planetLong - strongPointCuspLong);
    let angularDistance = Math.min(diff, 360 - diff); // Take the shorter arc (0 to 180 degrees)

    // Dig Bala is 60 when angularDistance is 0, and 0 when angularDistance is 180.
    // It decreases linearly.
    let digBala = 60 - (angularDistance * (60 / 180));
    digBala = Math.max(0, Math.min(60, digBala)); // Ensure bounds [0, 60]

    return digBala;
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
function calculateKalaBala(planetName, planetData, sunMoonTimes, utcDate, sunLongitude, moonLongitude) {
    let bala = 0;
    // 1. Nathonatha Bala (Day/Night Strength)
    const sunrise = sunMoonTimes.sunrise ? new Date(sunMoonTimes.sunrise) : null;
    const sunset = sunMoonTimes.sunset ? new Date(sunMoonTimes.sunset) : null;
    const birthTime = utcDate;

    let isDayTime = false;
    if (sunrise && sunset) {
        if (birthTime >= sunrise && birthTime <= sunset) {
            isDayTime = true;
        }
    } else {
        const hour = birthTime.getUTCHours();
        if (hour >= 6 && hour < 18) {
            isDayTime = true;
        }
    }

    const dayStrongPlanets = ["Sun", "Jupiter", "Venus"];
    const nightStrongPlanets = ["Moon", "Saturn", "Mars"];
    const alwaysStrongPlanets = ["Mercury"]; // Strong both day and night

    if (alwaysStrongPlanets.includes(planetName)) {
        bala += 60; // Max points
    } else if (isDayTime && dayStrongPlanets.includes(planetName)) {
        bala += 60;
    } else if (!isDayTime && nightStrongPlanets.includes(planetName)) {
        bala += 60;
    } else {
        bala += 0; // Weak
    }
    
    // 2. Paksha Bala (Lunar Phase Strength)
    const lunarPhase = normalizeAngle(moonLongitude - sunLongitude);
    const benefics = ['Jupiter', 'Venus', 'Mercury', 'Moon'];
    const malefics = ['Sun', 'Mars', 'Saturn'];

    if (benefics.includes(planetName)) {
        bala += lunarPhase / 3;
    } else if (malefics.includes(planetName)) {
        bala += (180 - lunarPhase) / 3;
    }

    // 3. Tribhaga Bala (Strength based on time third of Day/Night)
    let tribhagaBala = 0;
    if (planetName === "Mercury") {
        tribhagaBala = 60;
    } else if (sunrise && sunset && birthTime) {
        const dayDuration = sunset.getTime() - sunrise.getTime();
        const dayPartDuration = dayDuration / 3;

        if (isDayTime) {
            const timeSinceSunrise = birthTime.getTime() - sunrise.getTime();
            if (timeSinceSunrise < dayPartDuration) {
                if (planetName === 'Jupiter') tribhagaBala = 60;
            } else if (timeSinceSunrise < 2 * dayPartDuration) {
                if (planetName === 'Sun') tribhagaBala = 60;
            } else {
                if (planetName === 'Saturn') tribhagaBala = 60;
            }
        } else { // Night Time
            const nightDuration = (24 * 3600 * 1000) - dayDuration; // Approximation
            const nightPartDuration = nightDuration / 3;
            let timeSinceSunset;

            if (birthTime.getTime() > sunset.getTime()) {
                timeSinceSunset = birthTime.getTime() - sunset.getTime();
            } else {
                const previousSunset = new Date(sunset.getTime() - 24 * 3600 * 1000);
                timeSinceSunset = birthTime.getTime() - previousSunset.getTime();
            }
            
            if (timeSinceSunset < nightPartDuration) {
                if (planetName === 'Moon') tribhagaBala = 60;
            } else if (timeSinceSunset < 2 * nightPartDuration) {
                if (planetName === 'Venus') tribhagaBala = 60;
            } else {
                if (planetName === 'Mars') tribhagaBala = 60;
            }
        }
    }
    bala += tribhagaBala;

    // 4. Varsha/Masa/Dina Bala (Lord of Year/Month/Day)
    const dayOfWeek = utcDate.getUTCDay(); // 0 = Sunday, 6 = Saturday
    const dayLord = WEEKDAY_LORDS[dayOfWeek];
    if (planetName === dayLord) {
        bala += 15;
    }
    
    const sunRashi = getRashiDetails(sunLongitude);
    const monthLord = sunRashi.lord;
    if (planetName === monthLord) {
        bala += 30;
    }

    // Varsha Bala (Lord of the Year)
    const yearStart = new Date(utcDate.getUTCFullYear(), 0, 1);
    const yearStartDay = yearStart.getUTCDay();
    const yearLord = WEEKDAY_LORDS[yearStartDay];
    if (planetName === yearLord) {
        bala += 15;
    }

    // 5. Hora Bala (Lord of the Hour)
    if (sunrise) {
        const birthTimeSinceSunrise = (birthTime.getTime() - sunrise.getTime()) / 1000 / 3600; // in hours
        const horaIndex = Math.floor(birthTimeSinceSunrise) % 24;
        const dayLordIndex = utcDate.getUTCDay();
        const horaLordIndex = (dayLordIndex + horaIndex) % 7;
        const horaLord = WEEKDAY_LORDS[horaLordIndex];
        if (planetName === horaLord) {
            bala += 60;
        }
    } else {
        bala += 5; // Placeholder if sunrise is not available
    }

    // 6. Ayana Bala (Strength based on Declination)
    const declination = planetData.declination;
    if (declination !== undefined) {
        let ayanaBala = (60 * (23.45 + declination)) / 46.9;
        if (planetName === 'Sun' || planetName === 'Mars' || planetName === 'Jupiter' || planetName === 'Venus') {
            // No change for northern declination
        } else if (planetName === 'Moon' || planetName === 'Saturn') {
            ayanaBala = 60 - ayanaBala;
        } else { // Mercury
            ayanaBala = 30;
        }
        bala += ayanaBala;
    }

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
    if (planetName === "Sun" || planetName === "Moon") return 30; // They have fixed Chesta Bala of 30 Rupas

    const speed = planetData.speedLongitude; // degrees per day
    if (isNaN(speed) || speed === 0) return 0; // No speed, no motional strength

    const averageSpeed = PLANET_AVERAGE_SPEED[planetName];
    if (averageSpeed === undefined) return 0; // No average speed defined

    let chestaBala = 0;
    if (speed < 0) { // Retrograde motion
        // For retrograde planets, Chesta Bala is often considered to be full (60 Rupas)
        // or a fixed high value, as retrograde motion is a specific state.
        chestaBala = 60; 
    } else { // Direct motion
        // Chesta Bala is proportional to the speed in direct motion.
        // It's 60 when moving at maximum speed and 0 when stationary or very slow.
        // Simplified: Scale current speed against average speed.
        chestaBala = 60 * (speed / averageSpeed);
        chestaBala = Math.min(60, chestaBala); // Cap at 60 Rupas
    }

    return chestaBala;
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
 * Calculates Drik Bala (Aspectual Strength) with precision.
 * Strength is gained from benefic aspects and lost from malefic aspects.
 * This calculation is based on the angular distance between planets and includes special aspects.
 * @param {string} planetName The planet for which to calculate Drik Bala.
 * @param {object} siderealPositions Sidereal positions object.
 * @param {number} sunLongitude Longitude of the Sun for determining Moon/Mercury nature.
 * @param {number} moonLongitude Longitude of the Moon for determining its own nature.
 * @returns {number} Drik Bala score in Rupas.
 */
function calculateDrikBala(planetName, siderealPositions, sunLongitude, moonLongitude) {
    const aspectedPlanetLon = siderealPositions[planetName]?.longitude;
    if (aspectedPlanetLon === undefined) return 0;

    let totalDrikBala = 0;

    const naturalBenefics = ['Jupiter', 'Venus'];
    const naturalMalefics = ['Sun', 'Mars', 'Saturn'];
    
    // Determine functional nature of Moon and Mercury for this specific chart
    const lunarPhase = normalizeAngle(moonLongitude - sunLongitude);
    const isWaningMoon = lunarPhase > 180;

    const mercuryLon = siderealPositions['Mercury']?.longitude;
    let isMercuryAssociatedWithMalefic = false;
    if (mercuryLon !== undefined) {
        const maleficCheckPlanets = [...naturalMalefics, ...(isWaningMoon ? ['Moon'] : [])];

        for (const maleficName of maleficCheckPlanets) {
            const maleficLon = siderealPositions[maleficName]?.longitude;
            if (maleficLon !== undefined) {
                const diff = Math.abs(normalizeAngle(mercuryLon - maleficLon));
                if (Math.min(diff, 360 - diff) <= 8) { // 8-degree orb for conjunction
                    isMercuryAssociatedWithMalefic = true;
                    break;
                }
            }
        }
    }
    
    const planetList = Object.keys(siderealPositions).filter(p => p !== 'Rahu' && p !== 'Ketu' && siderealPositions[p]?.longitude !== undefined);

    for (const aspecterName of planetList) {
        if (aspecterName === planetName) continue;

        const aspecterLon = siderealPositions[aspecterName].longitude;
        const angle = normalizeAngle(aspectedPlanetLon - aspecterLon);

        let aspectStrength = 0;

        // Base aspect values, overridden by special aspects
        const aspects = [
            { angle: 180, orb: 12, strength: 60 }, // Opposition
            { angle: 120, orb: 8, strength: 30 },  // Trine
            { angle: 240, orb: 8, strength: 30 },
            { angle: 90,  orb: 8, strength: 45 },  // Square
            { angle: 270, orb: 8, strength: 45 },
            { angle: 60,  orb: 8, strength: 15 },  // Sextile
            { angle: 300, orb: 8, strength: 15 },
            { angle: 210, orb: 8, strength: 45}   // Mars 8th house aspect base
        ];

        for (const aspect of aspects) {
            const deviation = Math.abs(angle - aspect.angle);
            if (deviation <= aspect.orb) {
                aspectStrength = Math.max(aspectStrength, aspect.strength * (1 - deviation / aspect.orb));
            }
        }

        // Special aspects (full strength = 60 Rupas), larger orb and higher priority
        const specialAspectOrb = 15;
        if (aspecterName === 'Mars') {
            if (Math.abs(angle - 90) <= specialAspectOrb) aspectStrength = Math.max(aspectStrength, 60 * (1 - Math.abs(angle - 90) / specialAspectOrb));
            if (Math.abs(angle - 210) <= specialAspectOrb) aspectStrength = Math.max(aspectStrength, 60 * (1 - Math.abs(angle - 210) / specialAspectOrb));
        } else if (aspecterName === 'Jupiter') {
            if (Math.abs(angle - 120) <= specialAspectOrb) aspectStrength = Math.max(aspectStrength, 60 * (1 - Math.abs(angle - 120) / specialAspectOrb));
            if (Math.abs(angle - 240) <= specialAspectOrb) aspectStrength = Math.max(aspectStrength, 60 * (1 - Math.abs(angle - 240) / specialAspectOrb));
        } else if (aspecterName === 'Saturn') {
            if (Math.abs(angle - 60) <= specialAspectOrb) aspectStrength = Math.max(aspectStrength, 60 * (1 - Math.abs(angle - 60) / specialAspectOrb));
            if (Math.abs(angle - 270) <= specialAspectOrb) aspectStrength = Math.max(aspectStrength, 60 * (1 - Math.abs(angle - 270) / specialAspectOrb));
        }

        // Determine if aspecter is benefic or malefic for this chart
        let isAspecterMalefic = naturalMalefics.includes(aspecterName) || (aspecterName === 'Moon' && isWaningMoon) || (aspecterName === 'Mercury' && isMercuryAssociatedWithMalefic);

        if (aspectStrength > 0) {
            totalDrikBala += isAspecterMalefic ? -aspectStrength : aspectStrength;
        }
    }

    return totalDrikBala;
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
export function calculateShadbala(siderealPositions, housesData, aspectData, sunMoonTimes, utcDate, divisionalPositions) {
    const shadbalaResults = {};
    const requiredUnits = 60 * 6; // Total required Rupas (units) for Shadbala = 360

    // Need cusp degrees for Dig Bala calculation
    const siderealCuspStartDegrees = housesData.map(h => convertDMSToDegrees(h.start_dms));
     if (siderealCuspStartDegrees.some(isNaN) || siderealCuspStartDegrees.length !== 12) {
         // Return empty object or throw?
         return {};
     }

    const temporalFriendshipData = {}; 
    const resultingFriendshipData = {};
    const naturalFriendshipMatrix = PLANETARY_RELATIONS; 
    const friendshipOrder = FRIENDSHIP_PLANETS_ORDER;
    for (const planet of friendshipOrder) {
        temporalFriendshipData[planet] = calculateTemporalFriendshipForPlanet(planet, siderealPositions);
        resultingFriendshipData[planet] = {}; 
        const naturalRow = naturalFriendshipMatrix[planet]; 
        const temporalRow = temporalFriendshipData[planet];
        for (const otherPlanet of friendshipOrder) {
            if (planet === otherPlanet) { 
                resultingFriendshipData[planet][otherPlanet] = '-'; 
                continue; 
            }
            let naturalStatus;
            if (naturalRow.friends.includes(otherPlanet)) {
                naturalStatus = 'F';
            } else if (naturalRow.enemies.includes(otherPlanet)) {
                naturalStatus = 'E';
            } else if (naturalRow.neutrals.includes(otherPlanet)) {
                naturalStatus = 'N';
            } else {
                naturalStatus = 'N/A';
            }
            const temporalStatus = temporalRow ? temporalRow[otherPlanet] : 'N/A';
            resultingFriendshipData[planet][otherPlanet] = getResultingFriendship(naturalStatus, temporalStatus);
        }
    }


    for (const planetName of FRIENDSHIP_PLANETS_ORDER) { // Calculate for 7 main planets
        const planetData = siderealPositions[planetName];
        if (!planetData || isNaN(planetData.longitude)) {
            shadbalaResults[planetName] = { total: 0, required: 0, percentage: 0, components: {} };
            continue;
        }

        const components = {};
        components.sthana = calculateSthanaBala(planetName, planetData, divisionalPositions, resultingFriendshipData, siderealCuspStartDegrees);
        components.dig = calculateDigBala(planetName, planetData, siderealCuspStartDegrees);
        components.kala = calculateKalaBala(planetName, planetData, sunMoonTimes, utcDate, siderealPositions.Sun.longitude, siderealPositions.Moon.longitude);
        components.chesta = calculateChestaBala(planetName, planetData);
        components.naisargika = calculateNaisargikaBala(planetName);
        components.drik = calculateDrikBala(planetName, siderealPositions, siderealPositions.Sun.longitude, siderealPositions.Moon.longitude);

        const totalBala = Object.values(components).reduce((sum, val) => sum + val, 0);
        const requiredBala = SHADBALA_REQUIRED_RUPAS[planetName] || 360; // Default to average if not found
        const percentage = (totalBala / requiredBala) * 100;

        shadbalaResults[planetName] = {
            total: totalBala.toFixed(2),
            required: requiredBala,
            percentage: percentage.toFixed(2),
            components: components
        };
    }
  
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
