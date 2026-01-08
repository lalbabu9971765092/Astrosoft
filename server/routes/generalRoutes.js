import express from "express"; // Using import syntax
import { query, param, validationResult } from 'express-validator'; // Import validator functions

import { MhahPanchang } from "mhah-panchang";
import SunCalc from 'suncalc'; // Still used for Tithi festivals
import swisseph from 'swisseph-v2'; // Import swisseph directly for precise calculations
import moment from 'moment-timezone'; // Import moment-timezone for date handling

// --- Import Logger ---
import logger from '../utils/logger.js'; // Assuming logger uses ES Module export

// --- Import necessary functions and constants from astrologyUtils ---
// NOTE: Changed require to import assuming you might be using ES Modules elsewhere
// If using CommonJS consistently, keep require
import {
    getJulianDateUT,
    calculatePlanetaryPositions,
    getRashiDetails,
    calculateEclipsesForYear, // Import the eclipse calculation function
    findSunRashiIngressJD, // Import the new function for precise Sankranti calculation
    RASHIS // Import RASHIS for naming Sankrantis
} from '../utils/index.js'; // Adjust path if necessary and ensure utils/index.js exports these


const router = express.Router();

// --- Define Tithi-Based Festival Rules ---
const TITHI_FESTIVAL_RULES = [
    // (Keep existing festival rules - unchanged)
    { name: "Chaitra Navratri Start", month: "Chaitra", tithi: 1, paksha: "Shukla" },
    { name: "Rama Navami", month: "Chaitra", tithi: 9, paksha: "Shukla" },
    { name: "Hanuman Jayanti (Chaitra Purnima)", month: "Chaitra", tithi: 15, paksha: "Shukla" },
    { name: "Akshaya Tritiya", month: "Baisakha", tithi: 3, paksha: "Shukla" },
    { name: "Narasimha Jayanti", month: "Baisakha", tithi: 14, paksha: "Shukla" },
    { name: "Buddha Purnima / Vaisakha Purnima", month: "Baisakha", tithi: 15, paksha: "Shukla" },
    { name: "Shani Jayanti", month: "Jyestha", tithi: 15, paksha: "Krishna" }, // Amavasya
    { name: "Ganga Dussehra", month: "Jyestha", tithi: 10, paksha: "Shukla" },
    { name: "Nirjala Ekadashi", month: "Jyestha", tithi: 11, paksha: "Shukla" },
    { name: "Jyeshtha Purnima", month: "Jyestha", tithi: 15, paksha: "Shukla" },
    { name: "Guru Purnima / Ashadha Purnima", month: "Asadha", tithi: 15, paksha: "Shukla" },
    { name: "Hariyali Teej", month: "Srabana", tithi: 3, paksha: "Shukla" },
    { name: "Nag Panchami", month: "Srabana", tithi: 5, paksha: "Shukla" },
    { name: "Shravana Putrada Ekadashi", month: "Srabana", tithi: 11, paksha: "Shukla" },
    { name: "Raksha Bandhan / Shravana Purnima", month: "Srabana", tithi: 15, paksha: "Shukla" },
    { name: "Kajari Teej", month: "Bhadraba", tithi: 3, paksha: "Krishna" },
    { name: "Krishna Janmashtami", month: "Bhadraba", tithi: 8, paksha: "Krishna" },
    { name: "Hartalika Teej", month: "Bhadraba", tithi: 3, paksha: "Shukla" },
    { name: "Ganesh Chaturthi", month: "Bhadraba", tithi: 4, paksha: "Shukla" },
    { name: "Radha Ashtami", month: "Bhadraba", tithi: 8, paksha: "Shukla" },
    { name: "Anant Chaturdashi", month: "Bhadraba", tithi: 14, paksha: "Shukla" },
    { name: "Sharad Navratri Start", month: "Aswina", tithi: 1, paksha: "Shukla" },
    { name: "Durga Ashtami", month: "Aswina", tithi: 8, paksha: "Shukla" },
    { name: "Maha Navami", month: "Aswina", tithi: 9, paksha: "Shukla" },
    { name: "Vijayadashami (Dussehra)", month: "Aswina", tithi: 10, paksha: "Shukla" },
    { name: "Sharad Purnima / Kojagiri Purnima", month: "Aswina", tithi: 15, paksha: "Shukla" },
    { name: "Karwa Chauth", month: "Karttika", tithi: 4, paksha: "Krishna" },
    { name: "Ahoi Ashtami", month: "Karttika", tithi: 8, paksha: "Krishna" },
    { name: "Dhanteras", month: "Karttika", tithi: 13, paksha: "Krishna" },
    { name: "Narak Chaturdashi (Choti Diwali)", month: "Karttika", tithi: 14, paksha: "Krishna" },
    { name: "Diwali / Lakshmi Puja", month: "Karttika", tithi: 15, paksha: "Krishna" }, // Amavasya
    { name: "Gowardhan Puja", month: "Karttika", tithi: 1, paksha: "Shukla" },
    { name: "Bhai Dooj", month: "Karttika", tithi: 2, paksha: "Shukla" },
    { name: "Chhath Puja (Main Day - Sandhya Arghya)", month: "Karttika", tithi: 6, paksha: "Shukla" },
    { name: "Dev Uthani Ekadashi", month: "Karttika", tithi: 11, paksha: "Shukla" },
    { name: "Kartik Purnima", month: "Karttika", tithi: 15, paksha: "Shukla" },
    { name: "Maha Shivaratri", month: "Phalguna", tithi: 14, paksha: "Krishna" },
    { name: "Holi (Holika Dahan is previous Purnima)", month: "Phalguna", tithi: 15, paksha: "Shukla" }, // Purnima for Holika Dahan
];
// --- End Festival Rules ---

