import { EcosystemPage } from './EcosystemPage'

export function Homes({ setPage }) {
  return (
    <EcosystemPage
      setPage={setPage}
      icon="🏠"
      title="NAN Homes"
      tagline="Rent verified homes and pay landlords securely in stablecoins, with inspections scheduled right in the app."
      features={[
        'Verified landlords only',
        'Interactive map search',
        'Inspection scheduling',
        'Secure escrow-backed rent payments',
      ]}
    />
  )
}
