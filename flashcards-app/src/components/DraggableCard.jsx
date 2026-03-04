import { useRef, useEffect } from "react";
import "../styles/Card.css";

// Create the lock icon
function LockIcon({ locked }) {
  let color;
  if (locked) {
    color = "#e53935";
  }
  else {
    color = "#bbb";
  }

  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill={color} >
      <path d="M12 2C9.24 2 7 4.24 7 7v1H5a1 1 0 00-1 1v11a1 1 0 001 1h14a1 1 0 001-1V9a1 1 0 00-1-1h-2V7c0-2.76-2.24-5-5-5zm0 2c1.66 0 3 1.34 3 3v1H9V7c0-1.66 1.34-3 3-3zm0 9a2 2 0 110 4 2 2 0 010-4z"/>
    </svg>
  );
}

export default function DraggableCard({ card, onDragStart, onUpdate, onDelete, onCtrlClick, isSelected }) {
  // --- VARIABLES --- //
  let textRef = useRef(null); // Reference to the textarea for resizing
  let lockButtonTitle;  // Used for button hover text
  let cardClass; // Used to apply a className to the button for css purposes
  if (card.locked) {
    lockButtonTitle = "Unlock card";
    cardClass = "card card-locked";
  }
  else {
    lockButtonTitle = "Lock card";
    cardClass = "card card-unlocked";
  }

  if (isSelected) {
    cardClass += " card-selected";
  }

  // --- EFFECTS --- //
  // Resize the textarea height whenever the text content changes.
  useEffect(function() {
    if (!textRef.current) {
      return;
    }
    textRef.current.style.height = "auto"; // Reset to auto so that it can still shrink
    textRef.current.style.height = textRef.current.scrollHeight + "px"; // Set new height
  }, [card.text]);

  // --- FUNCTIONS --- //
  // Begin dragging
  function handleMouseDown(event) {
    if (event.ctrlKey || event.metaKey) {
      event.preventDefault();
      onCtrlClick(card.id);
      return;
    }
    onDragStart(event, card.id);
  }

  // Toggle between locked and unlocked state
  function handleLockToggle(event) {
    event.stopPropagation(); // prevent triggering a drag
    onUpdate(card.id, { locked: !card.locked });
  }

  // Remove this card from the board
  function handleDelete(event) {
    event.stopPropagation(); // prevent triggering a drag
    onDelete(card.id);
  }

  // Update text content and resize the textarea to fit
  function handleTextChange(event) {
    onUpdate(card.id, { text: event.target.value });
    event.target.style.height = "auto";
    event.target.style.height = event.target.scrollHeight + "px";
  }


  // --- PAGE CONTENT --- //
  return (
    <div
      className={cardClass}
      style={{ left: card.x, top: card.y, zIndex: card.zIndex }}
      onMouseDown={handleMouseDown}
    >
      {/* ── Toolbar: lock toggle and delete button ── */}
      <div className="card-toolbar">
        <button
          className="card-btn card-btn-lock"
          onMouseDown={handleLockToggle}
          title={lockButtonTitle}
        >
          <LockIcon locked={card.locked} />
        </button>

        <button
          className="card-btn card-btn-delete"
          onMouseDown={handleDelete}
          title="Delete card"
        >
          ×
        </button>
      </div>

      {/* ── Text body: lined background with auto-resizing textarea ── */}
      <div className="card-body" onMouseDown={function(event) { event.stopPropagation(); }}>
        <textarea
          ref={textRef}
          className="card-textarea"
          value={card.text}
          onChange={handleTextChange}
          onMouseDown={function(event) { event.stopPropagation(); }}
          placeholder="Write something..."
        />
      </div>
    </div>
  );
}
