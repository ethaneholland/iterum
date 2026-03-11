import { useRef, useEffect } from "react";
import { SquareIcon, ArrowSquareUpRightIcon, NotePencilIcon, EyeSlashIcon, XCircleIcon } from "@phosphor-icons/react";
import "../styles/Card.css";

export default function DraggableCard({ card, onDragStart, onUpdate, onDelete, onCtrlClick, isSelected, isExiting, isEntering }) {
  const textRef = useRef(null);

  // Single source of truth: card.status is one of "locked" | "revise" | "hidden" | "normal"
  // Default is "locked" (set at card creation in Board.jsx)
  const status = card.status ?? "locked";

// Outer border of card
let wrapperClass = "card-wrapper";
if (isEntering) wrapperClass += " card-enter";
if (isExiting)  wrapperClass += " card-exit";

// Inner card content
let cardClass = "card";
if (status === "revise") cardClass += " card-revise";
if (status === "hidden") cardClass += " card-hidden";
if (isSelected)          cardClass += " card-selected";

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
    className={wrapperClass}
    style={{ left: `${card.x}px`, top: `${card.y}px`, zIndex: card.zIndex, position: 'absolute' }}
    onMouseDown={handleMouseDown}
    >
    <div 
      className={cardClass} 
    >
      <div className="card-toolbar">
        <div className="card-toolbar-left">
          {/* Lock Button */}
          <button
            className={`card-btn ${status === 'locked' ? 'active active-lock' : ''}`}
            onMouseDown={(e) => setStatus(e, "locked")}
            title="Carry over to next canvas"
          >
            {status === 'locked' ? <ArrowSquareUpRightIcon weight="duotone" size={20} /> : <SquareIcon weight="duotone" size={20} />}
          </button>

          {/* Revise Button */}
          <button
            className={`card-btn ${status === 'revise' ? 'active' : ''}`}
            onMouseDown={(e) => setStatus(e, "revise")}
            title="Mark for Revision"
          >
            <NotePencilIcon weight="duotone" size={20} />
          </button>
          
          {/* Hide Button */}
          <button
            className={`card-btn ${status === 'hidden' ? 'active' : ''}`}
            onMouseDown={(e) => setStatus(e, "hidden")}
            title="Hide in this Version"
          >
            <EyeSlashIcon weight="duotone" size={20} />
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
          <XCircleIcon size={20} weight="duotone" />
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
    </div>
  );
}
