// utils/muhurta/choghadiyaUtils.js
import logger from '../logger.js';
import { WEEKDAY_LORDS } from '../constants.js';

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
        { name: "Shubh", lord: "Jupiter", type: "auspicious" },
        { name: "Amrit", lord: "Moon", type: "auspicious" },
        { name: "Char", lord: "Venus", type: "auspicious" },
        { name: "Rog", lord: "Mars", type: "inauspicious" },
        { name: "Kaal", lord: "Saturn", type: "inauspicious" },
        { name: "Labh", lord: "Mercury", type: "auspicious" },
        { name: "Udweg", lord: "Sun", type: "inauspicious" },
    ]
};

/**
 * Calculates Choghadiya periods for a given day.
 * @param {moment.Moment} sunrise - The moment object for sunrise.
 * @param {moment.Moment} sunset - The moment object for sunset.
 * @param {moment.Moment} nextSunrise - The moment object for the next day's sunrise.
 * @param {number} dayDurationMs - The duration of the day in milliseconds.
 * @param {number} nightDurationMs - The duration of the night in milliseconds.
 * @param {number} dayOfWeek - The day of the week (0 for Sunday).
 * @returns {Array<Object>} Array of Choghadiya period objects.
 */
export function calculateChoghadiya(sunrise, sunset, nextSunrise, dayDurationMs, nightDurationMs, dayOfWeek) {
    try {
        const dayChoghadiyaDurationMs = dayDurationMs / 8;
        const nightChoghadiyaDurationMs = nightDurationMs / 8;
        const choghadiyas = [];

        // Day Choghadiyas
        let currentChoghadiyaStart = sunrise.clone();
        const dayLord = WEEKDAY_LORDS[dayOfWeek];
        const startIndexDay = CHOGHADIYA_TYPES.day.findIndex(c => c.lord === dayLord);
        if (startIndexDay === -1) throw new Error(`Could not find starting Choghadiya for day lord: ${dayLord}`);

        for (let i = 0; i < 8; i++) {
            const choghadiya = CHOGHADIYA_TYPES.day[(startIndexDay + i) % 7];
            const end = currentChoghadiyaStart.clone().add(dayChoghadiyaDurationMs, 'milliseconds');
            choghadiyas.push({
                type: "Day", name: choghadiya.name, lord: choghadiya.lord,
                periodType: choghadiya.type, start: currentChoghadiyaStart.toISOString(), end: end.toISOString(),
            });
            currentChoghadiyaStart = end;
        }

        // Night Choghadiyas
        let currentNightChoghadiyaStart = sunset.clone();
        const nightStartLordIndexOffset = 4; // 5th lord from the day start
        const nightStartLord = CHOGHADIYA_TYPES.day[(startIndexDay + nightStartLordIndexOffset) % 7].lord;
        const startIndexNight = CHOGHADIYA_TYPES.night.findIndex(c => c.lord === nightStartLord);
        if (startIndexNight === -1) throw new Error(`Could not find starting night Choghadiya for lord: ${nightStartLord}`);

        for (let i = 0; i < 8; i++) {
            const choghadiya = CHOGHADIYA_TYPES.night[(startIndexNight + i) % 7];
            const end = (i === 7) ? nextSunrise.clone() : currentNightChoghadiyaStart.clone().add(nightChoghadiyaDurationMs, 'milliseconds');
            choghadiyas.push({
                type: "Night", name: choghadiya.name, lord: choghadiya.lord,
                periodType: choghadiya.type, start: currentNightChoghadiyaStart.toISOString(), end: end.toISOString(),
            });
            currentNightChoghadiyaStart = end;
        }

        return choghadiyas;

    } catch (error) {
        logger.error(`Error calculating Choghadiya: ${error.message}`, { stack: error.stack });
        throw new Error(`Failed to calculate Choghadiya: ${error.message}`);
    }
}