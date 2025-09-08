import React from 'react';

/**
 * Translates a dynamic reason string by parsing it and reconstructing it with translated parts.
 * @param {string} reason - The English reason string from the API.
 * @param {function} t - The translation function from i18next.
 * @returns {string} The translated reason string.
 */
const translateReasonString = (reason, t) => {
    if (!reason) return '';

    // Split the reason into individual sentences to process them separately.
    const sentences = reason.split('.').map(s => s.trim()).filter(s => s.length > 0);

    const translatedSentences = sentences.map(sentence => {
        // Pattern 1: "Planet in house X (by Rashi count) from Y"
        let match = sentence.match(/(Mars|Sun|Moon|Mercury|Jupiter|Venus|Saturn|Rahu|Ketu) in house (\d+) \(by Rashi count\) from (Ascendant|Moon|Venus)/i);
        if (match) {
            const options = {
                0: t(`planets.${match[1]}`, match[1]),
                1: match[2],
                2: t(`doshaSources.${match[3]}`, match[3])
            };
            return t('doshaReasons.planetInHouseFromRashi', options);
        }

        // Pattern 2: "Planet in house X from Y" (must be checked after the more specific Rashi count pattern)
        match = sentence.match(/(Mars|Sun|Moon|Mercury|Jupiter|Venus|Saturn|Rahu|Ketu) in house (\d+) from (Ascendant|Moon|Venus)/i);
        if (match) {
            const options = {
                0: t(`planets.${match[1]}`, match[1]),
                1: match[2],
                2: t(`doshaSources.${match[3]}`, match[3])
            };
            return t('doshaReasons.planetInHouseFrom', options);
        }

        // Pattern 3: Kaalsarpa reason
        if (/Planets are found on both sides of the Rahu-Ketu axis/i.test(sentence)) {
            return t('doshaReasons.planetsBothSidesRahuKetu');
        }

        // Pattern 4: Mool Dosha reason
        match = sentence.match(/Moon is in ([\w\s]+), which is not a Gand Mool Nakshatra/i);
        if (match) {
            const options = {
                0: t('planets.Moon'),
                1: t(`nakshatras.${match[1].trim()}`, match[1].trim())
            };
            return t('doshaReasons.moonNotInGandMool', options);
        }

        // Pattern 4.1: Mool Dosha reason for PRESENT dosha
        match = sentence.match(/Moon is in ([\w\s]+), which is a Gand Mool Nakshatra/i);
        if (match) {
            const options = {
                0: t('planets.Moon'),
                1: t(`nakshatras.${match[1].trim()}`, { defaultValue: match[1].trim() })
            };
            return t('doshaReasons.moonInGandMool', options);
        }


        // Pattern 5: "Planet not found in dosha-causing houses (X, Y, Z) from A, B, or C"
        match = sentence.match(/(Mars) not found in dosha-causing houses \((.*?)\) from (.*)/i);
        if (match) {
            const sources = match[3].split(/, | or /).map(source => t(`doshaSources.${source.trim()}`, { defaultValue: source.trim() })).join(', ');
            const options = {
                0: t(`planets.${match[1]}`, match[1]),
                1: match[2],
                2: sources
            };
            return t('doshaReasons.planetNotFoundInHousesFrom', options);
        }

        // Pattern 6: Kaalsarpa reason "All planets (X) are located between Y"
        match = sentence.match(/All planets \((.*?)\) are located between (Ketu->Rahu|Rahu->Ketu)/i);
        if (match) {
            const options = {
                0: match[1], // e.g., "Sun to Saturn"
                1: match[2]  // e.g., "Ketu->Rahu"
            };
            return t('doshaReasons.allPlanetsBetweenAxis', options);
        }

        // Fallback for any unmatched sentences
        return sentence;
    });

    // Join the translated sentences back together.
    return translatedSentences.join('. ');
};
/**
 * Formats complex dosha information for display.
 * @param {string} doshaKey - The key for the dosha (e.g., 'mangal', 'kaalsarpa', 'mool').
 * @param {object} birthDoshas - The complete doshas object from the API response.
 * @param {function} t - The translation function from i18next.
 * @returns {React.ReactNode} A formatted and translated JSX element for display.
 */
export const formatDosha = (doshaKey, birthDoshas, t) => {
    if (!birthDoshas || !birthDoshas[doshaKey]) {
        return <span className="dosha-status dosha-na">{t('astrologyForm.doshaStatusNA', 'N/A')}</span>;
    }

    const doshaData = birthDoshas[doshaKey];

    if (doshaData.error) {
        return <span className="dosha-status dosha-error">{t('astrologyForm.doshaStatusError', 'Error')}</span>;
    }

    // Directly translate the reason string from the API response.
    // The key in the JSON file must exactly match `doshaData.reason`.
    // Provide the original English reason as a fallback.
    // We will now use our intelligent translator.
    const reasonText = doshaData.reason ? ` (${translateReasonString(doshaData.reason, t)})` : '';

    if (!doshaData.present) {
        return (
            <span className="dosha-status dosha-absent">
                {t('astrologyForm.doshaStatusAbsent', 'Absent')}
                <span className="dosha-reason">{reasonText}</span>
            </span>
        );
    }

    const cancellationText = (doshaData.cancellation && doshaData.cancellation.length > 0)
        ? ` (${t('astrologyForm.doshaCancelledLabel', 'Cancelled')}: ${
            doshaData.cancellation.map(reason => translateReasonString(reason, t)).join(', ')
          })`
        : '';

    return (
        <span className="dosha-status dosha-present">
            {t('astrologyForm.doshaStatusPresent', 'Present')}
            <span className="dosha-reason">{reasonText}</span>
            <span className="dosha-cancellation">{cancellationText}</span>
        </span>
    );
};