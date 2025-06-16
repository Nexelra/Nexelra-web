import { useState } from "react";
import { useDispatchWalletContext, useWalletContext } from "../../def-hooks/walletContext";
import { useNexWallet } from "../../hooks/useNexWallet";
import { BLOCKCHAIN_CONFIG } from "../../config/blockchain";
import {
  IgntButton,
  IgntModal,
  IgntSpinner,
} from "@ignt/react-library";


import CreateWallet from "./CreateWallet";
import ImportWallet from "./ImportWallet";

interface State {
  modalPage: "connect" | "success" | "error";
  showModal: boolean;
  errorMessage: string;
  
  showCreateWallet: boolean;
  showImportWallet: boolean;
}

export default function NexWalletConnect() {
  const walletStore = useWalletContext();
  const walletActions = useDispatchWalletContext();
  const nexWallet = useNexWallet();

  const [state, setState] = useState<State>({
    modalPage: "connect",
    showModal: false,
    errorMessage: "",
    showCreateWallet: false,
    showImportWallet: false, 
  });

  
  const handleShowCreateWallet = () => {
    setState(prev => ({ 
      ...prev, 
      showModal: false,
      showCreateWallet: true
    }));
  };

  
  const handleShowImportWallet = () => {
    setState(prev => ({ 
      ...prev, 
      showModal: false,
      showImportWallet: true
    }));
  };

  
  const handleWalletCreated = (address: string) => {
    console.log('✅ Wallet created with address:', address);
    setState(prev => ({ 
      ...prev, 
      showCreateWallet: false
    }));
  };

  
  const handleWalletImported = (address: string) => {
    console.log('✅ Wallet imported with address:', address);
    setState(prev => ({ 
      ...prev, 
      showImportWallet: false
    }));
  };

  
  const handleCloseCreateWallet = () => {
    setState(prev => ({ 
      ...prev, 
      showCreateWallet: false,
      showModal: true,
      modalPage: "connect"
    }));
  };

  
  const handleCloseImportWallet = () => {
    setState(prev => ({ 
      ...prev, 
      showImportWallet: false,
      showModal: true,
      modalPage: "connect"
    }));
  };

  const renderModalContent = () => {
    switch (state.modalPage) {
      case "connect":
        return (
          <div className="text-center p-6">
            <div className="mb-4">
              <div className="w-16 h-16 bg-blue-500 rounded-full flex items-center justify-center text-white text-2xl font-bold mx-auto mb-4">
                N
              </div>
              <h2 className="text-2xl font-bold mb-2">Connect to {BLOCKCHAIN_CONFIG.chainName}</h2>
              <p className="text-gray-600 mb-6">
                Create a new Nex Wallet or import an existing one to get started with Viet Chain.
              </p>
            </div>
            <div className="space-y-3">
              <IgntButton
                type="primary"
                onClick={handleShowCreateWallet}
                className="w-full"
              >
                🆕 Create New Nex Wallet
              </IgntButton>
              <IgntButton
                type="secondary"
                onClick={handleShowImportWallet}
                className="w-full"
              >
                📥 Import Existing Nex Wallet
              </IgntButton>
            </div>
          </div>
        );

      case "error":
        return (
          <div className="text-center p-6">
            <div className="text-red-500 text-4xl mb-4">❌</div>
            <h2 className="text-2xl font-bold mb-4 text-red-600">Connection Failed</h2>
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
              <p className="text-red-700">{state.errorMessage}</p>
            </div>
            <div className="space-y-2">
              <IgntButton
                type="primary"
                onClick={() => setState(prev => ({ 
                  ...prev, 
                  modalPage: "connect",
                  errorMessage: ""
                }))}
                className="w-full"
              >
                Try Again
              </IgntButton>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  const wallet = walletStore.activeWallet;

  return (
    <div className="nex-wallet_connect">
      {!wallet ? (
        <IgntButton
          type="primary"
          onClick={() => setState(prev => ({ 
            ...prev, 
            showModal: true, 
            modalPage: "connect" 
          }))}
        >
          Connect Nex Wallet
        </IgntButton>
      ) : (
        <div className="wallet-info bg-white rounded-lg border p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center text-white font-bold">
                N
              </div>
              <div>
                <div className="font-medium text-gray-900">{wallet.name || 'Nex Wallet'}</div>
                <div className="text-sm text-gray-500">
                  {wallet.accounts[0]?.address.slice(0, 12)}...
                  {wallet.accounts[0]?.address.slice(-8)}
                </div>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <div className="text-right">
                <div className="text-xs text-gray-500">Viet Chain</div>
                <div className="text-sm font-medium text-green-600">Connected</div>
              </div>
              <IgntButton
                type="secondary"
                size="small"
                onClick={() => {
                  setState(prev => ({ ...prev, showModal: false }));
                  
                }}
              >
                Disconnect
              </IgntButton>
            </div>
          </div>
        </div>
      )}

      <IgntModal
        visible={state.showModal}
        closeIcon={true}
        cancelButton={false}
        submitButton={false}
        className="nex-wallet-modal"
        close={() => setState(prev => ({ 
          ...prev, 
          showModal: false, 
          modalPage: "connect",
          errorMessage: ""
        }))}
        submit={() => null}
        header=""
        body={renderModalContent()}
        footer=""
      />

      {state.showCreateWallet && (
        <CreateWallet
          onClose={handleCloseCreateWallet}
          onWalletCreated={handleWalletCreated}
        />
      )}

      {state.showImportWallet && (
        <ImportWallet
          onClose={handleCloseImportWallet}
          onWalletImported={handleWalletImported}
        />
      )}
    </div>
  );
}