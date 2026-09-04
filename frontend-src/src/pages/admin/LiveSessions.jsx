import { useState, useEffect, useRef } from 'react'
import { api } from '../../api'
import {
  Radio, RefreshCw, AlertTriangle, Loader2, TrendingUp, TrendingDown
} from 'lucide-react'

export default function AdminLiveSessions() {
  const [sessions, setSessions] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [stopping, setStopping] = useState(null)
  const intervalRef = useRef(null)

  const fetchSessions = async () => {
    try {
      const data = await api.getLiveSessions()
      setSessions(data.sessions || data || [])
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchSessions()
    intervalRef.current = setInterval(fetchSessions, 10000)
    return () => clearInterval(intervalRef.current)
  }, [])

  const handleForceStop = async (session) => {
    setStopping(session.id || session.userId)
    try {
      await api.stopTrading({ userId: session.userId || session.id })
      fetchSessions()
    } catch (err) {
      setError(err.message)
    } finally {
      setStopping(null)
    }
  }

  const statusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'active': case 'running': return 'bg-green-50 text-green-700'
      case 'paused': return 'bg-amber-50 text-amber-700'
      case 'stopped': return 'bg-gray-100 text-gray-600'
      default: return 'bg-gray-100 text-gray-600'
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Live Sessions</h1>
          <p className="text-sm text-gray-500 mt-1">
            {sessions.length} session{sessions.length !== 1 ? 's' : ''} • Auto-refreshing every 10s
          </p>
        </div>
        <button
          onClick={fetchSessions}
          className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 hover:bg-gray-50 text-sm font-medium text-gray-700 rounded-lg transition-colors"
        >
          <RefreshCw className="w-4 h-4" />
          Refresh
        </button>
      </div>

      {error && (
        <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50/50">
                <th className="text-left px-4 py-3 font-medium text-gray-500">User</th>
                <th className="text-left px-4 py-3 font-medium text-gray-500">Broker</th>
                <th className="text-left px-4 py-3 font-medium text-gray-500">Strategy</th>
                <th className="text-left px-4 py-3 font-medium text-gray-500">Status</th>
                <th className="text-left px-4 py-3 font-medium text-gray-500">P&L</th>
                <th className="text-right px-4 py-3 font-medium text-gray-500">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="6" className="px-4 py-12 text-center text-gray-400">
                    <Loader2 className="w-5 h-5 animate-spin mx-auto" />
                  </td>
                </tr>
              ) : sessions.length === 0 ? (
                <tr>
                  <td colSpan="6" className="px-4 py-12 text-center text-gray-400 text-sm">
                    No active sessions
                  </td>
                </tr>
              ) : (
                sessions.map((s, i) => (
                  <tr key={s.id || i} className="border-b border-gray-50 hover:bg-gray-50/50">
                    <td className="px-4 py-3">
                      <p className="font-medium text-gray-900">{s.userName || s.user?.name || '—'}</p>
                      <p className="text-xs text-gray-500">{s.userEmail || s.user?.email || ''}</p>
                    </td>
                    <td className="px-4 py-3 text-gray-600">{s.broker || '—'}</td>
                    <td className="px-4 py-3 text-gray-600">{s.strategy || s.strategyName || '—'}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${statusColor(s.status)}`}>
                        {s.status || 'unknown'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center gap-1 text-sm font-medium ${
                        (s.pnl || 0) >= 0 ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {(s.pnl || 0) >= 0 ? <TrendingUp className="w-3.5 h-3.5" /> : <TrendingDown className="w-3.5 h-3.5" />}
                        ${(s.pnl || 0).toFixed(2)}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end">
                        <button
                          onClick={() => handleForceStop(s)}
                          disabled={stopping === (s.id || s.userId)}
                          className="inline-flex items-center gap-1 px-3 py-1.5 bg-red-600 hover:bg-red-700 disabled:bg-red-400 text-white text-xs font-medium rounded-lg transition-colors"
                        >
                          <AlertTriangle className="w-3 h-3" />
                          {stopping === (s.id || s.userId) ? 'Stopping...' : 'Force Stop'}
                        </button>
                      </div>
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
