// src/components/PowerButton.js
import React from 'react';
import './PowerButton.css';

const PowerButton = ({ isActive, handleToggle }) => {
  return (
    <div className={`power-button ${isActive ? 'active' : ''}`} onClick={handleToggle}>
      <i className="fas fa-power-off"></i>
    </div>
  );
};

export default PowerButton;
