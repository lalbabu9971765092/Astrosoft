// src/AstrologyUtils.js

// --- Constants ---
export const NAKSHATRA_SPAN = 360 / 27;
export const RASHI_SPAN = 30;
export const TITHI_SPAN = 12;
export const YOGA_SPAN = 360 / 27; // Same as Nakshatra span
export const KARAN_SPAN = 6;

export const NAKSHATRAS = [
  "Ashwini",
  "Bharani",
  "Krittika",
  "Rohini",
  "Mrigashira",
  "Ardra",
  "Punarvasu",
  "Pushya",
  "Ashlesha",
  "Magha",
  "Purva Phalguni",
  "Uttara Phalguni",
  "Hasta",
  "Chitra",
  "Swati",
  "Vishakha",
  "Anuradha",
  "Jyeshtha",
  "Mula",
  "Purva Ashadha",
  "Uttara Ashadha",
  "Shravana",
  "Dhanishtha",
  "Shatabhisha",
  "Purva Bhadrapada",
  "Uttara Bhadrapada",
  "Revati",
];
export const RASHIS = [
  "Mesha",
  "Vrishabha",
  "Mithuna",
  "Karka",
  "Simha",
  "Kanya",
  "Tula",
  "Vrishchika",
  "Dhanu",
  "Makara",
  "Kumbha",
  "Meena",
];
export const YOGAS = [
  "Vishkumbha",
  "Priti",
  "Ayushman",
  "Saubhagya",
  "Shobhana",
  "Atiganda",
  "Sukarma",
  "Dhriti",
  "Shoola",
  "Ganda",
  "Vriddhi",
  "Dhruva",
  "Vyaghata",
  "Harshana",
  "Vajra",
  "Siddhi",
  "Vyatipata",
  "Variyana",
  "Parigha",
  "Shiva",
  "Siddha",
  "Sadhya",
  "Shubha",
  "Shukla",
  "Brahma",
  "Indra",
  "Vaidhriti",
];
export const KARANS = [
  "Bava",
  "Balava",
  "Kaulava",
  "Taitila",
  "Garaja",
  "Vanija",
  "Vishti", // 1-7 (repeats 8 times)
  "Bava",
  "Balava",
  "Kaulava",
  "Taitila",
  "Garaja",
  "Vanija",
  "Vishti",
  "Bava",
  "Balava",
  "Kaulava",
  "Taitila",
  "Garaja",
  "Vanija",
  "Vishti",
  "Bava",
  "Balava",
  "Kaulava",
  "Taitila",
  "Garaja",
  "Vanija",
  "Vishti",
  "Bava",
  "Balava",
  "Kaulava",
  "Taitila",
  "Garaja",
  "Vanija",
  "Vishti",
  "Bava",
  "Balava",
  "Kaulava",
  "Taitila",
  "Garaja",
  "Vanija",
  "Vishti",
  "Bava",
  "Balava",
  "Kaulava",
  "Taitila",
  "Garaja",
  "Vanija",
  "Vishti",
  "Bava",
  "Balava",
  "Kaulava",
  "Taitila",
  "Garaja",
  "Vanija",
  "Vishti",
  "Shakuni",
  "Chatushpada",
  "Naga",
  "Kimstughna", // 57-60 (Fixed Karans)
];
export const WEEKDAYS = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];

export const DAY_LORDS = [
  "Sun",      // Sunday (0)
  "Moon",     // Monday (1)
  "Mars",     // Tuesday (2)
  "Mercury",  // Wednesday (3)
  "Jupiter",  // Thursday (4)
  "Venus",    // Friday (5)
  "Saturn",   // Saturday (6)
];

// Shared planet order for consistent display
export const PLANET_ORDER = [
  "Sun",
  "Moon",
  "Mars",
  "Mercury",
  "Jupiter",
  "Venus",
  "Saturn",
  "Rahu",
  "Ketu",
  "Uranus",
  "Neptune",
  "Pluto",
];
export const PLANET_SYMBOLS = {
  Sun: "Su",
  Moon: "Mo",
  Mars: "Ma",
  Mercury: "Me",
  Jupiter: "Ju",
  Venus: "Ve",
  Saturn: "Sa",
  Rahu: "Ra",
  Ketu: "Ke",
  Uranus: "Ur",
  Neptune: "Ne",
  Pluto: "Pl",
  Ascendant: "Asc", // Include Ascendant if needed
};
// --- Helper Functions ---

