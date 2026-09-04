import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '../../AuthContext'
import { useTheme } from '../../ThemeContext'
import { useToast } from '../../components/Toast'
import { api } from '../../api'
import { Plus, Edit3, Trash2, X, Check, Star, Zap, Crown, ToggleLeft, ToggleRight } from 'lucide-react'

const iconMap = { Star, Zap, Crown }

export default function PlanManager() {
  const { theme } = useTheme()
  const isDark = theme === 'dark'
  const { toast } = useToast()
  const [plans, setPlans] = useState([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [editPlan, setEditPlan] = useState(null)
  const [form, setForm] = useState({ name: '', price: '', period: '/month', features: '' })
  const [saving, setSaving] = useState(false)
  const [deleteId, setDeleteId] = useState(null)

  const fetchPlans = useCallback(async () => {
    try {
      const data = await api.getPlans()
      setPlans(data.plans || [])
    } catch {} finally { setLoading(false) }
  }, [])

  useEffect(() => { fetchPlans() }, [fetchPlans])

  const openAdd = () => { setEditPlan(null); setForm({ name: '', price: '', period: '/month', features: '' }); setModalOpen(true) }
  const openEdit = (p) => { setEditPlan(p); setForm({ name: p.name, price: p.price.replace('$', ''), period: p.period || '/month', features: (p.features || []).join(', ') }); setModalOpen(true) }

  const handleSave = async (e) => {
    e.preventDefault()
    setSaving(true)
    try {
      const features = form.features.split(',').map(f => f.trim()).filter(Boolean)
      if (editPlan) {
        await api.updatePlan({ planId: editPlan.id, name: form.name, price: form.price, period: form.period, features })
        toast('Plan updated successfully', 'success')
      } else {
        await api.addPlan({ name: form.name, price: form.price, period: form.period, features })
        toast('Plan created successfully', 'success')
      }
      setModalOpen(false)
      fetchPlans()
    } catch { toast('Failed to save plan', 'error') } finally { setSaving(false) }
  }

  const handleDelete = async (planId) => {
    try {
      await api.deletePlan({ planId })
      toast('Plan deleted successfully', 'success')
      setDeleteId(null)
      fetchPlans()
    } catch { toast('Failed to delete plan', 'error') }
  }

  const handleToggle = async (plan) => {
    try {
      await api.updatePlan({ planId: plan.id, isActive: !plan.isActive })
      toast(plan.isActive ? 'Plan deactivated' : 'Plan activated', 'success')
      fetchPlans()
    } catch { toast('Failed to toggle plan', 'error') }
  }

  if (loading) return <div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" /></div>

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className={`text-lg font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>Subscription Plans</h1>
          <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Manage plan names, prices, and features shown to users</p>
        </div>
        <button onClick={openAdd} className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-blue-600 text-white text-xs font-semibold hover:bg-blue-700 transition-colors">
          <Plus className="w-3.5 h-3.5" /> Add Plan
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {plans.map((plan) => {
          const IconComp = iconMap[plan.icon] || Zap
          return (
            <div key={plan.id} className={`rounded-xl border p-4 transition-all ${isDark ? 'bg-gray-800 border-gray-700/50' : 'bg-white border-gray-200 shadow-sm'}`}>
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center">
                    <IconComp className="w-4 h-4 text-white" />
                  </div>
                  <div>
                    <h3 className={`text-sm font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>{plan.name}</h3>
                    <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>{plan.price}{plan.period}</p>
                  </div>
                </div>
                <button onClick={() => handleToggle(plan)} className="shrink-0">
                  {plan.isActive !== false ? <ToggleRight className="w-6 h-6 text-emerald-500" /> : <ToggleLeft className="w-6 h-6 text-gray-400" />}
                </button>
              </div>
              <div className="mb-3">
                {(plan.features || []).slice(0, 3).map((f, i) => (
                  <div key={i} className="flex items-center gap-1.5 text-xs mb-1">
                    <Check className="w-3 h-3 text-emerald-500 shrink-0" />
                    <span className={isDark ? 'text-gray-300' : 'text-gray-600'}>{f}</span>
                  </div>
                ))}
                {(plan.features || []).length > 3 && <p className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>+{(plan.features || []).length - 3} more</p>}
              </div>
              <div className="flex items-center gap-2 pt-3 border-t border-gray-100">
                <button onClick={() => openEdit(plan)} className="flex-1 inline-flex items-center justify-center gap-1 px-2 py-1.5 rounded-lg border text-xs font-semibold transition-colors border-blue-200 text-blue-600 hover:bg-blue-50">
                  <Edit3 className="w-3 h-3" /> Edit
                </button>
                <button onClick={() => setDeleteId(plan.id)} className="flex-1 inline-flex items-center justify-center gap-1 px-2 py-1.5 rounded-lg border text-xs font-semibold transition-colors border-red-200 text-red-500 hover:bg-red-50">
                  <Trash2 className="w-3 h-3" /> Delete
                </button>
              </div>
            </div>
          )
        })}
      </div>

      {plans.length === 0 && (
        <div className={`text-center py-12 rounded-xl border ${isDark ? 'bg-gray-800/50 border-gray-700' : 'bg-white border-gray-200'}`}>
          <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>No plans yet. Click "Add Plan" to create one.</p>
        </div>
      )}

      {/* Add/Edit Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className={`absolute inset-0 backdrop-blur-sm ${isDark ? 'bg-black/70' : 'bg-gray-900/50'}`} onClick={() => setModalOpen(false)} />
          <div className={`relative rounded-xl shadow-2xl w-full max-w-md ${isDark ? 'bg-gray-800 border border-gray-700' : 'bg-white border border-gray-200'}`}>
            <div className={`flex items-center justify-between px-5 py-4 border-b ${isDark ? 'border-gray-700' : 'border-gray-100'}`}>
              <h3 className={`text-sm font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>{editPlan ? 'Edit Plan' : 'Add New Plan'}</h3>
              <button onClick={() => setModalOpen(false)} className={`p-1 rounded-lg ${isDark ? 'hover:bg-gray-700 text-gray-400' : 'hover:bg-gray-100 text-gray-500'}`}><X className="w-4 h-4" /></button>
            </div>
            <form onSubmit={handleSave} className="p-5 space-y-4">
              <div>
                <label className={`block text-xs font-semibold mb-1 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Plan Name *</label>
                <input type="text" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className={`w-full px-3 py-2 rounded-lg border text-sm ${isDark ? 'bg-gray-700 border-gray-600 text-white' : 'border-gray-200 text-gray-900'} focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none`} placeholder="e.g. Basic Plan" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={`block text-xs font-semibold mb-1 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Price *</label>
                  <input type="text" required value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })}
                    className={`w-full px-3 py-2 rounded-lg border text-sm ${isDark ? 'bg-gray-700 border-gray-600 text-white' : 'border-gray-200 text-gray-900'} focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none`} placeholder="49" />
                </div>
                <div>
                  <label className={`block text-xs font-semibold mb-1 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Period</label>
                  <input type="text" value={form.period} onChange={(e) => setForm({ ...form, period: e.target.value })}
                    className={`w-full px-3 py-2 rounded-lg border text-sm ${isDark ? 'bg-gray-700 border-gray-600 text-white' : 'border-gray-200 text-gray-900'} focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none`} placeholder="/month" />
                </div>
              </div>
              <div>
                <label className={`block text-xs font-semibold mb-1 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Features (comma separated)</label>
                <textarea value={form.features} onChange={(e) => setForm({ ...form, features: e.target.value })} rows={3}
                  className={`w-full px-3 py-2 rounded-lg border text-sm ${isDark ? 'bg-gray-700 border-gray-600 text-white' : 'border-gray-200 text-gray-900'} focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none resize-none`} placeholder="All strategies, 5 brokers, Unlimited trades" />
              </div>
              <div className="flex gap-2 pt-2">
                <button type="button" onClick={() => setModalOpen(false)} className={`flex-1 py-2 rounded-lg border text-xs font-semibold ${isDark ? 'border-gray-600 text-gray-300 hover:bg-gray-700' : 'border-gray-200 text-gray-600 hover:bg-gray-50'}`}>Cancel</button>
                <button type="submit" disabled={saving} className="flex-1 py-2 rounded-lg bg-blue-600 text-white text-xs font-semibold hover:bg-blue-700 disabled:opacity-50">
                  {saving ? 'Saving...' : (editPlan ? 'Update Plan' : 'Create Plan')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation */}
      {deleteId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className={`absolute inset-0 backdrop-blur-sm ${isDark ? 'bg-black/70' : 'bg-gray-900/50'}`} onClick={() => setDeleteId(null)} />
          <div className={`relative rounded-xl shadow-2xl w-full max-w-sm p-6 ${isDark ? 'bg-gray-800 border border-gray-700' : 'bg-white border border-gray-200'}`}>
            <h3 className={`text-sm font-bold mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>Delete Plan?</h3>
            <p className={`text-xs mb-5 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>This action cannot be undone. The plan will be permanently removed.</p>
            <div className="flex gap-2">
              <button onClick={() => setDeleteId(null)} className={`flex-1 py-2 rounded-lg border text-xs font-semibold ${isDark ? 'border-gray-600 text-gray-300 hover:bg-gray-700' : 'border-gray-200 text-gray-600 hover:bg-gray-50'}`}>Cancel</button>
              <button onClick={() => handleDelete(deleteId)} className="flex-1 py-2 rounded-lg bg-red-600 text-white text-xs font-semibold hover:bg-red-700">Delete</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
