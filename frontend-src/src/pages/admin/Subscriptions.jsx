import { useState, useEffect } from 'react'
import { api } from '../../api'
import { CreditCard, Check, X, Trash2, RefreshCw, Loader2 } from 'lucide-react'
import { useTheme } from '../../ThemeContext'

export default function AdminSubscriptions() {
  const [activeTab, setActiveTab] = useState('subscriptions') // 'subscriptions' | 'withdrawals'
  const [subscriptions, setSubscriptions] = useState([])
  const [withdrawals, setWithdrawals] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all')
  const [submitting, setSubmitting] = useState(null)
  const [selected, setSelected] = useState([])
  const [deleteConfirm, setDeleteConfirm] = useState(null)
  const [bulkDeleteConfirm, setBulkDeleteConfirm] = useState(false)
  const [toast, setToast] = useState(null)
  const { theme } = useTheme()
  const isDark = theme === 'dark'

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type })
    setTimeout(() => setToast(null), 3000)
  }

  const fetchSubscriptions = async () => {
    setLoading(true)
    try {
      const data = await api.getPlanSubscriptions()
      setSubscriptions(data.subscriptions || data || [])
      const withData = await api.getCommissionWithdrawals()
      setWithdrawals(withData.withdrawals || withData || [])
    } catch {} finally { setLoading(false) }
  }

  useEffect(() => { fetchSubscriptions() }, [])

  const handleApproveWithdrawal = async (wId) => {
    setSubmitting(wId)
    try {
      await api.approveCommissionWithdrawal({ withdrawalId: wId, status: 'APPROVED' })
      showToast('Referral withdrawal approved and marked as sent')
      fetchSubscriptions()
    } catch {
      showToast('Failed to approve withdrawal', 'error')
    } finally {
      setSubmitting(null)
    }
  }

  const handleRejectWithdrawal = async (wId) => {
    setSubmitting(wId)
    try {
      await api.approveCommissionWithdrawal({ withdrawalId: wId, status: 'REJECTED' })
      showToast('Referral withdrawal rejected')
      fetchSubscriptions()
    } catch {
      showToast('Failed to reject withdrawal', 'error')
    } finally {
      setSubmitting(null)
    }
  }

  const filtered = filter === 'all' ? subscriptions : subscriptions.filter((s) => s.status?.toLowerCase() === filter)
  const counts = {
    all: subscriptions.length,
    pending: subscriptions.filter((s) => s.status?.toLowerCase() === 'pending').length,
    approved: subscriptions.filter((s) => s.status?.toLowerCase() === 'approved').length,
    rejected: subscriptions.filter((s) => s.status?.toLowerCase() === 'rejected').length,
  }

  const handleApprove = async (sub) => {
    setSubmitting(sub.id)
    try {
      await api.approvePlanSubscription({ subscriptionId: sub.id })
      showToast('Subscription approved')
      fetchSubscriptions()
    } catch { showToast('Failed to approve', 'error') } finally { setSubmitting(null) }
  }

  const handleReject = async (sub) => {
    setSubmitting(sub.id)
    try {
      await api.rejectPlanSubscription({ subscriptionId: sub.id })
      showToast('Subscription rejected')
      fetchSubscriptions()
    } catch { showToast('Failed to reject', 'error') } finally { setSubmitting(null) }
  }

  const handleDelete = async (subId) => {
    setSubmitting(subId)
    try {
      await api.deletePlanSubscription({ subscriptionId: subId })
      showToast('Subscription deleted')
      setDeleteConfirm(null)
      setSelected((prev) => prev.filter((id) => id !== subId))
      fetchSubscriptions()
    } catch { showToast('Failed to delete', 'error') } finally { setSubmitting(null) }
  }

  const handleBulkDelete = async () => {
    setSubmitting('bulk')
    try {
      await api.bulkDeletePlanSubscriptions({ subscriptionIds: selected })
      showToast(`${selected.length} subscriptions deleted`)
      setBulkDeleteConfirm(false)
      setSelected([])
      fetchSubscriptions()
    } catch { showToast('Failed to delete', 'error') } finally { setSubmitting(null) }
  }

  const toggleSelect = (id) => {
    setSelected((prev) => prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id])
  }

  const toggleSelectAll = () => {
    if (selected.length === filtered.length) setSelected([])
    else setSelected(filtered.map((s) => s.id))
  }

  const statusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'approved': return isDark ? 'bg-green-500/10 text-green-400 border border-green-500/30' : 'bg-green-50 text-green-700 border border-green-200'
      case 'pending': return isDark ? 'bg-amber-500/10 text-amber-400 border border-amber-500/30' : 'bg-amber-50 text-amber-700 border border-amber-200'
      case 'rejected': return isDark ? 'bg-red-500/10 text-red-400 border border-red-500/30' : 'bg-red-50 text-red-700 border border-red-200'
      default: return isDark ? 'bg-gray-700 text-gray-300' : 'bg-gray-100 text-gray-600'
    }
  }

  return (
    <div className="space-y-4">
      {/* Toast */}
      {toast && (
        <div className={`fixed top-4 right-4 z-50 px-4 py-2.5 rounded-lg text-sm font-semibold shadow-lg transition-all ${
          toast.type === 'error' ? 'bg-red-600 text-white' : 'bg-emerald-600 text-white'
        }`}>{toast.msg}</div>
      )}

      <div className="flex items-center justify-between">
        <div>
          <h1 className={`text-lg font-bold ${isDark ? 'text-gray-100' : 'text-gray-900'}`}>Subscriptions</h1>
          <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Manage plan subscription requests</p>
        </div>
        <button onClick={fetchSubscriptions} className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border text-xs font-medium ${isDark ? 'border-gray-700 text-gray-300 hover:bg-gray-700' : 'border-gray-200 text-gray-600 hover:bg-gray-50'}`}>
          <RefreshCw className="w-3.5 h-3.5" /> Refresh
        </button>
      </div>

      {/* Top Tabs */}
      <div className="flex gap-2 border-b border-gray-700/50 pb-2">
        <button
          onClick={() => setActiveTab('subscriptions')}
          className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${
            activeTab === 'subscriptions'
              ? 'bg-blue-600 text-white shadow'
              : isDark ? 'text-gray-400 hover:text-gray-200' : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          Plan Subscriptions ({subscriptions.length})
        </button>
        <button
          onClick={() => setActiveTab('withdrawals')}
          className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${
            activeTab === 'withdrawals'
              ? 'bg-blue-600 text-white shadow'
              : isDark ? 'text-gray-400 hover:text-gray-200' : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          Referral Withdrawals ({withdrawals.filter(w => w.status?.toLowerCase() === 'pending').length} Pending / {withdrawals.length})
        </button>
      </div>

      {activeTab === 'withdrawals' ? (
        <div className={`${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} rounded-xl border overflow-hidden`}>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className={`border-b ${isDark ? 'border-gray-700 bg-gray-700/50' : 'border-gray-100 bg-gray-50/50'}`}>
                  <th className={`text-left px-4 py-2.5 font-medium text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>User</th>
                  <th className={`text-left px-4 py-2.5 font-medium text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Amount</th>
                  <th className={`text-left px-4 py-2.5 font-medium text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Payout Method</th>
                  <th className={`text-left px-4 py-2.5 font-medium text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Payout Address / Details</th>
                  <th className={`text-left px-4 py-2.5 font-medium text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Status</th>
                  <th className={`text-left px-4 py-2.5 font-medium text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Date</th>
                  <th className={`text-right px-4 py-2.5 font-medium text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan="7" className="px-4 py-12 text-center"><Loader2 className="w-5 h-5 animate-spin mx-auto text-gray-500" /></td></tr>
                ) : withdrawals.length === 0 ? (
                  <tr><td colSpan="7" className="px-4 py-12 text-center text-xs text-gray-500">No referral withdrawal requests found</td></tr>
                ) : (
                  withdrawals.map((w) => (
                    <tr key={w.id} className={`border-b ${isDark ? 'border-gray-800 hover:bg-gray-700/50' : 'border-gray-50 hover:bg-gray-50/50'}`}>
                      <td className="px-4 py-2.5">
                        <p className={`font-medium text-xs ${isDark ? 'text-gray-100' : 'text-gray-900'}`}>{w.userName || 'Trader'}</p>
                        <p className={`text-[11px] ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>{w.userEmail || ''}</p>
                      </td>
                      <td className="px-4 py-2.5 text-xs font-bold text-emerald-400">
                        ${w.amount}
                      </td>
                      <td className="px-4 py-2.5">
                        <span className="inline-block text-[10px] bg-blue-500/20 text-blue-300 font-semibold px-2 py-0.5 rounded">{w.payoutMethod}</span>
                      </td>
                      <td className="px-4 py-2.5 text-xs font-mono font-medium text-gray-300 max-w-xs truncate" title={w.payoutAddress}>
                        {w.payoutAddress}
                      </td>
                      <td className="px-4 py-2.5">
                        <span className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-semibold ${statusColor(w.status)}`}>{w.status}</span>
                      </td>
                      <td className="px-4 py-2.5 text-xs text-gray-400">{w.createdAt ? new Date(w.createdAt).toLocaleDateString() : '—'}</td>
                      <td className="px-4 py-2.5">
                        <div className="flex items-center justify-end gap-1">
                          {w.status?.toLowerCase() === 'pending' && (
                            <>
                              <button onClick={() => handleApproveWithdrawal(w.id)} disabled={submitting === w.id} className="inline-flex items-center gap-1 px-2.5 py-1 bg-green-600 hover:bg-green-700 text-white text-[10px] font-semibold rounded-md">
                                <Check className="w-3 h-3" /> Approve
                              </button>
                              <button onClick={() => handleRejectWithdrawal(w.id)} disabled={submitting === w.id} className="inline-flex items-center gap-1 px-2.5 py-1 bg-red-600 hover:bg-red-700 text-white text-[10px] font-semibold rounded-md">
                                <X className="w-3 h-3" /> Reject
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <>
          {/* Filters */}
          <div className="flex gap-2 overflow-x-auto pb-1">
            {['all', 'pending', 'approved', 'rejected'].map((f) => (
              <button key={f} onClick={() => { setFilter(f); setSelected([]) }}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${filter === f ? 'bg-blue-600 text-white' : isDark ? 'bg-gray-800 text-gray-300 border border-gray-700 hover:bg-gray-700' : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'}`}>
                {f.charAt(0).toUpperCase() + f.slice(1)} ({counts[f]})
              </button>
            ))}
          </div>

          {/* Bulk Actions */}
          {selected.length > 0 && (
            <div className={`flex items-center gap-3 px-4 py-2.5 rounded-lg ${isDark ? 'bg-blue-500/10 border border-blue-500/30' : 'bg-blue-50 border border-blue-200'}`}>
              <span className={`text-sm font-semibold ${isDark ? 'text-blue-400' : 'text-blue-700'}`}>{selected.length} selected</span>
              <button onClick={() => setBulkDeleteConfirm(true)} className="inline-flex items-center gap-1 px-3 py-1.5 bg-red-600 text-white text-xs font-semibold rounded-lg hover:bg-red-700">
                <Trash2 className="w-3 h-3" /> Delete Selected
              </button>
              <button onClick={() => setSelected([])} className={`text-xs ${isDark ? 'text-gray-400 hover:text-gray-200' : 'text-gray-500 hover:text-gray-700'}`}>Clear</button>
            </div>
          )}

          {/* Table */}
          <div className={`${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} rounded-xl border overflow-hidden`}>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className={`border-b ${isDark ? 'border-gray-700 bg-gray-700/50' : 'border-gray-100 bg-gray-50/50'}`}>
                    <th className="px-4 py-2.5 w-8">
                      <input type="checkbox" checked={selected.length === filtered.length && filtered.length > 0} onChange={toggleSelectAll} className={`rounded ${isDark ? 'border-gray-600 bg-gray-700' : 'border-gray-300'}`} />
                    </th>
                    <th className={`text-left px-4 py-2.5 font-medium text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>User</th>
                    <th className={`text-left px-4 py-2.5 font-medium text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Plan</th>
                    <th className={`text-left px-4 py-2.5 font-medium text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Amount</th>
                    <th className={`text-left px-4 py-2.5 font-medium text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Status</th>
                    <th className={`text-left px-4 py-2.5 font-medium text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Date</th>
                    <th className={`text-right px-4 py-2.5 font-medium text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr><td colSpan="7" className={`px-4 py-12 text-center`}><Loader2 className={`w-5 h-5 animate-spin mx-auto ${isDark ? 'text-gray-500' : 'text-gray-400'}`} /></td></tr>
                  ) : filtered.length === 0 ? (
                    <tr><td colSpan="7" className={`px-4 py-12 text-center text-xs ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>No subscriptions found</td></tr>
                  ) : (
                    filtered.map((sub) => (
                      <tr key={sub.id} className={`border-b ${isDark ? 'border-gray-800 hover:bg-gray-700/50' : 'border-gray-50 hover:bg-gray-50/50'} ${selected.includes(sub.id) ? (isDark ? 'bg-blue-500/10' : 'bg-blue-50/50') : ''}`}>
                        <td className="px-4 py-2.5">
                          <input type="checkbox" checked={selected.includes(sub.id)} onChange={() => toggleSelect(sub.id)} className={`rounded ${isDark ? 'border-gray-600 bg-gray-700' : 'border-gray-300'}`} />
                        </td>
                        <td className="px-4 py-2.5">
                          <p className={`font-medium text-xs ${isDark ? 'text-gray-100' : 'text-gray-900'}`}>{sub.userName || '—'}</p>
                          <p className={`text-[11px] ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>{sub.userEmail || ''}</p>
                          {sub.paymentTxId && <p className="text-[10px] text-blue-400 font-mono mt-0.5 font-semibold">UTR: {sub.paymentTxId}</p>}
                          {sub.paymentMethod && <span className="inline-block text-[9px] bg-blue-500/20 text-blue-300 px-1.5 py-0.5 rounded mt-0.5">{sub.paymentMethod}</span>}
                        </td>
                        <td className={`px-4 py-2.5 font-medium text-xs ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>{sub.planName || '—'}</td>
                        <td className={`px-4 py-2.5 text-xs ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>${sub.price || '—'}</td>
                        <td className="px-4 py-2.5">
                          <span className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-semibold ${statusColor(sub.status)}`}>{sub.status}</span>
                        </td>
                        <td className={`px-4 py-2.5 text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>{sub.createdAt ? new Date(sub.createdAt).toLocaleDateString() : '—'}</td>
                        <td className="px-4 py-2.5">
                          <div className="flex items-center justify-end gap-1">
                            {sub.status?.toLowerCase() === 'pending' && (
                              <>
                                <button onClick={() => handleApprove(sub)} disabled={submitting === sub.id} className="inline-flex items-center gap-1 px-2 py-1 bg-green-600 hover:bg-green-700 disabled:bg-green-400 text-white text-[10px] font-semibold rounded-md">
                                  <Check className="w-3 h-3" /> Approve
                                </button>
                                <button onClick={() => handleReject(sub)} disabled={submitting === sub.id} className="inline-flex items-center gap-1 px-2 py-1 bg-red-600 hover:bg-red-700 disabled:bg-red-400 text-white text-[10px] font-semibold rounded-md">
                                  <X className="w-3 h-3" /> Reject
                                </button>
                              </>
                            )}
                            <button onClick={() => setDeleteConfirm(sub.id)} disabled={submitting === sub.id} className={`inline-flex items-center gap-1 px-2 py-1 border text-[10px] font-semibold rounded-md transition-colors ${isDark ? 'border-red-500/30 text-red-400 hover:bg-red-500/10' : 'border-red-200 text-red-500 hover:bg-red-50'}`}>
                              <Trash2 className="w-3 h-3" /> Delete
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
        </>
      )}

      {/* Delete Confirmation */}
      {deleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setDeleteConfirm(null)} />
          <div className={`relative rounded-xl shadow-2xl w-full max-w-sm p-5 ${isDark ? 'bg-gray-800' : 'bg-white'}`}>
            <h3 className={`text-sm font-bold mb-1 ${isDark ? 'text-gray-100' : 'text-gray-900'}`}>Delete Subscription?</h3>
            <p className={`text-xs mb-5 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>This action cannot be undone.</p>
            <div className="flex gap-2">
              <button onClick={() => setDeleteConfirm(null)} className={`flex-1 py-2 rounded-lg border text-xs font-semibold ${isDark ? 'border-gray-700 text-gray-300 hover:bg-gray-700' : 'border-gray-200 text-gray-600 hover:bg-gray-50'}`}>Cancel</button>
              <button onClick={() => handleDelete(deleteConfirm)} disabled={submitting === deleteConfirm} className="flex-1 py-2 rounded-lg bg-red-600 text-white text-xs font-semibold hover:bg-red-700 disabled:opacity-50">
                {submitting === deleteConfirm ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Bulk Delete Confirmation */}
      {bulkDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setBulkDeleteConfirm(false)} />
          <div className={`relative rounded-xl shadow-2xl w-full max-w-sm p-5 ${isDark ? 'bg-gray-800' : 'bg-white'}`}>
            <h3 className={`text-sm font-bold mb-1 ${isDark ? 'text-gray-100' : 'text-gray-900'}`}>Delete {selected.length} Subscriptions?</h3>
            <p className={`text-xs mb-5 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>This action cannot be undone. All selected subscriptions will be permanently deleted.</p>
            <div className="flex gap-2">
              <button onClick={() => setBulkDeleteConfirm(false)} className={`flex-1 py-2 rounded-lg border text-xs font-semibold ${isDark ? 'border-gray-700 text-gray-300 hover:bg-gray-700' : 'border-gray-200 text-gray-600 hover:bg-gray-50'}`}>Cancel</button>
              <button onClick={handleBulkDelete} disabled={submitting === 'bulk'} className="flex-1 py-2 rounded-lg bg-red-600 text-white text-xs font-semibold hover:bg-red-700 disabled:opacity-50">
                {submitting === 'bulk' ? 'Deleting...' : `Delete ${selected.length} Items`}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
