// utils/planetaryUtils.js
import swisseph from 'swisseph-v2';
import logger from './logger.js';
import {
    NAKSHATRAS, NAKSHATRA_SPAN, RASHIS, RASHI_LORDS, RASHI_SPAN,
    PLANET_ORDER, SUBLORD_DATA, VIMS_DASHA_SEQUENCE, VIMS_DASHA_YEARS // Import Dasha constants
} from './constants.js';
import { normalizeAngle, convertToDMS, calculateAyanamsa } from './coreUtils.js';

/**
 * Gets the Nakshatra details (name, lord) for a given sidereal longitude.
 * @param {number} siderealLongitude - Sidereal longitude in decimal degrees.
 * @returns {{name: string, lord: string, index: number} | {name: string, lord: string, index: number}} Nakshatra details or error object.
 */
export function getNakshatraDetails(siderealLongitude) {
    const normalizedLng = normalizeAngle(siderealLongitude);
    if (isNaN(normalizedLng)) {
        return { name: "Invalid Longitude", lord: "N/A", index: -1 };
    }

    const nakshatraIndex = Math.floor(normalizedLng / NAKSHATRA_SPAN);

    if (nakshatraIndex >= 0 && nakshatraIndex < NAKSHATRAS.length) {
        const nak = NAKSHATRAS[nakshatraIndex];
        return { name: nak.name, lord: nak.lord, index: nakshatraIndex };
    } else {
        // This should ideally not happen if normalizeAngle works correctly
        logger.warn(`Could not determine Nakshatra for longitude: ${siderealLongitude} (Normalized: ${normalizedLng}, Index: ${nakshatraIndex})`);
        return { name: "Unknown", lord: "N/A", index: -1 };
    }
}

/**
 * Gets the Rashi details (name, lord, index) for a given sidereal longitude.
 * @param {number} siderealLongitude - Sidereal longitude in decimal degrees.
 * @returns {{name: string, lord: string, index: number} | {name: string, lord: string, index: number}} Rashi details or error object.
 */
export function getRashiDetails(siderealLongitude) {
    const normalizedLng = normalizeAngle(siderealLongitude);
    if (isNaN(normalizedLng)) {
        return { name: "Invalid Longitude", lord: "N/A", index: -1 };
    }

    const rashiIndex = Math.floor(normalizedLng / RASHI_SPAN);

    if (rashiIndex >= 0 && rashiIndex < RASHIS.length) {
        return { name: RASHIS[rashiIndex], lord: RASHI_LORDS[rashiIndex], index: rashiIndex };
    } else {
        logger.warn(`Could not determine Rashi for longitude: ${siderealLongitude} (Normalized: ${normalizedLng}, Index: ${rashiIndex})`);
        return { name: "Unknown", lord: "N/A", index: -1 };
    }
}

/**
 * Calculates the Nakshatra Pada (1, 2, 3, or 4) for a given sidereal longitude.
 * @param {number} siderealLongitude - Sidereal longitude in decimal degrees.
 * @returns {number | null} The pada number (1-4) or null if invalid input.
 */
export function calculateNakshatraPada(siderealLongitude) {
    const normalizedLng = normalizeAngle(siderealLongitude);
    if (isNaN(normalizedLng)) {
        return null;
    }
    const positionWithinNakshatra = normalizedLng % NAKSHATRA_SPAN;
    const padaSpan = NAKSHATRA_SPAN / 4; // Each pada is 3° 20'
    const pada = Math.floor(positionWithinNakshatra / padaSpan) + 1;

    // Ensure pada is between 1 and 4
    return Math.min(Math.max(pada, 1), 4);
}

/**
 * Calculates the Navamsa (D9) longitude for a given sidereal longitude.
 * @param {number} siderealLongitude - Sidereal longitude in decimal degrees.
 * @returns {number} The Navamsa longitude in decimal degrees [0, 360), or NaN if invalid input.
 */
