import { useRef, useEffect } from "react";
import "../styles/Card.css";

// --- SVG ICONS --- //
const IconLock = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>
);

const IconUnlock = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 9.9-1"></path></svg>
);

const IconRevise = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
);

const IconHide = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>
);

export default function DraggableCard({ card, onDragStart, onUpdate, onDelete, onCtrlClick, isSelected, isExiting, isEntering }) {
  const textRef = useRef(null);

  // Single source of truth: card.status is one of "locked" | "revise" | "hidden" | "normal"
  // Default is "locked" (set at card creation in Board.jsx)
  const status = card.status ?? "locked";

  let cardClass = "card";
  if (status === "revise") cardClass += " card-revise";
  if (status === "hidden") cardClass += " card-hidden";
  if (isSelected)          cardClass += " card-selected";
  if (isEntering)          cardClass += " card-enter";
  if (isExiting)           cardClass += " card-exit";

  useEffect(() => {
    if (textRef.current) {
      textRef.current.style.height = "auto";
      textRef.current.style.height = textRef.current.scrollHeight + "px";
    }
  }, [card.text]);

  // --- EVENT HANDLERS ---
  function handleMouseDown(event) {
    // Handle Ctrl+Click for drawing lines
    if (event.ctrlKey || event.metaKey) {
      event.preventDefault();
      onCtrlClick(card.id);
      return;
    }
    onDragStart(event, card.id);
  }

  // --- FUNCTIONS --- //
  // Each button sets status exclusively, only one can be active at a time.
  // Clicking an already active button returns to normal (deactivates it).
  const setStatus = (e, newStatus) => {
    e.stopPropagation();
    onUpdate(card.id, { status: status === newStatus ? "normal" : newStatus });
  };

  return (
    <div 
      className={cardClass} 
      style={{ left: `${card.x}px`, top: `${card.y}px`, zIndex: card.zIndex, position: 'absolute' }}
      onMouseDown={handleMouseDown}
    >
      <div className="card-toolbar">
        <div className="card-toolbar-left">
          {/* Lock Button */}
          <button
            className={`card-btn ${status === 'locked' ? 'active active-lock' : ''}`}
            onMouseDown={(e) => setStatus(e, "locked")}
            title="Carry over to next canvas"
          >
            {status === 'locked' ? <IconLock /> : <IconUnlock />}
          </button>

          {/* Revise Button */}
          <button
            className={`card-btn ${status === 'revise' ? 'active' : ''}`}
            onMouseDown={(e) => setStatus(e, "revise")}
            title="Mark for Revision"
          >
            <IconRevise />
          </button>
          
          {/* Hide Button */}
          <button
            className={`card-btn ${status === 'hidden' ? 'active' : ''}`}
            onMouseDown={(e) => setStatus(e, "hidden")}
            title="Hide in this Version"
          >
            <IconHide />
          </button>
        </div>

        <button 
          className="card-btn card-btn-delete" 
          onMouseDown={(e) => { 
            e.stopPropagation(); 
            onDelete(card.id); 
          }}
          title="Delete"
        >
          ×
        </button>
      </div>
      
      {/* Body */}
      <div className="card-body" onMouseDown={e => e.stopPropagation()}>
        <textarea
          ref={textRef}
          className="card-textarea"
          value={card.text}
          onChange={(e) => {
            // Editing a "revise" card clears the dotted border
            const changes = { text: e.target.value };
            if (status === "revise") changes.status = "locked";
            onUpdate(card.id, changes);
          }}
          placeholder="Write something..."
        />
      </div>
    </div>
  );
}
