import { useState, useEffect } from 'react'
import { api } from '../../api'
import {
  FileText, Download, Search, X, Loader2, ArrowUpDown, TrendingUp, TrendingDown
} from 'lucide-react'

export default function AdminTradeLogs() {
  const [logs, setLogs] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')
  const [resultFilter, setResultFilter] = useState('all')
  const [sortDesc, setSortDesc] = useState(true)

  const fetchLogs = async () => {
    setLoading(true)
    try {
      const data = await api.getAllTradeLogs()
      setLogs(data.logs || data.trades || data || [])
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchLogs() }, [])

  const filtered = logs
    .filter((l) => {
      const matchSearch = !search ||
        l.userName?.toLowerCase().includes(search.toLowerCase()) ||
        l.user?.name?.toLowerCase().includes(search.toLowerCase()) ||
        l.asset?.toLowerCase().includes(search.toLowerCase()) ||
        l.userEmail?.toLowerCase().includes(search.toLowerCase())
      const matchResult = resultFilter === 'all' || l.result === resultFilter
      return matchSearch && matchResult
    })
    .sort((a, b) => {
      const da = new Date(a.createdAt || a.date || 0)
      const db = new Date(b.createdAt || b.date || 0)
      return sortDesc ? db - da : da - db
    })

  const handleExport = () => {
    const header = 'Date,User,Asset,Direction,Amount,Result,P&L\n'
    const rows = filtered.map((l) =>
      [l.createdAt || l.date, l.userName || l.user?.name, l.asset, l.direction, l.amount, l.result, l.pnl].join(',')
    ).join('\n')
    const blob = new Blob([header + rows], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `trade-logs-${new Date().toISOString().slice(0, 10)}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Trade Logs</h1>
          <p className="text-sm text-gray-500 mt-1">{logs.length} total trades</p>
        </div>
        <button
          onClick={handleExport}
          className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 hover:bg-gray-50 text-sm font-medium text-gray-700 rounded-lg transition-colors"
        >
          <Download className="w-4 h-4" />
          Export CSV
        </button>
      </div>

      {error && (
        <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-sm text-red-700 flex items-center justify-between">
          {error}
          <button onClick={() => setError('')}><X className="w-4 h-4" /></button>
        </div>
      )}

      <div className="bg-white rounded-xl border border-gray-200">
        <div className="p-4 border-b border-gray-100 flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search by user or asset..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            />
          </div>
          <select
            value={resultFilter}
            onChange={(e) => setResultFilter(e.target.value)}
            className="px-3 py-2 rounded-lg border border-gray-200 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
          >
            <option value="all">All Results</option>
            <option value="win">Wins</option>
            <option value="loss">Losses</option>
            <option value="draw">Draws</option>
          </select>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50/50">
                <th
                  className="text-left px-4 py-3 font-medium text-gray-500 cursor-pointer hover:text-gray-700 select-none"
                  onClick={() => setSortDesc(!sortDesc)}
                >
                  <span className="inline-flex items-center gap-1">
                    Date <ArrowUpDown className="w-3 h-3" />
                  </span>
                </th>
                <th className="text-left px-4 py-3 font-medium text-gray-500">User</th>
                <th className="text-left px-4 py-3 font-medium text-gray-500">Asset</th>
                <th className="text-left px-4 py-3 font-medium text-gray-500">Direction</th>
                <th className="text-left px-4 py-3 font-medium text-gray-500">Amount</th>
                <th className="text-left px-4 py-3 font-medium text-gray-500">Result</th>
                <th className="text-left px-4 py-3 font-medium text-gray-500">P&L</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="7" className="px-4 py-12 text-center text-gray-400">
                    <Loader2 className="w-5 h-5 animate-spin mx-auto" />
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan="7" className="px-4 py-12 text-center text-gray-400 text-sm">
                    No trade logs found
                  </td>
                </tr>
              ) : (
                filtered.map((log, i) => (
                  <tr key={log.id || i} className="border-b border-gray-50 hover:bg-gray-50/50">
                    <td className="px-4 py-3 text-gray-500">
                      {log.createdAt || log.date ? new Date(log.createdAt || log.date).toLocaleString() : '—'}
                    </td>
                    <td className="px-4 py-3 font-medium text-gray-900">{log.userName || log.user?.name || '—'}</td>
                    <td className="px-4 py-3 text-gray-600">{log.asset || '—'}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center gap-1 text-xs font-medium ${
                        log.direction === 'call' || log.direction === 'buy' ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {(log.direction === 'call' || log.direction === 'buy') ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                        {log.direction || '—'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-600">${log.amount || 0}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${
                        log.result === 'win' ? 'bg-green-50 text-green-700' :
                        log.result === 'loss' ? 'bg-red-50 text-red-700' :
                        'bg-gray-100 text-gray-600'
                      }`}>
                        {log.result || '—'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`text-sm font-medium ${(log.pnl || 0) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        ${(log.pnl || 0).toFixed(2)}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