/**
 * Converts a DMS (Degrees, Minutes, Seconds) string to decimal degrees.
 * Handles various separators and optional direction letters (N, S, E, W).
 * @param {string | null | undefined} dmsString - The DMS string (e.g., "10°15'20\"", "25d 30m 45s", "120 45 10 W").
 * @returns {number} Decimal degrees, or NaN if conversion fails.
 */
export const convertDMSToDegrees = (dmsString) => {
  if (!dmsString || typeof dmsString !== "string") return NaN;
  const match = dmsString.match(
    /(-?\d+(?:\.\d+)?)[^\d\w]*(\d+(?:\.\d+)?)?[^\d\w]*(\d+(?:\.\d+)?)?[^\d\w]*([NSEW])?/i
  );
  if (!match) return NaN;

  const degrees = parseFloat(match[1]);
  const minutes = parseFloat(match[2] || "0");
  const seconds = parseFloat(match[3] || "0");
  const direction = (match[4] || "").toUpperCase();

  if (isNaN(degrees) || isNaN(minutes) || isNaN(seconds)) return NaN;

  let decimalDegrees = Math.abs(degrees) + minutes / 60 + seconds / 3600;

  if (degrees < 0 || direction === "S" || direction === "W") {
    decimalDegrees *= -1;
  }

  return decimalDegrees;
};

/**
 * Converts decimal degrees to a DMS (Degrees, Minutes, Seconds) string.
 * @param {number | null | undefined} deg - The decimal degrees value.
 * @param {function} t - The translation function from i18next.
 * @returns {string} Formatted DMS string (e.g., "10°15'20.50\"") or a translated "N/A".
 */
export const convertToDMS = (deg, t) => {
  // Added t function parameter
  if (isNaN(deg) || deg === null || deg === undefined) {
    // Use translation function for "N/A"
    return t ? t("utils.notAvailable", "N/A") : "N/A";
  }

  const absoluteDeg = Math.abs(deg);
  const degrees = Math.floor(absoluteDeg);
  let minutes = Math.floor((absoluteDeg - degrees) * 60);
  let secondsValue = (absoluteDeg - degrees - minutes / 60) * 3600;

  // Handle potential rounding issue where seconds might become 60.00
  const epsilon = 1e-9;
  let finalDegrees = degrees;
  if (secondsValue >= 60.0 - epsilon) {
    secondsValue = 0;
    minutes += 1;
    if (minutes >= 60) {
      minutes = 0;
      finalDegrees += 1;
    }
  }

  const seconds = secondsValue.toFixed(2); // Round to 2 decimal places
  return `${finalDegrees}°${minutes}'${seconds}"`;
};

/**
 * Normalizes an angle to be within the range [0, 360).
 * @param {number} angle - The angle in degrees.
 * @returns {number} The normalized angle, or NaN if input is invalid.
 */
export const normalizeAngle = (angle) => {
  if (typeof angle !== "number" || isNaN(angle)) return NaN;
  return ((angle % 360) + 360) % 360;
};

/**
 * Calculates the midpoint between two angles on a circle.
 * Handles wrap-around cases correctly.
 * @param {number} angle1 - First angle in degrees.
 * @param {number} angle2 - Second angle in degrees.
 * @returns {number} The normalized midpoint angle, or NaN if inputs are invalid.
 */
export const calculateMidpoint = (angle1, angle2) => {
  const normAngle1 = normalizeAngle(angle1);
  const normAngle2 = normalizeAngle(angle2);
  if (isNaN(normAngle1) || isNaN(normAngle2)) return NaN;

  let diff = normAngle2 - normAngle1;
  if (diff > 180) diff -= 360;
  else if (diff <= -180) diff += 360;

  let midpoint = normAngle1 + diff / 2;
  return normalizeAngle(midpoint);
};

