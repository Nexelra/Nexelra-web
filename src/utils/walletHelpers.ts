import { Wallet } from '../def-hooks/walletContext';

export function isEncryptedWallet(wallet: Wallet): boolean {
  return !!(wallet.encryptedMnemonic && !wallet.mnemonic);
}

export function isLegacyWallet(wallet: Wallet): boolean {
  return !!(wallet.mnemonic && !wallet.encryptedMnemonic);
}

export function requiresPassword(wallet: Wallet): boolean {
  return isEncryptedWallet(wallet);
}

export const getWalletType = (wallet: any): 'nexwallet-encrypted' | 'nexwallet-legacy' | 'keyring' | 'unknown' => { // 🔄 Đổi từ 'phiwallet' thành 'nexwallet'
  if (!wallet) return 'unknown';
  
  // NexWallet encrypted - có encryptedMnemonic, không có mnemonic plaintext
  if (wallet.encryptedMnemonic && !wallet.mnemonic) {
    return 'nexwallet-encrypted';
  }
  
  // NexWallet legacy - có mnemonic plaintext và name
  if (wallet.mnemonic && wallet.name) {
    return 'nexwallet-legacy'; 
  }
  
  // Keyring wallet - có accounts nhưng không có mnemonic data
  if (wallet.accounts && wallet.accounts.length > 0 && !wallet.mnemonic && !wallet.encryptedMnemonic) {
    return 'keyring';
  }
  
  return 'unknown';
};

export const canBackupWallet = (wallet: any): boolean => {
  const type = getWalletType(wallet);
  return type === 'nexwallet-encrypted' || type === 'nexwallet-legacy'; // 🔄 Đổi từ 'phiwallet' thành 'nexwallet'
};

export const getWalletTypeDisplay = (wallet: any): string => {
  const type = getWalletType(wallet);
  
  switch (type) {
    case 'nexwallet-encrypted': // 🔄 Đổi từ 'phiwallet-encrypted' thành 'nexwallet-encrypted'
      return 'NexWallet (Encrypted)'; // 🔄 Đổi từ 'PhiWallet' thành 'NexWallet'
    case 'nexwallet-legacy': // 🔄 Đổi từ 'phiwallet-legacy' thành 'nexwallet-legacy'
      return 'NexWallet (Legacy)'; // 🔄 Đổi từ 'PhiWallet' thành 'NexWallet'
    case 'keyring':
      return 'Keyring Wallet';
    default:
      return 'Unknown Wallet';
  }
};