import { useState, useRef } from "react";
import Board from "./components/Board";
import Homepage from "./components/Homepage";
import ErrorDialog from "./components/ErrorDialog";
import { PlusCircleIcon, TrashIcon, ArrowLeftIcon, ArrowRightIcon } from "@phosphor-icons/react";
import "./styles/global.css";

const TESTING_SUBJECT = { 
  title: "sample story", 
  versions: [
    { name: "Version 1", cards: [], lines: [] }
  ] 
};

export default function App() {
  const [subject, setSubject] = useState(TESTING_SUBJECT);
  const [verIndex, setVerIndex] = useState(0);
  const [onBoard, setOnBoard] = useState(false);
  const [canvasNameKey, setCanvasNameKey] = useState(0); // bumped to retrigger the title fade-in animation

  let [showErrorDialog, setShowErrorDialog] = useState(null);

  // Board registers its handleNewCanvas here so the header "New" button can call it
  const boardNewCanvasRef = useRef(null);

  function updateVersionData(index, newData) {
    setSubject(prev => {
      if (index < 0 || index >= prev.versions.length) return prev;

      const newVersions = [...prev.versions];
      
      newVersions[index] = {
        ...newVersions[index],
        cards: newData.cards,
        lines: newData.lines
      };

      return { ...prev, versions: newVersions };
    });
  }

  function createNewVersion(indexToUse) {
    setSubject(prev => {
      const current = prev.versions[indexToUse];

      // clones cards that are not marked as hidden on the previous version
      // locked and revise cards carry over; hidden cards are dropped
      const inheritedCards = current.cards
        .filter(card => card.status !== 'hidden')
        .map(card => ({ ...card })); 

      // keeps lines where both connected cards still exist, otherwise don't clone them
      const inheritedIds = inheritedCards.map(c => c.id);
      const inheritedLines = current.lines
        .filter(line => 
          inheritedIds.includes(line.cardId1) && 
          inheritedIds.includes(line.cardId2)
        )
        .map(line => ({ ...line }));

      const newVersion = {
        name: `Version ${prev.versions.length + 1}`,
        cards: inheritedCards,
        lines: inheritedLines
      };

      return {
        ...prev,
        versions: [...prev.versions, newVersion]
      };
    });

    setVerIndex(prev => prev + 1);
    setCanvasNameKey(prev => prev + 1); // trigger title fade-in animation
  }

  const [isTransitioning, setIsTransitioning] = useState(false);

  function handleVersionChange(newIndex) {
    if (isTransitioning) return;
    
    setIsTransitioning(true);
    setVerIndex(newIndex);
    setCanvasNameKey(prev => prev + 1); // trigger title fade-in animation
    // adds a delay to the arrow buttons to prevent asychronous render calls that break the state of canvasses 
    // still buggy sometimes :/   
    setTimeout(() => setIsTransitioning(false), 500);
  }

  function handleNewCanvasRequest(exitDuration) {
    const capturedIndex = verIndex; // capture now before any async delay
    setTimeout(() => createNewVersion(capturedIndex), exitDuration);
  }

  // --- PAGE CONTENT --- //
  if (onBoard) {
    return (
      <div className="app-canvas-container" style={{ position: 'relative', width: '100vw', height: '100vh', overflow: 'hidden' }}>
      <style>{`body { margin: 0; padding: 0; overflow: hidden; }`}</style>

        <header className="header">
          <div className="header-inner">
            <div className="header-inner-with-back">
              
              {/* Breadcrumbs */}
              <div className="header-pill left-pill">
                <span className="crumb clickable" onClick={() => setOnBoard(false)}>home</span>
                <span className="sep">//</span>
                <span className="crumb clickable" onClick={() => setOnBoard(false)}>sample subject</span>
                <span className="sep">//</span>
                <span className="crumb active">{subject.title}</span>
              </div>

              {/* Canvas Navigator */}
              <div className="version-navigator-container">
                <div className="header-pill center-pill">
                  <button 
                    className="nav-arrow" 
                    onClick={() => handleVersionChange(Math.max(0, verIndex - 1))} 
                    disabled={verIndex === 0 || isTransitioning}
                  >
                    <ArrowLeftIcon size={16} />
                  </button>

                  <span key={canvasNameKey} className="canvas-name canvas-name-animate">iterò {verIndex + 1}</span>

                  <button 
                    className="nav-arrow" 
                    onClick={() => handleVersionChange(Math.min(subject.versions.length - 1, verIndex + 1))} 
                    disabled={verIndex === subject.versions.length - 1 || isTransitioning}
                  >
                    <ArrowRightIcon size={16} />
                  </button>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="header-actions-right">
                <button className="pill-btn-box" onClick={() => boardNewCanvasRef.current?.()}>
                  new <PlusCircleIcon size={16} weight="duotone" />
                </button>
                <button className="pill-btn-box" onClick={() => setShowErrorDialog("This button will delete the canvas revision that you are currently viewing.")}>
                  delete <TrashIcon size={16} weight="duotone" />
                </button>
              </div>

            </div>
          </div>
        </header>

        <Board
          key={verIndex}
          subjectTitle={subject.title}
          versions={subject.versions}
          verIndex={verIndex}
          onSetVerIndex={setVerIndex}
          onSaveVersion={updateVersionData}
          onCreateVersion={handleNewCanvasRequest}
          onBack={() => setOnBoard(false)}
          isNewCanvas={true}
          registerNewCanvas={(fn) => { boardNewCanvasRef.current = fn; }}
        />

        {showErrorDialog && (
        <ErrorDialog onDismiss={() => setShowErrorDialog(null)} description={showErrorDialog} />
        )}
      </div>
    );
  }

  return (
    <>
      <style>{`body { overflow: auto; }`}</style>
      <Homepage
        subject={subject}
        onOpenSubject={() => setOnBoard(true)}
      />
    </>
  );
}