// --- Astrological Calculation Functions ---

/**
 * Calculates the Tithi index (1-30).
 * @param {number} sunLongitude - Sun's longitude in degrees.
 * @param {number} moonLongitude - Moon's longitude in degrees.
 * @param {function} t - The translation function from i18next.
 * @returns {number | string} Tithi index or translated "N/A".
 */
export const calculateTithi = (sunLongitude, moonLongitude, t) => {
  // Added t
  if (isNaN(sunLongitude) || isNaN(moonLongitude)) {
    return t ? t("utils.notAvailable", "N/A") : "N/A";
  }
  const difference = normalizeAngle(moonLongitude - sunLongitude);
  const tithiIndex = Math.floor(difference / TITHI_SPAN);
  return tithiIndex + 1;
};

/**
 * Calculates the Nakshatra Pada (1-4).
 * @param {number} longitude - Longitude in degrees.
 * @param {function} t - The translation function from i18next.
 * @returns {number | string} Pada number or translated "N/A".
 */
export const calculateNakshatraPada = (longitude, t) => {
  // Added t
  if (isNaN(longitude)) {
    return t ? t("utils.notAvailable", "N/A") : "N/A";
  }
  const degreeWithin360 = normalizeAngle(longitude);
  const degreeWithinNakshatra = degreeWithin360 % NAKSHATRA_SPAN;
  const pada = Math.floor(degreeWithinNakshatra / (NAKSHATRA_SPAN / 4)) + 1;
  return pada;
};

/**
 * Calculates the degree within the current Nakshatra.
 * @param {number} longitude - Longitude in degrees.
 * @returns {number} Degree within Nakshatra (0 to NAKSHATRA_SPAN), or NaN.
 */
export const calculateNakshatraDegree = (longitude) => {
  if (isNaN(longitude)) return NaN;
  return normalizeAngle(longitude) % NAKSHATRA_SPAN;
};

/**
 * Calculates the Rashi (Zodiac Sign) name.
 * @param {number} longitude - Longitude in degrees.
 * @param {function} t - The translation function from i18next.
 * @returns {string} Rashi name or translated "Unknown".
 */
export const calculateRashi = (longitude, t) => {
  // Added t
  if (isNaN(longitude)) {
    return t ? t("utils.unknown", "Unknown") : "Unknown";
  }
  const rashiIndex = Math.floor(normalizeAngle(longitude) / RASHI_SPAN);
  return (
    RASHIS[rashiIndex % 12] || (t ? t("utils.unknown", "Unknown") : "Unknown")
  );
};

/**
 * Calculates the Yoga name.
 * @param {number} sunLongitude - Sun's longitude in degrees.
 * @param {number} moonLongitude - Moon's longitude in degrees.
 * @param {function} t - The translation function from i18next.
 * @returns {string} Yoga name or translated "Unknown".
 */
export const calculateYoga = (sunLongitude, moonLongitude, t) => {
  // Added t
  if (isNaN(sunLongitude) || isNaN(moonLongitude)) {
    return t ? t("utils.unknown", "Unknown") : "Unknown";
  }
  const sum = normalizeAngle(sunLongitude + moonLongitude);
  const yogaIndex = Math.floor(sum / YOGA_SPAN);
  return (
    YOGAS[yogaIndex % 27] || (t ? t("utils.unknown", "Unknown") : "Unknown")
  );
};

/**
 * Calculates the Karan name.
 * @param {number} sunLongitude - Sun's longitude in degrees.
 * @param {number} moonLongitude - Moon's longitude in degrees.
 * @param {function} t - The translation function from i18next.
 * @returns {string} Karan name or translated "Unknown".
 */
export const calculateKaran = (sunLongitude, moonLongitude, t) => {
  // Added t
  if (isNaN(sunLongitude) || isNaN(moonLongitude)) {
    return t ? t("utils.unknown", "Unknown") : "Unknown";
  }
  const difference = normalizeAngle(moonLongitude - sunLongitude);
  const karanIndex = Math.floor(difference / KARAN_SPAN);
  return (
    KARANS[karanIndex % 60] || (t ? t("utils.unknown", "Unknown") : "Unknown")
  );
};

