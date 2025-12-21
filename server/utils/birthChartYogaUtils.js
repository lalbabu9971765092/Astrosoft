
import { RASHI_LORDS, PLANET_DEBILITATION_SIGN, RASHIS, PLANET_EXALTATION_SIGN } from './constants.js';
import { getHouseOfPlanet, getRashiDetails } from './planetaryUtils.js';
import { YOGA_DEFINITIONS_EN, YOGA_DEFINITIONS_HI } from './YOGA_DEFINITIONS.js';

export const PLANET_NAMES_HI = {
    Sun: 'सूर्य',
    Moon: 'चंद्रमा',
    Mars: 'मंगल',
    Mercury: 'बुध',
    Jupiter: 'बृहस्पति',
    Venus: 'शुक्र',
    Saturn: 'शनि',
    Rahu: 'राहु',
    Ketu: 'केतु',
    Uranus: 'यूरेनस',
    Neptune: 'नेपच्यून',
    Pluto: 'प्लूटो',
    UNKNOWN: 'अज्ञात'
};

export const getPlanetName = (planet, lang) => {
    if (lang === 'hi') {
        return PLANET_NAMES_HI[planet] || planet;
    }
    return planet;
};

const KENDRA_HOUSES = [1, 4, 7, 10];
const TRIKONA_HOUSES = [1, 5, 9];
const DHANA_HOUSES = [2, 11];
const DHANA_TRIKONA_HOUSES = [5, 9];
const DUSTHANA_HOUSES = [6, 8, 12];


/**
 * Finds the lord of a given house.
 * @param {number} houseNumber - The house number (1-12).
 * @param {Array} housesData - Array of house data objects.
 * @returns {string|null} The name of the planet that rules the house, or null if not found.
 */
function getHouseLord(houseNumber, housesData) {
    const house = housesData.find(h => h.house_number === houseNumber);
    if (!house) return null;
    return house.start_rashi_lord;
}

/**
 * Checks for Gaja Kesari Yoga.
 * This yoga is formed when Jupiter is in a Kendra house (1, 4, 7, 10) from the Moon.
 * @param {Object} siderealPositions - The sidereal positions of the planets.
 * @param {Array} housesData - Array of house data objects.
 * @returns {Object|null} Details of the yoga if present, otherwise null.
 */
export function calculateGajaKesariYoga(siderealPositions, housesData, lang = 'en') {
    const moonPosition = siderealPositions['Moon'];
    const jupiterPosition = siderealPositions['Jupiter'];

    if (!moonPosition || !jupiterPosition) {
        return null;
    }

    const currentYogas = lang === 'hi' ? YOGA_DEFINITIONS_HI : YOGA_DEFINITIONS_EN;

    const moonHouse = getHouseOfPlanet(moonPosition.longitude, housesData.map(h => h.start_deg));
    const jupiterHouse = getHouseOfPlanet(jupiterPosition.longitude, housesData.map(h => h.start_deg));

    const distance = Math.abs(jupiterHouse - moonHouse) + 1;

    if (distance === 1 || distance === 4 || distance === 7 || distance === 10) {
        return {
            name: currentYogas.GajaKesari.name,
            description: currentYogas.GajaKesari.description,
            planetsInvolved: ["Moon", "Jupiter"],
        };
    }

    return null;
}

/**
 * Checks for Raja Yogas.
 * Raja yoga is formed by the association of lords of Kendra and Trikona houses.
 * @param {Array} housesData - Array of house data objects.
 * @returns {Array} An array of Raja Yoga details if present, otherwise an empty array.
 */
