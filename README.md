# Crypto Address Finder

A TypeScript-based tool to search for specific cryptocurrency addresses (Ethereum and Bitcoin) derived from a given mnemonic phrase using BIP-32/39/44 standards.

## Overview

This tool helps you find the derivation path for specific cryptocurrency addresses by searching through a range of possible paths derived from a given mnemonic phrase. It supports:
- Ethereum addresses
- Bitcoin Native SegWit (Bech32) addresses
- Bitcoin Legacy addresses

## Prerequisites

- Node.js (v14 or higher)
- npm or yarn

## Setup

1. Clone the repository
2. Install dependencies:
```bash
npm install
```

3. Create a `.env` file with the following variables:
```
MNEMONIC_PHRASE=your 12 or 24 word mnemonic phrase
ETH_TARGET=target ethereum address
SEGWIT_BTC_TARGET=target bitcoin segwit address
LEGACY_BTC_TARGET=target bitcoin legacy address
SEARCH_LIMIT=desired seach limit, by default it's 1000
MAX_ACCOUNT=5
MAX_CHANGE=2
```

## Usage

Run the script:
```bash
npm start
```

## Technical Details

### Derivation Paths Used

1. **Ethereum**:
   - Base path: `m/44'/60'/0'/0/`
   - Follows BIP-44 standard for Ethereum
   - Searches through indices 0 to SEARCH_LIMIT

2. **Bitcoin Native SegWit**:
   - Base path: `m/84'/0'/{account}'/{change}/{index}`
   - Purpose: 84 (BIP-84)
   - Searches through:
     - Accounts: 0 to MAX_ACCOUNT
     - Change: 0 to MAX_CHANGE
     - Indices: 0 to SEARCH_LIMIT

3. **Bitcoin Legacy**:
   - Base path: `m/44'/0'/{account}'/{change}/{index}`
   - Purpose: 44 (BIP-44)
   - Searches through:
     - Accounts: 0 to MAX_ACCOUNT
     - Change: 0 to MAX_CHANGE
     - Indices: 0 to SEARCH_LIMIT

## Dependencies

- bip39: For mnemonic phrase handling
- bip32: For hierarchical deterministic wallet generation
- ethers: For Ethereum address generation
- bitcoinjs-lib: For Bitcoin address generation

## Notes

- The script uses environment variables for configuration
- Search limits can be adjusted in the .env file
- Addresses are case-insensitive for matching
- Progress is logged every 100 addresses checked 