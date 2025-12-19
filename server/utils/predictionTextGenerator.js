// server/utils/predictionTextGenerator.js
import logger from './logger.js';
logger.info("--- LOADING UPDATED predictionTextGenerator.js ---");
import { getHouseOfPlanet } from './planetaryUtils.js';
import { convertDMSToDegrees } from './coreUtils.js';

const houseThemes_en = {
    1: 'self, identity, health', 2: 'finance, possessions, speech', 3: 'siblings, communication, short trips',
    4: 'home, family, roots', 5: 'creativity, children, education', 6: 'work, health, service',
    7: 'partnerships, marriage, contracts', 8: 'shared resources, transformation, losses', 9: 'higher learning, travel, faith',
    10: 'career, reputation, public life', 11: 'gains, friends, networks', 12: 'secrets, expenses, spirituality'
};

const houseThemes_hi = {
    1: 'स्वयं, पहचान, स्वास्थ्य', 2: 'वित्त, संपत्ति, वाणी', 3: 'भाई-बहन, संचार, छोटी यात्राएं',
    4: 'घर, परिवार, जड़ें', 5: 'रचनात्मकता, बच्चे, शिक्षा', 6: 'काम, स्वास्थ्य, सेवा',
    7: 'साझेदारी, विवाह, अनुबंध', 8: 'साझा संसाधन, परिवर्तन, हानि', 9: 'उच्च शिक्षा, यात्रा, विश्वास',
    10: 'करियर, प्रतिष्ठा, सार्वजनिक जीवन', 11: 'लाभ, दोस्त, नेटवर्क', 12: 'रहस्य, खर्च, आध्यात्मिकता'
};

const planetNames_hi = {
    Sun: 'सूर्य',
    Moon: 'चंद्रमा',
    Mars: 'मंगल',
    Mercury: 'बुध',
    Jupiter: 'बृहस्पति',
    Venus: 'शुक्र',
    Saturn: 'शनि',
    Rahu: 'राहु',
    Ketu: 'केतु'
};

const rashiNames_hi = {
    Aries: "मेष", 
    Taurus: "वृषभ", 
    Gemini: "मिथुन", 
    Cancer: "कर्क", 
    Leo: "सिंह", 
    Virgo: "कन्या",
    Libra: "तुला", 
    Scorpio: "वृश्चिक", 
    Sagittarius: "धनु", 
    Capricorn: "मकर", 
    Aquarius: "कुंभ", 
    Pisces: "मीन"
};

