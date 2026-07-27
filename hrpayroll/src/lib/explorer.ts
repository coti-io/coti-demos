import { AVAX_CHAIN_ID, COTI_TESTNET_CHAIN_ID } from '../config/contracts'

// Explorers for the two chains a payroll run touches. Campaign creation alternates
// between them (Fuji factory/facade, COTI roster), so a tx hash is only meaningful
// together with the chain it was sent on — see docs/createCampaignTransactions.md.
const EXPLORERS: Record<number, { name: string; baseUrl: string }> = {
  [AVAX_CHAIN_ID]: { name: 'Snowtrace', baseUrl: 'https://testnet.snowtrace.io' },
  [COTI_TESTNET_CHAIN_ID]: { name: 'Cotiscan', baseUrl: 'https://testnet.cotiscan.io' },
}

/** Explorer display name for a chain, or undefined if we don't know that chain. */
export function explorerName(chainId: number): string | undefined {
  return EXPLORERS[chainId]?.name
}

export function explorerTxUrl(chainId: number, hash: string): string | undefined {
  const explorer = EXPLORERS[chainId]
  return explorer && `${explorer.baseUrl}/tx/${hash}`
}

export function explorerAddressUrl(chainId: number, address: string): string | undefined {
  const explorer = EXPLORERS[chainId]
  return explorer && `${explorer.baseUrl}/address/${address}`
}

/** `0x1234…cdef` — for tx hashes, which shortAddr's 6/4 split renders too tersely. */
export function shortHash(hash: string): string {
  return `${hash.slice(0, 10)}…${hash.slice(-6)}`
}
