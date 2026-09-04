import { useState, useEffect } from 'react'
import { api } from '../../api'
import { useAuth } from '../../AuthContext'
import { useTheme } from '../../ThemeContext'
import {
  Users, Radio, Wallet, TrendingUp, RefreshCw, Wrench,
  AlertTriangle, ArrowUpRight, Activity, Clock
} from 'lucide-react'

export default function AdminDashboard() {
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)
  const { admin } = useAuth()
  const { theme } = useTheme()
  const isDark = theme === 'dark'

  const fetchStats = async () => {
    try {
      const data = await api.getAdminStats()
      setStats(data)
    } catch (err) {
      console.error('Failed to fetch stats:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchStats()
  }, [])

  const statCards = [
    {
      label: 'Total Users',
      value: stats?.totalUsers ?? 0,
      icon: Users,
      color: isDark ? 'bg-blue-500/10 text-blue-400' : 'bg-blue-50 text-blue-600',
    },
    {
      label: 'Active Sessions',
      value: stats?.activeSessions ?? 0,
      icon: Radio,
      color: isDark ? 'bg-green-500/10 text-green-400' : 'bg-green-50 text-green-600',
    },
    {
      label: 'Pending Deposits',
      value: stats?.pendingDeposits ?? 0,
      icon: Wallet,
      color: isDark ? 'bg-amber-500/10 text-amber-400' : 'bg-amber-50 text-amber-600',
    },
    {
      label: 'Total Volume',
      value: `$${(stats?.totalVolume ?? 0).toLocaleString()}`,
      icon: TrendingUp,
      color: isDark ? 'bg-purple-500/10 text-purple-400' : 'bg-purple-50 text-purple-600',
    },
  ]

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className={`w-5 h-5 animate-spin ${isDark ? 'text-gray-500' : 'text-gray-400'}`} />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className={`text-2xl font-semibold ${isDark ? 'text-gray-100' : 'text-gray-900'}`}>Dashboard</h1>
        <p className={`text-sm mt-1 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Welcome back, {admin?.name || 'Admin'}</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((card) => (
          <div key={card.label} className={`${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} rounded-xl border p-5`}>
            <div className="flex items-center justify-between">
              <div>
                <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>{card.label}</p>
                <p className={`text-2xl font-semibold mt-1 ${isDark ? 'text-gray-100' : 'text-gray-900'}`}>{card.value}</p>
              </div>
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${card.color}`}>
                <card.icon className="w-5 h-5" />
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className={`${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} rounded-xl border p-5`}>
          <h2 className={`text-sm font-semibold mb-4 ${isDark ? 'text-gray-100' : 'text-gray-900'}`}>System Status</h2>
          <div className="space-y-3">
            <div className={`flex items-center justify-between py-2 border-b last:border-0 ${isDark ? 'border-gray-700' : 'border-gray-100'}`}>
              <div className="flex items-center gap-3">
                <Wrench className={`w-4 h-4 ${isDark ? 'text-gray-500' : 'text-gray-400'}`} />
                <span className={`text-sm ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>Maintenance Mode</span>
              </div>
              <span className={`text-xs font-medium px-2 py-1 rounded-full ${
                stats?.maintenanceMode
                  ? (isDark ? 'bg-amber-500/10 text-amber-400' : 'bg-amber-50 text-amber-700')
                  : (isDark ? 'bg-green-500/10 text-green-400' : 'bg-green-50 text-green-700')
              }`}>
                {stats?.maintenanceMode ? 'Active' : 'Inactive'}
              </span>
            </div>
            <div className={`flex items-center justify-between py-2 border-b last:border-0 ${isDark ? 'border-gray-700' : 'border-gray-100'}`}>
              <div className="flex items-center gap-3">
                <AlertTriangle className={`w-4 h-4 ${isDark ? 'text-gray-500' : 'text-gray-400'}`} />
                <span className={`text-sm ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>Emergency Stop</span>
              </div>
              <span className={`text-xs font-medium px-2 py-1 rounded-full ${
                stats?.emergencyStop
                  ? (isDark ? 'bg-red-500/10 text-red-400' : 'bg-red-50 text-red-700')
                  : (isDark ? 'bg-green-500/10 text-green-400' : 'bg-green-50 text-green-700')
              }`}>
                {stats?.emergencyStop ? 'Active' : 'Inactive'}
              </span>
            </div>
          </div>
        </div>

        <div className={`${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} rounded-xl border p-5`}>
          <h2 className={`text-sm font-semibold mb-4 ${isDark ? 'text-gray-100' : 'text-gray-900'}`}>Quick Actions</h2>
          <div className="grid grid-cols-2 gap-3">
            <a
              href="/admin/users"
              className={`flex items-center gap-2 px-3 py-2.5 rounded-lg border transition-colors ${isDark ? 'border-gray-700 hover:bg-gray-700 text-gray-300' : 'border-gray-200 hover:bg-gray-50 text-gray-700'}`}
            >
              <Users className={`w-4 h-4 ${isDark ? 'text-gray-500' : 'text-gray-400'}`} />
              Manage Users
            </a>
            <a
              href="/admin/live-sessions"
              className={`flex items-center gap-2 px-3 py-2.5 rounded-lg border transition-colors ${isDark ? 'border-gray-700 hover:bg-gray-700 text-gray-300' : 'border-gray-200 hover:bg-gray-50 text-gray-700'}`}
            >
              <Radio className={`w-4 h-4 ${isDark ? 'text-gray-500' : 'text-gray-400'}`} />
              Live Sessions
            </a>
            <a
              href="/admin/deposits"
              className={`flex items-center gap-2 px-3 py-2.5 rounded-lg border transition-colors ${isDark ? 'border-gray-700 hover:bg-gray-700 text-gray-300' : 'border-gray-200 hover:bg-gray-50 text-gray-700'}`}
            >
              <Wallet className={`w-4 h-4 ${isDark ? 'text-gray-500' : 'text-gray-400'}`} />
              Review Deposits
            </a>
            <a
              href="/admin/emergency"
              className={`flex items-center gap-2 px-3 py-2.5 rounded-lg border transition-colors ${isDark ? 'border-red-500/30 hover:bg-red-500/10 text-red-400' : 'border-red-200 hover:bg-red-50 text-red-700'}`}
            >
              <AlertTriangle className="w-4 h-4 text-red-400" />
              Emergency
            </a>
          </div>
        </div>
      </div>

      {stats?.recentActivity?.length > 0 && (
        <div className={`${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} rounded-xl border p-5`}>
          <h2 className={`text-sm font-semibold mb-4 ${isDark ? 'text-gray-100' : 'text-gray-900'}`}>Recent Activity</h2>
          <div className="space-y-3">
            {stats.recentActivity.map((item, i) => (
              <div key={i} className={`flex items-start gap-3 py-2 border-b last:border-0 ${isDark ? 'border-gray-800' : 'border-gray-50'}`}>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 ${isDark ? 'bg-gray-700' : 'bg-gray-100'}`}>
                  <Activity className={`w-3.5 h-3.5 ${isDark ? 'text-gray-400' : 'text-gray-500'}`} />
                </div>
                <div className="min-w-0 flex-1">
                  <p className={`text-sm truncate ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>{item.message || item.action}</p>
                  <div className="flex items-center gap-1 mt-0.5">
                    <Clock className={`w-3 h-3 ${isDark ? 'text-gray-500' : 'text-gray-400'}`} />
                    <span className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>{item.time || item.timestamp}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
