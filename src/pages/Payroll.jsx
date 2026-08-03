import { EcosystemPage } from './EcosystemPage'

export function Payroll({ setPage }) {
  return (
    <EcosystemPage
      setPage={setPage}
      icon="📊"
      title="NAN Payroll"
      tagline="Pay your whole team in stablecoins — upload a CSV, review, and send. Payslips generate automatically."
      features={[
        'Employee directory & CSV upload',
        'Bulk & recurring payroll runs',
        'Auto-generated payslips & receipts',
        'Payroll analytics dashboard',
      ]}
    />
  )
}