const planetInHouse_en = {
    Sun: [
        "Sun in the 1st house amplifies your sense of self, bestowing leadership, vitality, and a strong desire for recognition. You have a commanding presence but should be mindful of ego.",
        "Sun in the 2nd house ties your identity to wealth, family heritage, and values. You may have a powerful voice and focus on accumulating significant assets.",
        "Sun in the 3rd house grants courage, a powerful will, and authority in communication. You express yourself with confidence and may excel in marketing, writing, or performance.",
        "Sun in the 4th house places your focus on home, family, and emotional foundations. You may take a leading role in domestic life and seek a prominent home environment.",
        "Sun in the 5th house brings creativity, intelligence, and a dramatic flair. You shine in areas of romance, performance, and leadership, with a strong connection to children.",
        "Sun in the 6th house indicates a drive to lead in your daily work and service. You take pride in overcoming challenges and can be a powerful figure in healthcare or administration.",
        "Sun in the 7th house places your ego and identity in partnerships. You seek a prominent partner and may define yourself through your relationships, for better or worse.",
        "Sun in the 8th house gives a powerful interest in mysteries, psychology, and joint resources. Your life path involves deep transformations and dealing with hidden power dynamics.",
        "Sun in the 9th house aligns your identity with higher beliefs, wisdom, and dharma. You are a natural teacher or guide, and your father or gurus may be significant figures.",
        "Sun in the 10th house is a powerful placement for career and public recognition. You are a natural leader, destined for a visible role in your profession and society.",
        "Sun in the 11th house indicates that your identity is connected to your social network, goals, and gains. You can become a leader within a large organization or group of friends.",
        "Sun in the 12th house directs your energy towards spirituality, introspection, and foreign lands. Your path may involve service in institutions or finding your identity in solitude."
    ],
    Moon: [
        "Moon in the 1st house makes your personality deeply emotional, intuitive, and receptive. Your identity is fluid, and you are highly sensitive to your environment and others' moods.",
        "Moon in the 2nd house links your emotional security to financial stability and family values. Your income may fluctuate, and you find comfort in nurturing your possessions.",
        "Moon in the 3rd house creates a mind that is curious, communicative, and changeable. Your thoughts are deeply tied to your feelings, making you an imaginative writer or speaker.",
        "Moon in the 4th house (its own house) is extremely strong for emotional happiness. Your well-being is deeply connected to your home, mother, and a sense of belonging.",
        "Moon in the 5th house makes you emotionally creative and romantic. You have a nurturing connection with children and find emotional fulfillment through creative self-expression.",
        "Moon in the 6th house ties your emotions to your work and daily routines. You may have a nurturing approach to service but can be prone to worry about health and conflicts.",
        "Moon in the 7th house seeks emotional fulfillment through partnerships. Your happiness depends greatly on the harmony and connection you feel with your significant other.",
        "Moon in the 8th house gives a mind that is deep, intuitive, and drawn to mysteries. You experience profound emotional transformations and have a natural psychic ability.",
        "Moon in the 9th house connects your emotions to your beliefs, higher learning, and travel. You find emotional peace through philosophy, spirituality, and exploring different cultures.",
        "Moon in the 10th house places your emotions in the public eye. Your career may be related to the public, caregiving, or food, and your reputation is subject to ups and downs.",
        "Moon in the 11th house finds emotional satisfaction through friendships, social networks, and achieving goals. You are nurtured by your community and group involvements.",
        "Moon in the 12th house creates a highly imaginative, intuitive, and compassionate mind. You need periods of solitude to recharge and may feel a deep connection to spiritual or otherworldly realms."
    ],
    Mars: [
        "Mars in the 1st house gives an assertive, energetic, and courageous persona. You are a natural go-getter, but must watch for impulsiveness and a tendency to be accident-prone.",
        "Mars in the 2nd house brings drive and conflict to finances and speech. You are aggressive in earning money, but may also have financial disputes or use harsh words.",
        "Mars in the 3rd house grants immense courage, initiative, and a direct communication style. You are a powerful advocate for your ideas, though can be argumentative.",
        "Mars in the 4th house can create conflict and arguments within the home and with family. It indicates a need to channel your energy into productive domestic projects.",
        "Mars in the 5th house provides a passionate and competitive drive in creativity, sports, and romance. You pursue your hobbies and love interests with great energy.",
        "Mars in the 6th house is excellent for overcoming enemies and obstacles. You are a formidable competitor and a tireless worker, but must guard against inflammation and injuries.",
        "Mars in the 7th house brings a passionate but potentially argumentative energy to partnerships. You are attracted to assertive partners, but power struggles are common.",
        "Mars in the 8th house indicates a strong drive to investigate secrets and a risk-taking nature with joint finances. This can indicate sudden events and a need for careful energy management.",
        "Mars in the 9th house shows a drive to fight for your beliefs. You may argue with teachers or about philosophy, but you are a passionate advocate for what you hold as truth.",
        "Mars in the 10th house provides immense ambition and drive in your career. You are a natural commander and excel in fields requiring courage and technical skill, like engineering or surgery.",
        "Mars in the 11th house directs your energy toward achieving goals and networking. You are proactive in your social circle and can be a leader among friends, though competition can arise.",
        "Mars in the 12th house can create hidden enemies or direct your energy inwards, leading to frustration. It is best channeled through spiritual discipline, research, or service."
    ],
    Mercury: [
        "Mercury in the 1st house makes you highly intelligent, communicative, and adaptable. Your identity is tied to your intellect, and you present yourself in a youthful, curious manner.",
        "Mercury in the 2nd house grants intelligence in financial matters and a skillful, often humorous or versatile, manner of speech. Your mind is focused on accumulating resources and data.",
        "Mercury in the 3rd house (its own house) is excellent for communication, writing, and learning. You have a quick, logical mind and excel in media, marketing, or short-distance travel.",
        "Mercury in the 4th house focuses your intelligence on domestic matters. You may enjoy learning at home, have a family business, or be constantly thinking about real estate and family.",
        "Mercury in the 5th house gives a playful, creative, and intelligent mind. You excel at games of skill, intellectual hobbies, and communicating with children.",
        "Mercury in the 6th house applies your analytical skills to problems, health, and work. You are a detail-oriented worker and an excellent troubleshooter, but may worry excessively.",
        "Mercury in the 7th house seeks an intelligent and communicative partner. Dialogue and mental connection are crucial for you in all one-on-one relationships.",
        "Mercury in the 8th house creates a mind drawn to research, investigation, and uncovering secrets. You have a natural talent for psychology, astrology, or investigative journalism.",
        "Mercury in the 9th house makes you a student of higher knowledge. You love to learn and communicate about philosophy, law, religion, and long-distance travel.",
        "Mercury in the 10th house uses communication as a primary tool in your career. You may have multiple jobs or a profession in media, writing, teaching, or consulting.",
        "Mercury in the 11th house grants a wide social network and intelligence in achieving goals. You connect with many different people and excel at group communication.",
        "Mercury in the 12th house gives a mind that is intuitive, imaginative, and focused on behind-the-scenes research or spiritual topics. You think deeply about hidden things."
    ],
    Jupiter: [
        "Jupiter in the 1st house brings optimism, wisdom, and good fortune to your personality. You are seen as a person of high principles, and you naturally attract opportunities.",
        "Jupiter in the 2nd house is excellent for wealth and finance. It indicates a path of abundance, a generous nature, and wisdom in handling resources.",
        "Jupiter in the 3rd house expands your communication and courage. You are an optimistic and inspiring speaker or writer, with good relationships with siblings.",
        "Jupiter in the 4th house (a strong placement) blesses you with a happy home life, a large property, and strong support from your mother. It indicates deep inner peace.",
        "Jupiter in the 5th house is a blessing for children, creativity, and good fortune through investments or speculation. Your intelligence is broad and your creativity is expansive.",
        "Jupiter in the 6th house helps in overcoming conflicts and health issues with wisdom. You are generous in your service and can be a great teacher or counselor in your work.",
        "Jupiter in the 7th house promises a wise, fortunate, and principled partner. Your relationships are a source of growth and expansion in your life.",
        "Jupiter in the 8th house can bring wealth through inheritance or partners, and gives a deep, philosophical interest in life's mysteries and longevity.",
        "Jupiter in the 9th house (its own house) is extremely powerful for fortune, higher wisdom, and dharma. You are a born teacher, philosopher, or guide, blessed by luck.",
        "Jupiter in the 10th house grants great success, ethics, and wisdom in your career. You can attain a high position as a consultant, teacher, or leader in your field.",
        "Jupiter in the 11th house is one of the best placements for gains and fulfillment of desires. You have a wide network of powerful and helpful friends.",
        "Jupiter in the 12th house provides divine protection and a deep interest in spirituality, meditation, and charity. You find wisdom in solitude and letting go."
    ],
    Venus: [
        "Venus in the 1st house blesses you with charm, grace, and a love for beauty and harmony. You are naturally attractive, diplomatic, and have a pleasant demeanor.",
        "Venus in the 2nd house is excellent for wealth, giving a love for luxury items, fine food, and a beautiful speaking voice. You attract money easily through your charm.",
        "Venus in the 3rd house makes your communication style artistic and pleasant. You have a talent for creative writing, poetry, or design and enjoy harmonious sibling relationships.",
        "Venus in the 4th house indicates a beautiful home, a love of comfort, and a happy domestic life. You may own luxury vehicles and have a strong, loving bond with your mother.",
        "Venus in the 5th house grants creativity, romance, and artistic talent. You are highly charismatic and find great joy in love affairs, the arts, and entertainment.",
        "Venus in the 6th house can bring harmony to the workplace, but also indicates that health issues may arise from overindulgence. You may serve others through art or design.",
        "Venus in the 7th house (its own house) is a strong indicator of a beautiful, charming, and devoted partner. Your marriage is central to your happiness and social life.",
        "Venus in the 8th house can bring wealth through marriage or inheritance, but also indicates intense, secret relationships. It gives a strong magnetism and allure.",
        "Venus in the 9th house shows a love for philosophy, art, and the beauty in different cultures. Your beliefs are centered on harmony, and you may find a partner from a foreign land.",
        "Venus in the 10th house grants success in careers related to arts, entertainment, beauty, or diplomacy. You have a charming public image and are well-liked.",
        "Venus in the 11th house brings gains and friendships through your charm and social grace. You have a network of artistic and affluent friends who help you achieve your goals.",
        "Venus in the 12th house finds love and beauty in seclusion, spirituality, and imagination. It can indicate hidden relationships or a love for luxurious comforts in private."
    ],
    Saturn: [
        "Saturn in the 1st house adds seriousness, discipline, and responsibility to your personality. You may feel burdensome responsibilities from a young age but develop great endurance.",
        "Saturn in the 2nd house can restrict finances and family wealth, demanding hard work and savings over time. It gives a serious, practical, and sometimes melancholic speech.",
        "Saturn in the 3rd house can create challenges with siblings or communication. However, it gives immense perseverance and discipline in any skill you set your mind to master.",
        "Saturn in the 4th house may indicate a restrictive or emotionally cool home environment. It builds security slowly over time through discipline and hard work.",
        "Saturn in the 5th house can delay or bring a serious approach to children, romance, and creativity. Your creative pursuits are structured and may manifest later in life.",
        "Saturn in the 6th house is a powerful placement for overcoming enemies through persistence. It shows a diligent worker but can indicate chronic health issues that require discipline.",
        "Saturn in the 7th house can delay marriage or bring a mature, older, or very responsible partner. It demands commitment, structure, and patience in relationships.",
        "Saturn in the 8th house is a strong placement for longevity. It can bring inheritances through long, patient waiting, and gives a deep, serious interest in research and metaphysics.",
        "Saturn in the 9th house creates a structured, traditional, and sometimes rigid belief system. You take philosophy and higher learning seriously, but may question your teachers.",
        "Saturn in the 10th house (a strong placement) brings success and high status through slow, steady, and disciplined hard work. You build a lasting career and reputation over time.",
        "Saturn in the 11th house can make fulfillment of desires a slow process. Friendships are few but long-lasting. Gains come through persistence and established networks.",
        "Saturn in the 12th house indicates a solitary, disciplined spiritual path. It is excellent for meditation and behind-the-scenes work but can indicate feelings of isolation."
    ],
    Rahu: [
        "Rahu in the 1st house creates a powerful, ambitious, and unconventional personality. You have an insatiable desire for recognition and may feel like an outsider seeking to prove yourself.",
        "Rahu in the 2nd house gives a huge desire for wealth and accumulating possessions. It can bring wealth from unconventional sources, but also a tendency towards untruthful speech.",
        "Rahu in the 3rd house grants extreme courage and a powerful, persuasive communication style. You may excel in media, technology, or marketing, but can be manipulative.",
        "Rahu in the 4th house can create restlessness regarding home and emotional peace. There may be foreign elements in your home life or a feeling of never being truly settled.",
        "Rahu in the 5th house brings an obsessive drive for creativity, romance, and speculation. It can grant fame through entertainment but also unorthodox approaches to children.",
        "Rahu in the 6th house provides an uncanny ability to overcome enemies and solve complex problems with unconventional methods. It can give success in technology or healing.",
        "Rahu in the 7th house creates a strong desire for partnership, often with someone from a different background or culture. Relationships are a major focus and can be unconventional.",
        "Rahu in the 8th house gives a powerful and obsessive interest in secrets, metaphysics, and sudden wealth. It can bring unexpected gains and losses and a talent for research.",
        "Rahu in the 9th house creates unconventional beliefs and a questioning attitude towards traditional dharma and teachers. It can lead to great success in foreign lands.",
        "Rahu in the 10th house is a powerful driver for career ambition and fame. You are not afraid to break the rules to achieve high status and can rise quickly in your profession.",
        "Rahu in the 11th house is an excellent placement for massive gains and achieving desires through technology and large networks. You have influential and unconventional friends.",
        "Rahu in the 12th house directs its obsessive energy towards spirituality, foreign lands, or hidden matters. It can give powerful intuitive insights or lead to secret dealings and expenses."
    ],
    Ketu: [
        "Ketu in the 1st house creates a detached, introspective, and spiritually-inclined personality. You may feel a sense of rootlessness or question your own identity, leading to a spiritual search.",
        "Ketu in the 2nd house can create a detached attitude towards wealth and family. It may lead to financial uncertainty or a lack of focus on material accumulation.",
        "Ketu in the 3rd house brings an intuitive and non-linear communication style. You may lack interest in conventional media but have powerful psychic or symbolic insights.",
        "Ketu in the 4th house can indicate a detached or unsettled feeling about your home and roots. It promotes a search for a spiritual 'home' rather than a physical one.",
        "Ketu in the 5th house creates a detached and critical view of romance, creativity, and children. You may have highly intuitive intelligence but struggle with conventional creative expression.",
        "Ketu in the 6th house provides a powerful ability to intuitively diagnose and solve problems or diseases. However, it can also indicate strange, hard-to-diagnose health issues.",
        "Ketu in the 7th house brings a spiritual, detached, or critical approach to partnership. You may feel a karmic connection to your partner but also a sense of dissatisfaction.",
        "Ketu in the 8th house is a powerful placement for deep mystical and occult research. You have a natural ability to see through illusions and understand deep metaphysical truths.",
        "Ketu in the 9th house indicates a questioning of traditional beliefs and a search for a more direct, intuitive spiritual truth. It shows past life mastery of philosophy.",
        "Ketu in the 10th house creates a career path that is unconventional, spiritual, or involves research. You are detached from the ambitions of status and fame.",
        "Ketu in the 11th house gives a detached view of social networks and material gains. Your friendships may be few or unusual, and your goals are often not materialistic.",
        "Ketu in the 12th house is the significator for liberation (Moksha) and is extremely powerful here. It grants profound intuitive insight, meditative ability, and spiritual detachment."
    ]
};
const planetInHouse_hi = { /* Placeholder for Hindi translations */ };

