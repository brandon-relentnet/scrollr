// src/components/Information.js
import React from 'react';
import ToggleSwitch from './ToggleSwitch';
import './Information.css';

const Information = ({ isOn, handleToggle }) => {
  return (
    <div className="menu-header">
      <div className="icons">
        <i className="fab fa-reddit"></i>
        <i className="fab fa-facebook"></i>
      </div>
      <div className="title">Scrollr</div>
      <ToggleSwitch isOn={isOn} handleToggle={handleToggle} />
      <div className="user-icon">
        <i className="fas fa-user"></i>
      </div>
    </div>
  );
};

export default Information;
