// src/components/ToggleSwitch.js
import React from 'react';
import './ToggleSwitch.css';

const ToggleSwitch = ({ isOn, handleToggle }) => {
  return (
    <div className="toggle-switch">
      <input
        checked={isOn}
        onChange={handleToggle}
        className="toggle-switch-checkbox"
        id={`toggle-switch-new`}
        type="checkbox"
      />
      <label
        className="toggle-switch-label"
        htmlFor={`toggle-switch-new`}
      >
        <span className={`toggle-switch-inner`} />
        <span className={`toggle-switch-switch`} />
      </label>
    </div>
  );
};

export default ToggleSwitch;