// --- Helper Function for Error Handling ---
function handleRouteError(res, error, routeName, inputData = {}) {
    // Use logger instead of console.error
    logger.error(`Error in ${routeName} route: ${error.message}`, {
        routeName,
        // input: inputData, // Be cautious logging full input in production
        error: error.stack || error // Log stack trace
    });

    const statusCode = error.status || 500;
    const isProduction = process.env.NODE_ENV === 'production';
    const errorMessage = (isProduction && statusCode === 500)
        ? "An internal server error occurred. Please try again later."
        : error.message || "An internal server error occurred.";

    // Avoid sending stack trace in production response
    const errorResponse = { error: errorMessage };
    if (!isProduction && error.stack) {
        errorResponse.stack = error.stack.split('\n'); // Optionally include stack in dev
    }

    res.status(statusCode).json(errorResponse);
}

// --- Helper Function to Find Tithi Dates ---
async function findDatesForTithi(year, tithiNumbers, lat, lon) {
    const targetTithis = Array.isArray(tithiNumbers) ? tithiNumbers : [tithiNumbers];
    if (targetTithis.some(isNaN) || targetTithis.some(t => t < 1 || t > 15)) {
        throw new Error("Invalid Tithi number provided. Must be between 1 and 15.");
    }
    const obj = new MhahPanchang();
    const matchingDates = [];
    const startDate = new Date(Date.UTC(year, 0, 1));
    const endDate = new Date(Date.UTC(year, 11, 31));
    let currentDate = new Date(startDate);
    const datesFound = new Set();

    while (currentDate <= endDate) {
        const currentDateString = currentDate.toISOString().split("T")[0];
        try {
            const sunTimes = SunCalc.getTimes(currentDate, lat, lon);
            const sunriseTime = sunTimes.sunrise;
            const calculationTime = (sunriseTime instanceof Date && !isNaN(sunriseTime))
                                  ? sunriseTime
                                  : new Date(new Date(currentDate).setUTCHours(12, 0, 0, 0)); // Use a copy to avoid mutation

            const detailedPanchang = obj.calculate(calculationTime, lat, lon);
            const calendarInfo = obj.calendar(calculationTime, lat, lon); // Calculate calendar info here
            const sunriseISO = sunriseTime instanceof Date && !isNaN(sunriseTime)
                               ? sunriseTime.toISOString()
                               : null;

            if (detailedPanchang?.Tithi && detailedPanchang?.Paksha) {
                const calculatedTithiNumberIno = detailedPanchang.Tithi.ino;
                let adjustedTithiNumber = (calculatedTithiNumberIno % 15) + 1;
                const calculatedPaksha = detailedPanchang.Paksha.name_en_IN;

                if (targetTithis.includes(adjustedTithiNumber)) {
                    // Get month info
                    let purnimantaMonthName = null;
                    if (calendarInfo && calendarInfo.MoonMasa) {
                        const originalIno = calendarInfo.MoonMasa.ino;
                        const correctedIno = (originalIno - 1 + 12) % 12;
                        const amantaMonthIndex = correctedIno;
                        const paksha = detailedPanchang.Paksha.name_en_IN; // Use paksha from detailedPanchang

                        let purnimantaMonthIndex = amantaMonthIndex;
                        if (paksha === 'Krishna') {
                            purnimantaMonthIndex = (amantaMonthIndex + 1) % 12;
                        }
                        purnimantaMonthName = obj.mhahLocalConstant.Masa.name_en_IN[purnimantaMonthIndex];
                    }

                    const dateKey = `${currentDateString}-${adjustedTithiNumber}-${calculatedPaksha}`;
                    if (!datesFound.has(dateKey)) {
                         matchingDates.push({
                            date: currentDateString,
                            tithiNumber: adjustedTithiNumber,
                            paksha: calculatedPaksha,
                            month: purnimantaMonthName, // Add month here
                            startTime: detailedPanchang.Tithi.start || null,
                            endTime: detailedPanchang.Tithi.end || null,
                            sunrise: sunriseISO,
                        });
                        datesFound.add(dateKey);
                    }
                }
            }
        } catch (e) {
            // Use logger
            logger.error(`[findDatesForTithi] Error calculating Panchang for ${currentDateString}: ${e.message}`);
        }
        currentDate.setUTCDate(currentDate.getUTCDate() + 1);
    }
    matchingDates.sort((a, b) => new Date(a.date) - new Date(b.date));
    return matchingDates;
}
// --- End Helper Function ---

