// utils/muhurtaUtils.js
import { normalizeAngle, getJulianDateUT, calculateAyanamsa, convertToDMS } from './coreUtils.js';
import { calculateHousesAndAscendant } from './coreUtils.js';
import { getNakshatraDetails, getRashiDetails, calculatePlanetaryPositions, getMoonNakshatraEntryExitTimes } from './planetaryUtils.js';
import { calculateSunMoonTimes } from './panchangUtils.js';
import { WEEKDAY_LORDS, PLANET_ORDER, RASHIS, RASHI_LORDS } from './constants.js';
import { calculateMoolDosha } from './doshaUtils.js';
import logger from './logger.js';
import moment from 'moment-timezone';

// --- Choghadiya Calculation ---
const CHOGHADIYA_TYPES = {
    day: [
        { name: "Udweg", lord: "Sun", type: "inauspicious" },
        { name: "Char", lord: "Venus", type: "auspicious" },
        { name: "Labh", lord: "Mercury", type: "auspicious" },
        { name: "Amrit", lord: "Moon", type: "auspicious" },
        { name: "Kaal", lord: "Saturn", type: "inauspicious" },
        { name: "Shubh", lord: "Jupiter", type: "auspicious" },
        { name: "Rog", lord: "Mars", type: "inauspicious" },
    ],
    night: [
        { name: "Amrit", lord: "Moon", type: "auspicious" },
        { name: "Char", lord: "Venus", type: "auspicious" },
        { name: "Rog", lord: "Mars", type: "inauspicious" },
        { name: "Kaal", lord: "Saturn", type: "inauspicious" },
        { name: "Labh", lord: "Mercury", type: "auspicious" },
        { name: "Udweg", lord: "Sun", type: "inauspicious" },
        { name: "Shubh", lord: "Jupiter", type: "auspicious" },
    ]
};

/**
 * Calculates Choghadiya for a given date, time, and location.
 * @param {string} dateString - Local date string (YYYY-MM-DDTHH:MM:SS).
 * @param {number} latitude - Observer's latitude.
 * @param {number} longitude - Observer's longitude.
 * @returns {Array<Object>} Array of Choghadiya periods for the day.
 */
export async function calculateChoghadiya(sunrise, sunset, nextSunrise, dayDurationMs, nightDurationMs, dayOfWeek) {
    try {
        const dayChoghadiyaDurationMs = dayDurationMs / 8;
        const nightChoghadiyaDurationMs = nightDurationMs / 8;

        const choghadiyas = [];

        // Day Choghadiyas
        let currentChoghadiyaStart = sunrise.clone();
        const dayChoghadiyaSequence = [...CHOGHADIYA_TYPES.day];
        // Rotate sequence based on day of week (Sun starts with Udweg, Mon with Amrit, etc.)
        const startIndexDay = dayOfWeek; // Sunday is 0, Udweg is 0 in array
        const rotatedDaySequence = dayChoghadiyaSequence.slice(startIndexDay).concat(dayChoghadiyaSequence.slice(0, startIndexDay));
        rotatedDaySequence.push(rotatedDaySequence[0]); // The 8th Choghadiya is a repeat of the first

        for (let i = 0; i < 8; i++) {
            const choghadiya = rotatedDaySequence[i];
            const end = currentChoghadiyaStart.clone().add(dayChoghadiyaDurationMs, 'milliseconds');
            choghadiyas.push({
                type: "Day",
                name: choghadiya.name,
                lord: choghadiya.lord,
                periodType: choghadiya.type,
                start: currentChoghadiyaStart.toISOString(),
                end: end.toISOString(),
            });
            currentChoghadiyaStart = end;
        }

        // Night Choghadiyas
        let currentNightChoghadiyaStart = sunset.clone();
        const nightChoghadiyaSequence = [...CHOGHADIYA_TYPES.night];
        // Rotate sequence based on day of week (Mon night starts with Amrit, Tue night with Char, etc.)
        // Night sequence starts from the lord of the 5th choghadiya of the day
        const startIndexNight = (dayOfWeek + 4) % 7;

        // Create the 8-element rotated sequence
        const rotatedNightSequence = [];
        for (let i = 0; i < 7; i++) {
            rotatedNightSequence.push(nightChoghadiyaSequence[(startIndexNight + i) % 7]);
        }
        rotatedNightSequence.push(rotatedNightSequence[0]); // The 8th Choghadiya is a repeat of the first

        for (let i = 0; i < 8; i++) {
            const choghadiya = rotatedNightSequence[i];
            let end;
            if (i === 7) {
                end = nextSunrise.clone();
            } else {
                end = currentNightChoghadiyaStart.clone().add(nightChoghadiyaDurationMs, 'milliseconds');
            }

            choghadiyas.push({
                type: "Night",
                name: choghadiya.name,
                lord: choghadiya.lord,
                periodType: choghadiya.type,
                start: currentNightChoghadiyaStart.toISOString(),
                end: end.toISOString(),
            });
            currentNightChoghadiyaStart = end;
        }

        return choghadiyas;

    } catch (error) {
        logger.error(`Error calculating Choghadiya for ${dateString}: ${error.message}`, { stack: error.stack });
        throw new Error(`Failed to calculate Choghadiya: ${error.message}`);
    }
}