export function calculateRajaYoga(housesData, siderealPositions, lang = 'en') {
    const yogas = [];
    const currentYogas = lang === 'hi' ? YOGA_DEFINITIONS_HI : YOGA_DEFINITIONS_EN;

    const kendraLords = KENDRA_HOUSES.map(h => getHouseLord(h, housesData));
    const trikonaLords = TRIKONA_HOUSES.map(h => getHouseLord(h, housesData));

    // Find conjunctions
    const planetHouses = Object.entries(siderealPositions).reduce((acc, [planet, data]) => {
        acc[planet] = getHouseOfPlanet(data.longitude, housesData.map(h => h.start_deg));
        return acc;
    }, {});

    for (const kendraLord of new Set(kendraLords)) {
        for (const trikonaLord of new Set(trikonaLords)) {
            if (kendraLord && trikonaLord && kendraLord !== trikonaLord) {
                // Check for conjunction (being in the same house)
                if (planetHouses[kendraLord] === planetHouses[trikonaLord]) {
                    yogas.push({
                        name: currentYogas.RajaYoga.name,
                        description: currentYogas.RajaYoga.description(getPlanetName(kendraLord, lang), getPlanetName(trikonaLord, lang)),
                        planetsInvolved: [kendraLord, trikonaLord],
                    });
                }
            }
        }
    }
    return yogas;
}

/**
 * Checks for Dhana Yogas.
 * Dhana yoga is formed by the association of lords of Dhana houses (2, 11) with lords of Trikona houses (5, 9).
 * @param {Array} housesData - Array of house data objects.
 * @param {Object} siderealPositions - The sidereal positions of the planets.
 * @returns {Array} An array of Dhana Yoga details if present, otherwise an empty array.
 */
export function calculateDhanaYoga(housesData, siderealPositions, lang = 'en') {
    const yogas = [];
    const currentYogas = lang === 'hi' ? YOGA_DEFINITIONS_HI : YOGA_DEFINITIONS_EN;

    const dhanaLords = DHANA_HOUSES.map(h => getHouseLord(h, housesData));
    const trikonaLords = DHANA_TRIKONA_HOUSES.map(h => getHouseLord(h, housesData));

    const planetHouses = Object.entries(siderealPositions).reduce((acc, [planet, data]) => {
        acc[planet] = getHouseOfPlanet(data.longitude, housesData.map(h => h.start_deg));
        return acc;
    }, {});

    for (const dhanaLord of new Set(dhanaLords)) {
        for (const trikonaLord of new Set(trikonaLords)) {
            if (dhanaLord && trikonaLord && dhanaLord !== trikonaLord) {
                // Check for conjunction
                if (planetHouses[dhanaLord] === planetHouses[trikonaLord]) {
                    yogas.push({
                        name: currentYogas.DhanaYoga.name,
                        description: currentYogas.DhanaYoga.description(getPlanetName(dhanaLord, lang), getPlanetName(trikonaLord, lang)),
                        planetsInvolved: [dhanaLord, trikonaLord],
                    });
                }
            }
        }
    }
    return yogas;
}

/**
 * Checks for Pancha Mahapurusha Yogas.
 * These are formed when one of the five planets (Mars, Mercury, Jupiter, Venus, Saturn) is in its own sign or exaltation sign and in a Kendra house.
 * @param {Object} siderealPositions - The sidereal positions of the planets.
 * @param {Array} housesData - Array of house data objects.
 * @returns {Array} An array of Pancha Mahapurusha Yoga details if present, otherwise an empty array.
 */
export function calculatePanchaMahapurushaYoga(siderealPositions, housesData, lang = 'en') {
    const yogas = [];
    const currentYogas = lang === 'hi' ? YOGA_DEFINITIONS_HI : YOGA_DEFINITIONS_EN;

    const planets = ['Mars', 'Mercury', 'Jupiter', 'Venus', 'Saturn'];
    const yogaMap = {
        Mars: 'RuchakaYoga',
        Mercury: 'BhadraYoga',
        Jupiter: 'HamsaYoga',
        Venus: 'MalavyaYoga',
        Saturn: 'SasaYoga'
    };

    for (const planet of planets) {
        const planetPosition = siderealPositions[planet];
        if (planetPosition) {
            const rashiDetails = getRashiDetails(planetPosition.longitude);
            const house = getHouseOfPlanet(planetPosition.longitude, housesData.map(h => h.start_deg));
            
            const isOwnSign = RASHI_LORDS[RASHIS.indexOf(rashiDetails.rashi)] === planet;
            
            if (KENDRA_HOUSES.includes(house) && isOwnSign) {
                const yogaKey = yogaMap[planet];
                if (yogaKey && currentYogas[yogaKey]) {
                    yogas.push({
                        name: currentYogas[yogaKey].name,
                        description: currentYogas[yogaKey].description,
                        planetsInvolved: [planet],
                    });
                }
            }
        }
    }

    return yogas;
}

