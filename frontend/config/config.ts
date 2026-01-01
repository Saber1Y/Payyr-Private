import { createConfig, http } from "wagmi";
import { mainnet, sepolia } from "wagmi/chains";
import { defineChain } from "viem";

const arcTestnet = defineChain({
  id: 5042002,
  name: "Arc Testnet",
  nativeCurrency: {
    name: "USDC",
    symbol: "USDC",
    decimals: 18,
  },
  rpcUrls: {
    default: { http: ["https://rpc.testnet.arc.network"] },
  },
  blockExplorers: {
    default: { name: "Arcscan", url: "https://testnet.arcscan.app" },
  },
});

export const config = createConfig({
  chains: [mainnet, sepolia, arcTestnet],

  transports: {
    [mainnet.id]: http(),
    [sepolia.id]: http(),
    [arcTestnet.id]: http(),
  },
});
