// utils/muhurta/kaalUtils.js
import logger from '../logger.js';
import { WEEKDAY_LORDS } from '../constants.js';

const RAHU_KAAL_MUHURTA_INDEX = { 0: 7, 1: 1, 2: 6, 3: 4, 4: 5, 5: 3, 6: 2 };
const DUR_MUHURTA_INDICES_DAY = { 0: [14], 1: [9, 12], 2: [4], 3: [8], 4: [6, 12], 5: [4, 9], 6: [3] };
const DUR_MUHURTA_INDICES_NIGHT = { 2: [7] };
const GULI_KAAL_DAY_SEGMENT_INDEX = { 0: 6, 1: 5, 2: 4, 3: 3, 4: 2, 5: 1, 6: 0 };
const GULI_KAAL_NIGHT_SEGMENT_INDEX = { 0: 2, 1: 1, 2: 0, 3: 6, 4: 5, 5: 4, 6: 3 };

/**
 * Calculates Rahu Kaal for a given day.
 * @param {moment.Moment} sunrise - The moment object for sunrise.
 * @param {number} dayDurationMs - The duration of the day in milliseconds.
 * @param {number} dayOfWeek - The day of the week (0 for Sunday).
 * @returns {Object|null} Rahu Kaal details or null.
 */
export function calculateRahuKaal(sunrise, dayDurationMs, dayOfWeek) {
    try {
        const muhurtaDurationMs = dayDurationMs / 8;
        const rahuKaalMuhurtaIndex = RAHU_KAAL_MUHURTA_INDEX[dayOfWeek];
        if (rahuKaalMuhurtaIndex === undefined) throw new Error(`Invalid day of week for Rahu Kaal: ${dayOfWeek}`);

        const rahuKaalStart = sunrise.clone().add(rahuKaalMuhurtaIndex * muhurtaDurationMs, 'milliseconds');
        const rahuKaalEnd = rahuKaalStart.clone().add(muhurtaDurationMs, 'milliseconds');

        return {
            name: "Rahu Kaal",
            start: rahuKaalStart.toISOString(), end: rahuKaalEnd.toISOString(),
            type: "inauspicious",
            description: "An inauspicious period to avoid new beginnings, travel, or important decisions."
        };
    } catch (error) {
        logger.error(`Error calculating Rahu Kaal: ${error.message}`, { stack: error.stack });
        return null;
    }
}

/**
 * Calculates Dur Muhurta periods for a given day.
 * @param {moment.Moment} sunrise - The moment object for sunrise.
 * @param {moment.Moment} sunset - The moment object for sunset.
 * @param {number} dayDurationMs - The duration of the day in milliseconds.
 * @param {number} nightDurationMs - The duration of the night in milliseconds.
 * @param {number} dayOfWeek - The day of the week (0 for Sunday).
 * @returns {Array<Object>} An array of Dur Muhurta period objects.
 */
export function calculateDurMuhurta(sunrise, sunset, dayDurationMs, nightDurationMs, dayOfWeek) {
    try {
        const calculatedDurMuhurtas = [];
        const muhurtaDurationMs = dayDurationMs / 15;
        const nightMuhurtaDurationMs = nightDurationMs / 15;

        if (DUR_MUHURTA_INDICES_DAY[dayOfWeek]) {
            const dayMuhurtas = DUR_MUHURTA_INDICES_DAY[dayOfWeek].map((muhurtaIndex, i) => {
                const startMoment = sunrise.clone().add((muhurtaIndex - 1) * muhurtaDurationMs, 'milliseconds');
                const endMoment = startMoment.clone().add(muhurtaDurationMs, 'milliseconds');
                return {
                    name: DUR_MUHURTA_INDICES_DAY[dayOfWeek].length > 1 ? `Dur Muhurta (Day) ${i + 1}` : "Dur Muhurta (Day)",
                    start: startMoment.toISOString(), end: endMoment.toISOString(),
                    type: "inauspicious", description: "An inauspicious period. Avoid important activities."
                };
            });
            calculatedDurMuhurtas.push(...dayMuhurtas);
        }

        if (DUR_MUHURTA_INDICES_NIGHT[dayOfWeek]) {
            const nightMuhurtas = DUR_MUHURTA_INDICES_NIGHT[dayOfWeek].map((muhurtaIndex, i) => {
                const startMoment = sunset.clone().add((muhurtaIndex - 1) * nightMuhurtaDurationMs, 'milliseconds');
                const endMoment = startMoment.clone().add(nightMuhurtaDurationMs, 'milliseconds');
                return {
                    name: DUR_MUHURTA_INDICES_NIGHT[dayOfWeek].length > 1 ? `Dur Muhurta (Night) ${i + 1}` : "Dur Muhurta (Night)",
                    start: startMoment.toISOString(), end: endMoment.toISOString(),
                    type: "inauspicious", description: "An inauspicious period. Avoid important activities."
                };
            });
            calculatedDurMuhurtas.push(...nightMuhurtas);
        }

        return calculatedDurMuhurtas;
    } catch (error) {
        logger.error(`Error calculating Dur Muhurta: ${error.message}`, { stack: error.stack });
        return [];
    }
}

