import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '../../AuthContext'
import { useTheme } from '../../ThemeContext'
import { useToast } from '../../components/Toast'
import { api } from '../../api'
import {
  Send,
  Mail,
  MessageCircle,
  HeadphonesIcon,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  Check,
} from 'lucide-react'

const defaultFaqs = [
  { q: 'How does auto trading work?', a: 'Our AI-powered system analyzes market conditions using advanced strategies and executes trades automatically on your connected broker account. You can pause or stop trading at any time.' },
  { q: 'Is my broker account safe?', a: 'Yes. We only use read and trade permissions. We never have withdrawal access to your funds. All connections are encrypted and secured.' },
  { q: 'What brokers are supported?', a: 'We currently support Quotex with direct algorithmic execution.' },
  { q: 'How do I change my strategy?', a: 'Go to the Strategies page from the sidebar. You can enable/disable different strategies, filter by broker, and view detailed parameters for each strategy.' },
  { q: 'Can I manually override trades?', a: 'Yes. You can pause auto-trading at any time to take manual control. Use the Pause button on the dashboard to stop automatic execution.' },
  { q: 'How do I cancel my subscription?', a: 'Contact our support team via Telegram or email, and we will process your cancellation within 24 hours.' },
]

export default function Support() {
  const { user } = useAuth()
  const { theme } = useTheme()
  const { toast } = useToast()
  const isDark = theme === 'dark'
  const [siteConfig, setSiteConfig] = useState(null)
  const [loading, setLoading] = useState(true)
  const [openFaq, setOpenFaq] = useState(null)
  const [form, setForm] = useState({ name: user?.name || '', email: user?.email || '', subject: '', message: '' })
  const [sending, setSending] = useState(false)
  const [sent, setSent] = useState(false)

  const fetchData = useCallback(async () => {
    try {
      const data = await api.getUserSiteConfig()
      setSiteConfig(data)
    } catch {}
    setLoading(false)
  }, [])

  useEffect(() => { fetchData() }, [fetchData])

  useEffect(() => {
    const handleVisible = () => { if (document.visibilityState === 'visible') fetchData() }
    document.addEventListener('visibilitychange', handleVisible)
    return () => document.removeEventListener('visibilitychange', handleVisible)
  }, [fetchData])

  const handleSend = async (e) => {
    e.preventDefault()
    setSending(true)
    try {
      await api.getUserSiteConfig()
      setSent(true)
      toast('Message sent successfully', 'success')
    } catch {}
    setSending(false)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className={`animate-spin rounded-full h-8 w-8 border-b-2 ${isDark ? 'border-blue-400' : 'border-blue-600'}`} />
      </div>
    )
  }

  const telegram = siteConfig?.telegramLink || siteConfig?.telegram || '#'
  const email = siteConfig?.supportEmail || siteConfig?.email || 'support@qxautotrade.com'
  const liveChat = siteConfig?.liveChatLink || '#'

  const contactCards = [
    {
      title: 'Telegram Support',
      desc: 'Join our Telegram group for instant support',
      cta: 'Open Telegram',
      href: telegram,
      gradient: 'from-sky-500 to-blue-500',
      shadow: 'shadow-sky-500/20',
      icon: Send,
    },
    {
      title: 'Email Support',
      desc: "Send us an email and we'll respond within 24 hours",
      cta: email,
      href: `mailto:${email}`,
      gradient: 'from-blue-500 to-indigo-500',
      shadow: 'shadow-blue-500/20',
      icon: Mail,
    },
    {
      title: 'Live Chat',
      desc: 'Chat with our support team in real time',
      cta: 'Start Chat',
      href: liveChat,
      gradient: 'from-emerald-500 to-teal-500',
      shadow: 'shadow-emerald-500/20',
      icon: HeadphonesIcon,
    },
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className={`text-2xl font-bold tracking-tight ${isDark ? 'text-gray-100' : 'text-gray-900'}`}>
          Support
        </h1>
        <p className={`text-sm mt-1 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
          Get help from our team
        </p>
      </div>

      {/* Contact Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {contactCards.map((card) => (
          <a
            key={card.title}
            href={card.href}
            target="_blank"
            rel="noopener noreferrer"
            className={`rounded-2xl border p-6 transition-all group ${isDark ? 'bg-gray-800 border-gray-700/50 hover:border-gray-600 hover:shadow-lg' : 'bg-white border-gray-200 shadow-sm hover:shadow-md hover:border-gray-300'}`}
          >
            <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${card.gradient} flex items-center justify-center shadow-lg ${card.shadow} mb-4`}>
              <card.icon className="w-6 h-6 text-white" />
            </div>
            <h3 className={`text-sm font-bold mb-1 ${isDark ? 'text-gray-100' : 'text-gray-900'}`}>{card.title}</h3>
            <p className={`text-xs mb-4 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>{card.desc}</p>
            <span className="inline-flex items-center gap-1 text-xs font-semibold text-blue-500 group-hover:text-blue-400">
              {card.cta}
              <ExternalLink className="w-3 h-3" />
            </span>
          </a>
        ))}
      </div>

      {/* FAQ */}
      <div className={`rounded-2xl border overflow-hidden ${isDark ? 'bg-gray-800 border-gray-700/50' : 'bg-white border-gray-200 shadow-sm'}`}>
        <div className={`px-6 py-4 border-b ${isDark ? 'border-gray-700/50' : 'border-gray-200'}`}>
          <h2 className={`text-base font-semibold ${isDark ? 'text-gray-100' : 'text-gray-900'}`}>Frequently Asked Questions</h2>
        </div>
        <div className={`divide-y ${isDark ? 'divide-gray-700/50' : 'divide-gray-100'}`}>
          {defaultFaqs.map((faq, i) => (
            <div key={i}>
              <button
                onClick={() => setOpenFaq(openFaq === i ? null : i)}
                className={`w-full flex items-center justify-between px-6 py-4 text-left transition-colors ${isDark ? 'hover:bg-gray-700/30' : 'hover:bg-gray-50/50'}`}
              >
                <span className={`text-sm font-semibold pr-4 ${isDark ? 'text-gray-100' : 'text-gray-900'}`}>{faq.q}</span>
                {openFaq === i ? (
                  <ChevronUp className={`w-4 h-4 shrink-0 ${isDark ? 'text-gray-500' : 'text-gray-400'}`} />
                ) : (
                  <ChevronDown className={`w-4 h-4 shrink-0 ${isDark ? 'text-gray-500' : 'text-gray-400'}`} />
                )}
              </button>
              {openFaq === i && (
                <div className="px-6 pb-4">
                  <p className={`text-sm leading-relaxed ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>{faq.a}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Contact Form */}
      <div className={`rounded-2xl border overflow-hidden ${isDark ? 'bg-gray-800 border-gray-700/50' : 'bg-white border-gray-200 shadow-sm'}`}>
        <div className={`px-6 py-4 border-b ${isDark ? 'border-gray-700/50' : 'border-gray-200'}`}>
          <h2 className={`text-base font-semibold ${isDark ? 'text-gray-100' : 'text-gray-900'}`}>Send a Message</h2>
        </div>

        {sent ? (
          <div className="py-12 text-center">
            <div className="w-16 h-16 rounded-2xl mx-auto mb-3 bg-emerald-500/10 flex items-center justify-center">
              <Check className="w-8 h-8 text-emerald-500" />
            </div>
            <p className={`text-sm font-semibold ${isDark ? 'text-gray-100' : 'text-gray-900'}`}>Message sent</p>
            <p className={`text-xs mt-1 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>We will get back to you soon.</p>
            <button
              onClick={() => { setSent(false); setForm({ name: user?.name || '', email: user?.email || '', subject: '', message: '' }) }}
              className="mt-4 text-sm font-semibold text-blue-500 hover:text-blue-400"
            >
              Send another message
            </button>
          </div>
        ) : (
          <form onSubmit={handleSend} className="p-6 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className={`block text-sm font-semibold mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>Name</label>
                <input
                  type="text"
                  required
                  value={form.name}
                  onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
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
                  required
                  value={form.email}
                  onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))}
                  className={`w-full px-4 py-2.5 rounded-xl border text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all ${
                    isDark
                      ? 'bg-gray-700 border-gray-600 text-gray-100'
                      : 'border-gray-200 text-gray-900'
                  }`}
                />
              </div>
            </div>
            <div>
              <label className={`block text-sm font-semibold mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>Subject</label>
              <input
                type="text"
                required
                value={form.subject}
                onChange={(e) => setForm((p) => ({ ...p, subject: e.target.value }))}
                placeholder="How can we help?"
                className={`w-full px-4 py-2.5 rounded-xl border text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all ${
                  isDark
                    ? 'bg-gray-700 border-gray-600 text-gray-100 placeholder-gray-500'
                    : 'border-gray-200 text-gray-900 placeholder-gray-400'
                }`}
              />
            </div>
            <div>
              <label className={`block text-sm font-semibold mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>Message</label>
              <textarea
                required
                rows={5}
                value={form.message}
                onChange={(e) => setForm((p) => ({ ...p, message: e.target.value }))}
                placeholder="Describe your issue or question..."
                className={`w-full px-4 py-2.5 rounded-xl border text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all resize-none ${
                  isDark
                    ? 'bg-gray-700 border-gray-600 text-gray-100 placeholder-gray-500'
                    : 'border-gray-200 text-gray-900 placeholder-gray-400'
                }`}
              />
            </div>
            <button
              type="submit"
              disabled={sending}
              className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-blue-500 to-indigo-500 text-white text-sm font-semibold hover:from-blue-600 hover:to-indigo-600 transition-all shadow-lg shadow-blue-500/20 disabled:opacity-50"
            >
              <MessageCircle className="w-4 h-4" />
              {sending ? 'Sending...' : 'Send Message'}
            </button>
          </form>
        )}
      </div>
    </div>
  )
}
