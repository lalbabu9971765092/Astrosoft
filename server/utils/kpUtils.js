// utils/kpUtils.js
import logger from "./logger.js";
import { RASHI_SPAN, PLANET_ORDER } from "./constants.js";
import { normalizeAngle } from "./coreUtils.js";
import { getHouseOfPlanet, getHousesRuledByPlanet } from "./planetaryUtils.js";

// KP Number to Ascendant Degree Mapping (1-249)
// Each number corresponds to a specific degree within the zodiac.
// The sequence repeats every 249 numbers.
// Total span = 360 degrees. Span per number = 360 / 249 degrees.
const KP_SPAN_PER_NUMBER = 360 / 249;

/**
 * Calculates the sidereal Ascendant degree based on a KP Prashna number (1-249).
 * @param {number} prashnaNumber - The number given by the querent (1-249).
 * @returns {number} The corresponding sidereal Ascendant longitude in degrees [0, 360), or NaN if invalid input.
 */
export function getNumberBasedAscendantDegree(prashnaNumber) {
  if (
    typeof prashnaNumber !== "number" ||
    isNaN(prashnaNumber) ||
    prashnaNumber < 1 ||
    prashnaNumber > 249
  ) {
    logger.error(
      `Invalid Prashna Number for Ascendant calculation: ${prashnaNumber}. Must be between 1 and 249.`
    );
    // Throw error as this is critical input
    throw new Error(
      `Invalid Prashna Number: ${prashnaNumber}. Must be between 1 and 249.`
    );
  }

  // Calculate the degree based on the number.
  // Number 1 starts at 0 degrees Aries (or the beginning of the chosen zodiac).
  // The degree represents the *start* or *midpoint* of the span for that number?
  // Assuming it represents the start:
  const degree = (prashnaNumber - 1) * KP_SPAN_PER_NUMBER;

  // Normalize the angle just in case, though it should be within [0, 360)
  const normalizedDegree = normalizeAngle(degree);

  return normalizedDegree;
}

/**
 * Gets the significations of a celestial entity (planet or node) based on KP rules.
 * @param {string} entityName - The name of the entity (e.g., "Sun", "Rahu").
 * @param {object} allPlanetData - An object containing sidereal data for all planets.
 * @param {number[]} siderealCuspStartDegrees - An array of 12 sidereal cusp start degrees.
 * @param {string[]} associatedPlanets - An array of planet names associated with the entity (through conjunction or aspect).
 * @returns {object} An object containing the entity's significations.
 */
function getEntitySignifications(
  entityName,
  allPlanetData,
  siderealCuspStartDegrees,
  associatedPlanets = []
) {
  const entityData = allPlanetData[entityName];
  const result = {
    name: entityName,
    occupiedHouses: [],
    ownedHouses: [],
    signLordOwnedHouses: [],
    aspectingOwnedHouses: [],
  };

  // Ensure entityData is valid before proceeding
  if (
    !entityData ||
    typeof entityData.longitude !== "number" ||
    isNaN(entityData.longitude)
  ) {
    logger.warn(
      `No valid position data found for entity: ${entityName}. Returning default significations.`
    );
    return result; // Return the default result object
  }

  const isNode = entityName === "Rahu" || entityName === "Ketu";

  // 1. House Occupied
  const houseOccupied = getHouseOfPlanet(
    entityData.longitude,
    siderealCuspStartDegrees
  );
  result.occupiedHouses = houseOccupied !== null ? [houseOccupied] : []; // Return as array

  // 2. Houses Owned (for planets only)
  if (!isNode) {
    const housesOwned = getHousesRuledByPlanet(
      entityName,
      siderealCuspStartDegrees
    );
    result.ownedHouses = housesOwned; // Return as array
  }

  // 3. Houses from Sign Lord (for nodes only)
  if (isNode) {
    const signLord = entityData.rashiLord;
    if (signLord && signLord !== "N/A" && signLord !== "Error") {
      const signLordHousesOwned = getHousesRuledByPlanet(
        signLord,
        siderealCuspStartDegrees
      );
      const signLordOccupiedHouse = getHouseOfPlanet(
        allPlanetData[signLord].longitude,
        siderealCuspStartDegrees
      );
      result.signLordOwnedHouses = [
        ...new Set(
          [...signLordHousesOwned, signLordOccupiedHouse].filter(
            (h) => h !== null
          )
        ),
      ]; // Return as array
    }
  }

  // 4. Houses from Associated Planets (for nodes only)
  if (isNode && associatedPlanets.length > 0) {
    const associatedOwned = new Set();
    associatedPlanets.forEach((associatedPlanetName) => {
      if (associatedPlanetName !== "Rahu" && associatedPlanetName !== "Ketu") {
        const housesOwned = getHousesRuledByPlanet(
          associatedPlanetName,
          siderealCuspStartDegrees
        );
        const occupiedHouse = getHouseOfPlanet(
          allPlanetData[associatedPlanetName].longitude,
          siderealCuspStartDegrees
        );
        housesOwned.forEach((h) => associatedOwned.add(h));
        if (occupiedHouse !== null) associatedOwned.add(occupiedHouse);
      }
    });
    result.aspectingOwnedHouses = Array.from(associatedOwned); // Return as array
  }

  return result;
}

