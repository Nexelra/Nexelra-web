import { useState } from "react";
import { useClient } from "./useClient";
import { createNewWallet, importWalletFromMnemonic, validateMnemonic } from "../wallet";
import { coin } from "@cosmjs/stargate";
import { BLOCKCHAIN_CONFIG } from "../config/blockchain";
import { DirectSecp256k1HdWallet } from "@cosmjs/proto-signing";

export const useNexWallet = () => { 
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  
  const { 
    client: signingClient, 
    signer: walletSigner, 
    isConnected,
    connectWithWallet,
    removeSigner,
    VietChainIdentity
  } = useClient();

  
  const connectToBlockchain = async (wallet: DirectSecp256k1HdWallet) => {
    try {
      console.log("🔌 Connecting to blockchain via useClient...");
      console.log("🔗 RPC Endpoint:", BLOCKCHAIN_CONFIG.rpcEndpoint);
      console.log("⛽ Gas Price:", BLOCKCHAIN_CONFIG.gasPrice);
      
      
      const client = await connectWithWallet(wallet);

      console.log("✅ Connected via useClient!");
      console.log("📊 Connection state:", {
        hasClient: !!client,
        isConnected: isConnected,
      });
      
      return client;
    } catch (error: any) {
      console.error("❌ Failed to connect via useClient:", error);
      console.error("🔍 Connection error details:", {
        errorMessage: error.message,
        rpcEndpoint: BLOCKCHAIN_CONFIG.rpcEndpoint,
        gasPrice: BLOCKCHAIN_CONFIG.gasPrice,
      });
      
      throw error;
    }
  };

  
  const disconnect = () => {
    console.log("👋 Disconnecting via useClient...");
    removeSigner();
    setError(null);
  };

  const createWallet = async () => {
    try {
      setIsConnecting(true);
      setError(null);
      
      console.log("🆕 Creating new Nex wallet..."); 
      const walletData = await createNewWallet();
      
      console.log("✅ Wallet created:", walletData.address);
      
      
      await connectToBlockchain(walletData.wallet);
      
      return {
        address: walletData.address,
        mnemonic: walletData.mnemonic,
      };
    } catch (err: any) {
      console.error("❌ Failed to create wallet:", err);
      setError(err.message);
      throw err;
    } finally {
      setIsConnecting(false);
    }
  };

  const importWallet = async (mnemonic: string) => {
    console.log("🔄 Importing wallet via useClient...");
    
    try {
      if (!mnemonic || typeof mnemonic !== 'string') {
        throw new Error('Invalid mnemonic: mnemonic is required');
      }

      console.log("🔍 Validating mnemonic...");
      validateMnemonic(mnemonic);
      console.log("✅ Mnemonic validation passed");
      
      console.log("🔐 Creating wallet from mnemonic...");
      const wallet = await DirectSecp256k1HdWallet.fromMnemonic(
        mnemonic,
        { prefix: BLOCKCHAIN_CONFIG.addressPrefix }
      );

      const [firstAccount] = await wallet.getAccounts();
      console.log("✅ Wallet created, address:", firstAccount.address);
      
      console.log("🔌 Connecting to blockchain via useClient...");
      
      
      const connectedClient = await connectToBlockchain(wallet);
      
      console.log("📊 Post-connection state:", {
        hasConnectedClient: !!connectedClient,
        hasSigningClient: !!signingClient,
        hasWalletSigner: !!walletSigner,
        isConnected: isConnected,
      });
      
      console.log("✅ Wallet imported successfully via useClient:", firstAccount.address);
      return firstAccount.address;
      
    } catch (error: any) {
      console.error("❌ Failed to import wallet via useClient:", error);
      
      console.error("📊 Error state:", {
        errorMessage: error.message,
        errorStack: error.stack,
        hasSigningClient: !!signingClient,
        hasWalletSigner: !!walletSigner,
        isConnected: isConnected,
      });
      
      throw error;
    }
  };

  const sendTokens = async (toAddress: string, amount: string, memo?: string) => {
    try {
      
      if (!signingClient || !walletSigner) {
        throw new Error("Wallet not connected via useClient");
      }

      console.log("💸 Sending tokens via useClient...");
      
      const accounts = await walletSigner.getAccounts();
      const fromAddress = accounts[0].address;

      const microAmount = (parseFloat(amount) * Math.pow(10, BLOCKCHAIN_CONFIG.currency.coinDecimals)).toString();
      const sendAmount = coin(microAmount, BLOCKCHAIN_CONFIG.currency.coinMinimalDenom);
      
      const result = await signingClient.sendTokens(
        fromAddress,
        toAddress,
        [sendAmount],
        {
          amount: [coin("5000", BLOCKCHAIN_CONFIG.currency.coinMinimalDenom)],
          gas: "200000",
        },
        memo
      );

      console.log("✅ Transaction successful via useClient!");
      return {
        ...result,
        explorerUrl: `${BLOCKCHAIN_CONFIG.explorerUrl}/tx/${result.transactionHash}`,
      };
    } catch (error: any) {
      console.error("❌ Transaction failed:", error);
      setError(error.message);
      throw error;
    }
  };

  const getBalance = async (address: string) => {
    try {
      console.log("💰 Getting balance for:", address);
      
      const restEndpoint = `${BLOCKCHAIN_CONFIG.restEndpoint}/cosmos/bank/v1beta1/balances/${address}`;
      const response = await fetch(restEndpoint);
      
      if (response.ok) {
        const data = await response.json();
        const balances = data.balances || [];
        const targetBalance = balances.find(
          (bal: any) => bal.denom === BLOCKCHAIN_CONFIG.currency.coinMinimalDenom
        );

        if (targetBalance) {
          const amount = targetBalance.amount;
          const readable = `${(parseInt(amount) / Math.pow(10, BLOCKCHAIN_CONFIG.currency.coinDecimals)).toFixed(6)} ${BLOCKCHAIN_CONFIG.currency.coinDenom}`;
          
          return {
            amount: amount,
            denom: targetBalance.denom,
            readable: readable,
          };
        }
      }
      
      return {
        amount: "0",
        denom: BLOCKCHAIN_CONFIG.currency.coinMinimalDenom,
        readable: `0 ${BLOCKCHAIN_CONFIG.currency.coinDenom}`,
      };
      
    } catch (error) {
      console.error("❌ Failed to get balance:", error);
      return { 
        amount: "0",
        denom: BLOCKCHAIN_CONFIG.currency.coinMinimalDenom, 
        readable: `0 ${BLOCKCHAIN_CONFIG.currency.coinDenom}`,
      };
    }
  };

  const requestFaucet = async (address: string, amount?: string) => {
    try {
      console.log("🚰 Requesting faucet tokens for:", address);
      
      const faucetAmount = amount || BLOCKCHAIN_CONFIG.faucetAmount;
      const response = await fetch(BLOCKCHAIN_CONFIG.faucetEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify({
          address: address,
          amount: faucetAmount,
          denom: BLOCKCHAIN_CONFIG.currency.coinMinimalDenom,
        }),
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Faucet request failed: ${response.status} - ${errorText}`);
      }
      
      const result = await response.json();
      const txHash = result.txhash || result.tx_hash || result.transactionHash;
      
      return {
        success: true,
        txHash: txHash,
        amount: faucetAmount,
        denom: BLOCKCHAIN_CONFIG.currency.coinMinimalDenom,
        explorerUrl: txHash ? `${BLOCKCHAIN_CONFIG.explorerUrl}/tx/${txHash}` : null,
        message: result.message || "Tokens sent successfully",
      };
      
    } catch (error: any) {
      console.error("❌ Faucet request failed:", error);
      throw {
        message: error.message || "Failed to request faucet tokens",
        status: error.status || "network_error",
        endpoint: BLOCKCHAIN_CONFIG.faucetEndpoint,
      };
    }
  };

  
  const registerIdentity = async (identityData: {
    fullName: string;
    dateOfBirth: string;
    nationalId: string;
  }) => {
    try {
      console.log("🆔 Registering identity via useClient VietChainIdentity...");
      
      if (!signingClient || !walletSigner) {
        throw new Error("Wallet not connected via useClient");
      }

      const accounts = await walletSigner.getAccounts();
      const creatorAddress = accounts[0].address;

      console.log("📝 Identity data prepared:", {
        fullName: identityData.fullName,
        dateOfBirth: identityData.dateOfBirth,
        nationalId: "***HIDDEN***"
      });

      
      const result = await VietChainIdentity.tx.sendMsgCreateIdentity({
        value: {
          creator: creatorAddress,
          fullName: identityData.fullName.trim(),
          dateOfBirth: identityData.dateOfBirth,
          nationalId: identityData.nationalId.replace(/\D/g, ''),
        },
        fee: { 
          amount: [{ denom: "token", amount: "1000" }], 
          gas: "200000" 
        },
        memo: "Register identity via useNexWallet" 
      });

      if (result.code === 0) {
        console.log("✅ Identity registration successful via useClient!");
        return {
          transactionHash: result.transactionHash,
          height: result.height,
          gasUsed: result.gasUsed,
          explorerUrl: `${BLOCKCHAIN_CONFIG.explorerUrl}/tx/${result.transactionHash}`,
        };
      } else {
        throw new Error(`Transaction failed with code: ${result.code}. ${result.rawLog}`);
      }

    } catch (error: any) {
      console.error("❌ useClient identity registration failed:", error);
      setError(error.message);
      throw error;
    }
  };

  
  const getIdentityByCreator = async (creatorAddress: string) => {
    try {
      console.log("🔍 Querying identity via useClient for creator:", creatorAddress);
      
      
      if (VietChainIdentity.query && VietChainIdentity.query.listIdentity) {
        try {
          const identities = await VietChainIdentity.query.listIdentity();
          const userIdentity = identities?.identity?.find((id: any) => id.creator === creatorAddress);
          if (userIdentity) {
            return userIdentity;
          }
        } catch (queryError) {
          console.warn("⚠️ VietChainIdentity query failed, falling back to REST:", queryError);
        }
      }
      
      
      const endpoints = [
        `${BLOCKCHAIN_CONFIG.restEndpoint}/vietchain/identity/identity`,
        `${BLOCKCHAIN_CONFIG.restEndpoint}/vietchain/identity/identity/${creatorAddress}`,
      ];

      for (const endpoint of endpoints) {
        try {
          const response = await fetch(endpoint);
          
          if (response.ok) {
            const data = await response.json();
            if (data.identity) {
              if (Array.isArray(data.identity)) {
                const userIdentity = data.identity.find((id: any) => id.creator === creatorAddress);
                if (userIdentity) {
                  return userIdentity;
                }
              } else if (data.identity.creator === creatorAddress) {
                return data.identity;
              }
            }
          }
        } catch (error) {
          continue;
        }
      }

      return null;
    } catch (error: any) {
      console.error("❌ Failed to query identity via useClient:", error);
      return null;
    }
  };

  const getTransactionHistory = async (address: string, limit: number = 10) => {
    console.log("📜 Getting transaction history for:", address);
    
    try {
      
      const response = await fetch(
        `${BLOCKCHAIN_CONFIG.restEndpoint}/cosmos/tx/v1beta1/txs?events=transfer.recipient%3D%27${address}%27&pagination.limit=${limit}`
      );
      
      if (response.ok) {
        const data = await response.json();
        const txs = data.txs || [];
        
        return txs.slice(0, limit).map((tx: any) => ({
          hash: tx.txhash,
          height: tx.height,
          timestamp: tx.timestamp || new Date().toISOString(),
          type: "received",
          amount: "0",
          readableAmount: "0.000000 STAKE",
          denom: BLOCKCHAIN_CONFIG.currency.coinMinimalDenom,
          fromAddress: "unknown",
          toAddress: address,
          fee: "N/A",
          memo: tx.tx?.body?.memo || "",
          success: tx.code === 0,
          explorerUrl: `${BLOCKCHAIN_CONFIG.explorerUrl}/tx/${tx.txhash}`,
        }));
      }
      
      
      return [
        {
          hash: "MOCK_TX_123",
          height: 12345,
          timestamp: new Date().toISOString(),
          type: "received" as const,
          amount: "1000000",
          readableAmount: "1.000000 STAKE",
          denom: "stake",
          fromAddress: "cosmos1faucet123",
          toAddress: address,
          fee: "5000",
          memo: "Faucet tokens",
          success: true,
          explorerUrl: `${BLOCKCHAIN_CONFIG.explorerUrl}/tx/MOCK_TX_123`,
        }
      ];
      
    } catch (error: any) {
      console.error("❌ Failed to get transaction history:", error);
      return [];
    }
  };

  
  const createIdentity = async (identityData: {
    fullName: string;
    dateOfBirth: string;
    nationalId: string;
  }) => {
    try {
      console.log("🆔 Creating identity via useClient VietChainIdentity...");
      
      if (!signingClient || !walletSigner) {
        throw new Error("Wallet not connected via useClient");
      }

      const accounts = await walletSigner.getAccounts();
      const creatorAddress = accounts[0].address;

      console.log("📝 Identity data prepared:", {
        creator: creatorAddress,
        fullName: identityData.fullName,
        dateOfBirth: identityData.dateOfBirth,
        nationalId: "***HIDDEN***"
      });

      
      const result = await VietChainIdentity.tx.sendMsgCreateIdentity({
        value: {
          creator: creatorAddress,
          fullName: identityData.fullName.trim(),
          dateOfBirth: identityData.dateOfBirth,
          nationalId: identityData.nationalId.replace(/\D/g, ''),
        },
        fee: { 
          amount: [{ denom: "token", amount: "1000" }], 
          gas: "200000" 
        },
        memo: "Create identity via useNexWallet" 
      });

      if (result.code === 0) {
        console.log("✅ Identity creation successful via useClient!");
        return {
          transactionHash: result.transactionHash,
          height: result.height,
          gasUsed: result.gasUsed,
          explorerUrl: `${BLOCKCHAIN_CONFIG.explorerUrl}/tx/${result.transactionHash}`,
        };
      } else {
        throw new Error(`Transaction failed with code: ${result.code}. ${result.rawLog}`);
      }

    } catch (error: any) {
      console.error("❌ useClient identity creation failed:", error);
      setError(error.message);
      throw error;
    }
  };

  return {
    
    createWallet,
    importWallet,
    disconnect,
    
    
    getBalance,
    sendTokens,
    getTransactionHistory,
    requestFaucet,
    
    
    createIdentity,           
    registerIdentity,         
    getIdentityByCreator,     
    
    
    isConnecting,
    error,
    isConnected,
    
    
    client: signingClient,
    signer: walletSigner,
    
    
    config: BLOCKCHAIN_CONFIG,
  };
};
