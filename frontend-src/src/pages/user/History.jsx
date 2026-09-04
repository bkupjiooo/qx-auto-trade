import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '../../AuthContext'
import { useTheme } from '../../ThemeContext'
import { api } from '../../api'
import {
  Clock,
  ArrowUpRight,
  ArrowDownRight,
  Download,
  FileText,
  Filter,
  Calendar,
  ChevronLeft,
  ChevronRight,
  Search,
} from 'lucide-react'

const rowsPerPage = 10

export default function History() {
  const { user } = useAuth()
  const { theme } = useTheme()
  const isDark = theme === 'dark'
  const userId = user?.id

  const [trades, setTrades] = useState([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [filters, setFilters] = useState({ broker: '', result: '', dateFrom: '', dateTo: '' })
  const [exporting, setExporting] = useState(null)

  const fetchData = useCallback(async () => {
    if (!userId) return
    try {
      const data = await api.getTradingSession(userId)
      setTrades(data?.recentTrades || [])
    } catch { /* noop */ }
    setLoading(false)
  }, [userId])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  useEffect(() => {
    const handleVisible = () => { if (document.visibilityState === 'visible') fetchData() }
    document.addEventListener('visibilitychange', handleVisible)
    return () => document.removeEventListener('visibilitychange', handleVisible)
  }, [fetchData])

  const filtered = trades.filter((t) => {
    if (filters.result && t.result !== filters.result) return false
    if (filters.broker && t.broker !== filters.broker) return false
    if (filters.dateFrom && new Date(t.date || t.createdAt) < new Date(filters.dateFrom)) return false
    if (filters.dateTo && new Date(t.date || t.createdAt) > new Date(filters.dateTo + 'T23:59:59')) return false
    return true
  }).reverse()

  const totalPages = Math.max(1, Math.ceil(filtered.length / rowsPerPage))
  const paginated = filtered.slice((page - 1) * rowsPerPage, page * rowsPerPage)

  const handleExport = async (format) => {
    setExporting(format)
    try {
      const res = await api.exportReport(userId, format)
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `trade-report.${format}`
      a.click()
      URL.revokeObjectURL(url)
    } catch { /* noop */ }
    setExporting(null)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className={`animate-spin rounded-full h-8 w-8 border-b-2 ${isDark ? 'border-blue-400' : 'border-blue-600'}`} />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className={`text-2xl font-bold tracking-tight ${isDark ? 'text-gray-100' : 'text-gray-900'}`}>
            Trade History
          </h1>
          <p className={`text-sm mt-1 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
            {filtered.length} total trades
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => handleExport('csv')}
            disabled={!!exporting}
            className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border text-sm font-semibold transition-all disabled:opacity-50 ${
              isDark
                ? 'border-gray-600 text-gray-300 hover:bg-gray-700 hover:border-gray-500'
                : 'border-gray-200 text-gray-700 hover:bg-gray-50'
            }`}
          >
            <FileText className="w-4 h-4" />
            {exporting === 'csv' ? 'Exporting...' : 'CSV'}
          </button>
          <button
            onClick={() => handleExport('pdf')}
            disabled={!!exporting}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-blue-500 to-indigo-500 text-white text-sm font-semibold hover:from-blue-600 hover:to-indigo-600 transition-all shadow-lg shadow-blue-500/20 disabled:opacity-50"
          >
            <Download className="w-4 h-4" />
            {exporting === 'pdf' ? 'Exporting...' : 'PDF'}
          </button>
        </div>
      </div>

      {/* Table Card */}
      <div className={`rounded-2xl border overflow-hidden ${isDark ? 'bg-gray-800 border-gray-700/50' : 'bg-white border-gray-200 shadow-sm'}`}>
        {/* Filters */}
        <div className={`px-6 py-3.5 border-b flex flex-wrap items-center gap-3 ${isDark ? 'border-gray-700/50' : 'border-gray-200'}`}>
          <Filter className={`w-4 h-4 shrink-0 ${isDark ? 'text-gray-500' : 'text-gray-400'}`} />
          <div className="flex items-center gap-2">
            <Calendar className={`w-3.5 h-3.5 ${isDark ? 'text-gray-500' : 'text-gray-400'}`} />
            <input
              type="date"
              value={filters.dateFrom}
              onChange={(e) => { setFilters((p) => ({ ...p, dateFrom: e.target.value })); setPage(1) }}
              className={`px-3 py-1.5 rounded-lg border text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 ${
                isDark
                  ? 'bg-gray-700 border-gray-600 text-gray-200'
                  : 'border-gray-200 text-gray-700'
              }`}
            />
            <span className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>to</span>
            <input
              type="date"
              value={filters.dateTo}
              onChange={(e) => { setFilters((p) => ({ ...p, dateTo: e.target.value })); setPage(1) }}
              className={`px-3 py-1.5 rounded-lg border text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 ${
                isDark
                  ? 'bg-gray-700 border-gray-600 text-gray-200'
                  : 'border-gray-200 text-gray-700'
              }`}
            />
          </div>
          <select
            value={filters.result}
            onChange={(e) => { setFilters((p) => ({ ...p, result: e.target.value })); setPage(1) }}
            className={`px-3 py-1.5 rounded-lg border text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 ${
              isDark
                ? 'bg-gray-700 border-gray-600 text-gray-200'
                : 'border-gray-200 text-gray-700'
            }`}
          >
            <option value="">All Results</option>
            <option value="WIN">WIN</option>
            <option value="LOSS">LOSS</option>
          </select>
        </div>

        {/* Empty State */}
        {paginated.length === 0 ? (
          <div className="p-16 text-center">
            <div className={`w-16 h-16 rounded-2xl mx-auto mb-4 flex items-center justify-center ${isDark ? 'bg-gray-700' : 'bg-gray-100'}`}>
              <Clock className={`w-8 h-8 ${isDark ? 'text-gray-500' : 'text-gray-400'}`} />
            </div>
            <p className={`text-sm font-medium ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>No trades found</p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className={isDark ? 'border-b border-gray-700/50' : 'border-b border-gray-100'}>
                    {['Date', 'Asset', 'Direction', 'Amount', 'Entry', 'Exit', 'Result', 'P&L'].map((h) => (
                      <th key={h} className={`text-left px-6 py-3 text-xs font-semibold uppercase tracking-wider ${h === 'P&L' ? 'text-right' : ''} ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {paginated.map((trade, i) => (
                    <tr
                      key={i}
                      className={`border-b last:border-0 transition-colors ${isDark ? 'border-gray-700/30 hover:bg-gray-700/30' : 'border-gray-100 hover:bg-gray-50/50'}`}
                    >
                      <td className={`px-6 py-3.5 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                        {trade.date
                          ? new Date(trade.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
                          : trade.createdAt
                          ? new Date(trade.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
                          : '—'}
                      </td>
                      <td className={`px-6 py-3.5 font-semibold ${isDark ? 'text-gray-100' : 'text-gray-900'}`}>{trade.asset || '—'}</td>
                      <td className="px-6 py-3.5">
                        <span className={`inline-flex items-center gap-1 text-xs font-semibold ${
                          trade.direction === 'CALL' ? 'text-emerald-500' : 'text-red-500'
                        }`}>
                          {trade.direction === 'CALL' ? <ArrowUpRight className="w-3.5 h-3.5" /> : <ArrowDownRight className="w-3.5 h-3.5" />}
                          {trade.direction}
                        </span>
                      </td>
                      <td className={`px-6 py-3.5 ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>${trade.amount || '—'}</td>
                      <td className={`px-6 py-3.5 ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>{trade.entryPrice || trade.entry || '—'}</td>
                      <td className={`px-6 py-3.5 ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>{trade.exitPrice || trade.exit || '—'}</td>
                      <td className="px-6 py-3.5">
                        <span className={`inline-flex px-2.5 py-0.5 rounded-lg text-[11px] font-semibold ${
                          trade.result === 'WIN'
                            ? isDark ? 'bg-emerald-500/10 text-emerald-400' : 'bg-emerald-50 text-emerald-600'
                            : isDark ? 'bg-red-500/10 text-red-400' : 'bg-red-50 text-red-600'
                        }`}>
                          {trade.result || 'PENDING'}
                        </span>
                      </td>
                      <td className={`px-6 py-3.5 text-right font-semibold ${
                        (trade.pnl ?? 0) >= 0 ? 'text-emerald-500' : 'text-red-500'
                      }`}>
                        {(trade.pnl ?? 0) >= 0 ? '+' : ''}{trade.pnl != null ? `$${trade.pnl.toFixed(2)}` : '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            <div className={`px-6 py-3 border-t flex items-center justify-between ${isDark ? 'border-gray-700/50' : 'border-gray-200'}`}>
              <p className={`text-xs font-medium ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                Page {page} of {totalPages} ({filtered.length} trades)
              </p>
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className={`p-2 rounded-xl border transition-colors disabled:opacity-30 disabled:cursor-not-allowed ${
                    isDark
                      ? 'border-gray-600 text-gray-400 hover:bg-gray-700'
                      : 'border-gray-200 text-gray-500 hover:bg-gray-50'
                  }`}
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page >= totalPages}
                  className={`p-2 rounded-xl border transition-colors disabled:opacity-30 disabled:cursor-not-allowed ${
                    isDark
                      ? 'border-gray-600 text-gray-400 hover:bg-gray-700'
                      : 'border-gray-200 text-gray-500 hover:bg-gray-50'
                  }`}
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