/**
 * Checks for Vipareeta Raja Yogas.
 * This yoga is formed when the lords of the dusthana houses (6, 8, 12) are placed in other dusthana houses.
 * @param {Array} housesData - Array of house data objects.
 * @param {Object} siderealPositions - The sidereal positions of the planets.
 * @returns {Array} An array of Vipareeta Raja Yoga details if present, otherwise an empty array.
 */
export function calculateVipareetaRajaYoga(housesData, siderealPositions, lang = 'en') {
    const yogas = [];
    const currentYogas = lang === 'hi' ? YOGA_DEFINITIONS_HI : YOGA_DEFINITIONS_EN;

    const dusthanaLords = {
        6: getHouseLord(6, housesData),
        8: getHouseLord(8, housesData),
        12: getHouseLord(12, housesData)
    };

    const planetHouses = Object.entries(siderealPositions).reduce((acc, [planet, data]) => {
        acc[planet] = getHouseOfPlanet(data.longitude, housesData.map(h => h.start_deg));
        return acc;
    }, {});

    const lord6 = dusthanaLords[6];
    const lord8 = dusthanaLords[8];
    const lord12 = dusthanaLords[12];

    if (lord6 && (planetHouses[lord6] === 8 || planetHouses[lord6] === 12)) {
        yogas.push({
            name: currentYogas.HarshaYoga.name,
            description: currentYogas.HarshaYoga.description,
            planetsInvolved: [lord6],
        });
    }

    if (lord8 && (planetHouses[lord8] === 6 || planetHouses[lord8] === 12)) {
        yogas.push({
            name: currentYogas.SaralaYoga.name,
            description: currentYogas.SaralaYoga.description,
            planetsInvolved: [lord8],
        });
    }

    if (lord12 && (planetHouses[lord12] === 6 || planetHouses[lord12] === 8)) {
        yogas.push({
            name: currentYogas.VimalaYoga.name,
            description: currentYogas.VimalaYoga.description,
            planetsInvolved: [lord12],
        });
    }

    return yogas;
}

/**
 * Checks for Neecha Bhanga Raja Yoga.
 * This yoga is formed when a debilitated planet's dispositor is in a Kendra from the Lagna or the Moon.
 * @param {Object} siderealPositions - The sidereal positions of the planets.
 * @param {Array} housesData - Array of house data objects.
 * @returns {Array} An array of Neecha Bhanga Raja Yoga details if present, otherwise an empty array.
 */
