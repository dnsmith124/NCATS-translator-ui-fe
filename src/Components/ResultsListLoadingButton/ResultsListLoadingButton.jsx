import styles from './ResultsListLoadingButton.module.scss';
import loadingIcon from '../../Assets/Images/Loading/loading-purple.png';
import ResultsAvailableIcon from '../../Icons/Alerts/Checkmark.svg?react';
import CompleteIcon from '../../Icons/Alerts/Checkmark.svg?react';
import TextCrossfade from '../TextCrossfade/TextCrossfade';

const ResultsListLoadingButton = ({ data = {} }) => {

  const containerClassName = (data.containerClassName) ? data.containerClassName : '';
  const buttonClassName = (data.buttonClassName) ? data.buttonClassName : '';

  return(
    <div 
      className={`${containerClassName} ${styles.loadingButtonContainer}`}
      >
      {
        (!data.hasFreshResults && !data.isFetchingARAStatus && !data.isFetchingResults) &&
        <div className={styles.complete}>
          <CompleteIcon/>
          <span>Results Complete</span>
        </div>
      }
      {
        (!data.hasFreshResults && (data.isFetchingARAStatus || data.isFetchingResults)) &&
        <button className={`${buttonClassName} ${styles.loadingButton} ${styles.inactive}`}>
          <img src={loadingIcon} className={styles.loadingButtonIcon} alt="results button loading icon"/>
          <TextCrossfade small />
        </button>
      }
      {
        (data.hasFreshResults) &&
        <>
          <button onClick={data.handleResultsRefresh} className={`${buttonClassName} ${styles.loadingButton} ${styles.active}`}>
            {
              (data.isFetchingARAStatus || data.isFetchingResults) &&
              <img src={loadingIcon} className={styles.loadingButtonIcon} alt="results button loading icon"/>
            }
            {
              !(data.isFetchingARAStatus || data.isFetchingResults) &&
              <ResultsAvailableIcon/>
            }
            <span>Load New Results</span>
          </button>
          {
            data.showDisclaimer &&
            <p className={styles.refreshDisclaimer}>Please note that refreshing this page may cause the order of answers to change.<br/>Results you have already viewed may also be updated with new data.</p>
          }
        </>
      }
    </div>
  )
}

export default ResultsListLoadingButton;