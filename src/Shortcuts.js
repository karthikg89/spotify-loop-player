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
        <ul>
          <li>
            <span className="key">Space</span>
            <span className="colon">:</span>
            <span className="description">Play/Pause</span>
          </li>
          <li>
            <span className="key">Arrow Left</span>
            <span className="colon">:</span>
            <span className="description">Move Start Loop Backward by 10ms</span>
          </li>
          <li>
            <span className="key">Arrow Right</span>
            <span className="colon">:</span>
            <span className="description">Move Start Loop Forward by 10ms</span>
          </li>
          <li>
            <span className="key">Shift + Arrow Left</span>
            <span className="colon">:</span>
            <span className="description">Move End Loop Backward by 10ms</span>
          </li>
          <li>
            <span className="key">Shift + Arrow Right</span>
            <span className="colon">:</span>
            <span className="description">Move End Loop Forward by 10ms</span>
          </li>
          <li>
            <span className="key">R</span>
            <span className="colon">:</span>
            <span className="description">Restart Loop (with count-in if enabled)</span>
          </li>
        </ul>
      </div>
    </div>
  );
};

export default Shortcuts; 