/**
 * Calculates Guli Kaal for a given day.
 * @param {moment.Moment} sunrise - The moment object for sunrise.
 * @param {moment.Moment} sunset - The moment object for sunset.
 * @param {number} dayDurationMs - The duration of the day in milliseconds.
 * @param {number} nightDurationMs - The duration of the night in milliseconds.
 * @param {number} dayOfWeek - The day of the week (0 for Sunday).
 * @returns {Array<Object>} An array of Guli Kaal period objects.
 */
export function calculateGuliKaal(sunrise, sunset, dayDurationMs, nightDurationMs, dayOfWeek) {
    try {
        const guliKaals = [];
        const daySegmentDurationMs = dayDurationMs / 8;
        const nightSegmentDurationMs = nightDurationMs / 8;

        const dayIndex = GULI_KAAL_DAY_SEGMENT_INDEX[dayOfWeek];
        if (dayIndex !== undefined) {
            const start = sunrise.clone().add(dayIndex * daySegmentDurationMs, 'milliseconds');
            guliKaals.push({
                name: "Guli Kaal (Day)",
                start: start.toISOString(), end: start.clone().add(daySegmentDurationMs, 'milliseconds').toISOString(),
                type: "inauspicious", description: "An inauspicious period; actions performed during this time tend to repeat."
            });
        }

        const nightIndex = GULI_KAAL_NIGHT_SEGMENT_INDEX[dayOfWeek];
        if (nightIndex !== undefined) {
            const start = sunset.clone().add(nightIndex * nightSegmentDurationMs, 'milliseconds');
            guliKaals.push({
                name: "Guli Kaal (Night)",
                start: start.toISOString(), end: start.clone().add(nightSegmentDurationMs, 'milliseconds').toISOString(),
                type: "inauspicious", description: "An inauspicious period during the night."
            });
        }

        return guliKaals;
    } catch (error) {
        logger.error(`Error calculating Guli Kaal: ${error.message}`, { stack: error.stack });
        return [];
    }
}

/**
 * Calculates Yam Ghanta for a given day.
 * @param {moment.Moment} sunrise - The moment object for sunrise.
 * @param {number} dayDurationMs - The duration of the day in milliseconds.
 * @param {number} dayOfWeek - The day of the week (0 for Sunday).
 * @returns {Object|null} Yam Ghanta details or null.
 */
export function calculateYamGhanta(sunrise, dayDurationMs, dayOfWeek) {
    try {
        const segmentDurationMs = dayDurationMs / 8;
        const dayLord = WEEKDAY_LORDS[dayOfWeek];
        const startIndex = WEEKDAY_LORDS.indexOf(dayLord);
        if (startIndex === -1) throw new Error(`Day lord ${dayLord} not found for Yam Ghanta.`);

        const jupiterIndexInWeek = 4; // Jupiter is the 5th day lord (index 4)
        const yamGhantaIndex = (jupiterIndexInWeek - startIndex + 7) % 7;

        const yamGhantaStart = sunrise.clone().add(yamGhantaIndex * segmentDurationMs, 'milliseconds');
        const yamGhantaEnd = yamGhantaStart.clone().add(segmentDurationMs, 'milliseconds');

        return {
            name: "Yam Ghanta",
            start: yamGhantaStart.toISOString(), end: yamGhantaEnd.toISOString(),
            type: "inauspicious", description: "An inauspicious period, generally avoided for new beginnings."
        };
    } catch (error) {
        logger.error(`Error calculating Yam Ghanta: ${error.message}`, { stack: error.stack });
        return null;
    }
}

/**
 * Calculates Pradosh Kaal for a given day.
 * @param {moment.Moment} sunset - The moment object for sunset.
 * @returns {Object|null} Pradosh Kaal details or null.
 */
export function calculatePradoshKaal(sunset) {
    try {
        const pradoshStart = sunset.clone().subtract(45, 'minutes');
        const pradoshEnd = sunset.clone().add(45, 'minutes');
        return {
            name: "Pradosh Kaal",
            start: pradoshStart.toISOString(), end: pradoshEnd.toISOString(),
            type: "auspicious", description: "An auspicious period around sunset, ideal for Shiva worship."
        };
    } catch (error) {
        logger.error(`Error calculating Pradosh Kaal: ${error.message}`, { stack: error.stack });
        return null;
    }
}