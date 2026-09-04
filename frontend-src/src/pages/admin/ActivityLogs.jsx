import { useState, useEffect } from 'react'
import { api } from '../../api'
import {
  Activity, Loader2, X, Clock, Shield, AlertOctagon, Info, AlertTriangle
} from 'lucide-react'

export default function AdminActivityLogs() {
  const [logs, setLogs] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const fetchLogs = async () => {
    setLoading(true)
    try {
      const data = await api.getAuditLogs()
      const audit = (data.auditLogs || data.logs || []).map((l) => ({ ...l, _type: 'audit' }))
      const errors = (data.errorLogs || data.errors || []).map((l) => ({ ...l, _type: 'error' }))
      const combined = [...audit, ...errors].sort((a, b) => {
        const da = new Date(a.timestamp || a.createdAt || 0)
        const db = new Date(b.timestamp || b.createdAt || 0)
        return db - da
      })
      setLogs(combined)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchLogs() }, [])

  const iconFor = (item) => {
    if (item._type === 'error') {
      if (item.level === 'error') return <AlertOctagon className="w-4 h-4 text-red-500" />
      if (item.level === 'warning') return <AlertTriangle className="w-4 h-4 text-amber-500" />
      return <Info className="w-4 h-4 text-blue-500" />
    }
    return <Shield className="w-4 h-4 text-primary-500" />
  }

  const bgFor = (item) => {
    if (item._type === 'error') {
      if (item.level === 'error') return 'bg-red-50 border-red-200'
      if (item.level === 'warning') return 'bg-amber-50 border-amber-200'
      return 'bg-blue-50 border-blue-200'
    }
    return 'bg-white border-gray-200'
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-gray-900">Activity Logs</h1>
        <p className="text-sm text-gray-500 mt-1">Combined audit and error timeline</p>
      </div>

      {error && (
        <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-sm text-red-700 flex items-center justify-between">
          {error}
          <button onClick={() => setError('')}><X className="w-4 h-4" /></button>
        </div>
      )}

      <div className="relative">
        <div className="absolute left-5 top-0 bottom-0 w-px bg-gray-200" />

        <div className="space-y-4">
          {loading ? (
            <div className="bg-white rounded-xl border border-gray-200 p-12 text-center ml-10">
              <Loader2 className="w-5 h-5 animate-spin mx-auto text-gray-400" />
            </div>
          ) : logs.length === 0 ? (
            <div className="bg-white rounded-xl border border-gray-200 p-12 text-center ml-10 text-gray-400 text-sm">
              No activity logs found
            </div>
          ) : (
            logs.map((item, i) => (
              <div key={item.id || i} className="relative pl-10">
                <div className={`absolute left-3.5 w-3 h-3 rounded-full border-2 border-white mt-1.5 z-10 ${
                  item._type === 'error'
                    ? item.level === 'error' ? 'bg-red-500' : 'bg-amber-400'
                    : 'bg-primary-500'
                }`} />
                <div className={`rounded-xl border p-4 ${bgFor(item)}`}>
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 rounded-lg bg-gray-50 flex items-center justify-center flex-shrink-0">
                        {iconFor(item)}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900">
                          {item.action || item.message || item.error || 'Event'}
                        </p>
                        {(item.details || item.stack) && (
                          <p className="text-xs text-gray-500 mt-1 max-w-lg truncate">
                            {typeof item.details === 'string' ? item.details : JSON.stringify(item.details) || item.stack}
                          </p>
                        )}
                        <div className="flex items-center gap-2 mt-1.5">
                          {item.adminName || item.admin ? (
                            <span className="text-xs text-gray-400">{item.adminName || item.admin}</span>
                          ) : null}
                          <span className="text-xs text-gray-300">•</span>
                          <span className="inline-flex items-center gap-1 text-xs text-gray-400">
                            <Clock className="w-3 h-3" />
                            {item.timestamp || item.createdAt ? new Date(item.timestamp || item.createdAt).toLocaleString() : '—'}
                          </span>
                        </div>
                      </div>
                    </div>
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full whitespace-nowrap ${
                      item._type === 'error'
                        ? item.level === 'error' ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'
                        : 'bg-primary-50 text-primary-700'
                    }`}>
                      {item._type === 'error' ? item.level : 'audit'}
                    </span>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}
