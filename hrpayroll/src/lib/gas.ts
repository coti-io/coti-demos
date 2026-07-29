// Gas headroom for writes that cross the PoD inbox.
//
// `eth_estimateGas` binary-searches for the smallest limit that succeeds under `eth_call`, but
// the inbox path branches on `gasleft()` and forwards 63/64 of it to an inner call. That makes
// the estimate a *lower bound* that a real block can fall under: the inner call gets starved,
// reverts, and the outer frame reverts with no reason string — leaving ~1/64 of the limit
// unspent, so the receipt doesn't even look like a plain out-of-gas.
//
// Observed live 2026-07-29 on a pToken fund transfer (tx 0x70f2…0015e): `eth_estimateGas`
// returned 683,760, the wallet sent exactly that, and execution needed 683,984 — short by 224
// gas, or 0.03%. The margin is that thin, so any headroom at all fixes it; 30% also covers the
// larger swings seen when campaign state changes between estimate and inclusion.
//
// Unused gas is refunded, so over-reserving costs the sender nothing but block space.
// See also COTI_REGISTER_LEAF_GAS in podFees.ts — the flat-limit answer to the same problem on
// COTI, where estimation cannot see MPC precompiles at all and no percentage would be enough.
export const GAS_HEADROOM_PERCENT = 30n

/** Estimate + headroom, rounded up. */
export function addGasHeadroom(estimate: bigint): bigint {
  return (estimate * (100n + GAS_HEADROOM_PERCENT)) / 100n + 1n
}

/**
 * Best-effort buffered gas limit for a write.
 *
 * Returns `undefined` when estimation fails, which tells viem to fall back to estimating at
 * send time — exactly today's behaviour. This helper can therefore only ever add headroom; it
 * never turns a working call into a failing one, and a call that is going to revert still
 * reverts at the wallet prompt with the wallet's own error rather than ours.
 */
export async function bufferedGas(estimate: () => Promise<bigint>): Promise<bigint | undefined> {
  try {
    return addGasHeadroom(await estimate())
  } catch {
    return undefined
  }
}
