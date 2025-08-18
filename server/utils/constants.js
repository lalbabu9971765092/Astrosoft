// utils/constants.js

export const NAKSHATRA_SPAN = 360 / 27; // 13.333... degrees
export const RASHI_SPAN = 30; // 30 degrees

// Nakshatra details: Name and Lord. Start degrees should be calculated dynamically (index * NAKSHATRA_SPAN).
export const NAKSHATRAS = [
    { name: "Ashwini", lord: "Ketu" },
    { name: "Bharani", lord: "Venus" },
    { name: "Krittika", lord: "Sun" },
    { name: "Rohini", lord: "Moon" },
    { name: "Mrigashira", lord: "Mars" },
    { name: "Ardra", lord: "Rahu" },
    { name: "Punarvasu", lord: "Jupiter" },
    { name: "Pushya", lord: "Saturn" },
    { name: "Ashlesha", lord: "Mercury" },
    { name: "Magha", lord: "Ketu" },
    { name: "Purva Phalguni", lord: "Venus" },
    { name: "Uttara Phalguni", lord: "Sun" },
    { name: "Hasta", lord: "Moon" },
    { name: "Chitra", lord: "Mars" },
    { name: "Swati", lord: "Rahu" },
    { name: "Vishakha", lord: "Jupiter" },
    { name: "Anuradha", lord: "Saturn" },
    { name: "Jyeshtha", lord: "Mercury" },
    { name: "Mula", lord: "Ketu" },
    { name: "Purva Ashadha", lord: "Venus" },
    { name: "Uttara Ashadha", lord: "Sun" },
    { name: "Shravana", lord: "Moon" },
    { name: "Dhanishtha", lord: "Mars" },
    { name: "Shatabhisha", lord: "Rahu" },
    { name: "Purva Bhadrapada", lord: "Jupiter" },
    { name: "Uttara Bhadrapada", lord: "Saturn" },
    { name: "Revati", lord: "Mercury" },
];

export const RASHIS = [
    "Aries", "Taurus", "Gemini", "Cancer", "Leo", "Virgo",
    "Libra", "Scorpio", "Sagittarius", "Capricorn", "Aquarius", "Pisces"
];

export const RASHI_LORDS = [
    "Mars", "Venus", "Mercury", "Moon", "Sun", "Mercury",
    "Venus", "Mars", "Jupiter", "Saturn", "Saturn", "Jupiter"
];

// Order for calculations and display
export const PLANET_ORDER = [
    "Sun", "Moon", "Mars", "Mercury", "Jupiter", "Venus", "Saturn", "Rahu", "Ketu",
    "Uranus", "Neptune", "Pluto"
];

// Order specifically for friendship calculations
export const FRIENDSHIP_PLANETS_ORDER = [
    "Sun", "Moon", "Mars", "Mercury", "Jupiter", "Venus", "Saturn"
];

// Order for Ashtakavarga calculations
export const ASHTAKAVARGA_PLANETS = [
    "Sun", "Moon", "Mars", "Mercury", "Jupiter", "Venus", "Saturn", "Ascendant"
];

// Vimshottari Dasha years
export const VIMS_DASHA_YEARS = {
    Ketu: 7, Venus: 20, Sun: 6, Moon: 10, Mars: 7, Rahu: 18, Jupiter: 16, Saturn: 19, Mercury: 17
};

// Vimshottari Dasha sequence based on Nakshatra lord
export const VIMS_DASHA_SEQUENCE = [
    "Ketu", "Venus", "Sun", "Moon", "Mars", "Rahu", "Jupiter", "Saturn", "Mercury"
];

// Natural Friendship Matrix (N - Neutral, F - Friend, E - Enemy)
// Rows: Planet, Columns: Relationship to others in FRIENDSHIP_PLANETS_ORDER
export const NATURAL_FRIENDSHIP = {
    Sun:     ['-', 'F', 'F', 'F', 'F', 'E', 'E'], // Sun: -, Moon, Mars, Merc, Jup, Ven, Sat
    Moon:    ['F', '-', 'N', 'F', 'N', 'N', 'N'], // Moon: Sun, -, Mars, Merc, Jup, Ven, Sat
    Mars:    ['F', 'F', '-', 'E', 'F', 'N', 'E'], // Mars: Sun, Moon, -, Merc, Jup, Ven, Sat
    Mercury: ['E', 'E', 'E', '-', 'N', 'F', 'F'], // Merc: Sun, Moon, Mars, -, Jup, Ven, Sat
    Jupiter: ['F', 'F', 'F', 'E', '-', 'E', 'E'], // Jup: Sun, Moon, Mars, Merc, -, Ven, Sat
    Venus:   ['E', 'E', 'N', 'F', 'N', '-', 'F'], // Ven: Sun, Moon, Mars, Merc, Jup, -, Sat
    Saturn:  ['E', 'E', 'E', 'F', 'N', 'F', '-']  // Sat: Sun, Moon, Mars, Merc, Jup, Ven, -
};

