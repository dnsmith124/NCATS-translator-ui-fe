import {useState, useEffect, useRef, useMemo, useCallback} from "react";
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import QueryBar from "../QueryBar/QueryBar";
import OutsideClickHandler from "../OutsideClickHandler/OutsideClickHandler";
import { incrementHistory } from "../../Redux/historySlice";
import { currentConfig, currentRoot } from "../../Redux/rootSlice";
import { setCurrentQuery } from "../../Redux/querySlice";
import { setCurrentQueryResultsID, setCurrentResults } from "../../Redux/resultsSlice";
import cloneDeep from "lodash/cloneDeep";
import _ from "lodash";
import { filterAndSortExamples, getAutocompleteTerms } from "../../Utilities/autocompleteFunctions";
import { getEntityLink, generateEntityLink, getLastItemInArray } from "../../Utilities/utilities";
import Question from '../../Icons/Navigation/Question.svg?react';
import Drug from '../../Icons/drug.svg?react';
import Disease from '../../Icons/disease2.svg?react';
import Chemical from '../../Icons/Queries/Chemical.svg?react';
import Gene from '../../Icons/Queries/Gene.svg?react';
import Back from '../../Icons/Directional/Undo.svg?react';
import Search from '../../Icons/Buttons/Search.svg?react';
import ArrowForward from '../../Icons/Directional/arrow_forward.svg?react';
import loadingIcon from '../../Assets/Images/Loading/loading-purple.png';
import styles from './Query.module.scss';
import { getResultsShareURLPath } from "../../Utilities/resultsInteractionFunctions";
import { queryTypes } from "../../Utilities/queryTypes";
import AutoHeight from "../AutoHeight/AutoHeight";
import { Link, useLocation } from "react-router-dom";
import ExampleQueryList from "../ExampleQueryList/ExampleQueryList";