// --- Hora Calculation ---
const HORA_SEQUENCE = [
    "Saturn", "Jupiter", "Mars", "Sun", "Venus", "Mercury", "Moon"
];

/**
 * Calculates Horas for a given date, time, and location.
 * @param {string} dateString - Local date string (YYYY-MM-DDTHH:MM:SS).
 * @param {number} latitude - Observer's latitude.
 * @param {number} longitude - Observer's longitude.
 * @returns {Array<Object>} Array of Hora periods for the day.
 */
export async function calculateHora(sunrise, sunset, nextSunrise, dayDurationMs, nightDurationMs, dayOfWeek) {
    try {
        const dayHoraDurationMs = dayDurationMs / 12;
        const nightHoraDurationMs = nightDurationMs / 12;

        const horas = [];

        // Determine the starting Hora lord for the day
        const dayLord = WEEKDAY_LORDS[dayOfWeek];
        const startIndex = HORA_SEQUENCE.indexOf(dayLord);
        if (startIndex === -1) {
            throw new Error(`Day lord ${dayLord} not found in Hora sequence.`);
        }

        // Day Horas
        let currentHoraStart = sunrise.clone();
        for (let i = 0; i < 12; i++) {
            const horaLord = HORA_SEQUENCE[(startIndex + i) % HORA_SEQUENCE.length];
            const end = currentHoraStart.clone().add(dayHoraDurationMs, 'milliseconds');
            horas.push({
                type: "Day",
                lord: horaLord,
                start: currentHoraStart.toISOString(),
                end: end.toISOString(),
            });
            currentHoraStart = end;
        }

        // Night Horas
        // The first Hora of the night is the 5th lord from the day's first Hora lord
        const nightStartIndex = (startIndex + 5) % HORA_SEQUENCE.length;
        let currentNightHoraStart = sunset.clone();
        for (let i = 0; i < 11; i++) { // Loop for first 11 horas
            const horaLord = HORA_SEQUENCE[(nightStartIndex + i) % HORA_SEQUENCE.length];
            const end = currentNightHoraStart.clone().add(nightHoraDurationMs, 'milliseconds');
            horas.push({
                type: "Night",
                lord: horaLord,
                start: currentNightHoraStart.toISOString(),
                end: end.toISOString(),
            });
            currentNightHoraStart = end;
        }

        // Add the 12th (last) Hora, ensuring it ends at nextSunrise
        const lastNightHoraLord = HORA_SEQUENCE[(nightStartIndex + 11) % HORA_SEQUENCE.length];
        horas.push({
            type: "Night",
            lord: lastNightHoraLord,
            start: currentNightHoraStart.toISOString(),
            end: nextSunrise.toISOString(),
        });

      
        return horas;

    } catch (error) {
        logger.error(`Error calculating Hora for ${dateString}: ${error.message}`, { stack: error.stack });
        throw new Error(`Failed to calculate Hora: ${error.message}`);
    }
}

// --- Lagna (Ascendant) Calculation for the day ---
/**
 * Calculates Lagna (Ascendant) for each hour of a given day.
 * @param {string} dateString - Local date string (YYYY-MM-DDTHH:MM:SS).
 * @param {number} latitude - Observer's latitude.
 * @param {number} longitude - Observer's longitude.
 * @returns {Array<Object>} Array of Lagna details for each hour.
 */
