import React from 'react'
import ReactDOM from 'react-dom/client'
import { DynamicContextProvider } from '@dynamic-labs/sdk-react-core'
import { EthereumWalletConnectors } from '@dynamic-labs/ethereum'
import { WagmiProvider } from 'wagmi'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { DynamicWagmiConnector } from '@dynamic-labs/wagmi-connector'
import { createConfig, http } from 'wagmi'
import { defineChain } from 'viem'
import App from './App'
import './nan.css'

// Arc Testnet custom chain
export const arcTestnet = defineChain({
  id: 5042002,
  name: 'Arc Testnet',
  nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
  rpcUrls: {
    default: { http: ['https://rpc.arc.fun'] },
  },
  blockExplorers: {
    default: { name: 'Arc Explorer', url: 'https://explorer.arc.fun' },
  },
  testnet: true,
})

const config = createConfig({
  chains: [arcTestnet],
  multiInjectedProviderDiscovery: false,
  transports: { [arcTestnet.id]: http() },
})

const queryClient = new QueryClient()

const DYNAMIC_ENV_ID = import.meta.env.VITE_DYNAMIC_ENV_ID || '63eed889-9673-4cfc-a9b5-4c8e54ee67dc'

const evmNetworks = [
  {
    blockExplorerUrls: ['https://explorer.arc.fun'],
    chainId: 5042002,
    chainName: 'Arc Testnet',
    iconUrls: ['https://app.dynamic.xyz/assets/networks/eth.svg'],
    name: 'Arc Testnet',
    nativeCurrency: { decimals: 18, name: 'Ether', symbol: 'ETH' },
    networkId: 5042002,
    rpcUrls: ['https://rpc.arc.fun'],
    vanityName: 'Arc Testnet',
  },
]

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <DynamicContextProvider
      theme="auto"
      settings={{
        environmentId: DYNAMIC_ENV_ID,
        walletConnectors: [EthereumWalletConnectors],
        overrides: { evmNetworks },
        appName: 'NAN Wallet',
        appLogoUrl: 'https://nanarc.xyz/favicon.ico',
      }}
    >
      <WagmiProvider config={config}>
        <QueryClientProvider client={queryClient}>
          <DynamicWagmiConnector>
            <App />
          </DynamicWagmiConnector>
        </QueryClientProvider>
      </WagmiProvider>
    </DynamicContextProvider>
  </React.StrictMode>
)
