import { getHouseOfPlanet, calculatePlanetaryPositions, getRashiDetails, calculateAtmakaraka } from './planetaryUtils.js';
import { convertDMSToDegrees, getJulianDateUT } from './coreUtils.js';
import { getDashaPrediction } from './dashaPredictionGenerator.js';
import { getCombinedPredictionLong } from './predictionTextGenerator.js';
import { calculateAllBirthChartYogas as detectAllYogas } from './birthChartYogaUtils.js';
import { RASHI_LORDS, RASHIS, PLANET_EXALTATION_SIGN, PLANET_DEBILITATION_SIGN } from './constants.js';

/* ======================================================
   Constants & Utilities
====================================================== */
const PLANETS = ['Sun','Moon','Mars','Mercury','Jupiter','Venus','Saturn','Rahu','Ketu'];
const LIFE_AREAS = [
  { name: 'Career', house: 10, varga: 'D10' },
  { name: 'Wealth', house: 2, varga: 'D2' },
  { name: 'Marriage', house: 7, varga: 'D9' },
  { name: 'Health', house: 6, varga: 'D12' },
  { name: 'Spirituality', house: 9, varga: 'D9' }
];
const DURATION = { short: 0.5, medium: 1, long: 3 }; // years

const clamp = (n, min=-100, max=100) => Math.max(min, Math.min(max, n));
const toDegrees = dms => convertDMSToDegrees(dms);

// Helper to determine if a planet is naturally benefic
function isBenefic(planet) {
  return ['Jupiter', 'Venus', 'Mercury', 'Moon'].includes(planet); // Mercury and Moon are conditional
}

/* ======================================================
   Planetary Strength
====================================================== */
function getPlanetDignityScore(p) {
  if (!p) return 0;
  let score = 0;
  if (p.exalted) score += 25;
  if (p.ownSign) score += 15;
  if (p.debilitated) score -= 25;
  if (p.combust) score -= 15;
  if (p.retrograde) score -= 5;
  return score;
}

function calculatePlanetPower(details) {
  if (!details) return 0;
  const { shadbala=50, digBala=50, kalaBala=50, dignity=0 } = details;
  return clamp((shadbala*0.4 + digBala*0.3 + kalaBala*0.2) + dignity);
}

function isFunctionalBenefic(planet, houseNum) {
  const dusthanas = [6,8,12];
  if (planet === 'Jupiter' || planet === 'Venus') return true;
  if (planet === 'Saturn' && [3,10].includes(houseNum)) return true;
  return !dusthanas.includes(houseNum);
}

/* ======================================================
   Aspects
====================================================== */
function calculateAspects(planetPositions, houses) {
  const aspects = [];
  const cuspDegrees = houses.map(h => toDegrees(h.start_dms));
  const SPECIAL_ASPECTS = { Mars: [4,7,8], Jupiter: [5,7,9], Saturn: [3,7,10], Rahu:[5,9], Ketu:[5,9] };
  for (const [planet, data] of Object.entries(planetPositions.sidereal)) {
    if (!data?.longitude) continue;
    const baseHouse = getHouseOfPlanet(data.longitude, cuspDegrees);
    const offsets = SPECIAL_ASPECTS[planet] || [7];
    offsets.forEach(offset => {
      aspects.push({ planet, house: ((baseHouse + offset - 1) % 12) + 1 });
    });
  }
  return aspects;
}

/* ======================================================
   House Strength
====================================================== */
function calculateHouseStrength(houseNum, chartData, planetaryPowers, aspects) {
  let score = 0;
  const houseLord = chartData.houses[houseNum-1]?.lord;
  const lordPower = planetaryPowers[houseLord] || 0;
  score += lordPower * 0.6;

  Object.entries(chartData.planetaryPositions.sidereal).forEach(([p,d]) => {
    if (!d?.longitude) return;
    const h = getHouseOfPlanet(d.longitude, chartData.houses.map(h=>toDegrees(h.start_dms)));
    if (h === houseNum) score += (planetaryPowers[p]||0)*0.3;
  });

  aspects.forEach(a => {
    if (a.house !== houseNum) return;
    const power = planetaryPowers[a.planet] || 0;
    score += isFunctionalBenefic(a.planet, houseNum) ? power*0.2 : power*-0.25;
  });

  return clamp(score);
}

/* ======================================================
   Dasha / Bhukti
====================================================== */
function getCurrentMahadasha(chartData) {
  const now = new Date(chartData.inputParameters.utcDate);
  return chartData.dashaPeriods?.find(d => d.level===1 && now>=new Date(d.start) && now<=new Date(d.end));
}

