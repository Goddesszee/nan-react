import { EcosystemPage } from './EcosystemPage'

export function Market({ setPage }) {
  return (
    <EcosystemPage
      setPage={setPage}
      icon="🛍"
      title="NAN Market"
      tagline="Buy and sell with confidence — every order is protected by escrow until both sides confirm."
      features={[
        'Seller verification',
        'Escrow-protected payments',
        'Built-in negotiation',
        'Order tracking & dispute resolution',
      ]}
    />
  )
}
