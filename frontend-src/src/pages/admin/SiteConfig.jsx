import { useState, useEffect } from 'react'
import { api } from '../../api'
import { Settings, Save, Loader2, X, Check } from 'lucide-react'
import { useTheme } from '../../ThemeContext'

export default function AdminSiteConfig() {
  const [config, setConfig] = useState({})
  const [saved, setSaved] = useState({})
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [toast, setToast] = useState(null)
  const { theme } = useTheme()
  const isDark = theme === 'dark'

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type })
    setTimeout(() => setToast(null), 3000)
  }

  useEffect(() => {
    let mounted = true
    api.getSiteConfig().then((data) => {
      if (mounted) {
        const cfg = data.siteConfig || data.config || data || {}
        setConfig(cfg)
        setSaved(cfg)
      }
    }).catch(() => {}).finally(() => { if (mounted) setLoading(false) })
    return () => { mounted = false }
  }, [])

  const handleChange = (key, value) => {
    setConfig((prev) => ({ ...prev, [key]: value }))
  }

  const handleSave = async (e) => {
    e.preventDefault()
    setSaving(true)
    try {
      await api.updateSiteConfig(config)
      setSaved({ ...config })
      showToast('Site configuration saved successfully! (Synced with App & Landing)')
    } catch {
      showToast('Failed to save configuration', 'error')
    } finally { setSaving(false) }
  }

  const isDirty = JSON.stringify(config) !== JSON.stringify(saved)

  const generalFields = [
    { key: 'siteName', label: 'Site Name', type: 'text' },
    { key: 'siteTagline', label: 'Tagline', type: 'text' },
    { key: 'supportEmail', label: 'Support Email', type: 'email' },
    { key: 'logoUrl', label: 'Logo URL', type: 'url' },
    { key: 'faviconUrl', label: 'Favicon URL', type: 'url' },
    { key: 'referralLink', label: 'Quotex Broker Referral Link', type: 'url' },
    { key: 'referralDepositAmount', label: 'Min Referral Deposit ($)', type: 'number' },
  ]

  const socialFields = [
    { key: 'telegramLink', label: 'Telegram Community Channel Link', type: 'url' },
    { key: 'telegramSupport', label: 'Telegram Support Link / Username', type: 'text' },
    { key: 'youtubeLink', label: 'YouTube Channel Link', type: 'url' },
    { key: 'instagramLink', label: 'Instagram Page Link', type: 'url' },
    { key: 'facebookLink', label: 'Facebook Page Link', type: 'url' },
    { key: 'whatsappLink', label: 'WhatsApp Link', type: 'url' },
    { key: 'twitterLink', label: 'Twitter / X Link', type: 'url' },
  ]

  const paymentFields = [
    { key: 'paymentUpi', label: 'UPI ID (For Indian Users & QR)', type: 'text' },
    { key: 'paymentUsdt', label: 'USDT Address (TRC20 / ERC20)', type: 'text' },
    { key: 'paymentBank', label: 'Bank Details (Name, A/C, IFSC)', type: 'text' },
    { key: 'btcAddress', label: 'BTC Payment Address', type: 'text' },
    { key: 'ethAddress', label: 'ETH Payment Address', type: 'text' },
  ]

  const otherFields = [
    { key: 'footerText', label: 'Footer Copyright / Text', type: 'text' },
  ]

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className={`w-5 h-5 animate-spin ${isDark ? 'text-gray-500' : 'text-gray-400'}`} />
      </div>
    )
  }

  return (
    <div className="space-y-4 max-w-3xl">
      {toast && (
        <div className={`fixed top-4 right-4 z-50 px-4 py-2.5 rounded-lg text-sm font-semibold shadow-lg ${toast.type === 'error' ? 'bg-red-600 text-white' : 'bg-emerald-600 text-white'}`}>
          {toast.msg}
        </div>
      )}

      <div className="flex items-center justify-between">
        <div>
          <h1 className={`text-lg font-bold ${isDark ? 'text-gray-100' : 'text-gray-900'}`}>Site Configuration</h1>
          <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Manage site-wide settings, payment details (UPI, USDT), links, and branding across App &amp; Web</p>
        </div>
        {isDirty && <span className={`text-xs font-semibold px-2 py-1 rounded ${isDark ? 'text-amber-400 bg-amber-500/10' : 'text-amber-600 bg-amber-50'}`}>Unsaved changes</span>}
      </div>

      <form onSubmit={handleSave} className={`rounded-xl border p-5 space-y-4 ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
        <Section title="General &amp; Branding">
          {generalFields.map((f) => (
            <Field key={f.key} field={f} value={config[f.key] || ''} onChange={(v) => handleChange(f.key, v)} />
          ))}
        </Section>

        <Section title="Payment Details (Shown in App &amp; Web Subscriptions)">
          {paymentFields.map((f) => (
            <Field key={f.key} field={f} value={config[f.key] || ''} onChange={(v) => handleChange(f.key, v)} />
          ))}
        </Section>

        <Section title="Social &amp; Support Links">
          {socialFields.map((f) => (
            <Field key={f.key} field={f} value={config[f.key] || ''} onChange={(v) => handleChange(f.key, v)} />
          ))}
        </Section>

        <Section title="Other">
          {otherFields.map((f) => (
            <Field key={f.key} field={f} value={config[f.key] || ''} onChange={(v) => handleChange(f.key, v)} />
          ))}
        </Section>

        <div className={`pt-3 border-t ${isDark ? 'border-gray-700' : 'border-gray-100'}`}>
          <button type="submit" disabled={saving || !isDirty}
            className={`inline-flex items-center gap-2 px-5 py-2 bg-blue-600 hover:bg-blue-700 disabled:cursor-not-allowed text-white text-sm font-semibold rounded-lg transition-colors ${isDark ? 'disabled:bg-gray-600' : 'disabled:bg-gray-300'}`}>
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            {saving ? 'Saving...' : 'Save Configuration'}
          </button>
        </div>
      </form>
    </div>
  )
}

function Section({ title, children }) {
  const { theme } = useTheme()
  const isDark = theme === 'dark'
  return (
    <div>
      <p className={`text-xs uppercase tracking-wider font-semibold mb-2 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>{title}</p>
      <div className={`h-px mb-3 ${isDark ? 'bg-gray-700' : 'bg-gray-100'}`} />
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {children}
      </div>
    </div>
  )
}

function Field({ field, value, onChange }) {
  const { theme } = useTheme()
  const isDark = theme === 'dark'
  return (
    <div>
      <label className={`block text-xs font-semibold mb-1 ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>{field.label}</label>
      <input type={field.type} value={value} onChange={(e) => onChange(e.target.value)}
        placeholder={`Enter ${field.label.toLowerCase()}`}
        className={`w-full px-3 py-2 rounded-lg border text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-colors ${isDark ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' : 'bg-white border-gray-200 text-gray-900'}`} />
    </div>
  )
}
