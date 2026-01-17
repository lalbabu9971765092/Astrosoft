import { getHouseOfPlanet, calculatePlanetaryPositions, getRashiDetails, calculateAtmakaraka } from './planetaryUtils.js';
import { convertDMSToDegrees, getJulianDateUT, normalizeAngle } from './coreUtils.js';
import { getCombinedPredictionLong, getUPBSDescription, getOrdinal, getCareerFieldSuggestions } from './predictionTextGenerator.js';
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
  { name: 'Wealth', house: 2, varga: 'D2' },
  { name: 'Education', house: 5, varga: 'D9' }, // Using D9 for higher knowledge
  { name: 'Children', house: 5, varga: 'D7' }, // Using D7 for progeny and creativity
  { name: 'Siblings, Courage, Communication', house: 3, varga: 'D3' }, // Using D3 for siblings, courage, communication
  { name: 'Marriage', house: 7, varga: 'D9' },
  { name: 'Health', house: 6, varga: 'D12' },
  { name: 'Litigation', house: 6, varga: 'D6' }, // Using D6 for misfortunes and challenges
  { name: 'Spirituality', house: 9, varga: 'D9' },
  { name: 'Travel', house: 9, varga: 'D9' }
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
      if (dignity === 'Exalted') description = `यह ग्रह ${translatedRashi} में उच्च का है, जो इसे असाधारण शक्ति और शुभता प्रदान करता है।`;
      else if (dignity === 'Debilitated') description = `यह ग्रह ${translatedRashi} में नीच का है, जो इसकी शक्ति को कमजोर करता है और चुनौतियों को इंगित करता है।`;
      else if (dignity === 'Moolatrikona') description = `यह ग्रह अपनी मूलत्रिकोण राशि (${translatedRashi}) में है, जो इसे स्वाभाविक रूप से शक्तिशाली और अच्छी तरह से स्थित बनाता है।`;
      else if (dignity === 'Own Sign') description = `यह ग्रह अपनी स्वराशि (${translatedRashi}) में है, जो इसे मजबूत, स्थिर और स्वतंत्र परिणाम देने वाला बनाता है।`;
      else if (dignity === 'Friend') description = `यह ग्रह मित्र राशि (${translatedRashi}) में है, जो इसे सहजता और सकारात्मकता के साथ कार्य करने में मदद करता है।`;
      else if (dignity === 'Enemy') description = `यह ग्रह शत्रु राशि (${translatedRashi}) में है, जो इसके प्रभाव में घर्षण और संघर्ष पैदा कर सकता है।`;
      else if (dignity === 'Neutral') description = `यह ग्रह सम राशि (${translatedRashi}) में है, जो इसे तटस्थ परिणाम देता है, जो अन्य प्रभावों पर निर्भर करता है।`;
      else description = `${translatedRashi} में स्थित है।`; // Default fallback
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