export const NAKSHATRA_LORDS = {
  "Ashwini": "Ketu", "Magha": "Ketu", "Mula": "Ketu",
  "Bharani": "Venus", "Purva Phalguni": "Venus", "Purva Ashadha": "Venus",
  "Krittika": "Sun", "Uttara Phalguni": "Sun", "Uttara Ashadha": "Sun",
  "Rohini": "Moon", "Hasta": "Moon", "Shravana": "Moon",
  "Mrigashira": "Mars", "Chitra": "Mars", "Dhanishta": "Mars",
  "Ardra": "Rahu", "Swati": "Rahu", "Shatabhisha": "Rahu",
  "Punarvasu": "Jupiter", "Vishakha": "Jupiter", "Purva Bhadrapada": "Jupiter",
  "Pushya": "Saturn", "Anuradha": "Saturn", "Uttara Bhadrapada": "Saturn",
  "Ashlesha": "Mercury", "Jyeshtha": "Mercury", "Revati": "Mercury",
};

export const RASHI_LORDS = {
  "Mesha": "Mars", "Vrishabha": "Venus", "Mithuna": "Mercury",
  "Karka": "Moon", "Simha": "Sun", "Kanya": "Mercury",
  "Tula": "Venus", "Vrishchika": "Mars", "Dhanu": "Jupiter",
  "Makara": "Saturn", "Kumbha": "Saturn", "Meena": "Jupiter",
};

export const NAAM_AKSHAR_MAPPING = {
  "Ashwini": ["Chu", "Che", "Cho", "La"],
  "Bharani": ["Li", "Lu", "Le", "Lo"],
  "Krittika": ["A", "E", "U", "O"],
  "Rohini": ["O", "Va", "Vi", "Vu"],
  "Mrigashira": ["Ve", "Vo", "Ka", "Ki"],
  "Ardra": ["Ku", "Gha", "Nga", "Chha"],
  "Punarvasu": ["Ke", "Ko", "Ha", "Hi"],
  "Pushya": ["Hu", "He", "Ho", "Da"],
  "Ashlesha": ["Di", "Du", "De", "Do"],
  "Magha": ["Ma", "Mi", "Mu", "Me"],
  "Purva Phalguni": ["Mo", "Ta", "Ti", "Tu"],
  "Uttara Phalguni": ["Te", "To", "Pa", "Pi"],
  "Hasta": ["Pu", "Sha", "Na", "Tha"],
  "Chitra": ["Pe", "Po", "Ra", "Ri"],
  "Swati": ["Ru", "Re", "Ro", "Ta"],
  "Vishakha": ["Ti", "Tu", "Te", "To"],
  "Anuradha": ["Na", "Ni", "Nu", "Ne"],
  "Jyeshtha": ["No", "Ya", "Yi", "Yu"],
  "Mula": ["Ye", "Yo", "Bha", "Bhi"],
  "Purva Ashadha": ["Bhu", "Dha", "Pha", "Dha"],
  "Uttara Ashadha": ["Bhe", "Bho", "Ja", "Ji"],
  "Shravana": ["Ju", "Je", "Jo", "Gha"],
  "Dhanishta": ["Ga", "Gi", "Gu", "Ge"],
  "Shatabhisha": ["Go", "Sa", "Si", "Su"],
  "Purva Bhadrapada": ["Se", "So", "Da", "Di"],
  "Uttara Bhadrapada": ["Du", "Tha", "Jha", "Na"],
  "Revati": ["De", "Do", "Cha", "Chi"],
};

/**
 * Gets the Naam Akshar (name letter) for a given Nakshatra and Pada.
 * @param {string} nakshatraName - The name of the Nakshatra (e.g., "Krittika").
 * @param {number} padaNumber - The pada number (1-4).
 * @param {function} t - The translation function from i18next.
 * @returns {string} The Naam Akshar or translated "N/A".
 */
