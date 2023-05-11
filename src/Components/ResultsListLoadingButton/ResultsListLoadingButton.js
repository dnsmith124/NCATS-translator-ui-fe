import styles from './ResultsListLoadingButton.module.scss';
import loadingIcon from '../../Assets/Images/Loading/loading-purple.png';
import {ReactComponent as ResultsAvailableIcon} from '../../Icons/Alerts/Checkmark.svg';
import {ReactComponent as CompleteIcon} from '../../Icons/Alerts/Checkmark.svg';

const ResultsListLoadingButton = ({data}) => {

  const containerClassName = (data.containerClassName) ? data.containerClassName : '';
  const buttonClassName = (data.buttonClassName) ? data.buttonClassName : '';

  return(
    <div className={`${containerClassName} ${styles.loadingButtonContainer}`}>
      {
        (!data.isFetchingARAStatus && !data.isFetchingResults) &&
        <CompleteIcon/>
      }
      {
        (!data.hasFreshRawResults && (data.isFetchingARAStatus || data.isFetchingResults)) &&
        <button className={`${buttonClassName} ${styles.loadingButton} ${styles.inactive}`}>
          <img src={loadingIcon} className={styles.loadingButtonIcon} alt="results button loading icon"/>
          Calculating
        </button>
      }
      {
        (data.hasFreshRawResults && (data.isFetchingARAStatus || data.isFetchingResults)) &&
        <>
          <button onClick={data.handleResultsRefresh} className={`${buttonClassName} ${styles.loadingButton} ${styles.active}`}>
            {
              (data.isFetchingARAStatus) &&
              <img src={loadingIcon} className={styles.loadingButtonIcon} alt="results button loading icon"/>
            }
            {
              !data.isFetchingARAStatus &&
              <ResultsAvailableIcon/>
            }
            Load New Results
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