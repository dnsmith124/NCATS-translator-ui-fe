import React, { useState, useEffect, useRef, useCallback } from "react";
import styles from './ResultsList.module.scss';
import Query from "../Query/Query";
import ResultsFilter from "../ResultsFilter/ResultsFilter";
import ResultsItem from "../ResultsItem/ResultsItem";
import EvidenceModal from "../Modals/EvidenceModal";
import ShareModal from "../Modals/ShareModal";
import Select from "../FormFields/Select";
import LoadingBar from "../LoadingBar/LoadingBar";
import { useSelector } from 'react-redux';
import { currentQueryResultsID, currentResults }from "../../Redux/resultsSlice";
import { currentQuery} from "../../Redux/querySlice";
import { QueryClient, QueryClientProvider, useQuery } from 'react-query';
import ReactPaginate from 'react-paginate';
import { sortNameLowHigh, sortNameHighLow, sortEvidenceLowHigh, sortByHighlighted,
  sortEvidenceHighLow, sortScoreLowHigh, sortScoreHighLow, sortByEntityStrings } from "../../Utilities/sortingFunctions";
import { getSummarizedResults, findStringMatch, removeHighlights } from "../../Utilities/resultsFunctions";
import { handleFetchErrors } from "../../Utilities/utilities";
import { cloneDeep, isEqual } from "lodash";
import {ReactComponent as ResultsAvailableIcon} from '../../Icons/Alerts/Checkmark.svg';
import loadingIcon from '../../Assets/Images/Loading/loading-purple.png';
import {ReactComponent as CompleteIcon} from '../../Icons/Alerts/Checkmark.svg';
import {ReactComponent as ShareIcon} from '../../Icons/Buttons/Export.svg';
import {ReactComponent as CloseIcon } from "../../Icons/Buttons/Close.svg"
import { unstable_useBlocker as useBlocker } from "react-router";
import NavConfirmationPromptModal from "../Modals/NavConfirmationPromptModal";