export const getNaamAkshar = (nakshatraName, padaNumber, t) => {
  if (!nakshatraName || isNaN(padaNumber) || padaNumber < 1 || padaNumber > 4) {
    return t ? t("utils.notAvailable", "N/A") : "N/A";
  }
  const akshars = NAAM_AKSHAR_MAPPING[nakshatraName];
  if (akshars && akshars.length === 4) {
    return akshars[padaNumber - 1]; // padaNumber is 1-indexed, array is 0-indexed
  }
  return t ? t("utils.notAvailable", "N/A") : "N/A";
};

/**
 * Calculates the Nakshatra name.
 * @param {number} longitude - Longitude in degrees.
 * @param {function} t - The translation function from i18next.
 * @returns {string} Nakshatra name or translated "Unknown".
 */
export const calculateNakshatra = (longitude, t) => {
  if (isNaN(longitude)) {
    return t ? t("utils.unknown", "Unknown") : "Unknown";
  }
  const nakshatraIndex = Math.floor(normalizeAngle(longitude) / NAKSHATRA_SPAN);
  return (
    NAKSHATRAS[nakshatraIndex % 27] || (t ? t("utils.unknown", "Unknown") : "Unknown")
  );
};

/**
 * Gets the lord of a given Nakshatra.
 * @param {string} nakshatraName - The name of the Nakshatra (e.g., "Krittika").
 * @param {function} t - The translation function from i18next.
 * @returns {string} Planet name of the lord or translated "Unknown".
 */
export const getNakshatraLord = (nakshatraName, t) => {
  return NAKSHATRA_LORDS[nakshatraName] || (t ? t("utils.unknown", "Unknown") : "Unknown");
};

/**
 * Gets the lord of a given Rashi.
 * @param {string} rashiName - The name of the Rashi (e.g., "Mesha").
 * @param {function} t - The translation function from i18next.
 * @returns {string} Planet name of the lord or translated "Unknown".
 */
export const getRashiLord = (rashiName, t) => {
  return RASHI_LORDS[rashiName] || (t ? t("utils.unknown", "Unknown") : "Unknown");
};

/**
 * Calculates the Var (Weekday) name from a local ISO-like string.
 * @param {string} localIsoString - Date string in 'YYYY-MM-DDTHH:MM:SS' format (local time).
 * @param {function} t - The translation function from i18next.
 * @returns {string} Weekday name key (e.g., "Sunday") or translated error/invalid string.
 */

export const calculateVar = (localIsoString, t) => {
    try {
        if (!localIsoString || typeof localIsoString !== 'string') {
            return { varName: t ? t("utils.invalidDate", "Invalid Date") : "Invalid Date", dayLord: null };
        }

        let dateObj = new Date(localIsoString);

        if (isNaN(dateObj.getTime()) && localIsoString.length === 16 && !localIsoString.includes(':', 14)) {
            dateObj = new Date(`${localIsoString}:00`);
        }

        if (isNaN(dateObj.getTime())) {
             console.warn("calculateVar: Could not parse date string:", localIsoString);
             return { varName: t ? t("utils.invalidDate", "Invalid Date") : "Invalid Date", dayLord: null };
        }

        const dayIndex = dateObj.getDay();
        return {
            varName: WEEKDAYS[dayIndex],
            dayLord: DAY_LORDS[dayIndex]
        };

    } catch (e) {
        console.error("Error calculating Var:", e);
        return { varName: t ? t("utils.error", "Error") : "Error", dayLord: null };
    }
};


/**
 * Calculates the house number (1-12) a longitude falls into based on cusp starts.
 * @param {number} longitude - Longitude in degrees.
 * @param {number[]} cuspStartDegrees - Array of 12 cusp start degrees.
 * @param {function} t - The translation function from i18next.
 * @returns {number | string} House number or translated "N/A"/"Unknown".
 */