function getOrdinal(n) {
    const s = ["th", "st", "nd", "rd"];
    const v = n % 100;
    return n + (s[(v - 20) % 10] || s[v] || s[0]);
}

function generateLordshipText(lordOfHouse, placementHouse, lordPlanet, lang = 'en') {
    const houseThemes = lang === 'hi' ? houseThemes_hi : houseThemes_en;
    const planetNames = lang === 'hi' ? planetNames_hi : { Sun: 'Sun', Moon: 'Moon', Mars: 'Mars', Mercury: 'Mercury', Jupiter: 'Jupiter', Venus: 'Venus', Saturn: 'Saturn' };

    const themes1 = houseThemes[lordOfHouse];
    const themes2 = houseThemes[placementHouse];
    const lord = planetNames[lordPlanet] || lordPlanet;
    const lordOfOrdinal = getOrdinal(lordOfHouse);
    const placementOrdinal = getOrdinal(placementHouse);

    const TRIKONA = [1, 5, 9];
    const KENDRA = [1, 4, 7, 10];
    const DUSTHANA = [6, 8, 12];
    const UPACHAYA = [3, 6, 10, 11];

    // Case 1: Lord in its own house
    if (lordOfHouse === placementHouse) {
        return `The lord of the ${lordOfOrdinal} house, ${lord}, is in its own house. This powerfully strengthens the matters of this house (${themes1}), making them a central and self-sufficient theme in your life. You have natural control and command over this area.`;
    }

    // Case 2: Raja Yoga (Lord of Kendra in Trikona or vice-versa)
    if ((KENDRA.includes(lordOfHouse) && TRIKONA.includes(placementHouse)) || (TRIKONA.includes(lordOfHouse) && KENDRA.includes(placementHouse))) {
        return `This forms a powerful Raja Yoga, a combination for success and status. The lord of the ${lordOfOrdinal} house (${themes1}) connecting with the ${placementOrdinal} house (${themes2}) indicates that your fortune and actions are linked, promising significant achievements by applying your efforts in a righteous way.`;
    }
    
    // Case 3: Viparita Raja Yoga (Lords of Dusthanas in other Dusthanas)
    if (DUSTHANA.includes(lordOfHouse) && DUSTHANA.includes(placementHouse)) {
        return `This can form a Viparita Raja Yoga. The lord of a challenging house (${lordOfOrdinal} - ${themes1}) moving to another challenging house (${placementOrdinal} - ${themes2}) indicates that you may gain unexpectedly from difficult situations. It can bring sudden positive shifts after periods of initial struggle or loss.`;
    }

    // Case 4: Lord of a good house in a Dusthana
    if ((KENDRA.includes(lordOfHouse) || TRIKONA.includes(lordOfHouse)) && DUSTHANA.includes(placementHouse)) {
        return `The positive energies of your ${lordOfOrdinal} house (${themes1}) are being channeled into the challenging ${placementOrdinal} house (${themes2}). This suggests that your personal identity, fortune, or actions may be tested or spent in dealing with conflicts, hidden matters, or overcoming obstacles.`;
    }

    // Case 5: Lord of a Dusthana in a good house
    if (DUSTHANA.includes(lordOfHouse) && (KENDRA.includes(placementHouse) || TRIKONA.includes(placementHouse))) {
        return `The challenging themes of your ${lordOfOrdinal} house (${themes1}) are brought into a key area of your life, the ${placementOrdinal} house (${themes2}). This suggests that matters of conflict, health, or loss may directly impact your personal identity, home, or fortune, requiring conscious management.`;
    }

    // Default generic (but improved) case
    return `The lord of your ${lordOfOrdinal} house (governing ${themes1}), which is ${lord}, is placed in your ${placementOrdinal} house. This creates a powerful link, suggesting your path to fulfilling matters of your ${lordOfOrdinal} house is deeply connected with activities related to ${themes2}.`;
}


