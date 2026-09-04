import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '../../AuthContext'
import { useTheme } from '../../ThemeContext'
import { useToast } from '../../components/Toast'
import { api } from '../../api'
import {
  User,
  Lock,
  Bell,
  Shield,
  LogOut,
  Eye,
  EyeOff,
  Save,
  Check,
} from 'lucide-react'

export default function Settings() {
  const { user } = useAuth()
  const { theme } = useTheme()
  const { toast } = useToast()
  const isDark = theme === 'dark'
  const userId = user?.id

  const [activeTab, setActiveTab] = useState('account')
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [successMsg, setSuccessMsg] = useState('')

  const [passwordForm, setPasswordForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' })
  const [showPasswords, setShowPasswords] = useState({ current: false, new: false })
  const [passwordLoading, setPasswordLoading] = useState(false)

  const [notifications, setNotifications] = useState({ email: true, push: true, tradeAlerts: true, weeklyReport: false })
  const [notifLoading, setNotifLoading] = useState(false)

  const [security, setSecurity] = useState({ twoFactorEnabled: false })
  const [secLoading, setSecLoading] = useState(false)

  const fetchData = useCallback(async () => {
    if (!userId) return
    try {
      const [profileData, notifData, secData] = await Promise.all([
        api.getUserProfile(userId).catch(() => null),
        api.getUserNotifications(userId).catch(() => null),
        api.getUserSecurity(userId).catch(() => null),
      ])
      if (profileData) setProfile(profileData)
      if (notifData?.notifications) setNotifications((p) => ({ ...p, ...notifData.notifications }))
      if (notifData?.email !== undefined) setNotifications((p) => ({ ...p, email: notifData.email, push: notifData.push ?? p.push }))
      if (secData) setSecurity((p) => ({ ...p, ...secData }))
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

  const handleProfileSave = async (e) => {
    e.preventDefault()
    setSaving(true)
    try {
      await api.updateUserProfile({ userId, name: profile.name, email: profile.email })
      toast('Profile updated successfully', 'success')
    } catch { /* noop */ }
    setSaving(false)
  }

  const handlePasswordChange = async (e) => {
    e.preventDefault()
    if (passwordForm.newPassword !== passwordForm.confirmPassword) return
    setPasswordLoading(true)
    try {
      await api.changePassword({ userId, currentPassword: passwordForm.currentPassword, newPassword: passwordForm.newPassword })
      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' })
      toast('Password changed successfully', 'success')
    } catch { /* noop */ }
    setPasswordLoading(false)
  }

  const handleNotifToggle = async (key) => {
    const updated = { ...notifications, [key]: !notifications[key] }
    setNotifications(updated)
    setNotifLoading(true)
    try {
      await api.updateUserNotifications({ userId, ...updated })
      toast('Notification settings updated', 'success')
    } catch { /* noop */ }
    setNotifLoading(false)
  }

  const handle2FAToggle = async () => {
    setSecLoading(true)
    try {
      await api.toggle2FA({ userId, enabled: !security.twoFactorEnabled })
      setSecurity((p) => ({ ...p, twoFactorEnabled: !p.twoFactorEnabled }))
      toast(security.twoFactorEnabled ? '2FA disabled' : '2FA enabled', 'success')
    } catch { /* noop */ }
    setSecLoading(false)
  }

  const handleLogoutSessions = async () => {
    try {
      await api.logoutOtherSessions({ userId })
      toast('Other sessions logged out', 'success')
    } catch { /* noop */ }
  }

  const tabs = [
    { id: 'account', label: 'Account', icon: User },
    { id: 'password', label: 'Password', icon: Lock },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'security', label: 'Security', icon: Shield },
  ]

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
      <div>
        <h1 className={`text-2xl font-bold tracking-tight ${isDark ? 'text-gray-100' : 'text-gray-900'}`}>
          Settings
        </h1>
        <p className={`text-sm mt-1 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
          Manage your account preferences
        </p>
      </div>

      {/* Success Toast */}
      {successMsg && (
        <div className={`flex items-center gap-2 px-4 py-3 rounded-xl text-sm font-semibold ${isDark ? 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-400' : 'bg-emerald-50 border border-emerald-200 text-emerald-700'}`}>
          <Check className="w-4 h-4 shrink-0" />
          {successMsg}
        </div>
      )}

      {/* Tabs */}
      <div className={`flex gap-1 p-1 rounded-2xl ${isDark ? 'bg-gray-800' : 'bg-gray-100/80'}`}>
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all ${
              activeTab === tab.id
                ? 'bg-gradient-to-r from-blue-500 to-indigo-500 text-white shadow-lg shadow-blue-500/20'
                : isDark
                  ? 'text-gray-400 hover:text-gray-200 hover:bg-gray-700'
                  : 'text-gray-500 hover:text-gray-700 hover:bg-white'
            }`}
          >
            <tab.icon className="w-4 h-4" />
            <span className="hidden sm:inline">{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Account Tab */}
      {activeTab === 'account' && (
        <div className={`rounded-2xl border overflow-hidden ${isDark ? 'bg-gray-800 border-gray-700/50' : 'bg-white border-gray-200 shadow-sm'}`}>
          <div className={`px-6 py-4 border-b flex items-center gap-2.5 ${isDark ? 'border-gray-700/50' : 'border-gray-200'}`}>
            <User className="w-4 h-4 text-blue-500" />
            <h2 className={`text-sm font-semibold ${isDark ? 'text-gray-100' : 'text-gray-900'}`}>Account Information</h2>
          </div>
          <form onSubmit={handleProfileSave} className="p-6 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className={`block text-sm font-semibold mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>Name</label>
                <input
                  type="text"
                  value={profile?.name || ''}
                  onChange={(e) => setProfile((p) => ({ ...p, name: e.target.value }))}
                  className={`w-full px-4 py-2.5 rounded-xl border text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all ${
                    isDark
                      ? 'bg-gray-700 border-gray-600 text-gray-100'
                      : 'border-gray-200 text-gray-900'
                  }`}
                />
              </div>
              <div>
                <label className={`block text-sm font-semibold mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>Email</label>
                <input
                  type="email"
                  value={profile?.email || ''}
                  onChange={(e) => setProfile((p) => ({ ...p, email: e.target.value }))}
                  className={`w-full px-4 py-2.5 rounded-xl border text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all ${
                    isDark
                      ? 'bg-gray-700 border-gray-600 text-gray-100'
                      : 'border-gray-200 text-gray-900'
                  }`}
                />
              </div>
            </div>
            <div className="flex justify-end">
              <button
                type="submit"
                disabled={saving}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-blue-500 to-indigo-500 text-white text-sm font-semibold hover:from-blue-600 hover:to-indigo-600 transition-all shadow-lg shadow-blue-500/20 disabled:opacity-50"
              >
                <Save className="w-4 h-4" />
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Password Tab */}
      {activeTab === 'password' && (
        <div className={`rounded-2xl border overflow-hidden ${isDark ? 'bg-gray-800 border-gray-700/50' : 'bg-white border-gray-200 shadow-sm'}`}>
          <div className={`px-6 py-4 border-b flex items-center gap-2.5 ${isDark ? 'border-gray-700/50' : 'border-gray-200'}`}>
            <Lock className="w-4 h-4 text-amber-500" />
            <h2 className={`text-sm font-semibold ${isDark ? 'text-gray-100' : 'text-gray-900'}`}>Change Password</h2>
          </div>
          <form onSubmit={handlePasswordChange} className="p-6 space-y-4">
            <div>
              <label className={`block text-sm font-semibold mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>Current Password</label>
              <div className="relative">
                <input
                  type={showPasswords.current ? 'text' : 'password'}
                  required
                  value={passwordForm.currentPassword}
                  onChange={(e) => setPasswordForm((p) => ({ ...p, currentPassword: e.target.value }))}
                  className={`w-full px-4 py-2.5 pr-11 rounded-xl border text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all ${
                    isDark
                      ? 'bg-gray-700 border-gray-600 text-gray-100'
                      : 'border-gray-200 text-gray-900'
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setShowPasswords((p) => ({ ...p, current: !p.current }))}
                  className={`absolute right-3 top-1/2 -translate-y-1/2 ${isDark ? 'text-gray-500 hover:text-gray-300' : 'text-gray-400 hover:text-gray-600'}`}
                >
                  {showPasswords.current ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className={`block text-sm font-semibold mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>New Password</label>
                <div className="relative">
                  <input
                    type={showPasswords.new ? 'text' : 'password'}
                    required
                    value={passwordForm.newPassword}
                    onChange={(e) => setPasswordForm((p) => ({ ...p, newPassword: e.target.value }))}
                    className={`w-full px-4 py-2.5 pr-11 rounded-xl border text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all ${
                      isDark
                        ? 'bg-gray-700 border-gray-600 text-gray-100'
                        : 'border-gray-200 text-gray-900'
                    }`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPasswords((p) => ({ ...p, new: !p.new }))}
                    className={`absolute right-3 top-1/2 -translate-y-1/2 ${isDark ? 'text-gray-500 hover:text-gray-300' : 'text-gray-400 hover:text-gray-600'}`}
                  >
                    {showPasswords.new ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
              <div>
                <label className={`block text-sm font-semibold mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>Confirm New Password</label>
                <input
                  type="password"
                  required
                  value={passwordForm.confirmPassword}
                  onChange={(e) => setPasswordForm((p) => ({ ...p, confirmPassword: e.target.value }))}
                  className={`w-full px-4 py-2.5 rounded-xl border text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all ${
                    isDark
                      ? 'bg-gray-700 border-gray-600 text-gray-100'
                      : 'border-gray-200 text-gray-900'
                  }`}
                />
              </div>
            </div>
            <div className="flex justify-end">
              <button
                type="submit"
                disabled={passwordLoading}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-gray-700 to-gray-800 dark:from-gray-600 dark:to-gray-700 text-white text-sm font-semibold hover:from-gray-800 hover:to-gray-900 transition-all shadow-lg disabled:opacity-50"
              >
                <Lock className="w-4 h-4" />
                {passwordLoading ? 'Updating...' : 'Update Password'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Notifications Tab */}
      {activeTab === 'notifications' && (
        <div className={`rounded-2xl border overflow-hidden ${isDark ? 'bg-gray-800 border-gray-700/50' : 'bg-white border-gray-200 shadow-sm'}`}>
          <div className={`px-6 py-4 border-b flex items-center gap-2.5 ${isDark ? 'border-gray-700/50' : 'border-gray-200'}`}>
            <Bell className="w-4 h-4 text-purple-500" />
            <h2 className={`text-sm font-semibold ${isDark ? 'text-gray-100' : 'text-gray-900'}`}>Notification Preferences</h2>
          </div>
          <div className="p-6 space-y-1">
            {[
              { key: 'email', label: 'Email Notifications', desc: 'Receive trade updates via email' },
              { key: 'push', label: 'Push Notifications', desc: 'Browser push notifications' },
              { key: 'tradeAlerts', label: 'Trade Alerts', desc: 'Real-time trade execution alerts' },
              { key: 'weeklyReport', label: 'Weekly Report', desc: 'Weekly performance summary email' },
            ].map((item) => (
              <div
                key={item.key}
                className={`flex items-center justify-between py-4 ${item.key !== 'weeklyReport' ? `border-b ${isDark ? 'border-gray-700/50' : 'border-gray-100'}` : ''}`}
              >
                <div>
                  <p className={`text-sm font-semibold ${isDark ? 'text-gray-100' : 'text-gray-900'}`}>{item.label}</p>
                  <p className={`text-xs mt-0.5 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>{item.desc}</p>
                </div>
                <button
                  onClick={() => handleNotifToggle(item.key)}
                  disabled={notifLoading}
                  className={`relative w-11 h-6 rounded-full transition-colors ${
                    notifications[item.key] ? 'bg-gradient-to-r from-blue-500 to-indigo-500' : isDark ? 'bg-gray-600' : 'bg-gray-200'
                  }`}
                >
                  <span
                    className={`absolute top-[3px] w-[18px] h-[18px] rounded-full bg-white shadow-sm transition-transform ${
                      notifications[item.key] ? 'translate-x-[22px]' : 'translate-x-[3px]'
                    }`}
                  />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Security Tab */}
      {activeTab === 'security' && (
        <div className={`rounded-2xl border overflow-hidden ${isDark ? 'bg-gray-800 border-gray-700/50' : 'bg-white border-gray-200 shadow-sm'}`}>
          <div className={`px-6 py-4 border-b flex items-center gap-2.5 ${isDark ? 'border-gray-700/50' : 'border-gray-200'}`}>
            <Shield className="w-4 h-4 text-emerald-500" />
            <h2 className={`text-sm font-semibold ${isDark ? 'text-gray-100' : 'text-gray-900'}`}>Security</h2>
          </div>
          <div className="p-6 space-y-1">
            <div className={`flex items-center justify-between py-4 border-b ${isDark ? 'border-gray-700/50' : 'border-gray-100'}`}>
              <div>
                <p className={`text-sm font-semibold ${isDark ? 'text-gray-100' : 'text-gray-900'}`}>Two-Factor Authentication</p>
                <p className={`text-xs mt-0.5 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Add an extra layer of security to your account</p>
              </div>
              <button
                onClick={handle2FAToggle}
                disabled={secLoading}
                className={`relative w-11 h-6 rounded-full transition-colors ${
                  security.twoFactorEnabled ? 'bg-gradient-to-r from-blue-500 to-indigo-500' : isDark ? 'bg-gray-600' : 'bg-gray-200'
                }`}
              >
                <span
                  className={`absolute top-[3px] w-[18px] h-[18px] rounded-full bg-white shadow-sm transition-transform ${
                    security.twoFactorEnabled ? 'translate-x-[22px]' : 'translate-x-[3px]'
                  }`}
                />
              </button>
            </div>
            <div className="py-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className={`text-sm font-semibold ${isDark ? 'text-gray-100' : 'text-gray-900'}`}>Session Management</p>
                  <p className={`text-xs mt-0.5 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Log out from all other devices</p>
                </div>
                <button
                  onClick={handleLogoutSessions}
                  className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border text-sm font-semibold transition-all ${
                    isDark
                      ? 'border-gray-600 text-gray-300 hover:bg-gray-700 hover:border-gray-500'
                      : 'border-gray-200 text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <LogOut className="w-4 h-4" />
                  Log Out Others
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
