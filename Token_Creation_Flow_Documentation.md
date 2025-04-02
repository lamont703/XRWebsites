# 🪙 Token Creator App: Full Token Creation Flow Documentation

This document details the complete lifecycle for creating a custom SPL token using the Token Creator App — from user interface to Solana blockchain operations to backend persistence.

---

## 📐 Overview of the Token Creation Pipeline

```
UI Form → createTokenMint → createTokenMetadata
       → uploadMetadata → Arweave
       → createAssociatedTokenAccount
       → mintTokens
       → POST /tokens → Backend Database
```

---

## 🧑‍💻 Frontend Flow

### `TokenCreator.tsx`

Core component handling the full user interaction flow:

- Displays wallet connect prompt or `TokenForm`
- Collects token data
- On submit, triggers the following in order:
  1. `createTokenMint`
  2. `createTokenMetadata`
  3. `createAssociatedTokenAccount`
  4. `mintTokens`
  5. Sends token to backend (`POST /tokens`)

Also handles:

- Confirmation and success modals
- Explorer view and dashboard navigation

---

## 🔨 Mint Account Creation

### `mint.ts → createTokenMint()`

1. Generates new mint keypair
2. Calculates rent-exempt balance
3. Builds and simulates transaction with:
   - CreateAccount instruction
   - InitializeMint instruction
   - Compute budget increase
4. Signs and sends transaction
5. Confirms and verifies mint initialization

Returns:

```ts
{
  mintKeypair, mintAccount;
}
```

---

## 🎨 Metadata Upload & On-Chain Attachment

### `metadata.ts → createTokenMetadata()`

- If URI is provided: creates metadata via Metaplex
- If not: calls `uploadMetadata()` to upload JSON to backend

### `uploadMetadata.ts`

- Sends `metadataJson` and `network` to:
  ```http
  POST /metadata/upload
  ```

---

## 🛰️ Metadata Upload to Arweave

### `metadata.controller.js → uploadMetadata()`

- Validates input
- Uploads metadata to Arweave using `uploadToArweave()`
- Returns Arweave URI

### `arweaveUploader.js → uploadToArweave()`

- **Devnet**: returns mock URI
- **Mainnet**:
  - Uses UMI + Bundlr with wallet key
  - Uploads JSON to Arweave
  - Returns permanent URI

---

## 👜 Associated Token Account Creation

### `account.ts → createAssociatedTokenAccount()`

- Derives ATA using mint + wallet
- Checks for existing account
- If missing:
  - Simulates transaction
  - Signs and sends
  - Confirms creation
- Verifies ATA properties (mint + owner)

---

## 🪙 Minting Tokens

### `mint.ts → mintTokens()`

- Verifies mint authority
- Builds mint-to instruction
- Simulates, signs, and sends transaction
- Confirms mint transaction using `confirmTransaction()`

---

## ✅ Transaction Confirmation Utility

### `confirm.ts → confirmTransaction()`

- Retries up to 5 times with exponential backoff
- Verifies signature status
- Returns `true` or `false`

---

## 🗃️ Backend Token Persistence

### `token.controller.js → createToken()`

Triggered by:

```http
POST /tokens
```

1. Validates payload
2. Checks for duplicate mint
3. Saves to database with:
   ```json
   {
     mint, name, symbol, totalSupply, owner, features, metadata
   }
   ```

Also supports:

- `GET /tokens` → fetch all tokens
- `GET /tokens/:mint` → fetch single token
- `PUT /tokens/:mint` → update token
- `DELETE /tokens/:mint` → soft delete

---

## ✅ End-to-End Token Flow Recap

```plaintext
[User Input]
     ↓
[TokenCreator.tsx]
     ↓
createTokenMint → createTokenMetadata → createAssociatedTokenAccount → mintTokens
     ↓
uploadMetadata.ts (POST /metadata/upload)
     ↓
metadata.controller.js → arweaveUploader.js
     ↓
✔ Token fully minted and uploaded to Arweave
     ↓
POST /tokens (createToken)
     ↓
token.controller.js → TokenModel
     ↓
✔ Token saved to backend → available on dashboard
```

---

## 🎉 You’re All Set

This documentation captures every step your app performs to create, register, and persist custom tokens on Solana.

Use this as a living developer doc or README!
