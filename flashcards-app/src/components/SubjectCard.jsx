import "../styles/Homepage.css";

export default function SubjectCard({ subject, onOpen, onArchive }) {
  // --- VARIABLES --- //
  const revisionCount = Math.max(0, subject.versions.length - 1);
  
  // removed the card count for now, was unsure best way to count them [ maybe just number of cards on latest version?]. Easy to add back if we'd like
  const countsText = `${revisionCount} revision${revisionCount !== 1 ? 's' : ''}`; // Displayed below the title, e.g. "3 cards 0 revisions"

  // --- PAGE CONTENT --- //
  return (
    // Clicking the card switches the screen to the board
    <div className="subject-card" onClick={onOpen}>
      <div className="subject-card-spacer">
        <button className="pinned-card-archive-btn" onClick={(e) => { e.stopPropagation(); onArchive(); }}>Archive</button>
      </div>
      <div className="subject-card-body">
        <div className="subject-card-title">{subject.title}</div>
        <div className="subject-card-meta">{countsText}</div>
      </div>
    </div>
  );
}
