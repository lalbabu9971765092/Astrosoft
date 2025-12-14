// server/utils/predictionTextGenerator.js

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


// ---------------------------------------------------------
//  FULL COMBINED PREDICTION GENERATOR (Lagna, Rashi, Nakshatra)
// ---------------------------------------------------------

export function getCombinedPredictionLong(lagna, rashi, nakshatra, lang = 'en') {
    // Inlined functions getLagnaTraitsLong and getRashiTraitsLong to ensure scope
    const lagnaTraits_en = {
        Aries: "As an Aries Lagna native, you approach life with a fiery temperament, strong initiative, and a pioneering instinct. You naturally push forward into new experiences, rarely waiting for others to show the way. Challenges excite you rather than discourage you, and you thrive in situations requiring courage, quick decision-making, and bold action. Your personality radiates confidence and straightforwardness, though you may occasionally struggle with impatience or impulsive reactions.",
        Taurus: "With Taurus rising, stability, perseverance, and practicality form the foundation of your personality. You prefer to build life step by step, valuing security, comfort, and tangible progress. Your temperament is generally calm, grounded, and determined, though once you decide something, you rarely change your mind. You are naturally drawn toward beauty, resources, and long-lasting structures, and you exude a steady aura that others often find dependable.",
        Gemini: "Gemini Lagna blesses you with a flexible, curious, and talkative personality. Mental stimulation drives you, and you constantly seek new ideas, connections, and perspectives. You adapt quickly to changing situations, learn fast, and enjoy sharing knowledge with others. Though sometimes scattered or overthinking, your intellectual agility and communication skills are your greatest strengths.",
        Cancer: "Cancer Lagna gives you a nurturing, intuitive, and emotionally aware outer personality. You are deeply sensitive to your environment and the needs of others, often acting as a natural protector or caretaker. Family, roots, and personal security matter greatly to you. Though you may withdraw during emotional turbulence, you possess incredible inner strength and empathy.",
        Leo: "Leo Lagna brings a charismatic, expressive, and confident presence. You naturally gravitate toward leadership roles and appreciate recognition for your efforts. Your personality radiates warmth, creativity, and strong willpower. Though pride can sometimes overshadow flexibility, your generous heart and desire to uplift others make you a powerful and inspiring individual.",
        Virgo: "With Virgo rising, you move through life with precision, logic, discipline, and an analytical mindset. You observe details others overlook, and you strive for improvement in everything you do. Practical, intelligent, and health-conscious, you prefer structure and tend to be self-critical when things don’t align with your high standards.",
        Libra: "Libra Lagna gives you a graceful, balanced, and diplomatic personality. You naturally seek harmony in relationships and environments, and you excel at mediation, fairness, and aesthetic appreciation. You dislike conflict and conflict and are gifted at understanding both sides of a situation, though indecision can arise when choices seem equally appealing.",
        Scorpio: "Scorpio Lagna creates a powerful, intense, secretive, and deeply insightful personality. Your presence is magnetic, and your emotional depth is unmatched. You rarely reveal your true thoughts easily and possess strong resilience in crisis. Transformative experiences shape your life, giving you extraordinary strength and the ability to rise from challenges.",
        Sagittarius: "Sagittarius rising gives you an optimistic, adventurous, and knowledge-seeking personality. You value freedom, higher learning, and exploring broader perspectives—whether through travel, philosophy, or personal growth. Your spirit is open and enthusiastic, though you may struggle with restlessness or bluntness.",
        Capricorn: "Capricorn Lagna makes you disciplined, realistic, hardworking, and focused on long-term achievement. You approach life with seriousness and responsibility, and you mature faster than others. Though emotionally reserved at times, your ability to persevere through difficulties and build a stable future is exceptional.",
        Aquarius: "With Aquarius rising, your personality blends originality, intelligence, independence, and humanitarian concern. You think in unconventional ways and often detach emotionally to analyze situations objectively. Innovation, reform, and progressive ideas shape your worldview, and you value freedom above all.",
        Pisces: "Pisces Lagna gives you a gentle, imaginative, intuitive, and spiritually inclined personality. You perceive the world through emotion and symbolism rather than logic alone. Compassion and creativity flow naturally through you, though boundaries may become blurred when you absorb others’ feelings too deeply."
    };

    const lagnaTraits_hi = {
        Aries: "मेष लग्न के जातक के तौर पर, आप जीवन में जोशीले स्वभाव, मज़बूत पहल और अग्रणी प्रवृत्ति के साथ आगे बढ़ते हैं। आप स्वाभाविक रूप से नए अनुभवों की ओर बढ़ते हैं, शायद ही कभी दूसरों का रास्ता दिखाने का इंतज़ार करते हैं। चुनौतियाँ आपको हतोत्साहित करने के बजाय उत्साहित करती हैं, और आप ऐसे हालात में कामयाब होते हैं जिनमें हिम्मत, तेज़ी से फ़ैसले लेने और साहसिक कार्रवाई की ज़रूरत होती है। आपकी पर्सनैलिटी में आत्मविश्वास और साफ़गोई झलकती है, हालाँकि कभी-कभी आपको अधीरता या जल्दबाज़ी वाली प्रतिक्रियाओं से जूझना पड़ सकता है।",
        Taurus: "वृषभ लग्न के साथ, स्थिरता, दृढ़ता और व्यावहारिकता आपकी पर्सनैलिटी की नींव बनाते हैं। आप जीवन को कदम-दर-कदम बनाना पसंद करते हैं, सुरक्षा, आराम और ठोस प्रगति को महत्व देते हैं। आपका स्वभाव आम तौर पर शांत, ज़मीन से जुड़ा और दृढ़ होता है, हालाँकि एक बार जब आप कुछ तय कर लेते हैं, तो शायद ही कभी अपना मन बदलते हैं। आप स्वाभाविक रूप से सुंदरता, संसाधनों और लंबे समय तक चलने वाली चीज़ों की ओर आकर्षित होते हैं, और आपमें एक स्थिर आभा होती है जिसे दूसरे अक्सर भरोसेमंद पाते हैं।",
        Gemini: "मिथुन लग्न आपको एक लचीली, जिज्ञासु और बातूनी पर्सनैलिटी देता है। मानसिक उत्तेजना आपको प्रेरित करती है, और आप लगातार नए विचारों, कनेक्शनों और दृष्टिकोणों की तलाश में रहते हैं। आप बदलती परिस्थितियों में तेज़ी से ढल जाते हैं, जल्दी सीखते हैं, और दूसरों के साथ ज्ञान साझा करने का आनंद लेते हैं। हालाँकि कभी-कभी बिखरे हुए या ज़्यादा सोचने वाले होते हैं, आपकी बौद्धिक चपलता और संचार कौशल आपकी सबसे बड़ी ताकत हैं।",
        Cancer: "कर्क लग्न आपको एक पालन-पोषण करने वाली, सहज और भावनात्मक रूप से जागरूक बाहरी पर्सनैलिटी देता है। आप अपने आस-पास के माहौल और दूसरों की ज़रूरतों के प्रति बहुत संवेदनशील होते हैं, अक्सर एक स्वाभाविक रक्षक या देखभाल करने वाले के रूप में काम करते हैं। परिवार, जड़ें और व्यक्तिगत सुरक्षा आपके लिए बहुत मायने रखती है। हालाँकि आप भावनात्मक उथल-पुथल के दौरान पीछे हट सकते हैं, आपमें अविश्वसनीय आंतरिक शक्ति और सहानुभूति होती है।",
        Leo: "सिंह लग्न एक करिश्माई, अभिव्यंजक और आत्मविश्वासी उपस्थिति लाता है। आप स्वाभाविक रूप से नेतृत्व की भूमिकाओं की ओर आकर्षित होते हैं और अपने प्रयासों के लिए पहचान की सराहना करते हैं। आपकी पर्सनैलिटी में गर्मजोशी, रचनात्मकता और मज़बूत इच्छाशक्ति झलकती है। हालाँकि कभी-कभी घमंड लचीलेपन पर हावी हो सकता है, आपका उदार दिल और दूसरों को ऊपर उठाने की इच्छा आपको एक शक्तिशाली और प्रेरणादायक व्यक्ति बनाती है।",
        Virgo: "कन्या लग्न के साथ, आप जीवन में सटीकता, तर्क, अनुशासन और विश्लेषणात्मक सोच के साथ आगे बढ़ते हैं। आप उन विवरणों पर ध्यान देते हैं जिन्हें दूसरे नज़रअंदाज़ कर देते हैं, और आप जो कुछ भी करते हैं उसमें सुधार के लिए प्रयास करते हैं। व्यावहारिक, बुद्धिमान और स्वास्थ्य के प्रति जागरूक, आप संरचना पसंद करते हैं और जब चीजें आपके उच्च मानकों के अनुरूप नहीं होती हैं तो आप आत्म-आलोचनात्मक हो जाते हैं।",
        Libra: "तुला लग्न आपको एक सुंदर, संतुलित और कूटनीतिक पर्सनैलिटी देता है। आप स्वाभाविक रूप से रिश्तों और माहौल में सद्भाव चाहते हैं, और आप मध्यस्थता में माहिर होते हैं, निष्पक्षता और सौंदर्य की सराहना। आपको टकराव पसंद नहीं है और आप किसी भी स्थिति के दोनों पक्षों को समझने में माहिर हैं, हालांकि जब विकल्प समान रूप से आकर्षक लगते हैं तो अनिर्णय की स्थिति पैदा हो सकती है।",
        Scorpio: "वृश्चिक लग्न एक शक्तिशाली, तीव्र, रहस्यमयी और गहरी समझ वाली पर्सनैलिटी बनाता है। आपकी उपस्थिति चुंबकीय है, और आपकी भावनात्मक गहराई बेजोड़ है। आप शायद ही कभी अपने सच्चे विचार आसानी से प्रकट करते हैं और संकट में मजबूत लचीलापन रखते हैं। परिवर्तनकारी अनुभव आपके जीवन को आकार देते हैं, जिससे आपको असाधारण शक्ति और चुनौतियों से उबरने की क्षमता मिलती है।",
        Sagittarius: "धनु लग्न आपको एक आशावादी, साहसी और ज्ञान की तलाश करने वाली पर्सनैलिटी देता है। आप स्वतंत्रता, उच्च शिक्षा और व्यापक दृष्टिकोणों की खोज को महत्व देते हैं - चाहे वह यात्रा, दर्शन या व्यक्तिगत विकास के माध्यम से हो। आपकी भावना खुली और उत्साही है, हालांकि आप बेचैनी या स्पष्टवादिता से जूझ सकते है।",
        Capricorn: "मकर लग्न आपको अनुशासित, यथार्थवादी, मेहनती और दीर्घकालिक उपलब्धि पर केंद्रित बनाता है। आप जीवन को गंभीरता और जिम्मेदारी से देखते हैं, और आप दूसरों की तुलना में तेजी से परिपक्व होते हैं। हालांकि कभी-कभी भावनात्मक रूप से आरक्षित रहते हैं, लेकिन कठिनाइयों से जूझने और एक स्थिर भविष्य बनाने की आपकी क्षमता असाधारण है।",
        Aquarius: "कुंभ लग्न के साथ, आपकी पर्सनैलिटी में मौलिकता, बुद्धिमत्ता, स्वतंत्रता और मानवीय चिंता का मिश्रण होता है। आप अपरंपरागत तरीकों से सोचते हैं और स्थितियों का निष्पक्ष रूप से विश्लेषण करने के लिए अक्सर भावनात्मक रूप से अलग हो जाते हैं। नवाचार, सुधार और प्रगतिशील विचार आपके विश्वदृश्यों को आकार देते हैं, और आप स्वतंत्रता को सबसे ऊपर महत्व देते हैं।",
        Pisces: "मीन राशि में चंद्रमा गहरी संवेदनशीलता, करुणा, कल्पना और मानसिक ग्रहणशीलता देता है। आप भावनाओं को गहराई से महसूस करते हैं और दूसरों के मूड के साथ बहुत आसानी से घुल-मिल सकते हैं।"
    };

    const rashiTraits_en = {
        Aries: "With Aries Moon, your emotional responses are quick, passionate, and honest. You dislike emotional stagnation and prefer direct communication of feelings. Though you may become impatient or reactive, your emotional courage helps you face challenges head-on.",
        Taurus: "A Taurus Moon gives you a calm, steady emotional nature. You seek peace, predictability, and long-term comfort. Sudden emotional changes unsettle you, and you prefer relationships that feel secure and consistent.",
        Gemini: "Moon in Gemini makes your emotions tied to intellect and communication. You express feelings through words rather than intensity, and your mind rarely rests. Curiosity and adaptability shape your emotional world, though restlessness can challenge stability.",
        Cancer: "With Moon in Cancer, you experience emotions deeply and intuitively. Family bonds, memory, and home strongly influence your emotional wellbeing. You nurture others naturally but are sensitive to criticism or abandonment.",
        Leo: "Leo Moon gives you a dramatic, warm, expressive emotional nature. You feel happiest when appreciated or admired and seek emotional connection that validates your inner dignity and pride.",
        Virgo: "Moon in Virgo makes your emotions analytical, thoughtful, and practical. You seek order, clarity, and meaningful service. Emotional expression may be restrained, but your care shows through helpful actions.",
        Libra: "Moon in Libra gives you a need for balance, harmony, and fairness in emotional life. You dislike conflict and seek relationships that feel cooperative, aesthetically pleasant, and mentally aligned.",
        Scorpio: "Scorpio Moon creates powerful, intense, transformative emotions. You experience loyalty deeply and form strong attachments. Emotional betrayal or secrets can trigger profound internal reactions.",
        Sagittarius: "Moon in Sagittarius brings optimism, enthusiasm, and the need for freedom. You dislike emotional confinement and thrive on honesty, open communication, and intellectual stimulation.",
        Capricorn: "Capricorn Moon gives emotional discipline and restraint. You express feelings carefully, preferring control and stability over spontaneity. Responsibility shapes your emotional identity.",
        Aquarius: "Moon in Aquarius gives you a detached, intellectualized emotional style. You value logic over sentiment and prefer friendships, ideas, and causes that align with your principles.",
        Pisces: "Pisces Moon gives deep sensitivity, compassion, imagination, and psychic receptivity. You feel emotions profoundly and may merge too easily with others’ moods."
    };

    const rashiTraits_hi = {
        Aries: "मेष राशि में चंद्रमा होने पर, आपकी भावनात्मक प्रतिक्रियाएँ तेज़, जोशीली और ईमानदार होती हैं। आपको भावनात्मक ठहराव पसंद नहीं है और आप भावनाओं का सीधा संचार पसंद करते हैं। हालाँकि आप अधीर या प्रतिक्रियाशील हो सकते हैं, आपका भावनात्मक साहस आपको चुनौतियों का सामना करने में मदद करता है।",
        Taurus: "वृषभ राशि में चंद्रमा आपको शांत, स्थिर भावनात्मक स्वभाव देता है। आप शांति, पूर्वानुमान और लंबे समय तक आराम चाहते हैं। अचानक भावनात्मक बदलाव आपको परेशान करते हैं, और आप ऐसे रिश्ते पसंद करते हैं जो सुरक्षित और सुसंगत महसूस हों।",
        Gemini: "मिथुन राशि में चंद्रमा आपकी भावनाओं को बुद्धि और संचार से जोड़ता है। आप भावनाओं को तीव्रता के बजाय शब्दों के माध्यम से व्यक्त करते हैं, और आपका मन शायद ही कभी आराम करता है। जिज्ञासा और अनुकूलनशीलता आपकी भावनात्मक दुनिया को आकार देती है, हालाँकि बेचैनी स्थिरता को चुनौती दे सकती है।",
        Cancer: "कर्क राशि में चंद्रमा होने पर, आप भावनाओं को गहराई से और सहज रूप से अनुभव करते हैं। पारिवारिक बंधन, यादें और घर आपके भावनात्मक कल्याण को बहुत प्रभावित करते हैं। आप स्वाभाविक रूप से दूसरों का पोषण करते हैं लेकिन आलोचना या परित्याग के प्रति संवेदनशील होते हैं।",
        Leo: "सिंह राशि में चंद्रमा आपको एक नाटकीय, गर्म, अभिव्यंजक भावनात्मक स्वभाव देता है। जब आपकी सराहना या प्रशंसा की जाती है तो आप सबसे ज़्यादा खुश महसूस करते हैं और ऐसे भावनात्मक संबंध चाहते हैं जो आपकी आंतरिक गरिमा और गौरव को मान्य करें।",
        Virgo: "कन्या राशि में चंद्रमा आपकी भावनाओं को विश्लेषणात्मक, विचारशील और व्यावहारिक बनाता है। आप व्यवस्था, स्पष्टता और सार्थक सेवा चाहते हैं। भावनात्मक अभिव्यक्ति संयमित हो सकती है, लेकिन आपकी देखभाल मददगार कार्यों से दिखती है।",
        Libra: "तुला राशि में चंद्रमा आपको भावनात्मक जीवन में संतुलन, सद्भाव और निष्पक्षता की आवश्यकता देता है। आपको संघर्ष पसंद नहीं है और आप ऐसे रिश्ते चाहते हैं जो सहयोगात्मक, सौंदर्य की दृष्टि से सुखद और मानसिक रूप से संरेखित हों।",
        Scorpio: "वृश्चिक राशि में चंद्रमा शक्तिशाली, तीव्र, रहस्यमयी और गहरी समझ वाली पर्सनैलिटी बनाता है। आपकी उपस्थिति चुंबकीय है, और आपकी भावनात्मक गहराई बेजोड़ है। आप शायद ही कभी अपने सच्चे विचार आसानी से प्रकट करते हैं और संकट में मजबूत लचीलापन रखते हैं। परिवर्तनकारी अनुभव आपके जीवन को आकार देते हैं, जिससे आपको असाधारण शक्ति और चुनौतियों से उबरने की क्षमता मिलती है।",
        Sagittarius: "धनु राशि में चंद्रमा आशावाद, उत्साह और स्वतंत्रता की आवश्यकता लाता है। आपको भावनात्मक बंधन पसंद नहीं है और आप ईमानदारी, खुले संचार और बौद्धिक उत्तेजना पर पनपते हैं।",
        Capricorn: "मकर राशि में चंद्रमा भावनात्मक अनुशासन और संयम देता है। आप भावनाओं को सावधानी से व्यक्त करते हैं, सहजता के बजाय नियंत्रण और स्थिरता को प्राथमिकता देते हैं। ज़िम्मेदारी आपकी भावनात्मक पहचान को आकार देती है।",
        Aquarius: "कुंभ राशि में चंद्रमा आपको एक अलग, बौद्धिक भावनात्मक शैली देता है। आप भावना से ज़्यादा तर्क को महत्व देते हैं और ऐसी दोस्ती, विचार और कारण पसंद करते हैं जो आपके सिद्धांतों के अनुरूप हों।",
        Pisces: "मीन राशि में चंद्रमा गहरी संवेदनशीलता, करुणा, कल्पना और मानसिक ग्रहणशीलता देता है। आप भावनाओं को गहराई से महसूस करते हैं और दूसरों के मूड के साथ बहुत आसानी से घुल-मिल सकते हैं।"
    };

    const nakshatraTraits = lang === 'hi' ? nakshatraTraitsLong_hi : nakshatraTraitsLong_en;

    const L = (lang === 'hi' ? lagnaTraits_hi[lagna] : lagnaTraits_en[lagna]) || "";
    const R = (lang === 'hi' ? rashiTraits_hi[rashi] : rashiTraits_en[rashi]) || "";
    const N = nakshatraTraits[nakshatra] || "";

    // Define language-specific phrases for the template
    const generalPhrases = {
        en: {
            yourChartCombines: "Your chart combines the qualities of your",
            lagna: "Lagna",
            rashi: "Rashi",
            nakshatra: "Nakshatra",
            and: "and",
            creatingProfile: ", creating a deeply layered personality profile.",
            asALagnaAscendant: "As a",
            outerBehavior: "ascendant, your outer behavior, approach to life, and first instincts are shaped by the following tendencies:",
            emotionallyAndMentally: "Emotionally and mentally, your Moon sign in",
            influencesHowYou: "influences how you process experiences, form bonds, and respond to your inner world. This gives you the following emotional nature:",
            atADeeperKarmic: "At a deeper karmic and spiritual level, your birth in the",
            infusesYourInstincts: "Nakshatra infuses your instincts, subconscious drives, and soul journey with the following qualities:",
            whenTheseThree: "When these three forces blend, they create a unique harmony between your external personality, your internal emotional life, and your spiritual foundation. This combination reveals how you behave in the world, how you feel within, and what your soul seeks across your life path. This integrated pattern shapes your natural strengths, challenges, relationships, decisions, and long-term destiny.",
        },
        hi: {
            yourChartCombines: "आपकी कुंडली आपके",
            lagna: "लग्न",
            rashi: "राशि",
            nakshatra: "नक्षत्र",
            and: "और",
            creatingProfile: " के गुणों को जोड़ती है, जिससे एक गहरा, बहुस्तरीय व्यक्तित्व प्रोफ़ाइल बनता है।",
            asALagnaAscendant: "एक",
            outerBehavior: "लग्न के जातक के रूप में, आपका बाहरी व्यवहार, जीवन के प्रति दृष्टिकोण, और पहली प्रवृत्तियां निम्नलिखित झुकावों से आकार लेती हैं:",
            emotionallyAndMentally: "भावनात्मक और मानसिक रूप से, आपकी चंद्र राशि",
            influencesHowYou: "में यह प्रभावित करती है कि आप अनुभवों को कैसे संसाधित करते हैं, बंधन कैसे बनाते हैं, और अपनी आंतरिक दुनिया पर कैसे प्रतिक्रिया करते हैं। यह आपको निम्नलिखित भावनात्मक प्रकृति देता है:",
            atADeeperKarmic: "गहरे कर्मिक और आध्यात्मिक स्तर पर, आपका जन्म",
            infusesYourInstincts: "नक्षत्र में आपकी प्रवृत्तियों, अवचेतन इच्छाओं और आत्मा की यात्रा को निम्नलिखित गुणों से भर देता है:",
            whenTheseThree: "जब ये तीनों शक्तियां मिलती हैं, तो वे आपके बाहरी व्यक्तित्व, आपके आंतरिक भावनात्मक जीवन और आपकी आध्यात्मिक नींव के बीच एक अनूठा सामंजस्य बनाती हैं। यह संयोजन बताता है कि आप दुनिया में कैसे व्यवहार करते हैं, आप भीतर से कैसा महसूस करते हैं, और आपकी आत्मा अपने जीवन पथ पर क्या खोजती है। यह एकीकृत पैटर्न आपकी प्राकृतिक शक्तियों, चुनौतियों, रिश्तों, निर्णयों और दीर्घकालिक नियति को आकार देता है।",
        }
    };

    const p = generalPhrases[lang];

    const translatedLagnaGeneral = (lang === 'hi' ? rashiNames_hi[lagna] : lagna) || lagna; // Translate Lagna name
    const translatedRashiGeneral = (lang === 'hi' ? rashiNames_hi[rashi] : rashi) || rashi; // Translate Rashi name
    const translatedNakshatraGeneral = (lang === 'hi' ? nakshatraTraitsLong_hi[nakshatra] : nakshatra) || nakshatra; // Translate Nakshatra name

    return `
${p.yourChartCombines} ${translatedLagnaGeneral} ${p.lagna}, ${translatedRashiGeneral} ${p.rashi}, ${p.and} ${translatedNakshatraGeneral} ${p.nakshatra}${p.creatingProfile} 
${p.asALagnaAscendant} ${translatedLagnaGeneral} ${p.outerBehavior} ${L} 
${p.emotionallyAndMentally} ${translatedRashiGeneral} ${p.influencesHowYou} ${R} 
${p.atADeeperKarmic} ${translatedNakshatraGeneral} ${p.infusesYourInstincts} ${N} 
${p.whenTheseThree}
`.trim();
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
            strongestPlanetUPBS: (planet) => `The planet with the highest overall strength (UPBS) this year is **{planet}**. This planet will have a significant and often decisive influence on the year's events. Its placement and the houses it rules will be areas of major activity.`,
            strongestPlanetShadbala: (planet) => `Based on Shadbala (six-fold strength), the strongest planet is **{planet}**, indicating its capacity to deliver powerful results, whether positive or negative. `,
            detailedAnalysis: "\n\n--- \n\n### Detailed Analysis\n",
            yearLordDignity: (dignity) => `The Year Lord, {yearLord}, is in a state of **${dignity}**, which affects its ability to deliver results. `,
            munthaLordInteraction: (relation) => `The lord of the Muntha sign has a **${relation}** relationship with the Year Lord, suggesting how your personal efforts will align with the year's broader themes. `,
            muddaDashaSection: "\n\n#### Mudda Dasha Periods\nYour year will unfold through the following planetary periods (Mudda Dasha), each bringing a specific focus:\n",
            dashaPeriod: (lord, start, end) => `- **${lord} period:** from ${new Date(start).toLocaleDateString()} to ${new Date(end).toLocaleDateString()}\n`,
            kpSection: "\n\n#### KP Significators Insights\n",
            kpCuspSignificators: (cusp, sigs) => `**Cusp ${cusp} (${houseThemes_en[cusp]}):** Significators are ${sigs}. This indicates that matters of this house will be influenced by these planets. `,
            kpPlanetSignificators: (planet, sigs) => `**{planet}:** Signifies houses ${sigs}. This planet will be instrumental in events related to these houses. `,
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
            strongestPlanetUPBS: (planet) => `इस वर्ष समग्र शक्ति (UPBS) में सबसे मजबूत ग्रह **{planet}** है। इस ग्रह का वर्ष की घटनाओं पर एक महत्वपूर्ण और अक्सर निर्णायक प्रभाव पड़ेगा। इसकी स्थिति और इसके द्वारा शासित घर प्रमुख गतिविधि के क्षेत्र होंगे।`,
            strongestPlanetShadbala: (planet) => `षडबल (छह गुना शक्ति) के आधार पर, सबसे मजबूत ग्रह **{planet}** है, जो सकारात्मक या नकारात्मक दोनों तरह के शक्तिशाली परिणाम देने की अपनी क्षमता को दर्शाता है।`,
            detailedAnalysis: "\n\n--- \n\n### विस्तृत विश्लेषण\n",
            yearLordDignity: (dignity) => `वर्ष का स्वामी, {yearLord}, **${dignity}** की स्थिति में है, जो परिणाम देने की उसकी क्षमता को प्रभावित करता है। `,
            munthaLordInteraction: (relation) => `मुंथा राशि के स्वामी का वर्ष के स्वामी के साथ **${relation}** संबंध है, जो बताता है कि आपके व्यक्तिगत प्रयास वर्ष के व्यापक विषयों के साथ कैसे संरेखित होंगे। `,
            muddaDashaSection: "\n\n#### मुद्रा दशा अवधि\nआपका वर्ष निम्नलिखित ग्रहों की अवधि (मुद्रा दशा) के माध्यम से सामने आएगा, प्रत्येक एक विशिष्ट ध्यान केंद्रित करेगा:\n",
            dashaPeriod: (lord, start, end) => `- **${lord} अवधि:** ${new Date(start).toLocaleDateString()} से ${new Date(end).toLocaleDateString()} तक\n`,
            kpSection: "\n\n#### केपी सिग्निफिकेटर्स अंतर्दृष्टि\n",
            kpCuspSignificators: (cusp, sigs) => `**भाव ${cusp} (${houseThemes_hi[cusp]}):** सिग्निफिकेटर्स ${sigs} हैं। यह इंगित करता है कि इस भाव के मामले इन ग्रहों से प्रभावित होंगे। `,
            kpPlanetSignificators: (planet, sigs) => `**{planet}:** भावों ${sigs} को दर्शाता है। यह ग्रह इन भावों से संबंधित घटनाओं में महत्वपूर्ण होगा। `,
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
