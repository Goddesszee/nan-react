import { EcosystemPage } from './EcosystemPage'

export function Careers({ setPage }) {
  return (
    <EcosystemPage
      setPage={setPage}
      icon="💼"
      title="NAN Careers"
      tagline="Find verified jobs and let AI sharpen your resume, prep you for interviews, and track every application."
      features={[
        'Verified job listings',
        'AI resume optimizer',
        'AI interview coach',
        'Application tracker & insights',
      ]}
    />
  )
}
