// utils/muhurta/bhadraUtils.js
import moment from 'moment-timezone';
import { MhahPanchang } from 'mhah-panchang';
import logger from '../logger.js';

/**
 * Finds the start and end times of Vishti Karan (Bhadra) for a given day.
 * @param {number} latitude - The observer's latitude.
 * @param {number} longitude - The observer's longitude.
 * @param {moment.Moment} sunrise - The moment object for sunrise.
 * @param {moment.Moment} nextSunrise - The moment object for the next day's sunrise.
 * @returns {Promise<Array<Object>>} A promise that resolves to an array of Bhadra period objects.
 */
export async function calculateBhadra(latitude, longitude, sunrise, nextSunrise) {
    const bhadraPeriods = [];
    const panchang = new MhahPanchang();
    let currentTime = sunrise.clone().toDate();

    try {
        while (moment(currentTime).isBefore(nextSunrise)) {
            // Calculate all panchang elements for the current time
            const panchangDetails = panchang.calculate(currentTime, latitude, longitude);
            const currentKarana = panchangDetails?.Karna;

            // Check if the current Karana is Vishti (index 7)
            if (currentKarana && currentKarana.name_en_IN === 'Vishti') {
                // Found a Bhadra period. Get its start and end times.
                const { start, end } = currentKarana; // The start/end times are in the Karana object itself
                
                if (start && end) {
                    const bhadraStart = moment.max(sunrise, moment(start));
                    const bhadraEnd = moment.min(nextSunrise, moment(end));

                    // Check if this period has already been added to avoid duplicates
                    const isAlreadyAdded = bhadraPeriods.some(
                        p => moment(p.start).isSame(bhadraStart)
                    );

                    if (!isAlreadyAdded) {
                        bhadraPeriods.push({
                            name: "Bhadra",
                            start: bhadraStart.toISOString(),
                            end: bhadraEnd.toISOString(),
                            type: "inauspicious",
                            description: "An inauspicious period (Vishti Karan). Avoid important activities."
                        });
                    }

                    // Jump the search time to the end of this Bhadra period to avoid duplicates
                    currentTime = moment(end).add(1, 'minute').toDate();
                    continue; // Continue the loop from the new time
                }
            } else {
                // If not Vishti, advance time by a reasonable step (e.g., 1 hour)
                currentTime = moment(currentTime).add(1, 'hour').toDate();
            }
        }
    } catch (error) {
        logger.error(`Error calculating Bhadra: ${error.message}`, { stack: error.stack });
    }
    
    return bhadraPeriods;
}