import React, { useState, useEffect } from 'react';
import { useNexWallet } from '../../hooks/useNexWallet';
import { useWalletContext } from '../../def-hooks/walletContext';
import { useWalletUnlock } from '../../hooks/useWalletUnlock'; 
import { TransactionSigning } from './TransactionSigning';
import { PasswordModal } from './PasswordModal';
import { BackupModal } from './BackupModal'; 
import { requiresPassword, isEncryptedWallet ,
  getWalletType
} from '../../utils/walletHelpers';
import "../../styles/advanced-feature.css"

type ConnectionStatus = 
  | 'no-wallet'
  | 'requires-password'
  | 'connected'
  | 'connection-error'
  | 'invalid-wallet'
  | 'wallet-ready'
  | 'connecting'
  | 'failed';

interface SendTokensProps {
  currentAddress: string;
  onTransactionComplete?: (txHash: string) => void;
}

const SendTokens: React.FC<SendTokensProps> = ({ 
  currentAddress, 
  onTransactionComplete 
}) => {
  const nexWallet = useNexWallet();
  const { activeWallet } = useWalletContext();
  const { unlockWallet, isUnlocking } = useWalletUnlock();
  
  const [recipient, setRecipient] = useState('');
  const [amount, setAmount] = useState('');
  const [memo, setMemo] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  
  
  const [showSigningModal, setShowSigningModal] = useState(false);
  const [pendingTransaction, setPendingTransaction] = useState<any>(null);
  const [isSigningLoading, setIsSigningLoading] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>('no-wallet');

  
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [passwordError, setPasswordError] = useState<string | null>(null);

  
  const [balance, setBalance] = useState<any>(null);
  const [isLoadingBalance, setIsLoadingBalance] = useState(false);

  
  const [showBackupModal, setShowBackupModal] = useState(false);
  const [backupMnemonic, setBackupMnemonic] = useState<string | null>(null);

  
  useEffect(() => {
    const ensureConnection = async () => {
      if (!activeWallet) {
        console.log("❌ No active wallet found");
        setConnectionStatus('no-wallet');
        return false;
      }

      
      if (isEncryptedWallet(activeWallet)) {
        console.log("🔐 Encrypted wallet detected - password required");
        setConnectionStatus('requires-password');
        return false; 
      }

      
      if (activeWallet.mnemonic) {
        if (!nexWallet.isConnected) {
          console.log("🔄 SendTokens: NexWallet not connected, connecting...");
          try {
            await nexWallet.importWallet(activeWallet.mnemonic);
            setConnectionStatus('connected');
            return true;
          } catch (error: any) {
            console.error("❌ SendTokens: Failed to connect nexWallet:", error);
            setConnectionStatus('connection-error');
            return false;
          }
        }
        setConnectionStatus('connected');
        return true;
      }

      
      setConnectionStatus('invalid-wallet');
      return false;
    };

    ensureConnection();
  }, [activeWallet, nexWallet.isConnected, nexWallet.client]);

  const isConnected = !!(
    activeWallet && 
    (connectionStatus === 'wallet-ready' || connectionStatus === 'connected' || connectionStatus === 'requires-password')
  );

  
  const ensureConnection = async () => {
    if (!activeWallet) {
      console.log("❌ No active wallet found");
      setConnectionStatus('no-wallet');
      return false;
    }

    if (activeWallet.mnemonic) {
      if (!nexWallet.isConnected) {
        console.log("🔄 SendTokens: NexWallet not connected, connecting...");
        try {
          await nexWallet.importWallet(activeWallet.mnemonic);
          setConnectionStatus('connected');
          return true;
        } catch (error: any) {
          console.error("❌ SendTokens: Failed to connect nexWallet:", error);
          setConnectionStatus('connection-error');
          return false;
        }
      }
      setConnectionStatus('connected');
      return true;
    }

    setConnectionStatus('invalid-wallet');
    return false;
  };

  
  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    try {
      
      if (!recipient.trim()) {
        throw new Error('Recipient address is required');
      }
      if (!amount || parseFloat(amount) <= 0) {
        throw new Error('Amount must be greater than 0');
      }

      
      if (!activeWallet) {
        throw new Error('No wallet selected');
      }

      if (isEncryptedWallet(activeWallet)) {
        
        setPendingTransaction({
          recipient: recipient.trim(),
          amount: amount,
          memo: memo.trim() || undefined,
        });
        setShowPasswordModal(true);
      } else if (activeWallet.mnemonic) {
        
        const isConnected = await ensureConnection();
        if (!isConnected) {
          throw new Error('Failed to connect to blockchain');
        }
        
        
        setPendingTransaction({
          recipient: recipient.trim(),
          amount: amount,
          memo: memo.trim() || undefined,
        });
        setShowSigningModal(true);
      } else {
        throw new Error('Invalid wallet data');
      }
      
    } catch (err: any) {
      console.error("❌ HandleSend error:", err);
      setError(err.message);
    }
  };

  
  const handlePasswordConfirm = async (password: string) => {
    console.log("🔐 handlePasswordConfirm called");
    console.log("🔍 pendingTransaction:", pendingTransaction);
    
    if (!activeWallet || !pendingTransaction) return;

    setPasswordError(null);

    try {
      
      if (pendingTransaction.type === 'backup') {
        console.log("🔄 Processing backup with password");
        const walletData = await unlockWallet(activeWallet.encryptedMnemonic, password);
        console.log("✅ Wallet unlocked for backup");
        console.log("📝 Mnemonic from unlock:", walletData.mnemonic);
        
        setBackupMnemonic(walletData.mnemonic);
        setShowPasswordModal(false);
        setShowBackupModal(true);
        setPendingTransaction(null);
        console.log("🎉 Backup modal should now be visible");
        return;
      }

      
      if (!activeWallet.encryptedMnemonic) {
        throw new Error('No encrypted mnemonic found');
      }
      const walletData = await unlockWallet(activeWallet.encryptedMnemonic, password);
      await nexWallet.importWallet(walletData.mnemonic);
      
      
      await loadBalance();
      
      if (balance) {
        const sendAmount = parseFloat(pendingTransaction.amount);
        const availableAmount = parseFloat(balance.amount) / Math.pow(10, 6);

        if (sendAmount > availableAmount) {
          throw new Error(`Insufficient balance. Available: ${availableAmount.toFixed(6)} NEX`);
        }
      }

      setShowPasswordModal(false);
      setShowSigningModal(true);
      
    } catch (err: any) {
      console.error("❌ Password verification failed:", err);
      setPasswordError(err.message || 'Incorrect password or failed to unlock wallet');
    }
  };

  const handleConfirmTransaction = async () => {
    if (!pendingTransaction) return;

    setIsSigningLoading(true);
    try {
      
      if (!nexWallet.client) {
        throw new Error("Lost connection to blockchain. Please refresh and try again.");
      }

      const result = await nexWallet.sendTokens(
        pendingTransaction.recipient,
        pendingTransaction.amount,
        pendingTransaction.memo
      );

      setSuccess(`Transaction sent successfully! Hash: ${result.transactionHash}`);
      onTransactionComplete?.(result.transactionHash);

      
      setRecipient('');
      setAmount('');
      setMemo('');
      setShowSigningModal(false);
      setPendingTransaction(null);

    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsSigningLoading(false);
    }
  };

  const handleCancelTransaction = () => {
    setShowSigningModal(false);
    setPendingTransaction(null);
    setIsSigningLoading(false);
  };

  
  const getConnectionStatusMessage = () => {
    switch (connectionStatus) {
      case 'no-wallet':
        return '❌ No wallet selected';
      case 'requires-password':
        return '🔐 Encrypted wallet - password required for transactions';
      case 'connected':
        return '✅ Connected to blockchain';
      case 'connection-error':
        return '❌ Failed to connect to blockchain';
      case 'invalid-wallet':
        return '❌ Invalid wallet data';
      default:
        return '❓ Unknown status';
    }
  };

  const getConnectionStatusColor = () => {
    switch (connectionStatus) {
      case 'no-wallet':
      case 'connection-error':
      case 'invalid-wallet':
        return '#f8d7da'; 
      case 'requires-password':
        return '#fff3cd'; 
      case 'connected':
        return '#d4edda'; 
      default:
        return '#e2e3e5'; 
    }
  };

  
  const loadBalance = async () => {
    if (!activeWallet?.accounts[0]?.address) return;
    
    setIsLoadingBalance(true);
    try {
      console.log("💰 Loading balance for:", activeWallet.accounts[0].address);
      
      
      const balanceData = await nexWallet.getBalance(activeWallet.accounts[0].address);
      setBalance(balanceData);
      
      console.log("✅ Balance loaded:", balanceData);
    } catch (error) {
      console.error("❌ Failed to load balance:", error);
      setBalance({ 
        amount: "0",
        denom: "stake", 
        readable: "0.000000 NEX",
      });
    } finally {
      setIsLoadingBalance(false);
    }
  };

  
  useEffect(() => {
    if (activeWallet?.accounts[0]?.address) {
      loadBalance();
    }
  }, [activeWallet?.accounts[0]?.address]);

  
  if (connectionStatus === 'connecting') {
    return (
      <div className="send-tokens-container">
        <div className="connection-prompt">
          <h3>🔄 Connecting to Blockchain...</h3>
          <p>Please wait while we establish connection.</p>
          <div className="loading-spinner">⏳</div>
        </div>
      </div>
    );
  }

  
  if (!activeWallet || connectionStatus === 'no-wallet') {
    return (
      <div className="send-tokens-container">
        <div className="connection-prompt">
          <h3>🔒 No Wallet Found</h3>
          <p>Please create or import a wallet first.</p>
        </div>
      </div>
    );
  }

  
  if (connectionStatus === 'failed' || !isConnected) {
    return (
      <div className="send-tokens-container">
        <div className="connection-prompt">
          <h3>⚠️ Blockchain Connection Failed</h3>
          <p>Unable to connect to the blockchain network.</p>
          <button 
            onClick={() => window.location.reload()} 
            className="connect-button"
          >
            🔄 Refresh Page
          </button>
          {error && (
            <div className="error-message">❌ {error}</div>
          )}
          
          <div className="debug-info" style={{ 
            fontSize: '12px', 
            color: '#666', 
            marginTop: '10px',
            padding: '10px',
            backgroundColor: '#f5f5f5',
            borderRadius: '4px'
          }}>
            <strong>Debug Info:</strong><br/>
            activeWallet: {activeWallet ? 'Yes' : 'No'}<br/>
            nexWallet.isConnected: {nexWallet.isConnected ? 'Yes' : 'No'}<br/>
            nexWallet.client: {nexWallet.client ? 'Yes' : 'No'}<br/>
            connectionStatus: {connectionStatus}
          </div>
        </div>
      </div>
    );
  }

  



