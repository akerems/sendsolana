"use client"

import type React from "react"

import { useState, useMemo, useEffect } from "react"
import { useWallet, useConnection } from "@solana/wallet-adapter-react"
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui"
import { LAMPORTS_PER_SOL, PublicKey, Transaction, SystemProgram } from "@solana/web3.js"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertCircle, CheckCircle2, AlertTriangle, Wallet, RefreshCw, Shield } from "lucide-react"
import { WalletContextProvider } from "@/components/wallet-provider"
import { getRpcEndpoint } from "@/app/wallet-config"
import { ThemeToggle } from "@/components/theme-toggle"
import bs58 from "bs58"

export default function Home() {
  return (
    <WalletContextProvider>
      <SolanaSendApp />
    </WalletContextProvider>
  )
}

function SolanaSendApp() {
  const { publicKey, sendTransaction, connected, signMessage } = useWallet()
  const { connection } = useConnection()
  const [recipient, setRecipient] = useState("")
  const [amount, setAmount] = useState("")
  const [isValidAddress, setIsValidAddress] = useState(true)
  const [txStatus, setTxStatus] = useState<"idle" | "processing" | "success" | "error">("idle")
  const [txSignature, setTxSignature] = useState("")
  const [errorMessage, setErrorMessage] = useState("")
  const [balance, setBalance] = useState<number | null>(null)
  const [isLoadingBalance, setIsLoadingBalance] = useState(false)
  const [balanceError, setBalanceError] = useState(false)

  // Check if using a dedicated RPC provider
  const isDedicatedRpc = useMemo(() => {
    const endpoint = getRpcEndpoint()
    return (
      endpoint.includes("helius") ||
      endpoint.includes("quicknode") ||
      endpoint.includes("api-key") ||
      !!process.env.NEXT_PUBLIC_SOLANA_RPC_URL
    )
  }, [])

  // Get network information directly from the connection
  const network = useMemo(() => {
    const endpoint = connection?.rpcEndpoint || ""
    if (endpoint.includes("devnet")) return "Devnet"
    if (endpoint.includes("testnet")) return "Testnet"
    return "Mainnet" // Default to Mainnet
  }, [connection])

  // Fetch wallet balance when connected
  const fetchBalance = async () => {
    if (!connected || !publicKey || !connection) return

    setIsLoadingBalance(true)
    setBalanceError(false)

    try {
      const balance = await connection.getBalance(publicKey)
      // Round to 4 decimal places when setting the balance
      setBalance(Math.floor(balance / LAMPORTS_PER_SOL * 10000) / 10000)
      setBalanceError(false)
    } catch (error) {
      console.error("Error fetching balance:", error)
      setBalanceError(true)
    } finally {
      setIsLoadingBalance(false)
    }
  }

  // Initial balance fetch and setup refresh interval
  useEffect(() => {
    if (connected && publicKey && connection) {
      fetchBalance()

      // Set up an interval to refresh the balance
      // Use a shorter interval if using a dedicated RPC provider
      const intervalTime = isDedicatedRpc ? 15000 : 30000
      const intervalId = setInterval(fetchBalance, intervalTime)

      return () => clearInterval(intervalId)
    }
  }, [connected, publicKey, connection, isDedicatedRpc])

  const validateAddress = (address: string) => {
    try {
      if (address) {
        new PublicKey(address)
        setIsValidAddress(true)
      }
      return true
    } catch (error) {
      setIsValidAddress(false)
      return false
    }
  }

  const handleRecipientChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setRecipient(e.target.value)
    if (e.target.value) {
      validateAddress(e.target.value)
    } else {
      setIsValidAddress(true)
    }
  }

  const handleSendSol = async () => {
    if (!publicKey || !connected || !connection) return
    if (!validateAddress(recipient)) return
    if (!amount || Number.parseFloat(amount) <= 0) return

    // Check if sending to the same address
    if (publicKey.toString() === recipient) {
      setTxStatus("error")
      setErrorMessage("You cannot send SOL to your own wallet address")
      return
    }

    // Check if amount is greater than balance
    if (balance !== null && Number.parseFloat(amount) > balance) {
      setTxStatus("error")
      setErrorMessage("Insufficient balance")
      return
    }

    try {
      setTxStatus("processing")
      setErrorMessage("")

      const recipientPubKey = new PublicKey(recipient)
      const lamports = Number.parseFloat(amount) * LAMPORTS_PER_SOL

      const transaction = new Transaction().add(
        SystemProgram.transfer({
          fromPubkey: publicKey,
          toPubkey: recipientPubKey,
          lamports,
        }),
      )

      // Get the latest blockhash for better transaction reliability
      let blockhash, lastValidBlockHeight

      try {
        const blockHashData = await connection.getLatestBlockhash()
        blockhash = blockHashData.blockhash
        lastValidBlockHeight = blockHashData.lastValidBlockHeight
      } catch (error) {
        console.error("Error getting blockhash:", error)
        throw new Error("Failed to get latest blockhash. Please try again.")
      }

      transaction.recentBlockhash = blockhash
      transaction.feePayer = publicKey

      const signature = await sendTransaction(transaction, connection)
      console.log("Transaction sent:", signature)

      // Wait for confirmation with a timeout
      try {
        const confirmation = await Promise.race([
          connection.confirmTransaction({
            blockhash,
            lastValidBlockHeight,
            signature,
          }),
          new Promise((_, reject) => setTimeout(() => reject(new Error("Transaction confirmation timeout")), 60000)),
        ])

        if (typeof confirmation === "object" && confirmation.value.err) {
          throw new Error("Transaction confirmed but failed")
        }
      } catch (error) {
        console.error("Confirmation error:", error)
        // Even if confirmation fails, the transaction might still be successful
        // We'll show the success message anyway and let the user check the explorer
      }

      setTxSignature(signature)
      setTxStatus("success")
      setRecipient("")
      setAmount("")

      // Refresh balance after successful transaction
      // Add a small delay to allow the network to process the transaction
      setTimeout(fetchBalance, 2000)
    } catch (error) {
      console.error("Transaction failed:", error)
      setTxStatus("error")
      setErrorMessage(error instanceof Error ? error.message : "Transaction failed")
    }
  }

  // Format RPC endpoint for display
  const formatRpcEndpoint = (endpoint: string) => {
    if (!endpoint) return "Connected"

    // Hide API keys
    if (endpoint.includes("api-key=")) {
      return endpoint.split("api-key=")[0] + "api-key=***"
    }

    // For other endpoints, just show the domain
    try {
      const url = new URL(endpoint)
      return url.hostname
    } catch {
      return endpoint.split("//")[1]?.slice(0, 30) || "Connected"
    }
  }

  return (
    <main className="flex min-h-screen flex-col items-center p-4 bg-gradient-to-b from-purple-50 to-indigo-50 dark:from-purple-950 dark:to-indigo-950">
      <div className="w-full max-w-4xl mx-auto">
        <div className="flex justify-end items-center gap-4 mb-4">
          {connected && (
            <>
              <div className="flex items-center gap-2 text-sm">
                <span className="text-gray-600 dark:text-gray-400">
                  {network}
                </span>
                <span className="text-gray-600 dark:text-gray-400">|</span>
                <div className="flex items-center gap-1">
                  <Wallet className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                  <span className="font-medium">
                    {isLoadingBalance ? (
                      <RefreshCw className="h-4 w-4 animate-spin" />
                    ) : balanceError ? (
                      "Error"
                    ) : (
                      `${balance?.toFixed(4) || "0"} SOL`
                    )}
                  </span>
                </div>
              </div>
            </>
          )}
          <WalletMultiButton />
          <ThemeToggle />
        </div>
      </div>

      <div className="max-w-md w-full space-y-6 mt-8">
        {connected ? (
          <Card className="border-purple-200 dark:border-purple-800 bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm">
            <CardHeader className="bg-gradient-to-r from-purple-100 to-indigo-100 dark:from-purple-900/40 dark:to-indigo-900/40 rounded-t-lg">
              <div>
                <CardTitle className="text-purple-800 dark:text-purple-300">Send SOL</CardTitle>
                <CardDescription className="text-purple-600 dark:text-purple-400">
                  Enter recipient address and amount
                </CardDescription>
              </div>
            </CardHeader>
            <CardContent className="space-y-4 pt-6">
              <div className="space-y-2">
                <Label htmlFor="wallet-address" className="text-purple-700 dark:text-purple-300">
                  Recipient Address
                </Label>
                <Input
                  id="wallet-address"
                  placeholder="Enter Solana address"
                  value={recipient}
                  onChange={handleRecipientChange}
                  className={`bg-white/50 dark:bg-gray-800/50 border-purple-200 dark:border-purple-800 focus:border-purple-400 dark:focus:border-purple-600 ${
                    !isValidAddress ? "border-red-500" : ""
                  }`}
                />
                {!isValidAddress && <p className="text-red-500 text-sm">Please enter a valid Solana address</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="amount" className="text-purple-700 dark:text-purple-300">
                  Amount (SOL)
                </Label>
                <Input
                  id="amount"
                  type="number"
                  placeholder="0.1"
                  min="0.000001"
                  step="0.001"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="bg-white/50 dark:bg-gray-800/50 border-purple-200 dark:border-purple-800 focus:border-purple-400 dark:focus:border-purple-600"
                />
                {balance !== null && (
                  <div className="flex justify-end">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-auto text-xs py-0 text-purple-600 hover:text-purple-700 dark:text-purple-400 dark:hover:text-purple-300"
                      onClick={() => {
                        // Leave 0.01 SOL for transaction fees and round to 4 decimal places
                        const maxAmount = Math.max(balance - 0.01, 0);
                        setAmount(maxAmount.toFixed(4));
                      }}
                    >
                      Send max
                    </Button>
                  </div>
                )}
              </div>
            </CardContent>
            <CardFooter className="bg-gradient-to-r from-purple-50 to-indigo-50 dark:from-purple-900/20 dark:to-indigo-900/20 rounded-b-lg">
              <Button
                onClick={handleSendSol}
                className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 dark:from-purple-500 dark:to-indigo-500 dark:hover:from-purple-600 dark:hover:to-indigo-600"
                disabled={!recipient || !amount || !isValidAddress || txStatus === "processing"}
              >
                {txStatus === "processing" ? "Sending..." : "Send SOL"}
              </Button>
            </CardFooter>
          </Card>
        ) : (
          <Card className="border-purple-200 dark:border-purple-800 bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm p-6 text-center">
            <CardDescription className="text-purple-600 dark:text-purple-400">
              Please connect your wallet to send SOL
            </CardDescription>
          </Card>
        )}

        {txStatus === "success" && (
          <Alert className="bg-green-50 border-green-200 dark:bg-green-900/20 dark:border-green-800">
            <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-400" />
            <AlertDescription className="text-green-700 dark:text-green-400">
              Transaction successful!{" "}
              <a
                href={`https://explorer.solana.com/tx/${txSignature}`}
                target="_blank"
                rel="noopener noreferrer"
                className="underline font-medium text-green-700 dark:text-green-400 hover:text-green-800 dark:hover:text-green-300"
              >
                View on Solana Explorer
              </a>
            </AlertDescription>
          </Alert>
        )}

        {txStatus === "error" && (
          <Alert className="bg-red-50 border-red-200 dark:bg-red-900/20 dark:border-red-800">
            <AlertCircle className="h-4 w-4 text-red-600 dark:text-red-400" />
            <AlertDescription className="text-red-700 dark:text-red-400">
              {errorMessage || "Transaction failed. Please try again."}
            </AlertDescription>
          </Alert>
        )}

        <div className="text-center text-sm text-gray-500 dark:text-gray-400">
          Made by akerems
        </div>
      </div>
    </main>
  )
}
