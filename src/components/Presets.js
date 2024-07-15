import React, { useState, useEffect } from 'react';
import PopupBubble from './PopupBubble';
import './Presets.css';

const Presets = ({ activeOverlayTab, overlayRef, context }) => {
  const [selectedPreset, setSelectedPreset] = useState({});
  const [showPopup, setShowPopup] = useState(false);
  const [currentPreset, setCurrentPreset] = useState('');
  const [popupPosition, setPopupPosition] = useState({ top: 0, left: 0 });

  useEffect(() => {
    // Retrieve the stored presets from Chrome local storage
    chrome.storage.local.get(['selectedPreset'], function(result) {
      if (result.selectedPreset) {
        setSelectedPreset(result.selectedPreset);
      }
    });

    // Listen for preset updates
    chrome.runtime.onMessage.addListener((request) => {
      if (request.message === 'presetUpdated') {
        setSelectedPreset(request.selectedPreset);
      }
    });
  }, []);

  const handlePresetClick = (event, preset) => {
    const rect = event.target.getBoundingClientRect();

    let top, left;
    if (context === 'overlay' && overlayRef) {
      const overlayRect = overlayRef.current.getBoundingClientRect();
      top = rect.top - overlayRect.top + rect.height;
      left = rect.left - overlayRect.left + rect.width / 2;
    } else {
      top = rect.top + rect.height;
      left = rect.left + rect.width / 2;
    }

    setCurrentPreset(preset);
    setPopupPosition({
      top: top,
      left: left
    });
    setShowPopup(true);
  };

  const handleSelect = (option) => {
    const newSelectedPreset = {
      ...selectedPreset,
      [currentPreset]: option === 'None' ? '' : option
    };
    setSelectedPreset(newSelectedPreset);
    setShowPopup(false);
    // Store the new selected presets in Chrome local storage
    chrome.storage.local.set({ selectedPreset: newSelectedPreset }, () => {
      // Notify all components of the update
      chrome.runtime.sendMessage({ message: 'presetUpdated', selectedPreset: newSelectedPreset });
    });
  };

  const renderPresets = () => {
    const presets = ['Baseball', 'Stocks', 'Football', 'Crypto'];
    if (activeOverlayTab) {
      return presets
        .filter((preset) => preset === activeOverlayTab)
        .map((preset) => (
          <button
            key={preset}
            onClick={(e) => handlePresetClick(e, preset)}
            className={selectedPreset[preset] ? 'selected' : ''}
          >
            <h3> {preset} {selectedPreset[preset] ? `(${selectedPreset[preset]})` : ''} </h3>
          </button>
        ));
    }
    return presets.map((preset) => (
      <button
        key={preset}
        onClick={(e) => handlePresetClick(e, preset)}
        className={selectedPreset[preset] ? 'selected' : ''}
      >
        <h3> {preset} {selectedPreset[preset] ? `(${selectedPreset[preset]})` : ''} </h3>
      </button>
    ));
  };

  return (
    <div className="presets-popup">
      <div className="presets-grid">
        {renderPresets()}
      </div>
      {showPopup && (
        <PopupBubble preset={currentPreset} onSelect={handleSelect} position={popupPosition} />
      )}
    </div>
  );
};

export default Presets;
