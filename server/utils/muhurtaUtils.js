// utils/muhurtaUtils.js
import { normalizeAngle, getJulianDateUT, calculateAyanamsa, convertToDMS } from './coreUtils.js';
import { calculateHousesAndAscendant } from './coreUtils.js';
import { getNakshatraDetails, getRashiDetails, calculatePlanetaryPositions, getMoonNakshatraEntryExitTimes, calculateAbhijitMuhurta, calculateVarjyam } from './planetaryUtils.js';
import { calculateSunMoonTimes } from './panchangUtils.js';
import { DISHA_SHOOL_DIRECTIONS } from './constants.js';
import { calculateMoolDosha } from './doshaUtils.js';
import { calculateSarvarthSiddhaYoga, calculateAmritSiddhiYoga, calculateVishaYoga, calculateGuruPushyaYoga } from './yogaUtils.js';
import { calculateChoghadiya } from './muhurta/choghadiyaUtils.js';
import { calculateHora } from './muhurta/horaUtils.js';
import { calculateRahuKaal, calculateDurMuhurta, calculateGuliKaal, calculateYamGhanta, calculatePradoshKaal } from './muhurta/kaalUtils.js';
import { calculateBhadra } from './muhurta/bhadraUtils.js';
import logger from './logger.js';
import moment from 'moment-timezone';

// --- Lagna (Ascendant) Calculation for the day ---
/**
 * Calculates Lagna (Ascendant) for each hour of a given day.
 * @param {string} dateString - Local date string (YYYY-MM-DDTHH:MM:SS).
 * @param {number} latitude - Observer's latitude.
 * @param {number} longitude - Observer's longitude.
 * @returns {Array<Object>} Array of Lagna details for each hour.
 */
export async function calculateLagnasForDay(latitude, longitude, sunrise, nextSunrise) {
    try {
        const lagnas = [];

        if (!sunrise || !sunrise.isValid() || !nextSunrise || !nextSunrise.isValid()) {
            logger.warn(`Invalid sunrise or nextSunrise provided for Lagna calculation.`);
            return [];
        }

        let currentMoment = sunrise.clone();
        let lastRashi = null;

        while (currentMoment.isBefore(nextSunrise)) {
            const { julianDayUT } = getJulianDateUT(currentMoment.toISOString(), latitude, longitude);

            if (julianDayUT === null) {
                currentMoment.add(1, 'minute');
                continue;
            }

            const ayanamsa = calculateAyanamsa(julianDayUT);
            const { tropicalAscendant } = calculateHousesAndAscendant(julianDayUT, latitude, longitude);
            const siderealAscendantDeg = normalizeAngle(tropicalAscendant - ayanamsa);
            const rashiDetails = getRashiDetails(siderealAscendantDeg);

            if (lastRashi && rashiDetails.name !== lastRashi.rashi) {
                if (lagnas.length > 0) {
                    lagnas[lagnas.length - 1].end_time = currentMoment.toISOString();
                }
                lagnas.push({
                    start_time: currentMoment.toISOString(),
                    rashi: rashiDetails.name,
                    rashiLord: rashiDetails.lord,
                });
            } else if (!lastRashi) {
                lagnas.push({
                    start_time: currentMoment.toISOString(),
                    rashi: rashiDetails.name,
                    rashiLord: rashiDetails.lord,
                });
            }

            lastRashi = {
                rashi: rashiDetails.name,
                rashiLord: rashiDetails.lord,
            };

            currentMoment.add(15, 'minutes');
        }

        if (lagnas.length > 0) {
            lagnas[lagnas.length - 1].end_time = nextSunrise.toISOString();
        }

        return lagnas;
    } catch (error) {
        logger.error(`Error calculating Lagnas for day: ${error.message}`, { stack: error.stack });
        throw new Error(`Failed to calculate Lagnas: ${error.message}`);
    }
}

