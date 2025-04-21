// utils/coreUtils.js
import swisseph from 'swisseph-v2';
import logger from './logger.js';
import { RASHI_SPAN } from './constants.js';

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
 * Calculates the Julian Day (UT) for a given date/time string and longitude.
 * @param {string} dateString - ISO 8601 format date string (e.g., "YYYY-MM-DDTHH:MM:SS").
 * @param {number} longitude - Observer's longitude in decimal degrees.
 * @returns {{julianDayUT: number, utcDate: Date} | {julianDayUT: null, utcDate: null}} Object containing Julian Day UT and the corresponding UTC Date object, or nulls on error.
 */
export function getJulianDateUT(dateString, longitude) {
    try {
        const localDate = new Date(dateString);
        if (isNaN(localDate.getTime())) {
            throw new Error(`Invalid date string provided: "${dateString}"`);
        }

        // Calculate timezone offset in hours (longitude / 15)
        // Note: This is a simplification. Real timezone offsets can be non-integer and vary politically.
        // For astrological calculations focused on UT, this conversion from local *apparent* time might be sufficient if the input `dateString` represents local time.
        // If `dateString` is already UTC, longitude isn't needed here. Assuming it's local time for now.
        const timezoneOffsetHours = longitude / RASHI_SPAN * 2; // Longitude / 15

        // Calculate UTC time
        const utcTimestamp = localDate.getTime() - (timezoneOffsetHours * 60 * 60 * 1000);
        const utcDate = new Date(utcTimestamp);

        if (isNaN(utcDate.getTime())) {
             throw new Error(`Could not calculate valid UTC date from local: ${dateString} and longitude: ${longitude}`);
        }

        // Use Swisseph to get Julian Day UT
        const year = utcDate.getUTCFullYear();
        const month = utcDate.getUTCMonth() + 1; // JS months are 0-indexed
        const day = utcDate.getUTCDate();
        const hour = utcDate.getUTCHours();
        const minute = utcDate.getUTCMinutes();
        const second = utcDate.getUTCSeconds();
        const ut = hour + minute / 60 + second / 3600;

        const jdResult = swisseph.swe_julday(year, month, day, ut, swisseph.SE_GREG_CAL);

        if (typeof jdResult !== 'number' || isNaN(jdResult)) {
            throw new Error(`swisseph.swe_julday returned invalid result for ${utcDate.toISOString()}`);
        }

        return { julianDayUT: jdResult, utcDate: utcDate };

    } catch (error) {
        logger.error(`Error in getJulianDateUT for date "${dateString}", lon ${longitude}: ${error.message}`, { stack: error.stack });
        return { julianDayUT: null, utcDate: null };
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