export function calculateNeechaBhangaRajaYoga(siderealPositions, housesData, lang = 'en') {
    const yogas = [];
    const currentYogas = lang === 'hi' ? YOGA_DEFINITIONS_HI : YOGA_DEFINITIONS_EN;

    const planets = ['Sun', 'Moon', 'Mars', 'Mercury', 'Jupiter', 'Venus', 'Saturn'];

    const getRashiName = (longitude) => {
        const rashiIndex = Math.floor(longitude / 30);
        return RASHIS[rashiIndex];
    }


    for (const planet of planets) {
        const planetPosition = siderealPositions[planet];
        if (planetPosition && PLANET_DEBILITATION_SIGN[planet]) {
            const planetRashi = getRashiName(planetPosition.longitude);

            if (planetRashi === PLANET_DEBILITATION_SIGN[planet]) {
                const dispositorPlanet = RASHI_LORDS[RASHIS.indexOf(planetRashi)];
                
                // Ensure dispositor exists and its position is available
                if (dispositorPlanet && siderealPositions[dispositorPlanet]) {
                    const dispositorHouse = getHouseOfPlanet(siderealPositions[dispositorPlanet].longitude, housesData.map(h => h.start_deg));
                    
                    const lagnaHouse = getHouseOfPlanet(0, housesData.map(h => h.start_deg)); // Assuming Lagna is 0 degrees for house 1 start
                    const moonPosition = siderealPositions['Moon'];
                    let moonHouse = -1; // Initialize with an invalid value

                    if (moonPosition) {
                        moonHouse = getHouseOfPlanet(moonPosition.longitude, housesData.map(h => h.start_deg));
                    }


                    const isDispositorInKendraFromLagna = KENDRA_HOUSES.includes(dispositorHouse);
                    
                    let isDispositorInKendraFromMoon = false;
                    if (moonHouse !== -1) { // Only check if Moon house is valid
                        const relativeHouseFromMoon = (dispositorHouse - moonHouse + 12) % 12; // 0-indexed relative house
                        if (KENDRA_HOUSES.includes(relativeHouseFromMoon + 1)) { // Convert to 1-indexed for Kendra check
                            isDispositorInKendraFromMoon = true;
                        }
                    }

                    if (isDispositorInKendraFromLagna || isDispositorInKendraFromMoon) {
                        yogas.push({
                            name: currentYogas.NeechaBhangaRajaYoga.name,
                            description: currentYogas.NeechaBhangaRajaYoga.description(getPlanetName(planet, lang), planetRashi, getPlanetName(dispositorPlanet, lang)),
                            planetsInvolved: [planet, dispositorPlanet],
                        });
                    }
                }
            }
        }
    }

    return yogas;
}

/**
 * Checks for Kendruma Yoga.
 * This yoga is formed when there is no planet (except Sun, Rahu, and Ketu) in the 2nd or 12th house from the Moon.
 * @param {Object} siderealPositions - The sidereal positions of the planets.
 * @param {Array} housesData - Array of house data objects.
 * @returns {Object|null} Details of the yoga if present, otherwise null.
 */
export function calculateKendrumaYoga(siderealPositions, housesData, lang = 'en') {
    const moonPosition = siderealPositions['Moon'];
    if (!moonPosition) {
        return null;
    }

    const currentYogas = lang === 'hi' ? YOGA_DEFINITIONS_HI : YOGA_DEFINITIONS_EN;

    const moonHouse = getHouseOfPlanet(moonPosition.longitude, housesData.map(h => h.start_deg));
    const planetsToCheck = ['Mars', 'Mercury', 'Jupiter', 'Venus', 'Saturn']; // Exclude Sun, Rahu, Ketu

    let planetIn2ndFromMoon = false;
    let planetIn12thFromMoon = false;

    for (const planet of planetsToCheck) {
        const currentPlanetPosition = siderealPositions[planet];
        if (currentPlanetPosition) {
            const currentPlanetHouse = getHouseOfPlanet(currentPlanetPosition.longitude, housesData.map(h => h.start_deg));
            
            // Calculate 2nd and 12th house relative to Moon's house
            const house2ndFromMoon = (moonHouse % 12) + 1;
            const house12thFromMoon = (moonHouse - 2 + 12) % 12 + 1;

            if (currentPlanetHouse === house2ndFromMoon) {
                planetIn2ndFromMoon = true;
            }
            if (currentPlanetHouse === house12thFromMoon) {
                planetIn12thFromMoon = true;
            }
        }
    }

    if (!planetIn2ndFromMoon && !planetIn12thFromMoon) {
        return {
            name: currentYogas.KendrumaYoga.name,
            description: currentYogas.KendrumaYoga.description,
            planetsInvolved: ["Moon"], // Only Moon is directly involved in its formation
        };
    }

    return null;
}

/**
 * Checks for Chandra Mangala Yoga.
 * This yoga is formed when the Moon and Mars are in the same house.
 * @param {Object} siderealPositions - The sidereal positions of the planets.
 * @param {Array} housesData - Array of house data objects.
 * @returns {Object|null} Details of the yoga if present, otherwise null.
 */