/**
 * Calculates Panchak for a given date and location.
 * Panchak is an inauspicious period based on Moon's Nakshatra.
 * @param {string} dateString - Local date string (YYYY-MM-DDTHH:MM:SS).
 * @param {number} latitude - Observer's latitude.
 * @param {number} longitude - Observer's longitude.
 * @returns {Object|null} Panchak details or null if not calculable.
 */
export async function calculatePanchak(dateString, latitude, longitude, sunrise, nextSunrise) {
    try {
        const { julianDayUT } = getJulianDateUT(dateString, latitude, longitude);
        if (julianDayUT === null) {
            logger.warn(`Julian Day UT not available for Panchak calculation on ${dateString}`);
            return null;
        }

        const planetaryPositions = await calculatePlanetaryPositions(julianDayUT);
        const moonLongitude = planetaryPositions?.sidereal?.Moon?.longitude;

        if (moonLongitude === undefined || isNaN(moonLongitude)) {
            logger.warn(`Moon longitude not available for Panchak calculation on ${dateString}`);
            return null;
        }

        const nakshatraDetails = getNakshatraDetails(moonLongitude);
        const nakshatraName = nakshatraDetails.name;
        const nakshatraIndex = nakshatraDetails.index;

        const panchakNakshatras = ["Dhanishtha", "Shatabhisha", "Purva Bhadrapada", "Uttara Bhadrapada", "Revati"];

        if (!sunrise || !nextSunrise || !sunrise.isValid() || !nextSunrise.isValid()) {
            logger.warn(`Sunrise/NextSunrise not available for Panchak calculation on ${dateString}`);
            return null;
        }

        // Get Moon's Nakshatra at sunrise and next sunrise
        const { julianDayUT: sunriseJD } = getJulianDateUT(sunrise.toISOString(), latitude, longitude);
        const sunriseMoonLng = (await calculatePlanetaryPositions(sunriseJD))?.sidereal?.Moon?.longitude;
        const sunriseNakshatraIndex = sunriseMoonLng !== undefined && !isNaN(sunriseMoonLng) ? getNakshatraDetails(sunriseMoonLng).index : -1;

        const { julianDayUT: nextSunriseJD } = getJulianDateUT(nextSunrise.toISOString(), latitude, longitude);
        const nextSunriseMoonLng = (await calculatePlanetaryPositions(nextSunriseJD))?.sidereal?.Moon?.longitude;
        const nextSunriseNakshatraIndex = nextSunriseMoonLng !== undefined && !isNaN(nextSunriseMoonLng) ? getNakshatraDetails(nextSunriseMoonLng).index : -1;

        const isPanchakAtSunrise = panchakNakshatras.includes(getNakshatraDetails(sunriseMoonLng).name);
        const isPanchakAtNextSunrise = panchakNakshatras.includes(getNakshatraDetails(nextSunriseMoonLng).name);

        if (panchakNakshatras.includes(nakshatraName) || isPanchakAtSunrise || isPanchakAtNextSunrise) {
            let finalEntryTime = null;
            let finalExitTime = null;

            if (isPanchakAtSunrise) {
                finalEntryTime = sunrise.toISOString();
            } else {
                const { entryTime } = await getMoonNakshatraEntryExitTimes(dateString, latitude, longitude, nakshatraIndex, sunrise, nextSunrise);
                finalEntryTime = entryTime;
            }

            if (isPanchakAtNextSunrise) {
                finalExitTime = nextSunrise.toISOString();
            } else {
                const { exitTime } = await getMoonNakshatraEntryExitTimes(dateString, latitude, longitude, nakshatraIndex, sunrise, nextSunrise);
                finalExitTime = exitTime;
            }

            const dayOfWeek = sunrise.day(); // 0 for Sunday, 6 for Saturday

            let panchakType = "General Panchak";
            switch (dayOfWeek) {
                case 0: panchakType = "Rog Panchak (Sunday)"; break;
                case 1: panchakType = "Raj Panchak (Monday)"; break;
                case 2: panchakType = "Agni Panchak (Tuesday)"; break;
                case 3: panchakType = "General Panchak (Wednesday)"; break; // No specific name often
                case 4: panchakType = "General Panchak (Thursday)"; break; // No specific name often
                case 5: panchakType = "Chor Panchak (Friday)"; break;
                case 6: panchakType = "Mrityu Panchak (Saturday)"; break;
            }

            return {
                name: "Panchak",
                start: finalEntryTime,
                end: finalExitTime,
                type: "inauspicious",
                description: `Panchak period due to Moon in ${nakshatraName} Nakshatra. Type: ${panchakType}. Avoid auspicious activities.`
            };
        }

        return null; // Not a Panchak period

    } catch (error) {
        logger.error(`Error calculating Panchak for ${dateString}: ${error.message}`, { stack: error.stack });
        return null;
    }
}

