// utils/muhurta/horaUtils.js
import logger from '../logger.js';
import { WEEKDAY_LORDS } from '../constants.js';

const HORA_SEQUENCE = ["Sun", "Venus", "Mercury", "Moon", "Saturn", "Jupiter", "Mars"];

/**
 * Calculates Hora periods for a given day.
 * @param {moment.Moment} sunrise - The moment object for sunrise.
 * @param {moment.Moment} sunset - The moment object for sunset.
 * @param {moment.Moment} nextSunrise - The moment object for the next day's sunrise.
 * @param {number} dayDurationMs - The duration of the day in milliseconds.
 * @param {number} nightDurationMs - The duration of the night in milliseconds.
 * @param {number} dayOfWeek - The day of the week (0 for Sunday).
 * @returns {Array<Object>} Array of Hora period objects.
 */
export function calculateHora(sunrise, sunset, nextSunrise, dayDurationMs, nightDurationMs, dayOfWeek) {
    try {
        const dayHoraDurationMs = dayDurationMs / 12;
        const nightHoraDurationMs = nightDurationMs / 12;
        const horas = [];

        const dayLord = WEEKDAY_LORDS[dayOfWeek];
        const startIndex = HORA_SEQUENCE.indexOf(dayLord);
        if (startIndex === -1) throw new Error(`Day lord ${dayLord} not found in Hora sequence.`);

        // Day Horas
        let currentHoraStart = sunrise.clone();
        for (let i = 0; i < 12; i++) {
            const horaLord = HORA_SEQUENCE[(startIndex + i) % HORA_SEQUENCE.length];
            const end = currentHoraStart.clone().add(dayHoraDurationMs, 'milliseconds');
            horas.push({
                type: "Day", lord: horaLord,
                start: currentHoraStart.toISOString(), end: end.toISOString(),
            });
            currentHoraStart = end;
        }

        // Night Horas
        const nightStartIndex = (startIndex + 4) % HORA_SEQUENCE.length; // 5th lord from day start
        let currentNightHoraStart = sunset.clone();
        for (let i = 0; i < 12; i++) {
            const horaLord = HORA_SEQUENCE[(nightStartIndex + i) % HORA_SEQUENCE.length];
            const end = (i === 11) ? nextSunrise.clone() : currentNightHoraStart.clone().add(nightHoraDurationMs, 'milliseconds');
            horas.push({
                type: "Night", lord: horaLord,
                start: currentNightHoraStart.toISOString(), end: end.toISOString(),
            });
            currentNightHoraStart = end;
        }

        return horas;

    } catch (error) {
        logger.error(`Error calculating Hora: ${error.message}`, { stack: error.stack });
        throw new Error(`Failed to calculate Hora: ${error.message}`);
    }
}