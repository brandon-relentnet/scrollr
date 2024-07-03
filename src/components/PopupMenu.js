// src/components/PopupMenu.js
import React, { useState, useEffect, useRef } from 'react';
import Information from './Information';
import Speed from './Speed';
import Favorites from './Favorites';
import Support from './Support';
import PowerButton from './PowerButton'; // Ensure this import
import './PopupMenu.css';

const PopupMenu = () => {
  const [isActive, setIsActive] = useState(false);
  const popupRef = useRef(null);

  useEffect(() => {
    // Retrieve the stored state when the popup is loaded
    chrome.storage.local.get(['isActive'], function(result) {
      if (chrome.runtime.lastError) {
        console.error("Error retrieving chrome.storage:", chrome.runtime.lastError);
      } else {
        if (result && result.isActive !== undefined) {
          setIsActive(result.isActive);
        }
      }
    });

    // Dynamically set the height of the popup based on content
    if (popupRef.current) {
      const popupHeight = popupRef.current.scrollHeight;
      document.documentElement.style.height = `${popupHeight}px`;
      document.body.style.height = `${popupHeight}px`;
    }
  }, []);

  const handleToggle = () => {
    const newIsActive = !isActive;
    setIsActive(newIsActive);
    chrome.runtime.sendMessage({ message: "toggleOverlay" }, (response) => {
      console.log(response.status);
    });
  };

  return (
    <div className="popup-menu" ref={popupRef}>
      <div className="menu-header">
        <div className="icons">
          <i className="fab fa-reddit"></i>
          <i className="fab fa-facebook"></i>
        </div>
        <div className="title">Scrollr</div>
        <PowerButton isActive={isActive} handleToggle={handleToggle} />
        <div className="user-icon">
          <i className="fas fa-user"></i>
        </div>
      </div>
      <div className="menu-sections">
        <div className="menu-section">
          <h3>Speed</h3>
          <Speed />
        </div>
        <div className="menu-section">
          <h3>Favorites</h3>
          <Favorites />
        </div>
        <div className="menu-section">
          <h3>Support</h3>
          <Support />
        </div>
      </div>
    </div>
  );
};

export default PopupMenu;