export const nakshatraTraitsLong_en = {
    Ashwini: "Ashwini grants vitality, speed, boldness, and a youthful spirit. You excel at initiating tasks and may have natural healing or rescue abilities. Your instinct is fast and intuitive.",
    Bharani: "Bharani gives intense endurance, moral strength, and transformative power. You experience life deeply and can handle karmic purification with resilience.",
    Krittika: "Krittika brings sharp intellect, cleansing energy, leadership ability, and determination. You cut through illusions and pursue excellence.",
    Rohini: "Rohini gives charm, beauty, creativity, material growth, and nurturing ability. You attract abundance and artistic expression.",
    Mrigashira: "Mrigashira gives curiosity, a searching nature, intellectual sharpness, and restlessness. You constantly seek deeper understanding.",
    Ardra: "Ardra symbolizes transformation through storms. You possess emotional depth, intense insight, and the capacity to rebuild life.",
    Punarvasu: "Punarvasu gives renewal, hope, gentleness, and restorative energy. You rise after setbacks and spread optimism.",
    Pushya: "Pushya gives nourishment, wisdom, responsibility, and spiritual grace. You support others and value disciplined purity.",
    Ashlesha: "Ashlesha brings depth, intuition, psychological insight, and hypnotic influence. You understand hidden motives.",
    Magha: "Magha grants ancestral strength, leadership, recognition, and royal dignity. Your personality carries authority.",
    PurvaPhalguni: "Purva Phalguni gives creativity, charm, relaxation, attractions, and enjoyment of life's pleasures.",
    UttaraPhalguni: "Uttara Phalguni gives integrity, reliability, discipline, and a strong sense of duty toward relationships.",
    Hasta: "Hasta gives manual skill, control, cleverness, communication talent, and sincerity.",
    Chitra: "Chitra grants artistry, design sense, charisma, and strong individuality.",
    Swati: "Swati gives independence, adaptability, self-discovery, and freedom in thought and movement.",
    Vishakha: "Vishakha grants determination, ambition, goal-orientation, and a deep hunger for achievement.",
    Anuradha: "Anuradha gives devotion, friendship, loyalty, discipline, and cooperation.",
    Jyeshtha: "Jyeshtha grants authority, seniority, protection, and sharp intelligence.",
    Mula: "Mula gives deep truth-seeking, intensity, philosophical depth, and transformative energy.",
    PurvaAshadha: "Purva Ashadha gives victory, confidence, persuasiveness, and idealistic motivation.",
    UttaraAshadha: "Uttara Ashadha gives nobility, discipline, leadership ability, and long-term success.",
    Shravana: "Shravana gives learning ability, listening skills, wisdom, and social respect.",
    Dhanishta: "Dhanishta grants rhythm, wealth potential, generosity, and leadership in groups.",
    Shatabhisha: "Shatabhisha grants healing ability, secrecy, research skills, and mystical insight.",
    PurvaBhadrapada: "Purva Bhadrapada grants intensity, spiritual idealism, transformative thinking, and strong determination.",
    UttaraBhadrapada: "Uttara Bhadrapada grants peace, patience, inner wisdom, and stable emotional maturity.",
    Revati: "Revati provides compassion, gentleness, creativity, security, and spiritual refinement."
};


export const nakshatraTraitsLong_hi = {
    Ashwini: "अश्विनी जीवन शक्ति, गति, साहस और युवा भावना प्रदान करती है। आप काम शुरू करने में माहिर हैं और आपके पास प्राकृतिक उपचार या बचाव की क्षमता हो सकती है। आपकी प्रवृत्ति तेज़ और सहज है।",
    Bharani: "भरणी तीव्र सहनशक्ति, नैतिक शक्ति और परिवर्तनकारी शक्ति देती है। आप जीवन को गहराई से अनुभव करते हैं और लचीलेपन के साथ कर्मों के शुद्धिकरण को संभाल सकते हैं।",
    Krittika: "कृतिका तेज बुद्धि, शुद्ध करने वाली ऊर्जा, नेतृत्व क्षमता और दृढ़ संकल्प लाती है। आप भ्रम को दूर करते हैं और उत्कृष्टता का पीछा करते हैं।",
    Rohini: "रोहिणी आकर्षण, सुंदरता, रचनात्मकता, भौतिक विकास और पोषण करने की क्षमता देती है। आप प्रचुरता और कलात्मक अभिव्यक्ति को आकर्षित करते हैं।",
    Mrigashira: "मृगशिरा जिज्ञासा, खोजी स्वभाव, बौद्धिक तीक्ष्णता और बेचैनी देती है। आप लगातार गहरी समझ की तलाश करते हैं।",
    Ardra: "आर्द्रा तूफानों के माध्यम से परिवर्तन का प्रतीक है। आपके पास भावनात्मक गहराई, तीव्र अंतर्दृष्टि और जीवन को फिर से बनाने की क्षमता है।",
    Punarvasu: "पुनर्वसु नवीनीकरण, आशा, कोमलता और पुनर्स्थापनात्मक ऊर्जा देती है। आप असफलताओं के बाद उठते हैं और आशावाद फैलाते हैं।",
    Pushya: "पुष्य पोषण, ज्ञान, जिम्मेदारी और आध्यात्मिक कृपा देता है। आप दूसरों का समर्थन करते हैं और अनुशासित पवित्रता को महत्व देते हैं।",
    Ashlesha: "आश्लेषा गहराई, अंतर्ज्ञान, मनोवैज्ञानिक अंतर्दृष्टि और सम्मोहक प्रभाव लाती है। आप छिपे हुए उद्देश्यों को समझते हैं।",
    Magha: "मघा पैतृक शक्ति, नेतृत्व, पहचान और शाही गरिमा प्रदान करती है। आपके व्यक्तित्व में अधिकार होता है।",
    PurvaPhalguni: "पूर्वा फाल्गुनी रचनात्मकता, आकर्षण, विश्राम, आकर्षण और जीवन के सुखों का आनंद देती है।",
    UttaraPhalguni: "उत्तरा फाल्गुनी ईमानदारी, विश्वसनीयता, अनुशासन और रिश्तों के प्रति कर्तव्य की एक मजबूत भावना देती है।",
    Hasta: "हस्त हस्त कौशल, नियंत्रण, चतुराई, संचार प्रतिभा और ईमानदारी देता है।",
    Chitra: "चित्रा कलात्मकता, डिजाइन की समझ, करिश्मा और मजबूत व्यक्तित्व प्रदान करती है।",
    Swati: "स्वाति स्वतंत्रता, अनुकूलनशीलता, आत्म-खोज और विचार और गति में स्वतंत्रता देती है।",
    Vishakha: "विशाखा दृढ़ संकल्प, महत्वाकांक्षा, लक्ष्य-उन्मुखता और उपलब्धि के लिए गहरी भूख प्रदान करती है।",
    Anuradha: "अनुराधा भक्ति, मित्रता, वफादारी, अनुशासन और सहयोग देती है।",
    Jyeshtha: "ज्येष्ठा अधिकार, वरिष्ठता, सुरक्षा और तेज बुद्धि प्रदान करती है।",
    Mula: "मूल गहरा सत्य की खोज, तीव्रता, दार्शनिक गहराई और परिवर्तनकारी ऊर्जा।",
    PurvaAshadha: "पूर्वाषाढ़ा विजय, आत्मविश्वास, प्रेरक क्षमता और आदर्शवादी प्रेरणा देता है।",
    UttaraAshadha: "उत्तराषाढ़ा कुलीनता, अनुशासन, नेतृत्व क्षमता और दीर्घकालिक सफलता देता है।",
    Shravana: "श्रवण सीखने की क्षमता, सुनने का कौशल, ज्ञान और सामाजिक सम्मान देता है।",
    Dhanishta: "धनिष्ठा लय, धन की संभावना, उदारता और समूहों में नेतृत्व प्रदान करता है।",
    Shatabhisha: "शतभिषा उपचार क्षमता, गोपनीयता, अनुसंधान कौशल और रहस्यमय अंतर्दृष्टि देता है।",
    PurvaBhadrapada: "पूर्वाभाद्रपद तीव्रता, आध्यात्मिक आदर्शवाद, परिवर्तनकारी सोच और दृढ़ संकल्प देता है।",
    UttaraBhadrapada: "उत्तराभाद्रपद शांति, धैर्य, आंतरिक ज्ञान और स्थिर भावनात्मक परिपक्वता देता है।",
    Revati: "रेवती करुणा, कोमलता, रचनात्मकता, सुरक्षा और आध्यात्मिक परिष्कार प्रदान करती है।"
};