// Weekday Lords (0 = Sunday, 6 = Saturday)
export const WEEKDAY_LORDS = ["Sun", "Moon", "Mars", "Mercury", "Jupiter", "Venus", "Saturn"];

// Mudda Dasha sequence and years
export const MUDDA_DASHA_SEQUENCE = ["Sun", "Moon", "Mars", "Mercury", "Jupiter", "Venus", "Saturn", "Rahu"]; // Ketu is not included in standard Mudda
export const MUDDA_DASHA_YEARS = { Sun: 6, Moon: 10, Mars: 7, Mercury: 17, Jupiter: 16, Venus: 20, Saturn: 19, Rahu: 18 };
// Sum of MUDDA_DASHA_YEARS. Ensure calculations in dashaUtils use this value if appropriate for proportions.
export const MUDDA_TOTAL_YEARS = 113;

// KP Sublord details (Calculated spans in decimal degrees)
// Source: Based on standard KP Vimshottari proportions. Accuracy depends on source verification.
// Total span for each Nakshatra should add up to 13.3333... degrees (360/27)
export const SUBLORD_DATA = {
    Ashwini: [ // Ketu Nakshatra
        { lord: "Ketu", span: 0.7777777777777777 },
        { lord: "Venus", span: 2.2222222222222223 },
        { lord: "Sun", span: 0.6666666666666666 },
        { lord: "Moon", span: 1.1111111111111112 },
        { lord: "Mars", span: 0.7777777777777777 },
        { lord: "Rahu", span: 2.0000000000000000 },
        { lord: "Jupiter", span: 1.7777777777777777 },
        { lord: "Saturn", span: 2.1111111111111110 },
        { lord: "Mercury", span: 1.8888888888888888 },
    ],
    Bharani: [ // Venus Nakshatra
        { lord: "Venus", span: 2.2222222222222223 },
        { lord: "Sun", span: 0.6666666666666666 },
        { lord: "Moon", span: 1.1111111111111112 },
        { lord: "Mars", span: 0.7777777777777777 },
        { lord: "Rahu", span: 2.0000000000000000 },
        { lord: "Jupiter", span: 1.7777777777777777 },
        { lord: "Saturn", span: 2.1111111111111110 },
        { lord: "Mercury", span: 1.8888888888888888 },
        { lord: "Ketu", span: 0.7777777777777777 },
    ],
    Krittika: [ // Sun Nakshatra
        { lord: "Sun", span: 0.6666666666666666 },
        { lord: "Moon", span: 1.1111111111111112 },
        { lord: "Mars", span: 0.7777777777777777 },
        { lord: "Rahu", span: 2.0000000000000000 },
        { lord: "Jupiter", span: 1.7777777777777777 },
        { lord: "Saturn", span: 2.1111111111111110 },
        { lord: "Mercury", span: 1.8888888888888888 },
        { lord: "Ketu", span: 0.7777777777777777 },
        { lord: "Venus", span: 2.2222222222222223 },
    ],
    Rohini: [ // Moon Nakshatra
        { lord: "Moon", span: 1.1111111111111112 },
        { lord: "Mars", span: 0.7777777777777777 },
        { lord: "Rahu", span: 2.0000000000000000 },
        { lord: "Jupiter", span: 1.7777777777777777 },
        { lord: "Saturn", span: 2.1111111111111110 },
        { lord: "Mercury", span: 1.8888888888888888 },
        { lord: "Ketu", span: 0.7777777777777777 },
        { lord: "Venus", span: 2.2222222222222223 },
        { lord: "Sun", span: 0.6666666666666666 },
    ],
    Mrigashira: [ // Mars Nakshatra
        { lord: "Mars", span: 0.7777777777777777 },
        { lord: "Rahu", span: 2.0000000000000000 },
        { lord: "Jupiter", span: 1.7777777777777777 },
        { lord: "Saturn", span: 2.1111111111111110 },
        { lord: "Mercury", span: 1.8888888888888888 },
        { lord: "Ketu", span: 0.7777777777777777 },
        { lord: "Venus", span: 2.2222222222222223 },
        { lord: "Sun", span: 0.6666666666666666 },
        { lord: "Moon", span: 1.1111111111111112 },
    ],
    Ardra: [ // Rahu Nakshatra
        { lord: "Rahu", span: 2.0000000000000000 },
        { lord: "Jupiter", span: 1.7777777777777777 },
        { lord: "Saturn", span: 2.1111111111111110 },
        { lord: "Mercury", span: 1.8888888888888888 },
        { lord: "Ketu", span: 0.7777777777777777 },
        { lord: "Venus", span: 2.2222222222222223 },
        { lord: "Sun", span: 0.6666666666666666 },
        { lord: "Moon", span: 1.1111111111111112 },
        { lord: "Mars", span: 0.7777777777777777 },
    ],
    Punarvasu: [ // Jupiter Nakshatra
        { lord: "Jupiter", span: 1.7777777777777777 },
        { lord: "Saturn", span: 2.1111111111111110 },
        { lord: "Mercury", span: 1.8888888888888888 },
        { lord: "Ketu", span: 0.7777777777777777 },
        { lord: "Venus", span: 2.2222222222222223 },
        { lord: "Sun", span: 0.6666666666666666 },
        { lord: "Moon", span: 1.1111111111111112 },
        { lord: "Mars", span: 0.7777777777777777 },
        { lord: "Rahu", span: 2.0000000000000000 },
    ],
    Pushya: [ // Saturn Nakshatra
        { lord: "Saturn", span: 2.1111111111111110 },
        { lord: "Mercury", span: 1.8888888888888888 },
        { lord: "Ketu", span: 0.7777777777777777 },
        { lord: "Venus", span: 2.2222222222222223 },
        { lord: "Sun", span: 0.6666666666666666 },
        { lord: "Moon", span: 1.1111111111111112 },
        { lord: "Mars", span: 0.7777777777777777 },
        { lord: "Rahu", span: 2.0000000000000000 },
        { lord: "Jupiter", span: 1.7777777777777777 },
    ],
    Ashlesha: [ // Mercury Nakshatra
        { lord: "Mercury", span: 1.8888888888888888 },
        { lord: "Ketu", span: 0.7777777777777777 },
        { lord: "Venus", span: 2.2222222222222223 },
        { lord: "Sun", span: 0.6666666666666666 },
        { lord: "Moon", span: 1.1111111111111112 },
        { lord: "Mars", span: 0.7777777777777777 },
        { lord: "Rahu", span: 2.0000000000000000 },
        { lord: "Jupiter", span: 1.7777777777777777 },
        { lord: "Saturn", span: 2.1111111111111110 },
    ],
    Magha: [ // Ketu Nakshatra
        { lord: "Ketu", span: 0.7777777777777777 },
        { lord: "Venus", span: 2.2222222222222223 },
        { lord: "Sun", span: 0.6666666666666666 },
        { lord: "Moon", span: 1.1111111111111112 },
        { lord: "Mars", span: 0.7777777777777777 },
        { lord: "Rahu", span: 2.0000000000000000 },
        { lord: "Jupiter", span: 1.7777777777777777 },
        { lord: "Saturn", span: 2.1111111111111110 },
        { lord: "Mercury", span: 1.8888888888888888 },
    ],
    "Purva Phalguni": [ // Venus Nakshatra
        { lord: "Venus", span: 2.2222222222222223 },
        { lord: "Sun", span: 0.6666666666666666 },
        { lord: "Moon", span: 1.1111111111111112 },
        { lord: "Mars", span: 0.7777777777777777 },
        { lord: "Rahu", span: 2.0000000000000000 },
        { lord: "Jupiter", span: 1.7777777777777777 },
        { lord: "Saturn", span: 2.1111111111111110 },
        { lord: "Mercury", span: 1.8888888888888888 },
        { lord: "Ketu", span: 0.7777777777777777 },
    ],
    "Uttara Phalguni": [ // Sun Nakshatra
        { lord: "Sun", span: 0.6666666666666666 },
        { lord: "Moon", span: 1.1111111111111112 },
        { lord: "Mars", span: 0.7777777777777777 },
        { lord: "Rahu", span: 2.0000000000000000 },
        { lord: "Jupiter", span: 1.7777777777777777 },
        { lord: "Saturn", span: 2.1111111111111110 },
        { lord: "Mercury", span: 1.8888888888888888 },
        { lord: "Ketu", span: 0.7777777777777777 },
        { lord: "Venus", span: 2.2222222222222223 },
    ],
    Hasta: [ // Moon Nakshatra
        { lord: "Moon", span: 1.1111111111111112 },
        { lord: "Mars", span: 0.7777777777777777 },
        { lord: "Rahu", span: 2.0000000000000000 },
        { lord: "Jupiter", span: 1.7777777777777777 },
        { lord: "Saturn", span: 2.1111111111111110 },
        { lord: "Mercury", span: 1.8888888888888888 },
        { lord: "Ketu", span: 0.7777777777777777 },
        { lord: "Venus", span: 2.2222222222222223 },
        { lord: "Sun", span: 0.6666666666666666 },
    ],
    Chitra: [ // Mars Nakshatra
        { lord: "Mars", span: 0.7777777777777777 },
        { lord: "Rahu", span: 2.0000000000000000 },
        { lord: "Jupiter", span: 1.7777777777777777 },
        { lord: "Saturn", span: 2.1111111111111110 },
        { lord: "Mercury", span: 1.8888888888888888 },
        { lord: "Ketu", span: 0.7777777777777777 },
        { lord: "Venus", span: 2.2222222222222223 },
        { lord: "Sun", span: 0.6666666666666666 },
        { lord: "Moon", span: 1.1111111111111112 },
    ],
    Swati: [ // Rahu Nakshatra
        { lord: "Rahu", span: 2.0000000000000000 },
        { lord: "Jupiter", span: 1.7777777777777777 },
        { lord: "Saturn", span: 2.1111111111111110 },
        { lord: "Mercury", span: 1.8888888888888888 },
        { lord: "Ketu", span: 0.7777777777777777 },
        { lord: "Venus", span: 2.2222222222222223 },
        { lord: "Sun", span: 0.6666666666666666 },
        { lord: "Moon", span: 1.1111111111111112 },
        { lord: "Mars", span: 0.7777777777777777 },
    ],
    Vishakha: [ // Jupiter Nakshatra
        { lord: "Jupiter", span: 1.7777777777777777 },
        { lord: "Saturn", span: 2.1111111111111110 },
        { lord: "Mercury", span: 1.8888888888888888 },
        { lord: "Ketu", span: 0.7777777777777777 },
        { lord: "Venus", span: 2.2222222222222223 },
        { lord: "Sun", span: 0.6666666666666666 },
        { lord: "Moon", span: 1.1111111111111112 },
        { lord: "Mars", span: 0.7777777777777777 },
        { lord: "Rahu", span: 2.0000000000000000 },
    ],
    Anuradha: [ // Saturn Nakshatra
        { lord: "Saturn", span: 2.1111111111111110 },
        { lord: "Mercury", span: 1.8888888888888888 },
        { lord: "Ketu", span: 0.7777777777777777 },
        { lord: "Venus", span: 2.2222222222222223 },
        { lord: "Sun", span: 0.6666666666666666 },
        { lord: "Moon", span: 1.1111111111111112 },
        { lord: "Mars", span: 0.7777777777777777 },
        { lord: "Rahu", span: 2.0000000000000000 },
        { lord: "Jupiter", span: 1.7777777777777777 },
    ],
    Jyeshtha: [ // Mercury Nakshatra
        { lord: "Mercury", span: 1.8888888888888888 },
        { lord: "Ketu", span: 0.7777777777777777 },
        { lord: "Venus", span: 2.2222222222222223 },
        { lord: "Sun", span: 0.6666666666666666 },
        { lord: "Moon", span: 1.1111111111111112 },
        { lord: "Mars", span: 0.7777777777777777 },
        { lord: "Rahu", span: 2.0000000000000000 },
        { lord: "Jupiter", span: 1.7777777777777777 },
        { lord: "Saturn", span: 2.1111111111111110 },
    ],
    Mula: [ // Ketu Nakshatra
        { lord: "Ketu", span: 0.7777777777777777 },
        { lord: "Venus", span: 2.2222222222222223 },
        { lord: "Sun", span: 0.6666666666666666 },
        { lord: "Moon", span: 1.1111111111111112 },
        { lord: "Mars", span: 0.7777777777777777 },
        { lord: "Rahu", span: 2.0000000000000000 },
        { lord: "Jupiter", span: 1.7777777777777777 },
        { lord: "Saturn", span: 2.1111111111111110 },
        { lord: "Mercury", span: 1.8888888888888888 },
    ],
    "Purva Ashadha": [ // Venus Nakshatra
        { lord: "Venus", span: 2.2222222222222223 },
        { lord: "Sun", span: 0.6666666666666666 },
        { lord: "Moon", span: 1.1111111111111112 },
        { lord: "Mars", span: 0.7777777777777777 },
        { lord: "Rahu", span: 2.0000000000000000 },
        { lord: "Jupiter", span: 1.7777777777777777 },
        { lord: "Saturn", span: 2.1111111111111110 },
        { lord: "Mercury", span: 1.8888888888888888 },
        { lord: "Ketu", span: 0.7777777777777777 },
    ],
    "Uttara Ashadha": [ // Sun Nakshatra
        { lord: "Sun", span: 0.6666666666666666 },
        { lord: "Moon", span: 1.1111111111111112 },
        { lord: "Mars", span: 0.7777777777777777 },
        { lord: "Rahu", span: 2.0000000000000000 },
        { lord: "Jupiter", span: 1.7777777777777777 },
        { lord: "Saturn", span: 2.1111111111111110 },
        { lord: "Mercury", span: 1.8888888888888888 },
        { lord: "Ketu", span: 0.7777777777777777 },
        { lord: "Venus", span: 2.2222222222222223 },
    ],
    Shravana: [ // Moon Nakshatra
        { lord: "Moon", span: 1.1111111111111112 },
        { lord: "Mars", span: 0.7777777777777777 },
        { lord: "Rahu", span: 2.0000000000000000 },
        { lord: "Jupiter", span: 1.7777777777777777 },
        { lord: "Saturn", span: 2.1111111111111110 },
        { lord: "Mercury", span: 1.8888888888888888 },
        { lord: "Ketu", span: 0.7777777777777777 },
        { lord: "Venus", span: 2.2222222222222223 },
        { lord: "Sun", span: 0.6666666666666666 },
    ],
    Dhanishtha: [ // Mars Nakshatra
        { lord: "Mars", span: 0.7777777777777777 },
        { lord: "Rahu", span: 2.0000000000000000 },
        { lord: "Jupiter", span: 1.7777777777777777 },
        { lord: "Saturn", span: 2.1111111111111110 },
        { lord: "Mercury", span: 1.8888888888888888 },
        { lord: "Ketu", span: 0.7777777777777777 },
        { lord: "Venus", span: 2.2222222222222223 },
        { lord: "Sun", span: 0.6666666666666666 },
        { lord: "Moon", span: 1.1111111111111112 },
    ],
    Shatabhisha: [ // Rahu Nakshatra
        { lord: "Rahu", span: 2.0000000000000000 },
        { lord: "Jupiter", span: 1.7777777777777777 },
        { lord: "Saturn", span: 2.1111111111111110 },
        { lord: "Mercury", span: 1.8888888888888888 },
        { lord: "Ketu", span: 0.7777777777777777 },
        { lord: "Venus", span: 2.2222222222222223 },
        { lord: "Sun", span: 0.6666666666666666 },
        { lord: "Moon", span: 1.1111111111111112 },
        { lord: "Mars", span: 0.7777777777777777 },
    ],
    "Purva Bhadrapada": [ // Jupiter Nakshatra
        { lord: "Jupiter", span: 1.7777777777777777 },
        { lord: "Saturn", span: 2.1111111111111110 },
        { lord: "Mercury", span: 1.8888888888888888 },
        { lord: "Ketu", span: 0.7777777777777777 },
        { lord: "Venus", span: 2.2222222222222223 },
        { lord: "Sun", span: 0.6666666666666666 },
        { lord: "Moon", span: 1.1111111111111112 },
        { lord: "Mars", span: 0.7777777777777777 },
        { lord: "Rahu", span: 2.0000000000000000 },
    ],
    "Uttara Bhadrapada": [ // Saturn Nakshatra
        { lord: "Saturn", span: 2.1111111111111110 },
        { lord: "Mercury", span: 1.8888888888888888 },
        { lord: "Ketu", span: 0.7777777777777777 },
        { lord: "Venus", span: 2.2222222222222223 },
        { lord: "Sun", span: 0.6666666666666666 },
        { lord: "Moon", span: 1.1111111111111112 },
        { lord: "Mars", span: 0.7777777777777777 },
        { lord: "Rahu", span: 2.0000000000000000 },
        { lord: "Jupiter", span: 1.7777777777777777 },
    ],
    Revati: [ // Mercury Nakshatra
        { lord: "Mercury", span: 1.8888888888888888 },
        { lord: "Ketu", span: 0.7777777777777777 },
        { lord: "Venus", span: 2.2222222222222223 },
        { lord: "Sun", span: 0.6666666666666666 },
        { lord: "Moon", span: 1.1111111111111112 },
        { lord: "Mars", span: 0.7777777777777777 },
        { lord: "Rahu", span: 2.0000000000000000 },
        { lord: "Jupiter", span: 1.7777777777777777 },
        { lord: "Saturn", span: 2.1111111111111110 },
    ],
};

