import { useState, useEffect, useCallback } from 'react'
import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../../AuthContext'
import { useTheme } from '../../ThemeContext'
import { api } from '../../api'
import {
  LayoutDashboard,
  Brain,
  Settings,
  Clock,
  BarChart3,
  CreditCard,
  HeadphonesIcon,
  Bell,
  LogOut,
  Menu,
  X,
  Zap,
  Sun,
  Moon,
  AlertTriangle,
  AlertOctagon,
  Megaphone,
} from 'lucide-react'

const navItems = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/strategies', icon: Brain, label: 'Strategies' },
  { to: '/settings', icon: Settings, label: 'Settings' },
  { to: '/history', icon: Clock, label: 'History' },
  { to: '/performance', icon: BarChart3, label: 'Performance' },
  { to: '/subscriptions', icon: CreditCard, label: 'Subscription' },
  { to: '/support', icon: HeadphonesIcon, label: 'Support' },
]

export default function UserLayout() {
  const { user, logoutUser } = useAuth()
  const { theme, toggleTheme } = useTheme()
  const navigate = useNavigate()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [systemConfig, setSystemConfig] = useState(null)
  const [announcements, setAnnouncements] = useState([])
  const [dismissedAnns, setDismissedAnns] = useState(() => {
    try { return JSON.parse(sessionStorage.getItem('qx_dismissed_anns') || '[]') } catch { return [] }
  })
  const isDark = theme === 'dark'

  useEffect(() => {
    api.getTradingSession(user?.id).then((d) => { if (d?.systemConfig) setSystemConfig(d.systemConfig) }).catch(() => {})
    api.getUserAnnouncements().then((d) => { if (d?.announcements) setAnnouncements(d.announcements.filter((a) => a.isActive)) }).catch(() => {})
  }, [user?.id])

  useEffect(() => {
    const handleVisible = () => {
      if (document.visibilityState === 'visible') {
        api.getUserAnnouncements().then((d) => { if (d?.announcements) setAnnouncements(d.announcements.filter((a) => a.isActive)) }).catch(() => {})
      }
    }
    document.addEventListener('visibilitychange', handleVisible)
    return () => document.removeEventListener('visibilitychange', handleVisible)
  }, [])

  const dismissAnn = (id) => {
    const updated = [...dismissedAnns, id]
    setDismissedAnns(updated)
    sessionStorage.setItem('qx_dismissed_anns', JSON.stringify(updated))
  }

  const visibleAnns = announcements.filter((a) => !dismissedAnns.includes(a.id))

  const handleLogout = () => {
    logoutUser()
    window.location.href = '/'
  }

  return (
    <div className={`min-h-screen flex transition-colors duration-200 ${isDark ? 'bg-gray-900 text-gray-100' : 'bg-gray-50 text-gray-900'}`}>
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/30 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-50 w-56 flex flex-col transition-transform duration-200 ease-in-out lg:translate-x-0 lg:static lg:z-auto ${
          isDark ? 'bg-gray-800 border-r border-gray-700' : 'bg-white border-r border-border'
        } ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}
      >
        <div className={`flex items-center gap-2.5 px-5 h-16 shrink-0 ${isDark ? 'border-b border-gray-700' : 'border-b border-border'}`}>
          <div className="w-8 h-8 bg-primary-600 rounded-lg flex items-center justify-center">
            <Zap className="w-4.5 h-4.5 text-white" />
          </div>
          <span className={`text-[15px] font-semibold tracking-tight ${isDark ? 'text-gray-100' : 'text-gray-900'}`}>QX Auto Trade</span>
          <button
            onClick={() => setSidebarOpen(false)}
            className={`ml-auto p-1 rounded-md lg:hidden ${isDark ? 'hover:bg-gray-700' : 'hover:bg-gray-100'}`}
          >
            <X className={`w-5 h-5 ${isDark ? 'text-gray-400' : 'text-gray-500'}`} />
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto py-3 px-3">
          <ul className="space-y-0.5">
            {navItems.map((item) => (
              <li key={item.to}>
                <NavLink
                  to={item.to}
                  onClick={() => setSidebarOpen(false)}
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-3 py-2.5 rounded-lg text-[13.5px] font-medium transition-colors ${
                      isActive
                        ? isDark
                          ? 'bg-primary-600/20 text-primary-400'
                          : 'bg-primary-50 text-primary-700'
                        : isDark
                          ? 'text-gray-400 hover:bg-gray-700 hover:text-gray-200'
                          : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                    }`
                  }
                >
                  <item.icon className="w-[18px] h-[18px] shrink-0" />
                  {item.label}
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>

        <div className={`p-3 ${isDark ? 'border-t border-gray-700' : 'border-t border-border'}`}>
          <div className={`flex items-center gap-3 px-3 py-2.5 rounded-lg ${isDark ? 'bg-gray-700/50' : 'bg-gray-50'}`}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold shrink-0 ${isDark ? 'bg-primary-600/30 text-primary-300' : 'bg-primary-100 text-primary-700'}`}>
              {user?.name?.charAt(0)?.toUpperCase() || 'U'}
            </div>
            <div className="min-w-0 flex-1">
              <p className={`text-[13px] font-medium truncate ${isDark ? 'text-gray-200' : 'text-gray-900'}`}>{user?.name || 'User'}</p>
              <p className={`text-[11.5px] truncate ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>{user?.email || ''}</p>
            </div>
          </div>
        </div>
      </aside>

      <div className="flex-1 flex flex-col min-w-0">
        <header className={`sticky top-0 z-30 h-16 backdrop-blur-md flex items-center px-4 sm:px-6 gap-4 ${
          isDark ? 'bg-gray-800/80 border-b border-gray-700' : 'bg-white/80 border-b border-border'
        }`}>
          <button
            onClick={() => setSidebarOpen(true)}
            className={`p-2 -ml-2 rounded-lg lg:hidden ${isDark ? 'hover:bg-gray-700' : 'hover:bg-gray-100'}`}
          >
            <Menu className={`w-5 h-5 ${isDark ? 'text-gray-400' : 'text-gray-600'}`} />
          </button>

          <div className="flex-1" />

          <button
            onClick={toggleTheme}
            className={`p-2 rounded-lg transition-colors ${
              isDark ? 'hover:bg-gray-700 text-yellow-400' : 'hover:bg-gray-100 text-gray-500'
            }`}
            title={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
          >
            {isDark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
          </button>

          <button className={`relative p-2 rounded-lg transition-colors ${isDark ? 'hover:bg-gray-700' : 'hover:bg-gray-100'}`}>
            <Bell className={`w-5 h-5 ${isDark ? 'text-gray-400' : 'text-gray-500'}`} />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-danger rounded-full" />
          </button>

          <div className={`hidden sm:flex items-center gap-2.5 pl-4 ${isDark ? 'border-l border-gray-700' : 'border-l border-border'}`}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold ${isDark ? 'bg-primary-600/30 text-primary-300' : 'bg-primary-100 text-primary-700'}`}>
              {user?.name?.charAt(0)?.toUpperCase() || 'U'}
            </div>
            <span className={`text-[13.5px] font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>{user?.name || 'User'}</span>
          </div>

          <button
            onClick={handleLogout}
            className={`p-2 rounded-lg transition-colors ${isDark ? 'hover:bg-gray-700 text-gray-400 hover:text-red-400' : 'hover:bg-red-50 text-gray-400 hover:text-danger'}`}
            title="Logout"
          >
            <LogOut className="w-[18px] h-[18px]" />
          </button>
        </header>

        {/* Emergency Stop Banner */}
        {systemConfig?.globalEmergencyStop && (
          <div className="bg-red-600 text-white px-4 py-2.5 flex items-center gap-2 text-sm font-bold">
            <AlertOctagon className="w-4 h-4 shrink-0" />
            MASTER ADMIN GLOBAL EMERGENCY STOP IS ACTIVE - ALL TRADING HALTED
          </div>
        )}

        {/* Maintenance Mode Banner */}
        {systemConfig?.maintenanceMode && (
          <div className="bg-amber-500 text-white px-4 py-2.5 flex items-center gap-2 text-sm font-bold">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            SYSTEM SCHEDULED MAINTENANCE MODE IS ACTIVE - AUTOMATED TRADING TEMPORARILY PAUSED
          </div>
        )}

        {/* Announcement Banners */}
        {visibleAnns.map((ann) => (
          <div key={ann.id} className={`px-4 py-2.5 flex items-center gap-2 text-sm ${
            ann.type === 'WARNING' ? 'bg-amber-500/10 text-amber-600 border-b border-amber-200' :
            ann.type === 'SUCCESS' ? 'bg-emerald-500/10 text-emerald-600 border-b border-emerald-200' :
            'bg-blue-500/10 text-blue-600 border-b border-blue-200'
          }`}>
            <Megaphone className="w-4 h-4 shrink-0" />
            <span className="font-semibold">{ann.title}:</span>
            <span className="flex-1">{ann.content}</span>
            <button onClick={() => dismissAnn(ann.id)} className="ml-2 p-1 rounded hover:bg-black/5"><X className="w-3.5 h-3.5" /></button>
          </div>
        ))}

        <main className="flex-1 p-4 sm:p-5 lg:p-6 overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