export async function calculateLagnasForDay(latitude, longitude, sunrise, nextSunrise) {
    try {
        const lagnas = [];

        if (!sunrise || !sunrise.isValid() || !nextSunrise || !nextSunrise.isValid()) {
            logger.warn(`Invalid sunrise or nextSunrise provided for Lagna calculation.`);
            return [];
        }

        let currentMoment = sunrise.clone();
        let lastRashi = null;

        while (currentMoment.isBefore(nextSunrise)) {
            const { julianDayUT } = getJulianDateUT(currentMoment.toISOString(), latitude, longitude);

            if (julianDayUT === null) {
                currentMoment.add(1, 'minute');
                continue;
            }

            const ayanamsa = calculateAyanamsa(julianDayUT);
            const { tropicalAscendant } = calculateHousesAndAscendant(julianDayUT, latitude, longitude);
            const siderealAscendantDeg = normalizeAngle(tropicalAscendant - ayanamsa);
            const rashiDetails = getRashiDetails(siderealAscendantDeg);

            if (lastRashi && rashiDetails.name !== lastRashi.rashi) {
                if (lagnas.length > 0) {
                    lagnas[lagnas.length - 1].end_time = currentMoment.toISOString();
                }
                lagnas.push({
                    start_time: currentMoment.toISOString(),
                    rashi: rashiDetails.name,
                    rashiLord: rashiDetails.lord,
                });
            } else if (!lastRashi) {
                lagnas.push({
                    start_time: currentMoment.toISOString(),
                    rashi: rashiDetails.name,
                    rashiLord: rashiDetails.lord,
                });
            }

            lastRashi = {
                rashi: rashiDetails.name,
                rashiLord: rashiDetails.lord,
            };

            currentMoment.add(1, 'minute');
        }

        if (lagnas.length > 0) {
            lagnas[lagnas.length - 1].end_time = nextSunrise.toISOString();
        }

        return lagnas;
    } catch (error) {
        logger.error(`Error calculating Lagnas for day: ${error.message}`, { stack: error.stack });
        throw new Error(`Failed to calculate Lagnas: ${error.message}`);
    }
}

// --- Muhurta Calculation (Placeholder for now) ---
/**
 * Placeholder for Muhurta calculation. This is a complex topic and will require
 * detailed rules for various types of Muhurtas.
 * @param {string} dateString - Local date string (YYYY-MM-DDTHH:MM:SS).
 * @param {number} latitude - Observer's latitude.
 * @param {number} longitude - Observer's longitude.
 * @returns {Array<Object>} Placeholder for Muhurta periods.
 */
/**
 * Calculates Abhijit Muhurta for a given date and location.
 * Abhijit Muhurta is typically the 48-minute period centered around local apparent noon.
 * It is generally considered auspicious.
 * @param {string} dateString - Local date string (YYYY-MM-DDTHH:MM:SS).
 * @param {number} latitude - Observer's latitude.
 * @param {number} longitude - Observer's longitude.
 * @returns {Object|null} Abhijit Muhurta details or null if not calculable.
 */
export async function calculateAbhijitMuhurta(sunrise, sunset, dayDurationMs) {
    try {
        if (!sunrise || !sunset || !sunrise.isValid() || !sunset.isValid()) {
            logger.warn(`Sunrise/Sunset not available for Abhijit Muhurta calculation.`);
            return null;
        }

        const midday = sunrise.clone().add(dayDurationMs / 2, 'milliseconds');

        const abhijitStart = midday.clone().subtract(24, 'minutes');
        const abhijitEnd = midday.clone().add(24, 'minutes');

        return {
            name: "Abhijit Muhurta",
            start: abhijitStart.toISOString(),
            end: abhijitEnd.toISOString(),
            type: "auspicious",
            description: "A generally auspicious period around midday, ideal for starting new ventures."
        };
    } catch (error) {
        logger.error(`Error calculating Abhijit Muhurta for ${dateString}: ${error.message}`, { stack: error.stack });
        return null;
    }
}

// --- 
//  Kaal Constants ---
// Rahu Kaal Muhurta index for each day (0-indexed, where Sunday is 0)
const RAHU_KAAL_MUHURTA_INDEX = {
    0: 7, // Sunday: 8th Muhurta
    1: 1, // Monday: 2nd Muhurta
    2: 6, // Tuesday: 7th Muhurta
    3: 4, // Wednesday: 5th Muhurta
    4: 5, // Thursday: 6th Muhurta
    5: 3, // Friday: 4th Muhurta
    6: 2  // Saturday: 3rd Muhurta
};

/**
 * Calculates Rahu Kaal for a given date and location.
 * Rahu Kaal is an inauspicious period to avoid new beginnings.
 * @param {string} dateString - Local date string (YYYY-MM-DDTHH:MM:SS).
 * @param {number} latitude - Observer's latitude.
 * @param {number} longitude - Observer's longitude.
 * @returns {Object|null} Rahu Kaal details or null if not calculable.
 */
export async function calculateRahuKaal(sunrise, sunset, dayDurationMs, dayOfWeek) {
    try {
        if (!sunrise || !sunset || !sunrise.isValid() || !sunset.isValid()) {
            logger.warn(`Sunrise/Sunset not available for Rahu Kaal calculation.`);
            return null;
        }

        const muhurtaDurationMs = dayDurationMs / 8; // Day divided into 8 Muhurtas

        const rahuKaalMuhurtaIndex = RAHU_KAAL_MUHURTA_INDEX[dayOfWeek];

        if (rahuKaalMuhurtaIndex === undefined) {
            logger.error(`Invalid day of week for Rahu Kaal calculation: ${dayOfWeek}`);
            return null;
        }

        const rahuKaalStart = sunrise.clone().add(rahuKaalMuhurtaIndex * muhurtaDurationMs, 'milliseconds');
        const rahuKaalEnd = rahuKaalStart.clone().add(muhurtaDurationMs, 'milliseconds');

        return {
            name: "Rahu Kaal",
            start: rahuKaalStart.toISOString(),
            end: rahuKaalEnd.toISOString(),
            type: "inauspicious",
            description: "An inauspicious period to avoid new beginnings, travel, or important decisions."
        };
    } catch (error) {
        logger.error(`Error calculating Rahu Kaal for ${dateString}: ${error.message}`, { stack: error.stack });
        return null;
    }
}

