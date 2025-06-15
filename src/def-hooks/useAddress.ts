import { useState } from "react";
import { useClient } from "../hooks/useClient";

export const useAddress = () => {
  const client = useClient();
  const [address, setAddress] = useState("");

  if (client.client && typeof client.client.on === 'function') {
    client.client.on("accountChange", (newAddress: string) => {
      setAddress(newAddress);
    });
  }

  return {
    address,
    setAddress,
  };
};
