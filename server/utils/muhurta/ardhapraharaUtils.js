const getArdhaprahara = (sunrise, sunset, nextSunrise) => {
    const dayDuration = (sunset.getTime() - sunrise.getTime()) / 1000;
    const nightDuration = (nextSunrise.getTime() - sunset.getTime()) / 1000;

    const ardhapraharDurationDay = dayDuration / 8;
    const ardhapraharDurationNight = nightDuration / 8;

    const inauspiciousArdhapraharas = [];

    const dayOfWeek = sunrise.getDay(); // 0 for Sunday, 6 for Saturday

    const inauspiciousDayPraharIndices = {
        0: [3, 4], // Sunday (0-indexed, so 4th is 3, 5th is 4)
        1: [6, 1], // Monday
        2: [5, 1], // Tuesday
        3: [4, 2], // Wednesday
        4: [6, 7], // Thursday
        5: [2, 3], // Friday
        6: [0, 5, 7]  // Saturday
    }[dayOfWeek];

    const inauspiciousNightPraharIndices = {
        0: [1, 3], // Sunday
        1: [6, 3], // Monday
        2: [1],    // Tuesday
        3: [4, 6], // Wednesday
        4: [4, 7], // Thursday
        5: [2],    // Friday
        6: [0, 5, 7]  // Saturday
    }[dayOfWeek];

    // Day Ardhapraharas
    for (let i = 0; i < 8; i++) {
        const start = new Date(sunrise.getTime() + i * ardhapraharDurationDay * 1000);
        const end = new Date(start.getTime() + ardhapraharDurationDay * 1000);
        if (inauspiciousDayPraharIndices.includes(i)) {
            inauspiciousArdhapraharas.push({
                name: `Day Ardha Prahar ${i + 1}`,
                start: start.toISOString(),
                end: end.toISOString(),
                type: 'inauspicious',
                description: 'Inauspicious period.'
            });
        }
    }

    // Night Ardhapraharas
    for (let i = 0; i < 8; i++) {
        const start = new Date(sunset.getTime() + i * ardhapraharDurationNight * 1000);
        const end = new Date(start.getTime() + ardhapraharDurationNight * 1000);
        if (inauspiciousNightPraharIndices.includes(i)) {
            inauspiciousArdhapraharas.push({
                name: `Night Ardha Prahar ${i + 1}`,
                start: start.toISOString(),
                end: end.toISOString(),
                type: 'inauspicious',
                description: 'Inauspicious period.'
            });
        }
    }

    return inauspiciousArdhapraharas;
};

export { getArdhaprahara };