export function calculateChandraMangalaYoga(siderealPositions, housesData, lang = 'en') {
    const moonPosition = siderealPositions['Moon'];
    const marsPosition = siderealPositions['Mars'];

    if (!moonPosition || !marsPosition) {
        return null;
    }

    const currentYogas = lang === 'hi' ? YOGA_DEFINITIONS_HI : YOGA_DEFINITIONS_EN;

    const moonHouse = getHouseOfPlanet(moonPosition.longitude, housesData.map(h => h.start_deg));
    const marsHouse = getHouseOfPlanet(marsPosition.longitude, housesData.map(h => h.start_deg));

    if (moonHouse === marsHouse) {
        return {
            name: currentYogas.ChandraMangalaYoga.name,
            description: currentYogas.ChandraMangalaYoga.description,
            planetsInvolved: ["Moon", "Mars"],
        };
    }

    return null;
}

/**
 * Checks for Budhaditya Yoga.
 * This yoga is formed when the Sun and Mercury are in the same house.
 * @param {Object} siderealPositions - The sidereal positions of the planets.
 * @param {Array} housesData - Array of house data objects.
 * @returns {Object|null} Details of the yoga if present, otherwise null.
 */
export function calculateBudhadityaYoga(siderealPositions, housesData, lang = 'en') {
    const sunPosition = siderealPositions['Sun'];
    const mercuryPosition = siderealPositions['Mercury'];

    if (!sunPosition || !mercuryPosition) {
        return null;
    }

    const currentYogas = lang === 'hi' ? YOGA_DEFINITIONS_HI : YOGA_DEFINITIONS_EN;

    const sunHouse = getHouseOfPlanet(sunPosition.longitude, housesData.map(h => h.start_deg));
    const mercuryHouse = getHouseOfPlanet(mercuryPosition.longitude, housesData.map(h => h.start_deg));

    if (sunHouse === mercuryHouse) {
        return {
            name: currentYogas.BudhadityaYoga.name,
            description: currentYogas.BudhadityaYoga.description,
            planetsInvolved: ["Sun", "Mercury"],
        };
    }

    return null;
}

/**
 * Checks for Lakshmi Yoga.
 * This yoga is formed when the lord of the 9th house and Venus are in their own or exaltation signs, and are in a Kendra or Trikona house.
 * @param {Object} siderealPositions - The sidereal positions of the planets.
 * @param {Array} housesData - Array of house data objects.
 * @returns {Object|null} Details of the yoga if present, otherwise null.
 */
export function calculateLakshmiYoga(siderealPositions, housesData, lang = 'en') {
    const lord9 = getHouseLord(9, housesData);
    const venusPosition = siderealPositions['Venus'];

    if (!lord9 || !venusPosition) {
        return null;
    }

    const currentYogas = lang === 'hi' ? YOGA_DEFINITIONS_HI : YOGA_DEFINITIONS_EN;

    const lord9Position = siderealPositions[lord9];
    if (!lord9Position) {
        return null;
    }

    const lord9Rashi = getRashiDetails(lord9Position.longitude).rashi;
    const venusRashi = getRashiDetails(venusPosition.longitude).rashi;

    const lord9House = getHouseOfPlanet(lord9Position.longitude, housesData.map(h => h.start_deg));
    const venusHouse = getHouseOfPlanet(venusPosition.longitude, housesData.map(h => h.start_deg));

    const isLord9InOwnSign = RASHI_LORDS[RASHIS.indexOf(lord9Rashi)] === lord9;
    const isLord9Exalted = PLANET_EXALTATION_SIGN[lord9] === lord9Rashi;

    const isVenusInOwnSign = RASHI_LORDS[RASHIS.indexOf(venusRashi)] === 'Venus';
    const isVenusExalted = PLANET_EXALTATION_SIGN['Venus'] === venusRashi;

    const isLord9WellPlaced = KENDRA_HOUSES.includes(lord9House) || TRIKONA_HOUSES.includes(lord9House);
    const isVenusWellPlaced = KENDRA_HOUSES.includes(venusHouse) || TRIKONA_HOUSES.includes(venusHouse);

    if ((isLord9InOwnSign || isLord9Exalted) && isLord9WellPlaced && (isVenusInOwnSign || isVenusExalted) && isVenusWellPlaced) {
        return {
            name: currentYogas.LakshmiYoga.name,
            description: currentYogas.LakshmiYoga.description,
            planetsInvolved: [lord9, "Venus"],
        };
    }

    return null;
}

