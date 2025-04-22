// utils/coreUtils.js
import swisseph from 'swisseph-v2';
import logger from './logger.js';
// import { RASHI_SPAN } from './constants.js'; // No longer needed for offset calculation
import geoTz from 'geo-tz'; // Import geo-tz
import moment from 'moment-timezone'; // Import moment-timezone

/**
 * Normalizes an angle to be within the range [0, 360).
 * @param {number} angle - The angle in degrees.
 * @returns {number} The normalized angle, or NaN if input is invalid.
 */
export function normalizeAngle(angle) {
    if (typeof angle !== 'number' || isNaN(angle)) {
        // logger.warn(`normalizeAngle received invalid input: ${angle}`); // Optional: Log warning
        return NaN;
    }
    let normalized = angle % 360;
    if (normalized < 0) {
        normalized += 360;
    }
    // Handle potential floating point issue where 360 % 360 might not be exactly 0
    return (normalized === 360) ? 0 : normalized;
}

/**
 * Converts decimal degrees to Degrees, Minutes, Seconds (DMS) format.
 * @param {number} decimalDegrees - The angle in decimal degrees.
 * @returns {string} The angle in "DD° MM' SS\"" format, or "Invalid Input" / "NaN".
 */
export function convertToDMS(decimalDegrees) {
    if (typeof decimalDegrees !== 'number') return "Invalid Input";
    if (isNaN(decimalDegrees)) return "NaN";

    const degrees = Math.floor(decimalDegrees);
    const minutesFloat = (decimalDegrees - degrees) * 60;
    const minutes = Math.floor(minutesFloat);
    const secondsFloat = (minutesFloat - minutes) * 60;
    // Round seconds to avoid excessive precision issues, e.g., to 2 decimal places
    const seconds = Math.round(secondsFloat * 100) / 100;

    // Pad minutes and seconds with leading zeros if needed
    const minutesStr = String(minutes).padStart(2, '0');
    const secondsStr = String(seconds.toFixed(2)).padStart(5, '0'); // Pad to 5 chars like "04.56"

    return `${degrees}° ${minutesStr}' ${secondsStr}"`;
}

/**
 * Converts Degrees, Minutes, Seconds (DMS) string or object to decimal degrees.
 * Handles strings like "DD° MM' SS\"" or objects { d, m, s }.
 * @param {string | {d: number, m: number, s: number}} dms - The DMS value.
 * @returns {number} The angle in decimal degrees, or NaN if input is invalid.
 */
export function convertDMSToDegrees(dms) {
    let degrees = NaN, minutes = NaN, seconds = NaN;

    if (typeof dms === 'string') {
        const parts = dms.match(/(-?\d+)\D+(\d+)\D+([\d.]+)/);
        if (parts && parts.length === 4) {
            degrees = parseFloat(parts[1]);
            minutes = parseFloat(parts[2]);
            seconds = parseFloat(parts[3]);
        } else {
             logger.warn(`Invalid DMS string format for conversion: ${dms}`);
             return NaN;
        }
    } else if (typeof dms === 'object' && dms !== null && 'd' in dms && 'm' in dms && 's' in dms) {
        degrees = dms.d;
        minutes = dms.m;
        seconds = dms.s;
    } else {
        logger.warn(`Invalid DMS input type for conversion: ${typeof dms}`);
        return NaN;
    }

    if (isNaN(degrees) || isNaN(minutes) || isNaN(seconds)) {
        logger.warn(`Invalid numeric values in DMS input: d=${degrees}, m=${minutes}, s=${seconds}`);
        return NaN;
    }
    if (minutes < 0 || minutes >= 60 || seconds < 0 || seconds >= 60) {
         logger.warn(`Minutes/Seconds out of range in DMS input: m=${minutes}, s=${seconds}`);
         return NaN; // Or handle differently? For now, consider invalid.
    }

    const sign = degrees < 0 ? -1 : 1;
    const decimal = Math.abs(degrees) + minutes / 60 + seconds / 3600;
    return sign * decimal;
}


/**
 * Calculates the Julian Day (UT) for a given local date/time string, latitude, and longitude.
 * Uses geo-tz and moment-timezone for accurate timezone offset calculation.
 * @param {string} localDateString - Local date string (YYYY-MM-DDTHH:MM:SS).
 * @param {number} latitude - Observer's latitude in decimal degrees.
 * @param {number} longitude - Observer's longitude in decimal degrees.
 * @returns {{julianDayUT: number, utcDate: Date, timezoneOffsetHours: number} | {julianDayUT: null, utcDate: null, timezoneOffsetHours: null}} Object containing Julian Day UT, the corresponding UTC Date object, and the calculated timezone offset in hours, or nulls on error.
 */
