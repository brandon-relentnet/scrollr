import React, { useState, useEffect, useRef } from 'react';
import Information from './Information';
import Speed from './Speed';
import Presets from './Presets';
import Support from './Support';
import PowerButton from './PowerButton';
import './PopupMenu.css';

const PopupMenu = () => {
  const [isActive, setIsActive] = useState(false);
  const [isNewTab, setIsNewTab] = useState(false);
  const popupRef = useRef(null);

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

    // Check if the current tab is the new tab page
    chrome.tabs.query({ active: true, currentWindow: true }, function(tabs) {
      if (tabs[0].url === 'chrome://newtab/') {
        setIsNewTab(true);
      }
    });

    // Dynamically set the height of the popup based on content
    if (popupRef.current) {
      const popupHeight = popupRef.current.scrollHeight;
      document.documentElement.style.height = `${popupHeight}px`;
      document.body.style.height = `${popupHeight}px`;
    }

    // Listen for preset updates
    chrome.runtime.onMessage.addListener((request) => {
      if (request.message === 'presetUpdated') {
        // Force re-render by updating state
        setIsActive((prev) => !prev);
      }
    });
  }, []);

  const handleToggle = () => {
    const newIsActive = !isActive;
    setIsActive(newIsActive);
    chrome.runtime.sendMessage({ message: "toggleOverlay", isActive: newIsActive }, (response) => {
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
        <div className="title-container">
          <div className="title-and-button">
            <div className="title">Scrollr</div>
            <PowerButton isActive={isActive} handleToggle={handleToggle} isDisabled={isNewTab} />
          </div>
          {isNewTab && <div className="new-tab-warning">The overlay does not work on the new tab page.</div>}
        </div>
        <div className="user-icon">
          <i className="fas fa-user"></i>
        </div>
      </div>
      <div className="menu-content">
        <div className="menu-left">
          <Speed />
        </div>
        <div className="menu-right">
          <div className="presets-support">
            <div className="presets">
              <h2>Presets</h2>
              <Presets context="popup" />
            </div>
            <div className="support">
              <h2>Support</h2>
              <Support />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PopupMenu;