const Query = ({results, loading, initPresetTypeObject = null, initNodeLabelParam, initNodeIdParam, nodeDescription}) => {

  // Utilities for navigation and application state dispatch
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { pathname } = useLocation();
  const root = useSelector(currentRoot);
  const config = useSelector(currentConfig);

  loading = (loading) ? true : false;

  // Bool, are the results loading
  const [isLoading, setIsLoading] = useState(loading);
  // Bool, is there an error in the submission
  const [isError, setIsError] = useState(false);
  // String, error text
  const [errorText, setErrorText] = useState('');
  // String, input text from query var
  const [inputText, setInputText] = useState(initNodeLabelParam);

  // build initial node from query vars
  const initSelectedNode = (initNodeIdParam && initNodeLabelParam) ? {id: initNodeIdParam, label: initNodeLabelParam} : null;
  const initQueryItem = {
    type: initPresetTypeObject, 
    node: initSelectedNode
  };
  // Array, currently selected query item
  const [queryItem, setQueryItem] = useState(initQueryItem);
  // Array, for use in useEffect hooks with queryItems as a dependency
  var prevQueryItems = useRef([initQueryItem]);

  // Function, type to send to autocomplete for result filtering
  const autocompleteFunctions = useRef(null);
  const limitPrefixes = useRef(null);
  const limitType = useRef(null);
  // Array, List of items to display in the autocomplete window
  const [autocompleteItems, setAutoCompleteItems] = useState(null);
  // Bool, are autocomplete items loading
  const [loadingAutocomplete, setLoadingAutocomplete] = useState(false);
  // Function, delay query for fetching autocomplete items by 750ms each time the user types, so we only send a request once they're done
  const delayedQuery = useMemo(() => _.debounce(
    (inputText, setLoadingAutocomplete, setAutoCompleteItems, autocompleteFunctions, limitType, limitPrefixes) =>
      getAutocompleteTerms(inputText, setLoadingAutocomplete, setAutoCompleteItems, autocompleteFunctions, limitType, limitPrefixes), 750), []
  );

  // String, used to set navigation url for example disease buttons
  const [presetURL, setPresetURL] = useState(false);

  const exampleDiseases = (!config?.cached_queries) 
    ? null
    : filterAndSortExamples(config.cached_queries, 'drug');
  const exampleChemsUp = (!config?.cached_queries) 
    ? null
    : filterAndSortExamples(config.cached_queries, 'gene', 'increased');
  const exampleChemsDown = (!config?.cached_queries) 
    ? null
    : filterAndSortExamples(config.cached_queries, 'gene', 'decreased');
  const exampleGenesUp = (!config?.cached_queries) 
    ? null
    : filterAndSortExamples(config.cached_queries, 'chemical', 'increased');
  const exampleGenesDown = (!config?.cached_queries) 
    ? null
    : filterAndSortExamples(config.cached_queries, 'chemical', 'decreased');

  const [selectedUpperButton, setSelectedUpperButton] = useState(null);
  const [selectedMiddleButton, setSelectedMiddleButton] = useState(null);
  const [selectedLowerButton, setSelectedLowerButton] = useState(null);

  const submitQuery = (item) => {

    const handleRevertQueryItem = (item) => {
      setInputText(item.node.label);
      setQueryItem(item);
      dispatch(setCurrentQuery(item));
    }

    let timestamp = new Date();

    // Reset the current results in the application state
    dispatch(setCurrentResults({}));
    // Set isLoading to true
    setIsLoading(true);

    let queryJson = JSON.stringify({curie: item.node.id, type: item.type.targetType, direction: item.type.direction});

    // submit query to /query
    const requestOptions = {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: queryJson
    };
    fetch(`/${root}/api/v1/pub/query`, requestOptions)
      .then(response => response.json())
      .then(data => {
        console.log(data)
        if(data.data && data.status === 'success') {
          // Update the currentQueryResultsID in the application state
          dispatch(setCurrentQueryResultsID(data.data));
          // Update the query history in the application state
          dispatch(
            incrementHistory(
              {
                item: item,
                date: timestamp.toDateString(),
                time: timestamp.toLocaleTimeString([], {hour12: true, hour: 'numeric', minute:'2-digit'}),
                id: data.data
              }
            )
          );
        }
        let newQueryPath = getResultsShareURLPath(item.node.label, item.node.id, item.type.id, data.data);

        // If we're submitting from the results page
        if(window.location.href.includes('results')) {

          // set isLoading to false so we can submit another query if we want to
          setIsLoading(false);

          // Then open the new query in a new tab
          window.open( newQueryPath, "_blank", "noopener");

          // reset the query bar back to the values for the current query
          // remove most recently added item (the query item we just submitted)
          let newPrevQueryItems = cloneDeep(prevQueryItems.current).slice(0,-1);
          
          prevQueryItems.current = newPrevQueryItems;

          let originalQueryItem = getLastItemInArray(newPrevQueryItems);
          handleRevertQueryItem(originalQueryItem);
        } else {
          // Otherwise, navigate to the results page 
          navigate(newQueryPath);
        }
      })
      .catch((error) => {
        console.log(error)
      });
  }

  const updateQueryItem = (selectedNode = {id:'', label: ''}) => {
    // add in match text for genes, which should be the species
    if(selectedNode.id.includes("NCBIGene") && selectedNode?.match)
      selectedNode.label += ` (${selectedNode.match})`;

    setInputText(selectedNode.label);
    setQueryItem(
      prev => {
        let newQueryItem = {
          type: prev.type,
          node: selectedNode
        }
        dispatch(setCurrentQuery(newQueryItem));
        let newPrevItems = cloneDeep(prevQueryItems.current);
        newPrevItems.push(newQueryItem);
        prevQueryItems.current = newPrevItems;

        if(selectedNode.id !== '' && selectedNode.label !== '') {
          handleSubmission(newQueryItem);
        }
        return newQueryItem;
      }
    )
  }

  // Event handler called when search bar is updated by user
  const handleQueryItemChange = useCallback((e) => {
    if(Object.keys(queryItem.type).length) {
      delayedQuery(e, setLoadingAutocomplete, setAutoCompleteItems, autocompleteFunctions.current, limitType.current, limitPrefixes.current);
      setInputText(e);
    } else {
      setIsError(true);
    }
  },[setLoadingAutocomplete, setAutoCompleteItems, setInputText, setIsError, delayedQuery, queryItem.type]);

  const clearAutocompleteItems = () => {
    setAutoCompleteItems(null);
  }

  const clearSelectedItem = () => {
    updateQueryItem();
  }

  const handleQueryTypeChange = (value, resetInputText) => {
    setIsError(false);
    const newQueryType = queryTypes.find(type => {
      return type.id === parseInt(value)
    })
    autocompleteFunctions.current = newQueryType.functions;
    limitType.current = newQueryType.filterType;
    limitPrefixes.current = newQueryType.limitPrefixes;
    clearAutocompleteItems();
    if(resetInputText || resetInputText === undefined) {
      setQueryItem({node: {}, type: newQueryType});
      clearSelectedItem();
    } else {
      setQueryItem((prev) => {return {...prev, type: newQueryType}});
    }
  }

  // Handler for item selection (template click or autocomplete item click)
  const handleItemSelection = (item) => {
    setIsError(false);
    updateQueryItem(item);

    if(autocompleteItems) {
      clearAutocompleteItems();
    }
  }

  // Validation function for submission
  const validateSubmission = (item) => {
    if(item.node === null || item.node.id === "") {
      setIsError(true);
      setErrorText("No term selected, please select a valid term.");
      return;
    }
    if(item.type === null || item.type.id === "") {
      setIsError(true);
      setErrorText("No query type selected, please select a valid query type.");
      return;
    }

    submitQuery(item);
  }

  // Event handler for form submission
  const handleSubmission = (item) => {
    validateSubmission(item);
  }

  const handleSelectUpperButton = (index) => {
    setSelectedLowerButton(null);
    setSelectedMiddleButton(null);
    setSelectedUpperButton(index);

    // if we've picked drug/disease, set the query type to 0 and reset the input text
    if(index === 0) {
      handleQueryTypeChange(0, true);
    }
  }

  const handleSelectMiddleButton = (index) => {
    setSelectedLowerButton(null);
    setSelectedMiddleButton(index);
  }

  const handleSelectLowerButton = (index, prevIndex) => {
    setSelectedLowerButton(index);
    // if prevIndex is null, we're coming from another upper button, so reset the input text. otherwise keep it the same.
    const resetInputText = (prevIndex === null) ? true : false;
    switch (selectedMiddleButton) {
      case 0:
        if(index === 0)
          handleQueryTypeChange(1, resetInputText);
        else 
          handleQueryTypeChange(2, resetInputText);
        break;
      case 1:
        if(index === 0)
          handleQueryTypeChange(3, resetInputText);
        else 
          handleQueryTypeChange(4, resetInputText);
        break;
      default:
        break;
    }
  }

  useEffect(() => {
    setIsLoading(loading);
  }, [loading]);

  useEffect(() => {
    if(presetURL) {
      const timer = setTimeout(() => {
        let cleanedURL = presetURL.replaceAll("//", "/");
        navigate(cleanedURL);
      }, 100 );
      return () => {
        clearTimeout(timer);
      }
    }
  }, [presetURL, navigate]);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  return (
    <>
      <div className={`${styles.query}`} >
        <AutoHeight className={styles.autoHeightContainer}>
          <div className={`${styles.container}`}>
            {results 
              ?
              <>
                <div className={styles.resultsHeader}>
                  <div className={styles.buttons}>
                    <Link to={`/${root}`} className={styles.button}><Back/>Return To Home Page</Link>
                    {
                      root !== 'demo' &&
                      <Link to={`/${root}`} target="_blank" className={`${styles.button} ${styles.buttonTwo}`}><Search className={styles.svgFillWhite}/>Submit Another Query</Link>
                    }
                  </div>
                  <div className={styles.showingResultsContainer}>
                    <div>
                      <h4 className={styles.showingResultsText}>Showing results for:</h4>
                      <h5 className={styles.subHeading}>{queryItem.type.label}: 
                        {(queryItem?.node?.id && 
                          generateEntityLink(queryItem.node.id, styles.searchedTerm, ()=>queryItem.node.label, false)) 
                          ?
                            generateEntityLink(queryItem.node.id, styles.searchedTerm, ()=>queryItem.node.label, false)
                          :
                            <span className={styles.searchedTerm}>{queryItem.node && queryItem.node.label}</span>
                        }
                      </h5>
                    </div>
                    <div className={styles.nodeDescriptionContainer}>
                      {
                        nodeDescription && 
                        <>
                          <p className={styles.nodeDescriptionHeading}>Description:</p>
                          <p className={styles.nodeDescription}>{nodeDescription}</p>
                        </>
                      }
                    </div>
                  </div>
                </div>
              </>
              :
              <>
                <h4 className={styles.heading}>What relationship would you like to explore?</h4>
                <div className={styles.upperButtons}>
                  <button className={`${styles.upperButton} ${selectedUpperButton === 0 ? styles.selected : ''}`} onClick={()=>handleSelectUpperButton(0)} data-testid="drug-disease-selector">
                    <Drug/>Drug <ArrowForward className={styles.arrow} /> <Disease/>Disease
                  </button>
                  <button className={`${styles.upperButton} ${selectedUpperButton === 1 ? styles.selected : ''}`} onClick={()=>handleSelectUpperButton(1)}>
                    <Gene/>Genes <span className={styles.dualArrows}><ArrowForward/><ArrowForward/></span> <Chemical/>Chemicals
                  </button>
                </div>
                {selectedUpperButton > 0 &&  
                  <div className={`${styles.middleButtons} visible`}>
                    <button className={`${styles.middleButton} ${selectedMiddleButton === 0 ? styles.selected : ''}`} onClick={()=>handleSelectMiddleButton(0)}>
                      Find chemicals that regulate a particular gene
                    </button>
                    <button className={`${styles.middleButton} ${selectedMiddleButton === 1 ? styles.selected : ''}`} onClick={()=>handleSelectMiddleButton(1)}>
                      Find genes regulated by a particular chemical
                    </button>
                  </div>
                }
                {selectedUpperButton > 0 && selectedMiddleButton !== null &&
                  <div className={`${styles.lowerButtons} visible`}>
                    <button className={`${styles.lowerButton} ${selectedLowerButton === 0 ? styles.selected : ''}`} onClick={()=>handleSelectLowerButton(0, selectedLowerButton)}>
                      Upregulators
                    </button>
                    <button className={`${styles.lowerButton} ${selectedLowerButton === 1 ? styles.selected : ''}`} onClick={()=>handleSelectLowerButton(1, selectedLowerButton)}>
                      Downregulators
                    </button>
                  </div>
                }
                {isError &&
                  <p className={styles.error}>{errorText}</p>
                }
                {(selectedLowerButton !== null || selectedUpperButton === 0) && root !== 'demo' &&
                  <OutsideClickHandler onOutsideClick={()=>{clearAutocompleteItems();}} className={styles.queryBarContainer}>
                    <QueryBar
                      handleSubmission={handleSubmission}
                      handleChange={handleQueryItemChange}
                      handleQueryTypeChange={handleQueryTypeChange}
                      value={inputText}
                      queryType={queryItem.type}
                      autocompleteItems={autocompleteItems}
                      autocompleteLoading={loadingAutocomplete}
                      handleItemClick={handleItemSelection}
                    />
                    { 
                      <img src={loadingIcon} className={`${styles.loadingIcon} ${isLoading ? styles.active : ''} loadingIcon`} alt="loading icon"/>
                    }
                  </OutsideClickHandler>
                }
                {/* Example Diseases */}
                {selectedUpperButton === 0 &&
                  <ExampleQueryList 
                    examples={exampleDiseases} 
                    setPresetURL={setPresetURL} 
                    label="Example Diseases:"
                  />
                }
                {/* Examples for chemicals UPregulated by a particular gene */}
                {selectedUpperButton === 1 && selectedMiddleButton === 0 && selectedLowerButton === 0 &&
                  <ExampleQueryList 
                    examples={exampleGenesUp} 
                    setPresetURL={setPresetURL} 
                    label="Example Genes:"
                  />
                }
                {/* Examples for chemicals DOWNregulated by a particular gene */}
                {selectedUpperButton === 1 && selectedMiddleButton === 0 && selectedLowerButton === 1 &&
                  <ExampleQueryList 
                    examples={exampleGenesDown} 
                    setPresetURL={setPresetURL} 
                    label="Example Genes:"
                  />
                }
                {/* Examples for genes UPregulated by a particular chemical */}
                {selectedUpperButton === 1 && selectedMiddleButton === 1 && selectedLowerButton === 0 &&
                  <ExampleQueryList 
                    examples={exampleChemsUp} 
                    setPresetURL={setPresetURL} 
                    label="Example Chemicals:"
                  />
                }
                {/* Examples for genes DOWNregulated by a particular chemical */}
                {selectedUpperButton === 1 && selectedMiddleButton === 1 && selectedLowerButton === 1 &&
                  <ExampleQueryList 
                    examples={exampleChemsDown} 
                    setPresetURL={setPresetURL} 
                    label="Example Chemicals:"
                  />
                }
              </>
            }
            {queryItem?.node?.id &&
              <p className={styles.needHelp}>
                {getEntityLink(queryItem.node.id, styles.monarchLink, queryItem.type)}
              </p>
            }
            <p className={styles.needHelp}>
              <a href={`/${root}/help`} rel="noreferrer " target="_blank"><Question/> Need Help?</a>
            </p>
          </div>
        </AutoHeight>
      </div>
      <div className={styles.panels}>
          {results &&
          isLoading &&
            <div className="loading-results">
            </div>
          }
      </div>
    </>
  );
}


export default Query;