// --- Dur Muhurta Constants ---
// 1-based indices of Dur Muhurta for each day of the week (0=Sun)
const DUR_MUHURTA_INDICES = {
    0: [8],       // Sunday: 8th
    1: [6, 11],   // Monday: 6th, 11th
    2: [4, 12],   // Tuesday: 4th, 12th
    3: [8],       // Wednesday: 8th
    4: [2, 11],   // Thursday: 2nd, 11th
    5: [4, 8],    // Friday: 4th, 8th
    6: [1]        // Saturday: 1st
};

/**
 * Calculates Dur Muhurta for a given date and location.
 * Dur Muhurta is an inauspicious period.
 * @param {string} dateString - Local date string (YYYY-MM-DDTHH:MM:SS).
 * @param {number} latitude - Observer's latitude.
 * @param {number} longitude - Observer's longitude.
 * @returns {Array} An array of Dur Muhurta period objects, or an empty array on error.
 */
export async function calculateDurMuhurta(sunrise, sunset, dayDurationMs, dayOfWeek) {
    try {
        if (!sunrise || !sunset || !sunrise.isValid() || !sunset.isValid()) {
            logger.warn(`Sunrise/Sunset not available for Dur Muhurta calculation.`);
            return [];
        }

        const muhurtaDurationMs = dayDurationMs / 15; // Day is divided into 15 muhurtas
        const durMuhurtaIndices = DUR_MUHURTA_INDICES[dayOfWeek];

        if (!durMuhurtaIndices || durMuhurtaIndices.length === 0) {
            logger.warn(`No Dur Muhurta defined for day of week: ${dayOfWeek}`);
            return [];
        }

        const calculatedDurMuhurtas = durMuhurtaIndices.map((muhurtaIndex, i) => {
            // muhurtaIndex is 1-based, so subtract 1 for 0-based calculation
            const zeroBasedIndex = muhurtaIndex - 1;
            const startMoment = sunrise.clone().add(zeroBasedIndex * muhurtaDurationMs, 'milliseconds');
            const endMoment = startMoment.clone().add(muhurtaDurationMs, 'milliseconds');

            // Generate a unique name if there are multiple Dur Muhurtas on a day
            const name = durMuhurtaIndices.length > 1
                ? `Dur Muhurta ${i + 1}`
                : "Dur Muhurta";

            return {
                name: name,
                start: startMoment.toISOString(),
                end: endMoment.toISOString(),
                type: "inauspicious",
                description: "An inauspicious period. Avoid important activities."
            };
        });

        return calculatedDurMuhurtas;

    } catch (error) {
        logger.error(`Error calculating Dur Muhurta for ${dateString}: ${error.message}`, { stack: error.stack });
        return []; // Return empty array on error
    }
}

// --- Guli Kaal Constants ---
const GULI_KAAL_DAY_SEGMENT_INDEX = {
    0: 6, // Sunday: 7th segment
    1: 5, // Monday: 6th segment
    2: 4, // Tuesday: 5th segment
    3: 3, // Wednesday: 4th segment
    4: 2, // Thursday: 3rd segment
    5: 1, // Friday: 2nd segment
    6: 0  // Saturday: 1st segment
};

const GULI_KAAL_NIGHT_SEGMENT_INDEX = {
    0: 2, // Sunday Night: 3rd segment
    1: 1, // Monday Night: 2nd segment
    2: 0, // Tuesday Night: 1st segment
    3: 6, // Wednesday Night: 7th segment
    4: 5, // Thursday Night: 6th segment
    5: 4, // Friday Night: 5th segment
    6: 3  // Saturday Night: 4th segment
};


/**
 * Calculates Guli Kaal for a given date and location.
 * Guli Kaal is an inauspicious period.
 * @param {string} dateString - Local date string (YYYY-MM-DDTHH:MM:SS).
 * @param {number} latitude - Observer's latitude.
 * @param {number} longitude - Observer's longitude.
 * @returns {Object|null} Guli Kaal details or null if not calculable.
 */