// --- Default Coordinates ---
const defaultLat = 28.829286;
const defaultLon = 77.099827;
// --- Eclipse Calculation Route ---
router.get('/eclipses/:year',
    [ // Validation middleware
        param('year').isInt({ min: 1900, max: 2100 }).withMessage('Invalid year provided.').toInt(),
        query('lat').optional().isFloat({ min: -90, max: 90 }).toFloat().withMessage('Invalid latitude provided.'),
        query('lon').optional().isFloat({ min: -180, max: 180 }).toFloat().withMessage('Invalid longitude provided.')
    ],
    async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        try {
            // Use validated and parsed values
            const yearNum = req.params.year; // This will now be an integer due to .toInt()
            const latitude = req.query.lat ?? defaultLat;
            const longitude = req.query.lon ?? defaultLon;

            // The actual calculation function
            const eclipses = calculateEclipsesForYear(yearNum, latitude, longitude);
            res.json(eclipses);

        } catch (error) {
            // Use the centralized error handler
            handleRouteError(res, error, `/eclipses/${req.params.year}`, req.query);
        }
    }
);
// --- Route: Find specific Tithi Date ---
router.get("/find-tithi-date",
    [ // Apply validation directly
        query('year')
            .isInt({ min: 1900, max: 2100 }).withMessage('Year must be between 1900 and 2100.')
            .toInt(),
        query('tithi')
            .isInt({ min: 1, max: 15 }).withMessage('Tithi must be between 1 and 15.')
            .toInt(),
        query('paksha')
            .isIn(['Shukla', 'Krishna']).withMessage('Paksha must be either Shukla or Krishna.'),
        query('hindiMonth')
            .optional()
            .isString().withMessage('Hindi month must be a string if provided.')
            .trim()
            .notEmpty().withMessage('Hindi month cannot be empty if provided.')
            .escape(), // Added escape
        query('lat')
            .optional()
            .isFloat({ min: -90, max: 90 }).withMessage('Latitude must be between -90 and 90.')
            .toFloat(),
        query('lon')
            .optional()
            .isFloat({ min: -180, max: 180 }).withMessage('Longitude must be between -180 and 180.')
            .toFloat()
    ],
    async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        try {
            // Use validated and potentially defaulted values
            const { year, tithi, paksha, hindiMonth } = req.query;
            const lat = req.query.lat ?? defaultLat;
            const lon = req.query.lon ?? defaultLon;

          
            const allDatesForTithi = await findDatesForTithi(year, tithi, lat, lon);
            const filteredDates = allDatesForTithi.filter(d => {
                const pakshaMatch = d.paksha?.toLowerCase() === paksha?.toLowerCase();
                if (!pakshaMatch) return false;

                if (hindiMonth) {
                    return d.month?.toLowerCase() === hindiMonth.toLowerCase();
                }
                return true;
            });

            res.json({ dates: filteredDates });

        } catch (error) {
            handleRouteError(res, error, '/find-tithi-date', req.query);
        }
    }
);

