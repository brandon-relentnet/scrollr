// src/components/Favorites.js
import React, { useState } from 'react';
import './Favorites.css';

const Favorites = () => {
  const [selectedFavorites, setSelectedFavorites] = useState({
    baseball: '',
    football: '',
    stocks: '',
    crypto: '',
  });
  
  const [dropdownOpen, setDropdownOpen] = useState(null);

  const toggleFavorite = (category, option) => {
    setSelectedFavorites((prevFavorites) => ({
      ...prevFavorites,
      [category]: option,
    }));
    setDropdownOpen(null); // Close the dropdown menu
  };

  const toggleDropdown = (category) => {
    setDropdownOpen(dropdownOpen === category ? null : category);
  };

  return (
    <div className="menu-section">
      <h3>Favorites</h3>
      <div className="favorites">
        <button
          className={selectedFavorites.baseball ? 'selected' : ''}
          onClick={() => toggleDropdown('baseball')}
        >
          Baseball {selectedFavorites.baseball && `- ${selectedFavorites.baseball}`}
        </button>
        {dropdownOpen === 'baseball' && (
          <div className="dropdown-menu">
            <button onClick={() => toggleFavorite('baseball', 'MLB')}>MLB</button>
            <button onClick={() => toggleFavorite('baseball', 'Minor League')}>Minor League</button>
            <button onClick={() => toggleFavorite('baseball', 'College Baseball')}>College Baseball</button>
          </div>
        )}
        <button
          className={selectedFavorites.football ? 'selected' : ''}
          onClick={() => toggleDropdown('football')}
        >
          Football {selectedFavorites.football && `- ${selectedFavorites.football}`}
        </button>
        {dropdownOpen === 'football' && (
          <div className="dropdown-menu">
            <button onClick={() => toggleFavorite('football', 'NFL')}>NFL</button>
            <button onClick={() => toggleFavorite('football', 'College Football')}>College Football</button>
            <button onClick={() => toggleFavorite('football', 'Arena Football')}>Arena Football</button>
          </div>
        )}
        <button
          className={selectedFavorites.stocks ? 'selected' : ''}
          onClick={() => toggleDropdown('stocks')}
        >
          Stocks {selectedFavorites.stocks && `- ${selectedFavorites.stocks}`}
        </button>
        {dropdownOpen === 'stocks' && (
          <div className="dropdown-menu">
            <button onClick={() => toggleFavorite('stocks', 'Tech')}>Tech</button>
            <button onClick={() => toggleFavorite('stocks', 'Healthcare')}>Healthcare</button>
            <button onClick={() => toggleFavorite('stocks', 'Finance')}>Finance</button>
          </div>
        )}
        <button
          className={selectedFavorites.crypto ? 'selected' : ''}
          onClick={() => toggleDropdown('crypto')}
        >
          Crypto {selectedFavorites.crypto && `- ${selectedFavorites.crypto}`}
        </button>
        {dropdownOpen === 'crypto' && (
          <div className="dropdown-menu">
            <button onClick={() => toggleFavorite('crypto', 'Bitcoin')}>Bitcoin</button>
            <button onClick={() => toggleFavorite('crypto', 'Ethereum')}>Ethereum</button>
            <button onClick={() => toggleFavorite('crypto', 'Altcoins')}>Altcoins</button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Favorites;