// Default error object for Dasha Balance
export const DEFAULT_DASHA_BALANCE = {
    lord: "Error",
    balanceYears: NaN,
    balanceYMD: { years: 0, months: 0, days: 0 }
};
export const NAKSHATRA_PADA_ALPHABETS = {
    "Ashwini": ["Chu", "Che", "Cho", "La"],
    "Bharani": ["Li", "Lu", "Le", "Lo"],
    "Krittika": ["A", "Ee", "U", "E"], // 1st pada in Aries, rest in Taurus
    "Rohini": ["O", "Va", "Vi", "Vu"],
    "Mrigashira": ["Ve", "Vo", "Ka", "Ki"],
    "Ardra": ["Ku", "Gha", "Nga", "Chha"],
    "Punarvasu": ["Ke", "Ko", "Ha", "Hi"],
    "Pushya": ["Hu", "He", "Ho", "Da"],
    "Ashlesha": ["Di", "Du", "De", "Do"],
    "Magha": ["Ma", "Mi", "Mu", "Me"],
    "Purva Phalguni": ["Mo", "Ta", "Ti", "Tu"],
    "Uttara Phalguni": ["Te", "To", "Pa", "Pi"], // 1st pada in Leo, rest in Virgo
    "Hasta": ["Pu", "Sha", "Na", "Tha"],
    "Chitra": ["Pe", "Po", "Ra", "Ri"],
    "Swati": ["Ru", "Re", "Ro", "Ta"],
    "Vishakha": ["Ti", "Tu", "Te", "To"], // Last pada in Scorpio
    "Anuradha": ["Na", "Ni", "Nu", "Ne"],
    "Jyeshtha": ["No", "Ya", "Yi", "Yu"],
    "Mula": ["Ye", "Yo", "Bha", "Bhi"],
    "Purva Ashadha": ["Bhu", "Dha", "Pha", "Dha"],
    "Uttara Ashadha": ["Bhe", "Bho", "Ja", "Ji"], // 1st pada in Sagittarius, rest in Capricorn
    "Shravana": ["Khi", "Khu", "Khe", "Kho"],
    "Dhanishtha": ["Ga", "Gi", "Gu", "Ge"],
    "Shatabhisha": ["Go", "Sa", "Si", "Su"],
    "Purva Bhadrapada": ["Se", "So", "Da", "Di"],
    "Uttara Bhadrapada": ["Du", "Tha", "Jha", "Na"],
    "Revati": ["De", "Do", "Cha", "Chi"]
};