/**
 * Calculates Disha Shool (inauspicious direction for travel) for a given day of the week.
 * @param {number} dayOfWeek - The day of the week (0 for Sunday, 6 for Saturday).
 * @returns {string} The inauspicious direction for travel.
 */
export function calculateDishaShool(dayOfWeek) {
    const direction = DISHA_SHOOL_DIRECTIONS[dayOfWeek];
    if (!direction) {
        logger.warn(`Disha Shool direction not found for day of week: ${dayOfWeek}`);
        return "Unknown";
    }
    return direction;
}

/**
 * Calculates various Muhurtas for a given date, time, and location.
 * @param {string} dateString - Local date string (YYYY-MM-DDTHH:MM:SS).
 * @param {number} latitude - Observer's latitude.
 * @param {number} longitude - Observer's longitude.
 * @returns {Object} Object containing Choghadiya, Horas, Lagnas, Abhijit Muhurta, Rahu Kaal, Yam Ghanta, Guli Kaal, Dur Muhurta, Pradosh Kaal, Varjyam, and Panchak.
 */
export async function calculateMuhurta(dateString, latitude, longitude) {
    // --- Date Standardization ---
    // Use moment to parse the potentially messy incoming date string (e.g., from JS new Date()).
    const momentDate = moment(dateString);
    if (!momentDate.isValid()) {
        throw new Error(`Invalid date string provided to calculateMuhurta: "${dateString}"`);
    }
    // Standardize the date into the format expected by other utils.
    const standardizedDateString = momentDate.format('YYYY-MM-DDTHH:mm:ss');
    // --- End Standardization ---

    const { julianDayUT, utcDate, momentLocal } = getJulianDateUT(dateString, latitude, longitude);
    if (julianDayUT === null) {
        throw new Error("Invalid date or location for Muhurta calculation.");
    }
    const planetaryPositions = await calculatePlanetaryPositions(julianDayUT);

    // First, get sunrise for the given date to see if we are before it.
    const initialSunMoonTimes = await calculateSunMoonTimes(utcDate, latitude, longitude);
    const initialSunrise = initialSunMoonTimes.sunrise ? moment(initialSunMoonTimes.sunrise) : null;

    let targetUtcDate = utcDate;
    // If the calculation time is before today's sunrise, we need to calculate for the previous day's night periods.
    if (initialSunrise && momentLocal.isBefore(initialSunrise)) {
        targetUtcDate = moment(utcDate).subtract(1, 'day').toDate();
    }

    const sunMoonTimes = await calculateSunMoonTimes(targetUtcDate, latitude, longitude);
    const sunrise = sunMoonTimes.sunrise ? moment(sunMoonTimes.sunrise) : null;
    const sunset = sunMoonTimes.sunset ? moment(sunMoonTimes.sunset) : null;
    
    const nextDayUtcDate = moment(targetUtcDate).add(1, 'day').toDate();
    const nextDaySunMoonTimes = await calculateSunMoonTimes(nextDayUtcDate, latitude, longitude);
    const nextSunrise = nextDaySunMoonTimes.sunrise ? moment(nextDaySunMoonTimes.sunrise) : null;

    if (!sunrise || !sunset || !nextSunrise || !sunrise.isValid() || !sunset.isValid() || !nextSunrise.isValid()) {
        logger.warn(`Sunrise/Sunset/NextSunrise not available for comprehensive Muhurta calculation on ${dateString}`);
        return {
            inputParameters: { date: dateString, latitude, longitude, day: 'N/A', sunrise: null, sunset: null },
            choghadiya: [], horas: [], lagnas: [], muhurta: []
        };
    }

    const dayDurationMs = sunset.diff(sunrise);
    const nightDurationMs = nextSunrise.diff(sunset);
    const dayOfWeek = moment(targetUtcDate).day(); // 0 for Sunday, 1 for Monday, etc.

    const choghadiya = await calculateChoghadiya(sunrise, sunset, nextSunrise, dayDurationMs, nightDurationMs, dayOfWeek);
    const horas = await calculateHora(sunrise, sunset, nextSunrise, dayDurationMs, nightDurationMs, dayOfWeek);
    const lagnas = await calculateLagnasForDay(latitude, longitude, sunrise, nextSunrise);
    const abhijitMuhurta = calculateAbhijitMuhurta(sunrise, dayDurationMs);
    const rahuKaal = calculateRahuKaal(sunrise, dayDurationMs, dayOfWeek);
    const yamGhanta = calculateYamGhanta(sunrise, dayDurationMs, dayOfWeek);
    const guliKaals = calculateGuliKaal(sunrise, sunset, dayDurationMs, nightDurationMs, dayOfWeek); // Returns an array
    const durMuhurtas = calculateDurMuhurta(sunrise, sunset, dayDurationMs, nightDurationMs, dayOfWeek);
    const pradoshKaal = calculatePradoshKaal(sunset);
    const varjyam = await calculateVarjyam(utcDate, latitude, longitude, sunrise, nextSunrise);
    const panchak = await calculatePanchak(utcDate, latitude, longitude, sunrise, nextSunrise);
    const gandMool = await calculateMoolDosha(utcDate, latitude, longitude, planetaryPositions.sidereal, sunrise, nextSunrise);
    const bhadra = await calculateBhadra(latitude, longitude, sunrise, nextSunrise); // Corrected call
    const dishaShool = calculateDishaShool(dayOfWeek);

    const muhurtaPeriods = [];
    if (abhijitMuhurta) muhurtaPeriods.push(abhijitMuhurta);
    if (rahuKaal) muhurtaPeriods.push(rahuKaal);
    if (yamGhanta) muhurtaPeriods.push(yamGhanta);
    if (guliKaals && guliKaals.length > 0) muhurtaPeriods.push(...guliKaals); // Spread the array
    if (durMuhurtas && durMuhurtas.length > 0) muhurtaPeriods.push(...durMuhurtas); // Spread the array
    if (pradoshKaal) muhurtaPeriods.push(pradoshKaal);
    if (varjyam) muhurtaPeriods.push(varjyam);
    if (panchak) muhurtaPeriods.push(panchak);
    if (bhadra && bhadra.length > 0) muhurtaPeriods.push(...bhadra);
    if (gandMool && gandMool.present) muhurtaPeriods.push({
        name: "Gand Mool Dosha",
        start: gandMool.start,
        end: gandMool.end,
        type: "inauspicious",
        description: gandMool.reason || "Gand Mool Dosha is present."
    });

    const nakshatraDetails = getNakshatraDetails(planetaryPositions.sidereal.Moon.longitude);
    const nakshatraName = nakshatraDetails.name;
    
    // Calculate Yogas for the entire day
    let currentNakshatraTime = sunrise.clone();
    while (currentNakshatraTime.isBefore(nextSunrise)) {
        const { julianDayUT: nakshatraJD } = getJulianDateUT(currentNakshatraTime.toISOString(), latitude, longitude);
        const nakshatraPositions = await calculatePlanetaryPositions(nakshatraJD);
        const currentNakshatraDetails = getNakshatraDetails(nakshatraPositions.sidereal.Moon.longitude);
        const { entryTime, exitTime } = await getMoonNakshatraEntryExitTimes(currentNakshatraTime.toISOString(), latitude, longitude, currentNakshatraDetails.index, sunrise, nextSunrise);

        if (entryTime && exitTime) {
            const dayName = momentLocal.format('dddd');
            const sarvarthSiddhaYoga = calculateSarvarthSiddhaYoga(dayName, currentNakshatraDetails.name, entryTime, exitTime);
            if (sarvarthSiddhaYoga) {
                muhurtaPeriods.push(sarvarthSiddhaYoga);
            }

            const amritSiddhiYoga = calculateAmritSiddhiYoga(dayName, currentNakshatraDetails.name, entryTime, exitTime);
            if (amritSiddhiYoga) {
                muhurtaPeriods.push(amritSiddhiYoga);
            }

            const vishaYoga = calculateVishaYoga(dayName, currentNakshatraDetails.name, entryTime, exitTime);
            if (vishaYoga) {
                muhurtaPeriods.push(vishaYoga);
            }

            const guruPushyaYoga = calculateGuruPushyaYoga(dayName, currentNakshatraDetails.name, entryTime, exitTime);
            if (guruPushyaYoga) {
                muhurtaPeriods.push(guruPushyaYoga);
            }
        }

        if (exitTime && moment(exitTime).isAfter(currentNakshatraTime)) {
            currentNakshatraTime = moment(exitTime).add(1, 'minute');
        } else {
            // If exitTime is not advancing, manually advance time to avoid an infinite loop
            // and ensure we check the whole day.
            currentNakshatraTime.add(1, 'hour');
        }
    }

    // Get the day name from the sunrise moment object
    const dayName = sunrise ? sunrise.format('dddd') : 'N/A';

    // Find active periods based on the calculation time
    const calculationTime = momentLocal;
    const activeChoghadiya = choghadiya.find(c => calculationTime.isBetween(moment.utc(c.start), moment.utc(c.end)));
    const activeHora = horas.find(h => calculationTime.isBetween(moment.utc(h.start), moment.utc(h.end)));
    const activeLagna = lagnas.find(l => calculationTime.isBetween(moment.utc(l.start_time), moment.utc(l.end_time)));
    const activeBhadra = bhadra.find(b => calculationTime.isBetween(moment.utc(b.start), moment.utc(b.end)));

    return {
        inputParameters: { 
            date: targetUtcDate.toISOString(), 
            latitude, 
            longitude, 
            day: moment(targetUtcDate).format('dddd'), // Get day name from adjusted date
            sunrise: sunrise ? sunrise.toISOString() : null, // Add sunrise
            sunset: sunset ? sunset.toISOString() : null, // Add sunset
            nextSunrise: nextSunrise ? nextSunrise.toISOString() : null, // Add nextSunrise
            dayDurationMs: dayDurationMs, // Add dayDurationMs
            nightDurationMs: nightDurationMs, // Add nightDurationMs
        },
        choghadiya,
        horas,
        lagnas,
        activeChoghadiya,
        activeHora,
        activeLagna,
        bhadra,
        activeBhadra,
        muhurta: muhurtaPeriods, // This now includes Bhadra for the main table
        dishaShool: dishaShool,
        // Use the already combined muhurtaPeriods array to find active yogas
        activeYogas: muhurtaPeriods.filter(yoga => {
            // Use momentLocal which has the correct timezone info from getJulianDateUT
            const calculationTime = momentLocal; 
            const yogaStart = moment.utc(yoga.start).tz(momentLocal.tz());
            const yogaEnd = moment.utc(yoga.end).tz(momentLocal.tz());
            const isActive = calculationTime.isBetween(yogaStart, yogaEnd, null, '[]');

            return isActive;
        })
    };
}