// Helper function to provide a qualitative description of strength
function getStrengthDescription(strength, lang = 'en') {
    if (lang === 'hi') {
        if (strength >= 90) return `असाधारण रूप से मजबूत है, जो आपके भाग्य पर एक प्रमुख और स्पष्ट प्रभाव डालता है।`;
        if (strength >= 70) return `काफी मजबूत है, जो बताता है कि जीवन की घटनाओं में इसका एक शक्तिशाली और सीधा कहना है।`;
        if (strength >= 50) return `मध्यम रूप से मजबूत है, जो आपके मार्ग को आकार देने की एक उल्लेखनीय लेकिन संतुलित क्षमता का सुझाव देता है।`;
        if (strength >= 30) return `का प्रभाव मध्यम लेकिन कभी-कभी असंगत होता है, जिसकी क्षमता को सक्रिय करने के लिए सचेत प्रयास की आवश्यकता होती है।`;
        return `की ताकत कुछ कम है, यह सुझाव देता है कि यद्यपि यह एक पृष्ठभूमि विषय निर्धारित करता है, इसका प्रभाव सूक्ष्म हो सकता है या अन्य ग्रहों के समर्थन पर निर्भर हो सकता है।`;
    }
    // English default
    if (strength >= 90) return `is exceptionally strong, giving it a dominant and clear-cut influence over your destiny.`;
    if (strength >= 70) return `is significantly strong, indicating it has a powerful and direct say in your life's events.`;
    if (strength >= 50) return `is moderately strong, suggesting a noticeable but balanced capacity to shape your path.`;
    if (strength >= 30) return `has a moderate but sometimes inconsistent influence, requiring conscious effort to activate its potential.`;
    return `is somewhat less pronounced in strength, suggesting that while it sets a background theme, its influence may be subtle or dependent on support from other planets.`;
}

// Helper function to interpret the Lagna Lord's placement
function getLagnaLordInterpretation(lord, house, lang = 'en') {
    const planetNature_en = { Sun: 'authoritative', Moon: 'receptive', Mars: 'assertive', Mercury: 'intellectual', Jupiter: 'expansive', Venus: 'harmonious', Saturn: 'disciplined', Rahu: 'ambitious', Ketu: 'detached' };
    const planetNature_hi = { Sun: 'आधिकारिक', Moon: 'ग्रहणशील', Mars: 'मुखर', Mercury: 'बौद्धिक', Jupiter: 'विस्तृत', Venus: 'सामंजस्यपूर्ण', Saturn: 'अनुशासित', Rahu: 'महत्वाकांक्षी', Ketu: 'अनासक्त' };
    
    const themes = lang === 'hi' ? houseThemes_hi : houseThemes_en;
    const natures = lang === 'hi' ? planetNature_hi : planetNature_en;
    const lordTranslated = lang === 'hi' ? (planetNames_hi[lord] || lord) : lord;

    if (lang === 'hi') {
        return `चूंकि आपका लग्न ${natures[lord] || ''} ${lordTranslated} द्वारा निर्देशित है, इसका ${house}वें घर में स्थान आपकी मुख्य जीवन ऊर्जा को ${themes[house] || ''} के विषयों की ओर निर्देशित करता है।`;
    }
    // English default
    return `As your ascendant is guided by the ${natures[lord] || ''} ${lord}, its placement in the ${house}th house directs your core life energy towards themes of ${themes[house] || ''}.`;
}

// ---------------------------------------------------------
//  FULL COMBINED PREDICTION GENERATOR (Lagna, Rashi, Nakshatra)
// ---------------------------------------------------------

