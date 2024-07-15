import React, { useState, useEffect } from 'react';
import './Overlay.css';

const Overlay = () => {
  const [activeOverlayTab, setActiveOverlayTab] = useState('Baseball');
  const [preset, setPreset] = useState({});

  useEffect(() => {
    // Retrieve the stored active tab and selected preset from Chrome local storage
    chrome.storage.local.get(['activeOverlayTab', 'selectedPreset'], function (result) {
      if (result.activeOverlayTab) {
        setActiveOverlayTab(result.activeOverlayTab);
      }
      if (result.selectedPreset) {
        setPreset(result.selectedPreset);
      }
    });
  }, []);

  const handleTabClick = (overlayTabs) => {
    setActiveOverlayTab(overlayTabs);
    // Store the active tab in Chrome local storage
    chrome.storage.local.set({ activeOverlayTab: overlayTabs });
  };

  const getContent = () => {
    if (!preset[activeOverlayTab]) {
      return `Select a ${activeOverlayTab.toLowerCase()} preset`;
    }
    return `${activeOverlayTab} preset: ${preset[activeOverlayTab]} displayed here`;
  };

  return (
    <div className="overlay-container">
      <div className="overlayTabs-container">
        {['Baseball', 'Stocks', 'Football', 'Crypto'].map((overlayTabs) => (
          <div
            key={overlayTabs}
            className={`tab ${activeOverlayTab === overlayTabs ? 'overlayTab-active' : ''}`}
            onClick={() => handleTabClick(overlayTabs)}
          >
            {overlayTabs.charAt(0)}
          </div>
        ))}
      </div>
      <div className="content">
        {getContent()}
      </div>
    </div>
  );
};

export default Overlay;
