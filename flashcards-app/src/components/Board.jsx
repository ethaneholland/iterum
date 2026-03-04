import { useState, useRef, useEffect } from "react";
import DraggableCard from "./DraggableCard";
import ErrorDialog from "./ErrorDialog";
import { getNextCardId } from "../global-variables";
import "../styles/Board.css";
import "../styles/Header.css";

// --- CONSTANTS --- //
// These match the fixed pixel sizes used in Board.css and must stay in sync.
const CARD_WIDTH    = 220;
const CARD_HEIGHT   = 148;
const HEADER_HEIGHT = 56;  // Height of the fixed header bar
const PINNED_WIDTH  = 220;
const PINNED_HEIGHT = 160;
const PINNED_TOP    = 87;  // Distance from top of viewport to the pinned card

// --- CLASS --- //
export default function Board({ subject, onUpdateSubject, onBack }) {
  // --- STATE --- //
  // Set up error dialog
  let [showErrorDialog, setShowErrorDialog] = useState(false);
  function openDialog() {
    setShowErrorDialog(true);
  }
  function closeDialog() {
    setShowErrorDialog(false);
  }
  // Local copy of the cards which is synced back to the parent subject on every change.
  let [cards, setCards] = useState(subject.cards || []);
  // Tracks the highest z-index in use so newly dragged cards always appear on top.
  let [maxZIndex, setMaxZIndex] = useState(0);
  // Stores drag state on mouse moves
  let dragging = useRef(null);
  // Reference to the board div
  let boardRef = useRef(null);
  let [selectedCards, setSelectedCards] = useState([]);
  let [lines, setLines] = useState([]);

  // --- VARIABLES --- //
  let boardIsEmpty = cards.length === 0;

  
  // --- FUNCTIONS --- //
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

  // Cards cannot dragged beyond the header or off the edges of the screen.
  function pushBackOntoScreen(x, y) {
    let viewportWidth  = window.innerWidth;
    let viewportHeight = window.innerHeight;

    let newX = Math.max(0, Math.min(x, viewportWidth - CARD_WIDTH));
    let newY = Math.max(HEADER_HEIGHT, Math.min(y, viewportHeight - CARD_HEIGHT));

    return { x: newX, y: newY };
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

  // Create a new card where the user double-clicks,
  // block propogation when an existing card is double clicked.
  function addCard(event) {
    if (event.target !== boardRef.current) {
      return;
    }

    let rect = boardRef.current.getBoundingClientRect();
    let newZ = maxZIndex + 1;

    setMaxZIndex(newZ);

    // Centre the new card under the cursor
    setCards(function(prev) {
      return [...prev, {
        id: getNextCardId(),
        x: event.clientX - rect.left - 110,
        y: event.clientY - rect.top - 70,
        text:   "",
        zIndex: newZ,
      }];
    });
  }

  // Apply a content update to a card.
  function updateCard(id, changes) {
    setCards(function(prev) {
      return prev.map(function(changedCard) {
        if (changedCard.id === id) {
          return { ...changedCard, ...changes };
        }
        return changedCard;
      });
    });
  }

  // Remove a card from the board
  function deleteCard(id) {
    setCards(function(prev) {
      return prev.filter(function(changedCard) { return changedCard.id !== id; });
    });

    setLines(function(prev) {
      return prev.filter(function(line) {
        return line.cardId1 !== id && line.cardId2 !== id;
      });
    });

    setSelectedCards(function(prev){
      return prev.filter(function(cardId){
        return cardId !== id;
      });
  })
  }

//draws and undraws lines ¯\(°_o)/¯
  function ctrlClickLine(id) {
    setSelectedCards(function(prev) {
      if (prev.includes(id)) {
        return prev.filter(function(cardId) { return cardId !== id; });
      }
      if (prev.length === 1) {
        const first = prev[0];
        // check if there is a line ＼（〇_ｏ）／
        const existingIdx = lines.findIndex(function(l) {
          return (
            (l.cardId1 === first && l.cardId2 === id) ||
            (l.cardId1 === id && l.cardId2 === first)
          );
        });
        if (existingIdx !== -1) {
          // if there is a line delete it ╰（‵□′）╯
          setLines(lines.filter(function(l) {
            return !(
              (l.cardId1 === first && l.cardId2 === id) ||
              (l.cardId1 === id && l.cardId2 === first)
            );
          }));
          return [];
        }
        // add a new line otherwise ᓚᘏᗢ
        setLines(function(existing) {
          return [...existing, { cardId1: first, cardId2: id }];
        });
        return [];
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
  // [cards] is a dependency array. This means that useEffect() is called whenever the local cards object is changed.
  useEffect(function() {
    onUpdateSubject({ cards });
  }, [cards]);

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
      if (!dragging.current) {
        dragging.current = null;
        return;
      }

      let { id } = dragging.current;

      // On drop, push the card out if it landed on top of the pinned card,
      // and make sure that it's within the screen borders.
      setCards(function(prev) {
        return prev.map(function(changedCard) {
          if (changedCard.id !== id) {
            return changedCard;
          }
          let { x, y } = pushOutOfPinnedCard(changedCard.x, changedCard.y);
          return { ...changedCard, x, y };
        });
      });

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


  // --- PAGE CONTENT --- //
  return (
    <div ref={boardRef} className="board" onDoubleClick={addCard}>

      {/* Header */}
      <div className="header">
        <div className="header-inner-with-back">

          {/* Back button */}
          <button className="header-back-btn" onClick={onBack} title="Back">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="15 18 9 12 15 6"/>
            </svg>
          </button>

          <div className="header-content">
            {/* Title */}
            <div className="header-site-title">Flashcards</div>
            {/* Breadcrumb */}
            <div className="header-breadcrumb">
              <button className="header-crumb-btn" onClick={openDialog}>
                <span>Home</span>
              </button>
              <span className="header-crumb-sep">›</span>
              {/* "Sample Subject" is also a back button */}
              <button className="header-crumb-btn" onClick={onBack}>
                <span>Sample Subject</span>
              </button>
              <span className="header-crumb-sep">›</span>
              <span className="header-crumb header-crumb-active">{subject.title}</span>
            </div>
          </div>

        </div>
      </div>

      {/* Draggable cards (Might be empty) */}
      <div className="board-cards">
        {cards.map(function(card) {
          return (
            <DraggableCard
              key={card.id}
              card={card}
              onDragStart={handleDragStart}
              onUpdate={updateCard}
              onDelete={deleteCard}
              onCtrlClick={ctrlClickLine}
              isSelected={selectedCards.includes(card.id)}
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
            <h5>Your board is empty</h5>
            <p>Double-click anywhere to add an answer</p>
          </div>
        </div>
      )}

      {/* Pinned subject card, fixed in the centre, not draggable */}
      <div className="pinned-card">
        <div className="pinned-card-toolbar">
          <button
            className="pinned-card-archive-btn"
            onClick={openDialog}
          >
            Archive
          </button>
        </div>
        <div className="pinned-card-body">
          <strong className="pinned-card-title">{subject.title}</strong>
          <p className="pinned-card-hint">Double-click the board to add a card.</p>
        </div>
      </div>

      {/* Error dialog */}
      {showErrorDialog && (
        <ErrorDialog onDismiss={closeDialog} />
      )}

    </div>
  );
}