export function calculateNavamsaLongitude(siderealLongitude) {
    const normalizedLng = normalizeAngle(siderealLongitude);
    if (isNaN(normalizedLng)) {
        return NaN;
    }

    // Find the Rashi index (0-11) and position within the Rashi (0-30)
    const rashiIndex = Math.floor(normalizedLng / RASHI_SPAN);
    const positionInRashi = normalizedLng % RASHI_SPAN;

    // Each Navamsa is 3° 20' (RASHI_SPAN / 9)
    const navamsaSpan = RASHI_SPAN / 9;
    const navamsaIndexInRashi = Math.floor(positionInRashi / navamsaSpan); // 0-8

    // Determine the starting Navamsa sign index based on the Rashi type
    let startingNavamsaSignIndex;
    if ([0, 4, 8].includes(rashiIndex)) { // Fiery signs (Aries, Leo, Sagittarius) start from Aries (0)
        startingNavamsaSignIndex = 0;
    } else if ([1, 5, 9].includes(rashiIndex)) { // Earthy signs (Taurus, Virgo, Capricorn) start from Capricorn (9)
        startingNavamsaSignIndex = 9;
    } else if ([2, 6, 10].includes(rashiIndex)) { // Airy signs (Gemini, Libra, Aquarius) start from Libra (6)
        startingNavamsaSignIndex = 6;
    } else { // Watery signs (Cancer, Scorpio, Pisces) start from Cancer (3)
        startingNavamsaSignIndex = 3;
    }

    // Calculate the Navamsa sign index
    const navamsaSignIndex = (startingNavamsaSignIndex + navamsaIndexInRashi) % 12;

    // Calculate the position within the Navamsa sign
    // The position within the 3°20' Navamsa segment maps directly to the 30° Rashi span
    const positionInNavamsaSegment = positionInRashi % navamsaSpan;
    const positionInNavamsaSign = (positionInNavamsaSegment / navamsaSpan) * RASHI_SPAN;

    // Calculate the final Navamsa longitude
    const navamsaLongitude = (navamsaSignIndex * RASHI_SPAN) + positionInNavamsaSign;

    return normalizeAngle(navamsaLongitude);
}


/**
 * Determines the Sub Lord (KP System) for a given sidereal longitude.
 * @param {number} siderealLongitude - Sidereal longitude in decimal degrees.
 * @returns {{lord: string, startDegInNak: number, endDegInNak: number} | {lord: string}} Sub Lord details including its span within the Nakshatra, or error object.
 */
export function getSubLordDetails(siderealLongitude) {
    const normalizedLng = normalizeAngle(siderealLongitude);
    if (isNaN(normalizedLng)) {
        return { lord: "Invalid Longitude" };
    }

    const nakDetails = getNakshatraDetails(normalizedLng);
    if (!nakDetails || nakDetails.index === -1) {
        return { lord: "Unknown Nakshatra" };
    }

    const nakshatraName = nakDetails.name;
    const nakshatraStart = nakDetails.index * NAKSHATRA_SPAN;
    const positionWithinNakshatra = normalizedLng - nakshatraStart;
    const epsilon = 1e-9; // Tolerance for floating point comparisons

    if (SUBLORD_DATA && SUBLORD_DATA[nakshatraName]) {
        let currentPos = 0;
        for (const sub of SUBLORD_DATA[nakshatraName]) {
            const subSpan = sub.span || 0;
            const subStart = currentPos;
            const subEnd = currentPos + subSpan;

            // Check if position falls within [start, end) using epsilon
            // Handle edge case where position is exactly at the end of the last sublord span
            if ((positionWithinNakshatra >= subStart - epsilon && positionWithinNakshatra < subEnd - epsilon) ||
                (Math.abs(positionWithinNakshatra - NAKSHATRA_SPAN) < epsilon && sub === SUBLORD_DATA[nakshatraName][SUBLORD_DATA[nakshatraName].length - 1]))
            {
                return {
                    lord: sub.lord,
                    startDegInNak: subStart,
                    endDegInNak: subEnd
                };
            }
            currentPos = subEnd;
        }
        // If loop finishes without finding (e.g., due to rounding or incomplete data)
        logger.warn(`Sublord not found within defined spans for ${nakshatraName} at ${positionWithinNakshatra.toFixed(4)} deg`);
        return { lord: "Error finding SubLord" };
    } else {
        logger.warn(`Sublord data missing or incomplete for Nakshatra: ${nakshatraName}`);
        return { lord: "N/A (Data Missing)" };
    }
}

