// utils/muhurta/bhadraUtils.js
import swisseph from 'swisseph-v2';
import moment from 'moment-timezone';
import { getJulianDateUT, normalizeAngle } from '../coreUtils.js';
import { calculatePlanetaryPositions } from '../planetaryUtils.js';
import logger from '../logger.js';

const KARANAS = [
    "Bava", "Balava", "Kaulava", "Taitila", "Garaja", "Vanija", "Vishti",
    "Bava", "Balava", "Kaulava", "Taitila", "Garaja", "Vanija", "Vishti",
    // ... this pattern repeats
];

const FIXED_KARANAS = ["Shakuni", "Chatushpada", "Naga", "Kintughna"];

/**
 * Finds the start and end times of Vishti Karan (Bhadra) for a given day.
 * @param {string} dateString - The local date string.
 * @param {number} latitude - The observer's latitude.
 * @param {number} longitude - The observer's longitude.
 * @param {moment.Moment} sunrise - The moment object for sunrise.
 * @param {moment.Moment} nextSunrise - The moment object for the next day's sunrise.
 * @returns {Promise<Array<Object>>} A promise that resolves to an array of Bhadra period objects.
 */
export async function calculateBhadra(dateString, latitude, longitude, sunrise, nextSunrise) {
    const bhadraPeriods = [];
    let currentMoment = sunrise.clone();

    try {
        while (currentMoment.isBefore(nextSunrise)) {
            const { julianDayUT } = getJulianDateUT(currentMoment.toISOString(), latitude, longitude);
            if (!julianDayUT) {
                currentMoment.add(1, 'hour');
                continue;
            }

            const positions = await calculatePlanetaryPositions(julianDayUT);
            const sunLon = positions.tropical.Sun.longitude;
            const moonLon = positions.tropical.Moon.longitude;

            const tithiAngle = normalizeAngle(moonLon - sunLon);
            const tithiIndex = Math.floor(tithiAngle / 12);
            const karanaIndexFloat = (tithiAngle / 6) % 60;
            const karanaIndex = Math.floor(karanaIndexFloat);

            let karanaName;
            if (karanaIndex === 0) karanaName = "Kintughna";
            else if (karanaIndex >= 1 && karanaIndex <= 7) karanaName = KARANAS[karanaIndex - 1];
            else if (karanaIndex >= 57 && karanaIndex <= 59) karanaName = FIXED_KARANAS[karanaIndex - 57];
            else karanaName = KARANAS[(karanaIndex - 1) % 7];

            if (karanaName === "Vishti") {
                // Found Bhadra, now find its start and end times
                const { startTime, endTime } = await findKaranaTransit(currentMoment, latitude, longitude, karanaIndex, nextSunrise);

                if (startTime && endTime) {
                    bhadraPeriods.push({
                        name: "Bhadra",
                        start: startTime,
                        end: endTime,
                        type: "inauspicious",
                        description: "An inauspicious period (Vishti Karan). Avoid important activities."
                    });
                    // Move to the end of this Bhadra period to avoid re-calculating it
                    currentMoment = moment(endTime).add(1, 'minute');
                } else {
                    currentMoment.add(1, 'hour');
                }
            } else {
                // Move to the next potential Karana change
                currentMoment.add(1, 'hour');
            }
        }
    } catch (error) {
        logger.error(`Error calculating Bhadra: ${error.message}`, { stack: error.stack });
    }

    return bhadraPeriods;
}

async function findKaranaTransit(approxTime, latitude, longitude, targetKaranaIndex, nextSunrise) {
    // This is a simplified search. A more precise binary search would be better.
    let startTime = null;
    let endTime = null;

    // Search backwards for start time
    let searchTime = approxTime.clone();
    for (let i = 0; i < 360; i++) { // Search back up to 6 hours
        const { julianDayUT } = getJulianDateUT(searchTime.toISOString(), latitude, longitude);
        const positions = await calculatePlanetaryPositions(julianDayUT);
        const karanaIndex = Math.floor((normalizeAngle(positions.tropical.Moon.longitude - positions.tropical.Sun.longitude) / 6) % 60);
        if (karanaIndex !== targetKaranaIndex) {
            startTime = searchTime.add(1, 'minute').toISOString();
            break;
        }
        searchTime.subtract(1, 'minute');
    }
    if (!startTime) startTime = approxTime.clone().subtract(3, 'hours').toISOString(); // Fallback

    endTime = moment(startTime).add(5, 'hours').isAfter(nextSunrise) ? nextSunrise.toISOString() : moment(startTime).add(5, 'hours').toISOString(); // Approximate end

    return { startTime, endTime };
}