export function getJulianDateUT(localDateString, latitude, longitude) {
    try {
        // Validate coordinates first
        if (typeof latitude !== 'number' || isNaN(latitude) || latitude < -90 || latitude > 90 ||
            typeof longitude !== 'number' || isNaN(longitude) || longitude < -180 || longitude > 180) {
            throw new Error(`Invalid coordinates provided: lat=${latitude}, lon=${longitude}`);
        }

        // 1. Find IANA Timezone Name using geo-tz
        const ianaTimezones = geoTz(latitude, longitude);
        if (!ianaTimezones || ianaTimezones.length === 0) {
            // Fallback or error? Using a fixed offset is generally bad, but could be a last resort.
            // For now, throw an error as timezone is critical.
            throw new Error(`Could not find IANA timezone for lat=${latitude}, lon=${longitude}`);
        }
        const timezoneName = ianaTimezones[0]; // Use the first/most likely result

        // 2. Parse local string and get correct UTC moment using moment-timezone
        // Tell moment that the input string IS local time in the *target* timezone
        const momentLocal = moment.tz(localDateString, "YYYY-MM-DDTHH:mm:ss", timezoneName);

        if (!momentLocal.isValid()) {
             // This could happen if the date string format is wrong OR if the time is invalid in that timezone (e.g., during DST transition)
             throw new Error(`Invalid date/time string or timezone combination: "${localDateString}", "${timezoneName}"`);
        }

        // 3. Convert to UTC and get components
        const momentUTC = momentLocal.clone().utc(); // Use clone() before converting to UTC
        const utcDate = momentUTC.toDate(); // Get native Date object representing the UTC moment

        if (isNaN(utcDate.getTime())) {
             // Should not happen if momentUTC is valid, but good safety check
             throw new Error(`Failed to convert momentUTC to valid native Date object.`);
        }

        const year = momentUTC.year();
        const month = momentUTC.month() + 1; // moment months are 0-indexed
        const day = momentUTC.date();
        const hour = momentUTC.hour();
        const minute = momentUTC.minute();
        const second = momentUTC.second();
        const ut = hour + minute / 60 + second / 3600; // Universal Time decimal hours

        // 4. Calculate Julian Day UT using Swisseph
        const jdResult = swisseph.swe_julday(year, month, day, ut, swisseph.SE_GREG_CAL);

        if (typeof jdResult !== 'number' || isNaN(jdResult)) {
            // Check if swisseph returned an error object/code instead
            let swissephError = '';
            if (typeof jdResult === 'object' && jdResult !== null && jdResult.error) {
                swissephError = ` Swisseph error: ${jdResult.error}`;
            }
            throw new Error(`swisseph.swe_julday returned invalid result (${jdResult}) for ${momentUTC.toISOString()}.${swissephError}`);
        }

        // 5. Get the offset that was applied by moment-timezone (for reference/logging)
        const timezoneOffsetMinutes = momentLocal.utcOffset(); // Get offset in minutes from UTC for the *original* moment
        const timezoneOffsetHours = timezoneOffsetMinutes / 60;

        // Optional: Log detailed info for debugging
        logger.debug(`[getJulianDateUT] Input: ${localDateString}, Lat: ${latitude}, Lon: ${longitude}`);
        logger.debug(`[getJulianDateUT] Found TZ: ${timezoneName}, Offset (hours): ${timezoneOffsetHours.toFixed(2)}`);
        logger.debug(`[getJulianDateUT] Calculated UTC: ${momentUTC.toISOString()}`);
        logger.debug(`[getJulianDateUT] Calculated JD(UT): ${jdResult}`);

        // Return the successful result including the offset
        return { julianDayUT: jdResult, utcDate: utcDate, timezoneOffsetHours: timezoneOffsetHours };

    } catch (error) {
        // Log the detailed error
        logger.error(`Error in getJulianDateUT for date "${localDateString}", lat ${latitude}, lon ${longitude}: ${error.message}`, { stack: error.stack });
        // Return nulls as per the original structure on error
        return { julianDayUT: null, utcDate: null, timezoneOffsetHours: null };
    }
}


/**
 * Calculates the Ayanamsa (Lahiri) for a given Julian Day (UT).
 * @param {number} julianDayUT - Julian Day in Universal Time.
 * @returns {number} Ayanamsa value in decimal degrees, or NaN if calculation fails.
 */
export function calculateAyanamsa(julianDayUT) {
    if (typeof julianDayUT !== 'number' || isNaN(julianDayUT)) {
        logger.warn(`calculateAyanamsa received invalid Julian Day: ${julianDayUT}`);
        return NaN;
    }
    try {
        // Ensure sidereal mode is set (though it should be set globally on startup)
        // swisseph.swe_set_sid_mode(swisseph.SE_SIDM_LAHIRI, 0, 0); // Redundant if set globally

        const ayanamsaResult = swisseph.swe_get_ayanamsa_ut(julianDayUT);

        if (typeof ayanamsaResult !== 'number' || isNaN(ayanamsaResult)) {
            // swisseph might return an error code instead of NaN
            logger.error(`swisseph.swe_get_ayanamsa_ut returned invalid result: ${ayanamsaResult} for JD ${julianDayUT}`);
            return NaN;
        }
        return ayanamsaResult;
    } catch (error) {
        logger.error(`Error calculating Ayanamsa for JD ${julianDayUT}: ${error.message}`, { stack: error.stack });
        return NaN;
    }
}

/**
 * Calculates the midpoint between two angles, handling the 360-degree wrap-around.
 * @param {number} angle1 - First angle in degrees [0, 360).
 * @param {number} angle2 - Second angle in degrees [0, 360).
 * @returns {number} The midpoint angle in degrees [0, 360), or NaN if inputs are invalid.
 */
export function calculateMidpoint(angle1, angle2) {
    const normAngle1 = normalizeAngle(angle1);
    const normAngle2 = normalizeAngle(angle2);

    if (isNaN(normAngle1) || isNaN(normAngle2)) {
        logger.warn(`Invalid input for calculateMidpoint: angle1=${angle1}, angle2=${angle2}`);
        return NaN;
    }

    let diff = normAngle2 - normAngle1;

    // Adjust difference for wrap-around
    if (diff > 180) {
        diff -= 360;
    } else if (diff <= -180) {
        diff += 360;
    }

    const midpoint = normAngle1 + diff / 2;
    return normalizeAngle(midpoint);
}
