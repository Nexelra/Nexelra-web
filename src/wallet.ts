import { DirectSecp256k1HdWallet } from "@cosmjs/proto-signing";
import { BLOCKCHAIN_CONFIG } from "./config/blockchain";
import CryptoJS from "crypto-js";

export async function createNewWallet() {
  
  const wallet = await DirectSecp256k1HdWallet.generate(24, { 
    prefix: BLOCKCHAIN_CONFIG.addressPrefix, 
  });
  
  const accounts = await wallet.getAccounts();
  return {
    mnemonic: wallet.mnemonic,
    address: accounts[0].address,
    wallet, 
  };
}

export async function importWalletFromMnemonic(mnemonic: string) {
  try {
    const wallet = await DirectSecp256k1HdWallet.fromMnemonic(mnemonic, {
      prefix: BLOCKCHAIN_CONFIG.addressPrefix,
    });
    
    const accounts = await wallet.getAccounts();
    return {
      mnemonic: wallet.mnemonic,
      address: accounts[0].address,
      wallet,
    };
  } catch (error) {
    throw new Error("Invalid mnemonic phrase");
  }
}

export function validateMnemonic(mnemonic: string): boolean {
  if (!mnemonic || typeof mnemonic !== 'string') {
    throw new Error('Mnemonic is required and must be a string');
  }

  const trimmedMnemonic = mnemonic.trim();
  
  if (!trimmedMnemonic) {
    throw new Error('Mnemonic cannot be empty');
  }

  const words = trimmedMnemonic.split(/\s+/);
  
  if (words.length !== 12 && words.length !== 24) {
    throw new Error('Mnemonic must be 12 or 24 words');
  }

  return true;
}


export function formatMnemonicForDisplay(mnemonic: string): string[] {
  return mnemonic.trim().split(/\s+/);
}


export async function generateSecureMnemonic(): Promise<string> {
  const wallet = await DirectSecp256k1HdWallet.generate(24, { 
    prefix: BLOCKCHAIN_CONFIG.addressPrefix,
  });
  return wallet.mnemonic;
}


export function encryptMnemonic(mnemonic: string, password: string): string {
  return CryptoJS.AES.encrypt(mnemonic, password).toString();
}


export function decryptMnemonic(encryptedMnemonic: string, password: string): string | null {
  try {
    const bytes = CryptoJS.AES.decrypt(encryptedMnemonic, password);
    const decrypted = bytes.toString(CryptoJS.enc.Utf8);
    
    if (!decrypted) {
      throw new Error('Decryption failed');
    }
    
    return decrypted;
  } catch (error) {
    console.error('Failed to decrypt mnemonic:', error);
    return null;
  }
}


export async function createWalletWithPassword(password: string) {
  const walletData = await createNewWallet();
  const encryptedMnemonic = encryptMnemonic(walletData.mnemonic, password);
  
  return {
    ...walletData,
    encryptedMnemonic,
    
    mnemonic: walletData.mnemonic, 
  };
}


export async function importWalletWithPassword(mnemonic: string, password: string) {
  const walletData = await importWalletFromMnemonic(mnemonic);
  const encryptedMnemonic = encryptMnemonic(mnemonic, password);
  
  return {
    ...walletData,
    encryptedMnemonic,
    mnemonic: undefined, 
  };
}


export async function restoreWalletFromPassword(encryptedMnemonic: string, password: string) {
  const mnemonic = decryptMnemonic(encryptedMnemonic, password);
  
  if (!mnemonic) {
    throw new Error('Incorrect password or corrupted data');
  }
  
  return await importWalletFromMnemonic(mnemonic);
}