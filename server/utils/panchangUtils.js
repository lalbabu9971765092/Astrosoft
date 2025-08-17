// utils/panchangUtils.js
import { MhahPanchang } from 'mhah-panchang';
import SunCalc from 'suncalc';
import logger from './logger.js';
// Import the new constant
import { SAMVATSAR_NAMES } from './constants.js';

// --- Helper Function to find Chaitra Shukla Pratipada ---
// Note: This is an approximation. Finding the *exact* moment requires more precise Tithi start/end times.
// This function finds the *first day* where Chaitra Shukla Pratipada is present.
async function findChaitraShuklaPratipada(year, latitude, longitude) {
    const obj = new MhahPanchang();
    // Start searching from mid-February to be safe
    let checkDate = new Date(Date.UTC(year, 1, 20, 0, 0, 0));
    const endDate = new Date(Date.UTC(year, 3, 30, 0, 0, 0)); // Search until end of April

    while (checkDate <= endDate) {
        try {
            // FIX: Calculate panchang elements at sunrise for accuracy, as this defines the Tithi for the day.
            const sunTimes = SunCalc.getTimes(checkDate, latitude, longitude);
            const sunriseTime = sunTimes.sunrise;

            // If sunrise doesn't happen (e.g., polar regions), fall back to noon UTC as a rough estimate.
            const calculationTime = (sunriseTime instanceof Date && !isNaN(sunriseTime)) ? sunriseTime : new Date(new Date(checkDate).setUTCHours(12, 0, 0, 0));

            // Use the precise sunrise time for calculation
            const calendarInfo = obj.calendar(calculationTime, latitude, longitude);
            const tithiInfo = obj.calculate(calculationTime, latitude, longitude)?.Tithi;

            // Check for Chaitra month, Shukla paksha, and Tithi index 0 (Pratipada)
            if (calendarInfo?.Masa?.name_en_IN === 'Chaitra' &&
                calendarInfo?.Paksha?.name_en_IN === 'Shukla' &&
                tithiInfo?.ino === 0) {
               
                return checkDate;
            }
        } catch (e) {
            logger.warn(`Error checking date ${checkDate.toISOString().split('T')[0]} for Chaitra Shukla Pratipada: ${e.message}`);
            // Continue searching even if one date fails
        }
        checkDate.setUTCDate(checkDate.getUTCDate() + 1); // Move to the next day
    }

    logger.error(`Could not find Chaitra Shukla Pratipada for year ${year}. Check mhah-panchang data/logic.`);
    return null; // Indicate failure
}

// --- Helper Function to Calculate Vikram Samvat ---
function calculateVikramSamvat(targetDate, vsNewYearDate) {
    if (!vsNewYearDate || !(targetDate instanceof Date) || !(vsNewYearDate instanceof Date)) {
        return null; // Cannot calculate if dates are invalid
    }
    const gregorianYear = targetDate.getUTCFullYear();

    // Compare only date parts (ignoring time) for simplicity
    const targetDay = new Date(Date.UTC(targetDate.getUTCFullYear(), targetDate.getUTCMonth(), targetDate.getUTCDate()));
    const newYearDay = new Date(Date.UTC(vsNewYearDate.getUTCFullYear(), vsNewYearDate.getUTCMonth(), vsNewYearDate.getUTCDate()));

    if (targetDay < newYearDay) {
        return gregorianYear + 56;
    } else {
        return gregorianYear + 57;
    }
}

// --- Helper Function to Calculate Saka Year ---
function calculateSakaYear(targetDate, vsNewYearDate) { // Saka also starts on Chaitra Shukla Pratipada
    if (!vsNewYearDate || !(targetDate instanceof Date) || !(vsNewYearDate instanceof Date)) {
        return null;
    }
    const gregorianYear = targetDate.getUTCFullYear();

    const targetDay = new Date(Date.UTC(targetDate.getUTCFullYear(), targetDate.getUTCMonth(), targetDate.getUTCDate()));
    const newYearDay = new Date(Date.UTC(vsNewYearDate.getUTCFullYear(), vsNewYearDate.getUTCMonth(), vsNewYearDate.getUTCDate()));

    if (targetDay < newYearDay) {
        // If before the new year in the Gregorian calendar, Saka year is Greg - 79
        return gregorianYear - 79;
    } else {
        // If on or after the new year, Saka year is Greg - 78
        return gregorianYear - 78;
    }
}

// --- Helper Function to Get Samvatsar Name from Saka Year ---
function getSamvatsarNameFromSaka(sakaYear) {
    if (sakaYear === null || isNaN(sakaYear)) {
        return "N/A";
    }
    // Using the formula: (Saka Year + 12) % 60 (adjust constant '12' if needed based on epoch source)
    // Ensure SAMVATSAR_NAMES is imported and available
    const samvatsarIndex = (sakaYear + 11) % 60;

    if (samvatsarIndex >= 0 && samvatsarIndex < SAMVATSAR_NAMES.length) {
        return SAMVATSAR_NAMES[samvatsarIndex];
    } else {
        logger.warn(`Calculated invalid Samvatsar index ${samvatsarIndex} for Saka year ${sakaYear}`);
        return "Unknown";
    }
}


