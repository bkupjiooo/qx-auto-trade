import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, Lock, Eye, EyeOff, Loader2, ArrowLeft, User, Hash, Info } from 'lucide-react';
import { useAuth } from '../AuthContext';
import { api } from '../api';

export default function AuthPage() {
  const [activeTab, setActiveTab] = useState('signin');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [demoOtp, setDemoOtp] = useState('');
  const navigate = useNavigate();
  const { loginUser } = useAuth();

  const [signinForm, setSigninForm] = useState({ email: '', password: '' });
  const [signupForm, setSignupForm] = useState({ name: '', email: '', password: '', referralCode: '', otp: '' });

  const handleSignIn = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const result = await api.login({ email: signinForm.email, password: signinForm.password });
      loginUser(result.user, result.token);
      navigate('/dashboard');
    } catch (err) {
      setError(err.message || 'Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSendOtp = async () => {
    setError('');
    setLoading(true);
    try {
      const result = await api.sendOtp({ email: signupForm.email, name: signupForm.name, password: signupForm.password, referralUid: signupForm.referralCode || undefined });
      setOtpSent(true);
      if (result.demoOtp) setDemoOtp(result.demoOtp);
    } catch (err) {
      setError(err.message || 'Failed to send verification code.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyAndSignup = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const result = await api.verifyOtp({ name: signupForm.name, email: signupForm.email, password: signupForm.password, referralUid: signupForm.referralCode || undefined, otp: signupForm.otp });
      loginUser(result.user, result.token);
      navigate('/dashboard');
    } catch (err) {
      setError(err.message || 'Verification failed. Use OTP: 123456');
    } finally {
      setLoading(false);
    }
  };

  const handleEditDetails = () => {
    setOtpSent(false);
    setDemoOtp('');
    setError('');
    setSignupForm((prev) => ({ ...prev, otp: '' }));
  };

  const inputClasses = 'w-full bg-dark-700 border border-white/10 rounded-lg px-4 py-3 pl-11 text-white placeholder-gray-500 outline-none transition-all duration-200 focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-500';

  return (
    <div className="relative min-h-screen bg-dark-900 flex items-center justify-center overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/5 via-transparent to-purple-500/5" />
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-cyan-500/5 rounded-full blur-[120px]" />

      <Link to="/" className="absolute top-6 left-6 flex items-center gap-2 text-gray-400 hover:text-cyan-400 transition-colors duration-200 z-10">
        <ArrowLeft className="w-4 h-4" />
        <span className="text-sm font-medium">Back to Home</span>
      </Link>

      <div className="relative z-10 w-full max-w-md mx-4 glass-card rounded-2xl p-8">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold tracking-wide">
            <span className="text-cyan-400">QX</span>{' '}
            <span className="text-white">AUTO TRADE</span>
          </h1>
          <p className="text-gray-500 text-sm mt-1">
            {activeTab === 'signin' ? 'Welcome back' : 'Create your account'}
          </p>
        </div>

        <div className="flex mb-8 bg-dark-800 rounded-lg p-1">
          <button onClick={() => { setActiveTab('signin'); setError(''); setOtpSent(false); setDemoOtp(''); }}
            className={`flex-1 py-2.5 text-sm font-semibold rounded-md transition-all duration-200 ${activeTab === 'signin' ? 'bg-dark-700 text-cyan-400 shadow-sm border border-white/10' : 'text-gray-400 hover:text-gray-300'}`}>
            Sign In
          </button>
          <button onClick={() => { setActiveTab('signup'); setError(''); setOtpSent(false); setDemoOtp(''); }}
            className={`flex-1 py-2.5 text-sm font-semibold rounded-md transition-all duration-200 ${activeTab === 'signup' ? 'bg-dark-700 text-cyan-400 shadow-sm border border-white/10' : 'text-gray-400 hover:text-gray-300'}`}>
            Sign Up
          </button>
        </div>

        {error && (
          <div className="mb-4 px-4 py-3 rounded-lg border border-red-500/30 bg-red-500/10 text-red-400 text-sm">{error}</div>
        )}

        {activeTab === 'signin' && (
          <form onSubmit={handleSignIn} className="space-y-5">
            <div className="relative">
              <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-cyan-400" />
              <input type="email" placeholder="Email address" value={signinForm.email} onChange={(e) => setSigninForm({ ...signinForm, email: e.target.value })} required className={inputClasses} />
            </div>
            <div className="relative">
              <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-cyan-400" />
              <input type={showPassword ? 'text' : 'password'} placeholder="Password" value={signinForm.password} onChange={(e) => setSigninForm({ ...signinForm, password: e.target.value })} required className={`${inputClasses} pr-11`} />
              <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-500 hover:text-cyan-400 transition-colors">
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            <button type="submit" disabled={loading}
              className="w-full bg-cyan-500 hover:bg-cyan-400 text-dark-900 font-bold py-3 rounded-lg transition-all duration-200 flex items-center justify-center gap-2 shadow-glow disabled:opacity-50 disabled:cursor-not-allowed">
              {loading ? <><Loader2 className="w-4 h-4 animate-spin" /> Signing In...</> : 'Sign In'}
            </button>
          </form>
        )}

        {activeTab === 'signup' && !otpSent && (
          <div className="space-y-5">
            <div className="relative">
              <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-cyan-400" />
              <input type="text" placeholder="Full name" value={signupForm.name} onChange={(e) => setSignupForm({ ...signupForm, name: e.target.value })} required className={inputClasses} />
            </div>
            <div className="relative">
              <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-cyan-400" />
              <input type="email" placeholder="Email address" value={signupForm.email} onChange={(e) => setSignupForm({ ...signupForm, email: e.target.value })} required className={inputClasses} />
            </div>
            <div className="relative">
              <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-cyan-400" />
              <input type={showPassword ? 'text' : 'password'} placeholder="Password" value={signupForm.password} onChange={(e) => setSignupForm({ ...signupForm, password: e.target.value })} required className={`${inputClasses} pr-11`} />
              <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-500 hover:text-cyan-400 transition-colors">
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            <div className="relative">
              <Hash className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-cyan-400" />
              <input type="text" placeholder="Referral code (optional)" value={signupForm.referralCode} onChange={(e) => setSignupForm({ ...signupForm, referralCode: e.target.value })} className={inputClasses} />
            </div>
            <button onClick={handleSendOtp} disabled={loading}
              className="w-full bg-cyan-500 hover:bg-cyan-400 text-dark-900 font-bold py-3 rounded-lg transition-all duration-200 flex items-center justify-center gap-2 shadow-glow disabled:opacity-50 disabled:cursor-not-allowed">
              {loading ? <><Loader2 className="w-4 h-4 animate-spin" /> Sending Code...</> : 'Send Verification Code'}
            </button>
          </div>
        )}

        {activeTab === 'signup' && otpSent && (
          <form onSubmit={handleVerifyAndSignup} className="space-y-5">
            <p className="text-gray-400 text-sm text-center">
              A verification code has been sent to{' '}
              <span className="text-cyan-400 font-medium">{signupForm.email}</span>
            </p>

            {demoOtp && (
              <div className="flex items-center gap-2 px-4 py-3 rounded-lg border border-cyan-500/30 bg-cyan-500/10 text-cyan-400 text-sm">
                <Info className="w-4 h-4 shrink-0" />
                <span>Your OTP: <strong className="text-cyan-300">{demoOtp}</strong></span>
              </div>
            )}

            <div className="relative">
              <Hash className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-cyan-400" />
              <input type="text" placeholder="Enter 6-digit code (try 123456)" value={signupForm.otp} onChange={(e) => setSignupForm({ ...signupForm, otp: e.target.value })} required className={inputClasses} maxLength={6} />
            </div>
            <button type="submit" disabled={loading}
              className="w-full bg-cyan-500 hover:bg-cyan-400 text-dark-900 font-bold py-3 rounded-lg transition-all duration-200 flex items-center justify-center gap-2 shadow-glow disabled:opacity-50 disabled:cursor-not-allowed">
              {loading ? <><Loader2 className="w-4 h-4 animate-spin" /> Verifying...</> : 'Verify & Create Account'}
            </button>
            <button type="button" onClick={handleEditDetails} className="w-full text-center text-sm text-gray-400 hover:text-cyan-400 transition-colors py-1">
              Edit details
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
