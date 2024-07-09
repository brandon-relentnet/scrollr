import React, { useState, useEffect } from 'react';
import './Overlay.css';

const Overlay = () => {
  const [activeTab, setActiveTab] = useState('Baseball');
  const [preset, setPreset] = useState({});

  useEffect(() => {
    // Retrieve the stored active tab and selected preset from Chrome local storage
    chrome.storage.local.get(['activeTab', 'selectedPreset'], function (result) {
      if (result.activeTab) {
        setActiveTab(result.activeTab);
      }
      if (result.selectedPreset) {
        setPreset(result.selectedPreset);
      }
    });
  }, []);

  const handleTabClick = (tab) => {
    setActiveTab(tab);
    // Store the active tab in Chrome local storage
    chrome.storage.local.set({ activeTab: tab });
  };

  const getContent = () => {
    if (!preset[activeTab]) {
      return `Select a ${activeTab.toLowerCase()} preset`;
    }
    return `${activeTab} preset: ${preset[activeTab]} displayed here`;
  };

  return (
    <div className="overlay-container">
      <div className="tab-container">
        {['Baseball', 'Stocks', 'Football', 'Crypto'].map((tab) => (
          <div
            key={tab}
            className={`tab ${activeTab === tab ? 'tab-active' : ''}`}
            onClick={() => handleTabClick(tab)}
          >
            {tab.charAt(0)}
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