/**
 * Calculates detailed Panchang information for a given date and location.
 * Includes Vikram Samvat and Samvatsar calculation.
 * @param {string} dateString - ISO 8601 date string (YYYY-MM-DDTHH:MM:SS).
 * @param {number} latitude - Observer's latitude.
 * @param {number} longitude - Observer's longitude.
 * @returns {Promise<object | null>} Promise resolving to Panchang details object or null on error.
 */


/**
 * Calculates detailed Panchang information for a given date and location.
 * Includes Vikram Samvat and Samvatsar calculation.
 * @param {string} dateString - ISO 8601 date string (YYYY-MM-DDTHH:MM:SS).
 * @param {number} latitude - Observer's latitude.
 * @param {number} longitude - Observer's longitude.
 * @returns {Promise<object | null>} Promise resolving to Panchang details object or null on error.
 */
export async function calculatePanchang(dateString, latitude, longitude) {
    try {
        const utcDate = new Date(dateString);
        if (isNaN(utcDate.getTime())) {
            throw new Error(`Invalid date string provided: ${dateString}`);
        }

        const obj = new MhahPanchang();
        const panchangDetails = obj.calculate(utcDate, latitude, longitude);
        const calendarInfo = obj.calendar(utcDate, latitude, longitude);

        // Calculate Vikram Samvat and Saka Year
        const vsNewYearDate = await findChaitraShuklaPratipada(utcDate.getUTCFullYear(), latitude, longitude);
        const vikramSamvat = calculateVikramSamvat(utcDate, vsNewYearDate);
        const sakaYear = calculateSakaYear(utcDate, vsNewYearDate);
        const samvatsarName = getSamvatsarNameFromSaka(sakaYear);

        return {
            ...panchangDetails,
            ...calendarInfo,
            vikram_samvat: vikramSamvat,
            SakaYear: sakaYear,
            samvatsar: samvatsarName,
        };
    } catch (error) {
        logger.error(`Error calculating Panchang for ${dateString}, Lat=${latitude}, Lon=${longitude}: ${error.message}`, { stack: error.stack });
        return null;
    }
}

/**
 * Calculates sunrise, sunset, moonrise, moonset times using SunCalc.
 * @param {Date} utcDateObject - A JavaScript Date object representing the time in UTC.
 * @param {number} latitude - Observer's latitude.
 * @param {number} longitude - Observer's longitude.
 * @returns {{sunrise: string|null, sunset: string|null, moonrise: string|null, moonset: string|null}} Object with ISO time strings or null if calculation fails.
 */
export function calculateSunMoonTimes(utcDateObject, latitude, longitude) {
    const result = { sunrise: null, sunset: null, moonrise: null, moonset: null };
    try {
        // Ensure utcDateObject is a valid Date object
        if (!(utcDateObject instanceof Date) || isNaN(utcDateObject.getTime())) {
            throw new Error(`Invalid UTC date object provided: ${utcDateObject}`);
        }

        // Validate that we have a valid Date object to work with.
        if (isNaN(latitude) || isNaN(longitude)) {
             throw new Error(`Invalid coordinates: Lat=${latitude}, Lon=${longitude}`);
        }

        const sunTimes = SunCalc.getTimes(utcDateObject, latitude, longitude);
        const moonTimes = SunCalc.getMoonTimes(utcDateObject, latitude, longitude);

        // Check if times are valid Date objects before converting to ISO string
        result.sunrise = sunTimes?.sunrise instanceof Date && !isNaN(sunTimes.sunrise) ? sunTimes.sunrise.toISOString() : null;
        result.sunset = sunTimes?.sunset instanceof Date && !isNaN(sunTimes.sunset) ? sunTimes.sunset.toISOString() : null;
        result.moonrise = moonTimes?.rise instanceof Date && !isNaN(moonTimes.rise) ? moonTimes.rise.toISOString() : null;
        result.moonset = moonTimes?.set instanceof Date && !isNaN(moonTimes.set) ? moonTimes.set.toISOString() : null;

        // Handle cases where moon might not rise or set on that day
        if (!result.moonrise && moonTimes?.alwaysUp) result.moonrise = "Always Up";
        if (!result.moonrise && moonTimes?.alwaysDown) result.moonrise = "Always Down";
        if (!result.moonset && moonTimes?.alwaysUp) result.moonset = "Always Up";
        if (!result.moonset && moonTimes?.alwaysDown) result.moonset = "Always Down";

    } catch (error) {
        logger.error(`Error calculating Sun/Moon times for "${String(utcDateObject)}", Lat=${latitude}, Lon=${longitude}: ${error.message}`, { stack: error.stack });
        // Return object with nulls
    }
    return result;
}
