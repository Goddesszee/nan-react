import { EcosystemPage } from './EcosystemPage'

export function Gigs({ setPage }) {
  return (
    <EcosystemPage
      setPage={setPage}
      title="NAN Gigs"
      tagline="Freelance work with funds locked up front. Get paid the moment a milestone is approved."
      features={[
        'Pre-funded jobs',
        'Milestone-based payments',
        'Submission review workflow',
        'Client & freelancer dashboards',
      ]}
    />
  )
}
