import React, { useEffect, useState } from "react";
import styles from './FAQSidebar.module.scss';
import { NavLink } from 'react-router-dom';
import Accordion from '../Accordion/Accordion';
import { useLocation } from "react-router-dom";

const FAQSidebar = ({articles}) => {

  const location = useLocation();
  const [activeSlug, setActiveSlug] = useState(location.pathname.replace('/', ''));

  useEffect(() => {
    setActiveSlug(location.pathname.replace('/', ''));
  }, [location]);

  return(
    <div className={styles.faqSidebar}>
      <div className={styles.faqSidebarContainer}>
        <h5>Help Topics</h5>
        <nav>
          <ul className={styles.links}>
            {
              articles.map((article, i)=> {
                let isExtLink = (article.link) ? true : false;
                let link = (article.link) ? article.link : `/${article.slug}`;
                return (
                  <li key={i} className={(article.slug === activeSlug ? styles.active : '')}>
                    {
                      !article.subArticles && !isExtLink &&
                      <NavLink 
                        to={`${link}`} 
                        className={styles.navLink}
                        >
                        {article.title}
                      </NavLink>
                    }
                    {
                      !article.subArticles && isExtLink &&
                      <a 
                        href={link} 
                        className={styles.navLink}
                        target="_blank"
                        rel="noreferrer"
                        >
                        {article.title}
                      </a>
                    }
                    {
                      article.subArticles && 
                      <Accordion 
                        title={article.title} 
                        titleLink={link}
                        navLink={!isExtLink}
                        extLink={isExtLink}
                        accordionClass={styles.accordion}
                        panelClass={styles.accordionPanel}
                        expanded={article.subArticles.find(subArticle => subArticle.slug === activeSlug)}
                        >
                        <ul className={`${styles.links} ${styles.subLinks}`}>
                          {
                            article.subArticles.map((subArticle, j) => {
                              let key = `${i}_${j}`;
                              return (             
                                <li key={key} className={(subArticle.slug === activeSlug ? styles.active : '')}>
                                  <NavLink 
                                    to={`/${subArticle.slug}`} 
                                    className={styles.navLink}
                                    >
                                    {subArticle.title}
                                  </NavLink>
                                </li>       
                              )                   
                            })
                          }
                        </ul>
                      </Accordion>
                    }
                  </li>
                )
              })
            }
          </ul>
        </nav>
      </div>
    </div>
  )
}

export default FAQSidebar;