export const calculateHouse = (longitude, cuspStartDegrees, t) => {
  // Added t
  if (
    isNaN(longitude) ||
    !Array.isArray(cuspStartDegrees) ||
    cuspStartDegrees.length !== 12 ||
    cuspStartDegrees.some(isNaN)
  ) {
    return t ? t("utils.notAvailable", "N/A") : "N/A";
  }
  const normalizedLng = normalizeAngle(longitude);
  for (let i = 0; i < 12; i++) {
    const currentCusp = normalizeAngle(cuspStartDegrees[i]);
    const nextCusp = normalizeAngle(cuspStartDegrees[(i + 1) % 12]);
    if (currentCusp <= nextCusp) {
      if (normalizedLng >= currentCusp && normalizedLng < nextCusp)
        return i + 1;
    } else {
      // Handles wrap-around (e.g., Cusp 12 to Cusp 1)
      if (normalizedLng >= currentCusp || normalizedLng < nextCusp)
        return i + 1;
    }
  }
  console.warn(
    "Longitude",
    longitude,
    "did not fall into any house range based on cusps:",
    cuspStartDegrees
  );
  return t ? t("utils.unknown", "Unknown") : "Unknown";
};

// --- NEW: Input Validation Functions ---

/**
 * Validates a date/time string and ensures it's a valid date.
 * Optionally formats it to include seconds if missing.
 * @param {string} dateString - The input string from datetime-local.
 * @param {function} t - The translation function from i18next.
 * @returns {{isValid: boolean, formattedDate: string | null, error: string | null}}
 */
export const validateAndFormatDateTime = (dateString, t) => {
  // Added t
  const defaultError = "Error parsing date/time.";
  const requiredError = "Please enter the Date and Time.";
  const invalidValueError = "Invalid date/time value selected.";

  if (!dateString || typeof dateString !== "string") {
    return {
      isValid: false,
      formattedDate: null,
      error: t
        ? t("validation.dateTimeRequired", requiredError)
        : requiredError,
    };
  }
  try {
    // Attempt to parse, including potential 'Z' for UTC or timezone offsets
    const parsedDate = new Date(dateString);
    if (isNaN(parsedDate.getTime())) {
      // Try adding ':00' if it looks like datetime-local output without seconds
      if (dateString.length === 16 && !dateString.includes(":", 14)) {
        const parsedWithSeconds = new Date(`${dateString}:00`);
        if (isNaN(parsedWithSeconds.getTime())) {
          return {
            isValid: false,
            formattedDate: null,
            error: t
              ? t("validation.invalidDateTimeValue", invalidValueError)
              : invalidValueError,
          };
        }
        // If parsing with seconds works, use that formatted string
        return {
          isValid: true,
          formattedDate: `${dateString}:00`,
          error: null,
        };
      }
      // If still invalid after trying to add seconds
      return {
        isValid: false,
        formattedDate: null,
        error: t
          ? t("validation.invalidDateTimeValue", invalidValueError)
          : invalidValueError,
      };
    }

    // If original parsing worked, ensure seconds are present in the output format if needed by backend
    let formattedDate = dateString;
    // Check if seconds are missing based on typical ISO-like formats
    if (
      dateString.length === 16 &&
      dateString.includes("T") &&
      !dateString.includes(":", 14)
    ) {
      formattedDate = `${dateString}:00`;
    } else if (
      dateString.length === 19 &&
      dateString.includes("T") &&
      dateString.indexOf(":", 14) === 16
    ) {
      // Already has seconds, use as is
      formattedDate = dateString;
    }
    // Add more robust checks if other formats are expected

    return { isValid: true, formattedDate: formattedDate, error: null };
  } catch (e) {
    return {
      isValid: false,
      formattedDate: null,
      error: t
        ? t("validation.errorParsingDateTime", defaultError)
        : defaultError,
    };
  }
};

/**
 * Parses and validates a coordinate string (lat,lon).
 * @param {string} coordsString - The input string.
 * @param {function} t - The translation function from i18next.
 * @returns {{isValid: boolean, latitude: number | null, longitude: number | null, error: string | null}}
 */
