import React, { useState } from 'react';

const Overlay = () => {
  const [activeTab, setActiveTab] = useState('');

  const renderContent = () => {
    if (activeTab === '') {
      return 'Select a preset to display its content here.';
    }
    return `Displaying content for ${activeTab}`;
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
        {renderContent()}
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
