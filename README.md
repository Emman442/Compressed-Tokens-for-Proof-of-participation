# 🎟️ VaultDrop — Scalable Event Participation via Compressed Tokens & QR

VaultDrop is a Solana-based app that allows creators to mint compressed tokens (cTokens) for events and distribute them seamlessly to attendees via QR codes. Designed for scalability and simplicity, it uses Light Protocol, Solana Pay, and ZK Compression to drastically reduce on-chain state costs while preserving performance and security.

## Features

-  Creators mint compressed tokens for their events
-  A vault is created per event to securely hold the tokens
-  A Solana Pay QR Code is generated for attendees to scan
-  Each scan transfers 1 cToken from the event vault to the user's wallet
-  Built with privacy, scalability, and composability in mind
- Prevents a user from claiming a token more than once

## 🛠️ Tech Stack

-  **Light Protocol** — for ZK compression and compressed tokens
-  **Solana Pay** — QR-based wallet interaction
-  **Next.js + TypeScript** — frontend framework
-  **Node.js** — backend logic
-  **MongoDB** — event + user metadata storage

## 📸 Screenshots

You can replace these placeholders with actual screenshots.

### Event Creation & Token Minting UI
![Event Creation](screenshots/event-creation.png)

### Vault Overview & QR Code Generation
![Vault & QR Code](screenshots/vault-qrcode.png)

### Mobile Wallet Scan & Token Receipt Flow
![User Scan](screenshots/user-scan.png)

## ⚙️ How It Works

1. Creators initiate an event → compressed tokens are minted.
2. A vault is created and tokens are transferred into it.
3. A Solana Pay QR code is generated for users.
4. Users scan the QR → token is transferred from vault to their wallet.
5. The system updates records to prevent double claims.