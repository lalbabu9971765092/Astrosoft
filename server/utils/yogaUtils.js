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
/**
 * Calculates Ravi Pushya Yoga for a given date and location.
 * Ravi Pushya Yoga occurs when Pushya Nakshatra falls on a Sunday.
 * @param {string} dayOfWeek - The day of the week (e.g., "Sunday").
 * @param {string} nakshatraName - The name of the Nakshatra.
 * @param {string} nakshatraStartTime - The start time of the Nakshatra.
 * @param {string} nakshatraEndTime - The end time of the Nakshatra.
 * @returns {Object|null} Ravi Pushya Yoga details or null if not present.
 */
export function calculateRaviPushyaYoga(dayOfWeek, nakshatraName, nakshatraStartTime, nakshatraEndTime) {
    try {
        if (dayOfWeek === "Sunday" && nakshatraName === "Pushya") {
            return {
                name: "raviPushya",
                start: nakshatraStartTime,
                end: nakshatraEndTime,
                type: "auspicious",
                description: `Highly auspicious Ravi Pushya Yoga formed by Pushya Nakshatra on a Sunday.`
            };
        }
        return null;
    } catch (error) {
        logger.error(`Error calculating Ravi Pushya Yoga: ${error.message}`, { stack: error.stack });
        return null;
    }
}

/**
 * Calculates Dwipushkar Yoga.
 * Occurs on Bhadra Tithis (2, 7, 12) falling on Sunday, Tuesday, or Saturday,
 * combined with a "double" nakshatra (Mrigashira, Chitra, Dhanishtha).
 * Any event's result is doubled.
 */
export function calculateDwipushkarYoga(dayOfWeek, tithi, nakshatraName, startTime, endTime) {
    const bhadraTithis = [2, 7, 12];
    const applicableDays = ["Sunday", "Tuesday", "Saturday"];
    const doubleNakshatras = ["Mrigashira", "Chitra", "Dhanishtha"];

    if (applicableDays.includes(dayOfWeek) && bhadraTithis.includes(tithi) && doubleNakshatras.includes(nakshatraName)) {
        return {
            name: "dwipushkarYoga",
            start: startTime,
            end: endTime,
            type: "special",
            description: `Dwipushkar Yoga: Event results may repeat twice. Formed by Tithi ${tithi}, ${nakshatraName} Nakshatra on a ${dayOfWeek}.`
        };
    }
    return null;
}

/**
 * Calculates Tripushkar Yoga.
 * Occurs on Bhadra Tithis (2, 7, 12) falling on Sunday, Tuesday, or Saturday,
 * combined with a "triple" nakshatra.
 * Any event's result is tripled.
 */
export function calculateTripushkarYoga(dayOfWeek, tithi, nakshatraName, startTime, endTime) {
    const bhadraTithis = [2, 7, 12];
    const applicableDays = ["Sunday", "Tuesday", "Saturday"];
    const tripleNakshatras = ["Krittika", "Punarvasu", "Purva Phalguni", "Uttara Ashadha", "Purva Bhadrapada", "Vishakha"];

    if (applicableDays.includes(dayOfWeek) && bhadraTithis.includes(tithi) && tripleNakshatras.includes(nakshatraName)) {
        return {
            name: "tripushkarYoga",
            start: startTime,
            end: endTime,
            type: "special",
            description: `Tripushkar Yoga: Event results may repeat three times. Formed by Tithi ${tithi}, ${nakshatraName} Nakshatra on a ${dayOfWeek}.`
        };
    }
    return null;
}

/**
 * Calculates Ravi Yoga.
 * An auspicious yoga based on the nakshatra distance from Sun to Moon.
 */
export function calculateRaviYoga(sunNakshatraIndex, moonNakshatraIndex, startTime, endTime) {
    const diff = (moonNakshatraIndex - sunNakshatraIndex + 27) % 27 + 1;
    const raviYogaCounts = [4, 6, 9, 10, 13, 20];

    if (raviYogaCounts.includes(diff)) {
        return {
            name: "raviYoga",
            start: startTime,
            end: endTime,
            type: "auspicious",
            description: `Auspicious Ravi Yoga is active.`
        };
    }
    return null;
}

/**
 * Calculates Dagdha Yoga.
 * An inauspicious yoga formed by certain weekday and tithi combinations.
 */
export function calculateDagdhaYoga(dayOfWeek, tithi, startTime, endTime) {
    const dagdhaRules = {
        Sunday: [12],
        Monday: [11],
        Tuesday: [5],
        Wednesday: [3],
        Thursday: [6],
        Friday: [8],
        Saturday: [9]
    };

    if (dagdhaRules[dayOfWeek]?.includes(tithi)) {
        return {
            name: "dagdhaYoga",
            start: startTime,
            end: endTime,
            type: "inauspicious",
            description: `Inauspicious Dagdha Yoga (Burnt Yoga) formed by Tithi ${tithi} on a ${dayOfWeek}. Avoid important work.`
        };
    }
    return null;
}
