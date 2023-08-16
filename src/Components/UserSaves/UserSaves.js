import { useEffect, useState } from 'react';
import { getAllUserSaves } from '../../Utilities/userApi';
import { findStringMatch, handleResultsError, handleEvidenceModalClose,
  handleResultsRefresh, handleClearAllFilters, getResultsShareURLPath } from "../../Utilities/resultsInteractionFunctions";
import styles from './UserSaves.module.scss';
import ResultsItem from '../ResultsItem/ResultsItem';
import EvidenceModal from '../Modals/EvidenceModal';
import { QueryClient, QueryClientProvider, useQuery } from 'react-query';
import {ReactComponent as ExternalLink} from '../../Icons/external-link.svg';
import { getFormattedDate } from '../../Utilities/utilities';

const getSaves = async (setUserSaves) => {
  let saves = await getAllUserSaves();

  saves = formatUserSaves(saves);
  setUserSaves(saves);
}

const formatUserSaves = (saves) => { 
  console.log(saves);
  let newSaves = {};
  for(const save of saves) {
    if(!save?.data?.query)
      continue;

    if(!newSaves.hasOwnProperty(save.ars_pkey)) {
      newSaves[save.ars_pkey] = {
        saves: new Set([save]),
        query: save.data.query
      };
    } else {
      newSaves[save.ars_pkey].saves.add(save);
    }
  }
  console.log(newSaves);
  return newSaves;
}

const UserSaves = () => {

  const [userSaves, setUserSaves] = useState(null);
  const [evidenceOpen, setEvidenceOpen] = useState(false);
  const [currentEvidence, setCurrentEvidence] = useState([]);
  const [selectedItem, setSelectedItem] = useState({});
  const [selectedEdges, setSelectedEdges] = useState([]);
  const [isAllEvidence, setIsAllEvidence] = useState(true);
  const [zoomKeyDown, setZoomKeyDown] = useState(false);

  const queryClient = new QueryClient();

  useEffect(() => {
    getSaves(setUserSaves);
  },[]);


  useEffect(() => {
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

  return(
    <QueryClientProvider client={queryClient}>
      <div>
        <EvidenceModal
          isOpen={evidenceOpen}
          onClose={()=>handleEvidenceModalClose(setEvidenceOpen)}
          className="evidence-modal"
          currentEvidence={currentEvidence}
          item={selectedItem}
          isAll={isAllEvidence}
          edgeGroup={selectedEdges}
        />
        <h4>Workspace</h4>
        {
          userSaves && Object.entries(userSaves).map((item) => {
            console.log(item);
            let key = item[0];
            let queryObject = item[1];
            let typeString = queryObject.query.type.label;
            let queryNodeString = queryObject.query.nodeLabel;
            let shareURL = getResultsShareURLPath(queryNodeString, queryObject.query.nodeId, queryObject.query.type.id, key);
            // console.log(queryObject.saves.values().next());
            let submittedDate = getFormattedDate(new Date(queryObject.saves.values().next().value.time_created));
            // let submittedDate = new Date();
            return(
              <div key={key}>
                <div className={styles.topBar}>
                  <h4>{typeString} <span>{queryNodeString}</span></h4>
                  <p>{submittedDate.toString()}</p>
                  <a href={shareURL} target="_blank" rel="noreferrer"><ExternalLink/></a>
                </div>
                <div className={styles.resultsList}>
                  {queryObject.saves && Array.from(queryObject.saves).map((save) => {
                    console.log(save);
                    let queryType = save.data.query.type;
                    let queryItem = save.data.item;
                    let arspk = save.data.query.pk;
                    let queryNodeID = save.data.query.nodeId;
                    let queryNodeLabel = save.data.query.nodeLabel;
                    let queryNodeDescription = save.data.query.nodeDescription;
                    return (
                      <div key={save.id}>
                        <ResultsItem
                          rawResults={null}
                          type={queryType}
                          item={queryItem}
                          // activateEvidence={(evidence, item, edgeGroup, isAll)=>activateEvidence(evidence, item, edgeGroup, isAll)}
                          activeStringFilters={[]}
                          zoomKeyDown={zoomKeyDown}
                          currentQueryID={arspk}
                          queryNodeID={queryNodeID}
                          queryNodeLabel={queryNodeLabel}
                          queryNodeDescription={queryNodeDescription}
                        />
                      </div>
                    )
                  })}
                </div>
              </div>
            );
          })
        }
      </div>
    </QueryClientProvider>
  )
}

export default UserSaves;