/**
 * Checks for Dharma Karma Adhipati Yoga.
 * This yoga is formed when the lords of the 9th and 10th houses are in conjunction.
 * @param {Object} siderealPositions - The sidereal positions of the planets.
 * @param {Array} housesData - Array of house data objects.
 * @returns {Object|null} Details of the yoga if present, otherwise null.
 */
export function calculateDharmaKarmaAdhipatiYoga(siderealPositions, housesData, lang = 'en') {
    const lord9 = getHouseLord(9, housesData);
    const lord10 = getHouseLord(10, housesData);

    if (!lord9 || !lord10) {
        return null;
    }

    const currentYogas = lang === 'hi' ? YOGA_DEFINITIONS_HI : YOGA_DEFINITIONS_EN;

    const lord9Position = siderealPositions[lord9];
    if (!lord9Position) {
        return null;
    }

    const lord10Position = siderealPositions[lord10];
    if (!lord10Position) {
        return null;
    }

    const lord9House = getHouseOfPlanet(lord9Position.longitude, housesData.map(h => h.start_deg));
    const lord10House = getHouseOfPlanet(lord10Position.longitude, housesData.map(h => h.start_deg));

    if (lord9House === lord10House) {
        return {
            name: currentYogas.DharmaKarmaAdhipatiYoga.name,
            description: currentYogas.DharmaKarmaAdhipatiYoga.description,
            planetsInvolved: [lord9, lord10],
        };
    }

    return null;
}

/**
 * Checks for Amala Yoga.
 * This yoga is formed when a benefic planet is in the 10th house from the Moon or the Ascendant.
 * @param {Object} siderealPositions - The sidereal positions of the planets.
 * @param {Array} housesData - Array of house data objects.
 * @returns {Object|null} Details of the yoga if present, otherwise null.
 */
export function calculateAmalaYoga(siderealPositions, housesData, lang = 'en') {
    const beneficPlanets = ['Jupiter', 'Venus', 'Mercury'];
    const moonPosition = siderealPositions['Moon'];

    const currentYogas = lang === 'hi' ? YOGA_DEFINITIONS_HI : YOGA_DEFINITIONS_EN;

    for (const planet of beneficPlanets) {
        const planetPosition = siderealPositions[planet];
        if (planetPosition) {
            const planetHouse = getHouseOfPlanet(planetPosition.longitude, housesData.map(h => h.start_deg));
            if (planetHouse === 10) {
                return {
                    name: currentYogas.AmalaYogaFromAscendant.name,
                    description: currentYogas.AmalaYogaFromAscendant.description(getPlanetName(planet, lang)),
                    planetsInvolved: [planet],
                };
            }

            if (moonPosition) {
                const moonHouse = getHouseOfPlanet(moonPosition.longitude, housesData.map(h => h.start_deg));
                const houseFromMoon = (planetHouse - moonHouse + 12) % 12 + 1;
                if (houseFromMoon === 10) {
                    return {
                        name: currentYogas.AmalaYogaFromMoon.name,
                        description: currentYogas.AmalaYogaFromMoon.description(getPlanetName(planet, lang)),
                        planetsInvolved: [planet, "Moon"],
                    };
                }
            }
        }
    }

    return null;
}

/**
 * Checks for Saraswati Yoga.
 * This yoga is formed when Jupiter, Venus, and Mercury are in Kendra or Trikona houses.
 * @param {Object} siderealPositions - The sidereal positions of the planets.
 * @param {Array} housesData - Array of house data objects.
 * @returns {Object|null} Details of the yoga if present, otherwise null.
 */
