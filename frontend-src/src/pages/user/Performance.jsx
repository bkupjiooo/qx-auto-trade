import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '../../AuthContext'
import { useTheme } from '../../ThemeContext'
import { api } from '../../api'
import { BarChart3, Trophy, DollarSign, ArrowUpRight, Target, TrendingUp, TrendingDown } from 'lucide-react'

export default function Performance() {
  const { user } = useAuth()
  const { theme } = useTheme()
  const isDark = theme === 'dark'
  const userId = user?.id
  const [session, setSession] = useState(null)
  const [loading, setLoading] = useState(true)

  const fetchData = useCallback(async () => {
    if (!userId) return
    try {
      const data = await api.getTradingSession(userId)
      setSession(data)
    } catch {}
    setLoading(false)
  }, [userId])

  useEffect(() => { fetchData() }, [fetchData])

  useEffect(() => {
    const handleVisible = () => { if (document.visibilityState === 'visible') fetchData() }
    document.addEventListener('visibilitychange', handleVisible)
    return () => document.removeEventListener('visibilitychange', handleVisible)
  }, [fetchData])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className={`animate-spin rounded-full h-8 w-8 border-b-2 ${isDark ? 'border-blue-400' : 'border-blue-600'}`} />
      </div>
    )
  }

  const trades = session?.recentTrades || []
  const totalTrades = session?.totalTrades ?? trades.length
  const wins = session?.wins ?? trades.filter((t) => t.result === 'WIN').length
  const losses = session?.losses ?? trades.filter((t) => t.result === 'LOSS').length
  const winRate = totalTrades > 0 ? ((wins / totalTrades) * 100).toFixed(1) : '0.0'
  const totalPnL = session?.totalPnL ?? trades.reduce((s, t) => s + (t.pnl || 0), 0)
  const bestTrade = trades.length > 0 ? Math.max(...trades.map((t) => t.pnl || 0)) : 0
  const avgTrade = totalTrades > 0 ? (totalPnL / totalTrades).toFixed(2) : '0.00'

  const summaryStats = [
    { label: 'Total Trades', value: totalTrades, icon: BarChart3, gradient: 'from-blue-500 to-indigo-500', shadow: 'shadow-blue-500/20' },
    { label: 'Win Rate', value: `${winRate}%`, icon: Trophy, gradient: 'from-amber-500 to-orange-500', shadow: 'shadow-amber-500/20' },
    { label: 'Total P&L', value: `$${Number(totalPnL).toFixed(2)}`, icon: DollarSign, gradient: totalPnL >= 0 ? 'from-emerald-500 to-teal-500' : 'from-red-500 to-rose-500', shadow: totalPnL >= 0 ? 'shadow-emerald-500/20' : 'shadow-red-500/20', valueColor: totalPnL >= 0 ? 'text-emerald-500' : 'text-red-500' },
    { label: 'Best Trade', value: `$${Number(bestTrade).toFixed(2)}`, icon: ArrowUpRight, gradient: 'from-emerald-500 to-teal-500', shadow: 'shadow-emerald-500/20' },
    { label: 'Avg Trade', value: `$${avgTrade}`, icon: Target, gradient: 'from-cyan-500 to-blue-500', shadow: 'shadow-cyan-500/20' },
  ]

  const dailyPnL = {}
  trades.forEach((t) => {
    const d = t.date || t.createdAt
    const day = d ? new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : 'Unknown'
    dailyPnL[day] = (dailyPnL[day] || 0) + (t.pnl || 0)
  })
  const dailyEntries = Object.entries(dailyPnL).slice(-7)
  const maxAbsPnL = Math.max(...dailyEntries.map(([, v]) => Math.abs(v)), 1)

  const strategyBreakdown = {}
  trades.forEach((t) => {
    const name = t.strategy || 'Default'
    if (!strategyBreakdown[name]) strategyBreakdown[name] = { total: 0, wins: 0, pnl: 0 }
    strategyBreakdown[name].total++
    if (t.result === 'WIN') strategyBreakdown[name].wins++
    strategyBreakdown[name].pnl += t.pnl || 0
  })

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className={`text-2xl font-bold tracking-tight ${isDark ? 'text-gray-100' : 'text-gray-900'}`}>
          Performance
        </h1>
        <p className={`text-sm mt-1 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
          Analyze your trading results
        </p>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        {summaryStats.map((stat) => (
          <div
            key={stat.label}
            className={`rounded-2xl border p-5 ${isDark ? 'bg-gray-800 border-gray-700/50' : 'bg-white border-gray-200 shadow-sm'}`}
          >
            <div className="flex items-center justify-between mb-3">
              <span className={`text-xs font-semibold uppercase tracking-wider ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                {stat.label}
              </span>
              <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${stat.gradient} flex items-center justify-center shadow-lg ${stat.shadow}`}>
                <stat.icon className="w-5 h-5 text-white" />
              </div>
            </div>
            <p className={`text-2xl font-bold tracking-tight ${stat.valueColor || (isDark ? 'text-gray-100' : 'text-gray-900')}`}>
              {stat.value}
            </p>
          </div>
        ))}
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Daily P&L Bar Chart */}
        <div className={`rounded-2xl border p-6 ${isDark ? 'bg-gray-800 border-gray-700/50' : 'bg-white border-gray-200 shadow-sm'}`}>
          <h2 className={`text-base font-semibold mb-5 ${isDark ? 'text-gray-100' : 'text-gray-900'}`}>Daily P&amp;L</h2>
          {dailyEntries.length === 0 ? (
            <div className={`flex items-center justify-center h-40 text-sm ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
              No data yet
            </div>
          ) : (
            <div className="flex items-end gap-2 h-48">
              {dailyEntries.map(([day, pnl]) => {
                const height = Math.max((Math.abs(pnl) / maxAbsPnL) * 100, 4)
                return (
                  <div key={day} className="flex-1 flex flex-col items-center gap-1.5">
                    <span className={`text-[10px] font-semibold ${pnl >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>
                      {pnl >= 0 ? '+' : ''}{pnl.toFixed(0)}
                    </span>
                    <div
                      className={`w-full rounded-lg transition-all ${pnl >= 0 ? 'bg-gradient-to-t from-emerald-500 to-emerald-400' : 'bg-gradient-to-t from-red-500 to-red-400'}`}
                      style={{ height: `${height}%` }}
                    />
                    <span className={`text-[10px] font-medium ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>{day}</span>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Win/Loss Ratio */}
        <div className={`rounded-2xl border p-6 ${isDark ? 'bg-gray-800 border-gray-700/50' : 'bg-white border-gray-200 shadow-sm'}`}>
          <h2 className={`text-base font-semibold mb-5 ${isDark ? 'text-gray-100' : 'text-gray-900'}`}>Win / Loss Ratio</h2>
          {totalTrades === 0 ? (
            <div className={`flex items-center justify-center h-40 text-sm ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
              No data yet
            </div>
          ) : (
            <div className="space-y-5">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-semibold text-emerald-500 flex items-center gap-1">
                    <TrendingUp className="w-3 h-3" />
                    Wins
                  </span>
                  <span className={`text-xs font-medium ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                    {wins} ({winRate}%)
                  </span>
                </div>
                <div className={`h-3 rounded-full overflow-hidden ${isDark ? 'bg-gray-700' : 'bg-gray-100'}`}>
                  <div
                    className="h-full bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full transition-all"
                    style={{ width: `${winRate}%` }}
                  />
                </div>
              </div>
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-semibold text-red-500 flex items-center gap-1">
                    <TrendingDown className="w-3 h-3" />
                    Losses
                  </span>
                  <span className={`text-xs font-medium ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                    {losses} ({(100 - Number(winRate)).toFixed(1)}%)
                  </span>
                </div>
                <div className={`h-3 rounded-full overflow-hidden ${isDark ? 'bg-gray-700' : 'bg-gray-100'}`}>
                  <div
                    className="h-full bg-gradient-to-r from-red-500 to-rose-500 rounded-full transition-all"
                    style={{ width: `${100 - Number(winRate)}%` }}
                  />
                </div>
              </div>
              <div className={`grid grid-cols-3 gap-3 pt-4 border-t ${isDark ? 'border-gray-700/50' : 'border-gray-100'}`}>
                <div className="text-center">
                  <p className={`text-xl font-bold ${isDark ? 'text-gray-100' : 'text-gray-900'}`}>{wins}</p>
                  <p className={`text-xs font-medium ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Wins</p>
                </div>
                <div className="text-center">
                  <p className={`text-xl font-bold ${isDark ? 'text-gray-100' : 'text-gray-900'}`}>{losses}</p>
                  <p className={`text-xs font-medium ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Losses</p>
                </div>
                <div className="text-center">
                  <p className={`text-xl font-bold ${isDark ? 'text-gray-100' : 'text-gray-900'}`}>{totalTrades}</p>
                  <p className={`text-xs font-medium ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Total</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Strategy Breakdown */}
      {Object.keys(strategyBreakdown).length > 0 && (
        <div className={`rounded-2xl border overflow-hidden ${isDark ? 'bg-gray-800 border-gray-700/50' : 'bg-white border-gray-200 shadow-sm'}`}>
          <div className={`px-6 py-4 border-b ${isDark ? 'border-gray-700/50' : 'border-gray-200'}`}>
            <h2 className={`text-base font-semibold ${isDark ? 'text-gray-100' : 'text-gray-900'}`}>Strategy Performance</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className={isDark ? 'border-b border-gray-700/50' : 'border-b border-gray-100'}>
                  {['Strategy', 'Trades', 'Win Rate', 'P&L'].map((h) => (
                    <th key={h} className={`text-left px-6 py-3 text-xs font-semibold uppercase tracking-wider ${h === 'P&L' ? 'text-right' : ''} ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {Object.entries(strategyBreakdown).map(([name, data]) => (
                  <tr
                    key={name}
                    className={`border-b last:border-0 transition-colors ${isDark ? 'border-gray-700/30 hover:bg-gray-700/30' : 'border-gray-100 hover:bg-gray-50/50'}`}
                  >
                    <td className={`px-6 py-3.5 font-semibold ${isDark ? 'text-gray-100' : 'text-gray-900'}`}>{name}</td>
                    <td className={`px-6 py-3.5 ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>{data.total}</td>
                    <td className={`px-6 py-3.5 ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                      {data.total > 0 ? ((data.wins / data.total) * 100).toFixed(1) : 0}%
                    </td>
                    <td className={`px-6 py-3.5 text-right font-semibold ${data.pnl >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>
                      {data.pnl >= 0 ? '+' : ''}${data.pnl.toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
