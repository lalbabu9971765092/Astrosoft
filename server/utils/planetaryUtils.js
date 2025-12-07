
// utils/planetaryUtils.js
import swisseph from 'swisseph-v2';
import logger from './logger.js';
import { NAKSHATRAS, NAKSHATRA_SPAN, RASHIS, RASHI_LORDS, RASHI_SPAN, VARJYAM_START_FRACTION,
    PLANET_ORDER, SUBLORD_DATA, VIMS_DASHA_SEQUENCE, VIMS_DASHA_YEARS, NAKSHATRA_PADA_ALPHABETS, PLANETARY_RELATIONS
} from './constants.js';
import { normalizeAngle, convertToDMS, calculateAyanamsa, getJulianDateUT } from './coreUtils.js';
import moment from 'moment-timezone';
import { calculateKpSignificators } from './kpUtils.js';

/**
 * Gets the alphabet associated with a specific Nakshatra Pada.
 * @param {string} nakshatraName - The name of the Nakshatra.
 * @param {number} padaNumber - The pada number (1-4).
 * @returns {string} The corresponding alphabet, or "N/A" if not found.
 */
export function getNakshatraPadaAlphabet(nakshatraName, padaNumber) {
    if (!nakshatraName || !NAKSHATRA_PADA_ALPHABETS[nakshatraName] || padaNumber < 1 || padaNumber > 4) {
        return "N/A";
    }
    return NAKSHATRA_PADA_ALPHABETS[nakshatraName][padaNumber - 1];
}

/**
 * Gets the Nakshatra details (name, lord) for a given sidereal longitude. @param {number} siderealLongitude - Sidereal longitude in decimal degrees.
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
        logger.warn(`Could not determine Nakshatra for longitude: ${siderealLongitude} (Normalized: ${normalizedLng}, Index: ${nakshatraIndex}). NAKSHATRAS.length: ${NAKSHATRAS.length}`);
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

    const rashiIndex = Math.floor(normalizedLng / RASHI_SPAN);
    const positionInRashi = normalizedLng % RASHI_SPAN;

    const navamsaSpan = RASHI_SPAN / 9;
    const navamsaIndexInRashi = Math.floor(positionInRashi / navamsaSpan);

    let startingNavamsaSignIndex;
    if ([0, 4, 8].includes(rashiIndex)) { 
        startingNavamsaSignIndex = 0;
    } else if ([1, 5, 9].includes(rashiIndex)) { 
        startingNavamsaSignIndex = 9;
    } else if ([2, 6, 10].includes(rashiIndex)) {
        startingNavamsaSignIndex = 6;
    } else { 
        startingNavamsaSignIndex = 3;
    }

    const navamsaSignIndex = (startingNavamsaSignIndex + navamsaIndexInRashi) % 12;

    const positionInNavamsaSegment = positionInRashi % navamsaSpan;
    const positionInNavamsaSign = (positionInNavamsaSegment / navamsaSpan) * RASHI_SPAN;

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
    const epsilon = 1e-9;

    if (SUBLORD_DATA && SUBLORD_DATA[nakshatraName]) {
        let currentPos = 0;
        for (const sub of SUBLORD_DATA[nakshatraName]) {
            const subSpan = sub.span || 0;
            const subStart = currentPos;
            const subEnd = currentPos + subSpan;

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

    const positionWithinSubLordSpan = positionWithinNakshatra - subLordDetails.startDegInNak;

    const subLordIndex = VIMS_DASHA_SEQUENCE.indexOf(subLordDetails.lord);
    if (subLordIndex === -1) {
        logger.warn(`SubLord "${subLordDetails.lord}" not found in Vimsottari sequence.`);
        return { lord: "N/A" };
    }

    let cumulativeProportion = 0;
    const epsilon = 1e-9;

    for (let i = 0; i < VIMS_DASHA_SEQUENCE.length; i++) {
        const currentSubSubIndex = (subLordIndex + i) % VIMS_DASHA_SEQUENCE.length;
        const subSubLordName = VIMS_DASHA_SEQUENCE[currentSubSubIndex];
        const subSubLordYears = VIMS_DASHA_YEARS[subSubLordName];

        if (!subSubLordYears) {
            logger.warn(`Years not defined for potential SubSubLord: ${subSubLordName}`);
            continue;
        }

        const proportionOfSpan = subSubLordYears / 120;
        const subSubLordSpanDegrees = proportionOfSpan * subLordSpan;

        const subSubStart = cumulativeProportion * subLordSpan;
        const subSubEnd = subSubStart + subSubLordSpanDegrees;

        if ((positionWithinSubLordSpan >= subSubStart - epsilon && positionWithinSubLordSpan < subSubEnd - epsilon) ||
            (Math.abs(positionWithinSubLordSpan - subLordSpan) < epsilon && i === VIMS_DASHA_SEQUENCE.length - 1))
        {
            return { lord: subSubLordName };
        }

        cumulativeProportion += proportionOfSpan;
    }

    logger.warn(`SubSubLord calculation failed unexpectedly for position ${positionWithinNakshatra} within SubLord ${subLordDetails.lord}`);
    return { lord: "Error" };
}


/**
 * Calculates sidereal and tropical positions for planets and Ascendant.
 * @param {number} julianDayUT - Julian Day in Universal Time.
 * @returns {object} Object containing tropical and sidereal positions, or null on error.
 */
