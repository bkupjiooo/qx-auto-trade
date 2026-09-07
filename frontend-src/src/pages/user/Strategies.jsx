import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '../../AuthContext'
import { useTheme } from '../../ThemeContext'
import { useToast } from '../../components/Toast'
import { api } from '../../api'
import {
  Brain,
  ChevronDown,
  Clock,
  Activity,
  Target,
  SlidersHorizontal,
} from 'lucide-react'

const brokerFilters = ['All', 'Quotex', 'PocketOption', 'OlympTrade', 'GuruTrade7']

const brokerMeta = {
  quotex: {
    iconGradient: 'from-indigo-500 to-violet-600',
    iconShadow: 'shadow-indigo-500/25',
    badgeLight: 'bg-indigo-50 text-indigo-700 ring-indigo-600/10',
    badgeDark: 'bg-indigo-500/15 text-indigo-300 ring-indigo-400/20',
  },
  pocketoption: {
    iconGradient: 'from-sky-500 to-blue-600',
    iconShadow: 'shadow-sky-500/25',
    badgeLight: 'bg-sky-50 text-sky-700 ring-sky-600/10',
    badgeDark: 'bg-sky-500/15 text-sky-300 ring-sky-400/20',
  },
  olymptrade: {
    iconGradient: 'from-emerald-500 to-teal-600',
    iconShadow: 'shadow-emerald-500/25',
    badgeLight: 'bg-emerald-50 text-emerald-700 ring-emerald-600/10',
    badgeDark: 'bg-emerald-500/15 text-emerald-300 ring-emerald-400/20',
  },
  gurutrade7: {
    iconGradient: 'from-amber-500 to-orange-600',
    iconShadow: 'shadow-amber-500/25',
    badgeLight: 'bg-amber-50 text-amber-700 ring-amber-600/10',
    badgeDark: 'bg-amber-500/15 text-amber-300 ring-amber-400/20',
  },
}

const PROGRESS_BUCKETS = [
  'w-0', 'w-[10%]', 'w-[20%]', 'w-[30%]', 'w-[40%]', 'w-[50%]',
  'w-[60%]', 'w-[70%]', 'w-[80%]', 'w-[90%]', 'w-full',
]

function getProgressWidth(rate) {
  const pct = Math.max(0, Math.min(100, Math.round(parseFloat(rate) || 0)))
  return PROGRESS_BUCKETS[Math.round(pct / 10)]
}

function getBarGradient(rate) {
  const pct = parseFloat(rate) || 0
  if (pct >= 70) return 'from-emerald-500 to-teal-500'
  if (pct >= 50) return 'from-blue-500 to-indigo-600'
  return 'from-amber-500 to-orange-500'
}