/**
 * Determines the Sub-Sub Lord (Pratyantar Dasha Lord in KP) for a given position within a Nakshatra and its SubLord span.
 * @param {number} positionWithinNakshatra - The planet's degree position within the Nakshatra [0, NAKSHATRA_SPAN).
 * @param {object} subLordDetails - The object returned by getSubLordDetails { lord, startDegInNak, endDegInNak }.
 * @returns {{lord: string}} Sub-Sub Lord details or error object.
 */
function getSubSubLordDetails(positionWithinNakshatra, subLordDetails) {
    if (!subLordDetails || !subLordDetails.lord || subLordDetails.lord.startsWith("Error") || subLordDetails.lord.startsWith("N/A") || subLordDetails.lord.startsWith("Invalid") || subLordDetails.lord.startsWith("Unknown")) {
        // Cannot calculate SubSubLord if SubLord is invalid
        return { lord: "N/A" };
    }
    if (isNaN(positionWithinNakshatra) || isNaN(subLordDetails.startDegInNak) || isNaN(subLordDetails.endDegInNak)) {
        logger.warn(`Invalid input for getSubSubLordDetails: pos=${positionWithinNakshatra}, subLord=${JSON.stringify(subLordDetails)}`);
        return { lord: "N/A" };
    }

    const subLordSpan = subLordDetails.endDegInNak - subLordDetails.startDegInNak;
    if (subLordSpan <= 0) {
        logger.warn(`Invalid SubLord span calculated: ${subLordSpan}`);
        return { lord: "N/A" };
    }

    // Calculate the position *within* the SubLord's span
    const positionWithinSubLordSpan = positionWithinNakshatra - subLordDetails.startDegInNak;

    // Determine the starting lord for the SubSub sequence (starts with the SubLord itself)
    const subLordIndex = VIMS_DASHA_SEQUENCE.indexOf(subLordDetails.lord);
    if (subLordIndex === -1) {
        logger.warn(`SubLord "${subLordDetails.lord}" not found in Vimsottari sequence.`);
        return { lord: "N/A" };
    }

    let cumulativeProportion = 0;
    const epsilon = 1e-9; // Tolerance

    // Iterate through the Vimshottari sequence starting from the SubLord
    for (let i = 0; i < VIMS_DASHA_SEQUENCE.length; i++) {
        const currentSubSubIndex = (subLordIndex + i) % VIMS_DASHA_SEQUENCE.length;
        const subSubLordName = VIMS_DASHA_SEQUENCE[currentSubSubIndex];
        const subSubLordYears = VIMS_DASHA_YEARS[subSubLordName];

        if (!subSubLordYears) {
            logger.warn(`Years not defined for potential SubSubLord: ${subSubLordName}`);
            continue;
        }

        // Calculate the proportion of the SubLord's span this SubSubLord occupies
        const proportionOfSpan = subSubLordYears / 120; // Based on 120 year Vimshottari cycle
        const subSubLordSpanDegrees = proportionOfSpan * subLordSpan;

        const subSubStart = cumulativeProportion * subLordSpan;
        const subSubEnd = subSubStart + subSubLordSpanDegrees;

        // Check if the position falls within this SubSubLord's segment
        if ((positionWithinSubLordSpan >= subSubStart - epsilon && positionWithinSubLordSpan < subSubEnd - epsilon) ||
            (Math.abs(positionWithinSubLordSpan - subLordSpan) < epsilon && i === VIMS_DASHA_SEQUENCE.length - 1)) // Handle edge case at the very end
        {
            return { lord: subSubLordName };
        }

        cumulativeProportion += proportionOfSpan;
    }

    // Should not be reached if data and logic are correct
    logger.warn(`SubSubLord calculation failed unexpectedly for position ${positionWithinNakshatra} within SubLord ${subLordDetails.lord}`);
    return { lord: "Error" };
}


