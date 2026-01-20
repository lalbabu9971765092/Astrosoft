// client/src/components/AshtakavargaReport.js
import React from 'react';
import DiamondChart from './DiamondChart';
import { PLANET_ORDER } from './AstrologyUtils';

import { useTranslation } from 'react-i18next';

const AshtakavargaReport = ({ ashtakavargaData, houses, inputParams }) => {
    const { t } = useTranslation();

    if (!ashtakavargaData) {
        return <div>{t('printableReport.ashtakavargaNotAvailable', 'Ashtakavarga data not available.')}</div>;
    }

    const { bhinna, sarva } = ashtakavargaData;
    const sarvaScores = sarva?.scores;

    const ashtakavargaPlanets = PLANET_ORDER.filter(p =>
        ["Sun", "Moon", "Mars", "Mercury", "Jupiter", "Venus", "Saturn"].includes(p)
    );

    const reportTitle = inputParams?.name 
        ? t('printableReport.ashtakavargaFor', { name: inputParams.name }) 
        : t('printableReport.ashtakavarga', 'Ashtakavarga');

    return (
        <div>
            <h2>{reportTitle}</h2>
            {sarvaScores && (
                <div className="result-section sav-section">
                    <DiamondChart
                        title={t('printableReport.sarvaAshtakavarga', 'Sarva Ashtakavarga')}
                        size={400}
                        houses={houses}
                        scores={sarvaScores}
                    />
                </div>
            )}
            {bhinna && (
                <div className="result-section bav-section">
                    <h3>{t('printableReport.bhinnaAshtakavarga', 'Bhinna Ashtakavarga')}</h3>
                    <div className="bav-chart-grid">
                        {ashtakavargaPlanets.map(planetName => {
                            const planetBhinnaData = bhinna[planetName];
                            const bavScoresArray = planetBhinnaData?.scores ?? [];
                            const totalScore = planetBhinnaData?.total ?? 0;
                            const chartTitle = `${t(`planets.${planetName}`, planetName)}: ${totalScore}`;
                            const isValidScoreArray = Array.isArray(bavScoresArray);

                            return (
                                <div key={`bav-chart-container-${planetName}`} style={{ pageBreakInside: 'avoid' }}>
                                    <DiamondChart
                                        title={chartTitle}
                                        size={300}
                                        houses={houses}
                                        scores={isValidScoreArray ? bavScoresArray : null}
                                    />
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}
        </div>
    );
};

export default AshtakavargaReport;
