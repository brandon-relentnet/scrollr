// src/components/Information.js
import React from 'react';
import PowerButton from './PowerButton';
import './Information.css';

const Information = ({ isActive, handleToggle }) => {
  return (
    <div className="menu-header">
      <div className="icons">
        <i className="fab fa-reddit"></i>
        <i className="fab fa-facebook"></i>
      </div>
      <div className="title">Scrollr</div>
      <PowerButton isActive={isActive} handleToggle={handleToggle} />
      <div className="user-icon">
        <i className="fas fa-user"></i>
      </div>
    </div>
  );
};

export default Information;