/**
 * Calculates sidereal and tropical positions for planets and Ascendant.
 * @param {number} julianDayUT - Julian Day in Universal Time.
 * @returns {object} Object containing tropical and sidereal positions, or null on error.
 * Example structure: { tropical: { Sun: { ... } }, sidereal: { Sun: { ..., subSubLord }, ... } }
 */
export function calculatePlanetaryPositions(julianDayUT) {
    if (typeof julianDayUT !== 'number' || isNaN(julianDayUT)) {
        throw new Error(`calculatePlanetaryPositions received invalid Julian Day: ${julianDayUT}`);
    }

    const planets = [
        swisseph.SE_SUN, swisseph.SE_MOON, swisseph.SE_MARS, swisseph.SE_MERCURY,
        swisseph.SE_JUPITER, swisseph.SE_VENUS, swisseph.SE_SATURN,
        swisseph.SE_TRUE_NODE // Rahu (True Node)
    ];
    const flags = swisseph.SEFLG_SPEED | swisseph.SEFLG_SIDEREAL; // Request speed and use sidereal mode set globally
    const tropicalFlags = swisseph.SEFLG_SPEED; // For tropical positions

    const results = { tropical: {}, sidereal: {} };

    try {
        const ayanamsa = calculateAyanamsa(julianDayUT);
        if (isNaN(ayanamsa)) {
             throw new Error(`Cannot calculate positions without a valid Ayanamsa for JD ${julianDayUT}`);
        }

        for (const planetId of planets) {
            const planetName = PLANET_ORDER[planets.indexOf(planetId)];

            const siderealCalc = swisseph.swe_calc_ut(julianDayUT, planetId, flags);
            const tropicalCalc = swisseph.swe_calc_ut(julianDayUT, planetId, tropicalFlags);

            if (!siderealCalc || typeof siderealCalc.longitude !== 'number' || !tropicalCalc || typeof tropicalCalc.longitude !== 'number') {
                logger.error(`Failed to calculate position for ${planetName} (ID: ${planetId}) at JD ${julianDayUT}. Sidereal: ${JSON.stringify(siderealCalc)}, Tropical: ${JSON.stringify(tropicalCalc)}`);
                continue;
            }

            // Store Tropical Data
            results.tropical[planetName] = {
                longitude: tropicalCalc.longitude,
                latitude: tropicalCalc.latitude,
                distance: tropicalCalc.distance,
                speedLongitude: tropicalCalc.longitudeSpeed,
                speedLatitude: tropicalCalc.latitudeSpeed,
                speedDistance: tropicalCalc.distanceSpeed,
            };

            // Store Sidereal Data and enrich it
            const siderealLongitude = normalizeAngle(siderealCalc.longitude);
            const nakDetails = getNakshatraDetails(siderealLongitude);
            const rashiDetails = getRashiDetails(siderealLongitude);
            const pada = calculateNakshatraPada(siderealLongitude);
            const subLordDetails = getSubLordDetails(siderealLongitude); // Get SubLord details {lord, startDegInNak, endDegInNak}

            // *** Calculate SubSubLord ***
            const positionWithinNakshatra = siderealLongitude - (nakDetails.index * NAKSHATRA_SPAN);
            const subSubLordDetails = getSubSubLordDetails(positionWithinNakshatra, subLordDetails);
            // *** End SubSubLord Calculation ***

            results.sidereal[planetName] = {
                longitude: siderealLongitude,
                latitude: siderealCalc.latitude,
                distance: siderealCalc.distance,
                speedLongitude: siderealCalc.longitudeSpeed,
                speedLatitude: siderealCalc.latitudeSpeed,
                speedDistance: siderealCalc.distanceSpeed,
                dms: convertToDMS(siderealLongitude),
                rashi: rashiDetails.name,
                rashiLord: rashiDetails.lord,
                nakshatra: nakDetails.name,
                nakLord: nakDetails.lord,
                pada: pada,
                subLord: subLordDetails.lord,
                subSubLord: subSubLordDetails.lord, // Add the SubSubLord name
            };
        }

        // Calculate Ketu (Mean Node + 180 degrees)
        const rahuData = results.sidereal.Rahu;
        if (rahuData && typeof rahuData.longitude === 'number' && !isNaN(rahuData.longitude)) {
            const ketuLongitude = normalizeAngle(rahuData.longitude + 180);
            const ketuNakDetails = getNakshatraDetails(ketuLongitude);
            const ketuRashiDetails = getRashiDetails(ketuLongitude);
            const ketuPada = calculateNakshatraPada(ketuLongitude);
            const ketuSubLordDetails = getSubLordDetails(ketuLongitude);
            // *** Calculate Ketu's SubSubLord ***
            const ketuPositionWithinNak = ketuLongitude - (ketuNakDetails.index * NAKSHATRA_SPAN);
            const ketuSubSubLordDetails = getSubSubLordDetails(ketuPositionWithinNak, ketuSubLordDetails);
            // *** End Ketu SubSubLord Calculation ***

            const tropicalRahuLon = results.tropical.Rahu?.longitude;
            const tropicalKetuLon = (tropicalRahuLon !== undefined && !isNaN(tropicalRahuLon))
                                    ? normalizeAngle(tropicalRahuLon + 180)
                                    : NaN;

            results.sidereal.Ketu = {
                longitude: ketuLongitude,
                latitude: -rahuData.latitude,
                distance: rahuData.distance,
                speedLongitude: rahuData.speedLongitude,
                speedLatitude: -rahuData.speedLatitude,
                speedDistance: rahuData.speedDistance,
                dms: convertToDMS(ketuLongitude),
                rashi: ketuRashiDetails.name,
                rashiLord: ketuRashiDetails.lord,
                nakshatra: ketuNakDetails.name,
                nakLord: ketuNakDetails.lord,
                pada: ketuPada,
                subLord: ketuSubLordDetails.lord,
                subSubLord: ketuSubSubLordDetails.lord, // Add Ketu's SubSubLord
            };
            results.tropical.Ketu = {
                 longitude: tropicalKetuLon,
                 latitude: -results.tropical.Rahu?.latitude,
                 distance: results.tropical.Rahu?.distance,
                 speedLongitude: results.tropical.Rahu?.speedLongitude,
                 speedLatitude: -results.tropical.Rahu?.speedLatitude,
                 speedDistance: results.tropical.Rahu?.speedDistance,
            };
        } else {
            logger.warn(`Rahu data missing or invalid, cannot calculate Ketu for JD ${julianDayUT}`);
            results.sidereal.Ketu = { longitude: NaN, dms: "N/A", rashi: "N/A", nakshatra: "N/A", subLord: "N/A", subSubLord: "N/A" };
            results.tropical.Ketu = { longitude: NaN };
        }

        return results;

    } catch (error) {
        logger.error(`Error in calculatePlanetaryPositions for JD ${julianDayUT}: ${error.message}`, { stack: error.stack });
        throw new Error(`Failed to calculate planetary positions: ${error.message}`);
    }
}

