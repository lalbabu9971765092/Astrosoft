// utils/coreUtils.js
import swisseph from 'swisseph-v2';
import logger from './logger.js';
// import { RASHI_SPAN } from './constants.js'; // No longer needed for offset calculation
import { find as geoTz } from 'geo-tz';
import moment from 'moment-timezone'; // Import moment-timezone

/**
 * Normalizes an angle to be within the range [0, 360).
 * @param {number} angle - The angle in degrees.
 * @returns {number} The normalized angle, or NaN if input is invalid.
 */
export function normalizeAngle(angle) {
    if (typeof angle !== 'number' || isNaN(angle)) {
        
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

        // 1. Find IANA Timezone Name using geo-tz (using the imported 'find' function aliased as geoTz)
        const ianaTimezones = geoTz(latitude, longitude); // This should now work
        if (!ianaTimezones || ianaTimezones.length === 0) {
            throw new Error(`Could not find IANA timezone for lat=${latitude}, lon=${longitude}`);
        }
        const timezoneName = ianaTimezones[0];
        logger.info(`getJulianDateUT: localDateString=${localDateString}, lat=${latitude}, lon=${longitude}`);
        logger.info(`getJulianDateUT: Found IANA timezone: ${timezoneName}`);

        let momentLocal;
        // Check if the date string is already in ISO 8601 UTC format (ends with 'Z')
        if (localDateString.endsWith('Z') || /\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z/.test(localDateString)) {
            momentLocal = moment.utc(localDateString);
            logger.info(`getJulianDateUT: Parsed as UTC (ends with Z): ${momentLocal.toISOString()}`);
        } else {
            // Parse local string with explicit format and timezone
            momentLocal = moment.tz(localDateString, 'YYYY-MM-DDTHH:mm:ss', timezoneName);
            logger.info(`getJulianDateUT: Parsed as local (in timezone ${timezoneName}): ${momentLocal.toISOString()}`);
        }

        if (!momentLocal.isValid()) {
             throw new Error(`Invalid date/time string or timezone combination: "${localDateString}", "${timezoneName}"`);
        }

        // 3. Convert to UTC and get components
        const momentUTC = momentLocal.clone().utc();
        logger.info(`getJulianDateUT: momentUTC: ${momentUTC.toISOString()}`);
        const utcDate = momentUTC.toDate();
        if (isNaN(utcDate.getTime())) {
             throw new Error(`Failed to convert momentUTC to valid native Date object.`);
        }

        const year = momentUTC.year();
        const month = momentUTC.month() + 1;
        const day = momentUTC.date();
        const hour = momentUTC.hour();
        const minute = momentUTC.minute();
        const second = momentUTC.second();
        const ut = hour + minute / 60 + second / 3600;

        // 4. Calculate Julian Day UT using Swisseph
        const jdResult = swisseph.swe_julday(year, month, day, ut, swisseph.SE_GREG_CAL);
        if (typeof jdResult !== 'number' || isNaN(jdResult)) {
            let swissephError = '';
            if (typeof jdResult === 'object' && jdResult !== null && jdResult.error) {
                swissephError = ` Swisseph error: ${jdResult.error}`;
            }
            throw new Error(`swisseph.swe_julday returned invalid result (${jdResult}) for ${momentUTC.toISOString()}.${swissephError}`);
        }

        // 5. Get the offset that was applied by moment-timezone
        const timezoneOffsetMinutes = momentLocal.utcOffset();
        const timezoneOffsetHours = timezoneOffsetMinutes / 60;

       

        return { julianDayUT: jdResult, utcDate: utcDate, timezoneOffsetHours: timezoneOffsetHours };

    } catch (error) {
        logger.error(`Error in getJulianDateUT for date "${localDateString}", lat ${latitude}, lon ${longitude}: ${error.message}`, { stack: error.stack });
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


/**
 * Calculates house cusps using the Whole Sign system.
 * @param {number} siderealAscendant - The sidereal longitude of the Ascendant.
 * @returns {number[]} An array of 12 sidereal cusp start degrees.
 */
export function calculateWholeSignHouses(siderealAscendant) {
    if (typeof siderealAscendant !== 'number' || isNaN(siderealAscendant)) {
        logger.warn(`calculateWholeSignHouses received invalid sidereal ascendant: ${siderealAscendant}`);
        return Array(12).fill(NaN);
    }

    // Determine the starting degree of the Ascendant's sign
    const ascendantSignStart = Math.floor(siderealAscendant / 30) * 30;

    const cusps = [];
    for (let i = 0; i < 12; i++) {
        const cusp = normalizeAngle(ascendantSignStart + (i * 30));
        cusps.push(cusp);
    }

    return cusps;
}

export function calculateHousesAndAscendant(julianDayUT, latitude, longitude) {
    if (isNaN(julianDayUT) || isNaN(latitude) || isNaN(longitude)) {
         throw new Error(`Invalid input for calculateHousesAndAscendant: JD=${julianDayUT}, Lat=${latitude}, Lon=${longitude}`);
    }
    try {
        const placidusFlag = swisseph.SE_HSYS_PLACIDUS || 'P';
        const houseResult = swisseph.swe_houses(julianDayUT, latitude, longitude, placidusFlag);

        // --- REVISED CHECK (Accepting length 12 for 'house') ---
        let isValidResult = houseResult &&
                            !houseResult.error &&
                            typeof houseResult.ascendant === 'number' &&
                            !isNaN(houseResult.ascendant) &&
                            Array.isArray(houseResult.house) &&
                            houseResult.house.length === 12; // Expect exactly 12 cusps

        if (!isValidResult) {
            // Log the reason for failure more clearly
            let failureReason = "Unknown reason";
            if (!houseResult) failureReason = "No result object returned.";
            else if (houseResult.error) failureReason = `Explicit error: ${houseResult.error}`;
            else if (typeof houseResult.ascendant !== 'number' || isNaN(houseResult.ascendant)) failureReason = `Invalid ascendant: ${houseResult.ascendant}`;
            else if (!Array.isArray(houseResult.house)) failureReason = `'house' is not an array: ${typeof houseResult.house}`;
            else if (houseResult.house.length !== 12) failureReason = `'house' array length is not 12: length ${houseResult.house.length}`; // Updated log message

            logger.error(`swisseph.swe_houses returned invalid result. Reason: ${failureReason}. Full result: ${JSON.stringify(houseResult)}`, {
                 jd: julianDayUT, lat: latitude, lon: longitude
            });

            // --- Fallback Logic ---
            const ascFallback = swisseph.swe_calc_ut(julianDayUT, swisseph.SE_ASC, 0);
            if (ascFallback && typeof ascFallback.longitude === 'number' && !isNaN(ascFallback.longitude)) {
                 logger.warn("swe_houses failed, using fallback Ascendant calculation. Cusps will be unavailable.");
                 return { tropicalAscendant: normalizeAngle(ascFallback.longitude), tropicalCusps: null };
            } else {
                 logger.error("swe_houses failed AND fallback Ascendant calculation failed.");
                 throw new Error("Failed to calculate valid house cusps and Ascendant.");
            }
            // --- End Fallback Logic ---
        }
        // --- END REVISED CHECK ---

        // If the check passed, process the valid result using houseResult.house
        // Assuming the 12 elements directly correspond to cusps 1-12
        const tropicalCusps = houseResult.house.map(c => normalizeAngle(c)); // Use the whole array
        const tropicalAscendant = normalizeAngle(houseResult.ascendant);

        // Final validation on processed values
        if (tropicalCusps.some(isNaN) || isNaN(tropicalAscendant)) {
             logger.error("Calculated cusps or ascendant contain NaN values after processing.", { rawCusps: houseResult.house, rawAsc: houseResult.ascendant }); // Log raw values
             throw new Error("Calculated cusps or ascendant contain NaN values after processing.");
        }

       
        return { tropicalAscendant, tropicalCusps };

    } catch (error) {
        logger.error(`Error during calculateHousesAndAscendant execution: ${error.message}`, { stack: error.stack });
        throw new Error(`Failed to calculate houses/ascendant: ${error.message}`);
    }
}
