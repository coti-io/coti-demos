import type { Hex } from 'viem'

/**
 * An error tied to a specific on-chain transaction.
 *
 * The hash and chain are carried as *data* rather than interpolated into the message, so the
 * UI can render a real explorer link. Previously these read `"… reverted on-chain (tx 0x70f2…)"`,
 * which left the user holding a bare hash they had to paste into an explorer by hand — and with
 * no chain attached, a COTI hash was indistinguishable from a Fuji one.
 */
export class ChainTxError extends Error {
  readonly txHash: Hex
  readonly chainId: number

  constructor(message: string, { txHash, chainId }: { txHash: Hex; chainId: number }) {
    super(message)
    this.name = 'ChainTxError'
    this.txHash = txHash
    this.chainId = chainId
  }
}

/** Transaction details to link to, or undefined for errors that aren't tied to a tx. */
export function txErrorDetails(error: unknown): { txHash: Hex; chainId: number } | undefined {
  return error instanceof ChainTxError ? { txHash: error.txHash, chainId: error.chainId } : undefined
}

/** Minimal slice of a viem public client — keeps this helper independent of the client type. */
type GasLimitReader = {
  getTransaction: (args: { hash: Hex }) => Promise<{ gas: bigint }>
}

/**
 * Best-effort suffix explaining *why* a transaction reverted, for the case the receipt can
 * actually tell us: one that burned essentially its whole gas limit ran out of gas rather than
 * failing a `require`.
 *
 * Worth calling out specifically because PoD's inbox path branches on `gasleft()`, so
 * `eth_estimateGas` can return a figure that succeeds under `eth_call` but not in a real block
 * — a wallet that sends the estimate with no buffer then reverts having consumed ~99% of it,
 * emitting no logs and no revert string (observed live 2026-07-29 on a pToken fund transfer:
 * 673,491 used of a 683,760 limit).
 *
 * Diagnostics only — never throws, and returns '' when it has nothing useful to add.
 */
export async function outOfGasHint(client: GasLimitReader, hash: Hex, gasUsed: bigint): Promise<string> {
  try {
    const { gas } = await client.getTransaction({ hash })
    if (gas <= 0n || (gasUsed * 100n) / gas < 95n) return ''
    const pct = Number((gasUsed * 1000n) / gas) / 10
    return (
      ` It used ${gasUsed.toLocaleString()} of its ${gas.toLocaleString()} gas limit (${pct}%) and emitted no events,` +
      ' which means it ran out of gas rather than failing a check — the wallet’s gas estimate was too tight.'
    )
  } catch {
    return ''
  }
}
