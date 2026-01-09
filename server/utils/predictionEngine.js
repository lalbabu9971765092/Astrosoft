import { getHouseOfPlanet, calculatePlanetaryPositions, getRashiDetails, calculateAtmakaraka } from './planetaryUtils.js';
import { convertDMSToDegrees, getJulianDateUT, normalizeAngle } from './coreUtils.js';
import { getCombinedPredictionLong, getUPBSDescription, getOrdinal } from './predictionTextGenerator.js';
import { calculateAllBirthChartYogas as detectAllYogas } from './birthChartYogaUtils.js';
import { RASHI_LORDS, RASHIS, PLANET_EXALTATION_SIGN, PLANET_DEBILITATION_SIGN } from './constants.js';
import { PLANET_NAMES_HI, getPlanetName } from './birthChartYogaUtils.js';
import { calculateUPBS } from './beneficenceUtils.js'; // Import calculateUPBS
import { transitInterpretations_en, transitInterpretations_hi } from './transitInterpretations.js';
/* ======================================================
   Constants & Utilities
====================================================== */
const PLANETS = ['Sun','Moon','Mars','Mercury','Jupiter','Venus','Saturn','Rahu','Ketu'];
const LIFE_AREAS = [
  { name: 'Career', house: 10, varga: 'D10' },
  { name: 'Profession', house: 10, varga: 'D10' },
  { name: 'Wealth', house: 2, varga: 'D2' },
  { name: 'Education', house: 5, varga: 'D9' }, // Using D9 for higher knowledge
  { name: 'Children', house: 5, varga: 'D7' }, // Using D7 for progeny and creativity
  { name: 'Siblings, Courage, Communication', house: 3, varga: 'D3' }, // Using D3 for siblings, courage, communication
  { name: 'Marriage', house: 7, varga: 'D9' },
  { name: 'Health', house: 6, varga: 'D12' },
  { name: 'Litigation', house: 6, varga: 'D6' }, // Using D6 for misfortunes and challenges
  { name: 'Spirituality', house: 9, varga: 'D9' },
  { name: 'Past Karma', house: 1, varga: 'D60' } // Using D60 for overall past karma and destiny
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
  const houseLord = chartData.houses[houseNum-1]?.start_rashi_lord;
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
async function analyzeTransits(chartData, planetaryPowers, lang = 'en') {
  const jd = getJulianDateUT(chartData.inputParameters.utcDate, chartData.inputParameters.latitude, chartData.inputParameters.longitude);
  const transits = await calculatePlanetaryPositions(jd.julianDayUT);
  const natalPositions = chartData.planetaryPositions.sidereal;
  const cuspDegrees = chartData.houses.map(h => toDegrees(h.start_dms));
  
  const interpretations = lang === 'hi' ? transitInterpretations_hi : transitInterpretations_en;

  const transitEvents = [];

  // Sade Sati Check
  const natalMoonRashi = natalPositions.Moon?.rashi_number;
  const transitingSaturnRashi = transits.sidereal.Saturn?.rashi_number;
  if (natalMoonRashi && transitingSaturnRashi) {
      const relativeRashi = (transitingSaturnRashi - natalMoonRashi + 12) % 12;
      if (relativeRashi === 11 || relativeRashi === 0 || relativeRashi === 1) {
          let sadeSatiPhase = '';
          if (relativeRashi === 11) sadeSatiPhase = (lang === 'hi' ? 'पहला चरण (साढ़े साती)' : 'First Phase (Sade Sati)');
          else if (relativeRashi === 0) sadeSatiPhase = (lang === 'hi' ? 'दूसरा चरण (साढ़े साती)' : 'Second Phase (Sade Sati)');
          else if (relativeRashi === 1) sadeSatiPhase = (lang === 'hi' ? 'तीसरा चरण (साढ़े साती)' : 'Third Phase (Sade Sati)');
          const sadeSatiNarration = lang === 'hi'
              ? `आप वर्तमान में शनि की साढ़े साती के ${sadeSatiPhase} से गुजर रहे हैं। यह अवधि गहन आत्मनिरीक्षण, चुनौतियों और महत्वपूर्ण जीवन परिवर्तनों को ला सकती है। धैर्य, अनुशासन और आध्यात्मिक अभ्यास महत्वपूर्ण हैं।`
              : `You are currently undergoing the ${sadeSatiPhase} of Saturn's Sade Sati. This period can bring intense introspection, challenges, and significant life transformations. Patience, discipline, and spiritual practices are crucial.`;
          transitEvents.push({ planet: 'Saturn', event: 'Sade Sati', narration: sadeSatiNarration });
      }
  }

  for (const [transitingPlanet, transitData] of Object.entries(transits.sidereal)) {
    if (!transitData?.longitude || !PLANETS.includes(transitingPlanet)) continue;

    const transitedHouse = getHouseOfPlanet(transitData.longitude, cuspDegrees);
    const narrationParts = [];

    // 1. Get base house transit interpretation
    if (interpretations[transitingPlanet]?.house?.[transitedHouse]) {
        narrationParts.push(interpretations[transitingPlanet].house[transitedHouse]);
    } else {
        // Fallback for missing interpretation
        narrationParts.push(lang === 'hi'
          ? `${getPlanetName(transitingPlanet, lang)} का ${transitedHouse}वें घर में गोचर इस घर से संबंधित मामलों पर ध्यान केंद्रित करेगा।`
          : `The transit of ${transitingPlanet} through your ${getOrdinal(transitedHouse)} house will focus your energy on matters related to this house.`);
    }

    // 2. Find and interpret conjunctions
    const natalPlanetsInHouse = Object.entries(natalPositions)
      .filter(([p, d]) => d?.longitude && getHouseOfPlanet(d.longitude, cuspDegrees) === transitedHouse && p !== transitingPlanet)
      .map(([p]) => p);
      
    if (natalPlanetsInHouse.length > 0) {
        natalPlanetsInHouse.forEach(natalPlanet => {
            if (interpretations[transitingPlanet]?.conjunction?.[natalPlanet]) {
                narrationParts.push(interpretations[transitingPlanet].conjunction[natalPlanet]);
            }
        });
    }

    // 3. Find and interpret other major aspects
    const aspects = { trine: [], square: [], opposition: [] };
    for (const [natalPlanet, natalData] of Object.entries(natalPositions)) {
      if (!natalData?.longitude || natalPlanet === transitingPlanet || natalPlanetsInHouse.includes(natalPlanet)) continue;
      
      const angle = Math.abs(transitData.longitude - natalData.longitude);
      const normalizedAngle = Math.min(angle, 360 - angle);

      if (normalizedAngle > 175 && normalizedAngle < 185) aspects.opposition.push(natalPlanet);
      else if (normalizedAngle > 115 && normalizedAngle < 125) aspects.trine.push(natalPlanet);
      else if (normalizedAngle > 85 && normalizedAngle < 95) aspects.square.push(natalPlanet);
    }
    
    if (aspects.trine.length > 0) {
      aspects.trine.forEach(natalPlanet => {
        if(interpretations[transitingPlanet]?.trine?.[natalPlanet]) {
            narrationParts.push(interpretations[transitingPlanet].trine[natalPlanet]);
        }
      });
    }
    if (aspects.square.length > 0) {
        aspects.square.forEach(natalPlanet => {
            if(interpretations[transitingPlanet]?.square?.[natalPlanet]) {
                const aspectNarration = (lang === 'hi' ? `${getPlanetName(natalPlanet, lang)} से एक वर्ग पहलू तनाव पैदा करता है और कार्रवाई की मांग करता है। ` : `A square aspect from ${getPlanetName(natalPlanet, lang)} creates tension and demands action. `) + interpretations[transitingPlanet].square[natalPlanet];
                narrationParts.push(aspectNarration);
            }
        });
    }
    if (aspects.opposition.length > 0) {
      aspects.opposition.forEach(natalPlanet => {
        if(interpretations[transitingPlanet]?.opposition?.[natalPlanet]) {
            narrationParts.push(interpretations[transitingPlanet].opposition[natalPlanet]);
        }
      });
    }

    transitEvents.push({ planet: transitingPlanet, house: transitedHouse, narration: narrationParts.join('\n\n') });
  }

  return transitEvents;
}

/* ======================================================
   Yogas Detection
====================================================== */
function detectYogas(chartData, lang) {
  // `detectYogas` from yogaUtils.js now wraps calculateAllBirthChartYogas
  return detectAllYogas(chartData.planetaryPositions.sidereal, chartData.houses, lang);
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

const DASHA_NAMES_HI = {
  Mahadasha: 'महादशा',
  Bhukti: 'भुक्ति',
  Antar: 'अंतर',
};

const RASHIS_HI = {
  Aries: 'मेष',
  Taurus: 'वृषभ',
  Gemini: 'मिथुन',
  Cancer: 'कर्क',
  Leo: 'सिंह',
  Virgo: 'कन्या',
  Libra: 'तुला',
  Scorpio: 'वृश्चिक',
  Sagittarius: 'धनु',
  Capricorn: 'मकर',
  Aquarius: 'कुंभ',
  Pisces: 'मीन',
};

const getRashiName = (rashi, lang) => {
  if (lang === 'hi') {
    return RASHIS_HI[rashi] || rashi;
  }
  return rashi;
};


function getPlanetDignityDescription(planetName, planetPosition, lang = 'en') {
  if (!planetPosition) return lang === 'hi' ? 'अज्ञात गरिमा' : 'Unknown dignity';
  
  const rashi = planetPosition.rashi;
  const dignity = planetPosition.avasthas?.dignity;
  const translatedRashi = getRashiName(rashi, lang);
  const translatedPlanet = getPlanetName(planetName, lang);

  let description = '';

  if (lang === 'hi') {
      if (!rashi) return 'अज्ञात राशि में';
      if (dignity === 'Exalted') description = `उच्च का ${translatedRashi} में, जो ${translatedPlanet} को असाधारण शक्ति और शुभता प्रदान करता है।`;
      else if (dignity === 'Debilitated') description = `नीच का ${translatedRashi} में, जो ${translatedPlanet} की शक्ति को कमजोर करता है और चुनौतियों को इंगित करता है।`;
      else if (dignity === 'Moolatrikona') description = `मूलत्रिकोण में (${translatedRashi}), जो ${translatedPlanet} को स्वाभाविक रूप से शक्तिशाली और अच्छी तरह से स्थित बनाता है।`;
      else if (dignity === 'Own Sign') description = `अपनी स्वराशि (${translatedRashi}) में, जो ${translatedPlanet} को मजबूत, स्थिर और स्वतंत्र परिणाम देने वाला बनाता है।`;
      else if (dignity === 'Friend') description = `मित्र राशि (${translatedRashi}) में, जो ${translatedPlanet} को सहजता और सकारात्मकता के साथ कार्य करने में मदद करता है।`;
      else if (dignity === 'Enemy') description = `शत्रु राशि (${translatedRashi}) में, जो ${translatedPlanet} के प्रभाव में घर्षण और संघर्ष पैदा कर सकता है।`;
      else if (dignity === 'Neutral') description = `सम राशि (${translatedRashi}) में, जो ${translatedPlanet} को तटस्थ परिणाम देता है, अन्य प्रभावों पर निर्भर करता है।`;
      else description = `${translatedRashi} में`; // Default fallback
  } else { // English
      if (!rashi) return 'in an unknown sign';
      if (dignity === 'Exalted') description = `exalted in ${rashi}, granting ${translatedPlanet} exceptional power and beneficence.`;
      else if (dignity === 'Debilitated') description = `debilitated in ${rashi}, weakening ${translatedPlanet}'s influence and indicating challenges.`;
      else if (dignity === 'Moolatrikona') description = `in Moolatrikona in ${rashi}, making ${translatedPlanet} naturally powerful and well-disposed.`;
      else if (dignity === 'Own Sign') description = `in its own sign of ${rashi}, making ${translatedPlanet} strong, stable, and capable of independent results.`;
      else if (dignity === 'Friend') description = `in a friendly sign of ${rashi}, helping ${translatedPlanet} to function with ease and positivity.`;
      else if (dignity === 'Enemy') description = `in an enemy sign of ${rashi}, which may create friction and struggles in ${translatedPlanet}'s effects.`;
      else if (dignity === 'Neutral') description = `in a neutral sign of ${rashi}, giving ${translatedPlanet} balanced results, dependent on other influences.`;
      else description = `in ${rashi}`; // Default fallback
  }

  return description;
}

function analyzeDashaLordsInChart(chartData, planetaryPowers, currentDasha, currentBhukti, currentAntar, lang = 'en') {
  const analysis = [];
  const planetaryPositions = chartData.planetaryPositions.sidereal;
  const houses = chartData.houses;
  const cuspDegrees = houses.map(h => toDegrees(h.start_dms));
  const yogas = detectYogas(chartData, lang);
  
  const PLANETARY_RELATIONSHIPS = {
    'Sun': { friends: ['Moon', 'Mars', 'Jupiter'], enemies: ['Venus', 'Saturn'], neutral: ['Mercury'] },
    'Moon': { friends: ['Sun', 'Mercury'], enemies: [], neutral: ['Mars', 'Jupiter', 'Venus', 'Saturn'] },
    'Mars': { friends: ['Sun', 'Moon', 'Jupiter'], enemies: ['Mercury'], neutral: ['Venus', 'Saturn'] },
    'Mercury': { friends: ['Sun', 'Venus'], enemies: ['Moon'], neutral: ['Mars', 'Jupiter', 'Saturn'] },
    'Jupiter': { friends: ['Sun', 'Moon', 'Mars'], enemies: ['Mercury', 'Venus'], neutral: ['Saturn'] },
    'Venus': { friends: ['Mercury', 'Saturn'], enemies: ['Sun', 'Moon'], neutral: ['Mars', 'Jupiter'] },
    'Saturn': { friends: ['Mercury', 'Venus'], enemies: ['Sun', 'Moon', 'Mars'], neutral: ['Jupiter'] },
    'Rahu': { friends: ['Mercury', 'Venus', 'Saturn'], enemies: ['Sun', 'Moon', 'Mars'], neutral: ['Jupiter'] },
    'Ketu': { friends: ['Sun', 'Moon', 'Jupiter'], enemies: ['Mercury'], neutral: ['Venus', 'Saturn'] }
  };

  const dashaLevels = [
    { name: "Mahadasha", name_hi: "महादशा", lord: currentDasha?.lord, parentLord: null },
    { name: "Bhukti", name_hi: "भुक्ति", lord: currentBhukti?.lord, parentLord: currentDasha?.lord },
    { name: "Antar", name_hi: "अंतर", lord: currentAntar?.lord, parentLord: currentBhukti?.lord },
  ];

  dashaLevels.forEach(level => {
    if (level.lord && planetaryPositions[level.lord]) {
      const planet = level.lord;
      const planetPosition = planetaryPositions[planet];
      const natalHouse = getHouseOfPlanet(planetPosition.longitude, cuspDegrees);
      const dignityDesc = getPlanetDignityDescription(planet, planetPosition, lang);
      const translatedPlanet = getPlanetName(planet, lang);
      
      const lordScore = planetaryPowers[planet]?.total || 0;
      const strengthDescription = getUPBSDescription(lordScore, lang);

      const ruledHouses = houses.filter(h => h.start_rashi_lord === planet).map(h => h.house_number);
      const aspectedHouses = calculateAspects({ sidereal: { [planet]: planetPosition } }, houses).map(a => a.house);
      const involvedYogas = yogas.filter(y => y.planetsInvolved.includes(planet));

      let narrative = '';
      if (lang === 'hi') {
        narrative = `**${level.name_hi} स्वामी ${translatedPlanet}:** यह ग्रह आपके ${natalHouse}वें घर में ${dignityDesc} में स्थित है। यह ${strengthDescription}। `;
        if (ruledHouses.length > 0) {
          narrative += `इसकी अवधि के दौरान, ${ruledHouses.join(' और ')} भावों से संबंधित मामले प्रमुख होंगे। `;
        }
        if (involvedYogas.length > 0) {
            narrative += `यह ${involvedYogas.map(y => y.name).join(', ')} जैसे योगों में शामिल है, जो इस अवधि के दौरान इन योगों के परिणामों को सक्रिय करेगा। `;
        }
      } else {
        narrative = `**${level.name} Lord ${planet}:** This planet is located in your ${getOrdinal(natalHouse)} house, ${dignityDesc}. It ${strengthDescription}. `;
        if (ruledHouses.length > 0) {
          narrative += `During its period, matters related to house(s) ${ruledHouses.map(getOrdinal).join(' and ')} will be prominent. `;
        }
        if (involvedYogas.length > 0) {
            narrative += `It is involved in yogas like ${involvedYogas.map(y => y.name).join(', ')}, which will activate the results of these yogas during this period. `;
        }
      }

      if (level.parentLord) {
          const parent = level.parentLord;
          const parentPosition = planetaryPositions[parent];
          const parentNatalHouse = getHouseOfPlanet(parentPosition.longitude, cuspDegrees);
          
          const relativeHouse = ((natalHouse - parentNatalHouse + 12) % 12) + 1;
          const relationship = PLANETARY_RELATIONSHIPS[parent]?.[PLANETARY_RELATIONSHIPS[parent]?.friends.includes(planet) ? 'friends' : PLANETARY_RELATIONSHIPS[parent]?.enemies.includes(planet) ? 'enemies' : 'neutral'];

          let relationshipDesc = '';
          if (lang === 'hi') {
              const relMap = { friends: 'मित्रतापूर्ण', enemies: 'शत्रुतापूर्ण', neutral: 'तटस्थ' };
              relationshipDesc = relMap[Object.keys(relMap).find(key => PLANETARY_RELATIONSHIPS[parent]?.[key]?.includes(planet))] || 'तटस्थ';
          } else {
              relationshipDesc = Object.keys(PLANETARY_RELATIONSHIPS[parent]).find(key => PLANETARY_RELATIONSHIPS[parent][key].includes(planet));
          }

          let placementNarrative = '';
          if (lang === 'hi') {
              placementNarrative = `${getPlanetName(parent, lang)} के साथ इसका ${relationshipDesc} संबंध है। यह ${getPlanetName(parent, lang)} से ${relativeHouse}वें घर में स्थित है। `;
              if ([6, 8, 12].includes(relativeHouse)) {
                  placementNarrative += `यह एक चुनौतीपूर्ण स्थिति है, जो बताती है कि इस उप-अवधि में ${level.parentLord ? 'महादशा' : 'दशा'} के विषयों के संबंध में बाधाएं या संघर्ष उत्पन्न हो सकते हैं।`;
              } else if ([1, 5, 9].includes(relativeHouse)) {
                  placementNarrative += `यह एक अत्यधिक शुभ स्थिति है, जो ${level.parentLord ? 'महादशा' : 'दशा'} के विषयों का समर्थन करने वाली चिकनी प्रगति और भाग्य का वादा करती है।`;
              } else if ([4, 7, 10].includes(relativeHouse)) {
                  placementNarrative += `यह एक सहायक स्थिति है, जो ${level.parentLord ? 'महादशा' : 'दशा'} के लक्ष्यों को प्राप्त करने के लिए कार्रवाई और प्रयास का संकेत देती है।`;
              }
          } else {
              placementNarrative = `It has a ${relationshipDesc} relationship with ${parent}. It is placed in the ${getOrdinal(relativeHouse)} house from ${parent}. `;
              if ([6, 8, 12].includes(relativeHouse)) {
                  placementNarrative += `This is a challenging placement, suggesting that this sub-period may bring obstacles or conflicts in relation to the main period's themes.`;
              } else if ([1, 5, 9].includes(relativeHouse)) {
                  placementNarrative += `This is a highly favorable placement, promising smooth progress and fortune that supports the main period's themes.`;
              } else if ([4, 7, 10].includes(relativeHouse)) {
                  placementNarrative += `This is a supportive placement, indicating action and effort towards achieving the main period's goals.`;
              }
          }
          narrative += placementNarrative;
      }
      analysis.push(narrative);
    }
  });

  return analysis;
}


const LIFE_AREA_NAMES_HI = {
  Career: 'करियर',
  Profession: 'पेशा',
  Wealth: 'धन',
  Education: 'शिक्षा',
  Marriage: 'विवाह',
  Health: 'स्वास्थ्य',
  Litigation: 'मुकदमेबाजी',
  Spirituality: 'अध्यात्म',
};

const getLifeAreaName = (areaName, lang) => {
  if (lang === 'hi') {
    return LIFE_AREA_NAMES_HI[areaName] || areaName;
  }
  return areaName;
};

function synthesizeFactors(factors, lang = 'en') {
    const supportive = [];
    const challenging = [];
    let summary = '';

    const get = (type, name = null) => factors.find(f => f.type === type && (!name || f.name === name));
    const getAll = (type) => factors.filter(f => f.type === type);

    const lordStrength = get('lordStrength');
    const yogas = getAll('yoga');
    const beneficAspects = getAll('aspect').filter(a => a.name === 'benefic');
    const maleficAspects = getAll('aspect').filter(a => a.name === 'malefic');
    const sarva = get('sarva');

    const isLordAfflicted = lordStrength && lordStrength.score < -5;
    const isLordSupported = lordStrength && lordStrength.score >= 5;
    const isLordNeutral = !isLordAfflicted && !isLordSupported;

    const hasHighSarva = sarva && sarva.name === 'high';
    const hasGoodYoga = yogas.length > 0;
    const hasBeneficAspect = beneficAspects.length > 0;
    const hasMaleficAspect = maleficAspects.length > 0;

    // --- Categorize factors ---
    if (hasHighSarva) {
        supportive.push(lang === 'hi' ? `एक अनुकूल सर्वाष्टकवर्ग स्कोर (${sarva.score}) है, जो इस क्षेत्र में सफलता और विस्तार के लिए एक मजबूत क्षमता का संकेत देता है` : `a favorable Sarva Ashtakavarga score of ${sarva.score}, indicating a strong capacity for success and expansion`);
    } else if (sarva) {
        challenging.push(lang === 'hi' ? `एक कम सर्वाष्टकवर्ग स्कोर (${sarva.score}) है, जो बताता है कि वांछित परिणाम प्राप्त करने के लिए अधिक प्रयास की आवश्यकता हो सकती है` : `a low Sarva Ashtakavarga score of ${sarva.score}, suggesting that more effort may be required to achieve desired results`);
    }

    if (hasGoodYoga) {
        const yogaNames = yogas.map(y => y.names).flat().join(', ');
        supportive.push(lang === 'hi' ? `शक्तिशाली योगों की उपस्थिति (जैसे '${yogaNames}') क्षमता को और बढ़ाती है` : `the presence of powerful yogas like '${yogaNames}' further enhances the potential`);
    }

    if (hasBeneficAspect) {
        const aspectingPlanets = beneficAspects.map(a => a.planets).flat().map(p => getPlanetName(p, lang)).join(', ');
        supportive.push(lang === 'hi' ? `${aspectingPlanets} से सहायक पहलू विकास और अवसरों का संकेत देते हैं` : `supportive aspects from ${aspectingPlanets} indicate growth and opportunities`);
    }
    
    if (hasMaleficAspect) {
        const aspectingPlanets = maleficAspects.map(a => a.planets).flat().map(p => getPlanetName(p, lang)).join(', ');
        challenging.push(lang === 'hi' ? `${aspectingPlanets} से चुनौतीपूर्ण पहलू बाधाओं या संघर्षों का संकेत दे सकते हैं` : `challenging aspects from ${aspectingPlanets} may indicate obstacles or conflicts`);
    }

    // --- Generate Detailed Summary ---
    if (isLordSupported) {
        if (!hasMaleficAspect) {
            summary = lang === 'hi'
                ? "इस क्षेत्र का स्वामी मजबूत है और उसे कोई बड़ी चुनौती नहीं मिल रही है, जो इस जीवन क्षेत्र में असाधारण क्षमता का संकेत देता है। आप प्राकृतिक प्रवाह, प्रचुर अवसरों और महत्वपूर्ण उपलब्धियों की उम्मीद कर सकते हैं।"
                : "The lord of this area is strong and faces no major challenges, indicating exceptional potential in this sphere of life. You can expect natural flow, abundant opportunities, and significant achievements.";
        } else {
            summary = lang === 'hi'
                ? `इस क्षेत्र का स्वामी मजबूत है, जो सफलता के लिए एक ठोस आधार प्रदान करता है। हालांकि, चुनौतीपूर्ण पहलू मौजूद हैं, जो यह सुझाव देते हैं कि आपको कुछ बाधाओं को दूर करने की आवश्यकता होगी, लेकिन आपके पास ऐसा करने की ताकत है।`
                : `The lord of this area is strong, providing a solid foundation for success. However, challenging aspects are present, suggesting that while you will need to overcome some obstacles, you have the inherent strength to do so.`;
        }
    } else if (isLordAfflicted) {
        if (hasBeneficAspect || hasGoodYoga || hasHighSarva) {
            summary = lang === 'hi'
                ? "इस क्षेत्र के स्वामी के पीड़ित होने के बावजूद, कई सकारात्मक प्रभाव एक 'संघर्ष के बाद सफलता' की गतिशील का निर्माण करते हैं। यह एक ऐसे मार्ग का सुझाव देता है जहाँ आपको महत्वपूर्ण बाधाओं का सामना करना पड़ेगा, लेकिन आपके पास उन्हें पार करने और अंततः महान सफलता प्राप्त करने की क्षमता भी है।"
                : "Despite the affliction of this area's lord, several positive influences create a 'success after struggle' dynamic. This suggests a path where you will face significant obstacles, but you also possess the inherent potential to overcome them and achieve notable success.";
        } else {
            summary = lang === 'hi'
                ? "इस क्षेत्र का स्वामी काफी पीड़ित है और उसे कोई बड़ा सहारा नहीं मिल रहा है। यह इस जीवन क्षेत्र में लगातार चुनौतियों का संकेत देता है। सफलता के लिए बहुत धैर्य, लचीलापन और सचेत प्रयास की आवश्यकता होगी।"
                : "The lord of this area is significantly afflicted and lacks major supportive influences. This points to persistent challenges in this sphere of life. Success will require a great deal of patience, resilience, and conscious effort.";
        }
    } else { // isLordNeutral
        if (hasHighSarva && hasBeneficAspect && !hasMaleficAspect) {
            summary = lang === 'hi'
                ? "यद्यपि इस क्षेत्र का स्वामी तटस्थ है, मजबूत सहायक कारक (जैसे उच्च सर्वाष्टकवर्ग और शुभ पहलू) एक बहुत ही सकारात्मक परिणाम का संकेत देते हैं। प्रयास आसानी से सफलता की ओर ले जाएंगे।"
                : "Although the lord of this area is neutral, the strong supportive factors (like high Sarva and benefic aspects) indicate a very positive outcome. Efforts will lead to success with relative ease.";
        } else if (hasMaleficAspect && !hasBeneficAspect && !hasHighSarva) {
             summary = lang === 'hi'
                ? "इस क्षेत्र का स्वामी तटस्थ है, लेकिन चुनौतीपूर्ण प्रभाव प्रमुख हैं। यह बताता है कि इस क्षेत्र में प्रगति के लिए आपको बाधाओं को दूर करने के लिए सचेत प्रयास करने की आवश्यकता होगी।"
                : "The lord of this area is neutral, but challenging influences are prominent. This suggests that you will need to apply conscious effort to overcome obstacles for progress in this area.";
        } else {
            summary = lang === 'hi'
                ? "इस क्षेत्र की क्षमता मध्यम है। सफलता आपके प्रयासों, बाहरी परिस्थितियों और आप जिन ग्रहों की दशाओं से गुजर रहे हैं, उन पर बहुत अधिक निर्भर करेगी।"
                : "The potential of this area is moderate. Success will depend heavily on your efforts, external circumstances, and the planetary periods you are running.";
        }
    }

    return {
        supportive: supportive.length > 0 ? supportive.join('. ') + '.' : (lang === 'hi' ? 'कोई विशेष सहायक प्रभाव नहीं मिला।' : 'No specific supportive influences found.'),
        challenging: challenging.length > 0 ? challenging.join('. ') + '.' : (lang === 'hi' ? 'कोई विशेष चुनौतीपूर्ण प्रभाव नहीं मिला।' : 'No specific challenging influences found.'),
        summary: summary
    };
}


/* ======================================================
   Life Area Reports
====================================================== */
function generateLifeAreaReports(chartData, planetaryPowers, ashtakavarga, yogas, aspects, lang = 'en') {
  const reports = {};
  const cuspDegrees = chartData.houses.map(h => toDegrees(h.start_dms));

  const HOUSE_THEMES = {
      1: { en: "self, identity, and personality", hi: "स्व, पहचान, और व्यक्तित्व" },
      2: { en: "wealth, family, and speech", hi: "धन, परिवार, और वाणी" },
      3: { en: "siblings, courage, and communication", hi: "भाई-बहन, साहस, और संचार" },
      4: { en: "mother, home, and inner peace", hi: "माता, घर, और आंतरिक शांति" },
      5: { en: "children, creativity, and intellect", hi: "संतान, रचनात्मकता, और बुद्धि" },
      6: { en: "health, debts, and daily work", hi: "स्वास्थ्य, ऋण, और दैनिक कार्य" },
      7: { en: "partnerships, marriage, and contracts", hi: "साझेदारी, विवाह, और अनुबंध" },
      8: { en: "longevity, transformation, and secrets", hi: "दीर्घायु, परिवर्तन, और रहस्य" },
      9: { en: "father, fortune, and higher learning", hi: "पिता, भाग्य, और उच्च शिक्षा" },
      10: { en: "career, reputation, and public life", hi: "करियर, प्रतिष्ठा, और सार्वजनिक जीवन" },
      11: { en: "gains, friendships, and aspirations", hi: "लाभ, मित्रता, और आकांक्षाएं" },
      12: { en: "expenses, spirituality, and liberation", hi: "व्यय, आध्यात्मिकता, और मोक्ष" }
  };
  
  const PLANETARY_RELATIONSHIPS = {
    'Sun': { friends: ['Moon', 'Mars', 'Jupiter'], enemies: ['Venus', 'Saturn'], neutral: ['Mercury'] },
    'Moon': { friends: ['Sun', 'Mercury'], enemies: [], neutral: ['Mars', 'Jupiter', 'Venus', 'Saturn'] },
    'Mars': { friends: ['Sun', 'Moon', 'Jupiter'], enemies: ['Mercury'], neutral: ['Venus', 'Saturn'] },
    'Mercury': { friends: ['Sun', 'Venus'], enemies: ['Moon'], neutral: ['Mars', 'Jupiter', 'Saturn'] },
    'Jupiter': { friends: ['Sun', 'Moon', 'Mars'], enemies: ['Mercury', 'Venus'], neutral: ['Saturn'] },
    'Venus': { friends: ['Mercury', 'Saturn'], enemies: ['Sun', 'Moon'], neutral: ['Mars', 'Jupiter'] },
    'Saturn': { friends: ['Mercury', 'Venus'], enemies: ['Sun', 'Moon', 'Mars'], neutral: ['Jupiter'] },
    'Rahu': { friends: ['Mercury', 'Venus', 'Saturn'], enemies: ['Sun', 'Moon', 'Mars'], neutral: ['Jupiter'] },
    'Ketu': { friends: ['Sun', 'Moon', 'Jupiter'], enemies: ['Mercury'], neutral: ['Venus', 'Saturn'] }
  };

  const allMahadashaLords = [...new Set(chartData.dashaPeriods.filter(d => d.level === 1).map(d => d.lord))];

  LIFE_AREAS.forEach(area => {
      const houseNum = area.house;
      const house = chartData.houses[houseNum - 1];
      const houseLord = house?.start_rashi_lord;

      if (!houseLord) {
          reports[area.name.toLowerCase()] = { narrative: "Analysis unavailable." };
          return;
      }

      const lordPosition = chartData.planetaryPositions.sidereal[houseLord];
      const lordPlacementHouse = lordPosition ? getHouseOfPlanet(lordPosition.longitude, cuspDegrees) : null;
      const theme = HOUSE_THEMES[lordPlacementHouse]?.[lang] || (lang === 'hi' ? 'अज्ञात मामलों' : 'unknown matters');
      
      const lordScore = planetaryPowers[houseLord]?.total || 0;
      const strengthDesc = getUPBSDescription(lordScore, lang);
      const translatedLord = getPlanetName(houseLord, lang);

      let introNarrative = lang === 'hi'
          ? `${getLifeAreaName(area.name, lang)} का क्षेत्र, जो ${houseNum}वें घर द्वारा शासित है, आपके जीवन भर के लिए एक महत्वपूर्ण विषय है। इसकी नींव इसके स्वामी, ${translatedLord}, द्वारा रखी गई है, जो ${strengthDesc}। यह ${lordPlacementHouse}वें घर में स्थित है, जो आपके ${getLifeAreaName(area.name, lang)} को ${theme} के मामलों से जोड़ता है।`
          : `The domain of your ${area.name}, governed by your ${getOrdinal(houseNum)} house, is a significant theme throughout your life. Its foundation is laid by its lord, ${houseLord}, which ${strengthDesc}. It is placed in the ${getOrdinal(lordPlacementHouse)} house, linking your ${area.name.toLowerCase()} to matters of ${theme}.`;

      const planetsInHouse = Object.entries(chartData.planetaryPositions.sidereal).filter(([p, d]) => d?.longitude && PLANETS.includes(p) && getHouseOfPlanet(d.longitude, cuspDegrees) === houseNum).map(([p]) => getPlanetName(p, lang));
      if (planetsInHouse.length > 0) {
          introNarrative += lang === 'hi' ? ` इस घर में ${planetsInHouse.join(', ')} स्थित हैं, जो अपनी ऊर्जा सीधे इस क्षेत्र में लाते हैं।` : ` The planets ${planetsInHouse.join(', ')} are situated here, lending their direct energies to this area.`;
      }

      const factors = [];
      factors.push({ type: 'lordStrength', score: lordScore });

      const sarvaPoints = ashtakavarga?.sarva?.scores?.[houseNum - 1] || 0;
      factors.push({ type: 'sarva', name: sarvaPoints >= 28 ? 'high' : 'low', score: sarvaPoints });

      const relevantYogas = yogas.filter(yoga => {
          const areaSpecificYogaNames = { 'Wealth': ['Dhana', 'Lakshmi'], 'Career': ['Raja', 'Adhipati', 'Amala', 'Pancha Mahapurusha'], 'Health': ['Harsha', 'Vipareeta'], 'Spirituality': ['Saraswati', 'Gaja Kesari', 'Adhipati'], 'Marriage': ['Raja'] };
          return yoga.planetsInvolved.includes(houseLord) || areaSpecificYogaNames[area.name]?.some(name => yoga.name.includes(name));
      });
      if (relevantYogas.length > 0) {
          factors.push({ type: 'yoga', names: relevantYogas.map(y => y.name) });
      }

      const aspectsOnHouse = aspects.filter(aspect => aspect.house === houseNum);
      const beneficPlanets = ['Jupiter', 'Venus', 'Moon', 'Mercury'];
      const maleficPlanets = ['Saturn', 'Mars', 'Rahu', 'Ketu', 'Sun'];
      const beneficAspects = aspectsOnHouse.filter(a => beneficPlanets.includes(a.planet));
      const maleficAspects = aspectsOnHouse.filter(a => maleficPlanets.includes(a.planet));

      if (beneficAspects.length > 0) {
          factors.push({ type: 'aspect', name: 'benefic', planets: beneficAspects.map(a => a.planet) });
      }
      if (maleficAspects.length > 0) {
          factors.push({ type: 'aspect', name: 'malefic', planets: maleficAspects.map(a => a.planet) });
      }
      
      const analysis = synthesizeFactors(factors, lang);
      
      let timingNarrative = '';
      const friendlyDashaLords = allMahadashaLords.filter(lord => PLANETARY_RELATIONSHIPS[houseLord]?.friends.includes(lord));
      const enemyDashaLords = allMahadashaLords.filter(lord => PLANETARY_RELATIONSHIPS[houseLord]?.enemies.includes(lord));

      if (allMahadashaLords.includes(houseLord)) {
        timingNarrative += lang === 'hi' ? `${translatedLord} की महादशा आपके जीवन में इस क्षेत्र के लिए एक महत्वपूर्ण और निर्णायक अवधि होगी। ` : `The major period of ${houseLord} itself will be a pivotal and defining time for this area in your life. `;
      }
      if (friendlyDashaLords.length > 0) {
        timingNarrative += lang === 'hi' ? `आपके जीवन के दौरान, ${friendlyDashaLords.map(l => getPlanetName(l, lang)).join(', ')} जैसे मित्र ग्रहों द्वारा शासित प्रमुख अवधियाँ इस क्षेत्र में प्राकृतिक विकास और अवसरों को लाएंगी। ` : `Throughout your life, major periods ruled by friendly planets like ${friendlyDashaLords.map(l => getPlanetName(l, lang)).join(', ')} will bring natural growth and opportunities to this area. `;
      }
      if (enemyDashaLords.length > 0) {
        timingNarrative += lang === 'hi' ? `इसके विपरीत, ${enemyDashaLords.map(l => getPlanetName(l, lang)).join(', ')} द्वारा शासित अवधियों में इस डोमेन में चुनौतियों का सामना करना पड़ सकता है, जिसके लिए अधिक प्रयास और लचीलेपन की आवश्यकता होगी।` : `Conversely, periods ruled by ${enemyDashaLords.map(l => getPlanetName(l, lang)).join(', ')} may present challenges in this domain, requiring greater effort and resilience.`;
      }
      
      let vargaNarrative = '';
      if (area.varga && chartData.divisionalPositions && chartData.divisionalPositions[area.varga]) {
          const vargaChart = chartData.divisionalPositions[area.varga];
          const vargaHouses = chartData[`${area.varga.toLowerCase()}_houses`];
          const vargaHouseCusps = vargaHouses?.map(h => toDegrees(h.start_dms));
          
          if(vargaHouseCusps) {
              const vargaLagnaLord = vargaHouses[0]?.start_rashi_lord;
              const d1LordInVargaHouse = getHouseOfPlanet(vargaChart[houseLord]?.longitude, vargaHouseCusps);
              const d1LordDignityInVarga = getPlanetDignityDescription(houseLord, vargaChart[houseLord], lang);

              let keyFactors = [];

              // 1. D1 House Lord in Varga
              keyFactors.push({
                  planet: houseLord,
                  role: lang === 'hi' ? `${houseNum}वें घर का स्वामी` : `Lord of the ${getOrdinal(houseNum)}`,
                  dignity: d1LordDignityInVarga,
                  house: d1LordInVargaHouse
              });

              // 2. Varga Ascendant Lord in Varga
              if (vargaLagnaLord) {
                  const vargaLagnaLordDignity = getPlanetDignityDescription(vargaLagnaLord, vargaChart[vargaLagnaLord], lang);
                  const vargaLagnaLordHouse = getHouseOfPlanet(vargaChart[vargaLagnaLord]?.longitude, vargaHouseCusps);
                  keyFactors.push({
                      planet: vargaLagnaLord,
                      role: lang === 'hi' ? `${area.varga} लग्न का स्वामी` : `${area.varga} Ascendant Lord`,
                      dignity: vargaLagnaLordDignity,
                      house: vargaLagnaLordHouse
                  });
              }

              // Build narrative
              if (lang === 'hi') {
                  vargaNarrative = `आपके ${area.varga} चार्ट में, जो आपके ${getLifeAreaName(area.name, lang)} का सूक्ष्म जगत है, प्रमुख ग्रहों की स्थिति इस प्रकार है:\n`;
                  keyFactors.forEach(factor => {
                      vargaNarrative += `*   **${factor.role} (${getPlanetName(factor.planet, lang)}):** यह ${factor.house}वें घर में ${factor.dignity} में स्थित है। `;
                      if (['उच्च का', 'स्वराशि में', 'मूलत्रिकोण में'].some(d => factor.dignity.includes(d))) {
                          vargaNarrative += `यह इस क्षेत्र में असाधारण शक्ति और सफलता का संकेत देता है।\n`;
                      } else if (['नीच का', 'शत्रु राशि में'].some(d => factor.dignity.includes(d))) {
                          vargaNarrative += `यह इस क्षेत्र में चुनौतियों और संघर्षों का संकेत देता है।\n`;
                      } else {
                          vargaNarrative += `यह इस क्षेत्र में मिश्रित या मध्यम परिणाम देगा।\n`;
                      }
                  });
              } else {
                  vargaNarrative = `In your ${area.varga} chart, the microcosm of your ${area.name.toLowerCase()}, the key planetary placements are as follows:\n`;
                  keyFactors.forEach(factor => {
                      vargaNarrative += `*   **${factor.role} (${factor.planet}):** It is placed in the ${getOrdinal(factor.house)} house in a state of ${factor.dignity}. `;
                      if (['exalted', 'Own Sign', 'Moolatrikona'].some(d => factor.dignity.includes(d))) {
                          vargaNarrative += `This indicates exceptional strength and success in this area.\n`;
                      } else if (['debilitated', 'enemy sign'].some(d => factor.dignity.includes(d))) {
                          vargaNarrative += `This points to challenges and struggles in this area.\n`;
                      } else {
                          vargaNarrative += `This suggests mixed or moderate results in this domain.\n`;
                      }
                  });
              }
          }
      }

      reports[area.name.toLowerCase().replace(/,/g, '').replace(/\\\s/g, '_').replace(/\//g, '_')] = { 
          intro: introNarrative,
          analysis: analysis,
          timing: timingNarrative,
          varga: vargaNarrative
      };
  });
  return reports;
}

/* ======================================================
   Human-readable Summary
====================================================== */
function generateSummary(overallReport, lifeAreaReports, eventTimeline, yogas, dashaLordAnalysis, lang = 'en') {
    const HEADERS = {
        en: {
            dashaAnalysis: '=== Dasha Analysis for Selected Date ===',
            lifeAreasSummary: '=== Life Areas Summary ===',
            eventTimeline: '=== Event Timeline (Transits) ===',
            birthChartYogas: '=== Key Yogas in Your Chart ===',
            noMajorYogas: 'No major Yogas active currently.'
        },
        hi: {
            dashaAnalysis: '=== चयनित तिथि के लिए दशा विश्लेषण ===',
            lifeAreasSummary: '=== जीवन क्षेत्र सारांश ===',
            eventTimeline: '=== घटना समयरेखा (गोचर) ===',
            birthChartYogas: '=== आपकी कुंडली में मुख्य योग ===',
            noMajorYogas: 'वर्तमान में कोई बड़ा योग सक्रिय नहीं है।'
        }
    };
    const currentHeaders = HEADERS[lang] || HEADERS['en'];

    let summary = overallReport + '\n\n';

    if (dashaLordAnalysis.length > 0) {
        summary += currentHeaders.dashaAnalysis + '\n';
        dashaLordAnalysis.forEach(analysis => {
            summary += `* ${analysis}\n`;
        });
        summary += '\n';
    }
    
    summary += currentHeaders.lifeAreasSummary + '\n';
    Object.entries(lifeAreaReports).forEach(([area, report]) => {
        summary += `\n**${area.replace(/_/g, ' ')}**\n`;
        summary += report.intro ? `${report.intro}\n` : '';
        if(report.analysis) {
            summary += `Supportive: ${report.analysis.supportive}\n`;
            summary += `Challenging: ${report.analysis.challenging}\n`;
            summary += `Summary: ${report.analysis.summary}\n`;
        }
        summary += report.timing ? `Timing: ${report.timing}\n` : '';
        summary += report.varga ? `Divisional: ${report.varga}\n` : '';
    });
    
    summary += currentHeaders.eventTimeline + '\n';
    eventTimeline.forEach(ev => {
        summary += `* ${ev.narration}\n`;
    });
    summary += '\n'; 
    
    summary += currentHeaders.birthChartYogas + '\n';
    if (yogas.length > 0) {
        const yogaSynthesis = lang === 'hi'
            ? 'आपकी कुंडली में कई महत्वपूर्ण योग हैं जो आपके जीवन के विभिन्न पहलुओं को प्रभावित करते हैं। यहाँ कुछ प्रमुख हैं:\n'
            : 'Your chart features several important yogas that influence various aspects of your life. Here are some of the key ones:\n';
        summary += yogaSynthesis;
        yogas.forEach(yoga => {
            summary += `* **${yoga.name}:** ${yoga.description}\n`;
        });
    } else {
        summary += currentHeaders.noMajorYogas;
    }
    return summary;
}

/* ======================================================
   Holistic Prediction Engine
====================================================== */
const PredictionEngine = {};

PredictionEngine.generateHolisticPrediction = async (chartData, lang = 'en') => {
  if (!chartData?.ascendant) return { error: 'Invalid chart data' };

  // Planetary Powers now derived from UPBS
  const planetaryPowers = {};
  PLANETS.forEach(p => {
    // Use the UPBS total score as the primary power metric. Default to 0 if not found.
    const upbsResult = calculateUPBS(p, chartData);
    planetaryPowers[p] = {
        total: upbsResult.total || 0,
        breakdown: upbsResult.breakdown || {}
    };
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

  const moonNakshatraName = chartData.planetaryPositions.sidereal.Moon.nakshatra || (lang === 'hi' ? 'अज्ञात' : 'Unknown');
  const overallReport = getCombinedPredictionLong(
    chartData.ascendant.rashi,
    chartData.planetaryPositions.sidereal.Moon.rashi,
    moonNakshatraName, // Pass the defensively handled name
    {
      lagnaLord: lagnaLord,
      lagnaLordNatalHouse: lagnaLordNatalHouse,
      
      atmakaraka: atmakaraka,
      planetaryPowers: planetaryPowers, // Pass the entire UPBS-based powers object
      planetaryPositions: chartData.planetaryPositions.sidereal,
      houses: chartData.houses
    },
    lang
  );

  const dashaLordAnalysis = analyzeDashaLordsInChart(chartData, planetaryPowers, currentDasha, currentBhukti, currentAntar, lang);

  const yogas = detectYogas(chartData, lang);

  const lifeAreaReports = generateLifeAreaReports(chartData, planetaryPowers, chartData.ashtakavarga, yogas, aspects, lang);

  const eventTimeline = await analyzeTransits(chartData, planetaryPowers, lang);

  const summary = generateSummary(overallReport, lifeAreaReports, eventTimeline, yogas, dashaLordAnalysis, lang);

  return { overallReport, dashaLordAnalysis, lifeAreaReports, eventTimeline, yogas, summary, lang, planetDetails: chartData.planetDetails };
};

export default PredictionEngine;
