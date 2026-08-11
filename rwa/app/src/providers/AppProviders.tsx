import { useEffect, useState, type ReactNode } from 'react';
import {
  WagmiRainbowKitProvider,
  PrivacyBridgeProvider,
  configureCotiPlugin,
  cotiTestnet,
} from '@coti-io/coti-wallet-plugin';
import '@rainbow-me/rainbowkit/styles.css';
import { COTI_TESTNET } from '../lib/contracts';

/** Must run once, in the browser, before any wallet-plugin hook mounts. */
let configured = false;
function ensureConfigured() {
  if (configured) return;
  configured = true;
  configureCotiPlugin({
    // The plugin requires a WalletConnect project id even to initialise. Injected wallets
    // work without a real one; WalletConnect flows do not.
    walletConnectProjectId:
      import.meta.env.VITE_WALLETCONNECT_PROJECT_ID || '00000000000000000000000000000000',
    debug: import.meta.env.DEV,
    defaultNetworkId: String(COTI_TESTNET.chainId),
  });
}

/**
 * wagmi + RainbowKit + COTI privacy bridge.
 *
 * Client-only: the plugin and the injected provider both touch browser globals at module
 * scope, so the tree is withheld until the first effect has run.
 */
export function AppProviders({ children }: { children: ReactNode }) {
  const [ready, setReady] = useState(false);
  useEffect(() => { ensureConfigured(); setReady(true); }, []);
  if (!ready) return null;

  return (
    <WagmiRainbowKitProvider
      appName="COTI RWA"
      initialChain={cotiTestnet}
      useEip6963MetaMask
      walletConnectProjectId={
        import.meta.env.VITE_WALLETCONNECT_PROJECT_ID || '00000000000000000000000000000000'
      }
    >
      <PrivacyBridgeProvider>{children}</PrivacyBridgeProvider>
    </WagmiRainbowKitProvider>
  );
}