// --- Route: Find all occurrences of specific Tithis in a year ---
router.get("/find-tithis/:year/:tithiNumber",
    [ // Apply validation directly
        param('year')
            .isInt({ min: 1900, max: 2100 }).withMessage('Year must be between 1900 and 2100.')
            .toInt(),
        param('tithiNumber')
            .isInt({ min: 1, max: 15 }).withMessage('Tithi number must be between 1 and 15.')
            .toInt(),
        query('lat')
            .optional()
            .isFloat({ min: -90, max: 90 }).withMessage('Latitude must be between -90 and 90.')
            .toFloat(),
        query('lon')
            .optional()
            .isFloat({ min: -180, max: 180 }).withMessage('Longitude must be between -180 and 180.')
            .toFloat()
    ],
    async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        try {
            // Use validated values from params and query (with defaults)
            const { year, tithiNumber } = req.params;
            const lat = req.query.lat ?? defaultLat;
            const lon = req.query.lon ?? defaultLon;

            const matchingDates = await findDatesForTithi(year, tithiNumber, lat, lon);

            // Determine label based on tithi number
            let tithiLabel = `Tithi ${tithiNumber}`;
            if (tithiNumber === 11) tithiLabel = "Ekadashi";
            else if (tithiNumber === 13) tithiLabel = "Trayodashi / Pradosh";
            else if (tithiNumber === 14) tithiLabel = "Chaturdashi";
            else if (tithiNumber === 15) tithiLabel = "Purnima / Amavasya";

            res.json({ tithiLabel: tithiLabel, dates: matchingDates });

        } catch (error) {
            handleRouteError(res, error, `/find-tithis/${req.params.year}/${req.params.tithiNumber}`, { ...req.params, ...req.query });
        }
    }
);

