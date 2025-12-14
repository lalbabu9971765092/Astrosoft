import React from 'react';
import PropTypes from 'prop-types';
import { useTranslation } from 'react-i18next';
// No need to import convertDMSToDegrees here as it's not used directly in this component

const HouseDetailsTable = ({ houses }) => {
  const { t } = useTranslation();

  if (!houses || !Array.isArray(houses) || houses.length === 0) {
    return <p className="result-text">{t('divisionalChartsPage.houseDataUnavailable', 'House data unavailable.')}</p>;
  }

  return (
    <div className="house-details-table-container">
      <table className="results-table houses-table">
        <thead>
          <tr>
            <th>{t('astrologyForm.houseTableHHeader', 'House')}</th>
            <th>{t('astrologyForm.houseTableCuspStartHeader', 'Cusp Start')}</th>
            <th>{t('astrologyForm.houseTableMeanCuspHeader', 'Mean Cusp')}</th>
            <th>{t('astrologyForm.houseTableEndCuspHeader', 'Cusp End')}</th>
            <th>{t('astrologyForm.houseTableRashiHeader', 'Rashi')}</th>
            <th>{t('astrologyForm.houseTableRashiLordHeader', 'Rashi Lord')}</th>
            <th>{t('astrologyForm.houseTableNakHeader', 'Nakshatra')}</th>
            <th>{t('astrologyForm.houseTableNakLordHeader', 'Nakshatra Lord')}</th>
            <th>{t('astrologyForm.houseTableSubLordHeader', 'Sub Lord')}</th>
          </tr>
        </thead>
        <tbody>
          {houses.map((house) => (
            <tr key={house.house_number}>
              <td>{house.house_number ?? t('utils.notAvailable', 'N/A')}</td>
              <td>{house.start_dms ?? t('utils.notAvailable', 'N/A')}</td>
              <td>{house.mean_dms ?? t('utils.notAvailable', 'N/A')}</td>
              <td>{house.end_dms ?? t('utils.notAvailable', 'N/A')}</td>
              <td>{t(`rashis.${house.start_rashi}`, { defaultValue: house.start_rashi ?? t('utils.notAvailable', 'N/A') })}</td>
              <td>{t(`planets.${house.start_rashi_lord}`, { defaultValue: house.start_rashi_lord ?? t('utils.notAvailable', 'N/A') })}</td>
              <td>{t(`nakshatras.${house.start_nakshatra}`, { defaultValue: house.start_nakshatra ?? t('utils.notAvailable', 'N/A') })}</td>
              <td>{t(`planets.${house.start_nakshatra_lord}`, { defaultValue: house.start_nakshatra_lord ?? t('utils.notAvailable', 'N/A') })}</td>
              <td>{t(`planets.${house.start_sub_lord}`, { defaultValue: house.start_sub_lord ?? t('utils.notAvailable', 'N/A') })}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

HouseDetailsTable.propTypes = {
  houses: PropTypes.arrayOf(PropTypes.shape({
    house_number: PropTypes.number,
    start_dms: PropTypes.string,
    mean_dms: PropTypes.string,
    end_dms: PropTypes.string,
    start_rashi: PropTypes.string,
    start_rashi_lord: PropTypes.string,
    start_nakshatra: PropTypes.string,
    start_nakshatra_lord: PropTypes.string,
    start_sub_lord: PropTypes.string,
  })),
};

export default HouseDetailsTable;