export function calculateSaraswatiYoga(siderealPositions, housesData, lang = 'en') {
    const jupiterPosition = siderealPositions['Jupiter'];
    const venusPosition = siderealPositions['Venus'];
    const mercuryPosition = siderealPositions['Mercury'];

    if (!jupiterPosition || !venusPosition || !mercuryPosition) {
        return null;
    }

    const currentYogas = lang === 'hi' ? YOGA_DEFINITIONS_HI : YOGA_DEFINITIONS_EN;

    const jupiterHouse = getHouseOfPlanet(jupiterPosition.longitude, housesData.map(h => h.start_deg));
    const venusHouse = getHouseOfPlanet(venusPosition.longitude, housesData.map(h => h.start_deg));
    const mercuryHouse = getHouseOfPlanet(mercuryPosition.longitude, housesData.map(h => h.start_deg));

    const isJupiterWellPlaced = KENDRA_HOUSES.includes(jupiterHouse) || TRIKONA_HOUSES.includes(jupiterHouse);
    const isVenusWellPlaced = KENDRA_HOUSES.includes(venusHouse) || TRIKONA_HOUSES.includes(venusHouse);
    const isMercuryWellPlaced = KENDRA_HOUSES.includes(mercuryHouse) || TRIKONA_HOUSES.includes(mercuryHouse);

    if (isJupiterWellPlaced && isVenusWellPlaced && isMercuryWellPlaced) {
        return {
            name: currentYogas.SaraswatiYoga.name,
            description: currentYogas.SaraswatiYoga.description,
            planetsInvolved: ["Jupiter", "Venus", "Mercury"],
        };
    }

    return null;
}

/**
 * Checks for Parvata Yoga.
 * This yoga is formed when the lord of the Ascendant is in a Kendra or Trikona house and is in its own or exaltation sign.
 * @param {Object} siderealPositions - The sidereal positions of the planets.
 * @param {Array} housesData - Array of house data objects.
 * @returns {Object|null} Details of the yoga if present, otherwise null.
 */
export function calculateParvataYoga(siderealPositions, housesData, lang = 'en') {
    const lord1 = getHouseLord(1, housesData);
    if (!lord1) {
        return null;
    }

    const currentYogas = lang === 'hi' ? YOGA_DEFINITIONS_HI : YOGA_DEFINITIONS_EN;

    const lord1Position = siderealPositions[lord1];
    if (!lord1Position) {
        return null;
    }

    const lord1Rashi = getRashiDetails(lord1Position.longitude).rashi;
    const lord1House = getHouseOfPlanet(lord1Position.longitude, housesData.map(h => h.start_deg));

    const isLord1InOwnSign = RASHI_LORDS[RASHIS.indexOf(lord1Rashi)] === lord1;
    const isLord1Exalted = PLANET_EXALTATION_SIGN[lord1] === lord1Rashi;

    const isLord1WellPlaced = KENDRA_HOUSES.includes(lord1House) || TRIKONA_HOUSES.includes(lord1House);

    if ((isLord1InOwnSign || isLord1Exalted) && isLord1WellPlaced) {
        return {
            name: currentYogas.ParvataYoga.name,
            description: currentYogas.ParvataYoga.description,
            planetsInvolved: [lord1],
        };
    }

    return null;
}

/**
 * Checks for Kahala Yoga.
 * This yoga is formed when the lords of the 4th and 9th houses are in mutual Kendras.
 * @param {Object} siderealPositions - The sidereal positions of the planets.
 * @param {Array} housesData - Array of house data objects.
 * @returns {Object|null} Details of the yoga if present, otherwise null.
 */
