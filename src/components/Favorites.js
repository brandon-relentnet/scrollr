// src/components/Favorites.js
import React, { useState } from 'react';
import PopupBubble from './PopupBubble';
import './Favorites.css';

const Favorites = () => {
  const [selectedFavorite, setSelectedFavorite] = useState({});
  const [showPopup, setShowPopup] = useState(false);
  const [currentFavorite, setCurrentFavorite] = useState('');
  const [popupPosition, setPopupPosition] = useState({ top: 0, left: 0 });

  const handleFavoriteClick = (event, favorite) => {
    const rect = event.target.getBoundingClientRect();
    const top = rect.top + window.scrollY + rect.height / 2;
    const left = rect.left + window.scrollX + rect.width / 2;

    console.log('Button Rect:', rect);
    console.log('Window ScrollY:', window.scrollY);
    console.log('Window ScrollX:', window.scrollX);

    setCurrentFavorite(favorite);
    setPopupPosition({
      top: top,
      left: left
    });
    setShowPopup(true);
  };

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
        <PopupBubble favorite={currentFavorite} onSelect={handleSelect} position={popupPosition} />
      )}
    </div>
  );
};

export default Favorites;
