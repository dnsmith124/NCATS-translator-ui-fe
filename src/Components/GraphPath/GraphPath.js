import styles from './GraphPath.module.scss';
import React, {useState} from "react";
import Tooltip from '../Tooltip/Tooltip';
import { getIcon } from '../../Utilities/utilities';
import {ReactComponent as Disease} from '../../Icons/disease2.svg';
import {ReactComponent as Connector} from '../../Icons/connector-os.svg';
import OutsideClickHandler from '../OutsideClickHandler/OutsideClickHandler';


const GraphPath = ({path, handleNameClick, handlePathClick, handleTargetClick}) => {

  const [nameTooltipActive, setNameTooltipActive] = useState(false);
  const [pathTooltipActive, setPathTooltipActive] = useState(false);
  const [targetTooltipActive, setTargetTooltipActive] = useState(false);

  const tooltipOpen = (type) => {
    switch (type) {
      case 'name':
        handleNameClick();
        setNameTooltipActive(true);
        break;
      case 'path':
        handlePathClick();
        setPathTooltipActive(true);
        break;   
      case 'target':
        handleTargetClick();
        setTargetTooltipActive(true);
        break; 
      default:
        break;
    }
  }

  const tooltipClose = (type = 'all') => {
    switch (type) {
      case 'name':
        if(nameTooltipActive)
          setNameTooltipActive(false)
        break;
      case 'path':
        if(pathTooltipActive)
          setPathTooltipActive(false)
        break;   
      case 'target':
        if(targetTooltipActive)
          setTargetTooltipActive(false)
        break; 
      default:
        setPathTooltipActive(false)
        setNameTooltipActive(false)
        setTargetTooltipActive(false)
        break;
    }
  }

  return (
    <>
      {
        path.category === 'object' &&
        <span className={styles.nameContainer} >
          <span className={styles.name} onClick={() => tooltipOpen('name')}>
            {getIcon(path.type)}
            {path.name}
          </span>
          <OutsideClickHandler onOutsideClick={() => tooltipClose('name')}>
            <Tooltip 
              active={nameTooltipActive} 
              onClose={() => tooltipClose('name')}
              heading={path.name}
              text={path.description}
              >
            </Tooltip>
          </OutsideClickHandler>
        </span>
      }
      {
        path.category === 'predicate' &&
        <span className={styles.pathContainer} onClick={()=> tooltipOpen('path')}>
          <Connector />
          <span className={`${styles.path} path`}>{path.predicate}</span>
          <OutsideClickHandler onOutsideClick={() => tooltipClose('path')}>
            <Tooltip 
              active={pathTooltipActive} 
              onClose={() => tooltipClose('path')}
              heading={path.predicate}
              text=''
              >
            </Tooltip>
          </OutsideClickHandler>
        </span>
      }
      {
        path.category === 'target' && 
        <span className={styles.target} onClick={()=> tooltipOpen('target')} >
          <Disease/>
          {path.name}
          <OutsideClickHandler onOutsideClick={() => tooltipClose('target')}>
            <Tooltip 
              active={targetTooltipActive} 
              onClose={() => tooltipClose('target')}
              heading={path.name}
              text={path.description}
              >
            </Tooltip>
          </OutsideClickHandler>
        </span>
      }    
    </>
  )
}

export default GraphPath;