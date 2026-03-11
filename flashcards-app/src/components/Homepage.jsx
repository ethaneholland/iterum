import { useState } from "react";
import SubjectCard from "./SubjectCard";
import ErrorDialog from "./ErrorDialog";
import "../styles/Homepage.css";
import "../styles/Header.css";
import "../styles/Footer.css";
import iterumLogo from "../assets/iterum-logo.png";
import Footer from "./Footer";

export default function Homepage({ subject, onOpenSubject }) {
  // --- STATE --- //
  // Viisibility of the error dialog
  let [showErrorDialog, setShowErrorDialog] = useState(null);
  function openDialog(description) {
    setShowErrorDialog(description);
  }
  function closeDialog() {
    setShowErrorDialog(null);
  }


  // --- PAGE CONTENT --- //
  return (
    <div className="homepage">

      {/* ── Header ── */}
      <header className="header">
        <div className="header-inner">
          <div className="header-inner-with-back">
            
            {/* Breadcrumb */}
            <div className="header-pill left-pill">
              <span className="crumb clickable" onClick={() => openDialog("This button will bring you to a new page where you can organize different card decks. You will be able to organize by course, term, etc.")}>home</span>
              <span className="sep">//</span>
              <span className="crumb active">sample subject</span>
            </div>

            {/* Center Version Navigation */}
            <div className="version-navigator-container"></div>

            {/* Empty slot, board screen uses the new and delete buttons here */}
            <div className="header-actions-right"></div>

          </div>
        </div>
      </header>

      {/* Body of the homepage */}
      <div className="homepage-grid-wrapper">
        <div className="homepage-grid">

          {/* Not functional "New" card */}
          <div className="new-subject-tile" onClick={() => openDialog("This button will create a new subject card with it's own title, cards, and revisions.")}>
            <div className="new-subject-tile-icon">
              {/* Plus Icon */}
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none" >
                <line x1="7" y1="1" x2="7" y2="13" stroke="white" strokeWidth="2" strokeLinecap="round"/>
                <line x1="1" y1="7" x2="13" y2="7" stroke="white" strokeWidth="2" strokeLinecap="round"/>
              </svg>
            </div>
            <span className="new-subject-tile-label">new subject</span>
          </div>

          {/* Clicking the Subject Card will open the board */}
          <SubjectCard subject={subject} onOpen={onOpenSubject} onArchive={() => openDialog("This button will archive the subject and it's contents so that it's removed from this list.")} />

        </div>
      </div>

      {/* Open an error dialog when a feature isn't implemented */}
      {showErrorDialog && <ErrorDialog onDismiss={closeDialog} description={showErrorDialog} />}

      <div className="footer-logo-full">
        <img src={iterumLogo} alt="Iterum" className="footer-logo-img" />
      </div>

    </div>
  );
}