export async function calculateGuliKaal(sunrise, sunset, nextSunrise, dayDurationMs, nightDurationMs, dayOfWeek) {
    try {
        if (!sunrise || !sunset || !nextSunrise || !sunrise.isValid() || !sunset.isValid() || !nextSunrise.isValid()) {
            logger.warn(`Sunrise/Sunset/NextSunrise not available for Guli Kaal calculation.`);
            return []; // Return empty array
        }

        const daySegmentDurationMs = dayDurationMs / 8;
        const nightSegmentDurationMs = nightDurationMs / 8;

        // Guli Kaal segment index for each day (0-indexed)
        const guliKaalDaySegmentIndex = GULI_KAAL_DAY_SEGMENT_INDEX[dayOfWeek];
        const guliKaalNightSegmentIndex = GULI_KAAL_NIGHT_SEGMENT_INDEX[dayOfWeek];

        const guliKaals = [];

        // Day Guli Kaal
        if (guliKaalDaySegmentIndex !== undefined) {
            const guliKaalStart = sunrise.clone().add(guliKaalDaySegmentIndex * daySegmentDurationMs, 'milliseconds');
            const guliKaalEnd = guliKaalStart.clone().add(daySegmentDurationMs, 'milliseconds');
            guliKaals.push({
                name: "Guli Kaal (Day)",
                start: guliKaalStart.toISOString(),
                end: guliKaalEnd.toISOString(),
                type: "inauspicious",
                description: "An inauspicious period; actions performed during this time tend to repeat."
            });
        }

        // Night Guli Kaal
        if (guliKaalNightSegmentIndex !== undefined) {
            const guliKaalNightStart = sunset.clone().add(guliKaalNightSegmentIndex * nightSegmentDurationMs, 'milliseconds');
            const guliKaalNightEnd = guliKaalNightStart.clone().add(nightSegmentDurationMs, 'milliseconds');
            guliKaals.push({
                name: "Guli Kaal (Night)",
                start: guliKaalNightStart.toISOString(),
                end: guliKaalNightEnd.toISOString(),
                type: "inauspicious",
                description: "An inauspicious period during the night."
            });
        }

        return guliKaals;

    } catch (error) {
        logger.error(`Error calculating Guli Kaal for ${dateString}: ${error.message}`, { stack: error.stack });
        return []; // Return empty array on error
    }
}

/**
 * Calculates Yam Ghanta for a given date and location.
 * Yam Ghanta is an inauspicious period.
 * @param {string} dateString - Local date string (YYYY-MM-DDTHH:MM:SS).
 * @param {number} latitude - Observer's latitude.
 * @param {number} longitude - Observer's longitude.
 * @returns {Object|null} Yam Ghanta details or null if not calculable.
 */
export async function calculateYamGhanta(sunrise, sunset, dayDurationMs, dayOfWeek) {
    try {
        if (!sunrise || !sunset || !sunrise.isValid() || !sunset.isValid()) {
            logger.warn(`Sunrise/Sunset not available for Yam Ghanta calculation.`);
            return null;
        }

        const segmentDurationMs = dayDurationMs / 8;

        // Planetary rulership sequence for segments: Sun, Moon, Mars, Mercury, Jupiter, Venus, Saturn
        const planetarySequence = ["Sun", "Moon", "Mars", "Mercury", "Jupiter", "Venus", "Saturn"];
        const weekdayLord = WEEKDAY_LORDS[dayOfWeek]; // WEEKDAY_LORDS is defined in constants.js

        // Determine the starting planet for the day's segments
        const startIndex = planetarySequence.indexOf(weekdayLord);
        if (startIndex === -1) {
            logger.error(`Day lord ${weekdayLord} not found in planetary sequence for Yam Ghanta.`);
            return null;
        }

        // Find Jupiter's position in the sequence relative to the starting planet
        let jupiterIndex = -1;
        for (let i = 0; i < 8; i++) { // Iterate through 8 segments
            const currentPlanet = planetarySequence[(startIndex + i) % planetarySequence.length];
            if (currentPlanet === "Jupiter") {
                jupiterIndex = i;
                break;
            }
        }

        if (jupiterIndex === -1) {
            logger.error("Jupiter not found in Yam Ghanta sequence, this should not happen.");
            return null;
        }

        const yamGhantaStart = sunrise.clone().add(jupiterIndex * segmentDurationMs, 'milliseconds');
        const yamGhantaEnd = yamGhantaStart.clone().add(segmentDurationMs, 'milliseconds');

        return {
            name: "Yam Ghanta",
            start: yamGhantaStart.toISOString(),
            end: yamGhantaEnd.toISOString(),
            type: "inauspicious",
            description: "An inauspicious period, generally avoided for new beginnings."
        };
    } catch (error) {
        logger.error(`Error calculating Yam Ghanta for ${dateString}: ${error.message}`, { stack: error.stack });
        return null;
    }
}

