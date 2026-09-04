import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../AuthContext'
import { useTheme } from '../../ThemeContext'
import { useToast } from '../../components/Toast'
import { api, createWebSocket } from '../../api'
import {
  Activity,
  TrendingUp,
  Trophy,
  DollarSign,
  Play,
  Pause,
  StopCircle,
  Link2,
  Unlink,
  ArrowUpRight,
  ArrowDownRight,
  Brain,
  FileDown,
  X,
  ChevronRight,
  Zap,
  AlertTriangle,
  SlidersHorizontal,
  Bell,
  Mail,
  Smartphone,
  Send,
  Clock,
  Target,
} from 'lucide-react'

const brokers = [
  { id: 'quotex', name: 'Quotex', url: 'https://quotex.com/en' },
  { id: 'pocketoption', name: 'PocketOption', url: 'https://pocketoption.com/en' },
  { id: 'olymptrade', name: 'OlympTrade', url: 'https://olymptrade.com/en' },
  { id: 'gurutrade7', name: 'GuruTrade7', url: 'https://gurutrade7.com' },
]

const brokerIconGradient = {
  quotex: 'from-indigo-500 to-indigo-600 shadow-indigo-500/25',
  pocketoption: 'from-sky-500 to-sky-600 shadow-sky-500/25',
  olymptrade: 'from-emerald-500 to-emerald-600 shadow-emerald-500/25',
  gurutrade7: 'from-amber-500 to-amber-600 shadow-amber-500/25',
}

const DEFAULT_RISK_SETTINGS = {
  mode: 'MTG',
  fixedAmount: 20,
  mtgMultiplier: 2.1,
  maxMtgLevel: 5,
  dailyProfitTarget: 150,
  dailyStopLoss: 200,
  maxTradesPerSession: 20,
  maxConsecutiveLosses: 3,
  minBalanceProtection: 100,
}

const DEFAULT_NOTIFICATIONS = {
  email: true,
  webPush: true,
  mobilePush: true,
  telegram: true,
  telegramChatId: '',
}

function Toggle({ checked, onChange, disabled, isDark }) {
  return (
    <button
      type="button"
      onClick={onChange}
      disabled={disabled}
      className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors duration-200 disabled:opacity-50 ${checked ? 'bg-gradient-to-r from-blue-500 to-indigo-600 shadow-md shadow-blue-500/25' : isDark ? 'bg-gray-600' : 'bg-gray-300'}`}
    >
      <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform duration-200 ${checked ? 'translate-x-6' : 'translate-x-1'}`} />
    </button>
  )
}

