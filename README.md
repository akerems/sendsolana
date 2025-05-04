# Solana Send dApp

A minimalist and user-friendly dApp for sending SOL tokens on the Solana blockchain. Built with Next.js, TypeScript, and Tailwind CSS.

## Features

- 🌙 Dark/Light mode support
- 💳 Multiple wallet support (Phantom, Solflare)
- 🔄 Auto-connect wallet functionality
- 💰 Real-time SOL balance display
- ⚡ Fast transaction processing
- 🔒 Secure transaction signing
- 📱 Responsive design
- 🎨 Modern UI with Tailwind CSS

## Getting Started

### Prerequisites

- Node.js (v16 or higher)
- npm or pnpm
- Phantom or Solflare wallet browser extension

### Installation

1. Clone the repository:
```bash
git clone https://github.com/yourusername/solana-dapp.git
cd solana-dapp
```

2. Install dependencies:
```bash
npm install
# or
npm install
```

3. Start the development server:
```bash
npm run dev


4. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Usage

1. Connect your Solana wallet using the "Connect Wallet" button
2. Enter the recipient's Solana address
3. Enter the amount of SOL to send
4. Click "Send SOL" to initiate the transaction
5. Confirm the transaction in your wallet

## Technical Details

### Built With

- [Next.js](https://nextjs.org/) - React framework
- [TypeScript](https://www.typescriptlang.org/) - Type safety
- [Tailwind CSS](https://tailwindcss.com/) - Styling
- [@solana/web3.js](https://solana-labs.github.io/solana-web3.js/) - Solana web3 functionality
- [@solana/wallet-adapter](https://github.com/solana-labs/wallet-adapter) - Wallet integration

### Key Features Implementation

- **Auto-connect**: Automatically reconnects to previously connected wallets
- **Balance Updates**: Real-time balance updates with configurable refresh intervals
- **Transaction Handling**: Proper error handling and transaction confirmation
- **Network Detection**: Automatic network detection (Mainnet/Devnet/Testnet)
- **Responsive Design**: Mobile-first approach with full responsiveness

## Security Features

- Input validation for Solana addresses
- Transaction confirmation verification
- Proper error handling and user feedback
- Secure wallet connection management

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Acknowledgments

- Solana Labs for their excellent documentation and tools
- The Phantom and Solflare teams for their wallet implementations
- The Next.js and Tailwind CSS communities

## Contact

Created by [@akerems](https://github.com/akerems) 
