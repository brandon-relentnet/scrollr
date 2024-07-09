// src/components/Speed.js
import React, { useState } from 'react';
import './Speed.css';

const Speed = () => {
  const [selectedSpeed, setSelectedSpeed] = useState('');
  const [customSpeed, setCustomSpeed] = useState('');

  const handleSpeedChange = (event) => {
    const { value } = event.target;
    setSelectedSpeed(value);
    if (value !== 'custom') {
      console.log(value);
    }
  };

  const handleCustomSpeedChange = (event) => {
    setCustomSpeed(event.target.value);
  };

  const handleCustomSpeedSelect = () => {
    setSelectedSpeed('custom');
    console.log(customSpeed);
  };

  return (
    <div className="speed">
      <h2>Speed</h2>
      <div className="speed-options">
        {['Slowest', 'Slow', 'Normal', 'Fast', 'Fastest'].map((speed, index) => (
          <label key={speed}>
            <input
              type="radio"
              name="speed"
              value={index + 1}
              checked={selectedSpeed === `${index + 1}`}
              onChange={handleSpeedChange}
            />
            <span></span>
            <h3>{speed}</h3>
          </label>
        ))}
        <label>
          <input
            type="checkbox"
            name="speed"
            value="custom"
            checked={selectedSpeed === 'custom'}
            onChange={handleCustomSpeedSelect}
          />
          <span></span>
          <input
            type="number"
            value={customSpeed}
            onChange={handleCustomSpeedChange}
            disabled={selectedSpeed !== 'custom'}
          />
        </label>
      </div>
    </div>
  );
};

export default Speed;