function getDashaRelationshipInterpretation(planet, parent, relativeHouse, relationship, lang) {
    const P_REL = {
        en: {
            intro: `The relationship with the parent lord, **${getPlanetName(parent, lang)}**, is **${relationship}**. Placed in the **${getOrdinal(relativeHouse)} house** from it, this period's results will be shaped as follows:`,
            favorable: `**Highly Supportive:** This is a favorable placement (a trine or kendra). You can expect the themes of this sub-period to harmoniously support the broader goals of the main period, leading to smooth progress and fortunate outcomes.`,
            challenging: `**Challenging:** This is a difficult placement (a dusthana). This sub-period may bring obstacles, conflicts, or hidden issues that challenge the main period's agenda. It requires patience and careful navigation.`,
            neutral: `**Action-Oriented:** This placement calls for effort. The results of this sub-period will require conscious action to align with the main period's themes, but success is achievable through work.`,
        },
        hi: {
            intro: `जनक स्वामी, **${getPlanetName(parent, lang)}** के साथ संबंध **${relationship}** है। इससे **${relativeHouse}वें घर** में स्थित होने पर, इस अवधि के परिणाम इस प्रकार आकार लेंगे:`,
            favorable: `**अत्यधिक सहायक:** यह एक अनुकूल स्थान (एक त्रिकोण या केंद्र) है। आप उम्मीद कर सकते हैं कि इस उप-अवधि के विषय मुख्य अवधि के व्यापक लक्ष्यों का सामंजस्यपूर्ण रूप से समर्थन करेंगे, जिससे सुचारू प्रगति और भाग्यशाली परिणाम प्राप्त होंगे।`,
            challenging: `**चुनौतीपूर्ण:** यह एक कठिन स्थान (एक दुस्थान) है। यह उप-अवधि बाधाएं, संघर्ष या छिपे हुए मुद्दे ला सकती है जो मुख्य अवधि के एजेंडे को चुनौती देते हैं। इसके लिए धैर्य और सावधानीपूर्वक नेविगेशन की आवश्यकता है।`,
            neutral: `**कार्रवाई-उन्मुख:** यह स्थान प्रयास की मांग करता है। इस उप-अवधि के परिणामों को मुख्य अवधि के विषयों के साथ संरेखित करने के लिए सचेत कार्रवाई की आवश्यकता होगी, लेकिन काम के माध्यम से सफलता प्राप्त की जा सकती है।`,
        }
    };
    const phrases = P_REL[lang] || P_REL['en'];
    let interpretation = phrases.intro + '\n';
    if ([1, 4, 5, 7, 9, 10].includes(relativeHouse)) {
        interpretation += phrases.favorable;
    } else if ([6, 8, 12].includes(relativeHouse)) {
        interpretation += phrases.challenging;
    } else {
        interpretation += phrases.neutral;
    }
    return interpretation;
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
      const involvedYogas = yogas.filter(y => y.planetsInvolved.includes(planet));

      let narrative = `\n### **${level.name} Lord: ${translatedPlanet}**\n\n`;
      
      // Section 1: Lordship & Placement
      narrative += `**${lang === 'hi' ? 'स्वामित्व और स्थान' : 'Lordship & Placement'}:**\n`;
      let placementText = lang === 'hi' 
          ? `*   **${translatedPlanet}** आपके **${natalHouse}वें घर** में स्थित है और ${dignityDesc}। `
          : `*   **${translatedPlanet}** is located in your **${getOrdinal(natalHouse)} house** and is ${dignityDesc}. `;
      if (ruledHouses.length > 0) {
          placementText += lang === 'hi'
              ? `यह **${ruledHouses.map(h => `${h}वें`).join(' और ')} घर** का स्वामी है, इसलिए इसकी अवधि इन क्षेत्रों को प्रभावित करेगी।\n`
              : `It rules the **${ruledHouses.map(getOrdinal).join(' and ')} house(s)**, so its period will activate these areas.\n`;
      }
      narrative += placementText;

      // Section 2: Strength & Influence
      narrative += `**${lang === 'hi' ? 'शक्ति और प्रभाव' : 'Strength & Influence'}:**\n`;
      narrative += `*   ${lang === 'hi' ? 'इसकी समग्र शक्ति' : 'Its overall strength'} ${strengthDescription}\n`;

      // Section 3: Yogas
      if (involvedYogas.length > 0) {
          narrative += `**${lang === 'hi' ? 'प्रमुख योग' : 'Key Yogas'}:**\n`;
          narrative += `*   ${lang === 'hi' ? 'यह ग्रह' : 'This planet'} **${involvedYogas.map(y => y.name).join(', ')}** ${lang === 'hi' ? 'जैसे योगों में शामिल है, जो इस अवधि के दौरान इन योगों के परिणामों को सक्रिय करेगा।' : 'which will activate the results of these yogas during this period.'}\n`;
      }

      // Section 4: Relationship to Higher Dasha Lord
      if (level.parentLord) {
          narrative += `**${lang === 'hi' ? `**${getPlanetName(level.parentLord, lang)}** से संबंध` : `Relationship to ${getPlanetName(level.parentLord, lang)}`}:**\n`;

          const parent = level.parentLord;
          const parentPosition = planetaryPositions[parent];
          const parentNatalHouse = getHouseOfPlanet(parentPosition.longitude, cuspDegrees);
          
          const relativeHouse = ((natalHouse - parentNatalHouse + 12) % 12) + 1;
          const relationshipKey = Object.keys(PLANETARY_RELATIONSHIPS[parent] || {}).find(key => PLANETARY_RELATIONSHIPS[parent][key].includes(planet));
          const relationship = lang === 'hi'
              ? { friends: 'मित्रतापूर्ण', enemies: 'शत्रुतापूर्ण', neutral: 'तटस्थ' }[relationshipKey] || 'अपरिभाषित'
              : relationshipKey || 'undefined';

          narrative += getDashaRelationshipInterpretation(planet, parent, relativeHouse, relationship, lang) + '\n';
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
  Children: 'संतान',
  'Siblings, Courage, Communication': 'भाई-बहन, साहस, संचार',
  Marriage: 'विवाह',
  Health: 'स्वास्थ्य',
  Litigation: 'मुकदमेबाजी',
  Spirituality: 'अध्यात्म',
  Travel: 'यात्रा',
};

const getLifeAreaName = (areaName, lang) => {
  if (lang === 'hi') {
    return LIFE_AREA_NAMES_HI[areaName] || areaName;
  }
  return areaName;
};

function synthesizeFactors(factors, areaName, lang = 'en') {
    const supportive = [];
    const challenging = [];
    let summary = '';
    let score = 0;

    const get = (type, name = null) => factors.find(f => f.type === type && (!name || f.name === name));
    const getAll = (type) => factors.filter(f => f.type === type);

    const lordStrength = get('lordStrength');
    const yogas = getAll('yoga');
    const beneficAspects = getAll('aspect').filter(a => a.name === 'benefic');
    const maleficAspects = getAll('aspect').filter(a => a.name === 'malefic');
    const sarva = get('sarva');

    // Score calculation
    if (lordStrength) {
        if (lordStrength.score >= 5) score += 2; // isLordSupported
        else if (lordStrength.score < -5) score -= 2; // isLordAfflicted
    }
    if (sarva && sarva.name === 'high') score += 1;
    if (yogas.length > 0) score += 2;
    if (beneficAspects.length > 0) score += 1;
    score -= maleficAspects.length;

    const lordDignityText = () => {
        if (lordStrength.score >= 5) return lang === 'hi' ? 'इस क्षेत्र का स्वामी मजबूत है, जो सफलता के लिए एक ठोस आधार प्रदान करता है।' : 'The lord of this area is strong, providing a solid foundation for success.';
        if (lordStrength.score < -5) return lang === 'hi' ? 'इस क्षेत्र का स्वामी पीड़ित है, जो कुछ अंतर्निहित कमजोरियों का संकेत देता है।' : 'The lord of this area is afflicted, indicating some inherent weaknesses.';
        return lang === 'hi' ? 'इस क्षेत्र का स्वामी तटस्थ है, जो एक संतुलित लेकिन लचीला आधार प्रदान करता है।' : 'The lord of this area is neutral, providing a balanced but flexible foundation.';
    };

    summary += lordDignityText();

    if (sarva) {
        const text = sarva.name === 'high'
            ? (lang === 'hi' ? `एक अनुकूल सर्वाष्टकवर्ग स्कोर (${sarva.score}) है, जो इस क्षेत्र में सफलता और विस्तार के लिए एक मजबूत क्षमता का संकेत देता है` : `a favorable Sarva Ashtakavarga score of ${sarva.score}, indicating a strong capacity for success and expansion`)
            : (lang === 'hi' ? `एक कम सर्वाष्टकवर्ग स्कोर (${sarva.score}) है, जो बताता है कि वांछित परिणाम प्राप्त करने के लिए अधिक प्रयास की आवश्यकता हो सकती है` : `a low Sarva Ashtakavarga score of ${sarva.score}, suggesting that more effort may be required to achieve desired results`);
        (sarva.name === 'high' ? supportive : challenging).push(text);
    }

    if (yogas.length > 0) {
        const yogaNames = yogas.map(y => y.names).flat().join(', ');
        supportive.push(lang === 'hi' ? `शक्तिशाली योगों की उपस्थिति (जैसे '${yogaNames}') क्षमता को और बढ़ाती है` : `the presence of powerful yogas like '${yogaNames}' further enhances the potential`);
    }

    if (beneficAspects.length > 0) {
        const aspectingPlanets = beneficAspects.map(a => a.planets).flat().map(p => getPlanetName(p, lang)).join(', ');
        supportive.push(lang === 'hi' ? `${aspectingPlanets} से सहायक पहलू विकास और अवसरों का संकेत देते हैं` : `supportive aspects from ${aspectingPlanets} indicate growth and opportunities`);
    }
    
    if (maleficAspects.length > 0) {
        const aspectingPlanets = maleficAspects.map(a => a.planets).flat().map(p => getPlanetName(p, lang)).join(', ');
        challenging.push(lang === 'hi' ? `${aspectingPlanets} से चुनौतीपूर्ण पहलू बाधाएं या संघर्ष ला सकते हैं` : `challenging aspects from ${aspectingPlanets} may bring obstacles or conflicts`);
    }

    // Generate summary based on score
    if (score > 3) {
        summary += lang === 'hi' ? ' कई मजबूत सहायक कारकों के साथ, इस क्षेत्र में दृष्टिकोण असाधारण रूप से मजबूत है और यह बड़ी सफलता और पूर्ति का वादा करता है।' : ' With several strong supportive factors, the outlook for this area is exceptionally strong and promises great success and fulfillment.';
    } else if (score >= 1) {
        summary += lang === 'hi' ? ' एक मजबूत नींव और सहायक प्रभावों के साथ, इस क्षेत्र में दृष्टिकोण अनुकूल है। हालांकि कुछ चुनौतियों पर ध्यान देने की आवश्यकता होगी, लेकिन आप उन्हें दूर करने और सफलता प्राप्त करने के लिए अच्छी तरह से सुसज्जित हैं।' : ' With a solid foundation and supportive influences, the outlook for this area is favorable. While some challenges will need attention, you are well-equipped to overcome them and achieve success.';
    } else if (score >= -1) {
        summary += lang === 'hi' ? ' यह क्षेत्र अवसरों और चुनौतियों का मिश्रित बैग प्रस्तुत करता है। सफलता आपके सचेत प्रयास पर निर्भर करेगी कि आप बाधाओं का प्रबंधन करते हुए सकारात्मक अवसरों का लाभ उठाएं।' : ' This area presents a mixed bag of opportunities and challenges. Success will hinge on your conscious effort to leverage the positive openings while managing the obstacles.';
    } else {
        summary += lang === 'hi' ? ' यह आपके लिए एक चुनौतीपूर्ण क्षेत्र है जिसके लिए महत्वपूर्ण लचीलापन और कड़ी मेहनत की आवश्यकता होगी। सकारात्मक परिणाम देखने के लिए आपको बाधाओं को दूर करने पर ध्यान केंद्रित करने की आवश्यकता होगी।' : ' This is a challenging area for you that will require significant resilience and hard work. You will need to focus on overcoming obstacles to see positive results.';
    }

    return {
        supportive: supportive.length > 0 ? supportive.join('. ') + '.' : (lang === 'hi' ? 'कोई विशेष सहायक प्रभाव नहीं मिला।' : 'No specific supportive influences found.'),
        challenging: challenging.length > 0 ? challenging.join('. ') + '.' : (lang === 'hi' ? 'कोई विशेष चुनौतीपूर्ण प्रभाव नहीं मिला।' : 'No specific challenging influences found.'),
        summary: summary
    };
}



function analyzeVargaChart(keyFactors, lang) {
    if (!keyFactors || keyFactors.length === 0) return '';

    const getDignityStrength = (factor) => {
        if (!factor || !factor.dignity) return 'neutral';
        const d = factor.dignity.toLowerCase();
        if (d.includes('exalted') || d.includes('own sign') || d.includes('moolatrikona') || d.includes('उच्च') || d.includes('स्वराशि') || d.includes('मूलत्रिकोण')) {
            return 'strong';
        }
        if (d.includes('friend') || d.includes('मित्र')) {
            return 'favorable';
        }
        if (d.includes('debilitated') || d.includes('enemy') || d.includes('नीच') || d.includes('शत्रु')) {
            return 'weak';
        }
        return 'neutral';
    };

    const d1Lord = keyFactors.find(f => f.role.includes('D1'));
    const vargaLord = keyFactors.find(f => f.role.includes('Ascendant Lord'));

    let summary = '';

    const d1LordStrength = getDignityStrength(d1Lord);
    const vargaLordStrength = getDignityStrength(vargaLord);

    // Determine overall strength based on combined dignities
    let overallStrength = 'neutral'; // Default to neutral

    if (d1LordStrength === 'strong' || vargaLordStrength === 'strong') {
        if (d1LordStrength === 'strong' && vargaLordStrength === 'strong') {
            overallStrength = 'exceptionally_strong';
        } else if (d1LordStrength === 'strong' && vargaLordStrength === 'weak') {
            overallStrength = 'strong_but_challenged_varga';
        } else if (d1LordStrength === 'strong' && (vargaLordStrength === 'favorable' || vargaLordStrength === 'neutral')) {
            overallStrength = 'strong_d1_positive_varga';
        } else if (vargaLordStrength === 'strong' && d1LordStrength === 'weak') {
            overallStrength = 'weak_d1_strong_varga'; // Late bloomer
        } else if (vargaLordStrength === 'strong' && (d1LordStrength === 'favorable' || d1LordStrength === 'neutral')) {
            overallStrength = 'positive_d1_strong_varga';
        }
    } else if (d1LordStrength === 'favorable' || vargaLordStrength === 'favorable') {
        if (d1LordStrength === 'favorable' && vargaLordStrength === 'favorable') {
            overallStrength = 'favorable';
        } else if (d1LordStrength === 'favorable' && vargaLordStrength === 'weak') {
            overallStrength = 'favorable_but_challenged_varga';
        } else if (vargaLordStrength === 'favorable' && d1LordStrength === 'weak') {
            overallStrength = 'weak_d1_favorable_varga';
        }
    } else if (d1LordStrength === 'weak' && vargaLordStrength === 'weak') {
        overallStrength = 'exceptionally_weak';
    } else if (d1LordStrength === 'weak' || vargaLordStrength === 'weak') {
        overallStrength = 'challenged';
    }

    // Generate summary based on overallStrength
    switch (overallStrength) {
        case 'exceptionally_strong':
            summary = lang === 'hi' ? 'मुख्य भाव का स्वामी और वर्गा लग्न स्वामी दोनों उत्कृष्ट रूप से मजबूत हैं, जो इस क्षेत्र में जबरदस्त सफलता और भाग्य का वादा करते हैं।' : 'Both the main house lord and the varga lagna lord are exceptionally strong, promising tremendous success and fortune in this area.';
            break;
        case 'strong_d1_positive_varga':
            summary = lang === 'hi' ? 'मुख्य भाव का स्वामी मजबूत है और वर्गा लग्न स्वामी भी अनुकूल है, जो इस क्षेत्र में निरंतर विकास और शुभ परिणामों का संकेत देता है।' : 'The main house lord is strong and the varga lagna lord is also favorable, indicating sustained growth and auspicious outcomes in this area.';
            break;
        case 'strong_but_challenged_varga':
            summary = lang === 'hi' ? 'मुख्य भाव का स्वामी मजबूत है, लेकिन वर्गा लग्न स्वामी कमजोर है। यह बताता है कि आंतरिक क्षमता मजबूत होते हुए भी, इस क्षेत्र की क्षमता को पूरी तरह से महसूस करने के लिए महत्वपूर्ण बाधाओं को दूर करना होगा।' : 'The main house lord is strong, but the varga lagna lord is weak. This suggests that while the inherent potential is strong, significant obstacles must be overcome to fully realize this area\'s potential.';
            break;
        case 'weak_d1_strong_varga': // Late bloomer
            summary = lang === 'hi' ? 'मुख्य भाव का स्वामी कमजोर है, लेकिन वर्गा लग्न स्वामी मजबूत है। यह एक क्लासिक "देर से खिलने वाले" परिदृश्य को इंगित करता है, जहां प्रारंभिक संघर्षों को दृढ़ता के माध्यम से दूर किया जा सकता है, जिससे अंततः सफलता मिलती है।' : 'The main house lord is weak, but the varga lagna lord is strong. This indicates a classic "late bloomer" scenario, where initial struggles can be overcome through persistence, leading to eventual success.';
            break;
        case 'positive_d1_strong_varga':
            summary = lang === 'hi' ? 'मुख्य भाव का स्वामी अनुकूल है और वर्गा लग्न स्वामी भी मजबूत है, जो इस क्षेत्र में प्रयासों के लिए शक्तिशाली समर्थन और फलदायी परिणाम का संकेत देता है।' : 'The main house lord is favorable and the varga lagna lord is also strong, suggesting powerful support and fruitful outcomes for efforts in this area.';
            break;
        case 'favorable':
            summary = lang === 'hi' ? 'मुख्य भाव का स्वामी और वर्गा लग्न स्वामी दोनों अनुकूल हैं, जो इस क्षेत्र में सहज प्रगति और सकारात्मक परिणामों का सुझाव देते हैं।' : 'Both the main house lord and the varga lagna lord are favorable, suggesting smooth progress and positive outcomes in this area.';
            break;
        case 'favorable_but_challenged_varga':
            summary = lang === 'hi' ? 'मुख्य भाव का स्वामी अनुकूल है, लेकिन वर्गा लग्न स्वामी कमजोर है। यह बताता है कि इस क्षेत्र में कुछ चुनौतियां होंगी जिन्हें पार करने के लिए धैर्य और सचेत प्रयास की आवश्यकता होगी।' : 'The main house lord is favorable, but the varga lagna lord is weak. This suggests some challenges in this area that will require patience and conscious effort to overcome.';
            break;
        case 'weak_d1_favorable_varga':
            summary = lang === 'hi' ? 'मुख्य भाव का स्वामी कमजोर है, लेकिन वर्गा लग्न स्वामी अनुकूल है। यह दर्शाता है कि धैर्य और सचेत प्रयास के साथ प्रारंभिक चुनौतियों को दूर किया जा सकता है, जिससे धीरे-धीरे अनुकूल परिणाम प्राप्त होंगे।' : 'The main house lord is weak, but the varga lagna lord is favorable. This suggests that initial challenges can be overcome with patience and conscious effort, leading to gradually favorable outcomes.';
            break;
        case 'exceptionally_weak':
            summary = lang === 'hi' ? 'मुख्य भाव का स्वामी और वर्गा लग्न स्वामी दोनों कमजोर हैं, जो इस क्षेत्र में महत्वपूर्ण और लगातार चुनौतियों का संकेत देते हैं। सफलता के लिए पर्याप्त लचीलापन और कड़ी मेहनत की आवश्यकता होगी।' : 'Both the main house lord and the varga lagna lord are weak, indicating significant and persistent challenges in this domain. Considerable resilience and hard work will be required for success.';
            break;
        case 'challenged':
            summary = lang === 'hi' ? 'यह क्षेत्र चुनौतियों से भरा है, क्योंकि कम से कम एक प्रमुख ग्रह कमजोर स्थिति में है। प्रगति के लिए लगातार प्रयास और रणनीतिक योजना आवश्यक होगी।' : 'This area is challenged, with at least one key planet in a weak position. Consistent effort and strategic planning will be essential for progress.';
            break;
        case 'neutral':
        default:
            summary = lang === 'hi' ? 'ग्रहों की स्थिति एक मिश्रित तस्वीर प्रस्तुत करती है, जो बताती है कि सफलता प्रयास और अन्य सहायक कारकों पर निर्भर करेगी।' : 'The planetary placements present a mixed picture, suggesting that success will depend on effort and other supporting factors.';
            break;
    }
    
    // Add details
    if (d1Lord) {
        summary += lang === 'hi' ? ' विस्तार से:' : ' In detail:';
        summary += `\n* ${d1Lord.role} (${getPlanetName(d1Lord.planet, lang)}) ${d1Lord.dignity} ${lang === 'hi' ? `${d1Lord.house}वें घर में` : `in the ${getOrdinal(d1Lord.house)} house`}.`;
    }
    if (vargaLord) {
        summary += `\n* ${vargaLord.role} (${getPlanetName(vargaLord.planet, lang)}) ${vargaLord.dignity} ${lang === 'hi' ? `${vargaLord.house}वें घर में` : `in the ${getOrdinal(vargaLord.house)} house`}.`;
    }

    return summary;
}

/* ======================================================
   Life Area Reports
====================================================== */
function generateLifeAreaReports(chartData, planetaryPowers, ashtakavarga, yogas, aspects, lang = 'en') {
  const reports = {};
  const cuspDegrees = chartData.houses.map(h => toDegrees(h.start_dms));

  const HOUSE_THEMES = {
      1: { en: "Self, Identity, and Personality", hi: "स्व, पहचान, और व्यक्तित्व" },
      2: { en: "Wealth, Family, and Speech", hi: "धन, परिवार, और वाणी" },
      3: { en: "Siblings, Courage, and Communication", hi: "भाई-बहन, साहस, और संचार" },
      4: { en: "Mother, Home, and Inner Peace", hi: "माता, घर, और आंतरिक शांति" },
      5: { en: "Children, Creativity, and Intellect", hi: "संतान, रचनात्मकता, और बुद्धि" },
      6: { en: "Health, Debts, and Daily Work", hi: "स्वास्थ्य, ऋण, और दैनिक कार्य" },
      7: { en: "Partnerships, Marriage, and Contracts", hi: "साझेदारी, विवाह, और अनुबंध" },
      8: { en: "Longevity, Transformation, and Secrets", hi: "दीर्घायु, परिवर्तन, और रहस्य" },
      9: { en: "Father, Fortune, and Higher Learning", hi: "पिता, भाग्य, और उच्च शिक्षा" },
      10: { en: "Career, Reputation, and Public Life", hi: "करियर, प्रतिष्ठा, और सार्वजनिक जीवन" },
      11: { en: "Gains, Friendships, and Aspirations", hi: "लाभ, मित्रता, और आकांक्षाएं" },
      12: { en: "Expenses, Spirituality, and Liberation", hi: "व्यय, आध्यात्मिकता, और मोक्ष" }
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
          reports[area.name.toLowerCase().replace(/,/g, '').replace(/ /g, '_')] = { narrative: "Analysis unavailable." };
          return;
      }

      const lordPosition = chartData.planetaryPositions.sidereal[houseLord];
      const lordPlacementHouse = lordPosition ? getHouseOfPlanet(lordPosition.longitude, cuspDegrees) : null;
      const theme = HOUSE_THEMES[lordPlacementHouse]?.[lang] || (lang === 'hi' ? 'अज्ञात मामलों' : 'unknown matters');
      
      const lordScore = planetaryPowers[houseLord]?.total || 0;
      const strengthDesc = getUPBSDescription(lordScore, lang);
      const translatedLord = getPlanetName(houseLord, lang);
      const translatedAreaName = getLifeAreaName(area.name, lang); // Use translated area name here

      let introNarrative = lang === 'hi'
          ? `${translatedAreaName} का क्षेत्र, जो ${houseNum}वें घर द्वारा शासित है, आपके जीवन भर के लिए एक महत्वपूर्ण विषय है। इसकी नींव इसके स्वामी, ${translatedLord}, द्वारा रखी गई है, जो ${strengthDesc}। यह ${lordPlacementHouse}वें घर में स्थित है, जो आपके ${translatedAreaName} को ${theme} के मामलों से जोड़ता है।`
          : `The domain of your ${area.name}, governed by your ${getOrdinal(houseNum)} house, is a significant theme throughout your life. Its foundation is laid by its lord, ${houseLord}, which ${strengthDesc}. It is placed in the ${getOrdinal(lordPlacementHouse)} house, linking your ${area.name.toLowerCase()} to matters of ${theme}.`;

      const planetsInHouse = Object.entries(chartData.planetaryPositions.sidereal).filter(([p, d]) => d?.longitude && PLANETS.includes(p) && getHouseOfPlanet(d.longitude, cuspDegrees) === houseNum).map(([p]) => getPlanetName(p, lang));
      if (planetsInHouse.length > 0) {
          introNarrative += lang === 'hi' ? ` इस घर में ${planetsInHouse.join(', ')} स्थित हैं, जो अपनी ऊर्जा सीधे इस क्षेत्र में लाते हैं।` : ` The planets ${planetsInHouse.join(', ')} are situated here, lending their direct energies to this area.`;
      }
      
      if (area.house === 10) { // Career area
        introNarrative += getCareerFieldSuggestions(houseLord, lordPlacementHouse, lang);
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
      
      const analysis = synthesizeFactors(factors, area.name, lang);
      
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
      
      let finalVargaNarrative = '';
      let qualityNarrative = '';

      const baseVargaAnalysisText = lang === 'hi' 
        ? `\nआपके ${area.varga} चार्ट में, आपके ${translatedAreaName} का सूक्ष्म जगत, `
        : `\nIn your ${area.varga} chart, the microcosm of your ${area.name.toLowerCase()}, `;

      if (area.house === 10) { // Career and Profession
        const lordDignityDesc = getPlanetDignityDescription(houseLord, lordPosition, lang);
        qualityNarrative += lang === 'hi' 
            ? `\nआपके करियर की गुणवत्ता और क्षमता आपके 10वें घर के स्वामी, ${translatedLord}, की स्थिति से बहुत प्रभावित होती है। ${lordDignityDesc}` 
            : `\nThe quality and potential of your career are strongly influenced by the condition of your 10th house lord, ${translatedLord}. ${lordDignityDesc}`;
      }
      
      if (area.varga && chartData.divisionalPositions && chartData.divisionalPositions[area.varga]) {
          const vargaChart = chartData.divisionalPositions[area.varga];
          const vargaHouses = chartData[`${area.varga.toLowerCase()}_houses`];
          const vargaHouseCusps = vargaHouses?.map(h => toDegrees(h.start_dms));
          
          if(vargaHouseCusps) {
              const vargaLagnaLord = vargaHouses[0]?.start_rashi_lord;
              const d1LordPositionInVarga = vargaChart[houseLord];
              const d1LordInVargaHouse = d1LordPositionInVarga ? getHouseOfPlanet(d1LordPositionInVarga.longitude, vargaHouseCusps) : null;
              const d1LordDignityInVarga = getPlanetDignityDescription(houseLord, d1LordPositionInVarga, lang);

              let keyFactors = [];
              if (d1LordInVargaHouse) {
                keyFactors.push({
                    planet: houseLord,
                    role: lang === 'hi' ? `D1 के ${getOrdinal(houseNum)}वें का स्वामी` : `Lord of the ${getOrdinal(houseNum)} of D1`,
                    dignity: d1LordDignityInVarga,
                    house: d1LordInVargaHouse
                });
              }

              if (vargaLagnaLord) {
                  const vargaLagnaLordPosition = vargaChart[vargaLagnaLord];
                  const vargaLagnaLordDignity = getPlanetDignityDescription(vargaLagnaLord, vargaLagnaLordPosition, lang);
                  const vargaLagnaLordHouse = vargaLagnaLordPosition ? getHouseOfPlanet(vargaLagnaLordPosition.longitude, vargaHouseCusps) : null;
                  if (vargaLagnaLordHouse) {
                    keyFactors.push({
                        planet: vargaLagnaLord,
                        role: lang === 'hi' ? `${area.varga} लग्न स्वामी` : `${area.varga} Ascendant Lord`,
                        dignity: vargaLagnaLordDignity,
                        house: vargaLagnaLordHouse
                    });
                  }
              }
              
              if (keyFactors.length > 0) {
                finalVargaNarrative = baseVargaAnalysisText + analyzeVargaChart(keyFactors, lang);
              }
          }
      }
      
      // Integrate quality and varga narrative
      if (area.house === 10) { // Career and Profession
          qualityNarrative += finalVargaNarrative; // Append varga narrative to quality for career
          finalVargaNarrative = ''; // Clear varga narrative to avoid duplication
      }

      let challengesNarrative = '';
      if (analysis.challenging && analysis.challenging !== (lang === 'hi' ? 'कोई विशेष चुनौतीपूर्ण प्रभाव नहीं मिला।' : 'No specific challenging influences found.')) {
          challengesNarrative += analysis.challenging;
      }
      if (area.house === 10) {
        const DUSTHANA = [6, 8, 12];
        if (DUSTHANA.includes(lordPlacementHouse)) {
            let dusthanaText = '';
            if (lordPlacementHouse === 6) {
                dusthanaText = lang === 'hi' ? 'आपके करियर का स्वामी 6वें घर में है, जो सेवा, संघर्ष और दिन-प्रतिदिन के काम से जुड़ा है। यह एक सेवा-उन्मुख करियर, या ऐसा करियर सुझा सकता है जहाँ आपको बाधाओं और प्रतिस्पर्धा पर काबू पाना होगा।' : 'The lord of your career is in the 6th house, associated with service, conflicts, and daily work. This can suggest a service-oriented career, or one where you have to overcome obstacles and competition.';
            } else if (lordPlacementHouse === 8) {
                dusthanaText = lang === 'hi' ? 'आपके करियर का स्वामी 8वें घर में है, जो परिवर्तन, रहस्य और अचानक होने वाली घटनाओं से जुड़ा है। यह करियर में अचानक बदलाव, या अनुसंधान, जांच या बीमा जैसे क्षेत्रों में काम का संकेत दे सकता है।' : 'The lord of your career is in the 8th house, associated with transformation, secrets, and sudden events. This can indicate sudden changes in career, or work in fields like research, investigation, or insurance.';
            } else if (lordPlacementHouse === 12) {
                dusthanaText = lang === 'hi' ? 'आपके करियर का स्वामी 12वें घर में है, जो विदेशी भूमि, अलगाव और आध्यात्मिकता से जुड़ा है। यह विदेश में करियर, या अस्पतालों, आश्रमों या पर्दे के पीछे की भूमिकाओं में काम का संकेत दे सकता है।' : 'The lord of your career is in the 12th house, associated with foreign lands, isolation, and spirituality. This can indicate a career abroad, or work in hospitals, ashrams, or behind-the-scenes roles.';
            }
            challengesNarrative += ' ' + dusthanaText;
        }
      }
      analysis.challenging = challengesNarrative;

      reports[area.name.toLowerCase().replace(/,/g, '').replace(/ /g, '_')] = { 
          intro: introNarrative,
          analysis: analysis,
          timing: timingNarrative,
          varga: finalVargaNarrative, // Use the new finalVargaNarrative
          quality: qualityNarrative,
      };
  });
  return reports;
}

