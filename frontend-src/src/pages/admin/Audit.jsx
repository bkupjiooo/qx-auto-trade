import { useState, useEffect } from 'react'
import { api } from '../../api'
import { Shield, Loader2, X, ArrowUpDown } from 'lucide-react'

export default function AdminAudit() {
  const [logs, setLogs] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [sortDesc, setSortDesc] = useState(true)

  const fetchLogs = async () => {
    setLoading(true)
    try {
      const data = await api.getAuditLogs()
      setLogs(data.auditLogs || data.logs || data || [])
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchLogs() }, [])

  const sorted = [...logs].sort((a, b) => {
    const da = new Date(a.timestamp || a.createdAt || 0)
    const db = new Date(b.timestamp || b.createdAt || 0)
    return sortDesc ? db - da : da - db
  })

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-gray-900">Audit Trail</h1>
        <p className="text-sm text-gray-500 mt-1">{logs.length} audit entries</p>
      </div>

      {error && (
        <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-sm text-red-700 flex items-center justify-between">
          {error}
          <button onClick={() => setError('')}><X className="w-4 h-4" /></button>
        </div>
      )}

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50/50">
                <th
                  className="text-left px-4 py-3 font-medium text-gray-500 cursor-pointer hover:text-gray-700 select-none"
                  onClick={() => setSortDesc(!sortDesc)}
                >
                  <span className="inline-flex items-center gap-1">
                    Timestamp <ArrowUpDown className="w-3 h-3" />
                  </span>
                </th>
                <th className="text-left px-4 py-3 font-medium text-gray-500">Admin</th>
                <th className="text-left px-4 py-3 font-medium text-gray-500">Action</th>
                <th className="text-left px-4 py-3 font-medium text-gray-500">Details</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="4" className="px-4 py-12 text-center text-gray-400">
                    <Loader2 className="w-5 h-5 animate-spin mx-auto" />
                  </td>
                </tr>
              ) : sorted.length === 0 ? (
                <tr>
                  <td colSpan="4" className="px-4 py-12 text-center text-gray-400 text-sm">
                    No audit logs found
                  </td>
                </tr>
              ) : (
                sorted.map((log, i) => (
                  <tr key={log.id || i} className="border-b border-gray-50 hover:bg-gray-50/50">
                    <td className="px-4 py-3 text-gray-500 whitespace-nowrap">
                      {log.timestamp || log.createdAt ? new Date(log.timestamp || log.createdAt).toLocaleString() : '—'}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-primary-100 flex items-center justify-center">
                          <Shield className="w-3 h-3 text-primary-600" />
                        </div>
                        <span className="font-medium text-gray-900">{log.adminName || log.admin || log.adminEmail || '—'}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className="inline-flex px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-700">
                        {log.action || '—'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-600 max-w-xs truncate">
                      {typeof log.details === 'string' ? log.details : JSON.stringify(log.details) || '—'}
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