export function calculatePlanetaryPositions(julianDayUT) {
    if (typeof julianDayUT !== 'number' || isNaN(julianDayUT)) {
        throw new Error(`calculatePlanetaryPositions received invalid Julian Day: ${julianDayUT}`);
    }

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
    const planetsToCalc = Object.keys(planetMap).map(Number);

    const flags = swisseph.SEFLG_SPEED | swisseph.SEFLG_SIDEREAL;
    const tropicalFlags = swisseph.SEFLG_SPEED;

    const results = { tropical: {}, sidereal: {} };

        // Initialize all planets in sidereal and tropical results to prevent undefined errors
        for (const planetId of planetsToCalc) {
            const planetName = planetMap[planetId];
            results.sidereal[planetName] = { longitude: NaN, latitude: NaN, distance: NaN, speedLongitude: NaN, speedLatitude: NaN, speedDistance: NaN, dms: "N/A", rashi: "N/A", rashiLord: "N/A", nakshatra: "N/A", nakLord: "N/A", pada: NaN, subLord: "N/A", subSubLord: "N/A" };
            results.tropical[planetName] = { longitude: NaN, latitude: NaN, distance: NaN, speedLongitude: NaN, speedLatitude: NaN, speedDistance: NaN };
        }

        try {
            const ayanamsa = calculateAyanamsa(julianDayUT);
            if (isNaN(ayanamsa)) {
                 throw new Error(`Cannot calculate positions without a valid Ayanamsa for JD ${julianDayUT}`);
            }

            for (const planetId of planetsToCalc) {
                const planetName = planetMap[planetId];
                

                const siderealCalc = swisseph.swe_calc_ut(julianDayUT, planetId, flags);
                const tropicalCalc = swisseph.swe_calc_ut(julianDayUT, planetId, tropicalFlags);

                let siderealSuccess = false;
                if (siderealCalc && typeof siderealCalc === 'object' && typeof siderealCalc.longitude === 'number' && !isNaN(siderealCalc.longitude)) {
                const siderealLongitude = normalizeAngle(siderealCalc.longitude);
                const nakDetails = getNakshatraDetails(siderealLongitude);
                const rashiDetails = getRashiDetails(siderealLongitude);
                const pada = calculateNakshatraPada(siderealLongitude);
                const padaAlphabet = getNakshatraPadaAlphabet(nakDetails.name, pada); // Get the alphabet
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
                    padaAlphabet: padaAlphabet, // Add the alphabet here
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

            if (!siderealSuccess) {
                logger.warn(`Sidereal calculation for ${planetName} was not successful, retaining NaN values.`);
            }
        }

        const rahuData = results.sidereal.Rahu;
        if (rahuData && typeof rahuData.longitude === 'number' && !isNaN(rahuData.longitude)) {
            const ketuLongitude = normalizeAngle(rahuData.longitude + 180);
            const ketuNakDetails = getNakshatraDetails(ketuLongitude);
            const ketuRashiDetails = getRashiDetails(ketuLongitude);
            const ketuPada = calculateNakshatraPada(ketuLongitude);
            const ketuSubLordDetails = getSubLordDetails(ketuLongitude);
            const ketuPositionWithinNak = ketuLongitude - (ketuNakDetails.index * NAKSHATRA_SPAN);
            const ketuSubSubLordDetails = getSubSubLordDetails(ketuPositionWithinNak, ketuSubLordDetails);

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
                subSubLord: ketuSubSubLordDetails.lord,
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

        const sunLongitude = results.sidereal.Sun.longitude;
        const avasthas = calculateAvasthas(results.sidereal, sunLongitude);

        for (const planetName in results.sidereal) {
            if (avasthas[planetName]) {
                results.sidereal[planetName].avasthas = avasthas[planetName];
            }
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

        let isValidResult = houseResult &&
                            !houseResult.error &&
                            typeof houseResult.ascendant === 'number' &&
                            !isNaN(houseResult.ascendant) &&
                            Array.isArray(houseResult.house) &&
                            houseResult.house.length === 12;

        if (!isValidResult) {
            let failureReason = "Unknown reason";
            if (!houseResult) failureReason = "No result object returned.";
            else if (houseResult.error) failureReason = `Explicit error: ${houseResult.error}`;
            else if (typeof houseResult.ascendant !== 'number' || isNaN(houseResult.ascendant)) failureReason = `Invalid ascendant: ${houseResult.ascendant}`;
            else if (!Array.isArray(houseResult.house)) failureReason = `'house' is not an array: ${typeof houseResult.house}`;
            else if (houseResult.house.length !== 12) failureReason = `'house' array length is not 12: length ${houseResult.house.length}`;

            logger.error(`swisseph.swe_houses returned invalid result. Reason: ${failureReason}. Full result: ${JSON.stringify(houseResult)}`, {
                 jd: julianDayUT, lat: latitude, lon: longitude
            });

            const ascFallback = swisseph.swe_calc_ut(julianDayUT, swisseph.SE_ASC, 0);
            if (ascFallback && typeof ascFallback.longitude === 'number' && !isNaN(ascFallback.longitude)) {
                 logger.warn("swe_houses failed, using fallback Ascendant calculation. Cusps will be unavailable.");
                 return { tropicalAscendant: normalizeAngle(ascFallback.longitude), tropicalCusps: null };
            } else {
                 logger.error("swe_houses failed AND fallback Ascendant calculation failed.");
                 throw new Error("Failed to calculate valid house cusps and Ascendant.");
            }
        }

        const tropicalCusps = houseResult.house.map(c => normalizeAngle(c));
        const tropicalAscendant = normalizeAngle(houseResult.ascendant);

        if (tropicalCusps.some(isNaN) || isNaN(tropicalAscendant)) {
             logger.error("Calculated cusps or ascendant contain NaN values after processing.", { rawCusps: houseResult.house, rawAsc: houseResult.ascendant });
             throw new Error("Calculated cusps or ascendant contain NaN values after processing.");
        }

        return { tropicalAscendant, tropicalCusps };

    } catch (error) {
        logger.error(`Error during calculateHousesAndAscendant execution: ${error.message}`, { stack: error.stack });
        throw new Error(`Failed to calculate houses/ascendant: ${error.message}`);
    }
}


/**
 * Calculates aspects between planets.
 * @param {object} siderealPositions - Object containing sidereal positions { Sun: { longitude, ... }, ... }.
 * @returns {object} Object mapping each planet to an array of aspecting planets.
 */
export function calculateAspects(siderealPositions) { // Removed siderealCuspStartDegrees
    const directAspects = {};
    const reverseAspects = {};
    const conjunctions = {};

    const specialAspects = {
        'Mars': [4, 8],
        'Jupiter': [5, 9],
        'Saturn': [3, 10]
    };

    // Helper to get relative Rashi (sign)
    const getRelativeRashi = (startRashiIndex, relativeDistance) => {
        return (startRashiIndex + relativeDistance - 1) % 12; // Rashi index is 0-11
    };

    const planetRashiPlacements = {};
    PLANET_ORDER.forEach(pName => {
        const pData = siderealPositions[pName];
        if (pData && typeof pData.longitude === 'number' && !isNaN(pData.longitude)) {
            planetRashiPlacements[pName] = getRashiDetails(pData.longitude).index; // Use Rashi index
        }
        // Initialize all planets in the objects
        directAspects[pName] = [];
        reverseAspects[pName] = [];
        conjunctions[pName] = [];
    });

    // Group planets by Rashi
    const rashiPlanetGroups = {};
    for (const [planet, rashiIndex] of Object.entries(planetRashiPlacements)) {
        if (rashiIndex !== null) {
            if (!rashiPlanetGroups[rashiIndex]) {
                rashiPlanetGroups[rashiIndex] = [];
            }
            rashiPlanetGroups[rashiIndex].push(planet);
        }
    }

    // Determine conjunctions (planets in the same Rashi)
    for (const rashiIndex in rashiPlanetGroups) {
        const planetsInRashi = rashiPlanetGroups[rashiIndex];
        if (planetsInRashi.length > 1) {
            planetsInRashi.forEach(p1 => {
                planetsInRashi.forEach(p2 => {
                    if (p1 !== p2) {
                        conjunctions[p1].push(p2);
                    }
                });
            });
        }
    }

    // Determine aspects (Rashi-to-Rashi distances)
    PLANET_ORDER.forEach(planet1Name => {
        if (planet1Name === 'Rahu' || planet1Name === 'Ketu') {
            return;
        }
        const planet1Rashi = planetRashiPlacements[planet1Name];
        if (planet1Rashi === null || planet1Rashi === undefined) {
            return;
        }

        const aspectedRashis = new Set();
        aspectedRashis.add(getRelativeRashi(planet1Rashi, 7)); // 7th Rashi aspect

        if (specialAspects[planet1Name]) {
            specialAspects[planet1Name].forEach(distance => {
                aspectedRashis.add(getRelativeRashi(planet1Rashi, distance));
            });
        }

        PLANET_ORDER.forEach(planet2Name => {
            if (planet1Name === planet2Name) return;
            const planet2Rashi = planetRashiPlacements[planet2Name];
            if (planet2Rashi !== null && planet2Rashi !== undefined && aspectedRashis.has(planet2Rashi)) {
                directAspects[planet1Name].push(planet2Name);
                reverseAspects[planet2Name].push(planet1Name);
            }
        });
    });

    return { directAspects, reverseAspects, conjunctions };
}


/**
 * Calculates various planetary states (Avasthas).
 * @param {object} siderealPositions - Object containing sidereal positions { Sun: { longitude, rashi, ... }, ... }.
 * @param {number} sunLongitude - The sidereal longitude of the Sun.
 * @returns {object} Object mapping planet names to their calculated states.
 */
export function calculateAvasthas(siderealPositions, sunLongitude) {
    const avasthas = {};

    const combustionOrbs = {
        Moon: 12,
        Mercury: 14,
        Venus: 10,
        Mars: 17,
        Jupiter: 11,
        Saturn: 15
    };

    const planetStates = calculatePlanetStates(siderealPositions);

    for (const planetName in siderealPositions) {
        const planetData = siderealPositions[planetName];
        if (!planetData || !planetData.rashi || planetData.rashi === "N/A") {
            avasthas[planetName] = {
                isRetrograde: false,
                isCombust: false,
                dignity: "Unknown",
                balaadi: "Unknown",
                jagradadi: "Unknown",
                deeptaadi: "Unknown"
            };
            continue;
        }

        const isRetrograde = planetData.speedLongitude < 0;

        let isCombust = false;
        if (planetName !== 'Sun' && planetName !== 'Rahu' && planetName !== 'Ketu' && combustionOrbs[planetName]) {
            const diff = Math.abs(normalizeAngle(planetData.longitude - sunLongitude));
            if (diff < combustionOrbs[planetName] || diff > 360 - combustionOrbs[planetName]) {
                isCombust = true;
            }
        }

        const dignity = planetStates[planetName];

        const longitudeInRashi = normalizeAngle(planetData.longitude) % 30;
        const rashiIndex = getRashiDetails(planetData.longitude).index;
        let balaadi = 'Unknown';
        if (rashiIndex % 2 === 0) { // Odd signs
            if (longitudeInRashi < 6) balaadi = 'Bala';
            else if (longitudeInRashi < 12) balaadi = 'Kumara';
            else if (longitudeInRashi < 18) balaadi = 'Yuva';
            else if (longitudeInRashi < 24) balaadi = 'Vriddha';
            else balaadi = 'Mrita';
        } else { // Even signs
            if (longitudeInRashi < 6) balaadi = 'Mrita';
            else if (longitudeInRashi < 12) balaadi = 'Vriddha';
            else if (longitudeInRashi < 18) balaadi = 'Yuva';
            else if (longitudeInRashi < 24) balaadi = 'Kumara';
            else balaadi = 'Bala';
        }

        let jagradadi = 'Shayana';
        if (dignity === 'Own Sign' || dignity === 'Moolatrikona' || dignity === 'Exalted') {
            jagradadi = 'Jagrata';
        } else if (dignity === 'Friend') {
            jagradadi = 'Swapna';
        }
        
        let deeptaadi = 'Unknown';
        if (isCombust) {
            deeptaadi = 'Vikala';
        } else {
            switch (dignity) {
                case 'Exalted': deeptaadi = 'Deepta'; break;
                case 'Moolatrikona': deeptaadi = 'Swastha'; break;
                case 'Own Sign': deeptaadi = 'Pramudita'; break;
                case 'Friend': deeptaadi = 'Shanta'; break;
                case 'Neutral': deeptaadi = 'Deena'; break;
                case 'Enemy': deeptaadi = 'Dukḥita'; break;
                case 'Debilitated': deeptaadi = 'Khala'; break;
            }
        }

        avasthas[planetName] = {
            isRetrograde,
            isCombust,
            dignity,
            balaadi,
            jagradadi,
            deeptaadi
        };
    }
    return avasthas;
}

/**
 * Calculates basic planetary states (e.g., exaltation, debilitation, own sign, moolatrikona).
 * @param {object} siderealPositions - Object containing sidereal positions { Sun: { longitude, rashi, ... }, ... }.
 * @returns {object} Object mapping planet names to their calculated state string.
 */
export function calculatePlanetStates(siderealPositions) {
    const states = {};
    const stateRules = {
        Sun: { exalt: "Aries", debilitate: "Libra", own: ["Leo"], moolatrikona: "Leo" },
        Moon: { exalt: "Taurus", debilitate: "Scorpio", own: ["Cancer"], moolatrikona: "Taurus" },
        Mars: { exalt: "Capricorn", debilitate: "Cancer", own: ["Aries", "Scorpio"], moolatrikona: "Aries" },
        Mercury: { exalt: "Virgo", debilitate: "Pisces", own: ["Gemini", "Virgo"], moolatrikona: "Virgo" },
        Jupiter: { exalt: "Cancer", debilitate: "Capricorn", own: ["Sagittarius", "Pisces"], moolatrikona: "Sagittarius" },
        Venus: { exalt: "Pisces", debilitate: "Virgo", own: ["Taurus", "Libra"], moolatrikona: "Libra" },
        Saturn: { exalt: "Libra", debilitate: "Aries", own: ["Capricorn", "Aquarius"], moolatrikona: "Aquarius" },
        Rahu: { exalt: "Taurus", debilitate: "Scorpio", own: ["Aquarius"], moolatrikona: "Gemini" },
        Ketu: { exalt: "Scorpio", debilitate: "Taurus", own: ["Pisces"], moolatrikona: "Sagittarius" }
    };

    for (const planetName in siderealPositions) {
        const planetData = siderealPositions[planetName];
        if (!planetData || !planetData.rashi || planetData.rashi === "N/A") {
            states[planetName] = "Unknown";
            continue;
        }

        const rules = stateRules[planetName];
        if (!rules) {
            states[planetName] = "Standard";
            continue;
        }

        const rashi = planetData.rashi;
        let state = "Standard";

        if (rashi === rules.exalt) state = "Exalted";
        else if (rashi === rules.debilitate) state = "Debilitated";
        else if (rules.own.includes(rashi)) {
             if (rashi === rules.moolatrikona) state = "Moolatrikona";
             else state = "Own Sign";
        } else {
            const rashiLord = RASHI_LORDS[RASHIS.indexOf(rashi)];
            const relations = PLANETARY_RELATIONS[planetName];
            if (relations) {
                if (relations.friends.includes(rashiLord)) state = 'Friend';
                else if (relations.enemies.includes(rashiLord)) state = 'Enemy';
                else if (relations.neutrals.includes(rashiLord)) state = 'Neutral';
            }
        }

        states[planetName] = state;
    }
    return states;
}
export function getHouseOfPlanet(longitude, siderealCuspStartDegrees) {
    const normalizedLng = normalizeAngle(longitude);
    if (isNaN(normalizedLng) || !Array.isArray(siderealCuspStartDegrees) || siderealCuspStartDegrees.length !== 12 || siderealCuspStartDegrees.some(isNaN)) {
        // Log a warning if inputs are invalid, but don't use console.warn directly to avoid user frustration
        logger.warn(`Invalid input for getHouseOfPlanet: longitude=${longitude}, cusps=${siderealCuspStartDegrees}`);
        return null;
    }

    for (let i = 0; i < 12; i++) {
        const cuspStart = siderealCuspStartDegrees[i];
        const cuspEnd = siderealCuspStartDegrees[(i + 1) % 12];

        if (cuspStart < cuspEnd) { // Normal house span (e.g., 30 to 60)
            if (normalizedLng >= cuspStart && normalizedLng < cuspEnd) {
                return i + 1;
            }
        } else { // House span crosses 0/360 (e.g., 330 to 30)
            if (normalizedLng >= cuspStart || normalizedLng < cuspEnd) {
                return i + 1;
            }
        }
    }

    // If no house is found, it means the longitude doesn't fall into any defined range.
    // This could indicate an issue with the cusp data itself (gaps or overlaps).
    logger.warn(`Longitude ${longitude} did not fall into any house range based on cusps: ${siderealCuspStartDegrees}`);
    return null;
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

    const nakshatraStartLongitude = currentNakshatraIndex * NAKSHATRA_SPAN;

    const traversedDegreesInNakshatra = normalizedMoonLng - nakshatraStartLongitude;

    const remainingProportion = (NAKSHATRA_SPAN - traversedDegreesInNakshatra) / NAKSHATRA_SPAN;

    const balanceYears = remainingProportion * totalDashaYears;

    const years = Math.floor(balanceYears);
    const remainingAfterYears = balanceYears - years;
    const months = Math.floor(remainingAfterYears * 12);
    const remainingAfterMonths = remainingAfterYears * 12 - months;
    const days = Math.round(remainingAfterMonths * 30);

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

    if (!sunrise || !nextSunrise || !moment(sunrise).isValid() || !moment(nextSunrise).isValid()) {
        logger.warn(`Invalid sunrise or nextSunrise provided to getMoonNakshatraEntryExitTimes`);
        return { entryTime: null, exitTime: null };
    }

    const startOfAstrologicalDay = moment(sunrise);
    const endOfAstrologicalDay = moment(nextSunrise);

    let entryTime = null;
    let exitTime = null;

    const { julianDayUT: sunriseJD, momentLocal } = getJulianDateUT(startOfAstrologicalDay.toISOString(), latitude, longitude);
    let prevNakshatraIndex = -1;
    if (sunriseJD !== null) {
        const sunriseMoonLng = (await calculatePlanetaryPositions(sunriseJD))?.sidereal?.Moon?.longitude;
        if (sunriseMoonLng !== undefined && !isNaN(sunriseMoonLng)) {
            prevNakshatraIndex = getNakshatraDetails(sunriseMoonLng).index;
        }
    }

    if (prevNakshatraIndex === targetNakshatraIndex) {
        entryTime = startOfAstrologicalDay.toISOString();
    }

    const stepMinutes = 5;
    let currentMoment = startOfAstrologicalDay.clone();

    while (currentMoment.isSameOrBefore(endOfAstrologicalDay)) {
        const { julianDayUT, momentLocal: momentLocal1 } = getJulianDateUT(currentMoment.format("YYYY-MM-DDTHH:mm:ss"), latitude, longitude);
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

        if (entryTime === null && currentNakshatraIndex === targetNakshatraIndex && prevNakshatraIndex !== targetNakshatraIndex) {
            entryTime = await refineNakshatraTransitTime(
                currentMoment.clone().subtract(stepMinutes, 'minutes'),
                currentMoment.clone(),
                latitude,
                longitude,
                targetNakshatraIndex,
                'entry',
                10, 
                endOfAstrologicalDay.toISOString()
            );
        }
        if (exitTime === null && currentNakshatraIndex !== targetNakshatraIndex && prevNakshatraIndex === targetNakshatraIndex) {
            exitTime = await refineNakshatraTransitTime(
                currentMoment.clone().subtract(stepMinutes, 'minutes'),
                currentMoment.clone(),
                latitude,
                longitude,
                targetNakshatraIndex,
                'exit',
                10, 
                endOfAstrologicalDay.toISOString()
            );
        }

        prevNakshatraIndex = currentNakshatraIndex;
        currentMoment.add(stepMinutes, 'minutes');
    }

    if (exitTime === null && prevNakshatraIndex === targetNakshatraIndex) {
        exitTime = endOfAstrologicalDay.toISOString();
    }

    return { entryTime, exitTime, endOfAstrologicalDay: endOfAstrologicalDay.toISOString() };
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

    if (high.isAfter(endOfAstrologicalDay)) {
        high = endOfAstrologicalDay;
    }

    let preciseTime = null;

    for (let i = 0; i < iterations; i++) {
        const mid = low.clone().add(high.diff(low) / 2, 'milliseconds');
        const { julianDayUT, momentLocal: momentLocal2 } = getJulianDateUT(mid.format("YYYY-MM-DDTHH:mm:ss"), latitude, longitude);

        if (julianDayUT === null) {
            logger.warn(`Invalid JD during transit refinement at ${mid.toISOString()}`);
            return mid.toISOString();
        }

        const planetaryPositions = await calculatePlanetaryPositions(julianDayUT);
        const moonLongitude = planetaryPositions?.sidereal?.Moon?.longitude;

        if (moonLongitude === undefined || isNaN(moonLongitude)) {
            logger.warn(`Moon longitude not available during transit refinement at ${mid.toISOString()}`);
            return mid.toISOString();
        }

        const currentNakshatraIndex = getNakshatraDetails(moonLongitude).index;

        if (type === 'entry') {
            if (currentNakshatraIndex === targetNakshatraIndex) {
                preciseTime = mid;
                high = mid;
            } else {
                low = mid;
            }
        } else { 
            if (currentNakshatraIndex === targetNakshatraIndex) {
                low = mid;
            } else {
                preciseTime = mid;
                high = mid;
            }
        }
    }

    const finalTime = preciseTime || (type === 'entry' ? high : low);

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
        const { julianDayUT, momentLocal: momentLocal3 } = await import('./coreUtils.js').then(m => m.getJulianDateUT(dateString, latitude, longitude));
        if (julianDayUT === null) {
            throw new Error("Invalid date or location for Ruling Planets calculation.");
        }

        const rulingPlanets = new Set();

        const { tropicalAscendant, tropicalCusps } = calculateHousesAndAscendant(julianDayUT, latitude, longitude);
        const ayanamsa = calculateAyanamsa(julianDayUT);
        const siderealAscendantDeg = normalizeAngle(tropicalAscendant - ayanamsa);
        const ascendantRashiDetails = getRashiDetails(siderealAscendantDeg);
        if (ascendantRashiDetails && ascendantRashiDetails.lord) {
            rulingPlanets.add(ascendantRashiDetails.lord);
        }

        const planetaryPositions = await calculatePlanetaryPositions(julianDayUT);
        const moonData = planetaryPositions.sidereal.Moon;
        if (moonData && moonData.rashiLord) {
            rulingPlanets.add(moonData.rashiLord);
        }

        if (moonData && moonData.nakLord) {
            rulingPlanets.add(moonData.nakLord);
        }

        if (moonData && moonData.subLord) {
            rulingPlanets.add(moonData.subLord);
        }

        const date = new Date(dateString);
        const dayOfWeek = date.getDay();
        const dayLord = WEEKDAY_LORDS[dayOfWeek];
        if (dayLord) {
            rulingPlanets.add(dayLord);
        }

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

    const ascRashiIndex = ascRashiDetails.index;

    const movableSigns = [0, 3, 6, 9];
    const fixedSigns = [1, 4, 7, 10];

    let badhakHouseNumber;

    if (movableSigns.includes(ascRashiIndex)) {
        badhakHouseNumber = 11;
    } else if (fixedSigns.includes(ascRashiIndex)) {
        badhakHouseNumber = 9;
    } else { 
        badhakHouseNumber = 7;
    }

    const badhakSignIndex = (ascRashiIndex + badhakHouseNumber - 1) % 12;
    const badhakSign = RASHIS[badhakSignIndex];
    const badhakesh = RASHI_LORDS[badhakSignIndex];

   
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

    const secondLord = housesData[1]?.start_rashi_lord;
    const seventhLord = housesData[6]?.start_rashi_lord;
    const eighthLord = housesData[7]?.start_rashi_lord;

    if (!secondLord || !seventhLord || !eighthLord) {
        logger.warn("Cannot calculate longevity factors: Missing lord data for 2nd, 7th, or 8th house.");
        return { error: "Missing house lord data." };
    }

    const marakaLords = [...new Set([secondLord, seventhLord])];

    return { marakaLords, secondLord, seventhLord, eighthLord };
}



/**
 * Gets all houses signified by a planet according to KP astrology rules.
 * A planet signifies: house it's in, houses it owns, house its Nakshatra lord is in, houses its Nakshatra lord owns.
 * @param {string} planetName - The name of the planet.
 * @param {object} siderealPositions - The complete object of sidereal planetary positions.
 * @param {number[]} siderealCuspStartDegrees - Array of 12 sidereal cusp start degrees.
 * @returns {number[]} A sorted array of unique house numbers signified by the planet.
 */
export function getKpSignificatorsForPlanet(planetName, siderealPositions, siderealCuspStartDegrees) {
    const significations = new Set();

    const planetData = siderealPositions[planetName];
    if (!planetData || isNaN(planetData.longitude)) {
        logger.warn(`[Longevity] Skipping significators for ${planetName}: missing position data.`);
        return [];
    }

    const occupiedHouse = getHouseOfPlanet(planetData.longitude, siderealCuspStartDegrees);
    if (occupiedHouse !== null) significations.add(occupiedHouse);

    if (planetName !== 'Rahu' && planetName !== 'Ketu') {
        const ownedHouses = getHousesRuledByPlanet(planetName, siderealCuspStartDegrees);
        ownedHouses.forEach(h => significations.add(h));
    }

    const nakLordName = planetData.nakLord;
    if (nakLordName && nakLordName !== "N/A" && nakLordName !== "Error") {
        const nakLordData = siderealPositions[nakLordName];
        if (nakLordData && !isNaN(nakLordData.longitude)) {
            const nlOccupiedHouse = getHouseOfPlanet(nakLordData.longitude, siderealCuspStartDegrees);
            if (nlOccupiedHouse !== null) significations.add(nlOccupiedHouse);

            if (nakLordName !== 'Rahu' && nakLordName !== 'Ketu') {
                const nlOwnedHouses = getHousesRuledByPlanet(nakLordName, siderealCuspStartDegrees);
                nlOwnedHouses.forEach(h => significations.add(h));
            }
        } else {
             logger.warn(`[Longevity] Could not find position data for Nakshatra Lord: ${nakLordName}`);
        }
    }

    return Array.from(significations).sort((a, b) => a - b);
}

/**
 * Calculates longevity based on a house scoring method.
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
        const signifiedHouses = getKpSignificatorsForPlanet(planetName, siderealPositions, siderealCuspStartDegrees);

        for (const house of signifiedHouses) {
            if (lifeIncreasingHouses.includes(house)) {
                scoreA++;
            } else if (uniqueDeathHouses.includes(house)) {
                scoreB++;
            }
        }
    }

    const totalScore = scoreA + scoreB;
    if (totalScore === 0) return { longevity: 0, scoreA, scoreB, reason: "Indeterminate" };
    const longevity = (scoreA / totalScore) * 120;
    return { longevity: parseFloat(longevity.toFixed(2)), scoreA, scoreB };
}

/**
 * Calculates the Dasha periods based on Vimshottari Dasha system.
 * @param {object} birthChartData - The main chart data object containing date, time, location, and planetary positions.
 * @returns {Array<object>} An array of Dasha period objects.
 */
export function calculateDashaPeriods(birthChartData) {
    const { date, latitude, longitude } = birthChartData;
    const moonLongitude = birthChartData.planetaryPositions.sidereal.Moon.longitude;

    if (isNaN(moonLongitude)) {
        logger.error("Cannot calculate Dasha periods: Moon longitude is not available.");
        return [];
    }

    const dashaBalance = calculateVimshottariDashaBalance(moonLongitude);
    if (dashaBalance.lord === "Error") {
        logger.error("Cannot calculate Dasha periods: Failed to get Dasha balance.");
        return [];
    }

    const dashaPeriods = [];
    let currentDashaLord = dashaBalance.lord;
    let currentDashaLordIndex = VIMS_DASHA_SEQUENCE.indexOf(currentDashaLord);
    let currentDashaStartDate = moment(date);

    const firstDashaEndDate = currentDashaStartDate.clone().add(dashaBalance.balanceYears * 365.25, 'days');
    dashaPeriods.push({
        lord: currentDashaLord,
        startDate: currentDashaStartDate.format('YYYY-MM-DD'),
        endDate: firstDashaEndDate.format('YYYY-MM-DD'),
        type: 'MahaDasha'
    });

    let dashaCount = 0;
    while (dashaCount < 10) {
        currentDashaLordIndex = (currentDashaLordIndex + 1) % VIMS_DASHA_SEQUENCE.length;
        currentDashaLord = VIMS_DASHA_SEQUENCE[currentDashaLordIndex];
        const dashaDuration = VIMS_DASHA_YEARS[currentDashaLord];

        const dashaStartDate = dashaPeriods[dashaPeriods.length - 1].endDate;
        const dashaEndDate = moment(dashaStartDate).add(dashaDuration, 'years');

        dashaPeriods.push({
            lord: currentDashaLord,
            startDate: moment(dashaStartDate).format('YYYY-MM-DD'),
            endDate: dashaEndDate.format('YYYY-MM-DD'),
            type: 'MahaDasha'
        });
        dashaCount++;
    }

    return dashaPeriods;
}

export async function findNextNakshatraChange(startTime, latitude, longitude) {
    const startMoment = moment(startTime);
    const { julianDayUT: startJD } = getJulianDateUT(startMoment.toISOString(), latitude, longitude);
    if (!startJD) return null;

    const startMoonLng = (await calculatePlanetaryPositions(startJD))?.sidereal?.Moon?.longitude;
    if (startMoonLng === undefined || isNaN(startMoonLng)) return null;

    const startNakshatraIndex = getNakshatraDetails(startMoonLng).index;

    let currentMoment = startMoment.clone();
    const stepMinutes = 30;

    for (let i = 0; i < 48; i++) { // Search for up to 24 hours
        currentMoment.add(stepMinutes, 'minutes');
        const { julianDayUT } = getJulianDateUT(currentMoment.toISOString(), latitude, longitude);
        if (!julianDayUT) continue;

        const planetaryPositions = await calculatePlanetaryPositions(julianDayUT);
        const moonLongitude = planetaryPositions?.sidereal?.Moon?.longitude;
        if (moonLongitude === undefined || isNaN(moonLongitude)) continue;

        const currentNakshatraIndex = getNakshatraDetails(moonLongitude).index;

        if (currentNakshatraIndex !== startNakshatraIndex) {
            return refineNakshatraTransitTime(
                currentMoment.clone().subtract(stepMinutes, 'minutes'),
                currentMoment,
                latitude,
                longitude,
                startNakshatraIndex,
                'exit',
                10,
                currentMoment.toISOString()
            );
        }
    }

    return null; // Not found within 24 hours
}

/**
 * Calculates Abhijit Muhurta for a given day.
 * @param {moment.Moment} sunrise - The moment object for sunrise.
 * @param {number} dayDurationMs - The duration of the day in milliseconds.
 * @returns {Object|null} Abhijit Muhurta details or null.
 */
export function calculateAbhijitMuhurta(sunrise, dayDurationMs) {
    try {
        const midday = sunrise.clone().add(dayDurationMs / 2, 'milliseconds');
        const abhijitStart = midday.clone().subtract(24, 'minutes');
        const abhijitEnd = midday.clone().add(24, 'minutes');

        return {
            name: "Abhijit Muhurta",
            start: abhijitStart.toISOString(), end: abhijitEnd.toISOString(),
            type: "auspicious",
            description: "A generally auspicious period around midday, ideal for starting new ventures."
        };
    } catch (error) {
        logger.error(`Error calculating Abhijit Muhurta: ${error.message}`, { stack: error.stack });
        return null;
    }
}

/**
 * Calculates Varjyam for a given date and location.
 * @param {string} dateString - Local date string for context.
 * @param {number} latitude - Observer's latitude.
 * @param {number} longitude - Observer's longitude.
 * @param {moment.Moment} sunrise - The moment object for sunrise.
 * @param {moment.Moment} nextSunrise - The moment object for the next day's sunrise.
 * @returns {Promise<Object|null>} Varjyam details or null.
 */
export async function calculateVarjyam(dateString, latitude, longitude, sunrise, nextSunrise) {
    try {
        const { julianDayUT } = getJulianDateUT(dateString, latitude, longitude);
        if (julianDayUT === null) throw new Error("Could not get Julian Day for Varjyam.");

        const planetaryPositions = await calculatePlanetaryPositions(julianDayUT);
        const moonLongitude = planetaryPositions?.sidereal?.Moon?.longitude;
        if (moonLongitude === undefined || isNaN(moonLongitude)) throw new Error("Moon longitude unavailable.");

        const nakshatraDetails = getNakshatraDetails(moonLongitude);
        const nakshatraName = nakshatraDetails.name;
        const nakshatraIndex = nakshatraDetails.index;

        const varjyamStartFraction = VARJYAM_START_FRACTION[nakshatraName];
        if (varjyamStartFraction === undefined) return null; // Not all nakshatras have Varjyam

        const { entryTime, exitTime } = await getMoonNakshatraEntryExitTimes(dateString, latitude, longitude, nakshatraIndex, sunrise, nextSunrise);
        if (!entryTime || !exitTime) throw new Error("Could not determine Nakshatra entry/exit times.");

        const nakshatraDurationMs = moment(exitTime).diff(moment(entryTime));
        const varjyamDurationMs = nakshatraDurationMs / 15; // Varjyam duration is 1/15th of Nakshatra duration
        const varjyamStartMsOffset = varjyamStartFraction * nakshatraDurationMs;

        const varjyamStart = moment(entryTime).add(varjyamStartMsOffset, 'milliseconds');
        const varjyamEnd = varjyamStart.clone().add(varjyamDurationMs, 'milliseconds');

        return {
            name: "Varjyam",
            start: varjyamStart.toISOString(), end: varjyamEnd.toISOString(),
            type: "inauspicious", description: `An inauspicious period within ${nakshatraName} Nakshatra.`
        };
    } catch (error) {
        logger.error(`Error calculating Varjyam: ${error.message}`, { stack: error.stack });
        return null;
    }
}
