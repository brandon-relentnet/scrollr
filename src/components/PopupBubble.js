// src/components/PopupBubble.js
import React from 'react';
import './PopupBubble.css';

const leagueOptions = {
  Baseball: ["MLB", "Minor League", "College Baseball", "None"],
  Football: ["NFL", "College Football", "Arena Football", "None"],
  Stocks: ["NYSE", "NASDAQ", "OTC", "None"],
  Crypto: ["Bitcoin", "Ethereum", "Altcoins", "None"]
};

const PopupBubble = ({ favorite, onSelect }) => {
  const options = leagueOptions[favorite] || [];
  return (
    <div className="popup-bubble">
      {options.map((option) => (
        <button key={option} onClick={() => onSelect(option)}>
          {option}
        </button>
      ))}
    </div>
  );
};

export default PopupBubble;