/**
 * Calculates Panchak for a given date and location.
 * Panchak is an inauspicious period based on Moon's Nakshatra.
 * @param {string} dateString - Local date string (YYYY-MM-DDTHH:MM:SS).
 * @param {number} latitude - Observer's latitude.
 * @param {number} longitude - Observer's longitude.
 * @returns {Object|null} Panchak details or null if not calculable.
 */
export async function calculatePanchak(dateString, latitude, longitude, sunrise, nextSunrise) {
    try {
        const { julianDayUT } = getJulianDateUT(dateString, latitude, longitude);
        if (julianDayUT === null) {
            logger.warn(`Julian Day UT not available for Panchak calculation on ${dateString}`);
            return null;
        }

        const planetaryPositions = await calculatePlanetaryPositions(julianDayUT);
        const moonLongitude = planetaryPositions?.sidereal?.Moon?.longitude;

        if (moonLongitude === undefined || isNaN(moonLongitude)) {
            logger.warn(`Moon longitude not available for Panchak calculation on ${dateString}`);
            return null;
        }

        const nakshatraDetails = getNakshatraDetails(moonLongitude);
        const nakshatraName = nakshatraDetails.name;
        const nakshatraIndex = nakshatraDetails.index;

        const panchakNakshatras = ["Dhanishtha", "Shatabhisha", "Purva Bhadrapada", "Uttara Bhadrapada", "Revati"];

        if (!sunrise || !nextSunrise || !sunrise.isValid() || !nextSunrise.isValid()) {
            logger.warn(`Sunrise/NextSunrise not available for Panchak calculation on ${dateString}`);
            return null;
        }

        // Get Moon's Nakshatra at sunrise and next sunrise
        const { julianDayUT: sunriseJD } = getJulianDateUT(sunrise.toISOString(), latitude, longitude);
        const sunriseMoonLng = (await calculatePlanetaryPositions(sunriseJD))?.sidereal?.Moon?.longitude;
        const sunriseNakshatraIndex = sunriseMoonLng !== undefined && !isNaN(sunriseMoonLng) ? getNakshatraDetails(sunriseMoonLng).index : -1;

        const { julianDayUT: nextSunriseJD } = getJulianDateUT(nextSunrise.toISOString(), latitude, longitude);
        const nextSunriseMoonLng = (await calculatePlanetaryPositions(nextSunriseJD))?.sidereal?.Moon?.longitude;
        const nextSunriseNakshatraIndex = nextSunriseMoonLng !== undefined && !isNaN(nextSunriseMoonLng) ? getNakshatraDetails(nextSunriseMoonLng).index : -1;

        const isPanchakAtSunrise = panchakNakshatras.includes(getNakshatraDetails(sunriseMoonLng).name);
        const isPanchakAtNextSunrise = panchakNakshatras.includes(getNakshatraDetails(nextSunriseMoonLng).name);

        if (panchakNakshatras.includes(nakshatraName) || isPanchakAtSunrise || isPanchakAtNextSunrise) {
            let finalEntryTime = null;
            let finalExitTime = null;

            if (isPanchakAtSunrise) {
                finalEntryTime = sunrise.toISOString();
            } else {
                const { entryTime } = await getMoonNakshatraEntryExitTimes(dateString, latitude, longitude, nakshatraIndex, sunrise, nextSunrise);
                finalEntryTime = entryTime;
            }

            if (isPanchakAtNextSunrise) {
                finalExitTime = nextSunrise.toISOString();
            } else {
                const { exitTime } = await getMoonNakshatraEntryExitTimes(dateString, latitude, longitude, nakshatraIndex, sunrise, nextSunrise);
                finalExitTime = exitTime;
            }

            const dayOfWeek = sunrise.day(); // 0 for Sunday, 6 for Saturday

            let panchakType = "General Panchak";
            switch (dayOfWeek) {
                case 0: panchakType = "Rog Panchak (Sunday)"; break;
                case 1: panchakType = "Raj Panchak (Monday)"; break;
                case 2: panchakType = "Agni Panchak (Tuesday)"; break;
                case 3: panchakType = "General Panchak (Wednesday)"; break; // No specific name often
                case 4: panchakType = "General Panchak (Thursday)"; break; // No specific name often
                case 5: panchakType = "Chor Panchak (Friday)"; break;
                case 6: panchakType = "Mrityu Panchak (Saturday)"; break;
            }

            return {
                name: "Panchak",
                start: finalEntryTime,
                end: finalExitTime,
                type: "inauspicious",
                description: `Panchak period due to Moon in ${nakshatraName} Nakshatra. Type: ${panchakType}. Avoid auspicious activities.`
            };
        }

        return null; // Not a Panchak period

    } catch (error) {
        logger.error(`Error calculating Panchak for ${dateString}: ${error.message}`, { stack: error.stack });
        return null;
    }
}

