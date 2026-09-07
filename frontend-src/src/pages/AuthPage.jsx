import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, Lock, Eye, EyeOff, Loader2, ArrowLeft, User, Hash, Info, CheckCircle } from 'lucide-react';
import { useAuth } from '../AuthContext';
import { api } from '../api';

export default function AuthPage() {
  const [activeTab, setActiveTab] = useState('signin'); // 'signin' | 'signup' | 'forgot'
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [demoOtp, setDemoOtp] = useState('');
  const [forgotStep, setForgotStep] = useState(1); // 1 = enter email, 2 = enter otp + new password
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotOtp, setForgotOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [forgotDemoOtp, setForgotDemoOtp] = useState('');

  const navigate = useNavigate();
  const { loginUser } = useAuth();

  const [signinForm, setSigninForm] = useState({ email: '', password: '' });
  const [signupForm, setSignupForm] = useState({ name: '', email: '', password: '', referralCode: '', otp: '' });

  const handleSignIn = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');
    setLoading(true);
    try {
      const result = await api.login({ email: signinForm.email, password: signinForm.password });
      loginUser(result.user, result.token);
      navigate('/dashboard');
    } catch (err) {
      setError(err.message || 'Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleSendOtp = async () => {
    setError('');
    setSuccessMsg('');
    setLoading(true);
    try {
      const result = await api.sendOtp({ email: signupForm.email, name: signupForm.name, password: signupForm.password, referralUid: signupForm.referralCode || undefined });
      setOtpSent(true);
      if (result.demoOtp) {
        setDemoOtp(result.demoOtp);
        setSignupForm((prev) => ({ ...prev, otp: result.demoOtp }));
      }
    } catch (err) {
      setError(err.message || 'Failed to send verification code.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyAndSignup = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');
    setLoading(true);
    try {
      const result = await api.verifyOtp({ name: signupForm.name, email: signupForm.email, password: signupForm.password, referralUid: signupForm.referralCode || undefined, otp: signupForm.otp });
      loginUser(result.user, result.token);
      navigate('/dashboard');
    } catch (err) {
      setError(err.message || 'Verification failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSendForgotOtp = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');
    setLoading(true);
    try {
      const result = await api.forgotPassword({ email: forgotEmail });
      setForgotStep(2);
      if (result.demoOtp) {
        setForgotDemoOtp(result.demoOtp);
        setForgotOtp(result.demoOtp);
      }
      setSuccessMsg(`Reset code sent to ${forgotEmail}`);
    } catch (err) {
      setError(err.message || 'No account found with this email.');
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');
    setLoading(true);
    try {
      await api.resetPassword({ email: forgotEmail, otp: forgotOtp, newPassword });
      setSuccessMsg('Password updated successfully! You can now log in.');
      setActiveTab('signin');
      setSigninForm((prev) => ({ ...prev, email: forgotEmail, password: newPassword }));
    } catch (err) {
      setError(err.message || 'Failed to reset password. Please check your OTP code.');
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
            {activeTab === 'signin' ? 'Welcome back' : activeTab === 'signup' ? 'Create your account' : 'Reset your password'}
          </p>
        </div>

        {activeTab !== 'forgot' && (
          <div className="flex mb-8 bg-dark-800 rounded-lg p-1">
            <button onClick={() => { setActiveTab('signin'); setError(''); setSuccessMsg(''); setOtpSent(false); setDemoOtp(''); }}
              className={`flex-1 py-2.5 text-sm font-semibold rounded-md transition-all duration-200 ${activeTab === 'signin' ? 'bg-dark-700 text-cyan-400 shadow-sm border border-white/10' : 'text-gray-400 hover:text-gray-300'}`}>
              Sign In
            </button>
            <button onClick={() => { setActiveTab('signup'); setError(''); setSuccessMsg(''); setOtpSent(false); setDemoOtp(''); }}
              className={`flex-1 py-2.5 text-sm font-semibold rounded-md transition-all duration-200 ${activeTab === 'signup' ? 'bg-dark-700 text-cyan-400 shadow-sm border border-white/10' : 'text-gray-400 hover:text-gray-300'}`}>
              Sign Up
            </button>
          </div>
        )}

        {error && (
          <div className="mb-4 px-4 py-3 rounded-lg border border-red-500/30 bg-red-500/10 text-red-400 text-sm">{error}</div>
        )}

        {successMsg && (
          <div className="mb-4 px-4 py-3 rounded-lg border border-emerald-500/30 bg-emerald-500/10 text-emerald-400 text-sm flex items-center gap-2">
            <CheckCircle className="w-4 h-4 shrink-0" />
            <span>{successMsg}</span>
          </div>
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
            <div className="flex justify-end">
              <button
                type="button"
                onClick={() => { setActiveTab('forgot'); setForgotStep(1); setError(''); setSuccessMsg(''); setForgotEmail(signinForm.email); }}
                className="text-xs text-cyan-400 hover:text-cyan-300 transition-colors"
              >
                Forgot password?
              </button>
            </div>
            <button type="submit" disabled={loading}
              className="w-full bg-cyan-500 hover:bg-cyan-400 text-dark-900 font-bold py-3 rounded-lg transition-all duration-200 flex items-center justify-center gap-2 shadow-glow disabled:opacity-50 disabled:cursor-not-allowed">
              {loading ? <><Loader2 className="w-4 h-4 animate-spin" /> Signing In...</> : 'Sign In'}
            </button>
          </form>
        )}

        {activeTab === 'forgot' && forgotStep === 1 && (
          <form onSubmit={handleSendForgotOtp} className="space-y-5">
            <p className="text-gray-400 text-sm text-center">
              Enter your registered email address to receive a 6-digit password reset code.
            </p>
            <div className="relative">
              <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-cyan-400" />
              <input type="email" placeholder="Registered email" value={forgotEmail} onChange={(e) => setForgotEmail(e.target.value)} required className={inputClasses} />
            </div>
            <button type="submit" disabled={loading}
              className="w-full bg-cyan-500 hover:bg-cyan-400 text-dark-900 font-bold py-3 rounded-lg transition-all duration-200 flex items-center justify-center gap-2 shadow-glow disabled:opacity-50 disabled:cursor-not-allowed">
              {loading ? <><Loader2 className="w-4 h-4 animate-spin" /> Sending Code...</> : 'Send Reset Code'}
            </button>
            <button type="button" onClick={() => { setActiveTab('signin'); setError(''); }} className="w-full text-center text-sm text-gray-400 hover:text-cyan-400 transition-colors py-1">
              Back to Sign In
            </button>
          </form>
        )}

        {activeTab === 'forgot' && forgotStep === 2 && (
          <form onSubmit={handleResetPassword} className="space-y-5">
            <p className="text-gray-400 text-sm text-center">
              Enter the reset code sent to <span className="text-cyan-400 font-medium">{forgotEmail}</span>
            </p>

            {forgotDemoOtp && (
              <div className="flex items-center justify-between px-4 py-3 rounded-lg border border-cyan-500/30 bg-cyan-500/10 text-cyan-400 text-sm">
                <div className="flex items-center gap-2">
                  <Info className="w-4 h-4 shrink-0" />
                  <span>Reset OTP: <strong className="text-cyan-300 font-mono tracking-wider">{forgotDemoOtp}</strong></span>
                </div>
                <button
                  type="button"
                  onClick={() => setForgotOtp(forgotDemoOtp)}
                  className="text-xs bg-cyan-500/20 hover:bg-cyan-500/30 px-2.5 py-1 rounded text-cyan-300 font-medium transition-colors"
                >
                  Fill Code
                </button>
              </div>
            )}

            <div className="relative">
              <Hash className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-cyan-400" />
              <input type="text" placeholder="Enter 6-digit code" value={forgotOtp} onChange={(e) => setForgotOtp(e.target.value)} required className={inputClasses} maxLength={6} />
            </div>

            <div className="relative">
              <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-cyan-400" />
              <input type={showPassword ? 'text' : 'password'} placeholder="New password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} required minLength={6} className={`${inputClasses} pr-11`} />
              <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-500 hover:text-cyan-400 transition-colors">
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>

            <button type="submit" disabled={loading}
              className="w-full bg-cyan-500 hover:bg-cyan-400 text-dark-900 font-bold py-3 rounded-lg transition-all duration-200 flex items-center justify-center gap-2 shadow-glow disabled:opacity-50 disabled:cursor-not-allowed">
              {loading ? <><Loader2 className="w-4 h-4 animate-spin" /> Updating Password...</> : 'Reset Password & Sign In'}
            </button>
            <button type="button" onClick={() => { setForgotStep(1); setError(''); }} className="w-full text-center text-sm text-gray-400 hover:text-cyan-400 transition-colors py-1">
              Change Email
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
              <div className="flex items-center justify-between px-4 py-3 rounded-lg border border-cyan-500/30 bg-cyan-500/10 text-cyan-400 text-sm">
                <div className="flex items-center gap-2">
                  <Info className="w-4 h-4 shrink-0" />
                  <span>Your OTP: <strong className="text-cyan-300 font-mono tracking-wider">{demoOtp}</strong></span>
                </div>
                <button
                  type="button"
                  onClick={() => setSignupForm((prev) => ({ ...prev, otp: demoOtp }))}
                  className="text-xs bg-cyan-500/20 hover:bg-cyan-500/30 px-2.5 py-1 rounded text-cyan-300 font-medium transition-colors"
                >
                  Fill Code
                </button>
              </div>
            )}

            <div className="relative">
              <Hash className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-cyan-400" />
              <input type="text" placeholder="Enter 6-digit code" value={signupForm.otp} onChange={(e) => setSignupForm({ ...signupForm, otp: e.target.value })} required className={inputClasses} maxLength={6} />
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
