import { useEffect } from 'react'
import { useNanStore } from './store/nanStore'
import { AppShell } from './components/layout/AppShell'
import { OnboardingPage } from './components/pages/OnboardingPage'
import { HomePage } from './components/pages/HomePage'
import { WalletPage } from './components/pages/WalletPage'
import { ShopPage } from './components/pages/ShopPage'
import { AgentPage } from './components/pages/AgentPage'
import { ActivityPage } from './components/pages/ActivityPage'
import { SettingsPage } from './components/pages/SettingsPage'

type View = 'home' | 'wallet' | 'send' | 'receive' | 'shop' | 'agent' | 'activity' | 'settings' | 'help' | 'landing' | 'onboarding'

interface Props {
  initialView?: string
}

export default function AppNew({ initialView }: Props) {
  const { activeView, setActiveView, onboarding } = useNanStore()

  useEffect(() => {
    if (initialView && initialView !== activeView) {
      setActiveView(initialView as View)
    }
  }, [initialView, activeView, setActiveView])

  if (!onboarding.completed) return <OnboardingPage />

  return (
    <AppShell>
      {(activeView === 'home' || activeView === 'landing') && <HomePage />}
      {activeView === 'wallet' && <WalletPage />}
      {activeView === 'send' && <WalletPage initialSubView="send" />}
      {activeView === 'receive' && <WalletPage initialSubView="receive" />}
      {activeView === 'shop' && <ShopPage />}
      {activeView === 'agent' && <AgentPage />}
      {activeView === 'activity' && <ActivityPage />}
      {activeView === 'settings' && <SettingsPage />}
      {activeView === 'help' && <SettingsPage />}
    </AppShell>
  )
}