// --- Route: Calculate Tithi-Based Festivals ---
router.get("/tithi-festivals/:year",
    [ // Apply validation directly
        param('year')
            .isInt({ min: 1900, max: 2100 }).withMessage('Year must be between 1900 and 2100.')
            .toInt(),
        query('lat')
            .optional()
            .isFloat({ min: -90, max: 90 }).withMessage('Latitude must be between -90 and 90.')
            .toFloat(),
        query('lon')
            .optional()
            .isFloat({ min: -180, max: 180 }).withMessage('Longitude must be between -180 and 180.')
            .toFloat()
    ],
    async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        try {
            // Use validated values
            const { year } = req.params;
            const lat = req.query.lat ?? defaultLat;
            const lon = req.query.lon ?? defaultLon;

          

            const foundFestivals = [];
            const festivalDatesFound = new Set(); // Prevents duplicate entries for the same festival on the same date
            const obj = new MhahPanchang(); // Instantiate once for this request

            const startDate = new Date(Date.UTC(year, 0, 1));
            const endDate = new Date(Date.UTC(year, 11, 31));
            let currentDate = new Date(startDate);

            while (currentDate <= endDate) {
                const currentDateString = currentDate.toISOString().split("T")[0];

                // Pre-calculate Panchang/Calendar/Sun info for the day once
                let detailedPanchang, calendarInfo, sunTimes, sunriseISO;
                try {
                    sunTimes = SunCalc.getTimes(currentDate, lat, lon);
                    const sunriseTime = sunTimes.sunrise;
                    const calculationTime = (sunriseTime instanceof Date && !isNaN(sunriseTime))
                                          ? sunriseTime
                                          : new Date(new Date(currentDate).setUTCHours(12, 0, 0, 0));

                    detailedPanchang = obj.calculate(calculationTime, lat, lon);
                    calendarInfo = obj.calendar(calculationTime, lat, lon);
                    sunriseISO = sunriseTime instanceof Date && !isNaN(sunriseTime) ? sunriseTime.toISOString() : null;
                } catch (calcError) {
                    logger.error(`[tithi-festivals] Error calculating base data for ${currentDateString}: ${calcError.message}`);
                    currentDate.setUTCDate(currentDate.getUTCDate() + 1); // Move to next day on error
                    continue;
                }

                // Check against each festival rule
                for (const rule of TITHI_FESTIVAL_RULES) {
                    const festivalKey = `${rule.name}-${currentDateString}`;
                    if (festivalDatesFound.has(festivalKey)) continue; // Skip if already found for this date

                    try {
                        if (detailedPanchang?.Tithi && detailedPanchang?.Paksha && calendarInfo?.Masa) {
                            const calculatedTithiNumberIno = detailedPanchang.Tithi.ino;
                            const calculatedPaksha = detailedPanchang.Paksha.name_en_IN;
                            let adjustedTithiNumber = (calculatedTithiNumberIno % 15) + 1;

                            // Calculate Purnimanta month for matching
                            let purnimantaMonthName = null;
                            if (calendarInfo && calendarInfo.MoonMasa) {
                                const originalIno = calendarInfo.MoonMasa.ino;
                                const correctedIno = (originalIno - 1 + 12) % 12;
                                const amantaMonthIndex = correctedIno;

                                let purnimantaMonthIndex = amantaMonthIndex;
                                if (calculatedPaksha === 'Krishna') {
                                    purnimantaMonthIndex = (amantaMonthIndex + 1) % 12;
                                }
                                purnimantaMonthName = obj.mhahLocalConstant.Masa.name_en_IN[purnimantaMonthIndex];
                            }

                            const tithiMatch = adjustedTithiNumber === rule.tithi;
                            const pakshaMatch = calculatedPaksha?.toLowerCase() === rule.paksha?.toLowerCase();
                            const monthMatch = (!rule.month || (typeof purnimantaMonthName === 'string' && purnimantaMonthName.toLowerCase() === rule.month.toLowerCase())) && (!rule.gregorianMonth || currentDate.getUTCMonth() + 1 === rule.gregorianMonth);

                            if (tithiMatch && pakshaMatch && monthMatch) {
                                foundFestivals.push({
                                    name: rule.name, date: currentDateString, tithiNumber: adjustedTithiNumber,
                                    paksha: calculatedPaksha, startTime: detailedPanchang.Tithi.start || null,
                                    endTime: detailedPanchang.Tithi.end || null, sunrise: sunriseISO,
                                });
                                festivalDatesFound.add(festivalKey); // Mark as found for this date
                            }
                        }
                    } catch (ruleError) {
                        // Log error specific to rule processing but continue with other rules/days
                        logger.error(`[tithi-festivals] Error processing rule '${rule.name}' for ${currentDateString}: ${ruleError.message}`);
                    }
                }
                currentDate.setUTCDate(currentDate.getUTCDate() + 1); // Move to the next day
            }

            foundFestivals.sort((a, b) => new Date(a.date) - new Date(b.date));
            res.json(foundFestivals);

        } catch (error) {
            // Catch errors from the outer try block (e.g., initial setup)
            handleRouteError(res, error, `/tithi-festivals/${req.params.year}`, { ...req.params, ...req.query });
        }
    }
);

