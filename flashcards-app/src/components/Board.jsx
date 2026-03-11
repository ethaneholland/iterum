import { useState, useRef, useEffect } from "react";
import DraggableCard from "./DraggableCard";
import ErrorDialog from "./ErrorDialog";
import { getNextCardId } from "../global-variables";
import "../styles/Board.css";
import "../styles/Header.css";
import Footer from "./Footer";

// --- CONSTANTS --- //
// These match the fixed pixel sizes used in Board.css and must stay in sync.
const CARD_WIDTH    = 220;
const CARD_HEIGHT   = 148;
const HEADER_HEIGHT = 56;  // Height of the fixed header bar
const PINNED_WIDTH  = 220;
const PINNED_HEIGHT = 160;
const PINNED_TOP    = 87;  // Distance from top of viewport to the pinned card

// --- CLASS --- //
export default function Board({ 
  subjectTitle, 
  versions, 
  verIndex, 
  onSetVerIndex, 
  onSaveVersion, 
  onCreateVersion, 
  onBack,
  isNewCanvas,
  registerNewCanvas }) {

  const currentVersion = versions[verIndex];

  let [showErrorDialog, setShowErrorDialog] = useState(null);
  function openDialog(description) {
    setShowErrorDialog(description);
  }
  function closeDialog() {
    setShowErrorDialog(null);
  }

  // local statea - strictly for the current canvas session
  const [cards, setCards] = useState(currentVersion.cards || []); // Local copy of the cards which is synced back to the parent subject on save.
  const [lines, setLines] = useState(currentVersion.lines || []);
  const [maxZIndex, setMaxZIndex] = useState(0); // Tracks the highest z-index in use so newly dragged cards always appear on top.
  const [selectedCards, setSelectedCards] = useState([]);
  // IDs of cards currently playing their exit animation
  const [exitingIds, setExitingIds] = useState([]);
  // IDs of cards that should play their entrance animation on this canvas
  const [enteringIds, setEnteringIds] = useState(() =>
    isNewCanvas ? (currentVersion.cards || []).map(c => c.id) : []
  );
  const dragging = useRef(null); // Stores drag state on mouse moves
  const boardRef = useRef(null); // Reference to the board div
  const latestSave = useRef(null); 
  latestSave.current = { onSaveVersion, verIndex, lines, cards };

  // Clear entering animation classes after they've played
  useEffect(() => {
    if (enteringIds.length === 0) return;
    const t = setTimeout(() => setEnteringIds([]), 500);
    return () => clearTimeout(t);
  }, []);

  // Register this board's new-canvas handler with the parent (for the header button)
  useEffect(() => {
    if (registerNewCanvas) registerNewCanvas(handleNewCanvas);
  }, [cards]); // re-register when cards change so handleNewCanvas has a fresh closure

  useEffect(() => {
    if (currentVersion) {
      setCards(currentVersion.cards || []);
      setLines(currentVersion.lines || []);
    }
  }, [verIndex, currentVersion.name]);

  // --- FUNCTIONS --- //

  // Create a new card where the user double-clicks,
  // block propogation when an existing card is double clicked.
  function addCard(e) {
  if (e.target !== boardRef.current) return;
  const rect = boardRef.current.getBoundingClientRect();
  const newZ = maxZIndex + 1;
  const newCard = {
    id: getNextCardId(),
    x: e.clientX - rect.left - 110,
    y: e.clientY - rect.top - 70,
    text: "",
    zIndex: newZ,
    status: "locked"  // new cards default to locked (carry over)
  };
  
  const newCards = [...cards, newCard];
  setCards(newCards);
  setMaxZIndex(newZ);
  
  // Save immediately
  onSaveVersion(verIndex, { cards: newCards, lines });
}
  
  // updates a card
  function updateCard(id, changes) {
    const newCards = cards.map(c => c.id === id ? { ...c, ...changes } : c);
    setCards(newCards);
    onSaveVersion(verIndex, { cards: newCards, lines });
  }

  // deletes a card
  function deleteCard(id) {
    const newCards = cards.filter(c => c.id !== id);
    const newLines = lines.filter(l => l.cardId1 !== id && l.cardId2 !== id);

    setCards(newCards);
    setLines(newLines);

    onSaveVersion(verIndex, { cards: newCards, lines: newLines });
  }

  // Play exit animation on hidden cards while simultaneously creating the new version
  function handleNewCanvas() {
    // Flush latest card positions into parent state before creating the new version,
    // in case the last drag's save hasn't propagated yet.
    onSaveVersion(verIndex, { cards, lines });

    const hiddenIds = cards.filter(c => c.status === 'hidden').map(c => c.id);
    if (hiddenIds.length > 0) {
      setExitingIds(hiddenIds);
    }
    onCreateVersion(0); // create new canvas immediately so enter/exit animations run together
  }

  // Begin dragging a card.
  function handleDragStart(event, id) {
    let card = cards.find(function(draggedCard) { return draggedCard.id === id; });
    // Move it to the top z-index.
    let newZ = maxZIndex + 1;
    setMaxZIndex(newZ);

    // Elevate the dragged card's z-index so it renders above all others
    setCards(function(prev) {
      return prev.map(function(changedCard) {
        if (changedCard.id === id) {
          return { ...changedCard, zIndex: newZ };
        }
        return changedCard;
      });
    });

    // Store the drag origin so we can compute deltas in onMouseMove
    dragging.current = {
      id,
      startMouseX: event.clientX,
      startMouseY: event.clientY,
      startCardX:  card.x,
      startCardY:  card.y,
    };
  }

  // When a card is dropped check if it overlaps with the pinned stationary card,
  // if it overlaps it will be pushed to the nearest edge.
  function pushOutOfPinnedCard(x, y) {
    let viewportWidth = window.innerWidth;

    // Calculate stationary pinned cards position
    let pinnedLeft   = (viewportWidth - PINNED_WIDTH) / 2; // It's centered horizontally
    let pinnedRight  = pinnedLeft + PINNED_WIDTH;
    let pinnedBottom = PINNED_TOP + PINNED_HEIGHT;

    let overlapsHorizontally = x < pinnedRight && x + CARD_WIDTH > pinnedLeft;
    let overlapsVertically   = y < pinnedBottom && y + CARD_HEIGHT > PINNED_TOP;

    // If there is no overlap then no push is needed
    if (!overlapsHorizontally || !overlapsVertically) {
      return { x, y };
    }

    // Calculate The distances to push. We will pick the shortest path to push the card.
    let distanceToPushRight = pinnedRight - x;
    let distanceToPushLeft  = (x + CARD_WIDTH) - pinnedLeft;
    let distanceToPushDown  = pinnedBottom - y;
    // Pick the shortest push path.
    let shortestPush = Math.min(
      distanceToPushRight,
      distanceToPushLeft,
      distanceToPushDown,
    );

    // Push either left, right, or down.
    let newX = x;
    let newY = y;
    if (shortestPush === distanceToPushDown) {
      newY = pinnedBottom;
    } else if (shortestPush === distanceToPushRight) {
      newX = pinnedRight;
    } else {
      newX = pinnedLeft - CARD_WIDTH;
    }

    // Make sure that our push hasn't made the card go off screen.
    newX, newY = pushBackOntoScreen(newX, newY);

    return newX, newY;
  }

  // Cards cannot dragged beyond the header or off the edges of the screen.
  function pushBackOntoScreen(x, y) {
    let viewportWidth  = window.innerWidth;
    let viewportHeight = window.innerHeight;

    let newX = Math.max(0, Math.min(x, viewportWidth - CARD_WIDTH));
    let newY = Math.max(HEADER_HEIGHT, Math.min(y, viewportHeight - CARD_HEIGHT));

    return { x: newX, y: newY };
  }

  //draws and undraws lines ¯\(°_o)/¯
  function ctrlClickLine(id) {
    setSelectedCards(function(prev) {
      if (prev.includes(id)) {
        return prev.filter(function(cardId) { return cardId !== id; });
      }
      if (prev.length === 1) {
        const first = prev[0];
        let nextLines; // Variable to hold the updated lines

        // Check if there is already a line between these two
        const existingIdx = lines.findIndex(function(l) {
          return (
            (l.cardId1 === first && l.cardId2 === id) ||
            (l.cardId1 === id && l.cardId2 === first)
          );
        });

        if (existingIdx !== -1) {
          // If it exists, remove it
          nextLines = lines.filter(function(l) {
            return !(
              (l.cardId1 === first && l.cardId2 === id) ||
              (l.cardId1 === id && l.cardId2 === first)
            );
          });
        } else {
          nextLines = [...lines, { cardId1: first, cardId2: id }];
        }

        setLines(nextLines); //updates local state
        onSaveVersion(verIndex, { cards, lines: nextLines }); //save immediately

        return []; // Clear selection
      }
      return [...prev, id];
    });
  }

  function calcCardCenter(cardID){
    let card = cards.find(function(dCard) { return dCard.id === cardID; });
    if(!card){
      return null;
    }
    return {x: card.x + CARD_WIDTH/2, y: card.y + CARD_HEIGHT/2};
  }

  // --- EFFECTS --- //
  // Sync card changes back up to the parent subject state whenever cards change
  // onUpdateSubject exists in the App.jsx and will replace the global cards with the local cards.
  // This means that useEffect() is called whenever the local cards object is changed.
  useEffect(() => {
    setCards([...currentVersion.cards]);
    setLines([...currentVersion.lines]);
    setSelectedCards([]); 
  }, [verIndex]);

  // Attach global mouse listeners for dragging cards.
  // Runs only once (Thats what the empty [] dependency does)
  useEffect(function() {
    // When the mouse moves, call this function:
    function onMouseMove(event) {
      if (!dragging.current) {
        return;
      }

      let { id, startMouseX, startMouseY, startCardX, startCardY } = dragging.current;

      // Calculate the new position based on how far the mouse has moved
      let rawX = startCardX + (event.clientX - startMouseX);
      let rawY = startCardY + (event.clientY - startMouseY);

      let { x, y } = pushBackOntoScreen(rawX, rawY);

      setCards(function(prev) {
        return prev.map(function(changedCard) {
          if (changedCard.id === id) {
            return { ...changedCard, x, y };
          }
          return changedCard;
        });
      });
    }

    // When the mouse is released, call this function:
    function onMouseUp() {
      if (!dragging.current) return;
      const { id } = dragging.current;
      const { onSaveVersion: save, verIndex: vi, lines: li, cards: currentCards } = latestSave.current;

      const nextCards = currentCards.map(c => {
        if (c.id !== id) return c;
        const { x, y } = pushBackOntoScreen(c.x, c.y);
       return { ...c, x, y };
      });

      setCards(nextCards);

      // saves when mouse is released to prevent framerate drops
      save(vi, { cards: nextCards, lines: li });

      dragging.current = null;
    }

    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup", onMouseUp);

    // Clean up listeners when the component unmounts
    return function() {
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseup", onMouseUp);
    };
  }, []);


  // --- VARIABLES --- //
  let boardIsEmpty = cards.length === 0;

  // --- PAGE CONTENT --- //
  return (
    <div ref={boardRef} className="board" onDoubleClick={addCard}>

      {/* Draggable cards (Might be empty) */}
      <div className="board-cards">
        {cards.map(function(card) {
          const isExiting  = exitingIds.includes(card.id);
          const isEntering = enteringIds.includes(card.id);
          return (
            <DraggableCard
              key={card.id}
              card={card}
              onDragStart={handleDragStart}
              onUpdate={updateCard}
              onDelete={deleteCard}
              onCtrlClick={ctrlClickLine}
              isSelected={selectedCards.includes(card.id)}
              isExiting={isExiting}
              isEntering={isEntering}
            />
          );
        })}
      </div>

      <svg className="line-svg" width="100%" height="100%" style={{ position: 'absolute', top: 0, left: 0, pointerEvents: 'none' }}>
        {lines.map(function(ln, index) {
          let begin = calcCardCenter(ln.cardId1);
          let end = calcCardCenter(ln.cardId2);
          if (!begin || !end) {
            return null;
          }
          return (
            <line
              key={index}
              x1={begin.x}
              y1={begin.y}
              x2={end.x}
              y2={end.y}
              stroke="#000000"
              strokeWidth="2"
              opacity="0.6"
            />
          );
        })}
      </svg>

      {/* Empty board message, only shown when there are no cards */}
      {boardIsEmpty && (
        <div className="board-empty-container">
          <div className="board-empty-content">
            <h5>your board is empty</h5>
            <p>double-click anywhere to add an answer</p>
          </div>
        </div>
      )}

      {/* Pinned subject card, fixed in the centre, not draggable
      <div className="pinned-card">
        <div className="pinned-card-body">
          <strong className="pinned-card-title">{subjectTitle}</strong>
          <p className="pinned-card-hint">Double-click the board to add a card.</p>
        </div>
      </div> */}

      {/* Error dialog */}
      {showErrorDialog && (
        <ErrorDialog onDismiss={closeDialog} description={showErrorDialog} />
      )}

      {/* Footer */}
      <Footer />

    </div>
  );
}
