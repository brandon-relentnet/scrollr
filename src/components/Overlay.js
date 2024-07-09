import React, { useState, useEffect } from 'react';

const Overlay = () => {
  const [activeTab, setActiveTab] = useState('');
  const [selectedPreset, setSelectedPreset] = useState({});

  useEffect(() => {
    // Fetch the selected preset from storage
    chrome.storage.local.get('selectedPreset', (result) => {
      if (result.selectedPreset) {
        setSelectedPreset(result.selectedPreset);
      }
    });

    // Listen for updates to the selected preset
    chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
      if (request.message === "presetUpdated") {
        setSelectedPreset(request.selectedPreset);
      }
    });
  }, []);

  const renderContent = () => {
    if (!selectedPreset[activeTab]) {
      return `Please select a ${activeTab.toLowerCase()} preset from the popup menu.`;
    }
    return `${selectedPreset[activeTab]} preset displayed here.`;
  };

  return (
    <div style={{ padding: '10px', color: 'white' }}>
      <div style={{ display: 'flex', justifyContent: 'flex-start', alignItems: 'center' }}>
        <div onClick={() => setActiveTab('Baseball')} style={tabStyle(activeTab === 'Baseball')}>B</div>
        <div onClick={() => setActiveTab('Football')} style={tabStyle(activeTab === 'Football')}>F</div>
        <div onClick={() => setActiveTab('Stocks')} style={tabStyle(activeTab === 'Stocks')}>S</div>
        <div onClick={() => setActiveTab('Crypto')} style={tabStyle(activeTab === 'Crypto')}>C</div>
      </div>
      <div id="content" style={{ textAlign: 'center', marginTop: '10px' }}>
        {activeTab ? renderContent() : 'Select a tab to display its preset.'}
      </div>
    </div>
  );
};

const tabStyle = (isActive) => ({
  padding: '10px',
  margin: '0 5px',
  backgroundColor: isActive ? '#4caf50' : '#1e1e2e',
  borderRadius: '5px',
  cursor: 'pointer',
  userSelect: 'none'
});

export default Overlay;
