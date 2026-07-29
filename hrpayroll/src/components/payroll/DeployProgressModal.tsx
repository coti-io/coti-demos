import type { DeployStage } from '../../hooks/useCreateCampaign'
import { explorerAddressUrl } from '../../lib/explorer'
import { InlineError } from '../InlineError'
import { TxLink } from '../TxLink'
import { Button } from '../ui/button'
import { Modal } from '../ui/modal'

export function DeployProgressModal({
  open,
  onClose,
  stages,
  isPending,
  isComplete,
  error,
}: {
  open: boolean
  onClose: () => void
  stages: DeployStage[]
  isPending: boolean
  /** Deploy succeeded — the modal waits here on "Next" instead of advancing on its own. */
  isComplete: boolean
  error: Error | null
}) {
  return (
    <Modal open={open} onClose={onClose} title="Deploying Payroll">
      {/* Always dismissable — closing this view doesn't cancel the mutation, which
          keeps running in the background either way. Locking it to "done only" trapped
          the user with no way out if a step ever hung (e.g. an unanswered wallet network
          switch prompt), since isPending would then never turn false. */}
      <ul style={{ listStyle: 'none', margin: 0, padding: 0 }}>
        {stages.map((stage, i) => {
          const isCurrent = isPending && i === stages.length - 1
          // Dim finished steps only while the run is still moving — once it stops, the
          // whole list is the thing being read, so nothing stays greyed out.
          return (
            <li key={stage.id} style={{ opacity: !isPending || isCurrent ? 1 : 0.6 }}>
              <div>
                {isCurrent ? '⏳' : '✓'} {stage.label}
              </div>
              <StageContractLink stage={stage} />
              <StageTxLink stage={stage} />
            </li>
          )
        })}
      </ul>
      {error && <InlineError style={{ marginTop: '0.75rem' }}>{error.message}</InlineError>}
      {isComplete && (
        <p className="mt-3 text-sm text-muted-foreground">
          All transactions confirmed. Continue to fund the payroll and export claim packages.
        </p>
      )}
      {!isPending && (
        <Button type="button" className="mt-4" onClick={onClose}>
          {isComplete ? 'Next' : 'Close'}
        </Button>
      )}
    </Modal>
  )
}

/**
 * The contract this stage calls, shown in full rather than shortened — the address is
 * there to be compared against the expected deployment, which a truncated form defeats.
 */
export function StageContractLink({ stage }: { stage: DeployStage }) {
  if (!stage.contractAddress || stage.chainId === undefined) return null
  const url = explorerAddressUrl(stage.chainId, stage.contractAddress)
  if (!url) return null

  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className="ml-5 block break-all font-mono text-xs text-muted-foreground hover:underline"
    >
      {stage.contractAddress}
    </a>
  )
}

/**
 * Explorer link for the stages that send a transaction. Rendered as soon as the wallet
 * returns the hash — i.e. while the tx is still pending — so a COTI tx stuck in the
 * mempool can be inspected without waiting for a receipt that may never come.
 */
export function StageTxLink({ stage }: { stage: DeployStage }) {
  if (!stage.txHash || stage.chainId === undefined) return null

  return (
    <TxLink
      chainId={stage.chainId}
      hash={stage.txHash}
      className="ml-5 font-mono text-xs text-[#FF9100] hover:underline"
    />
  )
}
