const apiURL = import.meta.env.VITE_API_COSMOS ?? "http://localhost:1317";
const rpcURL = import.meta.env.VITE_WS_TENDERMINT ?? "http://localhost:26657";
const prefix = import.meta.env.VITE_ADDRESS_PREFIX ?? "cosmos";
const TOKEN_ID = "";
const TOKEN_KEY = "";
const ACCESS_TOKEN = "";
export const env = {
  apiURL,
  rpcURL,
  prefix,
  TOKEN_ID,
  TOKEN_KEY,
  ACCESS_TOKEN,
};