const ResultsList = ({loading}) => {

  let blocker = useBlocker(true);

  // URL search params
  const loadingParam = new URLSearchParams(window.location.search).get("loading")
  const queryIDParam = new URLSearchParams(window.location.search).get("q")
  const presetDiseaseLabelParam = new URLSearchParams(window.location.search).get("l")
  const presetQueryTypeIDParam = new URLSearchParams(window.location.search).get("t")

  let storedQuery = useSelector(currentQuery);
  storedQuery = (storedQuery !== undefined) ? storedQuery : {type:{}, node: {}};

  loading = (loading) ? loading : false;
  loading = (loadingParam === 'true') ? true : loading;
  let resultsState = useSelector(currentResults);
  resultsState = (resultsState !== undefined && Object.keys(resultsState).length === 0) ? null : resultsState;
  loading = (resultsState && Object.keys(resultsState).length > 0) ? false : loading;

  // Bool, did the results return an error
  // eslint-disable-next-line
  const [isError, setIsError] = useState(false);
  // Int, current query id from state
  const currentQueryResultsIDFromState = useSelector(currentQueryResultsID);
  // Int, current query id based on whether url param exists
  const currentQueryID = (queryIDParam) ? queryIDParam : currentQueryResultsIDFromState;
  // Bool, are the results still loading
  const presetIsLoading = (queryIDParam) ? true : loading;
  const [isLoading, setIsLoading] = useState(presetIsLoading);
  // Bool, should ara status be fetched
  const [isFetchingARAStatus, setIsFetchingARAStatus] = useState(presetIsLoading);
  // Bool, should results be fetched
  const [isFetchingResults, setIsFetchingResults] = useState(false);
  // Bool, are the results currently sorted by name (true/false for asc/desc, null for not set)
  const [isSortedByName, setIsSortedByName] = useState(null);
  // Bool, are the results currently sorted by evidence count (true/false for asc/desc, null for not set)
  const [isSortedByEvidence, setIsSortedByEvidence] = useState(null);
  // Bool, are the results currently sorted by score
  const [isSortedByScore, setIsSortedByScore] = useState(null);
  // Bool, is evidence modal open?
  const [evidenceOpen, setEvidenceOpen] = useState(false);
  // String, active title of evidence modal
  const [evidenceTitle, setEvidenceTitle] = useState('All Evidence');
  // Array, edges represented in current evidence
  const [evidenceEdges, setEvidenceEdges] = useState([]);
  // Array, evidence relating to the item last clicked
  const [currentEvidence, setCurrentEvidence] = useState([]);
  // Obj, original raw results from the BE
  const [rawResults, setRawResults] = useState(resultsState);
  // Obj, original raw results from the BE
  const [freshRawResults, setFreshRawResults] = useState(null);
  /*
    Ref, used to track changes in results for useEffect with 'results' obj as dependency
    b/c react doesn't deep compare objects in useEffect hook
  */
  const prevRawResults = useRef(rawResults);
  // Array, full result set sorted by any active sorting, but NOT filtered
  const [sortedResults, setSortedResults] = useState([]);
  // Array, results formatted by any active filters, sorted by any active sorting
  const [formattedResults, setFormattedResults] = useState([]);
  // Array, results meant to display based on the pagination
  const [displayedResults, setDisplayedResults] = useState([]);
  // Int, last result item index
  const [endResultIndex, setEndResultIndex] = useState(9);
  // Int, number of pages
  const [pageCount, setPageCount] = useState(0);
  // Int, current page
  const currentPage = useRef(0);
  // Int, current item offset (ex: on page 3, offset would be 30 based on itemsPerPage of 10)
  const [itemOffset, setItemOffset] = useState(0);
  // Array, currently active filters
  const [activeFilters, setActiveFilters] = useState([]);
  // Array, currently active filters
  const [availableTags, setAvailableTags] = useState([]);
  // Array, currently active string filters
  const [activeStringFilters, setActiveStringFilters] = useState([]);
  // Array, aras that have returned data
  const [returnedARAs, setReturnedARAs] = useState({aras: [], status: ''});
  // Bool, is fda tooltip currently active
  // const [fdaTooltipActive, setFdaTooltipActive] = useState(false);
  // Bool, have the initial results been sorted yet
  const presorted = useRef(false);
  const initPresetDisease = (presetDiseaseLabelParam) ? {id: '', label: presetDiseaseLabelParam} : null;
  const initPresetQueryTypeID = (presetQueryTypeIDParam) ? presetQueryTypeIDParam : null;
  // Obj, {label: ''}, used to set input text, determined by results object
  const [presetDisease, setPresetDisease] = useState(initPresetDisease);
  const [presetQueryTypeID, setPresetQueryTypeID] = useState(initPresetQueryTypeID);
  // Bool, is share modal open
  const [shareModalOpen, setShareModalOpen] = useState(false);
  // Int, number of times we've checked for ARA status. Used to determine how much time has elapsed for a timeout on ARA status.
  const numberOfStatusChecks = useRef(0);

  // handler for closing share modal
  const handleShareModalClose = () => {
    setShareModalOpen(false);
  }

  // Initialize queryClient for React Query to fetch results
  const queryClient = new QueryClient();
  // Int, how many items per page
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [newItemsPerPage, setNewItemsPerPage] = useState(null);

  // Handle Page Offset
  useEffect(() => {
    const endOffset = (itemOffset + itemsPerPage > formattedResults.length)
      ? formattedResults.length
      : itemOffset + itemsPerPage;
    setDisplayedResults(formattedResults.slice(itemOffset, endOffset));
    setEndResultIndex(endOffset);
    setPageCount(Math.ceil(formattedResults.length / itemsPerPage));
  }, [itemOffset, itemsPerPage, formattedResults]);

  // Handles direct page click
  const handlePageClick = useCallback((event) => {
    const newOffset = (event.selected * itemsPerPage) % formattedResults.length;
    currentPage.current = event.selected;
    setItemOffset(newOffset);
  }, [formattedResults.length, itemsPerPage]);

  // React Query call for status of results
  // eslint-disable-next-line
  const resultsStatus = useQuery('resultsStatus', async () => {
    console.log("Fetching current ARA status...");

    if(!currentQueryID)
      return;

    let queryIDJson = JSON.stringify({qid: currentQueryID});

    const requestOptions = {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: queryIDJson
    };
    // eslint-disable-next-line
    const response = await fetch('/creative_status', requestOptions)
      .then(response => handleFetchErrors(response))
      .then(response => response.json())
      .then(data => {
        // increment the number of status checks
        numberOfStatusChecks.current++;
        console.log("ARA status:",data);

        let fetchResults = false;

        if(data.data.aras.length > returnedARAs.aras.length) {
          console.log(`Old ARAs: ${returnedARAs.aras}, New ARAs: ${data.data.aras}`);
          setReturnedARAs(data.data);
          fetchResults = true;
        } else {
          console.log(`No new ARAs have returned data. Current status is: '${data.status}'`);
        }
        /*
        If status is success (meaning all ARAs have returned) or we've reached 120 status checks (meaning 20 min have elapsed)
        stop fetching ARA status and move to fetching results.
        */
        if(data.status === 'success' || numberOfStatusChecks.current >= 120) {
          setIsFetchingARAStatus(false);
          fetchResults = true;
        }
        if(fetchResults)
          setIsFetchingResults(true);
      })
      .catch((error) => {
        if(formattedResults.length <= 0) {
          setIsError(true);
          setIsFetchingARAStatus(false);
        }
        if(formattedResults.length > 0) {
          setIsFetchingARAStatus(false);
        }
        console.error(error)
      });
  }, {
    refetchInterval: 10000,
    enabled: isFetchingARAStatus,
    refetchOnWindowFocus: false
  });

  // React Query call for results
  // eslint-disable-next-line
  const resultsData = useQuery('resultsData', async () => {
    console.log("Fetching new results...");

    if(!currentQueryID)
      return;

    let queryIDJson = JSON.stringify({qid: currentQueryID});

    const requestOptions = {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: queryIDJson
    };
    // eslint-disable-next-line
    const response = await fetch('/creative_result', requestOptions)
      .then(response => response.json())
      .then(data => {
        console.log('New results:', data);
        // if we've already gotten results before, set freshRawResults instead to
        // prevent original results from being overwritten
        if(formattedResults.length > 0) {
          setFreshRawResults(data);
        } else {
          setRawResults(data);
        }

        setIsFetchingResults(false);
      })
      .catch((error) => {
        if(formattedResults.length <= 0) {
          setIsError(true);
          setIsFetchingARAStatus(false);
        }
        if(formattedResults.length > 0) {
          setIsFetchingARAStatus(false);
        }
        console.log(error);
      });
  }, {
    enabled: isFetchingResults,
    refetchOnWindowFocus: false,
  });

  // Handle the sorting
  const handleSort = useCallback((resultsToSort, sortName) => {
    let newSortedResults = cloneDeep(resultsToSort);
    switch (sortName) {
      case 'nameLowHigh':
        newSortedResults = sortNameLowHigh(newSortedResults);
        setIsSortedByName(true);
        setIsSortedByScore(null)
        setIsSortedByEvidence(null);
        break;
      case 'nameHighLow':
        newSortedResults = sortNameHighLow(newSortedResults);
        setIsSortedByName(false);
        setIsSortedByScore(null)
        setIsSortedByEvidence(null);
        break;
      case 'evidenceLowHigh':
        newSortedResults = sortEvidenceLowHigh(newSortedResults);
        setIsSortedByEvidence(false);
        setIsSortedByScore(null)
        setIsSortedByName(null);
        break;
      case 'evidenceHighLow':
        newSortedResults = sortEvidenceHighLow(newSortedResults);
        setIsSortedByEvidence(true);
        setIsSortedByScore(null)
        setIsSortedByName(null);
        break;
      case 'scoreLowHigh':
        newSortedResults = sortScoreLowHigh(newSortedResults);
        setIsSortedByScore(false)
        setIsSortedByEvidence(null);
        setIsSortedByName(null);
        break;
      case 'scoreHighLow':
        newSortedResults = sortScoreHighLow(newSortedResults);
        setIsSortedByScore(true)
        setIsSortedByEvidence(null);
        setIsSortedByName(null);
        break;
      case 'entityString':
        newSortedResults = sortByEntityStrings(newSortedResults, activeStringFilters);
        setIsSortedByEvidence(null);
        setIsSortedByName(null);
        break;
      default:
        break;
    }


    // if we're not already on page 1, reset to page one.
    if(currentPage.current !== 0)
      handlePageClick({selected: 0});

    return newSortedResults;
  }, [activeStringFilters, handlePageClick]);

  /*
    When the results change, which occurs when the React Query returns, handle the returned data
    based on the returned data's status.
  */
  useEffect(() => {
    // if we have no results, or the results aren't actually new, return
    if(rawResults == null || isEqual(rawResults, prevRawResults.current))
      return;

    // if results are new, set prevResults for future comparison
    prevRawResults.current = rawResults;

    let newResults = [];

    // if the status is not error, handle setting the results
    if(rawResults.status !== 'error' && rawResults.data.results !== undefined)
      newResults = getSummarizedResults(rawResults.data, presetDisease, setPresetDisease, availableTags, setAvailableTags);

      // set formatted results
    setFormattedResults(newResults);

    if(newResults.length > 0) {
      setSortedResults(handleSort(newResults, 'scoreHighLow'));
      presorted.current = true;
    } else {
      setSortedResults(newResults);
    }

  }, [rawResults, presetDisease, handleSort]);

  useEffect(() => {

    // we have results to show, set isLoading to false
    if (formattedResults.length > 0)
      setIsLoading(false);

    // If no results have returned from any ARAs, and ARA status is complete, set isLoading to false
    if(rawResults && rawResults.data.results && rawResults.data.results.length === 0 && !isFetchingARAStatus)
      setIsLoading(false);

  }, [formattedResults, rawResults, isFetchingARAStatus]);

  useEffect(() => {
    if(rawResults !== null)
      calculateTagCounts(formattedResults, rawResults, setAvailableTags);
  }, [formattedResults, rawResults]);

  useEffect(()=>{
    if(isError) {
      setIsLoading(false);
    }
  }, [isError]);

  const calculateTagCounts = (formattedResults, rawResults, tagSetterMethod) => {
    // create a list of tags from the list provided by the backend
    let countedTags = cloneDeep(rawResults.data.tags);
    for(const result of formattedResults) {
      // for each result's list of tags
      for(const tag of result.tags) {
        // if the tag exists on the list, either increment it or initialize its count
        if(countedTags.hasOwnProperty(tag)){
          if(!countedTags[tag].count)
            countedTags[tag].count = 1;
          else
            countedTags[tag].count++;
        // if it doesn't exist on the current list of tags, add it and initialize its count
        } else {
          countedTags[tag] = {name: tag, value: '', count: 1}
        }
      }
    }

    Object.entries(countedTags).forEach((tag)=> {
      if(tag[1].count === undefined || tag[1].count <= 0)
        delete countedTags[tag[0]];
    })

    tagSetterMethod(countedTags);
  }

  // Click handler for the modal close button
  const handleEvidenceModalClose = () => {
    setEvidenceOpen(false);
  }

  // Click handler for opening the evidence modal and populating the evidence
  const activateEvidence = (evidence, rawEdges) => {
    if(rawEdges) {
      setEvidenceTitle(`Showing evidence for:`)
      setEvidenceEdges(rawEdges);
    } else {
      setEvidenceTitle('All Evidence');
      setEvidenceEdges([]);
    }
    setCurrentEvidence(evidence);
    setEvidenceOpen(true);
  }

  // Handle the addition and removal of individual filters
  const handleFilter = (filter) => {

    let indexes = [];
    for(const [i, activeFilter] of activeFilters.entries() ) {
      if((activeFilter.type === filter.type && filter.type !== 'tag')
      || (filter.type === 'tag' && filter.value === activeFilter.value))
        indexes.push(i);
    }

    let newFilters = [...activeFilters];
    // If we don't find any matches, add the filter to the list
    if(indexes.length === 0) {
      newFilters.push(filter);
    // If there are matches, loop through them to determin whether we need to add, remove, or update
    } else {
      let addFilter = true;
      for(const index of indexes) {
        // if the values also match, it's a real match
        if (activeFilters[index].value === filter.value) {
          // set newFilters to a new array with any matches removed
          newFilters = activeFilters.reduce((result, value, i) => {
            if(i !== index) {
              result.push(value);
            }
            return result;
          }, []);
          addFilter = false;
        // If the values don't match and it's not a string search, update the value
        } else if(filter.type !== 'str') {
          newFilters = newFilters.map((value, i) => {
            if(i === index)
              value.value = filter.value;

            return value;
          });
          addFilter = false;
        // if the values don't match, but it *is* a new string search filter, add it
        } else if(activeFilters[index].value !== filter.value && filter.type === 'str') {
          addFilter = true;
        //
        } else {
          addFilter = false;
        }
      }
      if(addFilter)
        newFilters.push(filter);
    }
    setActiveFilters(newFilters);
  }

  // Output jsx for selected filters
  const getSelectedFilterDisplay = (element) => {
    let filterDisplay;
    switch (element.type) {
      case "hum":
        filterDisplay = <div>Species: <span>Human</span></div>;
        break;
      case "evi":
        filterDisplay = <div>Minimum Evidence: <span>{element.value}</span></div>;
        break;
      case "fda":
        filterDisplay = <div><span>FDA Approved</span></div>;
        break;
      case "date":
        filterDisplay = <div>Date of Evidence: <span>{element.value[0]}-{element.value[1]}</span></div>;
        break;
      case "str":
        filterDisplay = <div>String: <span>{element.value}</span></div>;
        break;
      case "otc":
        filterDisplay = <div><span>Available OTC</span></div>;
        break;
      case "tag":
        filterDisplay = <div>Tag:<span> {element.label}</span></div>;
        break;
      default:
        break;
    }
    return filterDisplay;
  }

  const handleClearAllFilters = () => {
    setActiveFilters([]);
  }

  const handleClearFilter = (filter) => {
    const newFilters = cloneDeep(activeFilters.filter((activeFilter) => {
      return activeFilter.type !== filter.type || activeFilter.value !== filter.value;
    }));

    if(filter.type === 'str') {
      let originalResults = removeHighlights([...sortedResults], filter.value);
      setFormattedResults(originalResults);
    }
    setActiveFilters(newFilters);
  }

  const handleResultsRefresh = () => {
    presorted.current = false;
    // Update rawResults with the fresh data
    setRawResults(freshRawResults);
    // Set freshRawResults back to null
    setFreshRawResults(null)
  }

  // Filter the results whenever the activated filters change
  useEffect(() => {
    // If there are no active filters, get the full result set and reset the activeStringFilters
    if(activeFilters.length === 0) {
      setFormattedResults(sortedResults);
      if(activeStringFilters.length > 0)
        setActiveStringFilters([]);
      return;
    }

    // if we're not already on page 1, reset to page one.
    if(currentPage.current !== 0)
      handlePageClick({selected: 0});

    let filteredResults = [];
    let sortedPaths = [];
    let originalResults = [...sortedResults];
    /*
      For each result, check against each filter. If a filter is triggered,
      set addElement to false and don't add the element to the filtered results
    */
    for(let element of originalResults) {
      let addElement = true;
      for(const filter of activeFilters) {
        switch (filter.type) {
          // Minimum evidence filter
          case 'evi':
            if(element.evidence.length < filter.value)
              addElement = false;
            break;
          // search string filter
          case 'str':
            [addElement, sortedPaths] = findStringMatch(element, filter.value);
            if (addElement) {
              element = cloneDeep(element);
              element.paths = cloneDeep(sortedPaths);
            }
            // handleSort('entityString');
            break;
          case 'otc':
            if(!element.tags.includes('otc'))
              addElement = false;
            break;
          case 'tag':
            if(!element.tags.includes(filter.value))
              addElement = false;
            break;
          // Add new filter tags in this way:
          case 'example':
            // if(false)
            //   addElement = false;
            break;
          default:
            break;
        }
      }

      if (addElement) {
        filteredResults.push(element);
      }
    }

    // Set the formatted results to the newly filtered results
    setFormattedResults(filteredResults);

    let newStringFilters = [];
    for(const filter of activeFilters) {
      // String filters with identical values shouldn't be added to the activeFilters array,
      // so we don't have to check for duplicate values here, just for the str tag.
      if(filter.type === 'str')
        newStringFilters.push(filter.value);
    }

    // if the new set of filters don't match the current ones, call setActiveStringFilters to update them
    if(!(newStringFilters.length === activeStringFilters.length && newStringFilters.every((value, index) => value === activeStringFilters[index])))
      setActiveStringFilters(newStringFilters);

    /*
      triggers on filter change and on sorting change in order to allow user to change
      the sorting on already filtered results
    */
  }, [activeFilters, sortedResults, activeStringFilters, handlePageClick]);

  useEffect(() => {
    if(activeFilters.some(activeFilter => activeFilter.type === 'str')) {
      // handleSort('entityString');
    }
  /*
    Providing handleSort as dependency leads to infinite loop on entityString search due to handleSort
    modifying one of its dependencies (sortedResults). Need to reimplement later so that I can supply
    handleSort as a dependency below and prevent future bugs in this useEffect hook.

    Good for now though.
  */
  // eslint-disable-next-line
  }, [activeFilters]);

  useEffect(() => {
    if(newItemsPerPage !== null) {
      setItemsPerPage(newItemsPerPage);
      setNewItemsPerPage(null);
      handlePageClick({selected: 0});
    }
  }, [newItemsPerPage, handlePageClick]);

  const displayLoadingButton = (
    handleResultsRefresh,
    styles,
    isFetchingARAStatus,
    loadingIcon,
    ResultsAvailableIcon,
    showDisclaimer) => {

    if(freshRawResults === null && (isFetchingARAStatus || isFetchingResults)) {
      return(
        <div className={styles.loadingButtonContainer}>
          <button className={`${styles.loadingButton} ${styles.inactive}`}>
            <img src={loadingIcon} className={styles.loadingButtonIcon} alt="results button loading icon"/>
            Loading
          </button>
        </div>
      )
    }

    if(freshRawResults !== null) {
      return (
        <div className={styles.loadingButtonContainer}>
          <button onClick={()=>{handleResultsRefresh()}} className={`${styles.loadingButton} ${styles.active}`}>
            {
              (isFetchingARAStatus) &&
              <img src={loadingIcon} className={styles.loadingButtonIcon} alt="results button loading icon"/>
            }
            {
              !isFetchingARAStatus &&
              ResultsAvailableIcon
            }
            Load New Results
          </button>
          {
            showDisclaimer &&
            <p className={styles.refreshDisclaimer}>Please note that refreshing this page may cause the order of answers to change.<br/>Results you have already viewed may also be updated with new data.</p>
          }
        </div>
      )
    }
  }

  return (
    <QueryClientProvider client={queryClient}>
      <EvidenceModal
        isOpen={evidenceOpen}
        onClose={()=>handleEvidenceModalClose()}
        className="evidence-modal"
        currentEvidence={currentEvidence}
        results={rawResults}
        title={evidenceTitle}
        edges={evidenceEdges}
      />
      <div className={styles.resultsList}>
        <Query results loading={isLoading} presetDisease={presetDisease} presetTypeID={presetQueryTypeID}/>
        <div className={`${styles.resultsContainer} container`}>
          {
            isLoading &&
            <LoadingBar
              loading={isLoading}
              useIcon
              disclaimerText={<>
                <p className={styles.loadingText}>We will start showing you results as soon as we have them. You'll be prompted to refresh the page as we load more results. <strong>Please note that refreshing the results page may cause the order of answers to change.</strong></p>
                <p className={styles.loadingText}>Navigating away from this page will cancel your search.</p></>
              }
            />
          }
          {
            !isLoading &&
            <>
              <ResultsFilter
                startIndex={itemOffset+1}
                endIndex={endResultIndex}
                formattedCount={formattedResults.length}
                totalCount={sortedResults.length}
                onFilter={handleFilter}
                onClearAll={handleClearAllFilters}
                activeFilters={activeFilters}
                availableTags={availableTags}
              />
              <div className={styles.resultsHeader}>
                <div className={styles.top}>
                  <div>
                    <h5>Results</h5>
                    {
                      formattedResults.length !== 0 &&
                      <p className={styles.resultsCount}>
                        Showing <span className={styles.range}>
                          <span className={styles.start}>{itemOffset + 1}</span>
                          -
                          <span>{endResultIndex}</span>
                        </span> of
                        <span className={styles.count}> {formattedResults.length} </span>
                        {
                          (formattedResults.length !== sortedResults.length) &&
                          <span className={styles.total}>({sortedResults.length}) </span>
                        }
                        <span> Results</span>
                      </p>
                    }
                  </div>
                  <div className={styles.right}>
                    {
                      displayLoadingButton(handleResultsRefresh, styles, isFetchingARAStatus, loadingIcon, <ResultsAvailableIcon/>, false)
                    }
                    {
                      !isFetchingARAStatus && !isFetchingResults &&
                      <CompleteIcon/>
                    }
                    <button
                      className={styles.shareButton}
                      onClick={()=>{setShareModalOpen(true)}}
                      >
                        <ShareIcon/>
                    </button>
                    <ShareModal
                      isOpen={shareModalOpen}
                      onClose={()=>handleShareModalClose()}
                      qid={currentQueryID}
                    />

                  </div>
                </div>
                {
                  activeFilters.length > 0 &&
                  <div className={styles.activeFilters}>
                    {
                      activeFilters.map((element, i)=> {
                        return(
                          <span key={i} className={`${styles.filterTag} ${element.type}`}>
                            { getSelectedFilterDisplay(element) }
                            <span className={styles.close} onClick={()=>{handleClearFilter(element)}}><CloseIcon/></span>
                          </span>
                        )
                      })
                    }
                  </div>
                }
              </div>
              <div className={styles.resultsTableContainer}>
                <div className={styles.resultsTable}>
                  <div className={styles.tableBody}>
                    <div className={`${styles.tableHead}`}>
                      <div
                        className={`${styles.head} ${styles.nameHead} ${isSortedByName ? styles.true : (isSortedByName === null) ? '' : styles.false}`}
                        onClick={()=>{setSortedResults(handleSort(sortedResults, (isSortedByName)?'nameHighLow': 'nameLowHigh'))}}
                        >
                        Name
                      </div>
                      <div
                        className={`${styles.head} ${styles.evidenceHead} ${isSortedByEvidence ? styles.true : (isSortedByEvidence === null) ? '': styles.false}`}
                        onClick={()=>{setSortedResults(handleSort(sortedResults, (isSortedByEvidence)?'evidenceLowHigh': 'evidenceHighLow'))}}
                        >
                        Evidence
                      </div>
                      <div
                        className={`${styles.head} ${styles.scoreHead} ${isSortedByScore ? styles.true : (isSortedByScore === null) ? '': styles.false}`}
                        onClick={()=>{setSortedResults(handleSort(sortedResults, (isSortedByScore)?'scoreLowHigh': 'scoreHighLow'))}}
                        >
                        Score
                      </div>
                    </div>
                    {
                      isError &&
                      <h5 className={styles.errorText}>There was an error when processing your query. Please try again.</h5>
                    }
                    {
                      !isLoading &&
                      !isError &&
                      displayedResults.length === 0 &&
                      <h5 className={styles.errorText}>No results available.</h5>
                    }
                    {
                      !isLoading &&
                      !isError &&
                      displayedResults.length > 0 &&
                      displayedResults.map((item, i) => {
                        return (
                          <ResultsItem
                            key={i}
                            type={storedQuery.type}
                            item={item}
                            activateEvidence={(evidence, rawEdges)=>activateEvidence(evidence, rawEdges)}
                            activeStringFilters={activeStringFilters}
                          />
                        )
                      })
                    }
                  </div>
                </div>
              </div>
              {
                formattedResults.length > 0 &&
                <div className={styles.pagination}>
                  <div className={styles.perPage}>
                  <Select
                    label=""
                    name="Results Per Page"
                    size="s"
                    handleChange={(value)=>{
                      setNewItemsPerPage(parseInt(value));
                    }}
                    value={newItemsPerPage}
                    noanimate
                    >
                    <option value="5" key="0">5</option>
                    <option value="10" key="1">10</option>
                    <option value="20" key="2">20</option>
                  </Select>
                  </div>
                  <ReactPaginate
                    breakLabel="..."
                    nextLabel="Next"
                    previousLabel="Previous"
                    onPageChange={handlePageClick}
                    pageRangeDisplayed={5}
                    marginPagesDisplayed={1}
                    pageCount={pageCount}
                    renderOnZeroPageCount={null}
                    className={styles.pageNums}
                    pageClassName={styles.pageNum}
                    activeClassName={styles.current}
                    previousLinkClassName={`${styles.prev} ${styles.button}`}
                    nextLinkClassName={`${styles.prev} ${styles.button}`}
                    disabledLinkClassName={styles.disabled}
                    forcePage={currentPage.current}
                  />
                </div>
              }
              {
                displayLoadingButton(handleResultsRefresh, styles, isFetchingARAStatus, loadingIcon, <ResultsAvailableIcon/>, true)
              }
            </>
          }
        </div>
      </div>
      {blocker ? <NavConfirmationPromptModal blocker={blocker} /> : null}
    </QueryClientProvider>
  );
}

export default ResultsList;
