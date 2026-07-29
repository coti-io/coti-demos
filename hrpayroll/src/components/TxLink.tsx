import { explorerName, explorerTxUrl, shortHash } from '../lib/explorer'

/**
 * Explorer link for a transaction hash, on either of the two chains a payroll run touches.
 * Renders nothing for a chain we have no explorer for, so callers can drop it in
 * unconditionally without guarding.
 */
export function TxLink({
  chainId,
  hash,
  className = 'font-mono text-xs text-[#FF9100] hover:underline',
}: {
  chainId: number
  hash: string
  className?: string
}) {
  const url = explorerTxUrl(chainId, hash)
  if (!url) return null

  return (
    <a href={url} target="_blank" rel="noopener noreferrer" className={className}>
      {shortHash(hash)} ↗ {explorerName(chainId)}
    </a>
  )
}