/**
 * Calculates Varjyam for a given date and location.
 * Varjyam is an inauspicious period based on Nakshatra.
 * @param {string} dateString - Local date string (YYYY-MM-DDTHH:MM:SS).
 * @param {number} latitude - Observer's latitude.
 * @param {number} longitude - Observer's longitude.
 * @returns {Object|null} Varjyam details or null if not calculable.
 */
export async function calculateVarjyam(dateString, latitude, longitude, sunrise, sunset, dayDurationMs) {
    try {
        const { julianDayUT } = getJulianDateUT(dateString, latitude, longitude);
        if (julianDayUT === null) {
            logger.warn(`Julian Day UT not available for Varjyam calculation on ${dateString}`);
            return null;
        }

        const planetaryPositions = await calculatePlanetaryPositions(julianDayUT);
        const moonLongitude = planetaryPositions?.sidereal?.Moon?.longitude;

        if (moonLongitude === undefined || isNaN(moonLongitude)) {
            logger.warn(`Moon longitude not available for Varjyam calculation on ${dateString}`);
            return null;
        }

        const nakshatraDetails = getNakshatraDetails(moonLongitude);
        const nakshatraName = nakshatraDetails.name;

        if (!sunrise || !sunset || !sunrise.isValid() || !sunset.isValid()) {
            logger.warn(`Sunrise/Sunset not available for simplified Varjyam calculation on ${dateString}`);
            return null;
        }

        const varjyamDurationMs = 96 * 60 * 1000; // 96 minutes

        // Simplified start: Arbitrarily set to start 1/3rd of the way through the day duration
        const varjyamStart = sunrise.clone().add(dayDurationMs / 3, 'milliseconds');
        const varjyamEnd = varjyamStart.clone().add(varjyamDurationMs, 'milliseconds');

        return {
            name: "Varjyam",
            start: varjyamStart.toISOString(),
            end: varjyamEnd.toISOString(),
            type: "inauspicious",
            description: `Simplified calculation: An inauspicious period associated with ${nakshatraName} Nakshatra. Actual start/end times vary by detailed Nakshatra rules.`
        };

    } catch (error) {
        logger.error(`Error calculating Varjyam for ${dateString}: ${error.message}`, { stack: error.stack });
        return null;
    }
}

/**
 * Calculates Pradosh Kaal for a given date and location.
 * Pradosh Kaal is an auspicious period around sunset.
 * @param {string} dateString - Local date string (YYYY-MM-DDTHH:MM:SS).
 * @param {number} latitude - Observer's latitude.
 * @param {number} longitude - Observer's longitude.
 * @returns {Object|null} Pradosh Kaal details or null if not calculable.
 */
export async function calculatePradoshKaal(sunset) {
    try {
        if (!sunset || !sunset.isValid()) {
            logger.warn(`Sunset not available for Pradosh Kaal calculation.`);
            return null;
        }

        const pradoshDurationMs = 96 * 60 * 1000; // 96 minutes
        const pradoshStart = sunset.clone();
        const pradoshEnd = pradoshStart.clone().add(pradoshDurationMs, 'milliseconds');

        return {
            name: "Pradosh Kaal",
            start: pradoshStart.toISOString(),
            end: pradoshEnd.toISOString(),
            type: "auspicious",
            description: "An auspicious period around sunset, ideal for Shiva worship."
        };
    } catch (error) {
        logger.error(`Error calculating Pradosh Kaal for ${dateString}: ${error.message}`, { stack: error.stack });
        return null;
    }
}

/**
 * Calculates various Muhurtas for a given date, time, and location.
 * @param {string} dateString - Local date string (YYYY-MM-DDTHH:MM:SS).
 * @param {number} latitude - Observer's latitude.
 * @param {number} longitude - Observer's longitude.
 * @returns {Object} Object containing Choghadiya, Horas, Lagnas, Abhijit Muhurta, Rahu Kaal, Yam Ghanta, Guli Kaal, Dur Muhurta, Pradosh Kaal, Varjyam, and Panchak.
 */