export default function Strategies() {
  const { user } = useAuth()
  const { theme } = useTheme()
  const { toast } = useToast()
  const isDark = theme === 'dark'
  const [strategies, setStrategies] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('All')
  const [expandedId, setExpandedId] = useState(null)
  const [togglingId, setTogglingId] = useState(null)

  const fetchStrategies = useCallback(async () => {
    try {
      const params = filter !== 'All' ? { broker: filter } : undefined
      const data = await api.getStrategies(params)
      setStrategies(Array.isArray(data) ? data : data?.strategies || [])
    } catch {
      // silently fail
    } finally {
      setLoading(false)
    }
  }, [filter])

  useEffect(() => {
    fetchStrategies()
  }, [fetchStrategies])

  useEffect(() => {
    const handleVisible = () => { if (document.visibilityState === 'visible') fetchStrategies() }
    document.addEventListener('visibilitychange', handleVisible)
    return () => document.removeEventListener('visibilitychange', handleVisible)
  }, [fetchStrategies])

  const toggleStrategy = async (strategy) => {
    const id = strategy._id || strategy.id
    setTogglingId(id)
    try {
      await api.saveStrategy({
        strategyId: id,
        isActive: !strategy.isActive,
        userId: user?.id,
      })
      setStrategies((prev) =>
        prev.map((s) => ((s._id || s.id) === id ? { ...s, isActive: !s.isActive } : s))
      )
      toast(strategy.isActive ? 'Strategy deactivated' : 'Strategy activated', 'success')
    } catch {
      toast('Failed to update strategy', 'error')
    }
    setTogglingId(null)
  }

  const activeCount = strategies.filter((s) => s.isActive).length

  const metaFor = (broker) => {
    const key = String(broker || '').toLowerCase().replace(/[^a-z]/g, '')
    return (
      brokerMeta[key] || {
        iconGradient: isDark ? 'from-gray-600 to-gray-700' : 'from-gray-400 to-gray-500',
        iconShadow: 'shadow-gray-500/15',
        badgeLight: 'bg-gray-100 text-gray-600 ring-gray-500/10',
        badgeDark: 'bg-gray-700 text-gray-300 ring-gray-500/20',
      }
    )
  }

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className={`h-9 w-72 rounded-xl ${isDark ? 'bg-gray-800' : 'bg-gray-200'}`} />
        <div className={`h-4 w-52 rounded-lg ${isDark ? 'bg-gray-800' : 'bg-gray-100'}`} />
        <div className={`h-12 w-full max-w-xl rounded-xl mt-4 ${isDark ? 'bg-gray-800' : 'bg-gray-100'}`} />
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 pt-2">
          {[...Array(4)].map((_, i) => (
            <div key={i} className={`h-56 rounded-2xl ${isDark ? 'bg-gray-800' : 'bg-gray-100'}`} />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className={`text-2xl sm:text-3xl font-bold tracking-tight ${isDark ? 'text-white' : 'text-gray-900'}`}>
            Trading Strategies
          </h1>
          <p className={`text-sm mt-1.5 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
            Configure and monitor your automated trading algorithms.
          </p>
        </div>
        {strategies.length > 0 && (
          <span className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold w-fit ${isDark ? 'bg-emerald-500/10 text-emerald-400 ring-1 ring-emerald-500/20' : 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-600/10'}`}>
            <Activity className="w-3.5 h-3.5" />
            {activeCount} of {strategies.length} active
          </span>
        )}
      </div>

      {/* Segmented Filter Bar */}
      <div className={`inline-flex items-center gap-1 p-1.5 rounded-xl max-w-full overflow-x-auto ${isDark ? 'bg-gray-800 ring-1 ring-gray-700/60' : 'bg-gray-100 ring-1 ring-gray-200/60'}`}>
        {brokerFilters.map((b) => (
          <button
            key={b}
            onClick={() => setFilter(b)}
            className={`px-4 py-2 rounded-lg text-sm font-semibold whitespace-nowrap transition-all duration-200 ${
              filter === b
                ? isDark
                  ? 'bg-gray-700 text-white shadow-md shadow-black/20'
                  : 'bg-white text-gray-900 shadow-sm'
                : isDark
                  ? 'text-gray-400 hover:text-gray-200 hover:bg-gray-700/50'
                  : 'text-gray-500 hover:text-gray-800 hover:bg-gray-200/60'
            }`}
          >
            {b}
          </button>
        ))}
      </div>

      {/* Strategy Cards */}
      {strategies.length === 0 ? (
        <div className={`rounded-2xl border border-dashed p-16 text-center transition-shadow duration-300 hover:shadow-lg ${isDark ? 'bg-gray-800/50 border-gray-700' : 'bg-white border-gray-200 shadow-sm'}`}>
          <div className={`w-16 h-16 rounded-2xl mx-auto mb-5 flex items-center justify-center bg-gradient-to-br ${isDark ? 'from-gray-700 to-gray-800' : 'from-gray-100 to-gray-200'} shadow-inner`}>
            <Brain className={`w-8 h-8 ${isDark ? 'text-gray-500' : 'text-gray-400'}`} />
          </div>
          <p className={`text-base font-bold mb-1 ${isDark ? 'text-gray-200' : 'text-gray-800'}`}>No strategies found</p>
          <p className={`text-sm ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
            Try selecting a different broker filter to see available strategies.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {strategies.map((strategy) => {
            const id = strategy._id || strategy.id
            const isExpanded = expandedId === id
            const meta = metaFor(strategy.broker)

            return (
              <div
                key={id}
                className={`rounded-2xl border p-6 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl ${isDark ? 'bg-gray-800 border-gray-700/60 hover:border-gray-600' : 'bg-white border-gray-200/80 shadow-sm hover:shadow-gray-200'}`}
              >
                {/* Card Header */}
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-center gap-3.5 min-w-0">
                    <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${meta.iconGradient} flex items-center justify-center shadow-lg ${meta.iconShadow} shrink-0`}>
                      <Brain className="w-5 h-5 text-white" />
                    </div>
                    <div className="min-w-0">
                      <h3 className={`text-sm font-bold truncate ${isDark ? 'text-white' : 'text-gray-900'}`}>
                        {strategy.name}
                      </h3>
                      <span className={`inline-flex items-center mt-1 px-2 py-0.5 rounded-md text-[11px] font-semibold ring-1 ${isDark ? meta.badgeDark : meta.badgeLight}`}>
                        {strategy.broker || 'All Brokers'}
                      </span>
                    </div>
                  </div>

                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      toggleStrategy(strategy)
                    }}
                    disabled={togglingId === id}
                    aria-label={strategy.isActive ? 'Deactivate strategy' : 'Activate strategy'}
                    className={`relative w-11 h-6 rounded-full shrink-0 transition-colors duration-200 ${
                      strategy.isActive
                        ? 'bg-emerald-500 shadow-inner shadow-emerald-900/20'
                        : isDark ? 'bg-gray-600' : 'bg-gray-300'
                    } ${togglingId === id ? 'opacity-50 cursor-wait' : ''}`}
                  >
                    <span
                      className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow-md transition-transform duration-200 ${
                        strategy.isActive ? 'translate-x-5' : ''
                      }`}
                    />
                  </button>
                </div>

                {/* Win Rate */}
                <div className="mt-6">
                  <div className="flex items-center justify-between mb-2">
                    <span className={`inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                      <Target className="w-3.5 h-3.5" />
                      Win Rate
                    </span>
                    <span className={`text-sm font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                      {strategy.winRate != null ? `${strategy.winRate}%` : '—'}
                    </span>
                  </div>
                  <div className={`h-2 rounded-full overflow-hidden ${isDark ? 'bg-gray-700' : 'bg-gray-100'}`}>
                    <div
                      className={`h-full rounded-full bg-gradient-to-r ${getBarGradient(strategy.winRate)} ${getProgressWidth(strategy.winRate)} transition-all duration-700 ease-out`}
                    />
                  </div>
                </div>

                {/* Meta Row */}
                <div className="mt-5 flex items-center gap-2 flex-wrap">
                  {strategy.timeframe && (
                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold ${isDark ? 'bg-gray-700/70 text-gray-300' : 'bg-gray-100 text-gray-600'}`}>
                      <Clock className="w-3.5 h-3.5" />
                      {strategy.timeframe}
                    </span>
                  )}
                  <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold ${
                    strategy.isActive
                      ? isDark ? 'bg-emerald-500/10 text-emerald-400' : 'bg-emerald-50 text-emerald-600'
                      : isDark ? 'bg-gray-700/70 text-gray-400' : 'bg-gray-100 text-gray-400'
                  }`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${strategy.isActive ? 'bg-emerald-500 animate-pulse' : isDark ? 'bg-gray-500' : 'bg-gray-400'}`} />
                    {strategy.isActive ? 'Active' : 'Inactive'}
                  </span>
                  <button
                    onClick={() => setExpandedId(isExpanded ? null : id)}
                    className={`ml-auto inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors ${isDark ? 'text-blue-400 hover:bg-blue-500/10' : 'text-blue-600 hover:bg-blue-50'}`}
                  >
                    <SlidersHorizontal className="w-3.5 h-3.5" />
                    Details
                    <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`} />
                  </button>
                </div>

                {/* Expanded Details */}
                {isExpanded && (
                  <div className={`mt-5 pt-5 border-t ${isDark ? 'border-gray-700/60' : 'border-gray-100'}`}>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                      {strategy.parameters ? (
                        Object.entries(strategy.parameters).map(([key, value]) => (
                          <div key={key} className={`rounded-xl p-3.5 ${isDark ? 'bg-gray-700/40' : 'bg-gray-50'}`}>
                            <p className={`text-[10px] font-bold uppercase tracking-wider mb-1 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                              {key.replace(/([A-Z])/g, ' $1').trim()}
                            </p>
                            <p className={`text-sm font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                              {typeof value === 'boolean' ? (value ? 'On' : 'Off') : String(value)}
                            </p>
                          </div>
                        ))
                      ) : (
                        <>
                          {strategy.rsi != null && (
                            <div className={`rounded-xl p-3.5 ${isDark ? 'bg-gray-700/40' : 'bg-gray-50'}`}>
                              <p className={`text-[10px] font-bold uppercase tracking-wider mb-1 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>RSI Period</p>
                              <p className={`text-sm font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>{strategy.rsi}</p>
                            </div>
                          )}
                          {strategy.ema != null && (
                            <div className={`rounded-xl p-3.5 ${isDark ? 'bg-gray-700/40' : 'bg-gray-50'}`}>
                              <p className={`text-[10px] font-bold uppercase tracking-wider mb-1 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>EMA Period</p>
                              <p className={`text-sm font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>{strategy.ema}</p>
                            </div>
                          )}
                          {strategy.macd != null && (
                            <div className={`rounded-xl p-3.5 ${isDark ? 'bg-gray-700/40' : 'bg-gray-50'}`}>
                              <p className={`text-[10px] font-bold uppercase tracking-wider mb-1 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>MACD</p>
                              <p className={`text-sm font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>{strategy.macd}</p>
                            </div>
                          )}
                        </>
                      )}
                    </div>

                    {strategy.description && (
                      <div className={`mt-4 rounded-xl p-4 ${isDark ? 'bg-gray-700/40' : 'bg-gray-50'}`}>
                        <p className={`text-[10px] font-bold uppercase tracking-wider mb-1.5 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Description</p>
                        <p className={`text-sm leading-relaxed ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>{strategy.description}</p>
                      </div>
                    )}

                    <div className="mt-4 flex items-center gap-2">
                      <Activity className={`w-3.5 h-3.5 ${strategy.isActive ? 'text-emerald-500' : isDark ? 'text-gray-500' : 'text-gray-400'}`} />
                      <span className={`text-xs font-semibold ${strategy.isActive ? 'text-emerald-500' : isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                        {strategy.isActive ? 'Active — executing trades in live session' : 'Inactive — not participating in trading'}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