export function getCombinedPredictionLong(lagna, rashi, nakshatra, additionalData, lang = 'en') {
    const { lagnaLord, lagnaLordNatalHouse, lagnaLordStrength, atmakaraka, atmakarakaStrength, planetaryPositions, houses } = additionalData || {};
    
    const lagnaTraits_en = {
        Aries: "Being an Aries ascendant, your worldview is shaped by action and courage. You are a natural leader, always ready to take the first step and inspire others. Your energy is infectious, though it can sometimes lead to haste. You prefer to deal with issues directly and honestly, and your path in life involves learning to balance your powerful drive with patience and consideration for others.",
        Taurus: "As a Taurus ascendant, you are grounded and methodical in your approach to life. You seek to create a world of comfort and beauty around you, and you have a natural talent for managing resources. Your determination is a great asset, but it can sometimes manifest as stubbornness.",
        Gemini: "Gemini Lagna blesses you with a flexible, curious, and talkative personality. Mental stimulation drives you, and you constantly seek new ideas, connections, and perspectives. You adapt quickly to changing situations and enjoy sharing knowledge.",
        Cancer: "Cancer Lagna gives you a nurturing, intuitive, and emotionally aware outer personality. You are deeply sensitive to your environment and the needs of others, often acting as a natural protector or caretaker. Family, roots, and personal security matter greatly to you.",
        Leo: "Leo Lagna brings a charismatic, expressive, and confident presence. You naturally gravitate toward leadership roles and appreciate recognition for your efforts. Your personality radiates warmth, creativity, and strong willpower.",
        Virgo: "With Virgo rising, you move through life with precision, logic, and an analytical mindset. You observe details others overlook and strive for improvement in everything you do. Practical and health-conscious, you prefer structure and order.",
        Libra: "Libra Lagna gives you a graceful, balanced, and diplomatic personality. You naturally seek harmony in relationships and environments, excelling at mediation and fairness. You dislike conflict and are gifted at seeing both sides of a situation.",
        Scorpio: "Scorpio Lagna creates a powerful, intense, and deeply insightful personality. Your presence is magnetic, and your emotional depth is unmatched. You rarely reveal your true thoughts easily and possess strong resilience in crisis.",
        Sagittarius: "Sagittarius rising gives you an optimistic, adventurous, and knowledge-seeking personality. You value freedom and exploring broader perspectives—whether through travel, philosophy, or personal growth.",
        Capricorn: "Capricorn Lagna makes you disciplined, realistic, and focused on long-term achievement. You approach life with seriousness and responsibility, and your ability to persevere through difficulties is exceptional.",
        Aquarius: "With Aquarius rising, your personality blends originality, intelligence, and humanitarian concern. You think in unconventional ways and often detach emotionally to analyze situations objectively.",
        Pisces: "Pisces Lagna gives you a gentle, imaginative, and intuitive personality. You perceive the world through emotion and symbolism. Compassion and creativity flow naturally through you."
    };
    const rashiTraits_en = {
        Aries: "With Aries Moon, your emotional responses are quick, passionate, and honest. You dislike emotional stagnation and prefer direct communication of feelings.",
        Taurus: "A Taurus Moon gives you a calm, steady emotional nature. You seek peace, predictability, and long-term comfort. Sudden emotional changes unsettle you.",
        Gemini: "Moon in Gemini makes your emotions tied to intellect and communication. You express feelings through words, and your mind rarely rests. Curiosity shapes your emotional world.",
        Cancer: "With Moon in Cancer, you experience emotions deeply and intuitively. Family bonds, memory, and home strongly influence your emotional wellbeing.",
        Leo: "Leo Moon gives you a dramatic, warm, and expressive emotional nature. You feel happiest when appreciated or admired and seek emotional connection that validates your inner dignity.",
        Virgo: "Moon in Virgo makes your emotions analytical and practical. You seek order and clarity, and your care shows through helpful actions rather than overt displays.",
        Libra: "Moon in Libra gives you a need for balance and harmony in your emotional life. You dislike conflict and seek cooperative and mentally aligned relationships.",
        Scorpio: "Scorpio Moon creates powerful, intense, and transformative emotions. You experience loyalty deeply and form strong attachments. Emotional betrayal can trigger profound internal reactions.",
        Sagittarius: "Moon in Sagittarius brings optimism and a need for freedom. You dislike emotional confinement and thrive on honesty and open communication.",
        Capricorn: "Capricorn Moon gives emotional discipline and restraint. You express feelings carefully, preferring control and stability over spontaneity.",
        Aquarius: "Moon in Aquarius gives you a detached, intellectualized emotional style. You value logic over sentiment and prefer friendships and ideas that align with your principles.",
        Pisces: "Pisces Moon gives deep sensitivity, compassion, and psychic receptivity. You feel emotions profoundly and may merge too easily with others’ moods."
    };
    const nakshatraTraits = nakshatraTraitsLong_en;

    const p = {
        yourChartCombines: "Your chart combines the qualities of your", lagna: "Lagna", rashi: "Rashi", and: "and", nakshatra: "Nakshatra", creatingProfile: ", creating a deeply layered personality profile.",
        asALagnaAscendant: "As a", outerBehavior: "ascendant, your outer behavior, approach to life, and first instincts are shaped by the following tendencies:",
        emotionallyAndMentally: "Emotionally and mentally, your Moon sign in", influencesHowYou: "influences how you process experiences, form bonds, and respond to your inner world. This gives you the following emotional nature:",
        atADeeperKarmic: "At a deeper karmic and spiritual level, your birth in the", infusesYourInstincts: "Nakshatra infuses your instincts, subconscious drives, and soul journey with the following qualities:",
        whenTheseThree: "When these three forces blend, they create a unique harmony between your external personality, your internal emotional life, and your spiritual foundation. This combination reveals how you behave in the world, how you feel within, and what your soul seeks across your life path. This integrated pattern shapes your natural strengths, challenges, relationships, decisions, and long-term destiny."
    };

    let lagnaText = lagnaTraits_en[lagna] || "";
    let rashiText = rashiTraits_en[rashi] || "";
    const nakshatraText = nakshatraTraits[nakshatra] || "";

    const cuspDegrees = houses ? houses.map(h => convertDMSToDegrees(h.start_dms)) : [];

    // --- Synthesize Lagna Lord into Lagna Paragraph ---
    if (lagnaLord && lagnaLordNatalHouse && cuspDegrees.length > 0) {
        const houseTheme = houseThemes_en[lagnaLordNatalHouse];
        lagnaText += ` This core identity finds its primary expression in the ${getOrdinal(lagnaLordNatalHouse)} house, channeling your life's path toward matters of ${houseTheme}.`;
    }

    // --- Synthesize Moon's House Placement into Rashi Paragraph ---
    const moonData = planetaryPositions?.Moon;
    if (moonData && typeof moonData.longitude === 'number' && cuspDegrees.length > 0) {
        const moonHouse = getHouseOfPlanet(moonData.longitude, cuspDegrees);
        if (moonHouse) {
            const houseTheme = houseThemes_en[moonHouse];
            rashiText += ` This emotional nature is most actively focused on the ${getOrdinal(moonHouse)} house, suggesting you seek emotional fulfillment and security in matters related to ${houseTheme}.`;
        }
    }

    // --- Assemble the final report ---
    let result = `
${p.yourChartCombines} ${lagna} ${p.lagna}, ${rashi} ${p.rashi}, ${p.and} ${nakshatra} ${p.nakshatra}${p.creatingProfile} 
${p.asALagnaAscendant} ${lagna} ${p.outerBehavior} ${lagnaText}

${p.emotionallyAndMentally} ${rashi} ${p.influencesHowYou} ${rashiText}

${p.atADeeperKarmic} ${nakshatra} ${p.infusesYourInstincts} ${nakshatraText}
`;

    if (lagnaLord && lagnaLordNatalHouse && lagnaLordStrength !== undefined) {
        const interpretation = getLagnaLordInterpretation(lagnaLord, lagnaLordNatalHouse, lang);
        const strengthDescription = getStrengthDescription(lagnaLordStrength, lang);
        result += `\n\nYour Lagna Lord, ${lagnaLord}, is a key planet for your life path. ${interpretation} Its strength of ${lagnaLordStrength.toFixed(2)}% shows that it ${strengthDescription}`;
    }

    if (atmakaraka && atmakarakaStrength !== undefined) {
        const atmakarakaTranslated = lang === 'hi' ? planetNames_hi[atmakaraka] : atmakaraka;
        const strengthDescription = getStrengthDescription(atmakarakaStrength, lang);
        result += `\n\n${atmakarakaTranslated} as your Atmakaraka (Soul Significator) reveals your deepest desires. Its strength of ${atmakarakaStrength.toFixed(2)}% indicates that it ${strengthDescription}`;
    }

    if (planetaryPositions && houses) {
        result += `\n\n### Planetary Placements Analysis\nThis section details the influence of each planet based on the house it occupies.`;
        const planetOrder = ['Sun', 'Moon', 'Mars', 'Mercury', 'Jupiter', 'Venus', 'Saturn', 'Rahu', 'Ketu'];
        planetOrder.forEach(planet => {
            const planetData = planetaryPositions[planet];
            if (planetData && typeof planetData.longitude === 'number') {
                const house = getHouseOfPlanet(planetData.longitude, cuspDegrees);
                if (house) {
                    const interpretation = (lang === 'hi' ? (planetInHouse_hi[planet]?.[house - 1]) : (planetInHouse_en[planet]?.[house - 1]));
                    if (interpretation) {
                         result += `\n\n*   **${planet} in House ${house}:** ${interpretation}`;
                    }
                }
            }
        });

        result += `\n\n### House Lordship Analysis\nThis section analyzes how the different areas of your life are connected by examining the placement of house lords.`;
        for (let i = 1; i <= 12; i++) {
            const houseData = houses[i - 1];
            const lord = houseData?.start_rashi_lord;
            if (lord) {
                const lordData = planetaryPositions[lord];
                if (lordData && typeof lordData.longitude === 'number') {
                    const placementHouse = getHouseOfPlanet(lordData.longitude, cuspDegrees);
                    if (placementHouse) {
                        result += `\n\n*   **Lord of House ${i} in House ${placementHouse}:** ${generateLordshipText(i, placementHouse, lord, lang)}`;
                    }
                }
            }
        }
    }
    
    result += `\n\n${p.whenTheseThree}`;

    return result.trim();
}
// ---------------------------------------------------------
//  VARSHAPHAL (ANNUAL) PREDICTION GENERATOR
// ---------------------------------------------------------

