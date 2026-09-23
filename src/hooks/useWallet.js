import { useDynamicContext } from '@dynamic-labs/sdk-react-core'
import { useAccount } from 'wagmi'
import { useState, useEffect, useCallback } from 'react'
import { ethers } from 'ethers'

const API_BASE = import.meta.env.VITE_API_BASE || 'https://nan-production.up.railway.app'
const ARC_RPC  = 'https://rpc.testnet.arc.network'
const CHAIN_ID = 5042002

export const USDC_ADDR = '0x3600000000000000000000000000000000000000'
export const EURC_ADDR = '0x89B50855Aa3bE2F677cD6303Cec089B5F319D72a'

export const ERC20_ABI = [
  'function balanceOf(address) view returns (uint256)',
  'function decimals() view returns (uint8)',
  'function transfer(address,uint256) returns (bool)',
  'function approve(address,uint256) returns (bool)',
  'function allowance(address,address) view returns (uint256)',
]

export function useWallet() {
  const { primaryWallet, user, handleLogOut } = useDynamicContext()
  const { address, isConnected } = useAccount()

  const [usdcBal, setUsdcBal] = useState('0.00')
  const [eurcBal, setEurcBal] = useState('0.00')
  const [ethBal,  setEthBal]  = useState('0.00')
  const [loading, setLoading] = useState(false)
  const [fxRate,  setFxRate]  = useState(1600) // NGN per USD fallback

  const getProvider = useCallback(() =>
    new ethers.JsonRpcProvider(ARC_RPC, CHAIN_ID), [])

  const getSigner = useCallback(async () => {
    if (!primaryWallet) throw new Error('No wallet connected')
    const walletClient = await primaryWallet.getWalletClient()
    const provider = new ethers.BrowserProvider(walletClient)
    return provider.getSigner()
  }, [primaryWallet])

  const fetchBalances = useCallback(async (addr) => {
    if (!addr) return
    setLoading(true)
    try {
      const provider = getProvider()
      const [ethRaw, usdcRaw, eurcRaw] = await Promise.all([
        provider.getBalance(addr),
        new ethers.Contract(USDC_ADDR, ERC20_ABI, provider).balanceOf(addr).catch(() => 0n),
        new ethers.Contract(EURC_ADDR, ERC20_ABI, provider).balanceOf(addr).catch(() => 0n),
      ])
      setEthBal(parseFloat(ethers.formatEther(ethRaw)).toFixed(4))
      setUsdcBal(parseFloat(ethers.formatUnits(usdcRaw, 6)).toFixed(2))
      setEurcBal(parseFloat(ethers.formatUnits(eurcRaw, 6)).toFixed(2))
    } catch (e) {
      console.error('Balance fetch error:', e)
    } finally {
      setLoading(false)
    }
  }, [getProvider])

  const apiFetch = useCallback(async (path, opts = {}) => {
    const res = await fetch(`${API_BASE}${path}`, {
      headers: { 'Content-Type': 'application/json', ...opts.headers },
      ...opts,
    })
    const data = await res.json()
    if (!res.ok) throw new Error(data.error || 'API error')
    return data
  }, [])

  // Fetch FX rate
  useEffect(() => {
    fetch('https://api.frankfurter.app/latest?from=USD&to=NGN')
      .then(r => r.json())
      .then(d => d?.rates?.NGN && setFxRate(d.rates.NGN))
      .catch(() => {})
  }, [])

  useEffect(() => {
    if (address) fetchBalances(address)
  }, [address, fetchBalances])

  const totalUSD = (parseFloat(usdcBal) + parseFloat(eurcBal) * 1.08).toFixed(2)
  const totalNGN = (parseFloat(totalUSD) * fxRate).toLocaleString('en-NG', { maximumFractionDigits: 0 })

  return {
    address,
    isConnected,
    primaryWallet,
    user,
    usdcBal, eurcBal, ethBal,
    totalUSD, totalNGN,
    loading,
    fetchBalances,
    getSigner,
    getProvider,
    apiFetch,
    disconnect: handleLogOut,
  }
}
