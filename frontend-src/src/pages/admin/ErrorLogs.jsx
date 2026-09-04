import { useState, useEffect } from 'react'
import { api } from '../../api'
import { AlertTriangle, X, Loader2, AlertCircle, Info, AlertOctagon } from 'lucide-react'

export default function AdminErrorLogs() {
  const [logs, setLogs] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [levelFilter, setLevelFilter] = useState('all')

  const fetchLogs = async () => {
    setLoading(true)
    try {
      const data = await api.getAuditLogs()
      setLogs(data.errorLogs || data.errors || [])
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchLogs() }, [])

  const filtered = levelFilter === 'all'
    ? logs
    : logs.filter((l) => l.level === levelFilter)

  const levelIcon = (level) => {
    switch (level) {
      case 'error': return <AlertOctagon className="w-4 h-4 text-red-500" />
      case 'warning': return <AlertTriangle className="w-4 h-4 text-amber-500" />
      default: return <Info className="w-4 h-4 text-blue-500" />
    }
  }

  const levelColor = (level) => {
    switch (level) {
      case 'error': return 'bg-red-50 text-red-700'
      case 'warning': return 'bg-amber-50 text-amber-700'
      default: return 'bg-blue-50 text-blue-700'
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-gray-900">Error Logs</h1>
        <p className="text-sm text-gray-500 mt-1">{logs.length} error entries</p>
      </div>

      {error && (
        <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-sm text-red-700 flex items-center justify-between">
          {error}
          <button onClick={() => setError('')}><X className="w-4 h-4" /></button>
        </div>
      )}

      <div className="flex gap-2">
        {['all', 'error', 'warning', 'info'].map((l) => (
          <button
            key={l}
            onClick={() => setLevelFilter(l)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              levelFilter === l
                ? 'bg-primary-600 text-white'
                : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
            }`}
          >
            {l.charAt(0).toUpperCase() + l.slice(1)}
          </button>
        ))}
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50/50">
                <th className="text-left px-4 py-3 font-medium text-gray-500">Time</th>
                <th className="text-left px-4 py-3 font-medium text-gray-500">Level</th>
                <th className="text-left px-4 py-3 font-medium text-gray-500">Message</th>
                <th className="text-left px-4 py-3 font-medium text-gray-500">Stack</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="4" className="px-4 py-12 text-center text-gray-400">
                    <Loader2 className="w-5 h-5 animate-spin mx-auto" />
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan="4" className="px-4 py-12 text-center text-gray-400 text-sm">
                    No error logs found
                  </td>
                </tr>
              ) : (
                filtered.map((log, i) => (
                  <tr key={log.id || i} className="border-b border-gray-50 hover:bg-gray-50/50">
                    <td className="px-4 py-3 text-gray-500 whitespace-nowrap">
                      {log.timestamp ? new Date(log.timestamp).toLocaleString() : '—'}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium ${levelColor(log.level)}`}>
                        {levelIcon(log.level)}
                        {log.level}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-700 max-w-sm truncate">
                      {log.message || log.error || '—'}
                    </td>
                    <td className="px-4 py-3 text-gray-500 text-xs max-w-xs truncate">
                      {log.stack || '—'}
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
