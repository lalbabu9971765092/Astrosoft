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

export const PLANET_EXALTATION_SIGN = {
    Sun: "Aries",
    Moon: "Taurus",
    Mars: "Capricorn",
    Mercury: "Virgo",
    Jupiter: "Cancer",
    Venus: "Pisces",
    Saturn: "Libra",
};

export const PLANET_EXALTATION_POINTS = {
    Sun: 10, // Aries 10
    Moon: 33, // Taurus 3
    Mars: 298, // Capricorn 28
    Mercury: 165, // Virgo 15
    Jupiter: 95, // Cancer 5
    Venus: 357, // Pisces 27
    Saturn: 200, // Libra 20
};

export const PLANET_DEBILITATION_SIGN = {
    Sun: "Libra",
    Moon: "Scorpio",
    Mars: "Cancer",
    Mercury: "Pisces",
    Jupiter: "Capricorn",
    Venus: "Virgo",
    Saturn: "Aries",
};

export const PLANET_OWN_SIGNS = {
    Sun: ["Leo"],
    Moon: ["Cancer"],
    Mars: ["Aries", "Scorpio"],
    Mercury: ["Gemini", "Virgo"],
    Jupiter: ["Sagittarius", "Pisces"],
    Venus: ["Taurus", "Libra"],
    Saturn: ["Capricorn", "Aquarius"],
};

export const PLANET_MOOLATRIKONA = {
    Sun: "Leo",
    Moon: "Taurus",
    Mars: "Aries",
    Mercury: "Virgo",
    Jupiter: "Sagittarius",
    Venus: "Libra",
    Saturn: "Aquarius",
};

