export const BLOCKCHAIN_CONFIG = {
  chainId: "vietchain", 
  chainName: "VietChain",
  rpcEndpoint: "http://localhost:26657",
  restEndpoint: "http://localhost:1317",
  addressPrefix: "cosmos", 
  currency: {
    coinDenom: "STAKE", 
    coinMinimalDenom: "stake",
    coinDecimals: 6,
  },
  gasPrices: {
    stake: 0.025, 
  },
  gasPrice: "0.025stake", 
  walletName: "Nex Wallet",
  explorerUrl: "http://localhost:1317",

  faucetEndpoint: "http://localhost:4500",
  faucetAmount: "1000000", 
};