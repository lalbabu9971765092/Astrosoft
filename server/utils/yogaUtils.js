// utils/yogaUtils.js
import logger from './logger.js';

const SARVARTH_SIDDHA_YOGA_RULES = {
    Sunday: ["Hasta", "Moola", "Uttara Ashadha", "Uttara Phalguni", "Uttara Bhadrapada", "Ashwini", "Pushya"],
    Monday: ["Shravana", "Rohini", "Mrigashira", "Pushya", "Anuradha"],
    Tuesday: ["Ashwini", "Uttara Bhadrapada", "Krittika", "Ashlesha"],
    Wednesday: ["Rohini", "Anuradha", "Hasta", "Krittika", "Mrigashira"],
    Thursday: ["Revati", "Anuradha", "Ashwini", "Punarvasu", "Pushya"],
    Friday: ["Revati", "Anuradha", "Ashwini", "Punarvasu", "Shravana"],
    Saturday: ["Shravana", "Rohini", "Swati"],
};

const AMRIT_SIDDHI_YOGA_RULES = {
    Sunday: ["Hasta"],
    Monday: ["Mrigashira"],
    Tuesday: ["Ashwini"],
    Wednesday: ["Anuradha"],
    Thursday: ["Pushya"],
    Friday: ["Revati"],
    Saturday: ["Rohini"],
};

const VISHA_YOGA_RULES = {
    Sunday: ["Magha"],
    Monday: ["Rohini"],
    Tuesday: ["Ashlesha"],
    Wednesday: ["Jyeshtha"],
    Thursday: ["Moola"],
    Friday: ["Purva Ashadha"],
    Saturday: ["Shatabhisha"],
};

/**
 * Calculates Visha Yoga for a given date and location.
 * @param {string} dayOfWeek - The day of the week (e.g., "Sunday").
 * @param {string} nakshatraName - The name of the Nakshatra.
 * @param {string} nakshatraStartTime - The start time of the Nakshatra.
 * @param {string} nakshatraEndTime - The end time of the Nakshatra.
 * @returns {Object|null} Visha Yoga details or null if not present.
 */
export function calculateVishaYoga(dayOfWeek, nakshatraName, nakshatraStartTime, nakshatraEndTime) {
    try {
        const applicableNakshatras = VISHA_YOGA_RULES[dayOfWeek];
        if (applicableNakshatras && applicableNakshatras.includes(nakshatraName)) {
            return {
                name: "vishaYoga",
                start: nakshatraStartTime,
                end: nakshatraEndTime,
                type: "inauspicious",
                description: `Inauspicious Visha Yoga formed by ${nakshatraName} on a ${dayOfWeek}.`
            };
        }
        return null;
    } catch (error) {
        logger.error(`Error calculating Visha Yoga: ${error.message}`, { stack: error.stack });
        return null;
    }
}

/**
 * Calculates Sarvarth Siddha Yoga for a given date and location.
 * @param {string} dayOfWeek - The day of the week (e.g., "Sunday").
 * @param {string} nakshatraName - The name of the Nakshatra.
 * @param {string} nakshatraStartTime - The start time of the Nakshatra.
 * @param {string} nakshatraEndTime - The end time of the Nakshatra.
 * @returns {Object|null} Sarvarth Siddha Yoga details or null if not present.
 */
export function calculateSarvarthSiddhaYoga(dayOfWeek, nakshatraName, nakshatraStartTime, nakshatraEndTime) {
    try {
        const applicableNakshatras = SARVARTH_SIDDHA_YOGA_RULES[dayOfWeek];
        if (applicableNakshatras && applicableNakshatras.includes(nakshatraName)) {
            return {
                name: "sarvarthSiddhi",
                start: nakshatraStartTime,
                end: nakshatraEndTime,
                type: "auspicious",
                description: `Auspicious yoga formed by ${nakshatraName} on a ${dayOfWeek}.`
            };
        }
        return null;
    } catch (error) {
        logger.error(`Error calculating Sarvarth Siddha Yoga: ${error.message}`, { stack: error.stack });
        return null;
    }
}

/**
 * Calculates Amrit Siddhi Yoga for a given date and location.
 * @param {string} dayOfWeek - The day of the week (e.g., "Sunday").
 * @param {string} nakshatraName - The name of the Nakshatra.
 * @param {string} nakshatraStartTime - The start time of the Nakshatra.
 * @param {string} nakshatraEndTime - The end time of the Nakshatra.
 * @returns {Object|null} Amrit Siddhi Yoga details or null if not present.
 */
export function calculateAmritSiddhiYoga(dayOfWeek, nakshatraName, nakshatraStartTime, nakshatraEndTime) {
    try {
        const applicableNakshatras = AMRIT_SIDDHI_YOGA_RULES[dayOfWeek];
        if (applicableNakshatras && applicableNakshatras.includes(nakshatraName)) {
            return {
                name: "amritSiddhi",
                start: nakshatraStartTime,
                end: nakshatraEndTime,
                type: "auspicious",
                description: `Auspicious yoga formed by ${nakshatraName} on a ${dayOfWeek}.`
            };
        }
        return null;
    } catch (error) {
        logger.error(`Error calculating Amrit Siddhi Yoga: ${error.message}`, { stack: error.stack });
        return null;
    }
}

/**
 * Calculates Guru Pushya Yoga for a given date and location.
 * Guru Pushya Yoga occurs when Pushya Nakshatra falls on a Thursday.
 * @param {string} dayOfWeek - The day of the week (e.g., "Thursday").
 * @param {string} nakshatraName - The name of the Nakshatra.
 * @param {string} nakshatraStartTime - The start time of the Nakshatra.
 * @param {string} nakshatraEndTime - The end time of the Nakshatra.
 * @returns {Object|null} Guru Pushya Yoga details or null if not present.
 */
export function calculateGuruPushyaYoga(dayOfWeek, nakshatraName, nakshatraStartTime, nakshatraEndTime) {
    try {
        if (dayOfWeek === "Thursday" && nakshatraName === "Pushya") {
            return {
                name: "guruPushya",
                start: nakshatraStartTime,
                end: nakshatraEndTime,
                type: "auspicious",
                description: `Highly auspicious Guru Pushya Yoga formed by Pushya Nakshatra on a Thursday.`
            };
        }
        return null;
    } catch (error) {
        logger.error(`Error calculating Guru Pushya Yoga: ${error.message}`, { stack: error.stack });
        return null;
    }
}