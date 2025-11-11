# Migration Notes: Server-Side to Client-Side Architecture

## Overview

The Age Guessing Game app has been refactored from a server-side architecture (Express.js backend) to a standalone React application with client-side MPC operations. This brings it in line with the example voting app architecture.

## What Changed

### Files Added

1. **`.env.example`** - Updated with new environment variables
   - Added `VITE_CONTRACT_ADDRESS` for contract address
   - Added `VITE_ADMIN_PK` and `VITE_ADMIN_AES_KEY` for admin wallet
   - Added `VITE_PLAYER_PK` and `VITE_PLAYER_AES_KEY` for player wallet
   - Removed server-specific variables

2. **`src/hooks/useAgeContract.js`** - New custom React hook
   - Manages Coti wallets for admin and player
   - Handles all contract interactions client-side
   - Includes retry logic for transient RPC errors
   - Encrypts/decrypts values using Coti-Ethers SDK
   - Calculates age from birth date in the browser

### Files Modified

1. **`package.json`**
   - Removed dependencies: `express`, `cors`, `concurrently`
   - Removed scripts: `server`, `dev:full`
   - Kept all React and blockchain dependencies

2. **`vite.config.js`**
   - Added path alias for `@/` → `./src`
   - Added `path` import for alias resolution

3. **`src/pages/Player1Page.jsx`**
   - Replaced `ApiService` with `useAgeContract` hook
   - Updated to use `storeAge` function directly
   - Changed "Server-side encryption" to "Client-side encryption"
   - Updated contract address display to use environment variable

4. **`src/pages/Player2Page.jsx`**
   - Replaced `ApiService` with `useAgeContract` hook
   - Updated to use `compareAge` and `checkAgeStatus` functions
   - Changed "Server-side encryption" to "Client-side encryption"
   - Updated contract address display to use environment variable

5. **`README.md`**
   - Updated architecture diagram to show client-side operations
   - Removed backend server documentation
   - Updated installation and setup instructions
   - Added migration notes section
   - Updated troubleshooting guide

### Files to Remove (Optional Cleanup)

The following files are no longer needed and can be safely removed:

1. **`src/apiService.js`** - Replaced by `useAgeContract` hook
2. **`src/cotiUtils.js`** - Functionality moved to hook
3. **`server/index.js`** - Backend server no longer needed
4. **`server/DateGameABI.json`** - Backend ABI no longer needed
5. **`src/DateGameABI.json`** - No longer directly used (ethers handles ABI)

## Architecture Changes

### Before (Server-Side)

```
Client (React) → API Service → Express Server → Coti SDK → Smart Contract
```

- Frontend called REST API endpoints
- Backend handled all MPC encryption/decryption
- Backend managed wallet and AES keys
- Required running two processes (frontend + backend)

### After (Client-Side)

```
Client (React) → useAgeContract Hook → Coti SDK → Smart Contract
```

- Frontend directly interacts with smart contract
- Browser handles all MPC encryption/decryption
- Wallets managed in React hook with environment variables
- Single process (frontend only)

## Benefits

1. **Simpler Deployment**
   - No backend server to maintain
   - Can deploy to static hosting (Vercel, Netlify, GitHub Pages)
   - Reduced infrastructure costs

2. **Better Performance**
   - Eliminates API roundtrip latency
   - Direct blockchain communication
   - Fewer points of failure

3. **Easier Development**
   - Single codebase to maintain
   - No need to run multiple processes
   - Clearer separation of concerns

4. **Consistent Architecture**
   - Matches the example voting app pattern
   - Uses standard React patterns (hooks)
   - Better code organization

## Migration Steps for Users

If you're updating from the old version:

1. **Pull the latest code**
   ```bash
   git pull origin main
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env
   ```
   
   Edit `.env` and add your wallet credentials:
   - `VITE_CONTRACT_ADDRESS`
   - `VITE_ADMIN_PK` and `VITE_ADMIN_AES_KEY`
   - `VITE_PLAYER_PK` and `VITE_PLAYER_AES_KEY`

4. **Remove old dependencies** (optional)
   ```bash
   rm -rf node_modules
   npm install
   ```

5. **Start the app**
   ```bash
   npm run dev
   ```

6. **Clean up old files** (optional)
   ```bash
   rm -rf server
   rm src/apiService.js
   rm src/cotiUtils.js
   rm src/DateGameABI.json
   ```

## Environment Variables

### Old (Server-Side)

```bash
DEPLOYER_PRIVATE_KEY=...
AES_KEY=...
VITE_APP_NODE_HTTPS_ADDRESS=...
```

### New (Client-Side)

```bash
VITE_APP_NODE_HTTPS_ADDRESS=...
VITE_CONTRACT_ADDRESS=...
VITE_ADMIN_PK=...
VITE_ADMIN_AES_KEY=...
VITE_PLAYER_PK=...
VITE_PLAYER_AES_KEY=...
DEPLOYER_PRIVATE_KEY=...  # Still needed for hardhat deployment
```

## Security Considerations

### Before

- Private keys stored on server
- API endpoints exposed on port 3002
- Server must be secured and maintained

### After

- Private keys in environment variables (browser only)
- No exposed API endpoints
- Keys never committed to version control
- Uses Vite's environment variable system (VITE_ prefix)

⚠️ **Important**: For production apps:
- Use secure key management (hardware wallets, secure enclaves)
- Never commit `.env` files
- Consider additional authentication layers
- Implement proper error handling

## Testing

To verify the migration works:

1. **Admin Flow**
   - Navigate to `/admin`
   - Select a birth date
   - Click "Store Birth Date"
   - Verify transaction succeeds and shows encrypted ciphertext

2. **Player Flow**
   - Navigate to `/player`
   - Enter an age guess
   - Click "OLDER?" or "YOUNGER?"
   - Verify encrypted comparison succeeds and shows YES/NO result

3. **Check Browser Console**
   - Should see Coti wallet initialization logs
   - Should see encryption/decryption logs
   - No API errors (no more fetch to localhost:3002)

## Support

If you encounter issues:

1. Check that all environment variables are set correctly
2. Verify wallets have sufficient test ETH
3. Review browser console for errors
4. Compare your setup with the example voting app
5. Open an issue on GitHub if problems persist

---

Last updated: November 10, 2025