export const parseAndValidateCoords = (coordsString, t) => {
  // Added t
  const defaultError = "Error parsing coordinates.";
  const requiredError = "Please enter Latitude and Longitude.";
  const invalidFormatError = "Invalid format. Use 'latitude, longitude'.";
  const numberError = "Latitude and Longitude must be numbers.";
  const latBoundsError = "Latitude must be between -90 and 90.";
  const lonBoundsError = "Longitude must be between -180 and 180.";

  if (!coordsString || typeof coordsString !== "string") {
    return {
      isValid: false,
      latitude: null,
      longitude: null,
      error: t ? t("validation.coordsRequired", requiredError) : requiredError,
    };
  }
  try {
    const parts = coordsString
      .split(/[\s,;]+/)
      .map((s) => s.trim())
      .filter((s) => s !== ""); // Split by comma, space, or semicolon, trim, remove empty
    if (parts.length !== 2) {
      return {
        isValid: false,
        latitude: null,
        longitude: null,
        error: t
          ? t("validation.invalidCoordsFormat", invalidFormatError)
          : invalidFormatError,
      };
    }

    const latitude = parseFloat(parts[0]);
    const longitude = parseFloat(parts[1]);

    if (isNaN(latitude) || isNaN(longitude)) {
      return {
        isValid: false,
        latitude: null,
        longitude: null,
        error: t
          ? t("validation.coordsMustBeNumbers", numberError)
          : numberError,
      };
    }
    if (latitude < -90 || latitude > 90) {
      return {
        isValid: false,
        latitude: latitude,
        longitude: longitude,
        error: t
          ? t("validation.latitudeOutOfBounds", latBoundsError)
          : latBoundsError,
      };
    }
    if (longitude < -180 || longitude > 180) {
      return {
        isValid: false,
        latitude: latitude,
        longitude: longitude,
        error: t
          ? t("validation.longitudeOutOfBounds", lonBoundsError)
          : lonBoundsError,
      };
    }

    return {
      isValid: true,
      latitude: latitude,
      longitude: longitude,
      error: null,
    };
  } catch (e) {
    return {
      isValid: false,
      latitude: null,
      longitude: null,
      error: t
        ? t("validation.errorParsingCoords", defaultError)
        : defaultError,
    };
  }
};
export const getHouseNumbersFromString = (houseString) => {
  if (!houseString || typeof houseString !== "string") return [];
  return houseString
    .split(",")
    .map((numStr) => parseInt(numStr.trim(), 10))
    .filter((num) => !isNaN(num)) // Ensure only valid numbers
    .sort((a, b) => a - b); // Sort numerically
};

/**
 * Formats a Date object into a local 'YYYY-MM-DDTHH:MM:SS' string.
 * @param {Date} dateObj - The Date object to format.
 * @returns {string} The formatted local date-time string, or an empty string if input is invalid.
 */
export const formatToLocalISOString = (dateObj) => {
  if (!(dateObj instanceof Date) || isNaN(dateObj.getTime())) {
    return "";
  }

  const year = dateObj.getFullYear();
  const month = (dateObj.getMonth() + 1).toString().padStart(2, "0"); // Months are 0-indexed
  const day = dateObj.getDate().toString().padStart(2, "0");
  const hours = dateObj.getHours().toString().padStart(2, "0");
  const minutes = dateObj.getMinutes().toString().padStart(2, "0");
  const seconds = dateObj.getSeconds().toString().padStart(2, "0");

  return `${year}-${month}-${day}T${hours}:${minutes}:${seconds}`;
};

export const createChartHousesFromAscendant = (ascendantDms, t) => {
    if (!ascendantDms || typeof ascendantDms !== 'string') return null;

    const ascendantDeg = convertDMSToDegrees(ascendantDms);
    if (isNaN(ascendantDeg)) return null;

    const ascendantRashiName = calculateRashi(ascendantDeg, t);
    const ascendantRashiIndex = RASHIS.indexOf(ascendantRashiName);
    if (ascendantRashiIndex === -1) return null;

    const housesArray = [];
    for (let i = 0; i < 12; i++) {
        const currentRashiIndex = (ascendantRashiIndex + i) % 12;
        const rashiStartDeg = currentRashiIndex * 30;
        housesArray.push({
            start_dms: convertToDMS(rashiStartDeg, t)
        });
    }
    return housesArray;
};