/**
 * Calculates house cusps (Placidus system) and Ascendant degree.
 * @param {number} julianDayUT - Julian Day in Universal Time.
 * @param {number} latitude - Observer's latitude in decimal degrees.
 * @param {number} longitude - Observer's longitude in decimal degrees.
 * @returns {{tropicalAscendant: number, tropicalCusps: number[]} | {tropicalAscendant: number, tropicalCusps: null}} Tropical Ascendant and 12 tropical cusp degrees, or null cusps on error.
 */
export function calculateHousesAndAscendant(julianDayUT, latitude, longitude) {
    if (isNaN(julianDayUT) || isNaN(latitude) || isNaN(longitude)) {
         throw new Error(`Invalid input for calculateHousesAndAscendant: JD=${julianDayUT}, Lat=${latitude}, Lon=${longitude}`);
    }
    try {
        const placidusFlag = swisseph.SE_HSYS_PLACIDUS || 'P';
        const houseResult = swisseph.swe_houses(julianDayUT, latitude, longitude, placidusFlag);

        // --- REVISED CHECK (Accepting length 12 for 'house') ---
        let isValidResult = houseResult &&
                            !houseResult.error &&
                            typeof houseResult.ascendant === 'number' &&
                            !isNaN(houseResult.ascendant) &&
                            Array.isArray(houseResult.house) &&
                            houseResult.house.length === 12; // Expect exactly 12 cusps

        if (!isValidResult) {
            // Log the reason for failure more clearly
            let failureReason = "Unknown reason";
            if (!houseResult) failureReason = "No result object returned.";
            else if (houseResult.error) failureReason = `Explicit error: ${houseResult.error}`;
            else if (typeof houseResult.ascendant !== 'number' || isNaN(houseResult.ascendant)) failureReason = `Invalid ascendant: ${houseResult.ascendant}`;
            else if (!Array.isArray(houseResult.house)) failureReason = `'house' is not an array: ${typeof houseResult.house}`;
            else if (houseResult.house.length !== 12) failureReason = `'house' array length is not 12: length ${houseResult.house.length}`; // Updated log message

            logger.error(`swisseph.swe_houses returned invalid result. Reason: ${failureReason}. Full result: ${JSON.stringify(houseResult)}`, {
                 jd: julianDayUT, lat: latitude, lon: longitude
            });

            // --- Fallback Logic ---
            const ascFallback = swisseph.swe_calc_ut(julianDayUT, swisseph.SE_ASC, 0);
            if (ascFallback && typeof ascFallback.longitude === 'number' && !isNaN(ascFallback.longitude)) {
                 logger.warn("swe_houses failed, using fallback Ascendant calculation. Cusps will be unavailable.");
                 return { tropicalAscendant: normalizeAngle(ascFallback.longitude), tropicalCusps: null };
            } else {
                 logger.error("swe_houses failed AND fallback Ascendant calculation failed.");
                 throw new Error("Failed to calculate valid house cusps and Ascendant.");
            }
            // --- End Fallback Logic ---
        }
        // --- END REVISED CHECK ---

        // If the check passed, process the valid result using houseResult.house
        // Assuming the 12 elements directly correspond to cusps 1-12
        const tropicalCusps = houseResult.house.map(c => normalizeAngle(c)); // Use the whole array
        const tropicalAscendant = normalizeAngle(houseResult.ascendant);

        // Final validation on processed values
        if (tropicalCusps.some(isNaN) || isNaN(tropicalAscendant)) {
             logger.error("Calculated cusps or ascendant contain NaN values after processing.", { rawCusps: houseResult.house, rawAsc: houseResult.ascendant }); // Log raw values
             throw new Error("Calculated cusps or ascendant contain NaN values after processing.");
        }

        // logger.debug("Successfully calculated houses and ascendant using swe_houses.");
        return { tropicalAscendant, tropicalCusps };

    } catch (error) {
        logger.error(`Error during calculateHousesAndAscendant execution: ${error.message}`, { stack: error.stack });
        throw new Error(`Failed to calculate houses/ascendant: ${error.message}`);
    }
}


