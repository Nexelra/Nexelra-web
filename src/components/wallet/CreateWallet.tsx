import React, { useState } from 'react';
import { useNexWallet } from '../../hooks/useNexWallet';
import { useWalletContext } from '../../def-hooks/walletContext';
import { createWalletWithPassword, formatMnemonicForDisplay } from '../../wallet';
import '../../styles/wallet.css'
interface CreateWalletProps {
  onClose: () => void;
  onWalletCreated?: (address: string) => void;
}

const CreateWallet: React.FC<CreateWalletProps> = ({ onClose, onWalletCreated }) => {
  const [step, setStep] = useState<'create' | 'confirm' | 'success'>('create');
  const [mnemonic, setMnemonic] = useState<string>('');
  const [address, setAddress] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirmWords, setConfirmWords] = useState<{ [key: number]: string }>({});
  
  
  const [walletName, setWalletName] = useState('');
  const [spendingPassword, setSpendingPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  
  const nexWallet = useNexWallet();
  const { setActiveWallet } = useWalletContext();

  
  const confirmPositions = [2, 6, 10]; 

  const handleCreateWallet = async () => {
    setError(null);

    
    if (!walletName.trim()) {
      setError('Wallet name is required');
      return;
    }

    if (!spendingPassword) {
      setError('Spending password is required');
      return;
    }

    if (spendingPassword.length < 6) {
      setError('Spending password must be at least 6 characters');
      return;
    }

    if (spendingPassword !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setIsLoading(true);

    try {
      
      const walletData = await createWalletWithPassword(spendingPassword);
      
      
      
      
      if (!walletData.mnemonic) {
        throw new Error('Failed to generate mnemonic');
      }
      
      setMnemonic(walletData.mnemonic); 
      setEncryptedMnemonic(walletData.encryptedMnemonic); 
      setAddress(walletData.address);
      setStep('confirm');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const [encryptedMnemonic, setEncryptedMnemonic] = useState('');

  const handleConfirmMnemonic = () => {
    const mnemonicWords = formatMnemonicForDisplay(mnemonic);
    
    
    for (const pos of confirmPositions) {
      if (confirmWords[pos]?.toLowerCase().trim() !== mnemonicWords[pos]?.toLowerCase()) {
        setError(`Word ${pos + 1} is incorrect. Please try again.`);
        return;
      }
    }

    
    const walletData = {
      id: Date.now().toString(),
      name: walletName.trim(),
      encryptedMnemonic: encryptedMnemonic, 
      spendingPassword: undefined, 
      accounts: [{ address: address }],
      isActive: true,
      createdAt: new Date().toISOString(),
    };

    setActiveWallet(walletData);
    
    setMnemonic('');
    
    setStep('success');
    onWalletCreated?.(address);
  };

  const mnemonicWords = mnemonic ? formatMnemonicForDisplay(mnemonic) : [];

  return (
    <div className="create-wallet-modal">
      <div
  className="modal-overlay"
  onClick={onClose}
  onKeyDown={(e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      onClose();
    }
  }}
  role="button"
  tabIndex={0}
>
        <div
  className="modal-content"
  onClick={(e) => e.stopPropagation()}
  onKeyDown={(e) => e.stopPropagation()}
  role="presentation"
  tabIndex={-1}
>

          {step === 'create' && (
            <div className="create-step">
              <h2>🆕 Create New Nex Wallet</h2>
              
              {/* 🆕 Add wallet setup form */}
              <form onSubmit={(e) => { e.preventDefault(); handleCreateWallet(); }}>
                {/* Wallet Name */}
                <div className="form-group">
                  <label htmlFor="walletName">
                    Wallet Name: <span className="required">*</span>
                  </label>
                  <input
                    type="text"
                    id="walletName"
                    value={walletName}
                    onChange={(e) => setWalletName(e.target.value)}
                    placeholder="Enter wallet name (e.g., My Nex Wallet)"
                    required
                  />
                </div>

                {/* 🆕 Spending Password */}
                <div className="form-group">
                  <label htmlFor="spendingPassword">
                    Spending Password: <span className="required">*</span>
                  </label>
                  <div className="password-input-container">
                    <input
                      type={showPassword ? "text" : "password"}
                      id="spendingPassword"
                      value={spendingPassword}
                      onChange={(e) => setSpendingPassword(e.target.value)}
                      placeholder="Enter spending password (min 6 characters)"
                      required
                      minLength={6}
                    />
                    <button
                      type="button"
                      className="toggle-password"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? '🙈' : '👁️'}
                    </button>
                  </div>
                  <small className="help-text">
                    This password will be required for all transactions
                  </small>
                </div>

                {/* 🆕 Confirm Spending Password */}
                <div className="form-group">
                  <label htmlFor="confirmPassword">
                    Confirm Spending Password: <span className="required">*</span>
                  </label>
                  <input
                    type={showPassword ? "text" : "password"}
                    id="confirmPassword"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Confirm your spending password"
                    required
                    minLength={6}
                  />
                </div>

                {/* Security Notice */}
                <div className="security-warning">
                  <h3>🔐 Security Information:</h3>
                  <ul>
                    <li>✅ Your spending password protects all transactions</li>
                    <li>⚠️ Keep your password secure and memorable</li>
                    <li>🚫 We cannot recover your spending password if lost</li>
                    <li>💡 Use a strong, unique password</li>
                    <li>📝 Your recovery phrase will be generated next</li>
                  </ul>
                </div>

                {error && (
                  <div className="error-message">❌ {error}</div>
                )}

                <div className="button-group">
                  <button
                    type="submit"
                    disabled={isLoading || !walletName.trim() || !spendingPassword || !confirmPassword}
                    className="primary-button"
                  >
                    {isLoading ? '🔄 Creating Nex Wallet...' : '🆕 Create Nex Wallet'}
                  </button>
                  <button type="button" onClick={onClose} className="secondary-button">
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          )}

          {step === 'confirm' && (
            <div className="confirm-step">
              <h2>📝 Backup Your Recovery Phrase</h2>
              
              {/* Wallet info */}
              <div className="wallet-summary">
                <p><strong>Wallet Name:</strong> {walletName}</p>
                <p><strong>Address:</strong> {address.slice(0, 20)}...{address.slice(-8)}</p>
              </div>
              
              <div className="mnemonic-display">
                <h3>Your 12-word Recovery Phrase:</h3>
                <div className="important-notice">
                  ⚠️ <strong>Write this down and store it safely!</strong> You'll need it to recover your wallet.
                </div>
                
                {/* 🆕 Debug info */}
                {process.env.NODE_ENV === 'development' && (
                  <div style={{ fontSize: '12px', color: '#666', marginBottom: '10px' }}>
                    Debug: Mnemonic length: {mnemonic.length}, Words: {mnemonicWords.length}
                  </div>
                )}
                
                <div className="mnemonic-grid">
                  {mnemonicWords.length > 0 ? (
                    mnemonicWords.map((word, index) => (
                      <div key={index} className="mnemonic-word">
                        <span className="word-number">{index + 1}</span>
                        <span className="word-text">{word}</span>
                      </div>
                    ))
                  ) : (
                    <div className="error-message">
                      ❌ No mnemonic words to display. Please try creating wallet again.
                    </div>
                  )}
                </div>
                
                {/* 🆕 Copy to clipboard button */}
                <div className="mnemonic-actions">
                  <button
                    type="button"
                    onClick={() => {
                      navigator.clipboard.writeText(mnemonic);
                      alert('Recovery phrase copied to clipboard! Make sure to store it safely.');
                    }}
                    className="secondary-button"
                  >
                    📋 Copy to Clipboard
                  </button>
                </div>
              </div>

              <div className="confirmation-section">
                <h3>Confirm your recovery phrase</h3>
                <p>Please enter the following words to confirm you've saved them:</p>
                
                {confirmPositions.map((pos) => (
                  <div key={pos} className="word-input">
                    <label>Word #{pos + 1}:</label>
                    <input
                      type="text"
                      value={confirmWords[pos] || ''}
                      onChange={(e) => setConfirmWords(prev => ({
                        ...prev,
                        [pos]: e.target.value
                      }))}
                      placeholder={`Enter word ${pos + 1}`}
                    />
                  </div>
                ))}
              </div>

              {error && (
                <div className="error-message">❌ {error}</div>
              )}

              <div className="button-group">
                <button
                  onClick={handleConfirmMnemonic}
                  disabled={confirmPositions.some(pos => !confirmWords[pos]?.trim())}
                  className="primary-button"
                >
                  ✅ Confirm & Create Wallet
                </button>
                <button onClick={() => setStep('create')} className="secondary-button">
                  Back
                </button>
              </div>
            </div>
          )}

          {step === 'success' && (
            <div className="success-step">
              <h2>🎉 Wallet Created Successfully!</h2>
              
              <div className="wallet-info">
                <p><strong>Wallet Name:</strong> {walletName}</p>
                <p><strong>Address:</strong></p>
                <div className="address-display">{address}</div>
                <p><strong>Spending Password:</strong> ✅ Set and secured</p>
              </div>

              <div className="success-message">
                <p>✅ Your wallet has been created and is now active.</p>
                <p>🔐 Your spending password is required for transactions.</p>
                <p>📝 Make sure you've securely stored your recovery phrase!</p>
              </div>

              <button onClick={onClose} className="primary-button">
                🚀 Start Using Nex Wallet
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CreateWallet;