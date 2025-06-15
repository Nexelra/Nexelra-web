import React, { useState, useEffect } from 'react';
import { useWalletContext } from '../def-hooks/walletContext';
import IgntCard from '../components/ignt/IgntCard';
import CreateIdentity from '../components/identity/CreateIdentity';
import VerifyIdentity from '../components/identity/VerifyIdentity';
import EkycIdentity from '../components/identity/EkycIdentity';
import '../styles/identity.css';

export default function IdentityView() {
  const { activeWallet } = useWalletContext();
  const [activeTab, setActiveTab] = useState<'create' | 'ekyc' | 'verify'>('create');
  const [tempIdentityData, setTempIdentityData] = useState<any>(null);
  const [ekycResult, setEkycResult] = useState<any>(null);

  
  const resetToCreateTab = () => {
    console.log('🔄 Resetting to create tab...');
    setActiveTab('create');
    setTempIdentityData(null);
    setEkycResult(null);
  };

  if (!activeWallet) {
    return (
      <div className="identity-view">
        <IgntCard>
          <div className="no-wallet-message">
            <h2>🔒 Wallet Required</h2>
            <p>Please connect or create a wallet to manage your identity.</p>
          </div>
        </IgntCard>
      </div>
    );
  }

  return (
    <div className="identity-view">
      <IgntCard>
        <div className="identity-header">
          <h1>🆔 Identity Management</h1>
          <p>Manage your digital identity on the blockchain</p>
        </div>

        {/* Tab Navigation */}
        <div className="identity-tabs">
          <button
            className={`tab-button ${activeTab === 'create' ? 'active' : ''}`}
            onClick={() => setActiveTab('create')}
          >
            ➕ Create Identity
          </button>
          
          <button
            className={`tab-button ${activeTab === 'ekyc' ? 'active' : ''}`}
            onClick={() => setActiveTab('ekyc')}
          >
            📷 ID & Face Capture
          </button>
          
          <button
            className={`tab-button ${activeTab === 'verify' ? 'active' : ''}`}
            onClick={() => setActiveTab('verify')}
          >
            ✅ Verify Identity
          </button>
        </div>

        {/* Tab Content */}
        <div className="tab-content">
          {/* Create Identity Tab */}
          {activeTab === 'create' && (
            <CreateIdentity 
              onIdentityCreated={(identity) => {
                console.log('🔄 Identity creation initiated:', identity);
                setTempIdentityData(identity);
                setActiveTab('ekyc');
              }}
              initialData={tempIdentityData}
            />
          )}
          
          {/* eKYC Tab - ID & Face Capture */}
          {activeTab === 'ekyc' && (
            <EkycIdentity 
              onEkycResult={(result) => {
                console.log('📥 Received eKYC result:', result);
                setEkycResult(result);
                
                setActiveTab('verify');
              }}
              identityData={tempIdentityData}
            />
          )}
          
          {/* Verify Identity Tab */}
          {activeTab === 'verify' && (
            <VerifyIdentity 
              ekycResult={ekycResult}
              identityData={tempIdentityData}
              onVerificationComplete={(result) => {
                console.log('🎯 Verification completed:', result);
                
              }}
              onNavigateAway={resetToCreateTab} 
            />
          )}
        </div>
      </IgntCard>
    </div>
  );
}