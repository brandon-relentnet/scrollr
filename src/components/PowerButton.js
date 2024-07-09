// src/components/PowerButton.js
import React from 'react';
import './PowerButton.css';

const PowerButton = ({ isActive, handleToggle, isDisabled }) => {
  return (
    <div
      className={`power-button ${isActive ? 'active' : ''} ${isDisabled ? 'disabled' : ''}`}
      onClick={!isDisabled ? handleToggle : null}
    >
      <i className="fas fa-power-off"></i>
      {isDisabled && <div className="power-button-disabled-overlay"></div>}
    </div>
  );
};

export default PowerButton;
