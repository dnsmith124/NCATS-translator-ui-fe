import styles from './Autocomplete.module.scss';
import loadingIcon from '../../Assets/Images/Loading/loading-purple.png';
import { useCallback, useState, useEffect } from 'react';
import { getMoreInfoLink, getIcon, formatBiolinkEntity } from '../../Utilities/utilities';
import Tooltip from '../Tooltip/Tooltip';

const Autocomplete = ({isLoading, items, handleItemClick}) => {

  const [numberVisibleItems, setNumberVisibleItems] = useState(0);
  const pageLength = 10;

  const showMoreItems = useCallback((e) => {
    if(!items)
      return;
    e.preventDefault();
    if(numberVisibleItems + pageLength >= items.length)
      setNumberVisibleItems(items.length);
    else
      setNumberVisibleItems((prev) => prev + pageLength);

  }, [numberVisibleItems, items]);

  const showFewerItems = useCallback((e) => {
    e.preventDefault();
    if(numberVisibleItems - pageLength <= pageLength)
      setNumberVisibleItems(pageLength);
    else
      setNumberVisibleItems((prevNumVisItems) => prevNumVisItems - pageLength);

  }, [numberVisibleItems]);

  useEffect(() => {
    if(!items)
      return;
    let initNumberVisibleItems = (items.length > pageLength) ? pageLength : items.length;
    setNumberVisibleItems(initNumberVisibleItems);
  }, [items]);

  return (
    <div
      className={`${styles.autocompleteContainer} ${(items || isLoading) ? styles.open : ''}`}
      data-testid="autocomplete-list"
      >
      {
        isLoading &&
        <img src={loadingIcon} className={styles.loadingIcon} alt="loading icon" />
      }
      {
        items && items.length === 1 && items[0] === 'node_norm_error' &&
        <p className={styles.nodeNormError}>Unable to retrieve search terms due to an outage with the Node Normalizer. Click <a href="https://smart-api.info/registry/translator?q=node%20normalizer&tags=translator" rel="noreferrer" target="_blank">here</a> for more details, or try again later.</p>
      }
      {
        items && items.length === 0 && !isLoading &&
        <p className={styles.noResults}>No matching terms were found, please adjust your search term and try again.</p>
      }
      {
        items && items.length > 0 && !isLoading && items[0] !== 'node_norm_error' && 
        <div>
          {
            items.slice(0, numberVisibleItems).map((item, i) => {
              const type = item.types[0];
              const typeString = formatBiolinkEntity(type);
              const icon = getIcon(type);
              return (
                  <div key={i} className={styles.item}>
                    <span className={styles.icon} data-tooltip-id={`${type}${item.label}-${i}`}>
                      {icon}
                      <Tooltip id={`${type}${item.label}-${i}`} place="left">
                        <span className={styles.tooltip}>{typeString}</span>
                      </Tooltip>
                    </span>
                    <span className={styles.term} onClick={()=>handleItemClick(item)}>
                      {item.label}{item.match && <span className={styles.match}>{` (${item.match})`}</span>}
                    </span>
                    {
                      type && 
                      <span className={styles.type}>{typeString}</span>
                    }
                    <span className={styles.link}>{getMoreInfoLink(item.id, styles.link)}</span>
                  </div>)
            })
          }
          {
            items && items.length > pageLength && !isLoading &&
            <>
              <div className={styles.sep}></div>
                <div className={styles.buttonsContainer}>
                    <button
                      onClick={(e)=>showMoreItems(e)}
                      className={`${styles.button} ${(numberVisibleItems < items.length) ? styles.active : styles.inactive}`}
                      >
                      Show More
                    </button>
                    <button
                      onClick={(e)=>showFewerItems(e)}
                      className={`${styles.button} ${styles.submitButton} ${(numberVisibleItems > pageLength) ? styles.active : styles.inactive}`}
                      >
                      Show Less
                    </button>
                </div>
              </>
            }
        </div>
      }
    </div>
  );
}

export default Autocomplete;
