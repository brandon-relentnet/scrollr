// src/components/Speed.js
import React from 'react';
import './Speed.css';

const Speed = () => {
  return (
    <div className="menu-section">
      <ul>
        <li>Slowest</li>
        <li>Slow</li>
        <li>Normal</li>
        <li>Fast</li>
        <li>Fastest</li>
        <li>Custom <input type="number" min="0" step="0.1" /></li>
      </ul>
    </div>
  );
};

export default Speed;
