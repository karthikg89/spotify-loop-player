import React from 'react';
import './Shortcuts.css'; // Create a separate CSS file for styling

const Shortcuts = () => {
  return (
    <div className="shortcuts-container">
      <div className="shortcuts-header">
        <h2>Keyboard Shortcuts</h2>
        <span className="arrow">▼</span>
      </div>
      <div className="shortcuts-list">
        <div className="shortcuts-column">
          <ul>
            <li>
              <span className="key">Space</span>
              <span className="colon">:</span>
              <span className="description">Play/Pause</span>
            </li>
            <li>
              <span className="key">R</span>
              <span className="colon">:</span>
              <span className="description">Restart Loop</span>
            </li>
            <li>
              <span className="key">S</span>
              <span className="colon">:</span>
              <span className="description">Set Loop Start</span>
            </li>
            <li>
              <span className="key">E</span>
              <span className="colon">:</span>
              <span className="description">Set Loop End</span>
            </li>
          </ul>
        </div>
        <div className="shortcuts-column">
          <ul>
            <li>
              <span className="key">←/→</span>
              <span className="colon">:</span>
              <span className="description">Move Loop Start</span>
            </li>
            <li>
              <span className="key">Shift + ←/→</span>
              <span className="colon">:</span>
              <span className="description">Move Loop End</span>
            </li>
            <li>
              <span className="key">Ctrl + ←/→</span>
              <span className="colon">:</span>
              <span className="description">Previous/Next&nbsp;Track</span>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default Shortcuts; 