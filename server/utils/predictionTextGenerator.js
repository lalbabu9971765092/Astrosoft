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

const nakshatraNames_hi = {
    Ashwini: "अश्विनी",
    Bharani: "भरणी",
    Krittika: "कृत्तिका",
    Rohini: "रोहिणी",
    Mrigashira: "मृगशिरा",
    Ardra: "आर्द्रा",
    Punarvasu: "पुनर्वसु",
    Pushya: "पुष्य",
    Ashlesha: "आश्लेषा",
    Magha: "मघा",
    PurvaPhalguni: "पूर्वा फाल्गुनी",
    UttaraPhalguni: "उत्तरा फाल्गुनी",
    Hasta: "हस्त",
    Chitra: "चित्रा",
    Swati: "स्वाति",
    Vishakha: "विशाखा",
    Anuradha: "अनुराधा",
    Jyeshtha: "ज्येष्ठा",
    Mula: "मूल",
    PurvaAshadha: "पूर्वाषाढ़ा",
    UttaraAshadha: "उत्तराषाढ़ा",
    Shravana: "श्रवण",
    Dhanishta: "धनिष्ठा",
    Shatabhisha: "शतभिषा",
    PurvaBhadrapada: "पूर्व भाद्रपद",
    UttaraBhadrapada: "उत्तर भाद्रपद",
    Revati: "रेवती"
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
const planetInHouse_hi = {
    Sun: [
        "सूर्य पहले घर में आपके आत्म-भाव को बढ़ाता है, नेतृत्व, जीवन शक्ति और मान्यता की तीव्र इच्छा प्रदान करता है। आपकी उपस्थिति प्रभावशाली है लेकिन अहंकार से सावधान रहना चाहिए।",
        "दूसरे घर में सूर्य आपकी पहचान को धन, पारिवारिक विरासत और मूल्यों से जोड़ता है। आपकी आवाज शक्तिशाली हो सकती है और आप महत्वपूर्ण संपत्ति जमा करने पर ध्यान केंद्रित कर सकते हैं।",
        "तीसरे घर में सूर्य संचार में साहस, एक शक्तिशाली इच्छाशक्ति और अधिकार प्रदान करता है। आप आत्मविश्वास के साथ खुद को व्यक्त करते हैं और विपणन, लेखन या प्रदर्शन में उत्कृष्टता प्राप्त कर सकते हैं।",
        "चौथे घर में सूर्य आपका ध्यान घर, परिवार और भावनात्मक नींव पर रखता है। आप घरेलू जीवन में एक प्रमुख भूमिका निभा सकते हैं और एक प्रमुख घरेलू वातावरण की तलाश कर सकते हैं।",
        "पांचवें घर में सूर्य रचनात्मकता, बुद्धि और एक नाटकीय स्वभाव लाता है। आप रोमांस, प्रदर्शन और नेतृत्व के क्षेत्रों में चमकते हैं, और बच्चों के साथ आपका एक मजबूत संबंध है।",
        "छठे घर में सूर्य आपके दैनिक काम और सेवा में नेतृत्व करने की प्रेरणा को इंगित करता है। आप चुनौतियों पर काबू पाने में गर्व महसूस करते हैं और स्वास्थ्य सेवा या प्रशासन में एक शक्तिशाली व्यक्ति हो सकते हैं।",
        "सातवें घर में सूर्य आपके अहंकार और पहचान को साझेदारी में रखता है। आप एक प्रमुख साथी की तलाश करते हैं और अपने रिश्तों के माध्यम से खुद को परिभाषित कर सकते हैं, चाहे अच्छा हो या बुरा।",
        "आठवें घर में सूर्य रहस्यों, मनोविज्ञान और संयुक्त संसाधनों में एक शक्तिशाली रुचि देता है। आपके जीवन पथ में गहरे परिवर्तन और छिपी हुई शक्ति की गतिशीलता से निपटना शामिल है।",
        "नौवें घर में सूर्य आपकी पहचान को उच्च विश्वासों, ज्ञान और धर्म के साथ संरेखित करता है। आप एक प्राकृतिक शिक्षक या मार्गदर्शक हैं, और आपके पिता या गुरु महत्वपूर्ण व्यक्ति हो सकते हैं।",
        "दसवें घर में सूर्य करियर और सार्वजनिक मान्यता के लिए एक शक्तिशाली स्थान है। आप एक प्राकृतिक नेता हैं, जो आपके पेशे और समाज में एक दृश्यमान भूमिका के लिए नियत हैं।",
        "ग्यारहवें घर में सूर्य इंगित करता है कि आपकी पहचान आपके सामाजिक नेटवर्क, लक्ष्यों और लाभ से जुड़ी है। आप किसी बड़े संगठन या दोस्तों के समूह में एक नेता बन सकते हैं।",
        "बारहवें घर में सूर्य आपकी ऊर्जा को आध्यात्मिकता, आत्मनिरीक्षण और विदेशों की ओर निर्देशित करता है। आपके पथ में संस्थानों में सेवा या एकांत में अपनी पहचान खोजना शामिल हो सकता है।"
    ],
    Moon: [
        "पहले घर में चंद्रमा आपके व्यक्तित्व को गहरा भावनात्मक, सहज और ग्रहणशील बनाता है। आपकी पहचान तरल है, और आप अपने पर्यावरण और दूसरों के मूड के प्रति अत्यधिक संवेदनशील हैं।",
        "दूसरे घर में चंद्रमा आपकी भावनात्मक सुरक्षा को वित्तीय स्थिरता और पारिवारिक मूल्यों से जोड़ता है। आपकी आय में उतार-चढ़ाव हो सकता है, और आप अपनी संपत्ति का पोषण करने में आराम पाते हैं।",
        "तीसरे घर में चंद्रमा एक ऐसा मन बनाता है जो जिज्ञासु, मिलनसार और परिवर्तनशील होता है। आपके विचार आपकी भावनाओं से गहरे रूप से जुड़े होते हैं, जो आपको एक कल्पनाशील लेखक या वक्ता बनाते हैं।",
        "चौथे घर में चंद्रमा (अपने ही घर में) भावनात्मक खुशी के लिए अत्यंत मजबूत है। आपकी भलाई आपके घर, माँ और अपनेपन की भावना से गहराई से जुड़ी हुई है।",
        "पांचवें घर में चंद्रमा आपको भावनात्मक रूप से रचनात्मक और रोमांटिक बनाता है। आपका बच्चों के साथ एक पोषण करने वाला संबंध है और आप रचनात्मक आत्म-अभिव्यक्ति के माध्यम से भावनात्मक पूर्ति पाते हैं।",
        "छठे घर में चंद्रमा आपकी भावनाओं को आपके काम और दैनिक दिनचर्या से जोड़ता है। आपकी सेवा के प्रति एक पोषण करने वाला दृष्टिकोण हो सकता है लेकिन स्वास्थ्य और संघर्षों के बारे में चिंता करने की प्रवृत्ति हो सकती है।",
        "सातवें घर में चंद्रमा साझेदारी के माध्यम से भावनात्मक पूर्ति चाहता है। आपकी खुशी आपके महत्वपूर्ण दूसरे के साथ महसूस होने वाले सामंजस्य और संबंध पर बहुत निर्भर करती है।",
        "आठवें घर में चंद्रमा एक ऐसा मन देता है जो गहरा, सहज और रहस्यों की ओर आकर्षित होता है। आप गहन भावनात्मक परिवर्तनों का अनुभव करते हैं और आपके पास एक प्राकृतिक मानसिक क्षमता होती है।",
        "नौवें घर में चंद्रमा आपकी भावनाओं को आपके विश्वासों, उच्च शिक्षा और यात्रा से जोड़ता है। आप दर्शन, आध्यात्मिकता और विभिन्न संस्कृतियों की खोज के माध्यम से भावनात्मक शांति पाते हैं।",
        "दसवें घर में चंद्रमा आपकी भावनाओं को सार्वजनिक नजर में रखता है। आपका करियर जनता, देखभाल या भोजन से संबंधित हो सकता है, और आपकी प्रतिष्ठा उतार-चढ़ाव के अधीन है।",
        "ग्यारहवें घर में चंद्रमा दोस्ती, सामाजिक नेटवर्क और लक्ष्यों को प्राप्त करने के माध्यम से भावनात्मक संतुष्टि पाता है। आप अपने समुदाय और समूह की भागीदारी से पोषित होते हैं।",
        "बारहवें घर में चंद्रमा एक अत्यधिक कल्पनाशील, सहज और दयालु मन बनाता है। आपको रिचार्ज करने के लिए एकांत की अवधि की आवश्यकता होती है और आप आध्यात्मिक या अन्य दुनिया के क्षेत्रों से गहरा संबंध महसूस कर सकते हैं।"
    ],
    Mars: [
        "पहले घर में मंगल एक मुखर, ऊर्जावान और साहसी व्यक्तित्व देता है। आप एक प्राकृतिक 'गो-गेटर' हैं, लेकिन आपको आवेगीपन और दुर्घटना-ग्रस्त होने की प्रवृत्ति से सावधान रहना चाहिए।",
        "दूसरे घर में मंगल वित्त और वाणी में प्रेरणा और संघर्ष लाता है। आप पैसा कमाने में आक्रामक हैं, लेकिन वित्तीय विवाद भी हो सकते हैं या कठोर शब्दों का इस्तेमाल कर सकते हैं।",
        "तीसरे घर में मंगल immense साहस, पहल और एक सीधी संचार शैली प्रदान करता है। आप अपने विचारों के एक शक्तिशाली पैरोकार हैं, हालांकि तर्कशील हो सकते हैं।",
        "चौथे घर में मंगल घर के भीतर और परिवार के साथ संघर्ष और तर्क पैदा कर सकता है। यह आपकी ऊर्जा को उत्पादक घरेलू परियोजनाओं में लगाने की आवश्यकता को इंगित करता है।",
        "पांचवें घर में मंगल रचनात्मकता, खेल और रोमांस में एक भावुक और प्रतिस्पर्धी प्रेरणा प्रदान करता है। आप अपने शौक और प्रेम हितों को बड़ी ऊर्जा के साथ आगे बढ़ाते हैं।",
        "छठे घर में मंगल दुश्मनों और बाधाओं पर काबू पाने के लिए उत्कृष्ट है। आप एक दुर्जेय प्रतियोगी और एक अथक कार्यकर्ता हैं, लेकिन सूजन और चोटों से बचना चाहिए।",
        "सातवें घर में मंगल साझेदारी में एक भावुक लेकिन संभावित रूप से तर्कपूर्ण ऊर्जा लाता है। आप मुखर भागीदारों के प्रति आकर्षित होते हैं, लेकिन शक्ति संघर्ष आम हैं।",
        "आठवें घर में मंगल रहस्यों की जांच करने और संयुक्त वित्त के साथ जोखिम लेने की एक मजबूत प्रेरणा को इंगित करता है। यह अचानक घटनाओं और सावधानीपूर्वक ऊर्जा प्रबंधन की आवश्यकता का संकेत दे सकता है।",
        "नौवें घर में मंगल आपके विश्वासों के लिए लड़ने की प्रेरणा दिखाता है। आप शिक्षकों के साथ या दर्शन के बारे में बहस कर सकते हैं, लेकिन आप जो सच मानते हैं, उसके लिए आप एक भावुक वकील हैं।",
        "दसवें घर में मंगल आपके करियर में immense महत्वाकांक्षा और प्रेरणा प्रदान करता है। आप एक प्राकृतिक कमांडर हैं और इंजीनियरिंग या सर्जरी जैसे साहस और तकनीकी कौशल की आवश्यकता वाले क्षेत्रों में उत्कृष्टता प्राप्त करते हैं।",
        "ग्यारहवें घर में मंगल आपकी ऊर्जा को लक्ष्यों को प्राप्त करने और नेटवर्किंग की ओर निर्देशित करता है। आप अपने सामाजिक दायरे में सक्रिय हैं और दोस्तों के बीच एक नेता हो सकते हैं, हालांकि प्रतिस्पर्धा उत्पन्न हो सकती है।",
        "बारहवें घर में मंगल छिपे हुए दुश्मन बना सकता है या आपकी ऊर्जा को अंदर की ओर निर्देशित कर सकता है, जिससे निराशा हो सकती है। यह आध्यात्मिक अनुशासन, अनुसंधान या सेवा के माध्यम से सबसे अच्छा प्रसारित होता है।"
    ],
    Mercury: [
        "पहले घर में बुध आपको अत्यधिक बुद्धिमान, मिलनसार और अनुकूलनीय बनाता है। आपकी पहचान आपकी बुद्धि से बंधी है, और आप खुद को एक युवा, जिज्ञासु तरीके से प्रस्तुत करते हैं।",
        "दूसरे घर में बुध वित्तीय मामलों में बुद्धिमत्ता और एक कुशल, अक्सर विनोदी या बहुमुखी, बोलने का तरीका प्रदान करता है। आपका मन संसाधनों और डेटा को जमा करने पर केंद्रित है।",
        "तीसरे घर में बुध (अपने ही घर में) संचार, लेखन और सीखने के लिए उत्कृष्ट है। आपके पास एक तेज, तार्किक दिमाग है और आप मीडिया, मार्केटिंग या कम दूरी की यात्रा में उत्कृष्टता प्राप्त करते हैं।",
        "चौथे घर में बुध आपकी बुद्धि को घरेलू मामलों पर केंद्रित करता है। आप घर पर सीखने का आनंद ले सकते हैं, एक पारिवारिक व्यवसाय हो सकता है, या अचल संपत्ति और परिवार के बारे में लगातार सोच सकते हैं।",
        "पांचवें घर में बुध एक चंचल, रचनात्मक और बुद्धिमान दिमाग देता है। आप कौशल के खेल, बौद्धिक शौक और बच्चों के साथ संवाद करने में उत्कृष्टता प्राप्त करते हैं।",
        "छठे घर में बुध आपकी विश्लेषणात्मक कौशल को समस्याओं, स्वास्थ्य और काम पर लागू करता है। आप एक विस्तार-उन्मुख कार्यकर्ता और एक उत्कृष्ट समस्या निवारक हैं, लेकिन अत्यधिक चिंता कर सकते हैं।",
        "सातवें घर में बुध एक बुद्धिमान और मिलनसार साथी की तलाश करता है। सभी एक-से-एक रिश्तों में आपके लिए संवाद और मानसिक संबंध महत्वपूर्ण हैं।",
        "आठवें घर में बुध एक ऐसा मन बनाता है जो अनुसंधान, जांच और रहस्यों को उजागर करने की ओर आकर्षित होता है। आपके पास मनोविज्ञान, ज्योतिष या खोजी पत्रकारिता के लिए एक प्राकृतिक प्रतिभा है।",
        "नौवें घर में बुध आपको उच्च ज्ञान का छात्र बनाता है। आप दर्शन, कानून, धर्म और लंबी दूरी की यात्रा के बारे में सीखना और संवाद करना पसंद करते हैं।",
        "दसवें घर में बुध आपके करियर में संचार को एक प्राथमिक उपकरण के रूप में उपयोग करता है। आपके पास कई नौकरियां हो सकती हैं या मीडिया, लेखन, शिक्षण या परामर्श में एक पेशा हो सकता है।",
        "ग्यारहवें घर में बुध एक विस्तृत सामाजिक नेटवर्क और लक्ष्यों को प्राप्त करने में बुद्धिमत्ता प्रदान करता है। आप कई अलग-अलग लोगों से जुड़ते हैं और समूह संचार में उत्कृष्टता प्राप्त करते हैं।",
        "बारहवें घर में बुध एक ऐसा मन देता है जो सहज, कल्पनाशील और परदे के पीछे के शोध या आध्यात्मिक विषयों पर केंद्रित होता है। आप छिपी हुई चीजों के बारे में गहराई से सोचते हैं।"
    ],
    Jupiter: [
        "पहले घर में बृहस्पति आपके व्यक्तित्व में आशावाद, ज्ञान और सौभाग्य लाता है। आपको उच्च सिद्धांतों वाले व्यक्ति के रूप में देखा जाता है, और आप स्वाभाविक रूप से अवसरों को आकर्षित करते हैं।",
        "दूसरे घर में बृहस्पति धन और वित्त के लिए उत्कृष्ट है। यह प्रचुरता, एक उदार प्रकृति और संसाधनों को संभालने में ज्ञान का मार्ग इंगित करता है।",
        "तीसरे घर में बृहस्पति आपके संचार और साहस का विस्तार करता है। आप एक आशावादी और प्रेरणादायक वक्ता या लेखक हैं, और भाई-बहनों के साथ आपके अच्छे संबंध हैं।",
        "चौथे घर में बृहस्पति (एक मजबूत स्थान) आपको एक सुखी घरेलू जीवन, एक बड़ी संपत्ति और आपकी माँ से मजबूत समर्थन का आशीर्वाद देता है। यह गहरी आंतरिक शांति को इंगित करता है।",
        "पांचवें घर में बृहस्पति बच्चों, रचनात्मकता और निवेश या सट्टेबाजी के माध्यम से सौभाग्य के लिए एक आशीर्वाद है। आपकी बुद्धि व्यापक है और आपकी रचनात्मकता विशाल है।",
        "छठे घर में बृहस्पति ज्ञान के साथ संघर्षों और स्वास्थ्य समस्याओं पर काबू पाने में मदद करता है। आप अपनी सेवा में उदार हैं और अपने काम में एक महान शिक्षक या परामर्शदाता हो सकते हैं।",
        "सातवें घर में बृहस्पति एक बुद्धिमान, भाग्यशाली और اصولی साथी का वादा करता है। आपके रिश्ते आपके जीवन में विकास और विस्तार का एक स्रोत हैं।",
        "आठवें घर में बृहस्पति विरासत या भागीदारों के माध्यम से धन ला सकता है, और जीवन के रहस्यों और दीर्घायु में गहरी, दार्शनिक रुचि देता है।",
        "नौवें घर में बृहस्पति (अपने ही घर में) भाग्य, उच्च ज्ञान और धर्म के लिए अत्यंत शक्तिशाली है। आप एक जन्मजात शिक्षक, दार्शनिक या मार्गदर्शक हैं, जो भाग्य से धन्य हैं।",
        "दसवें घर में बृहस्पति आपके करियर में बड़ी सफलता, नैतिकता और ज्ञान प्रदान करता है। आप अपने क्षेत्र में एक सलाहकार, शिक्षक या नेता के रूप में एक उच्च पद प्राप्त कर सकते हैं।",
        "ग्यारहवें घर में बृहस्पति लाभ और इच्छाओं की पूर्ति के लिए सबसे अच्छे स्थानों में से एक है। आपके पास शक्तिशाली और सहायक मित्रों का एक विस्तृत नेटवर्क है।",
        "बारहवें घर में बृहस्पति दिव्य सुरक्षा और आध्यात्मिकता, ध्यान और दान में गहरी रुचि प्रदान करता है। आप एकांत और जाने देने में ज्ञान पाते हैं।"
    ],
    Venus: [
        "पहले घर में शुक्र आपको आकर्षण, कृपा और सौंदर्य और सद्भाव के प्रति प्रेम का आशीर्वाद देता है। आप स्वाभाविक रूप से आकर्षक, राजनयिक हैं और आपका व्यवहार सुखद है।",
        "दूसरे घर में शुक्र धन के लिए उत्कृष्ट है, जो लक्जरी वस्तुओं, बढ़िया भोजन और एक सुंदर बोलने वाली आवाज के लिए प्यार देता है। आप अपने आकर्षण के माध्यम से आसानी से पैसा आकर्षित करते हैं।",
        "तीसरे घर में शुक्र आपकी संचार शैली को कलात्मक और सुखद बनाता है। आपके पास रचनात्मक लेखन, कविता या डिजाइन के लिए एक प्रतिभा है और सामंजस्यपूर्ण भाई-बहन संबंधों का आनंद लेते हैं।",
        "चौथे घर में शुक्र एक सुंदर घर, आराम का प्यार और एक सुखी घरेलू जीवन को इंगित करता है। आपके पास लक्जरी वाहन हो सकते हैं और आपकी माँ के साथ एक मजबूत, प्रेमपूर्ण बंधन हो सकता है।",
        "पांचवें घर में शुक्र रचनात्मकता, रोमांस और कलात्मक प्रतिभा प्रदान करता है। आप अत्यधिक करिश्माई हैं और प्रेम संबंधों, कलाओं और मनोरंजन में बहुत खुशी पाते हैं।",
        "छठे घर में शुक्र कार्यस्थल पर सद्भाव ला सकता है, लेकिन यह भी इंगित करता है कि अधिक भोग से स्वास्थ्य समस्याएं उत्पन्न हो सकती हैं। आप कला या डिजाइन के माध्यम से दूसरों की सेवा कर सकते हैं।",
        "सातवें घर में शुक्र (अपने ही घर में) एक सुंदर, आकर्षक और समर्पित साथी का एक मजबूत संकेतक है। आपका विवाह आपकी खुशी और सामाजिक जीवन का केंद्र है।",
        "आठवें घर में शुक्र विवाह या विरासत के माध्यम से धन ला सकता है, लेकिन यह गहन, गुप्त संबंधों को भी इंगित करता है। यह एक मजबूत चुंबकत्व और आकर्षण देता है।",
        "नौवें घर में शुक्र दर्शन, कला और विभिन्न संस्कृतियों में सुंदरता के प्रति प्रेम दिखाता है। आपके विश्वास सद्भाव पर केंद्रित हैं, और आपको किसी विदेशी भूमि से एक साथी मिल सकता है।",
        "दसवें घर में शुक्र कला, मनोरंजन, सौंदर्य या कूटनीति से संबंधित करियर में सफलता प्रदान करता है। आपकी एक आकर्षक सार्वजनिक छवि है और आप अच्छी तरह से पसंद किए जाते हैं।",
        "ग्यारहवें घर में शुक्र आपके आकर्षण और सामाजिक कृपा के माध्यम से लाभ और दोस्ती लाता है। आपके पास कलात्मक और संपन्न दोस्तों का एक नेटवर्क है जो आपके लक्ष्यों को प्राप्त करने में आपकी मदद करते हैं।",
        "बारहवें घर में शुक्र एकांत, आध्यात्मिकता और कल्पना में प्रेम और सुंदरता पाता है। यह छिपे हुए रिश्तों या निजी में शानदार सुख-सुविधाओं के प्रति प्रेम का संकेत दे सकता है।"
    ],
    Saturn: [
        "पहले घर में शनि आपके व्यक्तित्व में गंभीरता, अनुशासन और जिम्मेदारी जोड़ता है। आप कम उम्र से बोझिल जिम्मेदारियों को महसूस कर सकते हैं लेकिन महान सहनशक्ति विकसित करते हैं।",
        "दूसरे घर में शनि वित्त और पारिवारिक धन को प्रतिबंधित कर सकता है, समय के साथ कड़ी मेहनत और बचत की मांग करता है। यह एक गंभीर, व्यावहारिक और कभी-कभी उदास भाषण देता है।",
        "तीसरे घर में शनि भाई-बहनों या संचार के साथ चुनौतियां पैदा कर सकता है। हालांकि, यह किसी भी कौशल में immense दृढ़ता और अनुशासन देता है जिसे आप मास्टर करने के लिए अपना मन बनाते हैं।",
        "चौथे घर में शनि एक प्रतिबंधात्मक या भावनात्मक रूप से शांत घरेलू वातावरण का संकेत दे सकता है। यह अनुशासन और कड़ी मेहनत के माध्यम से समय के साथ धीरे-धीरे सुरक्षा बनाता है।",
        "पांचवें घर में शनि बच्चों, रोमांस और रचनात्मकता के प्रति देरी या एक गंभीर दृष्टिकोण ला सकता है। आपकी रचनात्मक गतिविधियाँ संरचित हैं और जीवन में बाद में प्रकट हो सकती हैं।",
        "छठे घर में शनि दृढ़ता के माध्यम से दुश्मनों पर काबू पाने के लिए एक शक्तिशाली स्थान है। यह एक मेहनती कार्यकर्ता को दिखाता है लेकिन पुरानी स्वास्थ्य समस्याओं का संकेत दे सकता है जिनके लिए अनुशासन की आवश्यकता होती है।",
        "सातवें घर में शनि विवाह में देरी कर सकता है या एक परिपक्व, बड़े या बहुत जिम्मेदार साथी को ला सकता है। यह रिश्तों में प्रतिबद्धता, संरचना और धैर्य की मांग करता है।",
        "आठवें घर में शनि दीर्घायु के लिए एक मजबूत स्थान है। यह लंबे, धैर्यवान प्रतीक्षा के माध्यम से विरासत ला सकता है, और अनुसंधान और तत्वमीमांसा में गहरी, गंभीर रुचि देता है।",
        "नौवें घर में शनि एक संरचित, पारंपरिक और कभी-कभी कठोर विश्वास प्रणाली बनाता है। आप दर्शन और उच्च शिक्षा को गंभीरता से लेते हैं, लेकिन अपने शिक्षकों से सवाल कर सकते हैं।",
        "दसवें घर में शनि (एक मजबूत स्थान) धीमी, स्थिर और अनुशासित कड़ी मेहनत के माध्यम से सफलता और उच्च दर्जा लाता है। आप समय के साथ एक स्थायी करियर और प्रतिष्ठा का निर्माण करते हैं।",
        "ग्यारहवें घर में शनि इच्छाओं की पूर्ति को एक धीमी प्रक्रिया बना सकता है। दोस्ती कम लेकिन लंबे समय तक चलने वाली होती है। लाभ दृढ़ता और स्थापित नेटवर्क के माध्यम से आते हैं।",
        "बारहवें घर में शनि एक एकान्त, अनुशासित आध्यात्मिक पथ को इंगित करता है। यह ध्यान और परदे के पीछे के काम के लिए उत्कृष्ट है लेकिन अलगाव की भावनाओं का संकेत दे सकता है।"
    ],
    Rahu: [
        "पहले घर में राहु एक शक्तिशाली, महत्वाकांक्षी और अपरंपरागत व्यक्तित्व बनाता है। आपके पास मान्यता के लिए एक अतृप्त इच्छा है और आप खुद को साबित करने के लिए एक बाहरी व्यक्ति की तरह महसूस कर सकते हैं।",
        "दूसरे घर में राहु धन और संपत्ति जमा करने की एक बड़ी इच्छा देता है। यह अपरंपरागत स्रोतों से धन ला सकता है, लेकिन असत्य भाषण की प्रवृत्ति भी।",
        "तीसरे घर में राहु अत्यधिक साहस और एक शक्तिशाली, प्रेरक संचार शैली प्रदान करता है। आप मीडिया, प्रौद्योगिकी या विपणन में उत्कृष्टता प्राप्त कर सकते हैं, लेकिन जोड़ तोड़ कर सकते हैं।",
        "चौथे घर में राहु घर और भावनात्मक शांति के बारे में बेचैनी पैदा कर सकता है। आपके घरेलू जीवन में विदेशी तत्व हो सकते हैं या कभी भी वास्तव में बसे हुए महसूस न करने की भावना हो सकती है।",
        "पांचवें घर में राहु रचनात्मकता, रोमांस और अटकलों के लिए एक जुनूनी प्रेरणा लाता है। यह मनोरंजन के माध्यम से प्रसिद्धि प्रदान कर सकता है लेकिन बच्चों के लिए अपरंपरागत दृष्टिकोण भी।",
        "छठे घर में राहु दुश्मनों पर काबू पाने और अपरंपरागत तरीकों से जटिल समस्याओं को हल करने की एक अलौकिक क्षमता प्रदान करता है। यह प्रौद्योगिकी या उपचार में सफलता दे सकता है।",
        "सातवें घर में राहु साझेदारी के लिए एक मजबूत इच्छा पैदा करता है, अक्सर किसी भिन्न पृष्ठभूमि या संस्कृति के किसी व्यक्ति के साथ। रिश्ते एक प्रमुख ध्यान केंद्रित करते हैं और अपरंपरागत हो सकते हैं।",
        "आठवें घर में राहु रहस्यों, तत्वमीमांसा और अचानक धन में एक शक्तिशाली और जुनूनी रुचि देता है। यह अप्रत्याशित लाभ और हानि और अनुसंधान के लिए एक प्रतिभा ला सकता है।",
        "नौवें घर में राहु अपरंपरागत विश्वासों और पारंपरिक धर्म और शिक्षकों के प्रति एक सवाल करने वाला रवैया बनाता है। यह विदेशों में बड़ी सफलता दिला सकता है।",
        "दसवें घर में राहु करियर की महत्वाकांक्षा और प्रसिद्धि के लिए एक शक्तिशाली चालक है। आप उच्च दर्जा प्राप्त करने के लिए नियमों को तोड़ने से नहीं डरते हैं और अपने पेशे में तेजी से बढ़ सकते हैं।",
        "ग्यारहवें घर में राहु बड़े पैमाने पर लाभ और प्रौद्योगिकी और बड़े नेटवर्क के माध्यम से इच्छाओं को प्राप्त करने के लिए एक उत्कृष्ट स्थान है। आपके पास प्रभावशाली और अपरंपरागत दोस्त हैं।",
        "बारहवें घर में राहु अपनी जुनूनी ऊर्जा को आध्यात्मिकता, विदेशों या छिपे हुए मामलों की ओर निर्देशित करता है। यह शक्तिशाली सहज अंतर्दृष्टि दे सकता है या गुप्त व्यवहार और खर्चों को जन्म दे सकता है।"
    ],
    Ketu: [
        "पहले घर में केतु एक अलग, आत्मनिरीक्षण और आध्यात्मिक रूप से इच्छुक व्यक्तित्व बनाता है। आप जड़हीनता की भावना महसूस कर सकते हैं या अपनी पहचान पर सवाल उठा सकते हैं, जिससे आध्यात्मिक खोज हो सकती है।",
        "दूसरे घर में केतु धन और परिवार के प्रति एक अलग रवैया बना सकता है। यह वित्तीय अनिश्चितता या भौतिक संचय पर ध्यान की कमी का कारण बन सकता है।",
        "तीसरे घर में केतु एक सहज और गैर-रेखीय संचार शैली लाता है। आपकी पारंपरिक मीडिया में कोई दिलचस्पी नहीं हो सकती है, लेकिन आपके पास शक्तिशाली मानसिक या प्रतीकात्मक अंतर्दृष्टि हो सकती है।",
        "चौथे घर में केतु आपके घर और जड़ों के बारे में एक अलग या अस्थिर भावना का संकेत दे सकता है। यह भौतिक घर के बजाय एक आध्यात्मिक 'घर' की खोज को बढ़ावा देता है।",
        "पांचवें घर में केतु रोमांस, रचनात्मकता और बच्चों के प्रति एक अलग और महत्वपूर्ण दृष्टिकोण बनाता है। आपके पास अत्यधिक सहज बुद्धि हो सकती है लेकिन पारंपरिक रचनात्मक अभिव्यक्ति के साथ संघर्ष कर सकते हैं।",
        "छठे घर में केतु समस्याओं या बीमारियों का सहज रूप से निदान और समाधान करने की एक शक्तिशाली क्षमता प्रदान करता है। हालांकि, यह अजीब, कठिन-से-निदान स्वास्थ्य समस्याओं का भी संकेत दे सकता है।",
        "सातवें घर में केतु साझेदारी के प्रति एक आध्यात्मिक, अलग या महत्वपूर्ण दृष्टिकोण लाता है। आप अपने साथी के साथ एक कर्म संबंध महसूस कर सकते हैं लेकिन असंतोष की भावना भी।",
        "आठवें घर में केतु गहरे रहस्यमय और गुप्त अनुसंधान के लिए एक शक्तिशाली स्थान है। आपके पास भ्रम के माध्यम से देखने और गहरे आध्यात्मिक सत्य को समझने की एक प्राकृतिक क्षमता है।",
        "नौवें घर में केतु पारंपरिक विश्वासों पर सवाल उठाने और एक अधिक प्रत्यक्ष, सहज आध्यात्मिक सत्य की खोज का संकेत देता है। यह दर्शन के पिछले जीवन की महारत को दर्शाता है।",
        "दसवें घर में केतु एक ऐसा करियर पथ बनाता है जो अपरंपरागत, आध्यात्मिक या अनुसंधान से जुड़ा होता है। आप स्थिति और प्रसिद्धि की महत्वाकांक्षाओं से अलग हैं।",
        "ग्यारहवें घर में केतु सामाजिक नेटवर्क और भौतिक लाभों के प्रति एक अलग दृष्टिकोण देता है। आपकी दोस्ती कम या असामान्य हो सकती है, और आपके लक्ष्य अक्सर भौतिकवादी नहीं होते हैं।",
        "बारहवें घर में केतु मुक्ति (मोक्ष) का कारक है और यहाँ अत्यंत शक्तिशाली है। यह गहन सहज अंतर्दृष्टि, ध्यान क्षमता और आध्यात्मिक वैराग्य प्रदान करता है।"
    ]
};

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
    const lordOfOrdinal = lang === 'hi' ? `${lordOfHouse}` : getOrdinal(lordOfHouse);
    const placementOrdinal = lang === 'hi' ? `${placementHouse}` : getOrdinal(placementHouse);

    const TRIKONA = [1, 5, 9];
    const KENDRA = [1, 4, 7, 10];
    const DUSTHANA = [6, 8, 12];
    const UPACHAYA = [3, 6, 10, 11];

    if (lang === 'hi') {
        // Case 1: Lord in its own house
        if (lordOfHouse === placementHouse) {
            return `${lordOfOrdinal} घर का स्वामी, ${lord}, अपने ही घर में है। यह इस घर (${themes1}) के मामलों को शक्तिशाली रूप से मजबूत करता है, जिससे वे आपके जीवन में एक केंद्रीय और आत्मनिर्भर विषय बन जाते हैं। इस क्षेत्र पर आपका स्वाभाविक नियंत्रण और कमान है।`;
        }

        // Case 2: Raja Yoga (Lord of Kendra in Trikona or vice-versa)
        if ((KENDRA.includes(lordOfHouse) && TRIKONA.includes(placementHouse)) || (TRIKONA.includes(lordOfHouse) && KENDRA.includes(placementHouse))) {
            return `यह एक शक्तिशाली राज योग बनाता है, जो सफलता और स्थिति का एक संयोजन है। ${lordOfOrdinal} घर (${themes1}) के स्वामी का ${placementOrdinal} घर (${themes2}) से जुड़ना यह दर्शाता है कि आपका भाग्य और कर्म जुड़े हुए हैं, जो आपके प्रयासों को धर्मी तरीके से लागू करके महत्वपूर्ण उपलब्धियों का वादा करता है।`;
        }
        
        // Case 3: Viparita Raja Yoga (Lords of Dusthanas in other Dusthanas)
        if (DUSTHANA.includes(lordOfHouse) && DUSTHANA.includes(placementHouse)) {
            return `यह एक विपरीत राज योग बना सकता है। एक चुनौतीपूर्ण घर (${lordOfOrdinal} - ${themes1}) के स्वामी का दूसरे चुनौतीपूर्ण घर (${placementOrdinal} - ${themes2}) में जाना यह दर्शाता है कि आप कठिन परिस्थितियों से अप्रत्याशित रूप से लाभ प्राप्त कर सकते हैं। यह प्रारंभिक संघर्ष या हानि की अवधि के बाद अचानक सकारात्मक बदलाव ला सकता है।`;
        }

        // Case 4: Lord of a good house in a Dusthana
        if ((KENDRA.includes(lordOfHouse) || TRIKONA.includes(lordOfHouse)) && DUSTHANA.includes(placementHouse)) {
            return `आपके ${lordOfOrdinal} घर (${themes1}) की सकारात्मक ऊर्जा चुनौतीपूर्ण ${placementOrdinal} घर (${themes2}) में जा रही है। यह बताता है कि आपकी व्यक्तिगत पहचान, भाग्य, या कार्यों का परीक्षण संघर्ष, छिपे हुए मामलों, या बाधाओं पर काबू पाने में किया जा सकता है।`;
        }

        // Case 5: Lord of a Dusthana in a good house
        if (DUSTHANA.includes(lordOfHouse) && (KENDRA.includes(placementHouse) || TRIKONA.includes(placementHouse))) {
            return `आपके ${lordOfOrdinal} घर (${themes1}) के चुनौतीपूर्ण विषय आपके जीवन के एक प्रमुख क्षेत्र, ${placementOrdinal} घर (${themes2}) में लाए जाते हैं। यह बताता है कि संघर्ष, स्वास्थ्य, या हानि के मामले सीधे आपकी व्यक्तिगत पहचान, घर, या भाग्य को प्रभावित कर सकते हैं, जिसके लिए सचेत प्रबंधन की आवश्यकता होती है।`;
        }

        // Default generic (but improved) case
        return `आपके ${lordOfOrdinal} घर (जो ${themes1} को नियंत्रित करता है) का स्वामी, जो ${lord} है, आपके ${placementOrdinal} घर में स्थित है। यह एक शक्तिशाली लिंक बनाता है, यह सुझाव देता है कि आपके ${lordOfOrdinal} घर के मामलों को पूरा करने का आपका मार्ग ${themes2} से संबंधित गतिविधियों से गहरा जुड़ा हुआ है।`;
    }

    // English version
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
    Revati: "Revati provides compassion, gentleness, creativity, security, and spiritual refinement.",
    Unknown: "Unknown" // Added Unknown Nakshatra
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
    Revati: "रेवती करुणा, कोमलता, रचनात्मकता, सुरक्षा और आध्यात्मिक परिष्कार प्रदान करती है।" ,
    Unknown: "अज्ञात" // Added Unknown Nakshatra
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
    const nakshatraTraits_en = nakshatraTraitsLong_en;

    const lagnaTraits_hi = {
        Aries: "मेष लग्न होने के कारण, आपका विश्वदृष्टिकोण क्रिया और साहस से आकार लेता है। आप एक प्राकृतिक नेता हैं, जो हमेशा पहला कदम उठाने और दूसरों को प्रेरित करने के लिए तैयार रहते हैं। आपकी ऊर्जा संक्रामक है, हालांकि यह कभी-कभी जल्दबाजी का कारण बन सकती है। आप मुद्दों से सीधे और ईमानदारी से निपटना पसंद करते हैं, और आपके जीवन के पथ में अपनी शक्तिशाली प्रेरणा को धैर्य और दूसरों के प्रति विचार के साथ संतुलित करना सीखना शामिल है।",
        Taurus: "वृषभ लग्न के रूप में, आप जीवन के प्रति अपने दृष्टिकोण में जमीन से जुड़े और व्यवस्थित हैं। आप अपने चारों ओर आराम और सुंदरता की दुनिया बनाना चाहते हैं, और आपके पास संसाधनों के प्रबंधन के लिए एक प्राकृतिक प्रतिभा है। आपका दृढ़ संकल्प एक बड़ी संपत्ति है, लेकिन यह कभी-कभी जिद्दीपन के रूप में प्रकट हो सकता है।",
        Gemini: "मिथुन लग्न आपको एक लचीला, जिज्ञासु और बातूनी व्यक्तित्व प्रदान करता है। मानसिक उत्तेजना आपको प्रेरित करती है, और आप लगातार नए विचारों, कनेक्शन और दृष्टिकोणों की तलाश करते हैं। आप बदलती परिस्थितियों में जल्दी से ढल जाते हैं और ज्ञान साझा करने का आनंद लेते हैं।",
        Cancer: "कर्क लग्न आपको एक पोषण करने वाला, सहज और भावनात्मक रूप से जागरूक बाहरी व्यक्तित्व देता है। आप अपने पर्यावरण और दूसरों की जरूरतों के प्रति गहराई से संवेदनशील हैं, अक्सर एक प्राकृतिक रक्षक या देखभाल करने वाले के रूप में कार्य करते हैं। परिवार, जड़ें और व्यक्तिगत सुरक्षा आपके लिए बहुत मायने रखती है।",
        Leo: "सिंह लग्न एक करिश्माई, अभिव्यंजक और आत्मविश्वासी उपस्थिति लाता है। आप स्वाभाविक रूप से नेतृत्व की भूमिकाओं की ओर आकर्षित होते हैं और अपने प्रयासों के लिए मान्यता की सराहना करते हैं। आपका व्यक्तित्व گرمی, रचनात्मकता और मजबूत इच्छाशक्ति बिखेरता है।",
        Virgo: "कन्या लग्न के साथ, आप जीवन में सटीकता, तर्क और एक विश्लेषणात्मक मानसिकता के साथ आगे बढ़ते हैं। आप उन विवरणों को देखते हैं जिन्हें दूसरे अनदेखा कर देते हैं और आप जो कुछ भी करते हैं उसमें सुधार के लिए प्रयास करते हैं। व्यावहारिक और स्वास्थ्य के प्रति जागरूक, आप संरचना और व्यवस्था पसंद करते हैं।",
        Libra: "तुला लग्न आपको एक सुंदर, संतुलित और राजनयिक व्यक्तित्व देता है। आप स्वाभाविक रूप से रिश्तों और वातावरण में सद्भाव चाहते हैं, मध्यस्थता और निष्पक्षता में उत्कृष्टता प्राप्त करते हैं। आप संघर्ष को नापसंद करते हैं और किसी स्थिति के दोनों पक्षों को देखने में प्रतिभाशाली हैं।",
        Scorpio: "वृश्चिक लग्न एक शक्तिशाली, तीव्र और गहन अंतर्दृष्टिपूर्ण व्यक्तित्व बनाता है। आपकी उपस्थिति चुंबकीय है, और आपकी भावनात्मक गहराई बेजोड़ है। आप शायद ही कभी अपने सच्चे विचारों को आसानी से प्रकट करते हैं और संकट में मजबूत लचीलापन रखते हैं।",
        Sagittarius: "धनु लग्न आपको एक आशावादी, साहसी और ज्ञान-खोजी व्यक्तित्व देता है। आप स्वतंत्रता और व्यापक दृष्टिकोणों की खोज को महत्व देते हैं - चाहे वह यात्रा, दर्शन या व्यक्तिगत विकास के माध्यम से हो।",
        Capricorn: "मकर लग्न आपको अनुशासित, यथार्थवादी और दीर्घकालिक उपलब्धि पर केंद्रित बनाता है। आप जीवन को गंभीरता और जिम्मेदारी के साथ देखते हैं, और कठिनाइयों के माध्यम से दृढ़ रहने की आपकी क्षमता असाधारण है।",
        Aquarius: "कुंभ लग्न के साथ, आपका व्यक्तित्व मौलिकता, बुद्धि और मानवीय चिंता का मिश्रण है। आप अपरंपरागत तरीकों से सोचते हैं और अक्सर स्थितियों का निष्पक्ष रूप से विश्लेषण करने के लिए भावनात्मक रूप से अलग हो जाते हैं।",
        Pisces: "मीन लग्न आपको एक कोमल, कल्पनाशील और सहज व्यक्तित्व देता है। आप दुनिया को भावना और प्रतीकवाद के माध्यम से देखते हैं। करुणा और रचनात्मकता आपके माध्यम से स्वाभाविक रूप से बहती है।"
    };
    const rashiTraits_hi = {
        Aries: "मेष राशि में चंद्रमा के साथ, आपकी भावनात्मक प्रतिक्रियाएं तेज, भावुक और ईमानदार होती हैं। आप भावनात्मक ठहराव को नापसंद करते हैं और भावनाओं के सीधे संचार को पसंद करते हैं।",
        Taurus: "वृषभ चंद्रमा आपको एक शांत, स्थिर भावनात्मक प्रकृति देता है। आप शांति, पूर्वानुमेयता और दीर्घकालिक आराम चाहते हैं। अचानक भावनात्मक परिवर्तन आपको अस्थिर कर देते हैं।",
        Gemini: "मिथुन राशि में चंद्रमा आपकी भावनाओं को बुद्धि और संचार से जोड़ता है। आप शब्दों के माध्यम से भावनाओं को व्यक्त करते हैं, और आपका मन शायद ही कभी आराम करता है। जिज्ञासा आपकी भावनात्मक दुनिया को आकार देती है।",
        Cancer: "कर्क राशि में चंद्रमा के साथ, आप भावनाओं को गहराई से और सहज रूप से अनुभव करते हैं। पारिवारिक बंधन, स्मृति और घर आपके भावनात्मक कल्याण को दृढ़ता से प्रभावित करते हैं।",
        Leo: "सिंह चंद्रमा आपको एक नाटकीय, गर्म और अभिव्यंजक भावनात्मक प्रकृति देता है। जब आपकी सराहना या प्रशंसा की जाती है तो आप सबसे खुश महसूस करते हैं और भावनात्मक संबंध चाहते हैं जो आपके आंतरिक सम्मान को मान्य करता है।",
        Virgo: "कन्या राशि में चंद्रमा आपकी भावनाओं को विश्लेषणात्मक और व्यावहारिक बनाता है। आप व्यवस्था और स्पष्टता चाहते हैं, और आपकी देखभाल प्रत्यक्ष प्रदर्शन के बजाय सहायक कार्यों के माध्यम से दिखती है।",
        Libra: "तुला राशि में चंद्रमा आपके भावनात्मक जीवन में संतुलन और सद्भाव की आवश्यकता देता है। आप संघर्ष को नापसंद करते हैं और सहकारी और मानसिक रूप से संरेखित संबंधों की तलाश करते हैं।",
        Scorpio: "वृश्चिक चंद्रमा शक्तिशाली, तीव्र और परिवर्तनकारी भावनाएं पैदा करता है। आप वफादारी का गहराई से अनुभव करते हैं और मजबूत लगाव बनाते हैं। भावनात्मक विश्वासघात गहन आंतरिक प्रतिक्रियाओं को ट्रिगर कर सकता है।",
        Sagittarius: "धनु राशि में चंद्रमा आशावाद और स्वतंत्रता की आवश्यकता लाता है। आप भावनात्मक कैद को नापसंद करते हैं और ईमानदारी और खुले संचार पर पनपते हैं।",
        Capricorn: "मकर चंद्रमा भावनात्मक अनुशासन और संयम देता है। आप भावनाओं को सावधानी से व्यक्त करते हैं, सहजता पर नियंत्रण और स्थिरता को प्राथमिकता देते हैं।",
        Aquarius: "कुंभ राशि में चंद्रमा आपको एक अलग, बौद्धिक भावनात्मक शैली देता है। आप भावना पर तर्क को महत्व देते हैं और दोस्ती और विचारों को पसंद करते हैं जो आपके सिद्धांतों के अनुरूप हों।",
        Pisces: "मीन चंद्रमा गहरी संवेदनशीलता, करुणा और मानसिक ग्रहणशीलता देता है। आप भावनाओं को गहराई से महसूस करते हैं और दूसरों के मूड के साथ बहुत आसानी से घुलमिल सकते हैं।"
    };
    const nakshatraTraits_hi = nakshatraTraitsLong_hi;

    const p_en = {
        yourChartCombines: "Your chart combines the qualities of your", lagna: "Lagna", rashi: "Rashi", and: "and", nakshatra: "Nakshatra", creatingProfile: ", creating a deeply layered personality profile.",
        asALagnaAscendant: "As a", outerBehavior: "ascendant, your outer behavior, approach to life, and first instincts are shaped by the following tendencies:",
        emotionallyAndMentally: "Emotionally and mentally, your Moon sign in", influencesHowYou: "influences how you process experiences, form bonds, and respond to your inner world. This gives you the following emotional nature:",
        atADeeperKarmic: "At a deeper karmic and spiritual level, your birth in the", infusesYourInstincts: "Nakshatra infuses your instincts, subconscious drives, and soul journey with the following qualities:",
        whenTheseThree: "When these three forces blend, they create a unique harmony between your external personality, your internal emotional life, and your spiritual foundation. This combination reveals how you behave in the world, how you feel within, and what your soul seeks across your life path. This integrated pattern shapes your natural strengths, challenges, relationships, decisions, and long-term destiny."
    };

    const p_hi = {
        yourChartCombines: "आपकी कुंडली आपके", lagna: "लग्न", rashi: "राशि", and: "और", nakshatra: "नक्षत्र", creatingProfile: "के गुणों को मिलाकर एक गहरी स्तरित व्यक्तित्व प्रोफाइल बनाती है।",
        asALagnaAscendant: "एक", outerBehavior: "लग्न के रूप में, आपका बाहरी व्यवहार, जीवन के प्रति दृष्टिकोण, और पहली प्रवृत्ति निम्नलिखित प्रवृत्तियों से आकार लेती है:",
        emotionallyAndMentally: "भावनात्मक और मानसिक रूप से, आपकी", influencesHowYou: "में चंद्र राशि आपके अनुभवों को संसाधित करने, बंधन बनाने और आपकी आंतरिक दुनिया पर प्रतिक्रिया करने के तरीके को प्रभावित करती है। यह आपको निम्नलिखित भावनात्मक प्रकृति देता है:",
        atADeeperKarmic: "एक गहरे कर्म और आध्यात्मिक स्तर पर, आपका जन्म", infusesYourInstincts: "नक्षत्र में आपकी प्रवृत्ति, अवचेतन प्रेरणाओं और आत्मा की यात्रा को निम्नलिखित गुणों से भर देता है:",
        whenTheseThree: "जब ये तीन ताकतें मिलती हैं, तो वे आपके बाहरी व्यक्तित्व, आपके आंतरिक भावनात्मक जीवन और आपकी आध्यात्मिक नींव के बीच एक अनूठा सामंजस्य बनाती हैं। यह संयोजन बताता है कि आप दुनिया में कैसा व्यवहार करते हैं, आप भीतर कैसा महसूस करते हैं, और आपकी आत्मा आपके जीवन पथ पर क्या चाहती है। यह एकीकृत पैटर्न आपकी प्राकृतिक शक्तियों, चुनौतियों, रिश्तों, निर्णयों और दीर्घकालिक भाग्य को आकार देता है।"
    };

    const p = lang === 'hi' ? p_hi : p_en;
    const lagnaTraits = lang === 'hi' ? lagnaTraits_hi : lagnaTraits_en;
    const rashiTraits = lang === 'hi' ? rashiTraits_hi : rashiTraits_en;
    const nakshatraTraits = lang === 'hi' ? nakshatraTraits_hi : nakshatraTraits_en;

    let lagnaText = lagnaTraits[lagna] || "";
    let rashiText = rashiTraits[rashi] || "";
    const nakshatraText = nakshatraTraits[nakshatra] || "";

    const cuspDegrees = houses ? houses.map(h => convertDMSToDegrees(h.start_dms)) : [];

    // --- Synthesize Lagna Lord into Lagna Paragraph ---
    if (lagnaLord && lagnaLordNatalHouse && cuspDegrees.length > 0) {
        const houseTheme = (lang === 'hi' ? houseThemes_hi : houseThemes_en)[lagnaLordNatalHouse];
        if (lang === 'hi') {
            lagnaText += ` यह मुख्य पहचान ${lagnaLordNatalHouse}वें घर में अपनी प्राथमिक अभिव्यक्ति पाती है, जो आपके जीवन के पथ को ${houseTheme} के मामलों की ओर ले जाती है।`;
        } else {
            lagnaText += ` This core identity finds its primary expression in the ${getOrdinal(lagnaLordNatalHouse)} house, channeling your life's path toward matters of ${houseTheme}.`;
        }
    }

    // --- Synthesize Moon's House Placement into Rashi Paragraph ---
    const moonData = planetaryPositions?.Moon;
    if (moonData && typeof moonData.longitude === 'number' && cuspDegrees.length > 0) {
        const moonHouse = getHouseOfPlanet(moonData.longitude, cuspDegrees);
        if (moonHouse) {
            const houseTheme = (lang === 'hi' ? houseThemes_hi : houseThemes_en)[moonHouse];
            if (lang === 'hi') {
                rashiText += ` यह भावनात्मक प्रकृति सबसे अधिक ${moonHouse}वें घर पर केंद्रित है, जो बताता है कि आप ${houseTheme} से संबंधित मामलों में भावनात्मक पूर्ति और सुरक्षा चाहते हैं।`;
            } else {
                rashiText += ` This emotional nature is most actively focused on the ${getOrdinal(moonHouse)} house, suggesting you seek emotional fulfillment and security in matters related to ${houseTheme}.`;
            }
        }
    }

    // --- Assemble the final report ---
    let result = `
${p.yourChartCombines} ${lang === 'hi' ? rashiNames_hi[lagna] : lagna} ${p.lagna}, ${lang === 'hi' ? rashiNames_hi[rashi] : rashi} ${p.rashi}, ${p.and} ${lang === 'hi' ? nakshatraTraits_hi[nakshatra] : nakshatra} ${p.nakshatra}${p.creatingProfile} 
${p.asALagnaAscendant} ${lang === 'hi' ? rashiNames_hi[lagna] : lagna} ${p.outerBehavior} ${lagnaText}

${p.emotionallyAndMentally} ${lang === 'hi' ? rashiNames_hi[rashi] : rashi} ${p.influencesHowYou} ${rashiText}

${p.atADeeperKarmic} ${nakshatra} ${p.infusesYourInstincts} ${nakshatraText}
`;

    if (lagnaLord && lagnaLordNatalHouse && lagnaLordStrength !== undefined) {
        const interpretation = getLagnaLordInterpretation(lagnaLord, lagnaLordNatalHouse, lang);
        const strengthDescription = getStrengthDescription(lagnaLordStrength, lang);
        const translatedLagnaLord = lang === 'hi' ? planetNames_hi[lagnaLord] : lagnaLord;
        if (lang === 'hi') {
            result += `\n\nआपके लग्न स्वामी, ${translatedLagnaLord}, आपके जीवन पथ के लिए एक प्रमुख ग्रह हैं। ${interpretation} इसकी ${lagnaLordStrength.toFixed(2)}% की ताकत दर्शाती है कि यह ${strengthDescription}`;
        } else {
            result += `\n\nYour Lagna Lord, ${translatedLagnaLord}, is a key planet for your life path. ${interpretation} Its strength of ${lagnaLordStrength.toFixed(2)}% shows that it ${strengthDescription}`;
        }
    }

    if (atmakaraka && atmakarakaStrength !== undefined) {
        const atmakarakaTranslated = lang === 'hi' ? planetNames_hi[atmakaraka] : atmakaraka;
        const strengthDescription = getStrengthDescription(atmakarakaStrength, lang);
        if (lang === 'hi') {
            result += `\n\n${atmakarakaTranslated} आपके आत्माकारक (आत्मा का कारक) के रूप में आपकी गहरी इच्छाओं को प्रकट करता है। इसकी ${atmakarakaStrength.toFixed(2)}% की ताकत दर्शाती है कि यह ${strengthDescription}`;
        } else {
            result += `\n\n${atmakarakaTranslated} as your Atmakaraka (Soul Significator) reveals your deepest desires. Its strength of ${atmakarakaStrength.toFixed(2)}% indicates that it ${strengthDescription}`;
        }
    }

    if (planetaryPositions && houses) {
        const placementsTitle = lang === 'hi' ? '### ग्रह स्थिति विश्लेषण' : '### Planetary Placements Analysis';
        const placementsIntro = lang === 'hi' ? 'यह खंड प्रत्येक ग्रह के प्रभाव का विवरण देता है जो उसके घर के आधार पर है।' : 'This section details the influence of each planet based on the house it occupies.';
        result += `\n\n${placementsTitle}\n${placementsIntro}`;
        const planetOrder = ['Sun', 'Moon', 'Mars', 'Mercury', 'Jupiter', 'Venus', 'Saturn', 'Rahu', 'Ketu'];
        planetOrder.forEach(planet => {
            const planetData = planetaryPositions[planet];
            if (planetData && typeof planetData.longitude === 'number') {
                const house = getHouseOfPlanet(planetData.longitude, cuspDegrees);
                if (house) {
                    const interpretation = (lang === 'hi' ? (planetInHouse_hi[planet]?.[house - 1]) : (planetInHouse_en[planet]?.[house - 1]));
                    const translatedPlanet = lang === 'hi' ? planetNames_hi[planet] : planet;
                    if (interpretation) {
                         result += `\n\n*   **${translatedPlanet} ${lang === 'hi' ? `${house} वें घर में` : `in ${house}th house`}:** ${interpretation}`;
                    }
                }
            }
        });

        const lordshipTitle = lang === 'hi' ? '### भाव स्वामी विश्लेषण' : '### House Lordship Analysis';
        const lordshipIntro = lang === 'hi' ? 'यह खंड विश्लेषण करता है कि भाव स्वामियों के स्थान की जांच करके आपके जीवन के विभिन्न क्षेत्र कैसे जुड़े हुए हैं।' : 'This section analyzes how the different areas of your life are connected by examining the placement of house lords.';
        result += `\n\n${lordshipTitle}\n${lordshipIntro}`;
        for (let i = 1; i <= 12; i++) {
            const houseData = houses[i - 1];
            const lord = houseData?.start_rashi_lord;
            if (lord) {
                const lordData = planetaryPositions[lord];
                if (lordData && typeof lordData.longitude === 'number') {
                    const placementHouse = getHouseOfPlanet(lordData.longitude, cuspDegrees);
                    if (placementHouse) {
                        const houseText = lang === 'hi' ? `${i} वें घर का स्वामी ${placementHouse} वें घर में` : `Lord of House ${i} in House ${placementHouse}`;
                        result += `\n\n*   **${houseText}:** ${generateLordshipText(i, placementHouse, lord, lang)}`;
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