import React, { useState, useEffect, useRef } from 'react';
import Presets from './Presets'; // Import the Presets component
import './Overlay.css';

const Overlay = () => {
  const [activeOverlayTab, setActiveOverlayTab] = useState('Baseball');
  const [preset, setPreset] = useState({});
  const overlayRef = useRef(null);

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

    // Listen for preset updates
    chrome.runtime.onMessage.addListener((request) => {
      if (request.message === 'presetUpdated') {
        setPreset(request.selectedPreset);
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
      return (
        <>
          <div>Select a {activeOverlayTab.toLowerCase()} preset</div>
          <Presets activeOverlayTab={activeOverlayTab} overlayRef={overlayRef} context="overlay" />
        </>
      );
    }
    return `${activeOverlayTab} preset: ${preset[activeOverlayTab]} displayed here`;
  };

  return (
    <div className="overlay-container" ref={overlayRef}>
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
