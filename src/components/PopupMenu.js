// src/components/PopupMenu.js
import React, { useState, useEffect } from 'react';
import Information from './Information';
import Speed from './Speed';
import Favorites from './Favorites';
import Support from './Support';
import './PopupMenu.css';

const PopupMenu = () => {
  const [isActive, setIsActive] = useState(false);

  useEffect(() => {
    // Retrieve the stored state when the popup is loaded
    chrome.storage.local.get(['isActive'], function(result) {
      if (chrome.runtime.lastError) {
        console.error("Error retrieving chrome.storage:", chrome.runtime.lastError);
      } else {
        if (result.isActive !== undefined) {
          setIsActive(result.isActive);
        }
      }
    });
  }, []);

  const handleToggle = () => {
    const newIsActive = !isActive;
    setIsActive(newIsActive);
    chrome.runtime.sendMessage({ message: "toggleOverlay" }, (response) => {
      console.log(response.status);
    });
  };

  return (
    <div className="popup-menu">
      <Information isActive={isActive} handleToggle={handleToggle} />
      <Speed />
      <Favorites />
      <Support />
    </div>
  );
};

export default PopupMenu;