/**
 * Calculates aspects between planets.
 * NOTE: This is a simplified version considering major aspects (Conjunction, Opposition, Square, Trine).
 * A full implementation would include orbs and potentially minor aspects.
 * @param {object} siderealPositions - Object containing sidereal positions { Sun: { longitude, ... }, ... }.
 * @returns {object} Object mapping each planet to an array of aspecting planets.
 * Example: { Sun: ["Mars", "Jupiter"], Moon: ["Saturn"], ... }
 */
export function calculateAspects(siderealPositions) {
    const aspects = {};
    const planets = Object.keys(siderealPositions).filter(p => p !== 'Ketu'); // Use calculated positions, exclude Ketu initially

    // Define aspect angles and orbs (simplified)
    const aspectDefinitions = [
        { type: 'Conjunction', angle: 0, orb: 8 },
        { type: 'Opposition', angle: 180, orb: 8 },
        { type: 'Square', angle: 90, orb: 7 },
        { type: 'Trine', angle: 120, orb: 7 },
        // Add Sextile (60 deg), etc. if needed
    ];

    for (let i = 0; i < planets.length; i++) {
        const planet1Name = planets[i];
        const planet1Data = siderealPositions[planet1Name];
        if (!planet1Data || isNaN(planet1Data.longitude)) continue;

        aspects[planet1Name] = []; // Initialize aspect list for planet1

        for (let j = i + 1; j < planets.length; j++) {
            const planet2Name = planets[j];
            const planet2Data = siderealPositions[planet2Name];
            if (!planet2Data || isNaN(planet2Data.longitude)) continue;

            let angleDiff = Math.abs(planet1Data.longitude - planet2Data.longitude);
            if (angleDiff > 180) {
                angleDiff = 360 - angleDiff; // Use the shorter angle
            }

            for (const aspect of aspectDefinitions) {
                if (Math.abs(angleDiff - aspect.angle) <= aspect.orb) {
                    // Found an aspect
                    if (!aspects[planet1Name]) aspects[planet1Name] = [];
                    if (!aspects[planet2Name]) aspects[planet2Name] = [];

                    aspects[planet1Name].push(planet2Name);
                    aspects[planet2Name].push(planet1Name);
                    // Optional: Store aspect type and orb details if needed later
                    break; // Move to next planet pair once an aspect is found (simplification)
                }
            }
        }
    }
     // Add Ketu aspects (opposite of Rahu's aspects) - Simplification
     if (aspects.Rahu && siderealPositions.Ketu) {
         aspects.Ketu = aspects.Rahu.slice(); // Copy Rahu's aspects
         // Also add Rahu itself as opposing Ketu
         if (!aspects.Ketu.includes('Rahu')) aspects.Ketu.push('Rahu');
         if (!aspects.Rahu.includes('Ketu')) aspects.Rahu.push('Ketu');
     } else if (siderealPositions.Ketu) {
         aspects.Ketu = ['Rahu']; // At least opposes Rahu
         if (!aspects.Rahu) aspects.Rahu = [];
         if (!aspects.Rahu.includes('Ketu')) aspects.Rahu.push('Ketu');
     }


    return aspects;
}