/* ======================================================
   Human-readable Summary
====================================================== */
function generateSummary(overallReport, lifeAreaReports, eventTimeline, yogas, dashaLordAnalysis, lang = 'en') {
    const LABELS = {
        en: {
            dashaAnalysis: '=== Dasha Analysis for Selected Date ===',
            lifeAreasSummary: '=== Life Areas Summary ===',
            eventTimeline: '=== Event Timeline (Transits) ===',
            birthChartYogas: '=== Key Yogas in Your Chart ===',
            noMajorYogas: 'No major Yogas active currently.',
            supportive: 'Supportive Influences',
            challenging: 'Challenging Influences',
            summary: 'Summary',
            timing: 'Timing of Events',
            divisional: 'Divisional Chart'
        },
        hi: {
            dashaAnalysis: '=== चयनित तिथि के लिए दशा विश्लेषण ===',
            lifeAreasSummary: '=== जीवन क्षेत्र सारांश ===',
            eventTimeline: '=== घटना समयरेखा (गोचर) ===',
            birthChartYogas: '=== आपकी कुंडली में मुख्य योग ===',
            noMajorYogas: 'वर्तमान में कोई बड़ा योग सक्रिय नहीं है।',
            supportive: 'सकारात्मक प्रभाव',
            challenging: 'चुनौतीपूर्ण प्रभाव',
            summary: 'सारांश',
            timing: 'घटनाओं का समय',
            divisional: 'विभागीय चार्ट'
        }
    };
    const currentLabels = LABELS[lang] || LABELS['en'];

    let summary = overallReport + '\n\n';

    if (dashaLordAnalysis.length > 0) {
        summary += currentLabels.dashaAnalysis + '\n';
        dashaLordAnalysis.forEach(analysis => {
            summary += `* ${analysis}\n`;
        });
        summary += '\n';
    }
    
    summary += currentLabels.lifeAreasSummary + '\n';
    Object.entries(lifeAreaReports).forEach(([area, report]) => {
        const title = area.replace(/_/g, ' ').split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
        summary += `\n**${title}**\n`;
        summary += report.intro ? `${report.intro}\n` : '';
        if(report.analysis) {
            summary += `\n**${currentLabels.supportive}:** ${report.analysis.supportive}\n`;
            summary += `\n**${currentLabels.challenging}:** ${report.analysis.challenging}\n`;
            summary += `\n**${currentLabels.summary}:** ${report.analysis.summary}\n`;
        }
        summary += report.quality ? `${report.quality}\n` : '';
        summary += report.timing ? `\n**${currentLabels.timing}:** ${report.timing}\n` : '';
        summary += report.varga ? `\n**${currentLabels.divisional}:** ${report.varga}\n` : '';
    });
    
    summary += '\n' + currentLabels.eventTimeline + '\n';
    eventTimeline.forEach(ev => {
        summary += `* ${ev.narration}\n`;
        });
    summary += '\n'; 
    
    summary += '\n' + currentLabels.birthChartYogas + '\n';
    if (yogas.length > 0) {
        const yogaSynthesis = lang === 'hi'
            ? 'आपकी कुंडली में कई महत्वपूर्ण योग हैं जो आपके जीवन के विभिन्न पहलुओं को प्रभावित करते हैं। यहाँ कुछ प्रमुख हैं:\n'
            : 'Your chart features several important yogas that influence various aspects of your life. Here are some of the key ones:\n';
        summary += yogaSynthesis;
        yogas.forEach(yoga => {
            summary += `* **${yoga.name}:** ${yoga.description}\n`;
        });
    } else {
        summary += currentLabels.noMajorYogas;
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
