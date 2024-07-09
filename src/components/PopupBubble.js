// src/components/PopupBubble.js
import React from 'react';
import './PopupBubble.css';

const options = {
  Baseball: ['MLB', 'Minor League', 'College'],
  Stocks: ['NASDAQ', 'NYSE', 'Dow Jones'],
  Football: ['NFL', 'College', 'CFL'],
  Crypto: ['Bitcoin', 'Ethereum', 'Dogecoin'],
};

const PopupBubble = ({ preset, onSelect, position }) => {
  return (
    <div className="popup-bubble" style={{ top: position.top, left: position.left }}>
      {options[preset].map((option) => (
        <button key={option} onClick={() => onSelect(option)}>
          {option}
        </button>
      ))}
      <button onClick={() => onSelect('None')}>None</button>
    </div>
  );
};

export default PopupBubble;
