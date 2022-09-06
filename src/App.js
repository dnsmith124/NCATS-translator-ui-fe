import React, {useState} from 'react';
import Footer from './Components/Footer/Footer';
import Header from './Components/Header/Header';
import SendFeedbackModal from "./Components/Modals/SendFeedbackModal";
import { Outlet, NavLink, useLocation } from 'react-router-dom';
import'./App.scss';


const App = () => {

  const location = useLocation();
  let pathnameClass = location.pathname.replace('/', '');
  pathnameClass = (pathnameClass.includes('/')) ? pathnameClass.replace(/\//g, '-') : pathnameClass;
  pathnameClass = (pathnameClass === "") ? "home" : pathnameClass;

  const [feedbackModalOpen, setFeedbackModalOpen] = useState(false);
  const handleModalClose = () => {
    setFeedbackModalOpen(false);
  }
  
  return (
    <div className={`app ${pathnameClass}`}>
      <SendFeedbackModal isOpen={feedbackModalOpen} onClose={()=>handleModalClose()} />
      <div className='header-disclaimer'>
        <p>This system is for research purposes and is not meant to be used by clinical service providers in the course of treating patients.</p>
      </div>
      <Header handleFeedbackModalOpen={()=>setFeedbackModalOpen(true)}>
      </Header>
      <div className='body'>
        <Outlet context={setFeedbackModalOpen}/>
      </div>
      <Footer>
        <nav>
          <NavLink to="/about" 
            className={({isActive}) => {return (isActive) ? 'active' : '' }}
          >About NCATS</NavLink>
          <NavLink to="/contact-us" 
            className={({isActive}) => {return (isActive) ? 'active' : '' }}
          >Contact Us</NavLink>
          <NavLink to="/terms-of-use" 
            className={({isActive}) => {return (isActive) ? 'active' : '' }}
          >Terms of Use</NavLink>
          <NavLink to="/privacy-policy" 
            className={({isActive}) => {return (isActive) ? 'active' : '' }}
          >Privacy Policy</NavLink>
        </nav>
      </Footer>
    </div>
  );
}

export default App;
