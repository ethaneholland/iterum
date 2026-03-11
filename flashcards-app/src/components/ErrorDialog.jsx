import "../styles/ErrorDialog.css";

export default function ErrorDialog({ onDismiss, description }) {
  // --- FUNCTIONS --- //
  // Clicking outside the dialog box dismisses the dialog
  function handleOverlayClick() {
    onDismiss();
  }

  // Clicks inside the dialog should not bubble up
  function handleDialogClick(event) {
    event.stopPropagation();
  }

  
  // --- PAGE CONTENT --- //
  return (
    <div className="dialog-overlay" onClick={handleOverlayClick}>
      <div className="dialog" onClick={handleDialogClick}>
        <p className="dialog-title">sorry!</p>
        <p className="dialog-body">
          this feature isn't available yet.
        </p>
        {description && <p className="dialog-body">{description}</p>}
        {/* Dismiss the dialog button */}
        <button className="dialog-btn" onClick={onDismiss}>
          continue
        </button>
      </div>
    </div>
  );
}