export async function calculateMuhurta(dateString, latitude, longitude) {
    // --- Date Standardization ---
    // Use moment to parse the potentially messy incoming date string (e.g., from JS new Date()).
    const momentDate = moment(dateString);
    if (!momentDate.isValid()) {
        throw new Error(`Invalid date string provided to calculateMuhurta: "${dateString}"`);
    }
    // Standardize the date into the format expected by other utils.
    const standardizedDateString = momentDate.format('YYYY-MM-DDTHH:mm:ss');
    // --- End Standardization ---

    const { julianDayUT, utcDate } = getJulianDateUT(standardizedDateString, latitude, longitude);
    if (julianDayUT === null) {
        throw new Error("Invalid date or location for Muhurta calculation.");
    }
    const planetaryPositions = await calculatePlanetaryPositions(julianDayUT);

    const sunMoonTimes = await calculateSunMoonTimes(utcDate, latitude, longitude);
    const sunrise = sunMoonTimes.sunrise ? moment(sunMoonTimes.sunrise) : null;
    const sunset = sunMoonTimes.sunset ? moment(sunMoonTimes.sunset) : null;
    const nextDayUtcDate = moment(utcDate).add(1, 'day').toDate(); // Get UTC date for next day
    const nextDaySunMoonTimes = await calculateSunMoonTimes(nextDayUtcDate, latitude, longitude);
    const nextSunrise = nextDaySunMoonTimes.sunrise ? moment(nextDaySunMoonTimes.sunrise) : null;

    if (!sunrise || !sunset || !nextSunrise || !sunrise.isValid() || !sunset.isValid() || !nextSunrise.isValid()) {
        logger.warn(`Sunrise/Sunset/NextSunrise not available for comprehensive Muhurta calculation on ${standardizedDateString}`);
        return {
            inputParameters: { date: standardizedDateString, latitude, longitude, day: 'N/A', sunrise: null, sunset: null },
            choghadiya: [], horas: [], lagnas: [], muhurta: []
        };
    }

    const dayDurationMs = sunset.diff(sunrise);
    const nightDurationMs = nextSunrise.diff(sunset);
    const dayOfWeek = sunrise.day(); // 0 for Sunday, 1 for Monday, etc.

    const choghadiya = await calculateChoghadiya(sunrise, sunset, nextSunrise, dayDurationMs, nightDurationMs, dayOfWeek);
    const horas = await calculateHora(sunrise, sunset, nextSunrise, dayDurationMs, nightDurationMs, dayOfWeek);
    const lagnas = await calculateLagnasForDay(latitude, longitude, sunrise, nextSunrise);
    const abhijitMuhurta = await calculateAbhijitMuhurta(sunrise, sunset, dayDurationMs);
    const rahuKaal = await calculateRahuKaal(sunrise, sunset, dayDurationMs, dayOfWeek);
    const yamGhanta = await calculateYamGhanta(sunrise, sunset, dayDurationMs, dayOfWeek);
    const guliKaals = await calculateGuliKaal(sunrise, sunset, nextSunrise, dayDurationMs, nightDurationMs, dayOfWeek); // Returns an array
    const durMuhurtas = await calculateDurMuhurta(sunrise, sunset, dayDurationMs, dayOfWeek);
    const pradoshKaal = await calculatePradoshKaal(sunset);
    const varjyam = await calculateVarjyam(utcDate, latitude, longitude, sunrise, sunset, dayDurationMs);
    const panchak = await calculatePanchak(utcDate, latitude, longitude, sunrise, nextSunrise);
    const gandMool = await calculateMoolDosha(utcDate, latitude, longitude, planetaryPositions.sidereal, sunrise, nextSunrise);

    const muhurtaPeriods = [];
    if (abhijitMuhurta) muhurtaPeriods.push(abhijitMuhurta);
    if (rahuKaal) muhurtaPeriods.push(rahuKaal);
    if (yamGhanta) muhurtaPeriods.push(yamGhanta);
    if (guliKaals && guliKaals.length > 0) muhurtaPeriods.push(...guliKaals); // Spread the array
    if (durMuhurtas && durMuhurtas.length > 0) muhurtaPeriods.push(...durMuhurtas);
    if (pradoshKaal) muhurtaPeriods.push(pradoshKaal);
    if (varjyam) muhurtaPeriods.push(varjyam);
    if (panchak) muhurtaPeriods.push(panchak);
    if (gandMool && gandMool.present) muhurtaPeriods.push({
        name: "Gand Mool Dosha",
        start: gandMool.start,
        end: gandMool.end,
        type: "inauspicious",
        description: gandMool.reason || "Gand Mool Dosha is present."
    });

    // Get the day name from the sunrise moment object
    const dayName = sunrise ? sunrise.format('dddd') : 'N/A';

    return {
        inputParameters: { 
            date: standardizedDateString, 
            latitude, 
            longitude, 
            day: sunrise ? sunrise.format('dddd') : 'N/A', // Get day name from sunrise
            sunrise: sunrise ? sunrise.toISOString() : null, // Add sunrise
            sunset: sunset ? sunset.toISOString() : null, // Add sunset
            nextSunrise: nextSunrise ? nextSunrise.toISOString() : null, // Add nextSunrise
            dayDurationMs: dayDurationMs, // Add dayDurationMs
            nightDurationMs: nightDurationMs, // Add nightDurationMs
        },
        choghadiya,
        horas,
        lagnas,
        muhurta: muhurtaPeriods,
    };
}