function getCurrentBhukti(chartData) {
  const now = new Date(chartData.inputParameters.utcDate);
  return chartData.dashaPeriods?.find(d => d.level===2 && now>=new Date(d.start) && now<=new Date(d.end));
}

function getCurrentAntar(chartData) {
  const now = new Date(chartData.inputParameters.utcDate);
  return chartData.dashaPeriods?.find(d => d.level===3 && now>=new Date(d.start) && now<=new Date(d.end));
}

/* ======================================================
   Transits
====================================================== */
async function analyzeTransits(chartData) {
  const jd = getJulianDateUT(chartData.inputParameters.utcDate, chartData.inputParameters.latitude, chartData.inputParameters.longitude);
  const transits = await calculatePlanetaryPositions(jd.julianDayUT);
  const natalPositions = chartData.planetaryPositions.sidereal;
  const cuspDegrees = chartData.houses.map(h => toDegrees(h.start_dms));
  
  const transitEvents = [];

  for (const [transitingPlanet, transitData] of Object.entries(transits.sidereal)) {
    if (!transitData?.longitude) continue;

    const transitedHouse = getHouseOfPlanet(transitData.longitude, cuspDegrees);
    const transitingPlanetIsBenefic = isBenefic(transitingPlanet);
    let narration = `${transitingPlanet} transits the ${transitedHouse}th house, indicating a focus on matters related to this house.`;

    // Check for natal planets in the transited house
    const natalPlanetsInHouse = [];
    for (const [natalPlanet, natalData] of Object.entries(natalPositions)) {
      if (!natalData?.longitude) continue;
      const natalHouse = getHouseOfPlanet(natalData.longitude, cuspDegrees);
      if (natalHouse === transitedHouse && natalPlanet !== transitingPlanet) {
        natalPlanetsInHouse.push(natalPlanet);
      }
    }

    if (natalPlanetsInHouse.length > 0) {
      narration += ` It interacts with natal ${natalPlanetsInHouse.join(', ')} located here.`;
      if (transitingPlanetIsBenefic) {
        narration += ` This can bring favorable developments.`;
      } else {
        narration += ` This may present challenges.`;
      }
    } else {
      narration += ` This period will activate the themes of the ${transitedHouse}th house.`;
    }

    // Determine the lord of the transited house
    const transitedHouseLord = chartData.houses[transitedHouse - 1]?.lord;
    if (transitedHouseLord) {
        narration += ` The lord of this house is ${transitedHouseLord}.`;
    }


    // Simplified aspect check for now (conjunction and opposition)
    for (const [natalPlanet, natalData] of Object.entries(natalPositions)) {
      if (!natalData?.longitude || natalPlanet === transitingPlanet) continue;
      
      const angle = Math.abs(transitData.longitude - natalData.longitude);
      const normalizedAngle = Math.min(angle, 360 - angle); // Smallest angle

      if (normalizedAngle < 5) { // Conjunction
        narration += ` A conjunction with natal ${natalPlanet} suggests a strong merging of their energies.`;
      } else if (normalizedAngle > 175 && normalizedAngle < 185) { // Opposition
        narration += ` An opposition to natal ${natalPlanet} may bring tension or confrontation in related areas.`;
      } else if (normalizedAngle > 115 && normalizedAngle < 125) { // Trine (benefic)
        narration += ` A trine to natal ${natalPlanet} indicates harmonious flow and ease.`;
      } else if (normalizedAngle > 85 && normalizedAngle < 95) { // Square (challenging)
        narration += ` A square to natal ${natalPlanet} may bring dynamic tension and require effort.`;
      }
    }

    transitEvents.push({ planet: transitingPlanet, house: transitedHouse, narration: narration });
  }

  return transitEvents;
}

/* ======================================================
   Yogas Detection
====================================================== */
function detectYogas(chartData) {
  // `detectYogas` from yogaUtils.js now wraps calculateAllBirthChartYogas
  return detectAllYogas(chartData.planetaryPositions.sidereal, chartData.houses);
}

/* ======================================================
   Helper for Dasha Lord Analysis
====================================================== */
function getHouseDetails(houseNum, housesData) {
  const house = housesData.find(h => h.house_number === houseNum);
  if (!house) return null;
  return {
    lord: house.start_rashi_lord,
    rashi: getRashiDetails(house.start_deg).rashi,
  };
}