export const SAMVATSAR_NAMES = [
    'Prabhava', 'Vibhava', 'Shukla', 'Pramoda', 'Prajapati', 'Angira', 'Shrimukha', 'Bhava', 'Yuva', 'Dhatri',
    'Ishwara', 'Bahudhanya', 'Pramathi', 'Vikrama', 'Vishu', 'Chitrabhanu', 'Subhanu', 'Tarana', 'Parthiva', 'Vyaya',
    'Sarvajit', 'Sarvadhari', 'Virodhi', 'Vikriti', 'Khara', 'Nandana', 'Vijaya', 'Jaya', 'Manmatha', 'Durmukha',
    'Hemalambi', 'Vilambi', 'Vikari', 'Sharvari', 'Plava', 'Shubhakrit', 'Shobhakrit', 'Krodhi', 'Vishvavasu', 'Parabhava',
    'Plavanga', 'Kilaka', 'Saumya', 'Sadharana', 'Virodhakrit', 'Paridhavi', 'Pramadicha', 'Ananda', 'Rakshasa', 'Nala',
    'Pingala', 'Kalayukti', 'Siddharthi', 'Raudra', 'Durmati', 'Dundubhi', 'Rudhirodgari', 'Raktakshi', 'Krodhana', 'Kshaya' // or Akshaya
];