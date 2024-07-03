// src/components/PopupBubble.js
import React, { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import './PopupBubble.css';

const leagueOptions = {
  Baseball: ["MLB", "Minor League", "College Baseball", "None"],
  Football: ["NFL", "College Football", "Arena Football", "None"],
  Stocks: ["NYSE", "NASDAQ", "OTC", "None"],
  Crypto: ["Bitcoin", "Ethereum", "Altcoins", "None"]
};

const PopupBubble = ({ favorite, onSelect, position }) => {
  const popupRef = useRef(null);

  useEffect(() => {
    if (popupRef.current) {
      const popupWidth = popupRef.current.offsetWidth;
      const popupHeight = popupRef.current.offsetHeight;
      const adjustedLeft = position.left - popupWidth / 2;
      const adjustedTop = position.top - popupHeight / 2;
      popupRef.current.style.left = `${adjustedLeft}px`;
      popupRef.current.style.top = `${adjustedTop}px`;
    }
  }, [position]);

  const options = leagueOptions[favorite] || [];
  const popupContent = (
    <div className="popup-bubble" ref={popupRef}>
      {options.map((option) => (
        <button key={option} onClick={() => onSelect(option)}>
          {option}
        </button>
      ))}
    </div>
  );

  return createPortal(popupContent, document.body);
};

export default PopupBubble;
