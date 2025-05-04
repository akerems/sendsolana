import { WalletAdapterNetwork } from "@solana/wallet-adapter-base"

// Define the network
export const network = WalletAdapterNetwork.Mainnet

// Get RPC endpoint from environment variables or use fallbacks
export const getRpcEndpoint = (): string => {
  // First, try to use the environment variable
  if (process.env.NEXT_PUBLIC_SOLANA_RPC_URL) {
    return process.env.NEXT_PUBLIC_SOLANA_RPC_URL
  }

  // Fallback to public endpoints if no environment variable is set
  const publicEndpoints = [
    "https://solana-mainnet.rpc.extrnode.com",
    "https://api.mainnet-beta.solana.com",
    "https://solana-api.projectserum.com",
  ]

  // Return the first public endpoint as a fallback
  return publicEndpoints[0]
}

// Connection config with higher commitment level and timeouts
export const connectionConfig = {
  commitment: "confirmed",
  confirmTransactionInitialTimeout: 60000, // 1 minute
  disableRetryOnRateLimit: false,
  httpHeaders: {
    "Content-Type": "application/json",
  },
}
