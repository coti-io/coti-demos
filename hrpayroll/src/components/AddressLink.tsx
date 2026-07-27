import { AVAX_CHAIN_ID } from '../config/contracts'
import { explorerAddressUrl } from '../lib/explorer'
import { shortAddr } from '../lib/format'

/** Shortened address linking to the Fuji Snowtrace explorer. */
export function AddressLink({ address, className }: { address: string; className?: string }) {
  return (
    <a
      href={explorerAddressUrl(AVAX_CHAIN_ID, address)}
      target="_blank"
      rel="noopener noreferrer"
      className={className}
    >
      {shortAddr(address)}
    </a>
  )
}