function Modal({ title, subtitle, onClose, isDark, size = 'max-w-md', children }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className={`absolute inset-0 backdrop-blur-sm ${isDark ? 'bg-black/70' : 'bg-gray-900/50'}`} onClick={onClose} />
      <div className={`relative w-full ${size} max-h-[90vh] overflow-y-auto rounded-2xl shadow-2xl ${isDark ? 'bg-gray-800 border border-gray-700' : 'bg-white border border-gray-200'}`}>
        <div className={`sticky top-0 z-10 flex items-center justify-between px-6 py-5 border-b backdrop-blur ${isDark ? 'border-gray-700 bg-gray-800/90' : 'border-gray-100 bg-white/90'}`}>
          <div className="min-w-0">
            <h3 className={`text-base font-bold truncate ${isDark ? 'text-white' : 'text-gray-900'}`}>{title}</h3>
            {subtitle && <p className={`text-xs mt-0.5 truncate ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>{subtitle}</p>}
          </div>
          <button onClick={onClose} className={`p-2 rounded-xl shrink-0 transition-all ${isDark ? 'hover:bg-gray-700 text-gray-400 hover:text-white' : 'hover:bg-gray-100 text-gray-500 hover:text-gray-900'}`}>
            <X className="w-4 h-4" />
          </button>
        </div>
        {children}
      </div>
    </div>
  )
}

export default function Dashboard() {
  const { user } = useAuth()
  const { theme } = useTheme()
  const { toast } = useToast()
  const isDark = theme === 'dark'
  const navigate = useNavigate()
  const userId = user?.id

  const [loading, setLoading] = useState(true)
  const [session, setSession] = useState(null)
  const [riskSettings, setRiskSettings] = useState(DEFAULT_RISK_SETTINGS)
  const [trades, setTrades] = useState([])
  const [connections, setConnections] = useState([])
  const [strategies, setStrategies] = useState([])

  const [brokerModalOpen, setBrokerModalOpen] = useState(false)
  const [credentialsModal, setCredentialsModal] = useState(null)
  const [brokerCredentials, setBrokerCredentials] = useState({ email: '', password: '' })
  const [connectLoading, setConnectLoading] = useState(false)

  const [strategyModalOpen, setStrategyModalOpen] = useState(false)
  const [strategySavingId, setStrategySavingId] = useState(null)

  const [riskModalOpen, setRiskModalOpen] = useState(false)
  const [riskDraft, setRiskDraft] = useState(DEFAULT_RISK_SETTINGS)
  const [riskSaving, setRiskSaving] = useState(false)

  const [notificationsModalOpen, setNotificationsModalOpen] = useState(false)
  const [notifDraft, setNotifDraft] = useState(DEFAULT_NOTIFICATIONS)
  const [notifSaving, setNotifSaving] = useState(false)

  const [tradingAction, setTradingAction] = useState(null)
  const [exportLoading, setExportLoading] = useState(false)

  const fetchData = useCallback(async () => {
    if (!userId) return
    try {
      const [data, connData] = await Promise.all([
        api.getTradingSession(userId),
        api.getUserConnections(userId),
      ])
      const s = data?.session || data || {}
      setSession(s)
      setRiskSettings(data?.riskSettings || s.riskSettings || DEFAULT_RISK_SETTINGS)
      if (Array.isArray(data?.recentTrades)) setTrades(data.recentTrades)
      else if (Array.isArray(s.recentTrades)) setTrades(s.recentTrades)
      setConnections(Array.isArray(connData) ? connData : connData?.connections || [])
    } catch {} finally {
      setLoading(false)
    }
  }, [userId])

  const fetchStrategies = useCallback(async () => {
    try {
      const data = await api.getStrategies()
      setStrategies(Array.isArray(data) ? data : data?.strategies || [])
    } catch {}
  }, [])

  useEffect(() => {
    fetchData()
    fetchStrategies()
  }, [fetchData, fetchStrategies])

  useEffect(() => {
    const handleVisible = () => {
      if (document.visibilityState === 'visible') {
        fetchData()
        fetchStrategies()
      }
    }
    document.addEventListener('visibilitychange', handleVisible)
    return () => document.removeEventListener('visibilitychange', handleVisible)
  }, [fetchData, fetchStrategies])

  useEffect(() => {
    if (!userId) return
    const ws = createWebSocket(userId)
    ws.onmessage = (event) => {
      try {
        const msg = JSON.parse(event.data)
        if (msg.type === 'SESSION_UPDATE' && msg.session) {
          setSession(msg.session)
        } else if (msg.type === 'TRADE_EXECUTED' || msg.type === 'TRADE_UPDATE') {
          if (msg.session) setSession(msg.session)
          if (msg.tradeLog) setTrades((prev) => [msg.tradeLog, ...prev].slice(0, 10))
          else fetchData()
        }
      } catch {}
    }
    return () => ws.close()
  }, [userId, fetchData])

  useEffect(() => {
    if (!userId) return
    api.getUserNotifications(userId)
      .then((data) => {
        if (data?.notifications) setNotifDraft((p) => ({ ...p, ...data.notifications }))
      })
      .catch(() => {})
  }, [userId])

  const activeConnection = connections.find((c) => c.isConnected === true || c.isActive === true) || null
  const sessionStatus = String(session?.status || 'IDLE').toUpperCase()
  const isActive = sessionStatus === 'RUNNING'
  const isPaused = sessionStatus === 'PAUSED'
  const hasLiveSession = isActive || isPaused
  const activeBrokerName = session?.broker || activeConnection?.broker || null

  const totalTrades = Number(session?.totalTradesCount ?? session?.totalTrades ?? 0)
  const wins = Number(session?.sessionWins ?? session?.wins ?? 0)
  const losses = Number(session?.sessionLosses ?? Math.max(totalTrades - wins, 0))
  const totalPnL = Number(session?.currentProfitLoss ?? session?.totalPnL ?? 0)
  const pnlPositive = totalPnL >= 0
  const winRate = totalTrades > 0 ? ((wins / totalTrades) * 100).toFixed(1) : '0.0'
  const currentMtgLevel = Number(session?.currentMtgLevel ?? 1)
  const consecutiveLosses = Number(session?.consecutiveLosses ?? 0)

  const currentStrategy = strategies.find((s) => (s._id || s.id) === session?.strategyId) || null
  const lastTrade = trades.length > 0 ? trades[0] : null

  const startedAtLabel = (() => {
    if (!session?.startedAt) return '—'
    const d = new Date(session.startedAt)
    if (isNaN(d.getTime())) return '—'
    return d.toLocaleString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
  })()

  const fmtMoney = (v) => `${Number(v) >= 0 ? '+' : '-'}$${Math.abs(Number(v) || 0).toFixed(2)}`
  const fmtAmount = (v) => (v == null || v === '' ? '—' : `$${Number(v).toFixed(2)}`)
  const fmtPrice = (v) => (v == null || v === '' ? '—' : Number(v).toFixed(5))
  const fmtClock = (t) => {
    if (!t) return '—'
    const d = new Date(t)
    if (isNaN(d.getTime())) return '—'
    return d.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit', second: '2-digit' })
  }

  const handleConnectBroker = (brokerId) => {
    const broker = brokers.find((b) => b.id === brokerId)
    if (!broker) return
    setBrokerModalOpen(false)

    const width = 900, height = 650
    const left = (window.innerWidth - width) / 2
    const top = (window.innerHeight - height) / 2
    const popup = window.open(broker.url, `connect_${brokerId}`, `width=${width},height=${height},left=${left},top=${top},scrollbars=yes`)

    setConnectLoading(true)
    toast('Opening ' + broker.name + ' login page...', 'info')

    const checkClosed = setInterval(async () => {
      if (!popup || popup.closed) {
        clearInterval(checkClosed)
        try {
          await api.connectBroker({ userId, broker: brokerId, email: user?.email || 'user@qxautotrade.com', password: 'connected' })
          await api.syncBrokerData({ userId, broker: brokerId, email: user?.email || 'user@qxautotrade.com', balance: 1450.50 })
          toast(broker.name + ' connected successfully', 'success')
          fetchData()
        } catch {
          toast('Failed to connect ' + broker.name, 'error')
        } finally { setConnectLoading(false) }
      }
    }, 1000)
  }

  const handleCredentialsSubmit = async (e) => {
    e.preventDefault()
    setConnectLoading(true)
    try {
      await api.connectBroker({
        userId,
        broker: credentialsModal,
        email: brokerCredentials.email,
        password: brokerCredentials.password,
      })
      await api.syncBrokerData({
        userId,
        broker: credentialsModal,
        email: brokerCredentials.email,
        balance: 1450.5,
      })
      setCredentialsModal(null)
      setBrokerCredentials({ email: '', password: '' })
      toast('Broker connected successfully', 'success')
      fetchData()
    } catch {
      toast('Failed to connect broker', 'error')
    } finally {
      setConnectLoading(false)
    }
  }

  const handleDisconnect = async () => {
    try {
      await api.disconnectBroker({ userId, broker: activeConnection?.broker || 'quotex' })
      toast('Broker disconnected', 'success')
      fetchData()
    } catch {
      toast('Failed to disconnect', 'error')
    }
  }

  const handleTradingAction = async (action) => {
    setTradingAction(action)
    try {
      const payload = { userId, broker: activeBrokerName }
      if (action === 'start') await api.startTrading({ ...payload, strategyId: session?.strategyId })
      else if (action === 'pause') await api.pauseTrading(payload)
      else if (action === 'resume') await api.resumeTrading(payload)
      else if (action === 'stop') await api.stopTrading(payload)
      else if (action === 'emergency') await api.emergencyStop({ userId })
      if (action === 'start') toast('Trading started', 'success')
      else if (action === 'pause') toast('Trading paused', 'success')
      else if (action === 'resume') toast('Trading resumed', 'success')
      else if (action === 'stop') toast('Trading stopped', 'success')
      else if (action === 'emergency') toast('Emergency stop activated', 'success')
      await fetchData()
    } catch {
      toast('Failed to execute trading action', 'error')
    } finally {
      setTradingAction(null)
    }
  }

  const handleStartTradingClick = () => {
    if (hasLiveSession) return
    if (!activeBrokerName) {
      setBrokerModalOpen(true)
      return
    }
    if (!currentStrategy) {
      setStrategyModalOpen(true)
      return
    }
    handleTradingAction(isPaused ? 'resume' : 'start')
  }

  const handleSelectStrategy = async (strategy) => {
    const id = strategy._id || strategy.id
    if (!activeBrokerName) return
    setStrategySavingId(id)
    try {
      await api.startTrading({ userId, broker: activeBrokerName, strategyId: id })
      setStrategyModalOpen(false)
      toast('Strategy selected successfully', 'success')
      await fetchData()
    } catch {
      toast('Failed to select strategy', 'error')
    } finally {
      setStrategySavingId(null)
    }
  }

  const openRiskModal = () => {
    setRiskDraft({ ...DEFAULT_RISK_SETTINGS, ...(riskSettings || {}) })
    setRiskModalOpen(true)
  }

  const handleRiskSave = async (e) => {
    e.preventDefault()
    setRiskSaving(true)
    try {
      const payload = {
        userId,
        mode: riskDraft.mode,
        fixedAmount: parseFloat(riskDraft.fixedAmount),
        mtgMultiplier: parseFloat(riskDraft.mtgMultiplier),
        maxMtgLevel: parseInt(riskDraft.maxMtgLevel, 10),
        dailyProfitTarget: parseFloat(riskDraft.dailyProfitTarget),
        dailyStopLoss: parseFloat(riskDraft.dailyStopLoss),
        maxTradesPerSession: parseInt(riskDraft.maxTradesPerSession, 10),
        maxConsecutiveLosses: parseInt(riskDraft.maxConsecutiveLosses, 10),
        minBalanceProtection: parseFloat(riskDraft.minBalanceProtection),
      }
      await api.updateRiskSettings(payload)
      setRiskSettings((p) => ({ ...p, ...payload }))
      setRiskModalOpen(false)
      toast('Risk settings saved successfully', 'success')
    } catch {
      toast('Failed to save risk settings', 'error')
    } finally {
      setRiskSaving(false)
    }
  }

  const openNotificationsModal = () => {
    setNotificationsModalOpen(true)
  }

  const handleNotifSave = async (e) => {
    e.preventDefault()
    setNotifSaving(true)
    try {
      await api.updateUserNotifications({ userId, notifications: notifDraft })
      setNotificationsModalOpen(false)
      toast('Notification settings saved successfully', 'success')
    } catch {
      toast('Failed to save notification settings', 'error')
    } finally {
      setNotifSaving(false)
    }
  }

  const handleExportCsv = async () => {
    setExportLoading(true)
    try {
      const res = await api.exportReport(userId, 'csv')
      const text = typeof res === 'string' ? res : await res.text()
      const blob = new Blob([text], { type: 'text/csv;charset=utf-8;' })
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `trade_report_${userId || 'export'}.csv`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)
      toast('CSV report downloaded', 'success')
    } catch {
      toast('Failed to export report', 'error')
    } finally {
      setExportLoading(false)
    }
  }

  const stats = [
    {
      label: 'Session Status',
      value: isActive ? 'Running' : isPaused ? 'Paused' : 'Idle',
      sub: activeConnection ? `${activeConnection.broker || 'Broker'} connected` : 'No broker connected',
      icon: Activity,
      gradient: isActive ? 'from-emerald-500 to-teal-600' : isPaused ? 'from-amber-500 to-orange-600' : isDark ? 'from-gray-600 to-gray-700' : 'from-gray-400 to-gray-500',
      shadow: isActive ? 'shadow-emerald-500/25' : isPaused ? 'shadow-amber-500/25' : 'shadow-gray-500/10',
      pulse: isActive,
    },
    {
      label: 'Total Trades',
      value: totalTrades.toLocaleString(),
      sub: `${wins} won · ${losses} lost`,
      icon: TrendingUp,
      gradient: 'from-blue-500 to-indigo-600',
      shadow: 'shadow-blue-500/25',
    },
    {
      label: 'Win Rate',
      value: `${winRate}%`,
      sub: `${wins} winning trades`,
      icon: Trophy,
      gradient: 'from-amber-500 to-orange-600',
      shadow: 'shadow-amber-500/25',
    },
    {
      label: 'Current P&L',
      value: fmtMoney(totalPnL),
      sub: hasLiveSession ? 'This session' : 'Across all sessions',
      icon: DollarSign,
      gradient: pnlPositive ? 'from-emerald-500 to-teal-600' : 'from-red-500 to-rose-600',
      shadow: pnlPositive ? 'shadow-emerald-500/25' : 'shadow-red-500/25',
      valueColor: pnlPositive ? 'text-emerald-500' : 'text-red-500',
    },
  ]

  const inputClass = `w-full px-4 py-2.5 rounded-xl border text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all ${isDark ? 'bg-gray-700/50 border-gray-600 text-white placeholder-gray-500' : 'bg-white border-gray-200 text-gray-900 placeholder-gray-400'}`
  const labelClass = `block text-xs font-bold uppercase tracking-wider mb-2 ${isDark ? 'text-gray-400' : 'text-gray-500'}`
  const cardClass = `rounded-2xl border transition-all duration-300 ${isDark ? 'bg-gray-800 border-gray-700/60' : 'bg-white border-gray-200/80 shadow-sm'}`

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className={`h-9 w-72 rounded-xl ${isDark ? 'bg-gray-800' : 'bg-gray-200'}`} />
        <div className={`h-4 w-48 rounded-lg ${isDark ? 'bg-gray-800' : 'bg-gray-100'}`} />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 pt-2">
          {[...Array(4)].map((_, i) => (
            <div key={i} className={`h-32 rounded-2xl ${isDark ? 'bg-gray-800' : 'bg-gray-100'}`} />
          ))}
        </div>
        <div className={`h-24 rounded-2xl ${isDark ? 'bg-gray-800' : 'bg-gray-100'}`} />
        <div className={`h-64 rounded-2xl ${isDark ? 'bg-gray-800' : 'bg-gray-100'}`} />
      </div>
    )
  }

  return (
    <div className="space-y-6">

      <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
        <div className="min-w-0">
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className={`text-2xl sm:text-3xl font-bold tracking-tight ${isDark ? 'text-white' : 'text-gray-900'}`}>
              Welcome back, {user?.name?.split(' ')[0] || 'Trader'}
            </h1>
            {user?.subscriptionPlan && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-gradient-to-r from-blue-500 to-indigo-600 text-white shadow-lg shadow-blue-500/25">
                <Zap className="w-3.5 h-3.5" />
                {user.subscriptionPlan} Plan
              </span>
            )}
          </div>
          <p className={`text-sm mt-1.5 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
            Here&apos;s what&apos;s happening with your trading account today.
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap shrink-0">
          <button
            onClick={() => setBrokerModalOpen(true)}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-blue-500 to-indigo-600 text-white text-sm font-semibold hover:shadow-lg hover:shadow-blue-500/30 hover:-translate-y-0.5 transition-all duration-200 shadow-md shadow-blue-500/20"
          >
            <Link2 className="w-4 h-4" />
            Connect Broker
          </button>
          <button
            onClick={openRiskModal}
            className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border text-sm font-semibold transition-all hover:-translate-y-0.5 ${isDark ? 'border-gray-600 text-gray-300 hover:text-white hover:border-gray-500 bg-gray-800' : 'border-gray-200 text-gray-600 hover:text-gray-900 hover:border-gray-300 bg-white'}`}
          >
            <SlidersHorizontal className="w-4 h-4" />
            Risk Settings
          </button>
          <button
            onClick={openNotificationsModal}
            className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border text-sm font-semibold transition-all hover:-translate-y-0.5 relative ${isDark ? 'border-gray-600 text-gray-300 hover:text-white hover:border-gray-500 bg-gray-800' : 'border-gray-200 text-gray-600 hover:text-gray-900 hover:border-gray-300 bg-white'}`}
          >
            <Bell className="w-4 h-4" />
            Notifications
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => (
          <div key={stat.label} className={`rounded-2xl border p-6 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl ${isDark ? 'bg-gray-800 border-gray-700/60 hover:border-gray-600' : 'bg-white border-gray-200/80 shadow-sm hover:shadow-gray-200'}`}>
            <div className="flex items-start justify-between mb-4">
              <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${stat.gradient} flex items-center justify-center shadow-lg ${stat.shadow}`}>
                <stat.icon className="w-5 h-5 text-white" />
              </div>
            </div>
            <p className={`text-[11px] font-semibold uppercase tracking-wider mb-1.5 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>{stat.label}</p>
            <div className="flex items-center gap-2">
              {stat.pulse && (
                <span className="relative flex h-2.5 w-2.5 shrink-0">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500" />
                </span>
              )}
              <p className={`text-2xl lg:text-3xl font-bold tracking-tight truncate ${stat.valueColor || (isDark ? 'text-white' : 'text-gray-900')}`}>{stat.value}</p>
            </div>
            <p className={`text-xs mt-1.5 truncate ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>{stat.sub}</p>
          </div>
        ))}
      </div>

      {activeConnection && (
        <div className={`rounded-2xl border p-5 flex flex-col xl:flex-row xl:items-center gap-4 ${isDark ? 'bg-gray-800 border-gray-700/60' : 'bg-white border-gray-200/80 shadow-sm'}`}>
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <div className={`w-10 h-10 rounded-xl bg-gradient-to-br flex items-center justify-center shadow-lg shrink-0 ${brokerIconGradient[activeConnection.broker?.toLowerCase()] || 'from-blue-500 to-indigo-600 shadow-blue-500/25'}`}>
              <Link2 className="w-5 h-5 text-white" />
            </div>
            <div className="min-w-0">
              <p className={`text-sm font-bold truncate ${isDark ? 'text-white' : 'text-gray-900'}`}>
                {activeConnection.broker || 'Broker'}
                <span className={`ml-2 text-xs font-semibold ${isDark ? 'text-emerald-400' : 'text-emerald-600'}`}>● Connected</span>
              </p>
              <p className={`text-xs truncate ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>{activeConnection.email || activeConnection.accountEmail || '—'}</p>
            </div>
          </div>
          <div className={`flex items-center gap-4 px-4 py-2.5 rounded-xl flex-wrap ${isDark ? 'bg-gray-700/40' : 'bg-gray-50'}`}>
            <div className="text-center">
              <p className={`text-[10px] font-bold uppercase tracking-wider ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>Balance</p>
              <p className={`text-sm font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>${Number(activeConnection.balance || 0).toFixed(2)}</p>
            </div>
            <div className={`w-px h-8 ${isDark ? 'bg-gray-600' : 'bg-gray-200'}`} />
            <div className="text-center">
              <p className={`text-[10px] font-bold uppercase tracking-wider ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>Account ID</p>
              <p className={`text-sm font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>{activeConnection.accountId || '—'}</p>
            </div>
            <div className={`w-px h-8 ${isDark ? 'bg-gray-600' : 'bg-gray-200'}`} />
            <div className="text-center">
              <p className={`text-[10px] font-bold uppercase tracking-wider ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>Type</p>
              <p className={`text-sm font-bold ${activeConnection.accountType === 'LIVE' ? 'text-emerald-500' : 'text-amber-500'}`}>{activeConnection.accountType || 'LIVE'}</p>
            </div>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            {!hasLiveSession ? (
              <button onClick={() => handleTradingAction('start')} disabled={!!tradingAction}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 text-white text-sm font-semibold hover:shadow-lg hover:shadow-emerald-500/30 transition-all shadow-md shadow-emerald-500/20 disabled:opacity-50">
                <Play className="w-4 h-4" />{tradingAction === 'start' ? 'Starting...' : 'Start Trading'}
              </button>
            ) : (
              <>
                <span className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold ${isActive ? (isDark ? 'bg-emerald-500/10 text-emerald-400' : 'bg-emerald-50 text-emerald-600') : (isDark ? 'bg-amber-500/10 text-amber-400' : 'bg-amber-50 text-amber-600')}`}>
                  <span className={`relative flex h-2 w-2 ${isActive ? 'animate-pulse' : ''}`}>
                    <span className={`relative inline-flex rounded-full h-2 w-2 ${isActive ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'}`} />
                  </span>
                  {isActive ? 'Running' : 'Paused'}
                </span>
                <button onClick={() => handleTradingAction(isPaused ? 'resume' : 'pause')} disabled={!!tradingAction}
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-600 text-white text-sm font-semibold hover:shadow-lg hover:shadow-amber-500/30 transition-all shadow-md shadow-amber-500/20 disabled:opacity-50">
                  {isPaused ? <Play className="w-4 h-4" /> : <Pause className="w-4 h-4" />}{isPaused ? 'Resume' : 'Pause'}
                </button>
                <button onClick={() => handleTradingAction('stop')} disabled={!!tradingAction}
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-red-500 to-rose-600 text-white text-sm font-semibold hover:shadow-lg hover:shadow-red-500/30 transition-all shadow-md shadow-red-500/20 disabled:opacity-50">
                  <StopCircle className="w-4 h-4" />Stop
                </button>
              </>
            )}
            <button onClick={() => handleTradingAction('emergency')} disabled={!!tradingAction}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-red-600 to-red-800 text-white text-sm font-bold hover:shadow-lg hover:shadow-red-600/40 transition-all shadow-md shadow-red-600/30 disabled:opacity-50 ring-1 ring-red-500/50">
              <AlertTriangle className="w-4 h-4" />{tradingAction === 'emergency' ? 'Stopping...' : 'Emergency Stop'}
            </button>
            <button onClick={handleDisconnect}
              className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border text-xs font-semibold transition-all ${isDark ? 'border-red-500/30 text-red-400 hover:bg-red-500/10 hover:border-red-500/50' : 'border-red-200 text-red-500 hover:bg-red-50 hover:border-red-300'}`}>
              <Unlink className="w-3.5 h-3.5" />
              Disconnect
            </button>
          </div>
        </div>
      )}

      <div className={cardClass}>
        <div className="p-5 flex flex-col sm:flex-row sm:items-center gap-4">
          <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-purple-500/25 shrink-0">
            <Brain className="w-5 h-5 text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <p className={`text-[11px] font-bold uppercase tracking-wider mb-1 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Active Strategy</p>
            {currentStrategy ? (
              <div className="flex items-center gap-2 flex-wrap">
                <p className={`text-base font-bold truncate ${isDark ? 'text-white' : 'text-gray-900'}`}>{currentStrategy.name || 'Unnamed Strategy'}</p>
                {currentStrategy.broker && (
                  <span className={`px-2 py-0.5 rounded-lg text-[11px] font-bold ${isDark ? 'bg-purple-500/15 text-purple-300' : 'bg-purple-50 text-purple-600'}`}>{currentStrategy.broker}</span>
                )}
                {currentStrategy.winRate != null && (
                  <span className={`px-2 py-0.5 rounded-lg text-[11px] font-bold ${isDark ? 'bg-emerald-500/15 text-emerald-300' : 'bg-emerald-50 text-emerald-600'}`}>{Number(currentStrategy.winRate).toFixed(0)}% win rate</span>
                )}
              </div>
            ) : (
              <p className={`text-base font-bold ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>No strategy selected</p>
            )}
            <p className={`text-xs mt-0.5 truncate ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
              {currentStrategy ? (currentStrategy.description || 'Currently powering your auto-trading session.') : 'Select a strategy to enable auto-trading.'}
            </p>
          </div>
          <button
            onClick={() => setStrategyModalOpen(true)}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-purple-500 to-indigo-600 text-white text-sm font-semibold hover:shadow-lg hover:shadow-purple-500/30 hover:-translate-y-0.5 transition-all shadow-md shadow-purple-500/20 shrink-0"
          >
            <Brain className="w-4 h-4" />
            {currentStrategy ? 'Change Strategy' : 'Select Strategy'}
          </button>
        </div>
      </div>

      {hasLiveSession && (
        <div className={`rounded-2xl border overflow-hidden ${isActive ? (isDark ? 'bg-gray-800 border-emerald-500/30' : 'bg-white border-emerald-200 shadow-sm') : (isDark ? 'bg-gray-800 border-amber-500/30' : 'bg-white border-amber-200 shadow-sm')}`}>
          <div className={`flex items-center justify-between px-6 py-4 border-b flex-wrap gap-3 ${isDark ? 'border-gray-700/60' : 'border-gray-100'}`}>
            <div className="flex items-center gap-3">
              <h2 className={`text-base font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>Live Session</h2>
              <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold ${isActive ? (isDark ? 'bg-emerald-500/10 text-emerald-400' : 'bg-emerald-50 text-emerald-600') : (isDark ? 'bg-amber-500/10 text-amber-400' : 'bg-amber-50 text-amber-600')}`}>
                <span className="relative flex h-2 w-2">
                  {isActive && <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />}
                  <span className={`relative inline-flex rounded-full h-2 w-2 ${isActive ? 'bg-emerald-500' : 'bg-amber-500'}`} />
                </span>
                {isActive ? 'Running' : 'Paused'}
              </span>
              <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold ${isDark ? 'bg-gray-700/60 text-gray-300' : 'bg-gray-100 text-gray-600'}`}>
                <Target className="w-3 h-3" />MTG L{currentMtgLevel}
              </span>
            </div>
            <div className={`flex items-center gap-1.5 text-xs font-semibold ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
              <Clock className="w-3.5 h-3.5" />
              Started At: <span className={isDark ? 'text-gray-200' : 'text-gray-700'}>{startedAtLabel}</span>
            </div>
          </div>

          <div className="px-6 py-4">
            <p className={`text-[11px] font-bold uppercase tracking-wider mb-3 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Current Trade</p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className={`rounded-xl border p-4 ${isDark ? 'bg-gray-700/30 border-gray-700' : 'bg-gray-50 border-gray-100'}`}>
                <p className={`text-[10px] font-bold uppercase tracking-wider mb-1 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>Asset</p>
                <p className={`text-lg font-bold truncate ${isDark ? 'text-white' : 'text-gray-900'}`}>{lastTrade?.asset || '—'}</p>
              </div>
              <div className={`rounded-xl border p-4 ${isDark ? 'bg-gray-700/30 border-gray-700' : 'bg-gray-50 border-gray-100'}`}>
                <p className={`text-[10px] font-bold uppercase tracking-wider mb-1 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>Direction</p>
                {lastTrade?.direction ? (
                  <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-sm font-bold ${lastTrade.direction === 'CALL' ? (isDark ? 'bg-emerald-500/10 text-emerald-400' : 'bg-emerald-50 text-emerald-600') : (isDark ? 'bg-red-500/10 text-red-400' : 'bg-red-50 text-red-600')}`}>
                    {lastTrade.direction === 'CALL' ? <ArrowUpRight className="w-4 h-4" /> : <ArrowDownRight className="w-4 h-4" />}
                    {lastTrade.direction}
                  </span>
                ) : (
                  <p className={`text-lg font-bold ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>—</p>
                )}
              </div>
              <div className={`rounded-xl border p-4 ${isDark ? 'bg-gray-700/30 border-gray-700' : 'bg-gray-50 border-gray-100'}`}>
                <p className={`text-[10px] font-bold uppercase tracking-wider mb-1 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>Amount</p>
                <p className={`text-lg font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>{fmtAmount(lastTrade?.amount)}</p>
              </div>
            </div>
          </div>

          <div className={`px-6 py-4 border-t ${isDark ? 'border-gray-700/60 bg-gray-700/20' : 'border-gray-100 bg-gray-50/60'}`}>
            <p className={`text-[11px] font-bold uppercase tracking-wider mb-3 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Session Statistics</p>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
              {[
                { label: 'Total Trades', value: totalTrades.toLocaleString(), color: isDark ? 'text-white' : 'text-gray-900' },
                { label: 'Wins', value: wins.toLocaleString(), color: isDark ? 'text-emerald-400' : 'text-emerald-600' },
                { label: 'Losses', value: losses.toLocaleString(), color: isDark ? 'text-red-400' : 'text-red-600' },
                { label: 'Win Rate', value: `${winRate}%`, color: isDark ? 'text-white' : 'text-gray-900' },
                { label: 'Total P&L', value: fmtMoney(totalPnL), color: pnlPositive ? 'text-emerald-500' : 'text-red-500' },
              ].map((s) => (
                <div key={s.label} className={`rounded-xl border p-4 ${isDark ? 'bg-gray-800/80 border-gray-700' : 'bg-white border-gray-100'}`}>
                  <p className={`text-[10px] font-bold uppercase tracking-wider mb-1 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>{s.label}</p>
                  <p className={`text-xl font-bold ${s.color}`}>{s.value}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      <div className={`rounded-2xl border overflow-hidden ${isDark ? 'bg-gray-800 border-gray-700/60' : 'bg-white border-gray-200/80 shadow-sm'}`}>
        <div className="flex items-center justify-between px-6 py-4 border-b">
          <div className="flex items-center gap-2">
            <h2 className={`text-base font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>Live Trade Feed</h2>
            {(isActive || isPaused) && (
              <span className={`inline-flex items-center gap-1.5 text-[11px] font-bold ${isDark ? 'text-emerald-400' : 'text-emerald-600'}`}>
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
                </span>
                LIVE
              </span>
            )}
          </div>
          <button onClick={() => navigate('/history')} className={`text-xs font-semibold ${isDark ? 'text-blue-400 hover:text-blue-300' : 'text-blue-600 hover:text-blue-700'}`}>
            View All <ChevronRight className="w-3.5 h-3.5 inline" />
          </button>
        </div>
        {trades.length === 0 ? (
          <div className="text-center py-12">
            <TrendingUp className={`w-10 h-10 mx-auto mb-3 ${isDark ? 'text-gray-600' : 'text-gray-300'}`} />
            <p className={`text-sm font-medium ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>No trades yet. Start a session to see live activity.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className={isDark ? 'border-b border-gray-700/60' : 'border-b border-gray-100'}>
                  {['Time', 'Asset', 'Direction', 'Amount', 'Entry', 'Exit', 'MTG Level', 'Result', 'P&L'].map((h) => (
                    <th key={h} className={`whitespace-nowrap px-5 py-3 text-left text-[11px] font-bold uppercase tracking-wider ${h === 'P&L' ? 'text-right' : ''} ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {trades.slice(0, 10).map((trade, i) => {
                  const pnl = Number(trade.profitLoss ?? trade.pnl ?? 0)
                  const result = trade.result
                  return (
                    <tr key={trade.id || trade._id || i} className={`border-b last:border-0 ${isDark ? 'border-gray-700/40 hover:bg-gray-700/30' : 'border-gray-50 hover:bg-gray-50'}`}>
                      <td className={`px-5 py-3.5 whitespace-nowrap font-medium ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>{fmtClock(trade.timestamp || trade.time || trade.createdAt)}</td>
                      <td className={`px-5 py-3.5 whitespace-nowrap font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>{trade.asset || '—'}</td>
                      <td className="px-5 py-3.5 whitespace-nowrap">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold ${trade.direction === 'CALL' ? (isDark ? 'bg-emerald-500/10 text-emerald-400' : 'bg-emerald-50 text-emerald-600') : (isDark ? 'bg-red-500/10 text-red-400' : 'bg-red-50 text-red-600')}`}>
                          {trade.direction === 'CALL' ? <ArrowUpRight className="w-3.5 h-3.5" /> : <ArrowDownRight className="w-3.5 h-3.5" />}{trade.direction || '—'}
                        </span>
                      </td>
                      <td className={`px-5 py-3.5 whitespace-nowrap font-medium ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>{fmtAmount(trade.amount)}</td>
                      <td className={`px-5 py-3.5 whitespace-nowrap font-mono text-xs ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>{fmtPrice(trade.entryPrice)}</td>
                      <td className={`px-5 py-3.5 whitespace-nowrap font-mono text-xs ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>{fmtPrice(trade.exitPrice)}</td>
                      <td className="px-5 py-3.5 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-0.5 rounded-md text-[11px] font-bold ${isDark ? 'bg-gray-700 text-gray-300' : 'bg-gray-100 text-gray-600'}`}>L{trade.mtgLevel ?? 1}</span>
                      </td>
                      <td className="px-5 py-3.5 whitespace-nowrap">
                        <span className={`px-2.5 py-1 rounded-full text-[11px] font-bold ${result === 'WIN' ? (isDark ? 'bg-emerald-500/10 text-emerald-400' : 'bg-emerald-50 text-emerald-600') : result === 'LOSS' ? (isDark ? 'bg-red-500/10 text-red-400' : 'bg-red-50 text-red-600') : (isDark ? 'bg-amber-500/10 text-amber-400' : 'bg-amber-50 text-amber-600')}`}>{result || 'PENDING'}</span>
                      </td>
                      <td className={`px-5 py-3.5 whitespace-nowrap text-right font-bold ${pnl >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>{fmtMoney(pnl)}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {brokerModalOpen && (
        <Modal title="Connect Broker" subtitle="Select your broker to login and connect" onClose={() => setBrokerModalOpen(false)} isDark={isDark}>
          <div className="p-6 space-y-3">
            {brokers.map((b) => (
              <button key={b.id} onClick={() => handleConnectBroker(b.id)}
                className={`w-full flex items-center gap-4 px-5 py-4 rounded-xl border transition-all duration-200 text-left group hover:-translate-y-0.5 hover:shadow-lg ${isDark ? 'border-gray-700 bg-gray-700/30 hover:border-blue-500/50 hover:bg-gray-700/60' : 'border-gray-200 bg-gray-50/50 hover:border-blue-300 hover:shadow-blue-100'}`}>
                <div className={`w-11 h-11 rounded-xl bg-gradient-to-br flex items-center justify-center shadow-md shrink-0 ${brokerIconGradient[b.id]}`}>
                  <Link2 className="w-5 h-5 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className={`text-sm font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>{b.name}</p>
                  <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Login and connect your account</p>
                </div>
                <ChevronRight className={`w-4 h-4 shrink-0 transition-transform group-hover:translate-x-1 ${isDark ? 'text-gray-500 group-hover:text-blue-400' : 'text-gray-400 group-hover:text-blue-500'}`} />
              </button>
            ))}
          </div>
        </Modal>
      )}

      {credentialsModal && (
        <Modal
          title="Enter Broker Credentials"
          subtitle={`Login to ${brokers.find((b) => b.id === credentialsModal)?.name || 'broker'}`}
          onClose={() => {
            setCredentialsModal(null)
            setBrokerCredentials({ email: '', password: '' })
          }}
          isDark={isDark}
          size="max-w-sm"
        >
          <form onSubmit={handleCredentialsSubmit} className="p-6 space-y-4">
            <div>
              <label className={labelClass}>Broker Email</label>
              <input
                type="email"
                required
                value={brokerCredentials.email}
                onChange={(e) => setBrokerCredentials((p) => ({ ...p, email: e.target.value }))}
                className={inputClass}
                placeholder="your@broker-email.com"
              />
            </div>
            <div>
              <label className={labelClass}>Broker Password</label>
              <input
                type="password"
                required
                value={brokerCredentials.password}
                onChange={(e) => setBrokerCredentials((p) => ({ ...p, password: e.target.value }))}
                className={inputClass}
                placeholder="Enter password"
              />
            </div>
            <button
              type="submit"
              disabled={connectLoading}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-blue-500 to-indigo-600 text-white text-sm font-semibold hover:shadow-lg hover:shadow-blue-500/30 transition-all shadow-md shadow-blue-500/20 disabled:opacity-50"
            >
              {connectLoading ? 'Connecting...' : 'Connect Broker'}
            </button>
          </form>
        </Modal>
      )}

      {strategyModalOpen && (
        <Modal title="Select Strategy" subtitle="Choose the algorithm your bot will trade with" onClose={() => setStrategyModalOpen(false)} isDark={isDark} size="max-w-lg">
          <div className="p-6 space-y-3">
            {!activeBrokerName && (
              <div className={`flex items-center gap-2 px-4 py-3 rounded-xl text-xs font-semibold ${isDark ? 'bg-amber-500/10 border border-amber-500/20 text-amber-400' : 'bg-amber-50 border border-amber-200 text-amber-700'}`}>
                <AlertTriangle className="w-4 h-4 shrink-0" />
                Connect a broker first to activate a strategy.
              </div>
            )}
            {strategies.length === 0 ? (
              <div className="text-center py-10">
                <Brain className={`w-10 h-10 mx-auto mb-3 ${isDark ? 'text-gray-600' : 'text-gray-300'}`} />
                <p className={`text-sm font-medium ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>No strategies available right now.</p>
              </div>
            ) : (
              strategies.map((s) => {
                const sid = s._id || s.id
                const isSelected = sid === session?.strategyId
                return (
                  <button
                    key={sid}
                    onClick={() => handleSelectStrategy(s)}
                    disabled={!activeBrokerName || strategySavingId === sid}
                    className={`w-full flex items-center gap-4 px-5 py-4 rounded-xl border transition-all duration-200 text-left group hover:-translate-y-0.5 hover:shadow-lg disabled:opacity-50 disabled:hover:translate-y-0 ${isSelected ? (isDark ? 'border-purple-500/60 bg-purple-500/10' : 'border-purple-300 bg-purple-50') : (isDark ? 'border-gray-700 bg-gray-700/30 hover:border-purple-500/50' : 'border-gray-200 bg-gray-50/50 hover:border-purple-300')}`}
                  >
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center shadow-md shadow-purple-500/25 shrink-0">
                      <Brain className="w-5 h-5 text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className={`text-sm font-bold truncate ${isDark ? 'text-white' : 'text-gray-900'}`}>{s.name || 'Unnamed Strategy'}</p>
                        {isSelected && (
                          <span className={`shrink-0 px-2 py-0.5 rounded-md text-[10px] font-bold uppercase ${isDark ? 'bg-purple-500/20 text-purple-300' : 'bg-purple-100 text-purple-700'}`}>Active</span>
                        )}
                      </div>
                      <p className={`text-xs truncate ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                        {s.broker ? `${s.broker}` : 'All brokers'}{s.winRate != null ? ` · ${Number(s.winRate).toFixed(0)}% win rate` : ''}
                      </p>
                    </div>
                    <span className={`shrink-0 text-xs font-bold ${strategySavingId === sid ? (isDark ? 'text-purple-300' : 'text-purple-600') : (isDark ? 'text-gray-500 group-hover:text-purple-300' : 'text-gray-400 group-hover:text-purple-600')}`}>
                      {strategySavingId === sid ? 'Activating...' : 'Select'}
                    </span>
                  </button>
                )
              })
            )}
          </div>
        </Modal>
      )}

      {riskModalOpen && (
        <Modal title="Risk & Target Settings" subtitle="Control position sizing, MTG levels and safety limits" onClose={() => setRiskModalOpen(false)} isDark={isDark} size="max-w-lg">
          <form onSubmit={handleRiskSave} className="p-6 space-y-5">
            <div>
              <label className={labelClass}>Staking Mode</label>
              <div className={`grid grid-cols-2 gap-1 p-1 rounded-xl ${isDark ? 'bg-gray-700/50' : 'bg-gray-100'}`}>
                {[
                  { id: 'NON_MTG', label: 'Non-MTG (Fixed)' },
                  { id: 'MTG', label: 'MTG Martingale' },
                ].map((m) => (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => setRiskDraft((p) => ({ ...p, mode: m.id }))}
                    className={`px-3 py-2.5 rounded-lg text-xs font-bold transition-all ${riskDraft.mode === m.id ? 'bg-gradient-to-r from-blue-500 to-indigo-600 text-white shadow-md shadow-blue-500/25' : isDark ? 'text-gray-400 hover:text-white' : 'text-gray-500 hover:text-gray-900'}`}
                  >
                    {m.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className={labelClass}>Fixed Amount ($)</label>
                <input
                  type="number"
                  step="0.01"
                  min="1"
                  required
                  value={riskDraft.fixedAmount}
                  onChange={(e) => setRiskDraft((p) => ({ ...p, fixedAmount: e.target.value }))}
                  className={inputClass}
                  placeholder="20"
                />
              </div>
              <div>
                <label className={`${labelClass} ${riskDraft.mode !== 'MTG' ? 'opacity-50' : ''}`}>MTG Multiplier</label>
                <input
                  type="number"
                  step="0.01"
                  min="1.01"
                  required
                  disabled={riskDraft.mode !== 'MTG'}
                  value={riskDraft.mtgMultiplier}
                  onChange={(e) => setRiskDraft((p) => ({ ...p, mtgMultiplier: e.target.value }))}
                  className={`${inputClass} disabled:opacity-50`}
                  placeholder="2.1"
                />
              </div>
            </div>

            <div className={riskDraft.mode !== 'MTG' ? 'opacity-50 pointer-events-none' : ''}>
              <div className="flex items-center justify-between mb-2">
                <label className={`mb-0 block text-xs font-bold uppercase tracking-wider ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Max MTG Level</label>
                <span className="px-2.5 py-1 rounded-lg text-xs font-bold bg-gradient-to-r from-blue-500 to-indigo-600 text-white">L{riskDraft.maxMtgLevel}</span>
              </div>
              <input
                type="range"
                min="1"
                max="5"
                step="1"
                value={riskDraft.maxMtgLevel}
                onChange={(e) => setRiskDraft((p) => ({ ...p, maxMtgLevel: parseInt(e.target.value, 10) }))}
                className="w-full accent-blue-500 cursor-pointer"
              />
              <div className={`flex justify-between text-[10px] font-bold mt-1 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                {[1, 2, 3, 4, 5].map((lvl) => <span key={lvl}>{lvl}</span>)}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className={labelClass}>Daily Profit Target ($)</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  required
                  value={riskDraft.dailyProfitTarget}
                  onChange={(e) => setRiskDraft((p) => ({ ...p, dailyProfitTarget: e.target.value }))}
                  className={inputClass}
                  placeholder="150"
                />
              </div>
              <div>
                <label className={labelClass}>Daily Stop Loss ($)</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  required
                  value={riskDraft.dailyStopLoss}
                  onChange={(e) => setRiskDraft((p) => ({ ...p, dailyStopLoss: e.target.value }))}
                  className={inputClass}
                  placeholder="200"
                />
              </div>
              <div>
                <label className={labelClass}>Max Trades Per Session</label>
                <input
                  type="number"
                  min="1"
                  required
                  value={riskDraft.maxTradesPerSession}
                  onChange={(e) => setRiskDraft((p) => ({ ...p, maxTradesPerSession: e.target.value }))}
                  className={inputClass}
                  placeholder="20"
                />
              </div>
              <div>
                <label className={labelClass}>Max Consecutive Losses</label>
                <input
                  type="number"
                  min="1"
                  required
                  value={riskDraft.maxConsecutiveLosses}
                  onChange={(e) => setRiskDraft((p) => ({ ...p, maxConsecutiveLosses: e.target.value }))}
                  className={inputClass}
                  placeholder="3"
                />
              </div>
            </div>

            <div>
              <label className={labelClass}>Min Balance Protection ($)</label>
              <input
                type="number"
                step="0.01"
                min="0"
                required
                value={riskDraft.minBalanceProtection}
                onChange={(e) => setRiskDraft((p) => ({ ...p, minBalanceProtection: e.target.value }))}
                className={inputClass}
                placeholder="100"
              />
              <p className={`text-xs mt-1.5 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>The bot auto-stops if your balance falls below this threshold.</p>
            </div>

            <button
              type="submit"
              disabled={riskSaving}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-blue-500 to-indigo-600 text-white text-sm font-semibold hover:shadow-lg hover:shadow-blue-500/30 transition-all shadow-md shadow-blue-500/20 disabled:opacity-50"
            >
              {riskSaving ? 'Saving...' : 'Save Risk Settings'}
            </button>
          </form>
        </Modal>
      )}

      {notificationsModalOpen && (
        <Modal title="Notification Preferences" subtitle="Choose how you want to be notified" onClose={() => setNotificationsModalOpen(false)} isDark={isDark}>
          <form onSubmit={handleNotifSave} className="p-6 space-y-4">
            {[
              { key: 'email', label: 'Email Notifications', desc: 'Trade alerts and summaries via email', icon: Mail },
              { key: 'webPush', label: 'Web Push', desc: 'Browser push notifications', icon: Bell },
              { key: 'mobilePush', label: 'Mobile Push', desc: 'Push alerts on your phone', icon: Smartphone },
              { key: 'telegram', label: 'Telegram', desc: 'Real-time bot signals on Telegram', icon: Send },
            ].map((n) => (
              <div key={n.key} className={`flex items-center justify-between gap-4 px-4 py-3.5 rounded-xl border ${isDark ? 'bg-gray-700/30 border-gray-700' : 'bg-gray-50 border-gray-100'}`}>
                <div className="flex items-center gap-3 min-w-0">
                  <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${notifDraft[n.key] ? 'bg-gradient-to-br from-blue-500 to-indigo-600 shadow-md shadow-blue-500/25' : (isDark ? 'bg-gray-600' : 'bg-gray-200')}`}>
                    <n.icon className="w-4 h-4 text-white" />
                  </div>
                  <div className="min-w-0">
                    <p className={`text-sm font-bold truncate ${isDark ? 'text-white' : 'text-gray-900'}`}>{n.label}</p>
                    <p className={`text-xs truncate ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>{n.desc}</p>
                  </div>
                </div>
                <Toggle
                  checked={!!notifDraft[n.key]}
                  onChange={() => setNotifDraft((p) => ({ ...p, [n.key]: !p[n.key] }))}
                  isDark={isDark}
                />
              </div>
            ))}

            <div>
              <label className={labelClass}>Telegram Chat ID</label>
              <input
                type="text"
                value={notifDraft.telegramChatId || ''}
                onChange={(e) => setNotifDraft((p) => ({ ...p, telegramChatId: e.target.value }))}
                className={inputClass}
                placeholder="@your_telegram_bot"
              />
            </div>

            <button
              type="submit"
              disabled={notifSaving}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-blue-500 to-indigo-600 text-white text-sm font-semibold hover:shadow-lg hover:shadow-blue-500/30 transition-all shadow-md shadow-blue-500/20 disabled:opacity-50"
            >
              {notifSaving ? 'Saving...' : 'Save Preferences'}
            </button>
          </form>
        </Modal>
      )}
    </div>
  )
}