// --- Route: Calculate Sankranti Dates using Swisseph ---
router.get("/sankranti/:year",
    [ // Apply validation directly
        param('year')
            .isInt({ min: 1900, max: 2100 }).withMessage('Year must be between 1900 and 2100.')
            .toInt(),
        query('lat')
            .optional()
            .isFloat({ min: -90, max: 90 }).withMessage('Latitude must be between -90 and 90.')
            .toFloat(),
        query('lon')
            .optional()
            .isFloat({ min: -180, max: 180 }).withMessage('Longitude must be between -180 and 180.')
            .toFloat()
    ],
    async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        try {
            // Use validated values
            const { year } = req.params;
            // Lat/Lon are not directly used in findSunRashiIngressJD, but could be passed if Ayanamsa calculation depends on location
            // For now, these are not directly used as swisseph sidereal mode is set globally.
            const lat = req.query.lat ?? defaultLat;
            const lon = req.query.lon ?? defaultLon;

            const sankrantiList = [];
            
            // Loop through all 12 Rashis to find each Sankranti
            for (let i = 0; i < 12; i++) {
                const targetRashiIndex = i;
                const rashiName = RASHIS[targetRashiIndex]; // Get Rashi name (e.g., "Aries", "Taurus")

                const jd_ingress = findSunRashiIngressJD(year, targetRashiIndex);

                if (jd_ingress !== null) {
                    // Convert Julian Day (UT) to UTC Date and then to ISO string
                    // swe_revjul returns [year, month, day, hour, minute, second]
                    const datetime_utc_obj = swisseph.swe_revjul(jd_ingress, swisseph.SE_GREGORIAN);
                   
                    // swisseph.swe_get_errors() is not a function in swisseph-v2, removed check.
                    // Validate elements of datetime_utc_obj before proceeding
                    const isValidDateTimeObj = datetime_utc_obj &&
                                               typeof datetime_utc_obj.year === 'number' && !isNaN(datetime_utc_obj.year) &&
                                               typeof datetime_utc_obj.month === 'number' && !isNaN(datetime_utc_obj.month) &&
                                               typeof datetime_utc_obj.day === 'number' && !isNaN(datetime_utc_obj.day) &&
                                               typeof datetime_utc_obj.hour === 'number' && !isNaN(datetime_utc_obj.hour);

                    if (!isValidDateTimeObj) {
                        logger.error(`[Sankranti Route] Invalid datetime_utc_obj received from swe_revjul for ${rashiName} Sankranti (JD: ${jd_ingress}): ${JSON.stringify(datetime_utc_obj)}. Skipping this Sankranti.`);
                        continue; // Skip this Sankranti if the object is invalid
                    }

                    // Extract all components, including minutes, seconds, and milliseconds from the hour float
                    const year_utc = datetime_utc_obj.year;
                    const month_utc = datetime_utc_obj.month - 1; // Date.UTC month is 0-indexed
                    const day_utc = datetime_utc_obj.day;
                    const hour_float = datetime_utc_obj.hour;

                    const hours_int = Math.floor(hour_float);
                    const minutes_float = (hour_float - hours_int) * 60;
                    const minutes_int = Math.floor(minutes_float);
                    const seconds_float = (minutes_float - minutes_int) * 60;
                    const seconds_int = Math.floor(seconds_float);
                    const milliseconds_int = Math.round((seconds_float - seconds_int) * 1000); // Round milliseconds

                    
                    const ingressDateTimeUTC = new Date(Date.UTC(
                        year_utc, month_utc, day_utc,
                        hours_int, minutes_int, seconds_int, milliseconds_int
                    ));
                    
                    // Extract date part for the 'date' field
                    const date_utc_string = ingressDateTimeUTC.toISOString().split('T')[0];

                   // Only add Sankrantis that occur within the target year (or very close to it for boundary cases)
                    // The binary search covers a broader range to ensure all ingresses are found.
                    // This filter ensures we only return ingresses relevant to the requested year.
                    if (ingressDateTimeUTC.getUTCFullYear() === year ||
                        (ingressDateTimeUTC.getUTCFullYear() === year - 1 && targetRashiIndex === 0) || // Aries ingress can be end of prev year if calculation start is early
                        (ingressDateTimeUTC.getUTCFullYear() === year + 1 && targetRashiIndex === 0) // Capricorn ingress (index 9) can be early next year
                        ) {
                         // Double check: ensure we don't add duplicate rashis for the same year
                        if (!sankrantiList.some(s => s.rashi === rashiName)) {
                            sankrantiList.push({
                                name: `${rashiName} Sankranti`,
                                rashi: rashiName,
                                date: date_utc_string, // Date part only (YYYY-MM-DD)
                                moment: ingressDateTimeUTC.toISOString() // Exact ISO datetime
                            });
                        }
                    }
                } else {
                    logger.warn(`[Sankranti Route] findSunRashiIngressJD returned null for year ${year}, Rashi Index ${targetRashiIndex} (${rashiName}).`);
                }
            }
            
            // Sort final list by date
            sankrantiList.sort((a, b) => new Date(a.moment) - new Date(b.moment));

            // Check if we found roughly 12 Sankrantis *for the target year*
            if (sankrantiList.length !== 12) {
                logger.warn(`[Sankranti Route] Expected 12 Sankrantis for year ${year}, but found ${sankrantiList.length}.`);
            }

            res.json(sankrantiList);

        } catch (error) {
            handleRouteError(res, error, `/sankranti/${req.params.year}`, { ...req.params, ...req.query });
        }
    }
);



// Use ES Module export if consistent, otherwise use module.exports
export default router;
// module.exports = router; // Use this if your project uses CommonJS
