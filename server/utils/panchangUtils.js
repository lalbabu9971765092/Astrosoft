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

            // Check for Chaitra month, Shukla paksha.
            // mhah-panchang uses 1-based month index (1 = Chaitra).
            // Relaxed Tithi check to <= 1 (Pratipada or Dwitiya) to handle Kshaya Tithi cases where Pratipada doesn't exist at sunrise.
            if (calendarInfo?.MoonMasa?.ino === 1 &&
                calendarInfo?.Paksha?.name_en_IN === 'Shukla' &&
                tithiInfo?.ino <= 1) {
               
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
    if (!vsNewYearDate || !(vsNewYearDate instanceof Date)) {
        return null;
    }
    // Vikram Samvat = Gregorian Year of Chaitra Shukla Pratipada + 57
    return vsNewYearDate.getUTCFullYear() + 57;
}

// --- Helper Function to Calculate Saka Year ---
function calculateSakaYear(targetDate, vsNewYearDate) { // Saka also starts on Chaitra Shukla Pratipada
    if (!vsNewYearDate || !(vsNewYearDate instanceof Date)) {
        return null;
    }
    // Saka Era = Gregorian Year of Chaitra Shukla Pratipada - 78
    return vsNewYearDate.getUTCFullYear() - 78;
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
export async function calculatePanchang(dateString, latitude, longitude, planetaryPositions) {
    try {
        const utcDate = new Date(dateString);
        if (isNaN(utcDate.getTime())) {
            throw new Error(`Invalid date string provided: ${dateString}`);
        }

        // Use the exact UTC date and time for all calculations as per user request
        const calculationTime = utcDate;


        const obj = new MhahPanchang();
        let panchangDetails = obj.calculate(calculationTime, latitude, longitude);
        let calendarInfo = obj.calendar(calculationTime, latitude, longitude);

        // Calculate solar day
        if (calendarInfo && calendarInfo.Masa && planetaryPositions?.sidereal?.Sun?.longitude) {
            const sunLongitude = planetaryPositions.sidereal.Sun.longitude;
            const solarDay = Math.floor(sunLongitude % 30) + 1;
            calendarInfo.Masa.solar_day = solarDay;
        }

        // Calculate Purnimanta month
        if (calendarInfo && calendarInfo.MoonMasa && calendarInfo.Paksha) {
            // mhah-panchang uses 1-based month index (1 = Chaitra).
            const rawIndex = calendarInfo.MoonMasa.ino;
            // Convert to 0-based index (0 = Chaitra)
            const amantaMonthIndex = (rawIndex - 1 + 12) % 12;
            const paksha = calendarInfo.Paksha.name_en_IN;

            let purnimantaMonthIndex = amantaMonthIndex;
            if (paksha === 'Krishna') {
                purnimantaMonthIndex = (amantaMonthIndex + 1) % 12;
            }

            // Update MoonMasa to be 0-based Amanta
            calendarInfo.MoonMasa.ino = amantaMonthIndex;
            calendarInfo.MoonMasa.name = obj.mhahLocalConstant.Masa.name[amantaMonthIndex];
            calendarInfo.MoonMasa.name_en_IN = obj.mhahLocalConstant.Masa.name_en_IN[amantaMonthIndex];

            calendarInfo.PurnimantaMasa = {
                ino: purnimantaMonthIndex,
                name: obj.mhahLocalConstant.Masa.name[purnimantaMonthIndex],
                name_en_IN: obj.mhahLocalConstant.Masa.name_en_IN[purnimantaMonthIndex]
            };
        }

        // --- Enhance Tithi with precise start and end times ---
        if (panchangDetails?.Tithi) {
            if (!panchangDetails.Tithi.start) {
                const prevTithiResult = obj.prevTithi(utcDate, latitude, longitude);
                if (prevTithiResult && prevTithiResult.end) {
                    panchangDetails.Tithi.start = prevTithiResult.end;
                }
            }
            if (!panchangDetails.Tithi.end) {
                const nextTithiResult = obj.nextTithi(utcDate, latitude, longitude);
                if (nextTithiResult && nextTithiResult.start) {
                    panchangDetails.Tithi.end = nextTithiResult.start;
                }
            }
        }

        // --- Enhance Nakshatra with precise start and end times ---
        if (panchangDetails?.Nakshatra) {
            if (!panchangDetails.Nakshatra.start) {
                const prevNakshatraResult = obj.prevNakshatra(utcDate, latitude, longitude);
                if (prevNakshatraResult && prevNakshatraResult.end) {
                    panchangDetails.Nakshatra.start = prevNakshatraResult.end;
                }
            }
            if (!panchangDetails.Nakshatra.end) {
                const nextNakshatraResult = obj.nextNakshatra(utcDate, latitude, longitude);
                if (nextNakshatraResult && nextNakshatraResult.start) {
                    panchangDetails.Nakshatra.end = nextNakshatraResult.start;
                }
            }
        }

        // --- Enhance Yoga with precise start and end times ---
        if (panchangDetails?.Yoga) {
            if (!panchangDetails.Yoga.start) {
                const prevYogaResult = obj.prevYoga(utcDate, latitude, longitude);
                if (prevYogaResult && prevYogaResult.end) {
                    panchangDetails.Yoga.start = prevYogaResult.end;
                }
            }
            if (!panchangDetails.Yoga.end) {
                const nextYogaResult = obj.nextYoga(utcDate, latitude, longitude);
                if (nextYogaResult && nextYogaResult.start) {
                    panchangDetails.Yoga.end = nextYogaResult.start;
                }
            }
        }

        // --- Enhance Karna with precise start and end times ---
        if (panchangDetails?.Karna) {
            if (!panchangDetails.Karna.start) {
                const prevKarnaResult = obj.prevKarna(utcDate, latitude, longitude);
                if (prevKarnaResult && prevKarnaResult.end) {
                    panchangDetails.Karna.start = prevKarnaResult.end;
                }
            }
            if (!panchangDetails.Karna.end) {
                const nextKarnaResult = obj.nextKarna(utcDate, latitude, longitude);
                if (nextKarnaResult && nextKarnaResult.start) {
                    panchangDetails.Karna.end = nextKarnaResult.start;
                }
            }
        }

        // Calculate Vikram Samvat and Saka Year
        let vsNewYearDate = await findChaitraShuklaPratipada(utcDate.getUTCFullYear(), latitude, longitude);

        // If the new year for the *current* Gregorian year hasn't happened yet
        // (e.g., it's January and the new year is in March),
        // we need to base our calculation on the *previous* year's new year date.
        if (!vsNewYearDate || utcDate < vsNewYearDate) {
            vsNewYearDate = await findChaitraShuklaPratipada(utcDate.getUTCFullYear() - 1, latitude, longitude);
        }

        const vikramSamvat = calculateVikramSamvat(utcDate, vsNewYearDate);
        const sakaYear = calculateSakaYear(utcDate, vsNewYearDate);
        const samvatsarName = getSamvatsarNameFromSaka(sakaYear);

        // Explicitly extract and format Tithi to ensure start/end are present and are ISO strings
        const tithiData = panchangDetails?.Tithi ? {
            name: panchangDetails.Tithi.name,
            name_en_IN: panchangDetails.Tithi.name_en_IN,
            ino: panchangDetails.Tithi.ino,
            start: panchangDetails.Tithi.start instanceof Date ? panchangDetails.Tithi.start.toISOString() : panchangDetails.Tithi.start,
            end: panchangDetails.Tithi.end instanceof Date ? panchangDetails.Tithi.end.toISOString() : panchangDetails.Tithi.end,
        } : null;

        // Explicitly extract and format Nakshatra
        const nakshatraData = panchangDetails?.Nakshatra ? {
            name: panchangDetails.Nakshatra.name,
            name_en_IN: panchangDetails.Nakshatra.name_en_IN,
            ino: panchangDetails.Nakshatra.ino,
            start: panchangDetails.Nakshatra.start instanceof Date ? panchangDetails.Nakshatra.start.toISOString() : panchangDetails.Nakshatra.start,
            end: panchangDetails.Nakshatra.end instanceof Date ? panchangDetails.Nakshatra.end.toISOString() : panchangDetails.Nakshatra.end,
            lord: panchangDetails.Nakshatra.lord, // Keep existing properties
        } : null;

        // Explicitly extract and format Yoga
        const yogaData = panchangDetails?.Yoga ? {
            name: panchangDetails.Yoga.name,
            name_en_IN: panchangDetails.Yoga.name_en_IN,
            ino: panchangDetails.Yoga.ino,
            start: panchangDetails.Yoga.start instanceof Date ? panchangDetails.Yoga.start.toISOString() : panchangDetails.Yoga.start,
            end: panchangDetails.Yoga.end instanceof Date ? panchangDetails.Yoga.end.toISOString() : panchangDetails.Yoga.end,
        } : null;

        // Explicitly extract and format Karna
        const karnaData = panchangDetails?.Karna ? {
            name: panchangDetails.Karna.name,
            name_en_IN: panchangDetails.Karna.name_en_IN,
            ino: panchangDetails.Karna.ino,
            start: panchangDetails.Karna.start instanceof Date ? panchangDetails.Karna.start.toISOString() : panchangDetails.Karna.start,
            end: panchangDetails.Karna.end instanceof Date ? panchangDetails.Karna.end.toISOString() : panchangDetails.Karna.end,
        } : null;

        const finalPanchang = {
            ...panchangDetails,
            ...calendarInfo,
            Tithi: tithiData, // Override with our explicitly formatted Tithi
            Nakshatra: nakshatraData, // Override with explicitly formatted Nakshatra
            Yoga: yogaData, // Override with explicitly formatted Yoga
            Karna: karnaData, // Override with explicitly formatted Karna
            vikram_samvat: vikramSamvat,
            SakaYear: sakaYear,
            samvatsar: samvatsarName,
        };
        // Create a deep copy to prevent external modifications by the library
        return JSON.parse(JSON.stringify(finalPanchang));
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