/**
 * Calculates basic planetary states (e.g., exaltation, debilitation, own sign, moolatrikona).
 * NOTE: This is a simplified check based on Rashi only. Full state requires degrees.
 * @param {object} siderealPositions - Object containing sidereal positions { Sun: { longitude, rashi, ... }, ... }.
 * @returns {object} Object mapping planet names to their calculated state string.
 */
export function calculatePlanetStates(siderealPositions) {
    const states = {};
    // Define state rules (simplified - Rashi based)
    const stateRules = {
        Sun: { exalt: "Aries", debilitate: "Libra", own: ["Leo"], moolatrikona: "Leo" },
        Moon: { exalt: "Taurus", debilitate: "Scorpio", own: ["Cancer"], moolatrikona: "Taurus" },
        Mars: { exalt: "Capricorn", debilitate: "Cancer", own: ["Aries", "Scorpio"], moolatrikona: "Aries" },
        Mercury: { exalt: "Virgo", debilitate: "Pisces", own: ["Gemini", "Virgo"], moolatrikona: "Virgo" },
        Jupiter: { exalt: "Cancer", debilitate: "Capricorn", own: ["Sagittarius", "Pisces"], moolatrikona: "Sagittarius" },
        Venus: { exalt: "Pisces", debilitate: "Virgo", own: ["Taurus", "Libra"], moolatrikona: "Libra" }, // Some say Moolatrikona is Libra, some Taurus
        Saturn: { exalt: "Libra", debilitate: "Aries", own: ["Capricorn", "Aquarius"], moolatrikona: "Aquarius" },
        // Rahu/Ketu states are debated, often linked to signs of Mercury/Jupiter/Saturn
        Rahu: { exalt: "Taurus", debilitate: "Scorpio", own: ["Aquarius"], moolatrikona: "Gemini" }, // Example rules
        Ketu: { exalt: "Scorpio", debilitate: "Taurus", own: ["Pisces"], moolatrikona: "Sagittarius" } // Example rules
    };

    for (const planetName in siderealPositions) {
        const planetData = siderealPositions[planetName];
        if (!planetData || !planetData.rashi || planetData.rashi === "N/A") {
            states[planetName] = "Unknown";
            continue;
        }

        const rules = stateRules[planetName];
        if (!rules) {
            states[planetName] = "Standard"; // Default if no specific rules
            continue;
        }

        const rashi = planetData.rashi;
        let state = "Standard"; // Default

        if (rashi === rules.exalt) state = "Exalted";
        else if (rashi === rules.debilitate) state = "Debilitated";
        else if (rules.own.includes(rashi)) {
             // Check Moolatrikona within own sign (requires degree check ideally)
             if (rashi === rules.moolatrikona) state = "Moolatrikona"; // Simplified
             else state = "Own Sign";
        }
        // Could add checks for friendly/enemy signs here based on friendship data

        states[planetName] = state;
    }
    return states;
}
export function getHouseOfPlanet(longitude, siderealCuspStartDegrees) {
    if (isNaN(longitude) || !Array.isArray(siderealCuspStartDegrees) || siderealCuspStartDegrees.length !== 12 || siderealCuspStartDegrees.some(isNaN)) {
        console.warn(`Invalid input for getHouseOfPlanet: longitude=${longitude}, cusps=${siderealCuspStartDegrees}`);
        return null;
    }
    const normalizedLng = normalizeAngle(longitude);
    if (isNaN(normalizedLng)) return null; // Should not happen if longitude is valid

    for (let i = 0; i < 12; i++) {
        const currentCusp = normalizeAngle(siderealCuspStartDegrees[i]);
        const nextCusp = normalizeAngle(siderealCuspStartDegrees[(i + 1) % 12]);

        // Handle wrap-around (e.g., House 12 cusp > House 1 cusp)
        if (currentCusp <= nextCusp) {
            // Normal case: Cusp degrees increase
            if (normalizedLng >= currentCusp && normalizedLng < nextCusp) {
                return i + 1; // House number is index + 1
            }
        } else {
            // Wrap-around case: e.g., House 12 starts at 330°, House 1 starts at 10°
            // The planet is in the house if it's >= currentCusp OR < nextCusp
            if (normalizedLng >= currentCusp || normalizedLng < nextCusp) {
                return i + 1;
            }
        }
    }
    console.warn(`Longitude ${longitude} did not fall into any house range based on cusps: ${siderealCuspStartDegrees}`);
    return null; // Should technically not be reached if cusps cover 360 degrees
}
/**
 * Calculates the houses owned by a planet based on the Rashi lordships of the house cusps.
 * @param {string} planetName - The name of the planet (e.g., "Mars").
 * @param {number[]} siderealCuspStartDegrees - An array of 12 sidereal cusp start degrees.
 * @returns {number[]} An array of house numbers (1-12) owned by the planet.
 */
export function getHousesRuledByPlanet(planetName, siderealCuspStartDegrees) {
    const ruledHouses = new Set();
    if (!planetName || !Array.isArray(siderealCuspStartDegrees) || siderealCuspStartDegrees.length !== 12) {
        return [];
    }
    const ruledRashiIndices = [];
    RASHI_LORDS.forEach((lord, index) => {
        if (lord === planetName) {
            ruledRashiIndices.push(index);
        }
    });
    if (ruledRashiIndices.length === 0) {
        return [];
    }
    for (let i = 0; i < 12; i++) {
        const cuspStartDeg = siderealCuspStartDegrees[i];
        if (isNaN(cuspStartDeg)) continue;
        const cuspRashiDetails = getRashiDetails(cuspStartDeg);
        if (cuspRashiDetails && ruledRashiIndices.includes(cuspRashiDetails.index)) {
            ruledHouses.add(i + 1);
        }
    }
    return Array.from(ruledHouses).sort((a, b) => a - b);
}
