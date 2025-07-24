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
export async function calculateChoghadiya(dateString, latitude, longitude) {
    try {
        const { utcDate, timezoneOffsetHours } = getJulianDateUT(dateString, latitude, longitude);
        if (!utcDate) {
            throw new Error("Invalid date or location for Choghadiya calculation.");
        }

        const localMoment = moment.tz(dateString, "YYYY-MM-DDTHH:mm:ss", moment.tz.guess()); // Use guessed timezone for local interpretation
        const startOfDay = localMoment.clone().startOf('day');
        const endOfDay = localMoment.clone().endOf('day');

        const sunMoonTimes = await calculateSunMoonTimes(dateString, latitude, longitude);
        const sunrise = sunMoonTimes.sunrise ? moment(sunMoonTimes.sunrise) : null;
        const sunset = sunMoonTimes.sunset ? moment(sunMoonTimes.sunset) : null;

        const nextDayDateString = moment(dateString).add(1, 'day').format('YYYY-MM-DDTHH:mm:ss');
        const nextDaySunMoonTimes = await calculateSunMoonTimes(nextDayDateString, latitude, longitude);
        const nextSunrise = nextDaySunMoonTimes.sunrise ? moment(nextDaySunMoonTimes.sunrise) : null;

        if (!sunrise || !sunset || !sunrise.isValid() || !sunset.isValid() || !nextSunrise || !nextSunrise.isValid()) {
            logger.warn(`Sunrise/Sunset not available for Choghadiya calculation on ${dateString}`);
            return [];
        }

        const dayDurationMs = sunset.diff(sunrise);
        const nightDurationMs = nextSunrise.diff(sunset);

        const dayChoghadiyaDurationMs = dayDurationMs / 8;
        const nightChoghadiyaDurationMs = nightDurationMs / 8;

        const choghadiyas = [];
        const dayOfWeek = sunrise.day(); // 0 for Sunday, 1 for Monday, etc.

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
export async function calculateHora(dateString, latitude, longitude) {
    try {
        const { utcDate, timezoneOffsetHours } = getJulianDateUT(dateString, latitude, longitude);
        if (!utcDate) {
            throw new Error("Invalid date or location for Hora calculation.");
        }

        const localMoment = moment.tz(dateString, "YYYY-MM-DDTHH:mm:ss", moment.tz.guess());
        const startOfDay = localMoment.clone().startOf('day');
        const endOfDay = localMoment.clone().endOf('day');

        const sunMoonTimes = await calculateSunMoonTimes(dateString, latitude, longitude);
        const sunrise = sunMoonTimes.sunrise ? moment(sunMoonTimes.sunrise) : null;
        const sunset = sunMoonTimes.sunset ? moment(sunMoonTimes.sunset) : null;

        const nextDayDateString = moment(dateString).add(1, 'day').format('YYYY-MM-DDTHH:mm:ss');
        const nextDaySunMoonTimes = await calculateSunMoonTimes(nextDayDateString, latitude, longitude);
        const nextSunrise = nextDaySunMoonTimes.sunrise ? moment(nextDaySunMoonTimes.sunrise) : null;

        if (!sunrise || !sunset || !sunrise.isValid() || !sunset.isValid() || !nextSunrise || !nextSunrise.isValid()) {
            logger.warn(`Sunrise/Sunset not available for Hora calculation on ${dateString}`);
            return [];
        }

        const dayDurationMs = sunset.diff(sunrise);
        const nightDurationMs = nextSunrise.diff(sunset);

        const dayHoraDurationMs = dayDurationMs / 12;
        const nightHoraDurationMs = nightDurationMs / 12;

        const horas = [];
        const dayOfWeek = sunrise.day(); // 0 for Sunday, 1 for Monday, etc.

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

        logger.info(`Generated ${horas.length} horas.`);
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
export async function calculateAbhijitMuhurta(dateString, latitude, longitude) {
    try {
        const sunMoonTimes = await calculateSunMoonTimes(dateString, latitude, longitude);
        const sunrise = sunMoonTimes.sunrise ? moment(sunMoonTimes.sunrise) : null;
        const sunset = sunMoonTimes.sunset ? moment(sunMoonTimes.sunset) : null;

        if (!sunrise || !sunset || !sunrise.isValid() || !sunset.isValid()) {
            logger.warn(`Sunrise/Sunset not available for Abhijit Muhurta calculation on ${dateString}`);
            return null;
        }

        const dayDurationMs = sunset.diff(sunrise);
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

/**
 * Calculates Rahu Kaal for a given date and location.
 * Rahu Kaal is an inauspicious period to avoid new beginnings.
 * @param {string} dateString - Local date string (YYYY-MM-DDTHH:MM:SS).
 * @param {number} latitude - Observer's latitude.
 * @param {number} longitude - Observer's longitude.
 * @returns {Object|null} Rahu Kaal details or null if not calculable.
 */
export async function calculateRahuKaal(dateString, latitude, longitude) {
    try {
        const sunMoonTimes = await calculateSunMoonTimes(dateString, latitude, longitude);
        const sunrise = sunMoonTimes.sunrise ? moment(sunMoonTimes.sunrise) : null;
        const sunset = sunMoonTimes.sunset ? moment(sunMoonTimes.sunset) : null;

        if (!sunrise || !sunset || !sunrise.isValid() || !sunset.isValid()) {
            logger.warn(`Sunrise/Sunset not available for Rahu Kaal calculation on ${dateString}`);
            return null;
        }

        const dayDurationMs = sunset.diff(sunrise);
        const muhurtaDurationMs = dayDurationMs / 8; // Day divided into 8 Muhurtas

        const dayOfWeek = sunrise.day(); // 0 for Sunday, 1 for Monday, etc.

        // Rahu Kaal time slots for each day of the week
        const rahuKaalSlots = {
            0: { start: '16:30', end: '18:00' }, // Sunday
            1: { start: '07:30', end: '09:00' }, // Monday
            2: { start: '15:00', end: '16:30' }, // Tuesday
            3: { start: '12:00', end: '13:30' }, // Wednesday
            4: { start: '13:30', end: '15:00' }, // Thursday
            5: { start: '10:30', end: '12:00' }, // Friday
            6: { start: '09:00', end: '10:30' }  // Saturday
        };

        const rahuKaalSlot = rahuKaalSlots[dayOfWeek];

        if (!rahuKaalSlot) {
            logger.error(`Invalid day of week for Rahu Kaal calculation: ${dayOfWeek}`);
            return null;
        }

        const rahuKaalStart = moment.tz(dateString, moment.tz.guess()).startOf('day').set({
            hour: parseInt(rahuKaalSlot.start.split(':')[0]),
            minute: parseInt(rahuKaalSlot.start.split(':')[1])
        });

        const rahuKaalEnd = moment.tz(dateString, moment.tz.guess()).startOf('day').set({
            hour: parseInt(rahuKaalSlot.end.split(':')[0]),
            minute: parseInt(rahuKaalSlot.end.split(':')[1])
        });

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

/**
 * Calculates Dur Muhurta for a given date and location.
 * Dur Muhurta is an inauspicious period.
 * @param {string} dateString - Local date string (YYYY-MM-DDTHH:MM:SS).
 * @param {number} latitude - Observer's latitude.
 * @param {number} longitude - Observer's longitude.
 * @returns {Object|null} Dur Muhurta details or null if not calculable.
 */
export async function calculateDurMuhurta(dateString, latitude, longitude) {
    try {
        const sunMoonTimes = await calculateSunMoonTimes(dateString, latitude, longitude);
        const sunrise = sunMoonTimes.sunrise ? moment(sunMoonTimes.sunrise) : null;
        const sunset = sunMoonTimes.sunset ? moment(sunMoonTimes.sunset) : null;

        if (!sunrise || !sunrise.isValid()) {
            logger.warn(`Sunrise not available for Dur Muhurta calculation on ${dateString}`);
            return null;
        }

        const dayOfWeek = sunrise.day(); // 0 for Sunday, 1 for Monday, etc.
        const durMuhurtaDurationMs = 48 * 60 * 1000; // 48 minutes

        let durMuhurtas = [];

        // Rules based on search results
        switch (dayOfWeek) {
            case 0: // Sunday
                // Starts 10.24 hours after sunrise
                durMuhurtas.push({
                    startOffsetHours: 10.24,
                    name: "Dur Muhurta (Sunday)"
                });
                break;
            case 1: // Monday
                // Starts 6.24 hours after sunrise, and again at 8.48 hours after sunrise
                durMuhurtas.push({
                    startOffsetHours: 6.24,
                    name: "Dur Muhurta 1 (Monday)"
                });
                durMuhurtas.push({
                    startOffsetHours: 8.48,
                    name: "Dur Muhurta 2 (Monday)"
                });
                break;
            case 2: // Tuesday
                // Starts 2.24 hours after sunrise, and again at 5.36 hours after sunset
                durMuhurtas.push({
                    startOffsetHours: 2.24,
                    name: "Dur Muhurta (Tuesday - Day)"
                });
                if (sunset && sunset.isValid()) {
                    const durMuhurtaNightStart = sunset.clone().add(5.36, 'hours');
                    durMuhurtas.push({
                        start: durMuhurtaNightStart.toISOString(),
                        end: durMuhurtaNightStart.clone().add(durMuhurtaDurationMs, 'milliseconds').toISOString(),
                        name: "Dur Muhurta (Tuesday - Night)",
                        type: "inauspicious",
                        description: "An inauspicious period."
                    });
                }
                break;
            case 3: // Wednesday
                // Starts 5.36 hours after sunrise
                durMuhurtas.push({
                    startOffsetHours: 5.36,
                    name: "Dur Muhurta (Wednesday)"
                });
                break;
            case 4: // Thursday
                // Starts 4.00 hours after sunrise, and again at 8.48 hours after sunrise
                durMuhurtas.push({
                    startOffsetHours: 4.00,
                    name: "Dur Muhurta 1 (Thursday)"
                });
                durMuhurtas.push({
                    startOffsetHours: 8.48,
                    name: "Dur Muhurta 2 (Thursday)"
                });
                break;
            case 5: // Friday
                // Starts 2.24 hours after sunrise, and again at 8.48 hours after sunrise
                durMuhurtas.push({
                    startOffsetHours: 2.24,
                    name: "Dur Muhurta 1 (Friday)"
                });
                durMuhurtas.push({
                    startOffsetHours: 8.48,
                    name: "Dur Muhurta 2 (Friday)"
                });
                break;
            case 6: // Saturday
                // Starts from sunrise and lasts for 1.36 hours.
                durMuhurtas.push({
                    startOffsetHours: 0,
                    durationHours: 1.36,
                    name: "Dur Muhurta (Saturday)"
                });
                break;
            default:
                logger.warn(`Unknown day of week for Dur Muhurta calculation: ${dayOfWeek}`);
                return null;
        }

        const calculatedDurMuhurtas = durMuhurtas.map(dm => {
            let startMoment;
            let endMoment;

            if (dm.start) { // For Tuesday night case
                startMoment = moment(dm.start);
                endMoment = moment(dm.end);
            } else if (dm.startOffsetHours !== undefined) {
                startMoment = sunrise.clone().add(dm.startOffsetHours, 'hours');
                endMoment = startMoment.clone().add(dm.durationHours !== undefined ? dm.durationHours : (durMuhurtaDurationMs / (60 * 60 * 1000)), 'hours');
            } else {
                return null; // Should not happen
            }

            return {
                name: dm.name,
                start: startMoment.toISOString(),
                end: endMoment.toISOString(),
                type: "inauspicious",
                description: "An inauspicious period."
            };
        }).filter(Boolean); // Filter out any nulls

        return calculatedDurMuhurtas;

    } catch (error) {
        logger.error(`Error calculating Dur Muhurta for ${dateString}: ${error.message}`, { stack: error.stack });
        return null;
    }
}

/**
 * Calculates Guli Kaal for a given date and location.
 * Guli Kaal is an inauspicious period.
 * @param {string} dateString - Local date string (YYYY-MM-DDTHH:MM:SS).
 * @param {number} latitude - Observer's latitude.
 * @param {number} longitude - Observer's longitude.
 * @returns {Object|null} Guli Kaal details or null if not calculable.
 */
export async function calculateGuliKaal(dateString, latitude, longitude) {
    try {
        const sunMoonTimes = await calculateSunMoonTimes(dateString, latitude, longitude);
        const sunrise = sunMoonTimes.sunrise ? moment(sunMoonTimes.sunrise) : null;
        const sunset = sunMoonTimes.sunset ? moment(sunMoonTimes.sunset) : null;

        if (!sunrise || !sunset || !sunrise.isValid() || !sunset.isValid()) {
            logger.warn(`Sunrise/Sunset not available for Guli Kaal calculation on ${dateString}`);
            return []; // Return empty array
        }

        const dayDurationMs = sunset.diff(sunrise);
        const daySegmentDurationMs = dayDurationMs / 8;

        const dayOfWeek = sunrise.day(); // 0 for Sunday, 1 for Monday, etc.

        // Guli Kaal time slots for each day of the week
        const guliKaalSlots = {
            0: { start: '15:00', end: '16:30' }, // Sunday
            1: { start: '13:30', end: '15:00' }, // Monday
            2: { start: '12:00', end: '13:30' }, // Tuesday
            3: { start: '10:30', end: '12:00' }, // Wednesday
            4: { start: '09:00', end: '10:30' }, // Thursday
            5: { start: '07:30', end: '09:00' }, // Friday
            6: { start: '06:00', end: '07:30' }  // Saturday
        };

        const guliKaalSlot = guliKaalSlots[dayOfWeek];

        if (!guliKaalSlot) {
            logger.error(`Invalid day of week for Guli Kaal calculation: ${dayOfWeek}`);
            return [];
        }

        const guliKaalStart = moment.tz(dateString, moment.tz.guess()).startOf('day').set({
            hour: parseInt(guliKaalSlot.start.split(':')[0]),
            minute: parseInt(guliKaalSlot.start.split(':')[1])
        });

        const guliKaalEnd = moment.tz(dateString, moment.tz.guess()).startOf('day').set({
            hour: parseInt(guliKaalSlot.end.split(':')[0]),
            minute: parseInt(guliKaalSlot.end.split(':')[1])
        });

        const guliKaals = [{
            name: "Guli Kaal",
            start: guliKaalStart.toISOString(),
            end: guliKaalEnd.toISOString(),
            type: "inauspicious",
            description: "An inauspicious period; actions performed during this time tend to repeat."
        }];

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
export async function calculateYamGhanta(dateString, latitude, longitude) {
    try {
        const sunMoonTimes = await calculateSunMoonTimes(dateString, latitude, longitude);
        const sunrise = sunMoonTimes.sunrise ? moment(sunMoonTimes.sunrise) : null;
        const sunset = sunMoonTimes.sunset ? moment(sunMoonTimes.sunset) : null;

        if (!sunrise || !sunset || !sunrise.isValid() || !sunset.isValid()) {
            logger.warn(`Sunrise/Sunset not available for Yam Ghanta calculation on ${dateString}`);
            return null;
        }

        const dayDurationMs = sunset.diff(sunrise);
        const segmentDurationMs = dayDurationMs / 8;

        const dayOfWeek = sunrise.day(); // 0 for Sunday, 1 for Monday, etc.

        // Yam Ghanta is the 5th muhurta of the day, ruled by Jupiter.
        const yamGhantaMuhurtaIndex = {
            0: 4, // Sunday
            1: 3, // Monday
            2: 2, // Tuesday
            3: 1, // Wednesday
            4: 0, // Thursday
            5: 6, // Friday
            6: 5  // Saturday
        }[dayOfWeek];

        if (yamGhantaMuhurtaIndex === undefined) {
            logger.error(`Invalid day of week for Yam Ghanta calculation: ${dayOfWeek}`);
            return null;
        }

        const yamGhantaStart = sunrise.clone().add(yamGhantaMuhurtaIndex * segmentDurationMs, 'milliseconds');
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
export async function calculatePanchak(dateString, latitude, longitude) {
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

        // Determine Panchak type based on day of week and get sunrise/sunset for the day
        const sunMoonTimes = await calculateSunMoonTimes(dateString, latitude, longitude);
        const sunrise = sunMoonTimes.sunrise ? moment(sunMoonTimes.sunrise) : null;
        const nextDayDateString = moment(dateString).add(1, 'day').format('YYYY-MM-DDTHH:mm:ss');
        const nextDaySunMoonTimes = await calculateSunMoonTimes(nextDayDateString, latitude, longitude);
        const nextSunrise = nextDaySunMoonTimes.sunrise ? moment(nextDaySunMoonTimes.sunrise) : null;

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
export async function calculateVarjyam(dateString, latitude, longitude) {
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

        const sunMoonTimes = await calculateSunMoonTimes(dateString, latitude, longitude);
        const sunrise = sunMoonTimes.sunrise ? moment(sunMoonTimes.sunrise) : null;
        const sunset = sunMoonTimes.sunset ? moment(sunMoonTimes.sunset) : null;

        if (!sunrise || !sunset || !sunrise.isValid() || !sunset.isValid()) {
            logger.warn(`Sunrise/Sunset not available for simplified Varjyam calculation on ${dateString}`);
            return null;
        }

        const dayDurationMs = sunset.diff(sunrise);
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
export async function calculatePradoshKaal(dateString, latitude, longitude) {
    try {
        const sunMoonTimes = await calculateSunMoonTimes(dateString, latitude, longitude);
        const sunset = sunMoonTimes.sunset ? moment(sunMoonTimes.sunset) : null;

        if (!sunset || !sunset.isValid()) {
            logger.warn(`Sunset not available for Pradosh Kaal calculation on ${dateString}`);
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
    logger.info(`Starting comprehensive Muhurta calculation for ${dateString}, lat: ${latitude}, lon: ${longitude}`);

    const { julianDayUT, utcDate } = getJulianDateUT(dateString, latitude, longitude);
    if (julianDayUT === null) {
        throw new Error("Invalid date or location for Muhurta calculation.");
    }
    const planetaryPositions = await calculatePlanetaryPositions(julianDayUT);

    const sunMoonTimes = await calculateSunMoonTimes(dateString, latitude, longitude);
    const sunrise = sunMoonTimes.sunrise ? moment(sunMoonTimes.sunrise) : null;
    const sunset = sunMoonTimes.sunset ? moment(sunMoonTimes.sunset) : null;
    const nextDayDateString = moment(dateString).add(1, 'day').format('YYYY-MM-DDTHH:mm:ss');
    const nextDaySunMoonTimes = await calculateSunMoonTimes(nextDayDateString, latitude, longitude);
    const nextSunrise = nextDaySunMoonTimes.sunrise ? moment(nextDaySunMoonTimes.sunrise) : null;

    const choghadiya = await calculateChoghadiya(dateString, latitude, longitude);
    const horas = await calculateHora(dateString, latitude, longitude);
    const lagnas = await calculateLagnasForDay(latitude, longitude, sunrise, nextSunrise);
    const abhijitMuhurta = await calculateAbhijitMuhurta(dateString, latitude, longitude);
    const rahuKaal = await calculateRahuKaal(dateString, latitude, longitude);
    const yamGhanta = await calculateYamGhanta(dateString, latitude, longitude);
    const guliKaals = await calculateGuliKaal(dateString, latitude, longitude); // Returns an array
    const durMuhurtas = await calculateDurMuhurta(dateString, latitude, longitude);
    const pradoshKaal = await calculatePradoshKaal(dateString, latitude, longitude);
    const varjyam = await calculateVarjyam(dateString, latitude, longitude);
    const panchak = await calculatePanchak(dateString, latitude, longitude);
    const gandMool = await calculateMoolDosha(dateString, latitude, longitude, planetaryPositions.sidereal, sunrise, nextSunrise);

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
            date: dateString, 
            latitude, 
            longitude, 
            day: dayName, // Add day name
            sunrise: sunrise ? sunrise.toISOString() : null, // Add sunrise
            sunset: sunset ? sunset.toISOString() : null, // Add sunset
        },
        choghadiya,
        horas,
        lagnas,
        muhurta: muhurtaPeriods,
    };
}