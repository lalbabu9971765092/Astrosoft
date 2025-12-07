// src/components/CustomDetailedPlanetTable.jsx
import React from 'react';
import { useTranslation } from 'react-i18next';
import {
    convertToDMS,
    convertDMSToDegrees,
    calculateRashi,
    calculateHouse,
    calculateNakshatraPada,
    calculateNakshatraDegree
} from './AstrologyUtils';

const CustomDetailedPlanetTable = ({ planets, houses, planetDetails, planetOrder, columns }) => {
    const { t } = useTranslation();

    const hasPlanetPosData = planets && Object.keys(planets).length > 0;
    const hasHouseData = Array.isArray(houses) && houses.length === 12;

    const placidusCuspDegrees = React.useMemo(() => {
        if (!hasHouseData) return [];
        const degrees = houses.map(h => convertDMSToDegrees(h?.start_dms));
        if (degrees.some(isNaN)) {
            console.warn("Could not convert all Placidus cusp start_dms to degrees.");
            return [];
        }
        return degrees;
    }, [houses, hasHouseData]);

    const canRenderPlanetTable = hasPlanetPosData && hasHouseData && placidusCuspDegrees.length === 12;

    if (!canRenderPlanetTable) {
        return <p className="result-text">{t('planetDetailsPage.planetDataUnavailable')}</p>;
    }

    // Define a map for all possible columns and their rendering logic
    const COLUMN_MAP = {
        planet: {
            header: t('planetTableHeaders.planet'),
            render: (planetName, data) => t(`planets.${planetName}`, { defaultValue: planetName })
        },
        position: {
            header: t('planetTableHeaders.position'),
            render: (planetName, data) => data.planetData.dms ?? t('utils.notAvailable', 'N/A')
        },
        dignity: {
            header: t('planetTableHeaders.dignity'),
            render: (planetName, data) => data.avasthas?.dignity ?? t('utils.notAvailable', 'N/A')
        },
        balaadi: {
            header: t('planetTableHeaders.balaadi'),
            render: (planetName, data) => data.avasthas?.balaadi ?? t('utils.notAvailable', 'N/A')
        },
        jagradadi: {
            header: t('planetTableHeaders.jagradadi'),
            render: (planetName, data) => data.avasthas?.jagradadi ?? t('utils.notAvailable', 'N/A')
        },
        deeptaadi: {
            header: t('planetTableHeaders.deeptaadi'),
            render: (planetName, data) => data.avasthas?.deeptaadi ?? t('utils.notAvailable', 'N/A')
        },
        speed: {
            header: t('planetTableHeaders.speed'),
            render: (planetName, data) => data.speed ?? t('utils.notAvailable', 'N/A')
        },
        retrograde: {
            header: t('planetTableHeaders.retrograde'),
            render: (planetName, data) => data.avasthas?.isRetrograde ? t('common.yes', 'Yes') : t('common.no', 'No')
        },
        combust: {
            header: t('planetTableHeaders.combust'),
            render: (planetName, data) => data.avasthas?.isCombust ? t('common.yes', 'Yes') : t('common.no', 'No')
        },
        nakPada: {
            header: t('planetTableHeaders.nakPada'),
            render: (planetName, data) => `${t(`nakshatras.${data.nakshatraKey}`, { defaultValue: data.nakshatraKey ?? t('utils.notAvailable', 'N/A') })} (${t('astrologyForm.padaLabel')}${data.pada})`
        },
        nakLord: {
            header: t('planetTableHeaders.nakLord'),
            render: (planetName, data) => t(`planets.${data.nakLordKey}`, { defaultValue: data.nakLordKey ?? t('utils.notAvailable', 'N/A') })
        },
        subLord: {
            header: t('planetTableHeaders.subLord'),
            render: (planetName, data) => t(`planets.${data.subLordKey}`, { defaultValue: data.subLordKey ?? t('utils.notAvailable', 'N/A') })
        },
        subSub: {
            header: t('planetTableHeaders.subSub'),
            render: (planetName, data) => t(`planets.${data.subSubLordKey}`, { defaultValue: data.subSubLordKey ?? t('utils.notAvailable', 'N/A') }),
            className: "subsub-col"
        },
        nakDeg: {
            header: t('planetTableHeaders.nakDeg'),
            render: (planetName, data) => data.degreeWithinNakshatra,
            className: "nak-deg-col"
        },
        rashi: {
            header: t('planetTableHeaders.rashi'),
            render: (planetName, data) => t(`rashis.${data.rashiKey}`, { defaultValue: data.rashiKey ?? t('utils.notAvailable', 'N/A') })
        },
        rashiLord: {
            header: t('planetTableHeaders.rashiLord'),
            render: (planetName, data) => t(`planets.${data.rashiLordKey}`, { defaultValue: data.rashiLordKey ?? t('utils.notAvailable', 'N/A') })
        },
        bhava: {
            header: t('planetTableHeaders.bhava'),
            render: (planetName, data) => data.house
        }
    };

    // Filter columns based on the 'columns' prop
    const columnsToRender = columns || Object.keys(COLUMN_MAP); // Default to all if not specified

    return (
        <div className="table-wrapper">
            <table className="results-table planets-table">
                <thead>
                    <tr>
                        {columnsToRender.map(colKey => COLUMN_MAP[colKey] ? (
                            <th key={colKey} className={COLUMN_MAP[colKey].className}>
                                {COLUMN_MAP[colKey].header}
                            </th>
                        ) : null)}
                    </tr>
                </thead>
                <tbody>
                    {planetOrder.map((body) => {
                        const planetData = planets[body];
                        if (!planetData) return null;
                        const siderealDeg = convertDMSToDegrees(planetData.dms);
                        if (isNaN(siderealDeg) || planetData.dms === "Error") {
                            // If only 'planet' column is requested, just render that, otherwise colSpan full table width
                            if (columnsToRender.length === 1 && columnsToRender[0] === 'planet') {
                                return (<tr key={body}><td>{t(`planets.${body}`, { defaultValue: body })}</td></tr>);
                            }
                            return (<tr key={body}><td>{t(`planets.${body}`, { defaultValue: body })}</td><td colSpan={columnsToRender.length - 1}>{t('planetDetailsPage.planetDataError')}</td></tr>);
                        }
                        const pada = planetData.pada ?? calculateNakshatraPada(siderealDeg, t);
                        const degreeWithinNakshatra = convertToDMS(calculateNakshatraDegree(siderealDeg), t);
                        const rashiKey = planetData.rashi ?? calculateRashi(siderealDeg, t);
                        const house = calculateHouse(siderealDeg, placidusCuspDegrees, t);
                        const nakshatraKey = planetData.nakshatra;
                        const nakLordKey = planetData.nakLord;
                        const subLordKey = planetData.subLord;
                        const subSubLordKey = planetData.subSubLord;
                        const rashiLordKey = planetData.rashiLord;
                        const speed = planetData.speedLongitude?.toFixed(4);
                        const avasthas = planetData.avasthas;

                        const rowData = {
                            planetData, siderealDeg, pada, degreeWithinNakshatra, rashiKey, house, nakshatraKey,
                            nakLordKey, subLordKey, subSubLordKey, rashiLordKey, speed, avasthas
                        };

                        return (
                            <tr key={body}>
                                {columnsToRender.map(colKey => COLUMN_MAP[colKey] ? (
                                    <td key={`${body}-${colKey}`} className={COLUMN_MAP[colKey].className}>
                                        {COLUMN_MAP[colKey].render(body, rowData)}
                                    </td>
                                ) : null)}
                            </tr>
                        );
                    })}
                </tbody>
            </table>
        </div>
    );
};

export default CustomDetailedPlanetTable;