function getPlanetDignityDescription(planetName, planetPosition) {
  if (!planetPosition) return 'Unknown dignity';
  const rashi = getRashiDetails(planetPosition.longitude).rashi;

  if (planetPosition.exalted) return `exalted in ${rashi}`;
  if (planetPosition.debilitated) return `debilitated in ${rashi}`;
  if (planetPosition.ownSign) return `in its own sign ${rashi}`;

  // Check if planet is in a friendly or enemy sign
  const rashiLord = RASHI_LORDS[RASHIS.indexOf(rashi)];
  // This would require a PLANETARY_FRIENDSHIPS constant. For now, a simplified approach.
  if (PLANET_EXALTATION_SIGN[planetName] === rashi) return `exalted in ${rashi}`;
  if (PLANET_DEBILITATION_SIGN[planetName] === rashi) return `debilitated in ${rashi}`;
  if (RASHI_LORDS[RASHIS.indexOf(rashi)] === planetName) return `in its own sign ${rashi}`;

  return `in ${rashi}`; // Default
}

function analyzeDashaLordsInChart(chartData, currentDasha, currentBhukti, currentAntar) {
  const analysis = [];
  const planetaryPositions = chartData.planetaryPositions.sidereal;
  const houses = chartData.houses;
  const cuspDegrees = houses.map(h => toDegrees(h.start_dms));

  const dashaLords = [
    { name: "Mahadasha", lord: currentDasha?.lord },
    { name: "Bhukti", lord: currentBhukti?.lord },
    { name: "Antar", lord: currentAntar?.lord },
  ];

  dashaLords.forEach(dasha => {
    if (dasha.lord && planetaryPositions[dasha.lord]) {
      const planet = dasha.lord;
      const planetPosition = planetaryPositions[planet];
      const natalHouse = getHouseOfPlanet(planetPosition.longitude, cuspDegrees);
      const dignity = getPlanetDignityDescription(planet, planetPosition);

      // Determine ruled houses
      const ruledHouses = [];
      RASHI_LORDS.forEach((lord, index) => {
        if (lord === planet) {
          const rulingRashi = RASHIS[index];
          // Find which house this rashi falls into in the natal chart
          const houseContainingRashi = houses.find(h => {
            const startRashiIndex = Math.floor(h.start_deg / 30);
            const endRashiIndex = Math.floor(h.end_deg / 30);
            const rashiIndex = RASHIS.indexOf(rulingRashi);
            
            // Simplified check: if house spans the rashi
            if (startRashiIndex <= rashiIndex && rashiIndex <= endRashiIndex) {
              return true;
            }
            // Edge case: when a rashi spans across the 12th/1st house boundary
            if (startRashiIndex > endRashiIndex && (rashiIndex >= startRashiIndex || rashiIndex <= endRashiIndex)) {
                return true;
            }
            return false;
          });
          if (houseContainingRashi) {
            ruledHouses.push(houseContainingRashi.house_number);
          }
        }
      });
      
      let ruledHousesText = '';
      if (ruledHouses.length > 0) {
          ruledHousesText = ` It rules house(s) ${ruledHouses.join(', ')}.`;
      }

      analysis.push(
        `${dasha.name} Lord ${planet} is placed in the ${natalHouse}th house and is ${dignity}.` +
        ruledHousesText
      );
    }
  });

  return analysis;
}


/* ======================================================
   Life Area Reports
====================================================== */
function generateLifeAreaReports(chartData, planetaryPowers, ashtakavarga, currentDasha, currentBhukti, aspects) {
  const reports = {};
  LIFE_AREAS.forEach(area => {
    const houseNum = area.house;
    const house = chartData.houses[houseNum-1];
    const houseLord = house?.lord || 'UNKNOWN';
    const sarvaPoints = ashtakavarga?.sarva?.scores?.[houseNum-1] || 25;
    const houseStrength = calculateHouseStrength(houseNum, chartData, planetaryPowers, aspects);

    // Weighted average: 60% from houseStrength, 40% from Sarva Ashtakavarga (normalized)
    const combinedStrength = (houseStrength * 0.6) + ((sarvaPoints - 28) * 2.5 * 0.4); // Normalize SAV points around 28
    
    let strength = 'Average';
    if (combinedStrength >= 70) strength = 'Very Strong';
    else if (combinedStrength >= 50) strength = 'Strong';
    else if (combinedStrength < 30) strength = 'Weak';

    const timingScore = (currentDasha?.lord===houseLord?40:0) + (currentBhukti?.lord===houseLord?20:0) + (sarvaPoints/2);
    let confidence = 'Low';
    if (timingScore>=70) confidence='Very High';
    else if (timingScore>=55) confidence='High';
    else if (timingScore>=40) confidence='Moderate';

    const narrative = `The ${area.name.toLowerCase()} domain, governed by house ${houseNum}, shows ${strength.toLowerCase()} potential. This is based on the strength of the house lord ${houseLord}, planets in the house, aspects, and a Sarva Ashtakavarga score of ${sarvaPoints}. 
    Confidence level for events in this area is ${confidence}.`;

    reports[area.name.toLowerCase()] = { houseLord, sarvaPoints, strength, confidence, narrative };
  });
  return reports;
}