const handleBackupWallet = () => {
  console.log("🔄 handleBackupWallet called");
  console.log("📋 activeWallet:", activeWallet);
  
  if (!activeWallet) {
    console.log("❌ No activeWallet");
    setError("No wallet available for backup");
    return;
  }

  const walletType = getWalletType(activeWallet);
  console.log("🔍 Wallet type:", walletType);
  console.log("🔍 activeWallet.mnemonic:", activeWallet.mnemonic);
  console.log("🔍 activeWallet.encryptedMnemonic:", activeWallet.encryptedMnemonic);
  
  if (!activeWallet.mnemonic && !activeWallet.encryptedMnemonic) {
    console.log("❌ No mnemonic data available");
    setError("This wallet type cannot be backed up through this interface. Use browser extension backup if available.");
    return;
  }

  if (isEncryptedWallet(activeWallet)) {
    console.log("🔐 Encrypted wallet - showing password modal");
    setPendingTransaction({ type: 'backup' });
    setShowPasswordModal(true);
  } else if (activeWallet.mnemonic) {
    console.log("🔓 Legacy wallet - showing backup modal directly");
    console.log("📝 Mnemonic to backup:", activeWallet.mnemonic);
    setBackupMnemonic(activeWallet.mnemonic);
    setShowBackupModal(true);
  } else {
    console.log("❌ Unable to determine backup flow");
    setError("Unable to backup this wallet - no recovery data available");
  }
};

  return (
    <div className="send-tokens-container">
      <h3>💸 Send Tokens</h3>
      
      {/* Connection Status */}
      <div className="connection-status" style={{ 
        padding: '8px', 
        backgroundColor: getConnectionStatusColor(),
        border: `1px solid ${connectionStatus === 'wallet-ready' ? '#c3e6cb' : '#ffeaa7'}`,
        borderRadius: '4px',
        marginBottom: '16px',
        fontSize: '14px'
      }}>
        {getConnectionStatusMessage()}
        {activeWallet && (
          <div style={{ fontSize: '12px', marginTop: '4px', color: '#666' }}>
            Wallet: {activeWallet.accounts[0]?.address.slice(0, 12)}...{activeWallet.accounts[0]?.address.slice(-8)}
            
            <button
              onClick={handleBackupWallet}
              style={{
                marginLeft: '8px',
                padding: '2px 6px',
                fontSize: '10px',
                backgroundColor: '#17a2b8',
                color: 'white',
                border: 'none',
                borderRadius: '3px',
                cursor: 'pointer'
              }}
            >
              📋 Backup
            </button>
          </div>
        )}
      </div>

      <div className="balance-section" style={{
        padding: '12px',
        backgroundColor: '#f8f9fa',
        border: '1px solid #dee2e6',
        borderRadius: '4px',
        marginBottom: '16px'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div className="text-sm font-medium text-gray-500">Available Balance</div>
            <div className="text-lg font-bold">
              {isLoadingBalance ? (
                <span>🔄 Loading...</span>
              ) : balance ? (
                <span>{balance.readable}</span>
              ) : (
                <span className="text-gray-400">Unable to load</span>
              )}
            </div>
          </div>
          <button
            type="button"
            onClick={loadBalance}
            disabled={isLoadingBalance}
            style={{
              padding: '4px 8px',
              fontSize: '12px',
              backgroundColor: '#6c757d',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            {isLoadingBalance ? '🔄' : '↻'}
          </button>
        </div>
      </div>

      <form onSubmit={handleSend}>
        <div className="form-group">
          <label htmlFor="amount">Amount:</label>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <input
              type="number"
              id="amount"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0.0"
              step="0.000001"
              min="0"
              required
              style={{ flex: 1 }}
            />
            {balance && (
              <button
                type="button"
                onClick={() => {
                  const maxAmount = parseFloat(balance.amount) / Math.pow(10, 6); 
                  setAmount((maxAmount * 0.99).toFixed(6)); 
                }}
                style={{
                  padding: '4px 8px',
                  fontSize: '12px',
                  backgroundColor: '#007bff',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer'
                }}
              >
                MAX
              </button>
            )}
          </div>
        </div>

        <div className="form-group">
          <label htmlFor="recipient">Recipient Address:</label>
          <input
            type="text"
            id="recipient"
            value={recipient}
            onChange={(e) => setRecipient(e.target.value)}
            placeholder="cosmos1..."
            required
          />
        </div>

        <div className="form-group">
          <label htmlFor="memo">Memo (optional):</label>
          <input
            type="text"
            id="memo"
            value={memo}
            onChange={(e) => setMemo(e.target.value)}
            placeholder="Transaction memo"
          />
        </div>

        {error && (
          <div className="error-message">
            ❌ {error}
          </div>
        )}

        {success && (
          <div className="success-message">
            ✅ {success}
          </div>
        )}

        <button
          type="submit"
          disabled={isSigningLoading || !isConnected}
          className="submit-button"
        >
          {isSigningLoading ? 'Processing...' : 
           connectionStatus === 'requires-password' ? '🔐 Review Transaction (Password Required)' :
           '💸 Review Transaction'}
        </button>
      </form>

      <PasswordModal
        isOpen={showPasswordModal}
        onClose={() => {
          setShowPasswordModal(false);
          setPendingTransaction(null);
          setPasswordError(null);
        }}
        onConfirm={handlePasswordConfirm}
        title={pendingTransaction?.type === 'backup' ? "Enter Password to View Recovery Phrase" : "Enter Spending Password"}
        isLoading={isUnlocking} 
        error={passwordError || undefined}
      />

      {showBackupModal && backupMnemonic && (
        <BackupModal
          isOpen={showBackupModal}
          onClose={() => {
            setShowBackupModal(false);
            setBackupMnemonic(null);
          }}
          walletName={activeWallet?.name || 'Unknown'}
          address={activeWallet?.accounts[0]?.address || ''}
          mnemonic={backupMnemonic}
        />
      )}

      {showSigningModal && pendingTransaction && (
        <TransactionSigning
          transaction={pendingTransaction}
          onConfirm={handleConfirmTransaction}
          onCancel={handleCancelTransaction}
          isLoading={isSigningLoading}
        />
      )}

      {error && (
        <div className="error-message" style={{ 
          color: '#721c24', 
          backgroundColor: '#f8d7da', 
          padding: '8px', 
          borderRadius: '4px', 
          marginTop: '16px' 
        }}>
          ❌ {error}
        </div>
      )}

      {success && (
        <div className="success-message" style={{ 
          color: '#155724', 
          backgroundColor: '#d4edda', 
          padding: '8px', 
          borderRadius: '4px', 
          marginTop: '16px' 
        }}>
          ✅ {success}
        </div>
      )}
    </div>
  );
};

export default SendTokens;