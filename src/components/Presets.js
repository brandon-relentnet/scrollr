import React, { useState, useEffect } from 'react';
import PopupBubble from './PopupBubble';
import './Presets.css';

const Presets = () => {
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
  }, []);

  const handlePresetClick = (event, preset) => {
    const rect = event.target.getBoundingClientRect();
    const top = rect.top + window.scrollY + rect.height / 2;
    const left = rect.left + window.scrollX + rect.width / 2;

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
      // Notify overlay of the update
      chrome.runtime.sendMessage({ message: "presetUpdated", selectedPreset: newSelectedPreset });
    });
  };

  return (
    <div className="presets-popup">
      <div className="presets-grid">
        {['Baseball', 'Stocks', 'Football', 'Crypto'].map((preset) => (
          <button
            key={preset}
            onClick={(e) => handlePresetClick(e, preset)}
            className={selectedPreset[preset] ? 'selected' : ''}
          >
            <h3> {preset} {selectedPreset[preset] ? `(${selectedPreset[preset]})` : ''} </h3>
          </button>
        ))}
      </div>
      {showPopup && (
        <PopupBubble preset={currentPreset} onSelect={handleSelect} position={popupPosition} />
      )}
    </div>
  );
};

export default Presets;