export function getVarshphalPrediction(payload = {}, lang = 'en') {
    const { varshphalChart = {}, muntha = null, yearLord = null, muddaDasha = [], kpSignificators, style = 'simple', varshphalYear = null } = payload;
    const { ascendant, planetHousePlacements, planetDetails, shadbala } = varshphalChart || {};
    const upbsScores = planetDetails?.upbsScores || {};

    const P = {
        en: {
            predictionForYear: 
`### Prediction for the Varshphal Year: {varshphalYear}\n\n`,
            yearLordTheme: `The central theme for your year is shaped by the Year Lord (Varsheshwara), which is **{yearLord}**. `,
            yearLordBenefic: `As a natural benefic, {yearLord} indicates a year focused on growth, opportunities, and positive developments. `,
            yearLordMalefic: `As a natural malefic, {yearLord} points to a year of challenges, responsibilities, and hard work where discipline will be key. `,
            yearLordPlacement: (house) => `Its placement in house ${house} directs this energy towards matters of **${houseThemes_en[house]}**. `,
            munthaFocus: `\n\nYour personal focus for the year, represented by the Muntha, is in **{munthaSign}**, which falls in house **{munthaHouse}**. `,
            munthaHouseFocus: (house) => `This brings your personal efforts and attention squarely onto the themes of this house: **${houseThemes_en[house]}**. `,
            ascendantFocus: `\n\nThe annual chart's ascendant is **{ascendantRashi}**, ruled by **{ascendantRashiLord}**. This influences your outlook, bringing a focus on **${houseThemes_en[1]}** to your personal expression and approach this year. `,
            strengthAndInfluence: `\n\n#### Planetary Strengths and Key Influences\n`,
            strongestPlanetUPBS: (planet) => `The planet with the highest overall strength (UPBS) this year is **${planet}**. This planet will have a significant and often decisive influence on the year's events. Its placement and the houses it rules will be areas of major activity.`,
            strongestPlanetShadbala: (planet) => `Based on Shadbala (six-fold strength), the strongest planet is **${planet}**, indicating its capacity to deliver powerful results, whether positive or negative. `,
            detailedAnalysis: "\n\n--- \n\n### Detailed Analysis\n",
            yearLordDignity: (dignity) => `The Year Lord, {yearLord}, is in a state of **${dignity}**, which affects its ability to deliver results. `,
            munthaLordInteraction: (relation) => `The lord of the Muntha sign has a **${relation}** relationship with the Year Lord, suggesting how your personal efforts will align with the year's broader themes. `,
            muddaDashaSection: "\n\n#### Mudda Dasha Periods\nYour year will unfold through the following planetary periods (Mudda Dasha), each bringing a specific focus:\n",
            dashaPeriod: (lord, start, end) => `- **${lord} period:** from ${new Date(start).toLocaleDateString()} to ${new Date(end).toLocaleDateString()}\n`,
            kpSection: "\n\n#### KP Significators Insights\n",
            kpCuspSignificators: (cusp, sigs) => `**Cusp ${cusp} (${houseThemes_en[cusp]}):** Significators are ${sigs}. This indicates that matters of this house will be influenced by these planets. `,
            kpPlanetSignificators: (planet, sigs) => `**${planet}:** Signifies houses ${sigs}. This planet will be instrumental in events related to these houses. `,
            conclusion: `\n\n#### Summary and Advice\n`,
            simpleConclusion: (yearLord, yearLordHouse, munthaHouse) => `Overall, this year requires you to integrate the ambitious energy of your Year Lord with the personal focus of your Muntha. To make the most of this year, focus on activities related to **${houseThemes_en[yearLordHouse]}** while ensuring they also serve your personal development in the area of **${houseThemes_en[munthaHouse]}**. Your strongest planet, {strongestPlanet}, will provide the key to unlocking the year's potential. `,
            detailedConclusion: (translatedYearLord, translatedMunthaSign, translatedAscendantRashi) => `This year is a complex tapestry woven from the themes of your Year Lord (${translatedYearLord}), the personal focus of the Muntha in ${translatedMunthaSign} (house ${muntha?.house}), and the outlook of the annual ascendant (${translatedAscendantRashi}). Your success depends on navigating the specific planetary periods (Mudda Dasha) effectively. Pay close attention to the strongest planets, as they hold the key to unlocking opportunities and managing challenges. Your primary focus should be on harmonizing the energies of the houses highlighted by the Year Lord and the Muntha. `
        },
        hi: {
            predictionForYear: `### वर्षफल भविष्यवाणी: {varshphalYear}\n\n`,
            yearLordTheme: `आपके वर्ष का केंद्रीय विषय वर्ष के स्वामी (वर्षेश्वर) द्वारा आकार दिया गया है, जो **{yearLord}** है। `,
            yearLordBenefic: `एक नैसर्गिक शुभ ग्रह के रूप में, {yearLord} विकास, अवसरों और सकारात्मक विकास पर केंद्रित एक वर्ष का संकेत देता है। `,
            yearLordMalefic: `एक नैसर्गिक पापी ग्रह के रूप में, {yearLord} चुनौतियों, जिम्मेदारियों और कड़ी मेहनत के एक वर्ष की ओर इशारा करता है जहाँ अनुशासन महत्वपूर्ण होगा। `,
            yearLordPlacement: (house) => `इसका ${house}वें घर में स्थान इस ऊर्जा को **${houseThemes_hi[house]}** के मामलों की ओर निर्देशित करता है। `,
            munthaFocus: `\n\nवर्ष के लिए आपका व्यक्तिगत ध्यान, मुंथा द्वारा दर्शाया गया है, **{munthaSign}** में है, जो **{munthaHouse}** वें घर में पड़ता है। `,
            munthaHouseFocus: (house) => `यह आपके व्यक्तिगत प्रयासों और ध्यान को सीधे इस घर के विषयों पर लाता है: **${houseThemes_hi[house]}**। `,
            ascendantFocus: `\n\nवार्षिक चार्ट का लग्न **{ascendantRashi}** है, जिसका स्वामी **{ascendantRashiLord}** है। यह आपके दृष्टिकोण को प्रभावित करता है, इस वर्ष आपकी व्यक्तिगत अभिव्यक्ति और दृष्टिकोण पर **${houseThemes_hi[1]}** के विषयों पर ध्यान केंद्रित करता है। `,
            strengthAndInfluence: `\n\n#### ग्रहों की शक्ति और मुख्य प्रभाव\n`,
            strongestPlanetUPBS: (planet) => `इस वर्ष समग्र शक्ति (UPBS) में सबसे मजबूत ग्रह **${planet}** है। इस ग्रह का वर्ष की घटनाओं पर एक महत्वपूर्ण और अक्सर निर्णायक प्रभाव पड़ेगा। इसकी स्थिति और इसके द्वारा शासित घर प्रमुख गतिविधि के क्षेत्र होंगे।`,
            strongestPlanetShadbala: (planet) => `षडबल (छह गुना शक्ति) के आधार पर, सबसे मजबूत ग्रह **${planet}** है, जो सकारात्मक या नकारात्मक दोनों तरह के शक्तिशाली परिणाम देने की अपनी क्षमता को दर्शाता है।`,
            detailedAnalysis: "\n\n--- \n\n### विस्तृत विश्लेषण\n",
            yearLordDignity: (dignity) => `वर्ष का स्वामी, {yearLord}, **${dignity}** की स्थिति में है, जो परिणाम देने की उसकी क्षमता को प्रभावित करता है। `,
            munthaLordInteraction: (relation) => `मुंथा राशि के स्वामी का वर्ष के स्वामी के साथ **${relation}** संबंध है, जो बताता है कि आपके व्यक्तिगत प्रयास वर्ष के व्यापक विषयों के साथ कैसे संरेखित होंगे। `,
            muddaDashaSection: "\n\n#### मुद्रा दशा अवधि\nआपका वर्ष निम्नलिखित ग्रहों की अवधि (मुद्रा दशा) के माध्यम से सामने आएगा, प्रत्येक एक विशिष्ट ध्यान केंद्रित करेगा:\n",
            dashaPeriod: (lord, start, end) => `- **${lord} अवधि:** ${new Date(start).toLocaleDateString()} से ${new Date(end).toLocaleDateString()} तक\n`,
            kpSection: "\n\n#### केपी सिग्निफिकेटर्स अंतर्दृष्टि\n",
            kpCuspSignificators: (cusp, sigs) => `**भाव ${cusp} (${houseThemes_hi[cusp]}):** सिग्निफिकेटर्स ${sigs} हैं। यह इंगित करता है कि इस भाव के मामले इन ग्रहों से प्रभावित होंगे। `,
            kpPlanetSignificators: (planet, sigs) => `**${planet}:** भावों ${sigs} को दर्शाता है। यह ग्रह इन भावों से संबंधित घटनाओं में महत्वपूर्ण होगा। `,
            conclusion: `\n\n#### सारांश और सलाह\n`,
            simpleConclusion: (yearLord, yearLordHouse, munthaHouse) => `कुल मिलाकर, इस वर्ष आपको अपने वर्ष के स्वामी की महत्वाकांक्षी ऊर्जा को अपने मुंथा के व्यक्तिगत ध्यान के साथ एकीकृत करने की आवश्यकता है। इस वर्ष का अधिकतम लाभ उठाने के लिए, **${houseThemes_hi[yearLordHouse]}** से संबंधित गतिविधियों पर ध्यान केंद्रित करें, यह सुनिश्चित करते हुए कि वे **${houseThemes_hi[munthaHouse]}** के क्षेत्र में आपके व्यक्तिगत विकास की भी सेवा करते हैं। आपका सबसे मजबूत ग्रह, {strongestPlanet}, वर्ष की क्षमता को अनलॉक करने की कुंजी प्रदान करेगा।`,
            detailedConclusion: (translatedYearLord, translatedMunthaSign, translatedAscendantRashi) => `यह वर्ष आपके वर्ष के स्वामी (${translatedYearLord}), मुंथा के व्यक्तिगत ध्यान (${translatedMunthaSign} में) (भाव ${muntha?.house}), और वार्षिक लग्न (${translatedAscendantRashi}) के विषयों से बुना हुआ एक जटिल ताना-बाना है। आपकी सफलता विशिष्ट ग्रहों की अवधि ( मुद्रा दशा) को प्रभावी ढंग से नेविगेट करने पर निर्भर करती है। सबसे मजबूत ग्रहों पर पूरा ध्यान दें, क्योंकि वे अवसरों को अनलॉक करने और चुनौतियों का प्रबंधन करने की कुंजी रखते हैं। आपका प्राथमिक ध्यान वर्ष के स्वामी और मुंथा द्वारा उजागर किए गए भावों की ऊर्जाओं को सुसंगत बनाने पर होना चाहिए।`
        }
    };

    const phrases = P[lang] || P['en']; // Default to English
    const currentHouseThemes = lang === 'hi' ? houseThemes_hi : houseThemes_en;

    // Translation of dynamic variables for Varshphal
    const translatedYearLord = lang === 'hi' ? (planetNames_hi[yearLord] || yearLord) : yearLord;
    const translatedMunthaSign = lang === 'hi' ? (rashiNames_hi[muntha?.sign] || muntha?.sign) : muntha?.sign;
    const translatedAscendantRashi = lang === 'hi' ? (rashiNames_hi[ascendant?.rashi] || ascendant?.rashi) : ascendant?.rashi;
    const translatedAscendantLord = lang === 'hi' ? (planetNames_hi[ascendant?.rashiLord] || ascendant?.rashiLord) : ascendant?.rashiLord;
    
    // Determine strongest planet for UPBS (translated)
    let strongestUPBS = '';
    let translatedStrongestUPBS = '';
    if (upbsScores && Object.keys(upbsScores).length > 0) {
        strongestUPBS = Object.keys(upbsScores).reduce((a, b) => upbsScores[a] > upbsScores[b] ? a : b);
        translatedStrongestUPBS = lang === 'hi' ? (planetNames_hi[strongestUPBS] || strongestUPBS) : strongestUPBS;
    }

    // Determine strongest planet for Shadbala (translated)
    let strongestShadbala = '';
    let translatedStrongestShadbala = '';
    if (shadbala?.shadbalaRank && shadbala.shadbalaRank.length > 0) {
        strongestShadbala = shadbala.shadbalaRank[0].planet;
        translatedStrongestShadbala = lang === 'hi' ? (planetNames_hi[strongestShadbala] || strongestShadbala) : strongestShadbala;
    }


    if (style === 'simple') {
        let parts = [];
        parts.push(phrases.predictionForYear.replace('{varshphalYear}', varshphalYear));

        if (yearLord) {
            parts.push(phrases.yearLordTheme.replace('{yearLord}', translatedYearLord));
            const planetTone = (planet) => ['Jupiter', 'Venus', 'Mercury', 'Moon'].includes(planet) ? 'benefic' : 'malefic';
            parts.push(planetTone(yearLord) === 'benefic' ? phrases.yearLordBenefic.replace('{yearLord}', translatedYearLord) : phrases.yearLordMalefic.replace('{yearLord}', translatedYearLord));
            if (planetHousePlacements?.[yearLord]) {
                parts.push(phrases.yearLordPlacement(planetHousePlacements[yearLord]));
            }
        }
        if (muntha) {
            parts.push(phrases.munthaFocus.replace('{munthaSign}', translatedMunthaSign).replace('{munthaHouse}', muntha.house));
            parts.push(phrases.munthaHouseFocus(muntha.house));
        }
        if (ascendant) {
            parts.push(phrases.ascendantFocus.replace('{ascendantRashi}', translatedAscendantRashi).replace('{ascendantRashiLord}', translatedAscendantLord));
        }
        
        if (upbsScores && Object.keys(upbsScores).length > 0) {
            parts.push(phrases.strengthAndInfluence);
            parts.push(phrases.strongestPlanetUPBS(translatedStrongestUPBS));
        }

        parts.push(phrases.conclusion);
        if (planetHousePlacements?.[yearLord] && muntha) {
            parts.push(phrases.simpleConclusion(translatedYearLord, planetHousePlacements[yearLord], muntha.house).replace('{strongestPlanet}', translatedStrongestUPBS));
        }
        return parts.join('');
    }

    // --- Detailed Elaboration ---
    let parts = [];
    parts.push(phrases.predictionForYear.replace('{varshphalYear}', varshphalYear));
    parts.push(phrases.detailedAnalysis);

    // Integrate basic info into detailed analysis
    if (yearLord) {
        parts.push(phrases.yearLordTheme.replace('{yearLord}', translatedYearLord));
        const planetTone = (planet) => ['Jupiter', 'Venus', 'Mercury', 'Moon'].includes(planet) ? 'benefic' : 'malefic';
        parts.push(planetTone(yearLord) === 'benefic' ? phrases.yearLordBenefic.replace('{yearLord}', translatedYearLord) : phrases.yearLordMalefic.replace('{yearLord}', translatedYearLord));
        if (planetHousePlacements?.[yearLord]) {
            parts.push(phrases.yearLordPlacement(planetHousePlacements[yearLord]));
        }
    }
    if (muntha) {
        parts.push(phrases.munthaFocus.replace('{munthaSign}', translatedMunthaSign).replace('{munthaHouse}', muntha.house));
        parts.push(phrases.munthaHouseFocus(muntha.house));
    }
    if (ascendant) {
        parts.push(phrases.ascendantFocus.replace('{ascendantRashi}', translatedAscendantRashi).replace('{ascendantRashiLord}', translatedAscendantLord));
    }


    // Planetary Strengths
    parts.push(phrases.strengthAndInfluence);
    if (upbsScores && Object.keys(upbsScores).length > 0) {
        parts.push(phrases.strongestPlanetUPBS(translatedStrongestUPBS));
    }
    if (shadbala?.shadbalaRank && shadbala.shadbalaRank.length > 0) {
        parts.push(phrases.strongestPlanetShadbala(translatedStrongestShadbala));
    }
    
    // Mudda Dasha
    if (muddaDasha && muddaDasha.length > 0) {
        parts.push(phrases.muddaDashaSection);
        muddaDasha.slice(0, 5).forEach(dasha => { // Limit to first 5 for brevity
            const translatedDashaLord = lang === 'hi' ? (planetNames_hi[dasha.lord] || dasha.lord) : dasha.lord;
            parts.push(phrases.dashaPeriod(translatedDashaLord, dasha.start, dasha.end));
        });
    }

    // KP Significators
    if (kpSignificators) {
        parts.push(phrases.kpSection);
        // Cusp Significators
        if (kpSignificators.cusps) {
            Object.entries(kpSignificators.cusps).slice(0, 5).forEach(([cusp, sigs]) => {
                const translatedSigs = sigs.map(sig => lang === 'hi' ? (planetNames_hi[sig] || sig) : sig);
                 parts.push(phrases.kpCuspSignificators(cusp, translatedSigs.join(', ')));
            });
        }
         // Planet Significators
        if (kpSignificators.planets) {
            Object.entries(kpSignificators.planets).slice(0, 5).forEach(([planet, sigs]) => {
                const translatedPlanet = lang === 'hi' ? (planetNames_hi[planet] || planet) : planet;
                 parts.push(phrases.kpPlanetSignificators(translatedPlanet, sigs.join(', ')));
            });
        }
    }
    
    // Conclusion
    parts.push(phrases.conclusion);
    parts.push(phrases.detailedConclusion(translatedYearLord, translatedMunthaSign, translatedAscendantRashi));

    return parts.join('');
}