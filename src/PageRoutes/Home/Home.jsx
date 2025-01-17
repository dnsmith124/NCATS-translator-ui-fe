import React from "react";
import Query from "../../Components/Query/Query";
import homeOne from "../../Assets/Images/Home/home1.svg";
import homeTwo from "../../Assets/Images/Home/home2.svg";
import homeThree from "../../Assets/Images/Home/home3.svg";
import ArrowForward from '../../Icons/Directional/arrow_forward.svg?react';
// import berkeley from "../../Assets/Images/Logos/berkeley.png";
// import bma from "../../Assets/Images/Logos/bma.png";
// import broad from "../../Assets/Images/Logos/broad.png";
// import columbia from "../../Assets/Images/Logos/columbia.png";
// import covar from "../../Assets/Images/Logos/covar.png";
// import dartmouth from "../../Assets/Images/Logos/dartmouth.png";
// import drexel from "../../Assets/Images/Logos/drexel.png";
// import harvard from "../../Assets/Images/Logos/harvard.png";
// import isb from "../../Assets/Images/Logos/isb.png";
// import maas from "../../Assets/Images/Logos/maas.png";
// import nih from "../../Assets/Images/Logos/nih.png";
// import osu from "../../Assets/Images/Logos/osu.png";
// import penn from "../../Assets/Images/Logos/penn.png";
// import renci from "../../Assets/Images/Logos/renci.png";
// import scripps from "../../Assets/Images/Logos/scripps.png";
// import tufts from "../../Assets/Images/Logos/tufts.png";
// import uab from "../../Assets/Images/Logos/uab.png";
// import ucamc from "../../Assets/Images/Logos/ucamc.png";
// import ucd from "../../Assets/Images/Logos/ucd.png";
// import ucsf from "../../Assets/Images/Logos/ucsf.png";
import styles from "./Home.module.scss";

