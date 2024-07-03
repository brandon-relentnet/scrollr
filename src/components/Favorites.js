// src/components/Favorites.js
import React, { useState, useRef, useEffect } from 'react';
import PopupBubble from './PopupBubble';
import './Favorites.css';

const Favorites = () => {
  const [selectedFavorite, setSelectedFavorite] = useState({});
  const [showPopup, setShowPopup] = useState(false);
  const [currentFavorite, setCurrentFavorite] = useState('');
  const [popupPosition, setPopupPosition] = useState({ top: 0, left: 0 });
  const popupRef = useRef(null);

  const handleFavoriteClick = (event, favorite) => {
    const rect = event.target.getBoundingClientRect();
    const top = rect.top + window.scrollY;
    const left = rect.left + window.scrollX;
    const bottomSpace = window.innerHeight - rect.bottom;
    const bubbleHeight = 200; // Adjust this height based on the actual height of the popup bubble

    console.log('Button Rect:', rect);
    console.log('Window ScrollY:', window.scrollY);
    console.log('Window ScrollX:', window.scrollX);

    setCurrentFavorite(favorite);
    setPopupPosition({
      top: bottomSpace > bubbleHeight ? top + rect.height : top - bubbleHeight,
      left
    });
    setShowPopup(true);
  };

  useEffect(() => {
    if (showPopup && popupRef.current) {
      console.log('Popup Position:', popupPosition);
      popupRef.current.style.top = `${popupPosition.top}px`;
      popupRef.current.style.left = `${popupPosition.left}px`;
    }
  }, [popupPosition, showPopup]);

  const handleSelect = (option) => {
    setSelectedFavorite((prev) => ({
      ...prev,
      [currentFavorite]: option === 'None' ? '' : option
    }));
    setShowPopup(false);
  };

  return (
    <div className="favorites">
      {['Baseball', 'Stocks', 'Football', 'Crypto'].map((favorite) => (
        <button
          key={favorite}
          onClick={(e) => handleFavoriteClick(e, favorite)}
          className={selectedFavorite[favorite] ? 'selected' : ''}
        >
          {favorite} {selectedFavorite[favorite] ? `(${selectedFavorite[favorite]})` : ''}
        </button>
      ))}
      {showPopup && (
        <div
          ref={popupRef}
          style={{ position: 'absolute' }}
        >
          <PopupBubble favorite={currentFavorite} onSelect={handleSelect} />
        </div>
      )}
    </div>
  );
};

export default Favorites;