// Order for calculations and display
export const PLANET_ORDER = [
    "Sun", "Moon", "Mars", "Mercury", "Jupiter", "Venus", "Saturn", "Rahu", "Ketu"
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

export const PLANETARY_RELATIONS = {
    Sun: { friends: ["Moon", "Mars", "Jupiter"], enemies: ["Venus", "Saturn", "Rahu"], neutrals: ["Mercury", "Ketu"] },
    Moon: { friends: ["Sun", "Mercury"], enemies: [], neutrals: ["Mars", "Jupiter", "Venus", "Saturn", "Rahu", "Ketu"] },
    Mars: { friends: ["Sun", "Moon", "Jupiter"], enemies: ["Mercury", "Venus", "Saturn"], neutrals: [] },
    Mercury: { friends: ["Sun", "Venus"], enemies: ["Moon"], neutrals: ["Mars", "Jupiter", "Saturn"] },
    Jupiter: { friends: ["Moon", "Mars", "Sun"], enemies: ["Mercury", "Saturn", "Venus"], neutrals: [] },
    Venus: { friends: ["Mercury", "Saturn", "Rahu"], enemies: ["Sun", "Moon"], neutrals: ["Mars", "Jupiter"] },
    Saturn: { friends: ["Mercury", "Venus"], enemies: ["Sun", "Moon", "Mars"], neutrals: ["Jupiter"] },
    Rahu: { friends: ["Mercury", "Venus", "Saturn"], enemies: ["Sun", "Moon", "Mars"], neutrals: ["Jupiter", "Ketu"] },
    Ketu: { friends: ["Rahu", "Venus", "Saturn"], enemies: ["Sun", "Moon", "Mercury", "Jupiter"], neutrals: ["Mars"] }
};

// Weekday Lords (0 = Sunday, 6 = Saturday)
export const WEEKDAY_LORDS = ["Sun", "Moon", "Mars", "Mercury", "Jupiter", "Venus", "Saturn"];

// Mudda Dasha sequence and years (Vimshottari sequence)
export const MUDDA_DASHA_SEQUENCE = ["Ketu", "Venus", "Sun", "Moon", "Mars", "Rahu", "Jupiter", "Saturn", "Mercury"];
export const MUDDA_DASHA_YEARS = { Ketu: 7, Venus: 20, Sun: 6, Moon: 10, Mars: 7, Rahu: 18, Jupiter: 16, Saturn: 19, Mercury: 17 };
// Sum of MUDDA_DASHA_YEARS = 120
export const MUDDA_TOTAL_YEARS = 120;

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

export const ASPECTS = [
    { type: 'Conjunction', angle: 0, orb: 8 },
    { type: 'Sextile', angle: 60, orb: 6 },
    { type: "Square", angle: 90, orb: 8 },
    { type: "Trine", angle: 120, orb: 8 },
    { type: "Opposition", angle: 180, orb: 8 }
];

export const TAJIKA_ASPECT_SCORES = {
    'Conjunction': 10,
    'Sextile': 8,
    'Square': 5,
    'Trine': 12,
    'Opposition': 2
};

export const PLANETARY_FRIENDSHIPS = {
    'Sun': { 'Sun': 'Neutral', 'Moon': 'Friend', 'Mars': 'Friend', 'Mercury': 'Neutral', 'Jupiter': 'Friend', 'Venus': 'Enemy', 'Saturn': 'Enemy' },
    'Moon': { 'Sun': 'Friend', 'Moon': 'Neutral', 'Mars': 'Neutral', 'Mercury': 'Friend', 'Jupiter': 'Neutral', 'Venus': 'Neutral', 'Saturn': 'Neutral' },
    'Mars': { 'Sun': 'Friend', 'Moon': 'Friend', 'Mars': 'Neutral', 'Mercury': 'Enemy', 'Jupiter': 'Friend', 'Venus': 'Neutral', 'Saturn': 'Enemy' },
    'Mercury': { 'Sun': 'Friend', 'Moon': 'Enemy', 'Mars': 'Neutral', 'Mercury': 'Neutral', 'Jupiter': 'Neutral', 'Venus': 'Friend', 'Saturn': 'Friend' },
    'Jupiter': { 'Sun': 'Friend', 'Moon': 'Friend', 'Mars': 'Friend', 'Mercury': 'Enemy', 'Jupiter': 'Neutral', 'Venus': 'Enemy', 'Saturn': 'Neutral' },
    'Venus': { 'Sun': 'Enemy', 'Moon': 'Enemy', 'Mars': 'Neutral', 'Mercury': 'Friend', 'Jupiter': 'Neutral', 'Venus': 'Neutral', 'Saturn': 'Friend' },
    'Saturn': { 'Sun': 'Enemy', 'Moon': 'Enemy', 'Mars': 'Enemy', 'Mercury': 'Friend', 'Jupiter': 'Neutral', 'Venus': 'Friend', 'Saturn': 'Neutral' }
};

export const DISHA_SHOOL_DIRECTIONS = {
    0: "West",      // Sunday
    1: "East",      // Monday
    2: "North",     // Tuesday
    3: "North",     // Wednesday
    4: "South",     // Thursday
    5: "West",      // Friday
    6: "East"       // Saturday
};

export const SAMVATSAR_NAMES = [
    'Prabhava', 'Vibhava', 'Shukla', 'Pramoda', 'Prajapati', 'Angira', 'Shrimukha', 'Bhava', 'Yuva', 'Dhatri',
    'Ishwara', 'Bahudhanya', 'Pramathi', 'Vikrama', 'Vishu', 'Chitrabhanu', 'Subhanu', 'Tarana', 'Parthiva', 'Vyaya',
    'Sarvajit', 'Sarvadhari', 'Virodhi', 'Vikriti', 'Khara', 'Nandana', 'Vijaya', 'Jaya', 'Manmatha', 'Durmukha',
    'Hemalambi', 'Vilambi', 'Vikari', 'Sharvari', 'Plava', 'Shubhakrit', 'Shobhakrit', 'Krodhi', 'Vishvavasu', 'Parabhava',
    'Plavanga', 'Kilaka', 'Saumya', 'Sadharana', 'Virodhakrit', 'Paridhavi', 'Pramadicha', 'Ananda', 'Rakshasa', 'Nala',
    'Pingala', 'Kalayukti', 'Siddharthi', 'Raudra', 'Durmati', 'Dundubhi', 'Rudhirodgari', 'Raktakshi', 'Krodhana', 'Kshaya' // or Akshaya
];

// Fractions for Varjyam calculation within a Nakshatra's duration.
export const VARJYAM_START_FRACTION = {
    "Ashwini": 0.8333, "Bharani": 0.4, "Krittika": 0.5, "Rohini": 0.6667, "Mrigashira": 0.2333,
    "Ardra": 0.35, "Punarvasu": 0.5, "Pushya": 0.3333, "Ashlesha": 0.5333, "Magha": 0.5,
    "Purva Phalguni": 0.3333, "Uttara Phalguni": 0.3, "Hasta": 0.35, "Chitra": 0.3333,
    "Swati": 0.2333, "Vishakha": 0.2333, "Anuradha": 0.1667, "Jyeshtha": 0.2333, "Mula": 0.3333,
    "Purva Ashadha": 0.4, "Uttara Ashadha": 0.3333, "Shravana": 0.1667, "Dhanishtha": 0.1667,
    "Shatabhisha": 0.3, "Purva Bhadrapada": 0.2667, "Uttara Bhadrapada": 0.4, "Revati": 0.8
};

export const PLANET_AVERAGE_SPEED = {
    Sun: 0.9856,   // degrees per day
    Moon: 13.176,  // degrees per day
    Mars: 0.524,   // degrees per day
    Mercury: 1.0,  // degrees per day (average, highly variable)
    Jupiter: 0.083, // degrees per day
    Venus: 1.62,   // degrees per day
    Saturn: 0.033  // degrees per day
};

export const SHADBALA_REQUIRED_RUPAS = {
    Sun: 390,
    Moon: 360,
    Mars: 300,
    Mercury: 420,
    Jupiter: 390,
    Venus: 330,
    Saturn: 300
};

