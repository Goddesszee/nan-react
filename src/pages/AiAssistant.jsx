import { EcosystemPage } from './EcosystemPage'

export function AiAssistant({ setPage }) {
  return (
    <EcosystemPage
      setPage={setPage}
      icon="✨"
      title="NAN AI Assistant"
      tagline="One assistant across the whole ecosystem — research a listing, write a resume, get financial guidance, or just chat."
      features={[
        'Property & product research',
        'Resume writing & interview coaching',
        'Financial guidance',
        'General AI chat, agent-to-agent ready',
      ]}
    />
  )
}