/**
 * Calculates the detailed KP significators for all planets.
 * @param {object} siderealPositions - Object containing sidereal positions for all planets.
 * @param {number[]} siderealCuspStartDegrees - Array of 12 sidereal cusp start degrees.
 * @param {object} aspects - Object mapping each planet to an array of aspecting planets.
 * @returns {object[]} An array of objects, where each object represents a planet and its significations.
 */
export function calculateKpSignificators(
  siderealPositions,
  siderealCuspStartDegrees,
  houses,
  aspects
) {
  if (
    !siderealPositions ||
    !aspects ||
    !aspects.directAspects ||
    !aspects.reverseAspects
  ) {
    logger.error(
      "siderealPositions or aspects object is undefined or incomplete in calculateKpSignificators. Cannot proceed."
    );
    return { cusps: {}, planets: {} };
  }

  const { reverseAspects } = aspects;

  // --- Calculate Conjunctions Internally ---
  const planetHouses = Object.fromEntries(
    PLANET_ORDER.map((p) => [
      p,
      siderealPositions[p]
        ? getHouseOfPlanet(
            siderealPositions[p].longitude,
            siderealCuspStartDegrees
          )
        : null,
    ])
  );
  const conjunctions = {};
  PLANET_ORDER.forEach((p1) => {
    if (planetHouses[p1] === null) {
      conjunctions[p1] = [];
      return;
    }
    conjunctions[p1] = PLANET_ORDER.filter(
      (p2) => p1 !== p2 && planetHouses[p1] === planetHouses[p2]
    );
  });
  // --- End Conjunction Calculation ---

  const significators = {};

  PLANET_ORDER.forEach((planetName) => {
    const planetInfo = siderealPositions[planetName];
    if (
      !planetInfo ||
      typeof planetInfo.longitude !== "number" ||
      isNaN(planetInfo.longitude)
    ) {
      return; // Skip planets with no data
    }

    const significator = {
      A: [], // Planet in constellation of
      B: [], // Constellation lord in constellation of
      C: [], // Planet occupies house
      D: [], // Planet owns house
    };

    // Level 1: Occupant of Nakshatra
    const nakLord = planetInfo.nakLord;
    if (nakLord && nakLord !== "N/A") {
      significator.A.push(nakLord);
    }

    // Level 2: Planet itself
    significator.B.push(planetName);

    // Level 3: Conjunctions and Aspects
    const associatedPlanets = new Set(reverseAspects[planetName] || []);
    (conjunctions[planetName] || []).forEach((p) => associatedPlanets.add(p));

    associatedPlanets.forEach((p) => {
      if (p && p !== "N/A" && PLANET_ORDER.includes(p)) {
        significator.C.push(p);
      }
    });

    // Level 4: Owner of the sign
    const signLord = planetInfo.rashiLord;
    if (signLord && signLord !== "N/A") {
      significator.D.push(signLord);
    }

    significators[planetName] = {
      A: [...new Set(significator.A)],
      B: [...new Set(significator.B)],
      C: [...new Set(significator.C)],
      D: [...new Set(significator.D)],
    };
  });

  const finalResults = {
    cusps: {},
    planets: {},
  };

  // Generate Cusp Significators
  for (let i = 1; i <= 12; i++) {
    const cuspSignificators = new Set();
    const houseOccupants = Object.keys(planetHouses).filter(
      (p) => planetHouses[p] === i
    );
    const houseLord = houses.find(
      (h) => h.house_number === i
    )?.start_rashi_lord;

    houseOccupants.forEach((occupant) => {
      Object.values(significators[occupant] || {})
        .flat()
        .forEach((p) => cuspSignificators.add(p));
    });

    if (houseLord) {
      Object.values(significators[houseLord] || {})
        .flat()
        .forEach((p) => cuspSignificators.add(p));
    }

    finalResults.cusps[i] = [...cuspSignificators].sort(
      (a, b) => PLANET_ORDER.indexOf(a) - PLANET_ORDER.indexOf(b)
    );
  }

  // Generate Planet Significators
  PLANET_ORDER.forEach((planet) => {
    const planetSigs = new Set();

    // 1. Planet is in the star of a planet (A)
    // Find which planet's nakshatra 'planet' is in.
    const planetNakLord = siderealPositions[planet]?.nakLord;
    if (planetNakLord) {
      const housesForPlanetInNak = getHousesRuledByPlanet(
        planetNakLord,
        siderealCuspStartDegrees
      );
      housesForPlanetInNak.forEach((h) => planetSigs.add(h));
      const nakLordHouse = planetHouses[planetNakLord];
      if (nakLordHouse) planetSigs.add(nakLordHouse);
    }

    // 2. Planet itself (B)
    const housesOwnedByPlanet = getHousesRuledByPlanet(
      planet,
      siderealCuspStartDegrees
    );
    housesOwnedByPlanet.forEach((h) => planetSigs.add(h));
    const planetHouse = planetHouses[planet];
    if (planetHouse) planetSigs.add(planetHouse);

    finalResults.planets[planet] = [...planetSigs].sort((a, b) => a - b);
  });

  const kpSignificatorsDetailed = PLANET_ORDER.map((planetName) => {
    const planetInfo = siderealPositions[planetName];
    if (
      !planetInfo ||
      typeof planetInfo.longitude !== "number" ||
      isNaN(planetInfo.longitude)
    ) {
      // Return a minimal object if planet data is missing
      return { name: planetName, A: [], B: [], C: [], D: [] };
    }

    const entitySigs = getEntitySignifications(
      planetName,
      siderealPositions,
      siderealCuspStartDegrees,
      [
        ...(reverseAspects[planetName] || []),
        ...(conjunctions[planetName] || []),
      ]
    );

    // Find Nakshatra Lord for the planet itself
    const nakshatraLordName = planetInfo.nakLord || "N/A";
    const nakshatraLordInfo = siderealPositions[nakshatraLordName];
    let nakshatraLordAllHouses = [];
    if (nakshatraLordName !== "N/A" && nakshatraLordInfo) {
      const nakLordEntitySigs = getEntitySignifications(
        nakshatraLordName,
        siderealPositions,
        siderealCuspStartDegrees,
        [
          ...(reverseAspects[nakshatraLordName] || []),
          ...(conjunctions[nakshatraLordName] || []),
        ]
      );
      nakshatraLordAllHouses = [
        ...new Set([
          ...(nakLordEntitySigs.occupiedHouses || []),
          ...(nakLordEntitySigs.ownedHouses || []),
          ...(nakLordEntitySigs.signLordOwnedHouses || []),
          ...(nakLordEntitySigs.aspectingOwnedHouses || []),
        ]),
      ].sort((a, b) => a - b);
    }

    // Sub Lord (if available in planetInfo)
    const subLordName = planetInfo.subLord || "N/A";
    const subLordInfo = siderealPositions[subLordName];
    let subLordAllHouses = [];
    if (subLordName !== "N/A" && subLordInfo) {
      const subLordEntitySigs = getEntitySignifications(
        subLordName,
        siderealPositions,
        siderealCuspStartDegrees,
        [
          ...(reverseAspects[subLordName] || []),
          ...(conjunctions[subLordName] || []),
        ]
      );
      subLordAllHouses = [
        ...new Set([
          ...(subLordEntitySigs.occupiedHouses || []),
          ...(subLordEntitySigs.ownedHouses || []),
          ...(subLordEntitySigs.signLordOwnedHouses || []),
          ...(subLordEntitySigs.aspectingOwnedHouses || []),
        ]),
      ].sort((a, b) => a - b);
    }

    return {
      name: planetName,
      A: significators[planetName]?.A || [],
      B: significators[planetName]?.B || [],
      C: significators[planetName]?.C || [],
      D: significators[planetName]?.D || [],
      occupiedHouses: entitySigs.occupiedHouses || [],
      ownedHouses: entitySigs.ownedHouses || [],
      signLordOwnedHouses: entitySigs.signLordOwnedHouses || [],
      aspectingOwnedHouses: entitySigs.aspectingOwnedHouses || [],
      nakshatraLordName: nakshatraLordName,
      nakshatraLordAllHouses: nakshatraLordAllHouses,
                  subLordName: subLordName,
                  subLordAllHouses: subLordAllHouses,
                  avasthas: planetInfo.avasthas,
              };
          });
          return { detailedPlanets: kpSignificatorsDetailed, overview: finalResults };
      }
