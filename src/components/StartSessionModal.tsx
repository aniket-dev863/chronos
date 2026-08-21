interface StartSessionModalProps {
  onStart: (activity: string) => void;
  onClose: () => void;
}

const activities = ["DSA", "Development", "Placement", "Academics", "Other"];

function StartSessionModal({ onStart, onClose }: StartSessionModalProps) {
  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div
        className="session-modal"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="modal-header">
          <div>
            <p className="card-label">NEW SESSION</p>
            <h2>What are you working on?</h2>
          </div>

          <button className="modal-close" onClick={onClose}>
            ×
          </button>
        </div>

        <div className="activity-options">
          {activities.map((activity) => (
            <button
              key={activity}
              className="activity-option"
              onClick={() => onStart(activity)}
            >
              <span>{activity}</span>
              <span>→</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

export default StartSessionModal;
