import React, {useState, useEffect, useRef} from "react";
import AnimateHeight from "react-animate-height";
import styles from './Select.module.scss';

const Select = ({label, subtitle, value, name, size, error, 
  errorText, handleChange, noanimate, children, testId, className, iconClass}) => {

  value = (value === null || isNaN(value)) ? "" : value;
  const [selectedItem, setSelectedItem] = useState(value);
  const [selectOpen, setSelectOpen] = useState(false);
  const [height, setHeight] = useState(0);
  let openClass = (selectOpen) ? styles.open : styles.closed;
  let animateClass = (noanimate) ? styles.noAnimate : styles.animate;

  const wrapperRef = useRef(null);  

  size = (size) ? size : 's';

  handleChange = (handleChange) ? handleChange : () => {};
  errorText = (errorText) ? errorText : "Error Message";

  const handleSelectClick = (e) => {
    e.preventDefault();
    setSelectOpen(!selectOpen);
  }

  const handleOptionClick = (e) => {
    e.preventDefault();
    setSelectedItem(e.target.dataset.value);
    setSelectOpen(!selectOpen);
    handleChange(e.target.dataset.value);
  }
  
  useEffect(() => {
    if(selectOpen === false)
      setHeight(0);
    else
      setHeight('auto');
  }, [selectOpen])

  useEffect(() => {
    setSelectedItem(value);
  }, [value])

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
        setSelectOpen(false);
        setHeight(0);
      }
    };
  
    document.addEventListener("click", handleClickOutside);
  
    // Clean up the event listener on unmount
    return () => {
      document.removeEventListener("click", handleClickOutside);
    };
  }, []);  // Empty array ensures this runs once on mount and unmount
  

  return (
    <>
      <label className={`select ${styles.select} ${size} ${animateClass} ${className}`} ref={wrapperRef}> 
        {label && <span className={styles.label}>{label}</span>}
        {subtitle && <span className={styles.subtitle}>{subtitle}</span>}
        <div className={`${styles.selectContainer} ${openClass}`}>
          <select type="text" 
              name={name} 
              onMouseDown={handleSelectClick} 
              defaultValue={selectedItem} 
              // rand number key to re-render with correct default value on state change 
              key={`${Math.floor((Math.random() * 1000))}-min`}
              data-testid={testId}
              >
            <option value="" disabled hidden>{name}</option>
            {children}
          </select>
          <span className={`${styles.icon} ${iconClass}`} onMouseDown={handleSelectClick}></span>
          {
            noanimate && 
            <div className={`${styles.selectList} ${openClass}`}>
              <div>
              {
              children.map((child, i) => {
                return(
                  <span 
                    onClick={handleOptionClick} 
                    key={i} 
                    className={styles.option} 
                    data-value={child.props.value}
                    data-testid={child.props.value}
                    >
                      {child.props.children}
                  </span>
                  );
                })
              }
              </div>
            </div>
          }
          {
            !noanimate &&
            <AnimateHeight className={`${styles.selectList} ${openClass}`}
              duration={250}
              height={height}
            > {
              children.map((child, i) => {
                return(
                  <span 
                    onClick={handleOptionClick} 
                    key={i} 
                    className={styles.option} 
                    data-value={child.props.value}
                    >
                    {child.props.children}
                  </span>
                  );
                })
              }
            </AnimateHeight>
          }

        </div>
        {error && <span className={styles.errorText}>{errorText}</span>}
      </label>
    </>
  );
}

export default Select;