// utils/panchangUtils.js
import { MhahPanchang } from 'mhah-panchang';
import SunCalc from 'suncalc';
import logger from './logger.js';

// Instantiate locally within functions or keep global if library is confirmed stateless
// var obj = new MhahPanchang();

/**
 * Calculates detailed Panchang information for a given date and location.
 * @param {string} dateString - ISO 8601 date string (YYYY-MM-DDTHH:MM:SS).
 * @param {number} latitude - Observer's latitude.
 * @param {number} longitude - Observer's longitude.
 * @returns {object | null} Panchang details object from mhah-panchang or null on error.
 */
export function calculatePanchang(dateString, latitude, longitude) {
    try {
        const date = new Date(dateString);
        if (isNaN(date.getTime())) {
            throw new Error(`Invalid date string: "${dateString}"`);
        }
        if (isNaN(latitude) || isNaN(longitude)) {
             throw new Error(`Invalid coordinates: Lat=${latitude}, Lon=${longitude}`);
        }

        const obj = new MhahPanchang(); // Instantiate locally for safety
        const panchangDetails = obj.calculate(date, latitude, longitude);

        // Add calendar info like Masa, Samvat, etc.
        const calendarInfo = obj.calendar(date, latitude, longitude);
        if (calendarInfo) {
             Object.assign(panchangDetails, calendarInfo); // Merge calendar info
        } else {
             logger.warn(`Could not get calendar info for ${dateString}`);
        }

        // Add sunrise/sunset from SunCalc for reference
        const sunTimes = calculateSunMoonTimes(dateString, latitude, longitude);
        panchangDetails.Sunrise = sunTimes.sunrise;
        panchangDetails.Sunset = sunTimes.sunset;


        // Validate essential parts?
        if (!panchangDetails || !panchangDetails.Tithi || !panchangDetails.Nakshatra) {
             logger.warn(`mhah-panchang returned incomplete data for ${dateString}`);
             // Return partial data or null/error? Returning partial for now.
        }

        return panchangDetails;

    } catch (error) {
        logger.error(`Error calculating Panchang for "${dateString}", Lat=${latitude}, Lon=${longitude}: ${error.message}`, { stack: error.stack });
        // Throw or return null? Throwing for consistency.
        throw new Error(`Failed to calculate Panchang: ${error.message}`);
    }
}

/**
 * Calculates sunrise, sunset, moonrise, moonset times using SunCalc.
 * @param {string} dateString - ISO 8601 date string (YYYY-MM-DDTHH:MM:SS).
 * @param {number} latitude - Observer's latitude.
 * @param {number} longitude - Observer's longitude.
 * @returns {{sunrise: string|null, sunset: string|null, moonrise: string|null, moonset: string|null}} Object with ISO time strings or null if calculation fails.
 */
export function calculateSunMoonTimes(dateString, latitude, longitude) {
    const result = { sunrise: null, sunset: null, moonrise: null, moonset: null };
    try {
        const date = new Date(dateString);
         if (isNaN(date.getTime())) {
            throw new Error(`Invalid date string: "${dateString}"`);
        }
        if (isNaN(latitude) || isNaN(longitude)) {
             throw new Error(`Invalid coordinates: Lat=${latitude}, Lon=${longitude}`);
        }
        const targetDateForCalc = new Date(Date.UTC(
            date.getUTCFullYear(),
            date.getUTCMonth(),
            date.getUTCDate(),
            12, 0, 0 // Use noon UTC
        ));
        const sunTimes = SunCalc.getTimes(targetDateForCalc, latitude, longitude);
        const moonTimes = SunCalc.getMoonTimes(targetDateForCalc, latitude, longitude);

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
        logger.error(`Error calculating Sun/Moon times for "${dateString}", Lat=${latitude}, Lon=${longitude}: ${error.message}`, { stack: error.stack });
        // Return object with nulls, don't throw to allow partial results in main calc?
    }
    return result;
}
