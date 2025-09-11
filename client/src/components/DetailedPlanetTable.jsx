// src/components/DetailedPlanetTable.jsx
import React from 'react';
import { useTranslation } from 'react-i18next';
import {
    PLANET_ORDER,
    convertToDMS,
    convertDMSToDegrees,
    calculateRashi,
    calculateHouse,
    calculateNakshatraPada,
    calculateNakshatraDegree
} from './AstrologyUtils';

const DetailedPlanetTable = ({ planets, houses, planetDetails }) => {
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

    return (
        <div className="table-wrapper">
            <table className="results-table planets-table">
                <thead>
                    <tr>
                        <th>{t('planetTableHeaders.planet')}</th>
                        <th>{t('planetTableHeaders.position')}</th>
                        <th>{t('planetTableHeaders.state')}</th>
                        <th>{t('planetTableHeaders.speed')}</th>
                        <th>{t('planetTableHeaders.nakPada')}</th>
                        <th>{t('planetTableHeaders.nakLord')}</th>
                        <th>{t('planetTableHeaders.subLord')}</th>
                        <th>{t('planetTableHeaders.subSub')}</th>
                        <th>{t('planetTableHeaders.nakDeg')}</th>
                        <th>{t('planetTableHeaders.rashi')}</th>
                        <th>{t('planetTableHeaders.rashiLord')}</th>
                        <th>{t('planetTableHeaders.bhava')}</th>
                    </tr>
                </thead>
                <tbody>
                    {PLANET_ORDER.map((body) => {
                        const planetData = planets[body];
                        const planetStateKey = planetDetails?.states?.[body];
                        if (!planetData) return null;
                        const siderealDeg = convertDMSToDegrees(planetData.dms);
                        if (isNaN(siderealDeg) || planetData.dms === "Error") {
                            return (<tr key={body}><td>{t(`planets.${body}`, { defaultValue: body })}</td><td colSpan="11">{t('planetDetailsPage.planetDataError')}</td></tr>);
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

                        return (
                            <tr key={body}>
                                <td>{t(`planets.${body}`, { defaultValue: body })}</td>
                                <td>{planetData.dms ?? t('utils.notAvailable', 'N/A')}</td>
                                <td>{t(`planetStates.${planetStateKey}`, { defaultValue: planetStateKey ?? 'Unknown' })}</td>
                                <td>{speed ?? t('utils.notAvailable', 'N/A')}</td>
                                <td>{`${t(`nakshatras.${nakshatraKey}`, { defaultValue: nakshatraKey ?? t('utils.notAvailable', 'N/A') })} (${t('astrologyForm.padaLabel')}${pada})`}</td>
                                <td>{t(`planets.${nakLordKey}`, { defaultValue: nakLordKey ?? t('utils.notAvailable', 'N/A') })}</td>
                                <td>{t(`planets.${subLordKey}`, { defaultValue: subLordKey ?? t('utils.notAvailable', 'N/A') })}</td>
                                <td>{t(`planets.${subSubLordKey}`, { defaultValue: subSubLordKey ?? t('utils.notAvailable', 'N/A') })}</td>
                                <td>{degreeWithinNakshatra}</td>
                                <td>{t(`rashis.${rashiKey}`, { defaultValue: rashiKey ?? t('utils.notAvailable', 'N/A') })}</td>
                                <td>{t(`planets.${rashiLordKey}`, { defaultValue: rashiLordKey ?? t('utils.notAvailable', 'N/A') })}</td>
                                <td>{house}</td>
                            </tr>
                        );
                    })}
                </tbody>
            </table>
        </div>
    );
};

export default DetailedPlanetTable;
