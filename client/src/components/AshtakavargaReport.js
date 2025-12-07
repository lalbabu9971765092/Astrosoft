// client/src/components/AshtakavargaReport.js
import React from 'react';
import DiamondChart from './DiamondChart';
import { PLANET_ORDER } from './AstrologyUtils';

const AshtakavargaReport = ({ ashtakavargaData, houses, inputParams }) => {
    if (!ashtakavargaData) {
        return <div>Ashtakavarga data not available.</div>;
    }

    const { bhinna, sarva } = ashtakavargaData;
    const sarvaScores = sarva?.scores;

    const ashtakavargaPlanets = PLANET_ORDER.filter(p =>
        ["Sun", "Moon", "Mars", "Mercury", "Jupiter", "Venus", "Saturn"].includes(p)
    );

    const reportTitle = inputParams?.name ? `Ashtakavarga for ${inputParams.name}` : 'Ashtakavarga';

    return (
        <div>
            <h2>{reportTitle}</h2>
            {sarvaScores && (
                <div className="result-section sav-section">
                    <h3>Sarva Ashtakavarga</h3>
                    <DiamondChart
                        title="Sarva Ashtakavarga"
                        size={400}
                        houses={houses}
                        scores={sarvaScores}
                    />
                </div>
            )}
            {bhinna && (
                <div className="result-section bav-section">
                    <h3>Bhinna Ashtakavarga</h3>
                    <div className="bav-chart-grid">
                        {ashtakavargaPlanets.map(planetName => {
                            const planetBhinnaData = bhinna[planetName];
                            const bavScoresArray = planetBhinnaData?.scores ?? [];
                            const totalScore = planetBhinnaData?.total ?? 0;
                            const chartTitle = `${planetName}: ${totalScore}`;
                            const isValidScoreArray = Array.isArray(bavScoresArray);

                            return (
                                <div key={`bav-chart-container-${planetName}`}>
                                    <h4 className="chart-title">{chartTitle}</h4>
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