export function calculateKahalaYoga(siderealPositions, housesData, lang = 'en') {
    const lord4 = getHouseLord(4, housesData);
    const lord9 = getHouseLord(9, housesData);

    if (!lord4 || !lord9) {
        return null;
    }

    const currentYogas = lang === 'hi' ? YOGA_DEFINITIONS_HI : YOGA_DEFINITIONS_EN;

    const lord4Position = siderealPositions[lord4];
    const lord9Position = siderealPositions[lord9];

    if (!lord4Position || !lord9Position) {
        return null;
    }

    const lord4House = getHouseOfPlanet(lord4Position.longitude, housesData.map(h => h.start_deg));
    const lord9House = getHouseOfPlanet(lord9Position.longitude, housesData.map(h => h.start_deg));

    const isLord4InKendraFromLord9 = KENDRA_HOUSES.includes((lord4House - lord9House + 12) % 12 + 1);
    const isLord9InKendraFromLord4 = KENDRA_HOUSES.includes((lord9House - lord4House + 12) % 12 + 1);

    if (isLord4InKendraFromLord9 && isLord9InKendraFromLord4) {
        return {
            name: currentYogas.KahalaYoga.name,
            description: currentYogas.KahalaYoga.description,
            planetsInvolved: [lord4, lord9],
        };
    }

    return null;
}



/**
 * A master function to calculate all birth chart yogas.
 * @param {Object} siderealPositions - The sidereal positions of the planets.
 * @param {Array} housesData - Array of house data objects.
 * @returns {Array} A list of all yogas present in the chart.
 */
export function calculateAllBirthChartYogas(siderealPositions, housesData, lang = 'en') {
    let allYogas = [];

    const gajaKesariYoga = calculateGajaKesariYoga(siderealPositions, housesData, lang);
    if (gajaKesariYoga) {
        allYogas.push(gajaKesariYoga);
    }

    const rajaYogas = calculateRajaYoga(housesData, siderealPositions, lang);
    allYogas = allYogas.concat(rajaYogas);

    const dhanaYogas = calculateDhanaYoga(housesData, siderealPositions, lang);
    allYogas = allYogas.concat(dhanaYogas);

    const panchaMahapurushaYogas = calculatePanchaMahapurushaYoga(siderealPositions, housesData, lang);
    allYogas = allYogas.concat(panchaMahapurushaYogas);

    const vipareetaRajaYogas = calculateVipareetaRajaYoga(housesData, siderealPositions, lang);
    allYogas = allYogas.concat(vipareetaRajaYogas);

    const neechaBhangaRajaYogas = calculateNeechaBhangaRajaYoga(siderealPositions, housesData, lang);
    allYogas = allYogas.concat(neechaBhangaRajaYogas);

    const kendrumaYoga = calculateKendrumaYoga(siderealPositions, housesData, lang);
    if (kendrumaYoga) {
        allYogas.push(kendrumaYoga);
    }

    const chandraMangalaYoga = calculateChandraMangalaYoga(siderealPositions, housesData, lang);
    if (chandraMangalaYoga) {
        allYogas.push(chandraMangalaYoga);
    }

    const budhadityaYoga = calculateBudhadityaYoga(siderealPositions, housesData, lang);
    if (budhadityaYoga) {
        allYogas.push(budhadityaYoga);
    }
    
    const lakshmiYoga = calculateLakshmiYoga(siderealPositions, housesData, lang);
    if (lakshmiYoga) {
        allYogas.push(lakshmiYoga);
    }
    
    const dharmaKarmaAdhipatiYoga = calculateDharmaKarmaAdhipatiYoga(siderealPositions, housesData, lang);
    if (dharmaKarmaAdhipatiYoga) {
        allYogas.push(dharmaKarmaAdhipatiYoga);
    }
    
    const amalaYoga = calculateAmalaYoga(siderealPositions, housesData, lang);
    if (amalaYoga) {
        allYogas.push(amalaYoga);
    }
    
    const saraswatiYoga = calculateSaraswatiYoga(siderealPositions, housesData, lang);
    if (saraswatiYoga) {
        allYogas.push(saraswatiYoga);
    }
    
    const parvataYoga = calculateParvataYoga(siderealPositions, housesData, lang);
    if (parvataYoga) {
        allYogas.push(parvataYoga);
    }
    
    const kahalaYoga = calculateKahalaYoga(siderealPositions, housesData, lang);
    if (kahalaYoga) {
        allYogas.push(kahalaYoga);
    }

    return allYogas;
}