/* ======================================================
   Human-readable Summary
====================================================== */
function generateSummary(overallReport, lifeAreaReports, eventTimeline, yogas, dashaPrediction, dashaLordAnalysis) {
  let summary = overallReport + '\n\n';
  summary += '=== Dasha Prediction ===\n';
  summary += dashaPrediction + '\n\n';
  if (dashaLordAnalysis.length > 0) {
    summary += '=== Dasha Lords in Chart ===\n';
    dashaLordAnalysis.forEach(analysis => {
      summary += `* ${analysis}\n`;
    });
    summary += '\n';
  }
  summary += '=== Life Areas Summary ===\n';
  Object.values(lifeAreaReports).forEach(area => {
    summary += `${area.narrative}\n\n`;
  });
  summary += '=== Event Timeline ===\n';
  eventTimeline.forEach(ev => {
    summary += `${ev.planet} in ${ev.house}th house: ${ev.narration}\n`;
  });
  summary += '\n'; // Add an extra newline for spacing
  summary += '=== Yogas / Special Periods ===\n';
  if (yogas.length > 0) {
    yogas.forEach(yoga => {
      summary += `* ${yoga.name}: ${yoga.description}\n`;
    });
  } else {
    summary += 'No major Yogas active currently.';
  }
  return summary;
}

/* ======================================================
   Holistic Prediction Engine
====================================================== */
const PredictionEngine = {};

PredictionEngine.generateHolisticPrediction = async chartData => {
  if (!chartData?.ascendant) return { error: 'Invalid chart data' };

  // Planetary Powers
  const planetaryPowers = {};
  PLANETS.forEach(p => {
    planetaryPowers[p] = calculatePlanetPower({
      shadbala: parseFloat(chartData.planetDetails.shadbala?.[p]?.percentage || 50),
      digBala: parseFloat(chartData.planetDetails.digBala?.[p] || 50),
      kalaBala: parseFloat(chartData.planetDetails.kalaBala?.[p] || 50),
      dignity: getPlanetDignityScore(chartData.planetaryPositions.sidereal[p])
    });
  });

  const currentDasha = getCurrentMahadasha(chartData);
  const currentBhukti = getCurrentBhukti(chartData);
  const currentAntar = getCurrentAntar(chartData);

  const aspects = calculateAspects(chartData.planetaryPositions, chartData.houses);

  const atmakaraka = calculateAtmakaraka(chartData.planetaryPositions.sidereal);

  const lagnaLord = chartData.ascendant?.rashiLord;
  const lagnaLordNatalHouse = getHouseOfPlanet(
    chartData.planetaryPositions.sidereal[lagnaLord]?.longitude,
    chartData.houses.map(h => toDegrees(h.start_dms))
  );
  const lagnaLordStrength = planetaryPowers[lagnaLord] || 0;

  const overallReport = getCombinedPredictionLong(
    chartData.ascendant.rashi,
    chartData.planetaryPositions.sidereal.Moon.rashi,
    chartData.planetaryPositions.sidereal.Moon.nakshatra,
    {
      lagnaLord: lagnaLord,
      lagnaLordNatalHouse: lagnaLordNatalHouse,
      lagnaLordStrength: lagnaLordStrength,
      atmakaraka: atmakaraka,
      atmakarakaStrength: planetaryPowers[atmakaraka] || 0,
      planetaryPositions: chartData.planetaryPositions.sidereal,
      houses: chartData.houses
    }
  );

  const dashaPrediction = getDashaPrediction(
    currentDasha?.lord,
    currentBhukti?.lord,
    currentAntar?.lord
  );

  const dashaLordAnalysis = analyzeDashaLordsInChart(chartData, currentDasha, currentBhukti, currentAntar);

  const lifeAreaReports = generateLifeAreaReports(chartData, planetaryPowers, chartData.ashtakavarga, currentDasha, currentBhukti, aspects);

  const eventTimeline = await analyzeTransits(chartData);

  const yogas = detectYogas(chartData);

  const summary = generateSummary(overallReport, lifeAreaReports, eventTimeline, yogas, dashaPrediction, dashaLordAnalysis);

  return { overallReport, dashaPrediction, dashaLordAnalysis, lifeAreaReports, eventTimeline, yogas, summary };
};

export default PredictionEngine;

