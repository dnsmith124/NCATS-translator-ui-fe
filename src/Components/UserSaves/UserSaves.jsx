import { useEffect, useState, useRef } from 'react';
import { getSaves } from '../../Utilities/userApi';
import { handleEvidenceModalClose } from "../../Utilities/resultsInteractionFunctions";
import { useSelector } from 'react-redux';
import { currentRoot } from '../../Redux/rootSlice';
import styles from './UserSaves.module.scss';
import EvidenceModal from '../Modals/EvidenceModal';
import { QueryClient, QueryClientProvider } from 'react-query';
import SearchIcon from '../../Icons/Buttons/Search.svg?react';
import { getFormattedDate } from '../../Utilities/utilities';
import { ToastContainer, toast, Slide } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { BookmarkAddedMarkup, BookmarkRemovedMarkup, BookmarkErrorMarkup } from '../BookmarkToasts/BookmarkToasts';
import NotesModal from '../Modals/NotesModal';
import TextInput from "../FormFields/TextInput";
import { cloneDeep } from 'lodash';
import UserSave from '../UserSave/UserSave';

const UserSaves = () => {

  const root = useSelector(currentRoot);
  const [userSaves, setUserSaves] = useState(null);
  const [filteredUserSaves, setFilteredUserSaves] = useState(null)
  const currentSearchString = useRef("");
  const [evidenceOpen, setEvidenceOpen] = useState(false);
  const [currentEvidence, setCurrentEvidence] = useState([]);
  const [selectedItem, setSelectedItem] = useState({});
  const [selectedEdge, setSelectedEdge] = useState(null);
  const [selectedPath, setSelectedPath] = useState(null);
  const [isAllEvidence, setIsAllEvidence] = useState(true);
  const [zoomKeyDown, setZoomKeyDown] = useState(false);
  const [notesOpen, setNotesOpen] = useState(false);
  const noteLabel = useRef("");
  const currentBookmarkID = useRef(null);
  const formRef = useRef(null);

  const bookmarkAddedToast = () => toast.success(<BookmarkAddedMarkup/>);
  const bookmarkRemovedToast = () => toast.success(<BookmarkRemovedMarkup/>);
  const handleBookmarkError = () => toast.error(<BookmarkErrorMarkup/>);

  const queryClient = new QueryClient();

  const activateEvidence = (evidence, item, edgeGroup, path, isAll) => {
    setIsAllEvidence(isAll);
    setSelectedItem(item);
    setSelectedEdge(edgeGroup);
    setSelectedPath(path);
    setCurrentEvidence(evidence);
    setEvidenceOpen(true);
  }

  const activateNotes = (label, bookmarkID) => {
    noteLabel.current = label;
    currentBookmarkID.current = bookmarkID;
    setNotesOpen(true);
  }

  const initSaves = async () => {
    let newSaves = await getSaves(setUserSaves);
    setFilteredUserSaves(cloneDeep(newSaves));
  }

  const handleSearch = (value = false) => {
    if(!value) {
      setFilteredUserSaves(cloneDeep(userSaves));
      currentSearchString.current = "";
      return;
    }

    setFilteredUserSaves(Object.values(userSaves).filter((item) => {
      let include = false;
      let tempValue = value.toLowerCase();
      currentSearchString.current = value;
      let submittedDate = (item?.query?.submitted_time) ? getFormattedDate(new Date(item.query.submitted_time)) : '';

      // check for match in query info
      if(
        item.query.nodeLabel.toLowerCase().includes(tempValue) ||
        item.query.nodeId.toLowerCase().includes(tempValue) || 
        submittedDate.toLowerCase().includes(tempValue) || 
        item.query.nodeDescription.toLowerCase().includes(tempValue) || 
        item.query.type.label.toLowerCase().includes(tempValue) || 
        item.query.type.filterType.toLowerCase().includes(tempValue) 
      )
        include = true;
      
        // check saves for match
      for(const save of Array.from(item.saves)) {
        if(
          save.label.toLowerCase().includes(tempValue) ||
          save.notes.toLowerCase().includes(tempValue) ||
          save.object_ref.toLowerCase().includes(tempValue) ||
          save.data.item.id.toLowerCase().includes(tempValue) ||
          save.data.item.name.toLowerCase().includes(tempValue) ||
          save.data.item.type.toLowerCase().includes(tempValue) ||
          save.data.item.object.toLowerCase().includes(tempValue) 
        )
          include = true;
      }

      return include;
    }))
  }

  const clearSearchBar = () => {
    formRef.current.reset();
    handleSearch();
  }

  const handleSubmit = (e) => {
    e.preventDefault();
    formRef.current.reset();
    clearSearchBar();
  }

  useEffect(() => {
    initSaves();

    const handleKeyDown = (ev) => {
      if (ev.keyCode === 90) {
        setZoomKeyDown(true);
      }
    };
  
    const handleKeyUp = (ev) => {
      if (ev.keyCode === 90) {
        setZoomKeyDown(false);
      }
    };
  
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, []);

  const handleClearNotesEditor = () => {
    initSaves();
  }

  return(
    <QueryClientProvider client={queryClient}>
      {
        root === "main"
        ?
          <div>
            <ToastContainer
              position="top-center"
              autoClose={3000}
              theme="light"
              transition={Slide}
              pauseOnFocusLoss={false}
              hideProgressBar
              className="toastContainer"
              closeOnClick={false}
              closeButton={false}
            />
            <NotesModal
              isOpen={notesOpen}
              onClose={()=>(setNotesOpen(false))}
              handleClearNotesEditor={handleClearNotesEditor}
              className="notes-modal"
              noteLabel={noteLabel.current}
              bookmarkID={currentBookmarkID.current}
            />
            <EvidenceModal
              isOpen={evidenceOpen}
              onClose={()=>handleEvidenceModalClose(setEvidenceOpen)}
              className="evidence-modal"
              rawEvidence={currentEvidence}
              item={selectedItem}
              isAll={isAllEvidence}
              edgeGroup={selectedEdge}
              path={selectedPath}
            />
            <h1 className={`h4 ${styles.pageHeading}`}>Workspace</h1>
            {
              (userSaves == null || Object.entries(userSaves).length <= 0)
              ? 
                <div className={styles.none}>
                  <p>You haven't saved any results yet!</p>
                  <p>Submit a query, then click the bookmark icon on a result to save it for later. You can then view that result here.</p>
                </div>
              : <>
                  <div className={styles.searchBarContainer}>
                    <form onSubmit={(e)=>{handleSubmit(e)}} className={styles.form} ref={formRef}>
                      <TextInput 
                        placeholder="Search Saved Results" 
                        handleChange={(e)=>handleSearch(e)} 
                        className={styles.input}
                        size=""
                        icon={<SearchIcon/>}
                      />
                      <button type="submit" size="" >
                        <span>Clear</span>
                      </button>
                    </form>
                  </div>
                  {
                    Object.entries(filteredUserSaves).length < Object.entries(userSaves).length &&
                    <div className={styles.showingContainer}>
                      <p className={styles.showing}>Showing {Object.entries(filteredUserSaves).length} of {Object.entries(userSaves).length} total saved results.</p>
                      <button onClick={clearSearchBar} className={styles.showingButton}>(Clear Search Bar)</button>
                    </div>
                  }
                  <div className={styles.saves}>
                    {
                      Object.entries(filteredUserSaves).reverse().map((item) => {
                        return(
                          <UserSave
                            save={item}
                            currentSearchString={currentSearchString}
                            zoomKeyDown={zoomKeyDown}
                            activateEvidence={activateEvidence}
                            activateNotes={activateNotes}
                            handleBookmarkError={handleBookmarkError}
                            bookmarkAddedToast={bookmarkAddedToast}
                            bookmarkRemovedToast={bookmarkRemovedToast}
                          />
                        );
                      })
                    }
                  </div>
                </>
            }
          </div>
        :
          <div>
            <h4 className={styles.heading}>Use the Log In link above in order to view and manage your saved results.</h4>
          </div>
      }
    </QueryClientProvider>
  )
}

export default UserSaves;