const Home = () => {

  return (
    <div>
      <Query />
      <div className={styles.homePageContent}>
        <div className={styles.section}>
          <div className={`${styles.container} container`}>
            <h5 className={styles.heading}>Translator Workflow</h5>
            <div className={styles.images}>
              <img className={styles.image} src={homeOne} alt="" />
              <ArrowForward className={styles.arrow} />
              <img className={styles.image} src={homeTwo} alt="" />
              <ArrowForward className={styles.arrow} />
              <img className={styles.image} src={homeThree} alt="" />
            </div>
            <div className={styles.workflowHeadings}>
              <h6 className={styles.heading}>Select a relationship to explore</h6>
              <h6 className={styles.heading}>Review and select your favorite results</h6>
              <h6 className={styles.heading}>Analyze evidence in the workspace</h6>
            </div>
          </div>
        </div>
        <div className={styles.section}>
          <div className={`${styles.container} container`}>
            <div className={styles.twoCol}>
              <div className={styles.colOne}>
                <h5>Goals of Translator</h5>
                <p>There is a vast amount of diverse data available to clinical, biomedical, and translational scientists that has the potential to improve human health and well-being. However, domain-specific language and nonstandardized formatting often make this data difficult to process.</p>
                <p>To address these challenges, the Biomedical Data Translator Consortium has developed a pilot Translator system. Translator takes existing biomedical data sets and decodes them into insights that can augment human reasoning and accelerate translational science research.</p>
                <p className={styles.noMargin}>The main goals of this knowledge graph-based system are to:</p>
                <ul>
                  <li>Build infrastructure to support and facilitate data-driven translational research on a large scale.</li>
                  <li>Integrate as many datasets as possible and allow them to be cross-queried and reasoned over by translational researchers with minimal barriers, scalability, and accuracy.</li>
                  <li>Leverage open data, including patient data and team science.</li>
                  <li>Promote “serendipitous” discovery.</li>
                </ul>
              </div>
              <div className={styles.colTwo}>
                <h5>Articles and News</h5>
                <p>Learn how the Biomedical Data Translator program aims to help researchers access and connect diverse data.</p>
                <ul>
                  <li>
                    <a 
                      href="https://tracs.unc.edu/index.php/news-articles/1947-use-cases-show-translators-potential-to-expedite-clinical-research" 
                      target="_blank" 
                      rel="noopener noreferrer"
                      >
                      Use Case Show Translator's Potential to Expedite Clinical Research
                    </a>
                  </li>
                  <li>
                    <a 
                      href="https://renci.org/blog/biomedical-data-translator-platform-moves-to-the-next-phase/" 
                      target="_blank" 
                      rel="noopener noreferrer"
                      >
                      Biomedical Data Platform Moves to the Next Phase
                    </a>
                  </li>
                  <li>
                    <a 
                      href="https://renci.org/news/the-biomedical-data-translator-consortium-provides-progress-updates-in-latest-companion-publications/" 
                      target="_blank" 
                      rel="noopener noreferrer"
                      >
                      The Biomedical Data Translator Consortium Provides Progress Updates in Latest Companion Publications
                    </a>
                  </li>
                  <li>
                    <a 
                      href="https://www.figma.com/exit?url=https%3A%2F%2Fwww.statnews.com%2F2019%2F07%2F31%2Fnih-funded-project-aims-to-build-a-google-for-biomedical-data%2F#:~:text=https%3A//www.statnews.com/2019/07/31/nih%2Dfunded%2Dproject%2Daims%2Dto%2Dbuild%2Da%2Dgoogle%2Dfor%2Dbiomedical%2Ddata/" 
                      target="_blank" 
                      rel="noopener noreferrer"
                      >
                      NIH-Funded Project Aims to Build a 'Google' for Biomedical Data
                    </a>
                  </li>
                  <li>
                    <a 
                      href="https://ascpt.onlinelibrary.wiley.com/doi/10.1111/cts.12595" 
                      target="_blank" 
                      rel="noopener noreferrer"
                      >
                      Deconstructing the Translational Tower of Babel
                    </a>
                  </li>
                  <li>
                    <a 
                      href="https://ascpt.onlinelibrary.wiley.com/doi/full/10.1111/cts.12591" 
                      target="_blank" 
                      rel="noopener noreferrer"
                      >
                      Toward A Universal Biomedical Data Translator 
                    </a>
                  </li>
                  <li>
                    <a 
                      href="https://ascpt.onlinelibrary.wiley.com/doi/full/10.1111/cts.12592" 
                      target="_blank" 
                      rel="noopener noreferrer"
                      >
                      The Biomedical Data Translator Program: Conception, Culture, and Community
                    </a>
                  </li>
                  <li>
                    <a 
                      href="https://ncats.nih.gov/pubs/features/translator" 
                      target="_blank" 
                      rel="noopener noreferrer"
                      >
                      NCATS Furthers Efforts to Create a Data Ecosystem to Explore Disease Connections
                    </a>
                  </li>
                  <li>
                    <a 
                      href="https://ascpt.onlinelibrary.wiley.com/doi/10.1111/cts.12638" 
                      target="_blank" 
                      rel="noopener noreferrer"
                      >
                      Clinical Data: Sources and Types, Regulatory Constraints, Applications
                    </a>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
        {/* <div className={`${styles.section} ${styles.collaborators}`}>
          <div className="container">
            <h5>Collaborators</h5>
            <p>Translator is made possible through collaboration with scientific experts and developers from the following institutions:</p>
            <div className={styles.logos}>
              <img src={ucd} alt="" />
              <img src={penn} alt="" />
              <img src={columbia} alt="" />
              <img src={osu} alt="" />
              <img src={maas} alt="" />
              <img src={uab} alt="" />
              <img src={bma} alt="" />
              <img src={tufts} alt="" />
              <img src={renci} alt="" />
              <img src={harvard} alt="" />
              <img src={scripps} alt="" />
              <img src={drexel} alt="" />
              <img src={berkeley} alt="" />
              <img src={dartmouth} alt="" />
              <img src={broad} alt="" />
              <img src={isb} alt="" />
              <img src={covar} alt="" />
              <img src={ucamc} alt="" />
              <img src={nih} alt="" />
              <img src={ucsf} alt="" />
            </div>
          </div>
        </div> */}
      </div>
    </div>
  );
}

export default Home;