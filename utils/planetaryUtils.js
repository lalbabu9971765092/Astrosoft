// utils/planetaryUtils.js
import swisseph from 'swisseph-v2';
import logger from './logger.js';
import {
    NAKSHATRAS, NAKSHATRA_SPAN, RASHIS, RASHI_LORDS, RASHI_SPAN,
    PLANET_ORDER, SUBLORD_DATA, VIMS_DASHA_SEQUENCE, VIMS_DASHA_YEARS // Import Dasha constants
} from './constants.js';
import { normalizeAngle, convertToDMS, calculateAyanamsa, getJulianDateUT } from './coreUtils.js';
import moment from 'moment-timezone';

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
export function getSubSubLordDetails(positionWithinNakshatra, subLordDetails) {
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

    // Use a map for a more robust link between planet ID and name
    const planetMap = {
        [swisseph.SE_SUN]: 'Sun',
        [swisseph.SE_MOON]: 'Moon',
        [swisseph.SE_MARS]: 'Mars',
        [swisseph.SE_MERCURY]: 'Mercury',
        [swisseph.SE_JUPITER]: 'Jupiter',
        [swisseph.SE_VENUS]: 'Venus',
        [swisseph.SE_SATURN]: 'Saturn',
        [swisseph.SE_TRUE_NODE]: 'Rahu',
        [swisseph.SE_URANUS]: 'Uranus',
        [swisseph.SE_NEPTUNE]: 'Neptune',
        [swisseph.SE_PLUTO]: 'Pluto'
    };
    const planetsToCalc = Object.keys(planetMap).map(Number); // Get array of planet IDs

    const flags = swisseph.SEFLG_SPEED | swisseph.SEFLG_SIDEREAL;
    const tropicalFlags = swisseph.SEFLG_SPEED; // For tropical positions

    const results = { tropical: {}, sidereal: {} };

    try {
        const ayanamsa = calculateAyanamsa(julianDayUT);
        if (isNaN(ayanamsa)) {
             throw new Error(`Cannot calculate positions without a valid Ayanamsa for JD ${julianDayUT}`);
        }

        for (const planetId of planetsToCalc) {
            const planetName = planetMap[planetId];
            logger.debug(`Processing planet: ${planetName} (ID: ${planetId})`);

            const siderealCalc = swisseph.swe_calc_ut(julianDayUT, planetId, flags);
            const tropicalCalc = swisseph.swe_calc_ut(julianDayUT, planetId, tropicalFlags);

            logger.debug(`  Sidereal Calc for ${planetName}: ${JSON.stringify(siderealCalc)}`);
            logger.debug(`  Tropical Calc for ${planetName}: ${JSON.stringify(tropicalCalc)}`);

            // Initialize results for the current planet to ensure they always exist
            results.sidereal[planetName] = { longitude: NaN, latitude: NaN, distance: NaN, speedLongitude: NaN, speedLatitude: NaN, speedDistance: NaN, dms: "N/A", rashi: "N/A", rashiLord: "N/A", nakshatra: "N/A", nakLord: "N/A", pada: NaN, subLord: "N/A", subSubLord: "N/A" };
            results.tropical[planetName] = { longitude: NaN, latitude: NaN, distance: NaN, speedLongitude: NaN, speedLatitude: NaN, speedDistance: NaN };

           

            logger.debug(`  Sidereal Calc for ${planetName}: ${JSON.stringify(siderealCalc)}`);
            logger.debug(`  Tropical Calc for ${planetName}: ${JSON.stringify(tropicalCalc)}`);

            let siderealSuccess = false;
            if (siderealCalc && typeof siderealCalc === 'object' && typeof siderealCalc.longitude === 'number' && !isNaN(siderealCalc.longitude)) {
                // Store Sidereal Data and enrich it
                const siderealLongitude = normalizeAngle(siderealCalc.longitude);
                const nakDetails = getNakshatraDetails(siderealLongitude);
                const rashiDetails = getRashiDetails(siderealLongitude);
                const pada = calculateNakshatraPada(siderealLongitude);
                const subLordDetails = getSubLordDetails(siderealLongitude);
                const positionWithinNakshatra = siderealLongitude - (nakDetails.index * NAKSHATRA_SPAN);
                const subSubLordDetails = getSubSubLordDetails(positionWithinNakshatra, subLordDetails);

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
                    subSubLord: subSubLordDetails.lord,
                };
                siderealSuccess = true;
            } else {
                logger.error(`Failed to calculate sidereal position for ${planetName} (ID: ${planetId}) at JD ${julianDayUT}. Result: ${JSON.stringify(siderealCalc)}`);
            }

            if (tropicalCalc && typeof tropicalCalc === 'object' && typeof tropicalCalc.longitude === 'number' && !isNaN(tropicalCalc.longitude)) {
                results.tropical[planetName] = {
                    longitude: tropicalCalc.longitude,
                    latitude: tropicalCalc.latitude,
                    distance: tropicalCalc.distance,
                    speedLongitude: tropicalCalc.longitudeSpeed,
                    speedLatitude: tropicalCalc.latitudeSpeed,
                    speedDistance: tropicalCalc.distanceSpeed,
                };
            } else {
                logger.error(`Failed to calculate tropical position for ${planetName} (ID: ${planetId}) at JD ${julianDayUT}. Result: ${JSON.stringify(tropicalCalc)}`);
            }

            // If neither sidereal nor tropical calculation was successful, ensure the entry is still marked as failed.
            // This is already handled by the initial NaN assignment and subsequent conditional updates.
            if (!siderealSuccess) {
                logger.warn(`Sidereal calculation for ${planetName} was not successful, retaining NaN values.`);
            }
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
                speedLatitude: -rahuData.latitudeSpeed,
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

        if (!results.sidereal.Moon) {
            logger.error(`Moon data is missing from sidereal results after calculatePlanetaryPositions for JD ${julianDayUT}.`);
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
         if (!aspects.Rahu.includes('Ketu')) aspects.Ketu.push('Ketu');
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

/**
 * Calculates the Nakshatra and Rashi lord for a given sidereal longitude.
 * @param {number} siderealLongitude - Sidereal longitude in decimal degrees.
 * @returns {{nakshatraLord: string, rashiLord: string}}
 */
export function getNakshatraAndRashiLord(siderealLongitude) {
    const nakshatraDetails = getNakshatraDetails(siderealLongitude);
    const rashiDetails = getRashiDetails(siderealLongitude);

    return {
        nakshatraLord: nakshatraDetails.lord,
        rashiLord: rashiDetails.lord
    };
}

/**
 * Calculates the Vimshottari Dasha balance at birth.
 * @param {number} moonLongitude - Sidereal longitude of the Moon at birth.
 * @returns {{lord: string, balanceYears: number, balanceYMD: {years: number, months: number, days: number}}}
 */
export function calculateVimshottariDashaBalance(moonLongitude) {
    const normalizedMoonLng = normalizeAngle(moonLongitude);
    if (isNaN(normalizedMoonLng)) {
        logger.error(`Invalid Moon longitude for Dasha balance: ${moonLongitude}`);
        return { lord: "Error", balanceYears: NaN, balanceYMD: { years: 0, months: 0, days: 0 } };
    }

    const nakshatraDetails = getNakshatraDetails(normalizedMoonLng);
    const currentNakshatraName = nakshatraDetails.name;
    const currentNakshatraLord = nakshatraDetails.lord;
    const currentNakshatraIndex = nakshatraDetails.index;

    if (!currentNakshatraLord) {
        logger.error(`Could not determine Nakshatra Lord for Moon longitude: ${normalizedMoonLng}`);
        return { lord: "Error", balanceYears: NaN, balanceYMD: { years: 0, months: 0, days: 0 } };
    }

    const totalDashaYears = VIMS_DASHA_YEARS[currentNakshatraLord];
    if (isNaN(totalDashaYears)) {
        logger.error(`Total Dasha years not found for lord ${currentNakshatraLord}`);
        return { lord: "Error", balanceYears: NaN, balanceYMD: { years: 0, months: 0, days: 0 } };
    }

    // Calculate the start longitude of the current Nakshatra
    const nakshatraStartLongitude = currentNakshatraIndex * NAKSHATRA_SPAN;

    // Calculate how much of the current Nakshatra the Moon has already traversed
    const traversedDegreesInNakshatra = normalizedMoonLng - nakshatraStartLongitude;

    // Calculate the remaining proportion of the Nakshatra
    const remainingProportion = (NAKSHATRA_SPAN - traversedDegreesInNakshatra) / NAKSHATRA_SPAN;

    // Calculate the balance of the Dasha period
    const balanceYears = remainingProportion * totalDashaYears;

    // Convert balance years to years, months, days
    const years = Math.floor(balanceYears);
    const remainingAfterYears = balanceYears - years;
    const months = Math.floor(remainingAfterYears * 12);
    const remainingAfterMonths = remainingAfterYears * 12 - months;
    const days = Math.round(remainingAfterMonths * 30); // Using 30 days per month for simplicity

    return {
        lord: currentNakshatraLord,
        balanceYears: balanceYears,
        balanceYMD: { years, months, days }
    };
}

/**
 * Finds the precise entry and exit times of the Moon into a specific Nakshatra within a 24-hour period.
 * @param {string} dateString - Local date string (YYYY-MM-DDTHH:MM:SS) for the start of the day.
 * @param {number} latitude - Observer's latitude.
 * @param {number} longitude - Observer's longitude.
 * @param {number} targetNakshatraIndex - The 0-indexed Nakshatra index to find transits for.
 * @returns {{entryTime: string|null, exitTime: string|null}} Object with ISO strings for entry and exit times.
 */
export async function getMoonNakshatraEntryExitTimes(dateString, latitude, longitude, targetNakshatraIndex, sunrise, nextSunrise) {

    const startOfAstrologicalDay = moment(sunrise);
    const endOfAstrologicalDay = moment(nextSunrise);

    let entryTime = null;
    let exitTime = null;

    // Find the nakshatra at the beginning of the astrological day (sunrise)
    const { julianDayUT: sunriseJD } = getJulianDateUT(startOfAstrologicalDay.toISOString(), latitude, longitude);
    let prevNakshatraIndex = -1;
    if (sunriseJD !== null) {
        const sunriseMoonLng = (await calculatePlanetaryPositions(sunriseJD))?.sidereal?.Moon?.longitude;
        if (sunriseMoonLng !== undefined && !isNaN(sunriseMoonLng)) {
            prevNakshatraIndex = getNakshatraDetails(sunriseMoonLng).index;
        }
    }

    // If the target nakshatra is already present at sunrise, the entry time is the sunrise itself.
    if (prevNakshatraIndex === targetNakshatraIndex) {
        entryTime = startOfAstrologicalDay.toISOString();
    }

    // Iterate through the astrological day in small steps (e.g., 5 minutes)
    const stepMinutes = 5;
    let currentMoment = startOfAstrologicalDay.clone();

    while (currentMoment.isSameOrBefore(endOfAstrologicalDay)) {
        const { julianDayUT } = getJulianDateUT(currentMoment.format("YYYY-MM-DDTHH:mm:ss"), latitude, longitude);
        if (julianDayUT === null) {
            logger.warn(`Invalid JD for Moon Nakshatra transit calculation at ${currentMoment.toISOString()}`);
            currentMoment.add(stepMinutes, 'minutes');
            continue;
        }

        const planetaryPositions = await calculatePlanetaryPositions(julianDayUT);
        const moonLongitude = planetaryPositions?.sidereal?.Moon?.longitude;

        if (moonLongitude === undefined || isNaN(moonLongitude)) {
            logger.warn(`Moon longitude not available for transit calculation at ${currentMoment.toISOString()}`);
            currentMoment.add(stepMinutes, 'minutes');
            continue;
        }

        const currentNakshatraIndex = getNakshatraDetails(moonLongitude).index;

        // Check for entry into target Nakshatra
        if (entryTime === null && currentNakshatraIndex === targetNakshatraIndex && prevNakshatraIndex !== targetNakshatraIndex) {
            entryTime = await refineNakshatraTransitTime(
                currentMoment.clone().subtract(stepMinutes, 'minutes'),
                currentMoment.clone(),
                latitude,
                longitude,
                targetNakshatraIndex,
                'entry',
                10, // iterations
                endOfAstrologicalDay.toISOString() // Pass nextSunrise as a string
            );
        }
        // Check for exit from target Nakshatra
        if (exitTime === null && currentNakshatraIndex !== targetNakshatraIndex && prevNakshatraIndex === targetNakshatraIndex) {
            exitTime = await refineNakshatraTransitTime(
                currentMoment.clone().subtract(stepMinutes, 'minutes'),
                currentMoment.clone(),
                latitude,
                longitude,
                targetNakshatraIndex,
                'exit',
                10, // iterations
                endOfAstrologicalDay.toISOString() // Pass nextSunrise as a string
            );
        }

        prevNakshatraIndex = currentNakshatraIndex;
        currentMoment.add(stepMinutes, 'minutes');
    }

    // If the moon is still in the target nakshatra at the end of the astrological day, the exit time is the next sunrise.
    if (exitTime === null && prevNakshatraIndex === targetNakshatraIndex) {
        exitTime = endOfAstrologicalDay.toISOString();
    }

    return { entryTime, exitTime };
}

/**
 * Refines the Nakshatra transit time using a binary search approach.
 * @param {moment.Moment} startTime - The start of the time window to search.
 * @param {moment.Moment} endTime - The end of the time window to search.
 * @param {number} latitude - Observer's latitude.
 * @param {number} longitude - Observer's longitude.
 * @param {number} targetNakshatraIndex - The 0-indexed Nakshatra index.
 * @param {'entry' | 'exit'} type - Whether to find entry or exit time.
 * @param {number} iterations - Number of iterations for refinement.
 * @returns {string} ISO string of the refined transit time.
 */
async function refineNakshatraTransitTime(startTime, endTime, latitude, longitude, targetNakshatraIndex, type, iterations = 10, nextSunrise) {

    let low = startTime.clone();
    let high = endTime.clone();
    const endOfAstrologicalDay = moment(nextSunrise);

    // Ensure high does not exceed the end of the astrological day
    if (high.isAfter(endOfAstrologicalDay)) {
        high = endOfAstrologicalDay;
    }

    let preciseTime = null;

    for (let i = 0; i < iterations; i++) {
        const mid = low.clone().add(high.diff(low) / 2, 'milliseconds');
        const { julianDayUT } = getJulianDateUT(mid.format("YYYY-MM-DDTHH:mm:ss"), latitude, longitude);

        if (julianDayUT === null) {
            logger.warn(`Invalid JD during transit refinement at ${mid.toISOString()}`);
            return mid.toISOString(); // Return approximate if JD is invalid
        }

        const planetaryPositions = await calculatePlanetaryPositions(julianDayUT);
        const moonLongitude = planetaryPositions?.sidereal?.Moon?.longitude;

        if (moonLongitude === undefined || isNaN(moonLongitude)) {
            logger.warn(`Moon longitude not available during transit refinement at ${mid.toISOString()}`);
            return mid.toISOString(); // Return approximate if Moon longitude is invalid
        }

        const currentNakshatraIndex = getNakshatraDetails(moonLongitude).index;

        if (type === 'entry') {
            if (currentNakshatraIndex === targetNakshatraIndex) {
                preciseTime = mid;
                high = mid; // Try to find an earlier time
            } else {
                low = mid; // Moon hasn't entered yet, search later
            }
        } else { // type === 'exit'
            if (currentNakshatraIndex === targetNakshatraIndex) {
                low = mid; // Moon is still in, search later
            } else {
                preciseTime = mid;
                high = mid; // Moon has exited, try to find an earlier exit
            }
        }
    }

    const finalTime = preciseTime || (type === 'entry' ? high : low);

    // Ensure the final time does not exceed the astrological day boundaries
    if (finalTime.isAfter(endOfAstrologicalDay)) {
        return endOfAstrologicalDay.toISOString();
    }
    if (finalTime.isBefore(startTime)) {
        return startTime.toISOString();
    }

    return finalTime.toISOString();
}

/**
 * Calculates the KP Ruling Planets for a given chart.
 * @param {object} chartData - Object containing chart data including date, time, location, and planetary positions.
 * @returns {object} An object containing the Ruling Planets.
 */
export async function calculateKpRulingPlanets(dateString, latitude, longitude) {
    try {
        const { julianDayUT } = await import('./coreUtils.js').then(m => m.getJulianDateUT(dateString, latitude, longitude));
        if (julianDayUT === null) {
            throw new Error("Invalid date or location for Ruling Planets calculation.");
        }

        const rulingPlanets = new Set();

        // 1. Ascendant Lord
        const { tropicalAscendant, tropicalCusps } = calculateHousesAndAscendant(julianDayUT, latitude, longitude);
        const ayanamsa = calculateAyanamsa(julianDayUT);
        const siderealAscendantDeg = normalizeAngle(tropicalAscendant - ayanamsa);
        const ascendantRashiDetails = getRashiDetails(siderealAscendantDeg);
        if (ascendantRashiDetails && ascendantRashiDetails.lord) {
            rulingPlanets.add(ascendantRashiDetails.lord);
        }

        // 2. Moon's Rashi Lord
        const planetaryPositions = await calculatePlanetaryPositions(julianDayUT);
        const moonData = planetaryPositions.sidereal.Moon;
        if (moonData && moonData.rashiLord) {
            rulingPlanets.add(moonData.rashiLord);
        }

        // 3. Moon's Nakshatra Lord
        if (moonData && moonData.nakLord) {
            rulingPlanets.add(moonData.nakLord);
        }

        // 4. Moon's Sub Lord
        if (moonData && moonData.subLord) {
            rulingPlanets.add(moonData.subLord);
        }

        // 5. Day Lord (Lord of the weekday)
        const date = new Date(dateString);
        const dayOfWeek = date.getDay(); // 0 for Sunday, 6 for Saturday
        const dayLord = WEEKDAY_LORDS[dayOfWeek];
        if (dayLord) {
            rulingPlanets.add(dayLord);
        }

        // Convert Set to Array and sort by PLANET_ORDER
        const sortedRulingPlanets = Array.from(rulingPlanets).sort((a, b) => {
            const indexA = PLANET_ORDER.indexOf(a);
            const indexB = PLANET_ORDER.indexOf(b);
            return indexA - indexB;
        });

        return sortedRulingPlanets;

    } catch (error) {
        logger.error(`Error calculating KP Ruling Planets: ${error.message}`, { stack: error.stack });
        throw new Error(`Failed to calculate KP Ruling Planets: ${error.message}`);
    }
}

/**
 * Calculates Badhak house and Badhakesh (lord of Badhak house).
 * @param {number} siderealAscendantDeg - Sidereal longitude of the Ascendant.
 * @returns {{ badhakHouse: number, badhakSign: string, badhakesh: string } | { error: string }}
 */
export function calculateBadhakDetails(siderealAscendantDeg) {
    if (isNaN(siderealAscendantDeg)) {
        logger.warn(`Cannot calculate Badhak details: Invalid Ascendant degree.`);
        return { error: "Invalid Ascendant degree." };
    }

    const ascRashiDetails = getRashiDetails(siderealAscendantDeg);
    if (!ascRashiDetails || ascRashiDetails.index === -1) {
        logger.warn(`Cannot calculate Badhak details: Could not determine Ascendant Rashi.`);
        return { error: "Could not determine Ascendant Rashi." };
    }

    const ascRashiIndex = ascRashiDetails.index; // 0 for Aries, 1 for Taurus, etc.

    const movableSigns = [0, 3, 6, 9]; // Aries, Cancer, Libra, Capricorn
    const fixedSigns = [1, 4, 7, 10]; // Taurus, Leo, Scorpio, Aquarius
    // Dual signs are the rest

    let badhakHouseNumber;

    if (movableSigns.includes(ascRashiIndex)) {
        badhakHouseNumber = 11;
    } else if (fixedSigns.includes(ascRashiIndex)) {
        badhakHouseNumber = 9;
    } else { // Dual signs
        badhakHouseNumber = 7;
    }

    const badhakSignIndex = (ascRashiIndex + badhakHouseNumber - 1) % 12;
    const badhakSign = RASHIS[badhakSignIndex];
    const badhakesh = RASHI_LORDS[badhakSignIndex];

    logger.debug(`Badhak calculation for Asc ${ascRashiDetails.name}: House ${badhakHouseNumber}, Sign ${badhakSign}, Lord ${badhakesh}`);

    return {
        badhakHouse: badhakHouseNumber,
        badhakSign: badhakSign,
        badhakesh: badhakesh
    };
}

/**
 * Calculates key longevity factors like Maraka and 8th Lord.
 * @param {Array<object>} housesData - Array of house data objects from the main calculation.
 * @returns {{marakaLords: string[], secondLord: string, seventhLord: string, eighthLord: string} | {error: string}}
 */
export function calculateLongevityFactors(housesData) {
    if (!Array.isArray(housesData) || housesData.length !== 12) {
        logger.warn("Cannot calculate longevity factors: Invalid housesData array.");
        return { error: "Invalid house data provided." };
    }

    // House data is 0-indexed (house 1 is at index 0)
    const secondLord = housesData[1]?.mean_rashi_lord;
    const seventhLord = housesData[6]?.mean_rashi_lord;
    const eighthLord = housesData[7]?.mean_rashi_lord;

    if (!secondLord || !seventhLord || !eighthLord) {
        logger.warn("Cannot calculate longevity factors: Missing lord data for 2nd, 7th, or 8th house.");
        return { error: "Missing house lord data." };
    }

    // Maraka lords are the lords of the 2nd and 7th houses.
    const marakaLords = [...new Set([secondLord, seventhLord])]; // Use Set to handle cases where one planet rules both

    return { marakaLords, secondLord, seventhLord, eighthLord };
}

/**
 * Calculates longevity based on a house scoring method.
 * (A / (A + B)) * 120
 * @param {object} siderealPositions - Object of sidereal planetary positions.
 * @param {number[]} siderealCuspStartDegrees - Array of 12 sidereal cusp start degrees.
 * @param {object} badhakDetails - Object containing badhakHouse number.
 * @returns {{longevity: number, scoreA: number, scoreB: number} | {error: string}}
 */
export function calculateHouseBasedLongevity(siderealPositions, siderealCuspStartDegrees, badhakDetails) {
    if (!siderealPositions || !Array.isArray(siderealCuspStartDegrees) || siderealCuspStartDegrees.length !== 12 || !badhakDetails) {
        logger.warn("Cannot calculate house-based longevity: Invalid input provided.");
        return { error: "Invalid input for longevity calculation." };
    }
    if (badhakDetails.error || !badhakDetails.badhakHouse) {
        logger.warn(`Cannot calculate house-based longevity: Badhak details are missing or have an error. Details: ${JSON.stringify(badhakDetails)}`);
        return { error: "Badhak details unavailable for longevity calculation." };
    }

    const lifeIncreasingHouses = [1, 5, 9, 10, 11];
    const deathInflictingHouses = [6, 8, 12, badhakDetails.badhakHouse];
    const uniqueDeathHouses = [...new Set(deathInflictingHouses)];

    const planetsToConsider = ["Sun", "Moon", "Mars", "Mercury", "Jupiter", "Venus", "Saturn"];
    let scoreA = 0; let scoreB = 0;

    for (const planetName of planetsToConsider) {
        const planetData = siderealPositions[planetName];
        if (!planetData || isNaN(planetData.longitude)) continue;
        const house = getHouseOfPlanet(planetData.longitude, siderealCuspStartDegrees);
        if (house === null) continue;
        if (lifeIncreasingHouses.includes(house)) scoreA++;
        else if (uniqueDeathHouses.includes(house)) scoreB++;
    }

    const totalScore = scoreA + scoreB;
    if (totalScore === 0) return { longevity: 0, scoreA, scoreB, reason: "Indeterminate" };
    const longevity = (scoreA / totalScore) * 120;
    return { longevity: parseFloat(longevity.toFixed(2)), scoreA, scoreB };
}